# Universal System of Types

> a type system is a logical system comprising a set of rules that assigns a property called a type to every "term"

Who choses the rules that assign types to terms? What makes one set of rules better than another? Some type systems are more general than others, some are more easily compiled into efficient bytecode, some allow for writing complex mathematical proofs. Exactly how large is this design space?

Disp captures the entire design space of possible type systems by generalizing the concept of types:

*To make a long story short, a type is simply a program that returns true, false, or loops forever when given the source code of another program.*

This allows the programmer to define their own type system in Disp. Or just use a pre-made one.

## The Implementation

In disp, every term is stored in a [context](names.md) as a judgement that contains a term and a type:

```rust
struct Judgement {
	term: Expr,
	ty: Expr,
}
```
To verify if a judgement is valid and may be stored in a context, the compiler encodes the term using simple church-encoded data structures (like tuples and sums). The encoded form is then applied to the `ty` expression and beta-reduced. The judgement is considered valid if the expression reduces to `Expr::Var`.
