# Dithix
Solves the packaging problem

Takes ideas from: Nix

Features of a good package manager:
 - Download packages
 - Run packages
 - Update packages
 - Hack on packages
 - Deploy packages
 - Reproducibly configure packages across many different systems
 - Package storage & versioning + deduplication

Package trait is valid if the output is built from the derivation

## Downloading Packages
This is handled by Dither.
Package name is mapped to a release hash tree w/summary and the desired version is selected.

## The dependency network
All package managers need to manage dependency downloading and configuration. They need to be able to manage multiple versions of the same library.
Dynamically linked executables are very much desired in Dithix for efficiency so packages are preferred to split compilation into multiple linked derivations instead of one single one.

It works exactly like a hash tree. All packages contain the hash of their inputs and compiled packages can be looked up on the network with unique names. 

## Packages on Dither
Package definitions are created using a functional configuration language (i.e. [tweag/nickel](https://github.com/tweag/nickel)).

- Trait "Script"
  - parser: Nickel / Nix / Whatever functionnal configuration language
  - file: File

- Trait "Derivation"
  - builder: Package *// Package that builds the output*
  - inputs: List\<Package\> *// Input Packages*

- Trait "Package" *// Is valid if output is reproducibly producted from derivation which is reproducibly produced from definition*
  - definition: Script *// Parsed into a the derivation*
  - derivation: Derivation *// Compiled into an output*
  - output: Multihash *// Contains everything needed to run a program*
