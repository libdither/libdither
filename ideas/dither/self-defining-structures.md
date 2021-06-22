# Self-Defining Structures
(A.k.a. *Hashtraits*)

Self defining structures are pieces of data that link to their own format. The workings of this system are heavily dependent on [Directional Trail Search](directional-trail-search.md) and [Reverse Hash Lookup](reverse-hash-lookup.md).

## Structures
Every structure is a piece of binary data that starts with a [Multihash](https://multiformats.io/multihash/). A structure is considered valid if the Multihash corresponds to a valid Trait definition and the trait definition correctly defines the structure.

## Traits

The main idea behind self-defining structures is that structures contain a which is the hash of its format definition. A format for a self-defining structure is called a Trait and they can be made up of other Traits. All traits are defined via the Fundamental Type (called the `Trait` type). Traits can also be generic across other traits to apply some functionality (Such as the `Multihash`, `Option`, `List`, or `Collection` traits).

Each trait is itself a structure and also starts with a multihash and has it's own format.
A typical trait will use the `Trait` type as it's format which is defined as the following:
 - `extension: Option<Multihash<ext Trait>>` (Optionally specify trait that is being extended)
 - `fields: List<MultiHash<ext Trait>>` (List of Multihashes that link to objects which extend `Trait`)

The `Trait` type is identified by a multihash with all zeroes. The format is built into any program that implements reading of Hashtraits.

This leads to the second feature of traits which is extension. Traits that extend other traits simply add fields to the resulting structure that is defined.

### Common Trait Types
#### Built-in
 - `VarInt` - Variable-Length Integer
 - `CoreMultihash` - Formatted via the Multihash format, defines the hash of an unknown piece of data. Corresponds to publicly-hosted data that can be found on the Dither network via Directional Trail Search.
 - `Byte` - 8-bit piece of data.
 - `CoreList<T, L: Byte>` - Create lists of a certain type.
 - `Option<T>` - Optionally store a type.
 - `Trait` - Core definition of a trait.

#### Defined Traits
 - ``
 - `VarInt: Trait`
 - `Enum: NamedTrait` - Defines a range of numbers that correspond to different states of the Enum.
   - `variants: VarInt`
 - `Link<T>: VersionedTrait` - Multihash linking to structure with specific Trait T.
   - `hash: Multihash`
 - `LinkWeight: Enum`
 - `WeightedLink<T>` - Contains an enum with various "Weight" types.
   - `link: Link<T>`
   - `weight: LinkWeight`
 - `RevLink<T>` - Wraps a `Link<T>` and requires a Trait type specification. Registers the trait T in the Reverse Hash Lookup tree. Allows for lookup of trait containing `RevLink<T>` type from the hash linked to.
   - `WeightedLink<T>`
 - `Localization: Enum`
 - `TraitLocalization: NamedTrait` - Defines field names and overall name of RevLinked trait in different languages.
   - `name: String`
   - `fields: List<String>`
   - 


### Trait Variants

List of Traits that extend the core `Trait` type.
 - `NamedTrait: Trait` type which contains a `String` for the English name of the Trait.
 - `VersionedTrait: NamedTrait` - adds `Option<RevLink<ext VersionedTrait>>>`. This is useful for backwards-compatability and future-proofing.


### Link Strengths

Being able to specify how vital a linked piece of data is to the "owning" piece of data is desireable when requesting data so that too much or too little is sent and either data has to be disgarded or more data has to be requested. For example, if a structure is defined to format a piece of data that is not self-defining, it is desirable to be able to specify to fetch only the structure itself, or the structure together with the embedded data. To accomplish this, 