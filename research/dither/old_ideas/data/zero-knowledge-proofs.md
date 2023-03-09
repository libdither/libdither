# Zero Knowledge Proofs

These are really cool btw.

Potential Applications:
 - Anonymous Transactions
 - Proof of Karma (proove that someone is trustworthy enough on the Dither network for them to be trusted without giving away more information than necessary)
 - KYC/18+ requirements - For abiding by laws.
 - (Is this even possible?) - Proove that some well-defined operation was done correctly on a given piece of data, i.e. that a binary was compiled correctly with no tampering.
 - Prooving that a given Self-Defined Structure's valid proof is valid.
 - Anonymous Auctions (Hiding what other people bid for items)


## How do zero-knowledge proofs even work?

 - Data
 - Function(Data) -> Bool
 - Party A can generate a proof that Function(Data) returns true

### Example: Anonymous Set Membership

- Trusted Authority (TA) maintains a set `S`.
- TA generates accumlated representation of set `S`: `S_a`.
- User A wants to obtain a proof that item `x` is a member of set `S`
- Zero-Knowledge Predicate: `Member(S : Set, x : Item) -> Bool`
- TA generates zero-knowledge proof `x_proof`
- User A or anyone else can take the following: `S_a`, `x`, and `x_proof` and verify that `x` is indeed a member of set `S`.

### Example: Trusted User Distributed Anonymous Count

 - Trusted Authority (TP) maintains a set of trusted user's public keys `S`.
 - All users that want to participate as a trusted user register themselves with the TA and receive a proof that they are a member of the set.
 - Example user A or any other user may verify their trusted status through `Verify(S_accumulated, a_public_key, a_membership_proof) -> Bool`
 - User A may want to participate in a count (i.e. perhaps they want to "like" a video). A data structure is created linking to the video in question and is signed by the user's private key. e.g. `<Like Data Hash><Signature>`
 - This signature can be verified using the user's public key: `Verify(signed_data, a_public_key) -> Bool`.
 - These two verify functions are combined together to form one big function
   - `Verify(S_accumulated, a_public_key, a_membership_proof) -> Bool`
   - `Verify(signed_data, a_public_key) -> Bool`
   - -> `Verify(S_accumulated, a_membership_proof, signed_data, a_public_key) -> Bool`
 - This subsequently becomes its own Zero-Knowledge predicate, where the public key `a_public_key` is hidden. (Note to self: Is this even possible?)
 - Written out, the total verification function looks like: `Verify(S_accumulated, a_membership_proof, signed_data, a_membership_proof, a_key_hidden_proof) -> Bool`
 - The inputs to the previous verification function are subsequently used to deterministically generate a `K`-dimensional vector with each value selected from a gaussian distribution ranging from 0 to u32::MAX.
 - The vectors are combined using the MIN function for its idempotent properties, and then the estimation function from [this paper](https://repositorium.sdum.uminho.pt/bitstream/1822/33841/2/1143.pdf) is used to estimate the total number of trusted users participating in the census.
 - All nodes broadcast their vectors & verification information and other nodes verify the trusted user proof and if correct, mins their current vector with the new vector. After enough time, every node should arrive at the same number for the count.

