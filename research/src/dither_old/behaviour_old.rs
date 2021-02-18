// Define the behaviour of any connection in Dither

use libp2p::{
	NetworkBehaviour,
	floodsub::{Floodsub, FloodsubEvent, Topic},
	mdns::{TokioMdns, MdnsEvent},
	swarm::NetworkBehaviourEventProcess,
	PeerId,
};

/*#[derive(NetworkBehaviour)]
#[behaviour(out_event = "DitherEvent")]
#[behaviour(event_process = false)]*/
pub struct DitherBehaviour {
	//#[behaviour(ignore)]
	//pub floodsub: Floodsub,
	//pub mdns: TokioMdns,

	// Struct fields which do not implement NetworkBehaviour need to be ignored
	//#[behaviour(ignore)]
	//#[allow(dead_code)]
	//pub ignored_member: bool,
}

use std::any::Any;
#[derive(Debug)]
pub enum DitherEvent {
	ReceivedData(Application, Vec<u8>),
	FloodsubEvent(FloodsubEvent),
	MdnsEvent(MdnsEvent),
	//Unhandled(Box<dyn Any + Send + Sync>),
}

/*impl From<FloodsubEvent> for DitherEvent {
	fn from(event: FloodsubEvent) -> DitherEvent {
		match event {
			FloodsubEvent::Message(msg) => DitherEvent::ReceivedData(msg.data),
			_ => DitherEvent::FloodsubEvent(event),
		}
	}
}
impl From<MdnsEvent> for DitherEvent {
	fn from(event: MdnsEvent) -> DitherEvent {
		match event {
			_ => DitherEvent::MdnsEvent(event),
		}
	}
}*/

impl DitherBehaviour {
	pub fn new(peer: PeerId, mdns: TokioMdns) -> DitherBehaviour {
		Self {
			floodsub: Floodsub::new(peer),
			mdns,
		}
	}
	pub fn subscribe(&mut self, topic: Topic) {
		self.floodsub.subscribe(topic);
	}
	pub fn unsubscribe(&mut self, topic: Topic) {
		self.floodsub.unsubscribe(topic);
	}
	pub fn broadcast(&mut self, topic: Topic, data: Vec<u8>) {
		self.floodsub.publish(topic, data);
	}
	pub fn add_peer(&mut self, peer: PeerId) {
		log::info!("Adding Peer: {:?}", peer);
		self.floodsub.add_node_to_partial_view(peer);
	}
	pub fn remove_peer(&mut self, peer: &PeerId) {
		log::info!("Removing Peer: {:?}", peer);
		self.floodsub.remove_node_from_partial_view(peer);
	}
}

/*impl NetworkBehaviourEventProcess<FloodsubEvent> for DitherBehaviour {
	// Called when `floodsub` produces an event.
	fn inject_event(&mut self, message: FloodsubEvent) {
		if let FloodsubEvent::Message(message) = message {
			log::info!("Received: '{:?}' from {:?}", String::from_utf8_lossy(&message.data), message.source);
		}
	}
}*/

impl NetworkBehaviourEventProcess<MdnsEvent> for DitherBehaviour {
	// Called when `mdns` produces an event.
	fn inject_event(&mut self, event: MdnsEvent) {
		match event {
			MdnsEvent::Discovered(list) =>
				for (peer, _) in list {
					self.add_peer(peer);
				}
			MdnsEvent::Expired(list) =>
				for (peer, _) in list {
					if !self.mdns.has_node(&peer) {
						self.remove_peer(&peer);
					}
				}
		}
	}
}