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

*Dither protocols, formats, and communities should be as interoperable as possible with existing protocols, formats, and communities*

*Dither should rely on itself as much as possible.*

More details on Dither's Core Tenets can be found [here](docs/dither.html#core-tenants)

## The Core Services of Dither
Dither is at its core a piece of software that allows applications built on top of it to do a few funamdental things:
 - Send data to other computers in a flexibly private manner, where the user can choose how untraceable they want their connection to be (improves on TOR, I2P, and others). [See more](docs/dither/routing/distance-based-routing.html)
 - Host public data in such a way to distribute to burden of hosting over all parties interested in the data, while hiding information about the individual hosts and users of the data. (improves on IPFS, Bittorrent, and others) [See More](docs/dither/routing/directional-trail-search.html)

In addition to these two primary services, applications can use various other services to create a cohesive decentralized, private, and trustless internet. 

## General Structure

In accordance with the first tenant of Dither, Dither's core is built in small, interdependent modules. However, to make these modules as sandboxed as possible, interactions with the system and the user will not be run as Dither modules for the time being.

 - The main part of Dither is the [Core Process](docs/dither.html#core-process)
   - This is what you need to download to use Dither on any device and it has two functions: It manages all the other services running under Dither, and it manages communication with other computers using whatever installed network device it can find on the computer it is installed on.
   - For the communication part, it provides an API for other services to create [reliable](https://en.wikipedia.org/wiki/Reliability_(computer_networking)) (or optionally unreliable) unencrypted connections between Dither nodes to facilitate peer-to-peer communication. Existing libraries like [libp2p](https://libp2p.io) or [Pluggable Transports](https://www.pluggabletransports.info/) will most likely be used here.
   - There is also an API for registering a new service with the Core Process and for establishing API connections between them.
 - The second part is the [Service Swarm](docs/dither.html#service-swarm)
   - This part contains the various core services such as those providing encryption, anonymous routing, data fetching, account management and others as well as those providing specific application APIs for specific UI applications on the system.
 - The third part is the [User Interface](docs/dither.html#user-interface)
   - This part manages creating a user interface as a "frontend" for a service running in the Service Swarm. An interface could be anything from a fancy UI using web technology or a simple command-line interface. Ideally, these frontend programs should be very small because all the complicated computing is done by the backend.

## Roadmap

Currently, Dither is in the simulation phase. Creating decentralized protocols is difficult, and much testing needs to be done to make sure everything works. Simulations of dither will done in the [libdither](https://github.com/libdither/libdither) repository using the [shadow network simulator](https://shadow.github.io/) for its ability to do reproducible tests on production binaries.

Once Dither moves out of the simulation phase, the first proof-of-concept application will be a chat app as outlined in the [Dither Chat application spec](docs/applications/dither-chat.html).

## Community

It is just me working on this project for now and it will probably stay that way until I can finish the core parts of Dither. Nevertheless, I am open to conversation, critique, and contributions on GitHub and Dither's [Matrix Space](https://matrix.to/#/#dither:matrix.org). Come stop by and say hi!