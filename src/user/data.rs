
use libp2p::multihash::Multihash;

pub struct PublicData {
	name: Name,
	bio: Option<BiographyData>
	wallet: Option<CryptoData>,
}

pub struct NameData {
	/// Must be lowercase, Should be calculatable via NameData.display.to_lowercase()
	unique: String,
	/// Can be any valid unicode
	display: String,
	/// Hash of Consensus Block
	hash: Option<Multihash>,
}
impl NameData {
	pub fn new(display_name: &str) -> Self {
		let display = display_name.to_owned();
		NameData {
			unique: display.to_lowercase(),
			display,
		}
	}
}
