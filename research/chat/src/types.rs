
use serde_derive::{Serialize, Deserialize};
use std::time::SystemTime;

use dither::{
	Multiaddr,
	PeerId,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DitherChatConfig {
	pub bootstraps: Vec<Multiaddr>,
}
impl DitherChatConfig {
	pub fn new(peer: Option<Multiaddr>) -> DitherChatConfig {
		Self {
			bootstraps: if let Some(peer) = peer { vec![peer] } else { vec![] },
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