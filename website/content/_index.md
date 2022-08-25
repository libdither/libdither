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

## The Core of Dither
Dither is at its core a piece of software that allows applications utilizing it to do two fundamental things:
 - Send data to other computers in a flexibly private manner, where the user can choose how untraceable they want their connection to be (improves on TOR, I2P, and others). [See more](docs/dither/routing/distance-based-routing.html)
 - Host public data in such a way to distribute to burden of hosting over all parties interested in the data, while hiding information about the individual hosts of the data. (improves on IPFS, Bittorrent, and others) [See More](docs/dither/routing/directional-trail-search.html)

In addition to those two things, applications can use 




 allows applications to communicate with other computers in an untraceable manner, and privi

 that allows applications on computers to communicate directly with each other through untraceable tunnels instead of through centralized servers. This can be used very simply for messenger applications, but Dither Core doesn't only provide that. Dither also allows for a Web of Trust. In comparison to services like Google, Discord, Facebook, etc, where you have to rely on them to provide you with valid information and trust them to not misuse the data you give them. With Dither, you are not relying on any one organization, instead you rely on computers you explicitly trust to provide you with services you need. These computers could be run by well-known organizations or your real life friends. And those computers have other computers that *they* trust. Thus creating a Web of Trust allows for the creation of a network where you can find information by going through only the people that you trust instead of corporate middlemen who have control over what you see.

## General Structure

In accordance with the first tenant of Dither, Dither's core is built in small, interdependent modules. These modules have similarities between them, so it is convenient to categorize them into layers.

 - The first layer is the [Transport Layer](docs/dither.html#transport-layer)
   - The modules of this layer provides an API for forming [reliable](https://en.wikipedia.org/wiki/Reliability_(computer_networking)) (or optionally unreliable) unencrypted connections between Dither nodes to facilitate peer-to-peer communication. Existing libraries like [libp2p](https://libp2p.io) or [Pluggable Transports](https://www.pluggabletransports.info/) will most likely be used here.
 - The second layer is the [Service Layer](docs/dither.html#service-layer)
   - This layer contains the modules of various core Dither services such as those providing encryption, anonymous routing, data fetching, account management and others. The modules in this layer may be interdependent on each other.
 - The third layer is the [Application Layer](docs/dither.html#application-layer)
   - This layer contains modules defining the backend APIs for various Dither applications. These APIs may also be interdependent 
 - The fourth layer is [Interface Layer](docs/dither.html#interface-layer)
   - The final layer is the Interface Layer. It provides some method of interacting with the application API to make a usable program. This could be a fancy UI using web technology or a simple command-line interface.

## Roadmap

Currently, Dither is in the simulation phase. Creating decentralized protocols is difficult, and much testing needs to be done to make sure everything works. Various core parts of Dither are being tested in the 
[dither-sim](https://github.com/libdither/dither-sim) and 
[dither-sim-tauri](https://github.com/zyansheep/dither-sim-tauri) repositories.

Once Dither Core moves out of the simulation phase, the first proof-of-concept application will be a chat as outlined in the [Dither Chat application spec](docs/applications/dither-chat.html). In this application, Direct messages will be End-To-End Encrypted and servers can be hosted by a collection of trusted computers. Dither Chat will provide an easy-to-use API that can be used by different UI implementations to support as many platforms as possible.