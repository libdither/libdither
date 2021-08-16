# The Dither Project

- [The Dither Project](#the-dither-project)
- [What is it?](#what-is-it)
- [Core Tenants](#core-tenants)
- [Structure](#structure)
- [Network Layer](#network-layer)
  - [Distance-Based Routing](#distance-based-routing)
    - [Custom Routing](#custom-routing)
- [Core Layer](#core-layer)
  - [Data Structuring (Hashtraits)](#data-structuring-hashtraits)
    - [Self-Defining Structures](#self-defining-structures)
    - [Defining External Structures](#defining-external-structures)
    - [Example Traits](#example-traits)
  - [Locating Data (Directional Trail Search)](#locating-data-directional-trail-search)
  - [Finding Data Links (Reverse Hash Lookup)](#finding-data-links-reverse-hash-lookup)
  - [User Definitions](#user-definitions)
  - [User Management](#user-management)
  - [Dither Chain References](#dither-chain-references)
  - [Dither Consensus Chains](#dither-consensus-chains)
  - [WIP - Dither Weighted Voting](#wip---dither-weighted-voting)

# What is it?
Dither is a modular application API built on top of [Libp2p](https://github.com/libp2p/rust-libp2p). It aims to provide buliding blocks for Consensus, Communication, Data Storage, Account Management, and more to replace most online services with a decentralized and private alternative. It aims to be compatible for extracting data from and interfacing with most existing decentralized and centralized systems such as IPFS, Github, Reddit, Youtube, Sci-Hub, Odysee & Discord.
*The aim for Dither is to replace these applications with decentralized alternatives that are unified through their use of a singular, modular protocol.*

It is much inspired by and takes from various projects such as Rust, TOR, Bittorrent, IPFS, IPLD, Stellar, Ethereum, IOTA, Monero, zk-STARKS, and more.

Potential Decentralized Applications that can be created with Dither:

Chat/Communication Apps, Video Sharing, Social Media, Comment systems, File Syncronization, Encrypted Backup, Voting systems, Exchanges, Crowdfunding, VCS, Stores, Serverless Games, Remote Machine Control, etc.
The goal of Dither is to be able to recreate any kind of application in a decentralized manner.

# Core Tenants
These are the Core Tenants of Dither that the project will strive for.

**Dither should be as modular as possible.**
 - There should be no part of Dither that is hard to replace with a different implementation.

**Dither protocols and formats should be able to interoperate with most other protocols and formats.**
 - One example of this would be allowing someone to pull comments from Reddit / Youtube into Dithca and hosting them in a decentralized manner.
 - Another example might be Dithca storing Reddit / Youtube credentials and being able to optionally interact with comment threads pulled from centralized websites.

**Dither should rely on itself as much as possible for every aspect of development and usage.**
 - Code Versioning, Storage, Building, Distribution, and Communication should all run through Dither as much as possible.


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
   - Guis may be built on top of the APIs

# Network Layer
## Distance-Based Routing

The way data travels on Dither is through a comprehensive Routing Protocol called Distance-Based Routing (DBR). The goal of DBR is to provide methods to easily create custom routing paths that can be used for traffic obfuscation, while not compromising substantial speed like TOR. DBR allows users to use onion routing and garlic routing optionally based on predefined conditions. (e.g. direct connect with your friend with exposing your IP to them but using onion routing when connecting with unknown parties).

To accomplish this DBR has many parts:

 - Network Self-Organization
 - Coordinate Calculation
 - Data & Bandwidth Tracking
 - Network Packet Traversal
 - Configurable Secure Routing Protocol

The first thing a Dither full node does when starting is to find it's closest nodes. It accomplishes this by recursively asking new nodes that it connects to for pings from their peers. Through this process a network can organize itself into local connections.

![Network Structure for Dither Server](resources/self-organization.gif)

Nodes are organized in euclidian space using their relative virtual distance to each other. Packets are then routed using these virtual coordinates to create shortest path through the network.

See the [Distance-Based Routing Notebook](https://github.com/zyansheep/routing-research) for in-depth details

### Custom Routing
- “Router groups” - create a group of peers who forward incoming packets and outgoing packets through each other, making it difficult to know for sure if a packet is going to a specific user
  - Different modes have different speed
    - Speed - routes packets according to how fast they will leave the group
    - 
    - Random- connections are routed randomly to different peers.
    - Periodic (most secure, least speed, lots of data sent) - all peers send packets of random data, size (optional) at set intervals (specifiable) to random (or all) other peers. If a peer has data to send, they will send the encrypted data instead of the random data.


# Core Layer

## Data Structuring (Hashtraits)
 - Dither data will work much like IPFS where data is content-addressed with a multihash
 - Application data structures must start with the multihash of a trait definition.
 - The trait tree defines layout of the data structure

### Self-Defining Structures
 - Because Modularity and Future-proofing are important, Dither uses a system of self-defining structures where structures link to their own format and provide information on how they are to be used.
 - Traits are the type system for Dither. They prescibe meaning to data.
 - Trait definitions define how a data structure should be layed out and what requirements it has for validity.
 - An Example of a trait might be anything from being a "Video" to being a "Comment" or even a "Transaction".
 - This extensible trait system allows for any kind of representation of data and is a self-describing data structure such that no matter what structure someone has, it will be able to be parsed and validated.
 - More Info in the [Self-Defining Structure Document](dither/self-defining-structures.md)

### Defining External Structures
In Dither, while pieces of data can be located and linked with multihashes, not all pieces of data contain multihashes. Any external hash-linked data structure that you want to host on Dither (i.e. blockchains) aren't going to be natively supported. Instead all the blocks of data must either be re-linked to form a multihash-supporting copy or the hash types have to be inferred by context. (The downside of the second option non-hashtrait blocks can't easily be inferred from non-specific programs interpreting hashtraits). The second option is what IPFS/IPLD is doing, reinterpreting hashed blocks of data of arbitrary format by defining a standard table of formats. Dither prefers the first option of wrapping the entire data structure with trait definitions that Dither can understand.

What IPLD does is it uses an addition to Multihash called CID (Content Identifier). This CID contains both the multihash and a number for the Multiformats table that must be standardly designed.

The problem with IPLD is that this [standard table of formats](https://github.com/multiformats/multicodec/blob/master/table.csv) is subject to change. Formats are not universal and if you want to identify custom formats not in the table, you are out of luck if you want to communicate your custom formats to existing IPFS applications

With Dither, instead of having a hard standard list of formats, Formats of data are defined by the data itself using the hashtrait format. Data that is not trait-defined, will be either wrapped using a definition trait (i.e. a structure just containing a hash of the data and trait). Or it will be reinterpreted to be represented natively as a trait structure.

### Example Traits
Traits can define any data structure and its state of being "Valid". 
A Monero Transaction might look something like this after being structured in Dither.
 - `"Transaction" (With localization fields)`
   - `previous_transaction: SelfRef`
   - `definintion: Multihash (Default Trait Definition)`
   - `source: List<MultiKey>`
   - `destination: Multikey`
   - `pederson_commitment: PedersonCommitment`
   - `signature: RingSignature`

## Locating Data (Directional Trail Search)
Content needs to be able to be located on the network. Traditionally this is done through a Distributed Hash Table (i.e. Kademlia)  that maps content hashes to peers on the network that host data corresponding to the hashes. In constrast, Directional Trail Searching (DTS) is inspired the Pheromone Trails left by Ants. Whenever a specific hash is requested, a broadcast of searcher packets is sent in all directions in the network. As they travel from node to node, each node checks the hash against a binary tree that stores the direction for the searching packet to travel in and the approximate distance. A node can either choose to adjust the trajectory of the packet or forward it onwards on it's existing trajectory. Eventually a searching packet will find a "Trail" or a "Hole" by chance and will be guided to the node hosting the hash's data.
A Hole is formed around a node broadcasting itself to be hosting a given piece of data to nearby nodes.
A Trail is formed by a searching packet configured to leave a trail on it's way back to the device who originally sent out the packet.
Trail and Hole forming is optional and is at the discretion of the data hoster(s) and intermediate nodes.

Nodes looking for specific data corresponding to a hash can broadcast a content request packet which traverses through the network until it either encounters a hole, trail, or exceeds the search radius.
If none of the packets traveling across the network fall into a hole or encounter a trail (because there weren't enough packets or not enough holes) a traditional DHT lookup can be performed if supported by hosters. 

DTS is much faster and more effective than a DHT because DHT data hosting is distributed randomly across the network meaning that you might have to traverse back and forth across the internet to find someone hosting the data you need.

More Info in the [Directional Trail Search](dither/directional-trail-search.md) Document.

## Finding Data Links (Reverse Hash Lookup)
 - This solves the problem of having a hash and wanting to find pieces of data that link to that hash. This is super useful for comment systems and the like.
 - This is a system by which one can find structures that link to a given hash implementing the reverse trait.
 - If there is some pieces of data that links from or adds useful defintions to a given piece of data, this is the place for it. One example of this in practice might be having a comment thread. Each comment is its own Hashstruct that contains the hash of the post or a replying comment. In order for someone who has the post structure to find the comments, they would need find all the pieces of data linking to this piece of data (i.e. a Reverse Hash Lookup)
 - To implement this system, there will be a partial binary tree represented by a DAG that can be traversed using the data of the target. (i.e. the post structure's hash). Then the tree can be traversed down using consecutive trail searches. Until a list of all known linked hashes is found. These structures must contain a specific trait called a RevHash to be able to be validated onto the distributed tree. The addition of new links to this tree is done through an implementation of Dither Chain Consensus (see the [#Dither Consensus Chains](#dither-consensus-chains) section).

## User Definitions

- Permissioned Definitions
- A user will have multiple definitions of itself with varying levels of permission and transparency. This structure is used for setting user configuration
- Public Definition - Defines a user to the world
- The hash of this object defines this user to the network. It can be requested from anyone on the network and defines multiple things:
- Previous Hash (Optional) - In case you need to update the public config (which is necessary to change your name or add new devices)
- Data - public information about this user including Name, website, and other information the user wants to be public.
- Trusted Definition - Information which is accessible on request
- Routing Ideas
- Overlay network that routes through 2 peers on the way. (Need to form some kind of decentralized routing table) - Would create tor-likeness privacy. Depending on how it is implemented, it would be hard to trace packets

## User Management

See [User Api Document](./dither/user-api.md)

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

