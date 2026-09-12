---
title: 'About'
menu:
  main:
    weight: 1
---

## What Is Dither?
Dither is an open source toolbox for creating privacy-respecting decentralized applications capable enough to replace most centralized services on the Internet. Dither will allow for any programmer to develop applications with no central points of failure, no single organization control, no censorship, and no surveillance by companies or governments.

## Why we need it
The Internet has a major problem: it is too centralized. Vast swaths of services depend on just a few companies to keep everything running smoothly. This creates centralized points of failure for the internet, and when those points go down or get hacked, mayhem ensues. This is an especially concerning problem when these services collect so much information about our lives. Our personal data is stored in giant datacenters, subject to the whims of companies, governments, and circumstance. Dither aims to change this by making it easy for users to control their own data.

## Core Tenets
These are some work-in-progress principles for how Dither and its communities should be designed:

*Dither should be as modular as possible.*

*Dither protocols, formats, and communities should be as interoperable as possible with existing protocols, formats, and communities.*

*Dither should rely on itself as much as possible.*

More details on Dither's Core Tenets can be found [here](docs/dither.html#core-design-tenets).

## The Core Services of Dither
Dither is at its core a piece of software that allows applications built on top of it to do a few fundamental things:
 - Send data to other computers in a flexibly private manner, where the user can choose how untraceable they want their connection to be (improves on TOR, I2P, and others). [See more](docs/dither/02-routing.html)
 - Host public data in such a way that the burden of hosting is distributed over all parties interested in the data, while hiding information about the individual hosts and users of the data (improves on IPFS, BitTorrent, and others). [See more](docs/dither/directional-trail-search.html)

In addition to these two primary services, applications can use various other services (identity, consensus, storage) to create a cohesive decentralized, private, and trustless internet.

## The Language: Disp
A decentralized internet needs more than a way to move data around, it needs a way to share *programs*: to send someone code and have their computer verify what it does before running it, without having to trust whoever wrote it. No existing language is really designed for this, so Dither is getting its own.

[Disp](docs/disp/disp.html) is a programming language where programs are stored as data structures instead of text, identified by hash instead of name, and checked by a type system that is itself a program written in the language. This is where most of my work is going at the moment. There is a [working prototype](https://github.com/libdither/disp).

## General Structure
In accordance with the first tenet of Dither, Dither is built in small, interdependent modules: a core process that manages networking and sandboxing, a swarm of services providing things like routing, storage, and identity, and lightweight user interfaces on top. More details can be found in the [docs](docs/dither.html#structure).

## Roadmap
Creating decentralized protocols is difficult, and most of Dither currently lives in [design documents](docs/dither.html) that are slowly being refined. Most active work right now is on Disp, since much of the rest of the system wants to be built with it. The networking protocols (like [anonymous routing](docs/dither/02-routing.html)) will be tested in simulation before being let loose on real networks.

Once the core parts are usable, the first proof-of-concept application will be a chat app as outlined in the [Dither Chat application spec](docs/applications/dither-chat.html).

## Community
It is just me working on this project for now and it will probably stay that way until I can finish the core parts of Dither. Nevertheless, I am open to conversation, critique, and contributions on GitHub and Dither's [Matrix Space](https://matrix.to/#/#dither:matrix.org). Come stop by and say hi!
