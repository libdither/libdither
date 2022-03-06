# Distance Based Routing Specification

This file contains a packet specification for nodes that use Distance Based Routing.

## Spec Types
 - `Varint` - Signed Varint
 - `UVarint` - Unsigned Varint
 - `RouteCoord` = `Varint` - Routing coordinate, Variable-length signed integer.
 - `NodeID` = `Multihash` - Represents the hash of the Node's public key. Used to establish encrypted channels.
 - `Address` - Network primitive used to send packets. Defined by [network implementation](#network-implementation).


## The Packet Spec

Note: Each packet is sent with a randomly generated ID.

 - `Bootstrap { requester: NodeID }` - see [Bootstrapping](distance-based-routing.md#bootstrapping)
   - Node that sends this packets wants to bootstrap onto the network of the node that receives this packet.
   - Node that receives this packet will do the following:
     - Send a `Ping` request
     - If it is an unconnected node, it will set its RouteCoord to (0, 0).
     - Once latency & `RouteCoord` are confirmed, it will send back an `Info` packet.
 - `Info { route_coord: RouteCoord, active_peers: UVarint, active: Bool }`
   - Sent from a node that wants another node to know about its routing info. Also used to notify whether a node considers another node in its active set of nodes.
 - `RequestPeers { nearby: List<(RouteCoord, UVarint)> }`
   - Node that sends this packet wants to receive a list of peers that may be close to them. The more specific it is about its nearby peers, the more accurately it will receive new peers.
   - The node that receives this packet:
     - Must be a member of a network (i.e. have a RouteCoord & peers)
     - If so, it will select a certain slice of peers from its active set that are most likely to be close to the requesting node based on the nodes in the `nearby` list. For each of these peers, it will send a `WantPing` packet
 - `WantPeer { requesting: NodeID, addr: Address }`
   - Sent to peers that are close to `requesting` node.
   - Nodes that receive this packet:
     - Decide whether or not they want to establish a direct connection to the requester.
     - If they do, they will send an `Info` packet
 - `Ping`
   - Ping a node to measure its response time. (Requires `Ack` to be sent in response)
 - `Ack { unique: u64, need_ack: Bool }`
   - Packet sent in acknowledgement to most packets, allows sending node to calculate receiving node's response time.
   - The `unique` field represents the unique id of the packet that prompted the `Ack` to be sent.

## Network Implementation
Dither should be designed in a way where it is trivial to plug into any kind of network that uses arbitrary addressing schemes.
A network implementation provides the following:
 - Definition of an `Address` type
 - A two-way byte stream.

Note this is WIP, future network implementations may provide more specialized support.