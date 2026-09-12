# Structure

This document outlines the major structure of Dither.

## System Manager

At the core of Dither is the system manager. This will be written in Rust and should only be run once on any given user account. The system manager provides a sandbox for Dither protocols and is built in a modular fashion to support any kind of setup or platform Dither might run on.

### Core Services

In order to sandbox Dither services, the system manager provides certain core services such as access to storage, network, or other Dither services.

 - Service Manager
   - Provides any service with access the ability to organize other service's permissions, manage storage, as well as stop and start services at will.
 - Network Service
   - Provides any service with access the ability to establish arbitrary TCP or UDP connections.
 - Storage Service
   - Provides any service with access the ability to fetch and store data unique to that service.

Other services may be added as needed.

### Service Swarm

The system manager acts as a kind of sandbox for all services running on Dither and facilitates communication between different services.


## Services

This is a list of planned Dither services and their dependencies, note these may be split up into smaller sub-services.

 - Distance-Based Routing, DBR (Network, Storage)
 - Directional-Trail Search, DTS (Distance-Based Routing, Storage)
 - Reverse-hash-lookup, RHL (Directional-Trail Search)
 - User Manager (DBR, DTS, RHL, Storage)
 - Dither Chat (DBR, DTS, RHL, User Manager, Storage)
 - Dithca (DTS, RHL, User Manager, Storage)
 - Protocol of Truth (DTS, RHL)

## Applications

Applications in Dither will be external programs that communicate with specific services in the Dither System Manager. 
i.e. 
Dither Chat will use the Dither Chat Service
Dithca will use the Dithca service.

Or applications can use a multitude of different services as needed.