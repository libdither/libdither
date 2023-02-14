use std::sync::Arc;

use async_std::{sync::RwLock, task};
use bevy_ecs::prelude::*;
use futures::{select, channel::mpsc::{UnboundedSender, UnboundedReceiver, unbounded}, SinkExt, StreamExt};
use rkyv::Deserialize;
use thiserror::Error;

use crate::{Network, NodeID, packet::{PacketRead, PacketWrite}, NodePacket, PingingNodePacket, Connection};

pub struct EntitySessionEvent<Net: Network> {
	pub entity_id: Entity,
	pub event: SessionEvent<Net>,
}
pub enum SessionEvent<Net: Network> {
	Packet(Box<NodePacket<Net>>),
}

pub enum SessionAction<Net: Network> {
	Packet(Box<NodePacket<Net>>),
}

#[derive(Error, Debug)]
pub enum SessionError<Net: Network> {
	#[error("malformed packet")]
	MalformedPacket,
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
struct Session<Net: Network> {
	action_sender: UnboundedSender<SessionAction<Net>>,
}

impl<Net: Network> Session<Net> {
	pub fn spawn(connection: Connection<Net>, entity_id: Entity, session_event_sender: UnboundedSender<EntitySessionEvent<Net>>) -> Session<Net> {
		
		// Session action sender
		let (action_sender, action_receiver) = unbounded();
		// Spawn session task with connection
		task::spawn(async move {
			if let Err(err) = Self::run(connection, entity_id, session_event_sender, action_receiver).await {
				log::warn!("Session closed with error: {err}")
			}
		});
		Session { action_sender }
	}
	/// Run `Session` with network `Connection`
	pub async fn run(conn: Connection<Net>, entity_id: Entity, mut event_sender: UnboundedSender<EntitySessionEvent<Net>>, action_receiver: UnboundedReceiver<SessionAction<Net>>) -> Result<(), SessionError<Net>> {
	
		let (mut packet_read, packet_write) = (PacketRead::<Net>::new(conn.read), PacketWrite::<Net>::new(conn.write));
	
		loop {
			futures::select! {
				packet = packet_read.read_packet().fuse() => {
					let pinging_packet: PingingNodePacket<Net> = packet.deserialize(&mut rkyv::Infallible).unwrap();
				
					let event = SessionEvent::Packet(Box::new(pinging_packet.packet));
		
					event_sender.send(EntitySessionEvent { entity_id, event }).await?;
				}
				action = action_receiver.next() => {
					if let Some(action) = action {
						Self::handle_session_action(action, &mut packet_write).await?;
					}
				}
			}
		}
	}
	pub async fn handle_session_action(action: SessionAction<Net>, packet_write: &mut PacketWrite<Net>) -> Result<(), SessionError<Net>> {
		
	}
}
