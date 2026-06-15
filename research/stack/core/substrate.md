# 3 · A Verifiable Substrate

> 🚧 **Draft (core-idea sketch).** *Part A · Core Ideas.*

**The problem.** To *sell* computation you must trust the result. To share code and data across a decentralized system you need it portable, deduplicated, and addressable by *what it is* rather than where it lives. General-purpose code doesn't give you any of this for free.

**The core idea.** [disp](../../disp/disp.md): programs **are** content-addressed trees, computation **is** deterministic reduction (tree calculus), and types **are** predicates the result must satisfy. Because reduction is deterministic and confluent, two honest executors of the same program agree bit-for-bit — so a buyer can verify a result by re-execution, by sampling `k` independent executors, or (when the result-predicate is cheap) by just checking the predicate. Reduction-step counts give a machine-independent **"gas" unit** for metering work. Moving a tree preserves its hash, so storage and routing of code/data become the same operation.

**Leans on:** nothing — it's foundational tech. **Enables:** the resource market (5) — verifiable compute, the value algebra, and metering all come from here; and machine-resolvable questions for the truth machine (7).

> ⚠️ **Where it's thin.** disp is a working prototype, but effects, erasure, the optimizer, and a self-hosted parser are pending — and crucially **there is no networking/serialization story yet.** "Nothing connects disp to the network today beyond intent" is the single largest gap between layers. Part B.
