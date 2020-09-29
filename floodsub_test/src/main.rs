use tokio::{io};
use futures::{future, prelude::*};
use libp2p::{
    Multiaddr,
    PeerId,
    Swarm,
    NetworkBehaviour,
    identity,
    floodsub::{self, Floodsub, FloodsubEvent},
    mdns::{Mdns, MdnsEvent},
    swarm::NetworkBehaviourEventProcess
};
use std::{error::Error};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    env_logger::init();

    // Create a random PeerId
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(local_key.public());
    println!("Local peer id: {:?}", local_peer_id);

    // Set up a an encrypted DNS-enabled TCP Transport over the Mplex and Yamux protocols
    let transport = libp2p::build_development_transport(local_key)?;

    // Create a Floodsub topic
    let floodsub_topic = floodsub::Topic::new("chat");

    // We create a custom network behaviour that combines floodsub and mDNS.
    // In the future, we want to improve libp2p to make this easier to do.
    // Use the derive to generate delegating NetworkBehaviour impl and require the
    // NetworkBehaviourEventProcess implementations below.
    #[derive(NetworkBehaviour)]
    struct MyBehaviour {
        floodsub: Floodsub,
        mdns: Mdns,

        // Struct fields which do not implement NetworkBehaviour need to be ignored
        #[behaviour(ignore)]
        #[allow(dead_code)]
        ignored_member: bool,
    }

    impl NetworkBehaviourEventProcess<FloodsubEvent> for MyBehaviour {
        // Called when `floodsub` produces an event.
        fn inject_event(&mut self, message: FloodsubEvent) {
            if let FloodsubEvent::Message(message) = message {
                println!("Received: '{:?}' from {:?}", String::from_utf8_lossy(&message.data), message.source);
            }
        }
    }

    impl NetworkBehaviourEventProcess<MdnsEvent> for MyBehaviour {
        // Called when `mdns` produces an event.
        fn inject_event(&mut self, event: MdnsEvent) {
            match event {
                MdnsEvent::Discovered(list) =>
                    for (peer, _) in list {
                        self.floodsub.add_node_to_partial_view(peer);
                    }
                MdnsEvent::Expired(list) =>
                    for (peer, _) in list {
                        if !self.mdns.has_node(&peer) {
                            self.floodsub.remove_node_from_partial_view(&peer);
                        }
                    }
            }
        }
    }

    // Create a Swarm to manage peers and events
    let mut swarm = {
        let mdns = Mdns::new()?;
        let mut behaviour = MyBehaviour {
            floodsub: Floodsub::new(local_peer_id.clone()),
            mdns,
            ignored_member: false,
        };

        behaviour.floodsub.subscribe(floodsub_topic.clone());
        Swarm::new(transport, behaviour, local_peer_id)
    };

    // Reach out to another node if specified
    if let Some(to_dial) = std::env::args().nth(1) {
        let addr: Multiaddr = to_dial.parse()?;
        Swarm::dial_addr(&mut swarm, addr)?;
        println!("Dialed {:?}", to_dial)
    }

    // Read full lines from stdin
    use io::AsyncBufReadExt;
    let mut stdin = io::BufReader::new(io::stdin()).lines();

    // Listen on all interfaces and whatever port the OS assigns
    Swarm::listen_on(&mut swarm, "/ip4/0.0.0.0/tcp/0".parse()?)?;

    // Kick it off
    let mut listening = false;
    loop {
        let to_publish = {
            tokio::select! {
                line = stdin.try_next() => Some((floodsub_topic.clone(), line?.expect("Stdin closed"))),
                event = swarm.next() => {
                    println!("New Event: {:?}", event);
                    None
                }
            }
        };
        if let Some((topic, line)) = to_publish {
            swarm.floodsub.publish(topic, line.as_bytes());
        }
        if !listening {
            for addr in Swarm::listeners(&swarm) {
                println!("Listening on {:?}", addr);
                listening = true;
            }
        }
    }
}