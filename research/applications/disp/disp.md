# Disp (Dither-Lisp) (WIP)

What are computers if not pieces of data interpreted by silicon that manipulate other pieces of data? Disp is a programming language that takes this concept to its logical conclusion where programs are simply from tree data structures manipulated into list data structures.

## Goals
 - Extremely fast compile times
 - Extremely fast execution time
 - Support for any possible computer
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

- The language is designed as a layer on top of machinecode, and at the simplest layer with no abstractions, the simplest programs are just lists of assembly instructions.
- All language types are themselves self-defining structures, including the final bytecode file.
- The language files are not stored as text files, they are instead stored as self-defining structures of groups of commands.


