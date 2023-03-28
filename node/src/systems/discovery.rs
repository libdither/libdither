//! This node system is for peer discovery. It requests for peers from another node and receives a list of peers to connect to or awaits connections from other peers.

use bevy_ecs::prelude::*;
use rkyv::{Archive, Serialize, Deserialize};
use bytecheck::CheckBytes;

use crate::{NodeSystem, session::{SessionInfo, Session}, Remote, NodePacket, Network, NodeID, RemoteIDMap, PublicAddress};

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
	/// Receiver of a connection notifies the initiator of which IP they see them using.
	NotifyOutgoingIP(Net::Address),
	/// Initiator of the connection notifies the the receiver of the public address they can be connected to at.
	NotifyPublicAddress(Net::Address),
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
	/// Notify remote of public address they can use to re-connect
	NotifyPublicAddress(Net::Address),
	/// Request from remote what they see my address as.
	RequestSeenAddress,
	/// Response from remote what they see as my address
	NotifySeenAddress(Net::Address),
}
impl<Net: Network> From<DiscoveryPacket<Net>> for NodePacket<Net> {
    fn from(value: DiscoveryPacket<Net>) -> Self {
        NodePacket::DiscoveryPacket(value)
    }
}

pub struct DiscoverySystem<Net: Network> {
	_net: std::marker::PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for DiscoverySystem<Net> {
	fn register_resources(world: &mut World) {
		world.insert_resource(KnownPubAddr::<Net> { addr: None });
	}

	fn register_systems(schedule: &mut Schedule) {
		// schedule.add_system(handle_peer_request::<Net>);
		schedule.add_system(session_setup::<Net>);
		schedule.add_system(handle_conn_request::<Net>);
	}

	type Packet = DiscoveryPacket<Net>;
	
	fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {
		match packet {
			DiscoveryPacket::PeerListDiscovery(packet) => match packet {
				PeerListDiscovery::RequestPeers => {
					let mut query = world.query::<(&Remote, &PublicAddress<Net>)>();
					let peer_list = query.iter(world)
						.map(|(remote, addr)|(remote.id.clone(), addr.addr.clone()))
						.collect::<Vec<(NodeID, Net::Address)>>();
					// Return peerlist
					log::debug!("received requestpeers, sending peerlist: {:?}", peer_list);
					world.entity(entity).get::<Session<Net>>().unwrap().send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeerListDiscovery(PeerListDiscovery::PeerList(peer_list))));
				},
				PeerListDiscovery::PeerList(list) => {
					log::debug!("received peerlist: {:?}", list);
					// Connect to every peer received if not already connected
					let map = world.resource::<RemoteIDMap>();
					let net = world.resource::<Net>();
					for (id, addr) in list {
						if !map.map.contains_key(&id) {
							net.connect(id, addr, None, None);
						}
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
			// When receiving this packet, we should record what the public address is to enable reconnection
			DiscoveryPacket::NotifyPublicAddress(addr) => {
				log::info!("notified of public address for {entity:?}: {:?}", addr);
				world.entity_mut(entity).insert(PublicAddress::<Net> { addr });
			},
			// When receiving this packet, we should send back what we see the remote's public address as.
			DiscoveryPacket::RequestSeenAddress => {
				let seen_addr = world.entity(entity).get::<SessionInfo<Net>>().unwrap().net_address.clone();
				world.entity(entity).get::<Session<Net>>().unwrap().send_packet(DiscoveryPacket::NotifySeenAddress(seen_addr).into());
			},
			DiscoveryPacket::NotifySeenAddress(seen_addr) => {
				world.entity_mut(entity).insert(SeenAddr::<Net> { addr: seen_addr });
			}
		}
	}
}

fn session_setup<Net: Network>(query: Query<&Session<Net>, Added<Session<Net>>>) {
	// Set need more pings to true
	for session in &query {
		// Request peers from each other
		session.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::PeerListDiscovery(PeerListDiscovery::RequestPeers)));
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

/// Known public addresses of this node that remote nodes can send stuff through. This is a per-session component
#[derive(Component)]
pub struct SeenAddr<Net: Network> {
	addr: Net::Address
}

#[derive(Resource)]
pub struct KnownPubAddr<Net: Network> {
	addr: Option<Net::Address>,
}

#[derive(Component)]
pub struct ConnReceiver;

// This system handles whenever a new connection was established for the first time (i.e. the addition of ConnReceiver) or when the remote returns RequestSeenAddr
fn handle_conn_request<Net: Network>(
	mut pub_addr: ResMut<KnownPubAddr<Net>>,
	listener_config: Res<Net::ListenerConfig>,
	requesting: Query<(&Session<Net>, Option<&SeenAddr<Net>>), Or<(Added<ConnReceiver>, Added<SeenAddr<Net>>)>>
) {
	for (session, seen) in requesting.iter() {
		if let Some(pub_addr) = match seen {
			Some(seen) => {
				let new_pub_addr = Net::predict_public_addresses(&seen.addr, &*listener_config).next().expect("this system only expects one listening address in ListenerConfig");
				
				if let Some(pub_addr) = &pub_addr.addr {
					if *pub_addr != new_pub_addr {
						log::error!("public address: {pub_addr:?} does not equal new calculated public address {new_pub_addr:?} these two addresses must be in different networks");
					}
				} else {
					log::info!("calculated new public address for self: {:?}", new_pub_addr);
					pub_addr.addr = Some(new_pub_addr);
				}
				// Return pub addr, send_packet below show notify remote if this not None.
				pub_addr.addr.clone()
			}
			None => {
				// No SeenAddr, check if has KnownPubAddr. If not, query remote for SeenAddr
				if let Some(pub_addr) = &pub_addr.addr {
					Some(pub_addr.clone())
				} else {
					// Ask remote for SeenAddr
					session.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::RequestSeenAddress));
					None
				}
			}
		} {
			// If match statement above returns Some(Net::Address), send public address notify.
			session.send_packet(NodePacket::DiscoveryPacket(DiscoveryPacket::NotifyPublicAddress(pub_addr)));
		}
	}
}