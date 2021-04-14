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

## Downloading Packages
This is handled by Dither.
Package name is mapped to a release hash tree w/summary and the desired version is selected.