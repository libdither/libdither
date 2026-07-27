# www.dither.link website

Website for Dither, hosts the entirety of [libdither/dither-spec](https://github.com/libdither/dither-spec) in addition to an introduction to Dither

More to be added in the future (such as a blog and perhaps a simple commenting system).

## Publishing

Pushing to `main` builds and deploys the site to <https://dither.link> via
GitHub Actions (`.github/workflows/deploy.yml`). There is nothing to run by
hand — `public/` is build output and is no longer committed.

To publish a change to the spec:

```sh
cd dither-spec
# edit, then
git commit -am "..." && git push
cd ..
git commit -am "dither-spec: ..." dither-spec   # bump the submodule pointer
git push                                        # triggers the deploy
```

## Local development

Requires [nix](https://nixos.org) with flakes (or hugo-extended, mdbook and
mdbook-katex on `PATH`). `direnv allow` picks up the devshell automatically.

```sh
nix develop        # hugo-extended, mdbook, mdbook-katex
hugo server        # live preview of the site shell
./build.sh         # full build (site + /docs/) into public/
```

CI pins the same tool versions the devshell provides, so a local `./build.sh`
produces byte-identical output to a deploy. When bumping `flake.lock`, update
the pinned versions in `.github/workflows/deploy.yml` to match.
