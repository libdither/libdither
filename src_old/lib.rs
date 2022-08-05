#![allow(dead_code)]
#![allow(unused_imports)]

use std::{
	collections::hash_map::DefaultHasher,
	collections::HashMap,
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

pub mod types;
pub use types::*;
pub mod config;
pub use config::DitherConfig;
pub mod user;
pub use user::*;
pub mod routing;
pub use routing;

/// The Dither object, runs the swarm
/// Contains all the necessary information to run a Node
/// There should only be one of these across all instances of applications using Dither
pub struct Dither {
	/// Node data
	/// Each Node has its own keys apart from `User` keys for baseline secure communcation between nodes
	key: Keypair,
	peer_id: PeerId,
	
	/// General Configuration for the node (e.g. developer mode / test features)
	//config: Config,
	
	/// Users of the network
	/// There can be any number of these created by different applications for different purposes (or shared between applications)
	/// All information is stored in the `User` objects
	/// Applications can Authenticate into existing users with some token(s) (e.g. password, 2auth key, temp application token) or private key
	users: HashMap<UserId, User>,
	/// Dither configuration
	config: DitherConfig,
	/// `Swarm` object for managing behaviour and connected nodes
	swarm: Swarm<DitherBehaviour, PeerId>,
}

#[derive(Debug)]
pub enum DitherAction {
	/// Create new user, `User` and `NetworkKey` object will be sent back to the application that requested a new user
	CreateUser(),
	/// Bootstrap node for initial nat connection (choose this with care, MITM attacks beware)
	Bootstrap(Multiaddr),
	
	/// Discover this user and nodes related to it
	/// Fetch public user data from network and store locally. Network Tree Request will be made if user is not locally stored
	Discover(UserId),
	
	/// Authenticate as user for application
	/// Will return `NetworkKey` of the user if found locally
	/// If User is not found locally, `DitherAction::Discover` should be called to resolve hosting node
	/// Node will send back `NetworkKey` (may be temporary priv key) and `User` object (`User` object will contain instructions on how to route messages, etc.)
	Authenticate(UserId, UserToken),
	
	/// This will attempt to connect to a User on the network
	/// If user is found, UserConnection will be sent to the application
	Connect(UserId, Application),
	/// Send data on an application to specific UserId
	/// If Public Id and Hosting Nodes of User is known, data is sent to desired node encrypted with public key
	SendData(UserConnection, Vec<u8>),
	
	//PubSubSubscribe(String),
	//PubSubUnsubscribe(String),
	//PubSubBroadcast(String, Vec<u8>),
	//FloodSub(String, String), // Going to be a lot more complicated
	/// [Debug] Print listening addrs to console
	PrintListening,
}

pub struct ThreadHandle<Return, ActionObject, EventObject> {
	pub join: JoinHandle<Return>,
	pub sender: Sender<ActionObject>,
	pub receiver: Receiver<EventObject>,
}

impl Dither {
	pub fn new(config: DitherConfig) -> Result<Dither, Box<dyn Error>> {
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
		
		Ok(Dither {
			node: Node {
				
			}
			key: key.clone(),
			peer_id: peer_id.clone(),
			swarm: SwarmBuilder::new(transport, behaviour, peer_id)
				.executor(Box::new(|fut| { tokio::spawn(fut); }))
				.build(),
			config,
			users: Vec::new(),
		})
	}
	pub fn connect(&mut self) -> Result<(), Box<dyn Error>> {
		Swarm::listen_on(&mut self.swarm, "/ip4/0.0.0.0/tcp/0".parse()?)?;
		log::info!("Local peer id: {:?}", self.user.peer_id);
		
		Ok(())
	}
	fn parse_dither_action(&mut self, action: DitherAction) -> Result<(), Box<dyn Error>> {
		match action {
			/// Create new user, `User` and `NetworkKey` object will be sent back to the application that requested a new user
			CreateUser(),
			Bootstrap(Multiaddr),
			Discover(UserId),
			Authenticate(UserId, UserToken),
			Connect(UserId, Application),
			SendData(UserConnection, Vec<u8>),
		
			DitherAction::PrintListening => {
				for addr in Swarm::listeners(&self.swarm) {
					log::info!("Listening on: {:?}", addr);
				}
			},
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


