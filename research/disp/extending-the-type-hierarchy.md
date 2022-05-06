# Extending the Type Hierarchy

There is a thing in the calculus of construction, where terms are types and types are terms. This means you can express stuff like: `Pair Nat Nat = Nat x Nat` representing two natural numbers or `ConstList Nat 4` representing the type of lists of exactly 4 numbers. The type of these statements are themselves types and the so-called "type constructors" are functions.

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

`set true [x y] x : {A} {A} A` , the type of this expression represents a kind of function, saying the output of the expression must be the same as the input. Here [[lambda-trees]] give us a little help to allow for multiple `Π`-expressions to point to the same variable. What is the type of `{A} {A} A` you might ask? Well, I would ask you, why does it need one? The expression `{A} {A} A` perfectly describes what guarantees Church's boolean encodings hold that I would say this expression. But this post is called "Extending the Type Hierachy", so lets give things more types. But first, I'd like to mention that those Pi types are looking kinda lambda-y... so lets see what happens if we just switch `{A}` for `[A]`

So we want to give `[A] [A] A` a type. How would we do this in a typical type theory? Well first of all, A would be parameterized by some type universe `T(k)` . And then the whole thing would be of the type `T(k+1)` at the minimum. i.e. `{A : T(0)} {A} {A} A : T(1)`. How about in our type system where `Π` is now `λ`?  Well, the type of a lambda is a lambda, so it has to be something in the form of `[?] [?] ?`.  We can set the type of `A` to be some arbitrary variable `T` (`[?] [?] T`). And we know that this is a function that describes the limits of the term, in this case, that the inputs must be the same as the outputs. Thus the type of `[A] [A] A` is `[T] [T] T`, or in otherwords, itself.


This means we can take our bool type (`[A] [A] A`) and assign expressions like this:

`set true [x] [y] x : [T] [T] T : [T] [T] T
`set false [x] [y] y : [T] [T] T : [T] [T] T

Lets try stuff with application.

`((true false) true)` should resolve to `false`, does this typecheck?

```
set id [x] x : [x] x
set Bool [T T] T : Bool
set true [x y] x : Bool
set false [x y] y : Bool
(true false) : (Bool Bool) : (Bool Bool)
// `[_]` represents a lambda that does not bind anything
( ([x y] x) ([x y] y) ) -> ( [_] [x y] y )
// `[.]` represents an expression that binds a lambda. It will only reduce if the argument it is passed reduces to an exact match of the bound lambda
( ([T T] T) ([T T] T) ) -> ( [.] [T T] T )

// This represents the state of being of true applied to false. Now watch it be applied to another value
([_] [x y] y) : ( [.] [T T] T ) : ( [.] [T T] T )

// ((true false) true) : Bool
([_] [x y] y) ([x y] x) -> [x y] y
([.] [T T] T) ([T T] T) -> [T T] T

// This typechecks!
[x y] y : [T T] T
```
Things to take away are that definitional equality checking is built-in to the system. A boolean term applied to two different items won't typecheck because `Bool` applied to two different forms. 
```
// ((true false) id) : ???
([_] [x y] y) ([x] x) -> [x y] y
([.] [T T] T) ([T] T) -> ([.] [T T] T) ([T] T)

// This does not typecheck
[x y] y : ([.] [T T] T) ([T] T)
```

### Example: Pairs
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

### Example: Nats
The type of nats is describes many terms. Typically these terms are formed through two functions: `succ` and `zero`.

`set zero [x y] y : Nat`
`set succ [n f x] f (n f x): [.] Nat` (This type describes a function where the input must be the same type as the output, which in this case is `Nat`)

Nat is traditionally defined as `{ A: T } {_ : {A} A } ({A} A)`. This can be read as "the type of all functions that take unary function and return a unary function".

The type of unary functions in our type system is: `[A] A`. We can extend this to represent a function that takes and returns this using a lambda binding `[.]`.
`set Nat [.] ([A] A)`

What is the type of `Nat`?
The type of nat is itself.

Does this typecheck?
`zero -> [x] [y] y : Nat -> [.] ([A] A)`
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
