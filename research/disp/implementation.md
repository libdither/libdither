# Implementation

Disp has a working prototype, developed at [github.com/libdither/disp](https://github.com/libdither/disp). This page is a snapshot of how it is built and how far along it is. There is also an [interactive walkthrough](/disp/interactive-walkthrough.html) that builds everything below from scratch with runnable examples, though fair warning: it describes an older version of Disp, and it was largely AI-generated, so it reads like it.

## The Substrate

Everything bottoms out in tree calculus: programs are binary trees, and there is a single reduction rule for applying one tree to another. A small TypeScript runtime implements this rule, along with a parser for `.disp` source files and a compiler that turns parsed definitions into trees.

One implementation detail matters a lot: trees are *hash-consed*, meaning structurally identical trees are stored exactly once, and comparing two trees for equality is a single pointer comparison. This is what makes "same code = same hash" cheap enough to use as the language's notion of identity.

## The Kernel

The type system is not in the TypeScript. It is written in Disp, as a small kernel of `.disp` files, under a strict discipline:

*The in-language code is the specification. Host code is only allowed to be an optimization of it.*

Since [types are programs that check other programs](universal-system-of-types.md), most of the type system is plain library code. The kernel proper is just the machinery that plain code can't be trusted to build: it mints the sealed "hypothetical value" tokens used to check functions, and runs candidate programs under a watcher that keeps them from peeking inside those tokens. A program that checks out on a hypothetical input is sound for every input, and the watcher is what makes that argument hold. Everything else (`Bool`, `Nat`, function types, records, equality and its proof rules) is ordinary library code built on top, and the test suite is itself written in Disp.

## What Exists / What Doesn't

Working today: the runtime, the parser and compiler, the kernel, a standard library (numbers, lists, options, results, pairs, sets), dependent records with derived fields, and a few hundred in-language tests, including ones that pin down the soundness boundary by checking that known attacks on the checker fail.

Not yet built: erasing checks from verified code so it runs at full speed, a proper effects story for talking to the outside world, better error messages, and the [optimizer](program-synthesis.md). The full design, including the parts that are still on paper, lives in the spec documents in the repo (`TYPE_THEORY.typ`, `SYNTAX.typ`, `COMPILATION.typ`).
