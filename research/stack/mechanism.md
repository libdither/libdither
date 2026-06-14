# Retroactive Consensus Markets

> *Part I · The Engine — Chapter 2*

Conventional prediction markets bind three things that need not be bound: (i) eliciting a forecast, (ii) declaring what actually happened, and (iii) paying out. This mechanism **decouples elicitation from resolution and reward**.

Forecasters merely publish timestamped probability distributions. Each capital holder ("resolver") privately declares, whenever they like, what they believe happened, and an automated proper-scoring rule retroactively scores every forecaster *against that resolver's own ground truth*. Forecasters are therefore paid for predicting the **future consensus of resolvers** — which, under a shared-reality assumption, is a proxy for predicting future common knowledge. The same engine doubles as a **skill ranking** of forecasters, which can later weight votes in a governance system.

## The primitives

- A set of questions $q \in Q$, each with an outcome space $\Omega_q$.
- Each forecaster $i \in P$ publishes, at times $t$, a **timestamped distribution** $p_{i,q,t} \in \Delta(\Omega_q)$ — their belief about $q$ at time $t$. (Timestamps must be tamper-evident; see [A4](assumptions.md).) Forecasters stake *information*, not money.
- Each resolver $j \in F$ may, at a time of their choosing, declare a **subjective resolution** $r_{j,q} \in \Omega_q$ — their own private verdict on what happened. Declaration is optional and revisable; a resolver may simply **discard** any question they find ambiguous or manipulated.
- A **strictly proper scoring rule** $S(p, \omega)$ (canonically the log score $S(p,\omega) = \ln p(\omega)$), whose defining property is that reporting one's true belief uniquely maximizes expected score.

## The reward rule

Score forecaster $i$ against resolver $j$'s verdict on question $q$, *relative to a reference belief* $p^{\text{ref}}$ (e.g. the consensus belief just before $i$'s update):

$$\rho_{i,j,q} = \sum_t w_t \left[\, S(p_{i,q,t},\, r_{j,q}) - S(p^{\text{ref}}_{q,t},\, r_{j,q}) \,\right]$$

- The **reference subtraction** is Hanson's *market scoring rule*: a forecaster is paid for the *marginal* movement of belief toward the eventual verdict. You profit only by being **right and different from the crowd** — the formal version of "surprising and true." Echoing consensus earns nothing; moving belief the wrong way costs.
- $w_t$ can up-weight *earlier* forecasts, further rewarding being right *before* it was common knowledge.

Forecaster $i$'s **reputation with respect to resolver $j$** is $R_{i,j} = \sum_q \rho_{i,j,q}$. Resolver $j$ distributes a reward budget $B_j$ across forecasters as a monotone function of $R_{i,j}$. Equivalently: an automated market maker retroactively "places bets" on each forecaster's behalf using their published probabilities, then settles against $j$'s verdict.

The structural facts that make this work:

- Resolution is **subjective** (per-resolver), **retroactive** (scored after the fact), **optional**, and **revisable**. No global instant of truth exists to attack.
- Forecasters are ranked *relative to each resolver's worldview* — no claim of objective truth, only skill at predicting a given resolver's eventual verdicts.

## What it incentivizes — the consensus-proxy claim

**Proposition (informal).** Suppose a forecaster is risk-neutral, cannot influence resolutions, and maximizes total expected reward $\sum_j B_j \cdot \mathbb{E}[\rho_{i,j,q}]$. Because $S$ is strictly proper and the objective is linear in $S$, the uniquely optimal report is the **budget-weighted predictive distribution of resolvers' eventual verdicts**:

$$p^*_{q,t} = \sum_j \frac{B_j}{\sum B}\, \Pr\!\left[\, r_{j,q} = \cdot \,\middle|\, \text{information at } t \,\right]$$

In words: the money-optimal strategy is to forecast **what the capital-weighted population of resolvers will eventually conclude.** Under shared reality ([A1](assumptions.md)) that population converges, so this is a proxy for **future common knowledge**. Forecasters keep updating, because stale beliefs decay their reputation relative to peers.

This yields two outputs at once:

1. A live, aggregated **forecast** of future resolver consensus on every question — a shared, evolving world-model.
2. A **skill ranking** $\{R_{i,j}\}$ identifying *who* reliably predicts that consensus, usable downstream as voting weight.

## Properties

- **No exploitable resolution.** Each resolver settles privately, retroactively, and can discard bad questions — so there is no single oracle to bribe, no point-in-time ambiguity to exploit, and no forced verdict on genuinely unresolved questions. This defeats failure modes (2) and (3) from [the previous chapter](the-problem.md).
- **Optimization power without real-money risk.** Reward is real but paid *retroactively by resolvers who chose to pay*, decoupled from a zero-sum betting pool — addressing failure mode (1) without importing the fragility of (2)–(3).
- **Manufactures common knowledge.** Given existing common knowledge of *resolutions*, the mechanism computes a new common knowledge of *resolution-forecasts* — and identifies who is best at producing it.
- **Predicting ≈ deciding.** Those who best predict future consensus are often those best positioned to say what is worth doing. The skill ranking can therefore weight a *voting* system, biased toward demonstrated forecasters to whatever degree a resolver desires.

To see all of this in motion on a single concrete question, read [the worked example](worked-example.md). The premises it leans on are catalogued in [The Five Assumptions](assumptions.md).

## Open problems {#open-problems}

The mechanism's load-bearing risks. Each is taken up and either answered or reduced to a measurable quantity later in the book — status tags below.

1. **Reflexivity / beauty contest** ([A5](assumptions.md)). If the skill ranking feeds back into the votes that constrain resolvers, forecasters may be predicting an equilibrium they help create. This breaks properness and admits self-fulfilling but false focal points. *Convergence to truth vs. to a stable falsehood is the central theoretical gap.*
   → Answered in principle: [Reflexivity and the Dark Room](reflexivity.md) / [Mathematical Core](mathematical-core.md) §2. Linear herding is harmless; danger is a bifurcation at deference slope $L=1$, which is measurable and controllable.
2. **Resolver honesty is unmodeled.** Nothing forces honest resolution once verdicts gate public money.
   → Reduced to an inequality: [Mathematical Core](mathematical-core.md) §2.4.
3. **Manufactured surprise.** A poorly chosen reference can reward contrarianism for its own sake.
   → Mitigated by construction (lagged-consensus reference, frozen budgets): [Mathematical Core](mathematical-core.md) §2.5.
4. **Collusion / Sybil.** Resolver–forecaster collusion, or Sybil forecasters farming the reference subtraction.
   → Reframed and substantially answered: [Sybil Resistance Is Independence](independence.md) / [Mathematical Core](mathematical-core.md) §3.
5. **"Reward by extrapolated intention/utility."** Rewarding the *extrapolated value* of information when verdicts are late — a desideratum, not yet an operator.
   → Defined: [Mathematical Core](mathematical-core.md) §2.5.
6. **Causal resolution.** Verdicts must be ex-post counterfactual contrasts, not raw conditional outcomes, or the scoring rule lends authority to a confounded judgment (futarchy's flaw).
   → [Futarchy and Causality](futarchy-causality.md).
