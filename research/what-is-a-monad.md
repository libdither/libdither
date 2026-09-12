# But What **IS** a Monad?

> This is an article that defines what a Monad while trying to stay as close as possible to its roots in Category Theory.

If you've ever heard of monads in the context of functional programming, you've likely also heard that they are just "Monoids in the Category of Endofunctors". But what does that even *mean*?

Well for one, this quote could use some more detail. The more descriptive quote is: "a monad in $\mathscr{X}$ is just a monoid in the category of endofunctors of $\mathscr{X}$, with product replaced by composition of endofunctors and unit set by the identity endofunctor."

Throughout this article, we will define "Category", "Endofunctor" and "Monoid" in a fictional programming language, and put these definitions together to define a Monad.

A Category (designated using curly letters, i.e. $\mathscr{C}$), for the purposes of this article, is simply some defined set of mathematical objects (numbers, values, types, terms, or even categories themselves) as well as some set of "morphisms" defined between the objects. A category also has some conventions such as:
 - Every object has a morphism to itself (called the identity morphism)
 - Morphisms can be combined together into other morphisms much like function composition.
 - Morphism composition is associative.

Functors in category theory are simply morphisms in a "category of categories". Where categories are objects and functors are just morphisms that map one category to another. This can be visualized at either a high level of abstraction where the functor $f$ is just one arrow between two categories ($f : \mathscr{A} \rightarrow \mathscr{B}$). Or at a lower level where a functor could be represented as many parellel arrows uniquely mapping every object and morphism in category $\mathscr{A}$ to an object or morphism in category $\mathscr{B}$.

Endofunctors are just the special case where the two categories $\mathscr{A}$ and $\mathscr{B}$ are the same category. Endofunctors are essentially just a mapping between each object and morphism in a category to another object/morphism *in the same category*.

Endofunctors come up often when working in a specific Categories. For example all the types in a programming language, form a category, where the morphisms are functions defined between them. This category is called `Type`, and can be thought of as the "type of types".

There are many programming languages that have endofunctors. `Option` in Rust, `Maybe` in Haskell, or really any kind of wrapper type in any language is technically an endofunctor. While most languages *have* endofunctors, most don't have a powerful enough type system to formalize the definition of endofunctors itself. (For rustaceans, think of it like a `trait` that you can implement for type constructors like `Option` or `Vec`, not `Option<T>`, just `Option` by itself. this is not yet possible in rust at the time this article was written).

When defining what it means to be an Endofunctor formally within a given Category of objects (i.e. a Type System), one needs a powerful *dependently-typed* lagnuage. For the purposes of this article, we will be using a fictitious dependently-typed language. The following is an outline of some of the general features of the language.

> Pseudocode Definitions (skip this if you think you can grok the psuedocode first try):
> ```rust
> //This binds some name to a value and an optional type in some context. The value may be a type (like Vec(A)) or a value (like `3`)
> let <name> [: <type>] := <value>
> ```
> ```rust
> // A name bound to a value may be given a valid type, or one will be inferred.
> // This will have an inferred type of `Nat` because 3 is most likely to be a natural number
> let three := 3
> // The type of `four` is specified to be `Int` (i.e. an integer). This is valid because while 4 is inferred to be Nat, Nat is a subset of Int (integers).
> let four : Int := 4
> // This is a type declaration. `Likelyhood` is defined to be a set of two numbers of type `Nat` and `Float`. Optionally, two names have been assigned to these numbers: `count` and `probability`. Curly braces represents un-ordered sets of objects. The inferred type here is the type of all types: `Type`.
> let Likelyhood := { count: Nat, probability: Float }
> // The above definition is semantically equivalent to this definition:
> let Likelyhood := { probability: Float, count: Num }
> // But the above two expressions are semantically different from this: (Brackets represent an ordered set, i.e. a list)
> let LikelyhoodOrdered := [ count: Num, probability: Float ]
> 
> ```
> ```haskell
> # If you are used to haskell-based currying the first two definitions of `Likelyhood` would be similar to providing two constructors for the same object like the following:
> Likelyhood_a : Num -> Float -> Likelyhood
> Likelyhood_b : Float -> Num -> Likelyhood
> # But the 3rd definition would only be equivalent to Likelyhood_a
> ```
> ```rust
> // type constructors can be defined like this, with an implicit `->` between `{A:Type}` and `{ x:A, ... }` for structure types.
> let Vector3 := { A : Type } { x : A, y : A, z : A } -> { x, y, z }
> // or like this using the `Struct` constructor.
> let Vector3 := { A : Type } -> Struct { x : A, y : A, z : A }
> 
> // type constructors may also be defined for enum types.
> let Option := { A : Type } -> Type;
> let Some : {A : Type} { a : A } -> Option(A);
> let None : {A : Type} -> Option(A);
> // or like this using the `Enum` constructor.
> let Option := { A : Type } -> Enum {
> 	Some { a : A },
> 	None,
> }
> 
> // Terms can also be named and typed, but left undefined (like how functions in rust traits don't need to be defined immediately)
> type add_one : Num -> Num
> 
> // This is defining add_one in accordance with its previous defined type. It would be an error to define add_one twice with different implementations in the same context, or for the definition to fail to typecheck with the defined type.
> let add_one { a } -> a + 1 
> ```

Okay now that we have pseudocode out of the way, we can get to defining an endofunctor :D

In this language, Endofunctors can be defined as a dependent collection of two functions: `obj_map: A -> F<A>` which maps the object of the category, and a function `func_map` that takes an arbitrary function `A -> B` where `B` can be anything and returns a function `F<A>` -> `F<B>`, mapping the morphisms from the initial object. When this definition is used as a "type class" (think `trait` or `interface`), it allows the user to abstract over a specific endofunctor definition and refer to all endofunctors as a collective.

```rust
// An Endofunctor is a class of type functions that takes a type constructor F of type `Type -> Type` (i.e. a type constructor / wrapper). Classes are essentially partially defined functions where the return value (implementation) is only valid if it has been implemented. 
let Endofunctor := { F : Type -> Type } -> {
	// Specifies how the endofunctor maps objects of the category `Type` to other objects in `Type` using the type constructor `F`
	type obj_map : { A: Type } -> { obj : A } -> F(A);
	// Specifies how the endofunctor maps functions between objects in the category `Type` to other functions in the "extended" F(Type) category.
	type func_map : { A : Type, B : Type} { func : A -> B } -> F(A) -> F(B);
}
```

Examples of various type constructors and specifications (implementations) of the Endofunctor class.

```rust
// Option is a generic enum, i.e. a function of type `Type -> Enum`
let Option := { T : Type } -> Enum {
	Some[T],
	None,
}
// Defines the Endofunctor "function" for a specific type constructor.
let impl_option_endofunctor : Endofunctor(Option) := {
	let obj_map := {A} Option{A}::Some
	// Returns Option{A} -> Option{B} from `func : A -> B`
	let func_map := {A, B} {func} -> (
		{ fa : F(A) } -> match fa {
			Some[t] => Some(func(t))
			None => None
		}
	)
}
```

```rust
// List is a generic List, i.e. a function from Type -> Enum.
let List { T : Type } -> Enum {
	Cons { list : List T, value : T }, // Recursion defined implicitly
	Nil,
}
// Defines a term of type Endofunctor(List).
let impl_list_endofunctor : Endofunctor(List) := {
	// Creates a constructor that takes a `value : T` by partially applying the List::Cons variant.
	let obj_map := {A} List{A}::Cons { list: List{A}::Nil }
	let func_map := {A, B} {func} -> ({fa : F(A)} -> match fa {
		Cons{list, value} => Cons(func_map{A,B}{func}{list}, func(value)) // func_map is recursively defined for list
		Nil => Nil
	})
}
```

```rust
// Generic Identity Function Constructor, we need this to define unit for the Monad.
let identity : [T : Type] [T] T := [T] [v] v
```

NOTICE: New Syntax / Convention, `identity` is the name assigned to the expression `[T] [v] v`. But that expression has also been associated with a type (`[T : Type] [T] T`). The type of `identity` is automatically assigned the name (translated from snake_case to PascalCase): `^Identity`.

There is analogous syntax for finding a value defined for a given type. This may not always resolve because multiple values could be defined for a given type. 

Example: to refer to impl_option_endofunctor, you can instead infer the definition via: `_ : Endofunctor(Option)`.

This also works when defining "implementations". You can use `_` to not define a name, and instead let type inference do its job.

```rust
let _ : Endofunctor(Identity) := {
	// object map returns the identity function on `A` (i.e. A -> A).
	let obj_map := {A} identity(A)
	// func_map returns the function as-is because identity does nothing.
	let func_map := {A, B} {func} -> func;
}

// The above is somewhat equivalent this in rust :)
impl Endofunctor for Identity {
	fn obj_map<A>() -> impl Fn(A) -> A { |a| a }
	fn map<A, B>(func : impl Fn(A) -> B) -> { func }
}
```

OKAY, Now we can get back to defining the Monad! According to category theory, a monad in a category is a monoid in the category of endofunctors of some other category. We know what endofunctors are, what what is a Monoid?

[Wikipedia](https://en.wikipedia.org/wiki/Monoid) describes a monoid (the algebraic version) as an set ($M$) equipped with a binary operation we will call "multiplication" ($*$) and particular member of the set $M$ called the "unit".

To translate this into a typed programming language, we will define a monoid as a type class (a.k.a. trait / interface) that can be implemented for objects. The definition of the type class is parameterized on the set $M$ and includes a set of two morphisms, unit and multiplication as well as the two monoid laws of associativity and identity: $\forall a,b,c : (a * b) * c = a * (b * c)$, and $\forall a : a * unit = unit * a$
```rust
let Monoid := [ M : Type ] {
	type unit : M,
	type multiplication : [a : M, b : M] -> M
	type associativity_proof : { a : M, b : M, c : M } multiplication[multiplication[a, b], c] = multiplication[a, multiplication[b, c]]
	type identity_proof : { a : M } multiplication(a, unit) = multiplication(unit, a)
}
```

Now that we have a monoid, we can talk about types that are monoids! (Assume `Nat` is the type of natural numbers)

```rust
// The natural numbers under addition form a monoid
let naturals_addition_monoid : Monoid(Nat) := {
	let unit := 0,
	let multiplication := add,
	// The actual type theory proofs will be left because I haven't figured out how they work yet lol.
	// addition is associative
	let associativity_proof := { a, b, c } <proof of associativity> 
	// 0 + anything = anything + 0
	let identity_proof := { a } <proof of identity>
}
```

Alright lets do another one! This time on a type we've actually seen before (I'll add type annotations for unit and multiplication so its more clear what is going on here)
```rust
// This is a generic monoid definition for all possible Option types. i.e. `impl<A> Monoid for Option<A>`.
let impl_option_monoid : {A : Type} Monoid(Option(A)) {
	// The `unit` must satisfy the identity law with respect to `multiplication`
	let unit : Option(A) := Option(A)::None
	// The combination is essentially `Option::or`, it combines two Options together and returns the first if it contains a value, or the second.
	let multiplication := [a, b] -> match a {
		Some(a) => Some(a),
		None => b
	} : [Option(A), Option(A)] -> Option(A)
	let associativity_proof := { a , b , c } <proof of associativity>
	let identity_proof := { a } <proof of identity>
}
```

Oh wait, since `Option` is a endofunctor, isn't this just a Monad? (A monad is a monoid defined on an endofunctor after all) Lets try and pinpoint a more exact definition of a Monad :)

```rust
let Monad [ M : Type -> Type, M_is_functor : Endofunctor(A) ] {
	unit : M,
	multiplication : [a : M, b : M] -> M
	associativity_proof : { a : M, b : M, c : M } multiplication[multiplication[a, b], c] = multiplication[a, multiplication[b, c]]
	identity_proof : { a : M } multiplication(a, unit) = multiplication(unit, a)
}
```

If you followed all that, You should now have a good understanding of what a Monad is!
(Specifying it is essentially the same as a monoid above)