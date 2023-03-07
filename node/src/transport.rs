
trait Transport: Sized {
	type InitData;
	type InitError;
	type TransportError;
	async fn create(data: Self::InitData) -> Result<Self, Self::InitError>;
}
struct TcpTransport {
	read: TcpStream,
	write: TcpStream,
}
impl Transport for TcpTransport {
	type InitData = impl ToSocketAddrs;
	type InitError = async_std::io::Error;
	type TransportError = async_std::io::Error;

	async fn create(data: Self::InitData) {
		let stream = TcpStream::connect(data).await?;
		TcpTransport { read: stream.clone(), write: stream }
    }
}
struct UdpTransport {

}
impl Transport for UdpTransport {
	type InitData = impl ToSocketAddrs;
	type InitError = async_std::io::Error;
	async fn create(data: Self::InitData) -> Result<Self, Self::InitError> {
		let local_addr = SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0));
		let socket = UdpSocket::bind(local_addr).await?;
		socket.connect(data).await?;
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
	fn send(&self, data: &[u8]) -> Result<usize, Self::TransportError>;
	/// Receives from socket into `data`. Returns amount of data received.
	fn recv(&self, data: &mut [u8]) -> Result<usize, Self::TransportError>;
}

/// A Transport that acknoledges received data.
trait ByzantineTransport: LossyTransport {

}

/// A Transport that checks for corrupted data by providing a checksum.
trait CheckingTransport: LossyTransport {

}

trait ReliableTransport: SequencingTransport + ByzantineTransport + CheckingTransport {

}




trait DataTransport: Transport {

}