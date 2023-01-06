# Syntax

Since Disp has [Syntax Agnosticism](syntax-agnosticism.md), it does not require one set syntax. For consistency and branding purposes however, Disp will have its own succinct and readable default syntax. This 

Disp's default syntax is still a work-in-progress, however I think I want something similar to lisp with various Rust conventions sprinkled in.

## Note: This Syntax is just an idea and subject to lots of change

```
// By itself, this is a comment
// It doubles as documentation when paired with an object

// This is an object, its type in inferred.
set Unit ();

// The function type is a function that takes two types A and B and returns a dependent product type where B is *not* dependent on a term of A.
set -> λ[A B] Π[_:A] B
set /\ λ[A B] Π[C:Type] (A -> B -> C) -> C
set id_type Π[A: Type] A -> A
set id λ[t] λ[x] x : id_type

// Pair constructor
set pair_type Π[A: Type, B: Type] A -> B -> C
set pair λ[x y f] f x y

set Bool Π[A: Type] A -> A -> A {
	true: λ[x y] x
	false: λ[x y] y
}







```

## Examples
```
// This is a comment, it also doubles as documentation

// Variables
(set ten 10:b64)

// variable names can have most symbols in them
(set ten? 10) // literal 10 resolves to 10:bsize

(use std::flow::assert)
(assert_exact ten ten?) // => true only on 64-bit systems, because bsize = b64
(assert_eq ten ten?) // => always true

// Reason about functions
(use std::code::compile)
(assert_exact
	// Parentheses implied
	compile `(a b) `(assert_eq a b) 
	compile `(a b) `(panic_if (!= a b))
	compile `(a b) `(if (= a b) (panic))
) // => these functions are the exact same when compiled

// Strings
(set string "Hello, World!") // implies "Hello, World!":String

// String declaration follows the same declaration convention as Rust, except that Strings are stack-allocated by default.
(print string) // => prints out "Hello, World!"
(print "And the God of Programming said: {:?}" string) // => prints out formatted string with debug representation of string.

// Type definition (with type macro)
(type SomeStruct
	number b64
	_ (String Character)
)

// This macro resolves to something similar to using the formats of Type and TypeLocalization hashtype.
(set SomeStruct ( (hash b64) ( (hash String) (hash Character)):Type))
(set SomeStructLocalization ((hash SomeStruct) ):TypeLocalization)

// Trait definition using trait macro
// A trait defines a collection of adjacent data (either a function, or a value) that is attached to a Type
(trait SomeTrait
	fn size (&self) (usize)
)

(impl AddOne SomeStruct
	set add_one (fn (~self) (self) (
		(inc (loc self number) 1)
		(self)
	))
)

// Initiate SomeStruct with values
// symbol = thing notation is equivalent to (set symbol thing)
some_struct = (1098342 ("Hello, World!", 'u')):SomeStruct

(some_struct size)

(1098342:B64 -12304: String:"hello there" Symbol:hello)
```
