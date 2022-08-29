# The Dither Project

- [The Dither Project](#the-dither-project)
  - [What is it?](#what-is-it)
  - [A Plan for the Future of the Internet](#a-plan-for-the-future-of-the-internet)
- [Core Tenets](#core-tenets)
- [Structure](#structure)
  - [Transport Layer](#transport-layer)
  - [Service Layer](#service-layer)
  - [Application Layer](#application-layer)
  - [Interface Layer](#interface-layer)
- [Other Links](#other-links)
    - [Inspirations for Dither](#inspirations-for-dither)

## What is it?

Dither is a project with the goal of decentralizing the internet. It is a toolbox of various tools application developers can use to communicate privately, host data, manage accounts much more. It is currently being developed by [@Zyansheep](https://github.com/zyansheep) and temporarily hosted via GitHub under the [libdither](https://github.com/libdither) organization.

## A Plan for the Future of the Internet

The plan behind Dither is to create an modern internet unencumbered by any kind of central control. To accomplish this, Dither must somehow replace existing apps and services *by outcompeting them*. This is an incredibly monumental task, but there are some things that may help in Dither's favor.

 - **No Hosting Costs** — Being decentralized means the users host everything. If we can create a system to make it as painless as possible to host data, that would be ideal.
 - **Redesigning Everything is Sometimes Good** — If applications using Dither are fundamentally better designed than the alternative and it is easy to switch, users will be more likely to use them.
 - **No Intellectual Property** — Intellectual property protections do not apply to the core of Dither since it is a peer-to-peer network. This means that new platforms can be immediately populated with any existing content people might want to watch. Note: Precautions should be taken to make sure creators have a say in if they want their content to be shown on mainstream applications using the protocol to prevent public backlash.
 - **Standardization** — Dither's ecosystem of APIs will all be compatible with each other which will infinitely improve the experience of the user. (Imagine being able to use a Discord-like chat room or a Reddit-like comment system underneath a YouTube video, or really any kind of system you want. It's all modular!).
 - **Natural Incentives** — Similar to Brave browser's tipping system, If applications built on Dither have good incentive systems for content creation that extends to existing content, then creators whose content is uploaded to the network will automatically accrue income that will then be an incentive for them to claim their money and create an account. Unlike Brave, there won't be any KYC requirements :).

*The aim for Dither is to replace existing centralized applications with decentralized alternatives that are unified through their use of a singular, modular protocol.*

See the [application document](applications.md) for outlines of various applications that could be built using Dither.

# Core Tenets
It seems necessary for projects to have guidelines so that everyone may be on the same page. These are the ones I've chosen for now, as with everything, they are subject to change.

**Dither should be as modular as possible.**
 - Reasoning: There should be no part of Dither that is difficult to replace with a different implementation and people should be able to pick and choose which parts they want.

**Dither protocols, formats, and communities should be as interoperable as possible with existing protocols, formats, and communities**
 - Reasoning: To grow Dither's userbase, It should be as easy as possible to transition to Dither from other services.
 - One example of this would be allowing someone to pull comments from Reddit / Youtube into [Dithca](applications/dithca.md) and hosting them in a decentralized manner.
 - Another example might be [Dithca](applications/dithca.md) storing Reddit credentials and being able to optionally interact with comment threads pulled from centralized websites.

**Dither should rely on itself as much as possible for every aspect of development and usage.**
 - Reasoning: It feels natural for a program to use itself if possible. Rust is written in itself, GitLabs is hosted using GitLabs, etc.
 - Code Versioning, Storage, Building, Distribution, and Social communication should all run through Dither applications if it won't compromise development too much.

# Structure

Following the first tenet of Dither, in the future the lines between these layers will blur and everything will be a module. However, the design of current operating systems don't easily allow for shared code and data, requiring a more formal structure. In the future this layered structure will be replaced with a more [flexible system](dither/structure.md).

## Transport Layer
The transport layer is the part of Dither that deals with creating peer-to-peer connections with other computers running Dither.
Currenly in the dither-sim program, this is implemented via a simple TCP stream. In the future this layer will be implemented using existing libraries such as [libp2p transports](https://libp2p.io/implementations/#transports), [Pluggable Transports](https://www.pluggabletransports.info/transports/), something else, or some amalgamation of all three. The idea behind this layer is to provide as many methods of communication as feasibly possible.

## Service Layer

The service layer provides all functionality related to [routing](dither/routing/distance-based-routing.md), encryption, [data storage](dither/routing/directional-trail-search.md), [user management](dither/data/user-management.md) and everything else. Each of these services are split up into separate modules each of which runs its own processes and communicates with other services through inter-process communication. 

All these processes are managed as child processes under one "main process". The main process contains the Transport Layer implementation, the routing protocol API and APIs for managing the child services as well as managing inter-process communication between child processes.

## Application Layer

The application layer contains services just like the service layer that are registered under the main process. These registered service's APIs can be used by other applications. 

The application layer also refers to the application's core API, which is used by the interface layer. This "core application API" can be built into the applicaiton's executable, or it can run as a service under the main process and used by multiple interfaces. This is left up to the application developers. Applications with multiple interfaces should prefer to register application APIs under the main process.

Existing planned applications may be found [here](applications.md).

## Interface Layer

The final layer is the interface layer. This just refers to standalone applications that provide some kind of interface to the user using the services running under Dither.

These interfaces can be implemented however, but it is recommended for them to follow Dither's [application design philosophy](dither/application-design-philosophy.md) for some level of standardization.

# Other Links

### [Inspirations for Dither](dither/inspirations.md)

Dither as with any creative endeavor takes inspiration from many other projects. This is a list of what parts of Dither have been inspired from other projects.