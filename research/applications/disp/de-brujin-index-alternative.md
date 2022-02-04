# Lambda Trees: A deduplication-friendly lambda-calculus construction

The current most well known way of representing the lambda calculus is [De Brujin Indicies](https://en.wikipedia.org/wiki/De_Bruijn_index).

This is where you have 3 variants of a lambda Term:

 - `Var(Number)` - Number represents how many layers of abstraction (lambdas) the variable is away from its intended binding
 - `App(Term, ...)` - Application is a list of Terms
 - `Lambda(Term)` - Lambda represents an abstraction point

An example of what this might look like for common equations:
 - `λx . x` = `Lambda(Var(1))`
 - `λx. λy. x` = `Lambda(Lambda(Var(2)))`
 - `λx. (x (λx . λy . x) (λx . λy . y))` = `Lambda(App(Var(1), Lambda(Lambda(Var(1))), Lambda(Lambda(Var(2)))))`

For Disp, I have devised an alternative method that doesn't require integers (and thus is not limited by encoding constraints)

Disp has the same 3 variants of Term:
 - `Var`
 - `App(Term, Term)`
 - `Lambda(PointerTree, Term)`

In addition to a construct PointerTree:
 - `None`
 - `End`
 - `Branch(PointerTree, PointerTree)`

In fact, the pointertree datastructure can be repurposed from the Term datastructure.
`(End = Var, None = Lambda(Var, Var), Branch(PointerTree, PointerTree) = App(Term, Term))`

Common equation examples of this structure might look like:
 - `λx . x` = `Lambda(Var, Var)`
 - `λx. λy. x` = `Lambda(Var, Lambda(None, Var))`
 - `λx. (x (λx . λy . y) (λx . λy . x))` = `Lambda(Branch(Branch(End, None), None), App( App( Var, Lambda(None, Lambda(Var, Var)) ), Lambda(Var, Lambda(None, Var)) )`
As opposed to De Brujin indices where the variables "point" to their corresponding lambda abstractions, with Lambda Trees, the lambda terms carry an auxiliary datastructure specifying exactly which Variables should be replaced.

In addition when it comes to storage and integration with Dither, these lambda expressions are identified by hash which gives a datastructure like this:
 - `Var`
 - `App(Hash, Hash)`
 - `Lambda(Hash, Hash)`

This version of lambda calculus has been implemented in the [disp repository](https://github.com/libdither/disp)


