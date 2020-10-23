//use libp2p::core::PeerId;
use std::error::Error;
use tokio::{
	sync::mpsc::{self, Sender},
	task::JoinHandle,
};

use dither::{DitherAction, DitherEvent};
pub use dither::{
	ThreadHandle,
	PeerId,
	Client,
	Config,
	Multiaddr,
};

mod types;
pub use types::*;

#[derive(Debug, Clone)]
pub enum DitherChatAction {
	SendMessage(Message, Channel),
	Configure(DitherChatConfig),
	Connect(PeerId),
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
	async fn handle_chat_action(chat_action: DitherChatAction, network_sender: &mut Sender<DitherAction>, event_sender: &mut Sender<DitherChatEvent>, self_sender: &mut Sender<DitherChatAction>) -> Result<(), Box<dyn Error>> {
		match chat_action {
			DitherChatAction::SendMessage(message, channel) => {
				log::info!("Sending Message: {:?} on channel: {:?}", message, channel);
				event_sender.send(DitherChatEvent::ReceivedMessage(message.clone())).await.expect("Channel Closed");
				match channel {
					Channel::FloodSub(topic) => {
						network_sender.send(DitherAction::GossipSubBroadcast(topic, message.serialize())).await?;
					}
					Channel::Peer(_peer) => {
						log::warn!("Unimplemented sending directly to peers");
					}
				}
				
			},
			DitherChatAction::Configure(config) => {
				log::info!("Configuring DitherChat: {:?}", config);
				for addr in config.bootstraps {
					network_sender.send(DitherAction::Dial(addr)).await?;
				}
				if let Some(peer_str) = config.init_peer {
					if let Ok(peer) = peer_str.parse::<PeerId>() {
						self_sender.send(DitherChatAction::Connect(peer)).await?;
					}
				}
				network_sender.send(DitherAction::GossipSubSubscribe(config.gossipsub_topic)).await?;
			},
			DitherChatAction::Connect(peer) => {
				network_sender.send(DitherAction::Connect(peer)).await?;
			}
			//_ => {},
		}
		Ok(())
	}
	async fn handle_dither_event(dither_event: DitherEvent, network_sender: &mut Sender<DitherAction>, event_sender: &mut Sender<DitherChatEvent>, self_sender: &mut Sender<DitherChatAction>) -> Result<(), Box<dyn Error>> {
		match dither_event {
			DitherEvent::ReceivedData(data) => {
				log::info!("Recieved data from network: {:?}", data);
				let msg = serde_json::from_slice(&data)?;
				event_sender.send(DitherChatEvent::ReceivedMessage(msg)).await.expect("App side closed");
			}
		}
		Ok(())
	}
	pub fn start(swarm_handle: ThreadHandle<(), DitherAction, DitherEvent>) -> ThreadHandle<(), DitherChatAction, DitherChatEvent> {
		let (outer_action_sender, mut action_receiver) = mpsc::channel(64);
		let (mut event_sender, outer_event_receiver) = mpsc::channel(64);
		
		let mut error_event_sender = event_sender.clone();
		
		let mut self_sender = outer_action_sender.clone();
		let join = tokio::spawn( async move {
			
			let ThreadHandle { join: network_join, sender: mut network_sender, receiver: mut network_receiver } = swarm_handle;
			let mut n_network_sender = network_sender.clone();
			let mut n_event_sender = event_sender.clone();
			let mut n_self_sender = self_sender.clone();
			
			// App Layer -> Chat Layer -> Network Layer
			let chat_action_join = tokio::spawn(async move {
				network_sender.send(DitherAction::PrintListening).await.expect("Failed to print listening");
				loop {
					if let Some(chat_action) = action_receiver.recv().await {
						if let Err(err) = DitherChat::handle_chat_action(chat_action, &mut network_sender, &mut event_sender, &mut self_sender).await {
							log::error!("Failed to handle DitherChatAction: {:?}", err);
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
					if let Some(dither_event) = network_receiver.recv().await {
						if let Err(err) = DitherChat::handle_dither_event(dither_event, &mut n_network_sender, &mut n_event_sender, &mut n_self_sender).await {
							log::error!("Failed to handle DitherEvent: {:?}", err);
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
				error_event_sender.send(DitherChatEvent::Error(err.to_string())).await.expect("Failed To Send Error");
			}
			
			if let Err(err) = chat_action_join.await {
				log::error!("Dither Chat Panic: {:?}", err);
				error_event_sender.send(DitherChatEvent::Error(err.to_string())).await.expect("Failed To Send Error");
			}
		
			chat_event_join.await.expect("Chat Event Channel Closed");
		});
		
		ThreadHandle { join, sender: outer_action_sender, receiver: outer_event_receiver }
	}
}
