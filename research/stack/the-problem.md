# The Problem

> *Part I · The Engine — Chapter 1*

Start with a question that has no good answer today:

**How does a group with money but no expertise buy the knowledge of experts who have no money — and turn it into good decisions — without trusting anyone to be the judge of what's true?**

This is the problem under scientific funding, public policy, grant-making, open-source bounties, and venture investing. In every case three populations exist and rarely overlap:

- **Resolvers** `F` — they hold capital and want to allocate it well, but lack the domain knowledge to know what's worth funding. They are the ultimate arbiters of "what turned out to be true / what mattered."
- **Forecasters** `P` — they hold domain knowledge but little capital. They have views on which projects, claims, or directions will pan out.
- **Candidates** `Q` — the projects, papers, claims, or events being evaluated.

We want a mechanism that lets `F` **buy** the dispersed knowledge of `P` and convert it into good allocations over `Q`, paying `P` in proportion to how *informative* their contribution was.

## Why this is hard

The objective is **underdetermined**. Metrics are contested, the relevant knowledge is opaque and held by specialists, and reasonable people pursue different directions. We cannot write down the target function in advance. We can only specify a *process* for discovering it.

The obvious tool — a prediction market — almost works. Markets are the best knowledge-aggregators we have. But every existing form fails in a way that matters here.

## Why existing prediction markets are insufficient

1. **Play-money markets** (Metaculus-style) let anyone open a market but give forecasters no financial stake. Without skin in the game they attract little *optimization power*: effort isn't compensated in proportion to informativeness, so the best specialists don't show up.

2. **Real-money markets need a single, objective, point-in-time resolution.** Someone — a trusted party (Kalshi) or a game-theoretic oracle (Polymarket) — must declare, at one instant, what *definitively* happened. That instant is a **central point of exploitation**: with real money on the line, ambiguous questions invite contested or fraudulent resolutions.

3. **Real-money markets degrade under inequality and ambiguity.** A wealthy actor indifferent to losses can push the price of an ambiguous market. More generally, a market's ability to aggregate *decentralized* information falls as wealth concentration rises — exactly the regime (frontier science, policy) where we most need it.

## The common root

All three failures share one cause:

> **Resolution is a single, objective, irreversible event coupled directly to payout.**

Remove that coupling — separate *eliciting a forecast* from *declaring what happened* from *paying out* — and all three problems become tractable. That decoupling is the whole mechanism, and it's the subject of the [next chapter](mechanism.md).
