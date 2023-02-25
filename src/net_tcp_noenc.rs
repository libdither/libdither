//! Non-encrypted encryption TODO: Implement real encryption with noise protocol & perhaps https/tls

use std::net::SocketAddr;
use bevy_ecs::system::Resource;
use thiserror::Error;

use async_std::{net::{TcpStream, TcpListener}, task};
use futures::{StreamExt, channel::mpsc::{channel, self, unbounded}, SinkExt, FutureExt};

use node::{NodeID, Connection, Network};

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

	async fn init(config: node::NetConfig<Self>) -> Result<(Self, impl futures::Stream<Item = Result<Connection<Self>, Self::ConnectionError>> + Unpin + futures::stream::FusedStream), Self::ConnectionError> {
        let (request_sender, mut request_receiver) = unbounded::<NetRequest<Self>>();
		
		let mut listener = TcpListener::bind(&config.listen_addrs[..]).await?;

		let (mut conn_sender, conn_stream) = channel::<Result<Connection<Self>, Self::ConnectionError>>(20);

		// Spawn task that listens for incoming connections
        task::spawn(async move {
			
			loop {
				let result: Result<(), Self::ConnectionError> = try {
					futures::select! {
						request = request_receiver.next().fuse() => {
							let request = request.unwrap();
							match request {
								NetRequest::Connect { remote_id: _, net_address, remote_pub_key: _, persistent_state: _ } => {
									let conn_result: Result<Connection<Self>, Self::ConnectionError> = try {
										let tcp_stream = TcpStream::connect(net_address).await?;
										
										Connection {
											net_address,
											remote_pub_key: net_address.to_string().as_bytes().to_vec(),
											persistent_state: (),
											read: tcp_stream.clone(),
											write: tcp_stream,
										}
									};
									if let Err(_) = conn_sender.send(conn_result).await {
										break
									}
								}
								NetRequest::Listen(socket_addrs) => {
									listener = TcpListener::bind(&socket_addrs[..]).await?;
								}
							}
						}
						tcp_stream = listener.accept().fuse() => {
							let conn_result: Result<Connection<Self>, Self::ConnectionError> = try {
								let (tcp_stream, net_address) = tcp_stream?;
			
								Connection {
									net_address,
									remote_pub_key: net_address.to_string().as_bytes().to_vec(),
									persistent_state: (),
									read: tcp_stream.clone(),
									write: tcp_stream,
								}
							};
							
							if let Err(_) = conn_sender.send(conn_result).await {
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
}

/* #[derive(Error, Debug)]
pub enum EncryptionError<Net: Network> {
	#[error("expected {expected} for node at {addr}, but node sent {found}")]
	InvalidNodeID { addr: Net::Address, expected: NodeID, found: NodeID },
	#[error("invalid multihash encoding")]
	BadHash,
	#[error("io error: {0}")]
	IOError(#[from] std::io::Error),
}

/// When connecting to peer, read 
pub async fn encrypt_outgoing<Net: Network>(mut read: Net::Read, mut write: Net::Write, my_id: &NodeID, connecting_id: &NodeID, connecting_addr: Net::Address) -> Result<Connection<Net>, EncryptionError<Net>> {
	write.write(my_id.as_bytes()).await?; // Write my NodeID
	let node_id = NodeID::from_reader_async(&mut read).await?;
	if node_id == *connecting_id { // Verify remote ID
		Ok(Connection { node_id, addr: connecting_addr, read, write })
	} else {
		Err(EncryptionError::InvalidNodeID { addr: connecting_addr, expected: connecting_id.clone(), found: node_id })
	}
	
}

// When handling incoming session, read connecting node_id and write own node_id
pub async fn encrypt_incoming<Net: Network>(mut read: Net::Read, mut write: Net::Write, my_id: &NodeID, incoming_addr: Net::Address) -> Result<Connection<Net>, EncryptionError<Net>> {
	let incoming_node_id = NodeID::from_reader_async(&mut read).await.map_err(|_|EncryptionError::BadHash)?;
	write.write(my_id.as_bytes()).await?;
	Ok(Connection { node_id: incoming_node_id, addr: incoming_addr, read, write })
} */