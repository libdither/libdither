# Dither Anonymous Routing

Dither Anonymous Routing (DAR) is a peer-to-peer protocol for efficiently and flexibly obfuscating connections between computers.

It improves on speed and versatility over existing solutions (i.e. I2P and TOR) by incorporating latency and bandwidth estimation techniques so that intermediate relays may be (optionally) optimally chosen. It exposes this option to applications built on DAR, allowing the developers and users to explicitly dictate the trade-off they prefer between speed and anonymity for each networked application they use.

In addition, to align itself with the philosophy of Dither, DAR aims to be as generic as possible, so that different encryption schemes and transport types may be used for different connections to hedge against the risk of one of them breaking, as well as easily allowing for novel schemes that may not be rigorously tested, but have desirable properties such as the stateless encryption protocol described in [HORNET](https://arxiv.org/pdf/1507.05724v3.pdf).

## Network Modeling

In order to figure out what paths through the network are ideal for the given application and user (trading-off latency, bandwidth, anonymity, and cost). We need to be able to model the effects of connecting and routing through different nodes. "Will connecting to 245.14.973.23 to hide my connection still reach my latency or bandwidth targets?", "To what degree will it gain me anonymity from various threat models?" "What will it cost?" etc. Users should be able to set QOL goals that they are happy with, minimum performance and anonymity guarantees on a per-application basis and have the protocol automatically figure out what nodes to select and route through. This is a general RL task however, and thus to solve it it seems likely that we'll need some general world modeling algorithms.

A world model should be able to:
 - Take two IP addresses, or a series of IP addresses and a timestamp, and guess the latency and bandwidth between them.
 - Take a desired latency and bandwidth and generate likely single or multiple IP chains that satisfy the desired latency, bandwidth, and cost. Or are as close to satisfying them as possible.

Ideally this world model should be trainable in a federated / decentralized fashion. It is an open problem for how this could be done without divulging local information. (Perhaps it could be incorporated into the loss function for it to be bad at predicting certain "sensitive" metrics, at least for versions of the model sent to other nodes. This would somehow have to be balanced well with the game theory of the other nodes.)

Once you do have a world model, you need to RL it. What are the rewards we are maximizing?
 - Predictive accuracy of metrics outside of yourself. (Predict results of actions)
   - Measurements, cost requests
   - Path selection metrics

What about the incentive layer here?
Lets assume we have an out-of-band currency exchange system that is anonymous.

Nodes are trying to maximize their own income from acting as proxies.
Cost is similar to latency or bandwidth, its a metric you receive from pinging a node and it can be predicted.

Nodes get requests for proxy and send back price, they have some baseline resource usage and want to maximize cumulative money over time. When they get a proxy request they can either accept or send back their own price which the sending node can either accept or not. RL algorithms will then need to learn how to bargain with each other automatically within their constraints.

## Peer Discovery

To form a network, there needs to be a process for new nodes to connect to existing nodes. Dither Anonymous Routing aims to allow peers to be as anonymous as possible, and thus the peer discovery method aims to expose as little as possible about nodes on the network. Specifically, as little information as possible about nodes that don’t want to be discovered, and nodes far away (latency-wise) from the new node.

TLDR: Peer Discovery must expose information about *some* nodes, but should only expose information about nodes that are nearby and want to be known.

For more information, check out the [Discovery](./discovery.md) section.

To assign routing coordinates to nodes, there is a process of peer-discovery that functions as follows. This process happens whenever a new node joins the network.

1. New node bootstraps onto the network by initiating connection to one or more existing nodes.
2. New node tests response times (latency) to connected nodes (peers). 
3. New node requests from some subset of lowest-latency (closest) peers that it would like more peers.
4. New node’s peers notify some slice of their peers that a new node would like more connections.
5. Notified nodes initiate connection if they are configured to do so and measure latency to new peers.
6. Notified nodes initiate connection with new nodes and new nodes measure latency to new peers.
7. New node takes note of the smallest latencies of its peers and goes back to step 3 until there are no closer nodes who want to peer.
8. After a certain number of closest nodes are found whose latency measurements are stable, the new node then calculates routing coordinates and is records its currently connected nodes so that it may reconnect when if went offline.

Through this process, a distributed network is formed that reflects the physical topology of the relative orientations of the nodes.

### Process

A packet with an RRC can be routed to its destination via the following process:

1. Node chooses the peer that will receive the packet next by comparing RRC directions
2. Node subtracts next peer’s RRC from packet’s RRC
3. Node forwards modified packet to next peer

The process continues until the packet’s RRC is all zeroes and the last node it reaches either is the destination node, knows the destination node, or is the wrong node in which case the packet is dropped or sent back depending on the packet type.

### Usage

Compared to the global routing tables and complicated peering and address space allocation protocols that the existing internet uses. Routing Coordinates are much better for peer-to-peer applications because they are pretty much infinitely scalable. 

That said, RC in some ways give away *more* information than traditional IP addresses do. Since the self-organized networks that use RCs reflect real-world network topologies, just knowing someone’s routing coordinate relative to you could be akin to knowing roughly where they live. This is an acceptable risk because it is much easier to do efficient onion routing on networks with RCs than those without meaning that there is no reason not to have all connections onion-routed to some degree, providing better privacy overall.

Other benefits of routing coordinates are that they have the potential to almost completely prevent denial-of-service attacks. To even attempt such an attack, the attacker must find the routing coordinate of their target. Disregarding user error, this kind of attack is essentially impossible since everything is onion-routed by default. Even if the attacker does have the target’s routing coordinate, trying to DOS a routing coordinate is like trying to DOS the entire expanse of network between the attacker and the target, the attacker(s) will be ineffective or blocked by other nodes automatically for overuse of the network. Even distributed denial of service attacks can be mitigated with additions to the protocol allowing the victim to notify the network that they are being attacked and to rate limit the attackers.

## Anonymous Routing (Onions, Garlic, and all the others…)

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

To accomplish this behavior for DBR there must be some way to limit packets going through nodes that either don’t use the network that much or don’t have a lot of bandwidth capacity and speed up packets through nodes that contribute greatly to the network. Also, to take into consideration are the management of nodes that have inconsistent uptime or inconsistent routing.

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


### Conflicts with ISP Load Balancing

(This section is WIP)

Implementing an alternative routing protocol on top of regular IP routing may pose issues for ISP routing (i.e. forcing utilising of certain links too much, causing major slowdowns). ISPs don't optimize for latency or bandwidth, they optimize for load balancing to prevent too much link utilisation. TODO: Dither should take this into account by implementing its own second-layer load balancing system that makes sure ISP links aren't overloaded.

Questions for this problem:
 - How might peer-to-peer overlay networks (of various kinds) effect an ISP’s ability to do load balancing well?
   - ISP simply have to do more buffering, slowing queue times for specific links, making those links become unattractive, shifting the route prioritization to ones that are less desirable -> problem is this makes those routes unusable for regular (nearby) people and are instead hijacked by through-traffic.



Research
 - Dawn - Selfish overlay compensate for careless underlay

 - If overlay networks can or do conflict with ISP load balancing effort, how can that conflict be reduced via design of the protocol?
   - Maybe reimplement load balancing into the network protocol?
     - What might this look like in a peer-to-peer setting?


Some set of nodes in the network:
 - Sending along certain local paths (need to be careful to not overwhelm bandwidth along local link: not likely)
 - Sending along mid-range path, some room for path diversity, but if everyone is doing it, it may create hotspot: need 

Main issue: A is sending large file to B, anonymously. If they route through one path, this will be a problem, if they route along multiple paths, ISPs have more ability to distribute the load. 
 - More paths = more chance for paths to be surveiled: is it obvious who is chatting with who? -> More obvious than just one path
   - Mixnets ? -> How fast would these be for large data transfers?




## Research, Inspirations & Similar Work

(List in rough order of reading of notable articles I am using to implement Dither Routing. If anyone knows of any similar work not listed here, please let me know on Matrix!)

[1] [HORNET: High-speed Onion Routing at the Network Layer](https://arxiv.org/pdf/1507.05724v3.pdf)

 - Stateless Onion Routing, improves establishment of onion routes as well as speed of forwarding.

[2] Vivaldi - [pdf](https://pdos.csail.mit.edu/papers/vivaldi:sigcomm/paper.pdf), [video](https://www.youtube.com/watch?v=AszPoJjWK9Q&t=1690s)
 - The paper that pretty much started the distributed Network Coodinate System field of research.

[3] [Coordinate-Based Routing for High Performance Anonymity](https://boonloo.cis.upenn.edu/papers/msherr-dissertation.pdf)

 - Applying Vivaldi to Anonymous Routing

[4] [Phoenix: A Weight-Based Network Coordinate
System Using Matrix Factorization](https://user.informatik.uni-goettingen.de/~ychen/papers/Phoenix_TNSM.pdf)

 - Improvements on Vivaldi, uses Matrix Factorization instead of Euclidian Embedding

[5] [NCShield: Protecting Decentralized, Matrix
Factorization-Based Network Coordinate Systems](https://ix.cs.uoregon.edu/~lijun/pubs/pdfs/chen15ncshield.pdf)

 - Threat modeling on Network Coordinate Systems. Prevents Frog-Boiling attacks.

[6] [DMFSGD: A Decentralized Matrix Factorization Algorithm for Network Distance Prediction](https://arxiv.org/pdf/1201.1174.pdf)
 - Improvements on Phoenix paper’s algorithm.

[7] [Application-Aware Anonymity, Sherr et al.](https://netdb.cis.upenn.edu/papers/a3-ndss.pdf)

 - 