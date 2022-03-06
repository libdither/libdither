# Reverse Hash Lookup (WIP)

Allows for finding what structures link to a given structure.

Example: Someone can find a comment that links to a post, just given the hash of the post.

# IDEAS TO ADD
Keep track of the number of child nodes for each node in the tree so you can merge reverse hash lookup trees easily in a peer-to-peer fashion which means consensus can be less rigourous.

## General Structure

A binary hash-linked search tree stored in a decentralized fashion with [DTS](../routing/directional-trail-search.md) that maps a given hash to object that contains that hash. Hashes are agreed upon in a decentralized manner, but direct consensus is assured, and a pubsub system helps speed up consensus for high-activity hashes.

## Specific Structure

### Tree
 - The goal for this tree is for nodes to contain as little information as possible so that large portions of the tree can be sent at once.
 - A Binary Tree contains `Branch`es and `Node`s. For this structure, each one will be its own self-defining structure. Each node will contain
 - Binary Tree, contains

### Traits

 - `Node<T, L>` - Nodes of the tree
   - `subnodes: List<T, L>` - subnodes of this node
 - `Leaf` - 

 - This is a system by which one can find structures that link to a given hash implementing the reverse trait.
 - If there is some pieces of data that links from or adds useful defintions to a given piece of data, this is the place for it. One example of this in practice might be having a comment thread. Each comment is its own Hashstruct that contains the hash of the post or a replying comment. In order for someone who has the post structure to find the comments, they would need find all the pieces of data linking to this piece of data (i.e. a Reverse Hash Lookup)
 - To implement this system, there will be a partial binary tree represented by a DAG that can be traversed using the data of the target. (i.e. the post structure's hash). Then the tree can be traversed down using consecutive trail searches. Until a list of all known linked hashes is found. These structures must contain a specific trait called a RevHash to be able to be validated onto the distributed tree. The addition of new links to this tree is done through an implementation of Dither Chain Consensus (see the [#Dither Consensus Chains](#dither-consensus-chains) section).