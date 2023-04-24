use std::{time::{Instant, Duration}, marker::PhantomData, sync::Arc};

use arc_swap::ArcSwap;
use async_std::{task};
use bevy_ecs::prelude::*;
use futures::{channel::mpsc::{UnboundedSender, UnboundedReceiver, unbounded, TrySendError}, SinkExt, StreamExt, FutureExt};
use rkyv::{Deserialize, Archived, Infallible, option::ArchivedOption};
use thiserror::Error;

use crate::{Network, packet::{PacketRead, PacketWrite}, NodePacket, PingingNodePacket, Connection, ArchivedNodePacket, TraversalPacket, NodeID};

#[derive(Debug)]
pub struct EntitySessionEvent<Net: Network> {
	pub entity: Entity,
	pub event: SessionEvent<Net>,
}

#[derive(Debug)]
pub enum SessionEvent<Net: Network> {
	// TODO: Get rid of these stupid allocations by passing the buffers around
	Packet(NodePacket<Net>),
	/// Notify main thread of latency measurement
	LatencyMeasurement(Duration),
	/// Send Traversal Packet to main thread to be sent
	Traversal(TraversalPacket),
}

/// Interact with remote Session
pub enum SessionAction<Net: Network> {
	// Send Ping NOW, set need_more_pings option if session should respond to acknowledged pings with new pings
	SetDesiredPingCount(usize),
	// Send a Packet to remote
	Packet(NodePacket<Net>),
}

#[derive(Error, Debug)]
pub enum SessionError<Net: Network> {
	#[error("malformed packet: {0}")]
	MalformedPacket(#[from] rkyv_codec::RkyvCodecError),
	#[error("connection error: {0}")]
	ConnectionError(Net::ConnectionError),
	#[error("event send error")]
	SendError(#[from] futures::channel::mpsc::SendError),
	#[error("event sender closed when sending message: {0}")]
	UnboundedSendError(#[from] TrySendError<EntitySessionEvent<Net>>)
}

/// Component that represents data required to connect to a remote node.
#[derive(Component, Clone)]
pub struct SessionInfo<Net: Network> {
	pub net_address: Net::Address,
	pub remote_pub_key: Option<Net::NodePubKey>,
	pub persistent_state: Option<Net::PersistentState>,
}

#[derive(Component)]
pub struct Session<Net: Network> {
	pub action_sender: UnboundedSender<SessionAction<Net>>,
}

impl<Net: Network> Session<Net> {
	pub fn spawn(connection: Connection<Net>, shared: Arc<ArcSwap<SessionSharedState<Net>>>, entity_id: Entity, session_event_sender: UnboundedSender<EntitySessionEvent<Net>>) -> Session<Net> {
		
		// Session action sender
		let (action_sender, action_receiver) = unbounded();
		// Spawn session task with connection
		task::spawn(async move {
			if let Err(err) = SessionState::run(connection, shared, entity_id, session_event_sender, action_receiver).await {
				log::warn!("Session for node {entity_id:?} closed with error: {err}");
			}
		});
		Session { action_sender }
	}
	pub fn send_action(&self, action: SessionAction<Net>) {
		if let Err(err) = self.action_sender.unbounded_send(action) {
			log::warn!("Tried to send SessionAction: {:?} but session was closed", err);
		}
	}
	pub fn send_packet(&self, packet: NodePacket<Net>) {
		if let Err(err) = self.action_sender.unbounded_send(SessionAction::Packet(packet)) {
			log::warn!("Tried to send NodePacket: {:?} but session was closed", err);
		}
	}
}

struct SessionState<Net: Network> {
	packet_write: PacketWrite<Net>,
	ping_tracker: PingTracker<64>,
	event_sender: UnboundedSender<EntitySessionEvent<Net>>,
	entity_id: Entity,
	ping_countdown: usize,
	last_ping: Option<Instant>,
	shared: Arc<ArcSwap<SessionSharedState<Net>>>,
}

pub struct SessionSharedState<Net: Network> {
	pub self_node_id: NodeID,
	pub _net: PhantomData<Net>,
}

impl<Net: Network> SessionState<Net> {
	/// Run `Session` with network `Connection`
	async fn run(conn: Connection<Net>, shared: Arc<ArcSwap<SessionSharedState<Net>>>, entity_id: Entity, event_sender: UnboundedSender<EntitySessionEvent<Net>>, mut action_receiver: UnboundedReceiver<SessionAction<Net>>) -> Result<(), SessionError<Net>> {
		let mut packet_read = PacketRead::<Net>::new(conn.read);

		let mut state = SessionState {
			packet_write: PacketWrite::<Net>::new(conn.write),
			ping_tracker: PingTracker::default(),
			event_sender,
			entity_id,
			ping_countdown: 0,
			last_ping: None,
			shared,
		};

		loop {
			futures::select! {
				packet = packet_read.read_packet().fuse() => {
					state.handle_ping_packet(packet?).await?;
				}
				action = action_receiver.next() => {
					if let Some(action) = action {
						state.handle_session_action(action).await?;
					}
				}
				complete => break,
			}
		}
		Ok(())
	}
	pub async fn handle_ping_packet(&mut self, pinging_packet: &Archived<PingingNodePacket<Net>>) -> Result<(), SessionError<Net>> {
		// Record acknowledged ping
		if let Some(ack) = pinging_packet.ack_ping.deserialize(&mut Infallible).unwrap() {
			if let Some(duration) = self.ping_tracker.record_unique_id(ack) {
				// Return latency measurement to main thread
				self.ping_countdown = self.ping_countdown.saturating_sub(1);
				self.event_sender.unbounded_send(EntitySessionEvent { entity: self.entity_id, event: SessionEvent::LatencyMeasurement(duration) })?;
			} else {
				log::debug!("session: ping tracker: error when recording acknowledged ping id");
			}
		}

		// Send back sent ping_id as acknowledgement
		// TODO: Implement some kind of delayed packet queue so this can be made more efficient (i.e. optionally queue certain outgoing packets so they may be sent with a ping acknowledgement)
		if let Some(ack_ping) = pinging_packet.ping_id.deserialize(&mut Infallible).unwrap() {
			// Gen ping id if session NEEDS MORE PINGS
			let ping_id = (self.ping_countdown != 0).then(||self.ping_tracker.gen_unique_id());
			// log::debug!("pinging: {:?} w/ ID: {:?}, ACK: {:?}", self.entity_id, ping_id, ack_ping);

			let packet = PingingNodePacket { packet: None, ping_id, ack_ping: Some(ack_ping) };
			self.packet_write.send(&packet).await?; // Send packet to remote
			self.packet_write.flush().await?; // Immediately send packet (bypassing nagle's algorithm)
			
			self.last_ping = Some(Instant::now());
		}

		// Send packet event if received
		if let ArchivedOption::Some(packet) = &pinging_packet.packet {
			self.handle_packet(packet).await?;
		}

		Ok(())
	}
	pub async fn handle_packet(&mut self, packet: &Archived<NodePacket<Net>>) -> Result<(), SessionError<Net>> {
		match packet {
			// Possibly Handle Traversal Packet search on session thread
			ArchivedNodePacket::Traversal(packet) => {
				let traversal_packet = packet.deserialize(&mut Infallible).unwrap();
				let shared = self.shared.load();
				if packet.recipient == shared.self_node_id {

				}
				self.event_sender.send(EntitySessionEvent { entity: self.entity_id, event: SessionEvent::Traversal(traversal_packet) }).await?;
			},
			packet => {
				let packet = packet.deserialize(&mut Infallible).unwrap();
				self.event_sender.send(EntitySessionEvent { entity: self.entity_id, event: SessionEvent::Packet(packet) }).await?;
			}
		}
		Ok(())
	}

	pub async fn handle_session_action(&mut self, action: SessionAction<Net>) -> Result<(), SessionError<Net>> {
		match action {
			SessionAction::Packet(packet) => {
				let ping_packet = PingingNodePacket {
					packet: Some(packet),
					ping_id: None,
					ack_ping: None,
				};
				self.packet_write.send(&ping_packet).await?;
			},
			SessionAction::SetDesiredPingCount(ping_count) => {
				self.ping_countdown = ping_count;
				if self.ping_countdown != 0 {
					self.ping_countdown = self.ping_countdown.saturating_sub(1);
					// log::debug!("{:?} needed ping count: {:?}", self.entity_id, self.ping_countdown);
					if self.last_ping.is_none() || self.last_ping.unwrap().elapsed() > Duration::from_millis(200) {
						let ping_id = (self.ping_countdown != 0).then(||self.ping_tracker.gen_unique_id());
						let packet = PingingNodePacket::<Net> { packet: None, ping_id, ack_ping: None };
						// log::debug!("{:?} sending ping: {packet:?}", self.entity_id);
						self.last_ping = Some(Instant::now());
						self.packet_write.send(&packet).await?;
						self.packet_write.flush().await?;
					}
				}
			},
		}
		Ok(())
	}
}


/// High-performance Ping Tracker
#[derive(Debug, Clone)]
struct PingTracker<const MAX_PENDING: u8>
	where [(); MAX_PENDING as usize]: Sized + std::fmt::Debug
{
	// Slotmap-like staticly-sized queue for maximum performance! :D
	// PingSlot is either used Instant(Instant), or stores the next free slot in the list.
	// u8 represents the slot's current generation.
	ping_queue: [(PingSlot, u8); MAX_PENDING as usize],
	// Index into ping_queue, represents next free index.
	next_free_slot: u8,
}
impl<const MAX_PENDING: u8> Default for PingTracker<MAX_PENDING>
	where [(); MAX_PENDING as usize]: Sized + std::fmt::Debug
{
	fn default() -> Self {
		Self { ping_queue: [(PingSlot::default(), 0); MAX_PENDING as usize], next_free_slot: Default::default() }
	}
}
/// Unique identifier for a ping. Used with `PingTracker`
#[derive(Debug, Clone, rkyv::Archive, rkyv::Serialize, rkyv::Deserialize)]
#[archive_attr(derive(bytecheck::CheckBytes))]
pub struct PingID {
	id: u8,
	gen: u8,
}
#[derive(Default, Debug, Clone, Copy)]
enum PingSlot {
	#[default]
	Init,
	Instant(Instant),
	NextSlot(u8),
}
impl<const MAX_PENDING: u8> PingTracker<MAX_PENDING>
	where [(); MAX_PENDING as usize]: Sized + std::fmt::Debug 
{
	// Generate a unique id for this ping. Records the current time and waits for call to record_unique_id with the returned id.
	pub fn gen_unique_id(&mut self) -> PingID {
		// Wrap next slot pointer around to zero if not enough free slots.
		self.next_free_slot = self.next_free_slot % MAX_PENDING;

		// Get slot. Slot map be Init, have recorded Instant, or were previously cleared and store the next free slot. 
		let (slot, generation) = &mut self.ping_queue[self.next_free_slot as usize];
		let return_index = self.next_free_slot;
		match slot {
			// Has not been initialized yet. Implies next slot is uninitialized => Increment next_free_slot
			PingSlot::Init => self.next_free_slot += 1,
			// Has already been initialized and is waiting for call to record_unique_id.
			// The only way to encounter this is if we have run out of space in the static bufer.
			// Increment generation count to invalidate potential call to record_unique_id.
			// Increment next_free_slot because there is no space anyway, so we will have to overwrite.
			PingSlot::Instant(_) => {
				*generation += 1;
				self.next_free_slot += 1;
			},
			// Has been previously initialized and then recorded, contains index of free slot. Record Instant and set next_free_slot to contained index.
			PingSlot::NextSlot(next_free_slot) => self.next_free_slot = *next_free_slot,
		}
		// Record Instant in slot.
		*slot = PingSlot::Instant(Instant::now());

		// Return ID and generation for slot.
		PingID { id: return_index, gen: *generation }
	}

	// Takes previously generated unique id and returns the time elapsed from generation. May return None if PingID does not match a valid slot or is in an invalid generation.
	pub fn record_unique_id(&mut self, id: PingID) -> Option<Duration> {
		match self.ping_queue.get_mut(id.id as usize) {
			Some((slot, generation)) => {
				match slot {
					PingSlot::Instant(sent_time) => {
						// Calculate duration.
						let duration = Instant::now().duration_since(*sent_time);
						if *generation == id.gen {
							*slot = PingSlot::NextSlot(self.next_free_slot); // Slot this NextSlot index to current free slot index
							self.next_free_slot = id.id; // Set current free slot index to this slot.
							Some(duration)
						} else {
							None // Invalid Generation
						}
					}
					_ => None, // Invalid Slot type
				}
			},
			None => None, // Invalid slot index
		}
	}
}

#[cfg(test)]
mod test {
	use std::thread::sleep;

use super::*;

	#[test]
	fn test_ping_tracker() {
		let mut tracker = PingTracker::<5>::new();
		let ping_id = tracker.gen_unique_id();
		sleep(Duration::from_millis(10));
		tracker.record_unique_id().unwrap();

		let first_ping_id = tracker.gen_unique_id();
		for _ in 0..4 {
			tracker.gen_unique_id();
		}
		let ping_id = tracker.gen_unique_id();
	}
}