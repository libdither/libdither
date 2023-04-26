
use bevy_ecs::prelude::*;
use crate::{NodeSystem, Network, LatencyMetrics, Coordinates};

pub struct LoggingSystem<Net: Network> {
	_net: std::marker::PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for LoggingSystem<Net> {
	fn register_systems(schedule: &mut Schedule) {
		schedule.add_system(coord_logging);
		schedule.add_system(measurement_logging);
	}
}

fn coord_logging(own_coord: Res<Coordinates>, peers: Query<(&LatencyMetrics, &Coordinates)>) {
	if own_coord.is_changed() {
		// Measure 
		let predicted_lats = peers.iter().map(|(_, coord)|
			(own_coord.out_coord.dot(&coord.in_coord) * 1000.0)
		).collect::<Vec<f64>>();
		let latencies = peers.iter().map(|(lat, _)| {
			lat.min_latency() as f64
		}).collect::<Vec<f64>>();


		let diff_sum = predicted_lats.iter().zip(latencies.iter()).map(|(pred, lat)|f64::abs(lat - pred)).sum::<f64>();
		log::info!("Updated coordinate. Predicted Lats: {predicted_lats:?}, Lats: {latencies:?} Diff Sum: {diff_sum}");
	}
}
fn measurement_logging(peers: Query<(Entity, &LatencyMetrics), Changed<LatencyMetrics>>) {
	for (entity, metrics) in peers.iter() {
		log::info!("New Latency Measurement from {:?}: {:?}", entity, metrics.latest_latency());
	}
}