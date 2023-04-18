# Dither Anonymous Routing

Dither Anonymous Routing (DAR) is a peer-to-peer protocol for efficiently and flexibly obfuscating connections between computers.

It improves on speed and versatility over existing solutions (i.e. I2P and TOR) by incorporating latency and bandwidth estimation techniques so that intermediate relays may be (optionally) optimally chosen. It exposes this option to applications built on DAR, allowing the developers and users to explicitly dictate the trade-off they prefer between speed and anonymity for each networked application they use.

In addition, to align itself with the philosophy of Dither, DAR aims to be an generic as possible, so that different encryption schemes and transport types may be used for different connections so as to hedge against the risk of one of them breaking, as well as easily allowing for novel schemes that may not be rigorously tested, but have desirable properties such as the stateless encryption protocol described in [HORNET](https://arxiv.org/pdf/1507.05724v3.pdf).

## Route Properties Prediction (RPP)

In order to optimally select relays to establish onion routes through, it would be desirable to select nodes that have high-bandwidth connections and are located "en-route" between the sender and receiver. In small networks, this could be accomplished by every node measuring latency and bandwidth to every other node periodically, and then compiling a two separate shared `N*N` matricies representing the pairwise measurements of latency and bandwidth respectively. Then, when a path of relays needs to be selected, the requesting node would test all possible paths through the network to find the shortest ones and then send requests to nodes on those paths to be relays. This would (probably) work but exposes lots of information about the network publically and even in relatively small networks of even 20+ nodes, computational, communication, and storage costs make this solution completely infeasible.

There are still some methods to solve this problem, albeit less accurately. An individual without much experience in linear algebra might be able to think up a solution to solve the latency part of the problem, simply by observing that *latency between nodes seems to roughly correlate with physical distance between nodes*. To see if this correlation is modelable in practice, one could assign 3-dimensional coordinates (because we live in a 3D world) to each node and have each node progressively update that coordinate such as to minimize the latency prediction error with its peers, functionally "embedding" the latency metric into a 3D space. In this scenario, real-world latency is predicted via the "Euclidian Distance" function and this is roughly what the [Vivaldi](https://pdos.csail.mit.edu/papers/vivaldi:sigcomm/paper.pdf) paper does and it does predict latency. This method is considerably inaccurate because while Latency *does* correlate with physical distance, is not a direct causal relationship. Anything from internal processing latency, dynamic packet switching, or just a cable that doesn't go directly from the source to destination will lengthen distances, which will then distort the space that we are trying to use to predict latencies.

For the math people: There are two properties that Euclidian physical space must have, but latency does not: Symmetry, and The Triangle Inequality. In physical space, the distance from point A to point B must be equivalent no matter from which you are measuring. This is not the case for computers on the internet as ISPs may delay connections initiated by certain nodes but not others. Symmetry violations are rare and typically non-consequential, but Triangle Inequality violations are *everywhere* when measuring latency. The Triangle Inequalty says that given a measurement from point A to point B, a measurement from point A to B to C must always be greater than from A to B. (assuming C is not A or B). This inequality is frequently violated on the internet due to the tree-like way it is organized and routing tables may not always route packets along the most optimal paths (due to misconfiguration, or congestion management).

For those who know linear algebra, the better way to solve this problem is to imagine a large, partially filled $N*N$ matrix, where the ith row and jth column represent a latency or bandwidth measurement from node i to node j. When constructed on real networks, various papers have discovered that this matrix has a [low rank](https://en.wikipedia.org/wiki/Rank_(linear_algebra)). Rank is a metric measuring how *linearly independent* rows and columns of a matrix is, and matricies that are low-rank can be approximated by two matricies $N*r$ and $r*N$ where $r$ is the approximate rank of a large `N*N` matrix. Given a vector from column i from the $N*r$ matrix and vector from row j from the $r*N$ matrix factor, the dot product between the two vectors is the predicted latency from node i to node j. Note that unlike Vivaldi, this measurement is directional and you could swap rows/column indicies where the vectors are chosen from to get a measurement from node j to node i instead.
The "factorization" algorithm can be done on a single computer, but it can also be modified to work across a distributed peer-to-peer network similar to Vivaldi by simply doing running an optimization algorithm on each node to find a pair of $r$-size vectors that minimizes the difference between measured latency/bandwidth to directly connected nodes and predicted latency/bandwidth. I call this set of vectors "Routing Coordinates".

### Modeling Fluctuating Connections

While the goal of distance-based routing could be achieved by calculating a routing coordinate to each node in the network, This has two major problems: 

1. Individual nodes or even whole parts of the network may be moving in relation to other parts of the network, and thus fluctuating in terms of  (i.e. an airplane, or interplanetary communication). Thus requiring continuous recalculation of routing coordinates for all moving parties involved (which may include an entire planet, if used for inter-planetary routing).

2. Multiple networks may form independently and thus may form incompatible coordinate systems when communicating, requiring re-syncronization or some kind of coordinate translation.

The solution to this issue that would work with a Vivaldi-type prediction scheme reflects something that humans do: *allow for different frames of reference*. Instead of each node calculating its own coordinates based on the global coordinates of other nodes, each node is the center of its own universe and it simply represents other other nodes are simply offset from itself. I will call these offsets "relative routing coordinates" (RRCs). When two nodes want to communicate with each other, they must agree on some shared known point of reference, and then exchange their relative routing coordinates to that reference to be able to route through the network. This would formalize the idea that groups of computers may be changing relative to other groups of computers and would allow for more granular changes of relative coordinates rather than constant changes of global coordinates.

Unfortunately, this strategy doesn't work for matrix-factorization-based latency prediction, because translation is not a transformation that preserves the dot product between two vectors. Only rotations and reflections do. The problem here is still open, but I suspect the solution will entail some form of [tensor factorization](https://sci-hub.st/https://dl.acm.org/doi/10.1109/TNET.2020.3022757) or perhaps an even more advanced machine learning model. A somewhat general form of the problem is formalized as follows:

The metric is predicted at some time via some black box fuction using the local coordinates and remote coordinates:
$\^{d}_{ijt} = F(c_i, c_j, t)$

Metrics are occasionally measured at some time t: $d_{ijt}$

We must minimize the difference between the predicted and measured metric at any given time and update our current coordinates.

$$
\underset{c_i \in R^r}{\operatorname{\argmin}} \space d_{ijt} - F(c_i, c_j, t)
$$

### Other Concerns and Assumptions

An assumption of this scheme is that intermediate routes will be directly connected to each other, but this will often not be the case, especially in the case where intermediate nodes are far away from each other. In this case, the current vision for the protocol states that packets will traverse through nodes in-between relays on the network. This will probably cause unnecessary congestion, but hopefully the discovery and peer-to-peer karma system will route the majority of traffic along high-connected nodes.

## Peer Discovery

To form a network, there needs to be a process for new nodes to connect to existing nodes. Dither Anonymous Routing aims to allow peers to be as anonymous as possible, and thus the peer discovery method aims to expose as little as possible about nodes on the network. Specifically, as little information as possible about nodes that don't want to be discovered, and nodes far away (latency-wise) from the new node.

TLDR: Peer Discovery must expose information about *some* nodes, but should only expose information about nodes that are nearby and want to be known.

For more information, check out the [Discovery](./discovery.md) section.

To assign routing coordinates to nodes, there is a process of peer-discovery that functions as follows. This process happens whenever a new node joins the network.

1. New node bootstraps onto the network by initiating connection to one or more existing nodes.
2. New node tests response times (latency) to connected nodes (peers). 
3. New node requests from some subset of lowest-latency (closest) peers that it would like more peers.
4. New node's peers notify some slice of their peers that a new node would like more connections.
5. Notified nodes initiate connection if they are configured to do so and measure latency to new peers.
6. Notified nodes initiate connection with new nodes and new nodes measure latency to new peers.
7. New node takes note of the smallest latencies of its peers and goes back to step 3 until there are no closer nodes who want to peer.
8. After a certain number of closest nodes are found whose latency measurements are stable, the new node then calculates routing coordinates and is records its currently connected nodes so that it may reconnect when if went offline.

Through this process, a distributed network is formed that reflects the physical topology of the relative orientations of the nodes.

### Process

A packet with an RRC can be routed to its destination via the following process:

1. Node chooses the peer that will receive the packet next by comparing RRC directions
2. Node subtracts next peer's RRC from packet's RRC
3. Node forwards modified packet to next peer

The process continues until the packet's RRC is all zeroes and the last node it reaches either is the destination node, knows the destination node, or is the wrong node in which case the packet is dropped or sent back depending on the packet type.

### Usage

Compared to the global routing tables and complicated peering and address space allocation protocols that the existing internet uses. Routing Coordinates are much better for peer-to-peer applications because they are pretty much infinitely scalable. 

That said, RCs in some ways give away *more* information than traditional IP addresses do. Since the self-organized networks that use RCs reflect real-world network topologies, just knowing someone's routing coordinate relative to you could be akin to knowing roughly where they live. This is an acceptable risk because it is much easier to do efficient onion routing on networks with RCs than those without meaning that there is no reason not to have all connections onion-routed to some degree, providing better privacy overall.

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
 - Improvements on Phoenix paper's algorithm.

[7] [Application-Aware Anonymity, Sherr et al.](https://netdb.cis.upenn.edu/papers/a3-ndss.pdf)

 - 