# Hardware Modeling for Intel x86

See: [Provable Hardware Modeling ](../../provable-hardware-modeling.md)

#### A Makeshift Model
Since the circuit diagrams and specifications of x86_64 processors are not easily accessible, we must make do with an observation-based model (as most compilers do).

Instructions on modern CPUs can be run in many ways in many different orders. Some can be run in parallel and some cant. The detailed list of all the instructions, the number of cycles they need, and how many of each could be run in parallel are given here: https://www.agner.org/optimize/instruction_tables.pdf.
 - For example for the AMD K7 chip, 3 MOV instructions between registers can be run at the same time and for 1 clock cycle, but only two MOV instructions between registers and RAM can be run simultaneously, and it takes more than one clock cycle as well as incurring the risk of cache miss.

This makeshift model would take as input a compiled program's machine code and parse it to guess how long it would take to run.

Example:
```asm
mov r1, 13
mov r2, 14
add r1, 1
add r2, 1
```
This code would receive a score of 2 cycles. The model would find that the two `mov` and the two `add` operations can be run in parallel and evaluate this output as being able to run within two cycles.

In reality, a full model would not just account for instruction speed but other factors such as:
 - Cache size, utilization & memory layout of the program.
 - 