use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Message {
	content: String, // Markdown text
	time_send: SystemTime,
	last_edited: Option<SystemTime>,
	//reactions: Vec<Reaction>,
}

#[derive(Debug, Clone)]
pub enum MessageState {
	EditMessage(String),
}

impl Default for MessageState {
	fn default() -> Self {
		MessageState::Idle {
			edit_button: button::State::new(),
		}
	}
}

#[derive(Debug, Clone)]
pub enum MessageMessage {
	Completed(bool),
	Edit,
	DescriptionEdited(String),
	FinishEdition,
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
			MessageMessage::Completed(completed) => {
				self.completed = completed;
			}
			MessageMessage::Edit => {
				self.state = MessageState::Editing {
					text_input: text_input::State::focused(),
					delete_button: button::State::new(),
				};
			}
			MessageMessage::DescriptionEdited(new_description) => {
				self.description = new_description;
			}
			MessageMessage::FinishEdition => {
				if !self.description.is_empty() {
					self.state = MessageState::Idle {
						edit_button: button::State::new(),
					}
				}
			}
			MessageMessage::Delete => {}
		}
	}

	fn view(&mut self) -> Element<MessageMessage> {
		match &mut self.state {
			MessageState::Idle { edit_button } => {
				let checkbox =
					Checkbox::new(self.completed, &self.description, MessageMessage::Completed)
						.width(Length::Fill);

				Row::new()
					.spacing(20)
					.align_items(Align::Center)
					.push(checkbox)
					.push(
						Button::new(edit_button, edit_icon())
							.on_press(MessageMessage::Edit)
							.padding(10)
							.style(style::Button::Icon),
					)
					.into()
			}
			MessageState::Editing {
				text_input,
				delete_button,
			} => {
				let text_input = TextInput::new(
					text_input,
					"Describe your Message...",
					&self.description,
					MessageMessage::DescriptionEdited,
				)
				.on_submit(MessageMessage::FinishEdition)
				.padding(10);

				Row::new()
					.spacing(20)
					.align_items(Align::Center)
					.push(text_input)
					.push(
						Button::new(
							delete_button,
							Row::new()
								.spacing(10)
								.push(delete_icon())
								.push(Text::new("Delete")),
						)
						.on_press(MessageMessage::Delete)
						.padding(10)
						.style(style::Button::Destructive),
					)
					.into()
			}
		}
	}
}
