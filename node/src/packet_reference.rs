use super::{InternetPacket, NetAddr, NodeError, NodeID, RouteCoord, SessionID, session::PingID};

/// Data structure that represents a NodeEncryption traversing through the network 
#[derive(Derivative, Serialize, Deserialize, Clone)]
#[derivative(Debug)]
pub struct TraversedPacket {
	/// Place to route packet to
	#[derivative(Debug(format_with="std::fmt::Display::fmt"))]
	pub destination: RouteCoord,
	/// Encrypted Session Data
	pub encryption: NodeEncryption,
	/// Signed & Assymetrically encrypted return location
	pub origin: Option<RouteCoord>,
}
impl TraversedPacket {
	pub fn new(destination: RouteCoord, encryption: NodeEncryption, origin: Option<RouteCoord>) -> NodePacket {
		NodePacket::Traverse(Box::new( TraversedPacket { destination, encryption, origin } ))
	}
}

/// Packets that are sent between nodes in this protocol.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum NodePacket {
	/// ### Connection System
	/// Sent immediately after receiving a an Acknowledgement, allows other node to get a rough idea about the node's latency
	/// Contains list of packets for remote to respond to 
	ConnectionInit(PingID, Vec<NodePacket>),

	/// ### Information Exchange System
	/// Send info to another peer in exchange for their info
	/// * `Option<RouteCoord>`: Tell another node my Route Coordinate if I have it
	/// * `usize`: number of direct connections I have
	/// * `u64`: ping (latency) to remote node
	ExchangeInfo(Option<RouteCoord>, usize, u64), // My Route coordinate, number of peers, remote ping
	/// Send info in response to an ExchangeInfo packet
	/// * `Option<RouteCoord>`: Tell another node my Route Coordinate if I have it
	/// * `usize`: number of direct connections I have
	/// * `u64`: ping (latency) to remote node
	ExchangeInfoResponse(Option<RouteCoord>, usize, u64),
	/// Notify another node of peership
	/// * `usize`: Rank of remote in peer list
	/// * `RouteCoord`: My Route Coordinate
	/// * `usize`: Number of peers I have
	PeerNotify(usize, RouteCoord, usize, u64),
	/// Propose routing coordinates if nobody has any nodes
	ProposeRouteCoords(RouteCoord, RouteCoord), // First route coord = other node, second route coord = myself
	/// Proposed route coords (original coordinates, orientation, bool), bool = true if acceptable
	ProposeRouteCoordsResponse(RouteCoord, RouteCoord, bool), 

	/// ### Self-Organization System
	/// Request a certain number of another node's peers that are closest to this node to make themselves known
	/// * `usize`: Number of peers requested
	/// * `Option<RouteCoord>`: Route Coordinates of the other node if it has one
	RequestPings(usize, Option<RouteCoord>),

	/// Tell a peer that this node wants a ping (implying a potential direct connection)
	WantPing(NodeID, NetAddr),
	/// Sent when node accepts a WantPing Request
	/// * `NodeID`: NodeID of Node who send the request in response to a RequestPings
	/// * `u64`: Distance to that nodeTraversedPacket
	AcceptWantPing(NodeID, u64),

	/// Packet Traversed
	/// Represents a packet that is traversed through the network to it's destination using a RouteCoord
	Traverse(Box<TraversedPacket>),

	/* /// Request a session that is routed through node to another RouteCoordinate
	RoutedSessionRequest(RouteCoord),
	RoutedSessionAccept(), */

	Data(Vec<u8>)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum NodeEncryption {
	/// Handshake is sent from node wanting to establish secure tunnel to another node
	/// session_id and signer are encrypted with recipient's public key
	Handshake { recipient: NodeID, session_id: SessionID, signer: NodeID },
	/// When the other node receives the Handshake, they will send back an Acknowledge
	/// When the original party receives the Acknowledge, that tunnel may now be used for 2-way packet transfer
	/// acknowledger and return_ping_id are symmetrically encrypted with session key
	Acknowledge { session_id: SessionID, acknowledger: NodeID, return_ping_id: PingID },
	/// Symmetrically Encrypted Data transfer (packet is encrypted with session key)
	Session { session_id: SessionID, packet: NodePacket },
	// Asymmetrically Encrypted notification (Data and Sender are encrypted with recipient's public key)
	Notify { recipient: NodeID, data: u64, sender: NodeID },
	// Signed Route Request, treated as a Notify type but requests a return Routed Session from the remote
	Request { recipient: NodeID, requester: NodeID }
}



impl NodeEncryption {
	pub fn package(&self, dest_addr: NetAddr) -> InternetPacket {
		InternetPacket {
			src_addr: 0, // This should get filled in automatically for all outgoing packets
			data: bincode::serialize(self).expect("Failed to encode packet"),
			dest_addr,
			request: None,
		}
	}
	pub fn unpackage(packet: &InternetPacket) -> Result<Self, bincode::Error> {
		bincode::deserialize(&packet.data)
	}
	/* pub fn wrap_traverse(self, session_id: SessionID, route_coord: RouteCoord) -> NodeEncryption {
		let packet = NodePacket::Traverse(route_coord, Box::new(self));
		NodeEncryption::Session { session_id, packet }
	} */
	pub fn is_for_node(&self, node: &crate::node::Node) -> bool {
		use NodeEncryption::*;
		match *self {
			Handshake { recipient, session_id:_, signer:_ } => node.node_id == recipient,
			Acknowledge { session_id, ref acknowledger, return_ping_id:_ } => {
				let result: Result<(), NodeError> = try {
					let result = node.remote(node.index_by_node_id(acknowledger)?)?.pending_session.as_ref().map(|b|b.0 == session_id);
					return result == Some(true);
				};
				result.is_ok()
			},
			Session { session_id, packet:_ } => node.sessions.contains_left(&session_id),
			Notify { recipient, data:_, sender:_ } => node.node_id == recipient,
			Request { recipient, requester:_ } => node.node_id == recipient,
		}
	}
}