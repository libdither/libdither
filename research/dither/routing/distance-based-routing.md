# Distance Based Routing

The goal of Distance Based Routing (DBR) is to obfuscate connections between computers on the Dither network. It works similarly to I2P & TOR, but is vastly improved by taking into account where proxy nodes are, instead of randomly selecting proxy nodes. It also allows for you to choose the trade-off between anonymity and speed.

## Structure 

There are many parts of Distance-Based Routing.
 - [Network Organization](#network-organization)
   - Locating Local Peers
   - Calculating Routing Coordinates
 - Bandwidth Trading
 - Configurable Routing
   - Network Traversal
   - Network Searching
   - Onion Routing
   - Routing Wormholes

## Network Organization

The idea behind network organization is to be able to create a network that reflects the real-world positions of the computers. This is so that it is easy to calculate the latency between different locations in the network and to optimise routing paths.

Note: You can also read the network organization [research paper](https://www.dither.link/papers/distance-based-routing-whitepaper.pdf) (or don't, its not that good)

### Locating Local Peers

The general idea is that each node that wants to join the network will first connect to one or more bootstrapping nodes. The connecting node will then request from those nodes more nodes to connect to and test all those new nodes for the time it takes packets to travel back and forth from them (packet latency). The new known nodes will then be ordered by the lowest latency. Those new closest nodes will then be asked for their closest nodes and this will continue recursively until all the nodes closest to the connecting node are found.

The specific protocol is as follows: [WIP]


### Calculating Routing Coordinates

Calculating Route Coordinates 

## Bandwidth Trading

## Configurable Routing