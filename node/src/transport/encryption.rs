use std::{io::{Read, BufRead, Write, Cursor}, task::Poll, pin::pin, convert::Infallible, ops::Range};

use either::Either;
use futures::{AsyncRead, AsyncWrite, AsyncReadExt, ready};
use snow::params::NoiseParams;

use super::{Transport, AsyncTransport};

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
pub struct MutMaxSlice<'a, const MAX: usize>(&'a mut [u8]);
impl<'a, const MAX: usize> MutMaxSlice<'a, MAX> {
	fn new(slice: &'a mut [u8]) -> Self {
		Self(slice)
	}
}
impl<'a, const MAX: usize> AsMut<[u8]> for MutMaxSlice<'a, MAX> {
    fn as_mut(&mut self) -> &mut [u8] {
        self.0
    }
}

/// Generic trait for specification of a packet-based encryption protocol. This includes handshaking, re-keying and everything else.
pub trait PacketEncryptionProtocol: Transport {
	const MAX_MESG_SIZE: usize;
	const MAX_TEXT_SIZE: usize;
	/// Takes a buffer and if it contains a valid packet, return packet slice
	fn is_valid_packet<'a>(&self, packet: MaxSlice<'a, {Self::MAX_MESG_SIZE}>) -> Option<MaxSlice<'a, {Self::MAX_MESG_SIZE}>>;
	/// This function should be called when there is a fully-formed encrypted message to be parsed into a static sized buffer. Any decrypted data will be written to the `out` buffer and the number of bytes written to `out` will be returned. Should return 0 if `out` is not large enough.
	fn decrypt(&mut self, packet: MaxSlice<'_, {Self::MAX_MESG_SIZE}>, out: MutMaxSlice<'_, {Self::MAX_TEXT_SIZE}>) -> Result<usize, Self::TransportError>;
	/// This function should be called when there is data to send. Any encrypted data will be written to the static-size out buffer and the number of bytes taken from `data` and written to `out` will be returned.
	fn encrypt(&mut self, data: MaxSlice<'_, {Self::MAX_TEXT_SIZE}>, out: MutMaxSlice<'_, {Self::MAX_MESG_SIZE}>) -> Result<usize, Self::TransportError>;
}

/// Generic trait for specification of an encryption protocol. 
pub trait EncryptionProtocol: Transport {
	/// Takes a buffer of encrypted data and will write decrypted data to `out`. Returns number of bytes written to `out`
	fn decrypt(&mut self, data: &[u8], out: &mut impl Write) -> Result<usize, Self::TransportError>;
	/// Takes a buffer of plain data and will write encrypted data to `out`. Returns number of bytes written to `out`
	fn encrypt(&mut self, data: &[u8], out: &mut impl Write) -> Result<usize, Self::TransportError>;
}

/// Provides an implementation of EncryptionProtocol for a given PacketEncryptionProtocol. This allows packet encryption protocols to be used in more general byte stream scenarios.
pub struct PacketEncryptionProtocolWrapper<P: PacketEncryptionProtocol>
where
	[(); P::MAX_MESG_SIZE]: Sized,
	[(); P::MAX_TEXT_SIZE]: Sized,
{
	packet_protocol: P,
	// encrypted data is stored in this buffer until it contains a packet that can be decrypted by `PacketEncryptionProtocol::decrypt()`
	decrypt_buffer: [u8; P::MAX_MESG_SIZE],
	decrypt_buffer_usage: usize,
}
impl<P: PacketEncryptionProtocol> Transport for PacketEncryptionProtocolWrapper<P>
where
	[(); P::MAX_MESG_SIZE]: Sized,
	[(); P::MAX_TEXT_SIZE]: Sized,
{
    type InitData = P;

    type InitError = Infallible;

    type TransportError = Either<std::io::Error, P::TransportError>;

    async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
        Ok(Self {
            packet_protocol: data,
            decrypt_buffer: [0u8; P::MAX_MESG_SIZE],
			decrypt_buffer_usage: 0,
        })
    }
}

impl<P: PacketEncryptionProtocol> EncryptionProtocol for PacketEncryptionProtocolWrapper<P>
where
	[(); P::MAX_MESG_SIZE]: Sized,
	[(); P::MAX_TEXT_SIZE]: Sized,
{
	fn decrypt(&mut self, mut data: &[u8], out: &mut impl Write) -> Result<usize, Self::TransportError> {

		let mut total_written: usize = 0;
		while data.len() != 0 {
			// Get number of bytes left in decryption buffer
			let size_left = self.decrypt_buffer.len() - self.decrypt_buffer_usage;

			// Calculate how much bytes I can read right now from data given decryption buffer size_left.
			let can_read = usize::min(size_left, data.len());

			// Calculate the range to write into self.decrypt_buffer given amount can_read;
			let write_range = self.decrypt_buffer_usage..self.decrypt_buffer_usage+can_read;

			// Copy from data into decrypt_buffer.
			self.decrypt_buffer[write_range].copy_from_slice(&data[0..can_read]);
			self.decrypt_buffer_usage += can_read;
			data = &data[can_read..];

			// Portion of self.decrypt_buffer that contains actual data from `data`.
			let written_segment = &self.decrypt_buffer[..self.decrypt_buffer_usage];
			if let Some(packet) = self.packet_protocol.is_valid_packet(MaxSlice::new(written_segment)) {
				// Create fixed buffer to write output packet to
				let mut out_buffer = [0u8; P::MAX_TEXT_SIZE];
				// Decrypt packet
				let written = self.packet_protocol.decrypt(packet, MutMaxSlice::new(&mut out_buffer)).map_err(Either::Right)?;
				total_written += written;

				// Write decrypted packet to writer
				out.write_all(&out_buffer[0..written]).map_err(Either::Left)?;

				// Copy data not interpreted as packet in this decryption round to start of self.decrypt_buffer
				self.decrypt_buffer.copy_within(self.decrypt_buffer_usage.., 0)
			}
		}
		Ok(total_written)
	}

	// Encrypt entire `data` into `out`
	fn encrypt(&mut self, data: &[u8], out: &mut impl Write) -> Result<usize, Self::TransportError> {
		let mut in_buf: [u8; P::MAX_TEXT_SIZE];
		let mut out_buf: [u8; P::MAX_MESG_SIZE];
		
		// Encrypt until all data is read
		/* while data.len() != 0 {
			// Read unencrypted data into const buf
			let taken = (&mut in_buf[..]).write(data).unwrap();
			data = &data[taken..];

			// Encrypt const buf
			let encrypted = P::encrypt(&mut self, (&in_buf, taken), &mut out_buf)?;

			// Write encrypted buf to output
			out.write_all(&out_buf[..encrypted]);
		} */
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

	fn is_valid_packet<'a>(&self, packet: MaxSlice<'a, {Self::MAX_MESG_SIZE}>) -> Option<MaxSlice<'a, {Self::MAX_MESG_SIZE}>> {
        todo!()
    }

	fn decrypt(&mut self, packet: MaxSlice<'_, {Self::MAX_MESG_SIZE}>, mut out: MutMaxSlice<'_, {Self::MAX_TEXT_SIZE}>) -> Result<usize, Self::TransportError> {
		let message = packet.as_ref();
		Ok(match self {
			NoiseProtocol::Handshake { state, initiator } => if !*initiator {
				// if recipient in the handshake, read message
				state.read_message(message, out.as_mut())?
			} else { 0 } // if initiator, should not be reading handshake message
			NoiseProtocol::Transport(state) => {
				state.read_message(message, out.as_mut())?
			},
		})
	}

	fn encrypt(&mut self, data: MaxSlice<'_, {Self::MAX_TEXT_SIZE}>, mut out: MutMaxSlice<'_, {Self::MAX_MESG_SIZE}>) -> Result<usize, Self::TransportError> {
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


/// Wrapper that adds encryption to an AsyncTranport. Is an AsyncTransport itself.
#[pin_project::pin_project]
pub struct EncryptedTransport<T: AsyncTransport, P: EncryptionProtocol> {
	#[pin]
	transport: T,
	protocol: P,
	/// ciphertext to be decrypted from transport
	read_in_buf: Vec<u8>,
	/// buffered plaintext from transport
	read_out_buf: Vec<u8>,
	/// ciphertext to be sent
	write_buf: Vec<u8>,
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
		Ok(EncryptedTransport {
			transport, protocol,
			read_in_buf: Vec::with_capacity(u16::MAX as usize),
			read_out_buf: Vec::with_capacity(u16::MAX as usize),
			write_buf: Vec::with_capacity(u16::MAX as usize),
		})
	}
}
impl<S: AsyncTransport, P: EncryptionProtocol> AsyncRead for EncryptedTransport<S, P> {
	fn poll_read(
			self: std::pin::Pin<&mut Self>,
			cx: &mut std::task::Context<'_>,
			buf: &mut [u8],
		) -> Poll<std::io::Result<usize>> {
		let mut this = self.project();

		// if not enough bytes to satisfy read, 
		if this.read_out_buf.len() < buf.len() {
			// pin underlying transport
			let transport = this.transport;

			// read from underlying transport into buffer.
			let bytes_read_into_in_buf = ready!(transport.poll_read(cx, &mut this.read_in_buf)?);

			// decrypt everything read into buf.
			let ciphertext = &this.read_in_buf[..bytes_read_into_in_buf];
			let bytes_decrypted = this.protocol.decrypt(ciphertext, &mut this.read_out_buf).map_err(|err|std::io::Error::new(std::io::ErrorKind::InvalidData, format!("{}", err)))?;
		};

		// read from out_buf to buf and 
		let bytes_read = Read::read(&mut this.read_out_buf.as_slice(), buf)?;
		let bytes_left = this.read_out_buf.len() - bytes_read;
		this.read_out_buf.copy_within(bytes_read.., 0);
		this.read_out_buf.truncate(bytes_left);
		Poll::Ready(Ok(bytes_read))
	}
}