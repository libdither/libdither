# Directional Trail Search

Directional Trail Search (DTS) is a protocol for efficiently fetching a piece of stored data from a network given its hash.

It is intended to be a vast improvement over existing protocols like [IPFS](https://ipfs.tech/) by removing the use of poor-latency Distributed Hash Tables (DHT) and giving up some amount of data persistence in exchange for fast anonymous retrival of popular documents and flexibly anonymous hosting, and fixing the scalability issues to create a true "inter-planetary" file system.

## The Main Idea

DTS works via two forces: 
 - The desire of people (nodes) who want to host information and want their information to  be quickly accessible.
 - The desire of people (nodes) who want to access information and want to access it as fast as possible.

These two forces are corralled by DTS to create an efficient system to host and find data. First let us talk about the desire of a node who wants to host some data. This desire manifests in the form of a "data trail".

A data trail in DTS is a trail left in the network with the sole purpose of leading to a specific piece of data. Specifically, a trail is a chain of peered nodes that store a mapping between the hash of a specific piece of data, and the id of the next peer in the chain.

A data trail is formed with the following process:
 - A node that wants to host information broadcasts a "trail-laying" packet that travels to a specific [relative coordinate](distance-based-routing.md) on the network.
 - All the nodes that this "trail-laying" packet encounters on the way to its destination will do one of the following:
   - Reject to be a part of the trail, sending the packet to the previous node in the chain. This will reflect poorly on the node if it wants to host data of its own.
   - Register a connection between the hash contained within the packet and the id of the node the packet came from and forward the packet on to another node of a consistent distance away that it thinks will agree to be apart of the chain.
 - Allowing nodes to either host data & be apart of trails or not host data and not be apart of trails makes sure packets flow along computers that actually host data and are likely to be relatively stable and with resources to spare.

Once a data trail is formed, it may be encountered by a "trail-tracing" packet which, once on the trail, is routed directly to the root of the trail.

However, this trail of nodes may be very thin, and thus trail-searching packets may have a hard time finding trail because they skip over too many nodes. To fix this issue, trail-laying packets will broadcast out to all known peers within a certain range that they are a part of a trail related to a specific hash. Peers receiving this broadcast will use a counting bloom filter to make a record that they are nearby a trail for a specific hash. "trail-searching" packets that come across these "nearby-trail" nodes can ask the nodes to ask all their peers within a certain radius if the peers are apart of a real trail. This casts a larger net and makes it easier to find trails without putting undue burden on too many nodes.

WIP: Section about the requesters role in the network and the expectations of the network for requesters to contribute to hosting for some time. (like bitorrent or ipfs)

## Specific Structure (WIP)

*Note: This is an insanely hard problem to solve well: finding the node hosting a piece of data that matches a given hash on a network. The protocol here is a formulation of a protocol that might work to solve this problem.*

Every Dither node implementing DTS contains the following state:
 - A hashmap that maps multihashes to its corresponding data stored on disk, so that the node may retrieve its own data.
   - The size of this map should be primarily up to the node owner's discretion, depending on how much data they would like to store.
   - Data may be temporarily be added to this hashmap to help with the caching of other node's data.
 - A hashmap that maps multihashes to peers.
 - A bloom filter containing a set of multihashes of which there are trails nearby.

Every node will store the following information about their peers:
 - WIP

## Downsides

While Directional Trail Search is in theory much faster and much more efficient than DHTs, it is likely not as good when considering rare data. With a DHT, as long as there is at least one node hosting the data, it will be found eventually. With DTS, there is no guarantee that a piece of data will be found (i.e. if the data trails are too far away from the requesting node to be encountered by a searching packet).

There are multiple potential solutions in order of feasibility:
 - Use a DHT in addition to DTS by default (this may have privacy implications)
 - Figure out how to get DTS to work better for rare files, perhaps by making it so that trails form circles around the earth and thus are nearly impossible not to encounter.
 - Store routing coordinates / routing areas on the Reverse Hash Lookup.
 - Implement a Network Coordination feature that tells all nodes in the network to notify a node when they find the requested data. (induces denial of service vector, probably a bad idea)
