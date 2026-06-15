# 5 · One Resource Market

> 🚧 **Draft (core-idea sketch).** *Part A · Core Ideas. The first place the primitives combine.*

**The problem.** A decentralized system seems to need three separate markets — storage, bandwidth, compute — each with its own protocol, pricing, and incentives, that must somehow interoperate. That's three hard designs and three integration problems.

**The core idea.** They are **one operation**: `MATERIALIZE(value, spacetime-region)` — make a value available at a place and time. It has three elementary edges:

- **hold in time** = storage, **move in space** = routing ([problem 4](routing.md)), **transform** = compute ([problem 3](substrate.md)).

Any request is satisfied by a *min-cost DAG* over these edges, and the same value can be produced many ways — "fetch a cached copy vs. recompute it" is just route choice in one graph. So **caching = replication = memoization = one threshold rule**. disp is the verifiable value algebra that lets a buyer trustlessly mix fetched and computed sub-results; prices act as the system's shared prediction-error signal (predict demand well → pre-position → get paid).

**Leans on:** identity (1), routing (4), substrate (3), money (6). **Enables:** the first real paid economic loop in the network.

> ⚠️ **Where it's thin.** The unification is *abstraction-level*: the three edge costs differ by orders of magnitude and by risk type, so three real cost models are still owed. The clean price↔incentive alignment assumes price-taking and convex costs — lumpy storage commitments and relays with market power break it. Part B.
