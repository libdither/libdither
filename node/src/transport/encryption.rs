use std::{io::{Read, Write, Result, self}, task::{Poll, Context}, pin::{pin, Pin}, convert::Infallible};

use bytes::Buf;
use either::Either;
use futures::{AsyncRead, ready, AsyncWrite};
use slice_ring_buffer::SliceRingBuffer;
use snow::params::NoiseParams;

use super::{Transport, AsyncTransport};

/// A mutable slice that must be no more than some Maximum size
pub struct MaxSlice<'a, const MAX: usize>(&'a [u8]);
impl<'a, const MAX: usize> MaxSlice<'a, MAX> {
	fn new(slice: &'a [u8]) -> Self {
		Self(slice)
	}
}
impl<'a, const MAX: usize> AsRef<[u8]> for MaxSlice<'a, MAX> {
    fn as_ref(&self) -> &[u8] {
        self.0
    }
}

/// Generic trait for specification of a packet-based encryption protocol. This includes handshaking, re-keying and everything else.
pub trait PacketEncryptionProtocol: Transport {
	const MAX_MESG_SIZE: usize;
	const MAX_TEXT_SIZE: usize;
	
	/// This function should be called when there is a fully-formed encrypted packet to be decrypted. Any decrypted data will be written to the `out` buffer and the number of bytes written to `out` will be returned.
	/// 
	/// Out buffer size should be at least `decrypt_min_out_buf_size(packet.len())` or error may be returned.
	fn decrypt(&mut self, packet: MaxSlice<'_, {Self::MAX_MESG_SIZE}>, out: &mut [u8]) -> Result<usize, Self::TransportError>;
	/// This function should be called when there is data to send. Any encrypted data will be written to the static-size out buffer and the number of bytes taken from `data` and written to `out` will be returned.
	/// 
	/// Out buffer size should be at least `encrypt_min_out_buf_size(packet.len())` or error may be returned.
	fn encrypt(&mut self, data: MaxSlice<'_, {Self::MAX_TEXT_SIZE}>, out: &mut [u8]) -> Result<usize, Self::TransportError>;
}

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

/// Generic trait for specification of an encryption protocol. 
pub trait EncryptionProtocol: Transport + Read + Write {
	type EncryptionBuffer: EncryptionBuffer;

	/// Generates buffers that hold encrypted data. Must be sized to fit at least 1 encrypted packet.
	fn gen_buffers(&self) -> (Self::EncryptionBuffer, Self::EncryptionBuffer);
	
	/// Decrypts some bytes from `buffer` and writes decrypted data to `out`. Returns number of bytes written to `out`.
	fn decrypt(&mut self, buffer: &mut Self::EncryptionBuffer, out: &mut [u8]) -> Result<usize, Self::TransportError>;

	/// Encrypts some bytes from `data` and writes encrypted data to `buffer`. Returns number of bytes read from `data.
	fn encrypt(&mut self, buffer: &mut Self::EncryptionBuffer, data: &[u8]) -> Result<usize, Self::TransportError>;
}

/// Provides an implementation of EncryptionProtocol for a given PacketEncryptionProtocol. This allows packet encryption protocols to be used in more general byte stream scenarios.
pub struct PacketEncryptionProtocolWrapper<P: PacketEncryptionProtocol>
where
	[(); P::MAX_MESG_SIZE]: Sized,
	[(); P::MAX_TEXT_SIZE]: Sized,
{
	packet_protocol: P,
	current_len_to_read: usize,
}

impl<P: PacketEncryptionProtocol> Transport for PacketEncryptionProtocolWrapper<P>
where
	[(); P::MAX_MESG_SIZE]: Sized,
	[(); P::MAX_TEXT_SIZE]: Sized,
{
    type InitData = P;

    type InitError = Infallible;

    type TransportError = Either<io::Error, P::TransportError>;

    async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
        Ok(Self {
            packet_protocol: data,
			current_len_to_read: 0,
        })
    }
}

impl<P: PacketEncryptionProtocol, B: EncryptionBuffer> EncryptionProtocol for PacketEncryptionProtocolWrapper<P, B>
where
	[(); P::MAX_MESG_SIZE]: Sized,
	[(); P::MAX_TEXT_SIZE]: Sized,
{
	
	type EncryptionBuffer = B;

	fn gen_buffers(&self) -> (Self::EncryptionBuffer, Self::EncryptionBuffer) {
        (
			B::create(P::MAX_MESG_SIZE + 2),
			B::create(P::MAX_MESG_SIZE + 2),
		)
    }
	
	fn decrypt(&mut self, buffer: &mut Self::EncryptionBuffer, out: &mut impl Write) -> Result<usize, Self::TransportError> {
		// If no length value read yet
		if self.current_len_to_read == 0 {
			if buffer.len() >= 2 {
				self.current_len_to_read = u16::from_be_bytes(&buffer[0..2]);
				buffer.consume(2);
			} else { return Ok(0) }
		}

		// Not enough bytes to read
		if self.len_to_read > self.decrypt_buffer.len() {
			return Ok(0)
		}

		// check if len is larger than max packet size
		if self.len_to_read > P::MAX_MESG_SIZE {
			return Err(io::Error::other("len to large"));
		}

		// Get slice of decrypt_buffer to decrypt.
		let packet = &mut buffer[..];

		// if packet is valid, decrypt into temporary buffer and write to output.
		let mut out_buffer = [0u8; P::MAX_TEXT_SIZE];
		let written = self.packet_protocol.decrypt(packet, &mut out_buffer).map_err(Either::Right)?;
		out.write_all(&out_buffer[0..written]).map_err(Either::Left)?;
	}

	// Encrypt entirety of `data` into internal buffer.
	fn encrypt(&mut self, data: &[u8]) -> Result<usize, Self::TransportError> {
		let mut in_buf = [0u8; P::MAX_TEXT_SIZE];
		let mut out_buf = [0u8; P::MAX_MESG_SIZE];

		// Encrypt until all data is read
		while data.has_remaining() {
			// Write as much data as possible into in_buf
			let written = (&mut in_buf[..]).write(data).unwrap();
			// update slice 
			data = &data[written..];

			let in_buf_written = MaxSlice::new(&in_buf[..written]);

			// attempt to encrypt in_buf as a packet.
			let bytes_encrypted = self.packet_protocol.encrypt(in_buf_written, &mut self.encrypt_buffer)
				.map_err(Either::Right)?;
		}
		Ok(0)
	}

	
}

enum NoiseProtocol {
	Handshake { state: snow::HandshakeState, initiator: bool },
	Transport(snow::TransportState),
}
impl Transport for NoiseProtocol {
	type InitData = (NoiseParams, bool);

	type InitError = snow::error::Error;

	type TransportError = snow::error::Error;

	async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
		let builder = snow::Builder::new(data.0);
		Ok(NoiseProtocol::Handshake {
			state: if data.1 {
				builder.build_initiator()
			} else {
				builder.build_responder()
			}?,
			initiator: data.1,
		})
	}
}

impl PacketEncryptionProtocol for NoiseProtocol {
	const MAX_MESG_SIZE: usize = u16::MAX as usize;
	const MAX_TEXT_SIZE: usize = u16::MAX as usize;

	fn decrypt(&mut self, packet: MaxSlice<'_, {Self::MAX_MESG_SIZE}>, mut out: &mut [u8]) -> Result<usize, Self::TransportError> {
		let message = packet.as_ref();
		Ok(match self {
			NoiseProtocol::Handshake { state, initiator } => if !*initiator {
				// if recipient in the handshake, read message
				state.read_message(message, out.as_mut())?
			} else { 0 } // if initiator, should not be reading handshake message
			NoiseProtocol::Transport(state) => {
				state.read_message(message, out.as_mut())
			},
		})
	}

	fn encrypt(&mut self, data: MaxSlice<'_, {Self::MAX_TEXT_SIZE}>, mut out: &mut [u8]) -> Result<usize, Self::TransportError> {
		Ok(match self {
			NoiseProtocol::Handshake { state, initiator } => if *initiator {
				// if recipient in the handshake, read message
				state.write_message(&[], out.as_mut())?
			} else { 0 } // if initiator, should not be reading handshake message
			NoiseProtocol::Transport(state) => {
				state.write_message(data.as_ref(), out.as_mut())?
			},
		})
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

impl<T: AsyncTransport, P: EncryptionProtocol> Transport for EncryptedTransport<T, P> {
	type InitData = (T::InitData, P::InitData);

	type InitError = Either<T::InitError, P::InitError>;

	type TransportError = Either<T::TransportError, P::TransportError>;

	async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
		let out = futures::future::join(
			T::create(data.0),
			P::create(data.1)
		).await;
		let transport = out.0.map_err(Either::Left)?;
		let protocol = out.1.map_err(Either::Right)?;
		let (encrypt_buffer, decrypt_buffer) = protocol.gen_buffers();
		Ok(EncryptedTransport {
			transport, protocol,
			encrypt_buffer, decrypt_buffer
		})
	}
}

impl<S: AsyncTransport, P: EncryptionProtocol> AsyncRead for EncryptedTransport<S, P> {
	fn poll_read(
			self: Pin<&mut Self>,
			cx: &mut Context<'_>,
			buf: &mut [u8],
		) -> Poll<Result<usize>> {
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
        ) -> Poll<Result<usize>> {
		let this = self.project();
		
		// Encrypt buffer and store ciphertext in EncryptionProtocol's internal buffers.
		let bytes_encrypted = this.protocol.encrypt(&mut this.encrypt_buffer, buf)?;
		
		// Attempt to write any data in the EncryptionProtocol's ciphertext buffer to the underlying transport.
		let out = ready!(this.encrypt_buffer.poll_empty(&mut this.transport, cx))?;
		
		// Return amount of bytes stored in buffer
		Ok(bytes_encrypted)
    }

    fn poll_flush(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<()>> {
        let this = self.project();

		// Wait until EncryptionProtocol ciphertext buffer is empty
		while this.protocol.encryption_buffer_len() > 0 {
			ready!(this.encrypt_buffer.poll_empty(&mut this.transport, cx))?;
		}

		// Flush underlying transport
		this.transport.poll_flush(cx)?;
    }

    fn poll_close(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<()>> {
        let this = self.project();
		// TODO: Let EncryptionProtcols do final write on close
        this.transport.poll_close(cx)
    }
}