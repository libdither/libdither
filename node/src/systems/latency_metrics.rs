use std::{time::{Duration, Instant}, collections::VecDeque, marker::PhantomData};

use bevy_ecs::prelude::*;

use crate::{NodeSystem, Network, Latency, session::{Session, SessionAction}};


pub struct LatencyMetricsSystem<Net: Network> {
	_net: PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for LatencyMetricsSystem<Net> {
    fn register_resources(world: &mut World) {}

    fn register_systems(schedule: &mut Schedule) {
        schedule
			.add_system(latencies_update::<Net>);
    }

    type Packet = Duration;

    fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {
		world.entity_mut(entity).insert(LatestMeasuredLatency(packet));
	}	
}

/// Latest latency measurement
#[derive(Debug, Component)]
pub struct LatestMeasuredLatency(pub Duration);

/// Information about latency measurements with a remote node
#[derive(Debug, Clone, Default, Component)]
pub struct LatencyMetrics {
	latencies: VecDeque<Latency>,
	min_latency: Latency,

	early_latencies: Option<Vec<(Entity, Latency)>>,

	last_update: Option<Instant>,
}
impl LatencyMetrics {
	// Register latency
	pub fn register_latency(&mut self, latency: Latency) {
		self.latencies.push_back(latency);
		self.last_update = Some(Instant::now());
	}
	// Calculate minimum measured latency over the stored time period
	pub fn min_latency(&self) -> Latency {
		self.latencies.iter().cloned().min().unwrap_or(Latency::MAX)
	}
	pub fn remaining_pings(&self) -> usize {
		// Need 1 ping if more than 5 seconds have passed, otherwise 0
		let timeout_pings = self.last_update.map(|i|Instant::now().duration_since(i) >= Duration::from_secs(5)).unwrap_or(false) as usize;
		
		// If there are less than 10 pings in the latency list, return the remaining needed number of pings
		let count_pings = 10_usize.saturating_sub(self.latencies.len());

		// Return max of required pings of the various counts
		usize::max(timeout_pings, count_pings)
	}
}

/// Uses latest measured latency to update latency metrics
fn latencies_update<Net: Network>(mut query: Query<(&mut LatencyMetrics, &LatestMeasuredLatency, &Session<Net>), Changed<LatestMeasuredLatency>>) {
	for (mut metrics, latency, session) in query.iter_mut() {
		let needed_pings = metrics.remaining_pings();
		metrics.register_latency(latency.0.as_micros() as u64);
		let new_needed_pings = metrics.remaining_pings();
		if new_needed_pings >= needed_pings {
			session.send_action(SessionAction::SetDesiredPingCount(new_needed_pings));
		}
	}
}
