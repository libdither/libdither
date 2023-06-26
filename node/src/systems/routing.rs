//! This is the routing system
//! The goal is to facilitate multiple types of routing based on the goals of the application.
//! It takes connection requests from the application and establishes a routed connection of some type.

use std::{marker::PhantomData, time::Instant};

use bevy_ecs::prelude::*;
use futures::channel::mpsc;
use rkyv::{Archive, Serialize, Deserialize};
use bytecheck::CheckBytes;

use crate::{NetworkCoord, Network, NodeSystem, NodeID, Remote};

/// Request for an entity to act as an onion route.
/// Requires `Remote` and `Coordinates` components.
#[derive(Debug, Component)]
pub struct RelayRequest;

#[derive(Debug, Component)]
pub struct Relay;

/// Request to find a relay at a specific coordinate. Applied as a component to existing entity to designate through which entity the relay should be searched.
#[derive(Debug, Component)]
pub struct RelaySearchRequest(NetworkCoord);

#[derive(Debug, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[archive_attr(derive(CheckBytes, Debug))]
pub enum RoutingSystemPacket {
	RelayPacket(Vec<u8>),
    // Traversal(TraversalPacket),
}

pub struct RoutingSystem<Net: Network> {
	_net: PhantomData<Net::Address>,
}
impl<Net: Network> NodeSystem for RoutingSystem<Net> {
    fn register_resources(world: &mut World) {
		
    }

    fn register_systems(schedule: &mut Schedule) {
		
	}

	fn register_components(entity_mut: &mut bevy_ecs::world::EntityMut) {
		
	}
}

/// Request to establish traversed encrypted session with remote entity.
/// Traversed packets get passed along to peers closest to the remote.
/// Requires entity to have `Remote` and `Coordinates` components
#[derive(Debug, Component, Default)]
pub enum TraversalSessionRequest {
	#[default]
	Requested,
	/// TraversalSession is waiting for a response to the initiation packet sent at Instant,
	WaitingForResponse(Instant),
}

/// Added to entity with established TraversalRoute.
#[derive(Debug, Component)]
pub struct TraversalSession;

#[derive(Debug, Clone, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[archive_attr(derive(Debug, CheckBytes))]
pub struct TraversalPacket {
	// In-coord of destination node
	pub destination: NetworkCoord,
	// TODO: Its probably not a good idea in the future to have recipient IDs attached to traversal packets because then anyone along the traversal path can figure out the coordinates of a given NodeID
	pub recipient: NodeID,
	// Encrypted packet that should be forwarded
	pub encrypted_packet: Vec<u8>,
}

/// if a traversal session is requested, establish it (if it does not already exist)
fn establish_traversal_session(mut commands: Commands, requests: Query<(Entity, &Remote, &TraversalSessionRequest), Without<TraversalSession>>) {
	for (entity, remote, request) in requests.iter() {
		commands.entity(entity).insert(TraversalSession);
	}
}

/// Traversal Packet Receiver, receives from session thread.
#[derive(Resource)]
pub struct TraversalPacketReceiver {
	receiver: mpsc::Receiver<TraversalPacket>
}