# 3 · The Market
> *AI-drafted, human-directed — [what that means](ai-disclosure.md).*

The circle grows, as circles do, and acquires a video channel — someone's cable-cast tutorials, forty gigabytes and climbing — and suddenly the friend with the NAS is not enough. You need strangers' disks. You also need their bandwidth on tutorial night, and their compute when someone finally demands search over five years of arguments. The obvious move is to build three markets (storage, bandwidth, compute), and if you ask around, that's the standard advice; there are whole projects for each. Then, a little later, you'd discover the *fourth* market hiding behind them — because "is this rumor about the merino shortage true" and "which client fork deserves the treasury's money" also need pricing, and for those, today, you hire an editor or exhaust a moderator.

We'd like to talk you out of building four markets. It's one market, selling one thing.

**Everything sold here is evidence — a verified reduction in someone's expected loss.** Compute manufactures evidence (a reduction trace is evidence about `f(x)`). Storage preserves it. Bandwidth delivers it. Forecasters, whom you'll meet shortly, scout it early. And human judges certify the kind no machine can. Different production processes, one product, and one payment rule shared by all of them: you get paid the amount by which you beat the shared expectation. Keep that rule in view; it's the spine of the chapter, and by the end it will connect a cache hit to a moderation call.

## The fast side: one flow problem

Physically, any request the circle makes is **`MATERIALIZE(value, spacetime-region)`** — make this value available there, then — and it's satisfied by chaining three kinds of edge:

| Edge | Is | Cost scales with |
|---|---|---|
| hold in time | storage | size × duration |
| move in space | routing | size × distance |
| transform | compute | reduction steps ([ch. 1](01-agent.md)'s gas) |

The same value can be produced many ways — fetch a cached copy, recompute from inputs, or, with [chapter 1](01-agent.md)'s generative memory, predict it and correct with residuals, a fourth family of routes whose distinguishing attribute (a confidence label) gets priced like any other. What looks like three policy debates (cache or not? replicate or not? memoize or not?) is one threshold, applied pointwise: hold value `v` at location `x` whenever local demand times delivery price exceeds the cost of holding. A CDN, a DHT's replication factor, and a memo table are that inequality wearing three costumes.

Who runs this? Nobody, which is the point, and also you, which is the mechanism. There's no scheduler; there's the owner of each disk predicting where demand will appear and pre-positioning for it. Get it right and you serve fast and earn; get it wrong and you bleed rent on bits nobody wants. And under one pricing rule — delivery priced at the marginal cost of *unmet* demand — a small theorem does a lot of work: each node's profit from any local action equals the reduction in total unmet demand that action caused. Every selfish caching decision becomes a step of gradient descent on the network's collective error. The price field *is* the prediction-error field; where the network is wrong, prices spike, and whoever corrects it first gets the difference. That's the fast half of the payment rule above ([Mathematical Core §10.1](mathematical-core.md) makes the "one rule" claim precise).

Since generation is now a production route, predictive models are capital equipment, and it's worth splitting them by their economics. **Coordination models** — the shared predictors of prices, routes, demand that participants must roughly agree on for the market to clear at all — are Schelling infrastructure, like the protocol itself: they want to be open, and funding them is a public-goods problem the coalition should just pay for. **Content models** — the domain predictors that give a node its edge — can stay private, because the market never needs to see weights; it buys verified outputs, and chapter 1's certainty curve prices the verifying. When should the network buy a private model open? When the estimated value of diffusion beats the buyout price — a question the market's own slow half can price, pleasingly enough.

## The slow side: truth {#the-primitives}

Which brings us to the tired moderator. Someone posts the merino-shortage rumor; someone else posts a takedown; the circle wants to know what it believes, and appointing one person to decide is how you get a mod-king (the smallest possible somebody-in-charge, and the most tired). Scale the same problem up and it's the oldest allocation problem there is: **you have money but not expertise, the experts have knowledge but no money, and anyone appointed judge of the truth becomes the most profitable person in the system to corrupt.** Science funding, grant-making, open-source bounties, and the circle's treasury are all this problem in different hats.

Prediction markets *almost* solve it, and each existing form breaks somewhere specific: play-money attracts no serious effort; real-money needs a single, objective, point-in-time resolution, which is a central point of exploitation with money on the line; and real-money aggregation degrades exactly as wealth concentrates, which is exactly when you need it. One root cause underneath all three — resolution is a single irreversible event coupled directly to payout — so the mechanism decouples it:

- Each forecaster $i$ publishes **timestamped probability distributions** $p_{i,q,t}$ on open questions. Timestamps come pinned by [chapter 2](02-coupling.md)'s receipts, so "I said this in March" is unforgeable. Forecasters stake information, not money.
- Each resolver $j$ (a capital-holder who wants the answer) may, whenever the evidence ripens, privately declare a **verdict** $r_{j,q}$ — their own judgment of what happened. Declaring is optional and revisable, and a resolver can simply discard a question that turned out ambiguous. There is no bell that rings.
- A proper scoring rule pays forecaster $i$ from resolver $j$'s budget for having moved belief toward $j$'s eventual verdict, relative to the consensus at the time they spoke:

$$\rho_{i,j,q} = \sum_t w_t\left[\,S(p_{i,q,t},\,r_{j,q}) - S(p^{\text{ref}}_{q,t},\,r_{j,q})\,\right]$$

Echo the crowd, earn nothing. Move belief the wrong way, pay. The reward goes to *right, different, and early* ($w_t$ favors early), and if the shape of that rule looks familiar, it should: the reference $p^{\text{ref}}$ is the shared prior, and you're being paid for beating it — the fast market's rule again. The two halves of this chapter differ in only one respect, *what verifies the purchase and how long that takes*. A hash verifies a computation in milliseconds. A human verdict verifies a research bet in years. Everything distinctive about the slow side — reputations, retroactivity, the fine print below — exists to make years-later verification safe to pay against.

Watch it run once. *"Will resolver $j$ judge paper X high-impact by 2030?"* The consensus sits at 0.30. Alice has actually read the paper and publishes 0.80, early. Bob echoes the crowd at 0.30. Carol, contrarian by temperament, bets 0.10. Come 2030 the resolver, holding five years of citations and replications, declares: yes.

| | belief | $\ln p$ | reward vs. reference |
|---|---|---|---|
| Alice | 0.80 | −0.22 | **+0.98** |
| Bob | 0.30 | −1.20 | 0.00 |
| Carol | 0.10 | −2.30 | −1.10 |

Alice gets paid well for information the crowd lacked. Bob contributed nothing and collects the same. Carol was different and wrong, and the penalty is not cruelty — it's what keeps confidence calibrated, because had the verdict gone the other way, Alice's bold 0.80 would have cost her 1.25. (Reputation has a cold start, so real deployments run a play-money phase to seed track records before budgets attach.)

For a forecaster who can't influence resolutions, the optimal strategy is exactly one thing: report your best prediction of the capital-weighted future verdicts of the resolvers — which, under the shared-reality assumption below, is a proxy for *future common knowledge*. Out the other end come two artifacts: a live world-model over every open question (including, yes, the merino shortage), and a skill ranking of who sees ahead, which [chapter 6](06-governance.md) will put to work. And notice what an attacker finds to attack: no oracle, no resolution instant, no single judge. A corrupted resolver corrupts only their own channel and degrades their own future allocations, since resolvers consume the rankings their verdicts produce. Bribing one is remarkably poor value for money (📐 [§2.4](mathematical-core.md) prices it).

## The fine print {#assumptions}

Five assumptions hold the slow side up. Each gets its defense somewhere specific, which is most of why the rest of the book exists:

- **A1 · Shared reality.** On most questions, resolvers eventually agree; otherwise "consensus" has no referent and the target dissolves. Kept plausible by keeping the perception layer global ([ch. 7](07-evolution.md)).
- **A2 · Dispersed capital.** No whale holds most of the budget, or the money-optimal forecast quietly becomes "predict the whale." [Chapter 4](04-money.md) exists to enforce this one structurally (V3).
- **A3 · Repeated game.** Stale beliefs must cost reputation, or nobody updates.
- **A4 · Tamper-evident timestamps.** No backdating, or every skill ranking is fiction. [Chapter 2](02-coupling.md).
- **A5 · Non-reflexivity.** Forecasts must not cause the verdicts they predict. The fragile one; [chapter 5](05-immune.md) is mostly about it.

## Open problems {#open-problems}

Where this chapter can break, and where each break is handled: reflexivity and the dark room ([chapter 5](05-immune.md)); resolver honesty once verdicts gate money (reduced to a stake-versus-bribe inequality, 📐 §2.4); reference gaming, where a badly chosen baseline pays for contrarianism as such (lagged references and frozen budgets, 📐 §2.5); Sybil forecasters and coordinated resolver blocs ([chapter 5](05-immune.md) again); and causal validity — verdicts must be counterfactual contrasts, not raw conditionals, or the scoring rule lends its considerable authority to a confounded claim (V5, [Futarchy and Causality](futarchy-causality.md)). On the fast side: the alignment theorem assumes price-taking and convex costs, and lumpy disks and monopoly relays break both, so mechanism design is owed there, along with the per-term cost constants of the materialization objective.

📐 Formal treatment: [Mathematical Core §1](mathematical-core.md), [§2](mathematical-core.md), [§10.1](mathematical-core.md).

---

The circle can now buy storage from strangers, verify what it gets, and even buy *judgment* without crowning a judge. All of it, though, is denominated in something — and that something is the sharpest design decision in the book, because pick a unit that concentrates and whoever ends up holding the pile will buy the slow side's verdicts and, with them, the network's beliefs. Money. [Chapter 4](04-money.md).
