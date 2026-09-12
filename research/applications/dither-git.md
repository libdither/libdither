# Dither Version Control
A Generalization of Version Control

### How to Version Things
 - A version control system is a system that keeps track of changes to one thing: Data.
 - It essence, it can be represented with one structure: `Change`. This type represents the new version of the data, the old version of the data, and how the data changed.

```disp
set Change { Data : Type } {
	previous: Option (Change Data),
	transform: Data -> Data,
	result: Data,
}
```

This more concrete representation might look something like this.
```rust
struct Change<Data, Transform> {
	previous: Option<Hash<Connection<Data, Transform>>>,
	transform: Hash<Transform>,
	result: Hash<Data>,
}
```

How would this generalize something like Git?

#### Specialization to the Filesystem (GIt)

Git is just a bunch of files, directories (trees) all compressed and stored as content-addressed blobs in the `objects` directory. It can also further save space by packing different versions of files together using a binary `delta`.

```rust
// Encodes change to object. i.e. a file or directory list
struct ObjectChange {
	previous: Option<ObjectChangeHash>,
	transform: HashOfDiffAlgorithm
	result: ObjectHash
}
struct CommitChange {
	previous: Option<CommitChangeHash>,
	transform: (),
	result: CommitHash
}
```

# Ideas

 - Pull requests and issues can be opened on any file or directory.
 - Since everything is a content-addressed DAG, git repositories can contain other git repositories and share data with other git repositories naturally.
   - People will be able to see using reverse-hash-lookup newer versions of shared files and be able to update them in their own repository.

