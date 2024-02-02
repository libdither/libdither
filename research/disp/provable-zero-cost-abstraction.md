# How to mamke High-Level Languages do Computation Fast

The whole business of computing faster in general comes down to finding new structures and algorithms that contain the same information as old structures, but can do certain computation faster.

For example: Multiplying by 2 can be done two ways on a cpu level, through the multiplication instruction (slow), or bitshifting (very fast!). This is an example of an optimization for a specific system.

Another example might be how Fibonacci Binary trees are equivalent to regular Binary trees, but are technically faster on some operations and perform better when working on large enough datasets where that improvement in O(n) speed comes into effect.

Optimization by switching out algorithms and datastructures are typically done automatically by the compiler or incrementally by the programmer using benchmarks as a form of proof, ideally all optimisations could be done by the compiler, but that compiler would have to have knowledge of all possible implementations of a specific algorithms and how it all works together with a data structure.

Disp aims to solve this issue by providing a library of formally-proven-equivalent optimizations, allowing the programmer to either manually find an optimization to apply to their code, or automatically via search in the compiler, the results of which are recorded for subsequent runs.

The efficacy of optimizations will be done via traditional benchmarks, but also through [hardware modeling](hardware-modeling.md) in cases where benchmarks are too slow to run. (i.e. in a compiler optimization search-scenarioa)

Once there is a large enough dataset for algorithms and structures that are equivalent, this would be a perfect application for an AI to be trained to improve algorithms.
