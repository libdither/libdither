use libp2p::core::PeerId;
use serde_derive::{Deserialize, Serialize};

pub enum DitherType {
	Message(DitherMessage),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DitherMessage {
	content: String, // Markdown text
	user: PeerId, // Peer ID of sender
	attachment: Vec<u8>, //
	time_send: SystemTime, // Time sent
	last_edited: Option<SystemTime>, // (Optional if edited, last time edited)
	// reactions: Vec<Reaction>,
}
