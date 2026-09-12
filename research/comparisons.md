# Comparisons to Other P2P Networks

> **This document was drafted by an AI collaborator**, working from the author's designs and direction — see [what that means](./stack/ai-disclosure.md) before trusting a fluent sentence. As a result it may be missing detail, lack absolute coherence, or read in a non-ideal writing style; claims about other projects were made from a mix of primary sources and the AI's training knowledge, spot-checked rather than systematically verified.

As Dither aims to be the best possible design, it must improve in ideas and implementation over the competition. This page exists to provide an active list of how Dither improves (or doesn't) over other P2P network implementations.

Each section states what the existing project does, what its concrete problems are, and what Dither aims to do about them. Be aware of the asymmetry: most projects listed here are (or were) deployed and running, while Dither is still mostly under active design.

## BitTorrent

The dominant P2P file-sharing protocol. Swarms exchange pieces of files, peers find each other via trackers or the Kademlia-based Mainline DHT, and tit-for-tat choking enforces a minimum of sharing within a swarm.

**Issues:**

- **High-latency content discovery.** Finding providers for a hash means iterative DHT lookups — many round trips to far-away nodes before a transfer can even start, and cold lookups routinely take seconds.
- **No anonymity.** Every peer's IP address is visible to the swarm, to the DHT, and to anyone monitoring a tracker. DHT lookups also broadcast *what you are looking for* to every node on the lookup path.
- **Narrow incentives.** Tit-for-tat works only inside one swarm for as long as you are actively downloading. There is no accounting across swarms or for routing, so rare files with few seeders simply die.
- **Files only.** The protocol distributes static blobs; there is no notion of mutable data, naming, or interactive applications.

**Dither's approach:**

- [Directional Trail Search](./dither/directional-trail-search.md) replaces DHT lookups with data trails laid toward routing coordinates and announced through counting bloom filters, aiming for far fewer round trips to popular data. The admitted trade-off: no persistence guarantee for rare data (see the "Downsides" section there).
- Hosting and retrieval can run over [Dither Anonymous Routing](./dither/02-routing.md), so neither seeders nor leechers expose their addresses to each other.
- Contribution accounting applies across the whole network (routing, hosting, and fetching all count), rather than barter inside a single swarm — see "Preventing Network Abuse" in the routing doc.

## Tor

Anonymity network using onion routing over volunteer-run relays, typically three hops per circuit, with relay discovery via centrally operated directory authorities.

**Issues:**

- **Too few relays.** Routing is unpaid and purely voluntary, so a few thousand relays carry traffic for millions of users. The result is chronically low bandwidth and high latency.
- **Topology-oblivious relay selection.** Relays are chosen randomly, ignoring latency and bandwidth between them. Circuits routinely cross oceans multiple times, making Tor unusable for latency-sensitive or high-throughput applications.
- **One-size-fits-all anonymity.** Every application gets the same three-hop circuit whether it needs strong anonymity or just a little cover traffic. There is no dial.
- **Centralized trust root.** The directory authorities that enumerate the network are a small set of centrally managed servers — a structural single point of failure and pressure target for an otherwise decentralized system.

**Dither's approach:**

[Dither Anonymous Routing](./dither/02-routing.md) is designed around exactly these failures:

- Nodes self-organize into a latency-based coordinate space, and a world model predicts latency/bandwidth/cost between nodes, so relay chains can be chosen to *meet targets* instead of at random.
- The anonymity/performance trade-off is explicit and per-application: the user or developer states the latency, bandwidth, cost, and anonymity requirements, and the protocol selects routes accordingly.
- Every node is a potential relay, and contribution accounting (route in proportion to what you contribute) targets a far larger relay pool than volunteer-only networks achieve.
- Route setup plans to use a modified [HORNET](https://arxiv.org/abs/1507.05724v3)-style stateless onion protocol, with support for onion, garlic, multi-path, and pool routing, and pluggable encryption/transport schemes to hedge against any single one breaking.
- There are no directory authorities; peer discovery is designed to expose as little of the network's structure as possible (see [Discovery](./dither/discovery.md)).

## I2P

A fully internal anonymity network ("garlic routing" over peer-to-peer tunnels). Unlike Tor it is not primarily a proxy to the clearnet; every participant routes traffic for others by default.

**Issues:**

- **Same slowness class as Tor.** Tunnel hops are still selected with little regard for measured latency or bandwidth, so I2P inherits low data rates and high latency.
- **Unfriendly to light devices.** The participation model assumes every node contributes routing bandwidth. Phones, metered connections, and low-uptime laptops can't meaningfully pull their weight, and there is no good mechanism for them to trade some other resource (storage, compute, money) for network use.
- **Small, enumerable network.** The netDb floodfill mechanism lets anyone enumerate most of the network's routers, and the total network is small enough that traffic-analysis and Sybil pressure are realistic concerns.
- **Application silo.** I2P is its own walled garden; using it means building specifically for it, and reaching the normal internet through it is marginal.

**Dither's approach:**

- The same latency/bandwidth-aware relay selection as described for Tor applies here: DAR's coordinate routing and world model directly target I2P's "random hops are slow" problem.
- The bandwidth-exchange scheme is meant to be friendly to devices that can't contribute much bandwidth: contribution is measured across resource types (routing, storage, compute), and the planned market layers let a light device pay for network use with whatever it *can* provide — see the routing doc's incentive analysis and the [stack overview](./stack/overview.md) for the economic layers.
- Dither aims to be a general application platform (chat, comments, files, search), not a single-purpose anonymity silo.

## Freenet

Freenet is the oldest project in this comparison (started 1999 by Ian Clarke) and, relevantly, the one whose current incarnation is closest in ambition to Dither. There are two generations to keep distinct:

- **Classic Freenet** (2000–present, renamed [**Hyphanet**](https://www.hyphanet.org/) in 2023): an anonymous, censorship-resistant *static storage* network. Immutable content addressed by hash (CHK/SSK/USK), a datastore per node that evicts unpopular content (LRU), small-world routing, and an optional "darknet" mode connecting only to friends. Its practical record: extremely slow (fetches taking seconds to minutes), content silently dropping out of the network, no support for interactive or mutable applications, a heavy Java client, documented attacks on its location-swapping and opennet, and — despite millions of downloads over 25 years — a live network that never grew past the low thousands of concurrent nodes by most estimates, with a public reputation dominated by illicit content.
- **The new Freenet** (redesigned from scratch in Rust from 2019, live network since late 2025): a platform for *real-time decentralized applications* — "the original was a decentralized hard drive; the new one is a decentralized computer." This is the generation worth comparing against. The summary below is from its [architectural whitepaper](https://github.com/freenet/paper-1) and [reference implementation](https://github.com/freenet/freenet-core).

### How the new Freenet works

- **Contracts** are WebAssembly modules, content-addressed by `H(H(code)‖params)`, that define an application's *shared public state* plus its merge semantics. State must form an idempotent commutative monoid (a join-semilattice — i.e., a state-based CRDT whose lattice is supplied by the application instead of chosen from a fixed catalogue), with a `valid` predicate and a contract-defined `summarize`/`getDelta`/`applyDelta` synchronization protocol so replicas exchange only differences.
- **Delegates** are WASM modules that run only on the user's own device, holding private state (keys, secrets) behind a core-enforced message boundary. UIs are ordinary web frontends delivered as contract state, talking to the local node over a WebSocket.
- **Routing** happens on a one-dimensional small-world ring: peer locations derive from hashing the peer's IP *prefix*, contract locations from the contract key. Peers actively shape their neighbor sets toward Kleinberg's 1/d link distribution ("gap-targeted" connection requests, Kleinberg-scored acceptance), and forward by a per-neighbor learned performance model (isotonic regression over observed latency/failure/throughput) rather than by ring distance alone.
- **Subscriptions** form leased trees (8-minute leases, renewed every 2 minutes) rooted near a contract's location; updates merge and fan out along the tree, which is what makes real-time group chat possible without per-message lookups.
- Transport is UDP with X25519 + AEAD and NAT hole-punching; public-IP gateways are needed only for a peer's initial join.

### Where Dither agrees with Freenet's diagnosis

The new Freenet's motivating critique of existing P2P systems is nearly identical to Dither's, which is itself useful evidence:

- **DHTs are too slow** for interactive use (Dither: see [Directional Trail Search](./dither/directional-trail-search.md) on IPFS; Freenet: replaces DHT routing tables with its small-world ring and subscription trees).
- **Global consensus is the wrong tool** for most applications (Dither: "No blockchain. Just gossip, signatures, and causality" in [Coupling](./stack/02-coupling.md); Freenet: per-contract eventual consistency instead of global linearizability).
- **Immutable content-addressing alone is a poor fit** for chat, feeds, and collaborative apps; mutable shared state must be a first-class primitive.
- **Centralized platforms and federation are landlords**; the goal is applications with no servers at all.

### Issues with Freenet

- **No anonymity, by design.** Unlike classic Freenet (and unlike Dither), anonymity was deliberately removed from the core and deferred to future application-layer services that do not exist yet. Today, peer locations leak your IP prefix and traffic is only hop-by-hop encrypted.
- **No incentive layer.** Peers are expected to donate "surplus resources" out of goodwill. The whitepaper itself lists the missing incentive/abuse layer as the open problem that "determines whether the network grows past a small community."
- **Weak Sybil resistance.** Locations are hashes of IP /24 prefixes — a mitigation that raises, not eliminates, the cost of grinding chosen ring locations. Defenses (reputation contracts like "Ghost Keys") are deferred to the application layer, which itself routes through the same vulnerable ring — a bootstrap circularity the whitepaper concedes.
- **State is not content-verifiable.** A contract key commits to code and params, not to state. Readers must trust replicas' `valid` predicates, and nothing stops a peer from serving *stale-but-valid* state. Correctness of the merge function is entirely the contract author's burden — if it isn't truly associative/commutative/idempotent, replicas silently diverge, and the platform "detects this as a downstream symptom."
- **Unproven at scale.** Deployed evidence is a single 24-hour snapshot at ~440 concurrent peers, where p95/p99 GET path lengths were already at the 10-hop cap (truncating the tail, so the real tail is unmeasured). Congestion control is unsolved (the production default is a fixed-rate token bucket; LEDBAT/BBR variants are experimental). The live network is alpha-quality: mandatory telemetry, forced auto-updates, and an issue tracker full of propagation-stall and replica-divergence bugs.
- **Community baggage.** The 2023 rewrite was pushed through over the objection of the existing maintainers, who took the old network (and its anonymity mission) to Hyphanet. The new project kept the famous name but dropped the purpose the name stood for — alienating part of its own base while inheriting the old network's reputation.

### What Dither aims to do differently

- **Anonymity is first-class, not a future service.** DAR onion-routes connections by default and exposes anonymity as a per-application dial alongside latency, bandwidth, and cost ([routing](./dither/02-routing.md), [measuring anonymity](./dither/measuring-anonymity.md)). Freenet's answer to anonymity is currently "build it yourself on top."
- **Data stays verifiable.** Dither's substrate is an immutable hash-linked DAG — any fetched object checks against its hash — with mutability layered on top via [Reverse Hash Lookup](./dither/reverse-hash-lookup.md) links rather than by trusting unverifiable mutable state held by strangers.
- **Latency-coordinate routing instead of a hash ring.** Freenet's ring locations are cryptographic (geographically random) and recover performance through a learned per-neighbor cost model; Dither's routing coordinates *are* measured latency, so the overlay reflects physical topology directly. Dither accepts the coarse-location leak this implies because it makes efficient onion routing cheap; Freenet avoids the leak but pays with geography-oblivious routes and a more complex adaptive layer.
- **The economy is designed in, not deferred.** Freenet runs on altruism and lists incentives, Sybil resistance, and abuse-resistance as open problems. Dither's [stack](./stack/overview.md) is built around exactly these layers from the start: markets for storage/bandwidth/compute, pool-equity money with demurrage, correlation-aware (n_eff) Sybil accounting, and governance mechanisms. The bet is that a network without an economy never grows one; Freenet's trajectory will test the opposite bet.
- **Verification has a budget ladder.** Where Freenet offers per-contract validity predicates, Dither's [agent layer](./stack/01-agent.md) treats verification as a certainty-per-cost dial: predicate checks in [disp](./disp/disp.md), sampled k-replication, and Truebit-style bisection of execution traces, chosen per stake of the claim.

### What Dither can learn from Freenet

The comparison is not one-directional. Freenet has working answers to problems Dither has only sketched:

- **Application-defined summary/delta sync** is a clean generalization of anti-entropy: each application supplies its own summary and delta types, so reconciliation cost tracks application semantics. Something like it would fit naturally over DTS/RHL data structures.
- **Learned adaptive routing** (per-neighbor isotonic-regression models of latency/failure/throughput) is a concrete, deployed mechanism for the "world model" DAR wants, and simpler than full RL.
- **Leased subscription trees** are a working solution for real-time update fan-out that Dither Chat will need some equivalent of.
- **Deterministic whole-network simulation** (Freenet uses a Turmoil-based harness where an entire network replays bit-for-bit from a seed) is the right way to test DBR/DTS before deployment.
- **Honesty as documentation practice**: the whitepaper's explicit deployed/implemented/experimental/open status table is worth imitating.

### Status honesty

Freenet is ahead of Dither in the only currency that ultimately counts: it has a running network, a working real-time chat app (River), and published measurements. Dither has, so far, a deeper design — especially on incentives, Sybil resistance, verification, and anonymity, which are precisely the areas where Freenet's own whitepaper admits it has no solution yet. Whether those layers can be retrofitted onto a running network (Freenet's path) or must be designed in from the start (Dither's path) is an open empirical question, and Freenet is the experiment most worth watching.
