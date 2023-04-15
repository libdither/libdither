use std::{io::{Read, Write, self}, task::{Poll, Context}, pin::{pin, Pin}, error, fmt, sync::Arc};

use futures::{AsyncRead, ready, AsyncWrite};
use slice_ring_buffer::SliceRingBuffer;

use super::AsyncTransport;

trait EncryptionBuffer: AsRef<[u8]> + AsMut<[u8]> {
	fn create(capacity: usize) -> Self;
	fn fill(&mut self, reader: &mut impl Read) -> io::Result<usize>;
	fn empty(&mut self, writer: &mut impl Write) -> io::Result<usize>;
	fn consume(&mut self, amount: usize);
	fn poll_fill<R: AsyncRead + Unpin>(&mut self, reader: Pin<&mut R>, cx: &mut Context<'_>) -> Poll<io::Result<usize>>;
	fn poll_empty<W: AsyncWrite + Unpin>(&mut self, writer: Pin<&mut W>, cx: &mut Context<'_>) -> Poll<io::Result<usize>>;
}
impl EncryptionBuffer for SliceRingBuffer<u8> {
    fn create(capacity: usize) -> Self {
        SliceRingBuffer::with_capacity(capacity)
    }

    fn fill(&mut self, reader: &mut impl Read) -> io::Result<usize> {
        // Get potentially uninitialized slice to write `data` into.
        let buf_to_fill = unsafe { self.tail_head_slice() };
		
		// Read into uninit slice
		let bytes_filled = reader.read(buf_to_fill)?;

		// Move head based on # of bytes filled.
		unsafe { self.move_head_unchecked(bytes_filled) }
    }

    fn empty(&mut self, writer: &mut impl Write) -> io::Result<usize> {
        let written = writer.write(&self[..])?;
		self.truncate_back(written);
		Ok(written)
    }

	fn consume(&mut self, amount: usize) {
		self.truncate_back(amount);
	}

    fn poll_fill<R: AsyncRead + Unpin>(&mut self, reader: Pin<&mut R>, cx: &mut Context<'_>) -> Poll<io::Result<usize>> {
        // Get potentially uninitialized slice to write `data` into.
        let buf_to_fill = unsafe { self.tail_head_slice() };
		
		// Read into uninit slice
		let bytes_filled = ready!(reader.poll_read(cx, buf_to_fill))?;

		// Move head based on # of bytes filled.
		unsafe { self.move_head_unchecked(bytes_filled) }
    }

    fn poll_empty<W: AsyncWrite + Unpin>(&mut self, writer: Pin<&mut W>, cx: &mut Context<'_>) -> Poll<io::Result<usize>> {
        let written = ready!(writer.poll_write(cx, &self[..]))?;
		self.truncate_back(written);
		Poll::Ready(Ok(written))
    }
}

pub trait PrivateKey: AsRef<u8> {
	fn generate() -> Self;
}
pub trait PublicKey: AsRef<u8> {
	/// Corresponding private key type used to create this public key
	type PrivateKey: PrivateKey;
	fn generate(private: Self::PrivateKey) -> Self;
}

/// Generic trait for specification of an encryption protocol. 
pub trait EncryptionProtocol {
	type EncryptionError: fmt::Debug + error::Error;
	type EncryptionBuffer: EncryptionBuffer;
	type PublicKey: PublicKey;
	type PrivateKey = <Self::PublicKey as PublicKey>::PrivateKey;

	/// Create the protocol from a local private key and remote public key.
	fn create_from_keys(local_key: Self::PrivateKey, remote_key: Self::PublicKey, initiator: bool) -> Self;

	/// Generates buffers that hold encrypted data. Must be sized to fit at least 1 encrypted packet.
	fn gen_buffers(&self) -> (Self::EncryptionBuffer, Self::EncryptionBuffer);
	
	/// Decrypts some bytes from `buffer` and writes decrypted data to `out`. Returns number of bytes written to `out`.
	fn decrypt(&mut self, buffer: &mut Self::EncryptionBuffer, out: &mut [u8]) -> Result<usize, Self::EncryptionError>;

	/// Encrypts some bytes from `data` and writes encrypted data to `buffer`. Returns number of bytes read from `data.
	fn encrypt(&mut self, buffer: &mut Self::EncryptionBuffer, data: &[u8]) -> Result<usize, Self::EncryptionError>;
}

enum NoiseProtocol {
	Handshake { state: snow::HandshakeState, initiator: bool },
	Transport(snow::TransportState),
}

impl EncryptionProtocol for NoiseProtocol {
	type EncryptionError = snow::error::Error;
	type EncryptionBuffer = SliceRingBuffer<u8>;
	type PrivateKey = Arc<Vec<u8>>;
	type PublicKey = Vec<u8>;

	fn create_from_keys(local_key: Self::PrivateKey, remote_key: Self::PublicKey, initiator: bool) -> Self {
        let builder = snow::Builder::new("Noise_XX_25519_ChaChaPoly_BLAKE2s".parse().unwrap())
			.local_private_key(&local_key)
			.remote_public_key(&remote_key)
			.prologue("dither is pretty cool yo".as_bytes());
		
		Self::Handshake {
			state: if initiator {
				builder.build_initiator()
			} else {
				builder.build_responder()
			},
			initiator
		}
    }

	fn gen_buffers(&self) -> (Self::EncryptionBuffer, Self::EncryptionBuffer) {
        (
			SliceRingBuffer::with_capacity(u16::MAX as usize),
			SliceRingBuffer::with_capacity(u16::MAX as usize)
		)
    }

	fn decrypt(&mut self, buffer: &mut Self::EncryptionBuffer, out: &mut [u8]) -> Result<usize, Self::EncryptionError> {
		let message = buffer.as_slice();
		match match self {
			NoiseProtocol::Handshake { state, initiator } => if !*initiator {
				// if recipient in the handshake, read message
				state.read_message(message, out)
			} else { Ok(0) } // if initiator, should not be reading handshake message
			NoiseProtocol::Transport(state) => {
				state.read_message(message, out.as_mut())
			},
		} {
			Err(snow::Error::Input) => Ok(0),
			Err(err) => Err(err),
			Ok(inc) => {
				buffer.consume(inc);
				Ok(inc)
			}
		}
	}

	fn encrypt(&mut self, buffer: &mut Self::EncryptionBuffer, data: &[u8]) -> Result<usize, Self::EncryptionError> {
		let message = buffer.as_mut_slice();

		match self {
			NoiseProtocol::Handshake { state, initiator } => {
				if *initiator { // if recipient in the handshake, we should be reading, not writing
					state.write_message(&[], buffer.as_mut_slice())?;
				}
				Ok(0)
			} // if initiator, should not be reading handshake message
			NoiseProtocol::Transport(state) => {
				let bytes_to_encrypt = usize::min(data.len(), (0xFFFF - 0x10) as usize);
				let payload = &data[0..bytes_to_encrypt];

				let written = state.write_message(payload, message);
				Ok(bytes_to_encrypt)
			},
		}
	}
}

/* pub struct TLSProtocol {
	conn: ConnectionCommon<Box<dyn SideData>>
}

impl Transport for TLSProtocol {
    type InitData = ();

    type InitError = ();

    type TransportError = ();

    async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
        Ok(TLSProtocol {
			conn: ConnectionCommon::
		})
    }
}

impl EncryptionProtocol for TLSProtocol {
    fn decrypt(&mut self, data: &mut impl Read, out: &mut impl Write) -> Result<usize, Self::TransportError> {
        
    }

    fn encrypt(&mut self, data: &mut impl Read, out: &mut impl Write) -> Result<usize, Self::TransportError> {
        
    }
} */

/// Wrapper that adds encryption to an AsyncTranport. Is an AsyncTransport itself.
#[pin_project::pin_project]
pub struct EncryptedTransport<T: AsyncTransport, P: EncryptionProtocol> {
	#[pin]
	transport: T,
	protocol: P,
	encrypt_buffer: P::EncryptionBuffer,
	decrypt_buffer: P::EncryptionBuffer,
}

impl<T: AsyncTransport, P: EncryptionProtocol> EncryptedTransport<T, P> {
	fn wrap(transport: T, protocol: P) -> Self {
		let (encrypt_buffer, decrypt_buffer) = protocol.gen_buffers();
		EncryptedTransport {
			transport, protocol,
			encrypt_buffer, decrypt_buffer,
		}
	}
}

impl<S: AsyncTransport, P: EncryptionProtocol> AsyncRead for EncryptedTransport<S, P> {
	fn poll_read(
			self: Pin<&mut Self>,
			cx: &mut Context<'_>,
			buf: &mut [u8],
		) -> Poll<io::Result<usize>> {
		let mut this = self.project();
		
		// Fill EncryptionProtocol's decode buffer from transport
		let bytes_read = ready!(this.decrypt_buffer.poll_fill(&mut this.transport, cx))?;
		
		// If read *anything*, try to decrypt it
		if bytes_read > 0 {
			if let Some(bytes_decrypted) = this.protocol.decrypt(&mut this.decrypt_buffer, &mut buf)? {
				Poll::Ready(Ok(bytes_decrypted))
			} else {
				// No bytes to read, return pending and wait for more bytes to be read.
				Poll::Pending
			}
		}
	}
}
impl<S: AsyncTransport, P: EncryptionProtocol> AsyncWrite for EncryptedTransport<S, P> {
    fn poll_write(
            self: Pin<&mut Self>,
            cx: &mut Context<'_>,
            buf: &[u8],
        ) -> Poll<io::Result<usize>> {
		let this = self.project();
		
		// Encrypt buffer and store ciphertext in EncryptionProtocol's internal buffers.
		let bytes_encrypted = this.protocol.encrypt(&mut this.encrypt_buffer, buf)?;
		
		// Attempt to write any data in the EncryptionProtocol's ciphertext buffer to the underlying transport.
		let out = ready!(this.encrypt_buffer.poll_empty(&mut this.transport, cx))?;
		
		// Return amount of bytes stored in buffer
		Ok(bytes_encrypted)
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        let this = self.project();

		// Wait until EncryptionProtocol ciphertext buffer is empty
		while this.protocol.encryption_buffer_len() > 0 {
			ready!(this.encrypt_buffer.poll_empty(&mut this.transport, cx))?;
		}

		// Flush underlying transport
		this.transport.poll_flush(cx)?;
    }

    fn poll_close(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        let this = self.project();
		// TODO: Let EncryptionProtcols do final write on close
        this.transport.poll_close(cx)
    }
}