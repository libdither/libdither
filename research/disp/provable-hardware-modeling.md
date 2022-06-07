# Provable Hardware Modeling

#### How do we generate fast code?
 - Currently, Optimizing Compilers generate fast code through intermediate representations and various techniques to figure out what code is needed and what code is not.
	 - https://www.lihaoyi.com/post/HowanOptimizingCompilerWorks.html
 - These strategies are mostly arbitrary and not easily improvable. A programmer has to go through and figure out which optimizations are worth the compiler computation cost and which aren't. There are an immeasurable number of trade-offs and potential improvements for a given piece of hardware. This calls for a new method to quantify these trade-offs and create a better system.

#### How do we create fast algorithms?
 - We typically manually write algorithms we think will run fast and then compare them to other algorithms using benchmarks. However, benchmarks have so many confounding factors that it is difficult to compare two of them and make definitive conclusions.
	 - Results may also depend on whether the algorithm is fit for the CPU architecture. The same algorithm may run faster or slower depending on a bazillion different factors such as [layout](https://www.youtube.com/watch?v=r-TLSBdHe1A)

## How To Model Performance
To create efficient code, we must have a model of how that code is run. Typically this model is held in the programmer's mind and is expressed through compiler and algorithm design. Instead of holding it in our forgetful, biased brains, it might be a good idea to have a software-defined model of our hardware so that we can prove that our optimizations and algorithms are actually faster.

Model specifications & options
 - Should take into account modern CPU features such as: pipelining, superscalar execution, out-of-order execution, and branch prediction.
 - Should be generic enough to model different CPU generations of the same architecture.
 - Should take into account other hardware qualities such as RAM latency, GPU parallelization options, and any other model-able aspect that could influence performance.
 - Simple models could be hand-crafted using published characteristics from documents like the [Instruction Tables](https://www.agner.org/optimize/#manual_instr_tab)
 - More sophisticated models could be made for open source CPU architectures by using the logic gate layout of the CPU. (This may be possible for architectures like RISC-V)

Benefits to this approach include
 - **No more annoying benchmarks** Faster algorithms can be provably faster for a given model.
	 - Note: Benchmarks still need to be used to compare different models of a hardware system, however these benchmarks can be much more sophisticated and take into account more confounding factors.
 - **Faster algorithm adoption** Compilers can substitute old algorithms for new, faster, algorithms without delay using a public distributed database of algorithms.
	 - Think: Bob has a new algorithm, Bob proves it is faster for a well-trusted model of x86_64 CPUs, Bob broadcasts algorithm to everyone, everyone checks the proof that it is faster -> everyone uses new algorithm.