# 7 · Evolution
> 🤖 *AI-drafted, human-directed — [what that means](ai-disclosure.md).*

The schism arrives in year five, as schisms do. It isn't even about crochet in the end — it's about the demurrage floor, of all things, and a faction that wants it lower, and a weekend of arguments that produce no agreement but do produce a fork announcement. Half the circle is leaving to run their own network, with different money and looser rules.

On every platform you've ever used, this is where the story turns tragic: the archive stays with whoever holds the keys, the schismatics start from nothing, and both halves spend a year poorer. Here, something else happens, and the fact that it *can* is the last thing this book has to explain. The leavers take their reputations (portable logs, recomputable by anyone). They take their shares (the treasury splits along the cap table, since demurrage made stock a weak hostage). They take the archive (content-addressed; it was never anyone's to withhold). The two networks keep trading — a boundary appears where the coupling thinned, with an exchange rate on it — and eighteen months later, when the low-floor experiment has produced exactly the concentration this book predicted, most of the leavers drift back through that boundary without ceremony, because trade had quietly kept the door open. Nobody wins the schism. Both sides survive it. That's the design working.

## What we actually built

Look back at the whole descent and notice how little machinery there is. One loop: spend to reduce uncertainty until confident enough for the stakes. One move: couple where surplus beats cost, explicitly and reversibly. One payment rule: reward equals verified improvement over the shared reference. One accounting: weight follows independence, and correlation gets decomposed rather than ignored. Seven chapters of chat-app yak-shaving compress into four sentences — and that compression is not a flourish, it's the survival strategy. Small things can be reasoned about. Things that can be reasoned about can be safely changed. And *changed* is the point, because every mechanism in this book is a shipped prior, and priors are meant to be outgrown.

The organism frame from the [overview](overview.md) can now be cashed out organ by organ:

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

Perception and action are one calculus pointed opposite ways — the slow market changes beliefs to match the world, governance changes the world to match beliefs — and chapter 5's `L < 1` is the condition keeping that motor coupled to reality rather than idling in a dark room.

Why does the commons hold? For the reason it holds in biology, which solved Moloch several times before we named him. The tragedy of the commons is a multipolar trap, and every escape evolution found was the same move — a *major transition*: a higher-level individual emerges whose own fitness depends on the commons, and which can discipline its constituents. Genes into chromosomes, cells into bodies, insects into colonies. The stability conditions for that move read like this book's table of contents: align constituent fitness with the whole (the market pays for work the network demands; cross-holdings entangle welfare), suppress internal defection (the immune accounting), and keep selection alive *between* wholes. That last one is this chapter, and it is the one modern platforms fail hardest.

## Forks are typed; mergers are gradual; exit is geometry

A protocol version is a hyperprior — the genome cells carry before any interaction. Framing it that way makes protocol change precise instead of catastrophic:

- **Backwards compatible** means a typed coercion exists at the boundary ([chapter 2](02-coupling.md)'s session types), so old and new agents still transact — versions interoperate the way currency zones do, through an adapter with a spread. A **hard fork** is a boundary with no coercion: `χ` undefined, the door actually closed.
- **Forward-pressuring** means the new version strictly dominates *for its adopters* without demanding global switchover. Adoption should be a ramp; network effects build cliffs by default, and ramp-engineering is first-class protocol work, not marketing.
- **Merging**, as [chapter 4](04-money.md) showed, needs no mechanism at all. Networks that trade accumulate each other's shares; fitness aligns through the cap table; the boundary thins until it stops mattering. Our schismatics came home this way, and never signed a thing.

Selection between networks is then real selection: a network whose priors detach from reality (dark room), concentrate (capture), or extract (cancer) loses predictive surplus and sheds members to rivals — *provided exit stays cheap*. That proviso is V4, and it has a geometry worth memorizing: a healthy focal point sits in a basin that is **deep against unilateral defection and shallow against coordinated migration.** Portable reputation, portable shares, and content-addressed archives keep the migration wall low; demurrage keeps stock from becoming a hostage. ⚠️ And exit has a dark side we can only flag, not dismiss: selection between networks can race to the bottom, and network effects raise the migration wall silently, year by year, with no announcement. Keeping exit cheap is an engineering requirement with no finish line — the treadmill is the job.

## The guardrails, revisited

Earlier editions of this book kept a section called *where the frame could deceive us*. The frame has since earned an update to every entry, which we record partly as progress and partly as a warning about how good this frame is at explaining things:

- *"Free energy explains everything, which is suspicious."* Fixed by making it operational: the Alignment Invariant ([Math Core §10.1](mathematical-core.md)) is a spec rule a mechanism either satisfies or fails. The metaphor stopped carrying load; the invariant carries it.
- *"The metabolism unification is abstraction-level."* Downgraded, not closed: representations-as-policies reduces storage to amortized compute with a fidelity attribute, leaving one objective with constants owed rather than three unrelated markets.
- *"Two irreducible problems: reflexivity and the autoimmune limit."* Unified into one — the correlation-decomposition problem ([ch. 5](05-immune.md)) — which is still open, but singular, with a measurement program attached.
- *"The identity trilemma is the bottleneck."* Dissolved rather than solved: strong-cheap-private constrained a single global credential, and no such credential exists anymore. What remains is estimator design.
- *"Exit's dark side."* Restated as basin geometry, above. Measurable now. Finished never.

And what is *not* revisable, stated once, plainly: the priors are defaults — demurrage, log scoring, quadratic voting, all of it — but the conditions on the refinement loop are the book's actual claims. Sound protocols, incentive-compatible play, self-measurement, evolvability, and the five deaths those imply. A network that violates them detaches from reality or gets captured, whatever mechanisms it runs. A network that satisfies them can outgrow every default we shipped, and should.

📐 Formal treatment: [Mathematical Core §7](mathematical-core.md) — the viability envelope and the grand conjecture, the coupled stability proof that remains the design's open centerpiece — and [§10](mathematical-core.md).

---

Six years ago the plan was one line long: *Discord but decentralized and better.* What it took was a machine that audits its own memory, receipts that became clocks, a market with one commodity, money that melts, an immune system for correlation, a voting rule that prices Dana, and a theory of schisms. The circle got its chat app, for whatever that's worth now; the archive will outlive the company that once hosted it, and the next forty-person community won't have to invent the universe first, because the priors ship in the box. Whether the organism *lives* — whether the coupled whole is stable — is [one conjecture](mathematical-core.md) with five named conditions, and there is only one way to find out. It was never just a chat app. But it did start as one, and we think that's the right way around.
