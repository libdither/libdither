# Disp Design Proposal

### A Tour of the `disp` Language Syntax

### 1. The Product Syntax: `{...}`

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

#### 1.1. Functions Know What They Need

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

#### 1.2. The Compiler Connects the Dots (Type Inference)

This is `disp`'s most powerful feature. You often don't need to tell a function everything; it can infer missing pieces from what you *do* provide.

**Intuition Pump: The `map` function**
Let's say we have a function `map` that applies a function to every element in a list. Its full, technical signature is:
`map : {ItemType, ResultType, list : List ItemType, func : ItemType -> ResultType} -> List ResultType`

That's long! But you never have to write that. In `disp`, you just use it:

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

#### 1.3. Partial Application: Create New Functions on the Fly

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

### 2. The Coproduct Syntax: `<...>`

Just as products (`{...}`) handle the "and" relationship (a `User` has an `id` *and* a `name`), we need an equally elegant way to handle the "or" relationship. This is the role of **coproducts**, also known as sum types, enumerations, or tagged unions. A `Result` is either `Success` *or* `Failure`; it cannot be both.

#### 2.1. Defining and Constructing Coproducts

We use `<...>` to define a coproduct. The labels now represent the different possible "cases" or "variants" the type can be.

```disp
// An Event can be one of three things.
Event := <
  Error   : {code: Int, msg: String}, // The Error variant holds a record
  Success : {data: String},          // The Success variant holds a different record
  Warning : {msg: String}            // The Warning variant holds a third type
>
```

To construct a value, you call the appropriate variant like a function, namespaced by the type. This is the dual of accessing a product's field (`my_user.name`).

```disp
// Construct an Error event by calling the "Error" injector function.
e1 : Event := Event.Error {code=500, msg="Database offline"}

// Construct a Success event.
e2 : Event := Event.Success {data="User created successfully"}
```

#### 2.2. Destruction: Applying a Record of Handlers

How do we use a value that could be one of many things? We must provide a handler for each possibility. In `disp`, this set of handlers is just a regular **record**, where the keys are the variant names and the values are functions that handle that variant's data.

We use the pipe operator `|>` to apply a record of handlers to a coproduct value.

**Intuition Pump: A Complete Event Handler**

```disp
// A record of functions to handle any possible Event.
// Notice this is just a standard `disp` record.
event_handler := {
  Error   := err -> "ERROR: " + err.msg,
  Success := s   -> "OK: " + s.data,
  Warning := w   -> "WARN: " + w.msg
}

// Let's apply the handler to our events.
log_line1 := e1 |> event_handler // Result: "ERROR: Database offline"
log_line2 := e2 |> event_handler // Result: "OK: User created successfully"
```

The compiler enforces this:
1.  **Exhaustivity:** `event_handler` must have a key for every variant of `Event` (`Error`, `Success`, *and* `Warning`). This is the dual of a product constructor needing a value for every field.
2.  **Consistency:** The return type of every handler function must be the same (here, `String`). This is the dual of every value in a product constructor matching its field's type.

#### 2.3. Partial Destruction: Create New Coproducts on the Fly

Here is where the true power and symmetry of the system shines. What if you only provide *some* of the handlers? This is **partial destruction**.

Instead of an error, `disp` creates a *new, smaller coproduct type* representing the remaining, unhandled cases.

**Intuition Pump: An Event Processing Pipeline**

Imagine we want to turn `Error` and `Warning` events into a common `LogEntry` type, but leave `Success` events alone to be processed later.

```disp
LogEntry := {level: String, message: String}

// 1. Create a handler for Errors ONLY.
error_handler := {
  Error := err -> {level := "ERROR", message := err.msg}
}

// 2. Apply it. `e1` is an Error, so it gets converted.
intermediate_val := e1 |> error_handler
```

What is the type of `intermediate_val`? It's no longer an `Event`. The compiler sees that `Error` has been handled and transformed into a `LogEntry`, but `Success` and `Warning` have been left untouched. The resulting type is a new coproduct:
`<LogEntry, Success: {data: String}, Warning: {msg: String}>`

The original `e1` value was consumed and transformed into a `LogEntry`. If we had passed a `Success` event through, it would have passed through unchanged.

We can chain these partial handlers to create a pipeline.

```disp
// A handler for Warnings ONLY.
warning_handler := {
  Warning := warn -> {level := "WARN", message := warn.msg}
}

// Chain the handlers together.
processed_event := e1
  |> error_handler   // Type becomes: <LogEntry, Success, Warning>
  |> warning_handler // Type becomes: <LogEntry, Success>

// The `processed_event` is now guaranteed to be either a LogEntry
// (if it was an Error or Warning) or a Success event. We have
// safely "stripped off" parts of the coproduct by handling them.
```

By providing handlers for some cases, you create a new, more specialized value that requires fewer handlers down the line. This is the exact dual of partial application, where providing some arguments creates a new, more specialized function that requires fewer arguments. This allows for building incredibly modular and type-safe data processing pipelines with no special keywords, just the fundamental components of the language.