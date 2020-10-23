
#![allow(unused_imports)]
use std::error::Error;
use log::error;
use tokio::io;

use iced::{
	Settings,
	Application,
};
pub mod chat;
pub mod app;

use app::{DitherChatApp, DitherChatAppSettings};
use dither_chat::{DitherChatConfig, Multiaddr, PeerId};


#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	// Init Logger
	env_logger::Builder::new()
	.filter_module("gfx_backend_vulkan", log::LevelFilter::Warn)
	.filter_module("wgpu_native", log::LevelFilter::Warn)
	.filter_level(log::LevelFilter::Info).init();
	
	//Run GUI
	let settings = DitherChatAppSettings::create( DitherChatConfig::new(
		{
			if let Some(arg) = std::env::args().nth(1) {
				if let Ok(addr) = arg.parse::<Multiaddr>() {
					Some(addr)
				} else { None }
			} else { None }
		},
		std::env::args().nth(2),
		String::from("global_chat"),
	));
	DitherChatApp::run(settings);
	
	Ok(())
}