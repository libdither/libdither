#![allow(incomplete_features)]
#![feature(try_blocks)]
#![feature(generic_const_exprs)]
#![feature(str_split_remainder)]
#![feature(async_fn_in_trait)]
#![feature(type_alias_impl_trait)]

use std::{net::{Ipv4Addr, SocketAddr}, time::Duration};
use futures_delay_queue::{DelayQueue, delay_queue};
use serde::{Serialize, Deserialize};

use anyhow::anyhow;
use async_std::{task};
use futures::{SinkExt, StreamExt, FutureExt, channel::mpsc};

use node::{NodeID, NodeAction, Node, NodeConfig, Network};

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
    let commands_path = args.nth(1).ok_or(anyhow!("requires command file"))?;

	println!("This version of Dither is run in a simulator. Reading {commands_path:?} for commands");

	// Parse listening addr
	let port_string = args.next().clone();
	let listen_port: u16 = match port_string.clone().map(|s|s.parse()) {
		Some(Ok(port)) => port,
		None => return Err(anyhow!("Requires a port number as a second command line argument")),
		Some(Err(err)) => return Err(anyhow!("Failed to parse port number {:?}: {err}", port_string.clone()))
	};
	let listen_addr = SocketAddr::new(Ipv4Addr::new(0, 0, 0, 0).into(), listen_port);

    // Open file & deserialize commands.
    let commands_file = std::fs::File::open(commands_path)?;
    let commands: Vec<Command> = serde_json::from_reader(commands_file)?;

    let (delay_queue, command_receiver) = delay_queue();
    for command in commands {
        delay_queue.insert(command.action, command.time);
    }

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