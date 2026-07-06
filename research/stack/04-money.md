# 4 · Money
> 🤖 *AI-drafted, human-directed — [what that means](ai-disclosure.md).*

A month passes. You've served ten thousand fetches of the tutorial channel, held a terabyte of other people's residuals, sold compute overnight. What lands in your wallet?

A confession before the design, because it's instructive. Our first answer to this question — it's in the git history, and we're leaving it there — bolted IOTA's block structure to Stellar's consensus protocol, obfuscated everything with zk-STARKs, and pegged the result to the US dollar through a scheme where you'd mint new coins by provably burning *other* cryptocurrencies. It seemed reasonable at the time. It had every feature except a reason the pieces belonged together, and it survived exactly one contact with the actual question, which is not "how do I make a coin" but: *what should a unit of value even be, here?*

Because the obvious answers fail in instructive ways. Dollars reinstall everything the earlier chapters removed — a bank to hold them, a settlement network to move them, a state to define them. A fixed-supply token fails slower but harder: such tokens concentrate (first movers, compounding returns), and [chapter 3](03-market.md) just showed you what concentration buys in this system. The slow market's verdicts. The network's beliefs. So the currency has one requirement beyond functioning as money, and it's non-negotiable: **wealth must be structurally unable to pool into a weapon.**

And money quietly has a second job here, one that usually goes unstated: it's the **fate-coupling instrument**, the thing that makes strangers' welfare depend on each other. Hold that thought; it's how this chapter ends up answering a question you didn't ask it — how networks merge.

## Shares of a pool

Apply the book's standing refusal — no global anything — to value itself. There is no global value, only value *to someone*: a cached tutorial near the people who watch it, committed disk, a relay's bandwidth at eight in the evening. So money here isn't a token conjured from nowhere. A **zone** ([chapter 2](02-coupling.md)'s densely-coupled cluster — the circle plus its storers is about to become one) has a **pool**: its real productive capacity, valued in the units the market already prices (byte-months, transfers, reduction steps). Your money is a **share of the pools you participate in**: a slice of your own community's capacity, plus slivers of a dozen others, earned by trading with them. Wealth is the portfolio `w_i = Σ_z θ_{i,z}·V_z`.

Two things quietly vanished in that paragraph. Minting: a zone's money supply *is* `V_z`, growing when disks join and shrinking when they leave, so the question central banks exist to answer — how much money should exist — doesn't arise; the answer is "however much capacity there is," by construction. And settlement: paying someone inside your zone is a share transfer between single-owner accounts, which [chapter 2](02-coupling.md) showed needs no consensus at all.

## Exchange rates are discovered, not decreed

The hard part is *between* zones. Your shares are claims on your community's capacity — why would a stranger three networks away accept them? It helps that history has run this exact experiment every time two disconnected economies met, and the sequence is stable enough to copy. First contact is barter; the rate is born as a goods ratio, haggled at the interface. Then some common good both sides value — silver, salt — becomes a *bridge*, and arbitrage pins each money's price in terms of it, within a band set by the cost of physically moving the stuff. Then credit replaces shipment: merchants net claims through clearing fairs and correspondent banks. Long-run, rates drift toward purchasing-power parity, and the residual gap is not noise but information about local conditions.

The design lesson we take from this: nobody, in several thousand years of monetary history, ever built a *merge mechanism*. Exchange rates are shadow prices of boundary trade, discovered where the boundary is. Build the boundary and the rate shows up on its own.

Here the bridge good is built-in and physical. A byte-month is the same good in every zone, but its *cost* is local — power, hardware, demand — so the rate between two zones is anchored by resource arbitrage nobody can push without providing or consuming real capacity. Rates form a field `χ(x→y)` over the body map (near 1 between neighbors, wide between strangers), and spending far from home is a *path payment*: hop by hop, each intermediary applying its local rate and taking a spread. The accumulated spread is the true cost of distance — and note the rhyme with [chapter 2](02-coupling.md), where identity confidence composed along vouching chains the same way. Money, trust, and identity are one family of fields on one map, all composing along routes, all attenuating with distance. We did not plan this; the design kept insisting.

⚠️ The clearing layer deserves suspicion, and earlier drafts of this book swept it under the rug, so here it is in the open. A clearing node holds reserves in neighboring zones, quotes `χ` at the boundary, and earns the spread — a miniature bank, with a miniature bank's attack surface. Who gets to be one? Anyone with reserves; the position is contestable, not appointed. What stops quote manipulation? Arbitrage against the resource bridge, plus reputation — though *thin* boundaries with little volume remain the manipulable case, and we don't have a full answer there. What stops reserve theft? Collateral and the typed contracts of [chapter 2](02-coupling.md). Each of those answers is a sketch, not a spec. So is `V_z` itself: valuing a pool presupposes a live resource market with real price discovery, a bootstrap dependency we can't remove, only order around (market first, then the money denominated in it).

## Demurrage: local decay, global dispersion

Now for the non-negotiable requirement, and the mechanism is almost disappointingly boring. Each zone, independently, lets idle shares decay toward the equal share, and recycles the decay into a **basic income drip** for members — weighted by each member's independent-mind measure, so a farm of fresh accounts shares one drip ([chapter 2](02-coupling.md)'s posterior, formalized next chapter). Per member, per zone:

```
ẇ_{i,z} = −δ_z·w_{i,z} + δ_z·b_z·ν_{i,z} + (earn − spend)
```

Every term is local; nothing crosses a boundary. But sum over a member's whole portfolio with a common rate `δ` and something global falls out anyway:

```
w_i*  =  B_i  +  Φ_i / δ
```

Steady-state wealth is your baseline plus your *sustained net contribution*, scaled by `1/δ`. What you piled up melts. What you keep doing persists. And `δ` turns out to be a dial that directly bounds how concentrated the slow market's budgets can get — assumption A2 from last chapter, converted from a hope into a control knob (V3). The money⇄truth cycle everyone warns you about is real here, and closed on purpose: the thing that needs dispersion sets the dial that enforces it.

Two behaviors emerge unbidden, one welcome, one dangerous. Gresham's law — usually a pathology — works *for* us: people spend the melting shares and save the stable basket, which is precisely the circulation demurrage wants. And a **reserve hub emerges**: the most central zone is cheapest to route through, so its shares become everyone's intermediary (the dollar's position, re-derived by geometry). A hub is tolerable exactly as long as it's contestable — earning its spread through actually-cheaper routing, with rivals and bypass paths in reach. Extraction without contestability is this book's working definition of cancer, and the treatment is the same everywhere: competition, plus the cheap exit that demurrage itself provides, since stock is a weak hostage and shares and reputation travel.

One catch, though, and it's sharp enough to drive the rest of the chapter: with heterogeneous rates, wealth flees to the slowest-decaying zone and pools there. A haven. Local monetary sovereignty and global dispersion are in genuine tension, and the resolution is a **floor** — zones choose their own `δ_z`, above a network-wide `δ_min`. Which invites the question this whole design keeps circling: who sets the floor, with nobody in charge?

## Zones, merging, and the floor {#the-remaining-crux}

*The live frontier. Read it as a proposed resolution, not a settled one.*

**Where do zones come from?** Not from a committee with a map. [Chapter 2](02-coupling.md)'s coupling surplus `κ` accumulates wherever agents trade, witness, and vouch densely; pool where `κ` is high, deal at arm's length where it's low, and the zone boundary falls where `κ` drops — which is, not coincidentally, exactly where an exchange rate becomes worth its upkeep. ⚠️ The measurement subtlety here is the design's central open problem: `κ` is read from the same correlation structure [chapter 5](05-immune.md) reads for Sybil detection, with the sign flipped — the immune system discounts correlation, the money layer rewards it. Telling cooperators from puppets is one estimation problem wearing two hats, and both hats matter.

**Why would networks merge?** This is the question we promised at the top, and the answer is that they don't decide to; it happens to them, via the cap table. Every trade under pool-equity money leaves you holding a little of your counterparty, and cross-holdings mean your welfare depends on their survival — fitness alignment, implemented by accounting rather than exhortation. **Trade is merging in slow motion.** As cross-holdings deepen, shared quorums and a shared floor start paying for themselves, `χ` drifts toward 1, and one day the boundary is a formality. De-merging is the same movie backwards. When the knitting network and the crochet network finally federate — and they will, whatever the hardliners say — nobody will sign a treaty; their members will just have been trading long enough that the seam stops mattering. ([The coupling note](notes/coupling-and-merging.md) gives the surplus condition `G − C > 0` and the optimal-coalition-size consequence.)

**Who sets `δ_min`?** Nobody picks the number; three nested mechanisms regulate it. *Locally*: boundary reputation. Zones price each other's shares partly by policy, so a haven finds its spread widening and its shares refused as reserves. Fled capital gets in and can't cheaply get out — the medieval law merchant's boycott, no global vote required. *Globally*: homeostasis. The organ that concentration damages is the slow market, so its measured accuracy is the sensor, and [governance](06-governance.md) raises the floor when perception reports creeping capture. *Ultimately*: selection. A network that tolerates havens gets a captured world-model, worse decisions, and emigration ([chapter 7](07-evolution.md)).

The homeostatic loop wants engineering care, because its sensor lags by months (verdicts resolve slowly) while its plant relaxes at `1/δ`, and a naive controller under lag oscillates — monetary boom and bust as a control-theory failure, not a moral one. The working sketch: move `δ_min` slowly, from a low-pass-filtered signal, with slew limits, and let the fast boundary-reputation loop absorb shocks. Mapping where that loop is stable is the first simulation this design owes anyone ([open question Q8](open-questions.md)).

## Newcomers

A newcomer needs a starting share to transact at all, and [chapter 2](02-coupling.md)'s identity posterior is weakest at exactly that moment — no history, nothing to weigh. Geography closes the loop: locally present members vouch the newcomer into a zone, the starting share is bounded by the strength of that vouching, and the drip ramps toward a full share as their behavioral signature individuates. It saturates at one share. A ramp, not a head start.

⚠️ Still owed by this chapter: the primary-issuance rule (adding capacity earns how many new shares, diluting whom?); thin-boundary manipulation; and the compliance-observation problem — enforcing the floor means observing a zone's `δ_z` and concentration, which collides head-on with transaction privacy and points toward a zero-knowledge proof-of-compliance primitive. Tracked as [open questions Q7–Q10](open-questions.md).

📐 Formal treatment: [Mathematical Core §4](mathematical-core.md), [§10.3](mathematical-core.md).

---

So the circle's treasury holds shares that melt if hoarded, buy real capacity, and quietly entangle its fate with everyone it trades with. Wealth is handled — it can no longer pool into a weapon. What can still pool is *correlation*: one bored person wearing forty faces, a market that believes itself, a bloc that buys the floor. That's [chapter 5](05-immune.md).
