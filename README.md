# Dither

*An open source toolbox for creating privacy-respecting decentralized applications capable enough to replace most centralized services on the Internet.*

The Internet is too centralized: vast swaths of services depend on a few companies to keep everything running, creating central points of failure, control, and surveillance. Dither aims to let any programmer build applications with no central points of failure, no single organization in control, no censorship, and user-controlled data.

See [**dither.link**](https://dither.link) for an introduction and the [**Dither docs**](https://dither.link/docs/dither.html) for the full design.

## Core Services

At its core, Dither is software that lets applications built on top of it:
 - Send data to other computers in a flexibly private manner, where the user chooses how untraceable their connection should be (improves on TOR, I2P, and others). [Routing docs](https://dither.link/docs/dither/02-routing.html)
 - Host public data so the burden of hosting is distributed over everyone interested in it, while hiding information about individual hosts and users (improves on IPFS, BitTorrent, and others). [Directional trail search](https://dither.link/docs/dither/directional-trail-search.html)

On top of these, services for identity, consensus, and storage combine into a cohesive decentralized, private, and trustless internet. Programs themselves are meant to be shared and verified via [Disp](https://dither.link/docs/disp/disp.html), a language where programs are data structures identified by hash ([prototype](https://github.com/libdither/disp)).

## This Repository

| Path | Contents |
|---|---|
| `src/`, `node/` | Rust implementation: the node, networking, routing, and simulation binaries |
| [`research/`](research/) | The Dither spec & design documents, rendered to [dither.link/docs](https://dither.link/docs/dither.html) |
| [`website/`](website/) | The [dither.link](https://dither.link) site; deploys via GitHub Actions on pushes to `main` |

## Status & Community

This project is a work-in-progress: most of Dither lives in [design documents](https://dither.link/docs/dither.html) being slowly refined, with networking protocols tested in simulation first. Conversation, critique, and contributions are welcome on GitHub and in Dither's [Matrix Space](https://matrix.to/#/#dither:matrix.org) — come say hi!
