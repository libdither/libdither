# Lambda Calculus

Idea - Lambda calculus to represent types

## Representation

Representation of Lambda expressions in Hashtypes

### `Lambda Tree` representation
There are 4 parts to this hashtype representation.
 - `Variable` - Multihash cast to 0
   - Represents a variable (unknown whether it is bound or unbound)
 - `Lambda` - Multihash cast to 1
   - `<VarUInt><Bits><Multihash>`
     - `<VarUInt><Bits>` represents a list of variable-length bit-arrays, each bit of the array represents which a direction (left or right) which should be traversed down when encountering an `Application` expression
 - `Application` - Multihash cast to 2
   - `<Multihash><Multihash>`
 - `Select` - Multihash cast to 3
   - `<Multihash><Multihash>`
   - Represents waiting on 2 operations and returning them in order of completion.
   - Group 2 expressions, returns expressions in order of which one returns first. (for parallel programming)
     - `Application(Application(And, func_loop), func_false) = func_loop`
     - `Application(And, Select(func_loop, func_false) = func_false`

Cons - lots of re-hashing needed for beta & eta reduction - probably not a real problem

Pros - Code is very deduplicated

### Weird Idea about computation...
Multiplication is `O(N log(N))` at the fastest, but the "typical" algorithm run in `O(N^2)`. These algorithms can be represented using a so-called "parallel reduction lambda calculus". Is there some relation between these two representations? Perhaps beta and eta reduction can derive one from the other?




