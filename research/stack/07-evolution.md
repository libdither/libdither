# 7 · Evolution

Look back at what got built, and notice how little of it there is. One loop: spend to reduce uncertainty until confident enough for the stakes. One move: couple where surplus exceeds cost, explicitly and reversibly. One payment rule: reward equals verified improvement over the shared reference. One accounting: weight follows independence, and correlation is decomposed rather than ignored. Chapters 1 through 6 are these four sentences pointed at different questions — and that compression is not a stylistic victory but the design's survival strategy, because what is small can be reasoned about, and what can be reasoned about can be safely *changed*.

Change is this chapter's subject, because every mechanism in this book is a **shipped prior**, and priors are meant to be outgrown.

## The organism, literally

The frame from the [overview](overview.md) can now be cashed out. A system that maintains a boundary, predicts its environment well enough to pay its own maintenance, and is built at every scale from smaller things doing the same — that is an organism, and the mapping is structural:

| Organ | Stack layer |
|---|---|
| membrane and immune system | correlation management, `n_eff` ([ch. 5](05-immune.md)) |
| metabolism | storage / routing / compute ([ch. 3](03-market.md)) |
| bloodstream | pool shares; demurrage as turnover; the drip as perfusion ([ch. 4](04-money.md)) |
| perception | the slow market ([ch. 3](03-market.md)) |
| motor system | governance ([ch. 6](06-governance.md)) |
| body map | the latency coordinate space ([ch. 2](02-coupling.md)) |
| genome | the protocol: the shipped priors ([notes](notes/protocols-as-priors.md)) |
| development | newcomer perfusion ([ch. 4](04-money.md)) |
| reproduction and evolution | forking; selection between networks (this chapter) |
| cancer | extraction without contestability ([ch. 4](04-money.md), [ch. 5](05-immune.md)) |

Perception and action are one calculus pointed opposite ways — the slow market changes beliefs to match the world, governance changes the world to match beliefs — and chapter 5's `L < 1` is the condition keeping that motor coupled to reality instead of idling in a dark room.

The commons holds for the reason it holds in biology. The tragedy of the commons is a multipolar trap, and evolution's escape was always the same move, a *major transition*: a higher-level individual emerges whose own fitness depends on the commons, and which can discipline its constituents. Its stability conditions are this book's spec sheet: align constituent fitness with the whole (the market pays for work the network demands; cross-holdings entangle welfare); suppress internal defection (the immune accounting); and keep selection alive *between* wholes — which is where evolution earns its chapter.

## Networks are priors; forks are mutations

A protocol version is a hyperprior: the agreements participants carry before any interaction. In [chapter 2](02-coupling.md)'s terms it is a family of typed session contracts; in the overview's terms it is the genome. That framing makes protocol change precise instead of catastrophic:

- **Backwards compatible** = a typed coercion exists at the boundary, so old and new agents still transact — protocol versions interoperate the way currency zones do, through an adapter with a spread. A **hard fork** is a boundary with no coercion: `χ` undefined.
- **Forward-pressuring** = the new version strictly dominates in surplus *for its adopters* without requiring global switchover. Adoption should be a ramp, never a cliff; network effects build cliffs by default, and ramp-engineering is a first-class protocol duty.
- **Merging** needs no mechanism at all, because [chapter 4](04-money.md) already is one: networks that trade accumulate each other's shares, cross-holdings align fitness, and the boundary thins until it stops mattering. Trade is merging in slow motion, and de-merging is symmetric.

Selection between networks is then real selection: a network whose priors detach from reality (dark room), concentrate (capture), or extract (cancer) loses predictive surplus and sheds members to rivals — *provided exit stays cheap.* That proviso is V4, and it has geometry: a healthy focal point sits in a basin that is **deep against unilateral defection and shallow against coordinated migration.** Portable shares, portable reputation, and content-addressed data keep the coordinated-migration wall low; demurrage keeps stock from becoming a hostage. ⚠️ Exit has a dark side that stays flagged: selection between networks can race to the bottom, and network effects raise the migration wall silently. Keeping exit cheap is an engineering requirement with no finish line.

## The guardrails, revisited

The earlier editions of this book kept a section called *where the frame could deceive us*. The frame has earned updates to each entry:

- **"Free energy explains everything, and that is suspicious."** Resolved by making the frame operational: the Alignment Invariant (every payment is a verified marginal loss-reduction against the shared reference — [Math Core §10.1](mathematical-core.md)) is a spec rule a mechanism either satisfies or fails. The metaphor no longer carries load; the invariant does.
- **"The metabolism unification is abstraction-level."** Downgraded, not closed: representations-as-policies reduces storage to amortized compute with a fidelity attribute, leaving one objective with per-term constants owed, rather than three unrelated markets.
- **"Two irreducible open problems: reflexivity and the autoimmune limit."** Unified into one: the **correlation-decomposition problem** ([ch. 5](05-immune.md)) — shared source, deference, payoff, fate, and truth, separated at finite richness. Still open; now singular, with a measurement program (the pilot's `L̂` and `Σ̂`).
- **"The identity trilemma is the bottleneck."** Dissolved rather than solved: strong-cheap-private constrained a single global credential, and no such credential exists anymore. Identity is a local, stake-scaled posterior over multiple evidence streams; the residue is estimator design, not trilemma.
- **"Exit's dark side."** Restated as basin geometry, above — measurable now, finished never.

What is *not* revisable is worth stating once, plainly. The priors — demurrage, log scoring, quadratic voting, every mechanism named in this book — are defaults, and the book's real claims are the conditions on the refinement loop: sound protocols, incentive-compatible play, self-measurement, evolvability, and the five viability conditions those imply. Any network violating them detaches from reality or gets captured, whatever its mechanisms. Any network satisfying them can outgrow every default this book shipped.

📐 Formal treatment: [Mathematical Core §7](mathematical-core.md) (the viability envelope and the grand conjecture — the coupled stability proof that remains the design's open centerpiece), [§10](mathematical-core.md) (the working extensions).

---

The list from [the overview](overview.md) is crossed off, and no job required hiring a somebody. What this book ships is a genome, not a guarantee: good priors, a metabolism that pays to improve them, an immune system for the ways they corrupt, and cheap exit so that better genomes can win. Whether the organism lives is [one conjecture](mathematical-core.md) with five named conditions — and the way to find out is to grow one.
