//use libp2p::core::PeerId;

use dither::{DitherAction, DitherEvent};
use tokio::{
	sync::mpsc,
	task::JoinHandle,
};
use serde_derive::{Serialize, Deserialize};
use std::time::SystemTime;

pub use dither::{
	ThreadHandle,
	PeerId,
	Client,
	Config,
};

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

#[derive(Debug, Clone)]
pub enum DitherChatAction {
	SendMessage(Message, Channel),
	//SendMessage(Message, PeerId),
	//UpdateMessage(Message),
	//DeleteMessage(Message),
}
#[derive(Debug)]
pub enum DitherChatEvent {
	Connection(JoinHandle<()>, mpsc::Sender<DitherChatAction>),
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
			let mut output_sender = sender.clone();
			
			// App Layer -> Chat Layer -> Network Layer
			let ThreadHandle { join: network_join, sender: mut network_sender, receiver: mut network_receiver } = swarm_handle;
			let chat_action_join = tokio::spawn(async move {
				loop {
					if let Some(chat_action) = receiver.recv().await {
						use DitherChatAction::*;
						match chat_action {
							SendMessage(message, channel) => {
								log::info!("Sending Message: {:?} on channel: {:?}", message, channel);
								output_sender.send(DitherChatEvent::ReceivedMessage(message.clone())).await.expect("Channel Closed");
								match channel {
									Channel::FloodSub(topic) => {
										if let Err(err) = network_sender.send(DitherAction::FloodSub(topic, message.serialize())).await {
											log::error!("Failed to send floodsub: {:?}", err);
										}
									}
									Channel::Peer(_peer) => {
										log::warn!("Unimplemented sending directly to peers");
									}
								}
								
							},
							//_ => {},
						}
					} else {
						log::info!("All DitherChatAction Senders Closed, Stoping...");
						break;
					}
				}
			});
			// Network Layer -> UI Layer -> App Layer
			let chat_event_join = tokio::spawn(async move {
				loop {
					if let Some(dither_action) = network_receiver.recv().await {
						match dither_action {
							DitherEvent::ReceivedData(data) => {
								log::info!("Recieved data from network: {:?}", data);
								let msg = Message::deserialize(&data).expect("Failed to parse incoming message");
								println!("DESERIALIZED MSG: {:?}", msg);
								sender.send(DitherChatEvent::ReceivedMessage(msg)).await.expect("App side closed");
								println!("DESERIALIZED MSG SENT");
							}
						}
					} else {
						log::info!("Network Layer Stopped...");
						break;
					}
				}
			});
			
			// Propagate Panic when network thread panics
			if let Err(err) = network_join.await {
				log::error!("Dither Network Panic: {:?}", err);
				error_sender.send(DitherChatEvent::Error(err.to_string())).await.expect("Failed To Send Error");
			}
			
			if let Err(err) = chat_action_join.await {
				log::error!("Dither Chat Panic: {:?}", err);
				error_sender.send(DitherChatEvent::Error(err.to_string())).await.expect("Failed To Send Error");
			}
		
			chat_event_join.await.expect("Chat Event Channel Closed");
		});
		
		ThreadHandle { join, sender: outer_sender, receiver: outer_receiver }
	}
}
