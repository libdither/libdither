# Distance Based Routing

The goal of Distance Based Routing (DBR) is to obfuscate connections between computers on the Dither network. It works similarly to I2P & TOR, but is vastly improved by taking into account where proxy nodes are, instead of randomly selecting proxy nodes. It also allows for you to choose the trade-off between anonymity and speed.

## Structure 

There are many parts of Distance-Based Routing.

 - [Network Organization](#network-organization-protocol)
   - Locating Local Peers
   - Route Coordinate Calculation
 - Co-operative bandwidth lending
 - Configurable Routing
   - Network Traversal
   - Onion & Garlic Secure Routing
   - Routing Wormholes

## General Idea



## Network Organization Protocol

Each node wants to find the closest nodes to it in the network so that it can understand where it is relative to all the other nodes in the network.

Each node that wants to join the network will first connect to multiple bootstrapping nodes. It will then query those nodes for nodes they are connected to. Then all the nodes will be tested for the connection latency to the connecting node. The closest nodes found will then be ask for their closest nodes and this will continue recursively until all the nodes closest to the connecting nodes are found.

### Locating Local Peers