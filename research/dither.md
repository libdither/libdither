# The Dither Project

- [The Dither Project](#the-dither-project)
  - [What is it?](#what-is-it)
- [Core Design Tenets](#core-design-tenets)
- [Structure](#structure)
  - [Core Process](#core-process)
  - [Service Swarm](#service-swarm)
  - [User Interface](#user-interface)
  - [Interface Layer](#interface-layer)
- [Other Links](#other-links)
    - [Inspirations for Dither](#inspirations-for-dither)

## What is it?

Dither is a project with the ultimate goal of creating a decentralized and privacy-respecting Internet. It is a repository of libraries, tools, ideas, and applications that allow people to communicate privately, distribute data, manage accounts, much more. It is currently being developed by [@Zyansheep](https://github.com/zyansheep) and (for the time being) hosted via GitHub under the [libdither](https://github.com/libdither) organization.

*The aim for Dither is to replace existing centralized applications with decentralized alternatives that are unified through their use of a singular, modular protocol.*

See the [application document](applications.md) for outlines of various applications that could be built using Dither.

# Core Design Tenets
It seems helpful for projects to have guidelines to help aid design and collaboration. These are the ones I've chosen for now, as with everything, they are subject to change.

**Dither should be useful**
 - Dither is a project. Projects should be useful.
 - This one probably doesn't even need to be said, but it is always important while thinking about design, to keep in mind that you eventually want to create something useful.

**Dither should be modular and modelable**
 - Once you build something, it often gets harder and harder to add features to it unless it is clear how the parts of the system connect and you can separate your concerns. To ensure extensibility and comprehensibility for future Dither developers, modularity and modelability are key.

**Dither should be interoperable**
 - The goal of Dither is to replace existing services and standards. This is very hard to do (see: [xkcd #927](https://xkcd.com/927/)). To try to avoid this fate and make transition as easy as possible, Dither should do anything necessary to make the experience the same, or better, than existing platforms and services.
   - A real-world example of this working is PipeWire acting as a single program unifying nearly all existing audio APIs on linux. (and being backwards compatible with programs that use those other audio APIs).
 - See [Dither Interoperability](./dither-interoperability.md) for more details.

**Dither should rely on itself**
 - This tenet is simply a reminder of the end-goal of Dither: to replace the centralized internet. So long as the other tenets are satisfied, this is the ultimate goal. (Because who doesn't want to reinvent the wheel!)

# Structure

Following the first tenet of Dither, in the future the lines between these layers will blur and everything will be a module. However, the design of current operating systems don't easily allow for shared code and data, requiring a more formal structure. In the future this layered structure will be replaced with a more [flexible system](dither/structure.md).

## Core Process

The Core Dither Process is the part that deals with all operating system-facing operations such as data storage, establishing peer-to-peer connections with other computers, in addition to managing all Dither services and connections between them.

This "Core Process" provides a few core APIs that only certain services running in the "Service Swarm" are allowed to use for security purposes. The idea behind a "Core Process" is to create a sandboxed environment for services to run in a safe manner.

peer-to-peer connections with other computers running Dither.
Currenly in the dither-sim program, this is implemented via a simple TCP stream. In the future this layer will be implemented using existing libraries such as [libp2p transports](https://libp2p.io/implementations/#transports), [Pluggable Transports](https://www.pluggabletransports.info/transports/), something else, or some amalgamation of all three. The idea behind this layer is to provide as many methods of communication as feasibly possible.

## Service Swarm

The service layer provides all functionality related to [routing](dither/routing/distance-based-routing.md), encryption, [data storage](dither/routing/directional-trail-search.md), [user management](dither/data/user-management.md) and everything else. Each of these services are split up into separate modules each of which runs its own processes and communicates with other services through inter-process communication. 

All these processes are managed as child processes under one "main process". The main process contains the Transport Layer implementation, the routing protocol API and APIs for managing the child services as well as managing inter-process communication between child processes.

## User Interface

The application layer contains services just like the service layer that are registered under the main process. These registered service's APIs can be used by other applications. 

The application layer also refers to the application's core API, which is used by the interface layer. This "core application API" can be built into the applicaiton's executable, or it can run as a service under the main process and used by multiple interfaces. This is left up to the application developers. Applications with multiple interfaces should prefer to register application APIs under the main process.

Existing planned applications may be found [here](applications.md).

## Interface Layer

The final layer is the interface layer. This just refers to standalone applications that provide some kind of interface to the user using the services running under Dither.

These interfaces can be implemented however, but it is recommended for them to follow Dither's [application design philosophy](dither/application-design-philosophy.md) for some level of standardization.

# Other Links

### [Inspirations for Dither](dither/inspirations.md)

As with any creative endeavor, Dither takes inspiration from many other projects. This is a list of what parts of Dither have been inspired from other projects.