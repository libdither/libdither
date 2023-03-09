# Eventual Consensus

## What?

Eventual Consensus is not quite what it sounds like. It is consensus in a network that is lazy. This is useful for public information spreading where not everyone has to have the information in a timely fasion.

## Why?

For consensus applications that don't have a timeline (blockchains and directed acyclic graphs) this method of consensus is useful because it lets nodes kinda do their own thing if they aren't interested in what is being spread around the network in a given moment. For example if you have a public message board, you need only to notify users that care about the message board and want to see new messages. Those users can propagate the new messages around to other requesters if needed.

## But why is this useful in Dither?

The [Reverse Hash Lookup](../data/reverse-hash-lookup.md) system will benefit immensely from this kind of consensus. Reverse hash lookup 

## General Structure

Its pretty much just a pubsub algorithm that aggregates posts into lookup trees like Reverse hash lookup's object tree.