
use rkyv::{Archive, Serialize, Deserialize};
use bytecheck::CheckBytes;

use crate::net::Network;

type SessionKey = [u8; 32];

#[derive(Debug, Clone, Archive, Serialize, Deserialize)]
#[archive_attr(derive(CheckBytes))]
pub struct Session<Net: Network> {
	session_key: SessionKey,
	address: Net::Address,
}