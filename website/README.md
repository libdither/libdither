# www.dither.link website

Website for Dither, hosts the entirety of the Dither spec (the repo's
`research/` directory, rendered at `/docs/`) in addition to an introduction
to Dither

More to be added in the future (such as a blog and perhaps a simple commenting system).

## Publishing

Pushing to `main` builds and deploys the site to <https://dither.link> via
GitHub Actions (`.github/workflows/deploy.yml`). There is nothing to run by
hand — `public/` is build output and is no longer committed.

The spec lives directly in this repo at `research/` — edit it, commit, and
push like any other file; a push to `main` touching it triggers the deploy.

The disp interactive walkthrough (`/disp/interactive-walkthrough.html`) is not
a submodule: `build.sh` fetches it from the disp repo pinned to the commit in
its `DISP_REV` variable. Bump that rev to publish a newer walkthrough.

## Local development

Requires [nix](https://nixos.org) with flakes (or hugo-extended, mdbook,
mdbook-katex and lychee on `PATH`). `direnv allow` picks up the devshell automatically.

```sh
nix develop        # hugo-extended, mdbook, mdbook-katex, lychee
hugo server        # live preview of the site shell
./build.sh         # full build (site + /docs/) into public/
```

CI pins the same tool versions the devshell provides, so a local `./build.sh`
produces byte-identical output to a deploy. When bumping `flake.lock`, update
the pinned versions in `.github/workflows/deploy.yml` to match.

`build.sh` ends by running [lychee](https://github.com/lycheeverse/lychee) over
`public/` and fails on any internal link whose target was not generated (a
typo in a path, or a spec page that exists but is not listed in
`research/SUMMARY.md` -- mdbook only renders chapters listed there). Known
dangling links that predate the check are allowlisted in `.lycheeignore`;
remove an entry once its page is listed or the link is fixed.
