use iced::*;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;

use dither_chat::{
	DitherChatAction, DitherChatEvent,
	Multiaddr,
	DitherChatConfig,
};

use crate::chat;
use crate::style::Theme;

#[derive(Debug, Clone)]
pub struct DitherChatAppSettings {
	pub dither_config: DitherChatConfig,
	pub theme: Theme,
}
impl DitherChatAppSettings {
	pub fn create(config: DitherChatConfig) -> Settings<DitherChatAppSettings> {
		Settings::with_flags(DitherChatAppSettings {
			theme: Theme::Dark,
			dither_config: config,
		})
	}
}

pub enum DitherChatApp {
	Loading(DitherChatAppSettings), // Loading screen, can't interact with anything
	Loaded(State), // Loaded, (not necessarily connected to the network)
}

#[allow(dead_code)]
pub struct State {
	settings: DitherChatAppSettings,
	chat_sender: mpsc::Sender<DitherChatAction>, // Send actions to the dither_chat layer
	chat_join: JoinHandle<()>,
	
	chat_channel: chat::channel::ChatChannel,
}

#[derive(Debug)]
pub enum Event {
	DitherChatEvent(DitherChatEvent),
	ChatChannelEvent(chat::channel::Event),
	
	TypingText(String),
	SendText,
}

impl Application for DitherChatApp {
	type Executor = executor::Default;
	type Message = Event;
	type Flags = DitherChatAppSettings;

	fn new(flags: DitherChatAppSettings) -> (Self, Command<Event>) {
		(
			DitherChatApp::Loading(flags),
			Command::none(),
		)
	}

	fn title(&self) -> String {
		String::from("Global Chat - Dither")
	}

	fn update(&mut self, app_event: Event) -> Command<Event> {
		//let mut sender = self.ditherchat_sender.clone();
		match self {
			Self::Loading(settings) => {
				match app_event {
					Event::DitherChatEvent(dither_event) => {
						log::info!("Received dither_event: {:?}", dither_event);
						match dither_event {
							DitherChatEvent::Connection(join, mut sender) => { // Set connection
								if let Err(_err) = sender.try_send(DitherChatAction::Configure(settings.dither_config.clone())) {
									log::error!("Failed to send DitherChatAction Configuration");
								}
								let channel = dither_chat::Channel::FloodSub(settings.dither_config.pubsub_topic.clone());
								*self = DitherChatApp::Loaded(State {
									settings: settings.clone(),
									chat_sender: sender.clone(),
									chat_join: join,
									chat_channel: chat::channel::ChatChannel::new(sender.clone(), channel),
								});
							}
							DitherChatEvent::Error(err) => log::error!("Dither Chat Error Received: {:?}", err),
							_ => log::error!("DitherChat Event received that shouldn't have been while in the Loading State: {:?}", dither_event),
						}
					}
					_ => { log::error!("Application Event received that shouldn't have been while in the Loading State: {:?}", app_event); },
				}
			},
			Self::Loaded(state) => {
				match app_event {
					Event::DitherChatEvent(event) => {
						match event {
							DitherChatEvent::Connection(_join, _sender) => log::error!("Received DitherChat Connection Event when in Loaded State"),
							DitherChatEvent::ReceivedMessage(message) => {
								log::info!("Received DitherChat Message: {:?}", message);
								state.chat_channel.update(chat::channel::Event::ReceivedMessage(message));
							},
							_ => {}
						}
						//return Command::perform(self.settings.ditherchat_handle.receiver.recv(), Message::ReceivedDitherChatEvent)
					},
					Event::ChatChannelEvent(event) => {
						state.chat_channel.update(event);
					},
					_ => { log::error!("Application Event received that shouldn't have been while in the Loaded State: {:?}", app_event); },
				}
			}
		}
		Command::none()
	}
	fn subscription(&self) -> Subscription<Event> {
		chat::subscription::connect().map(Event::DitherChatEvent)
	}

	fn view(&mut self) -> Element<Event> {
		match self {
			Self::Loading(_settings) => {
				Row::new()
					.align_items(Align::Center)
					.push(
						Text::new("Loading...")
						.horizontal_alignment(HorizontalAlignment::Center)
						.vertical_alignment(VerticalAlignment::Center)
						.size(40)
					)
					.into()
			},
			Self::Loaded(state) => {
				let app = Row::new()
					.padding(20)
					.align_items(Align::Center)
					.push(
						state.chat_channel.view(&state.settings).map(move |event| {
							Event::ChatChannelEvent(event)
						})
					);
				
				let app = Element::explain(app.into(), Color::BLACK);
				
				Container::new(app)
					.width(Length::Fill)
					.height(Length::Fill)
					.center_x()
					.center_y()
					.style(state.settings.theme)
					.into()
			}
		}

		
		/*Column::new()
			.padding(20)
			//.push(messages)
			.align_items(Align::Center)
			/*.push(
				Scrollable::new(&mut self.scrollable_state)
				.push()
			)*/
			.push(
				TextInput::new(
					&mut self.textinput_state,
					"Message Everyone",
					&self.message_text,
					|text| Message::TypingText(text),
				)
				.on_submit(Message::SendText),
			)
			.into()*/
	}
}
