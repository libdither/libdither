# Disp Default Abstract Syntax Tree

AST: 
```rust
type Name = String;

enum AST {
	/// `set <name> <AST>`
	Definition(Name, AST),
	/// Type Declaration
	/// value : Type
	TypeDeclaration(AST, AST)
	/// `Type`
	Universal,
	/// `___ -> ___`
	FunctionType(AST, AST),
	/// { __, __, __ }
	Set(BTreeSet<AST>),
	/// [___, ___, ___]
	List(Vec<AST>),
	/// thing()
	Application(AST, AST),
	/// Name
	String,
}

/// A type can be a `Type` or a 
enum Type {
	// `Type`
	Universal,
	// `Type -> Type`
	FunctionType(Type, Type),
	// { a: Type, b : Type }
	SetType(TypeSet),
	ListType(TypeList)
}
/// Unordered set
struct TypeSet {
	// Uses BTreeSet because all possible orderings must be representable, therefore BTreeSet is used to choose a "universal ordering" based on the elements.
	BTreeSet<Type>,
}
/// Ordered set
struct TypeList {
	Vec<Type>
}

struct SetItem {
	Value(AST),
	Type(AST),
}

struct Name {
	name: String,
}

```