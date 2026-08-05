# Working Note · Contestability

> 🧪 **Working note** (AI-drafted — [provenance](../ai-disclosure.md)). Gives "extraction without contestability is cancer" ([Money](../04-money.md)) an operational definition, and sketches the mechanism design owed by [The Market](../03-market.md)'s open problems for monopoly relays. Comes with an [interactive sandbox](contestability-sim.html).

*Prompted by Ben Hoffman's ["Talents"](https://benjaminrosshoffman.com/talents/): wealth compounds under "to those who have, more will be given," and identical accumulation can be evidence of production (his bread parable) or of complicity in extraction (his shields parable) — the two are bound into one unit of account, so holdings alone can't tell you which. A hub's balance in this network has exactly that ambiguity. This note is about unmixing the signal, mechanically.*

---

## 1. Two failures, one umbrella, one bound

Two formalisms get conflated whenever "externalities" and "monopoly" appear in the same sentence, and keeping them apart is load-bearing:

- **Externality** (Pigou; Arrow's framing): an action enters a third party's payoff with no price attached — a *missing market for a side effect*. It occurs under perfect competition: a thousand perfectly contestable relays still congest a shared link. Remedy: price the effect at marginal external cost. The fast market's rule — delivery priced at the marginal cost of *unmet* demand — already is this remedy for congestion. Nothing in this note replaces it.
- **Non-contestability** (Baumol–Panzar–Willig): a position is contestable when entry is free and **exit is costless — no sunk costs** — so a hit-and-run entrant disciplines any price above cost *even if it never actually enters*. The operative variable is sunk cost, not the count of current competitors. As a description of real industries the theory got a rough reception (tiny sunk costs break it); as a **design target for a protocol** it's exactly right, because a protocol can drive sunk costs toward zero on purpose — portable shares, portable reputation, open formats. "Stock is a weak hostage" is this theory, applied.

Both are missing markets — one for the side effect, one for the alternative — and the generic fix is the same: construct the missing market where you can, approximate its price with a tax where you can't. But the deeper link is directional. **Contestability is not the source of externalities; it is the bound on them:**

> **The exit bound.** The harm a position can impose on a dependent — censorship, surveillance, spread manipulation — is capped by that dependent's cost of exit (switching cost plus sunk relationship capital).

Hirschman's *exit*, made quantitative. It applies reflexively: the immune system's own institutions are capped by the same inequality, which is why the enforcement layer must live on everyone's devices as recomputable common knowledge rather than in an appointed organ. Cheap exit isn't one virtue among several; it is the ceiling on every abuse this design worries about.

## 2. The measurable quantity: the VCG premium

There is a known mechanism that fits this network almost embarrassingly well. Feigenbaum, Papadimitriou, Sami & Shenker (2002) computed VCG payments for lowest-cost interdomain routing *distributedly*: each transit node is paid its cost plus

```
rent(v) = cost(best path avoiding v) − cost(best path via v)
```

That bracketed premium is precisely "the part of your income that would evaporate if a competitor existed" — positional rent as a locally computable number, at modest overhead on top of a routing computation the node performs anyway. Betweenness centrality is the crude static proxy; the VCG premium is the economically correct one.

Crucially, each node has a *selfish* reason to compute its own premia over its dependencies: `rent(v)` from my vantage is my **exposure** if `v` defects — how much collateral to demand, how warm to keep my backups. The private value is risk management. Only the aggregation is a public good.

## 3. Three layers

**Topological (local, nearly free).** Every node maintains k alternative paths per dependency and the resulting premia. Byproduct of resilience it wants anyway.

**Independence-weighted (the [immune system](../05-immune.md)'s machinery, wearing a third hat).** A bypass disciplines the incumbent only if it's *independent* of the incumbent. A hub running its own shadow "competitor" is a puppet account wearing infrastructure — same disease, same detector. The real metric is an **`n_eff` over alternatives**: alternatives weighted by cost-competitiveness *and* by independence from the position they'd bypass, using the same residual-correlation accounting that counts voters. ⚠️ This means the one estimation problem now wears three hats — distinctness of voices, trustworthiness of partners, independence of alternatives — and this note deepens the dependence on it without easing it.

**Realized (randomized bypass audits).** The [futarchy prohibition](../futarchy-causality.md) bars wiring conditional forecasts into allocation because the branch not taken is never observed. The fix here is the experimentalist's: *take the branch, with small probability.* A fraction ε of traffic routes via the second-best independent path, subsidized for the premium. Three jobs at once:

1. The counterfactual becomes an **observation** — contestability claims resolve against audit outcomes, not conditionals. Randomization is causal hygiene by another door; the prohibition is untouched because what gets wired is a measurement, in the same legitimacy class as the measured concentration that already drives `δ`.
2. Alternatives stay **warm**. Baumol's entrant must genuinely be able to run; an unexercised backup decays into fiction. Audits are fire drills for exit.
3. Audits **are** enforcement, in part: measured bypass traffic is a standing, credible exit threat requiring no coordination.

The slow market prices what topology can't see — elasticity ("if the hub raises its spread, does volume actually move?"), capacity ("could the bypass absorb the full load, not the audit trickle?"), hidden common control. And the incentive problem for honest measurement reduces to existing machinery: a published contestability report *is a forecast* of what a bypass audit would find, timestamped by receipts, scored by the proper-scoring rule when audits resolve it. Right, different, early — no new mechanism.

## 4. The tax, and the closed Georgist loop

Tax the *measured* rent, self-extinguishingly: a levy on markup income scaled by scarcity of independent alternatives (`1 − n_eff/n_target`, clamped). Where competition is real the levy collects nothing — zero distortion of honest earning. It bites only where alternatives are measurably scarce. Revenue splits between the basic-income drip and the audit subsidy: **the rent funds the exit infrastructure that eliminates the rent.** Henry George's single tax as a feedback controller — tax the value of position (created by everyone else's presence), leave the value of service untaxed, pay the dividend — with the same set-point discipline as everything else: move slowly, filter the sensor, let governance adjust targets as evidence.

One caveat travels with the analogy: Harberger-style self-assessed pricing belongs on *transferable* positional assets (names, keyspace, hub liquidity) and never on trust or identity — reputation you can buy at a posted price stops being a signal, which would re-mix exactly what this note exists to unmix.

## 5. What the sandbox shows

The [**interactive simulation**](contestability-sim.html) is a minimal model — clustered communities joined by sparse bridges, cheapest-path routing, every node hill-climbing its markup — sized for intuition, not proof. The `n_eff` estimator is deliberately a *dial*, not a solved inference: the sim's honest output is how good the estimator must be, not a claim that it exists. Findings so far:

- **The shields phase is endogenous.** Bridge nodes earn their centrality honestly, then learn what their position supports: rent shares up to ~0.6 with `n_eff < 1`, no scripting.
- **The tax has a threshold at a marginal rate of ~1 on scarcity-rent.** Below it, a *transfer* regime: high revenue, unchanged behavior. Above it, a *discipline* regime: hubs learn markups down and revenue **falls** — the self-extinguishing signature, visible in one chart. (Corollary discovered as a bug: a rent tax that isn't wired into the *marginal* payoff — subtracted where the node's learning can feel it — is mere redistribution.)
- **Sybil halo inflation works exactly as feared.** A hub cloning its own position inflates its estimated `n_eff` from ~0.7 to ~0.9 against a blind estimator, and its rent rides through the tax. Estimator quality is the whole game.
- **Collusion is only partially disciplined** — a cartel that ignores price signals gets taxed, not changed; audits erode its flow instead. Taxes discipline optimizers; exit handles the rest.
- The dividend pulls wealth Gini down by roughly a quarter at ~3% welfare overhead — the honest cost of audits taking second-best paths.

## 6. Open problems

- **Thin bypass.** Audit-scale substitutability ≠ full-scale substitutability; a bypass that can carry 1% of a hub's load disciplines little. Capacity forecasts in the slow market close some of the gap; rhymes with the thin-boundary manipulation problem in [Money](../04-money.md).
- **Audit targeting is the new capture surface.** "Audit my enemies, spare my friends" — target selection must be randomized per unit `n_eff` of requesters, like everything else the system counts.
- **The estimation problem, third hat.** Nothing here works better than the correlation decomposition works ([Immune System](../05-immune.md)); the sandbox quantifies the required quality, not a construction.
- **Congestion is not contestability's job.** It remains Pigouvian, priced in the fast market. Saying so explicitly, so nobody expects this machinery to fix it.

📐 Slots into: [Money](../04-money.md) (the hub paragraph and `δ` homeostasis), [The Market](../03-market.md) (open problems: monopoly relays), [Governance](../06-governance.md) (set-point maintenance), [Futarchy and Causality](../futarchy-causality.md) (randomized resolution).
