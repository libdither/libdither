use std::{io::{Read, Write, self, BorrowedBuf}, task::{Poll, Context}, pin::{pin, Pin}, error, fmt};

use futures::{AsyncRead, ready, AsyncWrite};
use slice_ring_buffer::SliceRingBuffer;

use super::AsyncTransport;

/// Abstraction over Buffer used for encryption
pub trait EncryptionBuffer: AsRef<[u8]> + AsMut<[u8]> {
	/// Create the buffer
	fn create(capacity: usize) -> Self;
	/// Get number of bytes in buffer
	fn len(&self) -> usize;
	/// Fill buffer with reader
	fn fill(&mut self, reader: &mut impl Read) -> io::Result<usize>;
	/// Empty buffer to writer
	fn empty(&mut self, writer: &mut impl Write) -> io::Result<usize>;
	/// Consume amount from start of buffer
	fn consume(&mut self, amount: usize);
	/// Fill from async reader
	fn poll_fill<R: AsyncRead + Unpin>(&mut self, reader: Pin<&mut R>, cx: &mut Context<'_>) -> Poll<io::Result<usize>>;
	/// Empty to async writer
	fn poll_empty<W: AsyncWrite + Unpin>(&mut self, writer: Pin<&mut W>, cx: &mut Context<'_>) -> Poll<io::Result<usize>>;

	/// Fill buffer with function if buffer has at least `min_size` bytes left to fill.
	fn fill_with<R>(&mut self, min_size: usize, f: impl FnOnce(&mut [u8]) -> R) -> Option<R>;
}
impl EncryptionBuffer for SliceRingBuffer<u8> {
    fn create(capacity: usize) -> Self {
        SliceRingBuffer::with_capacity(capacity)
    }

	fn len(&self) -> usize {
		self.len()
	}

    fn fill(&mut self, reader: &mut impl Read) -> io::Result<usize> {
        // Get potentially uninitialized slice to write `data` into.
        let mut buf_to_fill: BorrowedBuf = unsafe { self.tail_head_slice().into() };
		
		// Read into uninit slice
		reader.read_buf(buf_to_fill.unfilled())?;
		let bytes_filled = buf_to_fill.len();
		
		// Move head based on # of bytes filled.
		unsafe { self.move_head_unchecked(bytes_filled as isize) }
		Ok(bytes_filled)
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
        let mut buf_to_fill: BorrowedBuf = unsafe { self.tail_head_slice().into() };
		
		// TODO: Wait for better AsyncRead trait so we can read directly into a `&mut [MaybeUninit<u8>]`.
		let mut buf_cursor = buf_to_fill.unfilled();
		let buf_to_fill = buf_cursor.ensure_init().init_mut();
		// Read into uninit slice
		let bytes_filled = ready!(reader.poll_read(cx, buf_to_fill))?;

		// Move head based on # of bytes filled.
		unsafe { self.move_head_unchecked(bytes_filled as isize) }
		Poll::Ready(Ok(bytes_filled))
    }

    fn poll_empty<W: AsyncWrite + Unpin>(&mut self, writer: Pin<&mut W>, cx: &mut Context<'_>) -> Poll<io::Result<usize>> {
        let written = ready!(writer.poll_write(cx, &self[..]))?;
		self.truncate_back(written);
		Poll::Ready(Ok(written))
    }

    fn fill_with<R>(&mut self, min_size: usize, f: impl FnOnce(&mut [u8]) -> R) -> Option<R> {
        // Get potentially uninitialized slice to write `data` into.
        let mut buf_to_fill: BorrowedBuf = unsafe { self.tail_head_slice().into() };
		
		// TODO: Wait for better AsyncRead trait so we can read directly into a `&mut [MaybeUninit<u8>]`.
		let mut buf_cursor = buf_to_fill.unfilled();
		let buf_to_fill = buf_cursor.ensure_init().init_mut();

		if buf_to_fill.len() >= min_size {
			Some(f(buf_to_fill))
		} else {
			None
		}
    }
}


/* pub trait AsymmetricEncryption {
	type PrivateKey: AsRef<[u8]>;
	type PublicKey: AsRef<[u8]>;

	fn generate_keypair(&self) -> (Self::PrivateKey, Self::PublicKey);
} */

/// Generic trait for specification of an encryption protocol.
pub trait EncryptionProtocol: Sized {
	type EncryptionError: fmt::Debug + error::Error + 'static + Send + Sync;
	type EncryptionBuffer: EncryptionBuffer;
	type Builder<'a>;

	/// Create the protocol from a local private key and remote public key.
	fn create_from_builder(builder: Self::Builder<'_>, initiator: bool) -> Result<Self, Self::EncryptionError>;

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
	type Builder<'a> = snow::Builder<'a>;
	/* type PrivateKey = Arc<Vec<u8>>;
	type PublicKey = Vec<u8>; */

	fn create_from_builder(builder: Self::Builder<'_>, initiator: bool) -> Result<Self, Self::EncryptionError> {
        /* let builder = snow::Builder::new("Noise_XX_25519_ChaChaPoly_BLAKE2s".parse().unwrap())
			.local_private_key(&local_key)
			.remote_public_key(&remote_key)
			.prologue("dither is pretty cool yo".as_bytes()); */
		
		Ok(Self::Handshake {
			state: if initiator {
				builder.build_initiator()?
			} else {
				builder.build_responder()?
			},
			initiator
		})
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
		match self {
			NoiseProtocol::Handshake { state, initiator } => {
				if *initiator { // if recipient in the handshake, we should be reading, not writing
					if let Some(result) = buffer.fill_with(u16::MAX as usize, |message|{
						state.write_message(&[], message)
					}) {
						result
					} else { Ok(0) }
				} else { Ok(0) }
			} // if initiator, should not be reading handshake message
			NoiseProtocol::Transport(state) => {
				// Make sure bytes_to_encrypt does not exceed max message size for noise packet
				let bytes_to_encrypt = usize::min(data.len(), (0xFFFF - 0x10) as usize);
				let payload = &data[0..bytes_to_encrypt];

				if let Some(result) = buffer.fill_with(u16::MAX as usize, |message|{
					state.write_message(payload, message)
				}) {
					result?;
					Ok(bytes_to_encrypt)
				} else { Ok(0) }
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
		let bytes_read = ready!(this.decrypt_buffer.poll_fill(this.transport.as_mut(), cx))?;
		
		// If read *anything*, try to decrypt it
		if bytes_read > 0 {
			let bytes_decrypted = this.protocol.decrypt(&mut this.decrypt_buffer, buf).map_err(|err|io::Error::new(io::ErrorKind::InvalidData, err))?;

			if bytes_decrypted > 0 {
				Poll::Ready(Ok(bytes_decrypted))
			} else {
				Poll::Pending // This poll_read should be re-scheduled when inner reader is ready
			}
		} else {
			Poll::Ready(Ok(0))
		}
	}
}
impl<S: AsyncTransport, P: EncryptionProtocol> AsyncWrite for EncryptedTransport<S, P> {
    fn poll_write(
            self: Pin<&mut Self>,
            cx: &mut Context<'_>,
            buf: &[u8],
        ) -> Poll<io::Result<usize>> {
		let mut this = self.project();
		
		// Encrypt buffer and store ciphertext in EncryptionProtocol's internal buffers.
		let bytes_encrypted = this.protocol.encrypt(&mut this.encrypt_buffer, buf).map_err(|err|io::Error::new(io::ErrorKind::InvalidData, err))?;
		
		// Attempt to write any data in the EncryptionProtocol's ciphertext buffer to the underlying transport.
		let _out = ready!(this.encrypt_buffer.poll_empty(this.transport.as_mut(), cx))?;
		
		// Return amount of bytes stored in buffer
		Poll::Ready(Ok(bytes_encrypted))
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        let mut this = self.project();

		// Wait until EncryptionProtocol ciphertext buffer is empty
		while this.encrypt_buffer.len() > 0 {
			ready!(this.encrypt_buffer.poll_empty(this.transport.as_mut(), cx))?;
		}

		// Flush underlying transport
		this.transport.poll_flush(cx)
    }

    fn poll_close(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        let this = self.project();
		// TODO: Let EncryptionProtcols do final write on close
        this.transport.poll_close(cx)
    }
}