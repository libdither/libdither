# Functions

The end goal of a compilation process is to generate data that can be interpreted by a cpu or an interpreter. This is typically called "bytecode" or "intermediate language". 

Everything in disp is represented by lambda calculus. The compilation process is simply figuring out how to map lambda function hashes to pieces of output data.

Say there is a lambda expression that when applied to two 8-long pair of type either true or false, it reduces to a single 8-long pair. This would represent an 8-bit "add" operation when this lambda expression is encountered in compilation, it will be marked as having a valid "target representation".

As long as the whole of the lambda program can be marked with analagous operations in the target language, post processing will be done to connect all the operations with necessary glue code (like designating registers and memory allocation).











## Example of Abstraction
Imagine the simplest program: "Hello World" written for Linux.

In a high level language, this might be just one line of code. However, if you descend down the layers of abstraction a simple hello world program is not so simple at all.

Assuming a significantly low-level target platform (i.e. machinecode), this hello world program requires knowledge of cpu operations to move the data around as well as knowledge of the specific kernel calls necessary to write to the necessary user-facing output (unix standard output in this case).

On a different kernel or cpu, the essence of what is happening is the same, but the instructions are different. This is where disp comes into play.