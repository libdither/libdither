# Functions

The end goal of a compilation process is to generate data that can be interpreted by a cpu or another program. This might be machine code, or another language, or bytecode to be run in a virtual machine. 

These end-goal targets are presumed to be turing-complete with useful absractions for common programming.

Functions continually abstract up to the highest level, but at the lowest level, they just wrap their underlying operations in a functional programming design.

## Example of Abstraction
Imagine the simplest program: "Hello World" written for Linux.

In a high level language, this might be just one line of code. However, if you descend down the layers of abstraction a simple hello world program is not so simple at all.

Assuming a significantly low-level target platform (i.e. machinecode), this hello world program requires knowledge of cpu operations to move the data around as well as knowledge of the specific kernel calls necessary to write to the necessary user-facing output (unix standard output in this case).

On a different kernel or cpu, the essence of what is happening is the same, but the instructions are different. This is where disp comes into play.