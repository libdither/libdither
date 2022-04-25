# The Dither Project

- [The Dither Project](#the-dither-project)
- [What is it?](#what-is-it)
  - [No, but really, What is it?](#no-but-really-what-is-it)
  - [What's this about replacing the Internet?](#whats-this-about-replacing-the-internet)
  - [Potential Applications:](#potential-applications)
- [Core Tenets](#core-tenets)
- [Structure](#structure)
  - [Finding Data Links (Reverse Hash Lookup)](#finding-data-links-reverse-hash-lookup)
  - [Dither Chain References](#dither-chain-references)
  - [Dither Consensus Chains](#dither-consensus-chains)
  - [WIP - Dither Weighted Voting](#wip---dither-weighted-voting)
  - [Inspiration](#inspiration)

# What is it?

Dither is a project that aims to decentralize the internet! It is a toolbox of various tools application developers can use to store data, manage accounts, and communicate across the internet in a private manner.

## No, but really, What is it?
Dither is a modular application API built on top of [Libp2p](https://github.com/libp2p/rust-libp2p). It aims to provide buliding blocks for communication, data storage, account management, consensus and more to replace most online services with a decentralized and private alternatives.

## What's this about replacing the Internet?

Dither aims to replace most existing apps and services, however, some services are hard to replace without significant disruption because of their existing user and content base. To solve this, Dither will be able to act as a kind of interface with various services, pulling data from multiple sites and presenting it in a standardized way.

It aims to be compatible for extracting data from and interfacing with most existing decentralized and centralized systems such as IPFS, Github, Reddit, Youtube, Sci-Hub, Odysee & Discord.
*The aim for Dither is to replace these applications with decentralized alternatives that are unified through their use of a singular, modular protocol.*

## Potential Applications:

Chat/Communication Apps, Video Sharing, Social Media, Comment systems, File Synchronization, Encrypted Backup, Voting systems, Exchanges, Crowdfunding, VCS, Stores, Serverless Games, Remote Machine Control, etc.

The goal of Dither is to be able to recreate any kind of application in a decentralized manner.

See the [application document](applications.md) for Work In Progress ideas for various applications.

# Core Tenets
All projects need a direction, and these are the ones I've chosen. (As with everything, they are subject to change.)

**Dither should be as modular as possible.**
 - There should be no part of Dither that is hard to replace with a different implementation.

**Dither protocols and formats should be able to interoperate with most other protocols and formats.**
 - One example of this would be allowing someone to pull comments from Reddit / Youtube into [Dithca](applications/dithca.md) and hosting them in a decentralized manner.
 - Another example might be [Dithca](applications/dithca.md) storing Reddit credentials and being able to optionally interact with comment threads pulled from centralized websites.

**Dither should rely on itself as much as possible for every aspect of development and usage.**
 - Code Versioning, Storage, Building, Distribution, and Communication should all run through Dither as much as possible.

# Structure

Dither is structured in layers:

 - Network Layer (Provider Agnostic)
   - Handles peer-to-peer connections (NAT Traversal, Muxing, MDNS Discovery).
	   - See [libp2p.io](https://libp2p.io) for an example of the types of features this will have
	   - Real implementation still WIP
 - Core Layer
   - Routing Module
     - [Distance-Based Routing](https://github.com/libdither/dbr-sim): Custom onion routing protocol which allows for anonymity on the network and is faster and more flexible compared to random routing (like what TOR and I2P uses)
   - Encryption
     - Using [multikey](dither/encryption/multikey.md) for asymmetric encryption or [decentralized kerberos](dither/encryption/decentralized-kerberos.md) for solely symmetric encryption.
   - Data Structuring & Manipulation ([Hashtypes](dither/data/hashtypes/hashtypes.md))
   - Data Searching ([Directional Trail Search](dither/routing/directional-trail-search.md))
   - Data Linking ([Reverse Hash Lookup](dither/data/reverse-hash-lookup.md))
   - Consensus Algorithms ([Distance Aware Consensus](dither/consensus/distance-aware-consensus.md))
   - User Sync & Authentication ([User Management](dither/data/user-management.md))
 - Application Layer
   - Uses some or all of Dither's features to create an application API
   - There is a list of [potential applications](applications.md) for dither and various work-in-progress API definitions.
 - UI Layer
   - This is the actual UI and design portion of applications. It takes the functions provided by the Application Layer and implements them according to the creator's desires.
   - It is highly recommended to follow Dither's [application design philosophy](dither/application-design-philosophy.md) when designing UI apps.

More Info in the [Directional Trail Search](dither/routing/directional-trail-search.md) Document.

## Finding Data Links (Reverse Hash Lookup)
 - This solves the problem of having a hash and wanting to find pieces of data that link to that hash. This is super useful for comment systems and the like.
 - This is a system by which one can find structures that link to a given hash implementing the reverse trait.
 - If there is some pieces of data that links from or adds useful definitions to a given piece of data, this is the place for it. One example of this in practice might be having a comment thread. Each comment is its own Hashtype that contains the hash of the post or a replying comment. In order for someone who has the post structure to find the comments, they would need find all the pieces of data linking to this piece of data (i.e. a Reverse Hash Lookup)
 - To implement this system, there will be a partial binary tree represented by a DAG that can be traversed using the data of the target. (i.e. the post structure's hash). Then the tree can be traversed down using consecutive trail searches. Until a list of all known linked hashes is found. These structures must contain a specific trait called a RevHash to be able to be validated onto the distributed tree. The addition of new links to this tree is done through an implementation of Dither Chain Consensus (see the [#Dither Consensus Chains](#dither-consensus-chains) section).

See [User Api Document](dither/data/user-management.md)

## Dither Chain References
Ideas for Dither Consensus
 - IOTA Tangle
 - Stellar Consensus Protocol
 - zk-STARKS (for privacy)
 - Layered on top of Dither Gravity Tree Search for storage

## Dither Consensus Chains
- Regular Chains
  - A chain is created just by linking to one or more other Hashtypes (fundamental format of Dither objects)
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

## Inspiration

It is much inspired by and takes from various projects such as Rust, TOR, Bittorrent, IPFS, IPLD, Stellar, Ethereum, IOTA, Monero, zk-STARKS, and more.