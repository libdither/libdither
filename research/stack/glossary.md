# Notation & Glossary

> *Appendix A. Every symbol used in the book, defined once.*

The chapters introduce symbols where they're first needed; this is the single place they're all collected. A few letters are reused with different meanings in different layers — those **collisions are flagged explicitly** at the bottom, because they trip up first-time readers.

## Populations and objects

| Symbol | Meaning | First used |
|---|---|---|
| `F` | the set of **resolvers** — capital holders who retroactively declare verdicts | [Mechanism](mechanism.md) |
| `P` | the set of **forecasters** — specialists who publish predictions | [Mechanism](mechanism.md) |
| `Q` | the set of **candidates / questions** under evaluation | [Mechanism](mechanism.md) |
| `q` | a single question, with outcome space `Ω_q` | [Mechanism](mechanism.md) |
| `i`, `j` | index a forecaster (`i ∈ P`) and a resolver (`j ∈ F`) | [Mechanism](mechanism.md) |

## The scoring engine

| Symbol | Meaning | First used |
|---|---|---|
| `p_{i,q,t}` | forecaster `i`'s probability distribution on `q` at time `t` | [Mechanism](mechanism.md) |
| `r_{j,q}` | resolver `j`'s subjective verdict on `q` | [Mechanism](mechanism.md) |
| `S(p, ω)` | strictly proper scoring rule; canonically log score `ln p(ω)` | [Mechanism](mechanism.md) |
| `p_ref` | reference belief (consensus just before an update); the subtraction baseline | [Mechanism](mechanism.md) |
| `w_t` | time weight (can up-weight earlier forecasts) | [Mechanism](mechanism.md) |
| `ρ_{i,j,q}` | reward to `i` from `j` on `q` — marginal movement toward the verdict | [Mechanism](mechanism.md) |
| `R_{i,j}` | forecaster `i`'s **reputation** with resolver `j` = `Σ_q ρ_{i,j,q}` | [Mechanism](mechanism.md) |
| `B_j` | resolver `j`'s reward budget | [Mechanism](mechanism.md) |
| `p*` | the money-optimal forecast (= capital-weighted predicted consensus) | [Mechanism](mechanism.md) |
| `EU(i→j)` | decision-value of `i`'s information to `j` ("extrapolated utility") | [Math Core](mathematical-core.md) §2.5 |
| `u_q` | per-question reward-budget factor, set ∝ value-of-information | [Math Core](mathematical-core.md) §2.5 |

## Reflexivity

| Symbol | Meaning | First used |
|---|---|---|
| `θ` | the true state of a question | [Math Core](mathematical-core.md) §2 |
| `π` | a forecaster's honest posterior given evidence | [Reflexivity](reflexivity.md) |
| `λ` | **deference weight** — fraction of a verdict driven by the published forecast | [Reflexivity](reflexivity.md) |
| `g(p)` | the resolver's deference-response function | [Reflexivity](reflexivity.md) |
| `L` | **deference slope** `= λ · sup\|g'\|`; safety condition `L < 1` (= **V1**) | [Reflexivity](reflexivity.md) |
| `σ(θ)` | signal-driven verdict probability (the non-deferring part) | [Math Core](mathematical-core.md) §2 |

## Independence (the immune system)

| Symbol | Meaning | First used |
|---|---|---|
| `Σ` | residual-correlation matrix across agents (after conditioning on public info) | [Independence](independence.md) |
| `n_eff` | **effective population** `= 1ᵀ Σ⁻¹ 1`; the stack's one security parameter | [Independence](independence.md) |
| `ρ` *(here)* | pairwise correlation within a Sybil cluster — **not** the reward `ρ` above | [Independence](independence.md) |
| `k` | number of accounts in a cluster (or replication count, §1.4) | [Independence](independence.md) |
| `h` | honest fraction of an executor pool | [Math Core](mathematical-core.md) §1.4 |
| `ν_i` | agent `i`'s marginal `n_eff`, gating its UBI share | [Math Core](mathematical-core.md) §4.3 |

## Money (the metabolism)

| Symbol | Meaning | First used |
|---|---|---|
| `δ` | **demurrage rate** — decay-unless-circulated; the dispersion dial | [Value as Flow](value-as-flow.md) |
| `M` | total money supply | [Math Core](mathematical-core.md) §4 |
| `N` | population, measured in `n_eff` units | [Math Core](mathematical-core.md) §4 |
| `w_i` | wallet balance of agent `i` | [Math Core](mathematical-core.md) §4 |
| `e_i`, `s_i` | agent `i`'s earn / spend rates | [Math Core](mathematical-core.md) §4 |
| `ē` | bound on net earning advantage | [Math Core](mathematical-core.md) §4.2 |
| `β` | target concentration bound on resolver budgets | [Math Core](mathematical-core.md) §4.2 |

## The substrate

| Symbol | Meaning | First used |
|---|---|---|
| `MATERIALIZE(V, R)` | make value `V` available at spacetime region `R` | [Substrate](substrate.md) |
| `D(v, x, t)` | demand field — request intensity for value `v` at location `x`, time `t` | [Math Core](mathematical-core.md) §1 |
| `p(v, x)` | **price field** — posted price of delivering `v` at `x` (the substrate's `p`) | [Math Core](mathematical-core.md) §1 |
| `λ_v(x)` | local demand intensity for `v` at `x` — **not** the deference weight `λ` | [Math Core](mathematical-core.md) §1.2 |
| `c_s, c_b, c_c` | storage / bandwidth / compute cost coefficients | [Math Core](mathematical-core.md) §1.1 |
| `work(f)` | reduction-step count of `f` (the canonical compute unit, from tree calculus) | [Math Core](mathematical-core.md) §1.1 |

## Viability inequalities

The system is viable iff these hold (see [Math Core](mathematical-core.md) §7):

| | Condition | Plain meaning | Chapter |
|---|---|---|---|
| **V1** | `L < 1` | perception dominates action (no dark room) | [Reflexivity](reflexivity.md) |
| **V2** | `cost(mimic k) ≥ cost(be k)` | boundary integrity; `n_eff` is sound | [Independence](independence.md) |
| **V3** | `δ ≥ ē/(M(β−1/N))` | turnover keeps capital dispersed (enforces A2) | [Value as Flow](value-as-flow.md) |
| **V4** | `switching cost < tyranny premium` | exit keeps between-network selection alive | [Living System](living-system.md) |
| **V5** | verdicts are ex-post counterfactual contrasts | the market stays evidence, never a mechanical rule | [Futarchy and Causality](futarchy-causality.md) |

The five assumptions **A1–A5** (shared reality, dispersed capital, repeated game, tamper-evident timestamps, non-reflexivity) are defined in [The Five Assumptions](assumptions.md).

## ⚠️ Notation collisions

The same letter carries different meanings across layers. The four to watch:

- **`F`** = the *resolver set* in the engine, but the *free-energy functional* `F_a` in [Math Core](mathematical-core.md) §0. (Context always disambiguates: a set of people vs. a quantity to minimize.)
- **`ρ`** = the *reward contribution* `ρ_{i,j,q}` in the engine, but a *pairwise correlation* in the `n_eff` formula.
- **`λ`** = the *deference weight* in reflexivity, but `λ_v(x)` is *local demand intensity* in the substrate.
- **`p`** = a *forecast distribution* `p_{i,q,t}` in the engine, but `p(v,x)` is the *price field* in the substrate.

These overlaps are inherited from each layer's own conventional notation; they were kept rather than invent non-standard symbols.
