# What plays the role of land in a learning system?

If the play-dough video ([doc 1](1-height-limits-and-sprawl.md)) describes something real about cities, does
the same thing happen inside learning systems? Answering that means first deciding what "land" would be in
a network. This doc follows that search: the first guesses and why they failed, a test for land, the
answer that passed it, and two extra dimensions (sharing and individuation) that came out of it.

The simulations are in [`../experiments/neural-city/`](../experiments/neural-city/).

## First guesses, and what was wrong with them

- **Weights as land.** Weight decay charges every weight a fixed fraction of its size each step, like a
  land value tax charges holding land. But weights fail most tests for land: they have no location of
  their own (the hidden units of a layer are interchangeable), and their value is what training produced.
  Weights are **capital**, and weight decay is **depreciation** (a weight survives only if returns keep
  rebuilding it), not a land tax.
- **Gradient descent as a central planner.** Also wrong. [LeCun (1988)](http://yann.lecun.com/exdb/publis/pdf/lecun-88.pdf)
  derived backprop as computing Lagrange multipliers, and Lagrange multipliers are shadow prices: each
  unit gets one number, how much the loss changes per unit of its output. A weight's update combines that
  price with what the unit itself saw. Local knowledge plus a price is
  [Hayek (1945)](https://www.jstor.org/stable/1809376)'s description of a market, not a plan. Predictive
  coding, which uses only local errors, reaches the same prices at equilibrium
  ([Whittington & Bogacz 2017](https://doi.org/10.1162/NECO_a_00949)).
- **Latent directions as land.** Closer: a residual stream has a fixed number of dimensions, and a
  direction's value depends on what sits near it. If a layer is a product W = AB and both factors pay
  weight decay ‖A‖² + ‖B‖², the cheapest way to build a given W costs twice the sum of its singular
  values. So weight decay acts as a flat charge on how intensively each direction is used, and zeroes out
  low-value directions
  ([Kobayashi et al. 2024](https://arxiv.org/abs/2410.23819)). But many features share one direction in
  superposition, so latent space isn't used exclusively the way parcels are.

### Low- versus high-dimensional land

Cities and latent spaces have the same two forces: complementary things attract (agglomeration ⇄
alignment) and unrelated things repel (congestion ⇄ interference). Contrastive learning optimizes exactly
these two terms on a sphere ([Wang & Isola 2020](https://arxiv.org/abs/2005.10242)). What differs is
which is scarce:

- **In 2D, closeness is scarce.** At most 6 equal circles can touch one. You can't sit next to everything
  you complement, so being close is valuable, and that value is rent.
- **In high dimensions, closeness is nearly free.** The number of touching neighbours grows exponentially
  with dimension (12 in 3D, 196,560 in 24D). The scarce thing becomes interference.

So a space is more land-like the lower its dimension, or the costlier distance in it. t-SNE's "crowding
problem" ([van der Maaten & Hinton 2008](https://jmlr.org/papers/v9/vandermaaten08a.html)) gives a way to
picture a city: a 2D embedding of the economy's high-dimensional "who benefits from being near whom".
The cortex is a literal case: a 2D sheet with a wiring cost, whose maps are modelled as exactly this kind
of dimension reduction ([Durbin & Mitchison 1990](https://doi.org/10.1038/343644a0)).

## A test for land

Six properties, all of which urban land has. The capacity must be:

1. fixed in amount;
2. tied to a location whose value comes from access;
3. used exclusively;
4. able to be used more intensively, at a rising cost;
5. backed by an outside use at the margin (farmland at the city's edge);
6. allocated by a local price, not a planner.

| Candidate | Verdict |
|---|---|
| Weights | Capital: produced by training, no location |
| Units in an ordinary network | Interchangeable and with no capacity limit, so nothing for a rent to ration |
| Latent dimensions | Shared rather than exclusive |
| Bits per parameter | A real "taller vs. more land" trade-off ([Kumar et al. 2024](https://arxiv.org/abs/2411.04330)), but no location |
| Chip memory hierarchy | A literal bid-rent curve (near memory is fast, scarce, dear), but caching rules allocate it, not learning |
| Mixture-of-experts capacity | Exclusive and priced by a balancing bias, but no geography |
| **Adapting neurons competing on a sheet** | **Meets all six** |

## The match: adapting neurons on a sheet

Neurons sit on a sheet. Input events arrive at a centre, and each event goes to the neuron with the lowest
cost: conduction distance plus the neuron's **adaptation**, a level that rises with every spike it fires
and decays over time.

| City | Network |
|---|---|
| Parcel of land | Neuron (fixed number, fixed position) |
| Distance to downtown | Conduction distance from where inputs arrive |
| Household | An input event, handled by one neuron |
| Floor space | Firing rate |
| Rent | Adaptation level |
| Cost of building tall | How adaptation decays: steady decay gives a cost that rises with rate; a fixed target rate gives a hard cap |
| Height limit | Maximum firing rate |
| Farmland past the edge | Neurons that stay silent |
| People leaving | Inputs the network ignores |
| Building type; redevelopment | The neuron's tuning, learned by a Hebbian rule; the cost of retuning it |

**Why it's exact rather than an analogy.** Raising a price when a resource is overused and lowering it when
underused is textbook price adjustment toward supply meeting demand. The noisy competition among neurons
gives exactly the logit choice that urban economists use for location (proved in
[doc 6](6-derivations.md#1-the-logit-is-a-race-of-exponential-clocks)). So the equilibrium conditions are
the city's own.

**Known pieces.** Reading neural thresholds as Lagrange multipliers is established
([Zylberberg, Murphy & DeWeese 2011](https://doi.org/10.1371/journal.pcbi.1002250)), and so is reading
homeostatic changes in excitability as dual gradient ascent (Habenschuss, Bill & Nessler 2012). I found
nobody connecting either to land rent, or checking a city's predictions against them.

**Why a network would use prices at all.** Among decentralized mechanisms that reach efficient, voluntary
allocations, the price mechanism needs the smallest messages
([Mount & Reiter 1974](https://doi.org/10.1016/0022-0531(74)90012-X)), and it is the only one that does
([Jordan 1982](https://doi.org/10.1016/0022-0531(82)90088-6)). Those theorems are about exchange
economies, so here they are a suggestion, not a proof. But one number per scarce resource is exactly what
an adaptation variable is.

### Simulation

901 neurons, compared with the city model's equilibrium on the same grid
([`rents-and-lids.mjs`](../experiments/neural-city/rents-and-lids.mjs)):

| Rule | Neurons in use: theory (sim) | Mean distance: theory (sim) | Inputs handled: theory (sim) |
|---|---|---|---|
| None | 249 (258) | 4.49 (4.57) | 100% |
| Firing-rate cap | 305 (305) | 5.60 (5.60) | 100% |
| Cap, centre exempt | 285 (286) | 4.87 (4.91) | 100% |
| Cap, some inputs can leave | 277 (277) | 5.16 (5.19) | 84% (85%) |
| Cap, inputs leave freely | 249 (252) | 4.99 (5.01) | 78% (78%) |

The video's results carry over: a cap spreads the network over 22% more neurons when no input can leave;
when inputs can leave freely, nothing spreads and 22% of them are dropped; an exempt centre fires about 5%
faster than with no cap at all.

With two input types that differ in how costly delay is, and tuning learned by a Hebbian rule, the urgent
type takes the inner ring and the routine type the outer ring, with the boundary where Alonso's theory puts
it ([`land-use-sorting.mjs`](../experiments/neural-city/land-use-sorting.mjs)). When retuning a neuron is
expensive, whatever layout forms first gets locked in: durable buildings in a city, a critical period in a
brain. That wasn't designed in; it emerged.

## Sharing: superposition as mixed land use

Superposition (several features sharing one unit or direction) is land used in shared mode, and
interference is the nuisance between uses. Heavy industry next to homes is two uses that can't share; an
office and a church sharing a parking lot is two that can.

The rule for when uses can share isn't whether they're different. It's whether they peak at the same time,
within the time their effects linger. The same rule appears in several places:

- [Toy Models of Superposition](https://transformer-circuits.pub/2022/toy_model/index.html): features
  active together get perpendicular directions; features that never co-occur share one.
- [Dorrell et al. (2024)](https://arxiv.org/abs/2410.06232) prove a version: mixing is preferred when two
  signals don't reach their extremes at the same time.
- Statistical multiplexing in networking, and Jane Jacobs's case for mixed use (people on the street at
  different times of day).

In simulation ([`sharing-and-zoning.mjs`](../experiments/neural-city/sharing-and-zoning.mjs)), uses active
at the same time separate on their own, with no zoning rule and no bigger footprint. Uses that alternate
slowly share neurons, and zoning them apart spreads the city 46%.

*What happens when uses alternate quickly is disputed between two solvers.* This script finds zoning ahead;
the later agent-based re-run on the one-model page found it roughly a tie. See
[`../NEXT_STEPS.md`](../NEXT_STEPS.md#unresolved-results).

**Why a trained network needs no zoning but cities do.** Each event counts the nuisance it suffers, not the
nuisance it leaves behind, so the equilibrium undercounts nuisance by half
([doc 6](6-derivations.md#3-the-nuisance-is-counted-half)). A network trained by gradient descent on one
loss counts both halves, like [Coase (1960)](https://doi.org/10.1086/466560)'s world of free bargaining.
Cities and networks that learn by local rules don't.

The US ruling that established zoning,
[*Euclid v. Ambler* (1926)](https://supreme.justia.com/cases/federal/us/272/365/), bundled two different
things: separating industry from homes (a real nuisance between co-active uses) and keeping apartments out
of single-family districts (density exclusion, the video's subject).

## Individuation: hotels and homes

A separate axis is how much the occupant may reshape its space, keep others out, and for how long. Economics
already has a graded version ([Schlager & Ostrom 1992](https://doi.org/10.2307/3146375)): authorized users
may use a resource; claimants may also improve it; proprietors may also exclude others; owners may also
sell. Hotel versus home is a climb up that ladder; in a network it's plastic versus consolidated units.

Customizing a space for one occupant makes it worse for everyone else, so customized space tends to be
dedicated (homes) and generic space shared (hotels). In simulation
([`hotels-and-homes.mjs`](../experiments/neural-city/hotels-and-homes.mjs)), with eight occupant types
that come and go, cost per event:

| Value of customization | Share of time each type is present | Homes | Hotels | Customization follows use |
|---|---|---|---|---|
| low | 10% | 14.49 | 11.38 | **10.62** |
| low | 90% | **8.97** | 9.81 | 9.02 |
| high | 50% | 10.58 | 11.74 | **9.58** |

Dedicated space wins only when occupants are nearly always present; otherwise it sits empty, like second
homes. Customization that follows use (usufruct, in property terms) beats both unless presence is nearly
constant. This is Toy Models of Superposition's finding (frequent features get dedicated dimensions,
sparse ones share) posed as a housing question.

The literature search turned up one rule that recurs across scales: **a whole protects each part in
proportion to how much it depends on that part.**

- Weights: EWC protects parameters in proportion to how much the loss depends on them
  ([Kirkpatrick et al. 2017](https://doi.org/10.1073/pnas.1611835114)).
- Units: continual backprop resets the least useful ones ([Dohare et al. 2024](https://doi.org/10.1038/s41586-024-07711-7)).
- Neurons: a neuron's recent changes are kept when downstream neurons come to rely on it
  ([Harris 2008](https://doi.org/10.1016/j.tins.2007.12.002), a proposal).
- Firms: indispensable parties should own ([Hart & Moore 1990](https://doi.org/10.1086/261729)).
- Societies: systems stay aligned with people while they depend on human labour
  ([Kulveit et al. 2025](https://arxiv.org/abs/2501.16946), an argument).

Wholes don't simply drain individuality from their parts. Bodies strip cells of their ability to compete
and reproduce on their own, yet cultivate huge differences between cell types. So individuality splits in
two: **difference** (what a part does), which wholes cultivate where it helps, and **autonomy** (whose goals
it pursues), which they suppress where it conflicts. [Levin (2019)](https://doi.org/10.3389/fpsyg.2019.02688)
is closest: gap junctions partly erase each cell's informational identity, and cancer is cells reclaiming
it.

The dial exists as an institution: [Weyl & Zhang (2022)](https://doi.org/10.1257/pol.20200426)'s
depreciating licences, where holders name a sale price and pay a percentage of it each period. A high rate
acts like a hotel (space moves to whoever values it most, nobody invests); a low rate like a home (strong
investment, but holdouts).

It ties back to the video. Height limits and single-use zoning come from individuation gone too far:
incumbent homeowners hold vetoes over their neighbours' land beyond anything the metro depends on them for
(Fischel's "homevoters"). Too many vetoes leave land underused
([Heller 1998](https://doi.org/10.2307/1342203)'s anticommons), which means the lids, which means sprawl.

## The four questions about any piece of space

| Question | Rule | Network | City |
|---|---|---|---|
| Who gets it, and how intensively? | A local price rations it | adaptation, thresholds | rent, height |
| Can several uses share it? | Only if their peaks don't coincide within the time effects linger | superposition | mixed use, zoning |
| How much can the occupant reshape it, and for how long? | Protection in proportion to the whole's dependence on the occupant | plasticity, consolidation | hotel, lease, ownership |
| Who sets the rules, and for whom? | A whole whose success depends on its parts treats them well | global objective vs local rules | metro vs neighbourhood |

## The wider economy

Each kind of constraint in a network carries its own price:

| Economy | Network | How close |
|---|---|---|
| Land rent | Adaptation, homeostatic thresholds, expert-balancing bias | Exact, simulated |
| Tax on overlapping use | Inhibition between neurons that fire together ([Földiák 1990](https://doi.org/10.1007/BF02331346)) | Both are Lagrange multipliers |
| Prices of intermediate goods | Backprop's error signals | Exact ([doc 5](5-learners-as-economies.md)) |
| Capital and depreciation | Weights and weight decay | Close |
| Trade falling off with distance | Cortical connections falling off exponentially with distance ([Ercsey-Ravasz et al. 2013](https://doi.org/10.1016/j.neuron.2013.07.036)) | Same form |
| Firms | Modules, which appear when connections cost something ([Clune et al. 2013](https://doi.org/10.1098/rspb.2012.2863)) | Structural |
| Budget | Energy: each extra bit costs more at higher firing rates ([Levy & Baxter 1996](https://doi.org/10.1162/neco.1996.8.3.531)) | Close |
| Outside option in demand ([Berry 1994](https://doi.org/10.2307/2555829)) | Attention sinks ([Xiao et al. 2024](https://arxiv.org/abs/2309.17453)) | Same form |

Hebbian neurons trying not to learn the same thing reproduce three property regimes. With no rules, Oja's
rule ([Oja 1982](https://doi.org/10.1007/BF00275687)) makes every neuron learn the same top component, like
[Hotelling (1929)](https://doi.org/10.2307/2224214)'s sellers bunching together. Sanger's rule
([Sanger 1989](https://doi.org/10.1016/0893-6080(89)90044-0)) has neuron k learn the k-th component, first
in time, first in right. Földiák's network adds a threshold per neuron (a price on its capacity) and
inhibition between co-active neurons (a tax on overlap), and the neurons differentiate, as firms do in
[d'Aspremont, Gabszewicz & Thisse (1979)](https://doi.org/10.2307/1911955).

## What doesn't carry over

- **Floor space is a flow.** Neurons handle events over time, so this is a city of hotel rooms, not homes.
  The two match in steady state, not in how they change.
- **Nobody collects the rent.** Adaptation rations capacity but transfers nothing, so the Georgist
  questions (who gets land rent, and whether to tax it) have no counterpart inside one network with one
  objective. They need several agents with separate goals. [Doc 4](4-taxes.md) and
  [doc 5](5-learners-as-economies.md) follow this up.
- **One centre, given.** In this experiment the centre is an input: everything commutes to one point, and
  the point is fixed in advance. Real cortex has no such point except its sensory inputs; a city's downtown is
  itself where other people chose to be. The one-model page's agglomeration settings lift this: arrivals go
  where the others they deal with are, and the centre, the towns and a hierarchy of areas form by themselves
  ([doc 3](3-one-model-two-readings.md#the-twelve-settings)).

## Prior work

Closest precursors: [Scherlis et al. (2022)](https://arxiv.org/abs/2210.01892) treat superposition as a
capacity budget, with one global price and no location;
[Baum & Durdanovic (2000)](https://doi.org/10.1162/089976600300014700)'s "Hayek machine" rests on
property rights and conserved money; [Lewis & Harris](https://www.biorxiv.org/content/10.1101/013185v1)
model neurons as a marketplace; [Watson, Levin & Buckley (2022)](https://doi.org/10.3389/fevo.2022.823588)
treat individuality as a matter of degree.

Not found anywhere: rent tied to a location inside networks or brains; superposition treated as zoning
with externalities; protection-by-dependence stated as one principle across scales; and pairing
developmental biology's "two big ideas" ([Green & Sharpe 2015](https://doi.org/10.1242/dev.114991)) with
economic geography's: positional information with von Thünen and Alonso, and Turing patterns with
Krugman's self-organizing cities.
