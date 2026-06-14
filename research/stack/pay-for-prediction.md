# Pay for Prediction

> *Part II · The Recurring Pattern — Chapter 6*

The substrate is a flow problem. But *who* decides which value to hold where, and why would they decide well? The answer reveals the pattern that ties the whole stack together.

## A node is a predictor

Consider a single node deciding what to cache and what to serve. To do this well it must **predict**: where will demand for this value appear? what will it pay? which routes will be cheap? A node maintains a boundary — the messages it *receives* (its senses) and the messages it *sends* (its actions) — and everything inside (its stored data, keys, local compute) is hidden behind that boundary. (This boundary has a precise name, the *Markov blanket*; we use it fully in [The Living System](living-system.md).)

The node persists by predicting the demand/price/topology field and **pre-positioning materializations** (the caching decision from the [previous chapter](substrate.md)) to serve requests cheaply:

> **A node that predicts well serves fast, earns, and survives; a node that predicts badly wastes resources and dies. Economic survival *is* accurate prediction.**

This isn't a metaphor bolted on afterward. The routing design's RL world-models — agents predicting latency, bandwidth, and cost to choose relays — are *already* doing exactly this. We just hadn't named it as the same thing the truth machine does.

## The pattern, everywhere

Once you look for it, "pay agents for predictive accuracy" is at every layer:

| Layer | What's predicted | Reward for accuracy |
|---|---|---|
| Routing | latency / bandwidth / cost of relays | better relay selection, more traffic served |
| Caching / storage | future demand for a value | profitable pre-positioning |
| Truth machine | future resolver consensus | reputation + payout ([Mechanism](mechanism.md)) |
| Governance | which policy advances a goal | influence weighted by track record |

The same primitive — a **scoring/staking framework that rewards calibrated prediction** — could serve all four. The truth-machine engine of Part I is the most fully worked-out instance, but it is an *instance*, not a special case.

## Prices are prediction errors

There is a precise sense in which this all collapses to one quantity. If the network prices delivery at the marginal cost of *unmet demand*, then a node's profit from any local action equals the reduction in total system-wide unmet demand that the action causes. Profit-seeking becomes distributed gradient descent on a single global error signal: **the price field is the prediction-error field.** Predict well → reduce error → get paid.

> ⚠️ **Honest caveat.** This clean alignment needs convex costs and price-taking nodes. Lumpy storage commitments and relays with market power break it; those need real mechanism design, not just the abstraction.

> 📐 **Formal version:** [The Mathematical Core](mathematical-core.md) §1.3 (prices as prediction errors; the alignment proposition) and §2 (the truth-machine fixed point).
