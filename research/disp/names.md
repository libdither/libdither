# Names

## A Natural Idea

A word in a language is a label to which we assign a definition. These definitions may be physical or abstract, but in a programming languages: a definition is a piece of code.

`let id = λx . x` - We are fitting the label "id" to the definition `λx . x`

Words in natural languages may have more than one definition. When using these words in conversation however, typically only one definition is intended by the speaker. The definitions and names we use in conversation are set by the *context* of the conversation to which the speaker hopes the listener has deduced correctly. 

Contexts also exist in programming languages. Namespaces, modules, classes. Unlike real conversation where contexts can be deduced from various cues, computers need to know exactly what definition a label corresponds to and can't just "figure it out" (yet). A context in a programming language is meticulously organized hierarchy of modules. When using these modules, programmers have to specifically import names into the context of their code, requiring the programmer to keep in their head where in the module hierarchy all the names they need to use are.

Contrast this to how we deal with context in natural languages, where when starting a conversation, we assume don't assume what the single definition of a given word will be without first inferring a context from surrounding cues. For example if we are talking garnishing food, you might be referring to adding things whereas if we are talking about garnishing wages, we are talking about taking away. This is the way our brains are used to dealing with context, so it puts a special strain on the programmer where a complex pre-defined hierarchy must be memorized to actually program effectively.

The goal: Remove this burden on the programmer by resolving names from the context of the program.

## Implementation

A perfect way to model resolving from contexts is to use a [knowledge graph](https://en.wikipedia.org/wiki/Knowledge_graph). A name may resolve to many different expressions, but the scope of possibilities may be restricted further by the context of the types of surrounding types or specifically declared contexts.

# Structure

Names and programs in Disp are separate, this is so that alpha-equivalence is preserved and so that the same program may be able to named differently by different people.

A program is represented by an [`Expr`](expr.md). A Named program is represented by a `NamedExpr`

```rust
enum Expr {
	Abs { binding: Binding, expr: Expr },
	App { func: Expr, args: Expr }
	Var,
}
struct NamedExpr {
	name: String,
	expr: NameTree,
}
enum NameTree {
	Abs { bind_name: String, expr: NameTree }, // For Abs and Pi binding
	App { left: NameTree, right: NameTree } // For App
	Name(NamedExpr)
	End,
}
```

