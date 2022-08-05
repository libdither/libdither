#![feature(try_blocks)]
#![feature(str_split_as_str)]

use std::{net::{Ipv4Addr, SocketAddr}, io::Write, sync::Arc};

use anyhow::anyhow;
use async_std::task;
use futures::{SinkExt, StreamExt, FutureExt, channel::mpsc};
use libdither::{NodeAction, NodePacket, DitherCommand, DitherCore, Address};
use node::NodeID;

use rustyline_async::{Readline, ReadlineError};

async fn send_node_action(command_sender: &mut mpsc::Sender<DitherCommand>, action: NodeAction<libdither::DitherNet>) -> Result<(), mpsc::SendError> {
	command_sender.send(DitherCommand::NodeAction(Arc::new(action))).await
}

#[async_std::main]
async fn main() -> anyhow::Result<()> {
	println!("Welcome to Dither (🖧 ), type help for command list");

	let listen_port: u16 = match std::env::args().nth(1).map(|s|s.parse()) {
		Some(Ok(port)) => port,
		None => return Ok(println!("Requires a port number as a command line argument")),
		Some(Err(err)) => return Ok(println!("Failed to parse port number: {err}"))
	};
	let listen_addr = SocketAddr::new(Ipv4Addr::new(0, 0, 0, 0).into(), listen_port);
	let (core, mut event_receiver) = DitherCore::init(listen_addr)?;
	let (mut command_sender, command_receiver) = mpsc::channel(20);
	
	let mut core_join = task::spawn(core.run(command_receiver)).fuse();

	let (mut rl, mut stdout) = Readline::new("> ".to_owned())?;
	simplelog::WriteLogger::init(log::LevelFilter::Debug, simplelog::Config::default(), stdout.clone()).unwrap();

	loop {
		futures::select! {
			event = event_receiver.next() => if let Some(event) = event {
				writeln!(stdout, "Received Event: {:?}", event)?;
			},
			command = rl.readline().fuse() => match command {
				Ok(line) => {
					let mut split = line.split(" ");
					let line = if let Some(split) = split.next() { split } else { continue };
					let ret: anyhow::Result<()> = try {
						match line {
							"connect" => {
								let node_id = split.next().map(|s|s.parse::<NodeID>()).ok_or(anyhow!("Failed to parse NodeID"))??;
								let addr = split.next().map(|s|s.parse::<Address>()).ok_or(anyhow!("Failed to parse Multiaddr"))??;
								command_sender.send(DitherCommand::Bootstrap(node_id, addr)).await?;
							}
							"info" => {
								command_sender.send(DitherCommand::GetNodeInfo).await?;
							}
							"print" => {
								send_node_action(&mut command_sender, NodeAction::PrintNode).await?;
							}
							"action" => {
								
							}
							"data" => {
								let node_id = split.next().map(|s|s.parse::<NodeID>()).ok_or(anyhow!("Failed to parse NodeID"))??;
								let data = split.as_str().as_bytes().to_vec();
								
								send_node_action(&mut command_sender, NodeAction::ForwardPacket(node_id, NodePacket::Data(data))).await?;
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
					};
					if let Err(err) = ret { writeln!(stdout, "Error: {}", err)?; }
					
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
			join = core_join => match join {
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