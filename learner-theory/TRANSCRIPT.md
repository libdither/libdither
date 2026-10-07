# Research log

A structured account of how this research went, from 24 September to 1 October 2026, in one long chat
between the user and Claude, and of the sessions in this repository that followed (phases 13–15). Each phase gives the prompt that started it (verbatim), what was built or
argued, what came out, and what turned out wrong. The prompts and full answers are in
[`transcript/conversation.md`](transcript/conversation.md); the explanations are in [`docs/`](docs/).

The chat took place inside the CivicMapper repository (a land-value mapping app by the Center for Land
Economics), which is why the first experiments are about cities. All four experiments were later copied
here, to [`experiments/`](experiments/).

A summary of every correction is at the end: [Corrections](#corrections).

## 1. The video and machine-learning analogies (24 Sep)

No code in this phase; it set up the questions.

> does this video remind you at all of any particular phenomenon from machine learning?
> https://www.youtube.com/watch?v=-Qn4iZgQY8k

The video is Lars Doucet's "Play-dough explains the American City": a fixed lump of dough (demand) spreads
onto farmland when a lid (height limits) presses on it. The first answer matched it to **probability mass
having to go somewhere**: a softmax sums to 1, so pushing some outputs down pushes others up. Capping the
peak spreads mass out (like temperature); pushing down everywhere but one spot sharpens that spot (the
"squeezing effect" of [Ren & Sutherland](https://arxiv.org/abs/2407.10490) in preference fine-tuning).

> i'm wondering if there's any relation here to what happens when we don't have weight decay / l2 weight pressure

Weight decay was matched to a land value tax ("use it or lose it"), with idle memorization circuits
surviving without it as in grokking ([Power et al. 2022](https://arxiv.org/abs/2201.02177);
[Nanda et al. 2023](https://arxiv.org/abs/2301.05217)), and L2 described as causing sprawl.

> think deeper on this topic. Is the direct land analogy here weights or is it something else? (possibly latent space usage?)

Revised: **latent directions are the better candidate for land, and weights are the buildings.** Weights
fail the tests for land (no location of their own, produced by training). L2 on a factored layer W = AB acts
like L1 on how latent directions are used, which concentrates rather than spreads
([Kobayashi et al. 2024](https://arxiv.org/abs/2410.23819)). The video's mechanism appears inside
transformers: softmax must spend all its attention (a mandate), heads dump unused attention on a junk token
(an attention sink), and models build huge activations to do it
([Sun et al. 2024](https://arxiv.org/abs/2402.17762)); gated attention removes both
([Qiu et al. 2025](https://arxiv.org/abs/2505.06708)). This answer also called gradient descent "a central
planner".

> gradient descent is *not* a central planner, it is a top-down error propagator. [...] And there are more decentralized alternatives to gradient descent (predictive coding) that still manage to do the same things. [...] could we narrow it even further and make the latent analogy work better by thinking of land as like a 2-3d latent space compared to the very high dimensional latent spaces [...]?

The user was right. **Backprop is better read as a price system:** its signals are Lagrange multipliers
([LeCun 1988](http://yann.lecun.com/exdb/publis/pdf/lecun-88.pdf)), shadow prices combined with each unit's
local information, which is Hayek's description of a market. Weight decay is depreciation of capital.
Predictive coding reaches the same prices from local errors
([Whittington & Bogacz 2017](https://doi.org/10.1162/NECO_a_00949)). On dimension: in 2D, closeness is scarce
(at most 6 touching neighbours) and that scarcity is what rent prices; in high dimensions closeness is nearly
free and interference is the scarce thing. Land is "any space where adjacency is scarce", and the cortex is a
literal 2D case ([Durbin & Mitchison 1990](https://doi.org/10.1038/343644a0)).

These two ideas, credit as prices and land as scarce adjacency, are the seeds of everything that followed.

## 2. The play-dough city (24 Sep)

> can you make an interactive web visualization to try and test the video's claim intuitively? put in a lot of effort to make sure you are really modeling a real phenomenon, taking care to stop and rethink if you identify any parts that don't quite cohere

**Built:** [`experiments/playdough-city/`](experiments/playdough-city/), a three.js page over a standard
monocentric city model (Alonso–Muth–Mills), with the cost of building tall fitted to
[Ahlfeldt & McMillen (2018)](https://doi.org/10.1162/rest_a_00734) and rules from
[Bertaud & Brueckner (2005)](https://doi.org/10.1016/j.regsciurbeco.2004.02.004). The key design choice was to
give the video's two hidden assumptions their own dials: fixed home sizes and nobody leaving. With both on,
total floor space is conserved exactly, like play-dough, and a test checks it.

**Checked by an independent reviewer** (a separate agent asked to find errors). It confirmed the core
against brute-force checks and found five bugs and about ten overstatements:

1. the baseline solver could fail silently and then blame rules that weren't set;
2. states with no equilibrium printed false claims;
3. "where did it go" shares could exceed 100% when total floor space rose (real economics: displaced
   households take bigger homes farther out);
4. the edge ring was double-counted;
5. the parking regime flipped per ring, breaking exact conservation.

All were fixed with regression tests (one was confirmed able to catch its bug by running it against the
unfixed code). The reviewer also flagged the cost-of-height curve as the most uncertain input; it was refitted
to hit the paper's three estimates exactly, and a slider was added for it.

**Found** ([docs/1](docs/1-height-limits-and-sprawl.md)): height limits cause sprawl only if nobody can leave
(+45% land closed; no spread and 35% leave when open); "it has to go somewhere" is nearly exact in a closed
city (only ~6% goes unbuilt); the downtown spike is real but reaches 13.5–21 stories, not supertall; the
free-market city is a smooth but mostly low-rise mound. 24 tests.

## 3. A plan that was dropped (24 Sep)

> What's next for comparing this to neural networks?

The proposal was a toy autoencoder on a sheet where superposition plays building height, sparsity plays the
cost of height, and a weight cap plays the lid. The next phase rejected it (below).

## 4. What plays the role of land (24 Sep)

> do some more reflection for coherence of this correspondence, find errors and explore other potential correspondences that might cohere better. keep going until you find something perfect, keeping in mind that we want to figure out what the distributed, potentially topological/informationally-constrained "learning network" equivalent of land allocation is, potentially thinking about reflections of the wider economy as well

**Errors found in the dropped plan:** superposition isn't height (its cost, interference, falls on others,
so it's an externality); features in a dense code have no location; the weight cap wouldn't bind (a ReLU
network can shrink one side and grow the other); the sheet and wiring cost were added by hand, so any city
behaviour would be circular; and nothing in it was a price. An older claim was also corrected: softmax's
sum-to-1 isn't a "parking minimum" but a demand system with no outside option
([Berry 1994](https://doi.org/10.2307/2555829)); attention sinks build one.

**A six-property test for land** (fixed, located, exclusive, intensifiable at rising cost, with an outside
use, and allocated by a local price) ruled out weights, ordinary units, latent dimensions, bits per
parameter, memory hierarchies and expert capacity. **Adapting neurons competing on a sheet passed all six:**
adaptation is rent, firing rate is floor space, a firing-rate cap is a height limit.

**Built:** [`experiments/neural-city/`](experiments/neural-city/) `rents-and-lids.mjs` and
`land-use-sorting.mjs`. With 901 neurons the network matched the city model's equilibrium within 1–4% under
every rule from the video; two input types sorted into Alonso's rings; costly retuning locked in the first
layout (an unplanned result: durable buildings ⇄ critical periods). A citation-check agent ran alongside.

## 5. Mixed use and individuation (24 Sep)

> can superposition in the land context be like different land uses that are exclusive / bad when they co-occur (i.e. heavy industry and residential?). And can there be another dimension here of individuated-ness? i.e. hotel vs homes is a matter of how individuated it is [...] where superagents tends towards homogenizing / individuality-draining their constituents to the degree non-helpful to the superagent's survival/effectiveness. See if you can think further to create a model that coheres even further, do some research to see if people are already thinking about this.

**Built:** `sharing-and-zoning.mjs` and `hotels-and-homes.mjs`. Two research agents ran in parallel: one on
prior work, one checking claims.

**Found** ([docs/2](docs/2-what-plays-land-in-a-network.md)):

- Superposition is land used in shared mode, and what decides sharing is whether uses peak at the same time
  within the time their effects linger ([Dorrell et al. 2024](https://arxiv.org/abs/2410.06232) prove a
  version). Co-active uses separated with no rule; slowly alternating uses shared.
- Each event counts the nuisance it suffers, not the nuisance it causes, which is why cities need zoning
  and a network trained on one loss doesn't.
- Individuation is a ladder of rights ([Schlager & Ostrom 1992](https://doi.org/10.2307/3146375)). Homes beat
  hotels only when occupants are nearly always present; customization that follows use beats both otherwise.
- The prior-work search found a recurring rule: a whole protects each part in proportion to how much it
  depends on it (EWC, continual backprop, Harris's retroaxonal hypothesis, Hart & Moore). It also refined the
  user's framing: wholes suppress parts' *autonomy* but cultivate their *difference*.
- The claim check corrected three things: Scott's legibility argument needs more than legibility to predict
  failure; evidence on rentier states is mixed; *Euclid v. Ambler* also upheld excluding apartments, which is
  density exclusion rather than nuisance.

## 6. One model, two readings (25 Sep)

> Might it be possible to create a single general model that we can visualize in two different ways--a neural network, and an economy--perhaps general enough to represent different architectures for both in order to see the bijection more fully? Put max effort and try and build this in a new html file, iterating until you are sure you've crystalized the perfect way to express, visualize, and intuitively explain variance in both from a single model

**Built:** [`experiments/one-model/index.html`](experiments/one-model/index.html), one self-contained page.
Arrivals pick sites by one softmax over distance, price, mismatch, nuisance and a scale bonus; architectures
in both fields are the same equation with different terms switched on. Eight settings at first (land, lid,
sorting, districts, mixed, tenure, experts, attention), each drawn as an isometric city and as a neuron
sheet. A Node test suite pulls the model out of the HTML and checks each setting's claims.

**Calibration fixes** were needed to make each setting show its phenomenon honestly: a per-site exact solve
for prices at low noise; a "scrambled" start so lock-in could appear; price memory so alternating uses didn't
flood; noise so symmetric uses could separate; a relative "balance" price for experts, because the absolute
one fought the capacity cap; a scale term so experts could collapse at all.

**The final audit found three claims wrong or misleading:** hotels vs homes was drawn so dedicated space
looked like it used *less* land (fixed with a built stock and faded empty floors); "zoning helps when uses
alternate quickly" held only if prices reset while a parcel is empty; and the "parcels serving both uses ⇄
polysemantic units" readout couldn't see sharing over time. 10 tests.

## 7. Agents (25–26 Sep)

> Can we see if we can make this more agent-based simulate-y? Also, the neuron design I'm a little confused by, I wonder if we can make it more clear what exactly is going on. Also, please add reusable tooltips to explain terms inline in the text.

**Built:** a second solver where every arrival is an individual (a household ⇄ a spike) with its own taste
noise and a random stay; a clearer neuron view (size = recent spikes = how adapted it is); a "Follow one
arrival" walkthrough; a glossary of about 60 terms in one shared tooltip.

**Price rules had to be rebuilt for agents:** capacity prices drifted (Jensen's inequality; fixed by centring
the steps), sticky rents ratcheted up 33% (fixed with an additive sticky part), and expert balancing
oscillated between loads of 0.05 and 4.3 (fixed by responding to a smoothed arrival rate).

**What agents changed:**

- **Retracted:** "zoning wins when uses alternate quickly". With agents it's roughly a tie; the flows
  solver's slowly recovering prices had handed returning zoned uses a spurious discount.
- **New:** boundaries between uses wander over time; vacancy chains (the next arrival takes the place someone
  just left).
- **A claim that turned out wrong in the next phase:** individual tokens overflowed a tight expert 27% of the
  time vs 20% for flows, "because load fluctuates".

19 tests. The two solvers agreed within about 2% on the land market.

## 8. The formal pass (26 Sep)

> Could you make the tooltips persist when clicked and add links to them [...] Then I want you to go through until you feel like all the equivalent concepts are *formally* equivalent in some formalization of this model, and also improve page to reference past literature in-line as opposed to citation links at bottom [...] Aim for maximum self-coherence and grounding in intuition as possible.

**Built:** pinnable popups with a Back stack; about 110 glossary terms; inline author–year citations
resolving to 82 references; a "model in symbols" section; a dictionary saying, per symbol, why the pairing
is exact and which standard model in each field has that form.

**The formal results** ([docs/3](docs/3-one-model-two-readings.md), [docs/6](docs/6-derivations.md)):
taste noise and escape noise are one fact (the first of several exponential clocks is a Gumbel argmax); the
average flows minimize one free energy and every price is a Lagrange multiplier (stochastic traffic
equilibrium ⇄ entropic optimal transport); where a pairing is only "the same form" (ALiBi vs cortex's
wiring fall-off), the page says so; the free energy counts half the nuisance, so a Pigouvian charge lowers
the true cost.

**Corrected:** the 27% overflow explanation. With 64× more agents drops *rose* to 34% while 16% of capacity
sat idle, so fluctuation wasn't the cause. The router could see full experts, and extra prices pushed tokens
away. With Switch-style dropping, overflow matches Erlang's loss formula: about 9% at capacity 1×, halving
with 4× more agents. Experts now use DeepSeek's exact bias rule, and the collapse threshold was derived
(ρ/τ > 1 + r₀/load) and confirmed.

**Citation verification method,** used from here on: every DOI resolved to its metadata (title, authors,
year), every arXiv ID checked against arXiv's API, every Wikipedia title checked in batches through
Wikipedia's API. It caught a wrong DOI (Wheaton 1974) and two Wikipedia titles that redirect to other
subjects ("Increasing returns" goes to *Diminishing returns*). 25 tests.

## 9. Taxes (1 Oct)

> Can you add various kinds of taxes and their corresponding conceptions in neuron-view, only add if you are 100% confident

**Built:** a taxes setting and a Pigouvian toggle; five taxes with exact counterparts
([docs/4](docs/4-taxes.md)): land value ⇄ nothing; buildings ⇄ stronger adaptation; per resident ⇄ global
inhibition; Pigouvian ⇄ counting interference caused; fuel ⇄ steeper wiring cost.

**Caught:** another solver artifact. Rents fell 0.18 short of a per-resident tax, because agents compared
their noisy expected utility with a reference from the smooth solver, and noise inflates it. The Pigouvian
claim was narrowed: with strong nuisance it only guarantees a local optimum. Two literature limits were
respected (Brueckner & Kim 2003 on when building taxes cause sprawl; Oates & Schwab 1997 on Pittsburgh).
Vacancy, transfer, Harberger and congestion taxes were left out because nothing in the model responds to
them. 28 tests, 86 references, 119 glossary terms.

## 10. Which other taxes fit (1 Oct)

> what about sales, capital gains, income, and other standard taxes? (are those includable in here?) or do we need a more general more of the economy?)

A text answer. A few taxes reduce to existing ones (sales tax on rent, uniform income tax). Capital gains,
wealth, income-with-hours, corporate, VAT and tariffs each need something the model lacks. The deeper point:
**income and wealth taxes tax a budget, and spikes have no budgets**, so even a richer economic model
wouldn't give them a network counterpart. Learning systems that do have budgets exist: classifier systems
and Baum's Hayek machine, where taxes are literal. That pointed to a different second reading: a learner made
of agents with money.

## 11. Learners as economies (1 Oct)

> Hmm... is there a general model that can be paired down / specialized to recover various kinds of learners? Can we make a general parametrizable model of learners that goes from full market-based to like simple linear matrices + backprop? What are the various dimensions of variability here? Investigate comprehensively

**Started from** Chang et al.'s exact construction ([2020](https://arxiv.org/abs/2007.02382)) of when a market
of bidding agents implements the optimal policy.

**Built:** [`experiments/learners/`](experiments/learners/): an engine where a learner is a staged production
economy and credit is a price; 14 tests checking each named learner against its textbook definition; a
`ladder.mjs` comparing all settings on shared tasks; a write-up with a taxonomy of about 26 learners along
ten dimensions ([docs/5](docs/5-learners-as-economies.md)).

**Predicted in advance and confirmed:** the first-price market's fixed point (SARSA's) and the leaky fixed
point of Vickrey without clones, each computed before training and matched within 0.1.

**A literature agent checked 34 items:** 22 verified, 11 partly verified, 1 not confirmed. Corrections made:
Holland's own existence and bid taxes couldn't be found in a primary source (ZCS's and Hayek's documented
taxes are cited instead); the "two principles" (property rights, conservation of money) are Baum's; product
exhaustion is Wicksteed's 1894 claim and the Euler's-theorem form came later; Sutton's link between the
bucket brigade and TD(0) carries a caveat about which rules get paid.

**Honest negatives:** the minimal Hayek population finds the best action at only 3 to 5 of 6 states.
Requiring agents to afford their bids had capped every bid at the starting endowment; that was a design bug
and was removed. A feedback-alignment metric first used a linear teacher, which the network fits exactly,
making the metric noise; it was switched to a nonlinear task.

## 12. Overview and gaps (1 Oct)

> Give me an overview of the research so far and how far along it is as well as any potential conceptual gaps you can identify

The allocation correspondence is essentially finished; the learner generalization is a first pass with
sound identities but no market learner that learns a representation. The gaps identified then are the
items in [`NEXT_STEPS.md`](NEXT_STEPS.md).

## 13. The next steps, in order (1 Oct, a second session)

A later session in this repository reviewed the folder, then was asked:

> lets do the next steps in order.

The steps were the four it had proposed: name what the results share, build a market for a dense layer,
break the shared potential in the one-model page, and test one price for rationing and credit.

**Built:**

- [`docs/7-the-common-core.md`](docs/7-the-common-core.md): every price in the folder is a Lagrange
  multiplier. It adds the prior work from networking (Kelly's network utility maximization, layering as
  optimization decomposition) and markets for computing, joins the two halves through the soft Bellman
  equation (the one-model page's logsum is a soft value), and sorts every result into textbook and new.
- Part D of the learners engine, a market for a dense layer, with 5 tests.
- A nuisance matrix in the one-model page, with 2 tests.
- Part E, one auction price for a mixture of experts, with 2 tests.

**Found** (each predicted before it was run unless noted):

- **Dense layer.** Honest per-example prices are backprop; voluntary payment for a broadcast activation is
  nothing, so only the last layer learns; VCG recovers backprop with a budget gap Σ_{j<k} v_j·v_k, covering
  95% of the cost with independent outputs and 80% with nearly identical ones (measured, not predicted).
  A price fixed across examples can't turn a hidden unit toward a feature, because only the covariance of
  price and input can. Access sold at its true per-example value is a difference reward, close to backprop.
- **No shared potential.** Two uses settle even with one-sided nuisance. Three uses that each mind the next
  never settle past ν = 2τ/(κ·x), predicted at 0.116 and observed between 0.11 and 0.12, while a symmetric
  control separates and stops. A Pigouvian charge symmetrizes any nuisance and restores a potential.
- **One price.** An auction price per expert rations better than a balancing bias (it drops the least
  valuable tokens) but assigns credit worse (a bid must be right as an amount), so it wins at tight capacity
  and loses at slack capacity.

**Wrong turns during building:**

- Posted-price buyers first judged inputs at their current weights; early in training every input looked
  harmful, every buyer refused, and a refused connection could never be learned. Buyers now value access
  at its best use.
- A refused buyer compared its value with a stale running average of past payments instead of the current
  ask. Fixed.
- The first experts auction had to serve every token and so sent overflow to the wrong expert; it now has
  an outside option worth zero. Its first version took thousands of tiny price steps per batch; a minimum
  step ε made it 90× faster and was checked against brute force.
- The draft of the page paragraph called strong one-sided nuisance a stable game. It isn't; it settles for a
  different reason (two uses leave no room to rotate). Fixed before landing.
- The draft of doc 7 cited Neu et al. for discounted problems and attributed a Boyd quote to the wrong
  method; both were checked against the sources and corrected.

## 14. A visual walkthrough (2 Oct)

> Can you explain what these models look like visually? Make a walkthrough

**Built:** [`WALKTHROUGH.md`](WALKTHROUGH.md), with screenshots of both interactive pages and six figures
drawn from the engines: the learner as a chain of stages, what one hidden unit is told under each market
design, how much its features improve, the three cyclic uses on the sheet, and one batch of tokens under
three routers. `walkthrough/capture.mjs` drives headless Chromium over its DevTools protocol;
`walkthrough/figures.mjs` regenerates the figures.

**Caught while checking the captions against the sources:** the walkthrough first called #223 a household
(it's the parcel and the neuron picked), said the expert biases equal the firms' fees (they're the fees
with the sign flipped), and said selling access at its true value "tracks" backprop's price (on single
examples the correlation is only 0.33; it's right on average). Two capture bugs also had to be fixed:
capturing beyond the viewport resized the page and blanked its canvases, and the first auction figure
let one noise spike set the scale for every row.

## 15. The centre is an input (7 Oct)

> Hmm... I think the downtown city model is not quite right, because the downtown is the input, but that is
> the output of other neurons. I think we need a better model of agglomeration, i.e. I guess its just a matter
> of maximum connectiveness given some physical substrate? neural networks and brains try to maximize this for
> 3d space, and cities I guess do too, at the cost of some theoretical min latency, but also predictive coding
> networks can respond at a variety of latency levels for different requests, unlike neural network forward
> passes (i think?). Can we think of a more general model here and update the website. Think in-depth,
> iterate until you've found a model that is closer to what the real world looks like.

The user was right: the land market pins every household to one point and every spike to one input neuron,
and that point is the one thing a city or a cortex builds itself.

**Built:** an interaction term on the one-model page. A type-k arrival at j gains s·κ·Σ_q W_kq·(B_kq ∗ r_q)_j:
how much of each type it deals with is within reach, through a kernel over distance. With symmetric dealings
the term is the slope of a pairwise term of the free energy, so prices stay multipliers. Options: no starting
point at all (`sources: 'anywhere'`), a pinned point anywhere (`sourceAt`: a harbour ⇄ a sensory input), a
memory on the field, a saturating gain, and a second repelling kernel with a longer reach (competition for
customers ⇄ lateral inhibition). Three settings use it: a downtown that forms by itself ⇄ a neural-field bump;
firms and homes placing themselves ⇄ connected populations settling side by side; a port city ⇄ a hierarchy of
areas fanning out from the input. Four tests, both solvers. Docs 2, 3 and 6 updated, 19 references added, and
the walkthrough regenerated.

**Found** ([docs/6 §19](docs/6-derivations.md#19-a-centre-that-isnt-given-agglomeration--wiring-economy)):
a centre forms where none was given, at the plain's most accessible point; a harbour pulling a twentieth as
hard as the land market's commute moves the whole city to it; a strong short-range pull alone collapses the
city into one tower (Krugman's black hole), and a longer-range push breaks it into towns; firms and homes give
Fujita and Ogawa's three regimes from three connection strengths; a chain of three kinds settles in order of
distance from a pinned input with hops under half a random placement's. The agents and flows agree in every
preset regime.

**Wrong turns:**

- The agents' bump wandered the plain at random. The attraction field used the instantaneous occupancy; with a
  memory of 40 time units (arrivals learn where the others are) it sits still and matches the flows within
  5–9%.
- A repelling kernel read as a sum of competitors drove every town to the rim of the disc, where competitors
  are fewest; what looked like an array of 8–12 towns was a ring on the edge. Competition is now read as a
  local density. Interior towns then need short reaches.
- The saturating gain (one job is what a home needs) was expected to split the firm cluster into towns. It
  dissolves the cluster into a mixed carpet instead. Splitting needs a push.
- The flows "collapsed" to one site at strong short-range attraction. That is the real equilibrium when the
  attraction a unit adds at its own site reaches the rent it adds (s·W/Z → 1); it is now a named regime.
- The 1D line layout also collapsed; that too is 1D's true equilibrium under a kernel normalized to the plain,
  so the planned 1D-versus-2D substrate comparison was dropped as ill-posed in this form (NEXT_STEPS 10).
- The follow-one-arrival walkthrough crashed on the new settings: its word tables were keyed by setting.

## Corrections

Every claim that was made and later withdrawn or narrowed:

| Claim | When | Replaced by | How it was found |
|---|---|---|---|
| Weight decay is a land value tax, and L2 causes sprawl | Phase 1 | Weights are capital, weight decay is depreciation; in latent space L2 concentrates | Thinking through what land requires |
| Gradient descent is a central planner | Phase 1 | Backprop is a price system (LeCun 1988) | The user's pushback |
| Softmax's sum-to-1 is a parking minimum | Phase 1 | A demand system with no outside option (Berry 1994) | Phase 4 audit |
| Superposition is building height; sparsity is the cost of height | Phase 3 | Superposition is shared-mode land (mixed use); its cost is an externality | Phase 4 audit |
| Superposition is spectrum, not land | Phase 4 | Land used in shared mode | The user's suggestion in phase 5 |
| Several play-dough city bugs and overstatements | Phase 2 | Fixed, each with a regression test | Independent reviewer |
| Hotels vs homes picture: dedicated space uses less land | Phase 6 | Built stock with faded empty floors | Audit against the model |
| Zoning wins when uses alternate quickly | Phases 5–6 | Roughly a tie with agents; a solver artifact | Agent-based solver |
| 27% vs 20% token overflow, "because load fluctuates" | Phase 7 | Erlang loss, ~9% at capacity 1× | Rerunning with 64× more agents |
| Per-resident tax: rents fall by the full tax | Phase 9 (first run) | They do, once agents use a same-solver reference; the 0.18 shortfall was noise | Comparing both solvers |
| A Pigouvian charge always lowers the true cost | Phase 8 | Only with weak nuisance; otherwise a local optimum | A seed where it came out worse |
| Holland's classifier system had existence and bid taxes | Phase 11 draft | Not confirmed from primary sources; ZCS and Hayek taxes cited instead | Literature agent |
| A market for a dense layer: honest reporting is the experiment that tests 1a | NEXT_STEPS, before phase 13 | It equals backprop by construction; the informative designs are voluntary, VCG, averaged and excludable | Working the design out |
| Excludable posted prices would land near readout-only | Phase 13 plan | Worse than readout-only: half the connections are refused at a time | The simulation |
| Without a shared potential, cycles would need delays | Phase 13 plan | Two uses settle even with a 50× longer memory; three uses with cyclic nuisance never settle, with no delay needed | The simulation |
| The one-model page's centre must be given (a pinned downtown ⇄ input neuron) | Phases 4–13 | An interaction term places arrivals by where the others are; the centre, the towns and a hierarchy form by themselves | The user's critique, phase 15 |
| An array of 8–12 towns forms under long-range competition | Phase 15 draft | A ring on the disc's rim, a boundary effect; competition read as a local density gives interior towns only at short reaches | Checking where the towns sat |
| A saturating gain would give Fujita–Ogawa's polycentric regime | Phase 15 plan | It dissolves the cluster; towns need a push (competition) | The simulation |

**Still unresolved:** the neural-city script still shows zoning ahead under fast alternation; see
[`NEXT_STEPS.md`](NEXT_STEPS.md#unresolved-results).

## Methods that worked

- **Predict, then test.** Fixed points were computed before training (SARSA's, the leaky Vickrey one, the
  collapse threshold) and the simulation checked against them, so a passing test meant something.
- **A second solver.** Every agent-vs-flows disagreement was a bug or an artifact in one of them, and three
  wrong claims were caught that way.
- **Independent reviewers.** Separate agents told to find errors in the model, the claims or the citations
  found real problems each time.
- **One test per claim on a page,** and a check that each test can fail.
- **Citations checked against the source,** never typed from memory.

Tooling pitfalls that cost time: JavaScript's `String.replace` treats `$'` and `` $` `` in the replacement as
special, which silently duplicated text: a whole source file once, and a span of the one-model README that
went unnoticed until these files were moved here (use a function as the replacement); the shell expanded
`$(` inside inline scripts (write patches to files with quoted heredocs); hidden browser tabs throttle
timers (drive the simulation through a synchronous debug hook); `/tmp` was cleared between sessions, losing
helper scripts.
