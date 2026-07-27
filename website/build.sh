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
