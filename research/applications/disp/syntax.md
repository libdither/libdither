# Syntax

Disp's default syntax is similar to lisp with some Rust naming conventions sprinkled in.
However, since disp files are stored as binary objects, disp code can be displayed in any way preferred by the programmer (javascript-like rust-like go-like etc.)

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
