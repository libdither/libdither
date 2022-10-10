# Type System of Disp

The type system of disp should be:
 - Simple (few core inference rules)
 - Universally Constructive (everything needed should be constructable from the few core structures)
 - Representative (it should create a foundation for all of computer science and math)

## Current Ideas

### Substructural Type System

For a systems language, runtime overhead must be kept to a minimum. This means that the restrictions on lifetime and movability of heap and stack allocations should be modeled and enforced at compile time, instead of relying on a runtime methods such as garbage collection or reference counting.

Disp uses a type system that divides terms and types into 3 categories:

Unrestricted
 - This includes most types, type constructors, and terms that can fit in a single CPU register.
 - U nrestricted objects may be moved around and duplicated at will in a program and don't require a specific function defining how they are deallocated.

Linear
 - This includes terms allocated on the heap, mostly structures with variable-length allocations.
 - Linear objects must be used in each context exactly once and must define at least one destructor or else it won't typecheck.
 - Linear objects may contain unrestricted objects, just like how heap-allocated objects may contain numbers that can be stored in registers.

Ordered
 - This includes any term allocated on the stack. Ordered allocations must be 

To model stack based allocations, which cannot be shallowly duplicated (like integers) or deallocated without effecting other objects (like heap-based objects), Disp will utilize an ordered type system, similar to the type system in webassembly, which easily models storing objects on a stack.

### Minimal Type Theory



### Places of Inspiration
 - ATS type system
   - Linear types
   - Dependent / Refinement types


## Dependent Types

Dependent types are the core of any good type system

## Inspiration

[ATS Language](https://www.youtube.com/watch?v=zt0OQb1DBko)
[Substructural Type Systems](https://mitpress-request.mit.edu/sites/default/files/titles/content/9780262162289_sch_0001.pdf)
[Towards a Minimalist Foundation for Constructive Mathematics](https://www.math.unipd.it/~sambin/txt/MaiettiSambin-rev2.pdf)