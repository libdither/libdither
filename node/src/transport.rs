use std::net::{SocketAddr, SocketAddrV4, Ipv4Addr};

use async_std::net::{TcpStream, UdpSocket};
use futures::{Stream, Sink, AsyncRead, AsyncWrite};

pub trait Transport: Sized {
	type InitData;
	type InitError;
	type TransportError;
	async fn create(data: Self::InitData) -> Result<Self, Self::InitError>;
}
// Any kind of transport that send data packet-by-packet
pub trait PacketTransport: Transport {
	/// Sends `data` along socket. Returns amount of data sent.
	async fn send(&self, data: &[u8]) -> Result<usize, Self::TransportError>;
	/// Receives from socket into `data`. Returns amount of data received.
	async fn recv(&self, data: &mut [u8]) -> Result<usize, Self::TransportError>;
}
/// Any kind of transport that uses AsyncRead & AsyncWrite to send data.
pub trait StreamTransport: Transport + AsyncRead + AsyncWrite {}
impl<T> StreamTransport for T 
where T: Transport + AsyncRead + AsyncWrite {}

// Implement AsyncRead & AsyncWrite for a packet-based Transport
pub struct Streamify<T: PacketTransport>(T);
impl<T: PacketTransport> AsyncRead for Streamify<T> {
    fn poll_read(
            self: std::pin::Pin<&mut Self>,
            cx: &mut std::task::Context<'_>,
            buf: &mut [u8],
        ) -> std::task::Poll<std::io::Result<usize>> {  
		todo!() 
    }
}
impl<T: PacketTransport> AsyncWrite for Streamify<T> {
    fn poll_write(
            self: std::pin::Pin<&mut Self>,
            cx: &mut std::task::Context<'_>,
            buf: &[u8],
        ) -> std::task::Poll<std::io::Result<usize>> {
        todo!()
    }

    fn poll_flush(self: std::pin::Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<std::io::Result<()>> {
        todo!()
    }

    fn poll_close(self: std::pin::Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<std::io::Result<()>> {
        todo!()
    }
}

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

/// Represents a Transport that may lose or corrupt data in the process of transport.
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

}