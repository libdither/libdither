# Do height limits cause sprawl?

The research started from Lars Doucet's video
[“Play-dough explains the American City”](https://www.youtube.com/watch?v=-Qn4iZgQY8k). A lump of
play-dough stands for a city's housing demand, and a lid stands for height limits. Press the lid down and
the dough spreads onto farmland. The video makes four claims:

1. Height limits squish the city out past its limits, onto farmland.
2. The squeezed demand has to go somewhere.
3. Allowing height only downtown gives supertall towers in the middle and sprawl everywhere else.
4. Left alone, a city takes a compact, mid-rise shape (Barcelona is the example).

This doc explains how we tested them with a standard model of a city instead of play-dough, and what came
out. The interactive version is [`../experiments/playdough-city/`](../experiments/playdough-city/).

## The model

It is the textbook model of a city where everyone commutes to one downtown: the Alonso–Muth–Mills
model ([Alonso 1964](https://doi.org/10.4159/harvard.9780674730854);
[Mills 1967](https://www.jstor.org/stable/1821621); notation after
[Brueckner 1987](https://doi.org/10.1016/S1574-0080(87)80006-8)). It's the same model
[Bertaud & Brueckner (2005)](https://doi.org/10.1016/j.regsciurbeco.2004.02.004) used to estimate what
Bangalore's height limits cost its residents.

- **Households** pick where to live. Living farther out costs more commuting, so rent per square foot
  falls with distance by exactly enough to make every location equally good. That line of rent against
  distance is the **bid-rent curve**.
- **How much space people want** responds to rent through one dial, η (both the price and the income
  elasticity of housing demand). η = 0 means fixed home sizes, which is the play-dough assumption: the
  dough can't be compressed.
- **Builders** choose how much floor space to put on each lot. Building taller costs more per square foot,
  and the model's curve for that is fitted to
  [Ahlfeldt & McMillen (2018)](https://doi.org/10.1162/rest_a_00734)'s Chicago estimates: about +10% per
  floor at 2.5 floors, +4% at 15 and +1.6% at 110. Compounded, a 15-story building costs about 2.2× as
  much per square foot as a 2-story one, and a 110-story one about 20×. Because their supertall figures
  rest on few buildings, a slider scales the curve; the common "2% per floor" rule of thumb is one setting
  of it.
- **The city's edge** is where building on land stops beating farming it.
- **Whether people can leave** is a second dial, ε. In a *closed* city nobody leaves, whatever happens. In
  an *open* city people leave until those who stay are as well off as they could be elsewhere.
- **Rules:** a height cap, an exempt downtown radius (the hole in the lid), parking minimums, and an urban
  growth boundary.

**The play-dough limit is exact.** With η = 0 (fixed home sizes) and ε = 0 (nobody leaves), total floor
space is conserved under every rule, parking included. That is the video's assumption, and a test checks
it. Giving each assumption its own dial shows which conclusions depend on it.

**Where does the squeezed space go?** The model tracks floor space pushed out by a rule ring by ring. It
reappears as a taller exempt downtown, denser suburbs inside the old edge, or sprawl past the old edge.
Whatever doesn't reappear was never built, because homes shrank or people left:

```
downtown + denser suburbs + sprawl = squeezed + (new total floor space − old total floor space)
```

## What it found

Default city: 2.5 million households earning $85k, spending 30% of income on housing. Without rules it
peaks at about 4 stories downtown and tapers smoothly to houses about 13 miles out.

| Scenario | Urban land | Households | Tallest building (stories, vs free market) | Share of squeezed space that sprawls |
|---|---|---|---|---|
| 1-story lid, play-dough | +45% | same | 1.0 (4.3) | 30% |
| Lid with a 1-mile hole, play-dough | +42% | same | 5.4 (4.3) | 28% |
| Same, homes can shrink (η = 0.5) | +34% | same | 5.6 (4.4) | 22% |
| Same, some people leave (ε = 2) | +27% | −7% | 5.4 (4.4) | 16% |
| Same, anyone can leave | no change | −35% | 4.4 (4.4) | 0% |
| Superstar metro, lid with hole | +142% | same | 13.5 (8.3) | 78% |
| Superstar, with the cheaper "2% per floor" cost of height | +164% | same | 20.7 (11.3) | 78% |

The verdicts:

1. **Height limits cause sprawl only if nobody can leave.** In a closed city a 1-story limit spreads it
   over 45% more land. In an open city it doesn't spread at all: 35% of households leave instead, and the
   sprawl happens in whatever city they move to, which the model doesn't show.
2. **"It has to go somewhere" is nearly exact in a closed city.** Even when homes can shrink, only about 6%
   of the squeezed floor space goes unbuilt, because the households pushed outward take bigger homes on
   cheaper land. Leaving, not smaller homes, is what breaks the play-dough picture.
3. **The spike's shape is real; its height isn't.** An exempt downtown does get taller than it would
   without any rules. But the tallest it reaches is 13.5 stories, or 21 with cheap height, in the biggest
   preset. That's high-rise, nowhere near supertall (about 80+ stories).
4. **Left alone, the city is a smooth mound, but mostly low-rise.** Fewer than 1 in 5 households live in
   buildings of 3+ stories. Only the superstar preset is mid-rise on average.

Two more results:

- **Most squeezed space doesn't become sprawl. It bulks up existing suburbs** (about 70%); new farmland
  takes 20–30%. The exception is a superstar city, whose whole old footprint is already dense.
- **Limits of 3 stories or more barely matter at this size** (+1% land). The limit that bites is the one
  around single-family scale.

**Who pays?** In a closed city a lid raises total land rent by 45–50%: residents lose 4.5–4.8% of income
and landowners gain. That's within the 3–6% Bertaud & Brueckner found for Bangalore. In an open city,
landowners lose (−20%) and the residents who stay are unaffected.

## What the model leaves out

- Jobs outside downtown, traffic congestion, and office towers (most real skylines are offices).
- Different incomes.
- Time: buildings last decades, and the model shows only the long-run end state.
- Limits on homes per lot, which is how single-family zoning really works; the lid here caps floor space.
- The taste for yards and cheap car commuting. The model city is about 3–4× denser than real US metros of
  its size, and rules explain only part of that gap
  ([Glaeser & Kahn 2004](https://doi.org/10.1016/S1574-0080(04)80013-0)).

## How it was checked

24 model tests cover the equilibrium conditions, the play-dough conservation law, the accounting identity,
detection of rule combinations with no equilibrium, and continuity across ring boundaries. An independent
reviewer (a separate AI agent asked to hunt for errors) found five real bugs and about ten overstatements
in the first version. All were fixed, and each bug got a regression test. See
[`../TRANSCRIPT.md`](../TRANSCRIPT.md#2-the-play-dough-city-24-sep) for the list.

## Where this led

The video's mechanism is "a fixed amount has to go somewhere, and a cap pushes it outward". That is also
how a softmax behaves: its outputs sum to 1, so pushing some down pushes others up. That resemblance is what
started the comparison with neural networks in [doc 2](2-what-plays-land-in-a-network.md). The height limit
became the "lid" setting of the one-model page ([doc 3](3-one-model-two-readings.md)), where a firing-rate
cap does the same thing to a layer of neurons.
