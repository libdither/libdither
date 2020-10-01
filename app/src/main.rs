
#![allow(unused_imports)]
use std::error::Error;
use log::error;
use tokio::io;

use dither_core::{Config, Client, DitherAction};

use iced::{
	Settings,
	Sandbox,
};
pub mod app;
use app::Dither;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	let mut client = Client::new(Config::development())?;
	env_logger::Builder::new().filter_level(log::LevelFilter::Info).init(); // Init Logger
	
	let settings = Settings::default();
	Dither::run(settings);
	
	/*let yaml = load_yaml!("app.yml");
	let app = App::from_yaml(yaml);
	let matches = app.get_matches();
	match matches.args() {
		//match args here
	}*/
	
	let (mut tx, rx) = client.connect()?;
	tokio::spawn( async move {
		let err = client.run(rx).await;
		error!("Swarm Exited: {:?}", err);
	});
	
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