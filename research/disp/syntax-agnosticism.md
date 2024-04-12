# Syntax Agnosticism

Syntax is one of the most visible barriers separating different languages from each other. It is easy to distinguish between Lisp and C, BASIC and APL, Haskell and Fortran. All these languages can pretty much do the same things, but their different syntax plays a big role in preventing programmers experienced in one from trying out another.

Disp aims to solve this issue by allowing the programmer to use whatever syntax style they prefer. This is possible because Disp is not stored in text files, it is instead temporarily rendered to a text file in a given syntax style and then parsed back to a structured binary format. Syntax styles should be compatible with each other and switching between them should be as simple as a click of a button.

## How is this done?

But first, lets define our primitive structures:
```
// Describe what it means to be an expression
Expression : Type
Evaluator : Expression -> Expression

// Describe what it means from some type to be a grammar
Grammar : Type -> {
	// Must have some Syntax Tree
	SyntaxTree : Type
	// Some error type
	Error : Type
	// Parser is a function from strings to things
	Parser : String -> Result[SyntaxTree, Error],
	// Printer prints `SyntaxTree`s
	Printer : SyntaxTree -> String
	// Prove that parser and pretty printer correct each other
	parse_print_eq : [
		src: String,
		is_okay : Parser(src).ok_proof
	] -> Parser(src).unwrap(is_okay) <-> Parser(Printer(Parser(src).unwrap(is_okay)))
}

// Describe what it means to typecheck something
TypeChecker : { prog: Expression, typ: Expression } -> bool
Extractor : SyntaxTree -> Expression


```

What does it look like when you have multiple grammars? Or when you want to rename something, but only for yourself?

```
my_grammar : Type
Grammar(my_grammar) := { ... }

your_grammar : Type
Grammar(your_grammar) := { ... }
```

What does it look like to rename some code, i.e. a SyntaxTree?

```
Renamer : SyntaxTree -> SyntaxTree
Splitter : SyntaxTree -> [SemanticTree, NameTree]
Joiner : [SemanticTree, NameTree] -> SyntaxTree
Rename := new_name_tree -> (|> [
	Splitter,
	[sem_tree, _] -> [sem_tree, new_name_tree],
	Joiner
])

```