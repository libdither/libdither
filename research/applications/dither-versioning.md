# Dither Versioning (dv)

This is a versioning system for versioning any kind of tree structure. It is meant to function as a replacement for git.

# General Structure

`ObjectDelta`: - Generates an Object with a change
 - object: `Link<Object>(link_type: Relevent)`
 - base_object: `Link<Object, Linked>`

`Object`: - Compressed Object, Binary or Text
 - base_object: `Option<ObjectDelta>`
 - compresed data: `List<Byte>`
