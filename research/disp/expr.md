# Expressions in Disp
An expression is an inductive datatype defined roughly as follows:

```rust
enum Expr {
	Variable,
	Lambda { bind: Binding, expr: Expr },
	Application { func: Expr, func: Expr },
	Type { order: Nat },
	Pi { bind: Binding, bind_type: Expr, expr: Expr },
}
enum Binding {
	None,
	End,
	Branch(Binding, Binding),
}
```

See how the `Binding` structure works [here](./lambda-trees.md)

The schema consists of the structures of the untyped lambda calculus combined with two type constructors `Type` and `Pi`. These represent the [type of all types](https://ncatlab.org/nlab/show/type+of+types) with universe polymorphism and the [dependent product type](https://ncatlab.org/nlab/show/dependent+product+type). 