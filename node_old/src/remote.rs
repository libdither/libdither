//! This is the remote module, It manages actions too and from a remote node
//!

use std::{fmt, sync::Arc};

use crate::{NodeAction, NodeError, NodeID, RemoteIdx, RouteCoord, net::{Connection, Network}, packet::{PacketRead, PacketWrite, PingingNodePacket, ArchivedPingingNodePacket, ArchivedNodePacket, NodePacket}, ping::PingTracker};

use async_std::{sync::{Mutex, MutexGuard}, task::{self, JoinHandle}};
use cupchan::{CupchanReader, CupchanWriter};
use futures::{
	channel::mpsc::{self, Receiver, Sender},
	FutureExt, SinkExt, StreamExt,
};

use bytecheck::CheckBytes;
use rkyv::{Archive, Deserialize, Infallible, Serialize, option::ArchivedOption};
use rkyv_codec::{RkyvCodecError};

// Info stored by the node for the current session
#[derive(Debug, Clone)]
pub struct NodeSessionInfo {
	pub total_remotes: usize,
	pub remote_idx: RemoteIdx,
	pub is_active: bool,
}


#[derive(Debug)]
pub enum RemoteHandle<Net: Network> {
	Active { 
		shared_state: Arc<Mutex<Remote<Net>>>,
		join: JoinHandle<()>,
		sender: Sender<RemoteAction<Net>>,
		session_info_writer: CupchanWriter<NodeSessionInfo>,
	},
	Inactive { remote: Arc<Mutex<Remote<Net>>> },
}
impl<Net: Network> RemoteHandle<Net> {
	pub async fn action(&mut self, action: RemoteAction<Net>) -> Result<(), NodeError<Net>> {
		Ok(match self {
			RemoteHandle::Active { sender, .. } => {
				sender.send(action).await?
			}
			RemoteHandle::Inactive { .. } => Err(RemoteError::SessionInactive)?
		})
	}
	pub fn active(&self) -> bool { if let RemoteHandle::Active { .. } = self { true } else { false } }
	pub async fn connect(&mut self, connection: Connection<Net>) -> Result<(), NodeError<Net>> {
		self.action(RemoteAction::HandleConnection(connection)).await
	}
	pub async fn lock<'a>(&'a self) -> MutexGuard<'a, Remote<Net>> {
		let mutex = match self {
			RemoteHandle::Active { shared_state, .. } => shared_state,
			RemoteHandle::Inactive { remote } => remote
		};
		mutex.lock().await
	}
}
impl<Net: Network> fmt::Display for RemoteHandle<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			RemoteHandle::Active { shared_state, .. } => {
				let remote = task::block_on(shared_state.lock());
				writeln!(f, "[*] {}", remote)
			}
			RemoteHandle::Inactive { remote } => {
				let remote = task::block_on(remote.lock());
				writeln!(f, "[ ] {}", remote)
			},
		}
	}
}

/// Actions received from main thread.
#[derive(Debug)]
pub enum RemoteAction<Net: Network> {
	/// Bootstrap off of Net::Address
	Bootstrap,
	/// Send arbitrary NodePacket
	SendPacket(NodePacket<Net>),
	/// Handle new Connection
	HandleConnection(Connection<Net>),
	/// Query Route Coord from Route Coord Lookup (see NetAction)
	RouteCoordQuery(RouteCoord),

	/// Used by the main node to notify remote threads of any updated info
	UpdateInfo(NodeSessionInfo),

	AttemptSync,

	GetRemoteInfo,
}

#[derive(Error, Debug)]
pub enum RemoteError {
	#[error("no active session")]
	SessionInactive,
	#[error("packet codec: {0}")]
	CodecError(#[from] RkyvCodecError),

	#[error("failed to send message: {0}")]
	SendError(#[from] mpsc::SendError),

	#[error("invalid NodeID for connection, expected: {expected}, found: {found}")]
	InvalidConnection { expected: NodeID, found: NodeID }
}

/// Representation of all state needed for a direct connection with a remote
#[derive(Debug, Clone, Archive, Serialize, Deserialize)]
#[archive_attr(derive(CheckBytes))]
pub struct DirectRemote<Net: Network> {
	pub addr: Net::Address,
	pub route_coord: RouteCoord,
	pub remote_count: u32,
	pub considered_active: bool,

	pub ping_tracker: PingTracker,
}
impl<Net: Network> DirectRemote<Net> {
	pub fn new(addr: Net::Address) -> Self {
		Self {
			addr,
			route_coord: RouteCoord::default(),
			remote_count: 0,
			considered_active: false,
			ping_tracker: PingTracker::new(),
		}
	}
	pub fn attempt_sync(&self, shared: &Arc<Mutex<Remote<Net>>>, node_id: &NodeID) {
		if let Some(mut guard) = shared.try_lock() {
			*guard = Remote { node_id: node_id.clone(), state: RemoteState::Direct(self.clone()) };
		}
	}
	// Send packet as acknowledgement
	/* async fn send_ack(&mut self, writer: &mut PacketWrite<Net>, ack_ping: u16, packet: &NodePacket<Net>) -> Result<(), RemoteError> {
		log::debug!("Sending ack to {}: {:?}", self.addr, packet);
		let ping_id = if !self.ping_tracker.is_stable() {
			Some(self.ping_tracker.checkout_unique_id())
		} else { None };
		let packet = PingingNodePacket {
			packet,
			ping_id,
			ack_ping: Some(ack_ping),
		};
		Ok(writer.write_packet(&packet).await?)
	} */
	/// Send packet to writer, optionally acknowledge a previous packet, and note whether or not this packet should be acknowledged
	async fn send_packet(&mut self, writer: &mut PacketWrite<Net>, ack_ping: Option<u16>, packet: &NodePacket<Net>, can_ack: bool) -> Result<(), RemoteError> {
		log::debug!("Sending packet to {}: {:?}, can_ack: {}", self.addr, packet, can_ack);
		let ping_id = if can_ack && !self.ping_tracker.is_stable() {
			Some(self.ping_tracker.checkout_unique_id())
		} else { None };
		let packet = PingingNodePacket {
			packet,
			ping_id,
			ack_ping
		};
		Ok(writer.write_packet(&packet).await?)
	}
}

#[derive(Debug, Clone, Archive, Serialize, Deserialize)]
#[archive_attr(derive(CheckBytes))]
pub enum RemoteState<Net: Network> {
	// Node is directly connected
	Direct(DirectRemote<Net>),
	// Node communicates with remote by traversing packets through the network
	Traversed { route_coord: RouteCoord },
	Routed { routes: Vec<(RouteCoord, NodeID)> },
}

// All ephemeral data needed to communicate data to a node
#[derive(Debug)]
pub enum RemoteConnection<Net: Network> {
	Direct(Connection<Net>),
	Traversed, // only need Node info
	Routed(Vec<u128>) // Represents temporary encryption keys
}

#[derive(Debug, Clone, Archive, Serialize, Deserialize)]
#[archive_attr(derive(CheckBytes))]
pub struct Remote<Net: Network> {
	/// Unique NodeID of the remote
	pub node_id: NodeID,
	/// State of this node
	pub state: RemoteState<Net>,
}

impl<Net: Network> Remote<Net> {
	pub fn new_direct(node_id: NodeID, addr: Net::Address) -> Remote<Net> {
		Remote {
			node_id,
			state: RemoteState::Direct(DirectRemote::new(addr)),
		}
	}
	pub fn new_traversed(node_id: NodeID, route_coord: RouteCoord) -> Remote<Net> {
		Remote {
			node_id,
			state: RemoteState::Traversed { route_coord },
		}
	}
	/// Create codec 
	pub fn create_codec(connection: Connection<Net>, self_node_id: &NodeID) -> Result<(Net::Address, PacketRead<Net>, PacketWrite<Net>), RemoteError> {
		let Connection { node_id, addr, read, write } = connection;
		if node_id == *self_node_id {
			Ok((addr, PacketRead::new(read), PacketWrite::new(write)))
		} else {
			Err(RemoteError::InvalidConnection { expected: self_node_id.clone(), found: node_id })
		}
	}

	/// Spawn a remote handler that waits for a connection and bootstraps onto the network off of the remote
	pub fn spawn_bootstraping(
		node_id: NodeID,
		addr: Net::Address,
		mut node_action: Sender<NodeAction<Net>>,
		session_info_initial: NodeSessionInfo,
	) -> RemoteHandle<Net> {
		let this = Self::new_direct(node_id.clone(), addr.clone());
		let shared = Arc::new(Mutex::new(this.clone()));
		let (tx, mut action_receiver) = mpsc::channel(20);

		node_action.try_send(NodeAction::NetAction(crate::net::NetAction::Connect(node_id, addr))).unwrap();

		let (session_info_writer, session_info_reader) = cupchan::cupchan(session_info_initial);

		let mut initial_action_sender = tx.clone();
		let shared_state = shared.clone();
		let join = task::spawn(async move {
			loop {
				let action  = action_receiver.next().await;
				match action {
					Some(RemoteAction::HandleConnection(connection)) => {
						let connection = RemoteConnection::Direct(connection);
						initial_action_sender.send(RemoteAction::Bootstrap).await.unwrap();
						this.run(action_receiver, node_action, connection, session_info_reader, shared).await;
						break
					}
					Some(action) => log::warn!("Received: {:?} in bootstrapping mode", action),
					None => { log::info!("RemoteNode shutting down (was in bootstrapping mode)") }
				}
			}
		});
		RemoteHandle::Active { join, sender: tx, shared_state, session_info_writer }
	}
	/// Spawn a new remote handler from an incoming connection
	pub fn spawn_incoming(
		connection: Connection<Net>,
		node_action: mpsc::Sender<NodeAction<Net>>,
		initial_session_info: NodeSessionInfo,
	) -> RemoteHandle<Net> {
		let remote = Remote::new_direct(connection.node_id.clone(), connection.addr.clone());
		let shared = Arc::new(Mutex::new(remote));
		Remote::spawn_shared(shared, node_action, RemoteConnection::Direct(connection), initial_session_info)
	}

	/// Spawn a remote handler from a Arc<Mutex<Self>> and a RemoteConnection
	pub fn spawn_shared(
		shared: Arc<Mutex<Self>>,
		node_action: mpsc::Sender<NodeAction<Net>>,
		connection: RemoteConnection<Net>,
		initial_session_info: NodeSessionInfo,
	) -> RemoteHandle<Net> {
		let (action_sender, action_receiver) = mpsc::channel(20);
		let (session_info_writer, session_info_reader) = cupchan::cupchan(initial_session_info);

		let shared_state = shared.clone();
		let join = task::spawn(async move {
			let state = shared.lock().await.clone();
			state.run(action_receiver, node_action, connection, session_info_reader, shared).await
		});
		RemoteHandle::Active { join, sender: action_sender, shared_state, session_info_writer }
	}

	/// Handle active session
	#[allow(unused_variables)]
	async fn run(
		mut self,
		mut action_receiver: Receiver<RemoteAction<Net>>, // Receive actions from Node
		mut node_action: Sender<NodeAction<Net>>, // Send actions to node
		connection: RemoteConnection<Net>, // ephemeral data used to communicate with remote (i.e. packet writer, session keys)
		session_info_reader: CupchanReader<NodeSessionInfo>, // Externally updated state storing immediately-accessible info about node.
		shared: Arc<Mutex<Self>>, // Shared state with node.
	) {
		let Remote { node_id: self_node_id, state } = &mut self;
		// let self_node_id = & self.node_id;
		// let state = &mut self.state;
		let result: Result<(), RemoteError> = try {
			match (state, connection) {
				// Deal with direct connection
				(RemoteState::Direct(direct), RemoteConnection::Direct(conn)) => {
					let (addr, mut reader, mut writer) = Remote::create_codec(conn, &self_node_id)?;
					
					// Direct loop
					loop { futures::select! {
						// Receive Actions
						action = action_receiver.next() => {
							let action = if let Some(action) = action { action } else { continue };
							let result: Result<(), RemoteError> = try {
								log::debug!("Remote {} received action: {:?}", direct.addr, action);
								match action {
									RemoteAction::Bootstrap => {
										direct.send_packet(&mut writer, None,
											&NodePacket::Bootstrap { requester: self_node_id.clone() },
										true).await.unwrap();
									}
									RemoteAction::SendPacket(packet) => {
										direct.send_packet(&mut writer, None, &packet, true).await.unwrap();
									}
									RemoteAction::HandleConnection(connection) => {
										let (addr, reader_new, writer_new) = Remote::create_codec(connection, &self_node_id)?;
										reader = reader_new; writer = writer_new;
									},
									RemoteAction::AttemptSync => {
										direct.attempt_sync(&shared, &self_node_id);
									}
									_ => log::error!("Unsupported Remote Action in inactive state: {:?}", action),
								}
							};
						}
						// Receive Node Packets
						packet = reader.read_packet().fuse() => {
							let ret: Result<(), RemoteError> = try {
								let ArchivedPingingNodePacket { packet, ping_id, ack_ping } = packet?;
								let ping_id: Option<u16> = ping_id.deserialize(&mut Infallible).unwrap();
								// Register acknowledgement
								if let ArchivedOption::Some(ack_id) = ack_ping { direct.ping_tracker.return_unique_id(*ack_id); }
		
								log::debug!("Received packet from {}: {:?} [ping?:{:?},ack?:{:?}]", direct.addr, packet, ping_id, ack_ping);
								match packet {
									// If receive Bootstrap Request, send Info packet
									ArchivedNodePacket::Bootstrap { requester } => {
										let session_info = &*session_info_reader;
										direct.send_packet(&mut writer, ping_id, &NodePacket::Info {
											route_coord: direct.route_coord,
											active_peers: session_info.total_remotes,
											active: session_info.is_active,
											prompting_node: Some(requester.clone()),
										}, true).await?;
									},
									ArchivedNodePacket::Info { route_coord, active_peers, active, prompting_node: _ } => {
										direct.send_packet(&mut writer, ping_id, &NodePacket::Ack, true).await?;
										direct.route_coord = route_coord.clone();
										direct.remote_count = active_peers.clone();
										direct.considered_active = *active;
		
										// TODO: deal with prompting_node (figure out if it is even necessary)
										node_action.send(NodeAction::RegisterPeer(session_info_reader.remote_idx, direct.route_coord.clone())).await?;
										direct.attempt_sync(&shared, self_node_id);
									},
									ArchivedNodePacket::RequestPeers { nearby } => {
										node_action.send(NodeAction::HandleRequestPeers(session_info_reader.remote_idx, nearby.to_vec())).await?;
									},
									ArchivedNodePacket::WantPeer { requesting, addr } => {
										node_action.send(NodeAction::HandleWantPeer { requesting: requesting.clone(), addr: addr.deserialize(&mut Infallible).unwrap() }).await?;
									},
									ArchivedNodePacket::Ack => {
										if ping_id.is_some() { direct.send_packet(&mut writer, ping_id, &NodePacket::Ack, true).await?; }
										log::debug!("Received Ack Packet, stable: {}, ping(micros): {}", direct.ping_tracker.is_stable(), direct.ping_tracker.ping_min)
									},
									
									ArchivedNodePacket::Data(data) => log::info!("Received data: {}", String::from_utf8_lossy(data)),
									ArchivedNodePacket::Traversal { destination, session_packet } => todo!(),
									ArchivedNodePacket::Return { packet, origin } => todo!(),
								}
							};
							
						}
						complete => break,
					}}
				}
				// Deal with a Traversed connection
				(RemoteState::Traversed { route_coord }, RemoteConnection::Traversed) => {
					/* while let Some(action) = action_receiver.next().await {
						node_action.send(NodeAction::SendTraversed())
					} */
				}
				(RemoteState::Routed { routes }, RemoteConnection::Routed(keys)) => {},
				_ => {log::error!("Invalid remote state for connection type")},
			};
		};
		if let Err(err) = result {
			match err {
				RemoteError::CodecError(RkyvCodecError::IoError(io_error)) => {
					match io_error.kind() {
						std::io::ErrorKind::UnexpectedEof => log::info!("Remote {} disconnected", self.node_id),
						_ => log::error!("Remote {} I/O error: {}", self.node_id, io_error)
					}
				}
				_ => log::error!("Remote {} error: {}", self.node_id, err),
			}
		}
		// Make sure to sync to shared state
		let mut guard = shared.lock().await;
		*guard = self.clone();
	}
}

impl<Net: Network> fmt::Display for Remote<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		write!(f, "Remote({}): ", self.node_id)?;
		match &self.state {
			RemoteState::Direct(direct) => {
				writeln!(f, "Direct: {:?}", direct)?;
			}
			RemoteState::Traversed { route_coord } => writeln!(f, "Traversed: {:?}", route_coord)?,
			RemoteState::Routed { routes } => writeln!(f, "Routed: {:?}", routes)?,
		}
		Ok(())
	}
}