# 3 · The Market

Your cluster has spare capacity and unmet needs: your terabyte idles while someone two hops away re-renders the same scene nightly. Today the only way to sell that terabyte is to become a company, or to rent it *to* one at prices a handful of providers set. The decentralized reflex is to build three separate markets — storage, bandwidth, compute — and then, once knowledge needs pricing too, a fourth thing entirely (an oracle, an editorial board). This chapter builds one market, because it is all one commodity.

**Everything sold here is evidence: a verified reduction in someone's expected loss.** Compute *manufactures* evidence (a reduction trace is evidence about `f(x)`). Storage *preserves* it. Bandwidth *delivers* it. Forecasters *scout* it early. Human judges *certify* it where nothing mechanical can. Different production processes, one product, one payment rule — you are paid the amount by which you beat the shared expectation.

## One flow problem

The physical side first. Any request is **`MATERIALIZE(value, spacetime-region)`** (make this value available there, then), and it is satisfied by chaining three kinds of edge:

| Edge | Is | Cost scales with |
|---|---|---|
| hold in time | storage | size × duration |
| move in space | routing | size × distance |
| transform | compute | reduction steps ([ch. 1](01-agent.md)'s gas) |

Any request is served by some DAG of these edges, and the same value can be produced many ways: fetch a cached copy, recompute from inputs, or, with [chapter 1](01-agent.md)'s generative memory, *predict it and correct with residuals*: a fourth family of paths whose distinctive attribute (a confidence label) is priced like any other. "Cache vs. recompute vs. generate" is route choice in one graph, and the caching decision collapses to a threshold: hold value `v` at location `x` whenever local demand times delivery price exceeds the holding cost. That single inequality is a CDN for files, memoization for function results, and replication for data.

Who decides? Nobody, and you. There is no scheduler; there is the terabyte owner predicting where demand will appear and pre-positioning for it. A node that predicts well serves fast and earns; one that predicts badly bleeds storage cost. And if delivery is priced at the marginal cost of unmet demand, a useful theorem holds: each node's profit from any local action equals the reduction in *total* unmet demand the action causes. Selfish caching becomes gradient descent on the network's collective error, and **the price field is the prediction-error field** — where the network is wrong, prices spike, and whoever corrects it gets paid. This is the market half of the Alignment Invariant: every payment is a verified marginal loss-reduction against the shared reference ([Mathematical Core §10.1](mathematical-core.md)).

## Models are capital

In a market where generation is a production path, predictive models are capital equipment. Two kinds, with opposite economics:

- **Coordination models** — the shared predictors of prices, routes, and demand that participants must roughly agree on for the market to clear at all. These are Schelling infrastructure, like the protocol itself: they want to be open, and funding them is a public-goods problem the coalition should pay for directly.
- **Content models** — the domain predictors that give a node its edge. These can stay private, because the market never needs to see weights: it buys *verified outputs*, and [chapter 1](01-agent.md)'s certainty curve prices the verification.

When should the network buy a private model open? When the estimated value of diffusion exceeds the buyout price — a question the market's own slow segment (below) can price. Retroactive public-goods funding for weights, decided by the machinery it feeds.

## The slow segment: truth {#the-primitives}

Now the part of the market that today belongs to editors, oracles, and expert committees. Some evidence cannot be manufactured by any computation: *will this research direction matter; did that policy help; which storage provider will still exist in five years.* You, holding a budget, face the oldest allocation problem there is — **you have money but not expertise, the experts have knowledge but no money, and anyone appointed judge of the truth becomes the most profitable person in the network to corrupt.**

Prediction markets almost solve this, and each existing form breaks in a specific way: play-money attracts no serious effort; real-money needs a single objective point-in-time resolution, which is a central point of exploitation; and real-money aggregation degrades exactly as wealth concentrates. One root cause: *resolution is a single, irreversible event coupled directly to payout.* So decouple it.

- Each forecaster $i$ publishes **timestamped probability distributions** $p_{i,q,t}$ on open questions — timestamps pinned by [chapter 2](02-coupling.md)'s entanglement, so "I said this in March" is unforgeable. Forecasters stake information, not money.
- Each resolver $j$ (a capital-holder who wants the answer) may, whenever the evidence ripens, privately declare a **verdict** $r_{j,q}$: their own judgment of what happened. Declaring is optional and revisable, and a resolver can discard a question that proved ambiguous.
- A proper scoring rule pays forecaster $i$ from resolver $j$'s budget for having moved belief toward $j$'s eventual verdict, relative to the consensus as it stood when they spoke:

$$\rho_{i,j,q} = \sum_t w_t\left[\,S(p_{i,q,t},\,r_{j,q}) - S(p^{\text{ref}}_{q,t},\,r_{j,q})\,\right]$$

Echoing the crowd earns zero; moving belief the wrong way costs; the reward goes to **right, different, and early**. Note this is the same payment rule as the fast market: the reference $p^{\text{ref}}$ is the shared prior, and you are paid for beating it. The two halves of this chapter differ only in *what verifies the purchase and how long that takes*. A hash verifies compute in milliseconds; a human verdict verifies a research bet in years. Everything distinctive about this segment (reputations, retroactivity, the assumptions below) exists to make slow, judgment-based verification safe to pay against.

Run one question through it. *"Will resolver $j$ judge paper X high-impact by 2030?"* The consensus sits at 0.30. Alice, who read it closely, publishes 0.80 early; Bob echoes 0.30; Carol bets 0.10. In 2030 the resolver, holding five years of citations and replications, declares yes:

| | belief | $\ln p$ | reward vs. reference |
|---|---|---|---|
| Alice | 0.80 | −0.22 | **+0.98** |
| Bob | 0.30 | −1.20 | 0.00 |
| Carol | 0.10 | −2.30 | −1.10 |

Alice is paid well for information the crowd lacked; Bob added nothing; Carol was different and wrong and pays for it — which is what keeps confidence calibrated. Reputation $R_{i,j}$ accumulates per forecaster-resolver pair, budgets follow it, and a play-money bootstrap seeds track records before real budgets attach.

For a forecaster who cannot influence resolutions, the optimal report is their best prediction of the **capital-weighted future verdicts of resolvers**: under shared reality, a proxy for future common knowledge. Two artifacts result: a live world-model over every open question, and a skill ranking of who sees ahead, both feeding [governance](06-governance.md). And there is no oracle to attack: no forced instant, no single judge; a corrupted resolver corrupts only their own channel and degrades their own future allocations, since resolvers consume the rankings their verdicts produce.

## The fine print {#assumptions}

Five assumptions carry the slow segment, each with a home elsewhere:

- **A1 · Shared reality.** Resolvers eventually agree on most questions, or "consensus" is undefined. Kept plausible by keeping the perception layer global ([ch. 7](07-evolution.md)).
- **A2 · Dispersed capital.** No whale holds most of the budget, or the optimal forecast is "predict the whale." Enforced structurally by [chapter 4](04-money.md): assumption turned dial (V3).
- **A3 · Repeated game.** Stale beliefs must cost reputation.
- **A4 · Tamper-evident timestamps.** No backdating, or the skill ranking is fiction. [Chapter 2](02-coupling.md).
- **A5 · Non-reflexivity.** Forecasts must not cause the verdicts they predict. The fragile one; [chapter 5](05-immune.md) is largely about it.

## Open problems {#open-problems}

Where this chapter can break, and where each break is handled: reflexivity and the dark room ([chapter 5](05-immune.md)); resolver honesty once verdicts gate money (reduced to a stake-versus-bribe inequality, 📐 §2.4); reference gaming (lagged references, frozen budgets, 📐 §2.5); Sybil forecasters and resolver blocs ([chapter 5](05-immune.md)); and causal validity: verdicts must be counterfactual contrasts, not raw conditionals, or the scoring rule lends its authority to a confounded claim (V5, [Futarchy and Causality](futarchy-causality.md)). On the fast side: the alignment theorem assumes price-taking and convex costs, and lumpy disks and monopoly relays break both — mechanism design owed, plus the per-term cost constants of the materialization objective.

📐 Formal treatment: [Mathematical Core §1](mathematical-core.md) (the flow problem and alignment), [§2](mathematical-core.md) (the scoring engine), [§10.1](mathematical-core.md) (the shared payment invariant).

---

The market clears, fast goods against slow ones, and it pays you in *something*. That something is the design decision with the sharpest teeth in the book: pick a unit that concentrates, and whoever ends up holding the pile will buy the slow segment's verdicts and set the network's beliefs. Money is [chapter 4](04-money.md).
