
use libp2p::{
	NetworkBehaviour,
    floodsub::{Floodsub, FloodsubEvent},
    mdns::{TokioMdns, MdnsEvent},
    swarm::NetworkBehaviourEventProcess
};

#[derive(NetworkBehaviour)]
pub struct DitherBehaviour {
	pub floodsub: Floodsub,
	pub mdns: TokioMdns,

	// Struct fields which do not implement NetworkBehaviour need to be ignored
	#[behaviour(ignore)]
	#[allow(dead_code)]
	pub ignored_member: bool,
}

impl NetworkBehaviourEventProcess<FloodsubEvent> for DitherBehaviour {
	// Called when `floodsub` produces an event.
	fn inject_event(&mut self, message: FloodsubEvent) {
		if let FloodsubEvent::Message(message) = message {
			log::info!("Received: '{:?}' from {:?}", String::from_utf8_lossy(&message.data), message.source);
		}
	}
}

impl NetworkBehaviourEventProcess<MdnsEvent> for DitherBehaviour {
	// Called when `mdns` produces an event.
	fn inject_event(&mut self, event: MdnsEvent) {
		match event {
			MdnsEvent::Discovered(list) =>
				for (peer, _) in list {
					self.floodsub.add_node_to_partial_view(peer);
				}
			MdnsEvent::Expired(list) =>
				for (peer, _) in list {
					if !self.mdns.has_node(&peer) {
						self.floodsub.remove_node_from_partial_view(&peer);
					}
				}
		}
	}
}