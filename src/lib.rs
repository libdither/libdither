#![allow(dead_code)]
#![feature(try_blocks)]
#![feature(io_error_more)]

#[macro_use]
extern crate thiserror;

use std::net::SocketAddr;

use encryption::EncryptionError;
use futures::{StreamExt, channel::mpsc, SinkExt, FutureExt};
use async_std::{net::{TcpListener, TcpStream}, task};
use rkyv::Archived;

use node::net::Network;
pub use node::{self, Node, NodeAction, NodePacket, net::{NetAction, NetEvent, UserAction, UserEvent, Connection}};

pub mod commands;
pub mod encryption;
pub use commands::{DitherCommand, DitherEvent};

#[derive(Error, Debug)]
pub enum TransportError {
	#[error("failed to establish encrypted connection: {0}")]
	EncryptionError(#[from] EncryptionError<DitherNet>),
	#[error("io error: {0}")]
	IoError(#[from] std::io::Error),
}

pub struct DitherCore {
	stored_node: Option<Node<DitherNet>>,
	node_network_receiver: mpsc::Receiver<NetAction<DitherNet>>,
	node_network_sender: mpsc::Sender<NetAction<DitherNet>>,
	listen_addr: Address,
	event_sender: mpsc::Sender<DitherEvent>,
}

#[derive(Debug, Clone)]
pub struct DitherNet;
impl Network for DitherNet {
	type Address = SocketAddr;
	type ArchivedAddress = Archived<Self::Address>;
	type Read = TcpStream;
	type Write = TcpStream;
	type ConnectionError = TransportError;
}

pub type Address = <DitherNet as Network>::Address;

impl DitherCore {
	pub fn init(listen_addr: Address) -> anyhow::Result<(DitherCore, mpsc::Receiver<DitherEvent>)> {
		let (node_network_sender, node_network_receiver) = mpsc::channel(20);
		let node = Node::<DitherNet>::new(Node::<DitherNet>::gen_id());
		
		let (event_sender, dither_event_receiver) = mpsc::channel(20);
		let core = DitherCore {
			stored_node: Some(node),
			node_network_receiver,
			node_network_sender,
			listen_addr,
			event_sender,
		};

		Ok((core, dither_event_receiver))
	}
	pub async fn run(mut self, mut dither_command_receiver: mpsc::Receiver<DitherCommand>) -> anyhow::Result<Self> {
		let listener = TcpListener::bind(self.listen_addr).await?;
		let local_addr = listener.local_addr()?;
		log::debug!("Listening on: {:?}", local_addr);
		let mut incoming = listener.incoming();
		
		let ((node_join, mut node_action_sender), my_node_id) = if let Some(mut node) = self.stored_node {
			node.local_addr = Some(local_addr);
			let node_id = node.node_id.clone();
			(node.spawn(self.node_network_sender.clone()), node_id)
		} else { Err(anyhow::anyhow!("No stored node"))? };
		
		let node_network_receiver = &mut self.node_network_receiver;
		loop {
			futures::select! {
				dither_command = dither_command_receiver.next()  => {
					let result: anyhow::Result<()> = try {
						let dither_command = if let Some(command) = dither_command { command } else { break };
						// Handle Dither Commands
						match dither_command {
							DitherCommand::GetNodeInfo => node_action_sender.try_send(NodeAction::NetEvent(NetEvent::UserAction(UserAction::GetNodeInfo)))?,
							DitherCommand::NodeAction(action) => {
								if let Ok(action) = std::sync::Arc::try_unwrap(action) {
									node_action_sender.try_send(action)?;
								}
							}
							DitherCommand::Bootstrap(node_id, addr) => node_action_sender.try_send(NodeAction::Bootstrap(node_id, addr))?,
						}
					};
					if let Err(err) = result { log::error!("Dither Command error: {}", err) }
				}
				net_action = node_network_receiver.next() => { // Listen for net actions from Dither Node's Network API
					if let Some(net_action) = net_action {
						// log::debug!("Received NetAction: {:?}", net_action);
						let result: anyhow::Result<()> = try {
							// Handle Network Actions
							match net_action {
								NetAction::Connect(node_id, addr) => {
									log::debug!("Connecting to: {:?}", addr);
									let mut action_sender = node_action_sender.clone();
									let my_node_id = my_node_id.clone();
									let _ = task::spawn(async move {
										let result: Result<Connection<DitherNet>, TransportError> = try {
											let conn = TcpStream::connect(addr.clone()).await?;
											encryption::encrypt_outgoing(conn.clone(), conn, &my_node_id, &node_id, addr).await?
										};
										action_sender.send(NodeAction::NetEvent(NetEvent::ConnectResponse(result))).await.unwrap();
									});
								}
								NetAction::UserEvent(user_event) => {
									match user_event {
										UserEvent::NodeInfo(node_info) => {
											self.event_sender.send(DitherEvent::NodeInfo(node_info)).await?;
										}
									}
									
								}
							}
						};
						if let Err(err) = result { println!("NetAction error: {err}") }
					} else { break; }
				}
				tcp_stream = incoming.next().fuse() => {
					// Handle Incoming Connections
					if let Some(tcp_stream) = tcp_stream {
						let result: Result<Connection<DitherNet>, TransportError> = try {
							let stream = tcp_stream?;
							let addr = stream.peer_addr()?;
							let conn = encryption::encrypt_incoming(stream.clone(), stream, &my_node_id, addr).await?;
							log::debug!("Incoming connection: {:?}", conn);
							conn
						};
						match result {
							Ok(conn) => {
								if let Err(err) = node_action_sender.send(NodeAction::NetEvent(NetEvent::Incoming(conn))).await {
									log::error!("Failed to send new Connection to Node: {err}")
								}
							}
							Err(err) => log::error!("Failed to authenticate incoming connection: {err}"),
						}
						
					} else { log::info!("TCP Listener closed") }
				}
				complete => break,
			}
		}
		
		self.stored_node = Some(node_join.await);

		Ok(self)
	}
}

