# The common core: prices are Lagrange multipliers

Every exact result in docs 3–6 is one textbook idea, found again piece by piece: solve a problem with shared
limits by putting a price on each limit, and let every part optimize against the prices using only what it
knows. The prices are the problem's Lagrange multipliers. This doc names that idea, lists the prior work the
folder missed (most of it from networking), sorts the folder's results into textbook and new, and marks
where the idea stops.

## The recipe

Take parts i, each choosing x_i at a private cost f_i(x_i), and shared limits Σ_i A_i·x_i = b. Put a
multiplier λ on the limits:

ℒ = Σ_i f_i(x_i) + λᵀ·(Σ_i A_i·x_i − b)

For fixed λ the sum splits: each part minimizes f_i(x_i) + λᵀ·A_i·x_i on its own, its own costs plus what it
pays at posted prices. That is [Hayek (1945)](https://www.jstor.org/stable/1809376)'s market in one line.
At a solution λ is the **shadow price**: how much the optimum improves per unit the limit is relaxed.
[Everett (1963)](https://doi.org/10.1287/opre.11.3.399) made this a general method for allocating resources,
and [Boyd et al. (2011)](https://doi.org/10.1561/2200000016) call dual decomposition, the version where every
part solves its own piece, "the simplest algorithmic expression of tâtonnement".

There are three ways to find the prices, and they are the "price formation" column of doc 5:

| How the price is found | Rule | In this folder |
|---|---|---|
| **Penalty:** the price is the slope of a cost on use | λ = c′(use) | Rent = κ·load, the slope of building cost κ·load²/2 ⇄ adaptation. Predictive coding's errors ÷ β |
| **Dual ascent:** the price moves with excess demand (tâtonnement) | λ += step·(use − limit) | Set points, Sinkhorn, DeepSeek's balancing bias, the conscience price, the height-limit premium |
| **Exact solve:** compute the multipliers outright from the optimality conditions | λ from the adjoint equations | Backprop ([LeCun 1988](http://yann.lecun.com/exdb/publis/pdf/lecun-88.pdf)); Lange's computer |

Predictive coding fits the first row precisely. Its energy is β·L plus half the squared prediction errors,
which is the **quadratic penalty method** for the constraints "each layer equals f of the layer below". In
that method the violation of each constraint, times the penalty weight, estimates its multiplier and becomes
exact as the penalty grows ([Nocedal & Wright 2006](https://doi.org/10.1007/978-0-387-40065-5), ch. 17). Here
the penalty weight is 1/β, so error ÷ β → backprop's signal as β → 0: doc 6 §12, read as a known fact about
penalty methods. ADMM is the same constraints handled by an augmented Lagrangian.

## Every price in the folder is a multiplier

| Price | Limit it prices | Found by |
|---|---|---|
| Rent ⇄ adaptation (elastic supply) | Building cost, a penalty on each site's load | Penalty |
| Set-point price ⇄ Sinkhorn column scaling (fixed supply) | Load = capacity at each site | Dual ascent (Sinkhorn: exact block steps) |
| Height-limit premium b_j ⇄ firing-rate-cap multiplier | Load ≤ cap; zero when the cap doesn't bind | Dual ascent |
| Expert-balancing bias, conscience price | Each unit's share = its quota | Dual ascent with a sign step |
| Backprop's δ | Each layer's output = f(its input) | Exact solve |
| Predictive coding's error ÷ β | The same constraints | Penalty |
| A state's value V(s): the price a market for control pays for the world's state | Flow conservation: what flows into a state flows out | Learned forecast or auction (below) |
| An expert's price in the auction of [doc 5](5-learners-as-economies.md#one-price-for-rationing-and-credit) | Each expert's capacity | Ascending auction (dual ascent per batch) |

One term is not a price on a limit: the agglomeration ⇄ wiring gain of
[doc 6 §19](6-derivations.md#19-a-centre-that-isnt-given-agglomeration--wiring-economy) is a pairwise term of
the objective itself, the wiring cost of a layout. Its slope is what an arrival gains from a site, and with
symmetric dealings it sits inside F, so the prices around it stay multipliers; with one-sided dealings it
breaks the potential the way one-sided nuisance does (§17).

The last row needs a word. A Markov decision problem can be written as a linear program over how often each
state–action pair is used, its occupancy ([Manne 1960](https://doi.org/10.1287/mnsc.6.3.259)). With
discounting there is one constraint per state: flow in equals flow out, plus a (1 − γ) leak. The multipliers
of those constraints are the state values.
So "the price of the world's state" in [Chang et al. (2020)](https://arxiv.org/abs/2007.02382)'s market is
literally a shadow price:

- **Vickrey with clones** pays V*(s′), the multiplier of the optimal program (Q-learning).
- **First price** pays the exploring policy's value, the multiplier of that policy's own flow constraints
  (SARSA).
- **The bucket brigade's tax** sets 1 − γ = x/(b + x): the tax's share of what a rule pays out is exactly the
  program's leak (doc 6 §9).

The Pigouvian charge is the one price on the page that is *not* a multiplier of F. It is the gap between
the slope of F and the slope of the true total cost W (doc 6 §3), which is what an externality is.

## One formula across both halves

The allocation half and the credit half turn out to share their central formula, not just the idea of a
price.

- **Allocation (doc 3):** an arrival picks site j with probability ∝ e^{−c_j/τ}, and its expected utility is
  the logsum −τ·log Σ_j e^{−c_j/τ} (doc 6 §4).
- **Credit with entropy (soft reinforcement learning):** a policy picks action a with probability
  ∝ e^{Q(s,a)/τ}, and the state's value is τ·log Σ_a e^{Q(s,a)/τ}
  ([Haarnoja et al. 2017](https://arxiv.org/abs/1702.08165)). [Neu, Jonsson & Gómez (2017)](https://arxiv.org/abs/1705.07798)
  add an entropy term to the occupancy program (for average reward) and find its dual "closely resembling
  the Bellman optimality equations", so soft values are, to that degree, its multipliers.
- **Economics already joined them:** [Rust (1987)](https://doi.org/10.2307/1911259)'s dynamic discrete
  choice model, a bus manager deciding each month whether to replace an engine, is a logit choice with
  Gumbel taste noise whose options are priced by next month's logsum value.

So a market for control is the one-model page's choice rule run over time: each step is a logit choice,
and the prices of its options are the multipliers of the next step's constraints. That gives a concrete
form to the "merge the two learner engines" item in [`../NEXT_STEPS.md`](../NEXT_STEPS.md#engineering): a
stage is a logit choice, and stages differ only in where their option prices come from.

## Prior work the folder missed

**Networking solved allocation by prices first.** In network utility maximization each source picks a
sending rate to maximize its utility minus the price of the links it uses, and each link's price is the
multiplier of its capacity ([Kelly 1997](https://doi.org/10.1002/ett.4460080106);
[Kelly, Maulloo & Tan 1998](https://doi.org/10.1057/palgrave.jors.2600523)). Kelly et al. cast the problem in
primal or dual form, giving two classes of algorithm: congestion signals from a price set by current load,
or explicit rates from shadow prices. Those are the one-model page's two price rules: elastic supply (price =
slope of a cost of load) and fixed supply (price moves until load meets capacity, as in
[Low & Lapsley 1999](https://doi.org/10.1109/90.811451)). It became the standard model of internet congestion
control.

- [Palomar & Chiang (2006)](https://doi.org/10.1109/JSAC.2006.879350) is a tutorial on the decomposition
  methods.
- [Chiang, Low, Calderbank & Doyle (2007)](https://doi.org/10.1109/JPROC.2006.887322) read a whole protocol
  stack this way: each layer solves one piece of a shared problem, and prices coordinate the layers. That is
  the layered-network version of doc 5's staged production economy.
- [Johari & Tsitsiklis (2004)](https://doi.org/10.1287/moor.1040.0091) answer the strategic question for
  one case. When users anticipate how their bids move a link's price, total utility is still at least 3/4 of
  the maximum. This is the kind of bound [`../NEXT_STEPS.md`](../NEXT_STEPS.md) item 2 should look for.

**Markets for computing.** [Sutherland (1968)](https://doi.org/10.1145/363347.363396) had Harvard's PDP-1
users bid in a continuous auction for machine time, with priority set by how much bidding currency each was
given. [Spawn (Waldspurger et al. 1992)](https://doi.org/10.1109/32.121753) sold time slices on idle
workstations by second-price auctions. [Wellman (1993)](https://doi.org/10.1613/jair.2) computed competitive
equilibria to solve multicommodity flow problems. These are the computing ancestors of Baum's Hayek machine.

**Assignment by auction.** [Bertsekas (1988)](https://doi.org/10.1007/BF02186476)'s auction algorithm solves
the assignment problem by having people bid for objects. Its prices are the problem's dual variables, and the
best bidder raises a price by its margin over the second-best object. Mixture-of-experts routing has used
this problem directly: [BASE layers (Lewis et al. 2021)](https://arxiv.org/abs/2103.16716) solve a balanced
assignment of tokens to experts, [Clark et al. (2022)](https://arxiv.org/abs/2202.01169) use Sinkhorn for it,
and [expert choice routing (Zhou et al. 2022)](https://arxiv.org/abs/2202.09368) lets experts pick their
tokens. These matter for item 3 of [`../NEXT_STEPS.md`](../NEXT_STEPS.md).

## What's textbook and what's new

"Not found elsewhere" means not found in the sources checked for this folder. No systematic search was done
for each claim, so treat it as a lead, not a priority claim.

| Result | Doc | Status |
|---|---|---|
| The logit is a race of exponential clocks, a Gumbel argmax | 6 §1 | Textbook ([Yellott 1977](https://doi.org/10.1016/0022-2496(77)90026-8)) |
| The logit equilibrium minimizes a free energy whose multipliers are the prices; fixed supply is Sinkhorn | 6 §2 | Textbook (Beckmann 1956; Fisk 1980; Cuturi 2013; Galichon 2016) |
| Neural thresholds as multipliers | 3 | Known (Zylberberg et al. 2011) |
| A sheet of adapting neurons reproduces the city model's equilibrium under every rule in the video; rent ⇄ adaptation, height limit ⇄ rate cap | 2, 3 | Not found elsewhere. Both halves are textbook; the pairing and the check are new here |
| Each arrival counts half the nuisance; a Pigouvian charge makes the true cost the potential | 6 §3 | Textbook (user equilibrium vs system optimum in traffic). Reading superposition interference as this externality: not found elsewhere |
| A tax per resident doesn't move a closed city and is capitalized in an open one; a land tax moves nothing | 6 §4 | Textbook (Oates 1969; George 1879; Brueckner 1986) |
| Experts collapse when ρ/τ > 1 + r₀/load | 6 §5 | Derived here; the mechanism is Arthur (1989)'s increasing returns |
| Dropped tokens at a full expert follow Erlang's loss formula | 6 §6 | Textbook formula; applied to expert capacity here, not found elsewhere |
| Backprop's signals are multipliers | 6 §7 | Textbook (LeCun 1988) |
| An activation's price is a Samuelson sum: activations are public goods | 6 §7 | The math is the chain rule; the public-good reading not found elsewhere |
| Bias-free ReLU networks keep exact accounts at backprop's prices | 6 §8 | Known in attribution (Ancona et al. 2018; Montavon et al. 2017); the reading as Wicksteed's product exhaustion is new here |
| The bucket brigade is TD(0) | 6 §9 | Known (Sutton 1988). That its tax is the discount: derived here |
| Vickrey with clones is Q-learning | 6 §10 | Known (Chang et al. 2020) |
| First price is SARSA; Vickrey without clones settles at a predicted lower fixed point | 6 §10 | Derived here |
| Node perturbation and REINFORCE are unbiased | 6 §11 | Textbook (Williams 1992) |
| Predictive coding's errors are backprop's prices to first order | 6 §12 | Known (Whittington & Bogacz 2017); a property of quadratic penalty methods |
| Values are prices of states; soft values are logsums | this doc | Textbook (Manne 1960; Rust 1987; Neu et al. 2017) |
| Sharing is decided by whether uses peak together | 2 | Known (Elhage et al. 2022; Dorrell et al. 2024); the zoning reading is new here |

What the folder adds is mostly assembly: one model and one vocabulary across fields that cite each other
rarely, every link tested, plus a handful of small derived results. That is useful, but it is not a new
mechanism.

## Where the core stops

Multipliers need four things. Each gap in [`../NEXT_STEPS.md`](../NEXT_STEPS.md) is one of them failing.

1. **One shared objective.** Without one there are prices for each player's constraints but no single
   function they all lower. In the one-model page that happens when nuisance isn't mutual: two uses still
   settle, but three that each mind the next never do past a predicted threshold, and a Pigouvian charge
   restores the shared function ([doc 6 §17](6-derivations.md#17-without-a-shared-potential); item 4, done
   for the page).
2. **Price takers.** Multipliers assume nobody moves a price by their own choice. Agents who anticipate
   their effect on prices shade bids, and the question becomes how much efficiency is lost: Johari &
   Tsitsiklis's 3/4 for one setting, unknown for learners (item 2).
3. **Rival or excludable goods.** For a public good the multiplier still exists, the Samuelson sum, but no
   decentralized process finds it by voluntary payment, because each user gains by understating its share.
   The dense-layer market ([doc 5](5-learners-as-economies.md#a-market-for-a-dense-layer)) confirms it,
   and finds a second requirement hidden in the recipe: each example's forward pass is its own set of
   constraints with its own multipliers. A posted price, one for every example, is a restricted set of
   prices, and it can't teach a hidden unit which feature to compute (item 1, done).
4. **Convexity.** With non-convex costs the multipliers certify only stationary points. Everett's theorem
   still says that whatever the parts choose at given prices is optimal for the resources it ends up using,
   but not for the resources you wanted to hand out. Strong nuisance (doc 6 §3) and every deep network's
   loss sit here.

## For Dither

Dither's routing notes ([`../../research/dither/02-routing.md`](../../research/dither/02-routing.md)) ask how
relays should price forwarding and how to keep overlay traffic from overloading links. That is a network
utility maximization problem in which the nodes are strategic and keep their local information private. The
textbook part (prices as multipliers, primal and dual algorithms, layering as decomposition) is settled. The
open part is exactly items 2 and 3 above: nodes that anticipate prices, and prices that must stay private.
