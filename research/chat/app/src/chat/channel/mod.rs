#![allow(unreachable_patterns)]

use tokio::sync::mpsc::Sender;
use dither_chat::*;
use iced::*;

use crate::DitherChatAppSettings;

mod message;

// Message channel structure (describes viewing and sending messages)
pub struct ChatChannel {
	// TODO: Message saving
	ditherchat_sender: Sender<DitherChatAction>,
	channel: dither_chat::Channel,
	
	messages: Vec<message::MessageWidget>,
	scroll_state: scrollable::State,
	
	text_input: text_input::State,
	current_text: String,
	send_button: button::State,
}

#[derive(Debug, Clone)]
pub enum Event {
	// Called from Application
	//ReceivedMessage(dither_chat::Message),
	
	ReceivedMessage(dither_chat::Message),
	
	TriggerSend,
	TextInputUpdate(String),
	
	MessageWidgetEvent(usize, message::Event),
}

impl ChatChannel {
	pub fn new(sender: Sender<DitherChatAction>, channel: Channel) -> Self {
		ChatChannel {
			ditherchat_sender: sender,
			channel,
			messages: Vec::with_capacity(16),
			scroll_state: scrollable::State::new(),
			text_input: text_input::State::new(),
			current_text: String::new(),
			send_button: button::State::new(),
		}
	}
	pub fn update(&mut self, event: Event) {
		match event {
			Event::ReceivedMessage(msg) => {
				println!("PUSHING MESSAGE: {:?}", msg);
				self.messages.push(message::MessageWidget::new(self.ditherchat_sender.clone(), msg));
			},
			
			Event::TriggerSend => {
				let message = dither_chat::Message::new(&self.current_text);
				if let Err(err) = self.ditherchat_sender.try_send(DitherChatAction::SendMessage(message.clone(), self.channel.clone())) {
					log::error!("Can't send message: {:?}", err); // TODO: Popup error message if it closes
				}
				self.current_text.clear();
				//self.update(Event::AddMessage(message));
			},
			
			Event::TextInputUpdate(text) => {
				self.current_text = text;
			},
			Event::MessageWidgetEvent(index, event) => {
				self.messages[index].update(event);
			}
			
			_ => {log::error!("Unimplemented ChatChannelEvent");},
		}
	}
	pub fn view(&mut self, settings: &DitherChatAppSettings) -> Element<Event> {
		let message_widgets = self.messages
			.iter_mut()
			.enumerate()
			.fold(Column::new().spacing(20), |column, (i, widget)| {
				column.push(widget.view(settings).map(move |message| {
					Event::MessageWidgetEvent(i, message)
				}))
			});
		
		let channel_content = Scrollable::new(&mut self.scroll_state)
			.padding(30)
			.height(Length::Fill)
			.push(
				Container::new(message_widgets)
				//.width(Length::Fill)
			)
			.style(settings.theme);
		
		let input_bar = Row::new()
			.padding(20)
			.push(
				TextInput::new(&mut self.text_input, "Message Network", &self.current_text, Event::TextInputUpdate)
				.on_submit(Event::TriggerSend)
				.style(settings.theme)
			)
			.push(
				Button::new(&mut self.send_button, Text::new("Send"))
				.on_press(Event::TriggerSend)
				.style(settings.theme)
			);
			
		Column::new()
			.spacing(20)
			.align_items(Align::Center)
			.push(channel_content)
			.push(input_bar)
			.into()
	}
}