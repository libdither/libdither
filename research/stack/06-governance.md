# 6 · Governance

Some questions the network can settle by paying for evidence: *will this upgrade cut latency; did that grant matter.* Reality eventually pins them, and [chapter 3](03-market.md)'s slow segment prices the pinning. Other questions reality will never pin: *does the network care more about privacy or throughput; how high should the demurrage floor sit; which goals deserve the communal pool.* In Schelling's terms, the first kind are **pinned focal points** — the machinery of [chapter 5](05-immune.md) exists to keep them pinned — and the second kind are **free focal points**: equilibria among many, where the coalition must simply choose.

Governance is the discipline of choosing free focal points on purpose, instead of inheriting them by drift. In the three-timescale picture from the [overview](overview.md), it is the medium loop: deliberate refinement of the shipped priors that the fast market cannot refine on its own.

## Split the decision where it wants to split

- **Facts go to the market.** "To what degree would policy X advance goal G" is forecastable, resolvable in hindsight, and already priced continuously by the slow segment.
- **Preferences stay personal, and quadratic.** Which goals matter is voted. Under quadratic voting, casting `v` votes costs `v²` credits, so intensity counts but shouting scales badly. Its classic weakness — split your credits across `k` puppets and mint `√k` extra influence — dies at the door, because credits are issued per unit of `n_eff` ([chapter 5](05-immune.md)): a puppet cluster receives one member's credits however many faces it wears.

A voter who cares about goal G backs it with credits and needs no domain expertise; the market supplies the live estimate of which policies advance G; expenditure follows. Values from people, facts from the market, each guarded by the machinery built for it.

## Delegation, priced by the accounting that already exists

Liquid delegation used to be this design's open sore: delegating *is* voluntarily correlating with your delegate, and the immune system discounts correlation. It turns out that is the answer rather than the problem. Under QV, `k` independent aligned voters with budget `c` each cast `k√c` votes; a bloc that pools everything into one delegate casts `√(kc)`. Those are the two endpoints of the independence spectrum, and one formula interpolates:

```
votes(bloc)  =  √( n_eff(bloc) · pooled credits )
```

At `ρ = 1` (one mind, many wallets) it yields `√(kc)`; at `ρ = 0` (many minds, one banner) it yields `k√c`. Delegation needs no new mechanism: it is voluntary correlation, priced exactly like involuntary correlation. Better, the position on the spectrum is *measurable* — delegators who sometimes override or split their delegation demonstrate independent preference-formation and earn toward the high end; blind followers converge to the low end. ⚠️ The measurement must not reward performative disagreement; designing the preference-independence estimator without that incentive is open ([coupling note](notes/coupling-and-merging.md)).

Note the two axes this exposes, which earlier drafts blurred: **distinctness** (is this several sources or one — chapter 5's question) and **trust** (do I want shared fate with you — chapter 2's κ). You delegate to those you trust; the system prices what the delegation does to distinctness. Someone can be verifiably singular and still not worth co-governing with; the axes are independent, and both are already measured.

## The prohibition

One rule is load-bearing, and it is negative: **a market estimate must never be wired mechanically into allocation.** "Fund whatever the conditional forecast favors" rebuilds futarchy, and futarchy's documented flaw is structural: conditional forecasts measure correlation, decisions need causation, and the branch not taken is never observed. So estimates remain evidence weighed by humans who keep the final judgment; resolution prompts ask for counterfactual contrasts ("did X help, relative to no-X?"); and a resolver's right to discard a hopelessly confounded question is causal hygiene. The full argument, including where the impossibility theorem does and does not bite, is [Futarchy and Causality](futarchy-causality.md); its residue is viability condition V5.

## Governance as controller

The concrete recurring act of governance in this design is tending set-points: the demurrage floor `δ_min` against measured concentration ([chapter 4](04-money.md)), question-budget weights against decision-relevance, funding for the open coordination models ([chapter 3](03-market.md)). Each is a feedback loop whose sensor is slow — verdicts take months — and the engineering rule from the money chapter generalizes: move set-points slowly, from low-pass-filtered signals, with slew limits, and let fast local mechanisms absorb shocks. A constitution, in this frame, is a controller specification. ⚠️ Stability regions unmapped; [open question Q8](open-questions.md) is the first simulation owed.

The first real deployment should be reflexive: the network governing its own development — quadratic votes over [roadmap](roadmap.md) goals, the market estimating which work advances them, contributor funding following. Self-reliance exercised early and small.

📐 Formal treatment: [Mathematical Core §10.2](mathematical-core.md) (the delegation formula); [Futarchy and Causality](futarchy-causality.md) (V5).

---

The coalition can now choose its priors deliberately. One question remains, and it is the book's last: what happens when the priors themselves — the protocol, the mechanisms, this design — turn out to be wrong? That is [chapter 7](07-evolution.md).
