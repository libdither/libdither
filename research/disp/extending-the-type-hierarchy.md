# Extending the Type Hierarchy

There is a thing in the calculus of construction, where terms are types and types are terms. This means you can express stuff like: `Pair Nat Nat = Nat x Nat` representing two natural numbers or `ConstList Nat 4` representing the type of lists of exactly 4 numbers. The type of these statements are themselves types and the so-called "type constructors" are functions.

#### Current Typing Rules:
Note: This section is constantly changing and may conflict with certain older sections.

 - The type of `x` (Variable)can be anything because `x` can be anything if by itself. If `x` is apart of a binding, all `x`s of that binding must be the same type.
 - The type of `[x] e` is `[X] E` where `x` must have the same type everywhere in `e` and the type of `e` is `E`.
	 - Example: `[x] y : [>.] ([_] Y) X`, x appears once in `E`, thus has the same type everywhere in `E`. 
	 - Another typing could be `[x] y : [_] Y` or simply `[x] y : T`
 - The type of `(x y)` is `(X Y)` where `X` is the type of `x` and `Y` is the type of `y`. Any beta-reductions that take place must preserve all other typing rules. Otherwise the type is not well-formed.



### Example: Booleans

The type of booleans `A -> A -> A` in inhabited by `[x y] x`, and `[x y] y`

This can be represnted in disp syntax by:
`set true [x y] x : {_:A} {_:A} A`
`set false [x y] y : {_:A} {_:A} A`

But what is the type of `{_:A} {_:A} A` ? What even is `A`?
Typically type theories solve this by specifying `A` as some member of the universe of types `T(0)` so-called a "sort". i.e. `set true [x y] x : {A: T} {_:A} {_:A} A`,  without it, A is unbound, unknown, when parsed into a expression tree, it would be replaced with a meaningless variable. But if we solve this problem using `Π`, `[x y] x` is no longer a valid member of the type. `Bool` would not be a type by itself, but instead a type constructor, of which many possibilities are valid.

`set true [t] [x y] x : {A : T(0)} {_:A} {_:A} A`
`set false [t] [x y] y : {A : T(0)} {_:A} {_:A} A`

And if we want universe polymorphism, we need *even more* type arguments to just make a boolean!

Lets say we don't want that. What else can we do?

`set true [x y] x : {A} {A} A` , the type of this expression represents a kind of function, saying the output type of an expression must be the same type as the two input types. Here [[lambda-trees]] give us a little help to allow for multiple `Π`-expressions to point to the same variable. What is the type of `{A} {A} A` you might ask? The expression `{A} {A} A`  describes booleans pretty well, but this post is called "Extending the Type Hierachy", so lets give things more types. But first, I'd like to mention that those Pi types are looking a lot like lambdas... so lets see what happens if we switch `{A}` for `[A]`

So we want to give `[A] [A] A` a type. How would we do this in a typical type theory? Well first of all, A would be parameterized by some type universe `T(k)` . And then the whole thing would be of the type `T(k+1)` at the minimum. i.e. `{A : T(0)} {A} {A} A : T(1)`. How about in our type system where `Π` is now `λ`?  Well, the type of a lambda is a lambda, so it has to be something in the form of `[?] [?] ?`.  We can set the type of `A` to be some arbitrary variable `T` (`[?] [?] T`). And we know that this is a function that describes the constraints of the term, in this case, that the types of the inputs must be the same as the type of the output. Thus the type of `[A] [A] A` is `[T] [T] T`, or in otherwords, itself.

This means we can take our bool type (`[A] [A] A`) and assign expressions like this:

`set true  [x] [y] x : [T] [T] T : [T] [T] T`
`set false [x] [y] y : [T] [T] T : [T] [T] T`

Lets try stuff to apply this.

`((true false) true)` should resolve to `false`, does this typecheck?

```
set id [x] x : [x] x // This should be easily derivable
set Bool [T T] T : Bool // Bool is its own type (little weird i know)
set true [x y] x : Bool
set false [x y] y : Bool
(true false) : (Bool Bool) : (Bool Bool)

( ([x y] x) ([x y] y) ) -> ( [y1] [x y] y )
// `[.]` represents an binding that binds a subexpression. This is a unique modification of the lambda calculus, It will only reduce if the argument it is passed reduces to an exact match of the bound subexpression
( ([T T] T) ([T T] T) ) -> ( [.] [T T] T )

// This represents the state of being of true applied to false. Now watch it be applied to another value
([_] [x y] y) : ( [.] [T T] T ) : ( [.] [T T] T )

// ((true false) true) : Bool
([_] [x y] y) ([x y] x) -> [x y] y
([.] [T T] T) ([T T] T) -> [T T] T

// This typechecks!
[x y] y : [T T] T
```

Things to take away are that definitional equality checking is built-in to the system as a biproduct of arbitrary expression binding. A boolean term applied to two different items won't typecheck because `Bool` applied to two different types only resolves if those types are exactly the same.

```
// ((true false) id) : ???
([_] [x y] y) ([x] x) -> [x y] y
([.] [T T] T) ([T] T) -> ([.] [T T] T) ([T] T)

// This does not typecheck, the type of this expression does not reduce because ([T] [T] T) is not equivalent to ([T] T)
[x y] y : ([.] [T T] T) ([T] T)
```

A neet thing to note here is that `Bool` is just the type of binary expressions. Functions that take two of some type and return another of term of the same type.
Thus:
`set BinaryExpr [x x] x`

### Example: Pairs (Products)

Pairs are typically defined through a function like this: `[x y f] f x y`. Where you apply two elements to "pair them" and then can use a function like `[x y] x` or `[x y] y` to extract one or the other from the pair.

The pair function generates a type like: `[F] f x y` where f is a function that takes in two different arguments. In conventional calculus of constructions, this is represented like:
`{ f: {X} {Y} Z } Z`
This can be represented in the simpler form: `[F] F X Y`. The type of functions that take a function and return that function applied to two other types.

The type of the pair function is:
`set pair [x y f] f x y : [X Y F] F X Y`
`assert pair : pair`

Do the pairs from the pair function typecheck?
`pair a b` -> `([x y f] f x y) a b` -> `[f] f a b`
`pair A B` -> `([X Y F] F X Y) A B` -> `[F] F A B`

`[f] f a b : [F] A B`

Now to define the type of pair projection functions.
`set projection [A] [B] C A B : [A] [B] C A B`

Does this typecheck?
`set first [x y] x : projection`
C is unbounded and thus can be anything. Including a function that resolves to A (i.e. `[A B] A`). Therefore it typechecks.

Same reasoning works for `set second [x y] y`

### Example: Tagged Unions (Coproducts)
A coproduct is just a tag with a finite set of states, paired with 

WIP

### Example: Nats

The type of nats is describes many terms. Typically these terms are formed through two functions: `succ` and `zero`.

```
zero : Nat
succ: Nat -> Nat
```

`set zero [x y] y : Nat`
`set succ [n] [f x] f (n f x): [.] Nat` (This type describes a function where the input must be the same type as the output, which in this case is `Nat`)

There are many different representations of natural numbers in the lambda calculus.

The church encoding encodes it like this: `{ A: T } { _: {A} A }`
Nat is traditionally defined as `{ A: T } {_ : {A} A } ({A} A)`. This can be read as "the type of all functions that take unary function and return a unary function".

The type of unary functions in our type system is: `[A] A`. We can extend this to represent a function that takes and returns this using a lambda binding `[.]`.
`set Nat [.] ([A] A)`

What is the type of `Nat`?
`[A] A`'s type is itself and the type of a subexpression binding is itself a subexpression binding. Thus `[.] [A] A : [.] [A] A`

Does this typecheck?
`zero` -> `[x] [y] y : Nat` -> `[.] ([A] A)`
Since anything can be passed as `x`, including a unary operation, the first `[.]` is satisfied. Whats left is `[y] y : [A] A` which is trivially deduced.

Does this typecheck?
`succ -> [n f x] f (n f x) : [.] Nat -> [.] [.] ([A] A)`

The input `[n]` must be of type `[.] ([A] A)`,  and `[f]` must be of type `[A] A`, based on the two lambda bindings. These two arguments can be effectively anything, so this typechecks.

Does this typecheck?
`succ zero`
`([n f x] f (n f x)) ([x] [y] y)` -> `[f x] f x`

`([.] Nat) Nat` -> `Nat`

is `[f x] f x : Nat`?
is `[f] ([x] (f x)) : [.] ([A] A)`?
Assume `f: [A] A`
is `[x] (f x) : [A] A`?
Assume `x : A`
if `f : ([A] A)` and  `x: A` then `(f x) : A` thus `[x] f x : [A] A`

`[f x] f x ` is of type ` [.] [A] A` Qed

Lets try an alternative encoding like the Scott encoding
`set zero [z s] z`
`set succ [n z s] s n`

`zero : [.] ([A] A)`
`[z s] z : [.] ([A] A)`
Anything can be passed in as `z`, including `z : ([A] A)`
`[s] [x] x : [A] A` (Doesn't typecheck) Why?

##### Example: Nat operations

How might we define operations on Nat?

Traditionally, we might define `add` as
`[x y] [z] x (y z) : { x: Nat, y: Nat } Nat`
Add has the structure that it has two inputs and one output. These inputs and outputs are the same type: Nat
Thus: `[x y] [z] x (y z) : [-.] [.] Nat`
Note: The `[-.]` notation represents a subexpression binding that binds the child lambda's subexpression

This `[-.] [.] Nat` can itself be further typed as `[x x] x`, representing a function that has the same output as its two inputs.

`set add [x y] [z] x (y z) : [-.] [.] Nat : BinaryExpr`
This can be read as: "add is some binary expression that works on Natural numbers"

### Example: Lists
Lists are conventionally defined through the `cons(x xs)` and `nil` constructors.
```
set List<T> {
	cons: T -> Self -> Self
	nil : Self
}
set List<T> (A -> List -> List) -> List -> List
```

Lets use a System F typable implementation of `List`
`set nil false`
`set cons [h t c n] c h (t c n)`
A simple list of bools i.e. `[true, false, true]` might look like: `cons true (cons false (cons false nil))`

We can see that the definitions for `pair` and `false`  typecheck to the types of `cons` and `set cons [h t c n] c h (t c n) : Bool -> List -> List`
`set nil [x y] y : List`

Assume `List = List<Bool>`
`[c n] n : (Bool -> List -> List) -> List -> List`
x can `(Bool -> List -> List)`, y can be `List`,  `[c n] n` always returns `y`. Thus `[c n] n` always returns `List`.

`([h t c n] c h (t c n)) true nil` -> `[c n] c true (nil c n)` 
`[c n] c true (nil c n) : (Bool -> List -> List) -> List -> List`
`[c]` expects a term of type `(Bool -> List -> List)` and `[n]` expects a term of type `List`. 
`c true (nil c n) : List` -> `c true n : List`

This typechecks.

### Example: Proofs

Typically proofs are writing in dependently type languages using the `Pi` type constructor as a logical `forall`. i.e. to say that addition is commutative, one might type:
`{x: Nat, y: Nat} Eq (add x y) (add y x)`.

There are a few things we need to define to use proofs, but the 3 most important are: Implication, Conjunction, and Equality

#### Implication
Implication is typically represented as a function type. This makes sense because if you want to say "if x is true then y is true" where x and y are propositions (i.e. types), you need to produce a value of y for all values of x. This is exactly what a function does.

This type represents a function from `x -> y`.
When applied to a type, it checks if it is equal to `x`, if so, it resolves to y.
`set Function [>.] ([_] y) x` (Note: the subexpression binding on `x` prevents this expression from immediately reducing `([_] y) x` -> `y`)

The implication operator can be created by binding `x` and `y`
`set -> [x] [y] [>.] ([_] y) x`
`(-> Nat Bool)` -> `([>.] ([_] Bool) Nat)`

What is the type of `(-> Nat Bool)` though? In other type theories, you have the "type of all types" i.e. `Type`, but there is no such thing in this type theory...

And here is where we must formalize the semantics of substitution. What is the difference between an expression like `[x] x` and `[.] x`? They are both represented as the same expression tree: `Lam(End, Var)`, however the first one implies that the expression doesn't have any *external binders* i.e. that `[x]` is the only lambda that binds `x` while the second one hints that `x` might be replaced with some other expression, thus turning `[.] x` into a *subexpression binder*. What are the rules of a subexpression binder anyway? Well you may have guessed that a lambda becomes a subexpression binding (SB) when it stops binding a variable and starts binding some other expression variant (either a lambda or an application). The SB only resolves when it is applied to something that reduces to match is its subexpression. There are some other nuances when it comes to reductions when it comes to SBs.

 - `[>.] ([_] y) x` cannot reduce if the binding will be destroyed (i.e. in this case)
	 - In comparison to: `[>.] ([x] y x) w` -> `[>.] (y w)`
 - `([.] ([x] (x z)) y) (a b)`  normalizing this expression first normalizes `[x] (x z) y`, bound subexpressions must be fully normalized before the lambdas that bind them are applied. (The whole expression would reduce to `(Var Var)`)

These rules make it possible for expressions like `[>.] ([_] y) x` to be a normal form, and thus to be able to represent the type of functions.

But what is the "type of types"? What is `Type -> Type`? Well, you've already seen it: `[>.] ([_] y) x` In this type theory variables can be anything, and thus when interpreted without context, are representative of *everything*.

And with that we get the type of all functions.
`set Function [>.] ([_] y) x : [>.] ([_] T) T
`set -> [x] [y] ([>.] ([_] y) x) : [x] [y] ([>.] ([_] y) x)`

Lets do some testing with our new `Function` construction.

`and` is of the type `Bool -> Bool -> Bool`. `Bool` we have chosen to represent as a `BinaryExpr`. i.e. `[T T] T`. So we should be able to define `and` and assign it a valid type using our `Function` construct.

`set and [x] [y] x y false : -> (-> Bool Bool) Bool`
`= [x] [y] x y ([a b] b) : [>.] ([_] ([>.] ([_] ([T T] T)) ([T T] T))) ([T T] T)`
`and true true : ([>.] ([_] ([>.] ([_] Bool) Bool)) Bool) Bool Bool`
`and true true : Bool`
`true : Bool`

That seemed somewhat straitforward (lots of notation...) Or was it?

Aren't function types a specialization of dependent types? How do we represent the coolest feature in type theory? (and by cool I mean its so cool that it stands by itself in many type theories as the only type constructor)

Dependent function types are type constructors that allow types to depend upon the terms of another type. i.e. `[a] b : { a : A } (B a)`

What does this mean? What is `B` here?
Well conventionally: `B : A -> Type` B is a function that takes an `a : A` and reduces to some `B : Type`
But the definition of `B` itself is kinda weird... Lets look at an example of an untyped dependent function in the lambda calculus.

This represents a constructor for some function from `T -> Type`
`set TypeFunction [T] [>.] ([_] T) x`
`TypeFunction Bool : Function`

Lets test this depend type out with a common application: A finite-length list.

`finlist : pair Nat List`

`vec : -> Type (TypeFunction Nat)` (A function that takes an element and length and creates a list of )

`set vec [n d] n (pair d)`

WIP

#### Conjunction
Conjuction with propositions is typically represented with some kind of weird expression:
`{ C: T(0) } { {A} {B} C } C` where if both A and B are inhabited and imply all propositions, that would imply false. (`{A} {A} C` would resolve as false) `{ false } -> false` is true, therefore if A and B are true than A /\ B is true. Kinda weird ngl.

But I've heard that conjunction is very similar to `pair`... So lets look at that for a bit:
`set pair [x y f] f x y : [X Y F] F X Y`
`assert pair : pair`

`a : A, b : B`
`pair a b : pair A B`
`pair a b` can be created so long as `a` and `b` exist and thus prooves `pair A B`. Qed.

Well that was easier than expected...

#### Equality
We have one last thing we need to define here: Equality.

There are a few notions of equality:

- Definitional equality - are the terms defined the same? i.e. 0 = zero, two names for the same thing.
- Computational equality - do the terms resolve to the same thing? i.e. 2 + 2 = 4. Both 2 + 2 and 4 resolve to the same definitionally equal expression. In a type system with strong normalization, computational equality is typically treated as definitional equality since computations can be done automatically during type checking.
- Propositional equality - can the terms of some type be translated into each other such that a translation too and from a given term preserve definitional equality? In the category theory sense, we are asking whether or not there is an arrow going both ways between two terms of some type. This is also known as an "isomorphism".
  - Typically this is represented through some "Identity type"
    - i.e. `proof_a_equals_b : Id_A (a b) where a : A, b : A`

Lets start with Definitional equality — if you were paying attention to the [boolean section](#example-booleans) this can be easily formed using the `BinaryExpr` type.
The `[T T] T` type (or type function). Takes two types and resolves to the first one so long as the second one is definitionally equal to the first. This is a consequence of the double binding on `T`. Both function inputs bind `T` and thus the first one substitutes `T` and the second one acts as a subexpression binding that can only be applied to expressions that match whatever was previously substituted for `T`.

`([T T] T) a b` -> `([.] a) b` (`a` != `b`)
`([T T] T) a a` -> `([.] a) a` -> `a` (`a` = `a`)

Therefore: `set DefEq [T T] T`

We get computational equality just by making sure we fully normalize each term before applying it.

But what about propositional equality? A proof of propositional equality can be represented as a pair of functions mapping within some type.
`pair f g : pair (-> A A) (-> A A)` for all `a : A` and `b : A`

- `DefEq (g (f a)) a` and
- `DefEq (f (g b)) b`

`set Epair (pair a b) (pair f g) : ()`

Lets try and represent this.
`set Eq [a] [b] and (DefEq g (f a)) (DefEq f (g b))`

WIP