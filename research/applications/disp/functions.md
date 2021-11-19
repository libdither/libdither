# Functions

Disp aims to be a functional language, this means that functions are first-class citizens when it comes to programming.

However, since disp aims to be as fast as possible and be a general purpose language, it must compile down to machine code (a decidedly not functional environment) and interact with external state (devices, syscalls, etc.). To bridge this gap between functional and stateful, disp uses something called "funclets".

Before a program is compiled to machine code, it is first translated into a list of funclets.

## Funclets

Funclets are objects that represent how information flows through the state of the computer at instruction level. Each funclet represents an operation and information about where the operation will input and output data in the global state of the system. (by global state, I mean registers and memory).

A funclet is an object that contains three things:
 - The location(s) that the operation will use.
 - The location(s) that the operation will write output to.
 - A link to a procedure (compiled bytecode) to generate the specific operation from the input and output location data.

An example of a funclet would be the `add` x86_64 operation which comes in many forms:
 - `add <reg> <reg>`
 - `add <reg> <mem>`
 - etc.

If the operation says to add register `ebx` to `eax`, the funclet will contain one source location corresponding to the call code for the `ebx` register and one output location corresponding to code for `eax`.