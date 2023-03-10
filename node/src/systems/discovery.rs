//! This node system is for peer discovery. It requests for peers from another node and receives a list of peers to connect to or awaits connections from other peers.

use std::time::Instant;

use bevy_ecs::prelude::*;
use rand::Rng;
use rkyv::{Archive, Serialize, Deserialize};
use bytecheck::CheckBytes;

use crate::{NodeSystem, session::{SessionInfo, Session}, Remote, NodePacket, Network, NodeID, RemoteIDMap, PeerAddr};

#[derive(Debug, Clone, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[serde(bound(serialize="", deserialize=""))]
#[archive_attr(derive(CheckBytes))]
// Discovery method that directly 
pub enum PeerListDiscovery<Net: Network> {
	RequestPeers,
	/// Sent back in response to RequestPeers. Usually if network is small or if requester is a trusted node.
	/// Contains a list or subset of all currently connected nodes and their publicly-accessible addresses
	PeerList(Vec<(NodeID, Net::Address)>),
}

#[derive(Debug, Clone, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[serde(bound(serialize="", deserialize=""))]
#[archive_attr(derive(CheckBytes))]
pub enum NotifyRecovery<Net: Network> {
	/// Sent by a node that is looking for new nodes to connect to, usually nodes that have recently joined the network.
	/// SocketAddr represents publically-accessible IP for new peers to connect to.
	RequestPeers {
		requester_addr: Net::Address,
	},
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
	},
}

#[derive(Debug, Clone, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[serde(bound(serialize="", deserialize=""))]
#[archive_attr(derive(CheckBytes))]
pub enum DiscoveryPacket<Net: Network> {
	PeerListDiscovery(PeerListDiscovery<Net>),
	NotifyRecovery(NotifyRecovery<Net>),
}

pub struct DiscoverySystem<Net: Network> {
	_net: std::marker::PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for DiscoverySystem<Net> {
	fn register_resources(world: &mut World) {
		
	}

	fn register_systems(schedule: &mut Schedule) {
		// schedule.add_system(handle_peer_request::<Net>);
	}

	type Packet = DiscoveryPacket<Net>;

	fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {
		match packet {
			DiscoveryPacket::PeerListDiscovery(packet) => match packet {
				PeerListDiscovery::RequestPeers => {
					let mut query = world.query::<(&Remote, &PeerAddr<Net>)>();
					let peer_list = query.iter(world)
						.map(|(remote, addr)|(remote.id.clone(), addr.addr.clone()))
						.collect::<Vec<(NodeID, Net::Address)>>();
					// Return peerlist
					world.entity(entity).get::<Session<Net>>().unwrap().send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeerListDiscovery(PeerListDiscovery::PeerList(peer_list))));
				},
				PeerListDiscovery::PeerList(list) => {
					for (id, addr) in list {
						world.resource::<Net>().connect(id, addr, None, None);
					}
				},
			}
			DiscoveryPacket::NotifyRecovery(packet) => match packet {
				/* DiscoveryPacket::RequestPeers { requester_addr  } => {
					// When receiving a `RequestPeers` discovery request add PeerRequest component to entity
					world.entity_mut(entity).insert(PeerRequest::<Net>(Instant::now(), requester_addr));
				},
				DiscoveryPacket::PeerList(list) => {
					let net = world.resource::<Net>();
					for (remote_id, net_address) in list {
						net.connect(remote_id, net_address, None, None);
					}
				},
				DiscoveryPacket::PeersNotified { number: _, request_id: _ } => {},
				DiscoveryPacket::WantPeer { requester_id, requester_addr, request_id: _ } => {
					// When receive WantPeer request, check if the WantPeer is already a peer, if not, initiate connection and register entity with WantPeer component so that AcknowledgedRequest packet can be sent.
					#[derive(Debug, Component)]
					struct WantPeer;
					if let Some(requester_entity) = world.resource::<RemoteIDMap>().map.get(&requester_id) {
						world.entity_mut(*requesting_entity).insert(WantPeer);
					} else {
						let requester_entity = world.spawn(WantPeer).id();
						world.resource_mut::<RemoteIDMap>().map.insert(requester_id, requesting_entity);
					}
					let net = world.resource::<Net>();
					
					net.connect(requester_id, requester_addr, None, None);
				},
				DiscoveryPacket::AcknolwedgedRequest { request_id: _ } => {}, */
				_ => unimplemented!()
			}
			
		}
	}
}


/* #[derive(Debug, Component)]
struct PeerRequest<Net: Network>(Instant, Net::Address);


fn handle_peer_request<Net: Network>(mut requesting: Query<(&Remote, &SessionInfo<Net>, &Session<Net>, &PeerRequest<Net>), Changed<PeerRequest<Net>>>, mut peers: Query<(&Remote, &SessionInfo<Net>, &Session<Net>)>) {
	for (req_remote, req_info, req_sess, request) in &requesting {
		let request_id = rand::thread_rng().gen::<usize>();
		let mut peers_count = 0usize;
		for (_, _, sess) in &peers {
			peers_count += 1;

			sess.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::WantPeer {
				requester_id: req_remote.id.clone(),
				requester_addr: request.1.clone(),
				request_id,
			}));
		}

		req_sess.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeersNotified { number: peers_count, request_id }));
	}
} */