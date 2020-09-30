#![allow(dead_code)]
#![allow(unused_imports)]

use tokio::{
	io,
	sync::mpsc,
	task,
};
use futures::{future, prelude::*};
use libp2p::{
    Multiaddr,
    PeerId,
    Swarm, swarm::SwarmBuilder,
    NetworkBehaviour,
    identity::{self, Keypair},
    floodsub::{self, Floodsub, FloodsubEvent},
    mdns::Mdns,
    swarm::NetworkBehaviourEventProcess
};
use log::{debug, warn, error};
use std::{
	error::Error,
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
	swarm: Swarm<DitherBehaviour, PeerId>,
	config: Config,
	user: User,
}
#[derive(Debug)]
pub enum DitherAction {
	Empty,
	FloodSub(String, String), // Going to be a lot more complicated
}

//fn make_swarm() -> Swarm<DitherBehaviour, PeerId> {}

impl Client {
	pub fn new(config: Config) -> Result<Client, Box<dyn Error>> {
		let key = Keypair::generate_ed25519();
		let peer_id = PeerId::from(key.public());
		let user = User {
			key: key.clone(),
			peer_id: peer_id.clone(),
		};
		
		// Set up a an encrypted DNS-enabled TCP Transport over the Mplex and Yamux protocols
		let transport = {
			if config.dev_mode {
				libp2p::build_development_transport(key.clone())? // Use base "development" transport
			} else {
				panic!("Custom Transports not implemented yet"); // TODO: Create custom transport based on config
			}
		};
		
		let swarm = {
			let mdns = Mdns::new()?;
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
	pub fn connect(&mut self) -> Result<(mpsc::Sender<DitherAction>, mpsc::Receiver<DitherAction>), Box<dyn Error>> {
		let (tx, rx) = mpsc::channel::<DitherAction>(100);
		
		Swarm::listen_on(&mut self.swarm, "/ip4/0.0.0.0/tcp/0".parse()?)?;
		println!("Local peer id: {:?}", self.user.peer_id);
		
		Ok((tx, rx))
	}
	pub async fn run(&mut self, mut action_listener: mpsc::Receiver<DitherAction>) -> Result<(), Box<dyn Error>> {
		// Listen for 
		loop {
			let action = {
				tokio::select! {
					received_action = action_listener.recv() => {
						if let Some(ret) = received_action { ret }
						else {
							println!("Client Channel Closed, Stopping...");
							break;
						}
					},
					event = self.swarm.next() => {
						println!("New Event: {:?}", event);
						Empty
					}
				}
			};
			use DitherAction::*;
			match action {
				FloodSub(topic, data) => {
					let topic = libp2p::floodsub::Topic::new(topic);
					self.swarm.floodsub.publish(topic, data);
				},
				_ => {},
			}
		}
		Ok(())
	}
}


