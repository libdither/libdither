//! Defines all the generic components of a node interacting with an internet structure.
//! A Node should be able to work in any kind of network. simulated or not. This file provides the basic structures that any network implementation will use to interact with a Node, in addition to any structures a User will use to interact with the network implementation and by extension, the Node.

use std::fmt;
use bevy_ecs::{prelude::Component, system::Resource};
use bytecheck::CheckBytes;
use futures::{AsyncRead, AsyncWrite, Stream, stream::FusedStream};
use rkyv::{Serialize, Archive, ser::{serializers::{CompositeSerializer, AlignedSerializer, FallbackScratch, HeapScratch, AllocScratch, SharedSerializeMap}}, Deserialize, AlignedVec, validation::validators::DefaultValidator, Infallible};

use crate::NodeID;

/// Configures the encryption of the network.
#[derive(Clone)]
pub struct EncryptionKeys<Net: Network> {
	pub private_key: Net::NodePrivKey,
	pub public_key: Net::NodePubKey,
}

/// Trait that establishes encrypted connection to another computer
pub trait Network: fmt::Debug + Resource + Clone + 'static {
	/// Address used to establish a connection with some other node over a network.
	type Address: Clone + PartialEq + Eq + std::hash::Hash + fmt::Debug + fmt::Display + for<'de> serde::Deserialize<'de> + serde::Serialize
	+ for<'b> Serialize<CompositeSerializer<AlignedSerializer<&'b mut AlignedVec>, FallbackScratch<HeapScratch<256_usize>, AllocScratch>, SharedSerializeMap>>
	+ Archive<Archived = Self::ArchivedAddress> + Send + Sync;
	/// Archived version of `Network::Address`
	type ArchivedAddress: fmt::Debug + Deserialize<Self::Address, Infallible> + for<'v> CheckBytes<DefaultValidator<'v>> + Send + Sync;

	/// Public key of a node, optionally passed to connect(). 
	type NodePubKey: AsRef<[u8]> + fmt::Debug + serde::Serialize + for<'d> serde::Deserialize<'d> + Send + Sync + Clone;
	/// Private key of local node
	type NodePrivKey: Clone + Send + Sync;
	/// Persistent state can be optionally passed to connect(), stores stuff like symmetric keys, forward secrecy stuff, etc.
	type PersistentState: Clone + Send + Sync;

	/// Bidirectional byte stream for sending and receiving NodePackets
	type Read: AsyncRead + Unpin + Send + Sync;
	type Write: AsyncWrite + Unpin + Send + Sync;

	/// Error emitted by encrypted transport protocol when establishing connection
	type ConnectionError: std::error::Error + fmt::Debug + fmt::Display + Send + Sync;

	/// Configuration type for how the network receives connections.
	type ListenerConfig: Resource + fmt::Debug + Clone + Send + Sync;

	/// Initiates the network with some Config. Returns Self as a handle as well as a stream of `Connection`s. If the stream is dropped, the implementation must ensure everything is cleaned up.
	async fn init(keys: EncryptionKeys<Self>, listener_config: &Self::ListenerConfig) -> Result<(Self, impl Stream<Item = Result<Connection<Self>, Self::ConnectionError>> + Unpin + FusedStream), Self::ConnectionError>;

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

	/// Given a public address reported back by a connected node, try to figure out what addresses this node could be listening publically on.
	fn predict_public_addresses<'a>(addr: &'a Self::Address, config: &'a Self::ListenerConfig) -> impl Iterator<Item = Self::Address> + 'a;
}

/// Represents an encrypted two-way bytestream to another computer, identified by its NodeID and arbitrary network address.
#[derive(Component)]
pub struct Connection<Net: Network> {
	pub incoming_address: Net::Address,
	pub remote_pub_key: Net::NodePubKey,
	pub persistent_state: Net::PersistentState,
	pub read: Net::Read,
	pub write: Net::Write,
	/// Whether or not the connection was requested via connect() or was incoming.
	pub requested: bool,
}
impl<Net: Network> fmt::Debug for Connection<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.debug_struct("Connection").field("net_address", &self.incoming_address).finish() }
}