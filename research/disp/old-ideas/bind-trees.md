# Bind Trees: A deduplication friendly alternative to De Brujin Indicies.

Used in [Disp]

The current most well known way of representing the lambda calculus is [De Brujin Indicies](https://en.wikipedia.org/wiki/De_Bruijn_index).

This is where you have 3 variants of a term:

 - `Var(Number)` - Number represents how many layers of abstraction (lambdas) the variable is away from its intended binding
 - `App(Term, ...)` - Application is a list of Terms
 - `Lam(Term)` - Lambda represents an abstraction point

An example of what this might look like for common equations:
 - `λx . x` = `Lam(Var(1))`
 - `λx. λy. x` = `Lam(Lam(Var(2)))`
 - `λx. (x (λx . λy . x) (λx . λy . y))` = `Lam(App(Var(1), Lam(Lam(Var(1))), Lam(Lam(Var(2)))))`

For Disp, I have devised an alternative method that doesn't require integers (and thus is not limited by encoding constraints)

Disp has the same 3 variants of Term:
 - `Var`
 - `App(Term, Term)`
 - `Lam(Binding, Term)`

In addition to a construct Binding:
 - `None`
 - `End`
 - `Branch(Binding, Binding)`

In fact, the Binding datastructure can be repurposed from the Term datastructure.
`(End = Var, None = Lam(Var, Var), Branch(Binding, Binding) = App(Term, Term))`

Common equation examples of this structure might look like:
 - `λx . x` = `Lam(Var, Var)`
 - `λx. λy. x` = `Lam(Var, Lam(None, Var))`
 - `λx. (x (λx . λy . y) (λx . λy . x))` = `Lam(Branch(Branch(End, None), None), App( App( Var, Lam(None, Lam(Var, Var)) ), Lam(Var, Lam(None, Var)) )`
As opposed to De Brujin indices where the variables "point" to their corresponding lambda abstractions, with Bind Trees, the lambda terms carry an auxiliary datastructure specifying exactly which Variables should be replaced.

In addition when it comes to storage and integration with Dither, these lambda expressions are identified by hash which gives a datastructure like this:
 - `Var`
 - `App(Hash, Hash)`
 - `Lam(Hash, Hash)`