#!/usr/bin/env bash
mdbook build dither-spec -d ../public/docs
hugo
pushd public
git commit -am "build"
git push
popd
# Only commit & push build directory
git commit -m "update build" -- public
git push