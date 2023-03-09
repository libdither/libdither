# Modular Consensus (WIP)

## What is it
Modular Consensus is a tool that creates a framework for creating any configuration of common consensus algorithms for specific applications.

## What does it do?

Modular Consensus allows you to create custom consensus configurations using linked blockchain or directed acyclic graphs with most(?) kinds of proof algorithm (Proof of Work, Proof of Stake, Etc.).

## How does it specifically work?

Modular consensus uses a specific hashtype to define the main characteritics and configuration of a consensus algorithm (onboarding method, consensus algorithm, data to be agreed upon).

Consensus algorithms can make use of the built-in validation system for [hashtypes](../data/hashtypes/hashtypes.md) to verify blocks.

## Implementation

A type must extend the, `ConsensusPoint` type which will become valid as the starting point for consensus. The `ConsensusPoint` type defines many things:

[This Section is Work-In-Progress]

`ConsensusPoint`:
 - `consensus_type`: `ConsensusType`
 - `object`: `Link<Trait>` - Object to be agreed upon
 - ``

