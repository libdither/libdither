# 5 · The Immune System

Three attacks, apparently unrelated. A stranger joins your zone as forty enthusiastic newcomers, and the drip, the votes, and the witness quorums all count them forty times. A question's forecast drifts to 0.9, resolvers glance at it before recording verdicts, and the market begins predicting itself while the actual answer stops mattering. A wealthy bloc quietly coordinates verdicts and buys the floor down in the zone where its capital sits.

One problem wears all three costumes: **mismanaged correlation.** The Sybil's accounts are correlated because they share a controller. The self-believing market's resolvers are correlated because they share a *deference channel*. The captured bloc is correlated because it shares a payoff. The immune system is one toolkit — measure correlation, decompose it, and make weight follow independence — applied to all three.

## Counting strangers without a registry

Start with the Sybil, because the counter to it is the toolkit's core. "Is this account a distinct person" is a question only an authority can answer, so ask the answerable one instead: **how much independent information does this participant contribute?**

Watch behavioral residuals — what remains of forecast errors, transaction timing, and service patterns after subtracting everything explainable by public information. Distinct strangers' residuals wander independently; a puppeteer's accounts stay correlated however carefully scripted, because they share private state. For a cluster of `k` accounts with mutual correlation `ρ`, the independent-voice count is

```
n_eff = k / (1 + (k−1)·ρ)
```

Perfect puppets collapse to one voice regardless of `k`; genuine strangers count fully. There is no verdict and no expulsion — only a weight, graduated and recoverable. And one rule makes it bite: **every weight in the system is issued per unit of `n_eff`, never per account** — votes, the drip, aggregation influence, witness power. This is the formal version of the local, stake-scaled posterior [chapter 2](02-coupling.md) introduced; there is no global `Σ` matrix, only each zone's estimates over its own members, with the body map as the prior on where correlation is expected.

The remaining attack is deliberate decorrelation: script the forty accounts to *look* independent on every monitored dimension. But the monitored dimensions are the paid dimensions, so passing the test means running forty separately maintained streams of real, individually rewarded work. In the limit, the cheapest way to fake `k` agents is to *be* `k` agents — at which point, from the network's side of the boundary, they are. Identity is an accumulated signature of real work.

What about a close-knit community that truly thinks alike? It is measured, not punished: correlated voices really do carry less independent information, the discount is accurate inference, and it reverses the moment members act on their own signals. The feared autoimmune disease was an artifact of demanding a yes/no classifier; a continuous weight never asks the unanswerable question.

## The market that believes itself

Now the second costume. Model a resolver's verdict as a blend: a fraction $\lambda$ of deference to the published forecast $p$ (through a response curve $g$), the rest driven by their private signal. Forecasters, optimizing properly, publish the fixed point of $p = \lambda\,g(p) + (1-\lambda)\,\pi$, where $\pi$ is the evidence posterior. Solving it gives a result fear does not predict: **if deference is linear and $\lambda < 1$, the fixed point is exactly $\pi$.** Influence alone is harmless; it flows through the loop and cancels.

The trap needs *conformity* — response steeper than proportional. Define the deference slope $L = \lambda \cdot \sup|g'|$. Below $L = 1$ the truthful forecast is the unique equilibrium, though quality degrades smoothly (deferring resolvers are correlated resolvers, worth fewer independent voices by the accounting above — the two costumes are already one). At $L = 1$ the system bifurcates, and beyond it stable **fiction equilibria** exist: forecasts near certainty, evidence nowhere near. This is the dark room of active inference, and the whole risk compresses to one measurable scalar with one safety condition, $L < 1$ (V1).

Three levers control it, and all three are correlation management:

1. **Blind resolution** — don't display the consensus while a verdict is recorded; the highest-bandwidth deference channel is cut by an interface decision.
2. **Reality coupling** — pay resolvers a bonus on their own verdicts scored against later-arriving evidence, making private signals profitable and lowering $\lambda$.
3. **Epistemic routing** — weight question budgets toward uncertainty that matters for live decisions, so optimization power sits where reality can still push back.

And $L$ is estimable in production: randomize what consensus resolvers see at verdict time and regress verdicts on the display. The first pilot's primary measurand is $\hat{L}$, the system's distance from its own cliff.

One consequence deserves promotion from footnote to principle: **an echo chamber is, epistemically, a single agent.** A coalition whose members defer to each other is a high-correlation bloc, so any outside observer aggregating with `n_eff` weights collapses it toward one voice automatically — no echo-chamber detector required. Internal decorrelation (blind resolution) keeps a coalition's *own* perception sharp; external `n_eff` weighting quarantines whatever correlation remains; and the coupling dynamics of [chapter 2](02-coupling.md) starve the rest, because a dark room's predictions lose value against reality and its members' surplus lies increasingly outside. Three defenses, one toolkit.

## The bloc that buys the floor

The third costume is correlation of *payoff*: a wealthy bloc coordinating verdicts, or a zone selling low demurrage to attract fleeing capital. [Chapter 4](04-money.md) already installed the treatments — resolver-side `n_eff` weighting discounts coordinated verdicts exactly as it discounts sock-puppets; boundary reputation makes havens illiquid; the homeostatic floor rises when the slow market's measured accuracy sags. What this chapter adds is the diagnosis that they are the same disease: shared payoff is one more component of correlation, managed by the same accounting.

## The one estimation problem

⚠️ Everything above reads correlation with a sign. The immune system *discounts* it (shared source, shared deference, shared payoff); the money layer *rewards* it (shared fate is what zones and mergers are made of); and some of it is neither attack nor asset but honesty (two careful observers of the same world *should* agree). Decomposing measured correlation into **shared-source, shared-deference, shared-payoff, shared-fate, and shared-truth** components — at finite monitoring richness, against adversaries who shape their own statistics — is the load-bearing open problem of the entire design. The arms-race bound (mimicry costs what honesty costs) is asymptotic comfort, not a finite-sample guarantee; the estimator design, with the body map as its prior, is unwritten; and every chapter of this book leans on it.

📐 Formal treatment: [Mathematical Core §2](mathematical-core.md) (the deference model, bifurcation, and audits), [§3](mathematical-core.md) (`n_eff`, GLS weighting, mimicry cost).

---

Correlation managed, counts and beliefs are worth acting on. Acting is its own discipline: choosing what the coalition wants, refining the priors evidence can't refine, and never wiring a forecast straight into a decision. That is [chapter 6](06-governance.md).
