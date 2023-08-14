# Bootstrapping Plans

Problem: Design of Disp seems to require Disp to already be made to express the kinds of structures I want. Rust is not powerful enough.

Specificially: The self-defining nature of disp. One of the goals along this line is to be able to define fundamental data structures (`Nat`, `String`, `i64`, `f64`) and collection types (`Set`, `Enum`, `List`) within the language itself, including how literals and syntactical conventions are parsed.

Idea: Create a base language that can modify its own parsing. Run the language in the emulator and you've got a new language!

 - Problems
   - Need to define what parsing means in the context of the language

```rust

/// Describes what an object P needs to parse a type T. 
String -> Maybe[(Object, String)]

type Parser {Input : Type, Output : Type} {P:Type} -> {
	type parse : Input -> Option[(Output, Input)];
}

/// Parser is equivalent to StateT with Maybe
type _ : {I, O} -> Parser[I, O] = StateT[I, Maybe, O]

type String := List[Character]

```

