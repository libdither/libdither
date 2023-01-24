//! Defines all the generic components of a node interacting with an internet structure.
//! A Node should be able to work in any kind of network. simulated or not. This file provides the basic structures that any network implementation will use to interact with a Node, in addition to any structures a User will use to interact with the network implementation and by extension, the Node.

use std::fmt;
use futures::{AsyncRead, AsyncWrite};

use crate::{NodeID};

/// Trait that establishes encrypted connection to another computer
pub trait Network
{
	/// Address used to establish a connection with some other node over a network.
	type Address: Clone + PartialEq + Eq + std::hash::Hash + fmt::Debug + Send + Sync + fmt::Display + for<'de> serde::Deserialize<'de> + serde::Serialize;

	/// Public key of a node, optionally passed to connect(). 
	type NodePubKey: AsRef<[u8]>;
	/// Private key of local node
	type NodePrivKey;
	/// Persistent state can be optionally passed to connect(), stores stuff like symmetric keys, forward secrecy stuff, etc.
	type PersistentState;

	/// Bidirectional byte stream for sending and receiving NodePackets
	type Read: AsyncRead + Send + Sync + Unpin;
	type Write: AsyncWrite + Send + Sync + Unpin;

	/// Error emitted by encrypted transport protocol when establishing connection
	type ConnectionError: std::error::Error + Send + Sync + fmt::Debug + fmt::Display;

	/// Verify the public key with the node id
	fn verify_public_key(node: NodeID, pub_key: Self::NodePubKey) -> bool;

	/// Establish two-way connection with remote
	async fn connect(
		self_id: &NodeID,
		self_pub_key: &Self::NodePubKey,
		self_private_key: &Self::NodePrivKey,
		remote_id: NodeID,
		remote_pub_key: Option<Self::NodePubKey>,
		persistent_state: Option<Self::PersistentState>,
		net_address: Self::Address
	) -> Result<(Self::Read, Self::Write, Self::NodePubKey, Self::PersistentState), Self::ConnectionError>;
}

/// Represents an encrypted two-way bytestream to another computer, identified by its NodeID and arbitrary network address.
pub struct Connection<Net: Network> {
	pub node_id: NodeID,
	pub addr: Net::Address,
	pub read: Net::Read,
	pub write: Net::Write,
	pub pub_key: Net::NodePubKey,
	pub state: Net::PersistentState,
}
impl<Net: Network> fmt::Debug for Connection<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.debug_struct("Connection").field("addr", &self.addr).finish() }
}
