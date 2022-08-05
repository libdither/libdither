//! Non-encrypted encryption TODO: Implement real encryption with noise protocol & perhaps https/tls

use futures::AsyncWriteExt;

use node::{NodeID, net::{Connection, Network}};

#[derive(Error, Debug)]
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
	let node_id = NodeID::from_async_reader(&mut read).await?;
	if node_id == *connecting_id { // Verify remote ID
		Ok(Connection { node_id, addr: connecting_addr, read, write })
	} else {
		Err(EncryptionError::InvalidNodeID { addr: connecting_addr, expected: connecting_id.clone(), found: node_id })
	}
	
}

// When handling incoming session, read connecting node_id and write own node_id
pub async fn encrypt_incoming<Net: Network>(mut read: Net::Read, mut write: Net::Write, my_id: &NodeID, incoming_addr: Net::Address) -> Result<Connection<Net>, EncryptionError<Net>> {
	let incoming_node_id = NodeID::from_async_reader(&mut read).await.map_err(|_|EncryptionError::BadHash)?;
	write.write(my_id.as_bytes()).await?;
	Ok(Connection { node_id: incoming_node_id, addr: incoming_addr, read, write })
}