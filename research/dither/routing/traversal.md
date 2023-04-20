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

## Design




If these 3 parties were separate categories of nodes, it would not be possible to design a system without some kind of external support / organization, because all the relays and routers would just not route any packets (and why should they?). However, in reality this is a peer-to-peer network where these categories overlap. So, if we can create a system of cooperation where to achieve the desires of the initiator, a given node would have to give up proportionally on its desires as a router or relay, this system may in fact be self-sustainable!

The goals of traversal routing in Dither are as follows:
 - Nodes should be able to establish connections to each other 
 - A stream of packets may be re-routed so as to best minimize the bandwidth of the nodes it traverses through as well as the total round-trip latency. This tradeoff will be a request from the packet sender and will be subject to the requester's reputation (i.e. how much they contribute to the network minus how much they use it)

Packet Traversal is Dither's answer to replacing conventional IP routing. Instead of rigid routing tables that must be centrally managed, packets flowing across the Dither network are managed locally and may reshape the structure of the network to better optimise for the goals of all parties involved.

