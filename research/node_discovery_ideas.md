
# How to do Node Discovery while Limiting Structural Data Leakage?

Debate: When requesting for peers from a connected node, should the node send back a list of publically available IPs? Or should the node forward the request to the peers in question for them to initiate the connection?
 - Sending back a list of public IPs
   - Pros:
	 - Faster to implement (kinda)
	 - Used by most networks
	 - Possibly easier NAT tunneling? (because it doesn't inherently require an open listening port)
   - Cons:
	 - Allows for easy enumeration of all nodes in the network by just requesting lists and connecting to nodes.
 - Notifying peers of the request for them to connect.
   - Does this strategy actually prevent peer enumeration? 
	 - People with a single computer can just request for a given node and ask for new connections to get IPs. If they repeatedly do this from different IPs, they can get a good sense of all the peers of a given node.
       - Fix: Instead of just forwarding request to all peers. Forward request to one peer at a time and have that peer report back the measured latency. Forward  request to another peer if first peer reported greater latency than request receiver. If peer was in fact closer to requester, that peer connects to the requester and the process starts anew.
	 - Even if the peer selection is random and only ~2-3 peers will be contacted at any given peer request, you can still repeatedly ask the node to eventually get a list of all peers.
		 - Fix: Request is only forwarded to peers of a similar latency to the requesting node. This also likely makes for quicker convergence to a "local group" as well as prevents closeby peers from needlessly connecting to requesters.
		 - Also: any node after the initial requested node can use network coordinates to more accurately recommend closer and closer nodes to forward the peer request to.
	 - If someone can place nodes relatively close to a given node (<30ms), they can do peer requests at various distances and eventually sus out all the peers.
		 - One way to lessen this attack would be for some peers to simply not participate in the discovery process. Its not a process that needs a whole lot of participants anyway. These peers could initialize connections only if arbitrary (user-defined based on threat profile) conditions are met such as:
			 - Predefined trust between the requester and the peer (via any kind of trust-system like web of trust, trusted certificates, or simply a set of trusted public keys)
			 - A lighter requirement might be that the node must be connected to some subset of their peers.
			 - A third requirement could be that the node must be within a certain latency radius as predicted by routing coordinates.
		 - No matter how many times unknown IPs request for peers from a given node, it will never forward the request to these peers.
		 - Another way to lessen this kind of attack might be to require new nodes to have knowledge of multiple bootstrap nodes before new peers may be requested. These bootstrap nodes could then collude to decide which of their peers is closest to the requesting node and forward the request on to them (passing along all the latency measurements and routing coordinate estimate data for even more accurate positioning).
	 - At this point, I think only an ISP would be able to figure out peer relationships via faking nodes and doing peer requests, and it would probably be easier for them to just do direct traffic analysis...
   - Pros
	 - Provides wayy more protection from even relatively advanced adversaries trying to probe the structure of the network.
   - Cons
	 - wayyy more complex
	 - Slower for new nodes to bootstrap depending on design (although its likely fine once they already have established connections to nearby peers), could also potentially be speed up by web-of-trust stuff (i.e. bootstrapping off multiple friends).