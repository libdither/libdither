
pub mod protocol;
pub mod behaviour;
pub use behaviour::*;
pub use protocol::*;

mod dither_proto {
	include!(concat!(env!("OUT_DIR"), "dither-proto.pb.rs"));
}