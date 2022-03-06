# Distance Based Routing

The goal of Distance Based Routing (DBR) is to obfuscate connections between computers on the Dither network. It works similarly to I2P & TOR, but is vastly improved by taking into account where proxy nodes are, instead of randomly selecting proxy nodes. It also allows for you to choose the trade-off between anonymity and speed.

 - Bandwidth Trading
 - Configurable Routing
   - Network Traversal
   - Network Searching
   - Onion Routing
   - Routing Wormholes

## Network Organization

The idea behind network organization is to be able to create a network that reflects the real-world positions of the computers. This is so that it is easy to calculate the latency between different locations in the network and to optimise routing paths.

Note: You can also read the network organization [research paper](https://www.dither.link/papers/distance-based-routing-whitepaper.pdf) (or don't, its not that good)

## Routing Coordinates

One of the main ideas behind Distance-based routing is to replace conventional IP addresses with a less structural addressing system. Instead of using an IP address to try to get the routing tables of the internet to route your data where you want it, Routing Coordinates allow for a less metadata-intensive way to route packets: instead of consulting extensive routing tables, all nodes have to do is route packets to a nodes closer to the packet's destination routing coordinates. This conveniently allows for keeping your IP address private, allowing for better protection against Denial of Service attacks.

Unfortunately, there are drawbacks. Routing Coordinates are spatial coordinates that represent the *latency topology* of a network. Because light travels at the speed of light, this latency topology reflects real-world connections between computers and their relative locations in the world. This allows for the unfortunate possibility that with a sufficiently informed attacker, the precise real-world location of a device could be deduced from its routing coordinates. To deal with this Dither uses Onion Routing by default when connecting to any peers not specifically trusted.

## Onion Routing
Conventionally, onion routing is an incredibly slow strategy because of how peers are typically selected in the network. However, with Routing Coordinates, peers directly along the path of the packet can be selected to allow for very minimal overhead. (in addition, the [HORNET](https://arxiv.org/abs/1507.05724v3) protocol will be used for its incredibly efficient symmetric encryption scheme).

## Bootstrapping
The by which a new node joins the network is as follows:
 - The new node first needs to bootstrap off of at least one existing node.
 - This existing node sends the new node a set of peer `Address`es selected based on how close they might be to the requesting node (this will represent a ring of nodes roughly a constant distance away from the existing node, this constant distance being the latency between the existing node and the new node).
   - In the case that the existing node has not been bootstrapped, it will notify the requesting node as such, and if the requesting node continues the connection, it will set its own Routing Coordinates to the origin of the coordinate space.
 - Assuming the existing node has at least one peer, the connecting node can accomplish the Local Peer Protocol.
 - The new node takes the set of peer `Address`es that were received from the existing node and pings them, measuring connection latency to all of them. The new node queries the existing nodes with the closest latencies for their sets of peers, and repeats until a set of nodes has been aquired ordered by their latency from the new node.
 - The node choses peers for it's "active set", by default this is a few hundred of its closest nodes.
 - The new node then uses [True-range multilateration](https://en.wikipedia.org/wiki/True-range_multilateration) on the closest nodes of its active set to calculate its own Routing Coordinate and then broadcasts this routing coordinate to its active set.
 - This concludes the bootstrapping process and the node can now use its routing coordinate as a temporary address on the network.

## Conflicting Networks
It is possible, (although unlikely) for two or more incompatible latency topologies to be formed in separate places. This can happen relatively easily if, say, two Dither networks formed independently on isolated networks and then these networks connected to each other. A solution to this problem is still in the works, however, this solution will most likely have to be a system that syncronizes itself.

## Routing Techniques
There are many possible routing techniques that could be built on top of Routing Coordinates, here is a list of some of the default ones:
 - Default Routing
   - This uses the underlying networking protocol (i.e. Ipv4 or Ipv6) to send data to and from some address.
 - Traversal Routing
   - A packet using this routing method contains a destination routing coordinate. When a node receives a packet using this routing method, it simply sends the the packet to whatever node in it's active set that is closer to the destination.
 - Proxy Routing (i.e. Onion Routing)
   - Multiple nodes in the network are selected to temporarily proxy packets to their destination.
   - Chains of these proxies can be formed with Onion Routing support to create re-usable network proxies. 
 - Locality Routing
   - This is a method to protect the exact location of a node.
   - All the nodes within a certain area in the routing coordinate space are instructed to route any packets they receive with a specific ID to a certain node in the space.

## Bandwidth Trading
Proxying protocols that rely on the goodwill of peers to route packets typically have only a small number of willing peers to route (ex: TOR). This is why protocols like BitTorrent, I2P and IPFS have systems in place that require peers to play fair and contribute back to the network.

To accomplish this behavior for Dither there are some potential solutions:
 - A node records how much data has been forwarded through itself from each node in it's "active set" and uses nodes that use it the most for traversal. 

