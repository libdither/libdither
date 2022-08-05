#![allow(dead_code)]

#![allow(non_upper_case_globals)]

use super::{RouteScalar, SessionID, NodeID, NodePacket, Node, NodeError, NetAddr, RouteCoord, NodeEncryption, InternetPacket, TraversedPacket};

use std::{cmp::Reverse, collections::HashMap, mem::{Discriminant, discriminant}};

use ta::{indicators::{SimpleMovingAverage, StandardDeviation}, Next};
use thiserror::Error;
use priority_queue::PriorityQueue;

/// Number that uniquely identifies a ping request so that multiple Pings may be sent at the same time
pub type PingID = u64;

const MAX_PENDING_PINGS: usize = 25;
pub const NUM_NODE_PACKETS: usize = 10;

#[derive(Derivative, Serialize, Deserialize)]
#[derivative(Debug)]
pub struct SessionTracker {
	#[derivative(Debug="ignore")]
	#[serde(skip)]
	ping_queue: PriorityQueue<PingID, Reverse<usize>>, // Tuple represents (ID of ping, priority by reversed time sent) 
	pub dist_avg: RouteScalar,
	#[derivative(Debug="ignore")]
	dist_dev: RouteScalar,
	#[derivative(Debug="ignore")]
	#[serde(skip)]
	ping_avg: SimpleMovingAverage, // Moving average of ping times
	#[derivative(Debug="ignore")]
	#[serde(skip)]
	ping_dev: StandardDeviation,
	pub ping_count: usize,
}
impl SessionTracker {
	fn new() -> Self {
		Self {
			ping_queue: PriorityQueue::with_capacity(MAX_PENDING_PINGS),
			dist_avg: 0,
			dist_dev: 0,
			ping_avg: SimpleMovingAverage::new(10).unwrap(),
			ping_dev: ta::indicators::StandardDeviation::new(10).unwrap(),
			ping_count: 0,
		}
	}
	// Generate Ping Packet
	pub fn gen_ping(&mut self, gen_time: usize) -> PingID {
		let ping_id: PingID = rand::random();
		self.ping_queue.push(ping_id, Reverse(gen_time));
		// There shouldn't be more than 25 pings pending
		if self.ping_queue.len() >= MAX_PENDING_PINGS {
			self.ping_queue.pop();
		}
		ping_id
	}
	// Acknowledge Ping Response packet
	pub fn acknowledge_ping(&mut self, ping_id: PingID, current_time: usize) -> Result<RouteScalar, SessionError> {
		if let Some(( _, Reverse(time_sent) )) = self.ping_queue.remove(&ping_id) {
			let round_trip_time = current_time - time_sent;
			let distance = round_trip_time as f64 / 2.0;
			self.dist_avg = self.ping_avg.next(distance) as RouteScalar;
			//self.dist_dev = self.ping_dev.next(distance) as RouteScalar;
			self.ping_count += 1;
			Ok(self.dist_avg)
		} else { Err(SessionError::UnknownPingID { ping_id }) }
	}
	pub fn pending_pings(&self) -> usize { self.ping_queue.len() }
}

bitflags! {
	#[derive(Serialize, Deserialize)]
	pub struct PeerStatus: u8 {
		const None 		= 0b00000000;
		const Outgoing 	= 0b00000001;
		const Incoming 	= 0b00000010;
		const Mutual	= 0b00000011;
	}
}
/// Represents directly connected session over plain internet
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirectSession {
	/// Network Address of remote
	pub net_addr: NetAddr,
	/// Some(bool) if peered, Some(true) if reciprocal peer
	pub peer_status: PeerStatus,
}
impl DirectSession {
	pub fn new(net_addr: NetAddr) -> SessionType {
		SessionType::Direct(DirectSession {
			net_addr,
			peer_status: PeerStatus::None,
		})
	}
	pub fn record_peer_notify(&mut self, rank: usize) {
		self.peer_status.set(PeerStatus::Incoming, rank != usize::MAX);
	}
	pub fn set_peer(&mut self, toggle: bool) {
		self.peer_status.set(PeerStatus::Outgoing, toggle);
	}
}
/// Represents a session that traverses packets through the dither network to its destination
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TraversedSession {
	/// Coordinate of remote routed node
	pub route_coord: RouteCoord
}
impl TraversedSession { pub fn new(route_coord: RouteCoord) -> SessionType { SessionType::Traversed(Self { route_coord } ) } }

/// Represents onion-routed session through different Dither nodes
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoutedSession {
	/// Coordinate of remote routed node
	pub route_coord: RouteCoord,
	/// Itermediate hops, First session may or may not be a peer, but it must be Direct or Traversed
	pub proxy_nodes: Vec<SessionID>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SessionType {
	Direct(DirectSession),
	Traversed(TraversedSession),
	Routed(RoutedSession),
}
impl SessionType {
	pub fn direct(net_addr: NetAddr) -> Self { DirectSession::new(net_addr) }
	pub fn traversed(route_coord: RouteCoord) -> Self { TraversedSession::new(route_coord) }
	pub fn routed(route_coord: RouteCoord, proxy_nodes: Vec<SessionID>) -> Self { Self::Routed(RoutedSession { route_coord, proxy_nodes } ) }
}

#[derive(Error, Debug)]
pub enum SessionError {
    #[error("There is no previous ping sent out with ID: {ping_id:?} or ping was forgotten")]
	UnknownPingID { ping_id: PingID },
	#[error("This session is not a direct session")]
	NotDirectType,
	#[error("Cached address did not match direct address")]
	InvalidCachedAddress,
	#[error("No outgoing address")]
	NoOutgoingAddress,
}

/// Represents a Remote Connection, Direct or Routed
#[derive(Derivative, Serialize, Deserialize)]
#[derivative(Debug)]
pub struct RemoteSession {
	/// All connections must have a SessionID for symmetric encryption
	pub session_id: SessionID,
	/// Direct Session or Routed Session
	pub session_type: SessionType,
	/// Tracks ping times to a remote node
	#[derivative(Debug="ignore")]
	pub tracker: SessionTracker,
	/// Keep track of times certain packets were last received from remote node
	#[derivative(Debug="ignore")]
	#[serde(skip)]
	pub last_packet_times: HashMap<(Discriminant<NodePacket>, NodeID), usize>, // Maps Packets to time last sent
}
impl RemoteSession {
	pub fn new(session_id: SessionID, session_type: SessionType) -> Self {
		Self {
			session_id,
			session_type,
			tracker: SessionTracker::new(),
			last_packet_times: HashMap::with_capacity(NUM_NODE_PACKETS),
		}
	}
	pub fn direct(&self) -> Result<&DirectSession, SessionError> {
		if let SessionType::Direct(direct) = &self.session_type { Ok(direct) } else { Err(SessionError::NotDirectType) }
	}
	pub fn direct_mut(&mut self) -> Result<&mut DirectSession, SessionError> {
		if let SessionType::Direct(direct) = &mut self.session_type { Ok(direct) } else { Err(SessionError::NotDirectType) }
	}
	pub fn is_peer(&self) -> bool { self.direct().map_or(false, |d|d.peer_status.contains(PeerStatus::Outgoing)) }
	/// Returns how long ago (in ticks) a packet was last sent or None if packet has never been sent
	pub fn check_packet_time(&mut self, packet: &NodePacket, sending_node_id: NodeID, current_time: usize) -> Option<usize> {
		if let Some(last_time) = self.last_packet_times.get_mut(&(discriminant(packet), sending_node_id)) {
			let difference = current_time - *last_time;
			*last_time = current_time;
			Some(difference)
		} else { 
			self.last_packet_times.insert((discriminant(packet), sending_node_id), current_time); None
		}
	}
	pub fn wrap_session(&self, packet: NodePacket) -> NodeEncryption {
		NodeEncryption::Session { session_id: self.session_id, packet }
	}
	pub fn dist(&self) -> RouteScalar {
		return self.tracker.dist_avg;
	}
	pub fn gen_packet(&self, encryption: NodeEncryption, node: &Node) -> Result<InternetPacket, NodeError> {
		let mut encryption = encryption;
		let outgoing_net_addr = match &self.session_type {
			SessionType::Direct(direct_session) => { direct_session.net_addr }
			SessionType::Routed(routed_session) => {
				let mut current_route_coord = routed_session.route_coord;
				for session_id in routed_session.proxy_nodes.iter().rev() {
					// Handle these errors
					let remote = node.remote(node.index_by_session_id(&session_id)?)?;
					let origin_coord = remote.route_coord.unwrap();

					let routed_packet = TraversedPacket::new(current_route_coord, encryption, Some(origin_coord));
					encryption = self.wrap_session(routed_packet);
					current_route_coord = origin_coord;
				}

				let node_idx = 
					if let Some(node_idx) = node.peer_list.get_by_right(&current_route_coord) { *node_idx }
					else { node.find_closest_peer(&current_route_coord)? };
				node.remote(node_idx)?.session()?.direct()?.net_addr
			}
			SessionType::Traversed(traversed_session) => {
				// Destination Route Coord
				let route_coord = traversed_session.route_coord;
				
				// Find closest return node
				let closest_node_idx = 
					if let Some(node_idx) = node.peer_list.get_by_right(&route_coord) { *node_idx }
					else { node.find_closest_peer(&route_coord)? };
				let closest_session = node.remote(closest_node_idx)?.session()?;

				// Wrap with traversed packet
				let self_route_coord = node.route_coord.ok_or(NodeError::NoCalculatedRouteCoord)?;
				let traversed_packet = TraversedPacket::new(route_coord, encryption, Some(self_route_coord));
				encryption = closest_session.wrap_session(traversed_packet);

				closest_session.direct()?.net_addr
			}
		};

		Ok(encryption.package(outgoing_net_addr))
	}
}