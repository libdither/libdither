# 5 · The Resource Market

You have a spare terabyte and an idle CPU. Try to sell them today. Realistically you cannot: you rent *from* the cloud, never *to* it, and prices are set by a handful of providers whose real product is the fact that everyone already trusts them. The decentralized reflex is to build three separate replacements — a storage market, a bandwidth market, a compute market — each with its own protocol, pricing, and incentive design. Three hard problems, plus the integration between them.

The first simplification of this chapter is that they are not three things.

- **Storage** is transport through *time*: the same bits, the same place, later.
- **Routing** is transport through *space*: the same bits, elsewhere, now.
- **Compute** is *transformation*: different bits, derived from these.

All three are one operation, **`MATERIALIZE(value, spacetime-region)`** — make this value available there, then — satisfied by chaining three kinds of edge:

| Edge | Is | Cost scales with |
|---|---|---|
| hold in time | storage | size × duration |
| move in space | routing | size × distance |
| transform | compute | reduction steps ([ch. 3](03-substrate.md)'s gas) |

Any request is served by some DAG of these edges, and the same value can be produced many ways: fetch a cached copy, recompute it from inputs, or a hybrid. "Cache vs. recompute" stops being a policy debate and becomes route choice in one graph. The network is not running three services; it is solving one min-cost flow problem against a demand field.

Collapsing them pays immediately. Caching, replication, and memoization become the same decision — hold value `v` at location `x` whenever

```
(local demand for v) × (price of delivering v at x)  >  (cost of holding v at x)
```

— one threshold rule that is a CDN when `v` is a popular file, memoization when `v` is a function result, and replication when `v` is someone's data. And [chapter 3](03-substrate.md) supplies the piece that makes mixing safe: results are checkable by hash or by predicate, so a buyer can accept a value from a stranger regardless of which DAG produced it.

## Who decides, and why they decide well

There is no scheduler. There is you, the terabyte owner, deciding what to hold. To profit you must predict: where will demand for this value appear, what will delivery pay, which routes will be cheap. A node is a predictor. It persists by forecasting the demand field and pre-positioning materializations; predict well and you serve fast and earn, predict badly and you bleed storage costs and die. Economic survival and calibrated prediction become the same ledger.

Prices close the loop. If delivery is priced at the marginal cost of unmet demand, then the profit of any local action equals the reduction in total unmet demand that the action causes. Every selfish caching decision is one step of gradient descent on the network's collective error. The price field *is* the prediction-error field: wherever the network is wrong about demand, prices spike, and whoever corrects the error is the one who gets paid.

That pattern is the engine of the whole book, and it recurs:

| Layer | What's predicted | Paid in |
|---|---|---|
| routing | latency and cost of relays | traffic served |
| caching / storage | future demand for a value | delivery fees |
| truth ([ch. 7](07-truth.md)) | future verdicts of resolvers | reputation and budget |
| governance ([ch. 9](09-governance.md)) | which policy advances a goal | influence |

The truth machine of chapter 7 is the most fully worked instance of this primitive, not a different idea.

⚠️ Open: the unification is real at the level of abstraction and unfinished below it. The three edge costs differ by orders of magnitude and carry different kinds of risk (a lost byte, a wasted computation, a missed deadline), so three concrete cost models are still owed. And the clean profit-equals-error-reduction alignment assumes price-taking participants and convex costs; lumpy disks and monopoly relays break it, and need mechanism design rather than abstraction.

📐 Formal treatment: [Mathematical Core §1](mathematical-core.md) — the flow problem, the threshold rule, the alignment proposition and its limits.

---

The market runs. But it pays you in *something*, and that something is a design decision with teeth: pick a currency that concentrates, and two chapters from now whoever holds the pile will be setting the network's beliefs. Money is [chapter 6](06-money.md).
