# But What **IS** a Monad?

> This is an article that defines what a Monad while trying to stay as close as possible to its roots in Category Theory.

If you've ever heard of monads in the context of functional programming, you've likely also heard that they are just "Monoids in the Category of Endofunctors". But what does that even *mean*?

A Category, for the purposes of this article, is simply some defined set of mathematical objects (numbers, values, types, terms, or even categories themselves) as well as some set of "morphisms" defined between the objects. A category also has some conventions such as:
 - Every object has a morphism to itself (called the identity morphism)
 - Morphisms can be combined much like function composition.
 - Morphism composition is associative.

Functors in category theory are simply morphisms in a "category of categories". Where categories are objects and functors are just morphisms that map one category to another. This can be visualized at either a high level of abstraction where the functor is just one arrow from category A -> category B. Or at a lower level where a functor could be represented as many parellel arrows uniquely mapping every object and morphism in category A to an object or morphism in category B.

Endofunctors are just the special case where this "category of categories" just contains one object (a single category). And one morphism (the endofunctor) mapping every object and morphism in the category to another object / morphism in the category.

When working in a specific Category though, (i.e. a category of terms or types in a programming language) an Endofunctor can be defined as a typeclass on type functions. (for the rustaceans, think of it like a `trait` that you can implement for type constructors like `Option` or `Vec` not `Option<T>`, just `Option` by itself).

When defining what it means to be an Endofunctor formally within a given Category of objects (i.e. a Type System), it can be defined as a collection of two functions: a function that takes a type (A) and returns a type (`F<A>`) (i.e. the type constructor), and a function that is defined to take an arbitrary function from `A -> B` where `B` can be anything and returns a function `F<A>` -> `F<B>` (i.e. a morphism constructor). This definition allows one to abstract over a specific endofunctor definition and refer to all endofunctors as a collective. This endofunctor could be defined as follows (warning: pseudocode)

> Pseudocode Definitions (skip this if you think you can grok the psuedocode first try XD):
> ```rust
> //This binds some name to a value in some context. The value may be a type (like Vec(A)) or a value (like `3`)
> set <name> <value>
> ```
> ```rust
> // A name bound to a value may be given a valid type, or one will be inferred.
> // This will have an inferred type of `Nat` because 3 is most likely to be a natural number
> set three 3
> // The type of `four` is specified to be `Int` (i.e. an integer). This is valid because while 4 : Nat, Nat is a subset of Int.
> set four 4 : Int
> // This is a type declaration. `Likelyhood` is defined to be a set of two numbers of type `Nat` and `Float`. Optionally, two names have been assigned to these numbers: `count` and `probability`. Curly braces represents un-ordered sets of objects.
> set Likelyhood { count: Nat, probability: Float }
> // The above definition is semantically equivalent to this definition:
> set Likelyhood { probability: Float, count: Num }
> // But the above two expressions are semantically different from this: (Brackets represent an ordered set, i.e. a list)
> set Likelyhood [ count: Num, probability: Float ]
> 
> ```
> ```haskell
> # If you are used to haskell-based currying the first two definitions of `Complex` would be independently equivalent to the following two functions.
> Likelyhood_a : Num -> Float -> Type
> Likelyhood_b : Float -> Num -> Type
> # But the 3rd definition would only be equivalent to Likelyhood_a
> ```
> ```rust
> // type constructors can be defined like this
> set Vector3 { A : Type } { A, A, A } -> { A, A, A }
> // This definition has an implicit `[]` creating an ordering between `{A : Type} and `{A, A, A}`, in this case the ordering is required because {A, A, A} is dependent on {A : Type} being specified.
> 
> // Types can also be unnamed and referred to by a name in some context (i.e. like how functions in rust traits don't name the type of the function, just the name of the function implementation)
> type add_one : Num -> Num
> 
> // This is defining add_one in accordance with its previous defined type. It would be an error to define add_one twice with different implementations in the same context.
> set add_one { a } -> a + 1 
> ```

Okay now that we have pseudocode out of the way, we can get to defining an endofunctor :D

```rust
// An Endofunctor is a function that takes a value F of type `Type -> Type` (i.e. a type constructor) and returns a set containing one type and a bound value-name (i.e. map).
set Endofunctor { F : { A : Type } -> Type } -> {
	// Specifies the type of a function that is bound to the name `map`. Is a function that takes 1. an ordered set of arbitrary type B and morphism from A -> B and 2. some value of type F(A).
	// Returns F(B). Can be partially applied by passing either the ordered set or F(A) first. 
	// If passing the ordered set first, the function resolves to F(A) -> F(B).
	// If passing F(A), the function resolves to some kind of generic constant parameterized by a type and a function. [B : Type, m : A -> B] -> F(B).
	map : { [ B : Type, morphism : A -> B ], a : F(A) } -> F(B);
}
```

Examples of various type constructors and specifications (implementations) of the Endofunctor class.

```rust
// Maybe is a function of type `Type -> Type`
set Maybe { T : Type } -> Enum {
	Something [ t : T ],
	None,
}
// Defines the Endofunctor "function" for a specific type constructor.
set impl_maybe_endofunctor {
	set map { [ B, morphism ], a } -> match a {
		Something[a] => Something(morphism(a))
		None => None
	}
} : Endofunctor(Maybe)
```

```rust
// List is a List
set List { T : Type } -> Enum {
	Cons { list : List T, value : T }, // Recursion defined implicitly
	Nil,
}
// Specifies the Endofunctor for the List constructor.
set impl_list_endofunctor {
	set map { [ B, morphism ], a } -> (match a {
		Cons { list, value } => Cons(map{[B, morphism],list}, morphism(value)) // Recursion defined implicitly
		Nil => Nil
	})
} : Endofunctor(List)
```

```rust
// Generic Identity Function Constructor, we need this to define unit for the Monad.
set identity [T, v] v : [T : Type] [T] T
```

NOTICE: New Syntax / Convention, `identity` is the name assigned to the expression `[T, v] v`. But that expression has also been associated with a type.

The name of the type of identity is ^Identity. identity : ^Identity. The names themselves also get translated from snake_case (identity), to PascalCase (^Identity).

There is analogous syntax for finding a value defined for a given type. This may not always resolve because multiple values could be defined for a given type. 

Example: to refer to impl_maybe_endofunctor, you can instead do _ : Endofunctor(Maybe).

This also works when defining "implementations". You can use `_` to not define a name, and instead let type inference do its job.

```rust
set _ {
	set map { [ B, morphism ], a } -> Identity(morphism)
} : Endofunctor(Identity)

// The above is basically equivalent this in rust :)
impl Endofunctor for Identity {
	fn map<B>(morphism : impl Fn(A) -> B, a : Identity) -> identity(morphism(a))
}
```

OKAY, Now we define the Monad! According to category theory, a monad in a category defined as a monoid in the category of endofunctors of some other category.

But what exactly is a monoid? Wikipedia describes a monoid as a particular object `M` combined with two morphisms "multiplication" and "unit".

Lets define a Monoid first... We will define a monoid as a type constructor that takes any object constructs a set of two morphisms, unit and multiplication.

We also need to ensure that the two monoid laws of associativity and identity hold. i.e. (a * b) * c = a * (b * c), and a * identity = identity * a
```rust
set Monoid [ M : Type ] {
	unit : M,
	multiplication : [a : M, b : M] -> M
	associativity_proof : { a : M, b : M, c : M } multiplication[multiplication[a, b], c] = multiplication[a, multiplication[b, c]]
	identity_proof : { a : M } multiplication(a, unit) = multiplication(unit, a)
}
```

But what can we do with this monoid?
We can descibe types coupled with operations that resemble a monoid! (Assume `Nat` is the type of natural numbers)

```rust
set naturals_addition_monoid {
	set unit 0,
	set multiplication addition,
	set associativity_proof { a, b, c } <proof of associativity> // These are left out because writing proofs in type theory is complicated
	set identity_proof { a } <proof of identity>
} : Monoid(Nat)
```

Alright lets do another one! This time on a type we've actually seen before (I'll add type annotations for unit and multiplication so its more clear what is going on here)
```rust
set maybe_flat_map_monoid {
	set unit [A] -> Maybe::Something : { A : Type } -> Enum // This type is equivalent to `Maybe`
	set multiplication [a, b] -> match a {
		Something(a) => b(a),
		Nothing => Nothing
	} : ({ A : Type } -> Enum) ({ B : Type} -> Enum) -> Maybe // This is equivalent to `[Maybe Maybe] -> Maybe`
	set associativity_proof { a , b , c } <proof of associativity>
	set identity_proof { a } <proof of identity>
} : Monoid(Maybe) // This is a monoid defined for the *type constructor itself* `Maybe`, *not* impl<A> Monoid for Maybe<A>, impl Monoid for Maybe.
```

Oh wait, since `Maybe` is a endofunctor, isn't this just a Monad? (A monad is a monoid defined on an endofunctor after all) Lets try and pinpoint a more exact definition of a Monad :)

```rust
set Monad [ M : Type -> Type, M_is_functor : Endofunctor(A) ] {
	unit : M,
	multiplication : [a : M, b : M] -> M
	associativity_proof : { a : M, b : M, c : M } multiplication[multiplication[a, b], c] = multiplication[a, multiplication[b, c]]
	identity_proof : { a : M } multiplication(a, unit) = multiplication(unit, a)
}
```

If you followed all that, You should now have a good understanding of what a Monad is!
(Specifying it is essentially the same as a monoid above)