# Disp Language Design

Disp is an ambitious programming language designed to be the ultimate language that can successfully interpret the source code of any other language in the world. The primary features of disp include user-defined syntax, abstract syntax trees (ASTs), flexibility in programming paradigms, and extensibility. This summary outlines the key aspects of the language's design, organized into relevant sections.

## Abstract Syntax Trees (ASTs)

ASTs are the backbone of disp, serving as a flexible representation of various programming constructs, paradigms, and languages. ASTs are user-defined and can represent anything from lambda calculus expressions and combinator calculi to Turing machines, assembly instructions, or LLVM IR.

## User-Defined Syntax

Disp allows users to create custom syntax and define their own ASTs. A default AST serves as the starting point for newcomers, and it can be extended or modified as needed. Users can create their own parsers and pretty-printers to handle new syntax, which can be used to parse different programming paradigms down to a single "core" AST.

## Default AST

The default AST is designed to be versatile and configurable, allowing users to easily extend it with their own syntax and constructs. This AST should include support for common programming paradigms and constructs, such as if-else statements, loops, pattern matching, functions, and more.

## Programming Paradigms

Disp is designed to support a wide range of programming paradigms, including object-oriented, functional, and procedural styles. These paradigms are handled by defining different ASTs that can represent each paradigm and by providing parsers and pretty-printers that can parse and generate code for the chosen paradigm. Disp leverages the underlying Turing completeness of these paradigms to enable their coexistence and interconversion.

## Type System

Disp will feature a strong static type system with support for "steady typing," a variant of gradual typing. Steady typing allows for type annotations to be optional, with the IDE guiding users through type mismatches and helping them identify potential issues without being overwhelmed. Disp aims to have a robust type inference system to minimize the need for explicit type information.

## Concurrency and Parallelism

Concurrency and parallelism in disp will be managed through AST definitions. The default AST and parser (Default Disp) will include concurrency constructs similar to Rust's approach, defining types like Future and using syntactic sugar to simplify their usage.

## Error Handling and Debugging

Disp will adopt an error handling strategy inspired by Rust, using types like Result and Option along with syntactic sugar for easier usage. Additionally, Disp aims to have a strong static type system to help users identify potential issues. Future developments may include live debuggers and other advanced debugging tools.

## Libraries, Modules, and Namespaces

Disp will not have a traditional module system for its default variant. Instead, all names will occupy a global namespace. AST patterns will encourage keeping separate ASTs for name definitions and structural definitions, allowing the compiler to deduce the correct name usage based on context. Code will be stored in a deduplicated, decentralized database with names accessible in a global lookup table.

## Interoperability

Disp will support interoperability with other languages and libraries through specific AST extensions. Users can create extended ASTs with primitives for external library calls and link them using the disp command.

## Performance and Optimization

Disp will optimize code through equivalence graphs and machine learning algorithms trained in a decentralized manner. By leveraging linear and ordered types, Disp will allow for advanced rewrites and optimizations that are inaccessible to other languages.

## Security and Sandbox

Disp's ASTs can be compiled to various targets, including WebAssembly, enabling sandboxed execution. This flexibility allows disp to be run securely in different environments.

## Tooling and Ecosystem

Tooling for disp is still in the early stages of planning. The ultimate goal is to create a structural editor with robust debugging, REPL, and syntax-modifying features. In the meantime, a single disp command will be used to add (parse) text files of code into ASTs, convert those ASTs to other ASTs (for compilation or changing code style), and provide target-specific AST interpreters for working with external libraries in other languages (like C).

## Standard Library and Built-in Functions

The scope of the standard library for disp will need to be determined. It should provide common utility functions, data structures, and algorithms. The standard library can be implemented as part of the core language or as separate, user-extensible modules.
Language Evolution and Versioning

Disp should have a mechanism for managing language versions and compatibility between different versions of disp code and libraries. This will ensure smooth transitions as new features are added or existing features are modified.

## Documentation and Learning Resources

High-quality documentation, tutorials, and learning resources are essential for the success and adoption of disp. A plan should be put in place for the creation and maintenance of comprehensive documentation to support both new and existing users.

## Summary

Disp is a highly ambitious and flexible programming language designed to interpret the source code of any other language. With user-defined syntax, versatile ASTs, support for multiple programming paradigms, a strong static type system, and a focus on optimization, disp aims to be the ultimate programming language. The language will continue to evolve as new features are added and existing features are refined, with a strong emphasis on tooling, documentation, and learning resources to support its growing user base.
