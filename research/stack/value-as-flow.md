# Value as Flow

> *Part II · The Recurring Pattern — Chapter 9*

The last recurring primitive is money — but reframed. The currency layer isn't bolted on; it's the same idea (value relative to whose need it serves) plus one physical principle (value must *flow* to persist).

## The problem: what is "value" with no global oracle?

The truth machine refused a global truth — there is only per-resolver verdict. Currency needs the same honesty. There is no global "value," only **value to a constituent**: the capacity to do useful work *for someone* — a cached value near demand, committed disk, a relay's bandwidth. Value is inherently relative to whose need it reduces, exactly as truth is relative to whose verdict it predicts.

A second problem is sharper: [assumption A2](assumptions.md) (dispersed capital) is load-bearing for the *entire* truth machine, and nothing so far enforces it. Wealth tends to concentrate; concentration captures the world-model. We need a currency that structurally resists concentration.

## Demurrage: value that must circulate

A living structure persists only by *throughput* — value that stops flowing dissipates. Translate that into monetary policy:

- **Currency** is the token that tracks value flowing between participants.
- **Demurrage** is the rule that currency *decays unless circulated* — the economic second law. Idle stock is reclaimed.
- The reclaimed flow is **recycled as a baseline drip to everyone** — a UBI.

This single mechanism does three jobs at once:

1. **It enforces dispersion (A2).** With a demurrage rate $\delta$, steady-state wealth converges to *equal baseline* plus *net-contribution-flow scaled by $1/\delta$*. You can only be richer than baseline by your sustained net flow over $\delta$. Unbounded **stock** inequality becomes bounded **flow** inequality — and $\delta$ becomes a *dial* that directly enforces a target concentration bound on resolver budgets. **Monetary policy and truth-machine validity are the same knob.**
2. **It funds newcomers.** Hoarders (stagnant stock) fund the baseline drip to fresh participants (flow). The stock-rich subsidize the flow-poor — which is *also* the dispersion the truth machine needs.
3. **It makes capital a weak lock-in.** Wealth melts if you sit on it; what persists is flow and portable reputation. That keeps *exit* cheap, which (per the [reflexivity chapter](reflexivity.md)) is how the system stays coupled to reality.

## Bootstrapping = perfusion, gated by local integrity

A new participant is like a new cell: it must be *perfused* (given a baseline so it can transact and have an experience before contributing) and then *differentiate* (develop a reputation/behavioral signature). But the moment of weakest boundary integrity is exactly birth — a newcomer has no history, so [Sybil resistance](independence.md) is weakest precisely when we want to hand out resources.

Geography resolves this. Physical proximity is hard to forge in bulk: locally-present members can cheaply vouch for a newcomer, and faking many *local* identities requires physical presence in many places. So a newcomer enters through a local zone, vouched by neighbors, with a baseline endowment bounded by the strength of that local personhood proof. The same coordinate space then does quadruple duty — latency, birth-time vouching, currency locality, and consensus locality.

> ⚠️ **Honest caveat.** This bounds steady-state *stock*, not instantaneous flow — a high-flow actor can still spend in bursts (closed by burst-spend caps). And inter-zone exchange rates, speculation against a decaying currency, and any external peg all need real macroeconomic analysis the design doesn't yet have.

> 📐 **Formal version:** [The Mathematical Core](mathematical-core.md) §4 — the wealth dynamics, the egalitarian-attractor proposition, and the δ-dial that turns A2 into a theorem.
