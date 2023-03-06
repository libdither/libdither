//! This node system is for peer discovery. It requests for peers from another node and receives a list of peers to connect to or awaits connections from other peers.

use bevy_ecs::prelude::*;

use crate::{NodeSystem, session::{SessionInfo, Session}, Remote, NodePacket, Network, NodeID, nc_system::LatencyMatrix};

pub enum DiscoveryPacket<Net: Network> {
	/// Sent by a node that is looking for new nodes to connect to, usually nodes that have recently joined the network.
	RequestPeers,

	/// Sent back in response to RequestPeers. Usually if network is small or if requester is a trusted node.
	/// Contains a list or subset of all currently connected nodes and their publicly-accessible addresses
	PeerList(Vec<(NodeID, Net::Address)>),

	/// Sent back in response to RequestPeers. Usually if a network is large or requester is untrusted.
	/// If this packet is sent back, it tells the requester how many nodes where notified for request initiation.
	PeersNotified {
		number: usize,
		request_id: usize,
	},

	/// Sent by a node that receives RequestPeers to a subset of that receiver's peers.
	/// Notifies the peer that a given node is looking for a new peer.
	WantPeer {
		requester_id: NodeID,
		requester_addr: Net::Address,
		request_id: usize,
	},

	// Send by a requested peer of initial `RequestPeers` receiver upon connection to `RequestPeers` sender.
	AcknolwedgedRequest {
		request_id: usize,
	}
}

pub struct DiscoverySystem<Net: Network> {
	_net: std::marker::PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for DiscoverySystem<Net> {
	fn register_resources(world: &mut World) {
		todo!()
	}

	fn register_systems(schedule: &mut Schedule) {
		schedule.add_system(handle_peer_request_list::<Net>);
	}

	type Packet = DiscoveryPacket<Net>;

	fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {
		match packet {
			DiscoveryPacket::RequestPeers => {
				// When receiving a `RequestPeers` discovery request, 
				if world.get_resource::<LatencyMatrix>().is_some() {
					// check if network is small and send entire peer list via `PeerList(...)`.
					world.entity_mut(entity).insert(PeerRequest::List);
				} else {
					// Otherwise forward request with unique id to subset of peers (using `WantPeer { .. }`) and send back `PeersNotified`
					world.entity_mut(entity).insert(PeerRequest::Notify);
				}
			},
			DiscoveryPacket::PeerList(_) => todo!(),
			DiscoveryPacket::PeersNotified { number, request_id } => todo!(),
			DiscoveryPacket::WantPeer { requester_id, requester_addr, request_id } => todo!(),
			DiscoveryPacket::AcknolwedgedRequest { request_id } => todo!(),
		}
	}
}


enum PeerRequest {
	List,
	Notify,
}
#[derive(Component)]
struct PeerList;

#[derive(Component)]
struct Notify;


fn handle_peer_request_list<Net: Network>(mut requesting: Query<(&Session<Net>, &PeerRequest), Added<PeerRequest>>, mut peers: Query<(&Remote, &SessionInfo<Net>)>) {
	for (session, request) in requesting {
		match request {
			PeerRequest::List => {
				// Send all peers
				let peers = peers.iter().map(|(remote, info)|(remote.id, info.net_address)).take(20).collect::<Vec<(NodeID, Net::Address)>>();
				session.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeerList(peers)));
			}
			PeerRequest::Notify => {
				
			}
		}
		
	}
}

fn handle_peer_request_notify() {

}