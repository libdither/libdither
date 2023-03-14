

use std::fmt;

use bytecheck::CheckBytes;
use futures::Sink;
use pin_project::pin_project;
use rkyv::{AlignedVec, Archive, Archived, Deserialize, Infallible, Serialize};
use rkyv_codec::{RkyvCodecError, RkyvWriter, VarintLength, archive_stream};

use crate::{net::Network, NetworkCoord, NCSystemPacket, session::PingID, DiscoveryPacket};

/// Acknowledging node packet
#[derive(Debug, Archive, Serialize, Deserialize, Clone)]
#[archive_attr(derive(CheckBytes))]
pub struct PingingNodePacket<Net: Network> {
	pub packet: Option<NodePacket<Net>>, // The packet being sent
	pub ping_id: Option<PingID>, // Contains ping id if expects immediate acknowledgement
	pub ack_ping: Option<PingID>, // Packet ping id that this packet is acknowledging
}

/// Packets that are sent between nodes in this protocol.
#[derive(Debug, Archive, Serialize, Deserialize, Clone, serde::Serialize, serde::Deserialize)]
#[serde(bound(serialize="", deserialize=""))]
#[archive(bound(serialize = "__S: rkyv::ser::ScratchSpace + rkyv::ser::Serializer"))]
#[archive_attr(derive(CheckBytes), check_bytes(bound = "__C: rkyv::validation::ArchiveContext, <__C as rkyv::Fallible>::Error: bytecheck::Error"))]
pub enum NodePacket<Net: Network> {
	DiscoveryPacket(DiscoveryPacket<Net>),
	// Subpacket for all things network-coordinate-system
	NCSystemPacket(NCSystemPacket),

	/// Raw Data Packet
	Data(Vec<u8>),

	/// Traversing packet
	Traversal {
		/// Place to Route Packet to
		destination: NetworkCoord,
		/// Packet to traverse to destination node
		#[omit_bounds] #[archive_attr(omit_bounds)] session_packet: Box<NodePacket<Net>>, // Must be type Init or Session packet
	},

	/// Packet representing an origin location
	Return {
		#[omit_bounds] #[archive_attr(omit_bounds)] packet: Box<NodePacket<Net>>,
		origin: NetworkCoord,
	},
}
impl<Net: Network> NodePacket<Net> 
where <Net::Address as Archive>::Archived: Deserialize<Net::Address, Infallible>
{
	pub fn from_archive(archive: &Archived<NodePacket<Net>>) -> Self
	{
		Deserialize::<NodePacket<Net>, Infallible>::deserialize(archive, &mut Infallible).unwrap()
	}
}

#[pin_project]
pub struct PacketRead<Net: Network> {
	#[pin]
	reader: Net::Read,
	stream_buffer: AlignedVec,
}
impl<Net: Network> std::fmt::Debug for PacketRead<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.debug_struct("PacketRead").finish() }
}
impl<'b, Net: Network> PacketRead<Net> {
	pub fn new(reader: Net::Read) -> Self { Self { reader, stream_buffer: AlignedVec::with_capacity(1024) } }
	pub async fn read_packet(&'b mut self) -> Result<&'b Archived<PingingNodePacket<Net>>, RkyvCodecError> {
		let packet = archive_stream::<Net::Read, PingingNodePacket<Net>, VarintLength>(&mut self.reader, &mut self.stream_buffer).await?;
		Ok(packet)
	}
}

#[pin_project]
pub struct PacketWrite<Net: Network> {
	#[pin]
	writer: RkyvWriter<Net::Write, VarintLength>,
}

impl<Net: Network> std::fmt::Debug for PacketWrite<Net> {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { f.debug_struct("PacketWrite").finish() }
}
impl<Net: Network> PacketWrite<Net> {
	pub fn new(writer: Net::Write) -> Self { Self { writer: RkyvWriter::new(writer) } }
	/* pub async fn write_packet<'a>(&mut self, packet: &PingingNodePacket<Net>) -> Result<(), RkyvCodecError> {
		Ok(self.writer.send(packet).await?)
	} */
}
impl<Net: Network> Sink<&PingingNodePacket<Net>> for PacketWrite<Net>
where
	RkyvWriter<Net::Write, VarintLength>: for<'a> Sink<&'a PingingNodePacket<Net>, Error = RkyvCodecError>,
{
    type Error = RkyvCodecError;

    fn poll_ready(self: std::pin::Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.project().writer.poll_ready(cx)
    }

    fn start_send(self: std::pin::Pin<&mut Self>, item: &PingingNodePacket<Net>) -> Result<(), Self::Error> {
		self.project().writer.start_send(item)
    }

    fn poll_flush(self: std::pin::Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.project().writer.poll_flush(cx)
    }

    fn poll_close(self: std::pin::Pin<&mut Self>, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.project().writer.poll_close(cx)
    }
}