#![allow(incomplete_features)]
#![feature(try_blocks)]
#![feature(generic_const_exprs)]
#![feature(str_split_remainder)]
#![feature(async_fn_in_trait)]
#![feature(type_alias_impl_trait)]
#![feature(return_position_impl_trait_in_trait)]

use std::{net::{Ipv4Addr, SocketAddr}, time::Duration};
use futures_delay_queue::delay_queue;
use log::LevelFilter;
use serde::{Serialize, Deserialize};

use anyhow::anyhow;
use async_std::{task};
use futures::{SinkExt, StreamExt, FutureExt, channel::mpsc::{self, UnboundedSender}};

use node::{NodeID, NodeAction, Node, NodeConfig, Network, NodeEvent, EncryptionKeys};

mod net_tcp_noenc;
use net_tcp_noenc::*;
use simplelog::{Config, TerminalMode, TermLogger, ColorChoice};

type DitherNet = TcpNoenc;
type Address = <DitherNet as Network>::Address;

#[derive(Serialize, Deserialize)]
struct Command {
    action: NodeAction<DitherNet>,
    time: Duration,
}

#[async_std::main]
async fn main() -> anyhow::Result<()> {
	TermLogger::init(
        LevelFilter::Debug,
        Config::default(),
        TerminalMode::Stdout,
        ColorChoice::Never
    )?;

    let mut args = std::env::args();
    let commands_path = args.nth(1).ok_or(anyhow!("requires command file"))?;

	log::info!("This version of Dither is run in a simulator. Reading {commands_path:?} for commands");

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
	let private_key = listen_addr.to_string().as_bytes().to_vec();

	// Generate node_config
	let node_config = NodeConfig::<DitherNet> {
		// WARN: Using private key as public key for testing purposes
		keys: EncryptionKeys { private_key: private_key.clone(), public_key: private_key.clone() },
		node_id: NodeID::hash(&private_key),
		listener_config: net_tcp_noenc::ListenerConfig::local(listen_port),
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
			command = command_receiver.receive() => if let Some(command) = command {
				log::info!("Sending NodeAction: {:?}", command);
				action_sender.send(command).await?;
			},
			event = event_receiver.next() => if let Some(event) = event {
				handle_node_event(&action_sender, event);
			},
			join = node_join => match join {
				Ok(_) => {
					log::info!("Exited sucessfully");
					break;
				},
				Err(err) => {
					log::info!("node errored: {}", err);
					break;
				},
			}
		}
    }
	Ok(())
}

fn handle_node_event<Net: Network>(action_sender: &UnboundedSender<NodeAction<Net>>, event: NodeEvent<Net>) {
	match event {
		NodeEvent::Info(id, addrs, coords, entities) => {
			log::info!("Received Node Info: \nID: {id:?}\nAddrs: {addrs:?}\nCoords: {coords:?}\nEntities: {entities:?}");
			for (_, entity) in entities {
				action_sender.unbounded_send(NodeAction::GetRemoteInfo(entity)).unwrap();
			}
		}
		event => log::info!("Received Node Event: {:#?}", event),
	}
}