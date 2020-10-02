
use iced::*;
use tokio::sync::mpsc;
use dither_core::DitherAction;

pub struct DitherChatSettings {
	dithernet_sender: mpsc::Sender<DitherAction> 
}
impl DitherChatSettings {
	pub fn new(sender: mpsc::Sender<DitherAction>) -> Settings<DitherChatSettings> {
		let flags = DitherChatSettings {
			dithernet_sender: sender,
		};
		Settings::with_flags(flags)
	}
}

pub struct DitherChat {
	dithernet_sender: mpsc::Sender<DitherAction>,
	
	message_text: String,
	textinput_state: text_input::State,
}

#[derive(Debug, Clone)]
pub enum Message {
	TypingText(String),
	SendText,
}

impl Application for DitherChat {
	type Executor = executor::Default;
	type Message = Message;
	type Flags = DitherChatSettings;

	fn new(flags: DitherChatSettings) -> (Self, Command<Message>) {
		(Self {
			dithernet_sender: flags.dithernet_sender,
			
			message_text: String::default(),
			textinput_state: text_input::State::default(),
		}, Command::none())
	}

	fn title(&self) -> String {
		String::from("Global Chat - Dither")
	}

	fn update(&mut self, message: Message) -> Command<Message> {
		match message {
			Message::TypingText(text) => {
				self.message_text = text;
			},
			Message::SendText => {
				println!("Sending Text: {}", self.message_text);
				let mut sender = self.dithernet_sender.clone();
				let text = self.message_text.clone();
				self.message_text = "".to_owned(); //Clear text
				tokio::spawn(async move {
					if let Err(err) = sender.send(DitherAction::FloodSub("chat".to_owned(), text)).await {
						log::error!("Failed to send DitherAction: {:?}", err);
					}
				});
			},
		}
		Command::none()
	}

	fn view(&mut self) -> Element<Message> {
		Column::new()
			.padding(20)
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
				TextInput::new(&mut self.textinput_state, "Message Everyone", &self.message_text, |text|{Message::TypingText(text)})
				.on_submit(Message::SendText)
			)
			.into()
	}
}