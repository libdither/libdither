type UserId = PeerId;

use libp2p::identity::Keypair;

/// Contains all information pertaining to a specific user of the Dither Network
pub struct User {
	key: Keypair,
	id: UserId,
}

use std::fmt;
impl fmt::Debug for User {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		f.debug_struct("User")
		.field("id", &self.id)
        .finish()
    }
}

impl User {
	pub fn create() -> User {
		
	}
}