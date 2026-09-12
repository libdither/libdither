# The Problems of Communication
Communication is *hard*. Communication is not just stating the facts. Its a process of persuasion and empathy. You must know what knowledge the other person knows to know how to frame your ideas in a way they will understand.

This becomes a million times more difficult when you realize that most communication nowadays is not interactive. We have videos and blog posts and wikipedia articles which make up the knowledge base of the world.

If you've ever browsed any science or math-related wikipedia article (particularly of a niche field). You will quickly realize that unless you are already somewhat familiar with the subject matter, everything is inscrutable. When you try to click on linked articles that you don't know, their pages are similarly inscrutible. It is impossible to understand a subject simply from reading the globally-available articles related to those subjects.

Instead, you must read books, watch videos, find learning resources specifically catering to newbies on the subject. (Note: some fields may not even have these resources, or they may be just as inscrutible).

Heres an idea: **What if we write articles in such a way that we can automatically change the concept level based on the reader?**

Example: Lets take the wikipedia article for [programming language](https://en.wikipedia.org/wiki/Programming_language)

> A **programming language** is any set of rules that converts [strings](https://en.wikipedia.org/wiki/Formal_language#Words_over_an_alphabet "Formal language"), or [graphical](https://en.wikipedia.org/wiki/Computer_graphics "Computer graphics") [program](https://en.wikipedia.org/wiki/Computer_program "Computer program") elements in the case of [visual programming languages](https://en.wikipedia.org/wiki/Visual_programming_language "Visual programming language"), to various kinds of [machine code output](https://en.wikipedia.org/wiki/Machine_code "Machine code"). Programming languages are one kind of [computer language](https://en.wikipedia.org/wiki/Computer_language "Computer language"), and are used in [computer programming](https://en.wikipedia.org/wiki/Computer_programming "Computer programming") to implement [algorithms](https://en.wikipedia.org/wiki/Algorithm "Algorithm").

What is a "string"? The layperson might think of a string as a piece of thread. The physicist might think of it in the context of string theory. In this context "strings" really means a string of text. Something that is written with a keyboard, stored in a computer. And here's the problem. We have all this assumed meaning embedded into the word "string" that unless you started from the beginning, it would be difficult to understand anything.

We will distill `string` down into a simpler form: "a data stucture representing a sequence of characters". 

While most people might understand this description, we can go even furthur. What if we want 5 year olds to have the ability to understand what a programming language is? We have to define what "data structure" and "character" are.

Let us dig deeper.

A data structure is: "A set of other data structures or pieces of data"
This looks a lot like an inductive definition!
`data structure := many (data structure | piece of data)` (translation: a data structure is multiple of either other data structures or pieces of data).

Character is: more complicated.
What exactly *is* a character? Unicode defines a character in many ways: unicode code point, grapheme, etc.
The word "character" by itself without context has many definitions, but we are in the context of computers and writing.
In the pure context of writing, a character represents: "a graphic symbol used in writing or printing that represents information".

Lets define a character more abstractly as: "an undividable thing that can be represented in some medium and composed to represent different things"

I know, not super descriptive, but heres what we can do with it:
`character := something : representable & composable & undividable`
We do what we do best in language, we define something in terms of what we can do with it. In this case, we use the concept of "types" and we describe some thing that is at the intersection of all these types representing qualities. These types are acting as propositions and we are defining a character as all the things that prove all three propositions. `something` kinda acts like an unbound variable in this sense.

In this manner, we can attempt to describe things in more concrete ways. Eventually to the point where we can describe everything in terms of primitive constructions.

Once we define everything, we will have made the [defipedia](applications/defipedia.md)
