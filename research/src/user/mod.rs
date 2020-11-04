
use libp2p::{PeerId, Multiaddr, identity::PublicKey};
use crate::types::{NetworkKey, Application};
pub type UserId = PeerId;

#[derive(Debug)]
pub struct UserToken {
	token: String, // Token that can be used to authenticate with any node that is contributing to hosting a user account
}

#[derive(Debug, Clone)]
pub struct UserNode {
	addr: Multiaddr,
	id: PeerId,
}

#[derive(Debug, Clone)]
pub struct UserConnection {
	id: UserId,
	application: Application,
}

#[derive(Debug, Clone)]
pub struct User {
	/// ID of the User (Multihash of the Public Key)
	id: UserId,
	/// Public Key of this user
	public_key: PublicKey,
	/// Other users this user knows about
	users: Vec<User>, // Data on other users
	/// Nodes this user
	user_nodes: Vec<UserNode>, // Nodes connected to
}