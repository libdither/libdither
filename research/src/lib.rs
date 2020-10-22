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
	identity::Keypair,
	//floodsub::{self, Floodsub},
	gossipsub::{protocol::MessageId, GossipsubMessage, GossipsubEvent, MessageAuthenticity, Topic, self},
	//mdns::TokioMdns, // `TokioMdns` is available through the `mdns-tokio` feature.
	mplex,
	noise,
	swarm::SwarmBuilder, // `TokioTcpConfig` is available through the `tcp-tokio` feature.
	tcp::TokioTcpConfig,
};
pub use libp2p::{
	PeerId,
	Multiaddr,
};

mod behaviour;
use behaviour::DitherBehaviour;

pub mod config;
pub use config::Config;

pub struct User {
	key: Keypair,
	peer_id: PeerId,
}
pub struct Client {
	swarm: Swarm<gossipsub::Gossipsub, PeerId>,
	config: Config,
	user: User,
}
#[derive(Debug)]
pub enum DitherAction {
	Connect(PeerId),
	Dial(Multiaddr),
	
	GossipSubSubscribe(String),
	GossipSubUnsubscribe(String),
	GossipSubBroadcast(String, String),
	//FloodSub(String, String), // Going to be a lot more complicated
	PrintListening,
	None,
}
#[derive(Debug)]
pub enum DitherEvent {
	ReceivedData(String),
}

pub struct ThreadHandle<Return, ActionObject, EventObject> {
	pub join: JoinHandle<Return>,
	pub sender: Sender<ActionObject>,
	pub receiver: Receiver<EventObject>,
}

impl Client {
	pub fn new(config: Config) -> Result<Client, Box<dyn Error>> {
		let key = Keypair::generate_ed25519();
		let peer_id = PeerId::from(key.public());
		let user = User {
			key: key.clone(),
			peer_id: peer_id.clone(),
		};
		
		let noise_keys = noise::Keypair::<noise::X25519Spec>::new()
			.into_authentic(&key)
			.expect("Signing libp2p-noise static DH keypair failed.");
		
		// Set up a an encrypted DNS-enabled TCP Transport over the Mplex and Yamux protocols
		let transport = {
			if config.dev_mode {
				TokioTcpConfig::new().nodelay(true)
					.upgrade(upgrade::Version::V1)
					.authenticate(noise::NoiseConfig::xx(noise_keys).into_authenticated())
					.multiplex(mplex::MplexConfig::new())
					.boxed()
				//libp2p::build_development_transport(key.clone())? // Use base "development" transport
			} else {
				panic!("Custom Transports not implemented yet"); // TODO: Create custom transport based on config
			}
		};
		
		let swarm = {
			//let mdns = TokioMdns::new()?;
			/*let mut behaviour = DitherBehaviour {
				floodsub: Floodsub::new(peer_id.clone()),
				//mdns,
				ignored_member: false,
			};*/
			
			//let floodsub_topic = floodsub::Topic::new(config.pubsub_topic.clone());
			//behaviour.floodsub.subscribe(floodsub_topic);
			
			let message_id_fn = |message: &GossipsubMessage| {
				let mut s = DefaultHasher::new();
				message.data.hash(&mut s);
				MessageId::from(s.finish().to_string())
			};
	
			// set custom gossipsub
			let gossipsub_config = gossipsub::GossipsubConfigBuilder::new()
				.heartbeat_interval(Duration::from_secs(10))
				.message_id_fn(message_id_fn) // content-address messages. No two messages of the
				//same content will be propagated.
				.build();
			// build a gossipsub network behaviour
			let mut gossipsub =
				gossipsub::Gossipsub::new(MessageAuthenticity::Signed(key), gossipsub_config);
			//gossipsub.subscribe(topic.clone());
			
			SwarmBuilder::new(transport, gossipsub, user.peer_id.clone())
			.executor(Box::new(|fut| { tokio::spawn(fut); }))
			.build()
		};
		let client = Client {
			swarm,
			config,
			user,
		};
		Ok(client)
	}
	pub fn connect(&mut self) -> Result<(), Box<dyn Error>> {
		Swarm::listen_on(&mut self.swarm, "/ip4/0.0.0.0/tcp/0".parse()?)?;
		log::info!("Local peer id: {:?}", self.user.peer_id);
		
		Ok(())
	}
	fn parse_ditheraction(&mut self, action: DitherAction) -> Result<(), Box<dyn Error>> {
		match action {
			DitherAction::GossipSubBroadcast(topic, data) => {
				self.swarm.publish(&Topic::new(topic), data);
			},
			DitherAction::GossipSubSubscribe(topic) => {
				self.swarm.subscribe(Topic::new(topic));
			},
			DitherAction::GossipSubUnsubscribe(topic) => {
				self.swarm.unsubscribe(Topic::new(topic));
			},
			DitherAction::Dial(addr) => {
				log::info!("Dialing: {}", addr);
				Swarm::dial_addr(&mut self.swarm, addr)?;
				//self.floodsub.add_node_to_partial_view(peer);
			},
			DitherAction::PrintListening => {
				for addr in Swarm::listeners(&self.swarm) {
					log::info!("Listening on: {:?}", addr);
				}
			}
			_ => { log::error!("Unimplemented DitherAction: {:?}", action) },
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
				let action = {
					tokio::select! {
						// Await Actions from Higher Layers
						received_action = receiver.recv() => {
							if let Some(ret) = received_action { ret }
							else {
								log::info!("All Senders Closed, Stopping...");
								break;
							}
						},
						// Await events from swarm
						event = self.swarm.next() => {
							// When Receive Event, send to receiver thread
							
							log::info!("New Event: {:?}", event);
							/*match event {
								
							}*/
							if let Err(err) = sender.try_send(DitherEvent::ReceivedData("This is some data".to_owned())) {
								log::error!("Network Thread could not send event: {:?}", err);
							}
							DitherAction::None
						}
					}
				};
				log::info!("Network Action: {:?}", action);
				if let Err(err) = self.parse_ditheraction(action) {
					log::error!("Failed to parse DitherAction: {:?}", err);
				}
			}
			log::info!("Network Layer Ended");
		});
		ThreadHandle { join, sender: outer_sender, receiver: outer_receiver }
	}
}


