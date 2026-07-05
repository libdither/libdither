# 6 · Money

A month passes. You served ten thousand fetches, held a terabyte of other people's data, sold compute cycles overnight. What lands in your wallet?

The lazy answer is dollars, and it quietly reinstalls everything the last five chapters removed: a bank to hold them, a settlement network to move them, a state to define them. The crypto answer is a fixed-supply token, and it fails slower but harder. Fixed-supply tokens concentrate — early holders, first movers, compounding returns — and concentration here is not a cosmetic inequality. The next chapter builds a machine whose output is only trustworthy while capital stays dispersed; whoever holds the pile eventually sets the network's beliefs. A currency for this stack has to make the pile structurally impossible to sit on, with no central bank, no minting committee, no global anything.

## Shares of a pool, not tokens from nowhere

Start from the refusal that runs through this whole book. There is no global truth, only per-resolver verdicts; no global time, only witnessed order; and no global value, only *value to someone* — a cached file near its readers, committed disk, a relay's bandwidth. Money should say that plainly rather than average it away.

So: a **zone** is a region of the body map ([ch. 4](04-routing.md)); its **pool** is the real productive capacity inside it, valued in the things [chapter 5](05-market.md) already prices (GB-months held, bytes moved, reduction steps run). Your money is a **share of the pools you participate in**: perhaps 0.3% of your own community's pool and slivers of a dozen others. Wealth is the portfolio `w_i = Σ_z θ_{i,z}·V_z`, shares times pool values.

Notice what just disappeared. Nobody mints anything. The "money supply" of a zone *is* `V_z`, the basket value of its real capacity: it grows when disks come online and shrinks when they leave. The how-much-money-should-exist question, the one central banks exist to answer, has no analog here. And paying someone inside your zone is a share transfer between single-owner accounts, which [chapter 2](02-ordering.md) showed needs no consensus at all.

## Exchange rates are discovered, not decreed

The crux is between zones. Your shares are claims on *your* community's capacity; why would a distant stranger accept them?

History answers, because disconnected economies have solved this from scratch many times, always in the same sequence. First contact is barter at the boundary: the exchange rate is born as a goods ratio, haggled at the interface. Then a *commodity bridge* pins it: once both sides value some common good — silver, salt — each money's price in that good fixes the cross rate, arbitrage enforces it, and rates float only inside the band set by the cost of physically shipping the bridge good. Then credit removes the shipping: merchants net offsetting claims through clearing fairs and correspondent banks, forming a tree of intermediaries that quotes rates at every level. Over the long run, rates drift toward purchasing-power parity, and whatever gap remains is real information about local conditions. When two economies trade densely enough and share enough shocks, they merge their currencies; when they don't, they float and keep their autonomy.

The lesson for a protocol designer: **nobody ever built a merge mechanism.** An exchange rate is the shadow price of boundary trade, discovered where the boundary is. Build the boundary — local trade plus a local quote — and the rate emerges. The "merge" is just the limit where the rate hugs 1 and the boundary stops mattering.

On this network the commodity bridge is built in and physically real. A GB-month of storage or a kilostep of compute is the same good in every zone, but its *cost* differs by location, because power, hardware, and demand are local. So the rate between two zones is anchored by resource arbitrage that nobody can move without providing or consuming real capacity. Rates form a **field** `χ(x→y)` over the body map: near 1 between neighbors, wide between distant strangers.

To spend far from home, you route a payment *through* that field, hop by hop, each intermediary applying its local rate and taking a spread — a bill of exchange propagating through correspondent banks, rebuilt from parts we already have. The accumulated spread is the cost of distance, and it is real cost: the same min-cost flow as [chapter 5](05-market.md), now moving value instead of data. Money obeys the physics of latency. Near is cheap, far is dear, and the dearness carries information rather than friction.

The bookkeeping hierarchy is the correspondent tree made explicit. Zone ledgers hold the cap tables. Clearing houses above them hold small reserves in each child zone, quote the boundary rates, and earn the spread. Higher clearing houses recurse toward a root, triangular arbitrage keeps composed rates consistent, and payments route up-over-down the tree or laterally through neighboring zones, whichever path is cheaper.

## Demurrage: purely local, global by agglomeration

Now the anti-concentration mechanic. Each zone, independently, runs **demurrage**: shares decay toward the equal share unless they circulate, and the decayed value is recycled as a **basic income drip** to the zone's members, weighted by marginal `n_eff` ([ch. 1](01-identity.md)) so that a farm of fresh accounts shares one drip. In value terms, per member and zone:

```
ẇ_{i,z} = −δ_z·w_{i,z} + δ_z·b_z·ν_{i,z} + (earn − spend)
```

Every term is local; nothing reaches across a boundary. Yet sum this over a member's whole portfolio, with a common rate `δ`, and the global behavior falls out:

```
w_i*  =  B_i  +  Φ_i / δ
```

Steady-state wealth is your baseline across the pools you belong to, plus your *sustained net contribution flow* scaled by `1/δ`. Stock inequality — what you managed to pile up — is replaced by bounded flow inequality: what you keep contributing. Hoarded wealth melts, the melt funds newcomers, and `δ` is a dial that directly bounds how concentrated resolver budgets can get, which is the soundness condition the truth machine will need (V3). Local dials, summed, *are* the global monetary policy. There is no policy desk.

Two side effects arrive free. Gresham's law, normally a pathology, works for us: people spend the decaying local shares and save the stable store (the resource basket, or a hub's shares), which is the circulation demurrage wants. And a **reserve currency emerges on its own**: the most central zone in the trade topology is the cheapest to route through, so its shares become the common intermediary — London, then the dollar, recreated by geometry rather than decree. That one is not free; it is the design's most serious concentration risk, taken up below.

There is one sharp catch. With *heterogeneous* rates, the global picture is dominated by the slowest-decaying zone: set `δ_z → 0` somewhere and wealth flees there and pools. A tax haven, derived from first principles. Local monetary sovereignty and a global dispersion guarantee are in real tension, and the resolution is a **floor**: zones choose their own `δ_z`, above a network-wide `δ_min`.

Which raises the question this chapter has been building toward: who sets the floor, with nobody in charge?

## Zones, centralization, and the floor {#the-remaining-crux}

*This section is the live frontier of the design; read it as a proposed resolution, not a settled one.*

**Where do zones come from?** Not from a map-drawing committee. Let `κ(a,b)` measure fate-sharing between two parties: how much they gain from pooling rather than trading at arm's length, how much one's failure hurts the other. Pool where `κ` is high — one ledger, one `δ_z`, shared fate. Trade at a rate where `κ` is low. The zone boundary is where `κ` drops, which is the same place an exchange rate becomes worth its upkeep; zone definition and the merge question are one threshold on one field. ⚠️ The subtlety: `κ` is read from the same correlation structure that [chapter 1](01-identity.md) reads for Sybil detection, with the sign flipped. The immune system discounts correlation as less-independent information; the money layer rewards it as fate-sharing. Distinguishing cooperators (shared shocks, autonomous action) from puppets (shared controller, mimicked independence) is chapter 1's arms race, now load-bearing for where the map's borders sit.

**What prevents a giant pool, or a hub that eats the network?** Selection, not statute. Cooperation surplus has diminishing returns while coordination and capture costs grow with scale, so there is an optimal size for a monetary organism, and beyond it bigger is less fit. The regularizer is cheap exit: demurrage already makes stock a weak hostage, shares and reputation are portable, so an over-central pool or an extractive hub sheds members to nimbler rivals. A reserve hub is tolerable for as long as it is contestable — earning its spread through cheaper routing, with competitors and bypass paths in reach. Extraction without contestability is what this book means by cancer, and the treatment is competition, not a rule.

**Who sets `δ_min`?** Nobody picks the number; three nested mechanisms regulate it.

1. *Boundary reputation, locally.* Zones price each other's shares partly by policy: a haven undercutting the floor finds neighbors widening its spread and refusing its shares as reserves. Fled capital gets in but cannot cheaply get back out. This is the medieval law merchant's collective boycott applied to monetary policy, and it needs no global vote.
2. *Homeostasis, globally.* The organ that concentration damages is the truth machine ([ch. 7](07-truth.md)), so its accuracy is the sensor. Governance ([ch. 9](09-governance.md)) raises the floor when the network's own perception reports creeping capture. The thing that needs dispersion sets the dial that enforces it — the money⇄truth cycle, closed on purpose.
3. *Selection, ultimately.* A network that tolerates havens gets a captured truth machine, worse decisions, and emigration. The floor survives as an evolved invariant: networks without one die.

The homeostatic loop needs care. Its sensor is lagged (verdicts take months to resolve) and its plant is slow (relaxation time `1/δ`), and a naive controller under lag oscillates: monetary boom and bust as a control-theory failure. The sketch that should hold: move `δ_min` slowly, from a low-pass-filtered concentration signal, with slew limits — a damped PI controller — and let the fast, lag-free boundary-reputation loop absorb shocks. Mapping the stable region is the first simulation this design owes ([open questions Q8](open-questions.md)).

## Newcomers

A new member must be *perfused* before they can contribute: given a starting share so they can transact at all. But [chapter 1](01-identity.md)'s boundary is weakest at birth, when there is no history to weigh. Geography closes the loop. Physical presence is hard to counterfeit in bulk, so locally present members vouch a newcomer into their zone, the starting share is bounded by the strength of that vouching, and the income drip ramps toward a full share as the newcomer's behavioral signature individuates. It saturates at one share: a ramp, not a head start.

⚠️ What this chapter still owes: rates at *thin* boundaries are set by little volume and are the manipulable case; measuring `V_z` presupposes a live resource market, a real bootstrap dependency; the primary-issuance rule (adding capacity earns how many new shares, diluting whom?) is unwritten; and boundary enforcement needs to *observe* a zone's `δ_z` and concentration, which collides with transaction privacy — pointing at a zero-knowledge proof-of-compliance primitive. All four are tracked in [open questions Q7–Q10](open-questions.md).

📐 Formal treatment: [Mathematical Core §4](mathematical-core.md) — the wealth dynamics, the attractor, and the δ-dial that turns dispersion from an assumption into a theorem.

---

You are now paid in something that cannot pool into a weapon. The reason that matters more than fairness: the next chapter gives the network a mind, and the mind runs on dispersed capital. That is [chapter 7](07-truth.md).
