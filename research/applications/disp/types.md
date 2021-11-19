# Types

There are various core types in Disp here are some main ones pertaining to compilation.

The Funclet type facilitates the compilation from functional human-reasonable code to procedural machine-interpreted code without compromising performance.

Funclet is generic over an instance of `CompilationTarget`.
\
`type Funclet<Target: CompilationTarget>`
 - `input: Target::StateLocation`

CompilationTarget describes all the necessary details to convert a chain of `Funclet`s to a list of `Operation`s 
\
`trait CompilationTarget`
 - `type StateLocation` - a type definition for a location in a global state used by Funclets.
 - 

Expression
\
`type Expression`
 - `parameters: List<Type>`

The Function type defines all behavior. It is generic over two instances of `Type` that implement the `Size` trait.
\
`type Function<Input: Type + Size, Output: Type + Size>`
 - `input: Input`
 - `output: Output`
 - `body: List<Expression>`
 - `impl Valid for Function`
   - pseudo: valid only if last expression of body evaluates to type `O`.
 - // 

`type Macro = Function<Expression>`

`type Operation`

`type Procedure`


