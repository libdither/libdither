# Idea Document for Hashtypes

## What is a Hashtype
Generally, A hashtype is a piece of data, prepended by a Multihash. The multihash can be resolved using [directional-trail-search](../../routing/directional-trail-search.md) to some data that defines the layout of the hashtype.

A type definition (seen below) contains a type name, multiple fields, and a type for each field. The most primitive type definition (`Layout`) allows for the creation of dependent types.

## What constitutes a Layout?

All Types are all eventually defined by the core `Layout` type.

The core `Layout` type is defined **in implementation** roughly as:

`Layout`
 - num_fields: `B8` - Binary 8-bit number
 - num_traits: `B8`
 - hash_length: `VarUInt` - Variable unsigned integer
 - hash_type: `VarUInt`
 - fields: `Unknown` - Variable length data
 - traits: `Unknown`
 - `$FixedSize = undefined` - It doesn't matter what this is because `$Size` doesn't use it for this type.
 - `$Size: $FixedSize = (self) -> U64`
   - `num_fields.size() + hash_length.size() + hash_type.size() + num_fields.to_u64() * hash_length.to_u64()`
   - Defined as function that takes a reference to the beginning of a buffer containing a value of type Layout and returns 64-bit integer.
   - Depends on `$FixedSize`. Fixed-size types return `$FixedSize`. Variable-length types calculate size dynamically.
 - `$Correct: $Size = (self, size) -> bool`
   - `(size == $Size(self)) & num_fields.correct() & hash_length.correct() & hash_type.correct()`
   - Dependent Trait, relies on `$Size`. Returns true if `Unknown` data field is correct size and the `VarUInt`s are also correctly formatted.
 - `$Valid: $Correct = (self, size) -> bool`
   - `{ $Correct(self, size) & num_fields.valid() & hash_length.valid() & hash_type.valid() & [logic to verify hash-linked objects validity contained in data field] }`

See [Traits](#traits) for an explanation of `$` notation.

This also infers the interpretation of `VarUInt` and `Unknown`.

`VarUInt` - A VarUInt is just a Variable Unsigned Integer
 - data: `Unknown`
 - `$Size: $FixedSize = (self) -> U64: [varint size algorithm]`
 - `$Correct: $Size = (self, size) -> bool`

The `Unknown` type just refers to raw data that is defined via the `$Size` and `$Correct` Traits.

## Traits

Traits define programs or adjacent data on Types. They are themselves Hashtypes linked directly from the layout type or via [reverse linked data](../reverse-hash-lookup.md).

`Trait: Layout` - A Trait is a type that defines multiple functions
 - 
 - `$Size: $FixedSize = (self) -> U64: type.size()`
 - `$Correct: $Size = (self, size) -> U64`

`LinkedTrait` - Trait that is reverse-linked


`Function` - A program is an input and an output
 - input: `Multihash`
 - output: `Multihash`

`Implementation` - Implementation of a program
 - program: `Multihash` - Program Layout Multihash
 - type: `VarUInt` - Program Type (CPU Arch)
 - impl: `Unknown` - Program Data (Machine Code)

All types should have the `$Correct` trait definitions (This implies `$Size` and `$FixedSize`)

`$Size` is described as a `U64` or `Reference -> U64`.

`$Correct` takes a reference to a point in memory where a Typed value is and returns true if the 