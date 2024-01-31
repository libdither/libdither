# Dither Interoperability

This document outlines potential strategies for applications built on Dither to ensure interoperability.

See Tenet #3 in the main [Dither](./dither.md) doc.

 - Content-Based Applications
   - Applications that try to replicate specific platform designs (i.e. Reddit, YouTube, etc.) can take advantage of unregulability of P2P applications and seemlessly represent data from centralized services (either linked, or re-hosted). Or act as a dedicated client for those services, creating a bridge between decentralized and centralized hosting.
     - Example: [Dithca](./applications/dithca.md), Dither's reddit replacement could optionally store reddit credentials and allow users interact with comment threads pulled from centralized websites, re-hosting data for other peers in the network as you browse.
     - Example: Any kind of video service built on Dither could initially act as simply a client for YouTube, but then slowly augment certain functionality with calls to a decentralized network, i.e. rehosting video, comments, or other features in a peer-to-peer manner.
 - Disp
   - One of Disp's main goals is to allow programmers to modularly define all parts of the language from the ground up, potentially allowing for easier transpilation between languages.