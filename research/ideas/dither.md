# The Dither Project

- [The Dither Project](#the-dither-project)
- [What is it?](#what-is-it)
- [Structure](#structure)
- [Network Layer](#network-layer)
  - [Distance-Based Routing](#distance-based-routing)
- [Core Layer](#core-layer)
  - [Data Structuring](#data-structuring)
    - [Trait Typing](#trait-typing)
    - [Reverse Hash Lookup Versioned Binary Tree](#reverse-hash-lookup-versioned-binary-tree)
    - [Example Traits](#example-traits)
  - [Directional Trail Search (DTS)](#directional-trail-search-dts)
  - [User Management](#user-management)
  - [Custom Routing](#custom-routing)
    - [User Management](#user-management-1)
  - [Dither Chain References](#dither-chain-references)
  - [Dither Consensus Chains](#dither-consensus-chains)
  - [WIP - Dither Weighted Voting](#wip---dither-weighted-voting)

# What is it?
Dither is a modular application API built on top of [Libp2p](https://github.com/libp2p/rust-libp2p). It aims to provide buliding blocks for Consensus, Communication, Data Storage, Account Management, and more to replace most online services with a decentralized and private alternative. It aims to be compatible for extracting data from and interfacing with most existing decentralized and centralized systems such as IPFS, Github, Reddit, Youtube, Sci-Hub, Odysee & Discord.
*The aim for Dither is to replace these applications with decentralized alternatives that are unified through their use of a singular, modular protocol.*

It is much inspired by and takes from various projects such as Rust, TOR, Bittorrent, IPFS, Stellar, Ethereum, IOTA, Monero, zk-STARKS, and more.

Potential Decentralized Applications that can be created with Dither:

Chat/Communication Apps, Video Sharing, Social Media, Comment systems, File Syncronization, Encrypted Backup, Voting systems, Exchanges, Crowdfunding, VCS, Stores, Serverless Games, Remote Machine Control, etc.

# Structure
 - Network Layer (Provided by libp2p)
   - Handles all the p2p details (NAT traversal, routing, and cryptography)
   - [Distaced-Based Routing protocol](https://github.com/libdither/dbr-sim): Custom onion routing protocol which allows for anonymity on the network and is faster and more flexible compared to random routing (like what TOR and I2P uses)
 - Core Layer
   - Data Structuring (Traits, Self-Defining structs)
   - Data Locating (Gravity Tree Search)
   - Consensus Algorithms (Stellar Consensus Protocol + IOTA)
   - User Management (User data storage & syncronization)
 - Application Layer
   - Uses some or all of Dither's features to create an application
   - May provide an API as a library or a full application.

# Network Layer
## Distance-Based Routing
Nodes are organized in euclidian space using their relative virtual distance to each other. Packets are then routed using these virtual coordinates to create shortest path through the network.

See the [Distance-Based Routing Notebook](https://github.com/zyansheep/routing-research) for in-depth details

# Core Layer

## Data Structuring
 - Dither data will work much like IPFS where data is content-addressed with a multihash
 - Application data structures must start with the multihash of a trait definition.
 - The trait tree defines layout of the data structure

### Trait Typing
 - Traits are the type system for Dither. They prescibe meaning to data.
 - Trait definitions define how a data structure should be layed out and what requirements it has for validity.
 - An Example of a trait might be anything from being a "Video" to being a "Comment" or even a "Transaction".
 - This extensible trait system allows for any kind of representation of data and is a self-describing data structure such that no matter what structure someone has, it will be able to be parsed.
 - Traits can contain field requirements with subtrait bounds.
   - For example, a "Video" trait may have a title field which must satisfy the "String" trait.
 - Trait definitions are themselves data structures which implement a "Trait" trait. (there should only be a few of these, one for each time Dither is upgraded)
 - Traits are referred to by a MultiHash
 - The "Trait" trait is formatted as follows:
   1. MultiHash (Previous version of trait definition, Optional)
   2. List\<MultiHash\> (Subtraits that make up a trait)
   3. TraitLocalization (Default localization names, Optional)
 - Trait field names can be defined with a "TraitLocalization" trait
   1. None (no previous version)
   2. Trait List
      1. Reverse\<MultiHash\> (Hash of Trait to define, using Reverse trait for lookup table)
      2. String (Localized Name of Trait)
      3. List<String> (UTF-8 String encoding name for each field)
 - Trait Localizations are found through the Reverse Lookup Blockchain

### Reverse Hash Lookup Versioned Binary Tree
 - This is a system by which one can find structures that link to a given hash implementing the reverse trait.

### Example Traits
Traits can define literally any data structure and method of validation.
 - "Transaction" (With localization fields)
   - previous_transaction: SelfRef
   - definintion: Multihash (Default Trait Definition)
   - source: List\<MultiKey\>
   - destination: Multikey
   - pederson_commitment: PedersonCommitment
   - signature: RingSignature

## Directional Trail Search (DTS)
Content needs to be able to be located on the network. Traditionally this is done through a Distributed Hash Table (i.e. Kademlia)  that maps content hashes to peers on the network that host data corresponding to the hashes. In constrast, Directional Trail Searching (DTS) is inspired the Pheromone Trails left by Ants. Whenever a specific hash is requested, a broadcast of searcher packets is sent in all directions in the network. As they travel from node to node, each node checks the hash against a binary tree that stores the direction for the searching packet to travel in and the approximate distance. A node can either choose to adjust the trajectory of the packet or forward it onwards on it's existing trajectory. Eventually a searching packet will find a "Trail" or a "Hole" by chance and will be guided to the node hosting the hash's data.
A Hole is formed around a node broadcasting itself to be hosting a given piece of data to nearby nodes.
A Trail is formed by a searching packet configured to leave a trail on it's way back to the device who originally sent out the packet.
Trail and Hole forming is optional and is at the discretion of the data hoster(s) and intermediate nodes.

Nodes looking for specific data corresponding to a hash can broadcast a content request packet which traverses through the network until it either encounters a hole, trail, or exceeds the search radius.
If none of the packets traveling across the network fall into a hole or encounter a trail (because there weren't enough packets or not enough holes) a traditional DHT lookup can be performed if supported by hosters. 

DTS is much faster and more effective than a DHT because DHT data hosting is distributed randomly across the network meaning that you might have to traverse back and forth across the internet to find someone hosting the data you need.

## User Management
- Permissioned Definitions
- A user will have multiple definitions of itself with varying levels of permission and transparency. This structure is used for setting user configuration
- Public Definition - Defines a user to the world
- The hash of this object defines this user to the network. It can be requested from anyone on the network and defines multiple things:
- Previous Hash (Optional) - In case you need to update the public config (which is necessary to change your name or add new devices)
- Data - public information about this user including Name, website, and other information the user wants to be public.
- Trusted Definition - Information which is accessible on request
- Routing Ideas
- Overlay network that routes through 2 peers on the way. (Need to form some kind of decentralized routing table) - Would create tor-likeness privacy. Depending on how it is implemented, it would be hard to trace packets

## Custom Routing
- “Router groups” - create a group of peers who forward incoming packets and outgoing packets through each other, making it difficult to know for sure if a packet is going to a specific user
  - Different modes have different speed
    - Speed - routes packets according to how fast they will leave the group
    - 
    - Random- connections are routed randomly to different peers.
    - Periodic (most secure, least speed, lots of data sent) - all peers send packets of random data, size (optional) at set intervals (specifiable) to random (or all) other peers. If a peer has data to send, they will send the encrypted data instead of the random data.

### User Management

- `CreateUser()`
  - Create new user (for permanent or temporary purposes)
  - This will create a new user in this peer and give access to application that called this DitherAction
- `Bootstrap(PeerID, MultiAddr)`
  - Tell network layer to bootstrap to specific node (only used on startup)
- `Discover(UserId)`
  - Initiate a network tree request to discover info about a user. (e.g. hosting peers, public configuration)
  - Depending on the queried user’s config information may or may not be returned.
- `Authenticate(UserId, UserToken)` - Authenticate to user on dither network
  - This will attempt to authenticate an application as a user on the network. 
  - When a token is sent to the peer(s) with permission over the user’s private key, the type of authentication is predetermined by the permissions in the private user configuration. The Types of Authentication are:
    - Hosting - the user’s private key is sent to the application and the application has full control over the user
    - Proxy - all events are sent through peers with actual permission to sign messages
  - Will attempt to authenticate as a known user with known hosting peer
- `SendData(UserId, Data)`
  - Send data to specific application of specific UserId
  - Can potentially be a local application (such as dither-scp or dither-db)
  - Or another dither service running on another peer

## Dither Chain References
Ideas for Dither Consensus
 - IOTA Tangle
 - Stellar Consensus Protocol
 - zk-STARKS (for privacy)
 - Layered on top of Dither Gravity Tree Search for storage

## Dither Consensus Chains
- Regular Chains
  - A chain is created just by linking to one or more other Hashtraits (fundamental format of Dither objects)
  - Regular Chains can be used to represent filesystems, linked data, pretty much anything.
- Consensus chains are different in that blocks linking to other blocks are weighted by how much they are linked to themselves. (Like the IOTA tangle)
- Blocks are added via "active consensus", where new blocks are broadcast to computers actively participating in consensus and organized / verified using the Stellar Consensus Protocol.
  - This could be used for a comment system where the comments with the most upvotes / interactions are sorted higher in a specific index.
- Quorum slices in the SC protocol will be made up of social friends or other trusted users. (which can be registered by applications using Dither in specific contexts i.e. close friends in Dither Chat could be designated as part of a core Quorum Slice)
- Quorum Slices will be stored in the trusted user configuration
- Small “Consensus Chains” can be publicly listed or privately created between specific users with special rules on how blocks are added

## WIP - Dither Weighted Voting
- Using Dither Consensus as a backend
- Creates Consensus Chains between users to vote on a specific *thing*
- Can be used for copyright reporting, community information addition, data validation, etc.
- Structure:
- Main definition
- Who created it

