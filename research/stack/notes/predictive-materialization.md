# Working Note · Predictive Materialization

> 🧪🤖 **Working note** (AI-drafted — [provenance](../ai-disclosure.md)). Source material for the rewritten [Agent](../01-agent.md) and [Market](../03-market.md) chapters. Denser than book prose; claims here are design candidates, not settled spec.

## The idea in one paragraph

Storage, retrieval, routing, and verification are one activity: **spending resources to reduce uncertainty about a value until you are confident enough to act, where "enough" scales with the stakes.** A stored representation is a *policy for future materialization*, not a pile of bits. A retrieval query is a partial context to complete. A route is a step toward someone whose model completes it better. A verification is the same purchase pointed at "is this real." Exact bits and hash equality are not a different system; they are the infinite-certainty limit of this one.

## Storage: the four-way trade

The naive form of the idea ("storage = model + residuals") optimizes description length only. The real objective has four terms, and the [MATERIALIZE](../03-market.md) flow problem was already carrying three of them:

| Axis | Cost | Formal anchor |
|---|---|---|
| bits held | storage × time | Shannon / MDL |
| compute to materialize | decode / inference at request time | Levin's `Kt` (description + log time) |
| latency | deadline pressure at the point of demand | the flow problem's spacetime edges |
| fidelity vs. utility | expected distortion × stake of the use | rate–distortion, stake-weighted |

Representations are points on the Pareto frontier over these four:

- **raw bits** — max storage, zero decode, zero distortion, min latency;
- **compressed bits** — fewer bits, some decode, zero distortion;
- **model + residual** — few bits, more decode, still zero distortion (the residual corrects the model);
- **model only** — minimal bits, decode cost, *known nonzero distortion carried as a confidence label*.

Which point is optimal is decided *pointwise by the price field*: near hot demand latency dominates (hold raw); mid-field, model+residual; in the far tail, model-only. Storage tiers, CDN behavior, and semantic caching fall out as geometry over one field. The objective, informally:

```
minimize  Σ demand-weighted [ bits·t  +  decode-compute  +  latency-penalty  +  E[distortion]·stake ]
```

The generative option does not replace the market's flow problem; it **widens the action set** with edges that carry a new attribute (distortion/confidence), and the market prices that attribute like any other.

## Retrieval: uncertainty descent

A request is a partial context. The serving node either completes it above the caller's confidence threshold (cheap, possibly lossy, labeled), or routes toward nodes advertising lower expected loss on this context type. Routing becomes **mixture-of-experts gating over the network**; the old data-trail-search breadcrumbs generalize to descent on an uncertainty gradient. The residual store holds what no model predicts, priced higher; hash-anchored canonical data is the expensive exact tail.

"Content addressing" then generalizes: agreement among independent models is probabilistic content addressing; hash equality is its deterministic limit, reached when the stakes justify the cost.

## Verification: one curve, not a menu

The old substrate chapter offered a verification *menu* (re-execute, sample `k` executors, bisect disputes, check a predicate). These are points on one curve of **certainty per unit cost**, and the right frame is sequential evidence purchase (Wald's SPRT: optimal stopping for hypothesis testing):

- each check is an action with a cost and an expected likelihood-ratio contribution;
- spend while marginal value of certainty (stake-dependent) exceeds marginal cost;
- stop at threshold `τ(stake)`, or when the budget runs out — then serve with the achieved confidence and its label.

`k`-replication was already on this curve (`P[fraud] ≤ (1−h)^k`: multiplicative confidence at linear cost). Model-agreement checks extend the curve downward into cheap territory; re-execution and hash equality sit at the top. Some claims never cross the threshold; they are served *as* uncertain or not at all.

## Soundness rules and open risks

- **The confidence label is load-bearing.** A generated completion must never silently substitute for canonical bits. The label is what separates memory from hallucination; dropping it is data corruption, not lossy compression.
- **Query privacy regresses.** A partial context is a far richer surveillance surface than a hash request. The anonymity layer has new work (onion-wrapped inference? query splitting?), though generative serving also *adds* deniability in some regimes. Unresolved either way.
- **Model economics.** Who trains, who pays, how staleness is priced. Connects to the open/closed split in the market chapter: *coordination models* (routing, pricing — the shared expectations the market needs to clear) are Schelling infrastructure and want to be open, funded as public goods; *content models* can stay closed and sell verified inference, since the certainty market never needs to see weights. The network buys a model open when the estimated value of diffusion exceeds the buyout price — retroactive public-goods funding, priced by the truth machinery.
- **Adversarial models** poisoning the cheap end of the verification curve; the immune machinery (independence-weighting of model agreement) is the intended counter, undesigned.
