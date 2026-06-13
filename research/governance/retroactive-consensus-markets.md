# Retroactive Consensus Markets — A Rigorous Synthesis

*The foundational mechanism document for the governance / truth-machine layer. The four analytical notes — [roadmap.md](../roadmap.md), [the-living-network.md](../the-living-network.md), [mathematical-core.md](../mathematical-core.md), and [futarchy-and-causality.md](../futarchy-and-causality.md) — all build on the mechanism, assumptions (A1–A5), and open problems (§8) defined here. Condensed from three earlier source notes: "Retroactive Prediction Markets for Scientific Research Ranking," "Impact Markets," and "Ultimate Governance — Retroactive Consensus Prediction Markets + Hierarchical Liquid Quadratic Voting."*

## Thesis

Conventional prediction markets bind three things together that need not be bound: (i) eliciting a forecast, (ii) declaring what actually happened, and (iii) paying out. This proposal **decouples elicitation from resolution and reward**. Forecasters merely publish timestamped probability distributions. Each capital holder ("resolver") privately declares, whenever they like, what they believe happened, and an automated proper-scoring rule retroactively scores every forecaster *against that resolver's own ground truth*. Forecasters are therefore paid for predicting the **future consensus of resolvers**, which — under a shared-reality assumption — is a proxy for predicting future common knowledge. The same engine doubles as a **skill-ranking of forecasters**, which can then weight votes in a governance system.

The three source notes are three layers of one construction:

| Layer | Source note | Role |
|---|---|---|
| Mechanism | *Retroactive Prediction Markets* | The epistemic engine. |
| Application A | *Impact Markets* | Credentialing scientific work. |
| Application B | *Ultimate Governance* | Allocating public expenditure. |

---

## 1. The problem

We want to aggregate **decentralized, specialist information** to allocate scarce resources well. Concretely there are three disjoint populations:

- **Resolvers** `F` — hold capital, want to allocate it well, but lack domain knowledge. They are the ultimate arbiters of "what was true / what mattered."
- **Forecasters** `P` — hold domain knowledge but little capital. They have views on which projects, claims, or directions will pan out.
- **Candidates** `Q` — the projects, papers, claims, or events under evaluation.

The objective is a mechanism that lets `F` **buy** the dispersed knowledge of `P` and convert it into good allocations over `Q`, while paying `P` fairly and in proportion to the *informativeness* of what they contributed.

The difficulty is that the objective is **underdetermined**: metrics are contested, the relevant knowledge is opaque and held by specialists, and reasonable people pursue different directions. So we cannot specify the target function up front; we can only specify a *process* for discovering it.

---

## 2. Why existing prediction markets are insufficient

Three failure modes, stated precisely:

1. **Play-money markets** (e.g. Metaculus-style) let anyone open a market but give forecasters no financial stake. Without skin in the game they attract little *optimization power* — effort is not compensated in proportion to informativeness, so the best specialists do not show up.

2. **Real-money markets need a single, objective, point-in-time resolution.** This forces an external trusted party (Kalshi) or a game-theoretic oracle (Polymarket) to declare, at one instant, what *definitively* happened. That instant is a **central point of exploitation**: with real money on the line, ambiguous questions invite contested or fraudulent resolutions.

3. **Real-money markets degrade under inequality and ambiguity.** A sufficiently wealthy actor indifferent to losses can push the price of an ambiguous market. More generally, a market's ability to aggregate *decentralized* information falls as wealth concentration rises — exactly the regime (frontier science, policy) where we most need aggregation.

The common root: **resolution is a single, objective, irreversible event coupled directly to payout.** Remove that coupling and all three problems become tractable.

---

## 3. The mechanism: subjective retroactive scoring

### 3.1 Primitives

- A set of questions `q ∈ Q`, each with an outcome space `Ω_q`.
- Each forecaster `i ∈ P` publishes, at times `t`, a **timestamped distribution** `p_{i,q,t} ∈ Δ(Ω_q)` — their belief about `q` at time `t`. (Timestamps must be tamper-evident; see A4.) Forecasters stake *information*, not money.
- Each resolver `j ∈ F` may, at a time of their choosing, declare a **subjective resolution** `r_{j,q} ∈ Ω_q` — their own private verdict on what happened. Declaration is optional and revisable; a resolver may simply discard any question they find ambiguous or manipulated.
- A **strictly proper scoring rule** `S(p, ω)` (canonically the log score `S(p, ω) = ln p(ω)`), whose defining property is that reporting one's true belief uniquely maximizes expected score.

### 3.2 The reward rule

Score forecaster `i` against resolver `j`'s verdict on question `q` *relative to a reference belief* `p_ref` (e.g. the population/consensus belief just before `i`'s update):

```
ρ_{i,j,q} = Σ_t  w_t · [ S(p_{i,q,t}, r_{j,q}) − S(p_ref_{q,t}, r_{j,q}) ]
```

- The **reference subtraction** is Hanson's *market scoring rule* idea: a forecaster is paid for the *marginal* movement of belief toward the eventual verdict. You profit only by being **right and different from the crowd** — the formal version of "surprising and true." Merely echoing consensus earns nothing; moving belief the wrong way costs.
- `w_t` can up-weight *earlier* forecasts, further rewarding being right *before* it was common knowledge.

Forecaster `i`'s **reputation w.r.t. resolver `j`** is `R_{i,j} = Σ_q ρ_{i,j,q}`. Resolver `j` distributes a reward budget `B_j` across forecasters as a monotone function of `R_{i,j}` (e.g. softmax or positive-part normalization). Equivalently: an automated market maker retroactively "places bets" on each forecaster's behalf using their published probabilities, then settles those bets against `j`'s verdict.

The key structural facts:
- Resolution is **subjective** (per-resolver), **retroactive** (scored after the fact), **optional**, and **revisable**. No global instant of truth exists to attack.
- Forecasters are ranked *relative to each resolver's worldview* — there is no claim of objective truth, only of skill at predicting a given resolver's eventual verdicts.

### 3.3 What it incentivizes — the consensus-proxy claim

**Proposition (informal).** Suppose a forecaster is risk-neutral, cannot influence resolutions, and seeks to maximize total expected reward `Σ_j B_j · E[ρ_{i,j,q}]`. Because `S` is strictly proper and the objective is linear in `S`, the uniquely optimal report is the **budget-weighted predictive distribution of resolvers' eventual verdicts**:

```
p*_{q,t} = Σ_j (B_j / ΣB) · Pr[ r_{j,q} = · | information at t ].
```

In words: the money-optimal strategy is to forecast **what the (capital-weighted) population of resolvers will eventually conclude.** Under the shared-reality assumption (A1), that population converges, so this is a proxy for forecasting **future common knowledge.** Forecasters are continuously incentivized to update, because stale beliefs decay their reputation relative to peers.

This yields two outputs at once:
1. A live, aggregated **forecast** of future resolver consensus on every question — a shared, evolving world-model.
2. A **skill ranking** `{R_{i,j}}` identifying *who* reliably predicts that consensus, usable downstream as voting weight.

---

## 4. Properties

- **No exploitable resolution.** Since each resolver settles privately, retroactively, and can discard bad questions, there is no single oracle to bribe, no point-in-time ambiguity to exploit, and no forced verdict on genuinely unresolved questions. This directly defeats failure modes (2) and (3) of §2.
- **Optimization power without real-money risk.** Reward is real but is paid *retroactively by resolvers who chose to pay*, decoupled from a zero-sum betting pool — addressing failure mode (1) without importing the fragility of (2)–(3).
- **Manufactures common knowledge.** Given any existing common knowledge of *resolutions*, the mechanism computes a new common knowledge of *resolution-forecasts* — and identifies the agents best at producing it.
- **Dual use: predicting ≈ deciding.** Those who best predict future consensus are often those best positioned to say what is worth doing. The skill ranking can therefore weight a *voting* system that estimates each candidate's relative "impact," biased toward demonstrated forecasting skill to whatever degree a resolver desires.

---

## 5. Assumptions (made explicit)

- **A1 — Shared reality.** On most questions, a large fraction of resolvers eventually agree; their verdicts are positively correlated. (Without this, "consensus" is undefined and forecasters cannot target it.)
- **A2 — Dispersed capital.** Reward budgets `B_j` are not extremely concentrated; otherwise forecasters predict one whale, not consensus, and aggregation degrades exactly as in real-money markets.
- **A3 — Repeated game.** Forecasters value a future stream of reward, so they keep their published beliefs current.
- **A4 — Tamper-evident timestamps.** Forecasts cannot be backdated; otherwise "surprising and early" rewards are gameable.
- **A5 — Non-reflexivity (the fragile one).** Forecasters' reports do not themselves change resolvers' verdicts. If they do, properness breaks (see §8).

---

## 6. Application A — Impact markets for science

*(condensing the Impact Markets source notes)*

A top-tier venue performs two separable functions:

- **Dissemination** — spreading the work. Arguably already served by other channels.
- **Credentialing** — the prestige of acceptance, which is the real prize. Prestige functions as society's signal for *"high odds of success,"* used to route funding and resources.

The notes' central question: prestige is a *retroactive, lossy proxy* — "things are prestigious if they turn out useful." Why not estimate the underlying quantity (odds/extent of future impact) **directly**, with the §3 engine, and use prestige only as a fallback?

**Construction.**
- Candidates `Q` = papers/results. Forecasters predict each paper's eventual impact (citations are heavy-tailed — a power law — so most signal is in the few top items). Resolvers `F` = the body that ultimately judges realized impact and pays out.
- **Two phases.** (1) *Bootstrap*: a play-money market with tokens distributed to reviewers, to seed forecasts before reputation exists. (2) *Allocation*: retroactive scoring against resolvers' eventual impact verdicts converts forecaster reputation into credentialing weight.

**Scope (the notes' own caveats).** Explicit *non-goals*: measuring non-observable impact, settling whether prestige *should* exist, and aligning science with societal good. The construction only assumes impact is, for the targeted cases, **publicly and quantitatively observable**, and that prestige *ought to track it*.

---

## 7. Application B — Governance

*(condensing the Ultimate Governance source notes)*

Treat the §3 engine as a **public world-modeling utility**: resources are allocated to it, it aggregates decentralized information, and it rewards predictors of future retroactive consensus. Bolt it onto **liquid-democracy quadratic voting** over government expenditure (a proxy for all policy, since policy flows through spending).

The decisive move: voters do not have to forecast directly. They vote on **goals** ("prioritize Health") and on **policies that require sub-policies to be structured around the market's estimates** — e.g. *"to what degree does policy X advance goal 'Health'?"* A Health-prioritizing voter can then back high-level policy with confidence that its funded sub-policies are well-designed, because the market continuously estimates their effect. Forecasting skill (`R_{i,j}`) can bias these estimates toward demonstrated predictors.

This restates the documents' opening criterion for good governance: a **shared agreed-upon reality**, **predictive models** of policy effects, and a **stable way to combine conflicting utility functions** — here, quadratic voting for preference aggregation plus the market for fact aggregation.

> **Causality caveat.** Reading "fund X iff the conditional market says X advances Health" *mechanically* recreates vanilla futarchy and inherits its conditional-vs-causal flaw. The market output must stay an observational instrument feeding human causal judgment, never a mechanical allocation rule. This is worked out in full in [futarchy-and-causality.md](../futarchy-and-causality.md), which adds a fifth soundness condition (V5) dual to the anti-reflexivity rule (V1).

---

## 8. Open problems and tensions

The source notes flag these; stated rigorously, they are the load-bearing risks. *Status tags below point to where each has since been addressed in the analytical notes.*

1. **Reflexivity / beauty contest (A5).** In governance (§7) the skill ranking *feeds back* into the votes that constrain resolvers, so forecasters may be predicting an equilibrium they help create. This breaks scoring-rule properness and admits self-fulfilling but false focal points (Keynesian beauty contest). *Convergence to truth vs. to a stable falsehood is unproven and is the central theoretical gap.*
   → **Answered in principle** in [mathematical-core.md](../mathematical-core.md) §2: linear herding is harmless (Prop. 2); the danger is a bifurcation at deference slope `L = λ·sup|g′| = 1` (Prop. 3); `L` is measurable (perturbation audits) and controllable (blind resolution, reality-coupling). Formalized as viability inequality **V1**. Remaining: the empirical shape of `g` and the coupled-system stability proof.
2. **Resolver honesty is unmodeled.** Nothing forces honest resolution; the mechanism only pays whoever matched a resolver's *own* verdict. That is internally consistent in isolation, but once verdicts gate public money (§7), resolvers face new incentives to resolve strategically.
   → **Reduced to an inequality** in [mathematical-core.md](../mathematical-core.md) §2.4: per-resolver scoring contains corruption; honesty is dominant when a resolver's allocation stake exceeds the bribe available for lying; influence-buyers get GLS-down-weighted by the same independence machinery as §3 there.
3. **Manufactured surprise.** Reference-relative scoring rewards being different-and-right; a poorly chosen reference or weighting can instead reward *contrarianism for its own sake*. The reference must be the genuine information frontier, not a strawman.
   → **Mitigated by construction** ([mathematical-core.md](../mathematical-core.md) §2.5, Prop. 5): use the lagged consensus as the reference (the genuine frontier), and freeze per-question reward budgets `u_q` so no forecast can move its own question's budget.
4. **Collusion / Sybil.** Resolver–forecaster collusion, or Sybil forecasters farming the reference subtraction, need explicit countermeasures (identity, budget caps per A2).
   → **Reframed and substantially answered** in [mathematical-core.md](../mathematical-core.md) §3: weight is issued per unit *effective independence* `n_eff = 1ᵀΣ⁻¹1` over pseudonymous behavioral residuals — no personhood classifier needed; one mechanism covers forecaster collusion, resolver blocs, Sybils, and QV's `√k` attack (Prop. 6, mimicry-cost). Formalized as **V2**.
5. **"Retroactive reward by extrapolated intention/utility of information."** The notes invoke rewarding based on the *extrapolated intent and value* of information when verdicts are unavailable or late. This is currently a desideratum, not a defined operator, and needs specification before it can be evaluated.
   → **Defined** in [mathematical-core.md](../mathematical-core.md) §2.5: the decision-value-of-information `EU(i→j)`, computed by self-application of the engine; the regress terminates at `j`'s realized allocation outcomes.

A **sixth** condition surfaced later, from the causal analysis:

6. **Causal resolution (V5).** Verdicts must be ex-post counterfactual contrasts, not raw conditional outcomes, or the proper-scoring machinery lends rigorous-looking authority to a confounded judgment (futarchy's flaw). See [futarchy-and-causality.md](../futarchy-and-causality.md).

---

## One-paragraph summary

Decouple forecasting from resolution. Let specialists publish timestamped probabilistic beliefs; let capital holders privately and retroactively declare what they think happened; score the specialists against each holder's verdict with a reference-relative proper scoring rule. The money-optimal forecast then equals the capital-weighted prediction of future resolver consensus — yielding both a shared evolving world-model and a skill ranking of forecasters — with no exploitable point-in-time oracle. Apply it to science to credential work by predicted impact; apply it to governance to let quadratic voters delegate fact-finding to the market while retaining preference-setting. The decisive open question is reflexivity: whether the loop converges on reality or on a stable, self-fulfilling fiction.
