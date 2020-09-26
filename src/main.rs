use libp2p::{Multiaddr, Transport, tcp::TcpConfig};

fn main() {
    let tcp = TcpConfig::new();
    let id_keys = Keypair::generate_ed25519();
    let noise_keys = noise::Keypair::<noise::X25519Spec>::new().into_authentic(&id_keys).unwrap();
    let noise = noise::NoiseConfig::xx(noise_keys).into_authenticated();
    let yamux = yamux::Config::default();
    let transport = tcp.upgrade(upgrade::Version::V1).authenticate(noise).multiplex(yamux);
    
    let tcp = TcpConfig::new();
    let addr: Multiaddr = "/unix//home/zyansheep/Desdroid/test1.socket".parse().expect("invalid multiaddr");
    let _conn = tcp.dial(addr).await;
}
