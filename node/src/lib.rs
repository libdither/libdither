#![allow(dead_code)]
#![allow(incomplete_features)]
#![feature(async_fn_in_trait)]
#![feature(return_position_impl_trait_in_trait)]
#![feature(generic_const_exprs)]
#![feature(drain_filter)]

pub mod session;
mod net;
mod packet;
pub mod nc_system;

use std::{collections::{HashMap, VecDeque}, time::Duration};

use bevy_ecs::prelude::*;
use futures::{channel::mpsc::{unbounded, self, UnboundedSender, TrySendError}, StreamExt};

use nc_system::{LatencyMatrix, Coordinates, init_nc_resources};
use session::*;
pub use net::*;
pub use packet::*;

type Latency = u64;
pub use nc_system::NetworkCoord;
use thiserror::Error;

use crate::nc_system::setup_nc_systems;

/// Multihash that uniquely identifying a node (represents the Multihash of the node's Public Key)
pub type NodeID = hashdb::Hash;

#[derive(Component)]
struct Remote {
	id: NodeID,
}

/// Actions that can be run by an external entity (either the internet implementation or the user)
#[derive(Debug)]
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
	Info(NodeID, Vec<Net::Address>, Coordinates, Vec<(NodeID, Entity)>),
	// Event returned for GetRemoteInfo
	RemoteInfo(Entity, NodeID, LatencyMetrics)
}

#[derive(Debug, Error)]
pub enum NodeError<Net: Network> {
	#[error("node event sender was closed: {0}")]
	NodeEventSenderClosed(#[from] TrySendError<NodeEvent<Net>>)
}

/// Contains ECS and Network implementation
pub struct Node<Net: Network> {
	world: World,
	_listen_addr: Net::Address,
}

#[derive(Default, Resource)]
pub struct RemoteIDMap {
	map: HashMap<NodeID, Entity>,
}

#[derive(Resource)]
pub struct NodeConfig<Net: Network> {
	pub private_key: Net::NodePrivKey,
	pub public_key: Net::NodePubKey,
	pub node_id: NodeID,
	pub listen_addrs: Vec<Net::Address>,
}
#[derive(Resource)]
pub struct EventSender<Net: Network> {
	sender: UnboundedSender<NodeEvent<Net>>,
}
impl<Net: Network> From<&NodeConfig<Net>> for NetConfig<Net> {
	fn from(value: &NodeConfig<Net>) -> Self {
		NetConfig {
			private_key: value.private_key.clone(),
			public_key: value.public_key.clone(),
			listen_addrs: value.listen_addrs.clone(),
		}
	}
}

impl<Net: Network> Node<Net> {
	pub fn new(config: NodeConfig<Net>, event_sender: UnboundedSender<NodeEvent<Net>>) -> Self {
		let _listen_addr = config.listen_addrs[0].clone();

		let mut world = World::new();
		world.init_resource::<RemoteIDMap>();
		world.insert_resource::<NodeConfig<Net>>(config);
		world.insert_resource::<EventSender<Net>>(EventSender { sender: event_sender });

		init_nc_resources(&mut world);

		Self {
			world,
			_listen_addr
		}
	}
	/// Runs the event loop of the node. This should be spawned in its own task.
	pub async fn run(mut self, mut action_receiver: mpsc::UnboundedReceiver<NodeAction<Net>>) -> Result<Self, Net::ConnectionError> {
		let config = self.world.resource::<NodeConfig<Net>>();
		let (network, mut connection_stream) = Net::init(config.into()).await?;
		self.world.insert_resource(network);

		// Create a new Schedule, which defines an execution strategy for Systems
		let mut schedule = Schedule::default();

		schedule.add_system(update_latencies::<Net>);

		setup_nc_systems::<Net>(&mut schedule);

		// Session threads send events to main ECS thread through this channel
		let (entity_event_sender, mut entity_event_receiver) = unbounded::<EntitySessionEvent<Net>>();

		// Main event loop, awaits multiple futures (timers, session events, etc.) and runs the ECS schedule once
		loop {
			// Wait for events and handle them by updating world.
			futures::select! {
				// Handle events from sessions (i.e. remote packets or latency measurements)
				event = entity_event_receiver.next() => if let Some(event) = event {
					log::debug!("received SessionEvent: {event:?}");
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
						Some(Err(err)) => log::error!("Incoming Connection Failed: {err}"),
						_ => { log::info!("Connection Stream closed."); break },
					}
					
				}
				complete => break,
			}

			// Run schedule with updated world
			schedule.run(&mut self.world);
		}

		log::info!("node: shutting down");

		Ok(self)
	}
	// Update the world based on events from active session threads.
	fn handle_session_events(world: &mut World, session_event: EntitySessionEvent<Net>) {
		let EntitySessionEvent { entity, event } = session_event;
		match event {
			SessionEvent::Packet(packet) => match packet {
				NodePacket::RequestPeer { near } => todo!(),
				NodePacket::WantPeer { requester_id, requester_addr } => todo!(),
				NodePacket::NCSystemPacket(packet) => {
					nc_system::handle_nc_packet::<Net>(world, entity, packet);
				}
				_ => unimplemented!(),
			}
			SessionEvent::LatencyMeasurement(measurement) => {
				// Update latest measured latency to new latency measurement
				world.entity_mut(entity).insert(LatestMeasuredLatency(measurement));
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
				self.send_event(NodeEvent::Info(node_config.node_id.clone(), node_config.listen_addrs.clone(), coords.clone(), remotes))?;
			},
			NodeAction::GetRemoteInfo(entity) => {
				if self.world.get_entity(entity).is_none() {
					log::error!("unknown entity: {entity:?}");
					return Ok(());
				}
				if let Ok((entity, remote, latency_metrics)) = self.world.query::<(Entity, &Remote, &LatencyMetrics)>().get(&self.world, entity) {
					self.send_event(NodeEvent::RemoteInfo(
						entity,
						remote.id.clone(),
						latency_metrics.clone(),
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

		log::info!("received connection from {remote_id:?} from address: {:?}", connection.net_address);

		// Search RemoteIDMap for entity given NodeID
		let entity = self.world.resource::<RemoteIDMap>().map.get(&remote_id).cloned();

		// Create Session info
		let session_info = SessionInfo::<Net> {
			net_address: connection.net_address.clone(),
			remote_pub_key: Some(connection.remote_pub_key.clone()),
			persistent_state: Some(connection.persistent_state.clone()),
		};

		// Create new or Update relevant entity SessionInfo
		let entity_id = if let Some(entity_id) = entity {
			let mut entity = self.world.entity_mut(entity_id);
			entity.insert(session_info);
			entity_id
		} else {
			self.world.spawn((Remote { id: remote_id }, session_info)).id()
		};

		// Spawn session
		let mut entity_mut = self.world.entity_mut(entity_id);
		let session = Session::spawn(connection, entity_id, session_event_sender);
		// Set need more pings to true
		let _ = session.action_sender.unbounded_send(SessionAction::SetDesiredPingCount(10));
		entity_mut.insert(session);
		entity_mut.insert(LatencyMetrics::default());
		
	}
}

#[derive(Debug, Component)]
pub struct LatestMeasuredLatency(Duration);

#[derive(Debug, Clone, Default, Component)]
pub struct LatencyMetrics {
	latencies: VecDeque<u64>,
	min_latency: u64,

	early_latencies: Option<Vec<(Entity, Latency)>>
}
impl LatencyMetrics {
	fn register_latency(&mut self, latency: u64) {
		self.latencies.push_back(latency);
	}
	fn min_latency(&self) -> u64 {
		self.latencies.iter().cloned().min().unwrap_or(u64::MAX)
	}
}

/// Uses latest measured latency to update latency metrics
fn update_latencies<Net: Network>(mut query: Query<(&mut LatencyMetrics, &LatestMeasuredLatency, &Session<Net>), Changed<LatestMeasuredLatency>>) {
	for (mut metrics, latency, session) in query.iter_mut() {
		metrics.register_latency(latency.0.as_micros() as u64);
		if metrics.latencies.len() == 10 {
			let _ = session.action_sender.unbounded_send(SessionAction::SetDesiredPingCount(10));
		}
	}
}