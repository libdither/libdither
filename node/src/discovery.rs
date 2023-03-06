//! This node system is for peer discovery. It requests for peers from another node and receives a list of peers to connect to or awaits connections from other peers.

use bevy_ecs::prelude::*;
use rand::Rng;
use rkyv::{Archive, Serialize, Deserialize};
use bytecheck::CheckBytes;

use crate::{NodeSystem, session::{SessionInfo, Session}, Remote, NodePacket, Network, NodeID, nc_system::LatencyMatrix};

#[derive(Debug, Clone, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[archive_attr(derive(CheckBytes))]
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
		schedule.add_system(handle_peer_request::<Net>);
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
			DiscoveryPacket::PeerList(list) => {
				let net = world.resource::<Net>();
				for (remote_id, net_address) in list {
					net.connect(remote_id, net_address, None, None);
				}
			},
			DiscoveryPacket::PeersNotified { number: _, request_id: _ } => {},
			DiscoveryPacket::WantPeer { requester_id, requester_addr, request_id: _ } => {
				let net = world.resource::<Net>();
				net.connect(requester_id, requester_addr, None, None);
			},
			DiscoveryPacket::AcknolwedgedRequest { request_id: _ } => {},
		}
	}
}


#[derive(Debug, Component)]
enum PeerRequest {
	List,
	Notify,
}


fn handle_peer_request<Net: Network>(mut requesting: Query<(&Remote, &SessionInfo<Net>, &Session<Net>, &PeerRequest), Added<PeerRequest>>, mut peers: Query<(&Remote, &SessionInfo<Net>, &Session<Net>)>) {
	for (req_remote, req_info, req_sess, request) in &requesting {
		match request {
			PeerRequest::List => {
				// Send all peers
				let peers = peers.iter().map(|(remote, info, _)|(remote.id.clone(), info.net_address.clone())).take(20).collect::<Vec<(NodeID, Net::Address)>>();
				req_sess.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeerList(peers)));
			}
			PeerRequest::Notify => {
				let request_id = rand::thread_rng().gen::<usize>();
				let mut peers_count = 0usize;
				for (_, _, sess) in &peers {
					peers_count += 1;

					sess.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::WantPeer {
						requester_id: req_remote.id.clone(),
						requester_addr: req_info.net_address.clone(),
						request_id,
					}));

					if peers_count >= 20 { break }
				}

				req_sess.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeersNotified { number: peers_count, request_id }));
			}
		}
		
	}
}