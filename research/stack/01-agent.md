# 1 · The Agent

Start with one node: your laptop, running the software alone. No network yet, nobody to pay or be paid by. What is this thing?

It is a predictor with a boundary. Inside: a model of the world it cares about, some exact data, some keys. At the boundary: whatever it senses and emits. And it runs one loop, which this whole book is built from:

> **Spend resources to reduce uncertainty about something, until you are confident enough to act — where "confident enough" scales with what is at stake.**

Everything the node does is this loop pointed at a different question. Remembering points it at "what were those bits." Verifying points it at "is this result real." Later chapters point it at "who am I talking to," "what will this cost," and "what will careful judges conclude." One loop, many targets.

## Certainty is purchased, not assumed

Suppose the node is handed a computation result — by a process it doesn't fully trust, or later, by a stranger. Today the reason you believe such a result is a logo: you trust the company that ran it. Alone, the node needs something better, and it has a *budget question*, not a trust question: how much is it worth spending to be how sure?

Checks are purchases of evidence, and they form one curve of certainty per unit cost:

- **A model check** — does this result look like what a cheap predictor expects? Nearly free, weak evidence.
- **A predicate check** — [disp](../disp/disp.md) types are predicates on results; when checking is cheaper than computing (the usual case), verify the answer directly. Cheap, strong.
- **Sampled re-execution** — ask `k` independent executors; undetected fraud needs all `k` to collude on the same wrong answer, so confidence compounds as `(1−h)^k`: exponential certainty at linear cost.
- **Bisection** — reduction traces are Merklizable, so a referee finds the first wrong step of a disputed run in `O(log T)` checks. Walked only on disagreement.
- **Full re-execution** — the top of the curve, always available.

The classical form of this loop is sequential hypothesis testing (Wald): keep buying evidence while the marginal value of certainty exceeds its marginal cost, stop at a threshold set by the stakes. Some claims never cross the threshold; they get served *as* uncertain, or not at all. A signature on a meme deserves a glance; a signature on a deed deserves the top of the curve.

What makes the curve's upper end reachable at all is disp: programs are content-addressed trees (the hash says *what it is*, not where it lives), computation is deterministic and confluent reduction, so two honest executors agree **bit for bit**, and "number of reduction steps" is a machine-independent unit of work — the metering a compute market will need later, free at the substrate. Exactness exists; the loop decides when it's worth paying for.

## Memory is a materialization policy

The node's second job is remembering, and the naive picture — a file system holding bits — is one point in a larger space. What the node actually commits to, when it "stores" something, is a **policy for materializing that value later**, and policies trade off four things:

| Axis | The cost |
|---|---|
| bits held | storage, over time |
| compute to materialize | decoding or inference, at request time |
| latency | how fast the value appears when demanded |
| fidelity | how wrong the served value may be, weighted by the *stake* of the use |

Raw bits maximize storage and minimize everything else. Compressed bits trade decode compute for space. A **model plus a residual** stores only what the model can't predict — still lossless, since the residual corrects it. A **model alone** is the cheapest of all and *knowingly lossy*: it serves a completion with a confidence label instead of a guarantee.

These are points on one Pareto frontier, and none is "the" representation: the hot value near constant demand stays raw; the archival tail lives as model-plus-residual; ambient knowledge lives in the model alone. Retrieval, in this picture, is the certainty loop again: a request is a *partial context*, and the node either completes it above the caller's confidence threshold or escalates toward exact bits. Hash-anchored data is not a different system from generative memory — it is its infinite-certainty limit, kept for the cases that justify the cost.

One rule in this design is load-bearing enough to state as law: **a generated completion never silently substitutes for canonical bits.** The confidence label is what separates memory from hallucination; dropping it is not lossy compression, it is corruption.

⚠️ Open, and stated plainly: disp is a working prototype — effects, erasure, and the optimizer are pending, and its networking story is the next chapter's typed-sessions program, not yet built. The generative-memory economics (who trains the models, how staleness is priced) waits on the market chapter, and the query-privacy regression it causes (a partial context reveals far more than a hash) waits on the coupling chapter's transport layer. Details and risks: [the predictive-materialization note](notes/predictive-materialization.md).

📐 Formal treatment: [Mathematical Core §1](mathematical-core.md) (the substrate and verification), [§10.4](mathematical-core.md) (verification as optimal stopping).

---

One node can now verify and remember, alone. What it cannot do alone is almost everything else: earn, learn what others know, or survive its own disk failing. For that it needs a second node, and the two of them need to agree on how to talk. That is [chapter 2](02-coupling.md).
