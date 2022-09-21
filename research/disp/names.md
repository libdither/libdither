# Names

## A Natural Idea

A word in a language is a label to which we assign a definition. These definitions may be physical or abstract, but in a programming languages: a definition is a piece of code.

`let id = λx . x` - We are fitting the label "id" to the definition `λx . x`

Words in natural languages may have more than one definition. When using these words in conversation however, typically only one definition is intended by the speaker. The definitions and names we use in conversation are set by the *context* of the conversation to which the speaker hopes the listener has deduced correctly. 

Contexts also exist in programming languages. Namespaces, modules, classes. Unlike real conversation where contexts can be deduced from various cues, computers need to know exactly what definition a label correponds to and can't just "figure it out" (yet). A context in a programming language is meticulously organized hierarchy of modules. When using these modules, programmers have to specifically import names into the context of their code, requiring the programmer to keep in their head where in the module hierarchy all the names they need to use are.

Contrast this to how we deal with context in natural languages, where when starting a conversation, we assume don't assume what the single definition of a given word will be without first inferring a context from surrounding cues. For example if we are talking garnishing food, you might be referring to adding things whereas if we are talking about garnishing wages, we are talking about taking away. This is the way our brains are used to dealing with context and seems to be better than what programming languages use existingly where we must memorize a complex pre-defined hierarchy of names.

The goal: Remove this burden on the programmer by modeling the natural language style of name resolution.

How: Have one big global context containing every name and every definition that most people agree upon (like a global dictionary) and then allow programmers to specify exactly what subset of definitions they want to use from the dictionary through either explicit context declarations, or implicit type inference.

## Contexts

A context simply some 

By all names and definitions are stored in a "global context". This includes 