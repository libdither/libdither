# 1 · Boundary & Identity

> 🚧 **Draft (core-idea sketch).** *Part A · Core Ideas. The problem under all the others.*

**The problem.** Almost everything below — voting, consensus, fair pricing, basic income — silently assumes you can tell distinct participants apart. A central identity registry is out (centralization, privacy); a cheap "proof of personhood" is forgeable; a strong one is privacy-destroying. This is the Sybil problem, and it's the precondition for the system to have a well-defined boundary at all.

**The core idea.** Stop asking *"is this a distinct person?"* and ask *"how much **independent information** does this participant contribute?"* Look at each account's behavioral residuals — forecast errors, transaction timing, verdicts — *after conditioning on public information.* Honest distinct agents are roughly independent; one controller's puppets stay correlated because they share private state. An **effective population** `n_eff` collapses a tightly-correlated cluster of `k` sock-puppets toward 1, while genuine independents each count fully. Issue *all* weight (votes, income, influence) per unit `n_eff`, and the Sybil attack yields nothing. Identity becomes an accumulated **signature of real work** — faking `k` identities costs about as much as *being* `k` real contributors.

**Leans on:** nothing — it's the root. **Enables:** money (6), the resource market (5), the truth machine (7), governance (8) — everything counted or weighted.

> ⚠️ **Where it's thin.** It's an arms race: how much behavioral monitoring is "enough" is empirical, estimating the correlation structure at scale is unsolved, and a fresh account is weakest exactly at birth (handled later via local vouching). Spec depth + failure modes: Part B.
