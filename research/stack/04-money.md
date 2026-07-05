# 4 · Money

A month passes. You served ten thousand fetches, held a terabyte of other people's residuals, sold compute overnight. What lands in your wallet?

Dollars would reinstall everything the earlier chapters removed: a bank to hold them, a settlement network to move them, a state to define them. A fixed-supply token fails slower but harder: such tokens concentrate (first movers, compounding returns), and [chapter 3](03-market.md) just showed what concentration buys here — the slow market's verdicts, and with them the network's beliefs. The currency has one non-negotiable requirement beyond working as money: **wealth must be structurally unable to pool into a weapon.**

And money has a second job in this design, one usually left implicit. Money is the **fate-coupling instrument**: the thing that makes strangers' welfare depend on each other. Getting it right is what lets networks merge.

## Shares of a pool

Apply the book's standing refusal — no global anything — to value itself. There is no global value, only *value to someone*: a cached file near its readers, committed disk, a relay's bandwidth. So money here is not a token from nowhere. A **zone** ([chapter 2](02-coupling.md)'s dense cluster) has a **pool**: its real productive capacity, valued in the units the market already prices (byte-months, transfers, reduction steps). Your money is a **share of the pools you participate in**: a fraction of your own community's capacity, plus slivers of others earned by trading with them. Wealth is the portfolio `w_i = Σ_z θ_{i,z}·V_z`.

Supply is therefore not minted and not fixed: a zone's money supply *is* `V_z`, growing when capacity joins and shrinking when it leaves. The question central banks exist to answer — how much money should exist — does not arise. Paying inside a zone is a share transfer between single-owner accounts, which needs no consensus at all ([chapter 2](02-coupling.md)).

## Exchange rates are discovered at boundaries

Between zones, the crux: your shares claim *your* community's capacity; why would a distant stranger accept them? History has run this experiment every time disconnected economies met, and the sequence is stable: first contact is barter (the rate is born as a goods ratio at the interface); a *commodity bridge* then pins it (once both sides value some common good, arbitrage fixes the cross rate within a band set by the cost of moving the good); credit then replaces shipment (merchants net claims through clearing intermediaries); and in the long run rates drift toward purchasing-power parity, with the residual gap carrying real information about local conditions.

The design lesson: **nobody ever built a merge mechanism.** Exchange rates are the shadow prices of boundary trade, discovered where the boundary is. Build the boundary and the rate emerges.

Here the commodity bridge is built-in and physical: a byte-month or a kilostep is the same good everywhere, but its *cost* is local (power, hardware, demand), so the rate between two zones is anchored by resource arbitrage that cannot be moved without providing or consuming real capacity. Rates form a field `χ(x→y)` over the body map (near 1 between neighbors, wide between strangers), and spending far from home is a *path payment* through it: hop by hop, each intermediary applying its local rate and taking a spread. The accumulated spread is the true cost of distance, and this is the same min-cost routing as everything else; recall from [chapter 2](02-coupling.md) that identity confidence and trust compose along paths the same way. One family of fields, one geometry.

⚠️ The clearing layer deserves suspicion, and earlier drafts swept it. Concretely: a clearing node holds reserves in each neighboring zone, quotes `χ` at the boundary, and earns the spread, which makes it a miniature bank, with a bank's attack surface. Who gets to be one (anyone with reserves; the position is contestable, not appointed), what stops quote manipulation (arbitrage against the resource bridge, plus reputation, though *thin* boundaries with little volume remain manipulable), what stops reserve theft (collateral and the typed-contract machinery of [chapter 2](02-coupling.md)) — each answer is a sketch, not a spec. Likewise `V_z` itself: valuing a pool presupposes a live resource market with real price discovery, a bootstrap dependency this design cannot remove, only order around (market first, then money denominated in it).

## Demurrage: local decay, global dispersion

The anti-concentration mechanic is deliberately boring: each zone, independently, decays idle shares toward the equal share and recycles the decay as a **basic income drip** to members, weighted by each member's independent-mind measure so a farm of fresh accounts shares one drip ([chapter 2](02-coupling.md)'s posterior; formalized in [chapter 5](05-immune.md)). Per member and zone:

```
ẇ_{i,z} = −δ_z·w_{i,z} + δ_z·b_z·ν_{i,z} + (earn − spend)
```

Every term is local. Sum over a portfolio with a common rate `δ` and the global consequence appears:

```
w_i*  =  B_i  +  Φ_i / δ
```

Steady-state wealth is your baseline plus your *sustained net contribution flow* scaled by `1/δ`. What you piled up melts; what you keep contributing persists. The dial `δ` directly bounds how concentrated the slow market's budgets can get, which is assumption A2 made enforceable (V3) — the money⇄truth cycle, closed deliberately.

Two emergent behaviors, one welcome and one dangerous. Gresham's law works in our favor: people spend the decaying shares and save the stable basket, which is the circulation demurrage wants. And a **reserve hub emerges**: the most central zone is cheapest to route through, so its shares become the common intermediary (the dollar's position, recreated by geometry). A hub is tolerable exactly while it is *contestable*: earning its spread through cheaper routing, with rivals and bypass paths in reach. Extraction without contestability is this book's definition of cancer, and the treatment is competition plus the exit-cheapness that demurrage itself provides (stock is a weak hostage; shares and reputation are portable).

One catch is sharp enough to drive the next section. With heterogeneous rates, wealth flees to the slowest-decaying zone and pools there: a haven. Local monetary sovereignty and global dispersion are in genuine tension, and the resolution is a **floor**: zones choose their own `δ_z` above a network-wide `δ_min`.

## Zones, merging, and the floor {#the-remaining-crux}

*The live frontier of the design; a proposed resolution, not a settled one.*

**Where do zones come from?** Not from a committee. [Chapter 2](02-coupling.md)'s coupling surplus `κ` accumulates wherever agents trade, witness, and vouch densely; pool where `κ` is high, trade at a rate where it is low, and the zone boundary sits where `κ` drops — which is the same place an exchange rate becomes worth its upkeep. ⚠️ The measurement subtlety is the design's central open problem: `κ` is read from the same correlation structure that [chapter 5](05-immune.md) reads for Sybil detection, with opposite sign — the immune system discounts correlation, the money layer rewards it. Separating cooperators from puppets is one estimation problem wearing two hats.

**Why do networks merge?** They don't decide to. Under pool-equity money, every trade leaves you holding counterparties' shares, and cross-holdings make your welfare depend on their survival: fitness alignment, implemented by the cap table rather than by exhortation. **Trade is merging in slow motion**: as cross-holdings deepen, shared quorums and a shared floor start paying for themselves, and `χ` drifts toward 1. The merge is the limit of entanglement; de-merging is symmetric. ([The coupling note](notes/coupling-and-merging.md) gives the surplus condition `G − C > 0` and the optimal-coalition-size consequence.)

**Who sets `δ_min`?** Nobody picks the number; three nested mechanisms regulate it. *Locally*, boundary reputation: zones price each other's shares partly by policy, so a haven finds its spread widening and its shares refused as reserves. Fled capital gets in and cannot cheaply get out; the law merchant's boycott, no global vote required. *Globally*, homeostasis: the organ concentration damages is the slow market, so its measured accuracy is the sensor, and [governance](06-governance.md) raises the floor when perception reports creeping capture. *Ultimately*, selection: a network that tolerates havens gets a captured world-model, worse decisions, and emigration ([chapter 7](07-evolution.md)).

The homeostatic loop needs engineering care: its sensor is lagged by months (verdicts resolve slowly) and its plant relaxes at `1/δ`, and a naive controller under lag oscillates into boom and bust. The working sketch — move `δ_min` slowly from a low-pass-filtered signal with slew limits, and let the fast boundary-reputation loop absorb shocks — is [open question Q8](open-questions.md), and mapping its stability region is the first simulation this design owes.

## Newcomers

A newcomer must be given a starting share to transact at all, and [chapter 2](02-coupling.md)'s identity posterior is weakest exactly then. Geography closes the loop: locally present members vouch the newcomer into a zone, the starting share is bounded by the vouching's strength, and the drip ramps to a full share as the newcomer's behavioral signature individuates. It saturates at one share: a ramp, not a head start.

⚠️ Still owed by this chapter: the primary-issuance rule (adding capacity earns how many new shares, diluting whom); thin-boundary rate manipulation; the compliance-observation problem (enforcing the floor requires observing a zone's `δ_z` and concentration, which collides with transaction privacy and points at a zero-knowledge proof-of-compliance primitive). Tracked as [open questions Q7–Q10](open-questions.md).

📐 Formal treatment: [Mathematical Core §4](mathematical-core.md) (wealth dynamics, the attractor, the δ-dial), [§10.3](mathematical-core.md) (coupling surplus).

---

You are paid in shares that cannot pool into a weapon, and the same shares quietly entangle every trading partner's fate with yours. What wealth can no longer do, correlation still can: a thousand faces on one actor, a market that believes itself, a bloc that buys the floor. That is [chapter 5](05-immune.md).
