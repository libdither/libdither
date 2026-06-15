# 2 · Ordering & Timestamps

> 🚧 **Draft (core-idea sketch).** *Part A · Core Ideas.*

**The problem.** Money must order a sender's transactions; the truth machine must prove a forecast wasn't *backdated*; a few decisions (who won an auction for a unique item) need a single agreed winner. The reflex is "use a blockchain" — but a global total order is expensive, centralizing, and far more than most of these need.

**The core idea.** Most of it needs no global consensus at all.

- **Payments** from single-owner accounts are *consensus number 1*: only the **sender** needs to order their own spends, and they provide that order. Byzantine reliable broadcast suffices — no global ledger.
- **Timestamps** come from **causal entanglement**: once a record's hash is cited inside other participants' signed messages, it is sandwiched in time — it existed before everything that cites it and after everything it cites. Backdating means rewriting the signed history of independent witnesses (and "independent" is again `n_eff`, from [problem 1](identity.md)).
- **Only genuinely contested allocation** — auctions for the same scarce item, name registries — needs ordering, handled by a small *zonal* BFT quorum.

**Leans on:** identity (1) for witness independence. **Enables:** money (6), the truth machine (7, the no-backdating assumption).

> ⚠️ **Where it's thin.** Timestamp precision is set by gossip rate; the narrow "contested allocation" carve-out still needs a real BFT design and a story for cross-zone disputes. Part B.
