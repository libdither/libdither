# 3 · Substrate

Some computations you cannot run yourself: the render is too big, the proof search too long, the dataset lives on someone else's disk. So you hand the job to a stranger's machine and get back a number. Today, the reason you believe the number is a logo. You trust the result because you trust the company; the somebody-in-charge is doing the verification for you, by reputation.

[disp](../disp/disp.md) removes the need. Three properties, each a consequence of its design:

**Programs are data with a true name.** A disp program is a content-addressed tree: its hash says *what it is*, not where it lives. Moving it, storing it, and deduplicating it are the same operations you already have for any other data, and equal subtrees are pointer-equal, so deduplication is free.

**Computation is deterministic reduction.** Running a program is stepwise tree rewriting, deterministic and confluent, so two honest executors of the same program agree *bit for bit*. That single property turns verification from a trust problem into a sampling problem, and it gives a buyer a menu:

- **Re-execute it.** The paranoid option, always available.
- **Sample `k` executors.** Undetected fraud requires every sampled executor to collude on the same wrong hash: probability `(1−h)^k` for honest fraction `h`. Exponential security for linear cost.
- **Bisect a dispute.** Reduction traces are Merklizable, so a referee can find the first wrong step in `O(log T)` checked steps. The expensive path is only walked on disagreement.
- **Check a predicate.** disp types are predicates on results. When checking is cheaper than computing — the usual case, by NP-style asymmetry — verify the answer directly and skip replication entirely.

**Work has a unit.** "Number of reduction steps" is a machine-independent measure of computation: a natural gas metric. The metering a compute market needs comes with the substrate, for free.

⚠️ Open, and worth stating plainly: disp is a working prototype, not a product. Effects, erasure, and the optimizer are pending, and there is no networking or serialization layer yet. The plan is for the network's service API to *be* disp's effect algebra (📐 [Mathematical Core §1.5](mathematical-core.md)), which would make the bridge definitional rather than glue code — but today that bridge is the largest unbuilt piece between any two layers of the stack.

---

You can now buy computation from strangers and check what comes back. But every request you send still broadcasts what you want to whoever is watching the wire. That is [chapter 4](04-routing.md).
