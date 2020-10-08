use dither_chat::{DitherChatAction, DitherChatEvent};
use dither_chat::ThreadHandle;

use iced::*;
use tokio::sync::mpsc;

pub struct DitherChatSettings {
	ditherchat_handle: ThreadHandle<(), DitherChatAction, DitherChatEvent>,
}

impl DitherChatSettings {
	pub fn new(chat_handle: ThreadHandle<(), DitherChatAction, DitherChatEvent>) -> Settings<DitherChatSettings> {
		let flags = DitherChatSettings {
			ditherchat_handle: chat_handle,
		};
		Settings::with_flags(flags)
	}
}

pub struct DitherChat {
	settings: DitherChatSettings,
	message_text: String,
	textinput_state: text_input::State,
}

#[derive(Debug, Clone)]
pub enum Message {
	ReceivedDitherChatEvent(DitherChatEvent),
	TypingText(String),
	SendText,
}

impl Application for DitherChat {
	type Executor = executor::Default;
	type Message = Message;
	type Flags = DitherChatSettings;

	fn new(flags: DitherChatSettings) -> (Self, Command<Message>) {
		(
			Self {
				settings: flags,

				message_text: String::default(),
				textinput_state: text_input::State::default(),
			},
			Command::none()
		)
	}

	fn title(&self) -> String {
		String::from("Global Chat - Dither")
	}

	fn update(&mut self, message: Message) -> Command<Message> {
		let mut sender = self.settings.ditherchat_handle.sender.clone();		
		
		match message {
			Message::ReceivedDitherChatEvent(event) => {
				use DitherChatEvent::*;
				match event {
					ReceivedMessage(msg) => {
						println!("Received Message: {:?}", msg);
					}
				}
				return Command::perform(self.settings.ditherchat_handle.receiver.recv(), Message::ReceivedDitherChatEvent)
			}
			Message::TypingText(text) => {
				self.message_text = text;
			}
			Message::SendText => {
				println!("Sending Text: {}", self.message_text);
				let message = dither_chat::Message::new(self.message_text.clone());
				if let Err(err) = sender.try_send(DitherChatAction::BroadcastMessage(message)) {
					log::error!("Can't send message: {:?}", err); // TODO: Popup error message if it closes
				}
			}
		}
		Command::none();
	}
	/*fn subscription(&self) -> Subscription<Self::Message> {
		iced_native::subscription::events().map(Message::ReceivedDitherChatEvent)
	}*/

	fn view(&mut self) -> Element<Message> {
		Column::new()
			.padding(20)
			//.push(messages)
			.align_items(Align::Center)
			/*.push(
				Scrollable::new(&mut self.scrollable_state)
				.push()
			)*/
			/*.push(
				Button::new(&mut self.increment_button, Text::new("Increment"))
					.on_press(Message::IncrementPressed),
			)
			.push(Text::new(self.value.to_string()).size(50))
			.push(
				Button::new(&mut self.decrement_button, Text::new("Decrement"))
					.on_press(Message::DecrementPressed),
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
			.into()
	}
}
