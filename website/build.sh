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
