# Distance Based Routing

Distance Based Routing (DBR) is a protocol to obfuscate connections between computers on the Dither network. It improves on speed and flexibility over existing solutions (i.e. I2P and TOR) by taking into account the latency between nodes on the network. Instead of having to randomly choose nodes from a list to route through, by knowing the relative latencies of nodes, routing paths between nodes can be chosen to optimize for low-latency or anonymity, or a balance of both.

Note: There is a [research paper](https://www.dither.link/papers/distance-based-routing-whitepaper.pdf) comparing DBR to existing random-route solutions, for a somewhat amateurish comparison.

## The Main Idea

To figure out the relative latencies between nodes so as to establish low-latency paths to a destination, DBR makes the observation that the **latency between nodes roughly correlates with the physical distance between them**. This means coordinates can be assigned to nodes such that the communication latency between nodes can be estimated as the euclidian distance between coordinates. These coordinates will be referred to as "routing coordinates".

While the goal of distancce-based routing could be achieved by assigning a routing coordinate to each node in the network, This has two major problems: 

1. Individual nodes or even whole parts of the network may be moving in relation to other parts of the network. (i.e. an airplane, or interplanetary communication). Thus requiring continuous recalculation of routing coordinates for all moving parties involved (which may include an entire planet, if used for inter-planetary routing).

2. Multiple networks may form independently and thus may have incompatible coordinate systems when communicating, requiring expansive re-syncronization or some kind of coordinate translation.

The simple solution to this issue is to do what we humans do, *allow for different frames of reference*. Instead of each node calculating its own coordinates based on the coordinates of other nodes, each node is the center of its own universe and all other nodes are simply offset from itself. I will call these offsets "relative routing coordinates" (RRCs). When two nodes want to communicate with each other, they must figure out where they are relative to some shared frame of reference.

## Peer Discovery

To assign relative coordinates to nodes, there is a process of peer-discovery that functions as follows. This process happens whenever a new node joins the network.

1. New node bootstraps onto the network by initiating connection to one or more existing nodes.
2. New node tests response times (latency) to connected nodes (peers). 
3. New node requests from some subset of lowest-latency peers that it would like more peers.
4. New node's peers notify some slice of their peers that a new node would like more connections.
5. Notified nodes initiate connection with new node and new node measures latency to new peers.
6. New node takes note of the smallest latencies of its peers and goes back to step 3 until there are no closer nodes who want to peer.
7. After a certain number of closest nodes are found whose latency measurements are stable, the new node then calculates relative routing coordinates for all of its active peers via [multilateration](https://en.wikipedia.org/wiki/True-range_multilateration) and broadcasts them to all the nodes used in the calculation.

Through this process, a distributed small-world network is formed that reflects the physical topology of the relative orientations of the nodes.

## Relative Routing Coordinates

Relative Routing coordinates (RRC) in this system acts as a replacement for IP addresses in conventional routing.

### Process

A packet with an RRC can be routed to its destination via the following process:

1. Node chooses the peer that will receive the packet next by comparing RRC directions
2. Node subtracts next peer's RRC from packet's RRC
3. Node forwards modified packet to next peer

The process continues until the packet's RRC is all zeroes and the last node it reaches either is the destination node, knows the destination node, or is the wrong node in which case the packet is dropped or sent back depending on the packet type.

### Usage

Compared to the global routing tables and complicated peering and address space allocation protocols that the existing internet uses. RRCs are much better for peer-to-peer applications because they are pretty much infinitely scalable. 

That said, RRCs in some ways give away *more* information than traditional IP addresses do. Since the self-organized networks that use RRCs reflect real-world network topologies, just knowing someone's routing coordinate relative to you could be akin to knowing roughly where they live. This is an acceptable risk because it is much easier to do efficient onion routing on networks with RRCs than those without meaning that there is no reason not to have all connections onion-routed to some degree, providing better privacy overall.

Other benefits of routing coordinates are that they have the potential to almost completely prevent denial-of-service attacks. To even attempt such an attack, the attacker must find the routing coordinate of their target. Disregarding user error, this kind of attack is essentially impossible since everything is onion-routed by default. Even if the attacker does have the target's routing coordinate, trying to DOS a routing coordinate is like trying to DOS the entire expanse of network between the attacker and the target, the attacker(s) will be ineffective or blocked by other nodes automatically for overuse of the network. Even distributed denial of service attacks can be mitigated with additions to the protocol allowing the victim to notify the network that they are being attacked and to rate limit the attackers.

## Anonymous Routing (Onions, Garlic, and all the others...)

Conventionally, anonymous routing is an incredibly slow ordeal because of how intermediate peers are selected from the network. Due to this inefficiency, onion routing protocols have been somewhat limited in what kind of privacy they can provide because low data rates and high latency was a concern. This is no longer the case with DBR, which may support all kinds of anonymous routing schemes:

 - [Onion Routing](https://en.wikipedia.org/wiki/Onion_routing)
   - The simplest routing of them all. Simply select a list of peers and establish a route from beginning to end.
 - Garlic Routing
   - Similar to onion routing, but when sending packets to multiple peers at once, send them together for them to be split apart at some mid-point in the path.
 - Multi-path routing
   - Maintain multiple Onion routes throughout the network and randomly send packets along all or some subset of them.
 - Pool Routing
   - Create a group that nodes can join. All nodes randomly send randomly-sized data packets to all other nodes at random intervals, sending real data (padded) if there is data to send and sending random bytes if not.

DBR plans to use a modification of the [HORNET](https://arxiv.org/abs/1507.05724v3) protocol for setting up fast onion-routed links.

## Preventing Network Abuse

Routing protocols that rely solely on people voluntarily hosting nodes typically only have a relatively small number of peers willing to route packets through themselves (i.e. TOR). This is why protocols like BitTorrent, I2P and IPFS have systems in place that incentivize peers who use the network to contribute back for the benefit of all.

To accomplish this behavior for DBR there must to be some way to limit packets going through nodes that either don't use the network that much or don't have a lot of bandwidth capacity and speed up packets through nodes that contribute greatly to the network. Also to take into consideration are the management of nodes that have inconsistent uptime or inconsistent routing.

When talking about incentives, we are talking about game theory. So lets analyze the game theoretical situation at the level of an individual node.

Constraints:
 - Each node is directly connected to a fixed number of other nodes at a varying latencies and bandwidth.
 - Each node wants to send traffic through other nodes to use the network.
 - Each node wants to establish onion proxies with other nodes for privacy.
 - Each node has set of parameters that may change over time:
   - Percentage of the time it will immediately respond and route a packet.
   - Amount of traffic per unit time it is willing to route on average.
   - Max amount of traffic per unit time it can route.

The goal is to allow for unrelated nodes to route and establish proxies through each other in proportion to how much each node contributes in some way to the network.

Ideas:
 - Each node keeps track of the amount of traffic (bytes) flowing through its itself from directly connected nodes.
 - Each node only sends traffic through direct nodes it knows it has received traffic from.
 - There is more to theorize about here for future research :)

