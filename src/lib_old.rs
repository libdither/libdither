#![allow(dead_code)]
#![feature(try_blocks)]
#![feature(async_fn_in_trait)]
#![feature(io_error_more)]

#[macro_use]
extern crate thiserror;

use futures::channel::mpsc;
use async_std::{task};
use net_tcp_noenc::TcpNoenc;

use node::{Network, Node, NodeConfig, NodeID, NodeAction};
pub use node::{self, NodePacket};

pub mod commands;
pub mod net_tcp_noenc;
pub use commands::{DitherCommand};
use rand::{RngCore, CryptoRng};

pub type DitherNet = TcpNoenc;

pub enum DitherEvent {

}

pub struct DitherCore {
	stored_node: Option<Node<DitherNet>>,
	listen_addr: Address,
	event_sender: mpsc::Sender<DitherEvent>,
}

pub type Address = <DitherNet as Network>::Address;

impl DitherCore {
	pub fn init(listen_addr: Address, rng: &mut (impl RngCore + CryptoRng)) -> anyhow::Result<(DitherCore, mpsc::Receiver<DitherEvent>)> {
		let mut private_key = vec![69; 16];
		rng.fill_bytes(&mut private_key);

		let node_config = NodeConfig::<DitherNet> {
			private_key: private_key.clone(),
			public_key: private_key.clone(), // WARN: Using private key as public key for testing purposes
			node_id: NodeID::hash(&private_key),
			listen_addrs: vec![listen_addr],
		};
		let (event_sender, event_receiver) = mpsc::unbounded();
		let node = Node::<DitherNet>::new(node_config, event_sender);
		
		let (event_sender, dither_event_receiver) = mpsc::channel(20);
		let core = DitherCore {
			stored_node: Some(node),
			listen_addr,
			event_sender,
		};

		Ok((core, dither_event_receiver))
	}
	// Main Dither eventloop, receives DitherCommand, talks to node eventloop via NodeAction. Sends back DitherEvents
	pub async fn run(mut self, _dither_command_receiver: mpsc::Receiver<DitherCommand>) -> anyhow::Result<Self> {

		let mut node = self.stored_node.take().ok_or_else(||anyhow::anyhow!("no node initiated"))?;

		let (_node_action_sender, node_action_receiver) = mpsc::channel::<NodeAction<DitherNet>>(20);

		let join = task::spawn(async move {
			node.run(node_action_receiver).await;
			node
		});

		self.stored_node = Some(join.await);

		Ok(self)


		/* let ((node_join, mut node_action_sender), my_node_id) = if let Some(mut node) = self.stored_node {
			node.local_addr = Some(local_addr);
			let node_id = node.node_id.clone();
			(node.spawn(self.node_network_sender.clone()), node_id)
		} else { Err(anyhow::anyhow!("No stored node"))? }; */
		
		/* let node_network_receiver = &mut self.node_network_receiver;
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
											net_tcp_noise::encrypt_outgoing(conn.clone(), conn, &my_node_id, &node_id, addr).await?
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
							let conn = net_tcp_noise::encrypt_incoming(stream.clone(), stream, &my_node_id, addr).await?;
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

		Ok(self) */
	}
}

