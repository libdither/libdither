# Play-dough City

An interactive test of Lars Doucet's
[“Play-dough explains the American City”](https://www.youtube.com/watch?v=-Qn4iZgQY8k),
using a standard urban-economics model instead of play-dough.

The video's claims:

1. Height limits squish the city out past its limits, onto farmland.
2. The squeezed demand has to go somewhere.
3. Allowing height only downtown produces supertalls in the middle and sprawl everywhere else.
4. Left alone, the city would take a compact, mid-rise shape.

The page scores each claim live against whatever rules and assumptions you set.

## Run it

```bash
node experiments/playdough-city/serve.mjs                # http://localhost:5180/
node --test experiments/playdough-city/model.test.mjs    # model tests
```

There's no build step. three.js loads from a CDN, so the page needs a network connection.

## The model

A monocentric city (Alonso 1964; Muth 1969; Mills 1967; notation after Brueckner 1987) with the land-use
rules analysed by Bertaud & Brueckner (2005). All the economics lives in `model.js`, which is pure and has no
DOM dependencies.

- **Households** all commute to one downtown. Rent per sq ft falls with distance by exactly enough to offset the
  extra commute, so everyone is equally well off. Preferences are Stone–Geary and calibrated so that a household
  earning $85k spends 30% on ≈1,600 sq ft. One dial sets how much floor space people give up when rent rises:
  the price elasticity η, which is also the income elasticity. η = 0 means fixed home sizes: incompressible,
  like play-dough.
- **Builders** choose floor space per lot to maximise land rent. Construction cost per sq ft rises with height,
  with elasticity θ(h) = max(0.25, s·0.164√h).
  - At s = 1 this matches the per-floor cost increases Ahlfeldt & McMillen (2018, Table 6) report at 2.5, ≈15
    and 110 floors: ≈10%, ≈4% and ≈1.6% per floor. Compounded, that is ≈2.2× the 2-story cost per sq ft at
    15 stories and ≈20× at 110.
  - Their tall-building figures are sample-average slopes, and the supertall one rests on engineering
    estimates. So s is a "cost of building tall" slider. s ≈ 0.72 reproduces the 2%-per-floor rule of thumb
    (≈9× at 110 floors).
  - The 0.25 floor makes low-density housing Cobb–Douglas with a 20% land share.
- **Land** is urban where its lots (60% of it; the rest is streets and parks) out-earn farm rent plus the yearly
  cost of new roads and pipes, and only inside the growth boundary if there is one. That sets the edge.
- **Population** is fixed ("can't leave the table"), fully mobile (an open city: people leave until residents
  are as well off as with no rules), or in between: N ∝ (real income)^ε.
- **Rules:**
  - Height cap in stories on half the lot. 1 story is FAR 0.5, about the floor space of a typical
    single-family lot.
  - Exempt downtown radius: the hole in the lid.
  - Parking minimums. Builders choose surface lots, which use land, or garages, which cost money. For a fixed
    building height, profit is linear in the surface share, so the optimum is all one or the other. Rings are
    split exactly where it switches.
  - Urban growth boundary.

**The play-dough limit is exact.** With η = 0 and ε = 0, total floor space is conserved under any rule,
parking included. That's the video's volume-conservation assumption, and the tests check it. Each assumption
gets its own slider, so you can see which one the video's conclusions depend on.

**No equilibrium is reported, not hidden.** Some combinations have no equilibrium: a free market that can't
house N households at any rent, or play-dough in a closed city with a lid and a growth boundary. The page says
so, instead of scoring claims against a wrong answer.

**Where did it go?** Floor space squeezed out by the rules is tracked ring by ring. It reappears as taller
exempt downtown, denser suburbs inside the old edge, or sprawl past the old edge, with the ring straddling the
old edge split by area. Otherwise it is never built, on net, because homes shrink or people leave:

```
downtown + suburbs + sprawl = squeezed + (city floor space − free-market floor space)
```

With flexible home sizes the net change can even be positive: households pushed out to cheaper land take bigger
homes.

## What it says (default "big metro": 2.5M households)

The free market peaks at ≈4 stories downtown and tapers smoothly to houses ≈13 miles out, with no plateau and
no spike. But it's mostly low-rise: fewer than 1 in 5 households live in buildings of 3+ stories. Scenarios,
compared with that free-market city:

| Scenario | Urban land | Households | Tallest, stories (free market) | Sprawl | Never built | Rent, same place | Cost to residents (% income) | Land rent |
|---|---|---|---|---|---|---|---|---|
| 1-story lid, play-dough | +45% | ±0% | 1.0 (4.3) | 30% | 0% | +18% | 4.8% | +50% |
| Lid with 1-mile hole, play-dough | +42% | ±0% | 5.4 (4.3) | 28% | 0% | +17% | 4.5% | +48% |
| Lid with hole, homes can shrink (η 0.5) | +34% | ±0% | 5.6 (4.4) | 22% | 6% | +17% | 4.5% | +45% |
| Lid with hole, some migration (ε 2) | +27% | −7% | 5.4 (4.4) | 16% | 25% | +13% | 3.7% | +31% |
| Lid with hole, free migration | ±0% | −35% | 4.4 (4.4) | 0% | 100% | ±0% | 0.0% | −20% |
| Parking 1 per 1,000 sq ft, ε 2 | +15% | −4% | 4.1 (4.4) | 18% | 42% | +8% | 2.2% | +9% |
| Lid with hole + growth boundary at the free-market edge, ε 2 | ±0% | −8% | 5.5 (4.4) | 0% | 33% | +15% | 4.2% | +38% |
| Superstar metro, lid with hole, play-dough | +142% | ±0% | 13.5 (8.3) | 78% | 0% | +62% | 12.8% | +115% |
| Same, with the 2%-per-floor cost rule | +164% | ±0% | 20.7 (11.3) | 78% | 0% | +66% | 13.6% | +140% |

"Sprawl" and "Never built" are shares of the squeezed floor space. "Land rent" is total urban land rent over
farm rent.

Takeaways:

- **Claim 1 holds, but only because nobody can leave.** Closing the city matters more than the lid does. When
  people can move freely, the lid doesn't widen the city at all: 35% of households leave instead. Those people
  need homes somewhere else, which this model doesn't show.
- **Claim 2 is nearly exact for a closed city.** Homes at a given spot shrink ≈7% when they can, but displaced
  households take bigger homes farther out, so on net only ≈6% of the squeezed floor space goes unbuilt.
  Migration, not compressible demand, is what breaks the play-dough picture.
- **Most squeezed floor space doesn't become sprawl. It bulks up the existing suburbs.** New farmland takes
  20–30% in the default city. The lid flattens the lump into a wider pancake, and only its rim crosses the old
  edge. In a superstar city, where the whole old footprint is already dense, sprawl takes three quarters.
- **Claim 3's shape is real. How spiky it gets depends on the cost of building tall,** the least certain input.
  In the default city the exempt downtown only gets ≈25% taller. In a big, rich metro it goes from 8 to 13.5
  stories, or from 11 to 21 with the flatter 2%-per-floor cost rule, while the footprint more than doubles.
  That's high-rise, not supertall: the spike's shape holds, its height doesn't.
- **Claim 4 depends on the city.** The free-market shape is always a smooth mound, with no plateau and no
  spike, and that part holds. But the default metro is a low-rise city with a small mid-rise core (4+ stories),
  not Barcelona. Only the superstar metro is mid-rise on average: the average household's building has ≈4
  stories. Barcelona's own mid-rise form owes a lot to height rules.
- **Height limits of 3+ stories barely bind at this city size** (+1% urban land). The lid that bites is the low
  one, around the floor space of single-family lots.
- **Who pays?** In a closed city the lid raises total land rent by ≈45–50%: a transfer from residents to
  landowners, on top of the residents' losses. In an open city, landowners bear the cost (−20%) and the
  residents who stay are unaffected.
- **Magnitudes** are in the range Bertaud & Brueckner (2005) found for Bangalore's floor-area limits: 3–6% of
  household consumption.

## What it leaves out

- Jobs outside downtown, congestion, and commercial towers. Real downtown skylines are mostly offices.
- Different incomes, so there's no luxury-condo effect.
- Time. Buildings last decades, and this shows the long-run end state.
- Limits on homes per lot and minimum lot sizes, which is how single-family zoning actually works. The lid here
  caps floor space.
- Preferences for yards and cars. The free-market city here (≈12,000 people per sq mi) is roughly 3–4× denser
  than real US metros of the same size, and the rules explain only part of that gap. Cheap car commuting is a
  big part of the rest (Glaeser & Kahn 2004). Try the commuting-cost slider.
- Parking people would want anyway. The parking slider treats every required space as unwanted, so read it as
  an upper bound.
- The exempt downtown radius snaps to the model's 50 m rings, a population error below 0.1%.

## Files

| File | What it is |
|---|---|
| `model.js` | The equilibrium model: supply, demand, solvers, "where did it go" accounting |
| `model.test.mjs` | Equilibrium conditions, comparative statics, the play-dough limit, accounting identity, no-equilibrium detection, continuity |
| `app.js` | Controls, guided tour, and the live verdict on each claim |
| `scene.js` | three.js view: block volume is floor space; the free-market ghost, the lid, the brown paper |
| `charts.js` | Cross-section chart and the "where did it go" bar, each with a table view |
| `serve.mjs` | Zero-dependency static server |

## Sources

- Alonso (1964) *Location and Land Use*; Muth (1969) *Cities and Housing*; Mills (1967) AER 57(2).
- Brueckner (1987), *The structure of urban equilibria: a unified treatment of the Muth–Mills model*,
  Handbook of Regional and Urban Economics vol. 2.
- Bertaud & Brueckner (2005), *Analyzing building-height restrictions: predicted impacts and welfare costs*,
  Regional Science and Urban Economics 35(2).
- Ahlfeldt & McMillen (2018), *Tall Buildings and Land Values: Height and Construction Cost Elasticities in
  Chicago, 1870–2010*, Review of Economics and Statistics 100(5).
- Hanushek & Quigley (1980), *What is the price elasticity of housing demand?*, REStat 62(3).
- Glaeser & Kahn (2004), *Sprawl and urban growth*, Handbook of Regional and Urban Economics vol. 4.
