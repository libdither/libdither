# How to do Computation Fast

The whole business of computing faster comes down to finding new structures and algorithms that contain the same information as old structures, but can do certain things faster.

For example: Multiplying by 2 can be done two ways on a cpu level, through the multiplication instruction, or bitshifting. This is an example of an optimization for a specific system.

Another example might be how Fibonacci trees are equivalent to binary Binary trees, but are technically faster on some operations and perform better when working on large enough datasets to where that improvement in speed comes into effect.

Optimization by switching out algorithms and datastructures are typically done automatically by the compiler or incrementally by the programmer using benchmarks as a form of proof, ideally all optimisations could be done by the compiler, but that compiler would have to have knowledge of all possible implementations of a specific algorithms and how it all works together with a data structure.

Disp aims to solve this issue through [hardware modeling](hardware-modeling.md) and equivalence proofs between data structures and algorithms. Once there is a large enough dataset for algorithms and structures that are equivalent, this would be a perfect application for an AI to be trained to improve algorithms.
