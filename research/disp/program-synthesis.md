# Programs from Specifications

The long-term goal behind Disp: I want to be able to synthesize the best possible program given a specification.

Unpacking that sentence: a specification is a type, and in Disp [a type is a program](universal-system-of-types.md) that checks other programs. So the type checker can be turned into a function that takes a candidate program and returns 1 or 0. Combine that with functions that measure other things you care about (speed, memory usage, code size) and you have a *scoring function*: a single program that looks at another program and tells you how good it is.

Once "how good is this program?" is itself a program, writing software can be turned inside out. Instead of writing the program, you write the scorer, and an optimizer searches for a program that scores well: one that is formally correct (the type checker accepts it) and efficient along whatever axes you measured.

For this to work, a few things have to hold:

 - **Programs must be data**, so that the scorer can inspect candidates and the optimizer can build them. This is what tree calculus gives Disp.
 - **The specification language must be strong enough** to say what you actually mean. That is what the dependent type system is for: "a sorting function" can be specified precisely, not just "a function from lists to lists".
 - **Performance must be measurable without guesswork**, which is what the rest of this page is about.

## Provable Optimization

The whole business of computing faster in general comes down to finding new structures and algorithms that contain the same information as the old ones, but can do certain computations faster.

For example: multiplying by 2 can be done two ways on a CPU, through the multiplication instruction (slow) or bitshifting (very fast!). Same answer, different cost. A bigger example might be swapping one data structure for an equivalent one with better O(n) behavior, which only pays off past a certain dataset size. Real programs are towers of choices like these.

Today, these substitutions happen in two ways. Compilers apply a fixed bag of rewrites that their authors hand-picked and trust. Programmers do the rest incrementally by hand, using benchmarks as a form of proof. Ideally all optimization could be done by the compiler, but that compiler would have to have knowledge of every possible implementation of every algorithm and when each one wins.

Disp aims to solve this by making optimization a *library* instead of a compiler internal. Since Disp programs are data, and equality between programs is something the type system can state and check, an optimization can be packaged up as: here are two programs, here is a proof that they always produce the same result, and here is the evidence about when one is faster. Such a package can be:

 - applied manually, like importing any other dependency,
 - found automatically, by a compiler searching the library for rewrites that apply to your code (with results recorded for subsequent runs),
 - shared safely, because the equivalence proof is checked on arrival. You don't have to trust whoever sent it.

The "when is it faster" half is the harder part, since benchmarks are noisy and machine-specific. That is what hardware modeling is for.

## Hardware Modeling

#### How do we generate fast code?
Optimizing compilers generate fast code through intermediate representations and [various techniques](https://www.lihaoyi.com/post/HowanOptimizingCompilerWorks.html) for figuring out what code is needed and what code is not. These strategies are mostly arbitrary and not easily improvable: a programmer has to go through and figure out which optimizations are worth the compiler computation cost and which aren't, and there are an immeasurable number of trade-offs and potential improvements for any given piece of hardware.

#### How do we create fast algorithms?
We typically write algorithms we think will run fast and then compare them to other algorithms using benchmarks. However, benchmarks have so many confounding factors that it is difficult to compare two of them and make definitive conclusions. The same algorithm may run faster or slower depending on a bazillion different factors, down to the [memory layout](https://www.youtube.com/watch?v=r-TLSBdHe1A) the compiler happened to pick.

To create efficient code, we must have a model of how that code is run. Typically this model is held in the programmer's mind and expressed through compiler and algorithm design. Instead of holding it in our forgetful, biased brains, it might be a good idea to have a software-defined model of our hardware, so that we can *prove* (or at least have really good heuristics that check whether) our optimizations and algorithms are actually faster.

What such a model should account for:
 - Modern CPU features: pipelining, superscalar and out-of-order execution, branch prediction.
 - Differences between generations of the same architecture.
 - Everything else that moves the needle: RAM latency, cache behavior, GPU parallelism.

Simple models could be hand-built from published data like Agner Fog's [instruction tables](https://www.agner.org/optimize/#manual_instr_tab). For open hardware (RISC-V, say), more sophisticated models could be derived from the actual logic design.

Benefits of this approach:
 - **No more annoying benchmarks.** A faster algorithm can be provably faster for a given model. (Benchmarks still get used to compare different models of a hardware system, but those benchmarks can be much more sophisticated and account for more confounding factors.)
 - **Faster optimization adoption.** With models and equivalence proofs, optimizations can spread through a public database without a compiler release in between:
   - Bob finds a new optimization for a certain pattern of expressions.
   - Bob proves it is faster for a well-trusted model of x86_64 CPUs.
   - Bob broadcasts the optimization to everyone.
   - Everyone's computers check the proof.
   - Everyone's programs get faster.

## Closing the Loop

The really interesting part is what happens once all of this feeds back into itself. The type checker is a Disp program, so it too can be scored and optimized. The optimizer can be pointed at its own components. The hardware models can be refined by the very search they accelerate. And a large enough library of proven-equivalent programs is a perfect dataset for training an AI to find new equivalences. Every piece of the system is a candidate for the system to improve, which is why so much of Disp's design is about keeping everything (checker included) inside the language rather than bolted onto it.

This is all a long way off, to be sure. What exists today is the foundation it requires: a calculus where programs are data, and a self-hosted type checker on top of it. The optimizer is future work, and an external search process (combinatorial, neural-guided, or both) will probably have to bootstrap it before it can take over its own improvement.
