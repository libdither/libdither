
use std::sync::Arc;

use node::{NodeAction, NodeID};
use serde::{Serialize, Deserialize};

use crate::{Address, DitherNet};

/// Commands for general interaction, instruction, and debugging of Dither (by simulations, or applications with privileges)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum DitherCommand {
	GetNodeInfo,
	#[serde(skip)]
	NodeAction(Arc<NodeAction<DitherNet>>),

	Bootstrap(NodeID, Address),

	/*
	ConnectInsecure(node::net::Address), /// Connect insecurly to remote, implies public key exchange (MITM prone)
	ConnectDirect(NodeID, node::net::Address), /// Connect directly to address
	Connect(RouteCoord, NodeID), /// Connect directly to location
	ConnectProxied(RouteCoord, NodeID, Vec<NodeID>), /// Connect through specific remotes
	ConnectRouted(RouteCoord), /// Request routed connection at Route Coordinate 
	ConnectSecure(RouteCoord, NodeID, u8), /// Connection through multliple remotes with equally-spaced hops
	*/
	

	/* /// Send Date to Remote
	SendData(NodeID, Vec<u8>),
	/// Get info about remote
	GetRemote(NodeID),

	EstablishRoute(RouteCoord, u8), // Establish number of hops  */
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum DitherEvent {
	NodeInfo(node::net::NodeInfo<DitherNet>)
	/* Bootstrap(NodeID, node::net::Address),

	ConnectInsecure(node::net::Address), /// Connect insecurly to remote, implies public key exchange (MITM prone)
	ConnectDirect(NodeID, node::net::Address), /// Connect directly to address
	Connect(RouteCoord, NodeID), /// Connect directly to location
	ConnectProxied(RouteCoord, NodeID, Vec<NodeID>), /// Connect through specific remotes
	ConnectRouted(RouteCoord), /// Request routed connection at Route Coordinate 
	ConnectSecure(RouteCoord, NodeID, u8), /// Connection through multliple remotes with equally-spaced hops
	

	/// Send Date to Remote
	SendData(NodeID, Vec<u8>),
	/// Get info about remote
	GetRemote(NodeID),

	EstablishRoute(RouteCoord, u8), // Establish number of hops  */
}
