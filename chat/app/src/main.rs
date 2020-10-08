
#![allow(unused_imports)]
use std::error::Error;
use log::error;
use tokio::io;

use dither_chat::{Config, Client, DitherChatAction, DitherChatEvent};

use iced::{
	Settings,
	Application,
};
pub mod app;
use app::{DitherChat, DitherChatSettings};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	// Init Logger
	env_logger::Builder::new().filter_level(log::LevelFilter::Info).init();
	
	// Init Client Backend
	let client = Client::new(Config::development())?;
	//let (tx, rx) = client.connect()?;
	// Run swarm and get join handle + thread channels
	let swarm_handle = client.start();
	
	// Run chat middleware using swarm
	let chat_handle = dither_chat::DitherChat::start(swarm_handle);
	
	//Run GUI
	let settings = DitherChatSettings::new(chat_handle);
	DitherChat::run(settings);
	
	/*let yaml = load_yaml!("app.yml");
	let app = App::from_yaml(yaml);
	let matches = app.get_matches();
	match matches.args() {
		//match args here
	}*/
	
	/*use io::AsyncBufReadExt;
	let mut stdin = io::BufReader::new(io::stdin()).lines();
	let name = content.get_content().source().to_owned();
	println!("Setting username to: {}", name);
	loop {
		print!("Chat> ");
		if let Some(line) = stdin.next_line().await? {
			tx.send(DitherAction::FloodSub("chat".to_owned(), line)).await?;
		}
	}*/
	Ok(())
}