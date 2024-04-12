# Peer Discovery in Dither

The goal of peer discovery is to quickly allow a node that is new to the network to find a set of peers that are close by (latency-wise) that it can treat as its "local group". Ideally this process should reveal as little information as possible about the peering arrangements between nodes as well as prevent enumeration of nodes in the network.

The general process for peering is as follows:
 - A new node would like to acquire some peers.
 - The new node initiates a connection to one or more bootstrap nodes.
 - The bootstrap nodes, once the latency to the new node is measured, broadcast to the network that a new node is in the process of joining and any nodes that have a direct connection to the new node should share their measured latencies and coordinates with each other.
 - 
 - The new node sends a request for peers to the bootstrap nodes.
 - The bootstrap nodes notify one or more other nodes of the new node.
 - These other then initiate a connection with the requesting node.
 - The other nodes measure the latency to the requesting node
 - Those other nodes than notify *more* other nodes to perform even more latency measurements with the new node.

This process is purposefully vague because it can be modified in various ways depending on the threat models of the various nodes participating in the process.

There are two categories of information a given node might want to hide.

 - Node Membership - "Is IP X.X.X.X used by a Dither Node?"
 - Peer Membership - "Is node B contained within Node A's peer set"?

Some of this information must be accessible by a new node joining the network, otherwise the new node will not be able to connect to any peers.

