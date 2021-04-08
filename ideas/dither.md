# The Dither Project

- [The Dither Project](#the-dither-project)
  - [What it is](#what-it-is)
  - [Structure](#structure)
  - [Network Layer](#network-layer)
    - [Distance-Based Routing](#distance-based-routing)
  - [Core Layer](#core-layer)
    - [Data Structuring](#data-structuring)
    - [Trait Typing](#trait-typing)
    - [Reverse Hash Lookup Versioned Binary Tree](#reverse-hash-lookup-versioned-binary-tree)
    - [Example Traits](#example-traits)
    - [User Management](#user-management)
    - [Custom Routing](#custom-routing)
    - [API](#api)
    - [Dither Chain](#dither-chain)
    - [Dither Consensus](#dither-consensus)
    - [WIP - Dither Weighted Voting](#wip---dither-weighted-voting)

## What it is
Dither is a modular application API built on top of [Libp2p](https://github.com/libp2p/rust-libp2p). It aims to provide buliding blocks for Consensus, Data storage, Account Management and more to replace most online services with a decentralized and private alternative. It is much inspired by and takes from many p2p projects such as I2P, Stellar, IPFS, Ethereum, and Monero.

Potential Applications that can be created with Dither:

Chat/Communication Apps, Video Sharing, Social Media, Comment systems, File Syncronization, Encrypted Backup, Voting systems, Exchanges, Crowdfunding, Decentralized VCS, Stores, Serverless Games, Remote Machine Control, etc.

## Structure
 - Network Layer (Provided by libp2p)
   - Handles all the p2p details (NAT traversal, routing, and cryptography)
   - [Distaced-Based Routing protocol](https://github.com/libdither/dbr-sim): Custom onion routing protocol which allows for anonymity on the network and is faster and more flexible compared to random routing (like what TOR and I2P uses)
 - Core Layer
   - Data Structuring (Traits, Self-Defining structs)
   - Dynamic Consensus
   - User Management
 - Application Layer
   - Implements Specific Application structures and behaviors
   - Provides an API for GUI to implement

## Network Layer
### Distance-Based Routing
Nodes are organized in euclidian space using their relative virtual distance to each other. Packets are then routed using these virtual coordinates to create shortest path through the network.

See the [Distance-Based Routing Notebook](https://github.com/zyansheep/routing-research) for in-depth details

## Core Layer

### Data Structuring
 - Dither data will work much like IPFS where data is content-addressed with a multihash
 - Application data structures must start with the multihash of a trait definition.

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

### Dither Chain


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

