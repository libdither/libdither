use std::{time::{Duration, Instant}, marker::PhantomData};

use argmin::{core::{CostFunction, Gradient, IterState, Solver, Problem, State}, solver::{linesearch::MoreThuenteLineSearch, gradientdescent::SteepestDescent}};
use argmin_math::{ArgminDot, ArgminScaledAdd, ArgminMul, ArgminAdd};
use bevy_ecs::prelude::*;

use bytecheck::CheckBytes;

use rkyv::{Serialize, Archive, Deserialize};

use crate::{LatencyMetrics, session::Session, NodePacket, Network, NodeSystem, Latency};

const COORDINATE_DIMENSIONS: usize = 5;

pub type NetworkCoord = nalgebra::SVector<f64, COORDINATE_DIMENSIONS>;

#[derive(Debug, Clone, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[archive_attr(derive(CheckBytes, Debug))]
pub enum NCSystemPacket {
    // If network is new, request latencies
	RequestNetworkCoordinates,
	NotifyNetworkCoordinates(Coordinates),
}

pub struct NCSystem<Net: Network> {
	_net: PhantomData<Net::Address>,
}
impl<Net: Network> NodeSystem for NCSystem<Net> {
    fn register_resources(world: &mut World) {
        // Init NC Resources
		world.insert_resource(Coordinates::new());
		world.insert_resource(CoordinateSolver::new());
		world.insert_resource(CoordinateSolverState::default());
		world.insert_resource(CoordinateSolverProblem::default());
		world.insert_resource(ShouldUpdate::default());
    }

    fn register_systems(schedule: &mut Schedule) {
		// Register NC Systems
		schedule.add_system(setup_session::<Net>);

		schedule.add_systems((
			nc_system_controller,
			calculate_weights.run_if(resource_changed::<ShouldUpdate>()),
			network_coordinate_system.run_if(resource_changed::<ShouldUpdate>()),
			push_coordinates::<Net>.run_if(resource_changed::<Coordinates>()),
		).chain());
	}

	fn register_components(entity_mut: &mut bevy_ecs::world::EntityMut) {
		entity_mut.insert(CoordinateWeight::default());
	}

    type Packet = NCSystemPacket;

    fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {
		match packet {
			// My network coordinates have been requested, make sure to send them back
			NCSystemPacket::RequestNetworkCoordinates => {
				let coords = world.resource::<Coordinates>();
				world.entity(entity).get::<Session<Net>>().unwrap().send_packet(NodePacket::NCSystemPacket(NCSystemPacket::NotifyNetworkCoordinates(coords.clone())));
			},
			// Received a remote's network coordinates, make sure to record them.
			NCSystemPacket::NotifyNetworkCoordinates(coords) => {
				// log::debug!("received coordinates from {:?}: {:?}", entity, coords);
				world.entity_mut(entity).insert(coords);
			},
		}
	}
	
}

// When a new session is established, send coordinates
fn setup_session<Net: Network>(
	coords: Res<Coordinates>,
	query: Query<&Session<Net>, Added<Session<Net>>>
) {
	for session in &query {
		session.send_packet(NodePacket::NCSystemPacket(NCSystemPacket::NotifyNetworkCoordinates(coords.clone())));
	}
}

#[derive(Debug, Clone, Default, Component, Resource, Archive, Serialize, Deserialize, serde::Serialize, serde::Deserialize)]
#[archive_attr(derive(CheckBytes, Debug))]
pub struct Coordinates {
	pub out_coord: NetworkCoord, // Outgoing coord for this node dot incoming coord for remote = predicted RTT latency from this node to remote
	pub in_coord: NetworkCoord,
}
impl Coordinates {
	pub fn new() -> Self {
		Coordinates { out_coord: NetworkCoord::new_random(), in_coord: NetworkCoord::new_random() }
	}
	pub fn predict_latencies(&self, other: &Coordinates) -> (Latency, Latency) {
		let outgoing = (self.out_coord.dot(&other.in_coord) * 1000.0) as Latency;
		let incoming = (self.in_coord.dot(&other.out_coord) * 1000.0) as Latency;
		(outgoing, incoming)
	}
}
impl ArgminDot<Coordinates, f64> for Coordinates {
    fn dot(&self, other: &Coordinates) -> f64 {
		self.out_coord.dot(&other.out_coord) + self.in_coord.dot(&other.in_coord)
    }
}
impl ArgminMul<f64, Coordinates> for Coordinates {
    fn mul(&self, other: &f64) -> Coordinates {
        Coordinates {
			out_coord: self.out_coord * *other,
			in_coord: self.in_coord * *other
		}
    }
}
impl ArgminAdd<Coordinates, Coordinates> for Coordinates {
    fn add(&self, other: &Coordinates) -> Coordinates {
        Coordinates {
			out_coord: self.out_coord + other.out_coord,
			in_coord: self.in_coord + other.in_coord,
		}
    }
}
impl ArgminScaledAdd<Coordinates, f64, Coordinates> for Coordinates {
    fn scaled_add(&self, factor: &f64, vec: &Coordinates) -> Coordinates {
        self.add(&vec.mul(factor))
    }
}

/// Changes when there is a new latency measurement and coordinate to use to update own coordinates
#[derive(Resource, Default)]
pub struct ShouldUpdate {
	last_changed: u32,
}
// Manages the state of the NC System and initiates state changes
fn nc_system_controller(mut query: Query<(Ref<LatencyMetrics>, Ref<Coordinates>)>, mut should_update: ResMut<ShouldUpdate>) {
	for (metrics, coords) in query.iter_mut() {
		// if both metrics and coords changed (and there is at least 1 latency measurement), update ShouldUpdate
		// state.last_changed is initialized at zero, so as soon as LatencyMetrics and Coordinates are inserted as Components, ShouldUpdate will change
		if metrics.last_changed() > should_update.last_changed && coords.last_changed() > should_update.last_changed {
			// log::debug!("metrics: {:?}, coords: {:?}, state: {:?}", metrics.last_changed(), coords.last_changed(), update.last_changed);
			should_update.last_changed = u32::max(metrics.last_changed(), coords.last_changed());
		}
	}
}
/* pub fn change_should_update(world: &mut World) {
	let mut query = world.query::<(Entity, &mut ShouldUpdate)>();
	query.for_each_mut(world, |(_, mut update)| {
		// log::debug!("Set ShouldUpdate for {:?}", entity);
		update.set_changed();
	})
} */

/// Uses latency measurements to iteratively update network coordinates
/// 
/// Current implementation: https://orbi.uliege.be/bitstream/2268/136727/1/phdthesis.pdf#page=36
/// 
/// Other inspirations: [Phoenix](https://user.informatik.uni-goettingen.de/~ychen/papers/Phoenix_TNSM.pdf), [DMFSGD](https://arxiv.org/pdf/1201.1174.pdf)

#[derive(Debug, Component, Default)]
struct CoordinateWeight {
	value: f64,
}
fn calculate_weights(mut query: Query<(&LatencyMetrics, &mut CoordinateWeight)>) {
	let mut a_max = Duration::from_micros(1);
	// calculate last received measurement from nodes (a_max)
	for (metrics, _) in query.iter_mut() {
		let since_update = metrics.last_update().elapsed();
		a_max = a_max.max(since_update);
	}

	let now = Instant::now();
	// calculate duration_sum: sum (a_max - a_j) where a_j is a given peer's time since last measurement
	let duration_sum = query.iter()
		.map(|(metrics, _)|metrics.last_update().duration_since(now))
		.map(|a_j|a_max - a_j)
		.sum::<Duration>();

	if duration_sum == Duration::ZERO { return }

	// calculate weights: w_j = (a_max - a_j) / duration_sum )
	for (metrics, mut weight) in query.iter_mut() {
		let elapsed = metrics.last_update().duration_since(now);
		weight.value = (a_max.as_millis() as f64 - elapsed.as_millis() as f64) / duration_sum.as_millis() as f64;
	}
}

#[derive(Resource)]
struct CoordinateSolverState {
	state: IterState<Coordinates, Coordinates, (), (), f64>
}
impl Default for CoordinateSolverState {
    fn default() -> Self {
        Self { state: IterState::new() }
    }
}
#[derive(Resource)]
struct CoordinateSolverProblem {
	problem: Problem<CoordinateProblem>,
}
impl Default for CoordinateSolverProblem {
    fn default() -> Self {
        Self { problem: Problem { problem: None, counts: Default::default() } }
    }
}

fn network_coordinate_system(
	mut coordinates: ResMut<Coordinates>,
	mut solver: ResMut<CoordinateSolver>,
	mut solver_state: ResMut<CoordinateSolverState>,
	mut solver_problem: ResMut<CoordinateSolverProblem>,
	mut query: Query<(Entity, &Coordinates, &LatencyMetrics, &CoordinateWeight)>,
) {
	// log::debug!("running coordinate update using data from {:?}: coord: {:?}, lat: {:?}, weight: {:?}", entity, coordinates, metrics.latest_latency(), weight);
	let problem = solver_problem.problem.problem.get_or_insert(CoordinateProblem::default());
	problem.remote_measurements.clear();
	problem.remote_coords.clear();
	problem.remote_weights.clear();
	problem.incoming = false;
	// Update coordinate with all recent latencies and coordinates
	for (entity, coords, metrics, weight) in query.iter() {
		problem.remote_measurements.push(Duration::from_micros(metrics.latest_latency()).as_secs_f64() * 1000.0);
		problem.remote_coords.push(coords.clone());
		problem.remote_weights.push(weight.value);
	}

	let mut state = solver_state.state.clone();
	state.param = Some(coordinates.clone());

	if state.get_iter() == 0 {
		// log::debug!("Initiating state");
		state = solver.solver.init(&mut solver_problem.problem, state).unwrap().0;
		state.update();
		state.func_counts(&solver_problem.problem);
	}

	match solver.solver.next_iter(&mut solver_problem.problem, state.clone()) {
		Ok((new_state, _)) => {
			state = new_state;
			state.func_counts(&solver_problem.problem);
			state.update();
			state.increment_iter();
		},
		Err(err) => log::error!("error running coordinate solver: {err:?}"),
	}
	solver_state.state = state;
	if !query.is_empty() {
		// Update personal coordinates
		if let Some(coords) = solver_state.state.get_best_param() {
			log::debug!("Updating coordinates: {:?} -> {:?}, state: {:?}", &*coordinates, coords, solver_state.state);
			// log::debug!("Gradient: {:?}. Dist moved: {:?}", solver_state.state.get_gradient(), coordinates.out_coord.metric_distance(&coords.out_coord));
			*coordinates = coords.clone();
		} else {
			log::warn!("Failed to fetch parameter, current coords: {:?}, state: {:?}", &*coordinates, solver_state.state);
		}
	}
}

// When coordinate is updated, send coordinate to all peers (TODO: Make this lazy and use timeout to prevent flooding)
fn push_coordinates<Net: Network>(
	coordinates: ResMut<Coordinates>,
	peers: Query<&Session<Net>, With<Coordinates>>
) {
	for peer in &peers {
		peer.send_packet(NodePacket::NCSystemPacket(NCSystemPacket::NotifyNetworkCoordinates(coordinates.clone())));
	}
}


/// Solvevr wrapper for CoordinateProblem
#[derive(Resource)]
struct CoordinateSolver {
	solver: SteepestDescent<MoreThuenteLineSearch<Coordinates, Coordinates, f64>>,
}
impl CoordinateSolver {
	fn new() -> Self {
		Self {
			solver: SteepestDescent::new(MoreThuenteLineSearch::new())
		}
	}
}

/* /// Custom solver for CoordinateProblem
#[derive(Resource)]
struct CoordinateSolver {
	learning_rate: f64
}
impl CoordinateSolver {
	fn new() -> Self {
		Self {
			learning_rate: 0.0,
		}
	}
}

// reference: https://orbi.uliege.be/bitstream/2268/136727/1/phdthesis.pdf#page=41
impl<O> Solver<O, IterState<Coordinates, Coordinates, (), (), f64>> for CoordinateSolver
where
	// The Landweber solver requires `O` to implement `Gradient`. 
    // `P` and `G` indicate the types of the parameter vector and gradient,
    // respectively.
    O: Gradient<Param = Coordinates, Gradient = Coordinates>,
    /* // The parameter vector of type `P` needs to implement `ArgminScaledSub`
    // because of the update formula
    P: Clone + ArgminScaledSub<G, F, P>,
    // `F` is the floating point type (`f32` or `f64`)
    F: ArgminFloat, */
{
    const NAME: &'static str = "coordinate_solver";

    fn next_iter(&mut self, problem: &mut Problem<O>, mut state: IterState<Coordinates, Coordinates, (), (), f64>) -> Result<(IterState<Coordinates, Coordinates, (), (), f64>, Option<argmin::core::KV>), argmin::core::Error> {
        let mut param = state.take_param().ok_or_else(argmin::argmin_error_closure!(
            NotInitialized,
            "Initial parameter vector required!"
        ))?;
		let gradient = problem.gradient(&param)?;
		param.out_coord = (1.0 - self.learning_rate * REGULARIZATION_COEFF) * param.out_coord - self.learning_rate * gradient.out_coord;
		param.in_coord = (1.0 - self.learning_rate * REGULARIZATION_COEFF) * param.in_coord - self.learning_rate * gradient.in_coord;
		Ok((state.param(param), None))
    }
} */

/// Defines the CostFunction and Gradient for the coordinate estimation problem (i.e. decentralized matrix completion)
#[derive(Default)]
struct CoordinateProblem {
	remote_measurements: Vec<f64>,
	remote_coords: Vec<Coordinates>,
	remote_weights: Vec<f64>,
	/// Whether or not the measurement was initiated from the remote (incoming = true), or initiated locally to the remote (incoming = false)
	incoming: bool,
}

// Currently using L2 Norm as loss function
fn loss(predicted: f64, expected: f64) -> f64 {
	let out = predicted - expected;
	out * out
}
// Gradient of L2 Norm. Gradient is positive if predicted < expected. 
fn loss_gradient(predicted: f64, expected: f64) -> f64 {
	predicted - expected
}

const REGULARIZATION_COEFF: f64 = 2.0;

// Cost function and gradients given by: https://orbi.uliege.be/bitstream/2268/136727/1/phdthesis.pdf#page=36
impl CostFunction for CoordinateProblem {
    type Param = Coordinates;

    type Output = f64;

    fn cost(&self, param: &Self::Param) -> Result<Self::Output, argmin::core::Error> {
		let mut cost = 0.0f64;
		for (remote_measurement, remote_coords) in self.remote_measurements.iter().zip(self.remote_coords.iter()) {
			// Penalize differences between predicted and actual latency measurements
			// Predictions & coordinates are directional (Out_a * In_b) = predicted rtt from a -> b.
			let outgoing_prediction = param.out_coord.dot(&remote_coords.in_coord);
			let incoming_prediction = param.in_coord.dot(&remote_coords.out_coord);
        	cost += loss(incoming_prediction, *remote_measurement);
			cost += loss(outgoing_prediction, *remote_measurement);
		}
		

		// Penalize large norms of (local) in and out coords (to prevent coordinates from overfitting or becoming larger than necessary)
		cost += REGULARIZATION_COEFF * param.in_coord.norm_squared();
		cost += REGULARIZATION_COEFF * param.out_coord.norm_squared();

		Ok(cost)
    }
}
impl Gradient for CoordinateProblem {
    type Param = Coordinates;

	// These aren't actually "coordinates", just directional vectors, but they use the same type :P
    type Gradient = Coordinates;

    fn gradient(&self, param: &Self::Param) -> Result<Self::Gradient, argmin::core::Error> {
        // Calculate change in loss over out_coord and in_coord
		let mut gradient_out = NetworkCoord::zeros();
		let mut gradient_in = NetworkCoord::zeros();

		for (remote_measurement, remote_coords) in self.remote_measurements.iter().zip(self.remote_coords.iter()) {
			let outgoing_prediction = param.out_coord.dot(&remote_coords.in_coord);
			let incoming_prediction = param.in_coord.dot(&remote_coords.out_coord);

			gradient_out += -(remote_measurement - outgoing_prediction) * remote_coords.in_coord + REGULARIZATION_COEFF * param.out_coord;
			gradient_in  += -(remote_measurement - incoming_prediction) * remote_coords.out_coord + REGULARIZATION_COEFF * param.in_coord;
		}
		Ok(Coordinates { out_coord: gradient_out, in_coord: gradient_in })
    }
}