# Dither Idea Outline

- [Dither Idea Outline](#dither-idea-outline)
	- [What it is](#what-it-is)
	- [Structure](#structure)
	- [Network Layer](#network-layer)
		- [Custom Routing](#custom-routing)
	- [API Layer](#api-layer)
		- [User Management](#user-management)
		- [Custom Routing](#custom-routing-1)
		- [API](#api)
		- [Dither Consensus](#dither-consensus)
		- [WIP - Dither Weighted Voting](#wip---dither-weighted-voting)


## What it is
Dither is a layered application API built on top of [Libp2p](https://github.com/libp2p/rust-libp2p). It aims to replace most online services with a decentralized, private (and anonymous), alternative i.e. Chat Applications, File Syncronization & Backup, Social Media and Content Distribution)

## Structure
 - Libp2p Layer
   - Handles all the p2p details (NAT punching, peer proxying peer identification etc.)
   - Contains custom [onion routing protocol](https://github.com/libdither/dither-onion-router) which allows for complete anonymity on the network
 - API Layer
   - Permissioned user management
   - Consensus requests
   - Network structuring
 - Application Layer
   - Implements Specific Application structures and behaviors
   - Provides an API for GUI to implement

## Network Layer
### Custom Routing
Nodes are self-organized in such a way where each node searches for stable and worthy connections within certain distance "rings". Nodes will look for closest nodes as well as a certain number of nodes farther away (decreasing the farther away they are). A node's worth is measured by how inter-connected it is. These conditions make sure only useful nodes are central in the network.
Each node self-assigns itself a routing coordinate that represents it's virtual location in relation to nearby nodes. Conflicts in coordinates are resolved on a per-node basis.
With this structure, packets can traverse the network with just a routing coordinate. Each intermediate node passes the packet along to its neighbor that is nearest to the destination routing coordinate.
Nodes publish their PeerID and routing coordinates to a [Kademlia DHT](https://en.wikipedia.org/wiki/Kademlia).
Onion routing can be built on top of this network structure.
See the [Distance-Based Routing Whitepaper](https://github.com/zyansheep/routing-research) (WIP) for in-depth details

## API Layer

### User Management
- Permissioned Definitions
- A user will have multiple definitions of itself with varying levels of permission and transparency. This structure is used for setting user configuration
- Public Definition - Defines a user to the world
- The hash of this object defines this user to the network. It can be requested from anyone on the network and defines multiple things:
- Previous Hash (Optional) - In case you need to update the public config (which is necessary to change your name or add new devices)
- Data - public information about this user including Name, website, and other information the user wants to be public.
- Trusted Definition - Information which is accessible on request
- Routing Ideas
- Overlay network that routes through 2 peers on the way. (Need to form some kind of decentralized routing table) - Would create tor-likeness privacy. Depending on how it is implemented, it would be hard to trace packets

### Custom Routing
- “Router groups” - create a group of peers who forward incoming packets and outgoing packets through each other, making it difficult to know for sure if a packet is going to a specific user
  - Different modes have different speed
    - Speed - routes packets according to how fast they will leave the group
    - 
    - Random- connections are routed randomly to different peers.
    - Periodic (most secure, least speed, lots of data sent) - all peers send packets of random data, size (optional) at set intervals (specifiable) to random (or all) other peers. If a peer has data to send, they will send the encrypted data instead of the random data.

### API

- `CreateUser()`
  - Create new user (for permanent or temporary purposes)
  - This will create a new user in this peer and give access to application that called this DitherAction
- Bootstrap(PeerID, MultiAddr)
  - Tell network layer to bootstrap to specific node (only used on startup)
- Discover(UserId)
  - Initiate a network tree request to discover info about a user. (e.g. hosting peers, public configuration)
  - Depending on the queried user’s config information may or may not be returned.
- Authenticate(UserId, UserToken) - Authenticate to user on dither network
  - This will attempt to authenticate an application as a user on the network. 
  - When a token is sent to the peer(s) with permission over the user’s private key, the type of authentication is predetermined by the permissions in the private user configuration. The Types of Authentication are:
    - Hosting - the user’s private key is sent to the application and the application has full control over the user
    - Proxy - all events are sent through peers with actual permission to sign messages
  - Will attempt to authenticate as a known user with known hosting peer
- SendData(UserId, Application, Vec<u8>)
  - Send data to specific application of specific UserId
  - Can potentially be a local application (such as dither-scp or dither-db)
  - Or another dither service running on another peer

### Dither Consensus
- This will use the Stellar Consensus Protocol to enshrine information on a public, distributed ledger. It can be used for unique names
- Quorum slices will be created through a “trusted user” api which can be added to by various user applications with permission (e.g. the friends list of Dither Chat)
- Quorum Slices will be stored in the trusted user configuration
- Ledger is not necessarily strait, all blocks do not necessarily have to be added, 
- Small “Consensus Chains” can be publicly listed or privately created between specific users with special rules on how blocks are added

### WIP - Dither Weighted Voting
- Using Dither Consensus as a backend
- Creates Consensus Chains between users to vote on a specific *thing*
- Can be used for copyright reporting, community information addition, data validation, etc.
- Structure:
- Main definition
- Who created it

