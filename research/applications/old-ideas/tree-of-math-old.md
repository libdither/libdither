# Tree of Math

> NOTE: This will be done using Disp instead.

Defining all of math programatically using set theory.

## Traits

Defining the fundamental structures of math:

 - Variable
   - Math Def: An variable in an axiomatic system
   - Struct Def: Uniquely identify a variable in a system
   - Struct: { id: Varint }
 - Proposition
   - Math Def: A true or false statement based on a system of propositions
   - Structure Def: A boolean value corresponding to a predicate statement on a proposition system.
   - Struct: `{ system: Link<Proposition>, struct: Link<Predicate>, value: bool }`
   - 
   - E.g.
 - Predicate
   - Math Def: Proposition-Valued function of some variables
   - Structure Def: List of variables representing a function that can be used in a Definition
   - Struct: { List\<Variable\> }
   - Usage: 
 - Operation
   - Math Def: A predicate constrained by various propositional statements to define a function in some Domain.
   - Struct Def: Predicate and a proposition
 - Symbol
   - Struct Def: A Unicode symbol pertaining to some or various Operations.
 - Proof
   - A proof is just a list of propositions that results in prooving a proposition from some axioms.
   - A proposition can be an Axiom, a Tautology, or a derived proposition.
   - Valid Proofs that use Valid Axioms in Dither can themselves be treated as Axioms because they link directly to other proofs. Full Proofs can be compiled by traversing the Tree of Math (much like compiling C++ into assembly)

## Roots

The roots of Math