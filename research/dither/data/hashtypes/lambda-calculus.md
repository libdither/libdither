# Lambda Calculus

Idea - Lambda calculus to represent types


 - I = λx . x
   - `[1, Var(1)]`
   - ex.
     - `[1 Var(1)   Apply 1 Var(1)]` = II 
     - `[0 Index(3) Apply 1 Var(1)]`
     - `  [Index(3) Apply 1 Var(1)]`
     - `  				 [1 Var(1)]` = I
 - K = λx . (λy . x)
   - `[2 Var(2)]`
   - ex: `[K Apply I]`
     - `[2 Var(2) Apply 1 Var(1)]` = (λxy . x)(λz . z)
     - `[2 Var(1)]` = KI
 - KI = λx . (λy . y)
   - `[2 Var(1)]`
   - ex `[KI Apply K]`.
     - `[2 Var(1) Apply 2 Var(2)]` = (λxy . y)(λxy . x)
     - `[1 Var(1)]` = I
     - verify: (λxy . y) (λxy . x) → λy . y
 - True = K
 - False = KI
 - Not = λx . (x False) True or λx . (x (λ y . (λz . z))) (λy . (λz . y))
   - `[1 Var(1) App(0) False App(0) True]`
   - `[1 Var(1) App(0) 2 Var(1) App(0) 2 Var(2)]`
   - `[1 Var(1) 2 Var(1) 2 Var(2)]`
   - ex: `[Not Apply True]`
     - `[1 Var(1) App(0) 2 Var(1) App(0) 2 Var(2) App(1) 2 Var(2)]`
     - `[0 2 Var(2) App(0) 2 Var(1) App(0) 2 Var(2)]`
     - `[0 3 Var(1) App(0) 2 Var(2)]`
     - `[0 2 Var(1)]`
     - `[2 Var(1)]` = KI = False
   - ex: `[Not Apply False]`
     - `[1 Var(1)   App(0)    2      Var(2) App(0) 2   Var(1) App(1) 2 Var(1)]`
     - `  [Index(9) App(0)    2      Var(2) App(0) 2   Var(1)]`
     - `  [Index(6) App(0)    2      Var(2) App(0) 1   Var(1)]`
     - `  [Index(6) App(0)    2      Var(2)]`
     - `  [Index(3) App(0)    2      Var(2)]`
     - `                     [2      Var(2)]` = K = True
 - Or = λ2 . (λ1 . 2 True 1) = λ2 . (λ1 . 2 (λ21 . 1) 1)
   - `[2 Var(2) App(0) True App(0) Var(1)]`
   - `[2 Var(2) App(0) 2 Var(2) App(0) Var(1)]`
   - ex: `[And App(0) True App(0) False]`
     - `[2 Var(2) App(0) 2 Var(2) App(0) Var(1) Apply(1) 2 Var(2)]` (λ21 . 2 (λ21 . 2) 1) (λ21 . 2)
     - `[1 2 Var(2) App(0) 2 Var(2) App(0) Var(1)]` (λ1 . (λ21 . 2) (λ21 . 2) 1)
     - `[1 3 Var(2) App(0) Var(1)]` (λ1 . (λ321 . 2) 1)
     - `[1 2 Var(2)]` (λ1 . (λ21 . 2))
     - `[3 Var(2)]` (λ321 . 2)) = λx . True

   - ex: `[And Apply True Apply True]`
     - `[2 Var(2)   Var(1)   2 Var(1) Apply 2 Var(2) Apply 2 Var(2)]`
     - `[1 Index(9) Var(1)   2 Var(1) Apply 2 Var(2) Apply 2 Var(2)]`
     - `[0 Index(9) Index(6) 2 Var(1) Apply 2 Var(2) Apply 2 Var(2)]`
     - `[2 Index(9) Index(6) 2 Var(1) Apply 2 Var(2) Apply 2 Var(2)]`
     - `[2 Var(2) 2 Var(2) 2 Var(1)]`
     - `[3 Var(2) 2 Var(1)]`
     - `[2 Var(2)]` = K = True
 - M = λ1 . 1 1
   - `[1 Var(1) App(0) Var(1)]`
     - ex: `[M App(1) I]`
       - `[1 Var(1) App(0) Var(1) App(1) 1 Var(1)]`
       - `[0 Index(5) App(0) Index(5) App(1) 1 Var(1)]`
       - `[1 Var(1) App(0) 1 Var(1)]`
       - `[1 Var(1)]`
     - ex: `[M App(1) M]`
       - `[1 Var(1) App(0) Var(1) App(1) 1 Var(1) App(0) Var(1)]`
       - `[0 Index(5) App(0) Index(5) App(1) 1 Var(1) App(0) Var(1)]`
       - `[1 Var(1) App(0) Var(1) App(0) 1 Var(1) App(0) Var(1)]`
       - 

## Representation

Representation of Lambda expressions in Hashtypes

### `Expression List` idea
Function is the core part of this hashtype representation. It defines a lambda expression. Interpereted as multihash cast to 0
 - `<VarUInt>` - Number of function arguments
 - `<FunctionList>` - list of Multihash links to other lambda expressions
   - `<VarUInt><Multihash<Function>~>`
 - `<Expression>`
   - `<VarUInt><VarInt~>`
     - List of signed variable-length integers, positive integers represent arguments. Negative integers represent indexes into the `FunctionList`. (i.e. references to other functions)

### Common Definitions

 - `I = [1 1]` // Takes thing, returns thing
 - `K = [2 2]` // Takes 2 things, returns first one
 - `KI = [0 K I] = [1 I] = [2 1]`// Takes 2 things, returns second one
 - `True = K = [2 2]`
 - `False = KI = [2 1]`
 - `Not = [1 1 False True]`
 - `Or = [2 2 True 1]`
 - `And = [2 2 True 1]`

### `Lambda Pointer Tree` idea
There are 3 parts to this hashtype representation.
 - `Variable` - Multihash cast to 0
   - Represents a variable that should be replaced
 - `Application` - Multihash cast to 1
   - `<Multihash><Multihash>`
 - `LambdaTree` - Multihash cast to 2
   - `<VarUInt><VarUInt><Multihash>`
     - `<VarUInt><VarUInt>` represents a list of integers, each bit of each integer represents which direction (left or right) which should be traversed down the binary tree until reaching a variable to be replaced

Cons - lots of re-hashing needed for beta & eta reduction - probably not a real problem

Pros - Better deduplication of code,

Domain-specific representation (for this document).
 - Function List is implied from function names in expression list
 - First item in list is the number of arguments








