//! Non-encrypted encryption TODO: Implement real encryption with noise protocol & perhaps https/tls

use std::net::{SocketAddr, SocketAddrV4, Ipv4Addr};
use bevy_ecs::system::Resource;
use rkyv::{AlignedVec, Infallible, Deserialize, to_bytes};
use rkyv_codec::{RkyvCodecError, length_codec::U32Length};
use thiserror::Error;

use async_std::{net::{TcpStream, TcpListener}, task};
use futures::{StreamExt, channel::mpsc::{channel, self, unbounded, SendError, Sender}, SinkExt, FutureExt};

use node::{NodeID, Connection, Network, EncryptionKeys};

#[derive(Debug, Clone, Resource)]
pub struct ListenerConfig {
	listen_addrs: Vec<SocketAddr>,
}
impl ListenerConfig {
	pub fn local(port: u16) -> Self {
		let listen_addr = SocketAddr::V4(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), port));
		Self {
			listen_addrs: vec![listen_addr],
		}
	}
}


enum NetRequest<Net: Network> {
	Connect {
		remote_id: NodeID,
		net_address: Net::Address,
		remote_pub_key: Option<Net::NodePubKey>,
		persistent_state: Option<Net::PersistentState>,
	},
	Listen(Vec<SocketAddr>),
}

#[derive(Clone, Debug, Resource)]
pub struct TcpNoenc {
	conn_req_sender: mpsc::UnboundedSender<NetRequest<Self>>, 
}

#[derive(Debug, Error)]
pub enum TcpNoencError {
	#[error("io error: {0}")]
	IoError(#[from] std::io::Error),
	#[error("codec error: {0}")]
	CodecError(#[from] RkyvCodecError),
}

struct TcpNoencState {
	conn_sender: Sender<Result<Connection<TcpNoenc>, TcpNoencError>>,
	listener: TcpListener,
	keys: EncryptionKeys<TcpNoenc>,
}
impl TcpNoencState {
	async fn handle_request(&mut self, request: NetRequest<TcpNoenc>) -> Result<(), SendError> {
		match request {
			NetRequest::Connect { remote_id: _, net_address, remote_pub_key: _, persistent_state: _ } => {
				// Connect to remote
				let tcp_stream: Result<(TcpStream, SocketAddr), TcpNoencError> = try {
					(TcpStream::connect(net_address).await?, net_address)
				};
				
				self.handle_connection(tcp_stream, true).await?;
			}
			NetRequest::Listen(socket_addrs) => {
				if let Ok(new_listener) = TcpListener::bind(&socket_addrs[..]).await {
					log::info!("net: listening on new address: {socket_addrs:?}");
					self.listener = new_listener;
				} else {
					log::error!("net: failed to listen on new address: {socket_addrs:?}");
				}
			}
		}
		Ok(())
	}
	async fn handle_connection(&mut self, tcp_stream: Result<(TcpStream, SocketAddr), TcpNoencError>, requested: bool) -> Result<(), SendError> {
		let conn_result: Result<Connection<TcpNoenc>, TcpNoencError> = try {
			let (mut tcp_stream, net_address) = tcp_stream?;

			// Send own public key to remote
			let archived = to_bytes::<_, 64>(&self.keys.public_key).map_err(|_|RkyvCodecError::SerializeError)?;
			rkyv_codec::archive_sink::<_, U32Length>(&mut tcp_stream, &archived).await?;

			// Read remote public key from stream before passing back connection
			let mut buffer = AlignedVec::with_capacity(32);
			let archive = rkyv_codec::archive_stream::<_, Vec<u8>, U32Length>(&mut tcp_stream, &mut buffer).await?;
			let remote_pub_key: Vec<u8> = archive.deserialize(&mut Infallible).unwrap();

			Connection {
				incoming_address: net_address,
				remote_pub_key,
				persistent_state: (),
				read: tcp_stream.clone(),
				write: tcp_stream,
				requested,
			}
		};
		self.conn_sender.send(conn_result).await
	}
}

impl Network for TcpNoenc {
    type Address = SocketAddr;

    type ArchivedAddress = <SocketAddr as rkyv::Archive>::Archived;

    type NodePubKey = Vec<u8>;

    type NodePrivKey = Vec<u8>;

    type PersistentState = ();

    type Read = TcpStream;

    type Write = TcpStream;

    type ConnectionError = TcpNoencError;

	type ListenerConfig = ListenerConfig;

	async fn init(keys: EncryptionKeys<Self>, listener_config: &ListenerConfig) -> Result<(Self, impl futures::Stream<Item = Result<Connection<Self>, Self::ConnectionError>> + Unpin + futures::stream::FusedStream), Self::ConnectionError> {
        let (request_sender, mut request_receiver) = unbounded::<NetRequest<Self>>();
		
		let (conn_sender, conn_stream) = channel::<Result<Connection<Self>, Self::ConnectionError>>(20);

		let mut state = TcpNoencState {
			listener: TcpListener::bind(&listener_config.listen_addrs[..]).await?, // Bind listener to all listening addresses
			conn_sender,
			keys,
		};

		// Spawn task that listens for incoming connections
        task::spawn(async move {
			loop {
				let result: Result<(), Self::ConnectionError> = try {
					futures::select! {
						request = request_receiver.next().fuse() => if let Some(request) = request {
							if let Err(err) = state.handle_request(request).await {
								log::error!("net: connection sender closed: {err}");
								break
							}
						},
						tcp_stream = state.listener.accept().fuse() => {
							if let Err(err) = state.handle_connection(tcp_stream.map_err(TcpNoencError::from), false).await {
								log::error!("net: connection sender closed: {err}");
								break
							}
						}
					}
				};
				
				if let Err(err) = result {
					log::error!("network error: {err}");
					break;
				}
			}
		});

		Ok((
			Self {
				conn_req_sender: request_sender,
			},
			conn_stream
		))
    }

    fn connect(
		&self,
		remote_id: NodeID,
		net_address: Self::Address,
		remote_pub_key: Option<Self::NodePubKey>,
		persistent_state: Option<Self::PersistentState>,
	) {
        let _ = self.conn_req_sender.unbounded_send(NetRequest::Connect {
			remote_id,
			net_address,
			remote_pub_key,
			persistent_state,
		});
    }

    fn listen(&self, addrs: impl Iterator<Item = Self::Address>) {
        let _ = self.conn_req_sender.unbounded_send(NetRequest::Listen(addrs.collect::<Vec<Self::Address>>()));
    }

    fn predict_public_addresses<'a>(addr: &'a Self::Address, config: &'a Self::ListenerConfig) -> impl Iterator<Item = Self::Address> + 'a {
        config.listen_addrs.iter().map(|listen_addr| {
			let mut addr = addr.clone();
			addr.set_port(listen_addr.port());
			addr
		})
    }	
}

