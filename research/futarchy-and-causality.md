# Futarchy, Causality, and Retroactive Consensus Markets

*Fourth analytical note. Evaluates the retroactive consensus market ([Retroactive Consensus Markets — Rigorous Synthesis](governance/retroactive-consensus-markets.md), [mathematical-core.md](mathematical-core.md)) against Dynomight's "Futarchy's fundamental flaw" (dynomight.net/futarchy). Question: does the conditional-vs-causal critique of futarchy sink our design, and if not, exactly which parts survive?*

---

## 1. Dynomight's flaw, stated precisely

Futarchy = make decisions with **conditional** prediction markets: run P(value | do action A) and P(value | do action B), take the action with the better conditional. The flaw:

> Conditional markets reveal **probabilistic** relationships P(Y | X=x), but decisions need **causal** ones P(Y | do(X=x)). These differ whenever there is reverse causality or confounding.

Five objections, in increasing depth:

1. **Reverse causality** — the conditioning event may be an effect, not a cause (a falling stock *causes* the firing).
2. **Confounding via revelation** — taking action A reveals information about the decision-maker (the board that fires Musk reveals hostility → predicts *other* value-destroying acts), so the conditional price reflects the action's *signal*, not its *effect*.
3. **Real-policy confounding** — same structure for policy (a no-fly-zone declaration prices in what it reveals about the leader's temperament, not just the policy's direct effect).
4. **Pre-commitment doesn't save you** — when a market *activates conditionally* on the decision, bidders condition on activation and order is not preserved (the trick-coin example: you bid more on the branch that cancels-and-refunds when unfavorable, because you're insured).
5. **Impossibility theorem** — no payout function of (bid, final price, outcome) can both force truthful bids *and* preserve causal information, given conditional cancellation.

Dynomight's own prescription: conditional markets are **not worthless** — treat them "like observational statistics: one piece of evidence, considered skeptically," never a standalone causal decision rule. The flaw *can* be fixed with causal-inference machinery, but "none are free."

---

## 2. Why our base mechanism is not the object the theorem is about

The impossibility theorem (objections 4–5) is a theorem about **decision markets with conditional cancellation**: one branch is taken, the other is refunded, and the selection-on-activation distorts bids. Three features of our design break that frame at the base layer:

- **Decoupling.** Forecasters publish timestamped distributions and are scored by a proper rule against resolver verdicts. They do **not** bet in a pool with refunds. There is no zero-sum activation branch to be insured against. For any **unconditional** question ("will Health be high in 2030?") this is pure forecasting; proper scoring is truthful; the theorem is simply irrelevant.
- **Retroactive, optional, per-resolver resolution.** There is no single point-in-time mechanical resolution. Resolution happens later, by a human, who may decline.
- **The target is resolver consensus, not an observed outcome.** The market predicts *what thoughtful resolvers will eventually judge*, not a mechanical readout of a price or statistic.

So the base layer (elicitation + aggregation) is **not** a decision market and does **not** inherit the impossibility result. What it produces is exactly the object Dynomight *endorses*: an aggregated observational/expert-judgment instrument. The flaw can only re-enter where we **close the loop** — wire a conditional forecast mechanically into a decision. That is the governance application, §4.

---

## 3. The key move: retroactivity converts an *impossibility* into a *competence requirement*

Dynomight assumes resolution is **mechanical and ex ante**: the market resolves on an observed outcome (the realized stock price, the realized death rate), and that observed outcome is confounded. Against mechanical resolution, the flaw is a *theorem* — provably unfixable by any payout function.

Our resolution is **judgmental and ex post**: a resolver, with hindsight and data, declares a verdict. The decisive consequence:

> The causal question is relocated from **ex-ante market pricing** (where Dynomight proves it cannot be solved) to **ex-post human judgment** (where it is merely hard — and where causal inference tools actually work: RCTs, natural experiments, synthetic controls, difference-in-differences all operate ex post).

Concretely, the resolver is asked a **counterfactual contrast**, not a raw conditional: not "was Health high after X?" but "relative to the no-X counterfactual, did X advance Health?" A resolver in 2030, with five years of data and comparison jurisdictions, can attempt P(Health | do(X)). A forward market pricing P(Health | X) in 2025 cannot. **Retroactivity is not incidental to the mechanism; it is the structural feature that sidesteps the impossibility result**, by deferring the causal question to the time and the agent where evidence exists.

The price of this move is honest and specific: we trade a *provable impossibility* for a *load-bearing assumption* — that resolvers judge counterfactually and competently. Impossible becomes hard. That is a good trade, but it must be named as a soundness condition (§6).

---

## 4. Where the flaw fully survives: the governance coupling

The Ultimate Governance application says voters back "policies that require sub-policies to be **structured around** the market's estimates" — e.g. "to what degree does policy X advance goal Health?" Read mechanically — *fund X iff the conditional market says X advances Health* — this **is** futarchy and inherits objections 1–5 in full, including the impossibility theorem, because:

- It is a conditional question (Health **given** X).
- For the **untaken** branch (Health given ¬X, when X is enacted) the counterfactual world is never observed, so that branch is structurally unresolvable-by-observation — exactly the cancellation asymmetry the theorem formalizes. Our design does not *refund* it (so the trick-coin insurance distortion is removed), but it must resolve it by **resolver best-guess**, importing resolver judgment error in place of a clean order-violation.

The remedy is a hard design rule, and it is Dynomight's own prescription:

> **The market output is an observational instrument feeding human causal judgment, never a mechanical decision rule.** Voters set preferences (QV over goals) and use market estimates as *skeptically-weighted evidence*; the human preference/judgment loop stays open. The moment governance hard-wires "allocate ∝ conditional estimate," we recreate the flaw.

This is the same loop-closure danger as reflexivity (§5), and the same fix: keep perception (market) and action (allocation) coupled through human judgment, not through a mechanical identity.

---

## 5. Dynomight's flaw and our reflexivity condition are the same shape

Both critiques say: **a market measures what it is scored against, which need not be what you want.**

- Dynomight (against observed outcomes): you get P(Y|X), you wanted P(Y|do X).
- Ours (against resolver verdicts, [mathematical-core.md](mathematical-core.md) §2): you get *predicted resolver consensus*, you wanted *truth* — and if resolvers defer to the market (deference slope L→1), the loop self-fulfills.

They compound. Our causal validity is **upper-bounded by resolver causal competence** and **degraded below it by reflexivity**:

```
causal validity  ≤  (resolver counterfactual competence)  −  (reflexivity loss, growing in L)
```

The system can faithfully aggregate and forecast expert causal judgment (valuable — a continuous, incentivized, n_eff-weighted panel of careful retrospective evaluators); it **cannot exceed** the causal quality of those evaluators, and it can fall short of it if the deference loop closes. It is not a causal oracle, and we should never market it as one.

---

## 6. New soundness condition: causal resolution (V5)

The viability envelope ([mathematical-core.md](mathematical-core.md) §7) gains a fifth inequality, dual to V1:

```
(V5) Causal resolution:  verdicts are counterfactual contrasts judged ex post with evidence,
                          not raw conditional outcomes.
     Failure mode: the rule perfectly incentivizes predicting a CONFOUNDED judgment,
     lending false proper-scoring authority to a correlation. Worse than no system.
```

V5 has concrete, testable mechanisms — and several fall out of features the design *already has*:

1. **Counterfactual question framing.** Resolution prompts ask "effect relative to the counterfactual," and the resolution UI supplies the counterfactual scaffolding (comparison units, pre-trends).
2. **Optionality as causal hygiene** *(already in the mechanism)*. Resolvers may **discard** questions they judge hopelessly confounded ([truth-markets §3.1](governance/retroactive-consensus-markets.md#31-primitives)). Forecasters won't be paid for predicting confounded conditionals because thoughtful resolvers won't resolve them → causally-hopeless questions are **endogenously deprioritized**. Double-edged: the system goes quiet exactly on the hardest causal questions, which may be the most decision-relevant.
3. **Per-resolver independence as robustness** *(already in the mechanism)*. No single confounded resolution; you predict a *distribution* of independent counterfactual judgments, n_eff-weighted (§3 of the math core). Independent errors wash out; *shared* confounders (every resolver fooled the same way) do not — so V5 failures are correlated-error failures, and the n_eff immune machinery partially detects them (a confounded consensus looks like a low-independence bloc).
4. **Slow payout buys causal evidence** *(the user's "distributed slowly over time")*. Because resolution is not pinned to an instant, the resolver can **wait for causal evidence to arrive** — the natural experiment to mature, the RCT to publish — before declaring. Slow distribution does not fix confounding at the mechanism level; it grants the time and removes the single attackable resolution instant that makes ex-ante markets fragile.

---

## 7. Scorecard: each objection against our design

| # | Objection | Verdict on our design |
|---|---|---|
| 1 | Reverse causality | **Relocated, not eliminated.** Bites the resolver's judgment, not the mechanism. Mitigated by ex-post counterfactual framing (V5); resolver in hindsight can see which way causation ran. |
| 2 | Confounding via revelation (decision-maker signal) | **Relocated to resolver.** Resolver can be asked to isolate X's own effect ("ignoring what else the administration did"). Whether they *can* is the V5 competence assumption — honestly hard. |
| 3 | Real-policy confounding | Same as 2. |
| 4 | Activation-selection distortion (trick coin) | **Base layer: does not apply** (no conditional refund; decoupled proper scoring). **Governance layer: structurally present** for counterfactual branches, but handled by resolver best-guess rather than refund — removes the *insurance* distortion, imports *judgment* error. |
| 5 | Impossibility theorem | **Base layer: out of scope** (not a decision market). **Governance layer: converted from impossibility to V5 competence requirement** by ex-post human resolution (§3). The mechanical version remains impossible; we don't run the mechanical version. |

---

## 8. Bottom line

Dynomight is right, and the critique improves our design rather than refuting it:

- **Vanilla futarchy resolves mechanically and closes the loop → it hits the impossibility wall.** Our design **resolves judgmentally ex post and keeps the loop open → it lands, by construction, in the "useful observational instrument, considered skeptically" regime that Dynomight explicitly endorses.** In a real sense the retroactive consensus market is *futarchy built the only way Dynomight says it could work*.
- **The single most important design rule that follows:** never let governance convert a conditional market estimate into a mechanical allocation. Market = perception (evidence); humans = action (preference + final causal judgment). This is identical to the V1 anti-reflexivity rule and should be enforced as one principle.
- **The single new soundness condition (V5):** the system's causal validity is capped by resolver counterfactual competence. The proper-scoring machinery is dangerous precisely because it can lend rigorous-looking authority to a perfectly-predicted *confounded* judgment. Resolution methodology (counterfactual framing, discard rights, waiting for evidence, independence weighting) is therefore not a detail — it is a first-class soundness layer, co-equal with the scoring rule.

What we cannot claim: that the market *produces* causal knowledge. What we can claim: that it **incentivizes, aggregates, and forecasts the counterfactual judgments of an independent panel of careful ex-post evaluators**, at scale, with no single attackable resolution instant — and that this is the best a market can do, given that Dynomight proved the mechanical alternative impossible.
