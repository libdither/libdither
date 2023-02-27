//! Defines all the generic components of a node interacting with an internet structure.
//! A Node should be able to work in any kind of network. simulated or not. This file provides the basic structures that any network implementation will use to interact with a Node, in addition to any structures a User will use to interact with the network implementation and by extension, the Node.

use std::fmt;
use bevy_ecs::{prelude::Component, system::Resource};
use bytecheck::CheckBytes;
use futures::{AsyncRead, AsyncWrite, Stream, stream::FusedStream};
use rkyv::{Serialize, Archive, ser::{serializers::{CompositeSerializer, AlignedSerializer, FallbackScratch, HeapScratch, AllocScratch, SharedSerializeMap}}, Deserialize, AlignedVec, validation::validators::DefaultValidator, Infallible};

use crate::NodeID;

/// Trait that establishes encrypted connection to another computer
pub trait Network: fmt::Debug + Resource + Clone + 'static {
	/// Address used to establish a connection with some other node over a network.
	type Address: Clone + PartialEq + Eq + std::hash::Hash + fmt::Debug + fmt::Display + for<'de> serde::Deserialize<'de> + serde::Serialize
	+ for<'b> Serialize<CompositeSerializer<AlignedSerializer<&'b mut AlignedVec>, FallbackScratch<HeapScratch<256_usize>, AllocScratch>, SharedSerializeMap>>
	+ Archive<Archived = Self::ArchivedAddress> + Send + Sync;
	/// Archived version of `Network::Address`
	type ArchivedAddress: fmt::Debug + Deserialize<Self::Address, Infallible> + for<'v> CheckBytes<DefaultValidator<'v>> + Send + Sync;

	/// Public key of a node, optionally passed to connect(). 
	type NodePubKey: AsRef<[u8]> + Send + Sync + Clone + fmt::Debug;
	/// Private key of local node
	type NodePrivKey: Send + Sync + Clone;
	/// Persistent state can be optionally passed to connect(), stores stuff like symmetric keys, forward secrecy stuff, etc.
	type PersistentState: Send + Sync + Clone;

	/// Bidirectional byte stream for sending and receiving NodePackets
	type Read: AsyncRead + Send + Sync + Unpin;
	type Write: AsyncWrite + Send + Sync + Unpin;

	/// Error emitted by encrypted transport protocol when establishing connection
	type ConnectionError: std::error::Error + Send + Sync + fmt::Debug + fmt::Display;

	/// Initiates the network with some Config. Returns Self as a handle as well as a stream of `Connection`s. If the stream is dropped, the implementation must ensure everything is cleaned up.
	async fn init(config: NetConfig<Self>) -> Result<(Self, impl Stream<Item = Result<Connection<Self>, Self::ConnectionError>> + Unpin + FusedStream), Self::ConnectionError>;

	/// Establish two-way connection with remote, returns immediately.
	fn connect(
		&self,
		remote_id: NodeID,
		net_address: Self::Address,
		remote_pub_key: Option<Self::NodePubKey>,
		persistent_state: Option<Self::PersistentState>,
	);

	/// Listen to some new set of addresses
	fn listen(&self, addrs: impl Iterator<Item = Self::Address>);
}

pub struct NetConfig<Net: Network> {
	pub private_key: Net::NodePrivKey,
	pub public_key: Net::NodePubKey,
	pub listen_addrs: Vec<Net::Address>,
}

/// Represents an encrypted two-way bytestream to another computer, identified by its NodeID and arbitrary network address.
#[derive(Component)]
pub struct Connection<Net: Network> {
	pub net_address: Net::Address,
	pub remote_pub_key: Net::NodePubKey,
	pub persistent_state: Net::PersistentState,
	pub read: Net::Read,
	pub write: Net::Write,
}
impl<Net: Network> fmt::Debug for Connection<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.debug_struct("Connection").field("net_address", &self.net_address).finish() }
}
