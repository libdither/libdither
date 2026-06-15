# 6 · Non-Concentrating Money

> 🚧 **Draft (core-idea sketch).** *Part A · Core Ideas.*

**The problem.** Both the resource market and the truth machine degrade as wealth concentrates — in fact "dispersed capital" is a named *assumption* the truth machine stands on. But money, left alone, tends to concentrate. We need a medium of exchange that structurally pushes the other way.

**The core idea.** There is no global "value" — only **value to a constituent** (the capacity to do useful work for someone), exactly as there is no global truth, only per-resolver verdicts. Currency tracks that value as it *flows*:

- **Demurrage** — currency decays unless it circulates; idle stock is reclaimed.
- The reclaimed flow is recycled as a **universal basic drip** to every participant (weighted by `n_eff`, so it isn't farmable).

Steady-state wealth becomes *equal baseline + (your net flow) / δ*: unbounded **stock** inequality turns into bounded **flow** inequality. The decay rate **δ is a dial** that directly enforces a chosen concentration bound — i.e. monetary policy *is* the truth machine's dispersion guarantee.

**Leans on:** identity (1, Sybil-proof drip), timestamps (2, transaction order). **Enables:** the resource market (5), the truth machine (7, dispersed budgets), governance (8, expenditure). **Co-designed with:** the truth machine — this is the one dependency *cycle* in the stack.

> ⚠️ **Where it's thin.** It bounds *stock*, not *bursts*. Inter-zone exchange rates, speculation against a deliberately-decaying currency, and the (probably unsound) external USD peg all need real macroeconomic analysis. Part B.
