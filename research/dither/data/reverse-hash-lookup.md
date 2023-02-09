# Reverse Hash Lookup (WIP)

Directed Acyclic Graph data structures (DAGs) may be elegant for storing and linking pieces of data, but they don't provide any kind of mutability on their own. This is the purpose of the Reverse Hash Lookup (RHL). RHL allows you to create a piece of data that links to two or more other pieces of data (via hash-linking) *and then lookup the link given one of the linked pieces of data*.

## Structure

RHL has many different ways to solve the two problems of distributing links and finding links. (Links here being pieces of data containing the hash of some other object that is being "linked to"). Links could be shared only with friends or trusted individuals, links could be broadcast all over the network and re-stored by other nodes, links could be stored in blockchains or link maps maintained by centralized servers, etc. All these different use-cases may be useful for different applications, so RHL tries to generalize over all possible use-cases.


Ideas:
 - A Link defines its own methods of distribution and search. (Perhaps embedded as a hashtype).

### Methods of Distribution & Search

 - A link can be broadcast to some set of trusted nodes (friend group), queries are done by asking friends if they have registered any links to an object.
 - A link can be registered in some sort of global consensus
   - Central server(s) store any links that are uploaded and respond to queries
   - Blockchain storing links (all "full" nodes store all links), queries done locally
   - Global Binary Tree mapping hashes to links (less space, more network activity when searching)
 - A link can be broadcast via a publish-subscribe system and exist ephemerally, find beliefs by constantly listening on a topic (or to the entire network).

## Potential Applications

This kinda of system is useful as a basis for other systems that need to link disparate pieces of data together for the purposes of querying or consensus. Here are just a few examples of the systems that RHL could enable:

 - [Comment systems](../../applications/dithca.md). Each comment is a piece of data signed by some individual. Links can created over the comments that allow for querying some subset of all the comments, i.e. `top comments` or `set of all comments` or `comments from friends`. These links themselves may be immutable, but can be joined together via other links in a chain where the newest link in the chain is the most up-to-date view of the comment system.
 - [Web of Beliefs](../../applications/web-of-beliefs.md). A justification / rule links two beliefs together and beliefs may be private or publicly shared and distributed. Beliefs justified by some rule sets may be more propagated than others (i.e. scientific beliefs). Or beliefs can be accepted or rejected based on arbitrary social conditions like "what proportion of my friends hold belief x?" (Such as is the case with names). Multiple conflicting beliefs can be held at once, such as if it is not clear which one should be accepted as default (or there are uses for both beliefs in different context, such as with definitions).
 - [Anonymous Interactions](zero-knowledge-proofs.md#example-trusted-user-distributed-anonymous-count). Links could be generated ephemerally to prove that a public key in some trusted set of public keys interacted with a piece of content in some manner, and then added to some hyperloglog or statistical counter.


## Specification Ideas

Disp type `Link<Type>` is implemented for whatever hash type is used in the specific link needed. i.e.

For a link to be type-valid, the objects it links to must also be the correct type. Zero-knowledge proofs could be used for this application in the future to avoid unnecessary fetching.

```
struct Link<T: Type> {
  hash: Multihash,
  valid_link: (fetch(hash) : T)
}
```