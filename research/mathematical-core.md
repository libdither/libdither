# The Mathematical Core

*Third document in the sequence: [roadmap.md](roadmap.md) (engineering map) → [the-living-network.md](the-living-network.md) (unifying abstraction) → this (the math). Goal: take every open question flagged in the first two documents and either answer it, reduce it to a measurable quantity, or state precisely why it is open. Notation is plain-text math in the style of the [truth-markets synthesis](governance/retroactive-consensus-markets.md).*

---

## 0. The object, defined

A **Dither organism** is a tree of agents (node ⊂ zone ⊂ network), where each agent `a` maintains a boundary and solves one control problem:

```
minimize  F_a  =  E[ priced unmet demand inside a's boundary
                     + maintenance cost of a's internal states
                     − revenue from serving demand across a's boundary ]
```

Agents are coupled by exactly **three operators**, and the entire stack is these three operators applied at every scale:

| Operator | Couples across | Implements | Layer name |
|---|---|---|---|
| **Price field** `p(v, x, t)` | space (within a scale) | the substrate market | storage/compute/routing |
| **Scoring rule** `ρ` | time (present ↔ future verdicts) | the epistemic engine | truth machine |
| **Independence weight** `n_eff` | identity (who counts, how much) | the immune system | Sybil/identity/voting |

plus one **vertical flow**: weight issuance downward (credits, UBI, witness power, all gated by `n_eff`) and aggregation upward (world-models, preference tallies, all weighted by `n_eff`).

The claim made precise in this document: **the organism is viable iff four inequalities hold** (§7), and each of the four corresponds to one of the load-bearing open problems from [the-living-network.md](the-living-network.md) §8.

---

## 1. The substrate: MATERIALIZE as priced flow

### 1.1 The optimization problem

Demand is a field `D(v, x, t)` — intensity of requests for value `v` at location `x` (locations = points in the latency coordinate space). The network chooses a flow over three edge types:

```
TRANSPORT-TIME(v, x, [t,t']):   cost = c_s(x) · |v| · (t'−t)        (storage)
TRANSPORT-SPACE(v, x→y, t):     cost = c_b(x,y) · |v|               (routing)
TRANSFORM({vᵢ} ↦ f({vᵢ}), x):   cost = c_c(x) · work(f)             (compute)
```

subject to: every demanded `(v, x, t)` is satisfied by some DAG of edges terminating in a materialization of `v` at `(x, t)` within its latency bound. This is a min-cost multicommodity flow problem in a spacetime-value graph; "fetch vs. recompute" is route choice within one graph.

**`work(f)` has a canonical unit.** Tree calculus is deterministic and confluent, so "number of kernel reduction steps" is a machine-independent work measure — the natural gas metric. disp gives the substrate market its metering for free.

### 1.2 The local decision rule (caching = replication = memoization)

For a price-taking node at `x`, holding value `v` is profitable iff

```
λ_v(x) · p(v, x)   >   c_s(x) · |v|
```

where `λ_v(x)` is local demand intensity and `p(v,x)` the posted price of delivering `v` at `x`. One inequality; instantiated with `v` = a file it is a CDN/replication rule, with `v` = a function result it is memoization, with `v` = a hot route's session state it is caching. This is the formal content of "storage, compute, routing are one thing": **one flow problem, one threshold rule.**

### 1.3 Prices are prediction errors (de-metaphorizing the FEP)

Define network free energy as total expected priced shortfall plus maintenance:

```
F  =  Σ_{v,x}  D(v,x) · shortfall_cost(v,x)  +  Σ_nodes maintenance
```

**Proposition 1 (alignment).** If delivery is priced at marginal shortfall cost and nodes are price-takers, then a node's profit from any local action equals the decrease in `F` that the action causes. Individual profit-seeking is distributed gradient descent on `F`.

*Sketch.* Marginal-cost pricing makes each served request transfer exactly its social shortfall-saving to the server; maintenance is borne locally; sum over actions. This is the first welfare theorem specialized to a convex flow problem. ∎

This answers the "FEP is slippery" objection from [the-living-network.md](the-living-network.md) §8 by *choosing* the free-energy functional and *deriving* the alignment, rather than asserting it: the price field **is** the prediction-error field. (Honest scope: Proposition 1 needs convex costs and no market power; lumpy storage and monopoly relays break it — see §8, Open-5.)

### 1.4 Verification (the layer-1 ↔ layer-4 bridge, made exact)

Because tree-calculus reduction is deterministic and confluent, two honest executors of `f(x)` agree **bit-for-bit**. Hence:

- **k-replication:** sample `k` executors from a pool with honest fraction `h`; undetected fraud requires all `k` sampled to collude on the same wrong hash: `P[fraud] ≤ (1−h)^k`. Exponential security for linear cost.
- **Bisection disputes:** hash-consed reduction traces are Merklizable; a referee resolves a disputed run by binary search over the trace in `O(log T)` checked steps (Truebit-style), so the *expensive* path is only taken on disagreement.
- **Predicate checking:** when the disp result-contract `P` is cheaper than `f` (NP-style asymmetry), the buyer verifies directly and no replication is needed.

### 1.5 The disp ↔ network boundary (roadmap Q4 — answered)

The language's effect signature and the network's service API are **the same three-operation algebra**:

```
Eff_net  ::=  store : Tree → Duration → Eff Receipt        (TRANSPORT-TIME)
           |  send  : Tree → Coord    → Eff Receipt        (TRANSPORT-SPACE)
           |  eval  : Tree → Tree     → Eff Tree           (TRANSFORM)
           |  price : Query           → Eff PriceQuote     (read the field)
```

Serialization is canonical: hash-consed subtree encoding with content-addressed chunking (dedup is free, since equal subtrees are pointer-equal already). The "TC-Net backend" in disp's EVALUATOR_PLAN is precisely an implementation of this algebra. **There is no separate "integration layer" to design; the substrate market is disp's evaluator.**

---

## 2. The epistemic engine: reflexivity solved-in-principle

This section addresses the gating question (roadmap Q1, truth-markets §8.1): does the perception↔action loop converge to truth or fiction?

### 2.1 The model

One binary question, true state `θ`. Forecaster's honest posterior given evidence: `π`. Resolvers see private signals of quality `q` and may also *defer* to the published consensus forecast `p`. Model resolver verdicts as

```
r  =  λ · g(p)  +  (1−λ) · σ(θ)
```

where `σ(θ)` is the signal-driven verdict probability, `g(p)` the deference response, and `λ ∈ [0,1]` the **deference weight** — the fraction of resolution behavior driven by the forecast itself rather than by independent perception. Forecasters paid by proper scoring against `r` will publish the fixed point

```
p*  =  λ·g(p*) + (1−λ)·π
```

### 2.2 The convergence results

**Proposition 2 (linear herding is harmless).** If `g(p) = p` (resolvers defer linearly) and `λ < 1`, the unique fixed point is `p* = π`. The forecast remains exactly the honest posterior; properness is preserved.

*Proof.* `p* = λp* + (1−λ)π ⟹ (1−λ)p* = (1−λ)π ⟹ p* = π`. ∎

This is genuinely surprising and important: **reflexivity does not bias the forecast at all in the linear regime** — the influence passes through and cancels. The beauty-contest pathology requires nonlinearity, not mere influence.

**Proposition 3 (bifurcation threshold).** The fixed point is unique for any `g` with `λ · sup|g′| < 1`. If `λ · sup|g′| > 1` (e.g. conformity response `g(p) = sigmoid(κ(p−½))` with `λκ/4 > 1`), multiple stable fixed points exist — including **fiction equilibria** where `p*` is near certainty while `π` is not. This is the dark room, as a bifurcation.

*Sketch.* Banach contraction for uniqueness; for the sigmoid case, plot `p ↦ λg(p)+(1−λ)π`: slope > 1 at the crossing creates the classic S-curve with three intersections, outer two stable. ∎

**Proposition 4 (continuous degradation below threshold).** Even when unique, the verdict's information about `θ` degrades: verdict precision scales as `(1−λ)²`, and deference correlates resolvers through the common channel, so `m` resolvers are worth only

```
m_eff  =  m / (1 + (m−1)·ρ_λ)
```

independent ones, where `ρ_λ` is the deference-induced verdict correlation. Aggregation quality decays smoothly in `λ` long before the bifurcation.

### 2.3 The design consequences (now concrete mechanisms)

The whole reflexivity question reduces to **one measurable scalar: the deference slope `L = λ·sup|g′|`**, with safety condition `L < 1`. Three mechanisms control it:

1. **Blind resolution (information design).** The resolution interface does not display the current consensus `p` when a resolver records a verdict. You cannot make `λ = 0` (public knowledge leaks), but you remove the highest-bandwidth channel from `p` to `r`. This is a UI decision with a theorem behind it.
2. **Reality coupling (incentive design).** Pay resolvers a small properness bonus on their *own verdicts* scored against later-arriving information; this rewards using the private signal, directly lowering `λ`.
3. **Perturbation audits (measurement).** On a random subset of questions, randomize what consensus value is displayed to resolvers (or randomize blind vs. shown). The regression of verdicts on displayed consensus estimates `λ·g′` directly. **The pilot's primary measurement target is `L̂`** — the system's distance from the bifurcation.

**Proposition 5 (effort routing preserves properness).** Modifying the *score* with an uncertainty bonus breaks properness (it pays for confidence per se). But scaling each question's reward budget by any forecast-independent factor `u_q` preserves per-question properness. Choosing `u_q ∝` expected **value of information** (decision-relevance × current entropy under a *lagged* consensus model) routes optimization power toward uncertainty that matters — the "epistemic value" requirement from the living-network essay, implemented without touching the scoring rule. (Lagged/frozen `u_q` so no individual forecast can move its own question's budget.)

### 2.4 Resolver honesty (truth-markets §8.2 — reduced to an inequality)

Per-resolver scoring **contains** corruption: resolver `j` lying corrupts only `R_{i,j}`, no one else's channel (unlike a global oracle, where one corruption poisons everything). The remaining question is whether `j` lies in their own channel. But `j` *consumes* their own rankings: their allocations are guided by forecasters selected via `R_{i,j}`. Mis-resolving toward a lie `r̃` selects forecasters skilled at predicting `r̃`-shaped verdicts rather than `θ`, degrading `j`'s own future allocation utility. Honesty is dominant when

```
∂U_j/∂(ranking fidelity)  >  side-payment available for lying
```

— a skin-in-the-game inequality satisfied for resolvers who actually allocate the budgets they score with (and *not* for pure influence-buyers, who should be down-weighted in the public aggregate exactly as §3 prescribes — the same independence machinery applies to the resolver side: correlated resolver blocs get GLS-down-weighted in `p*`).

### 2.5 The "extrapolated intention/utility" operator (truth-markets §8.5 — defined)

Define the retroactive value of forecaster `i`'s information to resolver `j` as decision value:

```
EU(i→j)  =  E_j[ U_j(allocation with p_i) − U_j(allocation without p_i) ]
```

evaluated under `j`'s own posterior world-model. This is implementable **by self-application of the engine**: "will `j`, in hindsight, judge that `i`'s forecast improved `j`'s allocation?" is itself a question with a per-resolver retroactive verdict. The regress terminates because its base case — `j`'s realized allocation outcomes — is directly observed by `j`. The previously-undefined desideratum is thus an ordinary question type inside the same market.

---

## 3. The immune system: independence accounting

This section addresses Sybil resistance, collusion, the autoimmune dilemma, and the QV attack at once (roadmap Q2, truth-markets §8.4, living-network §4 & §8).

### 3.1 The reframe: from personhood to precision

Stop asking "is this a distinct person?" Ask: **how much independent information does this constituent contribute?** Let `x_i` be agent `i`'s behavioral residual stream — forecast errors, transaction timing, verdicts — **after conditioning on public information** `c`. For honest distinct agents, residuals are (approximately) independent; for puppets of one controller, they remain coupled given `c`, because they share *private* state.

Let `Σ` be the residual correlation matrix. Define the **effective population**:

```
n_eff  =  1ᵀ Σ⁻¹ 1
```

— the precision of the optimally-weighted (GLS) average of the streams. For an equicorrelated cluster of `k` accounts with correlation `ρ`: `n_eff = k/(1+(k−1)ρ)`. Perfect Sybils (`ρ→1`) collapse to `n_eff = 1` no matter how many accounts; genuine independents (`ρ→0`) count fully.

**All weight in the system is issued per unit `n_eff`, not per account:**

- **Aggregation** (world-model, resolver consensus): GLS weights `w = Σ⁻¹1 / 1ᵀΣ⁻¹1` — correlated blocs automatically discounted.
- **Voting credits:** QV is `√k`-vulnerable to Sybils (split budget `c` across `k` accounts: votes go from `√c` to `√(kc)`). Issue credits proportional to each agent's *marginal* `n_eff` contribution and the attack yields **zero**: a fully-correlated cluster receives one agent's credits regardless of account count.
- **UBI / perfusion:** newcomer drip ramps with established marginal `n_eff` (a farm of fresh accounts shares ≈ one UBI until the accounts behaviorally diverge — §4.3).
- **Witness power** (timestamping, §5): attestations weighted by `n_eff`, so "many witnesses" means many *independent* witnesses.

> **`n_eff` is the single security parameter of the entire stack.** Votes, aggregation quality, UBI farming, witness security, and resolver-bloc resistance are all the same number. "Boundary integrity," quantified.

### 3.2 The autoimmune dilemma — dissolved, not solved

The feared false positive — "an honest local community that genuinely agrees gets punished as colluders" — is not an error under this accounting. Agents correlated through a *private* shared channel genuinely contribute less independent information; weighting them as `n_eff < k` is **accurate inference, not injustice**. There is no binary verdict to get wrong: weight is graduated, continuous, and recoverable (diverge behaviorally and your weight grows). The autoimmune problem was an artifact of demanding a yes/no Sybil classifier; precision accounting never asks the unanswerable question.

What *remains* open is estimation, not semantics: `Σ` is `n×n` and needs regularization. **The geographic/vouching graph is the prior on `Σ`'s sparsity structure** — locality's fourth job (after latency, birth-vouching, currency zones) is statistical: it tells the estimator where correlation is *expected*, so deviations are informative. (Privacy: residual correlations are computable over pseudonymous streams via secure aggregation; no real-world identity required — the trilemma's privacy corner holds.)

### 3.3 The mimicry bound (why this composes with metabolic identity)

The remaining attack is **adversarial decorrelation**: a puppeteer runs `k` accounts that *simulate* independence on every monitored dimension while coordinating on the payload.

**Proposition 6 (mimicry cost).** As the monitored behavioral dimensions approach the dimensions in which the system pays for work (forecast accuracy on diverse questions, storage/relay/compute service, transaction patterns), maintaining `k` streams that pass conditional-independence tests requires `≈ k` independent streams of real predictive/metabolic work. In that limit, the cheapest way to fake `k` agents is to *be* `k` agents — at which point, from the network's perspective, they are `k` agents.

*Sketch.* Passing independence tests on paid dimensions means producing `k` decorrelated, individually-rewarded performances; decorrelated competent forecasting requires `k` separately-maintained information positions; decorrelated service requires `k` resource commitments. The controller's *preference* correlation can survive — but preferences are exactly where weight is `√`-dampened (QV) and capped by credits ∝ `n_eff` earned on the paid dimensions. ∎

This is the formal content of "identity = metabolic signature": **deterrence = making mimicry-cost ≥ honest-cost**, and the inequality tightens as more of the economy's real work feeds the monitor. Honest scope: this is an asymptotic/arms-race bound, not a closed-form guarantee at any finite monitoring richness (§8, Open-1).

---

## 4. Money: demurrage as a control law

### 4.1 The wealth dynamics

Money supply `M`, population `N` (measured in `n_eff`!), demurrage rate `δ`. Each wallet decays continuously; the entire decay flow is recycled as the UBI drip `δM/N` per capita. Agent `i` earns `e_i` and spends `s_i` per unit time:

```
ẇ_i  =  −δ·w_i  +  δM/N  +  e_i − s_i
```

**Proposition 7 (egalitarian attractor).** The steady state is

```
w_i*  =  M/N  +  (e_i − s_i)/δ
```

with relaxation time `1/δ`. Wealth converges to *equal* plus *net-contribution-flow scaled by `1/δ`*. Demurrage converts unbounded **stock** inequality into bounded **flow** inequality: you can only be richer than baseline by `(your sustained net flow)/δ`.

### 4.2 The δ-dial: assumption A2 becomes a theorem

The truth machine's aggregation quality requires dispersed resolver budgets (assumption A2). If budgets are proportional to wealth and net earning advantages are bounded by `ē`, then the largest steady-state budget share is

```
max_j B_j/ΣB  ≤  1/N + ē/(δM)
```

**To enforce a target concentration bound `β`, set `δ ≥ ē / (M·(β − 1/N))`.** The demurrage rate is the knob that *enforces the epistemic layer's soundness condition*. This is the deepest cross-layer coupling in the stack, now an equation: monetary policy ⇄ truth-machine validity. (Caveat: this bounds steady-state stock, not instantaneous flow-through; a high-flow actor can still spend heavily in bursts — burst-spend caps on resolver budgets close that gap.)

### 4.3 Perfusion (new-user bootstrapping, quantified)

UBI to account `i` is `δM/N · ν_i` where `ν_i` is `i`'s marginal `n_eff` (§3.1), with the geographic vouching graph supplying the newcomer's prior `ν`. Consequences:

- A genuine newcomer, locally vouched, starts with modest nonzero perfusion and ramps to full share as their behavioral signature individuates. Saturates at 1 — a ramp, not rich-get-richer.
- A `k`-account farm shares ≈ one UBI until (per Prop. 6) it performs `k` agents' worth of real independent work.
- Zones run their own `(M_z, δ_z)` with exchange at boundaries: local cost-of-living tracking, organ-level metabolic autonomy.

### 4.4 What needs consensus (roadmap Q3 — answered, with citations)

- **Payments need no consensus.** Asset transfer with single-owner accounts has **consensus number 1** (Guerraoui, Kuznetsov, Monti, Pavlović, Seredinschi, *The Consensus Number of a Cryptocurrency*, PODC 2019): only the *sender's* own transaction order matters, and the sender provides it. Byzantine consistent broadcast suffices (implemented in FastPay et al.). Shared `k`-owner accounts need consensus only among the `k` owners.
- **Demurrage needs no consensus at all.** `w(t) = w(t₀)·e^{−δ(t−t₀)} + flows` is locally verifiable arithmetic.
- **Timestamps need only causal entanglement.** A forecast hash `h`, once referenced inside other agents' signed messages, is sandwiched: `h` existed before everything that cites it and after everything it cites. Backdating requires rewriting the signed causal cone of independent witnesses — and witness independence is, again, `n_eff`. Gossip rate sets timestamp precision; minutes-level precision is ample for scoring weights `w_t`. No total order required.
- **Only contested allocation needs ordering** — auctions for the same scarce item, name registries, zone-level governance execution. These run on small zonal BFT quorums (or, for slow decisions, on the truth machine itself). **The stack needs a blockchain nowhere; it needs zonal BFT in one narrow place.**

---

## 5. Architecture theorem: perception global, action zonal

**Proposition 8 (reputation is intrinsically portable).** `R_{i,j}` is a pure deterministic function of two public, self-certifying logs: `i`'s signed timestamped forecast stream and `j`'s signed verdict stream. Therefore *any* network, zone, or fork can recompute any reputation from portable data. No platform can custody reputation; epistemic switching cost ≈ 0 by construction.

This resolves the shared-reality vs. exit-discipline tension of [the-living-network.md](the-living-network.md) §6 with an architectural rule:

> **The perception layer (signed forecast/verdict logs, the world-model) is global, content-addressed, and portable. The action layers (currency, governance, resource allocation) are zonal and exitable.** Reality stays shared at the top (assumption A1 gets its large population); discipline and exit operate at the bottom (between-zone and between-network selection stays live); demurrage already makes currency stock a weak lock-in (wealth melts; what persists is flow and portable reputation).

Exit cost is then dominated by *social* re-coupling, which the portable logs minimize. This is "make exit cheap" as a design invariant rather than an aspiration.

---

## 6. What the centralized pilot must measure (roadmap Q5 — specified)

The pilot is now an *experiment with defined estimands*, not a demo:

1. **`L̂` — the deference slope** (the bifurcation distance, §2.3). Randomize, per question × resolver, whether current consensus is displayed at verdict time (blind vs. shown), and at what displayed value (within honest jitter). Regression of verdicts on display estimates `λ·g′`. **Success criterion: `L̂` measurably `< 1` under blind-resolution UI; dose-response visible when shown.**
2. **`Σ̂` — forecaster residual correlation structure** — feasibility of independence accounting: do residuals (conditional on public info) actually separate known-distinct individuals from deliberately-planted sock-puppet pairs (plant some, pre-registered)?
3. **Properness in practice** — do participants report calibrated beliefs under the reference-relative log score (calibration curves, sharpness)?
4. **VOI routing** — A/B question-budget weighting `u_q` (flat vs. VOI-weighted, §2.5): does optimization power follow the subsidy without distorting calibration?

Scale for signal: on the order of 30–100 resolvers, 100–300 questions with staggered horizons (science-impact claims fit: 6–24-month resolvability), every forecast and verdict signed and hash-entangled from day one so the timestamping layer (§4.4) is exercised by the same pilot.

---

## 7. The viability envelope

The four load-bearing problems from [the-living-network.md](the-living-network.md) §8 are now four inequalities. **The organism is viable iff:**

```
(V1) Contraction:    L = λ·sup|g′| < 1            — perception dominates action
                                                     (else: dark room / fiction equilibria)
(V2) Immunity:       cost(mimic k agents) ≥ cost(be k agents)
                                                     — boundary integrity; n_eff sound
(V3) Dispersion:     δ ≥ ē/(M·(β−1/N))             — metabolic turnover enforces A2
                                                     (else: whale capture of the epistemic layer)
(V4) Exit:           switching cost < tyranny premium
                                                     — between-network selection stays live;
                                                       held by Prop. 8 (portable perception layer)
                                                       plus zonal action layers

(V5) Causal resolution:  verdicts are ex-post counterfactual contrasts, not raw
                         conditional outcomes  — else the rule lends proper-scoring
                         authority to a confounded judgment (futarchy's flaw).
                         See futarchy-and-causality.md. Dual to V1: both keep the
                         market an evidence instrument, never a mechanical decision rule.
```

These are not independent: V2 (`n_eff`) is a parameter inside V1's resolver count, V3's population `N`, and V4's witness security. **Boundary integrity is the load-bearing wall**, exactly as the anatomy predicted.

**The grand conjecture (the system's existence theorem, still open):** the coupled dynamics — price field (§1), scoring fixed point (§2), weight estimation (§3), wealth flow (§4) — possess a stable joint fixed point whenever V1–V4 hold strictly, and lose it when any is violated. Each subsystem's result above is a lemma toward this; the coupled proof (or agent-based demonstration) is the centerpiece of the Phase-1 theory track.

---

## 8. Scorecard: every open question, dispositioned

From **roadmap.md** "Open questions before Phase 2":

| # | Question | Status |
|---|---|---|
| Q1 | Does the reflexive loop converge? | **Answered in principle** (§2): linear influence is harmless (Prop. 2); danger is a bifurcation at deference slope `L = 1` (Prop. 3); `L` is measurable (perturbation audits) and controllable (blind resolution, reality-coupling). Remaining: empirical `g` shape, coupled-system proof (§7). |
| Q2 | Minimal identity primitive: Sybil-resistant + anonymous? | **Reframed and substantially answered** (§3): no personhood classifier; weight ∝ marginal `n_eff` from pseudonymous behavioral residuals; geography = prior on `Σ`; mimicry-cost bound (Prop. 6). Remaining: `Σ` estimation at scale, monitoring-richness arms race. |
| Q3 | Is global consensus avoidable? | **Answered: yes** (§4.4). Payments are consensus-number-1 (cited theorem); demurrage is local arithmetic; timestamps = causal entanglement with `n_eff`-weighted witnesses; only contested allocation needs zonal BFT. |
| Q4 | disp ↔ network boundary? | **Answered** (§1.5): the network service API *is* disp's effect algebra — `store/send/eval/price` = the three MATERIALIZE edges + the price field; canonical hash-consed serialization. |
| Q5 | Smallest meaningful pilot? | **Specified** (§6): estimands `L̂`, `Σ̂`, calibration, VOI-routing; blind/shown randomization; planted sock-puppets; ~30–100 resolvers, ~100–300 questions. |

From the **[truth-markets synthesis](governance/retroactive-consensus-markets.md) §8**:

| # | Problem | Status |
|---|---|---|
| 1 | Reflexivity / beauty contest | → Q1 above. |
| 2 | Resolver honesty unmodeled | **Reduced to an inequality** (§2.4): per-resolver containment + self-consumption of rankings; honest iff allocation stake > bribe; influence-buyers handled by resolver-side GLS. |
| 3 | Manufactured surprise / bad reference | **Mitigated by construction**: reference = lagged consensus (the genuine frontier); budgets `u_q` frozen so they can't be self-moved (Prop. 5). |
| 4 | Collusion / Sybil | → Q2; one mechanism (§3) covers forecaster collusion, resolver blocs, Sybils, and QV's `√k` attack. |
| 5 | "Extrapolated intention/utility" undefined | **Defined** (§2.5): decision-value-of-information, computed by self-application of the engine; regress terminates at realized allocation outcomes. |

**Genuinely still open** (the honest residue):

1. **The arms race floor (V2 at finite richness).** Prop. 6 is asymptotic; how much monitored behavioral diversity suffices in practice is empirical.
2. **The shape of `g`.** `L < 1` is measurable, but we don't know human deference response curves in this setting until the pilot runs.
3. **Preference-side depth.** `n_eff`-gated QV fixes Sybil/collusion, and the fact/preference split (delegate *facts* to the market, keep *preferences* quadratic and personal) is justified — but full liquid *preference* delegation semantics under independence accounting (delegation **is** voluntary correlation) needs its own treatment. Current recommendation: delegation operates on the epistemic side only.
4. **Open-economy monetary dynamics.** Inter-zone exchange rates, speculative pressure on a demurrage currency, and the (dubious) external peg all need real macro analysis.
5. **Substrate market under non-convexity.** Prop. 1 assumes price-taking and convex costs; lumpy storage commitments and relay market power need mechanism design (posted-price vs. auction hybrids).
6. **The grand conjecture** (§7): the coupled fixed-point/stability proof — the actual "does the organism live" theorem. The Phase-1 agent-based simulation should target exactly the V1–V4 phase boundaries.

---

## 9. The whole design in five equations

```
(1) Substrate:    cache/replicate/memoize iff   λ_v(x)·p(v,x) > c_s(x)·|v| ;
                  profit = −∇F under marginal-cost prices.            (§1)

(2) Perception:   p* = λ·g(p*) + (1−λ)·π ;  truth-tracking iff L < 1. (§2)

(3) Identity:     n_eff = 1ᵀΣ⁻¹1 ;  all weight (votes, UBI, witness,
                  aggregation) issued per unit marginal n_eff.        (§3)

(4) Metabolism:   ẇ = −δw + δM/N + e − s ;  w* = M/N + (e−s)/δ ;
                  δ ≥ ē/(M(β−1/N)) enforces dispersion (A2).          (§4)

(5) Architecture: perception global & portable (R = pure fn of logs);
                  action zonal & exitable.                            (§5)
```

Five equations, four viability inequalities (V1–V4), one conjecture (§7). That is the mathematical core.
