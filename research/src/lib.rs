#![allow(dead_code)]

use tokio::sync::mpsc::{self, Sender, Receiver};
use tokio::task::JoinHandle;
use libp2p::{
	Swarm,
	Transport,
	core::upgrade,
	identity::Keypair,
	floodsub::{self, Floodsub},
	mdns::TokioMdns, // `TokioMdns` is available through the `mdns-tokio` feature.
	mplex,
	noise,
	swarm::SwarmBuilder, // `TokioTcpConfig` is available through the `tcp-tokio` feature.
	tcp::TokioTcpConfig,
};
pub use libp2p::PeerId;

use std::error::Error;

mod behaviour;
use behaviour::DitherBehaviour;

pub mod config;
pub use config::Config;

pub struct User {
	key: Keypair,
	peer_id: PeerId,
}

pub struct Client {
	swarm: Swarm<DitherBehaviour, PeerId>,
	config: Config,
	user: User,
}
#[derive(Debug)]
pub enum DitherAction {
	Empty,
	Connect(PeerId),
	FloodSub(String, String), // Going to be a lot more complicated
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
			let mdns = TokioMdns::new()?;
			let mut behaviour = DitherBehaviour {
				floodsub: Floodsub::new(peer_id.clone()),
				mdns,
				ignored_member: false,
			};
			
			let floodsub_topic = floodsub::Topic::new(config.pubsub_topic.clone());
			behaviour.floodsub.subscribe(floodsub_topic);
			
			SwarmBuilder::new(transport, behaviour, user.peer_id.clone())
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
		println!("Local peer id: {:?}", self.user.peer_id);
		
		Ok(())
	}
	pub fn start(mut self) -> ThreadHandle<(), DitherAction, DitherEvent> {
		//println!("Local peer id: {:?}", self.user.peer_id);
		// Listen for
		let (outer_sender, mut receiver) = mpsc::channel(64);
		let (mut sender, outer_receiver) = mpsc::channel(64);
		
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
							Empty
						}
					}
				};
				log::info!("Network Action: {:?}", action);
				use DitherAction::*;
				match action {
					FloodSub(topic, data) => {
						let topic = libp2p::floodsub::Topic::new(topic);
						self.swarm.floodsub.publish(topic, data);
					},
					_ => {},
				}
			}
			log::info!("Network Layer Ended");
		});
		ThreadHandle { join, sender: outer_sender, receiver: outer_receiver }
	}
}


