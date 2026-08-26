#!/usr/bin/env bash
# Build the full site into public/. Used by both `nix develop` locally and CI.
set -euo pipefail
cd "$(dirname "$0")"

# Hugo never removes stale output, so old fingerprinted assets accumulate
# across builds. Start clean instead.
rm -rf public

# Hugo first: it owns the site root. mdbook then fills in /docs/ underneath.
hugo --gc
mdbook build dither-spec -d ../public/docs

# dither-spec/book.toml sets src = ".", so mdbook copies every non-markdown
# file in the submodule into the output -- including its git metadata and any
# stale build dir left behind by running `mdbook build` there without -d. A
# fresh CI checkout has neither; drop them so local builds match.
rm -rf public/docs/.git public/docs/public

# Fail on dangling internal links. Offline: only file links are checked, never
# http(s). --base resolves root-relative hrefs (/docs/...) from the Hugo pages
# against public/. print.html is mdbook's concatenation of every chapter, and
# its rewritten relative links are artifacts of that concatenation, not of the
# sources. Known-dangling links that predate this check are allowlisted in
# .lycheeignore, which lychee reads from the working directory.
lychee --offline --no-progress --base public \
  --exclude-path public/docs/print.html public
