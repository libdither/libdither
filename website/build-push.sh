#!/usr/bin/env bash
mdbook build dither-spec -d ../public/docs
hugo
pushd public
git commit -am "build"
git push
popd