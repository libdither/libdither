# Next steps

What's settled, what's open, and what to do about each open part. The gaps are ordered by how much closing
them would change the picture. Each has a concrete experiment and what result would count for or against
the idea.

## Where things stand

**Settled** (exact, derived in [docs/6](docs/6-derivations.md), and tested):

- Land markets and competitive layers of neurons are one model for *allocation*: logit choice is a race of
  noisy neurons, rent is adaptation, fees are load-balancing biases, and all of them are multipliers of one
  free energy ([docs/3](docs/3-one-model-two-readings.md)). The centre is an outcome, not an input: with an
  interaction term (agglomeration ⇄ wiring economy) a downtown forms by itself, a harbour moves it, firms and
  homes show Fujita & Ogawa's three regimes, and a chain of kinds lays itself out from a pinned input in order
  ([docs/6 §19](docs/6-derivations.md#19-a-centre-that-isnt-given-agglomeration--wiring-economy)).
- For *credit*, backprop's signals are prices, an activation's price is a public-good sum, and bias-free
  linear or ReLU networks keep exact money accounts. Auction markets for control are Q-learning or SARSA
  depending on the price rule; the bucket brigade is TD(0) with its tax as the discount
  ([docs/5](docs/5-learners-as-economies.md)).

**Open:** the claim that one model runs continuously from a market of agents to backprop. It holds at both
ends and at several points between, but the two ends are separate engines. Item 1 below found what a market
needs to learn a representation: prices per example, signed, and honestly reported for a good every buyer
gets at once.

[Doc 7](docs/7-the-common-core.md) names what the settled results share (every price is a Lagrange
multiplier), sorts them into textbook and new, and adds the prior work from networking. Its last section
maps each item below to the assumption of that common core that it breaks.

## 1. A market for a dense layer (done, 1 Oct)

**Found** ([docs/5](docs/5-learners-as-economies.md#a-market-for-a-dense-layer); derivations in
[docs/6 §13–16](docs/6-derivations.md#13-a-market-for-a-dense-layer-what-a-unit-buys); Part D of
`experiments/learners/`, 5 tests). Units buy inputs at a price per unit and maximize their own profit.

- **Honest per-example prices are backprop,** by construction. Charging units their inputs' marginal
  contribution instead gives bias-free ReLU units zero profit at every weight, so no signal.
- **Voluntary payment is nothing.** A buyer gets a broadcast activation anyway, so it pays nothing and
  only the last layer learns. Samuelson's free-rider problem bites completely.
- **VCG recovers backprop** (Clarke tax v²/2, truthful reports dominant). Its budget gap is Σ_{j<k} v_j·v_k:
  payments covered 95% of the supplier's cost with independent outputs, 80% with nearly identical ones.
- **Prices must vary with the example.** Only Cov(price, f′·x) can turn a unit toward a new feature. An
  honest price averaged over examples barely improves features (≤ 1.3×, against 6–35× for per-example
  prices); excludable posted asks are worse (suppliers only grow; half the connections are refused at a
  time).
- **Exclusion makes counterfactual credit measurable.** Access sold at each buyer's true per-example value
  is a difference reward: unbiased, ≈ 9% of node perturbation's variance, features within 2× of backprop.

So 1a holds, and needed one refinement: the obstacle is not only that activations are public goods, but
that useful prices must also be per example and signed. Backprop supplies all three for free.

**Still open:**

- **Forward-looking buyers.** Buyers here are myopic. A buyer that weighs how its payment improves the
  supplier later plays a dynamic contribution game; [Bergstrom, Blume & Varian (1986)](https://doi.org/10.1016/0047-2727(86)90024-1)
  predict that only the buyers who value the feature most contribute. Simulate it.
- **Who sees the buyers' losses?** The access design learns well but needs each buyer's true per-example
  value. Combine it with item 2: buyers who report strategically, under VCG or under exclusion.
- **[Schmidhuber's neural bucket brigade (1989)](https://doi.org/10.1080/09540098908915650)**, where
  winning units pass "weight substance" back to the connections that set them up, is still the closest
  prior design and still not reimplemented.

## 2. Strategic bidding

**What's missing.** Every market agent bids its learned valuation honestly. Bid shading, collusion and
bubbles are why [Chang et al. (2020)](https://arxiv.org/abs/2007.02382) need Vickrey prices and clones, but
here they're cited, not simulated.

**What to do.** Let agents choose bids to maximize expected profit given what they've seen others bid:

- First-price auctions should shade bids below value, breaking the SARSA identity.
- Vickrey auctions should keep honest bidding as a dominant strategy
  ([Vickrey 1961](https://doi.org/10.1111/j.1540-6261.1961.tb02789.x)).
- Clones that can coordinate should collude, bidding low and splitting the surplus. Find out what that does
  to the Q-learning identity.
- In the Hayek population, check for bubbles: bids that rise faster than the rewards behind them.

**What would count.** The market results in docs/5 hold only if Vickrey-with-clones survives strategic
agents; if collusion among clones breaks it, the clean identity needs an extra rule (such as random clone
pairing) and that rule is part of the theory.

## 3. Two kinds of price that are never unified (done for a mixture of experts, 1 Oct)

**Found** ([docs/5](docs/5-learners-as-economies.md#one-price-for-rationing-and-credit); derivation in
[docs/6 §18](docs/6-derivations.md#18-one-price-per-expert-rationing-by-auction-credit-by-bids); Part E of
`experiments/learners/`, 2 tests). Experts bid their forecast loss reduction, an ascending auction with one
price per expert assigns tokens within capacity, and each expert's bid moves toward the loss reduction it
realized. No router gradient, no balancing bias.

- **One price can do both jobs.** The auction stays within capacity and is optimal for the bids; the value
  served splits exactly into tokens' surplus plus experts' capacity rents.
- **It rations better.** It drops the tokens worth least (0.38 of an average token, against 0.74 when
  dropping by gate probability and 1.02 in arrival order), so at tight capacity it has the lowest loss.
- **It assigns credit worse.** A bid must be right as an amount, a router score only as a ranking. Experts
  fit their clusters 4–10× worse, and at slack capacity the gate wins (0.123 vs 0.218). Linear bids are far
  worse; learning every expert's value on every token made it worse still, so the gap is the forecast, not
  learning only from won tokens.

So the split is not just engineering convenience: it trades rationing quality for cheap, precise credit.
Tokens are rival, so there's no free-riding; what a price costs is precision.

**Still open:**

- **A hybrid:** experts trained through the gate, with overflow priced by forecast value. It might keep both
  advantages.
- **A harder task:** unequal or overlapping clusters, where the gate actually needs its bias.
- **Strategic experts** (item 2): here every expert bids its forecast honestly.

## 4. Games with no shared potential (inside the one-model page: done, 1 Oct)

**Found** ([docs/6 §17](docs/6-derivations.md#17-without-a-shared-potential); 2 tests). The page's nuisance
can now be a matrix, how much each use minds each other one; unequal entries leave it without a free energy.

- **Two uses settle anyway,** whether only one minds the other or one seeks the other while it avoids it,
  even with a nuisance memory 50× longer. At a site the split between two uses can only move one way, so
  nothing can rotate.
- **Three uses that each mind the next never settle** once ν passes 2τ/(κ·x), predicted before running
  (0.116; observed between 0.11 and 0.12). A symmetric control with the same symmetric part separates at the
  same threshold and stops. The cyclic uses keep moving, irregularly, with agents too: spatial
  rock–paper–scissors.
- **A Pigouvian charge restores the potential** for any nuisance matrix, because adding the nuisance caused
  makes the interactions symmetric. It settles the cyclic uses.

So the "one free energy" story has a stated boundary: it needs mutual interactions. Settling needs less (a
stable game, or only two uses), and cyclic dislike among three or more is where it fails.

**Still open:**

- **In the learners engine:** add a two-objective stage and use the decomposition of
  [Balduzzi et al. (2018)](https://arxiv.org/abs/1802.05642) into a potential part and a rotational part to
  place learners on the new dimension.
- **A network reading of cyclic interference.** Features whose interference runs in a cycle are the
  network side of the result, but no standard architecture is known to produce them. Look for one before
  drawing it on the page.

## 5. Prices on data

**What's missing.** The taxonomy prices internal goods, but many learners price their *examples*:

- boosting reweights examples by multiplicative weights ([Freund & Schapire 1997](https://doi.org/10.1006/jcss.1997.1504));
- distributionally robust optimization picks adversarial example weights ([Rahimian & Mehrotra 2019](https://arxiv.org/abs/1908.05659));
- support vector machines' dual variables price the margin constraints, and only the "support vectors" have
  nonzero prices ([Cortes & Vapnik 1995](https://doi.org/10.1007/BF00994018));
- curriculum learning and importance sampling decide which examples count, and when
  ([Bengio et al. 2009](https://doi.org/10.1145/1553374.1553380)).

**What to do.** Add "prices on inputs" as an eleventh dimension, with one tested identity: for example, that
AdaBoost's example weights are the multipliers of a margin-maximization problem, so hard examples are the
expensive ones.

## 6. Do trained networks really internalize externalities?

**What's missing.** The one-model page says a network trained on one loss counts the interference each
feature causes others, as if a Pigouvian tax were charged, which is why it needs no zoning. That's argued
from the math ([docs/6, section 3](docs/6-derivations.md#3-the-nuisance-is-counted-half)) but never
simulated: the page's network is a competitive layer at inference time, not a trained one.

**What to do.** Use the learners engine to train two features sharing units by gradient descent on the total
loss, and separately with a local rule where each feature responds only to the interference it suffers.
Compare their interference with the one-model page's half-counted equilibrium and its Pigou-charged version.

**What would count.** Gradient training should match the charged version, and the local rule the uncharged
one. If gradient training also over-shares, the "trained networks don't need zoning" claim is wrong.

## 7. Depth and time

**What's missing.** The bucket brigade passes credit back through time the way backprop passes it back
through layers; backprop through time ([Werbos 1990](https://doi.org/10.1109/5.58337)) does both. That link
is argued, not demonstrated, and nothing here has recurrent memory.

**What to do.** A small recurrent task (remember a cue for k steps) solved three ways: backprop through time,
a bucket brigade over the hidden states, and a TD critic. Measure how credit decays with k under each.

## 8. Speed and variance, not just resting points

**What's missing.** The tests check identities and fixed points. How fast each kind of price learns, and at
what variance, is shown only on toy tasks.

**What to do.** Measure, for each price-formation rule, loss reduction per bit of credit information sent
backward. That turns the "prices are the smallest messages" theorem
([Mount & Reiter 1974](https://doi.org/10.1016/0022-0531(74)90012-X);
[Jordan 1982](https://doi.org/10.1016/0022-0531(82)90088-6)) into something measurable for learners: is a
vector of exact prices worth its bandwidth compared with one broadcast scalar?

## 9. Generalization

**What's missing.** The framework explains credit and allocation, not why a learned function works on new
inputs, which is arguably the main thing learners do.

**A starting point from the early discussion** ([transcript turn 4](transcript/conversation.md)):
memorization gives each training example its own parcel (sprawl); the generalizing solution serves all of
them with one compact shared circuit; and grokking is the switch, sped up by weight decay
([Power et al. 2022](https://arxiv.org/abs/2201.02177); [Nanda et al. 2023](https://arxiv.org/abs/2301.05217)).
In this framework weight decay is depreciation of capital.

**What to do.** On modular addition, vary the depreciation rate and measure when the switch happens and how
much capacity each solution uses. Test the guess that memorization comes first because each example can be
developed alone while the compact circuit needs many parts to change together (a land-assembly problem).

## 10. Where the centre forms, and how many (new, 7 Oct; geography, technology and the regime map added the same day)

**Done since:** geography as a layer over the sites, and technology as a layer the arrivals make that grows
with use, spreads, is worth living on, fades the given geography and lengthens reach
([docs/6 §20](docs/6-derivations.md#20-geography-and-the-geography-people-make)). It reproduces Bleakley &
Lin's path dependence (a city stays where its coast put it only if what it built is worth living on) and
Baum-Snow's suburbanization (longer reach, 1.6× the land at lower density). Then a regime map
([docs/6 §21](docs/6-derivations.md#21-what-the-kernels-predict-a-regime-map-and-the-density-gradient)):
from the two kernels' transforms alone, whether a flat plain stays flat, gathers into one centre or breaks
into towns, and at what spacing. On a plain that wraps around (a torus knob on the agglomeration setting)
the predicted threshold and town count are exact: flat at a pull of 1.6, one bump at 2.0 against a
predicted 1.72; four towns where the two-bumps-per-side wave grows fastest. Clark's density gradient comes
out as β ≈ 1/ℓ. The first two items below are done by the torus; what the map does not do is new.

- **Location by history (done).** On the torus the bump forms where the initial ripple was largest, a
  different place in each run. The agents' bump should drift slowly there (a continuous attractor); not yet
  measured.
- **Towns in the interior (done).** On the torus the array fills the interior at the predicted spacing.
- **The end state at strong pull.** The map predicts onsets. At a pull of 4 or more with reach 1.25 the
  plain breaks into towns as predicted and the towns then merge until one parcel holds everything (Krugman's
  black hole). **What to do:** the condition for a single parcel to be stable (one site's pull against the
  rent and the competition it faces), drawn on the same map; and whether a saturating gain
  (`interaction.saturate`) turns the black hole into towns of finite size without dissolving them (the
  earlier attempt in §15 dissolved the cluster at the pull then used).
- **Growth near threshold is slow.** Just above the threshold the bump takes thousands of time units to
  appear (critical slowing down), so on the page a knob set barely past the border looks flat for a while.
  The map could show the predicted onset time.
- **A job is not a field.** Here a unit gains in proportion to how many partners are within reach. Fujita and
  Ogawa's polycentric regime comes from one-to-one matching of workers to firms with a linear commute cost,
  against a non-rival spillover. **What to do:** add a rival interaction, an optimal-transport cost between two
  types' loads, and check whether it gives towns without the competition kernel. It is also the city side of
  the rival/non-rival distinction that item 1 found on the learner side.
- **The substrate's dimension.** Brains are three-dimensional and cities two; the user's conjecture is that
  both maximize connectivity on their substrate at the cost of a latency floor (Rent's rule:
  [Bassett et al. 2010](https://doi.org/10.1371/journal.pcbi.1000748)). The 1D line layout was tried and
  gives a dense spike, the true 1D equilibrium under a normalized kernel, which makes a like-for-like
  comparison across dimensions ill-posed as the kernel is now. **What to do:** compare total wiring at
  equilibrium for the same connectivity graph (not field) embedded in 1D, 2D and a 3D lattice.
- **Technology as a vector, not a level.** One technology level does three things at fixed ratios (worth,
  fading, reach). Real technologies differ: rail lengthened reach and freed cities from rivers; air
  conditioning changed which climates were worth living in; the internet lengthened reach for some dealings
  and not others ([Gaspar & Glaeser 1998](https://doi.org/10.1006/juec.1996.2031)). **What to do:** several
  T fields, each with its own use (which types learn it), spread, and effect vector; a technology that fades
  one layer and raises the worth of another (air conditioning and the sunbelt) is the test case.
- **Who builds the made ground.** Here everyone's presence raises T and everyone gains from it: a public
  good with no free-riding, the planner's case. Roads are paid for; myelin costs the cell. **What to do:** a
  cost of building T charged to those at the site, and see whether towns under-build (item 1's lesson).
- **Latency as an outcome.** The hierarchy setting reports a forward pass's latency as the sum of its hops.
  Predictive-coding and recurrent networks answer at many latencies, early and rough or late and exact
  ([Lamme & Roelfsema 2000](https://doi.org/10.1016/S0166-2236(00)01657-X)); a feedforward pass at one. **What
  to do:** on the hierarchy's layout, run a predictive-coding settle from the learners engine and plot error
  against time crossed, against a feedforward pass of fixed latency.

## 11. Calibration against real data

**What's missing.** Every calibration is a toy. The city model's free-market city is about 3–4× denser than
real US metros.

**What to do.**

- **City side:** compare predicted bid-rent gradients and building heights with assessor data for a real
  metro (the CivicMapper project has cleaned parcel data for several dozen US cities), with a model that
  adds car commuting and the taste for yards.
- **Network side:** check the Erlang prediction (drops ≈ B(n, n) at capacity factor 1) against drop rates
  reported for real mixture-of-experts training runs, such as Switch Transformer's
  ([Fedus et al. 2022](https://arxiv.org/abs/2101.03961)).

## Unresolved results

- **Fast alternation of uses.** The neural-city script finds single-use zoning ahead when two uses alternate
  quickly (cost 8.86 zoned vs 9.99 mixed at phase length 1× the fade time). The one-model page's agent
  solver finds it roughly a tie, and traced its own earlier zoning advantage to its average-flow solver. Why
  the neural-city script differs hasn't been traced. The scripts differ in how nuisance and prices decay,
  so the first step is to run both with matched parameters.
- **The Hayek population is weak:** it finds the best action at only 3 to 5 of 6 states, because its bids
  rise only by mutation. Adding Baum's richer rule conditions, or letting agents revise bids toward realized
  revenue, should be tried before drawing any conclusion about selection-based credit.
- **Holland's own taxes** (existence and bid taxes) couldn't be confirmed from a primary source. The
  learners README cites the later ZCS and Hayek taxes instead. Worth checking Holland (1985) and
  Holland (1986) in print.
- **Marginal patterns differ between solvers.** Near the threshold where a plain breaks into towns (one type,
  reach 1.5), the flows find 8 shallow bumps and the agents 3–4; the presets stay in regimes where both agree,
  and the tests assert only what both give. The saturating gain never produced towns; it dissolves a cluster
  instead of splitting it.

## Engineering

- **Merge the two learner engines** (`learners.mjs` Part A and Part B) into one code path where a stage's
  price formation, accounting and allocation are settings. That's what "one parametrized model" should mean
  in code, and it's a prerequisite for item 1.
- **An interactive learners page,** like the one-model page, where the ten dimensions are knobs and the
  ladder runs live.
- **Vendor three.js** for the play-dough page, which loads it from a CDN; the other pages work offline.
