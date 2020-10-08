//use libp2p::core::PeerId;

use dither::{DitherAction, DitherEvent};
use tokio::sync::mpsc::{self}; //, Sender, Receiver};
use serde_derive::{Serialize, Deserialize};
use serde::Serializer;
use std::time::SystemTime;

pub use dither::ThreadHandle;
pub use dither::PeerId;

#[derive(Debug, Clone)]
pub enum DitherChatAction {
	BroadcastMessage(Message),
	SendMessage(Message, PeerId),
	UpdateMessage(Message),
	DeleteMessage(Message),
}
#[derive(Debug, Clone)]
pub enum DitherChatEvent {
	ReceivedMessage(Message),
	Error(String),
}

pub struct DitherChat {
	// Internal chat state
}

impl DitherChat {
	pub fn start(swarm_handle: ThreadHandle<(), DitherAction, DitherEvent>) -> ThreadHandle<(), DitherChatAction, DitherChatEvent> {
		let (outer_sender, mut receiver) = mpsc::channel(64);
		let (mut sender, outer_receiver) = mpsc::channel(64);
		
		let join = tokio::spawn( async move {
			let mut error_sender = sender.clone();
			
			// App Layer -> Chat Layer -> Network Layer
			let ThreadHandle { join: network_join, sender: mut network_sender, receiver: mut network_receiver } = swarm_handle;
			let chat_action_join = tokio::spawn(async move {
				if let Some(chat_action) = receiver.recv().await {
					use DitherChatAction::*;
					match chat_action {
						BroadcastMessage(msg) => {
							network_sender.send(DitherAction::FloodSub("chat".to_owned(), msg.serialize())).await.expect("Failed");
						},
						_ => {},
					}
				}
			});
			// Network Layer -> UI Layer -> App Layer
			let chat_event_join = tokio::spawn(async move {
				if let Some(dither_action) = network_receiver.recv().await {
					use DitherEvent::*;
					match dither_action {
						ReceivedData(data) => {
							let msg = Message::deserialize(&data).expect("Failed to parse incoming message");
							sender.send(DitherChatEvent::ReceivedMessage(msg)).await.expect("App side closed");
						}
					}
				}
			});
			
			// Propagate Panic when network thread panics
			if let Err(err) = network_join.await {
				log::error!("Dither Chat Error: {:?}", err);
				error_sender.send(DitherChatEvent::Error(err.to_string())).await.expect("Failed To Send Error");
			}
			
			if let Err(err) = chat_action_join.await {
				log::error!("Dither Chat Error: {:?}", err);
				error_sender.send(DitherChatEvent::Error(err.to_string())).await.expect("Failed To Send Error");
			}
		
			chat_event_join.await.expect("Chat Event Channel Closed");
		});
		
		ThreadHandle { join, sender: outer_sender, receiver: outer_receiver }
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
	pub fn new(content: String) -> Self {
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