# Decentralized Kerberos

Inspired by Kerberos authentication, by which every peer has a semi-permanent symmetric key (password) with a central server which then calculates one-time keys to establish encrypted connections to specific requested devices on a network.

Awesome Computerphile video: https://www.youtube.com/watch?v=qW361k3-BtU

## Idea

Decentralized kerberos removes the idea of a centralized server and instead establishes a direct symmetric connection to the desired peer by finding various peers near it an asking them for all act as a key authentication intermediary. Once a threshold of peers is met for enough different peers where it is unlikely that all the peers are controlled by one entity, the symmetric keys gained from each peer can be sent in one packet to the target node and combined to create a shared symmetric key.

If the desired peer to connect to is far away from the requesting peer, the peer can induce a recursive process to use the above algorithm to establish connections with closer and closer peers to the destination peer. Viable peers can be tested by requesting 

## Process

 - Bob is remote peer.
 - Alice wants to establish an encrypted connection with Bob using Decentralized Kerberos Authentication (DKA) instead of Public-Key Authentication (PKA). 
 - Both Alice and Bob have many peers that have established symmetric keys. 
 - Those peers have many other peers themselves and there are many paths of peers with encrypted tunnels to each other from Alice to Bob.
 - Alice sends a traversal packet using DBR targeting routing coordinates randomly distributed around Bob's routing coords.
 - She then, still through traversal packets, queries whether those peers have direct connections to Bob. She continues until she has a certain threshold of peers which have direct symmetric connections to Bob.
 - Again through traversal packets, she requests those peers to send back Kerberos authentication packets (i.e. packets that contain the requested symmetric key signed with a peer's symmetric key)

