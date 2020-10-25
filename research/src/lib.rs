#![allow(dead_code)]
#![allow(unused_imports)]

use std::{
	collections::hash_map::DefaultHasher,
	hash::{Hash, Hasher},
	time::Duration,
	error::Error,
};

use tokio::sync::mpsc::{self, Sender, Receiver};
use tokio::task::JoinHandle;
use libp2p::{
	Swarm,
	Transport,
	core::upgrade,
	floodsub::{self, Floodsub, Topic, FloodsubEvent},
	//gossipsub::{protocol::MessageId, GossipsubMessage, GossipsubEvent, MessageAuthenticity, Topic, self},
	mdns::TokioMdns, // `TokioMdns` is available through the `mdns-tokio` feature.
	mplex,
	noise,
	swarm::SwarmBuilder, // `TokioTcpConfig` is available through the `tcp-tokio` feature.
	tcp::TokioTcpConfig,
	swarm::NetworkBehaviour,
};
pub use libp2p::{
	PeerId,
	Multiaddr,
	identity::Keypair,
};

mod behaviour;
use behaviour::DitherBehaviour;
pub use behaviour::DitherEvent;

pub mod config;
pub use config::Config;
pub mod types;
pub use types::User;

/// Base structure of a Dither Network.
/// Contains all the necessary information to run a Node
/// There should only be one of these across all instances of applications using Dither
pub struct Node {
	/// Each Node has its own keys apart from `User` keys for baseline secure communcation between nodes
	key: Keypair,
	peer_id: PeerId,
	/// `Swarm` object for managing behaviour and connected nodes
	swarm: Swarm<DitherBehaviour, PeerId>,
	/// General Configuration for the node (e.g. developer mode / test features)
	config: Config,
	/// Users of the network
	/// There can be any number of these created by different applications for different purposes (or shared between applications)
	/// All information is stored in the `User` objects
	users: Vec<Box<User>>
}
#[derive(Debug)]
pub enum DitherAction {
	/// Create new user, `User` object will be sent back to the application that requested
	CreateUser(),
	
	Bootstrap(Multiaddr),
	
	Connect(User),
	
	
	PubSubSubscribe(String),
	PubSubUnsubscribe(String),
	PubSubBroadcast(String, Vec<u8>),
	//FloodSub(String, String), // Going to be a lot more complicated
	PrintListening,
	None,
}

pub struct ThreadHandle<Return, ActionObject, EventObject> {
	pub join: JoinHandle<Return>,
	pub sender: Sender<ActionObject>,
	pub receiver: Receiver<EventObject>,
}

impl Node {
	pub fn new(config: Config) -> Result<Node, Box<dyn Error>> {
		let key = Keypair::generate_ed25519();
		let peer_id = PeerId::from(key.public());
		
		let noise_keys = noise::Keypair::<noise::X25519Spec>::new()
			.into_authentic(&key)?;
		let transport = TokioTcpConfig::new().nodelay(true)
			.upgrade(upgrade::Version::V1)
			.authenticate(noise::NoiseConfig::xx(noise_keys).into_authenticated())
			.multiplex(mplex::MplexConfig::new())
			.boxed();
			
		let behaviour = behaviour::DitherBehaviour::new(peer_id.clone(), TokioMdns::new()?);
		
		Ok(Node {
			key: key.clone(),
			peer_id: peer_id.clone(),
			swarm: SwarmBuilder::new(transport, behaviour, peer_id)
				.executor(Box::new(|fut| { tokio::spawn(fut); }))
				.build(),
			config,
		})
	}
	pub fn connect(&mut self) -> Result<(), Box<dyn Error>> {
		Swarm::listen_on(&mut self.swarm, "/ip4/0.0.0.0/tcp/0".parse()?)?;
		log::info!("Local peer id: {:?}", self.user.peer_id);
		
		Ok(())
	}
	fn parse_dither_action(&mut self, action: DitherAction) -> Result<(), Box<dyn Error>> {
		match action {
			DitherAction::PubSubBroadcast(topic, data) => {
				log::info!("Broadcasting: {:?}", String::from_utf8_lossy(&data));
				self.swarm.broadcast(Topic::new(topic), data);
			},
			DitherAction::PubSubSubscribe(topic) => {
				log::info!("Subscribing: {:?}", topic);
				self.swarm.subscribe(Topic::new(topic));
			},
			DitherAction::PubSubUnsubscribe(topic) => {
				self.swarm.unsubscribe(Topic::new(topic));
			},
			DitherAction::Dial(addr) => {
				log::info!("Dialing: {}", addr);
				Swarm::dial_addr(&mut self.swarm, addr)?;
				//self.swarm.floodsub.add_node_to_partial_view(peer);
			},
			DitherAction::Connect(peer) => {
				self.swarm.add_peer(peer);
			},
			DitherAction::PrintListening => {
				for addr in Swarm::listeners(&self.swarm) {
					log::info!("Listening on: {:?}", addr);
				}
			},
			DitherAction::None => {},
			//_ => { log::error!("Unimplemented DitherAction: {:?}", action) },
		}
		Ok(())
	}
	pub fn start(mut self) -> ThreadHandle<(), DitherAction, DitherEvent> {
		// Listen for
		let (outer_sender, mut receiver) = mpsc::channel(64);
		let (mut sender, outer_receiver) = mpsc::channel(64);
		
		//let self_sender = outer_sender.clone();
		
		// Receiver thread
		let join = tokio::spawn(async move {
			loop {
				let potential_action = {
					tokio::select! {
						// Await Actions from Higher Layers
						received_action = receiver.recv() => {
							if received_action.is_none() {
								log::info!("All Senders Closed, Stopping...");
								break;
							}
							received_action
						},
						// Await events from swarm
						event = self.swarm.next() => {
							// When Receive Event, send to receiver thread
							log::info!("New Event: {:?}", event);
							if let Err(err) = sender.try_send(event) {
								log::error!("Network Thread could not send event: {:?}", err);
							}
							None
						}
					}
				};
				if let Some(action) = potential_action {
					log::info!("Network Action: {:?}", action);
					if let Err(err) = self.parse_dither_action(action) {
						log::error!("Failed to parse DitherAction: {:?}", err);
					}
				}
			}
			log::info!("Network Layer Ended");
		});
		ThreadHandle { join, sender: outer_sender, receiver: outer_receiver }
	}
}


