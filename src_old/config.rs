
use serde_derive::{Serialize, Deserialize};
use std::{
	error::Error,
	io::{BufReader, Read},
	fs::File,
	path::Path,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct DitherConfig {
	pub dev_mode: bool,
	pub pubsub_topic: String,
}

impl DitherConfig {
	pub fn development() -> DitherConfig {
		DitherConfig {
			dev_mode: true,
			pubsub_topic: "chat".to_owned(),
		}
	}
	pub fn from_file<P: AsRef<Path>>(path: P) -> Result<DitherConfig, Box<dyn Error>> {
		let file = File::open(path)?;
		let reader = BufReader::new(file);
		
		return Self::from_reader(reader);
	}
	pub fn from_reader(reader: impl Read) -> Result<DitherConfig, Box<dyn Error>> {
		Ok(serde_json::from_reader(reader)?)
	}
}