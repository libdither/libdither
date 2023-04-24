//! This node system is for peer discovery. It requests for peers from another node and receives a list of peers to connect to or awaits connections from other peers.

use bevy_ecs::prelude::*;use crate::{NodeSystem, Network, LatencyMetrics, Coordinates};

pub struct LoggingSystem<Net: Network> {
	_net: std::marker::PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for LoggingSystem<Net> {
	fn register_systems(schedule: &mut Schedule) {
		// schedule.add_system(handle_peer_request::<Net>);
		schedule.add_system(coord_logging);
		// schedule.add_system(handle_conn_request::<Net>);
	}
}

fn coord_logging(own_coord: Res<Coordinates>, peers: Query<(&LatencyMetrics, &Coordinates)>) {
	if own_coord.is_changed() {
		// Measure 
		let prediction_diffs = peers.iter().map(|(lat, coord)|
			(lat.min_latency() as f64 - own_coord.out_coord.dot(&coord.in_coord)).abs()
		).collect::<Vec<f64>>();
		let diff_sum = prediction_diffs.iter().sum::<f64>();
		log::info!("Updated coordinate. Diff Sum: {diff_sum}, Diffs: {prediction_diffs:?}");
	}
	
}