# One model, two readings

One model of how located capacity gets shared out, which reads exactly as a land economy and exactly as a
layer of neurons. Its thirteen settings line up named architectures in both fields: a height limit is a
firing-rate cap, firms with fees are a mixture of experts with load balancing, commuting along a corridor is
attention over a sequence. Four of them give the model no centre at all: arrivals go where the others they
deal with are, and the downtown ⇄ the hub is an outcome; in the last, geography and the technology people
build on it decide where, and for how long.

The interactive page is [`../experiments/one-model/index.html`](../experiments/one-model/index.html): one
self-contained file you open in a browser. It draws the same simulated agents in both views, and every
term and citation on it opens a popup. This doc is the same content without the page.

## The model in words

Agents arrive one at a time. Each compares what every site would cost it, adds its own random taste,
picks one, stays a while and leaves. A site's price rises with how many agents are there, and a site's
"fit" adapts to what it serves. What a site costs can include the distance to one given point (downtown ⇄ an
input neuron) or, instead, how far it is from the other agents this one deals with (agglomeration ⇄ wiring
economy); in the second case nothing fixes where the centre will be.

- **As an economy**, agents are households choosing parcels, sites are parcels, the price is rent, and fit
  is what a building is fitted for.
- **As a network**, agents are input spikes, sites are neurons in a winner-take-all layer, the price is the
  neuron's adaptation (how hard it is to fire after recent spikes), and fit is its tuning.

## The model in symbols

1. **Arrivals.** Sites j = 1…N sit at points of a map ⇄ sheet. Arrivals come as a Poisson process. Each has
   a type k and a starting point s (its class c), arriving at rate λ_c.
2. **What an option costs.** For an arrival of type k from s, site j costs

   c_j = t·d(s, j) + p_j + m·(1 − fit_kj) + ν·κ·r_{j,−k} − ρ·log(1 + r_j/r_0) + H − s·κ·Σ_q W_kq·(B_kq ∗ r_q)_j

   distance, price, mismatch, the other types' load at j (nuisance), a bonus for busy sites (economies of
   scale), a tax per resident H, and the gain from being near the types this one deals with (item 7).
3. **Choice.** The arrival takes the site with the lowest c_j − τ·ε_j, each ε_j a fresh Gumbel draw, unless
   an outside option worth V_0 beats them all. So P(j) = e^{−c_j/τ} / (e^{V_0/τ} + Σ_i e^{−c_i/τ}): the
   logit ⇄ softmax.
4. **Stays and load.** Each arrival stays an exponential time with mean T. The load r_j is the number
   present divided by sT (s = agents per unit of demand); by Little's law its average is the arrival rate.
5. **Prices.** p_j = a_j + b_j, where a_j follows one of three rules:
   - **elastic supply ⇄ adaptation:** a_j = κ·r_j, the slope of a building cost κ·r_j²/2;
   - **fixed supply ⇄ set point:** a_j rises by τ·log(r_j/c) per step until r_j = c;
   - **relative fees ⇄ load balancing:** the same with c the average load, stepped either by Sinkhorn's log
     step or by DeepSeek's fixed step toward the average.

   A cap n_j ≤ n_max either reroutes arrivals, so b_j rises as a waiting list forms (the shadow price), or
   drops them, as a full expert does.
6. **Tuning.** fit_kj = Σ_q w_jq·S_kq. The fitted shares w_j move toward the mix of types that j and its
   neighbours serve (neighbours weighted by a Gaussian of width σ).
7. **Interaction.** (B_kq ∗ r_q)_j = Σ_i B_kq(d_ij)·r_iq is how much of type q is near j, through a kernel
   B_kq(d) = e^{−d/ℓ_kq} ÷ Z_kq scaled so that a uniform load r gives r. W_kq is how much type k deals with
   type q. The field follows the load with a memory (arrivals learn where the others are). An optional second
   kernel of the opposite sign and a longer reach, read as a local density, is competition for customers ⇄
   lateral inhibition. With `sources: 'anywhere'` there is no starting point and this term alone places
   arrivals. Derivation and results in [doc 6 §19](6-derivations.md#19-a-centre-that-isnt-given-agglomeration--wiring-economy).
8. **Geography and technology.** A layer g_m(j) over the sites (a coast ⇄ where a sensory input arrives) is
   worth κ·w_km per unit to type k. Technology T_j is a layer the arrivals make: dT_j/dt = α·r_j +
   D·((B_T ∗ T)_j − T_j) − δ·T_j, learning by doing, spread through a kernel, and decay. It is worth κ·v·T_j
   to everyone, it fades the given layers (w·e^{−γT_j}), and it lengthens the reach of dealings between two
   sites by their mean technology, with the kernel renormalized so the same pull spreads over more partners.
   For a given T every term is still a slope of F. Derivation and results in
   [doc 6 §20](6-derivations.md#20-geography-and-the-geography-people-make).
9. **Taxes.** See [doc 4](4-taxes.md).

## Why each pairing is exact

| Symbol | Economy | Network | Why it's the same |
|---|---|---|---|
| τ·ε_j | Taste noise ([McFadden 1974](https://eml.berkeley.edu/reprints/mcfadden/zarembka.pdf)) | Escape noise: which neuron fires first | The first of several exponential clocks is a Gumbel argmax ([Yellott 1977](https://doi.org/10.1016/0022-2496(77)90026-8); [doc 6](6-derivations.md#1-the-logit-is-a-race-of-exponential-clocks)) |
| P(j) ∝ e^{−c_j/τ} | Logit choice | Softmax routing and attention | The same formula |
| t·d(s, j) | Commute cost; trips fall off as e^{−t·d/τ} ([Wilson 1967](https://doi.org/10.1016/0041-1647(67)90035-4)) | Wiring cost; ALiBi ([Press et al. 2022](https://arxiv.org/abs/2108.12409)) | Exact for ALiBi; the same form as cortex's exponential fall-off of connections |
| a_j = κ·r_j | Rent equals the cost of the last floor | Adaptation: each spike in effect adds to the threshold ([Benda & Herz 2003](https://doi.org/10.1162/089976603322385063)) | The same rule |
| a_j moves until r_j = c | Fixed supply: tâtonnement | A homeostatic set point ([Földiák 1990](https://doi.org/10.1007/BF02331346)) | The same resting point; the step sizes differ |
| c = average load | Fees that follow competitors' | Load-balancing bias ([Wang et al. 2024](https://arxiv.org/abs/2408.15664)); Sinkhorn attention ([Sander et al. 2022](https://arxiv.org/abs/2110.11773)) | Exact: DeepSeek's fixed step for experts, Sinkhorn's log step for attention |
| n_j ≤ n_max, b_j | Height limit; b_j is how far price exceeds building cost ([Glaeser, Gyourko & Saks 2005](https://doi.org/10.1086/429979)) | Firing-rate cap; an expert's capacity factor ([Fedus et al. 2022](https://arxiv.org/abs/2101.03961)) | The same constraint, b_j its multiplier; dropped overflow is Erlang loss |
| V_0 | Outside option: moving away ([Berry 1994](https://doi.org/10.2307/2555829)) | An attention sink ([Xiao et al. 2024](https://arxiv.org/abs/2309.17453)) | One more option ⇄ one more clock |
| w_j → mix served | Refitting toward current use | Competitive learning ([Rumelhart & Zipser 1985](https://doi.org/10.1207/s15516709cog0901_5)) | The same rule |
| σ | Firms learn from nearby firms ([Lucas & Rossi-Hansberg 2002](https://doi.org/10.1111/1468-0262.00338)) | A self-organizing map's neighbourhood ([Kohonen 1982](https://doi.org/10.1007/BF00337288)) | The same kernel |
| ν·κ·r_{j,−k} | Nuisance from another use ([Coase 1960](https://doi.org/10.1086/466560)) | Interference from another feature on the same neuron ([Elhage et al. 2022](https://transformer-circuits.pub/2022/toy_model/index.html)) | The same term |
| s·κ·Σ_q W_kq·(B_kq ∗ r_q)_j | Agglomeration: the gain from being near the types one deals with (Beckmann 1976, revisited by [Mossay & Picard 2011](https://doi.org/10.1016/j.jet.2011.06.009); [Fujita & Ogawa 1982](https://doi.org/10.1016/0166-0462(82)90031-X)) | Wiring economy: short wires to the populations a neuron reads from ([Chklovskii & Koulakov 2004](https://doi.org/10.1146/annurev.neuro.27.070203.144226); [Chen, Hall & Chklovskii 2006](https://doi.org/10.1073/pnas.0506806103)) | The same term; with symmetric W it is the slope of a pairwise term of F. A bump that forms with no input given is a neural field's ([Amari 1977](https://doi.org/10.1007/BF00337259)) |
| κ·(w·e^{−γT_j}·g_j + v·T_j) | Geography given (a coast) and made (roads, a port); the made kind grows with use, spreads ([Hägerstrand 1965](https://doi.org/10.1017/S0003975600001132)) and changes what the given kind is worth ([Bleakley & Lin 2012](https://doi.org/10.1093/qje/qjs011)) | The substrate's fixed structure (a sensory edge) and myelin that follows use, spreads along tracts and extends reach ([Fields 2015](https://doi.org/10.1038/nrn4023); [Gibson et al. 2014](https://doi.org/10.1126/science.1252304)) | The same form: a site value that accumulates where activity is, diffuses, and reshapes the cost of distance. Myelin's dynamics differ in detail; the pairing is of resting states |
| ρ·log(1 + r_j/r_0) | Economies of scale ([Arrow 1962](https://doi.org/10.2307/2295952)) | Rich-get-richer routing; expert collapse ([Shazeer et al. 2017](https://arxiv.org/abs/1701.06538)) | The same term; an urn process ([Arthur 1989](https://doi.org/10.2307/2234208)) |
| agents ⇄ flows | Households ⇄ the continuum of urban models | Spiking, hard attention, top-1 routing ⇄ rate models, soft attention | The flows are the agents' many-agent limit ([Kurtz 1970](https://doi.org/10.2307/3212147)) |

## The equilibrium is a free energy minimum

For steady demand, fixed tuning and prices without memory, the average flows x_cj settle where

F = Σ x_cj·(t·d + m·(1 − fit)) + Σ_j κ·r_j²/2 + ν·κ·Σ_j r_jA·r_jB − (s·κ/2)·Σ_{k,q} W_kq·Σ_{i,j} r_ik·B_kq(d_ij)·r_jq − κ·Σ_j r_j·(Σ_m w·e^{−γT_j}·g_m(j) + v·T_j) − ρ·Σ_j G(r_j) + τ·Σ x_cj·log(x_cj/λ_c)

is lowest (G is the function whose slope is log(1 + r/r_0)). Every price is the slope of F at its site's
load, a Lagrange multiplier, which makes the model a potential game
([Monderer & Shapley 1996](https://doi.org/10.1006/game.1996.0044)). Proof sketch in
[doc 6](6-derivations.md#2-the-equilibrium-minimizes-a-free-energy).

- **As an economy,** F is Beckmann's potential for traffic plus Wilson's entropy: stochastic user
  equilibrium ([Beckmann et al. 1956](https://www.rand.org/pubs/research_memoranda/RM1488.html);
  [Fisk 1980](https://doi.org/10.1016/0191-2615(80)90004-1)). As τ → 0 it gives Alonso's bid-rent line.
- **As a network,** F is energy minus τ × entropy. Under a fixed supply it's entropic optimal transport,
  which Sinkhorn's algorithm solves ([Cuturi 2013](https://arxiv.org/abs/1306.0895);
  [Galichon 2016](https://doi.org/10.1515/9781400883592)).

F leaves out sticky prices (they depend on history) and the tuning rule (which follows the mix served
rather than minimizing F). It also exposes one thing: **the nuisance actually suffered is twice the term in
F**, because each arrival counts the nuisance it suffers and not the nuisance it causes. Charging that
second half (a Pigouvian tax) makes the true cost the potential. With weak nuisance that lowers the true
total cost (tested); with strong nuisance several separated layouts are each stable, and the charge only
guarantees one of them.

F also needs the nuisance to be mutual. If use A minds use B more than B minds A, there is no F, but two uses
still settle in every case tried: at a site the split between two uses can only move one way, so nothing can
rotate. Three uses that each mind the next (A minds B, B minds C, C minds A) never settle once ν passes
2τ/(κ·x), with x a use's load at the busiest site, while a symmetric control with the same symmetric part
separates there and stops. A Pigouvian charge makes any nuisance mutual, so it restores a potential and
settles them. Derivation in [doc 6 §17](6-derivations.md#17-without-a-shared-potential); the page's
`nuisance.matrix` setting runs it (tested, not drawn).

## The thirteen settings

| Setting | Economy | Network | What it shows (each is a test) |
|---|---|---|---|
| `land` | Land market, downtown given | Competitive layer with adaptation, input neuron given | Rents approach Alonso's bid-rent line as taste variety ⇄ temperature goes to zero |
| `agglomeration` | A downtown forms by itself | A bump forms by itself | With no centre given, one forms at the plain's most accessible point, with rent and density falling from it; a harbour pulling a twentieth as hard as the land market's commute moves the whole city; a strong short-range pull alone makes one tower; a longer-range push breaks it into a ring of towns |
| `firmshomes` | Firms and homes place themselves | Connected populations settle side by side | Spillovers: one dense firm centre with homes around it. Need for each other: a mixed sheet. Spillovers plus competition for customers: several towns, each a firm cluster apart from its homes (Fujita & Ogawa's three regimes) |
| `hierarchy` | A port city: docks, works, homes | A hierarchy fans out from the input | A chain of kinds settles in order of distance from a pinned harbour ⇄ sensory input, on separate ground, with hops under 60% of a random placement's; an input in the middle gives rings and longer hops |
| `geography` | A coast, then roads and rails | A sensory edge, then myelin | A coast worth a little decides where the city starts; technology grows where people are and spreads inland. Technology that only fades the coast lets the city drift inland (14% left on the coast); technology worth living on keeps it near the shore (42%): path dependence. A longer reach spreads the city over 1.6× the land at lower density |
| `lid` | Height limit | Firing-rate cap | Sprawl when nobody can leave; an exempt centre builds taller than with no limit; when people can leave, most sprawl goes away |
| `taxes` | Taxes on land, buildings, residents | Global inhibition, stronger adaptation | See [doc 4](4-taxes.md) |
| `sorting` | Offices take the centre, homes the rings | Fast inputs claim the nearest neurons | Von Thünen rings; when retuning is costly, a random layout locks in |
| `districts` | Districts form by themselves | Ocular-dominance columns | A pattern with no centre, wider with more spillover ⇄ lateral spread |
| `mixed` | Mixed use vs single-use zoning | Shared (superposed) vs dedicated neurons | Co-active uses separate on their own, with a wandering boundary; slowly alternating uses share and beat zoning |
| `tenure` | Hotels vs homes | Plastic vs consolidated neurons | Homes win narrowly at 90% presence and lose at 15%: dedicated space must hold each occupant's peak, shared space only the peak of the sum |
| `experts` | Firms with fees and capacity | Mixture of experts with load balancing | Collapse without balancing; DeepSeek's rule evens load to within 3%; overflow at a full expert matches Erlang's loss formula |
| `attention` | Commuting along a corridor | Attention over a sequence | Plain softmax makes hubs; Sinkhorn evens them out; a sink absorbs queries with nothing nearby |

Three numbers worth remembering:

- **Collapse threshold.** The even split among experts breaks when ρ/τ > 1 + r_0/load (1.2 here). The
  simulation is stable at 1 and collapses at 1.5. Derivation in [doc 6](6-derivations.md#5-when-experts-collapse).
- **Erlang loss.** At capacity 1× the average, individual tokens are dropped about 9% of the time, where
  average flows drop 0.4%. That's Erlang's B(80, 80) ≈ 8.4%, and it halves with 4× more, smaller agents.
  It's why mixtures of experts run with capacity factors above 1.
- **Agents vs flows.** On the land market the two solvers' load profiles differ by about 2%.

## Two solvers, and what the second one caught

The page solves the model two ways: individual agents (the default) and average flows (the mean-field
solution, solved directly). Agents add things averages can't show: Erlang loss at a capacity limit,
boundaries between uses that wander over time, and vacancy chains (the next arrival tends to take the place
someone just left).

Running both caught three artifacts in my own solvers, each of which had produced a wrong claim:

1. **"Zoning wins when uses alternate quickly."** It came from the average-flow solver: its prices recover
   slowly after a vacancy, which handed a returning zoned use a spurious discount. With agents it's
   roughly a tie.
2. **"27% of tokens overflow vs 20% for flows, because load fluctuates."** With 64× more agents the excess
   grew instead of shrinking. The cause was rules that let the router see which experts were full. With
   overflow simply dropped, as in Switch Transformer, what's left is exactly Erlang loss.
3. **A per-resident tax first moved nobody until it exceeded 0.18.** Agents compared their noisy expected
   utility with a reference from the smooth solver, and noise inflates that expectation. They now compare a
   smoothed value against a reference from their own solver.

## Where the correspondence breaks

- **Floor space in use is a flow.** Each household ⇄ spike stays a random time, so this is a city of hotel
  rooms more than homes. The built stock is bookkeeping: no choice depends on it.
- **Nobody collects the rent, or the taxes.** Payments to a landowner or a treasury have no counterpart
  inside one network with one objective.
- **Spikes don't choose; the race chooses for them.** The logit law is exact either way, but no spike
  experiences a utility.
- **Prices that remember are outside F.** Rents remember for years; adaptation recovers within a pause.
- **Tuning isn't optimized.** It follows the mix served in both readings.
- **Trained networks internalize externalities; this model's arrivals don't.** That's why zoning can
  matter here and in cities. (Argued, not simulated; see [`../NEXT_STEPS.md`](../NEXT_STEPS.md).)
- **One layer only.** Backprop's error signals are like the prices of intermediate goods in a production
  chain, which this model doesn't cover. [Doc 5](5-learners-as-economies.md) does.
- **A bounded plain.** With no centre given, the centre forms at the disc's middle because that is its most
  accessible point; a harbour moves it. On a plain large next to the reach of dealings, or a torus, where the
  centre forms would be set by history, and an array of towns would fill the interior instead of sitting in
  a ring. Neither is simulated.
- **Dealings are a field.** A unit gains in proportion to how many partners are within reach. That is right
  for spillovers and wires, not for a job, which a household needs one of. The saturating option covers the
  gain; the one-to-one matching of workers to jobs, which gives Fujita and Ogawa their polycentric regime, is
  not modelled, and towns here come from competition instead.
