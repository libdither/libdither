# Distance Based Routing

Distance Based Routing (DBR) is a protocol to obfuscate connections between computers on the Dither network. It improves on speed and flexibility over existing solutions (i.e. I2P and TOR) by taking into account the latency between nodes on the network. Instead of having to randomly choose nodes from a list to route through, by knowing the relative latencies of nodes, routing paths between nodes can be chosen to optimize for low-latency or anonymity, or a balance of both.

Note: There is a [research paper](https://www.dither.link/papers/distance-based-routing-whitepaper.pdf) comparing DBR to existing random-route solutions, for a somewhat amateurish comparison.

## The Main Idea

To figure out the relative latencies between nodes so as to establish low-latency paths to a destination, DBR makes the observation that the latency between nodes is roughly correlated to the physical distance between them. This means coordinates can be assigned to nodes such that the latencies between nodes can be estimated as the euclidian distance between coordinates. These coordinates will be referred to as "routing coordinates".

## Network Organization

To assign coordinates to nodes, there is a process of self-organization that functions as follows. This process happens whenever a new node joins the network.

1. New node bootstraps onto the network via 1 or more existing nodes.
2. New node tests response times (latency) to existing nodes. 
3. New node requests for new peers from existing nodes.
4. Existing nodes notify some slice of their peers that a new node would like new peers.
5. Notified nodes initiate connection with new node and each node measures latency.
6. New node takes note of the smallest latencies and goes back to step 3 until there are no closer nodes who want to peer.
7. After a certain number of closest nodes are found whose latency measurements are stable, the new node then calculates its own routing coordinates via [multilateration](https://en.wikipedia.org/wiki/True-range_multilateration) and broadcasts them to all the nodes used in the calculation.

Through this process, a distributed small-world network is formed that roughly matches the physical relations between the nodes.

Note: This process is more complicated to account for measuring errors, inconsistencies between routing coordinate networks and other potential problems.

## Routing Coordinates

Routing coordinates in this system acts as a replacement to IP addresses. A packet coupled with a routing coordinate can be routed to its destination by each node along the path comparing its own coordinate to the coordinate on the packet to figure out in which direction in the network (and by extension, which node) the packet should travel to next. This is way better for a peer-to-peer application because you don't need global routing tables or complicated peering and address space allocation protocols (like the existing internet). Routing coordinates are pretty much infinitely scalable. 

That said, routing coordinates on their own give away *more* information than traditional IP addresses do. Since the self-organized networks that routing coordinates are used in reflect real-world network topologies, just knowing someone's routing coordinate could be akin to knowing what block they live on. This is acceptable because it is much easier to do efficient onion routing on networks with routing coordinates which means that the majority of connections will be onion routed, providing better privacy overall.

Other benefits of routing coordinates are that they have the potential to almost completely prevent denial-of-service attacks. To even attempt such an attack, the attacker must find the routing coordinate or IP address of their target, which is essentially impossible unless the target specifically shared their coordinates publically for some reason. Even if the attacker does have the routing coordinate, trying to DOS a routing coordinate is like trying to DOS the entire expanse of network between the attacker and the target, the attacker(s) will be ineffective or blocked automatically for overuse of the network. Even distributed denial of service attacks can be mitigated with additions to the protocol allowing the victim to notify the network that they are being attacked and to rate limit the attackers.

## Anonymous Routing (Onions, Garlic, and all the others...)

Conventionally, anonymous routing is an incredibly slow ordeal because of how intermediate peers are selected from the network. Due to this inefficiency, onion routing protocols have been somewhat limited in what kind of privacy they can provide because of usability being a concern. This is no longer the case with DBR, which may support all kinds of anonymous routing schemes:

 - [Onion Routing](https://en.wikipedia.org/wiki/Onion_routing)
   - The simplest routing of them all. Simply select a list of peers and establish a route from beginning to end.
 - Garlic Routing
   - Similar to onion routing, but when sending packets to multiple peers at once, send them together for them to be split apart at some mid-point in the path.
 - Multi-path routing
   - Maintain multiple Onion routes throughout the network and randomly send packets along all or some subset of them.
 - Pool Routing
   - Create a group that nodes can join. All nodes randomly send randomly-sized data packets to all other nodes at random intervals, sending real data (padded) if there is data to send and sending random bytes if not.

DBR plans to use a modification of the [HORNET](https://arxiv.org/abs/1507.05724v3) protocol for setting up fast onion-routed links.

## Conflicting Coordinate Spaces
It is possible, (although unlikely) for two or more incompatible latency topologies to be formed independently in separate places and then come together later. A solution to this problem is still in the works, but it is likely the solution will come from the principle [synchronization of chaos](https://en.wikipedia.org/wiki/Synchronization_of_chaos).

A system built on synchronization might work by which as the two networks start to grow close and share nodes that can't resolve an accurate routing coordinate between the two conflicting spaces, it sets off a chain reaction through which the conflicted nodes "poison" other nodes to recalculate their coordinate spaces which creates a new coordinate space merging the two old ones (or one gets subsumed into the other).

## Bandwidth Trading
Routing protocols that rely on the goodwill of peers to allow others to use their bandwidth to route packets typically have only a small number of willing peers to route packets (i.e.: TOR). This is why protocols like BitTorrent, I2P and IPFS have systems in place that incentivize peers to play fair and contribute back to the network.

To accomplish this behavior for DBR there needs to be some kind of way to limit packets going through nodes that either don't use the network that much or don't have a lot of bandwidth capacity. Also to take into consideration are the management of nodes that have inconsistent uptime or inconsistent routing.

Lets analyze the situation:

 - Each node is a pipe and a water pump.
 - The pipe is sometimes closed and has a set max amount of water that can flow. The pipe also doesn't want to be overused.
 - The pump sometimes pumps water down various other pipes. This water should always reach its end destination taking various twists and turns throughout the network of pipes.

The goal:
 - Each node wants as little water as possible to flow through their pipe, but as much water as possible to flow out of their pump through other people's pipes, and nodes want a diverse selection of pipes (for anonymity).

Ideas:
 - Each node keeps track of the amount of water (bytes) flowing through its pipe from nearby pumps.
 - Each node's pump only sends water through pipes it knows it has received water from.
 - There is more to theorize about here for future research :)

