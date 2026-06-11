# Homotopy Type Theory Formalization

An ∞-precategory:
```rust
// An Infinity Precategory is a collection of objects and morphisms of any type.
// The laws (associativity, identity) are included as explicit data (paths) and must cohere up to arbitrary (infinite) dimensions, i.e. morphisms between morphisms, morphisms between morphisms between morphisms and higher...
InfinityPrecategory := {
  // The type of objects, can be any type/space.
  Obj : Type,
  // The type of morphisms/paths between any two objects. Can be any type/space in the context of an infinity category.
  Hom : {source : Obj, target : Obj} -> Type,
  // An identity morphism must always exist for any object
  id : {a : Obj} -> Hom{a, a},
  // Morphisms may compose. compose{g, f} = g⚬f or "g after f"
  compose : {a, b, c : Obj, g : Hom{b, c}, f : Hom{a, b}} -> Hom{a, c},

  // --- Properties ---

  // Associativity is a path between two ways of composing three morphisms.
  assoc : {a, b, c, d : Obj, f : Hom{a, b}, g : Hom{b, c}, h : Hom{c, d}} ->
    compose{h, compose{g, f}} = compose{compose{h, g}, f},

  // The left and right identity laws are also paths.
  unit_left : {a, b : Obj, f : Hom{a, b}} -> compose{id{b}, f} = f,
  unit_right : {a, b : Obj, f : Hom{a, b}} -> compose{f, id{a}} = f
}
```
Truncation property:
```rust
// The property that a type is a "Set" (has at most one path between any two points).
IsSet (T : Type) : Type := {x, y : T, p, q : x = y} -> p = q

// A "mixin"/trait that requires the Hom to be a set
// It explicitly depends on a type C that must be an InfinityPrecategory.
HasSetHoms := {C : InfinityPrecategory} -> {
  has_set_homs : {a, b : C.Obj} -> IsSet(C.Hom{a,b})
}
```

Univalent property:
```rust
// This defines an Equivalence between two types, A and B.
// It's a structure containing a function, its inverse, and proofs that they cancel out.
Equiv {A B : Type} := {
  to : A -> B,
  from : B -> A,
  right_inv : {y : B} -> to (from y) = y,
  left_inv : {x : A} -> from (to x) = x
}

// First, we must define what an equivalence IS inside a category C.
Equiv_C {C : InfinityPrecategory, A, B : C.Obj} : Type := {
  to   : C.Hom{A, B},
  from : C.Hom{B, A},
  // The witnesses that 'to' and 'from' are inverses. These are paths.
  to_from : C.compose{to, from} = C.id{B},
  from_to : C.compose{from, to} = C.id{A}
  // Again, a full ∞-version would require coherence for these paths.
}

// Now, the univalent property itself. It's an equivalence between two types.
// We need the general type Equivalence from HoTT's library.
Equiv (A B : Type) := { to : A -> B, from : B -> A, ... } // (details omitted)

UnivalentProperty := {C : InfinityPrecategory} -> {
  // This helper type now lives inside the mixin, parameterized by C.
  Equiv_in_C {A, B : C.Obj} : Type := {
    to   : C.Hom{A, B},
    from : C.Hom{B, A},
    to_from : C.compose{g=to, f=from} = C.id{B},
    from_to : C.compose{g=from, f=to} = C.id{A}
  },

  // The main property field, which uses the helper.
  is_univalent : {A, B : C.Obj} -> Equiv (A = B) (Equiv_in_C{A, B})
}

```

```rust
// This defines an Equivalence between two types, A and B.
// It's a structure containing a function, its inverse, and proofs that they cancel out.
Equiv {A B : Type} := {
  // 1. The forward function.
  to : A -> B,

  // 2. The backward (inverse) function.
  from : B -> A,

  // 3. A path proving that `from` is a "right inverse" to `to`.
  // For any 'y' in B, going from B to A and back to B gets you back to 'y'.
  right_inv : {y : B} -> to (from y) = y,

  // 4. A path proving that `from` is a "left inverse" to `to`.
  // For any 'x' in A, going from A to B and back to A gets you back to 'x'.
  left_inv : {x : A} -> from (to x) = x
}
```
