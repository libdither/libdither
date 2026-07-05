# 7 · Truth

The network can now pay for things, and immediately it needs to *know* things. Which storage provider is reliable? Which protocol upgrade will actually cut latency? Which research direction deserves the community fund? You, holding a budget, face the oldest allocation problem there is:

**You have money but not expertise. The experts have knowledge but no money. And anyone you appoint to judge what's true becomes the most profitable person in the network to corrupt.**

This is the problem under scientific funding, public policy, grant-making, open-source bounties, and venture investing. Three populations, rarely overlapping:

- **Resolvers** hold capital and want to allocate it well, but lack domain knowledge. They are the eventual arbiters of "what turned out to matter."
- **Forecasters** hold domain knowledge, little capital, and views on what will pan out.
- **Candidates** are the projects, claims, papers, and policies being judged.

The mechanism of this chapter lets resolvers *buy* the dispersed knowledge of forecasters, paying each in proportion to how informative their contribution was.

## Why prediction markets almost work

Markets are the best knowledge-aggregators we have, and every existing form fails here in a specific way. Play-money markets attract too little optimization power: with no compensation proportional to informativeness, the best specialists spend their effort elsewhere. Real-money markets need a single, objective, point-in-time resolution — someone must declare, at one instant, what definitively happened — and that instant is a central point of exploitation: with money on the line, ambiguous questions invite contested and fraudulent resolutions. And real-money markets degrade under inequality: a whale indifferent to losses can push the price of an ambiguous market, so aggregation quality falls as wealth concentrates, in exactly the settings (frontier science, policy) where aggregation is needed most.

Three failures, one root: **resolution is a single, objective, irreversible event, coupled directly to payout.** Separate eliciting forecasts from declaring outcomes from paying, and all three failures unlock at once.

## The retroactive consensus market {#the-primitives}

Forecasters publish. Resolvers judge — later, privately, each for themselves. Scoring connects them.

- Each forecaster $i$ publishes **timestamped probability distributions** $p_{i,q,t}$ on open questions $q$. Timestamps are pinned by [chapter 2](02-ordering.md), so "I said this in March" is unforgeable. Forecasters stake information, not money.
- Each resolver $j$ may, whenever they judge the evidence ripe, privately declare a **verdict** $r_{j,q}$: their own belief about what happened. Declaring is optional and revisable, and a resolver can simply discard a question that turned out ambiguous or manipulated.
- A strictly proper scoring rule pays forecaster $i$, out of resolver $j$'s budget, for having moved belief toward $j$'s eventual verdict:

$$\rho_{i,j,q} = \sum_t w_t\left[\,S(p_{i,q,t},\,r_{j,q}) - S(p^{\text{ref}}_{q,t},\,r_{j,q})\,\right]$$

The reference subtraction is the point. You are scored against the consensus as it stood when you spoke: echoing the crowd earns zero, moving belief the wrong way costs you, and the reward goes to being **right, different, and early** (the weight $w_t$ favors early). Reputation $R_{i,j} = \sum_q \rho_{i,j,q}$ accumulates per forecaster-resolver pair, and each resolver splits their budget across forecasters as a function of it.

## One question, run through

**"Will resolver $j$ judge paper X high-impact by 2030?"** In 2025 the consensus sits at 0.30. Alice has read the paper closely and publishes 0.80, early. Bob echoes the crowd at 0.30. Carol, contrarian by temperament, bets 0.10.

In 2030, resolver $j$ — now holding five years of citations, replications, and comparison work — declares: yes, high impact. (Had the record been hopelessly muddy, $j$ discards the question and pays no one.) Log-scoring against that verdict:

| | belief | $\ln p$ | reward vs. reference |
|---|---|---|---|
| Alice | 0.80 | −0.22 | **+0.98** |
| Bob | 0.30 | −1.20 | 0.00 |
| Carol | 0.10 | −2.30 | −1.10 |

Alice is paid well for information the crowd lacked. Bob added nothing and earns nothing. Carol was different and wrong, and pays for it. The penalty is what keeps confidence calibrated: had the verdict gone the other way, Alice's bold 0.80 would have cost her 1.25. And because reputation has a cold start, a real deployment runs a play-money bootstrap phase to seed track records before actual budgets attach.

## What the optimal strategy is

For a forecaster who cannot influence resolutions, the reward-maximizing report is exactly one thing: their best prediction of the **capital-weighted future verdicts of the resolvers**. Under the shared-reality assumption below, resolver verdicts converge on most questions, so this is a proxy for *future common knowledge*. The mechanism pays people to tell everyone, now, what everyone will believe later — and it keeps them updating, because stale beliefs decay against peers who update.

Two artifacts come out the other end: a live, continuously updated world-model over every open question, and a skill ranking of who reliably sees ahead, usable downstream as evidence-weight in [governance](09-governance.md).

And there is no oracle to attack. No instant of forced resolution, no single judge. Each resolver settles privately and can decline; a corrupted resolver corrupts only their own channel, and their own future allocations degrade with it, since resolvers consume the rankings their verdicts produce. Bribing one buys almost nothing (📐 [Mathematical Core §2.4](mathematical-core.md) prices the bribe).

## The five assumptions {#assumptions}

The fine print, stated as load-bearing premises. Each has a specific home elsewhere in the stack.

- **A1 · Shared reality.** On most questions, resolvers eventually agree. Without this, "consensus" is undefined and the forecasting target dissolves. Kept plausible by keeping the perception layer global ([ch. 10](10-organism.md)).
- **A2 · Dispersed capital.** No whale holds most of the resolver budget, or the money-optimal forecast becomes "predict the whale." This is what [chapter 6](06-money.md)'s demurrage enforces: an assumption turned into a dial (V3).
- **A3 · Repeated game.** Forecasters value future reward, so stale beliefs cost reputation.
- **A4 · Tamper-evident timestamps.** No backdating, or every skill ranking is fiction. [Chapter 2](02-ordering.md).
- **A5 · Non-reflexivity.** Forecasts don't cause the verdicts they predict. The fragile one; it gets the next chapter to itself.

## Open problems {#open-problems}

Where this can break, and where each break is handled. Reflexivity: [chapter 8](08-reflexivity.md). Resolver honesty once verdicts gate real money: reduced to a stake-versus-bribe inequality (📐 §2.4). Reference gaming, where a badly chosen baseline rewards contrarianism for its own sake: mitigated by lagged-consensus references and frozen budgets (📐 §2.5). Sybil forecasters and resolver blocs: [chapter 1](01-identity.md)'s machinery covers both. And causal validity — verdicts must be counterfactual judgments ("did X help, relative to no-X?"), not raw conditionals, or the scoring rule lends its authority to a confounded claim. That last one is V5, with a dedicated analysis in [Futarchy and Causality](futarchy-causality.md).

---

The network can now perceive. The failure that remains is the one perception invites: a mind that starts watching itself instead of the world. That is [chapter 8](08-reflexivity.md).
