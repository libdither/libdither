# Distance Based Routing Specification

This file contains a packet specification for nodes that use Distance Based Routing.

## Spec Types
 - `Varint` - Signed Varint
 - `UVarint` - Unsigned Varint
 - `RouteCoord` = `Varint` - Routing coordinate, Variable-length signed integer.
 - `NodeID` = `Multihash` - Represents the hash of the Node's public key. Used to establish encrypted channels.
 - `Address` - Network primitive used to send packets. Defined by [network implementation](#network-implementation).


## The Packet Spec

Note: Each packet is sent with some extra data that allows for easy latency measurements:
```rust
{
	packet: Packet, // Packet that is being wrapped
	id: UInt16, // Unique ID of this packet
	need_ack: Bool, // Whether or not an acknowledgement is requested
	acknowledge_id: UInt16 // The packet that this packet is acknowledging
}
```
 - `Bootstrap { requester: NodeID }` - see [Bootstrapping](distance-based-routing.md#bootstrapping)
   - Node that sends this packets wants to bootstrap onto the network of the node that receives this packet.
   - Node that receives this packet will do the following:
     - If it is an unconnected node, it will set its RouteCoord to (0, 0).
     - Send a `Info` packet as acknowledgement.
 - `Info { route_coord: RouteCoord, active_peers: UVarint, active: Bool, prompting_node: NodeID }`
   - Sent by a node whenever that node deems it necessary for the recipient to know it's peering information.
     - Prompted by `Bootstrap` and `WantPeer` packet.
     - Also sent out by a node when it changes its *active set*.
 - `RequestPeers { nearby: List<(RouteCoord, UVarint)> }`
   - Node that sends this packet wants to receive a list of peers that may be close to them. The more specific it is about its nearby peers, the more accurately it will receive new peers.
   - The node that receives this packet:
     - Must be a member of a network (i.e. have a RouteCoord & peers)
     - If so, it will select a certain slice of peers from its active set that are most likely to be close to the requesting node based on the nodes in the `nearby` list. For each of these peers, it will send a `WantPing` packet
 - `WantPeer { requesting: NodeID, addr: Address }`
   - Sent to peers that are close to `requesting` node.
   - Nodes that receive this packet:
     - Decide whether or not they want to establish a direct connection to the requester.
     - If they do, they will start a connection with an `Info` packet.
 - `Ping`
   - Ping a node to measure its response time.
   - Expects immediate acknowledgement via `Ping` packet.

## Network Implementation
One of Dither's major goal is to make it so that anyone can access it, regardless of location or political censorship laws. So, the Dither abstracts out the network implementation so that it may work in any kind of network environment.

A network implementation provides the following:
 - Definition of an `Address` type used to connect to arbitrary machines in the network.
 - A way to establish an encrypted byte stream with a pre-known public key.

Note this is WIP, future network implementations may provide more specialized support.

## Connection Scenarios

Example: Node A wants to bootstrap off of Node B. Node A must know Node B's NodeID and Address beforehand.
```
<Establish Encrypted Connection>
initial_state: (A: RemoteB: Direct), (B: RemoteA: Direct)
A -> B, Enc(Packet: Bootstrap)
B -> A, Enc(Packet: Ack(Info))
A -> B, Enc(Packet: RequestPeers)
B -> (C, D, E), Enc(Packet: WantPeer)
(C, D, E) -> A, <Establish Encrypted Connection>
(C, D, E) -> A, Enc(Packet: Info)
```