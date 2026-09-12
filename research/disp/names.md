# Names

## A Natural Idea

A word in a language is a label to which we assign a definition. These definitions may be physical or abstract, but in a programming language, a definition is a piece of code.

`id := {x} -> x` - We are fitting the label "id" to the program `{x} -> x`.

Words in natural languages may have more than one definition, yet in conversation we usually intend only one of them, and the listener works out which from the *context*. If we are talking about garnishing food, you mean adding something, whereas if we are talking about garnishing wages, you mean taking something away. Nobody has to announce which dictionary entry they intend.

Contexts also exist in programming languages: namespaces, modules, classes. But unlike real conversation, the computer can't just "figure it out" (yet). The programmer has to spell out exactly where in a meticulously organized hierarchy of modules every name lives. This puts a special strain on the programmer, who must keep that whole pre-defined hierarchy in their head just to program effectively.

The goal: remove this burden by resolving names from the context of the program, the way a listener does.

## Structure

In Disp, names and programs are kept strictly separate. A program compiles to a tree that contains no names at all: variables are compiled away into the tree's structure, so two definitions that differ only in naming (or formatting, or [syntax style](syntax.md#syntax-agnosticism)) produce the *identical* tree. The tree's hash is the program's true identity.

Names are then just labels that people attach to hashes. A `.disp` file is, in effect, a record mapping labels to trees. This has a few nice consequences:

 - The same program may be named differently by different people, in different styles or different human languages, without anyone forking anything.
 - Renaming is free. It touches the label layer, never the code.
 - When code is shared over Dither, identical definitions deduplicate automatically, no matter who wrote them or what they called them.

## Resolving from Context

A label-to-hash map is the simple version. A perfect way to model the richer version is a [knowledge graph](https://en.wikipedia.org/wiki/Knowledge_graph): a name may resolve to many different programs, and the scope of possibilities is narrowed down by the surrounding context (the types in play, the file's imports, specifically declared contexts), much like a conversation does. Type information makes this more tractable than it sounds, since most candidate meanings of a name simply won't fit where it is being used.
