# One model, two readings

A single model of how located capacity gets shared out, drawn two ways: as a land economy and as a
neural network. Companion to `../playdough-city/` and `../neural-city/`.

Open `index.html` in a browser. It is one self-contained file with no build step and no network
requests. Pick a row of the architecture table to switch settings; `#mixed`, `#experts` and the other
row ids work as links. **Follow one arrival** pauses the simulation and walks through a single choice in
both vocabularies: what every option costs this arrival, its own taste noise, what it picks, and how that
moves the rent ⇄ adaptation.

Underlined terms (119, in `GLOSSARY`) and blue author–year citations (86 references, in `REFS`)
open a popup on hover. Click, tap or press Enter to pin it: a pinned popup's own terms and citations open
in place (Back returns), and its links go out to Wikipedia, DOIs and arXiv. Write `[[key|text]]` for a
term, `[[@key]]` or `[[@a;b]]` for a citation, and `$r_j^2$` for inline math. Every DOI and arXiv id
was checked against its metadata, and every Wikipedia title against the API.

```bash
node --test experiments/one-model/model.test.mjs   # ≈50 s: each setting with both solvers, plus the formal claims
```

## The model

Arrivals of type k from source s pick a site j, or take an outside option, by a logit (softmax) choice:

    U = −t·d(s, j) − p_j − m·(1 − fit_kj) − ν·clash_kj + ρ·log(1 + use_j)
    P(k from s picks j) ∝ exp(U / τ)

Each site's price p_j rises with its load and can be capped. Each site's tuning (fit) follows what it
serves, and with spillovers, what its neighbours serve.

The page states the model once in symbols ("The model in symbols"), then pairs every symbol with its
meaning in each field and says why the pairing is exact: which standard model in each field has that
exact form. The core facts:

- **Taste noise ⇄ escape noise.** Adding Gumbel tastes and taking the best (the logit) is the same law
  as neurons racing to fire at rates e^(−c/τ) (a winner-take-all layer with escape noise), because minus
  the log of an exponential time is Gumbel.
- **Rent ⇄ adaptation** is κ·load, the slope of a cost κ·load²/2: the cost of building up ⇄
  self-inhibition. Fixed supply ⇄ a set point, and relative fees ⇄ load balancing, are the same resting
  point reached by different steps: Sinkhorn's log step for attention, and DeepSeek's fixed sign step for
  the experts.
- **The equilibrium minimizes a free energy.** For steady demand and fixed tuning, the average flows
  minimize F = commuting + building + mismatch + ν·κ·Σ r_A·r_B − scale term + τ·Σ x·log x, and every price
  is a Lagrange multiplier: Beckmann's potential plus Wilson's entropy in transport economics, an energy
  at temperature τ (entropic optimal transport, with a fixed supply) in machine learning.
- **What F leaves out:** sticky prices (they depend on history), and the tuning rule, which is
  competitive learning ⇄ refitting toward the mix served rather than the minimizer of F. F also counts
  only half the nuisance each pair of uses actually suffers: that gap is the externality, and charging it
  (a Pigouvian tax) lowers the true total cost.

The page solves the model in two ways; a knob switches between them.

- **Individual agents (the default).** Every arrival is one agent: a household ⇄ an input spike. It
  draws its own taste noise, picks a site, stays a random time (20 time units on average) and leaves.
  Floor space in use is the number present, and each occupant ⇄ live spike trace adds the same amount
  to the rent ⇄ adaptation. Balancing biases and set points respond to recent arrivals, as they do in
  mixture-of-experts routers and homeostasis.
- **Average flows.** The expected number choosing each site, solved directly (a mean-field solution).

The agents' long-run averages match the flows. On the land market the load profiles differ by about
2%, and rents follow the bid-rent line. The flows are the agents' many-agent limit (Kurtz 1970).

A built stock follows sustained use up over about 200 time units and down over about 1000. Floors
that are built but empty are drawn faded.

| Setting | Economy | Neural network |
|---|---|---|
| `land` | Land market | Competitive layer with adaptation |
| `lid` | Height limit | Firing-rate cap |
| `taxes` | Taxes on land, buildings and residents | Global inhibition and stronger adaptation |
| `sorting` | Offices take the centre, homes the rings | Fast inputs claim the nearest neurons |
| `districts` | Districts form by themselves | Ocular-dominance columns |
| `mixed` | Mixed use vs single-use zoning | Shared (superposed) vs dedicated neurons |
| `tenure` | Hotels vs homes | Plastic vs consolidated neurons |
| `experts` | Firms with fees and capacity | Mixture of experts with load balancing |
| `attention` | Commuting along a corridor | Attention over a sequence |

## What the tests check

Every claim is checked with the average flows, and again with individual agents.

- **Land:** rents approach the Alonso bid-rent line μ − t·d as taste variety ⇄ temperature goes to
  zero.
- **Height limit:**
  - A limit spreads the city when nobody can leave, and raises rents.
  - An exempt downtown builds taller than with no limit at all.
  - When people can leave, most of the sprawl goes away.
  - With agents, no building ever holds more than the limit.
- **Sorting:** offices ⇄ fast inputs take the inner rings. When conversion ⇄ retuning is expensive, a
  random layout locks in.
- **Districts:** districts ⇄ columns form without a centre, and widen with spillovers ⇄ lateral spread.
- **Mixed use:** uses active at the same time separate on their own. With agents they are apart at
  every moment, but the boundary between them wanders over time, which average flows can't show.
  - **Slow day/night alternation:** one set of parcels serves both uses in turn, beating zoning on cost
    and on empty floor space.
  - **Fast alternation, agents:** zoning makes little difference either way.
  - **Fast alternation, average flows:** zoning wins if prices reset while a parcel is empty. That is a
    solver effect: those prices recover slowly, which hands a returning zoned use a rush discount.
- **Hotels vs homes:** at 90% presence, homes ⇄ dedicated neurons are cheapest, narrowly. At 15%, they
  cost the most and stand emptiest. Dedicated space is built for each occupant's busiest moment; shared
  space only for the busiest moment of everyone together.
- **Experts:**
  - With no balancing, one expert takes everything. The balancing bias follows DeepSeek's rule exactly
    (a fixed step toward the average load each moment) and evens the load to within about 3%.
  - An expert over capacity drops the overflow, and the router can't see that it's full, as in Switch
    Transformer. At capacity 1× the average, average flows drop almost nothing (0.4%) and individual
    tokens drop about 9%, which is Erlang's loss formula B(80, 80). With 4× more, smaller agents it halves.
  - Collapse needs ρ/τ > 1 + r₀/load (1.2 here): the even split is stable at ρ/τ = 1 and collapses at 1.5.
- **Attention:** plain softmax makes hubs, and Sinkhorn prices even out the load.
- **Following one arrival:** the inspected choice is a true logit draw, and committing it adds one
  household to its site.
- **The formal claims:**
  - At the flows' resting point every price equals κ × load, and random moves of arrivals raise F.
  - Charging the unpriced half of the nuisance lowers the true total cost.
  - A fixed supply ends with every site at its set point (Sinkhorn).
  - A race of exponential clocks picks sites with the logit probabilities.
  - Capacity overflow matches Erlang B and shrinks with more agents.
  - The collapse threshold falls between ρ/τ = 1 and 1.5, as predicted.

### Taxes

Only taxes whose network counterpart is exact are in. Each is tested.

| Tax | In the model | Neural network | What it does |
|---|---|---|---|
| On land value | a share of the landowner's residual p·r − (1+θ)·κ·r²/2, which is in no cost | nothing: a network has no landowner | revenue only; loads are identical to the untaxed city in both solvers |
| On buildings | κ → (1+θ)·κ | stronger adaptation per spike (heavier self-inhibition) | identical to a higher building cost; shorter buildings, a wider city (213 → 277 parcels at θ = 0.5) |
| Per resident | +H at every site | global inhibition: the same inhibition on every neuron (Nessler et al. 2013) | a closed city doesn't move (softmax shift invariance); with free migration, rents fall by about H (capitalization) |
| Pigouvian, on nuisance (mixed setting) | the nuisance an arrival causes, charged again | the interference a feature causes others, which a total-loss gradient counts | exactly ν counted twice; lowers the true cost when nuisance is weak, only a local optimum when it's strong |
| Per unit of distance | adds to t | a steeper wiring cost / ALiBi slope | what the commute knob does |

Left out because nothing here responds to them: a vacancy tax, a transfer tax, a Harberger tax and a road congestion toll.

Checking the per-resident tax exposed one more solver artifact. Agents compared their noisy logsum against
a reference from average flows, and noise raises a logsum by about 0.18, so the first 0.18 of any tax
drove nobody away. Agents now judge moving on their logsum averaged over a stay, against a reference
measured with agents.

### A correction from the previous round

The page used to say that tight expert capacity drops 27% of individual tokens against 20% for average
flows "because load fluctuates". Checking it with more agents disproved that explanation: at 64× the
agents it was 34%, with 16% of capacity idle. The excess came from rules that didn't match mixtures of
experts. The router saw which experts were full, and a waiting-list price and the outside option pushed
tokens away. Experts now drop overflow the way Switch Transformer does, and what remains is exactly the
Erlang loss.

The page ends with "Where the correspondence breaks":

- Floor space in use is a flow, and the built stock doesn't feed back into anything.
- Prices here ration capacity but transfer nothing.
- Spikes don't choose; the race chooses for them.
- Agents and averages agree only on averages.
- Prices that remember are outside F, and cities and brains remember on different timescales.
- Tuning follows the mix served; it isn't optimized.
- Trained networks internalize externalities; this model's arrivals don't.
- This model covers one layer, not a production chain.
