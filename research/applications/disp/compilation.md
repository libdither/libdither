# Compilation

Disp is very modular by design and the compilation system is no exception.

The general process goes like this:
 - User edits file
 - File is interpreted down to a collection of data structures containing the symbols, functions, and type definitions of that file as well as any external modules that are referenced
 - User runs program
 - Various macros run to generate the building blocks of programs.
   - `type` macro evaluates and creates structs of type `Type`
     - this macro generates a single symbol linking to a macro that generates a constructor for the type definition.
   - `trait` macro evaluates and creates structs of type `Trait`
     - these trait definitions are then attached to symbols
   - `fn` macro evaluates and creates structs of type `Function`
 - Once the main macros run more platform-specific macros can further modify the code.
 - Eventually the code is just a tree of `Function`s and `Funclet`s composed together to form a cohesive functional program.
 - The code is furthur compiled into a list of just `Funclet`s at which point it can be interpreted by a simple interpreter with the necessary `Funclet` implementations.
 - If the goal is a compiled executable, a `CompilationTarget` is chosen which translates `Funclet`s into `LinkOp`s.
 - These `LinkOps` are then processed into an executable file