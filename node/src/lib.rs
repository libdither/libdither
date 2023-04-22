#![allow(dead_code)]
#![allow(incomplete_features)]
#![feature(async_fn_in_trait)]
#![feature(return_position_impl_trait_in_trait)]
#![feature(generic_const_exprs)]
#![feature(drain_filter)]
#![feature(associated_type_defaults)]
#![feature(generic_arg_infer)]
#![feature(read_buf)]

pub mod session;
mod net;
mod packet;
mod systems;
mod transport;
pub use systems::*;

use std::{collections::HashMap, marker::PhantomData, time::Duration};

use bevy_ecs::{prelude::*, world::EntityMut};
use futures::{channel::mpsc::{unbounded, self, UnboundedSender, TrySendError}, StreamExt};

use session::*;
pub use net::*;
pub use packet::*;

type Latency = u64;
use thiserror::Error;

/// Multihash that uniquely identifying a node (represents the Multihash of the node's Public Key)
pub type NodeID = hashdb::Hash;

#[derive(Debug, Component)]
struct Remote {
	id: NodeID,
}

/// Actions that can be run by an external entity (either the internet implementation or the user)
#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(bound(serialize="", deserialize=""))]
pub enum NodeAction<Net: Network> {
	/// Connect to another node
	Connect(NodeID, Net::Address, Option<Net::NodePubKey>),
	
	/// Send arbitrary packet to Remote
	ForwardPacket(NodeID, NodePacket<Net>),

	/// Find node at or near specific coordinates in the network that is willing to be a router.
	FindRouter(NetworkCoord),

	/// Establish Onion-route
	EstablishRoute(Vec<NodeID>),

	/// Print Node info to stdout
	PrintNode,

	GetInfo,
	GetRemoteInfo(Entity),
}

#[derive(Debug, Clone)]
pub enum NodeEvent<Net: Network> {
	// Event returned when new connection is established
	NewConnection(NodeID, Net::Address),
	
	// Event returned for GetRemoteList, return list of remotes.
	Info(NodeID, Net::ListenerConfig, Coordinates, Vec<(NodeID, Entity)>),
	// Event returned for GetRemoteInfo
	RemoteInfo(Entity, NodeID, LatencyMetrics, Option<Coordinates>, Option<(Latency, Latency)>)
}

#[derive(Debug, Error)]
pub enum NodeError<Net: Network> {
	#[error("node event sender was closed: {0}")]
	NodeEventSenderClosed(#[from] TrySendError<NodeEvent<Net>>)
}

/// Contains ECS and Network implementation
pub struct Node<Net: Network> {
	world: World,
	_net: PhantomData<Net>,
}

#[derive(Debug, Default, Resource)]
pub struct RemoteIDMap {
	map: HashMap<NodeID, Entity>,
}

#[derive(Resource)]
pub struct NodeConfig<Net: Network> {
	pub keys: EncryptionKeys<Net>,
	pub node_id: NodeID,
	pub listener_config: Net::ListenerConfig,
}

#[derive(Resource)]
pub struct EventSender<Net: Network> {
	sender: UnboundedSender<NodeEvent<Net>>,
}

/// Public address of another node
#[derive(Debug, Component)]
pub struct PublicAddress<Net: Network> {
	addr: Net::Address,
}

#[derive(Resource)]
pub struct EntityEventSender<Net: Network> {
	sender: UnboundedSender<EntitySessionEvent<Net>>
}

/// Easy way to modularize different sub-systems of a node. This doesn't prevent system interdependencies, it just streamlines world and schedule initialization. (and a few other things)
#[allow(unused_variables)]
pub trait NodeSystem {
	fn register_resources(world: &mut World) {}
	fn register_systems(schedule: &mut Schedule) {}
	fn register_components(entity_mut: &mut EntityMut) {}
	type Packet = ();
	/// Entity passed must be valid in World and must contain components: `Session<Net>`, `SessionInfo<Net>` otherwise this function may panic.
	#[allow(unused_variables)]
	fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {}
}

impl<Net: Network> Node<Net> {
	pub fn new(config: NodeConfig<Net>, event_sender: UnboundedSender<NodeEvent<Net>>) -> Self {
		let mut world = World::new();
		world.init_resource::<RemoteIDMap>();
		world.insert_resource::<NodeConfig<Net>>(config);
		world.insert_resource::<EventSender<Net>>(EventSender { sender: event_sender });
		
		DiscoverySystem::<Net>::register_resources(&mut world);
		LatencyMetricsSystem::<Net>::register_resources(&mut world);
		NCSystem::<Net>::register_resources(&mut world);

		Self {
			world,
			_net: Default::default(),
		}
	}
	/// Runs the event loop of the node. This should be spawned in its own task.
	pub async fn run(mut self, mut action_receiver: mpsc::UnboundedReceiver<NodeAction<Net>>) -> Result<Self, Net::ConnectionError> {
		let config = self.world.resource::<NodeConfig<Net>>();
		
		log::info!("listener config: {:?}", config.listener_config);

		let (network, mut connection_stream) = Net::init(config.keys.clone(), &config.listener_config).await?;
		self.world.insert_resource::<Net::ListenerConfig>(config.listener_config.clone());
		self.world.insert_resource(network);

		// Create a new Schedule, which defines an execution strategy for Systems
		let mut schedule = Schedule::default();

		DiscoverySystem::<Net>::register_systems(&mut schedule);
		LatencyMetricsSystem::<Net>::register_systems(&mut schedule);
		NCSystem::<Net>::register_systems(&mut schedule);

		// Session threads send events to main ECS thread through this channel
		let (entity_event_sender, mut entity_event_receiver) = unbounded::<EntitySessionEvent<Net>>();

		// self.world.insert_resource::<EntityEventSender<Net>>(EntityEventSender { sender: entity_event_sender.clone() });

		let mut timer_500_millis = async_std::stream::interval(Duration::from_millis(500)).fuse();

		// Main event loop, awaits multiple futures (timers, session events, etc.) and runs the ECS schedule once
		loop {
			// Wait for events and handle them by updating world.
			futures::select! {
				// Handle events from sessions (i.e. remote packets or latency measurements)
				event = entity_event_receiver.next() => if let Some(event) = event {
					log::debug!("received from {:?}. SessionEvent: {:?}", event.entity, event.event);
					Self::handle_session_events(&mut self.world, event);
				},
				// Handle actions
				action = action_receiver.next() => if let Some(action) = action {
					log::debug!("received NodeAction: {action:?}");
					if let Err(err) = self.handle_node_action(action).await {
						log::error!("Error: {err}");
						break;
					}
				},
				// Handle new connections
				conn = connection_stream.next() => {
					log::debug!("received connection: {:?}", conn);
					match conn{
						Some(Ok(conn)) => self.handle_connection(conn, entity_event_sender.clone()),
						Some(Err(err)) => log::error!("failed to establish connection: {err}"),
						_ => { log::info!("Connection Stream closed."); break },
					}	
				}
				_ = timer_500_millis.next() => {
					self.handle_timer();
				}
				complete => break,
			}

			// Run schedule with updated world
			schedule.run(&mut self.world);
		}

		log::info!("node: shutting down");

		Ok(self)
	}
	fn handle_timer(&mut self) {
		change_should_update(&mut self.world);
		// All entities that have an active connection
		/* if let Some((rand_session, _rand_metrics)) =  {
			rand_session.send_packet(NodePacket::NCSystemPacket(NCSystemPacket::RequestNetworkCoordinates));
		} */
	}
	// Update the world based on events from active session threads.
	fn handle_session_events(world: &mut World, session_event: EntitySessionEvent<Net>) {
		let EntitySessionEvent { entity, event } = session_event;
		match event {
			SessionEvent::Packet(packet) => match packet {
				NodePacket::DiscoveryPacket(packet) => DiscoverySystem::handle_packet(world, entity, packet),
				NodePacket::NCSystemPacket(packet) => NCSystem::<Net>::handle_packet(world, entity, packet),
				NodePacket::Traversal(packet) => {
					// let system = handle_traversal_packet::<Net>(packet);
					// system.run(world., param_value)
					/* // If traversal packet is destined for me (either as a relay, or as actual recipient)
					// decrypt it and send as normal packet using entity_event_sender
					if receiver == world.resource::<NodeConfig<Net>>().node_id {
						if let Some(entity) = world.resource::<RemoteIDMap>().map.get(&receiver) {
							let packet = rkyv::check_archived_root::<'_, NodePacket<Net>>(&encrypted_packet).expect("failed to unarchive traversed packet");
							let packet = packet.deserialize(&mut rkyv::Infallible).unwrap();
							world.resource::<EntityEventSender<Net>>().sender.unbounded_send(EntitySessionEvent {
								entity: entity.clone(),
								event: SessionEvent::Packet(packet),
							}).ok();
						}
					} else { // Otherwise, send it to nearest peer that has coordinates closest to the destination.
						if let Some((sess, _)) = world.query::<(&Session<Net>, &Coordinates)>().iter(&world)
							.map(|(s, c)|(s, c.out_coord.dot(&destination)))
							.min_by(|(_, c1), (_, c2)| f64::partial_cmp(c1, c2).unwrap_or(Ordering::Equal)) {
							// Send packet
							// TODO: Should do buffer reuse here
							sess.send_packet(NodePacket::Traversal { destination, receiver, encrypted_packet })
						}
					} */
				}
				_ => unimplemented!(),
			}
			SessionEvent::LatencyMeasurement(measurement) => {
				LatencyMetricsSystem::<Net>::handle_packet(world, entity, measurement);
			},  
		}
	}
	async fn handle_node_action(&mut self, action: NodeAction<Net>) -> Result<(), NodeError<Net>> {
		match action {
			NodeAction::Connect(remote_id, remote_addr, pub_key) => {
				let entity = self.world.resource::<RemoteIDMap>().map.get(&remote_id).cloned();
				// Check if NodeID already registered in world. (Using HashMap mapping NodeID to Entity)
				let (pub_key, persistent_state) = if let Some(entity) = entity {
					// Check if already connected, if so no need to connect again.
					if self.world.get::<Session<Net>>(entity).is_some() {
						log::info!("NodeAction: Connect: Already Connected to Remote: {remote_id:?}");
						return Ok(());
					}

					// Check if Session exists and if so, also if the pub_key matches.
					let persistent_state = if let Some(session) = self.world.get::<SessionInfo<Net>>(entity) {
						if session.net_address != remote_addr {
							log::info!("NodeAction: Connect: Connecting to a different remote address than from previous Session")
						}
						session.persistent_state.clone()
					} else { None };
					
					(pub_key, persistent_state)
				} else {
					// If NodeID not registered, register it in RemoteIDMap
					let entity = self.world.spawn(Remote { id : remote_id.clone() } ).id();
					self.world.resource_mut::<RemoteIDMap>().map.insert(remote_id.clone(), entity);

					(pub_key, None)
				};
				// Connect to it via Network
				self.world.resource::<Net>().connect(remote_id, remote_addr, pub_key, persistent_state);
			},
			NodeAction::PrintNode => todo!(),
			NodeAction::ForwardPacket(_, _) => todo!(),
			NodeAction::EstablishRoute(_) => todo!(),
			NodeAction::FindRouter(_) => todo!(),
			NodeAction::GetInfo => {
				let remote_map = &self.world.resource::<RemoteIDMap>().map;
				let remotes = remote_map.into_iter().map(|(id, entity)|(id.clone(), entity.clone())).collect::<Vec<(NodeID, Entity)>>();
				
				let node_config = self.world.resource::<NodeConfig<Net>>();
				let coords = self.world.resource::<Coordinates>();
				self.send_event(NodeEvent::Info(node_config.node_id.clone(), node_config.listener_config.clone(), coords.clone(), remotes))?;
			},
			NodeAction::GetRemoteInfo(entity) => {
				if self.world.get_entity(entity).is_none() {
					log::error!("unknown entity: {entity:?}");
					return Ok(());
				}
				if let Ok((entity, remote, latency_metrics, coords)) = self.world.query::<(Entity, &Remote, &LatencyMetrics, Option<&Coordinates>)>().get(&self.world, entity) {
					let own_coords = self.world.resource::<Coordinates>();
					
					self.send_event(NodeEvent::RemoteInfo(
						entity,
						remote.id.clone(),
						latency_metrics.clone(),
						coords.cloned(),
						coords.map(|coords|own_coords.predict_latencies(coords))
					))?;
				} else {
					log::error!("entity {entity:?} exists but has components: {:?}", self.world.inspect_entity(entity).iter().map(|info|info.name()).collect::<Vec<&str>>());
				}
				
			},
		}
		Ok(())
	}
	fn send_event(&self, event: NodeEvent<Net>) -> Result<(), NodeError<Net>> {
		self.world.resource::<EventSender<Net>>().sender.unbounded_send(event)?;
		Ok(())
	}
	fn handle_connection(&mut self, connection: Connection<Net>, session_event_sender: UnboundedSender<EntitySessionEvent<Net>>) {
		// Derive remote ID
		let remote_id = NodeID::hash(connection.remote_pub_key.as_ref());

		log::info!("received connection from {remote_id:?} from address: {:?}", connection.incoming_address);

		// Search RemoteIDMap for entity given NodeID
		let entity = self.world.resource::<RemoteIDMap>().map.get(&remote_id).cloned();

		// Create Session info
		let session_info = SessionInfo::<Net> {
			net_address: connection.incoming_address.clone(),
			remote_pub_key: Some(connection.remote_pub_key.clone()),
			persistent_state: Some(connection.persistent_state.clone()),
		};

		// Create new or Update relevant entity SessionInfo
		let entity_id = if let Some(entity_id) = entity {
			let mut entity = self.world.entity_mut(entity_id);
			entity.insert(session_info);
			entity_id
		} else {
			let entity = self.world.spawn((Remote { id: remote_id.clone() }, session_info)).id();
			self.world.resource_mut::<RemoteIDMap>().map.insert(remote_id, entity);
			entity
		};

		// Spawn session
		let mut entity_mut = self.world.entity_mut(entity_id);

		let connection_requested = connection.requested;
		let session = Session::spawn(connection, entity_id, session_event_sender);

		entity_mut.insert(session);
		LatencyMetricsSystem::<Net>::register_components(&mut entity_mut);
		NCSystem::<Net>::register_components(&mut entity_mut);

		// If I am the initiator of the connection, I should send a public address if possible
		if connection_requested {
			// Add component marking the entity that is the receiver of the connection.
			entity_mut.insert(ConnReceiver);
		}
	}
}