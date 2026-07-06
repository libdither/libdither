# 5 · The Immune System

Three things go wrong with the circle, in its third year, in the same month.

First, the spam wave: forty enthusiastic new members join in an hour, and every one of them has opinions about the treasury. Second, subtler: the cursed-scarf theory — which began, you'll recall, as Sarah's joke — has hardened into orthodoxy, not because new evidence arrived but because everyone keeps citing everyone else citing Sarah, and by now expressing doubt feels vaguely rude. Third, quieter still: three members with large stakes have started coordinating their moderation verdicts, and the votes have begun going their way slightly too often.

A puppet attack, an echo chamber, a capture. They look like three problems, which is why platforms staff three departments against them. They are one problem. The puppet's forty accounts are correlated because they share a controller. The echo chamber's members are correlated because they share a deference habit. The bloc is correlated because it shares a payoff. **Mismanaged correlation, three costumes** — and one immune system, whose whole method is: measure the correlation, decompose it, and make weight follow independence.

## Counting strangers without a registry

Start with the puppets, because the counter to them is the toolkit's core. "Is this account a distinct person?" is a question only an authority can answer, and we have no authority — so ask the answerable question instead: **how much *independent information* does this participant contribute?**

Watch behavioral residuals: what remains of forecast errors, transaction timing, service patterns after subtracting everything explainable by public information. Distinct strangers' residuals wander independently, because they come from distinct private lives. A puppeteer's accounts stay correlated no matter how carefully scripted, because they share the one thing that matters — a single controller's private state. For a cluster of `k` accounts with mutual correlation `ρ`, the number of voices actually present is

```
n_eff = k / (1 + (k−1)·ρ)
```

Perfect puppets (`ρ → 1`) collapse to one voice however many accounts they open; genuine strangers count in full. Note what this *isn't*: there's no verdict, no ban, no personhood tribunal. Just a weight, graduated and recoverable. And one rule makes the weight bite: **everything the system counts is issued per unit of `n_eff`, never per account** — votes, the drip, aggregation influence, witness power. The spam wave arrives, gets weighed, and discovers that forty of it adds up to roughly one.

(There is no global `Σ` matrix behind this, incidentally — that would be its own somebody-in-charge. Each zone estimates over its own members, with the body map supplying the prior on where correlation is *expected*: neighbors correlating is normal, strangers correlating is a tell. This is the formal version of [chapter 2](02-coupling.md)'s stake-scaled posterior, not a new mechanism.)

The remaining attack is to script the puppets into *looking* independent. But the monitored dimensions are the paid dimensions — forecast accuracy, storage served, bytes routed — so passing the independence test means running forty separately maintained streams of real, individually rewarded work. At the limit, the cheapest way to fake `k` agents is to *be* `k` agents, at which point, from the network's side of the boundary, they simply are. Identity, here, is an accumulated signature of work; the forgery and the original cost the same.

And the worry that keeps well-meaning designers up at night — *won't a close-knit community that truly thinks alike get punished as colluders?* — dissolves once you notice the system never punishes anyone. Correlated voices really do carry less independent information, discounting them is accurate inference rather than judgment, and the weight recovers the moment members act on their own signals. The feared autoimmune disease was an artifact of demanding a yes/no classifier. A continuous weight never has to ask the unanswerable question.

## The market that believes itself

Now the scarf problem, which is the same disease wearing its epistemic costume, and the one place [chapter 3](03-market.md) can genuinely die.

Model a resolver's verdict as a blend: a fraction $\lambda$ of deference to the published forecast $p$ (through some response curve $g$), the rest driven by their private signal. Forecasters, optimizing honestly, will publish the fixed point of $p = \lambda\,g(p) + (1-\lambda)\,\pi$, where $\pi$ is the evidence posterior. Solve it, and the first result is a genuine relief: **if deference is linear and $\lambda < 1$, the fixed point is exactly $\pi$.** Influence, by itself, does no damage — it flows around the loop and cancels. We expected worse.

The trap needs *conformity*: response steeper than proportional, the social-pressure regime where a 0.9 consensus doesn't just inform your verdict but drags it. Define the deference slope $L = \lambda \cdot \sup|g'|$. Below $L = 1$, truth is the unique equilibrium (quality degrades smoothly as $\lambda$ grows — deferring resolvers are correlated resolvers, worth fewer voices by the accounting above, and yes, the two costumes just became one). At $L = 1$ the system bifurcates, and beyond it live stable **fiction equilibria**: forecasts near certainty, evidence nowhere in sight. The scarf theory, formalized. Active inference calls this failure the dark room. The whole risk compresses into one scalar and one safety condition, $L < 1$, and it's the first of the five deaths (V1).

A measurable scalar is a controllable one, and all three control levers are correlation management by other names:

1. **Blind resolution.** Don't show the consensus while a verdict is being recorded. An interface decision with a theorem inside it: you can't make $\lambda$ zero (public belief leaks through the world), but you can cut the highest-bandwidth channel.
2. **Reality coupling.** Pay resolvers a bonus on their own verdicts scored against evidence that arrives later, making the private signal profitable and pulling $\lambda$ down.
3. **Epistemic routing.** Weight question budgets toward uncertainty that matters for live decisions, so optimization power sits where reality still pushes back.

Better: $L$ can be *measured* in production — randomize what consensus resolvers see at verdict time, regress verdicts on the display. The first pilot's primary measurand is $\hat{L}$, the system's distance from its own cliff. Few institutions can tell you how far they are from believing their own propaganda; this one is designed to publish the number.

One consequence deserves promotion from footnote to principle. **An echo chamber is, epistemically, a single agent.** A coalition whose members defer to each other is a high-correlation bloc, so any outside observer running `n_eff` weights collapses it toward one voice *automatically* — no echo-chamber detector required, no one has to declare the scarf people a cult. Internal decorrelation (blind resolution) keeps a community's own perception sharp; external weighting quarantines what remains; and [chapter 2](02-coupling.md)'s coupling dynamics starve the rest, since a dark room's predictions lose value against reality and its members' surplus increasingly lies outside. Three defenses, one toolkit.

## The bloc that buys the floor

The third costume is correlation of *payoff* — the verdict-coordinating stakeholders, or a zone selling low demurrage to attract fleeing capital. [Chapter 4](04-money.md) already installed the treatments: resolver-side `n_eff` weighting discounts coordinated verdicts exactly as it discounts puppets, boundary reputation makes havens illiquid, and the homeostatic floor rises when the slow market's measured accuracy sags. What this chapter adds is just the diagnosis that it's the same disease — shared payoff is one more component of correlation, managed by the same accounting.

## The one estimation problem

⚠️ And now the thing we cannot yet defend, stated as plainly as we can. Everything above reads correlation *with a sign*. The immune system discounts it: shared source, shared deference, shared payoff. The money layer rewards it: shared fate is what zones and mergers are made of. And some of it is neither attack nor asset but simple honesty — two careful observers of the same world *should* agree. Decomposing measured correlation into shared-source, shared-deference, shared-payoff, shared-fate, and shared-truth, at finite monitoring richness, against adversaries who shape their own statistics: that is the load-bearing open problem of the entire design. The mimicry-cost bound (faking costs what being costs) is asymptotic comfort, not a finite-sample guarantee; the estimator, with the body map as its prior, is unwritten; and every chapter in this book leans on it. If this design has a heart to aim at, it's here.

📐 Formal treatment: [Mathematical Core §2](mathematical-core.md), [§3](mathematical-core.md).

---

The spam wave weighs one, the scarf theory faces a published $\hat{L}$, and the bloc's verdicts discount themselves. Counts and beliefs are worth acting on again — which leaves acting: choosing what the circle actually wants, and never, ever wiring a forecast straight into a decision. [Chapter 6](06-governance.md).
