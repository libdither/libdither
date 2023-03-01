#![allow(incomplete_features)]
#![feature(try_blocks)]
#![feature(generic_const_exprs)]
#![feature(str_split_remainder)]
#![feature(async_fn_in_trait)]
#![feature(type_alias_impl_trait)]

use std::{net::{Ipv4Addr, SocketAddr}, io::Write, time::Duration};
use serde::{Serialize, Deserialize};

use anyhow::anyhow;
use async_std::task;
use bevy_ecs::prelude::Entity;
use futures::{SinkExt, StreamExt, FutureExt, channel::mpsc};

use node::{NodeID, NodePacket, NodeAction, Node, NodeConfig, Network};

use rand::{thread_rng, RngCore};
use rustyline_async::{Readline, ReadlineError, SharedWriter};

mod net_tcp_noenc;
use net_tcp_noenc::*;

type DitherNet = TcpNoenc;
type Address = <DitherNet as Network>::Address;

#[derive(Serialize, Deserialize)]
struct Command {
    action: NodeAction<DitherNet>,
    time: Duration,
}

#[async_std::main]
async fn main() -> anyhow::Result<()> {
    let mut args = std::env::args();
    let commands_path = Path::new(std::env::args().next().ok_or(anyhow!("requires command file"))?);

	println!("This version of Dither is run in a simulator. Reading {commands_path:?} for commands");

	// Parse listening addr
	let listen_port: u16 = match args.next().map(|s|s.parse()) {
		Some(Ok(port)) => port,
		None => return Err(anyhow!("Requires a port number as a second command line argument")),
		Some(Err(err)) => return Err(anyhow!("Failed to parse port number: {err}"))
	};
	let listen_addr = SocketAddr::new(Ipv4Addr::new(0, 0, 0, 0).into(), listen_port);

    // Open file & deserialize commands.
    

	// Generate fake private key for testing because I haven't implemented encryption yet
	let mut private_key = listen_addr.to_string().as_bytes().to_vec();

	// Generate node_config
	let node_config = NodeConfig::<DitherNet> {
		private_key: private_key.clone(),
		public_key: private_key.clone(), // WARN: Using private key as public key for testing purposes
		node_id: NodeID::hash(&private_key),
		listen_addrs: vec![listen_addr],
	};
	// Create node & channels
	let (event_sender, mut event_receiver) = mpsc::unbounded();
	let node = Node::<DitherNet>::new(node_config, event_sender);
	
	let (mut action_sender, action_receiver) = mpsc::unbounded();

	// Run node on separate task
	let mut node_join = task::spawn(node.run(action_receiver)).fuse();

	// Send NodeAction to check for errors in the bevy schedule
	action_sender.send(NodeAction::GetInfo).await?;


	loop {
		futures::select! {
			event = event_receiver.next() => if let Some(event) = event {
				println!("Received Node Event: {:?}", event);
			},
			join = node_join => match join {
				Ok(_) => {
					println!("Exited sucessfully");
					break;
				},
				Err(err) => {
					println!("node errored: {}", err);
					break;
				},
			}
		}
    }
	Ok(())
}