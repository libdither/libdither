# Universal System of Types

> a type system is a logical system comprising a set of rules that assigns a property called a type to every "term"

Who chooses the rules that assign types to terms? What makes one set of rules better than another? Some type systems are more general than others, some are more easily compiled into efficient bytecode, some allow for writing complex mathematical proofs. Exactly how large is this design space?

Disp captures the entire design space of possible type systems by generalizing the concept of types:

*To make a long story short, a type is simply a program that returns true, false, or loops forever when given the source code of another program.*

This allows the programmer to define their own type system in Disp. Or just use a pre-made one.

## The Implementation

In Disp, every program is a tree, and trees are data that other programs can inspect. So a type can literally be a function: give it a program, and it tells you whether that program belongs to the type. `Bool` is a function that accepts exactly two trees (true and false). `Nat` accepts the trees that represent counting numbers. Checking `x : Nat` means *running* `Nat` on `x` and seeing what comes back.

The tricky part is function types. To check that some `f` has type `Nat -> Nat`, you can't just run `f` on every number (there are a lot of them). Instead, the checker mints a *hypothetical* number: a sealed token that answers "I am a Nat" when asked its type, but reveals nothing else. It feeds this token to `f` and watches what happens. If `f` tries to peek inside the token, checking fails. If `f` produces something that checks as a `Nat` anyway, then `f` works for *any* number, because it never depended on which one it got.

Since types are just programs, things that would normally require new language features come for free:

 - A *dependent* type (a type that depends on a value) is just a function that returns a type.
 - A refinement like "even numbers only" is just a stricter checker.
 - A proposition is a type whose inhabitants are proofs, so the same machinery checks programs and theorems.

The standard library comes with all the familiar types (`Bool`, `Nat`, function types, pairs, equality, etc.), but none of them are built in. They are ordinary definitions, and you can read them, swap them out, or write your own.

The mechanics of how checking stays sound (what the sealed tokens are, and what programs are allowed to do with them) are sketched in [Implementation](implementation.md).
