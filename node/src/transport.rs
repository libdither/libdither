mod encryption;

use std::{net::{SocketAddr, SocketAddrV4, Ipv4Addr}, error, fmt};

use async_std::{net::{TcpStream, UdpSocket}};
use futures::{AsyncRead, AsyncWrite};

/// A transport takes some data and establishes a connection using that data.
pub trait Transport: Sized {
	/// Data required to establish a transport
	type InitData;
	/// Error related to establishing the transport
	type InitError: fmt::Debug + error::Error;
	/// Error related to transporting data too and from the transport.
	type TransportError: fmt::Debug + error::Error + Send + Sync;
	async fn create(data: Self::InitData) -> Result<Self, Self::InitError>;
}

/// Any kind of transport that uses AsyncRead & AsyncWrite to send data.
pub trait AsyncTransport: Transport + AsyncRead + AsyncWrite + Unpin {}
impl<T: Transport + AsyncRead + AsyncWrite + Unpin> AsyncTransport for T {}

pub struct TcpTransport {
	read: TcpStream,
	write: TcpStream,
}
impl Transport for TcpTransport {
	type InitData = SocketAddr;
	type InitError = async_std::io::Error;
	type TransportError = async_std::io::Error;

	async fn create(data: Self::InitData) -> Result<Self, Self::TransportError> {
		let stream = TcpStream::connect(data).await?;
		Ok(TcpTransport { read: stream.clone(), write: stream })
    }
}

impl Transport for UdpSocket {
	type InitData = SocketAddr;
	type InitError = async_std::io::Error;
	type TransportError = async_std::io::Error;
	
	async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
		let local_addr = SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0));
		let socket = UdpSocket::bind(local_addr).await?;
		socket.connect(data).await?;
		Ok(socket)
	}
}

/* /// Represents a Transport that may lose or corrupt data in the process of transport.
trait LossyTransport: Transport {
	/// Sends `data` along socket. Returns amount of data sent.
	fn lossy_send(&self, data: &[u8]) -> Result<usize, Self::TransportError>;
	/// Receives from socket into `data`. Returns amount of data received.
	fn lossy_recv(&self, data: &mut [u8]) -> Result<usize, Self::TransportError>;
}

/// A Transport that labels each packet with a number.
trait SequencingTransport: LossyTransport {
	/// Sends `data` along socket. Returns amount of data sent.
	fn seq_send(&self, data: &[u8]) -> Result<usize, Self::TransportError>;
	/// Receives from socket into `data`. Returns amount of data received.
	fn seq_recv(&self, data: &mut [u8]) -> Result<usize, Self::TransportError>;
}

/// A Transport that acknowledges
trait ByzantineTransport: LossyTransport {
	
}

/// A Transport that checks for corrupted data by providing a checksum.
trait CheckingTransport: LossyTransport {

}

trait ReliableTransport: SequencingTransport + ByzantineTransport + CheckingTransport {

}


trait DataTransport: Transport {

} */