use std::{time::{Duration, Instant}, collections::VecDeque, marker::PhantomData};

use bevy_ecs::prelude::*;

use crate::{NodeSystem, Network, Latency, session::{Session, SessionAction}};

pub struct LatencyMetricsSystem<Net: Network> {
	_net: PhantomData<Net::Address>,
}

impl<Net: Network> NodeSystem for LatencyMetricsSystem<Net> {
    fn register_systems(schedule: &mut Schedule) {
		schedule.add_system(session_setup::<Net>);
		schedule.add_system(notify_session_to_ping::<Net>);
    }

    type Packet = Duration;

    fn handle_packet(world: &mut World, entity: Entity, packet: Self::Packet) {
		let latency = packet.as_micros() as u64;
		if let Some(mut metrics) = world.entity_mut(entity).get_mut::<LatencyMetrics>() {
			metrics.register_latency(latency)
		} else {
			world.entity_mut(entity).insert(LatencyMetrics::new(latency));
		}
		
	}	
}

fn session_setup<Net: Network>(query: Query<&Session<Net>, Added<Session<Net>>>) {
	// Should ping at least once when session is established (We need this because we only create the LatencyMetrics component when first receiving a measurement)
	for session in &query {
		session.send_action(SessionAction::Ping(Some(1)));
	}
}

pub const MAX_MEASUREMENT_COUNT: usize = 20;

/// Information about latency measurements with a remote node
#[derive(Debug, Clone, Component)]
pub struct LatencyMetrics {
	latencies: VecDeque<Latency>,
	min_latency: Latency,

	last_update: Instant,

	pending_pings: usize,
}
impl LatencyMetrics {
	pub fn new(latency: Latency) -> Self {
		let mut ret = LatencyMetrics {
			latencies: VecDeque::new(),
			min_latency: latency,
			last_update: Instant::now(),
			pending_pings: 0,
		};
		ret.register_latency(latency);
		ret
	}
	// Register latency
	pub fn register_latency(&mut self, latency: Latency) {
		self.latencies.push_back(latency);
		if self.latencies.len() >= MAX_MEASUREMENT_COUNT { self.latencies.pop_front(); }
		self.last_update = Instant::now();
		self.pending_pings = self.pending_pings.saturating_sub(1);
	}
	pub fn latest_latency(&self) -> Latency {
		self.latencies.back().cloned().unwrap()
	}
	pub fn min_latency(&self) -> Latency {
		self.latencies.iter().min().unwrap().clone()
	}
	/// How many more pings we would like to receive at this moment, will return None if there are already pending pings
	pub fn how_many_more_pings(&mut self) -> Option<usize> {
		if self.pending_pings > 0 { return None }
		// Need 1 ping if more than 5 seconds have passed, otherwise 0
		let timeout_pings = (self.last_update.elapsed() >= Duration::from_secs(3)) as usize;
		
		// If there are less than 10 pings in the latency list, return the remaining needed number of pings
		let count_pings = MAX_MEASUREMENT_COUNT.saturating_sub(self.latencies.len());

		// Return max of required pings of the various counts
		self.pending_pings = usize::max(timeout_pings, count_pings);
		Some(self.pending_pings)
	}
	pub fn last_update(&self) -> Instant {
		self.last_update
	}
}

fn notify_session_to_ping<Net: Network>(mut query: Query<(&mut LatencyMetrics, &Session<Net>)>) {
	for (mut metrics, sess) in query.iter_mut() {
		if let Some(pings) = metrics.bypass_change_detection().how_many_more_pings() {
			if pings > 0 {
				sess.send_action(SessionAction::Ping(Some(pings)));
			}
		} else if metrics.last_update().elapsed() > Duration::from_millis(1000) { // If no measurement for more than 200 millis, notify session thread
			sess.send_action(SessionAction::Ping(None));
		}
	}
}