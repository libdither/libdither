

fn main() {
	let client = IpfsClient::default();
	env_logger::Builder::new().filter_level(log::LevelFilter::Info).init(); // Init Logger
	
	let yaml = load_yaml!("app.yml");
	let app = App::from_yaml(yaml);
	let matches = app.get_matches();
	match matches.args() {
		
	}
	
	match matches.subcommand() {
		("peers", Some(sub_cmd)) => {
			println!("Peers:");
		},
		("friends", Some(sub_cmd)) => {
			println!("Friends:");
		},
	}
}
