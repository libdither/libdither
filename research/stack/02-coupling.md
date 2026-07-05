# 2 · Coupling

Your node meets a second one: a friend's machine across town. Nobody is in charge of the pair of you. Why would you cooperate at all, and what do you actually send each other?

You cooperate because coupling has surplus: she backs up your residuals and you back up hers (redundancy); her node's models are good at maps and yours at code (specialization); her machine sits near data you keep fetching (latency). And the messages that realize the surplus come in exactly four kinds, each the seed of an institution this book grows later:

- **Capability advertisements** — "here is what I can predict, serve, and check, and roughly what it costs me." The seed of routing and the market.
- **Attestations** — signed receipts: "I saw the hash of your message at my clock time." The seed of ordering and timestamps.
- **Credit** — a bilateral IOU ledger: you owe her three map-lookups' worth, she owes you a night of backup. The seed of money; the ratio you settle on is the first exchange rate, born as barter.
- **Fate** — standing claims on each other: stakes, shared commitments. The seed of zones, pools, and everything in [chapter 4](04-money.md).

Nothing here is forced. The design stance toward cooperation is *make it explicit, priced, and reversible*: cheap to enter where surplus exists, cheap to exit where it stops. Moloch is not defeated by mandate; he is starved by exit.

## Coupling is a typed object

"Explicit" can be made literal. A coupling between two nodes is a **protocol both sides agree to in advance**, and a protocol can be a *type*: a session type declaring who may send what, in what order, with what obligations. This is mature theory (multiparty session types; well-typed participants provably follow the protocol, never deadlock, always make progress), and [disp](../disp/disp.md) is an unusually good host for it:

- A protocol spec is a content-addressed tree: protocols have hashes, versions diff, and no registry exists to capture.
- disp types are predicates, so a message slot can *require* things: "a transfer signed by the sender whose balance covers it." Types check transcripts, not just values.
- Every exchanged message cites the hashes of what came before, so a protocol run's transcript is tamper-evident: an auditable object. Disputes over behavior are settled the way [chapter 1](01-agent.md) settles disputes over computation: bisect the transcript to the first ill-typed step.

A **contract**, then, is a session type plus collateral plus an arbitration clause, and "our coupling" is the set of live typed sessions between us. What makes a protocol *good* has a four-part answer: sound (well-typed), incentive-compatible (honest play is an equilibrium, and silence is punishable by timeout-with-collateral), self-measuring (it emits the statistics needed to tune it), and evolvable (new versions offer typed adapters to old ones). The [protocols-as-priors note](notes/protocols-as-priors.md) develops all four; the one caveat to carry is that types give safety while *incentives* must supply liveness, because a counterparty can always go silent, and only stakes make silence expensive.

## Attestations become time

Your friend's receipts do more than confirm delivery. Once the hash of your record appears inside her signed messages, and hers inside third parties' messages, your record is sandwiched: it provably existed before everything that cites it and after everything it cites. Backdating anything means rewriting the signed histories of every independent witness in the web. That is the whole timestamping design: no blockchain, just causal entanglement, with precision set by gossip rate.

Payments ride the same insight. A payment from a single-owner account needs only the *sender's* own ordering of their spends (that is what rules out double-spending), and the sender provides it; this is a theorem (consensus number 1, Guerraoui et al. 2019), not a hope. Reliable broadcast suffices. The only thing that ever needs genuine agreement among strangers is **contested allocation** (two buyers, one name), and that is rare, local, and handled by a small quorum drawn from the surrounding cluster.

## From pairs to clusters

Run the coupling move repeatedly and institutions appear on a schedule:

- **Four nodes.** Your friend vouches for her cousin: the first *transitive* trust inference. The pairwise IOUs start netting multilaterally: the clearing function is born. Three nodes can witness for two: the first quorum.
- **Eight and beyond.** The first true stranger arrives, and for the first time it matters whether "three enthusiastic newcomers" are three people or one — Sybil pressure begins, and with it the machinery of [chapter 5](05-immune.md). One node ends up in the middle of most trades because it is central: the hub is born, with its uses and its dangers. Unanimity stops scaling; voting appears.

A **cluster** that couples densely (trading, witnessing, vouching, netting) becomes something with a name: a *zone*. Pool where coupling surplus is high; trade at arm's length where it is low; the boundary sits where the surplus drops. ([Chapter 4](04-money.md) makes the boundary precise, because the boundary is where money changes.)

Geometry helps everything at once. Nodes embed themselves in a **latency coordinate space** (near in the space = cheap to reach in the world), and this one map gets reused so often the book calls it the *body map*: it is where quorums are drawn, where currency zones live, where newcomers get vouched, and where the correlation machinery of chapter 5 gets its prior (correlation between neighbors is expected; correlation between strangers is a signal). Transport over the map is onion-wrapped, so relays learn only their neighbors and never source or destination. You can move and fetch without confessing what you want to whoever watches the wire. Retrieval routing composes with [chapter 1](01-agent.md)'s memory: a request is a partial context, and each hop moves it toward nodes advertising lower expected loss on that kind of context — descent on an uncertainty gradient, with exact-bit fetches as the expensive tail.

## Identity, finally

Notice what this chapter never needed: a registry. At two nodes, identity is perception: you know your friend. The question "who is real" only grows teeth as strangers arrive, and the answer that scales is not a credential but a **posterior**. Each node (and each zone, for its own purposes) maintains its *own* estimate of how distinct and how trustworthy each counterparty is, fed by evidence streams that are cheap to combine and expensive to fake in bulk:

1. **Locality** — latency triangulation and physical presence: an attacker fakes nodes, not nodes *everywhere*.
2. **Authorizers** — the desk returns, demoted from root to evidence: a passport office, employer, or community notary is an attestor whose own track record is auditable, and whose word you weight accordingly.
3. **Stake-backed vouching** — a voucher loses stake if the vouched-for account proves to be a puppet.
4. **Behavioral streams** — the paid work of later chapters: service patterns, forecast records, transaction rhythms.
5. **Continuity** — hash-entangled history; aging an identity is costly by construction.
6. **Hardware** — a disk can only be committed once.

Two properties matter more than any single stream. **Confidence is stake-scaled**: a small trade needs a weak posterior, a large vote a strong one, so you purchase exactly the identity-certainty the interaction warrants (the certainty loop again). And **confidence composes along paths**: for distant strangers you never compute a fine-grained estimate at all; you trust through chains, with attenuation, the same way exchange rates will compose in chapter 4. Identity confidence, trust, and exchange rates turn out to be one family of objects: fields over the body map that compose along routes.

⚠️ Open: the quorum design for contested allocation (member selection, cross-zone disputes) is unwritten; the relay-incentive game (who pays whom for carrying traffic) waits on the market; timestamp precision under real gossip is unmeasured; and the typed-sessions program over disp (the concrete projection and coercion calculus) is a design note, not code.

📐 Formal treatment: [Mathematical Core §4.4](mathematical-core.md) (consensus requirements), [§10.3](mathematical-core.md) (coupling surplus); the [coupling-and-merging note](notes/coupling-and-merging.md).

---

Pairs and clusters can now transact, witness, timestamp, and know each other in proportion to the stakes. What they still lack is a way to price anything beyond barter: a market where capacity, effort, and knowledge clear against demand. That is [chapter 3](03-market.md).
