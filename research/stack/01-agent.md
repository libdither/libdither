# 1 · The Agent
> *AI-drafted, human-directed — [what that means](ai-disclosure.md).*

Strip the problem down to one machine: yours. Before the knitting circle can have a shared archive, your node has to be able to do two things entirely alone — remember, and check. That sounds too small to be a chapter. It's the chapter everything else stands on, and the place where we can introduce, in miniature, the single habit the whole book keeps returning to.

Here it is. An agent is a predictor with a boundary, and it survives by running one loop:

> **Spend resources to reduce uncertainty about something, until you are confident enough to act — where "confident enough" scales with what's at stake.**

Remembering is this loop pointed at "what were those bits." Verifying is the loop pointed at "is this result real." Later chapters will point it at stranger targets — *who am I talking to*, *what will storage cost here next month*, *what will careful people eventually conclude about this claim* — and each time it will be the same loop wearing different clothes. If the book has a thesis, it's that this observation can be taken embarrassingly far.

## Certainty has a price list

Say a peer hands your node a computed result — a search index over the archive, a rendered preview, the resolution of some heavy query you didn't want to run yourself. On today's internet you'd believe it because of who sent it; the logo does the verifying. Alone, with no logos available, your node has to ask a different question, and it's a budget question rather than a trust question: *how much is it worth spending to be how sure?*

Because checks come at every price point, and they form a single curve of certainty-per-cost:

- **A sniff test.** Does the result look like what a cheap local model expects? Nearly free, and worth nearly what you paid.
- **A predicate check.** [disp](../disp/disp.md) types are predicates on results, and checking is usually far cheaper than computing (the whole of NP is built on this asymmetry). Cheap, strong, the workhorse.
- **Sampled re-execution.** Ask `k` independent executors. Undetected fraud now requires every one of them to collude on the same wrong answer, so confidence compounds like `(1−h)^k` — exponential certainty at linear cost, which is the kind of deal you should distrust and this time is real.
- **Bisection.** Two executors disagree; reduction traces are Merklizable; a referee finds the first wrong step in `O(log T)` checks. The expensive path, walked only on disagreement.
- **Full re-execution.** The top of the curve. Always available, rarely worth it.

The classical name for shopping along this curve is sequential hypothesis testing (Wald, 1945): keep buying evidence while the marginal value of certainty beats its marginal cost, then stop at a threshold set by the stakes. A signature on a meme gets the sniff test. A signature on the deed to the group's treasury gets the top of the curve. And some claims never reach threshold at any price you're willing to pay — those get served *as* uncertain, or not at all, which will matter more than it seems when we reach moderation.

What makes the curve's exact end reachable at all is disp. Programs there are content-addressed trees — the hash names *what a program is*, not where it lives — and computation is deterministic, confluent reduction, so two honest executors agree bit for bit, with "number of reduction steps" falling out as a machine-independent unit of work. (File that last fact away; it becomes the gas meter of chapter 3.) Exactness exists. The loop's job is deciding when it's worth paying for.

## Memory is a policy, not a warehouse

Now the other solo job. The naive picture of storing the archive — bits in a file system — turns out to be one point in a space of options, and not always the best one. When your node "stores" something, what it actually commits to is a **policy for materializing that value later**, and policies trade off four things at once: the bits you hold (rent, paid over time), the compute you'll spend reconstructing (paid at request time), the latency you can tolerate (paid in impatience), and the fidelity you actually need — which depends on the *use*, not the data.

That last axis is the interesting one. Consider the options for a chunk of the archive:

| Policy | Bits | Decode | Fidelity |
|---|---|---|---|
| raw bits | all of them | none | exact |
| compressed | fewer | some | exact |
| model + residual | few | more | exact — the residual corrects the model |
| model alone | fewest | inference | *approximately right, and labeled as such* |

The last row is new, and it's where this design parts company with ordinary storage systems. A model of the knitting circle's five years of chat can regenerate most of any given month — the running jokes have structure, Sarah's scarf saga follows an arc — and the parts it can't predict are precisely the residual worth paying raw-bit prices for. Which policy wins is not a global choice; it's decided pointwise by demand. The pinned messages stay raw. The archive's middle years live as model-plus-residual. The ambient texture of the place can live in the model alone, served with a confidence label, and for "what was the vibe of March 2022" a labeled approximation is the *right* product.

Retrieval, under this picture, is the certainty loop again: a request is a partial context, and the node either completes it above the caller's confidence threshold or escalates toward exact bits. Hash-addressed data isn't a different system from generative memory — it's the same system at the infinite-certainty end, kept for what justifies the cost.

One rule here is important enough to state as law, because everything downstream depends on it: **a generated completion never silently substitutes for canonical bits.** The confidence label is the entire difference between memory and hallucination. Drop it and you haven't built lossy compression; you've built a machine for corrupting archives politely.

⚠️ What we can't defend yet: disp is a working prototype (kernel and elaboration stages 0–3 self-hosted; effects, erasure, and the optimizer pending), and its networking story is the next chapter's typed-sessions program, which is presently a design note with theorems where the code should be. The economics of generative memory — who trains the models, how staleness gets priced — waits on chapter 3, and the privacy regression it causes (a partial context confesses far more about you than a hash does) waits on chapter 2's transport. Risks and details: [the predictive-materialization note](notes/predictive-materialization.md).

📐 Formal treatment: [Mathematical Core §1](mathematical-core.md), [§10.4](mathematical-core.md).

---

So: one node, alone, that can remember an archive and check a stranger's work. We set out to build a chat app and so far have built a machine that audits its own memory — which is progress, actually, though it doesn't feel like it. The next thing it needs is the thing no amount of solo cleverness provides: somebody else. That's [chapter 2](02-coupling.md).
