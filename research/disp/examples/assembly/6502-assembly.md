# [[Disp]] compiling to 6402 Bytecode

6402 assembly has a relatively small number of instructions so it is a good starting point when looking at how compiling works in Disp.

# Instruction Abstraction

To work in disp, first every 6502 instruction must be abstracted out to either a pure function or a monadic function.

Pure functions are easy to derive.
Take for example the `INX` (Increment X) instruction for the 6502.

The `INX` instruction simply increments the X register.
In Disp, this is represented as a pure function that inputs and outputs 3 types: `RegisterX`, `FlagZero` and `FlagNegative`. This represents the 6502's INX instruction writing to those 3 locations.

`INX = (Register::X) -> (Register::X Flag::(Zero Negative))`

It can be furthur abstracted to be a general "Increment Register" function which works for registers A, X & Y:
 - `INCR = Register -> (Register Flag::(Zero Negative))`

For instructions with operands abstraction is much more complicated.
The `ADC` instruction has 8 variants, some of which are pure and some of which access memory in a non-deterministic way (and are not pure).

The 2 of the 8 variants of `ADC` are represented as follows:
 - `immediate: ADC #oper`
   - `ADC = (RegisterA Immediate) -> (RegisterA Flag::(Negative Zero Carry Overflow))`
 - `absolute: ADC oper`
   - `ADC = (RegisterA, Memory, Flag::(Negative Zero Carry Overflow)) -> (RegisterA, Memory, Flag::(Negative Zero Carry Overflow))`

For `LDA`
 - `immediate: LDA #oper`
   - `LDA = (RegisterA, Immediate) -> (RegisterA Flag::(Negative Zero))`
 - `absolute: LDA #oper`
   - `LDA = (RegisterA, Memory) -> (RegisterA Flag::(Negative Zero))`

For `TAX`
 - `implied: TAX`
   - `TAX = (RegisterA RegisterT) -> (RegisterT)`

Low-level 6502 assembly in disp might look like:
```
use 6502;
code compile 6502 (
	set (registers flags memory) 6502::CPU
	set A registers.a
	set A 6502::LDA(5)
	
	// load 5 into A and add 5 using a pipeline
	set A (> A 6502::LDA(5).0 6502::ADC(5).0)
	set X registers.x
	set X TAX(A)

	set load_5_a 6502::LDA(5).0
	set add_5_a 6502::ADC(5).0

	// general "set" function
	set set_a func (a:RegisterA RegisterA
		(> a )
	)
	// does same thing
	set A (set_a A)

)
```
