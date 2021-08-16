# Dither Consensus (WIP)

## What is it
Dither's consensus is a tool that allows for any configuration of *any possible consensus algorithm* that comes to an agreement from a predetermined set of computers.

## What does it do?

Dither Consensus allows you to create linked data (blockchain or directed acyclic graphs) using the built-in validation system for [Self-defining structures](./self-defining-structures.md) and the consensus protocol that is preferred by the data structure.

All consensus algorithms are on the table, but the default for most applications would be Federated Byzantine Voting. (Same as the Stellar and Ripple cryptocurrency)

Consensus will be needed for the Reverse Hash Lookup system as well as generally for agreed-upon aggregations of data (i.e. caching the hashes of the top comments in a comment section).

## Implementation
Any self-defining structure containing the Trait, `ConsensusPoint` will be valid as a starting point for consensus. The `ConsensusPoint` trait defines many things:

`ConsensusPoint`:
 - `consensus_type`: `ConsensusType`
 - `object`: `Link<Trait>` - Object to be agreed upon
 - ``