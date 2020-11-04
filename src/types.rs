

use libp2p::identity::{Keypair, PublicKey};

/// Contains all information pertaining to a specific user of the Dither Network
pub struct NetworkKey {
	key: Keypair,
	id: PeerId,
}

use std::fmt;
impl fmt::Debug for NetworkKey {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		f.debug_struct("User")
		.field("id", &self.id)
        .finish()
    }
}

impl NetworkKey {
	pub fn new() -> NetworkKey {
		let key = Keypair::generate_ed25519();
		let peer_id = UserId::from(key.public());
		NetworkKey {
			key,
			id: peer_id,
		}
	}
}

#[derive(Debug, Clone)]
pub struct Application {
	tag: String,
}
/*pub enum Application {
	DitherChat = 0,
	DitherSCP = 1,
	DitherDB = 2,
}*/