# Funclets

Funclets are types in disp that together form a functional abstraction over the stateful nature of CPU instructions. They are the basic building blocks of every `Function` in disp and can be easily combined, customized, and compiled to specific target platforms.

Each funclet is a unique identifier that links to code that can turn it into cpu-specific procedures via [reverse hash lookup](../../dither/data/reverse-hash-lookup.md).

## An example

One example of a funclet would be the `add` operation. This is a function that takes two numbers and returns their sum. On modern cpus there are typically different add instructions for differently sized integers. In addition, there is a lot of extraneous behavior that happens on some cpus i.e. setting arithmatic flags such as "carry", "overflow", "parity" and "is zero".

The way disp goes about dealing with all this complexity is finding the simplest possible definition of `add` and adding functionality through variations of the `Funclet` and other funclets composed together.

`add` is a Funclet. It takes 2 binary numbers and outputs another binary number.

`add<N: DispNumber>(location: N, location: N) -> N, carry`

### Variations

Variations of this funclet are conceptually endless, but commonly used variations might be:
 - `add(u8, u8) -> u8` - unsigned addition
 - `add(i16, i16) -> i16` - signed addition
 - `add(u1024, u1024) -> u1024` - large additions ([ADC](https://www.felixcloutier.com/x86/adc) on x86_64)
 - You can also add sign-extended integers...
 - `add(u32, u32) -> u64`
 - `add(i32, i32) -> i64`
 - Carry bit can be extracted as shared Funclet value
 - `add(u8, u8) -> u8, carry`
 - And then used in other instructions like `run(func, if_carry(carry))` - compiles to x86's `jc` instruction

### Extensions

Extensions of a funclet are used to "rope in" side effects unconnected to the operation the cpu might have performed in the background when doing the operation. For example, on x86 cpus, the `add` instruction sets the overflow, sign, zero, adjust and parity flags in addition to the `carry` flag). These flags can be accessed through extensions.

The `Parity` extension is a `Funclet` that takes a `location` and returns a `parity`.
To extend the `add` funclet, the parity funclet checks if the `location` input to the parity was the result of an add instruction. If it is, it doesn't need to do anything because the cpu sets the parity flag automatically. If the input location is not an instruction that sets the parity bit, parity is calculated via cpu-specific instructions.

There is only one variation of parity:
 - `parity(location) -> location, parity`
