# The Substrate: Storage = Routing = Compute

> *Part II · The Recurring Pattern — Chapter 5*

Part I built an engine for aggregating knowledge. Part II shows the *same shapes* — prediction, independence, value-as-flow — reappearing at every layer of a decentralized system. Start with the layer that looks least like a market: the raw substrate that stores, moves, and transforms data.

## The problem: three services, or one?

A decentralized network seems to need three separate subsystems — a storage market, a bandwidth market, and a compute market — each with its own protocol, pricing, and incentives. That's three hard designs that must somehow interoperate. The first simplification of the stack is noticing they are **not three things**.

- **Storage** is transport of information through *time*: the same bits, same place, later.
- **Routing** is transport through *space*: the same bits, elsewhere, ~now.
- **Compute** is *transformation*: different bits (a function of the input), here or there, later.

Storage and routing are the identity function applied across a displacement; compute is an arbitrary function across a displacement. All three are special cases of one operation:

> **MATERIALIZE(V, R):** make value `V` (given by content hash, or by a predicate `P` acceptable values must satisfy) available at spacetime region `R`.

## One flow problem

Define three elementary edges over nodes `(value, location, time)`:

| Edge | Action | Cost ∝ |
|---|---|---|
| `TRANSPORT-TIME` | hold `V` at `x` from `t` to `t'` | size × duration (storage) |
| `TRANSPORT-SPACE` | move `V` from `x` to `x'` | size × distance (routing) |
| `TRANSFORM` | $\{V_1\dots\} \mapsto f(V_1\dots)$ | reduction steps (compute) |

**Any request is satisfied by some DAG of these edges, and the same value can be produced by many different DAGs** — fetch a cached copy (`TIME + SPACE`), recompute from inputs (`TRANSFORM + SPACE`), or a hybrid. The network is not running three services; it is solving **one min-cost flow problem** in a spacetime-value graph: given a demand field, find the cheapest DAG of edges that satisfies it.

## Why collapsing them pays

- **Caching, replication, and memoization become one decision** — adding a `TRANSPORT-TIME` edge (a value held near expected demand) whenever `expected_demand × recompute_or_refetch_cost > storage_cost`. CDN behavior, DHT replication, and function memoization are one optimization with different constants.
- **Routing already solved the geometry.** Routing coordinates (Vivaldi) embed `TRANSPORT-SPACE` cost as distance. Extend that space with a storage axis and a compute-distance axis and the *same* shortest-path machinery prices all three.
- **[disp](../disp/disp.md) is the value algebra this needs.** In disp, programs *are* content-addressed trees, compute *is* reduction, and hash-identity makes storage and routing equivalent (moving a tree preserves its hash). "Fetch vs. recompute" is "transport the normal form vs. transport-and-reduce." Because results are checkable by hash (or by a disp predicate), you can **trustlessly mix fetched and computed sub-results** — the buyer verifies the answer regardless of which DAG produced it. This is the concrete bridge from the language layer to the resource market.

> ⚠️ **Honest caveat.** The unification is real at the level of *abstraction* (min-cost flow), but the edge weights span many orders of magnitude and carry different risk (a lost stored byte ≠ a lost expensive computation ≠ a missed latency deadline). The abstraction tells you *what* to optimize; it does not flatten the three very different cost models you must still supply.

> 📐 **Formal version:** [The Mathematical Core](mathematical-core.md) §1 — MATERIALIZE as priced multicommodity flow, the local caching threshold, and the disp ↔ network effect algebra.
