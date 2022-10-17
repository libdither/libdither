# Disp (Decentralized Lisp)

*What is a program? What is data? Why, they are one of the same.*

Inspired by:
 - Lisp for its flexibility
 - Idris & Coq for the infinite expressiveness of dependent types
 - Rust for its speed
 - IPFS for deduplication

## Goals

A general outline of the (very lofty) goals of Disp.

 - Most efficient language to run
 - Support for any cpu or interpreter
 - Most efficient language to write
   - Projectional Editing
     - Localization-agnostic naming
   - Mixable syntax
     - Transpilation from any other language
 - Seamless integration into Dither

## Core Ideas

 - [Universal System of Types](universal-system-of-types.md)
 - [Binding Trees]



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


