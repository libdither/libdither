# Anonymous Analytics

Analytic collection is usually non-respecting of privacy, but it should be possible to create a system of analytics that reveals as little identifying information as possible using information theory and the decentralized nature of Dither.

## Rough Idea

Author specifies what kind of analytics they want and how specific they want. *Analytics must be proportions or averages*. Users manually (or automatically based on settings) pick which fields they want to divulge.
Peers that use a specific application are identified and an agreed upon field is set to be exchanged and averaged by each peer. Each peer checks the other's proof of humanity (see [zero-knowledge-proofs](../dither/zero-knowledge-proofs.md)) and create a new zero-knowledge proof combining the ones of each peer.

This part needs more thought: 

This field combination is done with many different peers until all of a given peer's fields have been combined. Then more averages are produced and a tree of proofs is gradually built. until the top of the tree for each field contains the desired average or proportion which is publically viewable for all users to see.