# Learners as economies: credit is a price

Is there one parametrized model that specializes to many kinds of learners, from a market of bidding agents
down to linear layers trained by backprop? Mostly, yes. The unifying idea: **credit is a price**, what one
more unit of some intermediate good is worth to whatever comes after it. Learners differ in how prices are
formed and paid, and in who gets to produce.

The engine, tests and measured comparisons are in [`../experiments/learners/`](../experiments/learners/);
its README has the full taxonomy table and the reference list.

## The model: a staged production economy

A learner is a chain of **stages**. Stage t takes in a good and puts out another. In a network a stage is a
layer and the good is an activation vector. In decision-making a stage is a time step and the good is the
state of the world.

- **Units** at each stage each have a technology: a neuron's weights, an expert, an agent's action.
- **Allocation** decides who produces: every unit (a dense layer), a weighted coalition (a softmax mixture),
  or one winner (an auction).
- **Demand** comes at the end, as a loss or a reward.
- **Prices** value each good: one per coordinate (a vector), or one for the whole good (a scalar). A unit's
  revenue is the value of what it produces; its payments go back to whoever supplied its input.
- **Learning** is each unit changing its technology in response to its revenue. Optionally units are born
  and die.

## Ten dimensions

1. **Allocation:** dense, soft, or hard. A softmax at temperature τ slides from soft to hard as τ → 0.
   This is the logit allocation of [doc 3](3-one-model-two-readings.md).
2. **Rivalry and excludability.** An activation is *non-rival*: every unit of the next layer reads it at
   once, so its value is the sum of its users' marginal values, which is
   [Samuelson (1954)](https://doi.org/10.2307/1925895)'s condition for a public good, and exactly backprop's
   backward step. Control of the world is *rival*: one agent at a time, so it goes to one buyer by auction.
   Separately, a good is *excludable* if its supplier can withhold it from a buyer who doesn't pay. A
   broadcast activation isn't, which is what makes it a public good rather than a club good; see the
   dense-layer market below.
3. **White box or black box.** If a stage is known and differentiable, every coordinate can be priced. If
   it's an environment, prices can only be scalars: forecasts, payments or broadcasts. Computing a
   supplier's exact price needs the buyer's weights (the "weight transport" problem), which is also
   [Hayek (1945)](https://www.jstor.org/stable/1809376)'s knowledge problem: exact prices need knowledge of
   everyone's technology.
4. **How prices are formed:**

   | Price formation | Learners |
   |---|---|
   | Exact backward sweep | backprop ([Rumelhart et al. 1986](https://doi.org/10.1038/323533a0)); its signals are Lagrange multipliers ([LeCun 1988](http://yann.lecun.com/exdb/publis/pdf/lecun-88.pdf)) |
   | Local relaxation, a tâtonnement | predictive coding ([Whittington & Bogacz 2017](https://doi.org/10.1162/NECO_a_00949)), equilibrium propagation ([Scellier & Bengio 2017](https://doi.org/10.3389/fncom.2017.00024)) |
   | A fixed wrong map | feedback alignment ([Lillicrap et al. 2016](https://doi.org/10.1038/ncomms13276)) |
   | A learned forecast | TD critics ([Sutton 1988](https://doi.org/10.1007/BF00115009)), synthetic gradients ([Jaderberg et al. 2017](https://arxiv.org/abs/1608.05343)) |
   | A payment found by auction | the bucket brigade, Vickrey societies ([Chang et al. 2020](https://arxiv.org/abs/2007.02382)), Hayek ([Baum 1999](https://doi.org/10.1023/a:1007593124513)) |
   | One broadcast scalar | REINFORCE ([Williams 1992](https://doi.org/10.1007/BF00992696)), node perturbation, three-factor rules |
   | None | Hebbian and competitive learning |

5. **Granularity:** a price per coordinate, per agent, or one for everything; and across examples, one
   price per example (state-contingent, as in backprop) or one posted price for all. Only per-example
   prices teach a hidden unit which feature to compute (below).
6. **Accounting:** prices as signals nobody pays (backprop), or real money that is conserved and can be
   taxed (markets, classifier systems).
7. **Response:** follow a gradient, revise a bid, move toward the inputs won (Hebbian), or be selected.
8. **Population:** fixed, or units that are born rich and die broke.
9. **Horizon:** one step, bootstrapped one step ahead (TD), or a full unroll.
10. **Incentives:** one shared objective, or private profit made to line up with it (Vickrey prices plus
    clones; zero profit; charging each unit its effect on others).

## From a Hayek economy to backprop

Turn the knobs one at a time. Each step is a named learner, and each equivalence is a test in
`learners.test.mjs` (derivations in [doc 6](6-derivations.md)).

1. **Hayek** ([Baum 1999](https://doi.org/10.1023/a:1007593124513)). Rules bid to own the world's state;
   the winner pays the previous owner, collects the reward, and is paid by the next owner. Rules are born
   when rich and die when broke. Baum notes that with single-state agents it "basically reduces to
   Q-learning". My minimal version keeps exact books but finds the best action at only 3 to 5 of 6 states:
   its bids rise only by mutation.
2. **Fix the population; let each agent learn its valuation.**
   - Vickrey (second-price) auctions with two clones per action **are Q-learning**: bidding the optimal
     values is an equilibrium where every winner breaks even, and learning reaches them at any exploration
     rate.
   - First-price auctions **are SARSA**: they learn the values of the exploring policy, not the optimal one.
   - Vickrey without clones **leaks credit** to the runner-up, and values settle about 3 points (of 8) low,
     at a fixed point predicted in advance.
3. **Bids proportional to wealth: the bucket brigade is TD(0).** The bid fraction plus the tax is the step
   size; bid ÷ (bid + tax) is the discount. ([Sutton 1988](https://doi.org/10.1007/BF00115009) made the link,
   with a caveat: Holland pays the rules that triggered the winner, not just the one before it in time. The
   identity here is the one-rule-per-step case.)
4. **Drop the money:** prices become forecasts nobody pays. That's a TD critic.
5. **Broadcast one exact scalar instead:** REINFORCE or node perturbation. Unbiased, but slowest.
6. **Open the box.** Stages become known and differentiable, so every coordinate can be priced. A fixed
   wrong price map is feedback alignment (it works because the forward weights come to agree with the map).
   Prices found by local relaxation are predictive coding (equal to backprop's to first order). Prices from
   an exact sweep are backprop.
7. **Make the good non-rival and the allocation dense:** a supplier's price is the sum of what its buyers
   would pay.
8. **Linear or ReLU units without biases.** Backprop's prices also balance as money: every unit breaks even,
   and the value of the output equals the value attributed to the input. That's
   [Wicksteed (1894)](https://en.wikipedia.org/wiki/Philip_Wicksteed)'s product exhaustion; biases are where
   rents appear. Attribution methods use the same accounts: Gradient × Input is this conserved value for
   bias-free ReLU networks ([Ancona et al. 2018](https://arxiv.org/abs/1711.06104)).

So the far end is a market too, but a planned one: a central sweep computes every price exactly because it
knows every unit's technology. That is the socialist-calculation debate in miniature. Lange's planning board
found prices "through this process of trial and error" ([Lange 1936–37](https://doi.org/10.2307/2967660)),
as predictive coding does. Lange's
computer solves them outright (Lange 1967), as backprop does. Hayek's market discovers them by trade, as the
auction learners do. [Chang et al. (2020)](https://arxiv.org/abs/2007.02382) draw the same line: monolithic RL
methods "are analogous to command-economies".

## What was measured

From `ladder.mjs`, on small tasks, so these show direction, not benchmark performance.

**Supervised** (tanh network 8 → 16 → 4, loss starts at 2.337): backprop 0.0141, predictive coding 0.0143,
direct feedback alignment 0.0175, half-right feedback 0.0206, feedback alignment 0.0258, node perturbation
0.0462. The ranking follows how accurate each price is.

**Control** (6 states, 3 actions, γ = 0.9):

| Setting | Error | Best actions found |
|---|---|---|
| Exact policy gradient through the known model | 0.000 | 6/6 |
| Vickrey market with clones (= Q-learning) | 0.000 | 6/6 |
| REINFORCE | policy value 0.12 below optimal | 5/6 |
| First-price market (= SARSA) | values 0.75 below optimal | 6/6 |
| Vickrey market without clones | values 3.05 below optimal | 5/6 |
| Hayek-style population (γ = 0.5) | bids 0.45 below optimal | 3 to 5 of 6 |

**Unsupervised** (three clusters, two units starting far away): plain hard or soft competition covers 0 of
3 clusters, because units that start far away never win. Adding a "conscience" (a price for winning too
often, [DeSieno 1988](https://doi.org/10.1109/ICNN.1988.23839)) covers all 3. That price is the same fix as
the load-balancing bias in mixtures of experts.

## A market for a dense layer

Can the units of a dense layer trade their way to backprop? Each unit buys its inputs at a price per unit
and sells its output; the last layer is paid by the customer, y − h per unit; every unit raises its own
profit at the prices it faces. (Charging a unit its inputs' marginal contribution instead leaves a
bias-free ReLU unit's profit at zero for every weight, so it learns nothing; [doc 6 §13](6-derivations.md#13-a-market-for-a-dense-layer-what-a-unit-buys).)
The designs differ in what a hidden unit is told. On the supervised task above, with a bias-free ReLU
network (best readout on the starting features: 0.254):

| Design | A hidden unit is told | Loss | Best readout on its features |
|---|---|---|---|
| Honest per-example prices; VCG | its exact price, each example | 0.0077 | 0.0072 |
| Excludable access sold at its true value | what its buyers would lose without it, each example | 0.020 | 0.015 |
| Node perturbation (for comparison) | one broadcast change in loss | 0.061 | 0.042 |
| Honest price, averaged over examples | its exact price, averaged | 0.21 | 0.20 |
| Voluntary payment | nothing: buyers get its output anyway | 0.27 | 0.25 (unchanged) |
| Excludable posted asks | the asks its buyers accept | 0.70 | 0.26 |

"Best readout" is the lowest loss any linear readout could reach on the hidden layer: how much the hidden
layer itself learned. Four findings, each derived in [doc 6](6-derivations.md) §13–16 and tested:

- **Voluntary payment buys nothing.** A buyer gets the activation whether it pays or not, so a
  self-interested buyer pays nothing and only the last layer learns: Samuelson's free-rider problem, exactly.
- **VCG fixes honesty and leaves a budget gap.** With Clarke payments each buyer pays v²/2, reporting truly
  is dominant, and learning is backprop's. Payments fall short of the cost of the supplier's push by
  Σ_{j<k} v_j·v_k, the amount its buyers agree: they covered 95% with independent outputs and 80% with
  nearly identical ones. That gap is the planner's subsidy.
- **Prices must vary with the example.** A hidden unit's average update is E[price]·E[f′·x] +
  Cov(price, f′·x), and only the covariance can turn a unit toward a new feature. A posted price, even
  honest and signed, keeps only the first term. Backprop is a complete market of state-contingent prices
  ([Arrow 1964](https://doi.org/10.2307/2296188)); one price for all examples is an incomplete one.
- **Exclusion makes counterfactual credit measurable.** A supplier that can withhold its output can learn
  what buyers lose without it: Wolpert & Tumer's difference reward. Correlated with the supplier's own jitter
  it is unbiased, has a tenth of node perturbation's variance, and learns features within 2× of backprop.
  But charging that value example by example needs honest buyers or a view of their losses, which is the
  reporting problem again.

So a market of units matches backprop on dense features only with three things a planner provides for
free: a price per example, signed, and honestly reported for a good every buyer gets at once. Drop any one
and the hidden layer stops learning.

## One price for rationing and credit

A mixture of experts runs two prices that real markets merge. A balancing bias rations capacity, and the
gradient through the router's gate assigns credit. Can one price do both? Experts bid their forecast of the
loss reduction they'd deliver on each token; an ascending auction with one price per expert assigns tokens
within capacity; each expert moves its bid toward the loss reduction it realized, which is what it's paid.
There is no router gradient and no bias. The task has 4 linear experts and inputs from 4 clusters, each
with its own linear map (derivation in [doc 6 §18](6-derivations.md#18-one-price-per-expert-rationing-by-auction-credit-by-bids)):

| Design | Loss, capacity 1× | Loss, 1.25× | Dropped tokens' worth ÷ average (1×) | Worst cluster's best expert fit |
|---|---|---|---|---|
| Gate + bias, overflow dropped in arrival order | 0.489 | 0.158 | 1.02 | 0.003 |
| Gate + bias, overflow dropped by gate probability | 0.349 | 0.123 | 0.74 | 0.001 |
| Auction, quadratic bids | 0.317 | 0.218 | 0.38 | 0.013 |
| Auction, linear bids | 0.568 | 0.427 | 0.57 | 0.091 |

- **One price can do both jobs.** The auction keeps every expert within capacity with no bias, and its
  allocation is optimal for the bids: tokens' surplus plus experts' capacity rents equals the value served.
- **It rations better.** When capacity binds it drops the tokens worth least, so at 1× it has the lowest
  loss.
- **It assigns credit worse.** A bid must be right as an amount, while a router score only needs the right
  ranking. Experts trained under the auction fit their clusters 4–10× worse, and with capacity to spare
  the bid errors turn tokens away, so at 1.25× the gate wins.

So the engineered split is not just convenience: it buys cheap, precise credit at the cost of cruder
rationing. Tokens are rival (one expert each), so there is no free-rider problem here, unlike the
dense-layer market above. What a price costs is precision.

## Combinations that don't work

- **Exact vector prices through a black box:** there's nothing to differentiate.
- **Paying backprop's prices as money in curved or biased units:** units earn rents or losses, and if
  wealth mattered (broke units die), selection would act on those rents, which backprop never does.
- **Vickrey pricing without clones:** credit leaks.
- **First-price pricing with exploration:** learns the exploring policy's values. Strategic bidders would
  also shade their bids; Vickrey pricing removes that incentive.
- **Competition with no price:** dead units stay dead.
- **Selection alone as credit assignment:** far slower than agents that learn their valuations.
- **Voluntary payment for activations:** self-interested buyers pay nothing for a good they get anyway.
- **Posted prices for features:** one price for every example can't turn a hidden unit toward a feature,
  and a non-negative ask only ever says "produce more".

## How this answers the tax question

[Doc 4](4-taxes.md) found that income and wealth taxes have no counterpart in a layer of neurons, because
spikes have no budgets. Market learners do have budgets, so taxes there are literal, and one of them is
exactly a discount factor.

## Limits

- **Two engines, not one code path.** Known, differentiable stages and environment stages share concepts
  and the allocation rule but are separate code.
- **Small tasks only.** The tests establish identities and fixed points, not performance at scale.
- **The Hayek population is minimal.** Its weak result is about this version, not Baum's.
- **The spectrum is supported at its ends and some points between.** The only market design here that
  learns a representation, access sold at its true value per example, assumes buyers' losses can be seen.
  [`../NEXT_STEPS.md`](../NEXT_STEPS.md) lists what's left.
