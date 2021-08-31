# Dither-git

Extension for Git allowing for interaction with git repositories hosted on Dither. 

# Ideas

 - Pull requests and issues can be opened on any file or directory.
 - Since everything is a content-addressed DAG, git repositories can contain other git repositories and share data with other git repositories naturally.
   - People will be able to see using reverse-hash-lookup newer versions of shared files and be able to update them in their own repository.

# Trait Ideas

`Binary`
 - data: `List<Byte>` - file data blob

`File` 
 - name: `String`,
 - creation_date: `Timestamp`,
 - data: 

`Directory`
 - files: `List<Link<File>>`

`GitObject`
 - changed_file: 
 - - Contains `Link` to `File` or `Directory` & `Link` to previous `GitObject`.

`Commit` - Contains list of `GitObject`s that represent changed files / directories and previous `Commit`

`GitRepo` - Contains latest `Commit`

