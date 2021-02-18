use crate::dither_proto;

use libp2p_core::{InboundUpgrade, OutboundUpgrade, UpgradeInfo, PeerId, upgrade};
use prost::Message;
use std::{error, fmt, io, iter, pin::Pin};
use futures::{Future, io::{AsyncRead, AsyncWrite}};

/// Implementation of `ConnectionUpgrade` for the floodsub protocol.
#[derive(Debug, Clone, Default)]
pub struct DitherProtocol {}

impl DitherProtocol {
	/// Builds a new `FloodsubProtocol`.
	pub fn new() -> DitherProtocol {
		DitherProtocol {}
	}
}

impl UpgradeInfo for DitherProtocol {
	type Info = &'static [u8];
	type InfoIter = iter::Once<Self::Info>;

	fn protocol_info(&self) -> Self::InfoIter {
		iter::once(b"/dither/1.0.0")
	}
}
