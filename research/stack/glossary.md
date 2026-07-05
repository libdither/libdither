# Notation & Glossary

> *Appendix A. Every symbol used in the book, defined once.*

The chapters introduce symbols where they're first needed; this is the single place they're all collected. A few letters are reused with different meanings in different layers — those **collisions are flagged explicitly** at the bottom, because they trip up first-time readers.

## Populations and objects

| Symbol | Meaning | First used |
|---|---|---|
| `F` | the set of **resolvers** — capital holders who retroactively declare verdicts | [Truth](07-truth.md) |
| `P` | the set of **forecasters** — specialists who publish predictions | [Truth](07-truth.md) |
| `Q` | the set of **candidates / questions** under evaluation | [Truth](07-truth.md) |
| `q` | a single question, with outcome space `Ω_q` | [Truth](07-truth.md) |
| `i`, `j` | index a forecaster (`i ∈ P`) and a resolver (`j ∈ F`) | [Truth](07-truth.md) |

## The scoring engine

| Symbol | Meaning | First used |
|---|---|---|
| `p_{i,q,t}` | forecaster `i`'s probability distribution on `q` at time `t` | [Truth](07-truth.md) |
| `r_{j,q}` | resolver `j`'s subjective verdict on `q` | [Truth](07-truth.md) |
| `S(p, ω)` | strictly proper scoring rule; canonically log score `ln p(ω)` | [Truth](07-truth.md) |
| `p_ref` | reference belief (consensus just before an update); the subtraction baseline | [Truth](07-truth.md) |
| `w_t` | time weight (can up-weight earlier forecasts) | [Truth](07-truth.md) |
| `ρ_{i,j,q}` | reward to `i` from `j` on `q` — marginal movement toward the verdict | [Truth](07-truth.md) |
| `R_{i,j}` | forecaster `i`'s **reputation** with resolver `j` = `Σ_q ρ_{i,j,q}` | [Truth](07-truth.md) |
| `B_j` | resolver `j`'s reward budget | [Truth](07-truth.md) |
| `p*` | the money-optimal forecast (= capital-weighted predicted consensus) | [Truth](07-truth.md) |
| `EU(i→j)` | decision-value of `i`'s information to `j` ("extrapolated utility") | [Math Core](mathematical-core.md) §2.5 |
| `u_q` | per-question reward-budget factor, set ∝ value-of-information | [Math Core](mathematical-core.md) §2.5 |

## Reflexivity

| Symbol | Meaning | First used |
|---|---|---|
| `θ` | the true state of a question | [Math Core](mathematical-core.md) §2 |
| `π` | a forecaster's honest posterior given evidence | [Reflexivity](08-reflexivity.md) |
| `λ` | **deference weight** — fraction of a verdict driven by the published forecast | [Reflexivity](08-reflexivity.md) |
| `g(p)` | the resolver's deference-response function | [Reflexivity](08-reflexivity.md) |
| `L` | **deference slope** `= λ · sup\|g'\|`; safety condition `L < 1` (= **V1**) | [Reflexivity](08-reflexivity.md) |
| `σ(θ)` | signal-driven verdict probability (the non-deferring part) | [Math Core](mathematical-core.md) §2 |

## Independence (the immune system)

| Symbol | Meaning | First used |
|---|---|---|
| `Σ` | residual-correlation matrix across agents (after conditioning on public info) | [Identity](01-identity.md) |
| `n_eff` | **effective population** `= 1ᵀ Σ⁻¹ 1`; the stack's one security parameter | [Identity](01-identity.md) |
| `ρ` *(here)* | pairwise correlation within a Sybil cluster — **not** the reward `ρ` above | [Identity](01-identity.md) |
| `k` | number of accounts in a cluster (or replication count, §1.4) | [Identity](01-identity.md) |
| `h` | honest fraction of an executor pool | [Math Core](mathematical-core.md) §1.4 |
| `ν_i` | agent `i`'s marginal `n_eff`, gating its UBI share | [Math Core](mathematical-core.md) §4.3 |

## Money (the metabolism)

| Symbol | Meaning | First used |
|---|---|---|
| `θ_{i,z}` | agent `i`'s **share** of pool `z` (a fragment of a whole; `Σ_i θ_{i,z}=1`) | [Money](06-money.md) |
| `V_z` | basket-value of zone `z`'s resource **pool** — *is* its money supply (not minted) | [Money](06-money.md) |
| `w_i` | wealth of `i` `= Σ_z θ_{i,z}·V_z` (a portfolio of pool shares) | [Money](06-money.md) |
| `χ(x→y)` | **exchange-rate field** over the coordinate space; anchored by basket arbitrage | [Money](06-money.md) |
| `δ_z` | zone-local **demurrage rate** — decay-unless-circulated; the dispersion dial | [Money](06-money.md) |
| `δ_min` | the global demurrage **floor** (anti-haven; the regulated baseline) | [Money](06-money.md) |
| `b_z` | zone `z` per-capita baseline `= V_z / n_eff(z)` (the local UBI level) | [Math Core](mathematical-core.md) §4 |
| `M` | total money supply `= Σ_z V_z` | [Math Core](mathematical-core.md) §4 |
| `N` | population, measured in `n_eff` units | [Math Core](mathematical-core.md) §4 |
| `e_i`, `s_i` | agent `i`'s earn / spend rates | [Math Core](mathematical-core.md) §4 |
| `ē` | bound on net earning advantage | [Math Core](mathematical-core.md) §4.2 |
| `β` | target concentration bound on resolver budgets | [Math Core](mathematical-core.md) §4.2 |

## The substrate

| Symbol | Meaning | First used |
|---|---|---|
| `MATERIALIZE(V, R)` | make value `V` available at spacetime region `R` | [Market](05-market.md) |
| `D(v, x, t)` | demand field — request intensity for value `v` at location `x`, time `t` | [Math Core](mathematical-core.md) §1 |
| `p(v, x)` | **price field** — posted price of delivering `v` at `x` (the substrate's `p`) | [Math Core](mathematical-core.md) §1 |
| `λ_v(x)` | local demand intensity for `v` at `x` — **not** the deference weight `λ` | [Math Core](mathematical-core.md) §1.2 |
| `c_s, c_b, c_c` | storage / bandwidth / compute cost coefficients | [Math Core](mathematical-core.md) §1.1 |
| `work(f)` | reduction-step count of `f` (the canonical compute unit, from tree calculus) | [Math Core](mathematical-core.md) §1.1 |

## Viability inequalities

The system is viable iff these hold (see [Math Core](mathematical-core.md) §7):

| | Condition | Plain meaning | Chapter |
|---|---|---|---|
| **V1** | `L < 1` | perception dominates action (no dark room) | [Reflexivity](08-reflexivity.md) |
| **V2** | `cost(mimic k) ≥ cost(be k)` | boundary integrity; `n_eff` is sound | [Identity](01-identity.md) |
| **V3** | `δ ≥ ē/(M(β−1/N))` | turnover keeps capital dispersed (enforces A2) | [Money](06-money.md) |
| **V4** | `switching cost < tyranny premium` | exit keeps between-network selection alive | [The Organism](10-organism.md) |
| **V5** | verdicts are ex-post counterfactual contrasts | the market stays evidence, never a mechanical rule | [Futarchy and Causality](futarchy-causality.md) |

The five assumptions **A1–A5** (shared reality, dispersed capital, repeated game, tamper-evident timestamps, non-reflexivity) are defined in [The Five Assumptions](07-truth.md#assumptions).

## ⚠️ Notation collisions

The same letter carries different meanings across layers. The four to watch:

- **`F`** = the *resolver set* in the engine, but the *free-energy functional* `F_a` in [Math Core](mathematical-core.md) §0. (Context always disambiguates: a set of people vs. a quantity to minimize.)
- **`ρ`** = the *reward contribution* `ρ_{i,j,q}` in the engine, but a *pairwise correlation* in the `n_eff` formula.
- **`λ`** = the *deference weight* in reflexivity, but `λ_v(x)` is *local demand intensity* in the substrate.
- **`p`** = a *forecast distribution* `p_{i,q,t}` in the engine, but `p(v,x)` is the *price field* in the substrate.

These overlaps are inherited from each layer's own conventional notation; they were kept rather than invent non-standard symbols.
