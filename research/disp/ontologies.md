# Ontologies

Goal: Disp should be able to encode every representable structure, including linguistic ones. In this way, disp should act as a "universal" ontological framework.

Def: `Ontology (information science)`
 - an ontology encompasses a representation, formal naming, and definition of the categories, properties, and relations between the concepts, data, and entities that substantiate one, many, or all domains of discourse. More simply, an ontology is a way of showing the properties of a subject area and how they are related, by defining a set of concepts and categories that represent the subject.

```rust
// assignment
// thing relates other_thing via "def"
thing := other_thing

// thing relates other_thing via "def"
// "thing relates other_thing via "def"" relates context via "let_add"
// let-assignment
let thing := other_thing

// thing relates Type via "typ"
thing : Type

// thing relates Type via "typ"
// "thing relates other_thing via "typ"" relates context via "typ_add"
type thing : Type

// obj relates {...} via "def"
let obj := {
	type thing : Type;
}
```


```rust
let $op{A, "->", B} := 

let Category := {
	type Obj: Type;
	// constructions
	type Hom: {a,b: Obj} -> Set;
	// g o f = g after g = x -> g(f(x))
	type compose: {a,b,c: Obj} -> { f: Hom{a,b}, g: Hom{b,c} } -> Hom{a,c};
	type id: {a : Obj} -> Hom{a,a};
	// properties
	type identity: {a,b: Obj} {f: Hom{a,b}} -> compose{f: id, g: f} = f = compose{f, g: id};
	type associativity: {a,b,c,d: Obj} {f: Hom{a,b}, g: Hom{b,c}, h: Hom{a,b}} => compose{f, compose{f:g,g:h}} = compose{f: compose{f,g}, g:h};
}
let CatObj : T -> Category{Obj:=T}


let Functor := {C,D: impl{Category}} -> {
	type obj_map: C.Obj -> D.Obj;
	type hom_map: {a,b: C.Obj} {hom: Hom{a,b}} -> D.Hom{obj_map{a}, obj_map{b}};
	type preserve_id: {a: C.Obj} -> hom_map{id{a}} = id{obj_map{a}};
	type preserve_comp: {a,b,c: C.Obj} {f: C.Hom{a,b}, g: C.Hom{b,c}} -> 
}

let Endofunctor := {C: impl{Category}} -> Functor{C,C};

```