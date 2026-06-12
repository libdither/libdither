# Disp

*The key to decentralization is effective coordination of collaborating computational components.*

Disp is a programming language where programs, types, and the type checker itself are all represented as regular programs in a self-reflective combinator calculus called the [tree calculus](https://treecalcul.us/). It is being developed to solve some of the fundamental problems with Dither, and in doing so should be pretty much the end-game of programming language design.

The problems to solve are:
 - For a distributed system you need to be absolutely sure your code has no bugs and never will. To do so you need formal verification against the most rigorous set of bug-denying constraints you can come up with, ideally with a compiler that is itself verified in the same way.
 - We need a language that can allow users to prove arbitrary equivalences and for these equivalences to be actively applied as optimizations, ideally directly to assembly.
 - For a language to not ossify over time and new ideas/designs to be able to be invented *and be automatically safely adopted* new designs need to be able to be formally proven to apply and safely rewrite old code dynamically at each individual user's desire.
   - As a subpoint here, the surface level details of the language should be user-customizable and fit to their preferred language syntax styles, whether that be block coding, ML-syntax, C-style, pythonic or what have you.
 - In order to create things fast, it is generally infeasible to spend copious amounts of time worrying about specific algorithms and it would be ideal if programmers could simply write constraints and have an optimizer satisfy them. i.e. programming-language-native program synthesis.

## The Core Idea: Types as predicate functions

The Core™ idea of disp is that type systems (the feature of compilers that handle whether or not a given program you've written fits some constraints) should be definable in the language itself. Thinking about type systems for a second, you essentially have a program in the meta-language that looks like this: `check(term: Term, typ: Typ)` where `Term` and `Typ` are some special datastructures. If you think about this though, specifically the case where you partially-apply `typ` to `check`, you get a function that just checks if a given term is of a particular type. But what if you could just define this as its own function?

This is what disp does and it makes it so that types are fundamentally first-class objects in the language, i.e. simply just functions that inspect some encoding of some data, and return true or false. More on this in [Universal System of Types](universal-system-of-types.md).

The key part to make this happen being "inspect some encoding of some data" and this is where the backend combinator calculus disp is built on comes in. It's called the tree calculus (Invented by Barry Jay, with development help by Johannes Bader) and it allows you to (similar to `quote` in lisp) directly inspect arbitrary trees (which can include datatypes *and* functions).

## The Solutions

Each of the problems above can be pretty easily solved downstream of types-as-predicates plus the tree calculus:

 - **Formal verification**: A type can encode any constraint you can compute, up to and including full specifications ("this function sorts its input"). And because the [type checker is itself disp code](implementation.md), it can be checked by the same machinery it implements, instead of being a pile of trusted compiler internals.
 - **Provable optimization**: Equality between programs is just another type, so "these two programs always produce the same result" is a proposition you can prove, package up, and share. Combined with [hardware modeling](program-synthesis.md#hardware-modeling) to judge when a rewrite is actually faster, optimizations become a [library anyone can contribute to](program-synthesis.md#provable-optimization) rather than a compiler release.
 - **No ossification**: Since the type system is a library, new disciplines can be adopted (or not) per user without forking the language. And since programs are nameless trees identified by hash, code deduplicates naturally across Dither, [names](names.md) and [syntax](syntax.md#syntax-agnosticism) become personal rendering layers on top, and proven equivalences let new designs safely rewrite old code.
 - **Program synthesis**: Partially apply the type checker to a specification-type and you get a function that accepts or rejects programs. Add scoring functions for speed and size and you have exactly the thing an optimizer can [search against](program-synthesis.md).

## Current State

There is a working prototype at [github.com/libdither/disp](https://github.com/libdither/disp). A small TypeScript runtime evaluates trees; everything else (the kernel, the standard types, the test suite) is written in Disp itself. See [Implementation](implementation.md) for what exists and what doesn't yet.

## Inspirations

 - [Tree calculus](https://treecalcul.us/) (Barry Jay) for a substrate where programs can inspect programs.
 - Lisp for treating programs-as-data in the first place.
 - Idris, Coq, Agda, Lean & Friends for dependent types.
 - [Unison](https://www.unison-lang.org/) & IPFS for content-addressed, deduplicated code.
 - Rust for its safe & fast zero-cost abstractions.
