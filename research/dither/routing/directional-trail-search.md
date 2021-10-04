# Directional Trail Search

Allows for a computer to fetch a piece of data from another computer based on the multihash of that piece of data, as long as at least one computer has the data.

## General Structure

Directional Trail Search takes inspiration for how ants find food: scent and pheromone trails. In Dither, these take form as "holes" and "trails". Holes form when nodes broadcast to nearby nodes (nearby in terms of routing coordinates) that they have the data behind a given hash. Those nearby nodes will then note down the hash and which direction the broadcast came from. Then, when another node wants to find the data of that hash, it will send out many wandering packets [link needed] that will, when encountering a node that has the desired hash, will be routed by that node towards the node that actually has the data that generates the hash.

The other form is "trails". These form once a wandering packet has finally reached the node with the data it was looking for (the data the matches the hash). This destination node then sends a special traversal packet back to the sending node that tells each node on the way to take note of what direction the traversal packet came from. This forms a kind of trail in the network that other wandering packets can come across and follow to the desired node. This system also creates an effect where the more popular a given piece of data is, the faster a node hosting it will be found.

For data that is not very popular and can't be find found with a reasonable number of wandering packets, a simple DHT can be used to map hashes to route coordinates.

## Specific Structure

Every node in Dither will have a binary tree structure that maps hashes to a relative routing direction or a direct peer (TBD).

## Downsides

While Directional Trail Search is much faster and more efficient than DHTs, it is not as good when considering rare data. With a DHT, as long as there is at least one node hosting the data, it will be found eventually. With DTS, there is no guarantee that a piece of data will be found.

There are multiple potential solutions in order of feasibility:
 - Use a DHT in addition to DTS by default
 - Figure out how to get DTS to support rare files natively, perhaps by making nodes send out traversal packets pointing to themselves along the network to create artificial paths.
 - Store routing coordinates / routing areas on the Reverse Hash Lookup.
 - Implement a Network Coordination feature that tells all nodes in the network to notify a node when they find the requested data. (induces denial of service vector, probably a bad idea)
