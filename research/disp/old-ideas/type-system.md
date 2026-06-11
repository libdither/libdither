# Type System of Disp

While the type system of Disp can be literally [any computable program](universal-system-of-types.md), disp will have its own standard type system defined in the standard [context](names.md) that will allow for the creation of programs optimisable to a level at or beyond the speed of C and Rust.

The standard type system for disp should be:
 - Simple
   - Relatively few core inference rules
   - More complex types are constructed from a few simple primitive type constructors.
 - Fast
   - Types that reflect hardware primitives (such as machinecode) should be representable and the type system should be able to reason about equivalence between inefficient high-level types and efficient low-level types.
 - Consistent
   - Logic of types should be consistent
   - Type checking should never loop indefinitely
 - Representative
   - The standard type system for Disp aims to be a viable foundation for all of mathematics.

## Substructural Types

For a systems language, runtime overhead must be kept to a minimum. This means that the restrictions on lifetime and movability of heap and stack allocations should be modeled and enforced at compile time, instead of relying on a runtime methods such as garbage collection or reference counting.

Disp uses a type system that divides terms and types into 3 categories:

Unrestricted
 - This includes most types, type constructors, and terms that can fit in a single CPU register.
 - Unrestricted objects may be moved around and duplicated at will in a program and don't require a specific function defining how they are deallocated.

Linear
 - This includes terms allocated on the heap, mostly structures with variable-length allocations.
 - Linear objects must be used in each context exactly once and must define at least one destructor or else it won't typecheck.
 - Linear objects may contain unrestricted objects, just like how heap-allocated objects may contain numbers that can be stored in registers.
 - Examples: ATS, Rust kinda

Ordered
 - This includes any term allocated on the stack, which is pretty much anything else.
 - Ordered objects must be used in each context exactly once and can only be used in reverse-order of allocation (like a stack).
 - Ordered objects may contain unrestricted or linear objects.
 - Examples: [Webassembly](https://binji.github.io/posts/webassembly-type-checking/), Porth

A paper outlining a potential framework for a type system unifying all 3 of these substructural modes can be found [here](https://mitpress-request.mit.edu/sites/default/files/titles/content/9780262162289_sch_0001.pdf).

## Minimal Type Theory

In order for Disp to be able to double as a general-purpose theorem prover, the ideas from [this paper](https://www.math.unipd.it/~sambin/txt/MaiettiSambin-rev2.pdf) describing a Minimal Type Theory (mTT) may be used.

## Inspiration

 - [ATS Language](https://www.youtube.com/watch?v=zt0OQb1DBko)

 - [Substructural Type Systems](https://mitpress-request.mit.edu/sites/default/files/titles/content/9780262162289_sch_0001.pdf)

 - [Towards a Minimalist Foundation for Constructive Mathematics](https://www.math.unipd.it/~sambin/txt/MaiettiSambin-rev2.pdf)