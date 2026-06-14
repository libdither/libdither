# The Five Assumptions

> *Part I · The Engine — Chapter 4*

The mechanism is only as sound as its premises. Five assumptions hold it up. Naming them precisely does two things: it tells you exactly when the mechanism applies, and it turns each "what if this fails?" into a concrete design requirement that the rest of the book addresses.

## A1 — Shared reality

**Claim.** On most questions, a large fraction of resolvers eventually agree; their verdicts are positively correlated.

**Why it's needed.** Forecasters are paid for predicting *resolver consensus*. If there is no consensus to predict — if every resolver's verdict is idiosyncratic — then "consensus" is undefined and the target disappears.

**What breaks if it fails.** Forecasting degenerates into modeling each resolver separately; the shared world-model evaporates.

**Where it's addressed.** The architecture keeps the *perception layer* (forecasts, verdicts, world-model) **global** so the shared-reality population is as large as possible — see [The Living System](living-system.md) and [Mathematical Core](mathematical-core.md) §5.

## A2 — Dispersed capital

**Claim.** Reward budgets $B_j$ are not extremely concentrated.

**Why it's needed.** If one whale holds most of the budget, the money-optimal forecast is "predict the whale," not "predict consensus" — and aggregation collapses to the same failure as real-money markets under inequality.

**What breaks if it fails.** Capture: the world-model tracks one actor's beliefs.

**Where it's addressed.** This is the deepest cross-layer link in the stack: a demurrage currency *structurally* enforces dispersion, turning A2 from an assumption into a tunable inequality. See [Value as Flow](value-as-flow.md) and the δ-dial in [Mathematical Core](mathematical-core.md) §4.2.

## A3 — Repeated game

**Claim.** Forecasters value a future stream of reward, so they keep their published beliefs current.

**Why it's needed.** Reputation only means something if stale beliefs cost you. A one-shot game gives no reason to update.

**What breaks if it fails.** Forecasts go stale; the world-model lags reality.

**Where it's addressed.** Inherent in the scoring design — reputation decays relative to peers who keep updating ([Mechanism](mechanism.md)).

## A4 — Tamper-evident timestamps

**Claim.** Forecasts cannot be backdated.

**Why it's needed.** The reward for being "surprising and early" is only meaningful if "early" can't be forged after the outcome is known.

**What breaks if it fails.** Anyone can claim, post hoc, to have predicted everything — the entire skill ranking becomes fiction.

**Where it's addressed.** A minimal timestamping primitive built from *causal entanglement* — no global blockchain required. See [Mathematical Core](mathematical-core.md) §4.4 and the [roadmap](roadmap.md)'s shared-primitive analysis.

## A5 — Non-reflexivity *(the fragile one)*

**Claim.** Forecasters' reports do not themselves change resolvers' verdicts.

**Why it's needed.** Proper scoring assumes you are predicting an outcome you can't move. If publishing a forecast *causes* the verdict it predicts, the rule rewards self-fulfilling prophecy instead of truth.

**What breaks if it fails.** The Keynesian beauty contest: forecasters predict an equilibrium they help create, and the system can converge on a stable, comfortable fiction.

**Where it's addressed.** This is the single most important open problem, and it gets a chapter of its own: [Reflexivity and the Dark Room](reflexivity.md), formalized in [Mathematical Core](mathematical-core.md) §2. The headline result is reassuring — *linear* influence is harmless; the danger is a sharp threshold that turns out to be measurable and controllable.
