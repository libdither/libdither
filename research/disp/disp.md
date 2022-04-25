# Disp (Dither-Lisp) (WIP)

Everything is data. 
Programs are interpreted data that manipulates other pieces of data.

Disp is a programming language that takes this concept to its logical conclusion with some functional programming and type theory sprinkled in where programs are composed functions and functions are data.

## Goals
 - Extremely fast compile times
 - Extremely fast execution time
 - Support for any possible cpu or interpreter
 - Maximum re-use of code (data)
 - Interface for defining hashtypes and hashtraits.

## Ideas
 - Goal of compilation is cpu-specific object file complete with
   - data pre-loaded into memory
   - list of cpu-specific instructions.
   - hash of external virtual kernel API (i.e. syscall functions)
 - virtual kernel APIs can be constrained to give programs access to different parts of the computer, or forgone entirely for programs that only manipulate data.
 - Running object files requires a uniquely setup syscall kernel API that can deal with interrupts

## General Architecture
- `Function`s are the core of Disp. There is no compiler, there are just collections of macros (i.e. functions that transform functions). See the [function spec](functions.md)

- All language types are themselves self-defining structures, including the final bytecode file.
- The language files are not stored as text files, they are instead stored as self-defining structures of groups of commands.


