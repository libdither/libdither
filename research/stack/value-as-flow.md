# Value as Flow

> *Part II · The Recurring Pattern — Chapter 9*
>
> 🚧 **Draft — reworked around the pool-equity / exchange-rate-field model.** This supersedes the earlier "demurrage on a single fixed-supply token" sketch. The formal reference is still [The Mathematical Core](mathematical-core.md) §4; the portfolio model here *reduces* to those equations under a uniform demurrage rate.

The last recurring primitive is money — reframed twice. First: there is no global value, only value *to a constituent*, exactly as there is no global truth. Second, and new here: money is not a fixed-supply token at all. It is **equity in local pools** — a portfolio of fractional claims on the real productive capacity of the communities you belong to. Everything in this chapter follows from taking those two statements literally.

## The problem: value with no global oracle

The truth machine refused a global truth; there is only per-resolver verdict. Currency needs the same honesty. There is no global "value," only **value to a constituent**: the capacity to do useful work *for someone* — a cached value near demand, committed disk, a relay's bandwidth. Value is relative to whose need it reduces, exactly as truth is relative to whose verdict it predicts.

A second problem is sharper. [Assumption A2](assumptions.md) (dispersed capital) is load-bearing for the *entire* truth machine, and nothing so far enforces it: wealth concentrates, and concentration captures the world-model. We need a currency that structurally resists concentration **and** is denominated in something real, local, and un-minted.

## Money is a fragment of a whole

Strip the framing and the design is not a commodity token; it is **mutual-credit / pool-equity**, an old and working family of money (the WIR Bank, Sardex, LETS; in software, Ripple/Stellar path-payments). Make it precise:

- A **zone** `z` is a region of the [latency-trust coordinate space](living-system.md) — a community. Its **pool** is its aggregate productive capacity, valued in the [resource basket](core/resource-market.md): `V_z`.
- Agent `i` holds a **share** `θ_{i,z}` of each pool it belongs to, with `Σ_i θ_{i,z} = 1` — everyone's shares of a community sum to the whole. Real wealth is the portfolio `w_i = Σ_z θ_{i,z}·V_z`.
- **Supply is not minted; it *is* `V_z`.** When real capacity comes online, `V_z` grows and every share is worth more in absolute terms; shares still sum to one. The "how much money exists" question dissolves — the answer is "exactly as much real capacity as the network has." A share is, concretely, a *claim on that fraction of the pool's resource output* — the currency is backed by the network's own services.
- **Paying inside a zone** transfers shares: single-owner accounts make this [consensus-number-1](mathematical-core.md#44-what-needs-consensus-roadmap-q3--answered-with-citations) — no global agreement, just the sender's order.

## What history teaches: a rate is discovered, never decreed

How did two economies that had never interacted come to share an exchange rate? In stages, none of them a designed "merge":

1. **Autarky → no rate.** Nothing to price.
2. **First contact = barter at the interface.** The rate is *born pre-monetary* as a goods ratio ("1 of our wheat = 2 of their oil"), discovered by haggling at the boundary. From birth it is **the clearing price of cross-boundary flow** — not a property of either money.
3. **A commodity bridge pins monetary par.** Once both value a common good (silver, salt), each money's price *in that good* fixes the cross-rate; **arbitrage enforces it**, deviating only within a band set by the cost of shipping the bridge good — the historical **specie points**.
4. **Credit and clearing move value without moving specie.** Merchants netted offsetting claims via **bills of exchange at clearing fairs** (Champagne, Lyon) and later **correspondent banks** holding mutual accounts. A *tree* formed: local → regional fair → international centre (Amsterdam, London). Rates were quoted **at the clearing layer**; value propagated up-and-over-and-down it. This is the "hierarchy of balance trackers" — it already existed.
5. **Purchasing-power parity is the long-run anchor.** Goods arbitrage drags the rate toward the level that equalises tradable-goods prices; the residual difference is **real information** (non-tradables, productivity gaps — Balassa–Samuelson), not noise.
6. **Union or float.** Dense trade + correlated shocks (Mundell's [optimal-currency-area](living-system.md) criteria) → fix or merge; otherwise float and keep autonomy.

**The lesson that reshapes the design:** *there is no merge mechanism to build.* An exchange rate is the shadow price of boundary trade, discovered locally by arbitrageurs and anchored by whatever is tradable across the boundary. **Build the boundary, not the merge** — local trade plus a local quote — and the rate, and eventually the union, emerge. (Theory to dig: Menger on the spontaneous origin of money via *saleability*; Kiyotaki–Wright's search-theoretic emergence of a medium of exchange.)

## The exchange-rate field, and why value must physically propagate

Map stage 3 onto the stack and the bridge becomes endogenous and physical: the thing that pins `χ(z→z')` is the **relative basket-price of the same real resource** — a GB-month of storage, a kilostep of compute — in the two zones. Those costs genuinely differ by location (power, hardware, demand are local), and no one can move the rate without providing or consuming *real* resources. The resource basket I use as the unit of account is thus also the silver that anchors every rate.

So `χ` is a **field over the coordinate space**, not a number: adjacent zones near 1, distant zones large with large spreads. To spend value from a distant pool you **route a path-payment** through the field, paying the local spread at each hop — exactly a bill of exchange propagating through correspondent banks. The **accumulated spread *is* the cost of distance**, and it is real. Crucially this is *the same min-cost flow over the coordinate space* as the [resource market](core/resource-market.md)'s `MATERIALIZE`: moving value and moving resources are one routing problem. Money obeys the same physics as latency — **near is cheap, far is dear** — which re-localises economic loops into exactly the bounded zones consensus and the truth machine already want.

## The hierarchy of balance trackers

The "hierarchy of balance trackers" is the correspondent-banking tree of stage 4, mapped onto the stack's node ⊂ zone ⊂ network nesting:

- **Leaf (zone ledger):** maintains the cap table `θ_{·,z}` and `V_z`, runs local `δ_z` demurrage + UBI. Share transfers are consensus-number-1.
- **Internal node (clearing house):** sits above sibling zones; maintains the exchange rates among them (an AMM / order book fed by observed cross-zone flow) and holds small reserve positions in each child for liquidity, earning the spread. The fair / correspondent bank.
- **Recursion:** clearing houses are children of higher clearing houses to a root. Rates compose along tree paths (`χ_{A→C} = χ_{A→p}·χ_{p→C}`); triangular arbitrage closes inconsistency — arbitrage profit is the error-correcting signal.
- **Routing:** pay distant `C` from `A` by going up to the common ancestor and down, *or* laterally through adjacent zones if that path's total spread is lower. The network finds the min-cost path — same machinery as resource routing.

## Demurrage and UBI: local effects that agglomerate

Demurrage and UBI are defined **only locally** — each zone decays its own shares toward the equal share `1/n_eff` and recycles the decay into its own drip. Nothing reaches across a boundary directly. In value terms, per zone:

```
ẇ_{i,z}  =  −δ_z·w_{i,z}  +  δ_z·b_z·ν_{i,z}  +  (e_{i,z} − s_{i,z})
```

with `b_z = V_z/n_eff(z)` the per-capita baseline and `ν_{i,z}` the agent's Sybil-gated marginal `n_eff` in `z`. Sum over an agent's whole portfolio (`w_i = Σ_z w_{i,z}`). **If `δ_z = δ` everywhere:**

```
ẇ_i  =  −δ·w_i  +  δ·B_i  +  Φ_i        ⟹        w_i*  =  B_i  +  Φ_i/δ
```

— `B_i = Σ_z b_z·ν_{i,z}` is your *portfolio baseline*, `Φ_i` your *global net cross-zone flow*. This is the [egalitarian attractor (Prop. 7)](mathematical-core.md#41-the-wealth-dynamics) reborn at global scale: **the local δ-dials agglomerate into one global dispersion dial.** Geometrically, treat wealth as a field over the topology — UBI a local source, demurrage a local decay, trade an advective coupling across boundaries — and the global distribution is the **steady state of a reaction-diffusion system**. Every point has only local heating/cooling; the global pattern is the agglomerated solution, like temperature. (This is also the right object to *simulate* when testing the claim.)

Two designed dynamics fall out:

- **Gresham's law works *for* us.** People spend the decaying local shares ("bad money") and save the stable thing — the basket, or a reserve hub's shares ("good money"). That is exactly the goal: demurrage drives circulation, the store-of-value drifts to savings, and `δ` tunes which is which.
- **A reserve currency emerges endogenously.** The most *topologically central* zone has the lowest accumulated spread to everywhere, so routing through it is cheapest and its shares become the universal intermediary (London/USD by topology, not decree). This is the **deepest risk**: the hub accrues seigniorage and becomes a concentration/capture point one layer up.

**The catch (important).** With *heterogeneous* `δ_z` the agglomeration is a sum of terms relaxing at different rates, dominated by the **slowest — lowest-demurrage — zone**. A single zone that sets `δ_z → 0` becomes a **concentration sink**: wealth flees there to escape decay and pools up, dragging down *global* dispersion no matter what other zones do. This is capital flight to tax havens, derived from the dynamics. So "demurrage is purely local" is mechanically true, but **global dispersion (V3 / A2) requires a coordinated floor `δ_min`** — full local monetary sovereignty and a global dispersion guarantee are in tension (Mundell again). How that floor is set without a center is the crux below.

## Bootstrapping = perfusion, gated by local integrity

A newcomer is a new cell: it must be *perfused* (given a starting share so it can transact before contributing) and then *differentiate* (grow a behavioural signature). But boundary integrity is weakest exactly at birth — a newcomer has no history, so [Sybil resistance](independence.md) is weakest precisely when we hand out resources. Geography resolves it: physical proximity is hard to forge in bulk, so locally-present members vouch for a newcomer, who enters through a local zone with a starting share bounded by the strength of that local personhood proof, ramping to full UBI as its signature individuates (saturating at one share — a ramp, not rich-get-richer). The coordinate space does quadruple duty: latency, birth-vouching, currency locality, consensus locality.

## The remaining crux

> **Proposed resolution (draft).** Promoted from "open." The resolution reuses machinery already in the stack — the cooperation field `κ`, the correlation matrix `Σ`, the [δ-dial](mathematical-core.md#42-the-δ-dial-assumption-a2-becomes-a-theorem), and the multi-level [living-system](living-system.md) frame — rather than inventing new mechanism. It is still a draft: the homeostatic-controller stability claim (last subsection) is unproven and is the first thing to simulate.

Two questions, entangled, decide whether this design lives:

1. **How is a zone *defined*?** It can't be hand-drawn.
2. **How is the global baseline `δ_min` set without a center — and what stops over-centralisation?** (The anti-haven floor and the reserve-hub problem are one problem.)

Both reduce to a single real-world dynamic: **cooperation is enabled by forming a higher-level organism that binds its constituents' fate and polices their defection, and that organism survives only by serving them (or it is exited), suppressing internal cancer (or it rots), and out-competing peers (or it ossifies)** — the major-evolutionary-transition pattern (Maynard Smith & Szathmáry: genes→chromosome, cell→eukaryote, cells→body), which is exactly the [living-system](living-system.md) §3 list. A zone *is* such an organism; `δ` is how the money layer pays for "shared fate + policing."

### Zones self-organise on the cooperation field

Let `κ(a,b)` be the **fate-sharing coupling** between two parties — the cooperation surplus from pooling rather than trading at arm's length (how much one's failure hurts the other; how much they gain from sharing shocks and specialising). A **zone is then a modular community of `κ`**: pool into one ledger / one `δ_z` where `κ` is high (a monetary organism forms); trade at an exchange rate where `κ` is low. The **boundary is where `κ` drops — exactly where maintaining `χ` is worth its cost.** Zone definition and the merge threshold are the *same* threshold on `κ`. This reuses the coupling field already posited in [living-system](living-system.md) §6 / [math core](mathematical-core.md) §5: **the zone-definition prior and the anti-centralisation regulariser are one object.**

> ⚠️ **The `Σ` double-reading.** `κ` is read off the *same* residual-correlation matrix `Σ` the [immune system](independence.md) uses — but with opposite sign. The immune system reads correlation as *less independent information* (discount aggregation weight); the money layer reads it as *fate-sharing* (form a pool). Two readings, different scopes (global aggregation vs. local pooling). Legitimate dense cooperation must not be punished as collusion — the signatures differ (puppets share a controller's private state while *mimicking* independence on paid dimensions; cooperators share common-shock exposure while acting autonomously) — but separating them cleanly is Prop. 6's open problem, now load-bearing for *where zones are drawn*.

### Over-centralisation is prevented by selection, not a rule

Cooperation surplus has diminishing returns while coordination + capture cost rises with scale, so there is an *optimal organism size* (the Coasean / optimal-currency-area boundary). A too-central structure — a giant pool, or a reserve hub that ate the network — is slow, captured, and blind to local conditions; it serves constituents worse and sheds them to more agile rivals. So the regulariser is one invariant: **keep exit cheap and let between-organism selection prune the over-central** (V4). Demurrage already supplies it — stock is a weak lock-in; with portable shares + portable reputation, exit cost ≈ social re-coupling (Prop. 8). The emergent reserve hub is tolerable *iff contestable*: demurrage-on-hub-shares + competing hubs + bypass routing keep it earning its spread by service rather than rent. **Cancer = extraction without contestability.**

### `δ_min` is the cooperation-maintenance rate, regulated at three levels

The deepest claim: **`δ_min` is not a constant to choose; it is the rate that keeps cooperation incentive-compatible — and it is already in the math.** Read the δ-dial `δ ≥ ē / (M(β − 1/N))` as a molochian price: demurrage is what the stock-rich pay to keep the flow-poor inside the cooperative instead of exiting or being captured-out. More centralising pressure (larger `ē`) → higher `δ_min` to hold the cooperation bound `β`; and `β` is itself set by *how dispersed capital must be for the organism's brain — the truth machine — to stay accurate*. So `δ_min` is **derived, not chosen: whatever keeps the truth machine accurate.** It is enforced at three nested levels — immune, endocrine, evolutionary:

1. **Boundary reputation (local, bottom-up).** Each zone prices another's shares by how well it upholds the dispersion norm; a haven (`δ_z→0`) is *illiquidity-punished* at the boundary — neighbours widen its spread or refuse its shares as reserves, so fled capital can't cheaply spend back out. The law-merchant boycott (Greif's Maghribi traders) applied to monetary policy: local enforcement that agglomerates into a global floor, with no central vote.
2. **Homeostatic governance (the set-point).** `δ_min` is a thermostat whose sensor is the truth machine's own accuracy — the organ concentration harms. Governance raises `δ_min` when the brain reads "too concentrated." This closes the stack's one cycle: the thing that needs dispersion sets the dial that enforces it.
3. **Between-network selection (the backstop).** A network that fails to regularise havens has its truth machine captured → worse collective decisions → members exit to better-run networks. The floor becomes an evolved invariant: networks without it die.

The global baseline is thus the *agglomeration* of local metabolism (`δ_z` per zone), coupled by `κ`, held to a floor by these three. Like body temperature: no cell is told the number; the body maintains it.

### The homeostatic controller, sketched

Level (2) is a control loop, and naïvely it goes unstable. Model it:

- **Plant.** Concentration `C(t)` (say, the top resolver-budget share, or a Gini of `w`) relaxes toward an equilibrium set by current demurrage and exogenous earning-advantage pressure `ē(t)`, with time constant `1/δ`:  `Ċ ≈ −δ(t)·(C − C_eq) + g(ē(t))`. Raising `δ` pulls `C` down, but only over `~1/δ`.
- **Sensor.** The truth machine reports brain-health `H(t)` (calibration / aggregation precision), degrading as `C` exceeds the bound:  `H ≈ H₀ − γ·max(0, C − β)`. **The sensor is itself lagged** — `H` is only legible after questions resolve (months) — so the controller observes `C` through a delay `τ`.
- **Controller.** Governance sets `δ(t)` from the error `(C − β)`.

The failure mode is classic: a **bang-bang / high-gain** controller (slam `δ` to max the moment `H` dips), driving a plant with relaxation lag `1/δ` *and* sensor delay `τ`, produces a **limit cycle — monetary boom-bust**: over-demurrage crushes flow, the productive exit, governance over-corrects, repeat. Delay + integral action is the textbook recipe for oscillation.

The fix is the textbook one — a **damped PI controller with anti-windup and a slew-rate limit on `δ`**:

```
δ(t) = clamp(  δ_base
             + k_p·(C − β)
             + k_i·∫(C − β) dt ,    δ_floor,  δ_ceiling )
```

with loop gain tuned against the **dominant lag** `T ≈ 1/δ + τ` so the closed loop is over-damped (comfortable phase margin; no integral wind-up while `δ` is clamped). Equivalently: **`δ_min` should track a *low-pass-filtered* concentration signal, never the instantaneous one** — move the floor slowly relative to `1/δ`, and let fast disturbances be absorbed by boundary reputation (1), which acts locally and *without* the sensor delay. The division of labour is itself stabilising: the slow endocrine loop sets the baseline; the fast immune loop handles shocks.

**What to simulate (Phase-1 theory track).** An agent-based model of the coupled system — pool shares, per-zone `δ_z`, cross-zone trade on a `κ`-graph, the lagged truth-machine sensor — sweeping `(k_p, k_i, τ, δ-slew)` to map the **stable region vs. the limit-cycle region**, and confirming the three levels together hold `C ≤ β` (V3) without oscillation. This is the money-layer's slice of the grand-conjecture stability proof ([math core](mathematical-core.md) §7): does the organism hold homeostasis, or does its metabolism oscillate itself to death?

> ⚠️ **Where it could break.**
> - **Thin-boundary manipulation** — rates set by little volume are gameable; the basket anchor and `n_eff`-weighted quoting bound it but don't kill it.
> - **The haven / δ-floor problem** — heterogeneous `δ_z` leaks dispersion to the slowest zone (above).
> - **Reserve-hub capture** — topological centrality re-concentrates power; tolerable only while the hub stays *contestable* (demurrage on hub shares, competing hubs, bypass routing).
> - **Measuring `V_z`** trustlessly needs the [resource market](core/resource-market.md) already live and price-discovering — a bootstrapping dependency (the currency can't precede real priced resources).
> - **Share issuance / dilution** — when capacity is added, the rule mapping work → new shares (diluting others, growing `V_z`) is the one genuinely-unwritten primitive.
> - **Cooperation-correlation vs. Sybil-correlation** — the same residual-correlation matrix `Σ` the immune system reads as "less independent information" is what the money layer reads as "high fate-sharing → form a zone." Two readings of one matrix; keeping legitimate local cooperation from being punished as collusion is subtle.
>
> 📐 Formal version: [The Mathematical Core](mathematical-core.md) §4 — the wealth dynamics, the egalitarian-attractor proposition, and the δ-dial that turns A2 into a theorem.
