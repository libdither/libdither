# Packet Traversal

Packet Traversal is method by which packets travel from source to destination across the dither network in a way that balances the desires of all parties involved such that the network sustains itself.

## Optimising Network Utility

To create an effective and sustainable peer-to-peer routing system, one must realize that the people running Dither nodes have their own desires that balance maximising the utility and minimizing the costs of using the network. To model this, we can imagine each user's node as an agent taking on one or more roles where each role has its own desires.

User: This is the role of a user running an application on their computer that uses the Dither network. The user wants the application to work as smoothly as possible, which means one or more of the following should be optimised for (depending on the application):
 - Packet gets from user to destination with as little delay as possible (minimise latency)
 - Data gets from user to destination as fast as possible (maximise bandwidth)
 - Data gets from user to destination as imperceptibly as possible (maximise anonymity set)

Router: This is the role of a contributer who maintains the network by routing packets between its peers and agreeing to be a part of an onion route.
 - Use as little bandwidth as possible, (minimise thoughput)
 - Use as little system resources as possible (minimise overhead)
 - Store as little long-term state as possible (minimise memory usage)

This model of desires is good, but not everyone who uses or contributes to the network may be trying to optimise for these things to such an extreme. Some contributors may run nodes for free for fun or because of an external reward. Some users may not care how long it takes for their packets to arrive or how fast they can download a movie, as long as it happens eventually. For these scenarios, whatever system put in place to maximise network utility, should not only balance conflicting desires (such as those as the User and Contributor), but also match compatible desires (such as users and contributors who don't mind contributing for free). 

## A User-Centric Model

Given no assumptions about the software running on a node, a given node with a set of peers will have for each peer some amount of resources (bandwidth, cpu cycles, memory) that it is willing to make available for that peer to use. This amount of resources may be static or it may fluctuate due to any number of reasons such as the behavior of the peer, prioritization of some peers over others, data being sent, or even natural forces such as limited link capacity. Whatever it may be, each node has some internal metric of how many resources they are willing to allocate to a given peer, determined by natural causes and internal decisions trees.

Cooperation is then just two nodes communicating aspects of their internal decision trees to each other. I.e. "if you do this, I will do this". The "ideal" node would be one controlled by an AI that can make decisions in terms of how many resources to allocate to different peers such that it balances the user's intentions, experience, between handling requests and using other nodes to handle the user's request.

### Resource-Optimising Agent Design

Containts:
 - At any given time, a user wants to either use the network or not use the network. They send various requests to peers with various desirable optimisations (latency, bandwidth, anonymity). These three measures to easy to verify from the source given some assumptions.
   - Latency - How much time it takes for remote to respond.
     - Assumptions: Remote isn't very close and some intermediate node is delaying things.
       - The network coordinate system is not distorted and manipulated from an attacker. Protection: NCShields.
   - Bandwidth - How much data can be pushed to remote per second
   - Anonymity - How many encrypted hops the packet goes though, how slow the connection is.
     - Assumption: When using mixnet mode, can't tell if cover traffic is effectively disguising the data as it travels through various parts of the network.
     - Assumption: Can't tell if nodes along relay path are malicious and recording packets.
     - Can't tell: Exactly how big the anonymity set is, only general estimations.
 - At any given time