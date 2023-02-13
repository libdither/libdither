//! Non-encrypted encryption TODO: Implement real encryption with noise protocol & perhaps https/tls

use std::net::SocketAddr;
use thiserror::Error;

use async_std::{net::{TcpStream, TcpListener}, task};
use futures::{AsyncWriteExt, StreamExt, channel::mpsc::channel, SinkExt};

use node::{NodeID, Connection, Network};

#[derive(Default, Clone)]
pub struct TcpNoenc {

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

    async fn listen(listen_addr: Self::Address) -> Result<impl futures::Stream<Item = Result<Connection<Self>, Self::ConnectionError>>, Self::ConnectionError> {

		let listener = TcpListener::bind(listen_addr).await?;

		let (mut conn_sender, conn_stream) = channel::<Result<Connection<Self>, Self::ConnectionError>>(20);

		// Spawn task that listens for incoming connections
        task::spawn(async move {
			let mut incoming = listener.incoming();
			
			while let Some(tcp_stream) = incoming.next().await {
				let conn_result: Result<Connection<Self>, Self::ConnectionError> = try {
					let tcp_stream = tcp_stream?;
					let net_address = tcp_stream.peer_addr()?;

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
		});

		Ok(conn_stream)
    }

    async fn connect(
		self_id: &NodeID,
		self_pub_key: &Self::NodePubKey,
		self_private_key: &Self::NodePrivKey,
		remote_id: &NodeID,
		net_address: &Self::Address,
		remote_pub_key: Option<Self::NodePubKey>,
		persistent_state: Option<Self::PersistentState>,
	) -> Result<Connection<Self>, Self::ConnectionError> {
    	let tcp_stream = TcpStream::connect(net_address).await?;
		let net_address = tcp_stream.peer_addr()?;
		Ok(Connection {
			net_address,
			remote_pub_key: net_address.to_string().as_bytes().to_vec(),
			persistent_state: (),
			read: tcp_stream.clone(),
			write: tcp_stream,
		})
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