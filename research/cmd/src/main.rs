
use cursive::views::TextView;
use dither_core::{Config, Client, DitherAction};

use std::{error::Error};
use tokio::{io};

use log::error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	let mut client = Client::new(Config::development())?;
	env_logger::Builder::new().filter_level(log::LevelFilter::Info).init(); // Init Logger
	
	/*let yaml = load_yaml!("app.yml");
	let app = App::from_yaml(yaml);
	let matches = app.get_matches();
	match matches.args() {
		//match args here
	}*/

	/*let mut siv = cursive::default();
	
	siv.add_global_callback('q', |s| s.quit());

	siv.add_layer(TextView::new("Hello cursive! Press <q> to quit."));

	siv.run();*/
	
	let (mut tx, rx) = client.connect()?;
	tokio::spawn( async move {
		let err = client.run(rx).await;
		error!("Swarm Exited: {:?}", err);
	});
	
	use io::AsyncBufReadExt;
	let mut stdin = io::BufReader::new(io::stdin()).lines();
	loop {
		if let Some(line) = stdin.next_line().await? {
			tx.send(DitherAction::FloodSub("chat".to_owned(), line)).await?;
		}
	}
}
