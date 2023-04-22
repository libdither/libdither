//! This is the routing system
//! The goal is to facilitate multiple types of routing based on the goals of the application.
//! It takes connection requests from the application and establishes a routed connection of some type.

use std::{marker::PhantomData, time::Instant, cmp::Ordering};

use bevy_ecs::prelude::*;
use futures::channel::mpsc;
use rkyv::{Archive, Serialize, Deserialize, Infallible};
use bytecheck::CheckBytes;

use crate::{NodePacket, EntityEventSender, session::{EntitySessionEvent, Session, SessionEvent}, NetworkCoord, Network, NodeSystem, NodeID, NodeConfig, Coordinates, Remote, RemoteIDMap};

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
	destination: NetworkCoord,
	// TODO: Its probably not a good idea in the future to have recipient IDs attached to traversal packets because then anyone along the traversal path can figure out the coordinates of a given NodeID
	recipient: NodeID,
	// Encrypted packet that should be forwarded
	encrypted_packet: Vec<u8>,
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

// Handle incoming traversal packets
pub fn handle_traversal_packet<Net: Network>(
	packet_receiver: Res<TraversalPacketReceiver>,
	entity_event_sender: ResMut<EntityEventSender<Net>>,
	config: Res<NodeConfig<Net>>,
	id_map: Res<RemoteIDMap>,
	peers: Query<(&Session<Net>, &Coordinates)>
	
) {
	while let Ok(Some(packet)) = packet_receiver.receiver.try_next() {
		// If traversal packet is destined for me (either as a relay, or as actual recipient)
		// decrypt it and send as normal packet using entity_event_sender
		if packet.recipient == config.node_id {
			if let Some(entity) = id_map.map.get(&packet.recipient) {
				let packet = rkyv::check_archived_root::<'_, NodePacket<Net>>(&packet.encrypted_packet).expect("failed to unarchive traversed packet");
				let packet = packet.deserialize(&mut Infallible).unwrap();
				entity_event_sender.sender.unbounded_send(EntitySessionEvent {
					entity: entity.clone(),
					event: SessionEvent::Packet(packet),
				}).ok();
			}
		} else { // Otherwise, send it to nearest peer that has coordinates closest to the destination.
			if let Some((sess, _)) = peers.iter()
				.map(|(s, c)|(s, c.out_coord.dot(&packet.destination)))
				.min_by(|(_, c1), (_, c2)| f64::partial_cmp(c1, c2).unwrap_or(Ordering::Equal)) {
				// Send packet
				// TODO: Should do buffer reuse here
				sess.send_packet(NodePacket::Traversal(packet))
			}
		}
	}
}