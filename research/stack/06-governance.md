# 6 · Governance
> *AI-drafted, human-directed — [what that means](ai-disclosure.md).*

The crochet question has been open for two years.

Not for lack of facts. The circle's slow market can tell you, with calibrated confidence, how admitting the crochet people would change membership, treasury flow, and message volume — those are forecastable questions with eventual answers, and [chapter 3](03-market.md) prices them continuously. What it cannot tell you is whether the circle *wants* to be that kind of place. No evidence will ever arrive for that. In Schelling's terms, some focal points are **pinned** — reality eventually enforces them, and [chapter 5](05-immune.md)'s machinery exists to keep the pin in — and some are **free**: equilibria among many, where a community simply has to choose. Facts are pinned. Values are free. Governance is the discipline of choosing your free focal points on purpose, instead of inheriting them from whoever shouted first.

(In the three-timescale picture from the [overview](overview.md), this is the middle loop: the market refines beliefs automatically, evolution replaces whole rulebooks slowly, and governance is the deliberate refinement in between — the priors that evidence can't update, updated anyway.)

## Split the decision where it wants to split

- **Facts go to the market.** "To what degree would policy X advance goal G" is forecastable, resolvable in hindsight, and already has a price.
- **Preferences stay personal, and quadratic.** Which goals matter is voted, with intensity: casting `v` votes costs `v²` credits, so caring more counts more but shouting scales badly. Quadratic voting's textbook weakness — split your credits across `k` puppets and mint `√k` extra influence — dies at the door here, because credits issue per unit of `n_eff`. The spam wave from last chapter gets, collectively, one member's worth of credits, which rather takes the fun out of it.

A member who cares about goal G backs it with credits and needs no expertise; the market supplies the live estimate of which policies serve G; spending follows. Values from people, facts from the machine, each guarded by the machinery built for it.

## The Dana problem

Every community has a Dana. Dana reads the proposals, Dana understands the treasury, and somewhere in year two, half the circle quietly adopted the policy of voting however Dana votes. Liquid-democracy designs treat this as a feature to be maximized; independence accounting treats it as a correlation to be priced; both, it turns out, are right, and the pricing writes itself.

Under QV, `k` *independent* aligned voters with budget `c` each cast `k√c` votes. A bloc that pools everything into Dana casts `√(kc)`. Those are the two endpoints of the independence spectrum, and one formula interpolates:

```
votes(bloc)  =  √( n_eff(bloc) · pooled credits )
```

At `ρ = 1` — one mind, many wallets — it yields `√(kc)`. At `ρ = 0` — many minds, one banner — it yields `k√c`. Delegation needs no new mechanism at all: it's *voluntary* correlation, priced by the same accounting that prices the involuntary kind. And the bloc's position on the spectrum is measurable, because delegators leave statistical fingerprints: the ones who occasionally override Dana, or split their delegation, or diverge on unrelated questions, demonstrably formed their own preferences and pull the bloc toward `k√c`; pure rubber stamps converge to `√(kc)`. Dana's influence levels off exactly as fast as Dana's followers stop thinking. There is something almost pastoral about the incentive this creates. ⚠️ Almost: the estimator mustn't reward *performative* disagreement, and designing it so it doesn't is open ([coupling note](notes/coupling-and-merging.md)).

Two axes fell apart in that analysis, and keeping them apart resolves an old confusion. **Distinctness** — is this one source or several — is chapter 5's question. **Trust** — do I want shared fate with you — is chapter 2's `κ`, accumulated from history. You delegate to those you trust; the system prices what that does to distinctness. Someone can be verifiably singular and still not worth co-governing with, and the machinery has always known the difference even when our prose didn't.

## The prohibition

One rule in this chapter is load-bearing, and it's a *thou shalt not*: **a market estimate must never be wired mechanically into allocation.** "Fund whatever the conditional forecast favors" rebuilds futarchy, and futarchy's flaw is structural, not incidental — conditional forecasts measure correlation, decisions need causation, and for the branch not taken there is never an observation. So estimates stay evidence, weighed by humans who keep the final judgment; resolution prompts ask for counterfactual contrasts ("did X help, *relative to no-X*?"); and a resolver's right to discard a hopelessly confounded question is causal hygiene, not laziness. The full argument, including exactly where the impossibility theorem does and doesn't bite this design, lives in [Futarchy and Causality](futarchy-causality.md); its residue is viability condition V5.

## Governance as maintenance

Strip the drama away and most governance, most of the time, is tending set-points: the demurrage floor against measured concentration ([chapter 4](04-money.md)), question budgets against decision-relevance, funding for the open coordination models ([chapter 3](03-market.md)). Each is a feedback loop with a slow sensor — verdicts take months — and the engineering rule from the money chapter generalizes: move set-points slowly, from filtered signals, with slew limits, and let fast local mechanisms absorb the shocks. A constitution, on this view, is a controller specification, and most constitutional crises are oscillation. ⚠️ Stability regions unmapped; [open question Q8](open-questions.md) is the first simulation owed.

The right first deployment is the mirror test: the network governing its own development. Quadratic votes over [roadmap](roadmap.md) goals, the market estimating which work advances them, contributor funding following the estimates *as evidence*. If the machinery can't govern its own repository, it has no business governing anything else.

📐 Formal treatment: [Mathematical Core §10.2](mathematical-core.md); [Futarchy and Causality](futarchy-causality.md).

---

The crochet question finally gets its vote (they're in; Dana abstained, to everyone's surprise), the treasury moves by rules nobody can buy, and the circle can steer. One question left, and it's the oldest one in evolution's book: what happens when the rules themselves — this book included — turn out to be wrong? [Chapter 7](07-evolution.md).
