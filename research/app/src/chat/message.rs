
use iced::*;
use dither_core::chat::DitherMessage;

use serde_derive::{Deserialize, Serialize};
use std::time::SystemTime;

pub enum DitherType {
	Message(DitherMessage),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
	content: String, // Markdown text
	user: String, // Peer ID of sender
	attachment: Vec<u8>, //
	time_sent: SystemTime, // Time sent
	last_edited: Option<SystemTime>, // (Optional if edited, last time edited)
	// reactions: Vec<Reaction>,
	
	#[serde(skip)]
	state: MessageState,
}

#[derive(Debug, Clone)]
pub enum MessageState {
	DisplayMessage {
		edit_button: button::State,
		settings_button: button::State,
	},
	EditMessage {
		text_input: text_input::State,
	}
}

impl Default for MessageState {
	fn default() -> Self {
		MessageState::Idle {
			edit_button: button::State::new(),
			settings_button: button::State::new(),
		}
	}
}

#[derive(Debug, Clone)]
pub enum MessageMessage {
	StartEdit,
	FinishEdit(String),
	Delete,
}

impl Message {
	fn new() -> Self {
		Message {
			content,
			completed: false,
			state: MessageState::Idle {
				edit_button: button::State::new(),
			},
		}
	}

	fn update(&mut self, message: MessageMessage) {
		match message {
			MessageMessage::StartEdit => {
				self.state = MessageState::Editing {
					text_input: text_input::State::focused(),
					delete_button: button::State::new(),
				};
			},
			MessageMessage::FinishEdit(new_content) {
				if self.content != new_content {
					self.content = new_content;
				}
			},
			MessageMessage::Delete => {}
		}
	}

	fn view(&mut self) -> Element<MessageMessage> {
		// Match current view state
		match &mut self.state {
			MessageState::Display { edit_button, settings_button } => {
				Row::new()
					.push(Text::new(self.content)) // TODO: Display markdown instead of text
					.spacing(20)
					.align_items(Align::Center)
					.push(
						Button::new(edit_button, icon('\u{E801}')) // Edit button code
							.on_press(MessageMessage::Edit)
							.padding(10)
							.style(style::Button::Icon),
						Button::new(settings_button, icon('\u{F141}')) // Settings button code
							.on_press(MessageMessage::Menu)
							.padding(10)
					)
					.into()
			},
			MessageState::Editing { text_input } => {
				Row::new()
					.spacing(10)
					.align_items(Align::Center)
					.push(text_input)
					.into()
			}
		}
	}
}

const ICONS: Font = Font::External {
	name: "Icons",
	bytes: include_bytes!("../fonts/icons.ttf"),
}

fn icon(unicode: char) -> Text {
	Text::new(&unicode.to_string())
		.fonts(ICONS)
		.width(Length::Units(20))
		.horizontal_alignment(HorizontalAlignment::Center)
		.size(20)
}
