
use serde_derive::{Serialize, Deserialize};
use std::time::SystemTime;

use dither::{
	Multiaddr,
	PeerId,
	Keypair,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DitherChatConfig {
	pub bootstraps: Vec<Multiaddr>,
	pub init_peer: Option<String>,
	pub pubsub_topic: String,
}
impl DitherChatConfig {
	pub fn new(bootstrap: Option<Multiaddr>, init_peer: Option<String>, topic: String) -> DitherChatConfig {
		Self {
			bootstraps: if let Some(addr) = bootstrap { vec![addr] } else { vec![] },
			init_peer,
			pubsub_topic: topic,
		}
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
	pub content: String, // Markdown text
	pub sender: Option<String>, // Peer ID of sender (base 58-encoded hash of public key) // TODO: Should this be encoded as something else?
	pub attachment: Vec<u8>, // Additional data attached to message
	pub time_sent: SystemTime, // Time sent
	pub last_edited: Option<SystemTime>, // (Optional if edited, last time edited)
	// reactions: Vec<Reaction>,
}
impl Message {
	pub fn new(content: &str) -> Self {
		Self {
			content: content.to_owned(),
			sender: None,
			attachment: Vec::new(),
			time_sent: SystemTime::now(),
			last_edited: None,
		}
	}
	pub fn deserialize(data: &str) -> Result<Self, serde_json::Error> {
		serde_json::from_str::<Message>(data)
	}
	pub fn serialize(&self) -> String {
		serde_json::to_string(self).expect("Failed to Serialize, This should not happen") // TODO: Report Error better
	}
}

#[derive(Debug, Clone)]
pub enum Channel {
	FloodSub(String),
	Peer(PeerId),
}
