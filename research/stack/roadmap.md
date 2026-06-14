# Roadmap: The Decentralization Stack (DRAFT)

> *Appendix B. The engineering / build-plan view. For the conceptual development, read the chapters in order starting from [the overview](overview.md).*

*Working draft. The goal: map the path from programming language → routing → currency/incentives → data & compute trading → governance, identify how the layers depend on each other, and call out what's missing at each step.*

## The stack at a glance

| # | Layer | Project / doc | Maturity |
|---|-------|---------------|----------|
| 1 | Language & verification | disp ([disp/disp.md](../disp/disp.md), `libdither/disp`) | **Working prototype.** Kernel + elaboration stages 0–3 self-hosted; effects, erasure, optimizer pending. |
| 2 | Routing & data | Dither: DAR ([dither/02-routing.md](../dither/02-routing.md)), DTS, RHL, identity | **Detailed design (DAR) → sketches (DTS/RHL/identity).** No implementation; simulator work exists (`dither-sim`). |
| 3 | Currency & incentives | [applications/dither-currency.md](../applications/dither-currency.md), routing incentives, [applications/fractional-funding.md](../applications/fractional-funding.md) | **Sketch.** Economics ideas, no consensus design, no threat model. |
| 4 | Data & compute trading | [dither/decentralized-data-ideas.md](../dither/decentralized-data-ideas.md) | **Research agenda only.** No protocol design. |
| 5 | Governance / truth machine | Retroactive consensus markets + hierarchical liquid quadratic voting ([Retroactive Consensus Markets](mechanism.md)); [applications/protocol-of-truth](../applications/protocol-of-truth/protocol-of-truth.md) | **Rigorous mechanism synthesis now in repo**; central theory gap (reflexivity) reduced to a measurable threshold ([mathematical-core.md](mathematical-core.md) §2). |

The truth machine in one line: forecasters publish timestamped probability distributions; capital-holding *resolvers* privately and retroactively declare what they believe happened; a reference-relative proper scoring rule pays forecasters for moving belief toward eventual resolver consensus. Output: a live world-model *and* a skill ranking, with no exploitable point-in-time oracle. Governance bolts this onto liquid quadratic voting: voters set goals, the market estimates which policies advance them, skill rankings can weight estimates.

## How the layers interact

These interactions are the actual argument for building this as *one* stack rather than five projects:

1. **The truth machine fills the currency's biggest hole.** dither-currency.md proposes a periodic redistribution from all wallets into a pot managed by an "intelligent democratic mechanism" — left undefined. Liquid QV + retroactive consensus markets *is* that mechanism. Conversely, the governance layer needs a native unit for resolver budgets `B_j`, QV credits, and forecaster payouts.

2. **The currency's anti-hoarding mechanic supports the market's key assumption.** The mechanism's aggregation quality degrades as capital concentrates (assumption A2, dispersed capital). A demurrage/redistribution currency structurally pushes against concentration. These two designs reinforce each other and should be co-designed, not bolted together.

3. **Identity is upstream of everything quadratic.** QV is meaningless without Sybil resistance; the prediction market's reference-subtraction can be farmed by Sybil forecasters; routing incentives and data markets need persistent pseudonyms for reputation. Dither's web-of-trust identity layer ([dither/user-management.md](../dither/user-management.md)) is currently an idea sketch but is a *hard dependency* of layers 3–5. It deserves promotion from "application concern" to core protocol.

4. **Tamper-evident timestamps are a shared primitive.** Forecasts must not be backdatable (assumption A4); the currency needs transaction ordering; RHL needs some consensus on link sets. One minimal ordering/timestamping/data-availability primitive serves all three — likely the *only* global consensus the stack needs. This reframes the consensus question (old_ideas/consensus/): we don't need general smart-contract consensus, we need cheap verifiable timestamping plus a payments ledger.

5. **disp is the verification substrate for compute trading.** Selling computation requires the buyer to trust the result. disp's program-as-data + types-as-predicates + provable-equivalence story is exactly a verifiable-compute story: a compute offer is a content-addressed program plus a disp predicate the result must satisfy; disputes resolve by re-execution or proof checking. No design for this exists yet — it's the main missing bridge between layers 1 and 4.

6. **disp can make markets machine-resolvable.** A question's outcome space and resolution criterion can be a disp predicate over published data. Resolvers can then delegate verdicts to programs for the objective subset of questions, reserving human judgment for ambiguous ones. This also unifies the quantitative truth machine with the qualitative [Protocol of Truth](../applications/protocol-of-truth/protocol-of-truth.md) assertion graphs: assertions become market questions; debate structure becomes evidence attached to them.

7. **Per-resolver subjectivity matches Dither's polycentric philosophy.** Reputation `R_{i,j}` is relative to each resolver's worldview — no global truth oracle, just per-perspective rankings. Same shape as web-of-trust identity and the polycentric model. The stack is philosophically coherent: *subjective-but-aggregable* all the way down.

8. **"Pay for predictive accuracy" recurs at every layer.** DAR's network world-models reward predicting latency/bandwidth; data markets reward predicting demand for caching; the truth machine rewards predicting consensus. A shared scoring/staking framework could serve all three.

## What's missing — per layer

### Layer 1 — disp
- Effects (`Eff` monad) and the erasure (`strip`) pass — needed before disp programs can do real I/O efficiently.
- Self-hosted parser + module resolution (elaborator stages 4–5) — last host-trusted pieces.
- Optimizer / synthesis engine (the long-term payoff; not on the critical path for the stack).
- **Stack-specific gap:** serialization + content-addressed code distribution format, and any networking story at all. Nothing connects disp to Dither today beyond intent.

### Layer 2 — routing & data
- DAR implementation; incentive game theory unresolved (pricing/bargaining for relays).
- DTS rare-data problem; RHL is three sentences of architecture.
- **Validation gap:** no simulation results backing the routing-coordinate + HORNET design. Reviving `dither-sim` against the current spec is the cheapest de-risking step.

### Layer 3 — currency
- No concrete consensus/ledger design (Stellar+IOTA hybrid is a preference, not a spec).
- Demurrage/redistribution mechanics, zone design, and the proof-of-external-destruction USD peg all need real economic analysis — the peg in particular is likely unsound and should be re-examined.
- No threat model (eclipse attacks, zone capture, fee-less spam).

### Layer 4 — data & compute trading
- Essentially everything: storage market protocol, bandwidth settlement (micropayments per relayed byte?), verifiable compute protocol (see interaction 5), pricing discovery, comparison against Filecoin/Arweave/Golem to know what to copy vs. reject.

### Layer 5 — governance / truth machine
- **Reflexivity (A5) is the central theoretical gap:** when skill rankings feed back into the votes that constrain resolvers, does the loop converge to truth or to a stable fiction? Needs agent-based simulation and/or a formal treatment before any high-stakes deployment.
- Resolver honesty is unmodeled once verdicts gate public money.
- "Retroactive reward by extrapolated intention/utility" is a desideratum, not a defined operator.
- Hierarchical/liquid structure of the QV layer is a TLDR, not a design (delegation mechanics, credit issuance, collusion resistance).
- ~~The truth-markets notes live outside this repo and should be merged as a spec chapter.~~ **Done** — merged as [Retroactive Consensus Markets](mechanism.md) (mechanism, assumptions A1–A5, open problems §8).

### Cross-cutting
- **Identity/Sybil-resistance primitive** (blocks 3, 4, 5).
- **Timestamping/ordering primitive** (blocks 3, 5, RHL).
- A stack-wide **threat model** document.
- A **dependency-ordered build plan** — which this document attempts below.

## Sequencing principle

Two observations drive the ordering:

1. **The truth machine does not need the rest of the stack to be tested.** A centralized pilot (a web service with signed, timestamped forecasts and a handful of resolvers) tests the mechanism, the scoring rule, and empirically probes reflexivity — long before Dither routing or currency exist. The science impact-market is the natural pilot (low stakes, measurable outcomes, motivated forecasters).
2. **Each layer should ship something independently useful** (the "Useful" tenet), while producing the primitive the next layer needs.

## Phased roadmap (draft)

### Phase 0 — Consolidation (weeks)
- ✅ Merge truth-markets notes into this spec (`governance/` chapter): mechanism, assumptions A1–A5, open problems — see [Retroactive Consensus Markets](mechanism.md).
- Write the cross-layer dependency map (this doc) and a first threat-model outline.
- Decide the identity and timestamping primitives' requirements (consumers: currency, markets, governance).

### Phase 1 — Independent kernels (months, parallelizable)
- **disp:** land effects + erasure + stages 4–5 → a language someone can actually write a tool in. Then: content-addressed module distribution format.
- **Routing:** revive `dither-sim`; validate routing coordinates + DAR relay selection in simulation; publish results. Implementation only after simulation says the design works.
- **Truth machine:** build the centralized MVP (forecast publication, per-resolver retroactive scoring, skill rankings). Run the science impact-market pilot. Instrument it to study reflexivity and reference-belief gaming.
- **Theory:** agent-based simulation of the reflexive governance loop; formalize or refute convergence.

### Phase 2 — Shared primitives (after Phase 1 signals)
- Web-of-trust identity protocol (design + prototype) — promoted to core.
- Minimal timestamping/data-availability layer (this is "the consensus decision," scoped down).
- Currency testnet on top of both; routing incentives denominated in it (first real economic loop: pay relays).
- Truth machine v2: forecasts anchored to the timestamping layer; identity-backed forecaster accounts (Sybil-resistant reputation).

### Phase 3 — Markets
- Storage/bandwidth trading over DAR + currency (DTS trail hosting becomes a paid service).
- Verifiable compute protocol: disp predicates as result contracts; dispute resolution by re-execution.
- Machine-resolvable market questions (disp predicates as resolution criteria) feeding the truth machine.

### Phase 4 — Governance
- Liquid QV pilot in a small, real community — the obvious candidate is **the Dither project itself**: fractional-funding contributions allocated by QV, informed by truth-machine estimates of "which roadmap item most advances goal X." Recursive self-governance satisfies the "Self-reliant" tenet and is the cheapest honest test.
- Scale outward (open-source funding, DAO treasuries, scientific funding bodies) only after the reflexivity question has empirical answers.

## Open questions to resolve before Phase 2

*Status update: all five are dispositioned — answered, reduced to measurable quantities, or precisely scoped — in [mathematical-core.md](mathematical-core.md) (see its §8 scorecard).*

1. Does the reflexive loop converge? → **Answered in principle** (math core §2): linear influence is harmless; danger is a bifurcation at deference slope `L = 1`; `L` is measurable and controllable (blind resolution, reality-coupling).
2. Minimal identity primitive for Sybil-resistant QV + anonymity? → **Reframed** (math core §3): weight ∝ effective independence `n_eff = 1ᵀΣ⁻¹1` over pseudonymous behavioral residuals; no personhood classifier needed.
3. Is global consensus avoidable? → **Yes** (math core §4.4): payments are consensus-number-1; demurrage is local arithmetic; timestamps by causal entanglement; only contested allocation needs zonal BFT.
4. disp ↔ network boundary? → **Answered** (math core §1.5): the network API *is* disp's effect algebra (`store/send/eval/price` = the three MATERIALIZE edges + price field).
5. Smallest meaningful pilot? → **Specified** (math core §6): estimands `L̂`, `Σ̂`, calibration, VOI-routing; ~30–100 resolvers, ~100–300 questions.

The remaining genuinely-open list (arms-race floor, deference-curve empirics, preference-delegation semantics, open-economy monetary dynamics, non-convex market design, and the coupled stability proof) is in math core §8.
