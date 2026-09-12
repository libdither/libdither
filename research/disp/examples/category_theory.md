```rust
/// Endofunctor is a function from `Type -> Type` and a mapping operation for morphisms.
set Endofunctor { F : { A : Type } -> Type } -> {
	/// map is a mapping operation for outgoing morphisms on `A : Type`.
	map : { [ B : Type, morphism : A -> B ], a : F(A) } -> F(B)
}
```

```rust
/// Magma is a type with a "unit" element and a binary operation
set Magma [ M : Type ] -> {
	unit: M,
	mult: [a : M, b : M] -> M
}

/// Associativity is a property of a type and a binary operation
set Associativity [ M : Type, bin_op: [M, M] -> M ] -> { {a, b, c} : M^3 } Equivalence(bin_op(bin_op(a, b), c), bin_op(a, bin_op(b, c)))

/// Identity is a property of a type, element `elem` of the type, and a binary operation `bin_op` over the type proving that there is some element of the type such that `bin_op(m, elem) = m` and `bin_op(elem, m) = m`
set Identity [ M : Type, { elem: M, bin_op: [M, M] -> M } ] -> { m : M } {
	Equivalence(bin_op(m, elem), m),
	Equivalence(bin_op(elem, m), m)
}

/// Inverse is a property of a type, element `elem` of the type, and a binary operation over the type proving that for all elements `a` of the type there is a corresponding element `inverse_a` such that `bin_op(a, inverse_a) = elem` and `bin_op(inverse_a, a) = elem`
set Inverse [ M : Type, elem: M, bin_op: [M, M] -> M ] -> { m : M } [
	inverse_a : M,
	{
		Equivalence(bin_op(a, inverse_a), elem),
		Equivalence(bin_op(inverse_a, a), elem)
	}
]

/// A Semigroup is a magma with associativity
set Semigroup [ M : Type ] -> [
	magma: Magma[M],
	Associativity[M, magma.mult]
]

/// A Monoid is a magma with associativity and identity
set Monoid [ M : Type ] -> [
	magma: Magma[M],
	{
		Associativity[M, magma.mult],
		Identity[M, magma],
	}
]

/// A group is a magma with associativity, identity, and inversability
set Group [ M : Type ] -> [
	magma: Magma[M],
	{
		Associativity[M, magma.mult],
		Identity[M, magma],
		Inversability[M, magma]
	}
]
```

```rust
/// Full definition of a monoid
set Monoid [ M : Type ] -> [
	{
		unit : M,
		multiplication : [a : M, b : M] -> M
	},
	{
		associativity : { a : M, b : M, c : M } -> Equivalence(multiplication[multiplication[a, b], c], multiplication[a, multiplication[b, c]])
		identity : { a : M } -> Equivalence(multiplication(a, unit), multiplication(unit, a))
	}
]
```

```rust
/// A Monad is just an Endofunctor and a Monoid
set Monad [ M : Type -> Type ] -> {
	Endofunctor(M)
	Monoid(M)
}
```