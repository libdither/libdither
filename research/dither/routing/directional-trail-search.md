# Directional Trail Search

Allows for a computer to fetch a piece of data from another computer based on the multihash of that piece of data, as long as at least one computer has the data.

## General Structure

Directional Trail Search takes inspiration for how ants find food: scent and pheromone trails. In Dither, these take form as "holes" and "trails". Holes form when nodes broadcast to nearby nodes (nearby in terms of routing coordinates) that they have the data behind a given hash. Those nearby nodes will then note down the hash and which direction the broadcast came from. Then, when another node wants to find the data of that hash, it will send out many wandering packets [link needed] that will, when encountering a node that has the desired hash, will be routed by that node towards the node that actually has the data that generates the hash.

The other form is "trails". These form once a wandering packet has finally reached the node with the data it was looking for (the data the matches the hash). This destination node then sends a special traversal packet back to the sending node that tells each node on the way to take note of what direction the traversal packet came from. This forms a kind of trail in the network that other wandering packets can come across and follow to the desired node. This system also creates an effect where the more popular a given piece of data is, the faster a node hosting it will be found.

For data that is not very popular and can't be find found with a reasonable number of wandering packets, a simple DHT can be used to map hashes to route coordinates.

## Specific Structure

Every node in Dither will have a binary tree structure that maps hashes to a relative routing direction or a direct peer (TBD).

