# Disp

*What is a program? What is data? Why, they are one of the same.*

Disp is a Decentralized Programming Language for the Decentralized Internet. The ultimate goal of Disp is (much like Dither) to allow for the replacement of all existing programming languages by creating a flexible, modular, and *decentralized* language.

#### What does it mean for a Programming Language to be Decentralized?

Modern programming languages are centraly-defined. Their parsers, type-checkers, interpreters, and specification are stored in a central repository, with complex systems of consensus creating a single evolving specification. Disp will attempt to do the opposite. It will provide a core set of tools for *building* languages that can be used however the user desires, and then use concepts from Category Theory (and semantic graph structures) to relate these "separate" languages together and allow them to translate seamlessly into each other.

What might this look like? Imagine having an untyped lambda calculus evaluator (i.e. a simple model of computation) and allowing users to define various type systems for this model, from untyped, duck-typed, structurally-typed, simply typed, Martin-Loef Typed, or even the Calculus of Constructions, Cubical Type Theory and beyond. All these various type systems semantics can be related using Category Theory so that types in a simpler type system can be translated to types in a more complex type system. Then, on top of this, the syntax used to display (whether that be textual or using a [projectional/structured language editor](https://github.com/yairchu/awesome-structure-editors)).

## Goals

Create a general-purpose programming language that has the following main properties:
 - Absolute flexibility & configurability (customizable syntax & type system).
   - [Syntax Agnosticism](syntax-agnosticism.md)
     - [No More Bikeshedding](no-more-bikeshedding.md)
     - Projectional Editing
     - Easy Localization
   - [Universal System of Types](universal-system-of-types.md)
   - [Ontologies and Semantic Graphs](ontologies.md)
 - Most efficient language to run (Combined interpreter, JIT and AOT, provably equivalent in terms of behavior)
   - Solve the dependency problem via content-addressed "deduplicated" AST structures & machinecode, and provable backwards-compatability.
   - Support for compilation to any cpu / interpreter
   - [Provable Zero-Cost Abstraction](provable-zero-cost-abstraction.md)
   - [Hardware Modeling](hardware-modeling.md)
 - Seamless integration into Dither

## Ideas
 - Objects are stored in self-defining data structures, i.e. they link to data that describes the format of the object (whether that be structurally, in-memory, or symbolically).
	 - An object can be defined by its computation -> Compilation can be as incremental as you want.
	 - 
 - High level programs are provably compiled into arbitrary lower-level representations with minimal programmer input.
	 - An inductive datatype like `Nat` could be provably compiled into something like `BigInt` and be much more efficient. In tern, as long as you either ignore the possibility or proove it never happens, `BigInt` could be transformed into a  `U64` or something similar.
 - Goal of compilation is cpu-specific object file complete with
   - data pre-loaded into memory
   - list of cpu-specific instructions.
   - hash of external virtual kernel API (i.e. syscall functions)
 - virtual kernel APIs can be constrained to give programs access to different parts of the computer, or forgone entirely for programs that only manipulate data.
 - Running object files requires a uniquely setup syscall kernel API that can deal with interrupts

## General Architecture
- There are two structures that are core to disp: `Expr`, and `Judgement`. `Expr` is an inductive structure that represents all the terms and types of the language. `Judgement` is the structure that matches `Expr`s together to create a typing judgement (i.e. saying some term is of some type or `a : A`). See [[expr]] for more details.
- All structures of the language are defined through [[hashtypes]] 

- All language types are themselves self-defining structures, including the final bytecode file.
- The language files are not stored as text files, they are instead stored as self-defining structures of groups of commands.


## Inspirations
 - Lisp for treating programs-as-data.
 - Idris, Coq, Agda, Lean & Friends for dependent types.
 - Rust for its safe & fast zero-cost abstractions.
 - IPFS for deduplication of shared code
 - IPLD for self-defining structures