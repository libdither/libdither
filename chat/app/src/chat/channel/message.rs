
#![allow(unused_variables)]

use tokio::sync::mpsc::Sender;
use iced::*;

use dither_chat::DitherChatAction;
use crate::DitherChatAppSettings;

#[derive(Debug, Clone)]
pub struct MessageWidget {
	message: dither_chat::Message,
	state: State,
}

#[derive(Debug, Clone)]
enum State {
	Display {
		edit_button: button::State,
		settings_button: button::State,
	},
	Editing {
		text_input: text_input::State,
		current_edit: String,
		cancel_button: button::State,
	}
}

#[derive(Debug, Clone)]
pub enum Event {
	TriggerReaction,
	TriggerEdit,
	TriggerMenu,
	
	AddReaction,
	
	EditUpdate(String),
	SubmitEdit,
	CancelEdit,
	
	DeleteMessage,
}

impl MessageWidget {
	pub fn new(sender: Sender<DitherChatAction>, message: dither_chat::Message) -> Self {
		MessageWidget {
			message,
			state: State::Display {
				edit_button: button::State::new(),
				settings_button: button::State::new(),
			}
		}
	}
	pub fn update(&mut self, event: Event) {
		match &mut self.state {
			State::Display {
				edit_button,
				settings_button,
			} => {
				match event {
					Event::TriggerReaction => {}, // When reaction buttton pressed
					Event::TriggerEdit => { // When edit button pressed
						self.state = State::Editing {
							text_input: text_input::State::focused(),
							current_edit: self.message.content.clone(),
							cancel_button: button::State::new(),
						};
					},
					Event::TriggerMenu => {
						log::info!("Message Menu Triggered");
					},
					// TODO: Propagate message editing back to DitherChat layer
					/*Event::SubmitEdit(new_content) => {
						
						if self.message.content != new_content {
							self.message.content = new_content;
						}
					},*/
					_ => log::error!("Invalid Event for State::Display: {:?}", event),
				}
			},
			State::Editing {
				text_input,
				current_edit,
				cancel_button 
			} => {
				match event {
					Event::EditUpdate(text) => { *current_edit = text; },
					Event::CancelEdit => {
						self.state = State::Display {
							edit_button: button::State::new(),
							settings_button: button::State::new(),
						};
					},
					Event::SubmitEdit => {
						//Send update
						self.message.content = format!("{} EDIT: {}", self.message.content, current_edit);

					},
					_ => log::error!("Invalid Event for State::Edited: {:?}", event),
				}
			}
		}
		
	}
	pub fn view(&mut self, settings: &DitherChatAppSettings) -> Element<Event> {
		// Match current view state
		match &mut self.state {
			State::Display { edit_button, settings_button } => {
				let author = self.message.sender.clone().unwrap_or("{Unknown}".to_owned()).clone();
				Row::new()
					.push(Text::new(author))
					.push(Text::new(&self.message.content).width(Length::Fill)) // TODO: Display markdown instead of text
					.spacing(20)
					.align_items(Align::Center)
					.push(
						Button::new(edit_button, icon('\u{E801}')) // Edit button
							.on_press(Event::TriggerEdit)
							.padding(10)
							.style(style::Button::Icon),
					).push(
						Button::new(settings_button, icon('\u{F141}')) // Settings button
							.on_press(Event::TriggerMenu)
							.padding(10)
							.style(settings.theme)
					)
					.into()
			},
			State::Editing { text_input, current_edit, cancel_button } => {
				Row::new()
					.spacing(10)
					.align_items(Align::Center)
					.push(
						TextInput::new(text_input, "", current_edit, Event::EditUpdate)
						.on_submit(Event::SubmitEdit)
						.style(settings.theme)
					)
					.push(
						Button::new(cancel_button, Text::new("Cancel") )
						.on_press(Event::CancelEdit)
						.style(settings.theme)
					)
					.into()
			}
		}
	}
}

const ICONS: Font = Font::External {
	name: "Icons",
	bytes: include_bytes!("../../../fonts/icons.ttf"),
};

fn icon(unicode: char) -> Text {
	Text::new(&unicode.to_string())
		.font(ICONS)
		.width(Length::Units(20))
		.horizontal_alignment(HorizontalAlignment::Center)
		.size(20)
}

mod style {
	use iced::{button, Background, Color, Vector};

	pub enum Button {
		Icon,
	}

	impl button::StyleSheet for Button {
		fn active(&self) -> button::Style {
			match self {
				/*Button::Filter { selected } => {
					if *selected {
						button::Style {
							background: Some(Background::Color(
								Color::from_rgb(0.2, 0.2, 0.7),
							)),
							border_radius: 10,
							text_color: Color::WHITE,
							..button::Style::default()
						}
					} else {
						button::Style::default()
					}
				}*/
				Button::Icon => button::Style {
					text_color: Color::from_rgb(0.5, 0.5, 0.5),
					..button::Style::default()
				},
				/*Button::Destructive => button::Style {
					background: Some(Background::Color(Color::from_rgb(
						0.8, 0.2, 0.2,
					))),
					border_radius: 5,
					text_color: Color::WHITE,
					shadow_offset: Vector::new(1.0, 1.0),
					..button::Style::default()
				},*/
			}
		}

		fn hovered(&self) -> button::Style {
			let active = self.active();

			button::Style {
				text_color: match self {
					Button::Icon => Color::from_rgb(0.2, 0.2, 0.7),
					/*Button::Filter { selected } if !selected => {
						Color::from_rgb(0.2, 0.2, 0.7)
					}
					_ => active.text_color,*/
				},
				shadow_offset: active.shadow_offset + Vector::new(0.0, 1.0),
				..active
			}
		}
	}
}