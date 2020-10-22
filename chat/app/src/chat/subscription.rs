use iced_futures::futures;
use tokio::sync::mpsc::Receiver;

use dither_chat::{Config, Client, DitherChatAction, DitherChatEvent, DitherChatConfig};

// Just a little utility function
pub fn connect(config: Option<DitherChatConfig>) -> iced::Subscription<DitherChatEvent> {
	iced::Subscription::from_recipe(DitherChatAppSubscriptionRecipe {config})
}

pub struct DitherChatAppSubscriptionRecipe {
	config: Option<DitherChatConfig>,
}

pub enum State {
	Connecting,
	Connected(Receiver<DitherChatEvent>),
	Disconnected,
}

// Make sure iced can use our download stream
impl<H, I> iced_native::subscription::Recipe<H, I> for DitherChatAppSubscriptionRecipe
where
	H: std::hash::Hasher,
{
	type Output = DitherChatEvent;

	fn hash(&self, state: &mut H) {
		use std::hash::Hash;
		
		log::debug!("Hashing");
		std::any::TypeId::of::<Self>().hash(state);
	}

	fn stream(
		self: Box<Self>,
		_input: futures::stream::BoxStream<'static, I>,
	) -> futures::stream::BoxStream<'static, Self::Output> {
		Box::pin(futures::stream::unfold( // https://docs.rs/futures/0.3.6/futures/stream/fn.unfold.html
			State::Connecting,
			|state| async move {
				match state {
					State::Connecting => {
						log::info!("Connecting...");
						// Setup
						match Client::new(Config::development()) {
							Ok(mut client) => {
								// Run swarm and get join handle + thread channels
								if let Err(err) = client.connect() {
									return Some(( DitherChatEvent::Error(format!("Failed to connect to network: {:?}", err)), State::Connecting ))
								}
								let swarm_handle = client.start();

								// Run chat middleware using swarm
								let chat_handle = dither_chat::DitherChat::start(swarm_handle);
								
								let dither_chat::ThreadHandle { join, sender, receiver } = chat_handle;
								
								log::info!("Connection Established");
								Some(( DitherChatEvent::Connection(join, sender), State::Connected(receiver) ))
							},
							Err(err) => {
								log::error!("Failed to connect to network: {:?}", err);
								Some(( DitherChatEvent::Error(format!("Failed to connect to network: {:?}", err)), State::Connecting ))
							}
						}
					},
					State::Connected(mut receiver) => {
						match receiver.recv().await {
							Some(event) => Some((event, State::Connected(receiver))),
							None => Some((DitherChatEvent::Error("Connection Closed".to_owned()), State::Disconnected)),
						}
					}
					State::Disconnected => { None },
				}
			},
		))
	}
}