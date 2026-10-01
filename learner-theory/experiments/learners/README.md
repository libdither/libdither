# One model of learners: from a market of agents to matrices and backprop

Is there one parametrized model that specializes to many kinds of learners, from a full market of
bidding agents down to linear layers trained by backprop? Mostly, yes. In the model below, credit is a
**price**: what one more unit of some intermediate good is worth to whatever comes after. Learners
differ in how prices are formed and paid, and in who gets to produce.

```bash
node --test experiments/learners/learners.test.mjs   # 14 tests, about a second
node experiments/learners/ladder.mjs                  # every setting on the same tasks, ≈30 s
```

`learners.mjs` is the engine. `learners.test.mjs` checks each specialization against the textbook
learner it should equal, exactly, in expectation, or at equilibrium. `ladder.mjs` measures where each
setting lands.

## The model: a staged production economy

A learner is a chain of **stages**. Stage *t* receives a good *g*₍*t*−1₎ and produces *g*ₜ. In a
network a stage is a layer and the good is an activation vector. In sequential decision-making a stage
is a time step and the good is the state of the world.

- **Units.** Each stage holds units *u*, each with a technology φᵤ(·; θᵤ): a neuron's weights, an
  expert, an agent's action.
- **Allocation.** Each unit gets a share αᵤ ≥ 0, and the stage produces *g*ₜ = Σᵤ αᵤ·φᵤ(*g*₍*t*−1₎):
  - every unit of a dense layer writes its own coordinate, with α = 1;
  - a mixture weights whole outputs by a softmax of scores;
  - an auction gives the whole stage to the highest bidder.
- **Demand.** The last stage meets a loss or a reward.
- **Prices.** Each good gets a price: a vector, one price per coordinate, or a scalar for the whole good.
  - A unit's **revenue** is the value of what it produces.
  - Its **payments** are what it passes back to the units that supplied its input.
- **Learning.** Each unit changes θᵤ in response to its revenue (the **response rule**). Optionally, units
  enter and leave (the **population rule**).

Every learner in the table further down is this model with some choices fixed.

## The dimensions

Some dimensions are free choices. Others are forced by what can be known about each stage.

1. **Allocation: who produces.**
   - **Every unit (dense):** layers.
   - **A weighted coalition (soft):** softmax mixtures of experts, attention, soft competitive learning.
   - **One winner (hard):** winner-take-all, top-1 routing, auctions for control.

   Softmax at temperature τ runs continuously from soft to hard as τ → 0 (tested). This is the logit
   allocation of the `one-model` page, including the prices that balance it.

2. **Rivalry of the good.**
   - **Non-rival:** an activation can be read by every unit of the next layer at once. Its value is the
     *sum* of its users' marginal values, which is Samuelson's condition for a public good (Samuelson
     1954). That is exactly backprop's `a[l−1] = W[l]ᵀ e[l]` (tested).
   - **Rival:** control of the world's state can be held by one agent at a time, so it goes to one buyer
     by auction.

   Dense layers come with non-rival goods, and auctions with rival ones.

3. **What is known about each stage: white box or black box.**
   - **White box:** the stage's technology is known and differentiable. A price can then be computed for
     every coordinate of the good.
   - **Black box:** an environment, or a layer nobody may differentiate. The only prices available are
     scalars: a forecast of the whole good's value, or what someone actually pays for it.

   This is the deepest constraint on the rest. Computing a supplier's price needs the buyer's technology
   (`W[l]`), which is the weight-transport problem. It is also Hayek's knowledge problem: a planner can
   set exact prices only if it knows everyone's technology. Hayek described the price system as "a
   mechanism for communicating information" (Hayek 1945). Lange answered that one could "put the
   simultaneous equations on an electronic computer", and called the market's tâtonnement "a computing
   device of the preelectronic age" (Lange 1967). Backprop is such a computer for a single network.
   Feedback alignment is a planner using a wrong model of its buyers' technology. It still works,
   because the forward weights drift into "a soft alignment" with the wrong model (Lillicrap et al.
   2016).

4. **Price formation: how credit is computed.**

   | Price formation | Learners |
   |---|---|
   | Exact backward sweep | backprop (Linnainmaa 1976; Rumelhart et al. 1986). Its back-propagated gradients are Lagrange multipliers (LeCun 1988) |
   | Local relaxation to equilibrium, a tâtonnement | predictive coding (Whittington & Bogacz 2017), equilibrium propagation (Scellier & Bengio 2017), contrastive Hebbian learning (Xie & Seung 2003) |
   | A fixed wrong map | feedback alignment (Lillicrap et al. 2016), direct feedback alignment (Nøkland 2016) |
   | Targets instead of prices | target propagation (Lee et al. 2015) |
   | A learned forecast (bootstrapping) | TD critics (Sutton 1988), synthetic gradients (Jaderberg et al. 2017) |
   | A payment discovered by auction | bucket brigade (Holland; described in Sutton 1988 and Bull 2014), Vickrey societies (Chang et al. 2020), Hayek (Baum 1999) |
   | One broadcast scalar correlated locally with each unit's own noise | REINFORCE (Williams 1992), node perturbation, three-factor rules (Frémaux & Gerstner 2016) |
   | Dual prices between decoupled layers | ADMM, the method of auxiliary coordinates (Boyd et al. 2011; Carreira-Perpiñán & Wang 2014) |
   | None | Hebbian learning, competitive learning |

   Lillicrap et al. (2020) arrange the backprop-to-perturbation part of this list as "a spectrum of
   learning algorithms" by "the specificity of the synaptic change they prescribe". Boyd et al. (2011)
   call ADMM's dual variable "a vector of prices" and dual decomposition "the simplest algorithmic
   expression of tâtonnement".

5. **Granularity.** A price per coordinate (backprop, feedback alignment, predictive coding), one price
   per unit or agent (markets, TD), or one price for everything (a broadcast reward).

6. **Accounting.**
   - **Imputed prices:** signals no one pays. Backprop: no unit's update depends on what it "pays" its
     suppliers.
   - **Money:** it is conserved and changes hands, and a unit's wealth is its record (markets,
     classifier systems).
   - **Taxes**, where there is money:
     - a tax on the strength of an acting rule is exactly a discount factor (tested);
     - Hayek charges agents "a small amount of tax proportional to the amount of computation time they
       have used" (Kwee et al. 2001);
     - ZCS weakens "matching classifiers which advocate actions other than the selected action"
       (Wilson 1994): a tax on idle capacity.
   - **Where accounts are exact:** with backprop's prices, a network of linear or ReLU units without
     biases keeps exact accounts. Every unit's revenue equals its payments, and value is conserved from
     output to input (tested). This is Wicksteed's product exhaustion, "the marginal distribution
     exhausts the product" (Wicksteed 1894), in the form later stated through Euler's theorem on
     homogeneous functions. Biases and curved units are where rents appear.
   - **Attribution methods use the same accounts.** Gradient × Input is this conserved value for ReLU
     networks without biases (Ancona et al. 2018). Relevance propagation calls it "layer-wise relevance
     conservation" (Montavon et al. 2017). Integrated gradients "correspond to a cost-sharing method
     called Aumann-Shapley" (Sundararajan et al. 2017).

7. **Response rule: how a unit adapts to its credit.**
   - Gradient on the value of its own output at posted prices (backprop's weight update).
   - Revising a bid toward realized revenue (a bandit or TD update).
   - Hebbian / instar: move toward the inputs one wins.
   - Selection and mutation.

   Within gradient responses, the geometry varies further: Euclidean, multiplicative, or natural.
   Markets have their own: in a Fisher market with linear utilities, proportional-response trading is
   mirror descent (Birnbaum et al. 2011), the geometry of multiplicative weights (Arora et al. 2012).

8. **Population.** A fixed set of units, or units that enter when rich and exit when broke or idle
   (Hayek, classifier systems with a genetic algorithm, neuroevolution, and in brains, neural
   Darwinism; Edelman 1987).

9. **Horizon.** Credit within one step (supervised), bootstrapped from one step ahead (TD, bucket
   brigade), or carried through a full unroll (backprop through time, Monte Carlo).

10. **Incentives.** Either one objective that every unit's update serves (backprop) or private profit
    (markets). Private profit lines up with the global objective only under conditions:
    - Vickrey prices plus clones for Q-learning in a market for control (tested);
    - zero profit (Euler) for homogeneous networks (tested);
    - charging each unit its marginal effect on others: Pigouvian prices, or difference rewards, the
      "wonderful life utility" of Wolpert & Tumer (1999).

## From a Hayek economy to linear layers and backprop

Turn the knobs one at a time. Each step is a named learner, and each equivalence is checked in
`learners.test.mjs`.

1. **Hayek.** Rules bid to own the world's state. The winner pays its bid to the previous owner,
   collects the reward, and is paid by the next owner. Rules are born when rich and die when broke.
   - Settings: rival good; auction; realized scalar payments; money with a tax; evolved bids; a
     changing population.
   - Baum (1999): "competitive bidding forces agents to bid close to the expected value of the world
     after their action". With "agents whose condition is true for exactly one state, it basically
     reduces to Q-learning". Step 2 makes that exact.
   - My minimal version keeps exact books (tested), but reaches the optimal policy at only 3 to 5 of 6
     states across seeds. Its bids rise only by mutation, so it learns slowly.
2. **Fix the population and let each agent learn its valuation:** a market of learners.
   - **Vickrey pricing with two clones per action is Q-learning.** Bidding Q* is an equilibrium where
     every winner breaks even (exact; Chang et al. 2020), and learning reaches Q* at any exploration
     rate.
   - **First-price pricing (the bucket brigade's auction) is SARSA.** It learns the values of the
     exploring policy, not Q*.
   - **Vickrey without clones leaks credit.** Each winner pays the runner-up's bid, and values settle
     about 3 points (out of 8) low, at the fixed point predicted in advance.
3. **Bids proportional to wealth: Holland's bucket brigade is TD(0).** The bid fraction plus the tax is
   the step size; bid ÷ (bid + tax) is the discount.
   - Sutton (1988) made the link: "like TD(0), the bucket brigade updates each strength (prediction)…
     according to the immediately following temporal difference".
   - He also noted the difference. Holland's version pays the rules whose messages triggered the winner,
     whereas TD credits whatever came just before. The identity here is the one-rule-per-step case,
     where the two coincide.
4. **Drop the money:** prices become imputed forecasts. That is a TD critic.
5. **Broadcast one exact scalar instead:** REINFORCE, or node perturbation. Unbiased (tested), but the
   worst learner on the shared task; it also needed a smaller step to stay stable.
6. **Open the box: stages become known and differentiable,** so every coordinate can be priced.
   - A fixed wrong price map is feedback alignment. It still learns because the forward weights come to
     agree with the map (tested).
   - Prices found by local relaxation are predictive coding. Its settled errors equal backprop's prices
     to first order in the nudge (tested).
   - Prices from an exact sweep are backprop (tested against finite differences).
7. **Make the good non-rival and the allocation dense:** every unit of a layer reads all of the last
   one, and a supplier's price is the sum of what its buyers would pay.
8. **Linear (or ReLU) units without biases.** Backprop's imputed prices also balance as money: every
   unit breaks even, and the value of the output equals the value attributed to the input.

So the far end is a market too. It is a planned one: a central sweep computes every price exactly
because it knows every unit's technology, and in the homogeneous case those prices would also clear
real trade with zero profit. That is the socialist-calculation debate in miniature.
- **Lange's planning board** found prices "through this process of trial and error" (Lange 1936–37), as
  predictive coding does.
- **Lange's computer** solves them outright (Lange 1967), as backprop does. Kantorovich's multipliers for planned production were the same kind of price (Kantorovich 1960).
- **Hayek's market** discovers them by trade (Hayek 1945), as the auction learners do.

Chang et al. (2020) draw the same line: monolithic RL methods "are analogous to command-economies",
their society to a market economy.

## Named learners as coordinates

| Learner | Allocation | Stages | Prices formed by | Price per | Accounting | Response | Population |
|---|---|---|---|---|---|---|---|
| Least squares, backprop (MLP) | dense | white box | exact sweep | coordinate | imputed | gradient | fixed |
| Model-based policy gradient | one action per state, softmax | white box (known model) | exact sweep through the model | action | imputed | gradient | fixed |
| Backprop through time | dense, unrolled | white box | exact sweep through time | coordinate | imputed | gradient | fixed |
| Feedback alignment / direct FA | dense | white box forward, fixed feedback | a fixed random map | coordinate | imputed | gradient | fixed |
| Synthetic gradients | dense | white box | learned forecast | coordinate | imputed | gradient | fixed |
| Target propagation | dense | white box, learned inverses | targets, not prices | coordinate | imputed | local regression | fixed |
| Predictive coding | dense | white box | relaxation | coordinate | imputed | local, Hebbian-like | fixed |
| Equilibrium propagation, contrastive Hebbian | dense, recurrent | white box | two equilibria (free, nudged) | coordinate | imputed | Hebbian difference | fixed |
| Forward-forward (Hinton 2022) | dense | white box | layer-local objectives | none between layers | none | gradient | fixed |
| Node perturbation, REINFORCE | dense, stochastic | either | broadcast scalar × own noise | everything | imputed | correlation | fixed |
| Weight perturbation, evolution strategies | dense | black box | broadcast scalar | everything | imputed | correlation over a sample | sample of perturbations |
| Three-factor rules | dense | either | broadcast neuromodulator × eligibility | everything | imputed | Hebbian × scalar | fixed |
| Hebbian, Oja | dense | — | none | — | none | Hebbian | fixed |
| Competitive learning, k-means, SOM | hard (WTA) | — | none, or a conscience price | — | none | instar | fixed |
| Soft competitive learning, EM | soft | — | none | — | none | weighted instar | fixed |
| Mixture of experts (soft gate) | soft | white box | exact sweep | coordinate | imputed, maybe an auxiliary-loss tax | gradient | fixed |
| Top-k routing with a balancing bias | hard (auction) | white box | exact sweep through the winner | coordinate | imputed + a price by tâtonnement | gradient | fixed |
| Attention | soft: each query has a budget over non-rival keys | white box | exact sweep | coordinate | imputed | gradient | fixed |
| TD(0), TD(λ) critic | — | black box | learned forecast | state | imputed | TD | fixed |
| Q-learning | ≡ cloned Vickrey market | black box | auction payment | agent | money | bid revision | fixed |
| SARSA | ≡ first-price market | black box | auction payment | agent | money | bid revision | fixed |
| Holland's classifier system | an auction among the rules that match | black box | first-price payment, bid ∝ strength | rule | money (strength); later systems tax it (ZCS) | bucket brigade + genetic algorithm | births and deaths |
| Neural bucket brigade (Schmidhuber 1989) | winner-take-all within competitive subsets | network | winners pass "weight substance" back to the connections that set the stage | connection | the weights are the money: conserved, except leaks at the inputs and payoff coming in | weights change by payment | fixed |
| Hayek | hard (owner of the world) | black box | auction payment | agent | money, with a computation tax | evolved bids | born rich, die broke |
| Genetic algorithms, neuroevolution | — | black box | fitness only | individual | none | selection, mutation | population |
| ADMM; method of auxiliary coordinates | dense | white box | each layer's output made a variable and tied to the next by multipliers (ADMM) or penalties (MAC) | coordinate | imputed | layer-local optimization | fixed |

## What is exact, and what isn't

| Claim | Status | Test |
|---|---|---|
| Backprop's sweep gives the exact gradient | exact (finite differences, 1e-6) | `backprop: the adjoint sweep…` |
| Its adjoints are shadow prices: what one more unit of a layer's output is worth | exact | `backprop prices are shadow prices…` |
| A supplier's revenue is the sum of its buyers' payments (non-rival good) | exact, any units | `Euler…` |
| Linear/ReLU without biases: zero profit, value conserved output → input; with biases, profit = bias rent | exact | `Euler…` |
| Feedback alignment learns; its updates come to agree with backprop's (cosine 0.28 → 0.79) | measured | `feedback alignment…` |
| Node perturbation's update is an unbiased gradient | in expectation | `node perturbation…` |
| Predictive coding's settled errors equal backprop's prices | to first order in the nudge β | `predictive coding…` |
| Soft mixture → auction winner as τ → 0; gate gradient exact; a price moves the winner | exact | `mixture of experts…` |
| Cloned Vickrey market: bidding Q* is an equilibrium, winners break even, credit is conserved | exact | `market for control…` |
| Cloned Vickrey learns Q*; first price learns SARSA's fixed point; no clones learn the "second-best" fixed point | measured against predicted fixed points (≤ 0.1 of values ≈ 8) | `markets learn…` |
| Exact policy gradient through a known model; REINFORCE's average update is that gradient (cosine > 0.95) | exact; in expectation | `control with a white box…` |
| Bucket brigade with wealth-proportional bids = TD(0), with tax as discount | exact | `bucket brigade…` |
| A Hayek population keeps exact books | exact | `Hayek…` |
| Competitive learning finds cluster centres; a conscience price revives dead units | measured | `competitive learning…`, `a conscience…` |

## Measured: where each setting lands

From `node ladder.mjs`. The tasks are small, so these numbers show direction, not benchmark performance.

**Supervised task:** a tanh network (8 → 16 → 4) learning a linear teacher, 30 passes over 200
examples, median of 3 seeds. The loss starts at 2.337. Node perturbation used a step of 0.002 to stay
stable; the others used 0.01.

| Setting | Prices | Loss after |
|---|---|---|
| backprop | exact vector prices from a backward sweep | 0.0141 |
| predictive coding (β = 0.01, 300 relaxation steps) | prices found by local relaxation | 0.0143 |
| direct feedback alignment | output price sent straight to each layer | 0.0175 |
| feedback, align = 0.5 | half-right price map | 0.0206 |
| feedback alignment | a fixed random price map | 0.0258 |
| node perturbation | one broadcast scalar | 0.0462 |

**Control task:** a 6-state, 3-action deterministic MDP (γ = 0.9, Q* ≈ 8), 15 000 episodes of 30 steps
with 20% exploration, median of 3 seeds. The Hayek population ran on the same MDP with γ = 0.5 for
20 000 episodes, 5 seeds.

| Setting | Equivalent to | Error | Optimal actions |
|---|---|---|---|
| exact policy gradient through the known model | vector prices: the white-box end | policy value 0.000 below optimal | 6/6 |
| market, Vickrey, cloned | Q-learning (off-policy) | values 0.000 from Q* | 6/6 |
| REINFORCE | one broadcast scalar: the return | policy value 0.12 below optimal | 5/6 |
| market, first price (bucket-brigade auction) | SARSA (on-policy) | values 0.75 below Q* | 6/6 |
| market, Vickrey, no clones | credit leaks to the runner-up | values 3.05 below Q* | 5/6 |
| Hayek-style population | evolved bids, births and deaths | bids 0.45 below Q* | 3 to 5 of 6 |

The control task spans three kinds of price formation: exact prices through a known model, a broadcast
return, and auction payments.

**Unsupervised task:** three clusters. One unit starts in the middle of everything and two start far
away.

| Setting | Clusters covered | Share of wins |
|---|---|---|
| hard competition (winner-take-all) | 0/3 | 1, 0, 0 |
| soft competition, τ = 0.5 | 0/3 | 1, 0, 0 |
| hard competition + conscience (a price) | 3/3 | 0.34, 0.31, 0.35 |

## Combinations that don't work, and why

- **Exact vector prices through a black box.** There is nothing to differentiate. The only options are
  scalar prices (forecasts, payments, broadcasts) or a learned model of the box.
- **Paying backprop's prices as money in curved or biased units.** The books balance only for linear or
  ReLU units without biases. Elsewhere units earn rents or losses. If wealth mattered (broke units die),
  selection would act on those rents, which backprop never does.
- **Vickrey pricing without clones.** Credit leaks to the runner-up and every value ends up low (tested).
- **First-price pricing with exploration.** It learns the exploring policy's values, not the optimal
  ones (tested). Strategic bidders would also shade their bids; Vickrey pricing removes that incentive.
- **Competition with no price.** Dead units stay dead (tested). Adding a price for winning too often
  revives them; it's the same fix as the load-balancing bias in mixtures of experts.
- **Selection alone as credit assignment.** My Hayek-style population is far slower and less reliable
  than agents that learn their valuations, under the same market rules.

## Connections to the `one-model` page

- **Allocation.** The page's model (logit choice over sites with prices that ration capacity) is the
  allocation dimension here: who gets to produce, and how prices balance them.
- **Tuning.** Its tuning rule is the instar response of competitive learning.
- **Taxes.** The page asked which taxes have exact network counterparts and found that income and wealth
  taxes don't, because spikes have no budgets. Market learners do have budgets, so taxes are literal
  there, and one is exactly a discount factor.

## Limits of this investigation

- **Two engines, not one code path.** White-box stages (Part A) and black-box stages (Part B) share
  concepts and the allocation rule, but are separate code.
- **Small tasks only:** a few dozen units and a 6-state MDP. The claims tested are identities and fixed
  points, not performance at scale.
- **My Hayek is minimal:** no copyright shares, no rule conditions beyond a state, and fixed numeric
  bids. Its weak results are about this version, not about Baum's.
- **Not modelled:** second-order and natural-gradient geometry, meta-learning, evolution strategies'
  population, and target propagation's inverses. They are placed in the table, not implemented.

## References

Every reference was checked against the source itself. Quotes are verbatim; ones taken from OCR'd scans
were checked against two readings. "Partly verified" means the record or the claim was confirmed only
from a secondary source, a reprint or an author's draft.

- Ancona, Ceolini, Öztireli & Gross (2018). Towards better understanding of gradient-based attribution methods for deep neural networks. ICLR. [arXiv:1711.06104](https://arxiv.org/abs/1711.06104). Gradient × Input = ε-LRP needs only ReLUs; completeness also needs no biases.
- Arora, Hazan & Kale (2012). The multiplicative weights update method: a meta-algorithm and applications. *Theory of Computing* 8:121–164. [doi:10.4086/toc.2012.v008a006](https://doi.org/10.4086/toc.2012.v008a006)
- Baum (1999). Toward a model of intelligence as an economy of agents. *Machine Learning* 35(2):155–185. [doi:10.1023/a:1007593124513](https://doi.org/10.1023/a:1007593124513). See also Baum & Durdanovic (2000), *Neural Computation* 12(12):2743–2775, [doi:10.1162/089976600300014700](https://doi.org/10.1162/089976600300014700). Partly verified: the "two principles" (property rights, conservation of money) are quoted from the 2000 author draft.
- Birnbaum, Devanur & Xiao (2011). Distributed algorithms via gradient descent for Fisher markets. EC'11, 127–136. [doi:10.1145/1993574.1993594](https://doi.org/10.1145/1993574.1993594)
- Boyd, Parikh, Chu, Peleato & Eckstein (2011). Distributed optimization and statistical learning via the alternating direction method of multipliers. *Foundations and Trends in Machine Learning* 3(1):1–122. [doi:10.1561/2200000016](https://doi.org/10.1561/2200000016)
- Bull (2014). A brief history of learning classifier systems: from CS-1 to XCS. [arXiv:1401.3607](https://arxiv.org/abs/1401.3607). A secondary source for Holland's bucket brigade.
- Carreira-Perpiñán & Wang (2014). Distributed optimization of deeply nested systems. AISTATS, PMLR 33:10–19. [link](https://proceedings.mlr.press/v33/carreira-perpinan14.html)
- Chang, Kaushik, Weinberg, Griffiths & Levine (2020). Decentralized reinforcement learning: global decision-making via local economic transactions. ICML. [arXiv:2007.02382](https://arxiv.org/abs/2007.02382)
- Edelman (1987). *Neural Darwinism: The Theory of Neuronal Group Selection*. Basic Books.
- Frémaux & Gerstner (2016). Neuromodulated spike-timing-dependent plasticity, and theory of three-factor learning rules. *Frontiers in Neural Circuits* 9:85. [doi:10.3389/fncir.2015.00085](https://doi.org/10.3389/fncir.2015.00085)
- Hayek (1945). The use of knowledge in society. *American Economic Review* 35(4):519–530. [JSTOR 1809376](https://www.jstor.org/stable/1809376)
- Hinton (2022). The forward-forward algorithm: some preliminary investigations. [arXiv:2212.13345](https://arxiv.org/abs/2212.13345)
- Holland (1985). Properties of the bucket brigade. *Proc. 1st International Conference on Genetic Algorithms*, 1–7; and Holland (1986), Escaping brittleness, in *Machine Learning: An AI Approach* vol. 2, 593–623. Not verified from the primary texts; described here through Sutton (1988) and Bull (2014). Taxes are attested only in later systems (BOOLE, ZCS).
- Jaderberg et al. (2017). Decoupled neural interfaces using synthetic gradients. ICML, PMLR 70:1627–1635. [arXiv:1608.05343](https://arxiv.org/abs/1608.05343)
- Kantorovich (1960). Mathematical methods of organizing and planning production. *Management Science* 6(4):366–422. A translation of the 1939 original. [doi:10.1287/mnsc.6.4.366](https://doi.org/10.1287/mnsc.6.4.366)
- Kwee, Hutter & Schmidhuber (2001). Market-based reinforcement learning in partially observable worlds. [arXiv:cs/0105025](https://arxiv.org/abs/cs/0105025)
- Lange (1936–37). On the economic theory of socialism. *Review of Economic Studies* 4(1):53–71, [doi:10.2307/2967660](https://doi.org/10.2307/2967660); 4(2):123–142, [doi:10.2307/2967609](https://doi.org/10.2307/2967609). Partly verified: the "trial and error" quote is from the 1938 book reprint.
- Lange (1967). The computer and the market. In Feinstein (ed.), *Socialism, Capitalism and Economic Growth*, Cambridge University Press. Partly verified: quoted from an online transcription; page numbers not confirmed.
- LeCun (1988). A theoretical framework for back-propagation. *Proc. 1988 Connectionist Models Summer School*, 21–28. [pdf](http://yann.lecun.com/exdb/publis/pdf/lecun-88.pdf)
- Lee, Zhang, Fischer & Bengio (2015). Difference target propagation. ECML-PKDD, 498–515. [doi:10.1007/978-3-319-23528-8_31](https://doi.org/10.1007/978-3-319-23528-8_31)
- Lillicrap, Cownden, Tweed & Akerman (2016). Random synaptic feedback weights support error backpropagation for deep learning. *Nature Communications* 7:13276. [doi:10.1038/ncomms13276](https://doi.org/10.1038/ncomms13276)
- Lillicrap, Santoro, Marris, Akerman & Hinton (2020). Backpropagation and the brain. *Nature Reviews Neuroscience* 21(6):335–346. [doi:10.1038/s41583-020-0277-3](https://doi.org/10.1038/s41583-020-0277-3)
- Linnainmaa (1976). Taylor expansion of the accumulated rounding error. *BIT* 16(2):146–160. [doi:10.1007/BF01931367](https://doi.org/10.1007/BF01931367)
- Montavon, Lapuschkin, Binder, Samek & Müller (2017). Explaining nonlinear classification decisions with deep Taylor decomposition. *Pattern Recognition* 65:211–222. [doi:10.1016/j.patcog.2016.11.008](https://doi.org/10.1016/j.patcog.2016.11.008)
- Nøkland (2016). Direct feedback alignment provides learning in deep neural networks. NeurIPS. [arXiv:1609.01596](https://arxiv.org/abs/1609.01596)
- Rumelhart, Hinton & Williams (1986). Learning representations by back-propagating errors. *Nature* 323:533–536. [doi:10.1038/323533a0](https://doi.org/10.1038/323533a0)
- Samuelson (1954). The pure theory of public expenditure. *Review of Economics and Statistics* 36(4):387–389. [doi:10.2307/1925895](https://doi.org/10.2307/1925895)
- Scellier & Bengio (2017). Equilibrium propagation: bridging the gap between energy-based models and backpropagation. *Frontiers in Computational Neuroscience* 11:24. [doi:10.3389/fncom.2017.00024](https://doi.org/10.3389/fncom.2017.00024)
- Schmidhuber (1989). A local learning algorithm for dynamic feedforward and recurrent networks. *Connection Science* 1(4):403–412. [doi:10.1080/09540098908915650](https://doi.org/10.1080/09540098908915650)
- Sundararajan, Taly & Yan (2017). Axiomatic attribution for deep networks. ICML, PMLR 70:3319–3328. [arXiv:1703.01365](https://arxiv.org/abs/1703.01365)
- Sutton (1988). Learning to predict by the methods of temporal differences. *Machine Learning* 3(1):9–44. [doi:10.1007/BF00115009](https://doi.org/10.1007/BF00115009)
- Vickrey (1961). Counterspeculation, auctions, and competitive sealed tenders. *Journal of Finance* 16(1):8–37. [doi:10.1111/j.1540-6261.1961.tb02789.x](https://doi.org/10.1111/j.1540-6261.1961.tb02789.x)
- Whittington & Bogacz (2017). An approximation of the error backpropagation algorithm in a predictive coding network with local Hebbian synaptic plasticity. *Neural Computation* 29(5):1229–1262. [doi:10.1162/NECO_a_00949](https://doi.org/10.1162/NECO_a_00949)
- Wicksteed (1894). *An Essay on the Co-ordination of the Laws of Distribution*. Macmillan. Product exhaustion; the Euler's-theorem form came later.
- Williams (1992). Simple statistical gradient-following algorithms for connectionist reinforcement learning. *Machine Learning* 8:229–256. [doi:10.1007/BF00992696](https://doi.org/10.1007/BF00992696). Unbiasedness needs one learning rate for every weight.
- Wilson (1994). ZCS: a zeroth level classifier system. *Evolutionary Computation* 2(1):1–18. [doi:10.1162/evco.1994.2.1.1](https://doi.org/10.1162/evco.1994.2.1.1)
- Wolpert & Tumer (1999). An introduction to collective intelligence. [arXiv:cs/9908014](https://arxiv.org/abs/cs/9908014)
- Xie & Seung (2003). Equivalence of backpropagation and contrastive Hebbian learning in a layered network. *Neural Computation* 15(2):441–454. [doi:10.1162/089976603762552988](https://doi.org/10.1162/089976603762552988)
