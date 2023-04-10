# Disp Default Abstract Syntax Tree

AST: 
```rust
enum AST {
	/// `<name> := <value> : <type>`
	Definition(Name, AST, Option<AST>),
	/// `name 
}

enum Type {
	// `Type`
	Universal,
	// `Type -> Type`
	FunctionType(Type, Type),
	
}

struct SetItem {
	Value(AST),
	Type(AST),
}

struct Name {
	name: String,
}

```