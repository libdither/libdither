# The explainer

An interactive walk through the research in this folder: one scrolling page where each idea is a small
live model you can drag and tune, and a toggle switches every word between the two readings (a city, a
network) while the pictures and numbers stay the same.

Open `index.html` in a browser; no server and no network needed. Everything is plain JavaScript.

```bash
xdg-open explainer/index.html                  # or open it from a file manager
node --test explainer/explainer.test.mjs       # 5 tests, about 10 s
```

## What it walks through

1. **A choice is a race.** Options with costs, clocks that ring at random times, the first to ring wins;
   the shares settle on P(j) ∝ e^{−cost/τ} (the logit ⇄ the softmax ⇄ the first spike).
2. **Rent is a price.** A city on a line: commute plus rent comes out equal on every occupied parcel, so
   rent falls by the commute cost per unit distance; a height limit spreads the city unless people can
   leave.
3. **The water level.** The equal cost is a Lagrange multiplier: pour the households into the commute
   valley and the level is the price of one more.
4. **A centre that isn't given.** A plain that wraps around, a pull within a reach and a push over a
   longer one; the regime map (flat, one centre, towns) computed from the kernels, with a draggable dot,
   and the plot of which wave grows.
5. **Where it ends, and how long it takes.** The single-parcel line (the black hole), the dense cluster
   below it, the saturating gain that keeps towns finite, and the onset time with its divergence at the
   border.
6. **Credit is a price.** The bucket brigade: payments passed backward along a chain settle on TD(0)'s
   discounted values, with the tax as the discount.
7. **One idea, and where it stops.** Every price as a multiplier, and the open gaps.

## The models

`engine.js` holds four small models, each the research's equation with nothing else around it: `race`,
`Line`, `Plain` and `Brigade`. `explainer.test.mjs` checks that they give the research's numbers: the
softmax shares, the bid-rent slope, the onset pull of 1.72 at reach 2, four towns at pull 5 and
competition 10, the single-parcel border of 18 at reach 1.25, four finite towns under a saturating
gain, the one-round growth rate, and the brigade's γ^k·R/(β + t).

One difference from the one-model page's average flows is deliberate. The flows re-choose the whole
load every round, which in a stiff regime (a parcel holding most of everything) hops the load between
parcels without settling. The models here let the load relax toward the choice over a stay, as the
page's agents do, with a shorter step where a site is stiff, so they settle where the agents and a
fixed-point solve settle. The fixed points are the same; the transients are not, and the onset rate
here is the eigenvalue of this page's own round (`Plain.predictor`), not the page's
(docs/6 §22, NEXT_STEPS Engineering).

`app.js` draws everything on canvases, runs only the figures on screen, and reads its colours from
`style.css` (light and dark). The palette is the one the walkthrough figures use.
