#![allow(incomplete_features)]
#![feature(try_blocks)]
#![feature(generic_const_exprs)]
#![feature(str_split_remainder)]
#![feature(async_fn_in_trait)]
#![feature(type_alias_impl_trait)]
#![feature(return_position_impl_trait_in_trait)]

use std::{net::{Ipv4Addr, SocketAddr}, io::Write};

use anyhow::anyhow;
use async_std::task;
use bevy_ecs::prelude::Entity;
use futures::{SinkExt, StreamExt, FutureExt, channel::mpsc};
use chumsky::prelude::*;

use node::{NodeID, NodePacket, NodeAction, Node, NodeConfig, Network, EncryptionKeys};
use rustyline_async::{Readline, ReadlineError, SharedWriter};

mod net_tcp_noenc;
use net_tcp_noenc::*;

type DitherNet = TcpNoenc;
type Address = <DitherNet as Network>::Address;

#[async_std::main]
async fn main() -> anyhow::Result<()> {
	println!("Welcome to Dither (🖧 ), type help for command list");

	// Parse listening addr
	let listen_port: u16 = match std::env::args().nth(1).map(|s|s.parse()) {
		Some(Ok(port)) => port,
		None => return Ok(println!("Requires a port number as a command line argument")),
		Some(Err(err)) => return Ok(println!("Failed to parse port number: {err}"))
	};
	let listen_addr = SocketAddr::new(Ipv4Addr::new(0, 0, 0, 0).into(), listen_port);

	// Generate fake private key for testing because I haven't implemented encryption yet
	let private_key = listen_addr.to_string().as_bytes().to_vec();

	// Generate node_config
	let node_config = NodeConfig::<DitherNet> {
		keys: EncryptionKeys { private_key: private_key.clone(), public_key: private_key.clone() }, // WARN: Using private key as public key for testing purposes
		node_id: NodeID::hash(&private_key),
		listener_config: ListenerConfig::local(listen_port),
	};
	// Create node & channels
	let (event_sender, mut event_receiver) = mpsc::unbounded();
	let node = Node::<DitherNet>::new(node_config, event_sender);
	
	let (mut action_sender, action_receiver) = mpsc::unbounded();

	// Run node on separate task
	let mut node_join = task::spawn(node.run(action_receiver)).fuse();

	// Setup output through async_readline
	let (mut rl, mut stdout) = Readline::new("> ".to_owned())?;
	simplelog::WriteLogger::init(log::LevelFilter::Debug, simplelog::Config::default(), stdout.clone()).unwrap();

	// Send NodeAction to check for errors in the bevy schedule
	action_sender.send(NodeAction::GetInfo).await?;

	loop {
		futures::select! {
			event = event_receiver.next() => if let Some(event) = event {
				writeln!(stdout, "Received Event: {:?}", event)?;
			},
			command = rl.readline().fuse() => match command {
				Ok(line) => {
					rl.add_history_entry(line.clone());
					if let Err(err) = handle_command(line, &mut action_sender, &mut stdout).await {
						writeln!(stdout, "Error: {}", err)?;
					}
				},
				Err(ReadlineError::Interrupted) => {
					writeln!(stdout, "CTRL-C, do CTRL-D to exit")?;
				},
				Err(ReadlineError::Eof) => {
					writeln!(stdout, "CTRL-D")?;
					break
				},
				Err(err) => {
					println!("Readline Error: {:?}", err);
				}
			},
			join = node_join => match join {
				Ok(_) => {
					log::info!("Exited sucessfully");
					break;
				},
				Err(err) => {
					log::error!("node errored: {}", err);
					break;
				},
			}
		}
    }

	println!("Exiting...");
	Ok(())
}



async fn handle_command(line: String, action_sender: &mut mpsc::UnboundedSender<NodeAction<DitherNet>>, stdout: &mut SharedWriter) -> anyhow::Result<()> {
	let mut split = line.split(" ");
	let line = if let Some(split) = split.next() { split } else { return Ok(()) };
	match line {
		"connect" => {
			let node_id = split.next().map(|s|s.parse::<NodeID>()).ok_or(anyhow!("Failed to parse NodeID"))??;
			let addr = split.next().map(|s|s.parse::<Address>()).ok_or(anyhow!("Failed to parse Multiaddr"))??;
			action_sender.send(NodeAction::Connect(node_id.clone(), addr, None)).await?;
			writeln!(stdout, "Connecting to: {} ID: {:?}", addr, node_id)?;
		}
		"list" => {
			action_sender.send(NodeAction::GetInfo).await?;
		}
		"info" => {
			let dec = text::int::<_, Simple<char>>(10).try_map(|s, span| s
				.parse::<u32>()
				.map_err(|e| Simple::custom(span, format!("not a valid u32: {e}"))));
			let parser = dec.then_ignore(just('v')).then(dec).map(|(index, generation)| Entity::from_bits(index as u64 & ((generation as u64) << 32)));
			
			let to_parse = split.next().ok_or(anyhow!("must pass an Entity ID of format: <index>v<generation>"))?;
			
			let entity = parser.parse(to_parse).map_err(|err|anyhow!("parsing error: {}", err[0]))?;
			log::debug!("Getting info of entity: {:?}", entity);
			action_sender.send(NodeAction::GetRemoteInfo(entity)).await?;
		}
		"print" => {
			action_sender.send(NodeAction::PrintNode).await?;
		}
		"data" => {
			let node_id = split.next().map(|s|s.parse::<NodeID>()).ok_or(anyhow!("Failed to parse NodeID"))??;
			let data = split.remainder().ok_or(anyhow!("Data not passed"))?.as_bytes().to_vec();
			
			action_sender.send(NodeAction::ForwardPacket(node_id, NodePacket::Data(data))).await?;
		}
		"help" => {
			writeln!(stdout, r"
connect <NodeID> <Address> - connect to remote device
info - get info about this node
action - wip, send node action
data <NodeID> <String> - send arbitrary data to another node
			")?
		}
		_ => { writeln!(stdout, "Unknown command, type help for a list of commands")?; }
	}
	Ok(())
}