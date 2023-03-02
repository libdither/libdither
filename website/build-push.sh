#!/usr/bin/env bash
mdbook build dither-spec -d ../public/docs
hugo
pushd public
git add .
git commit -m "build"
git push
popd
# Only commit & push build directory
git restore --staged .
git add public
git commit -m "update build"
git push