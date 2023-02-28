use std::{collections::HashMap, time::Instant};

use bevy_ecs::prelude::*;

use bytecheck::CheckBytes;
use nalgebra::{DMatrix};
use rkyv::{Serialize, Archive, Deserialize};

use crate::{NodeID, Latency, LatencyMetrics, Remote, session::Session, NodePacket, Network, RemoteIDMap};

const EARLY_HOSTS_THRESHOLD: usize = 20;
const COORDINATE_DIMENSIONS: usize = 7;

pub type NetworkCoord = nalgebra::SVector<i64, COORDINATE_DIMENSIONS>;

pub fn init_nc_resources(world: &mut World) {
	// Init NC Resources
	world.init_resource::<Coordinates>();
	world.insert_resource::<LatencyMatrix>(LatencyMatrix::new());
}
pub fn setup_nc_systems<Net: Network>(schedule: &mut Schedule) {
	// Init NC Systems
	schedule.add_system(nc_system_controller::<Net>);
	schedule.add_system(early_hosts_system.run_if(resource_exists::<LatencyMatrix>()));
	schedule.add_system(network_coordinate_system.run_if(|r: Option<Res<LatencyMatrix>>|r.is_none()));
}

#[derive(Debug, Archive, Serialize, Deserialize, Clone)]
#[archive(bound(serialize = "__S: rkyv::ser::ScratchSpace + rkyv::ser::Serializer"))]
#[archive_attr(derive(CheckBytes, Debug), check_bytes(bound = "__C: rkyv::validation::ArchiveContext, <__C as rkyv::Fallible>::Error: bytecheck::Error"))]
pub enum NCSystemPacket {
    // If network is new, request latencies
	RequestLatencies,
	Latencies(Vec<(NodeID, Latency)>),
}

// Status of entity if RequestLatencies is pending.
#[derive(Debug, Component)]
pub struct LatencyRequestActive(Instant);

pub fn handle_nc_packet<Net: Network>(world: &mut World, entity: Entity, packet: NCSystemPacket) {
    match packet {
        NCSystemPacket::RequestLatencies => {
            // Send back latencies if the network this node knows about is "small".
            if world.get_resource::<LatencyMatrix>().is_some() {
                let latencies = world.query::<(Entity, &LatencyMetrics)>()
                    .iter(world)
                    .map(|(e, l)|(world.entity(e).get::<Remote>().unwrap().id.clone(), l.min_latency()))
                    .collect::<Vec<(NodeID, Latency)>>();

				// Send response latencies packet
				let packet = NodePacket::NCSystemPacket(NCSystemPacket::Latencies(latencies));
                world.entity(entity).get::<Session<Net>>().unwrap().send_packet(packet).unwrap();
            }
        }
        NCSystemPacket::Latencies(latencies) => {
			// Received latencies, make sure request is not active.
			world.entity_mut(entity).remove::<LatencyRequestActive>();
            // If receive latencies, and in a small network, store them
            if let Some(matrix) = world.get_resource_mut::<LatencyMatrix>() {
				let own_id = &world.get_resource::<crate::NodeConfig<Net>>().unwrap().node_id;

                let remote_map = world.get_resource::<RemoteIDMap>().unwrap();
                let mut incoming_direct_latency: Option<Latency> = Default::default();

				let latencies = latencies.iter().flat_map(|(id, latency)|{
					match remote_map.map.get(id) {
						Some(entity) => Some((entity.clone(), *latency)),
						None if incoming_direct_latency.is_none() => {
							if id == own_id { incoming_direct_latency = Some(*latency) }
							None
						}
						_ => None,
					}
				}).collect();

				let outgoing_direct_latency = world.entity(entity).get::<LatencyMetrics>().unwrap().min_latency();
				let direct_latencies = (outgoing_direct_latency, incoming_direct_latency.unwrap_or(outgoing_direct_latency));
				log::debug!("registering latencies of {:?} in latency matrix: {:?}", entity, latencies);
                world.get_resource_mut::<LatencyMatrix>().unwrap().add_entity_latencies(entity, latencies, direct_latencies)
            }
        }
    }
}


#[derive(Debug, Resource)]
pub struct LatencyMatrix {
	// Set of entities that are registered in the latency_matrix. If when registered there are left-over measurements not added to the matrix, they are stored here.
	index_map: HashMap<Entity, (usize, Vec<(Entity, Latency)>)>,
	// Each row represents a node, each column of each row represents a latency measured from Row # -> Column #
	latency_matrix: DMatrix<f64>,
}
impl LatencyMatrix {
	/// Create a new latency matrix
	fn new() -> Self {
		Self {
			index_map: Default::default(),
			// Starts out as a 1x1 matrix with 1 value representing the latency between this node and itself.
			latency_matrix: DMatrix::zeros(1, 1),
		}
	}
	// When the network is small, and this node receives a limited set of measured latencies, each associated with a specific known entity
	fn add_entity_latencies(&mut self, entity: Entity, latencies: Vec<(Entity, Latency)>, direct_latencies: (Latency, Latency)) {
		let index = if let Some((index, _)) = self.index_map.get_mut(&entity) {
			*index
		} else {
			let num_matching_latencies = latencies.iter().filter(|(entity, _)|self.index_map.contains_key(&*entity)).count();

			// Check if latency measurements contained in `latencies` cover the entirety of index_map
			if num_matching_latencies != self.index_map.len() {
				return
			}
			
			// Get new index and resize latency_matrix
			let new_index = self.latency_matrix.nrows();
			self.latency_matrix.resize_mut(new_index + 1, new_index + 1, 0.0);

			// Register new index and pending measurements
			self.index_map.insert(entity, (new_index, vec![]));

			new_index
		};

		// Register direct latency measurements
		self.latency_matrix[(index, 0)] = direct_latencies.0 as f64;
		self.latency_matrix[(0, index)] = direct_latencies.1 as f64;

		// Pending list of latency measurements from `entity` to nodes that are not registered in the matrix.
		// These are stored as pending to be added later when those nodes' latency lists are requessted
		let mut pending = Vec::<(Entity, Latency)>::new();

		// Add latencies to row `index` and column `index`
		for (remote_entity, outgoing_latency) in latencies {
			// If `remote_entity` is not registered in the index, add measurement to pending list.
			let Some((remote_index, remote_pending)) = self.index_map.get(&remote_entity) else {
				pending.push((entity, outgoing_latency));
				continue;
			};
			// Once I have the index:

			// Set outgoing row -> column latency
			self.latency_matrix[(index, *remote_index)] = outgoing_latency as f64;

			// Look for incoming latency on the pending list if available, otherwise use outgoing latency measurement from index node
			let incoming = remote_pending.iter().find_map(|(e, l)|(*e == entity).then_some(*l)).unwrap_or(outgoing_latency);
			self.latency_matrix[(*remote_index, index)] = incoming as f64;
		}
		self.index_map.get_mut(&entity).unwrap().1 = pending;

	}
	// Remove entity from the matrix
	fn remove_entity_latencies(&mut self, entity: Entity) {
		if let Some((index, _)) = self.index_map.remove(&entity) {
			self.latency_matrix = self.latency_matrix.clone()
				.remove_row(index)
				.remove_column(index);
		}
	}
}

#[derive(Debug, Clone, Default, Component, Resource)]
pub struct Coordinates {
	in_coord: NetworkCoord,
	out_coord: NetworkCoord,
}

/* pub fn manage_state_system(world: &mut World) {
	world.query::<&LatencyMetrics>().iter(world).count() >
} */
// Manages the state of the NC System and initiates state changes
pub fn nc_system_controller<Net: Network>(mut commands: Commands, mut latency_metrics: Query<(Entity, &LatencyMetrics, &Session<Net>, Option<&LatencyRequestActive>), Changed<LatencyMetrics>>) {
	for (entity, metrics, session, request_active) in latency_metrics.iter() {
		if metrics.latencies.len() >= 10 && request_active.is_none() {
			let _ = session.send_packet(NodePacket::NCSystemPacket(NCSystemPacket::RequestLatencies));
			// Mark that request was already sent
			commands.entity(entity).insert(LatencyRequestActive(Instant::now()));
		}
	}
}

/// Do non-negative matrix factorization for early host coordinates (this function should only run if LatencyMatrix exists as a resource)
pub fn early_hosts_system(mut coordinates: ResMut<Coordinates>, latency_matrix: Res<LatencyMatrix>) {
	let matrix = &latency_matrix.latency_matrix;
	let (w, h) = nnmf_nalgebra::non_negative_matrix_factorization_generic(
		matrix, 
		1000, 
		1.0, 
		nalgebra::Dyn(matrix.nrows()), 
		nalgebra::Dyn(matrix.ncols()), 
		nalgebra::Const::<COORDINATE_DIMENSIONS>);

	// Extract coordinates from latency_matrix
	coordinates.in_coord = w.row(0).clone().transpose().map(|m|m as i64);
	coordinates.out_coord = h.column(0).clone_owned().map(|m|m as i64);
}

/// Uses latency measurements to iteratively update network coordinates
/// Current implementation: Uses a weight-based update algorithm as outlined in [Phoenix](https://user.informatik.uni-goettingen.de/~ychen/papers/Phoenix_TNSM.pdf)
pub fn network_coordinate_system(coordinates: ResMut<Coordinates>, mut query: Query<(&mut Coordinates, &LatencyMetrics)>) {
	// If regular size network use update strategy as outlined in Phoenix paper.
	for (mut remote_coords, metrics) in query.iter_mut() {
		
	}
}
