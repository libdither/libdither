# Working Note · Protocols as Priors

> 🧪🤖 **Working note** (AI-drafted — [provenance](../ai-disclosure.md)). Source material for the rewritten [Overview](../overview.md), [Coupling](../02-coupling.md), and [Evolution](../07-evolution.md) chapters, and the frame for the whole v4 book.

## The reframe

**An institution is a shared prior over joint behavior.** Two humans who have never met can cooperate because evolution and culture pre-loaded them with agreements: reciprocity norms, fairness instincts, what counts as salient. Schelling focal points work only because salience is prior-relative. A protocol is exactly this artifact for machines — shipped, pre-agreed expectations about what messages mean, what counts as defection, and which equilibrium to play. Cooperation capital, delivered before any interaction.

This changes the book's epistemic posture. The mechanisms (demurrage, log scoring, quadratic voting, the δ floor) stop being claims of correctness and become **good shipped priors with explicit update paths**. Even the protocol is not global truth; it is a shared prior that pays to become a better posterior.

## The three-timescale loop

| Timescale | Loop | What updates | Failure mode |
|---|---|---|---|
| fast (seconds–days) | **the market** — posterior updating | prices, routes, trust weights, model parameters | corrupted measurement (V1, V2) |
| medium (months–years) | **governance** — prior refinement | δ_min, scoring parameters, zone boundaries, funded models | captured refinement (V3) |
| slow (years–decades) | **evolution** — hyperprior iteration | protocol versions, new networks, forks | dead selection (V4), confounded action (V5) |

The biology maps exactly: genome = hyperprior, development = prior instantiation, lifetime learning = posterior. The five viability conditions redistribute as the ways each loop's refinement breaks.

The scoring rule already says the fast loop's half: `p_ref` **is** the prior, and every payment is payment for beating it. One invariant covers the whole economy:

> **The Alignment Invariant.** Every payment in the system is a verified marginal reduction in some identified stakeholder's expected loss, relative to the shared reference. (Market scoring rule: expected payment = Bregman-divergence improvement toward the verdict. Substrate market: profit = −ΔF. Aggregation weight: marginal precision. If a proposed mechanism's payment cannot be written this way, it is out of spec.)

Then: markets pay for beating the shared prior; governance chooses the priors that evidence cannot pin (values, parameters); evolution replaces the prior-generating machinery itself.

## Protocols as typed message-passing programs

The theory this wants exists: **multiparty asynchronous session types.** A protocol is a *global type*, projected to *local types* per role; well-typed processes provably satisfy session fidelity, deadlock-freedom, and progress. The Curry–Howard bridge (Caires–Pfenning; Wadler's *Propositions as Sessions*) makes session types linear-logic propositions and message-passing programs their proofs.

disp is an unusually good host:

- A protocol spec is a global session type = a **content-addressed tree**: protocols have hashes, versions diff, no registry needed.
- disp types are predicates, so sessions can be *dependent*: a message slot can require "a share-transfer signed by the sender whose balance covers it." Types-as-predicates-on-results extends to **types-as-predicates-on-transcripts**.
- The network API is already disp's effect algebra (`store/send/eval/price`); session types over that signature *are* the missing disp networking story — serialization and interaction discipline defined together.
- Causal entanglement makes every run's transcript hash-entangled: a protocol run is an **auditable proof object**, and behavioral disputes resolve by *bisection over the transcript*, exactly as computation disputes bisect reduction traces. A contract = session type + collateral + arbitration over the typed transcript. The κ field gets a concrete carrier: the set of live typed sessions between two parties.

## What makes a protocol good — four levels

1. **Sound** (logic): well-typed under the session discipline — fidelity, deadlock-freedom, progress; transcripts checkable against the type. Caveat carried openly: session types give safety, not liveness against *rational silence*; timeouts and abort-with-collateral are where incentives must take over.
2. **Incentive-compatible** (game theory): in the typed game (deviations within the type, plus silence/abort), intended play is an equilibrium; deviations are detectable (typed transcripts) and punishable (collateral, reputation). Distributed algorithmic mechanism design, with the Alignment Invariant as the bridge.
3. **Self-measuring** (statistics): the protocol's parameters are identifiable from its own transcripts — it emits the estimands needed to refine it (L̂, Σ̂, controller signals) — and online refinement has bounded regret. A protocol that cannot measure itself cannot serve as a refinable prior.
4. **Evolvable** (selection): new versions relate to old by **typed coercions at boundaries**. *Backwards compatible* = a coercion exists, so old and new agents still transact (protocol versions interoperate like currency zones; a hard fork is a boundary with no coercion — χ undefined). *Forward-pressuring* = the new type strictly dominates in surplus for adopters without requiring global switchover: adoption is a ramp, not a cliff.

## What stays fixed (the relativism defense)

If everything is a prior, is anything load-bearing? Yes: **the conditions on the refinement loop.** Priors vary and are meant to be outgrown; soundness, incentive-compatibility, self-measurement, and evolvability — with V1–V5 as their runtime expressions — are what the book actually asserts as true. The claim is never "demurrage is correct"; it is "any shipped prior whose refinement loop violates these conditions detaches from reality or gets captured."

## Open

- Instantiating MPST over disp concretely (projection, subtyping/coercion calculus, the timeout/abort discipline).
- The synthesis direction: given a session type as spec, synthesize the agent strategy (connects to disp's program-synthesis agenda).
- Formalizing "forward pressure" (surplus dominance along adoption gradients) game-theoretically; when do ramps exist at all?
