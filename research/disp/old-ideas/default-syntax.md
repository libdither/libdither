# Syntax

### A Tour of the `disp` Language Syntax

#### 1. Universal Syntax: `{...}`

Everything in `disp` revolves around a single, unified syntax: curly braces `{...}`. They are used for defining the inputs of functions and types or the body of functions and records.

*   **Defining a struct/record:**
    ```disp
    // A simple data structure for a user.
    User := {
      id   : Int,
      name : String
    }
    ```

*   **Defining a function:**
    ```disp
    // A function that takes two arguments, `x` and `y`, and adds them.
    add : {x : Int, y : Int} -> Int
		:= {x, y} -> x + y
    ```

*   **Calling a function:**
    ```disp
    add {x := 5, y := 10}   // Result is 15
    add {5, 10}         // Also 15. Positional arguments work too.
    add {y := 10, x := 5}   // Also 15. Order doesn't matter with named arguments.
	add {5, x := 10}   // This too, all named arguments are matched first before positional arguments are realized.
    ```

#### 2. Functions Know What They Need

In `disp`, a function signature is a "shopping list" of what it needs. You can provide these items in any order you like (using names), and the compiler will figure it out.

**Example: A "configure" function**
Imagine a function that configures a database connection. It needs a host, a port, and an optional timeout.

```disp
// The default timeout is 30 seconds.
default_timeout : Int := 30

// The function signature lists all requirements.
configure_db : {
  host    : String,
  port    : Int,
  timeout : Int := default_timeout // An optional argument with a default value.
} -> Connection

// Let's call it!
c1 := configure_db { host = "localhost", port = 5432 }
// The compiler sees you didn't provide 'timeout', so it uses the default.

c2 := configure_db { port = 8000, host = "my-server.com", timeout = 60 }
// Order doesn't matter when you use names, only for positional arguments. Positional arguments and named arguments can be mixed and matched as well.
```

#### 3. The Compiler Connects the Dots (Type Inference)

This is `disp`'s most powerful feature. You often don't need to tell a function everything; it can infer missing pieces from what you *do* provide.

**Intuition Pump: The `map` function**
Let's say we have a function `map` that applies a function to every element in a list. Its full, technical signature is:
`map : {ItemType, ResultType, list : List ItemType, func : ItemType -> ResultType} -> List ResultType`

That's a mouthful! But you never have to write that. In `disp`, you just use it:

```disp
numbers : List Int := [1, 2, 3]
to_string : Int -> String := ... // A function that converts an Int to a String

// We want to map `to_string` over `numbers`.
string_numbers := map { list = numbers, func = to_string }
```

**How does this work?**
1.  You call `map` and provide `list` and `func`.
2.  The compiler looks at the type of `numbers` (`List Int`) and matches it with the `list` parameter's type (`List ItemType`). It concludes: **`ItemType` must be `Int`**.
3.  Then it looks at `to_string`'s type (`Int -> String`) and matches it with `func`'s type (`ItemType -> ResultType`). Since it already knows `ItemType` is `Int`, it concludes: **`ResultType` must be `String`**.
4.  Now the compiler has all the pieces it needs and can produce the result: a `List String`.

You didn't have to specify `ItemType = Int` or `ResultType = String`. The compiler inferred them for you.

#### 4. Partial Application: Create New Functions on the Fly

You can give a function *some* of what it needs to create a new, more specialized function.

**Intuition Pump: A `greet` function**

```disp
// A generic greeting function.
greet : {greeting : String, name : String} -> String
greet := {greeting, name} -> greeting + ", " + name + "!"

// Let's call it normally.
formal_greeting := greet {greeting = "Hello", name = "Dr. Evans"} // "Hello, Dr. Evans!"

// Now, let's create a specialized greeter.
greet_casually : {name : String} -> String := greet {greeting = "Hey"}

// `greet_casually` is now a new function! It already has the greeting
// "Hey" baked in. It's just waiting for the 'name'.
casual_greeting := greet_casually {name = "Alex"} // "Hey, Alex!"
```

**How does this work?**
When you write `greet {greeting = "Hey"}`, `disp` sees that `greet` still needs a `name`. So instead of giving an error, it creates and returns a *new function* that remembers `"Hey"` and is just waiting for the final `name` argument.

This makes it easy to build complex logic from simple, reusable parts.
