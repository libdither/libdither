---
title: 'About'
menu:
  main:
    weight: 1
---


> Warning: If you see `www.dither.link` in the address bar, you may be on the centralized site. To browse in a decentralized manner, get the [IPFS Companion](https://github.com/ipfs/ipfs-companion) extension for your browser 
{#warning}

## What Is Dither
Dither is a toolbox to create privacy-respecting decentralized applications capable enough to replace most services on the Internet. This means services with no centralized servers, no single organization control, no censorship, and no surveilance by companies or governments.
  
## Why we need it
The internet has a major problem: it is too centralized. By this I mean that services & software are provided by corporations who only respect their profits and not their users. This comes at odds with the fact that to use their products you have to first trust them with your personal data whatever that might be. Most people are already used to their data being taken and used by companies, but eventually as companies continue toe the line, the line of what people are ok with will move. Dither will give control back to the people about how their software should work and where they want to draw the line with their privacy.

## The Core of Dither
At the Core of Dither is essentially a service that allows applications on computers to communicate directly with each other through encrypted tunnels instead of through centralized servers. This can be used very simply for messenger applications, but Dither Core doesn't only provide that. Dither also allows for a Web of Trust. In comparison to services like Google, Discord, Facebook, etc, where you have to rely on them to provide you with valid information and trust them to not misuse the data you give them. With Dither, you are not relying on any one organization, instead you rely on computers you explicitly trust to provide you with services you need. These computers could be run by well-known organizations or your real life friends. And those computers have other computers that *they* trust. Thus creating a Web of Trust allows for the creation of a network where you can find information by going through only the people that you trust instead of corporate middlemen who have control over what you see.

## General Structure
Dither is built in swappable layers. The first layer is the Transport Layer (for example [libp2p](https://libp2p.io) which allows for different Dither clients to establish direct connections with each other through the TCP or UDP protocols. The next layer is the Dither Service Layer which provides encryption, data storage, account management, packet routing, and many other components that are needed to make fully-fledged internet applications. The layer after that is the Application API Layer. Any application built on Dither should have a standard API so that multiple different methods of user interaction can be implemented for different people's workflows and preferences. This API contains data structure specifications and code written in a systems language (like Rust) for optimal performance. The final layer is the Interface Layer. It provides some method of interacting with the application API to make a usable program. The Interface Layer & API Layer will be combined into one program and should interact with the Dither Service Layer through Inter-Process Communication.


Imagine a new chat app with a standardized backend so that different people could create differently designed apps for effectively the same app functionality. The backend (Application API) would interface with the Dither Service Layer and using Dither's functions, implement a privacy-respecting, performant chat application. This modularity allows people to come along and rewrite the UI, or extend the API, or Dither itself! Which is extremely valuable because it allows for people to experiment and to selectively design end-user-applcations suited to their needs. For example, if one project was working on a Dither Chat App for android and they wanted to add a specific feature, they could extend their own version of the Application API and contribute it to other projects who use the same API for them to implement the feature if they wanted to.

## Core Tenets
*Dither should be as modular as possible.*

*Dither protocols and formats should be interoperable with existing protocols and formats to make transition to Dither as easy as possible.*

*Dither should rely on itself as much as possible.*

Dither's Core tenets can be found in full [here](docs/spec/dither.md#core-tenants')

## Roadmap

Currently, Dither is in the simulation phase. Various core parts of Dither are being tested in the 
[dither-sim](https://github.com/libdither/dither-sim) repository.

Once Dither Core moves out of the simulation phase, the very first thing I want to do with it is to create an application that can replace Discord called Dither Chat. In this application, Direct messages will be End-To-End Encrypted and servers can be hosted by a collection of trusted computers. Dither Chat will provide an easy-to-use API that can be used by different UI implementations to support as many platforms as possible.