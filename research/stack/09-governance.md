# 9 · Governance

The network eventually has to *do* things. Fund one protocol upgrade over another. Set the demurrage floor of [chapter 6](06-money.md). Spend a community pool. Today those calls are made by whoever sits on the foundation board, or by token-weighted voting, which is the same thing with extra steps. And the two naive alternatives fail in mirror-image ways: pure preference voting ignores facts (majorities happily back policies that won't work), while pure expert rule ignores values (nobody elected the model).

Split the decision along the seam where they fail.

**Facts go to the truth machine.** "To what degree would policy X advance goal G?" is a forecastable question with an eventual, judgable answer, and [chapter 7](07-truth.md) already pays the best-calibrated people to keep answering it.

**Preferences stay personal.** Which goals *matter* — health versus growth versus privacy — is voted, not forecast. The vote is quadratic: expressing intensity costs quadratically, so caring more counts for more but shouting doesn't scale. Quadratic voting's classic weakness is the Sybil attack (split your credits across $k$ accounts and mint $\sqrt{k}$ extra influence), and [chapter 1](01-identity.md) closes it: credits are issued per unit of $n_{\text{eff}}$, so a puppet cluster receives one member's credits no matter how many faces it wears.

A voter who cares about goal G backs it with credits; the market supplies the live estimate of which candidate policies advance G; expenditure follows. The voter needs no domain expertise, only values. That is the point.

One rule is load-bearing, and it is a prohibition: **the market's estimate must never be wired mechanically into allocation.** "Fund whatever the conditional forecast favors" rebuilds futarchy, and futarchy has a documented flaw: conditional forecasts measure correlation while decisions need causation, and for the policy branch not taken there is no observation at all. So the estimate stays evidence, weighed by humans who keep the final judgment. Verdicts are asked as counterfactual contrasts ("did X help, relative to no-X?"), and a resolver's right to discard hopeless questions is causal hygiene, not laziness. The full argument, including where the impossibility theorem does and does not bite this design, is in [Futarchy and Causality](futarchy-causality.md); its one-line residue is viability condition V5.

⚠️ Open: delegation. Liquid democracy composes badly with independence accounting, because delegating *is* voluntarily correlating with your delegate, which the immune system reads as reduced weight. Delegating fact-finding to the market is fine — that is the design. Liquid delegation of *preferences* has no settled semantics here yet, and credit issuance schedules and collusion resistance beyond the $n_{\text{eff}}$ gate are sketches.

The first real deployment should be the system governing its own development: quadratic votes over [roadmap](roadmap.md) goals, the market estimating which work advances them, contributor funding following. The self-reliance tenet, exercised early and small.

---

Every job from [the list](overview.md) now has a design with nobody in charge. What's left is the question of whether ten designs are ten systems, or one. That is [chapter 10](10-organism.md).
