# Fundamental Constructs

## Expressions

Expressions in Disp are programs and match the untyped lambda calculus. They are represented as follows:

```rust
enum Expr {
	Var,
	Lam { bind: Binding, expr: Expr },
	App { func: Expr, func: Expr },
}
enum Binding {
	None,
	End,
	Branch(Binding, Binding),
}
```

See how the `Binding` structure works [here](./bind-trees.md).

## Judgements

```rust
struct Judgement {
	term: Expr,
	ty: Expr,
}
```

Judgements are considered valid if when the structure of `term` is encoded into the lambda calculus, and `Expr::App(ty, encoding)` beta-reduces to `Expr::Var`.

## Contexts

```rust
struct Context {
	names: Map<String, Judgement>
}
```
