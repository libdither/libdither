# Syntax

Disp currently has one concrete syntax, and there isn't much of it. A `.disp` file is a sequence of definitions, tests, and imports. Here is a representative chunk:

```disp
open use "lib/prelude.disp"

// The identity function. {x} -> x is a function literal.
id := {x} -> x
test id t = t

// A typed definition: addition on natural numbers.
add : Nat -> Nat -> Nat := {n, m} -> nat_rec ({_} -> Nat) m ({pred, ih} -> succ ih) n
test add 2 3 = 5
```

The pieces:

 - `name := expr` defines and exports `name`. `let name = expr` defines something private to the file.
 - `name : Type := expr` attaches a type. The annotation is not just a comment for the reader, it makes the compiler run the type (which is [a program](universal-system-of-types.md)) against the definition when the file loads.
 - `{x, y} -> body` is a function of two arguments. Binders can carry types, as in `{x : Nat} -> body`, and a function *type* is written the same way: `{x : Nat} -> Nat`, or just `Nat -> Nat` when the result doesn't depend on the argument. This one form covers ordinary functions, generic functions, and dependent types.
 - `test expr = expr` is an assertion checked every time the file loads. The test suite for the language is mostly files like this.
 - `use "path"` loads another file as a record of its exported names; `open` dumps those names into scope.
 - `{ a : Nat, b := double a }` is a record type with a *derived* field: give it an `a` and `b` is filled in for you.

There is also `match` for case analysis, `if`/`then`/`else`, and a hole marker `_` for "let the compiler figure this out". That is most of the language. There are no keywords for classes, interfaces, modules, or macros, because records and functions end up covering those jobs.

Fair warning: the syntax is still in flux. It exists to get trees into the computer, and [the trees are the real program](#syntax-agnosticism), so syntax decisions are intentionally low-stakes. The authoritative grammar lives in [`SYNTAX.typ`](https://github.com/libdither/disp/blob/master/SYNTAX.typ) in the repo.

## Syntax Agnosticism

Syntax is one of the most visible barriers separating different languages from each other. It is easy to distinguish between Lisp and C, BASIC and APL, Haskell and Fortran. All these languages can pretty much do the same things, but their different syntax plays a big role in preventing programmers experienced in one from trying out another. Syntax is also where language communities waste the most energy: arguments about braces and keywords ([bikeshedding](https://thedecisionlab.com/biases/bikeshedding)) stall features that everyone otherwise agrees on.

Disp's position is that syntax is not what a program *is*. A Disp program's identity is not its text. Source text is parsed into a tree, and the tree is the program: it is what gets type checked, what gets evaluated, and what gets hashed for [naming](names.md) and sharing. Format the same definition differently, or rename every variable in it, and you get the same tree, byte for byte. The text is just one rendering.

Today Disp has just the one concrete syntax described above, so in practice you are looking at one particular rendering. But nothing downstream of the parser knows or cares what the source looked like, which leaves the door open for things that are very hard to retrofit onto text-based languages:

 - **Alternative grammars.** A different surface syntax that parses to the same trees is a frontend, not a fork. Code written in one style stays usable from any other.
 - **Personal rendering.** Since names live outside the trees, your editor could show you the same library with your preferred naming conventions, or in your native language.
 - **No more bikeshedding.** When people disagree about how something should look, both spellings can coexist as long as they mean the same tree. Defaults can be picked (and re-picked) by something like [persistent voting](https://hopefulpathway.blainehansen.me/persistent-voting) without breaking anyone's code.

The eventual goal is for Disp code to be stored and shared as trees, with text generated on demand in whatever style the reader prefers. Switching between styles should be as simple as a click of a button.
