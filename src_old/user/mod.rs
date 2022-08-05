
use libp2p::{
	PeerId, 
	Multiaddr, 
	identity::PublicKey
};
use libp2p::multihash::Multihash;

use crate::types::{NetworkKey, Application};
pub type UserId = PeerId;

/// Defines a user, e.g. a collection of relevant peers and information
/// Updated User Definitions will be accepted by nodes updated if a new one is produced with enough agreeing parties to compute a ring signature with a high enough threshold
pub struct PublicUserDefinition {
	/// Hash of previous UserDefinition (for easy tracking between versions)
	previous_definition: Option<Multihash>,
	/// Data unique to the user, contains anything relevent to the permission level of this data
	/// E.g. this would store name, bio, pfp, other data if this definition was publicly listed
	data: HashMap<String, Multihash>,
	/// Applications API this user publicly supports
	/// E.g. "dither/1.0.0/chat/1.0.0" would signify that this user uses dither-chat version 1.0.0
	applications: Vec<String>,
	/// Public keys that have access to update this definition
	keys: Vec<PublicKey>,
	/// Must have at least this amount of signing keys to link a new user definition
	/// TODO: This will be replaced in the future by some kind of advanced, permissioned key update where different keys have more power over others
	update_threshold: u32,
	/// Threshold Ring Signature computed on this object with enough update_keys to be >/= update_threshold
	///ring_signature: nazgul::
}

#[derive(Debug, Clone)]
pub struct User {
	public: UserDefinition,
	requested: UserDefinition,
	config: UserConfig,
	
	/// ID of the User (Multihash of the Public Key)
	id: UserId,
	/// Public Key of this user
	public_key: PublicKey,
	/// Other users this user knows about
	users: Vec<User>, // Data on other users
	/// Nodes this user
	user_nodes: Vec<UserNode>, // Nodes connected to
}