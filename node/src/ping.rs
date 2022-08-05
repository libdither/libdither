use std::time::Instant;

use rkyv::{Archive, Serialize, Deserialize};

use crate::RouteScalar;

use ::core::default::Default;
use rkyv::{Fallible, with::{ArchiveWith, SerializeWith, DeserializeWith}};

pub struct Skip;

impl<F> ArchiveWith<F> for Skip {
    type Archived = ();
    type Resolver = ();

    unsafe fn resolve_with(_: &F, _: usize, _: Self::Resolver, _: *mut Self::Archived) {}
}

impl<F, S: Fallible + ?Sized> SerializeWith<F, S> for Skip {
    fn serialize_with(_: &F, _: &mut S) -> Result<(), S::Error> {
        Ok(())
    }
}

impl<F: Default, D: Fallible + ?Sized> DeserializeWith<(), F, D> for Skip {
    fn deserialize_with(_: &(), _: &mut D) -> Result<F, D::Error> {
        Ok(Default::default())
    }
}

#[derive(Debug, Clone, Default, Archive, Serialize, Deserialize)]
pub struct PingTracker {
	// Use a kind of slotmap but with no values
	#[with(Skip)]
	ping_queue: Vec<(Option<Instant>, usize)>, // bool = index in use, usize = next free index
	free_head: usize,

	ping_count: usize, // Get at least 2 pings

	pub ping_min: RouteScalar,
}
impl PingTracker {
	pub fn new() -> Self {
		Self {
			ping_queue: Vec::with_capacity(8),
			free_head: 0,

			ping_count: 0,
			ping_min: RouteScalar::MAX,
		}
	}
	// Get new id
	pub fn checkout_unique_id(&mut self) -> u16 {
		let free_head = self.free_head;

		// Check if there is enough room for a slot
		if let Some((out, next_free)) = self.ping_queue.get_mut(free_head) {
			*out = Some(Instant::now());
			self.free_head = *next_free; // Set free head to the next one that will be free
		} else { // Otherwise push one to the end of the vec
			self.free_head = self.ping_queue.len(); // Set free_head to the one that will be free next
			self.ping_queue.push((Some(Instant::now()), self.free_head)); // Push current slot and next free slot data
		}
		free_head as u16
	}
	// Return acknowledged id
	pub fn return_unique_id(&mut self, id: u16) -> Option<()> {
		self.ping_count += 1;
		
		let next_free_head = id as usize;
		let (send_time, next_free) = self.ping_queue.get_mut(next_free_head)?;
		let send_time = send_time.take()?; // Make slot available
		*next_free = self.free_head; // After the one just removed is filled up again, self.free_head will be the next free slot.
		self.free_head = next_free_head; // Set free head to this slot which was just made available

		
		let ping_duration = Instant::now().duration_since(send_time).as_micros() as RouteScalar;
		
		if ping_duration < self.ping_min  { self.ping_min = ping_duration };
		Some(())
	}

	// Check if enough data has been gathered to stop returning ids
	pub fn is_stable(&self) -> bool {
		self.ping_count >= 4
	}
}