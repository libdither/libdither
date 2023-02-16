use std::{time::{Instant, Duration}};

use async_std::{task};
use bevy_ecs::prelude::*;
use futures::{select, channel::mpsc::{UnboundedSender, UnboundedReceiver, unbounded}, SinkExt, StreamExt, FutureExt};
use rkyv::{Deserialize, Archived};
use thiserror::Error;

use crate::{Network, NodeID, packet::{PacketRead, PacketWrite}, NodePacket, PingingNodePacket, Connection};

pub struct EntitySessionEvent<Net: Network> {
	pub entity_id: Entity,
	pub event: SessionEvent<Net>,
}
pub enum SessionEvent<Net: Network> {
	// TODO: Get rid of these stupid allocations
	Packet(Box<NodePacket<Net>>),
	LatencyMeasurement(Duration)
}

pub enum SessionAction<Net: Network> {
	Ping,
	Packet(Box<NodePacket<Net>>),
}

#[derive(Error, Debug)]
pub enum SessionError<Net: Network> {
	#[error("malformed packet")]
	MalformedPacket(#[from] rkyv_codec::RkyvCodecError),
	#[error("connection error: {0}")]
	ConnectionError(Net::ConnectionError),
	#[error("event send error")]
	SendError(#[from] futures::channel::mpsc::SendError)
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
	pub fn spawn(connection: Connection<Net>, entity_id: Entity, session_event_sender: UnboundedSender<EntitySessionEvent<Net>>) -> Session<Net> {
		
		// Session action sender
		let (action_sender, action_receiver) = unbounded();
		// Spawn session task with connection
		task::spawn(async move {
			if let Err(err) = SessionState::run(connection, entity_id, session_event_sender, action_receiver).await {
				log::warn!("Session closed with error: {err}")
			}
		});
		Session { action_sender }
	}
}

struct SessionState<Net: Network> {
	packet_write: PacketWrite<Net>,
	ping_tracker: PingTracker<16>,
	event_sender: UnboundedSender<EntitySessionEvent<Net>>,
	entity_id: Entity,
}
impl<Net: Network> SessionState<Net> {
	/// Run `Session` with network `Connection`
	async fn run(conn: Connection<Net>, entity_id: Entity, event_sender: UnboundedSender<EntitySessionEvent<Net>>, mut action_receiver: UnboundedReceiver<SessionAction<Net>>) -> Result<(), SessionError<Net>> {
		let mut packet_read = PacketRead::<Net>::new(conn.read);

		let mut state = SessionState {
			packet_write: PacketWrite::<Net>::new(conn.write),
			ping_tracker: PingTracker::<16>::default(),
			event_sender,
			entity_id,
		};

		loop {
			futures::select! {
				packet = packet_read.read_packet().fuse() => {
					state.handle_packet(packet?).await?;
				}
				action = action_receiver.next() => {
					if let Some(action) = action {
						state.handle_session_action(action).await?;
					}
				}
			}
		}
	}
	pub async fn handle_packet(&mut self, packet: &Archived<PingingNodePacket<Net>>) -> Result<(), SessionError<Net>> {
		let pinging_packet: PingingNodePacket<Net> = packet.deserialize(&mut rkyv::Infallible).unwrap();
				
		let event = SessionEvent::Packet(Box::new(pinging_packet.packet));

		self.event_sender.send(EntitySessionEvent { entity_id: self.entity_id, event }).await?;

		Ok(())
	}
	pub async fn handle_session_action(&mut self, action: SessionAction<Net>) -> Result<(), SessionError<Net>> {
		match action {
			SessionAction::Packet(packet) => {
				let ping_packet = PingingNodePacket {
					packet: *packet,
					ping_id: None,
					ack_ping: None,
				};
				self.packet_write.write_packet(&ping_packet).await?;
			},
				SessionAction::Ping => todo!(),
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
	where [(); MAX_PENDING as usize]: Sized + std::fmt::Debug + std::default::Default 
{
		fn default() -> Self {
				Self { ping_queue: [Default::default(); MAX_PENDING as usize], next_free_slot: Default::default() }
		}
}
/// Unique identifier for a ping. Used with `PingTracker`
struct PingID {
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
	where [(); MAX_PENDING as usize]: Sized + std::fmt::Debug + std::default::Default 
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