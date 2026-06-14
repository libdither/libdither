# Sybil Resistance Is Independence

> *Part II · The Recurring Pattern — Chapter 7*

Every layer so far quietly assumed something it has no right to: that we can tell distinct participants apart.

## The problem under all the others

A handful of mechanisms break completely if one actor can cheaply pretend to be many (a *Sybil attack*):

- **Quadratic voting** is meaningless if you can't count distinct persons.
- **Consensus** is meaningless if "independent" resolvers are one puppeteer.
- **Contribution-pricing** is meaningless if a "contributor" is the requester in disguise.
- **A UBI drip** is infinitely farmable.

This is why Sybil resistance keeps surfacing everywhere: it is the precondition for the system to have a well-defined boundary — to know which participants are genuinely *inside* and distinct — at all.

The classic approach is a *personhood proof*: verify each account is a unique human. But that collides head-on with two other goals — it's privacy-destroying, and any cheap proof is forgeable. Demanding a yes/no "is this a real distinct person?" classifier asks an unanswerable question.

## The reframe: from personhood to precision

Stop asking *"is this a distinct person?"* Ask instead:

> **How much independent information does this participant contribute?**

Look at each agent's *behavioral residuals* — forecast errors, transaction timing, verdicts — **after conditioning on public information.** Honest distinct agents have residuals that are roughly independent. Puppets of one controller stay correlated even after conditioning on what's public, because they share *private* state.

So measure the correlation structure $\Sigma$ and compute an **effective population**: for a cluster of $k$ accounts with mutual correlation $\rho$, the number of genuinely-independent voices is

$$n_{\text{eff}} = \frac{k}{1 + (k-1)\rho}.$$

Perfect Sybils ($\rho \to 1$) collapse to $n_{\text{eff}} = 1$ no matter how many accounts they spin up; genuine independents ($\rho \to 0$) each count fully. **Issue all weight — votes, UBI, aggregation influence, witness power — per unit $n_{\text{eff}}$, not per account**, and the Sybil attack yields nothing.

## Why this composes with "real work"

The remaining attack is *adversarial decorrelation*: a puppeteer makes $k$ accounts that simulate independence on every monitored dimension. But the monitored dimensions are exactly the ones the system **pays for** — forecast accuracy, storage served, bytes routed, compute delivered. Producing $k$ genuinely-decorrelated, individually-rewarded performances requires $k$ separately-maintained positions of real work. In the limit:

> The cheapest way to fake $k$ agents is to *be* $k$ agents — at which point, from the network's view, they **are** $k$ agents. Identity becomes an accumulated *signature of real work*, and faking the boundary requires doing the metabolism we wanted anyway.

## The autoimmune dilemma, dissolved

The feared false positive — "an honest local community that genuinely agrees gets punished as colluders" — stops being an error. Agents correlated through a shared *private* channel really do contribute less independent information; weighting them as $n_{\text{eff}} < k$ is **accurate inference, not injustice**. There's no binary verdict to get wrong: weight is graduated, continuous, and recoverable (diverge behaviorally and your weight grows back). The dilemma was an artifact of demanding a yes/no classifier; precision accounting never asks the unanswerable question.

> ⚠️ **Honest caveat.** This is an asymptotic/arms-race bound, not a finite guarantee. How much monitored behavioral diversity suffices in practice — the arms-race floor — is empirical, and estimating $\Sigma$ at scale needs the geographic/vouching graph as a prior on its structure.

> 📐 **Formal version:** [The Mathematical Core](mathematical-core.md) §3 — $n_{\text{eff}} = \mathbf{1}^\top \Sigma^{-1}\mathbf{1}$, GLS down-weighting, and the mimicry-cost proposition. This single number is the stack's one security parameter.
