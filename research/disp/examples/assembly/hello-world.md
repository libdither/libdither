# Assembly Layer

Disp compiles directly from high-level to cpu machine code. This means that it is possible to write low-level assembly commands directly within high-level code (although this is a bad idea)

## x86-64

This is a simple Hello World program for linux written in x86 assembly compiled with nasm.

```asm
global _start

section .data
  msg: db "Hello, world!", 10
  msglen: equ $ - msg

section .text

_start:
  mov rax, 1        ; write(
  mov rdi, 1        ;   STDOUT_FILENO,
  mov rsi, msg      ;   "Hello, world!\n",
  mov rdx, msglen   ;   sizeof("Hello, world!\n")
  syscall           ; );

  mov rax, 60       ; exit(
  mov rdi, 0        ;   EXIT_SUCCESS
  syscall           ; );

```
compiled: `nasm -f elf64 hello.s && ld -o hello hello.o && ./hello`, 

In Disp, this might look something like:
```disp
(use std::default::*)
(use std::assembly)
(use std::x86_64::{ops::{mov, syscall}, reg::{rax, rdi, rsi}})
(use std::linux::{syscall::{WRITE, EXIT},const::{STDOUT_FILENO, EXIT_SUCCESS}})

// Defines hello world string constant, structured as <B64><DATA>
(let hello_world:String "Hello, World!")

// Assembly Macro defines "mem" macro.
// Every time mem macro is invoked, it adds passed object to buffer returns byte location in buffer.
(assembly 
	(let msg (mem hello_world)) // Add string to buffer & set msg to location of string
	(mem ( // Add assembly to mem
		// mov is a macro defined in the ::x86_64 collection. It resolves 2 passed arguments as B64 and outputs a x86_64::Operation type.
		(mov rax WRITE)
		(mov rdi STDOUT_FILENO)
		(mov rsi msg)
		(mov rdx (len hello_world))
		(syscall)

		(mov rax EXIT)
		(mov rdi EXIT_SUCCESS)
		(syscall)
	))
)

```