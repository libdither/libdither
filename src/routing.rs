
use std::time::Instant;
#[derive(Debug)]
pub struct RouteMeasurement {
	latency: f32, // Measured in milliseconds
	bandwidth: u32, // Measured in kb / second
	last_measured: Instant, // Time last measured
	pub_address: Option<Multiaddr>,
}

#[derive(Debug)]
pub struct RoutingTable {
	my_id: PeerId,
	/// Maps peer id tuples to connection speed
	map: HashMap<(PeerId, PeerId), RouteMeasurement>,
	current_routes: Vec<(PeerId, PeerId)>,
}

impl RoutingTable {
	fn add_route(&mut self, requesting: PeerId, destination: PeerId) {
		self.map.insert((requesting, destination), )
	}
}

pub struct Router {
	
}