# 4 · Anonymous Routing & Retrieval

> 🚧 **Draft (core-idea sketch).** *Part A · Core Ideas.*

**The problem.** Move data between nodes, and *find* who holds a given value, **without** revealing who wants what or exposing the network's structure to observers. Ordinary routing leaks exactly this; ordinary content-discovery (a DHT) broadcasts your interests.

**The core idea.** Three cooperating pieces:

- **Distance-aware anonymous routing (DAR)** — nodes embed in a *latency coordinate space* (Vivaldi-style) so "closer" means "cheaper to reach," and traffic is onion-wrapped (HORNET-style) so relays learn neither source nor destination.
- **Data-trail search (DTS)** — follow breadcrumbs left by previous retrievals to locate rare data without a global index.
- **Reverse-hash-lookup (RHL)** — find providers of a content hash.

The latency coordinate space is reused everywhere else as the system's **"body map"**: it also organizes currency zones, consensus tiers, and birth-time vouching ([problem 1](identity.md)).

**Leans on:** identity (1) for relay reputation under pseudonyms. **Enables:** the resource market (5) — this *is* its move-through-space edge — and general data availability.

> ⚠️ **Where it's thin.** The routing-coordinate + HORNET design has **no simulation results yet**; the relay-incentive game (who pays whom for bandwidth, and how bargaining settles) is unresolved; DTS's rare-data case and RHL are sketches. Reviving the simulator is the cheapest de-risking step. Part B.
