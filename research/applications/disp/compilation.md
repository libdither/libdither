# Compilation

Disp is very modular by design and the compilation system is no exception.

The general process goes like this:
 - User edits file
 - File is interpreted down to a collection of data structures containing the symbols, functions, and type definitions of that file as well as any external modules that are referenced
 - User runs program
 - Various macros run to generate lower-level parts of the program, eventually compiling down to pure lambda calculus and monadic `Funclet`s" representing any side effects the program might have.
   - Examples of some possible macros
     - `type` macro evaluates and creates structs of type `Type`
       - this macro generates a single symbol linking to a macro that generates a constructor for the type definition.
     - `fn` macro evaluates and creates structs of type `Function`
 - The lambda expression tree is traversed and each lambda expression is matched to a corresponding target instruction.
 - The target instructions are joined together by platform-specific algorithms (i.e. for x86_64 register numbers are assigned to connect operations).
 - The tree of instructions is then flattened and can be run as an executable or my a controlling program.