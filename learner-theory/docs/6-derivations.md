# Derivations

Short proofs of the identities the other docs rely on. Each one is also checked numerically by a test,
named at the end of its section. Notation follows [doc 3](3-one-model-two-readings.md) (sections 1–6, 17, 19 and
20) and [doc 5](5-learners-as-economies.md) (sections 7–16 and 18).

## 1. The logit is a race of exponential clocks

Give each option j a clock that rings after an exponential time T_j with rate e^{−c_j/τ}, and the outside
option one with rate e^{V_0/τ}. The first clock to ring wins.

- The minimum of independent exponential times is clock j's with probability rate_j ÷ Σ rates, so
  P(j) = e^{−c_j/τ} ÷ (e^{V_0/τ} + Σ_i e^{−c_i/τ}): the logit, or softmax.
- Write T_j = E_j ÷ rate_j with E_j a standard exponential. Then τ·log T_j = c_j + τ·log E_j = c_j − τ·ε_j,
  where ε_j = −log E_j has a standard Gumbel distribution. The first clock to ring is the option with the
  lowest c_j − τ·ε_j: a chooser with Gumbel taste noise.

So "neurons with escape noise race to fire and the first takes the input" and "a household adds random
tastes and takes the best deal" are the same random process, not two that happen to share a formula
([Yellott 1977](https://doi.org/10.1016/0022-2496(77)90026-8); in machine learning this is the Gumbel-max
trick, [Maddison et al. 2014](https://arxiv.org/abs/1411.0030)).
Test: `formal: the first of exponential clocks is a softmax draw…`.

## 2. The equilibrium minimizes a free energy

Classes c (a type k and a source s) arrive at rate λ_c and send flow x_cj to site j, with Σ_j x_cj = λ_c.
Site loads are r_j = Σ_c x_cj, and r_jA, r_jB are the loads of two types. Take

F = Σ_cj x_cj·(t·d_sj + m·(1 − fit_kj)) + Σ_j κ·r_j²/2 + ν·κ·Σ_j r_jA·r_jB − ρ·Σ_j G(r_j) + τ·Σ_cj x_cj·log(x_cj/λ_c)

with G′(r) = log(1 + r/r_0). With a multiplier μ_c for each class's total, setting ∂F/∂x_cj = μ_c gives

t·d + m·(1 − fit) + κ·r_j + ν·κ·r_{j,−k} − ρ·log(1 + r_j/r_0) + τ·(log(x_cj/λ_c) + 1) = μ_c

so x_cj ∝ λ_c·e^{−c_cj/τ}, with c_cj the cost of section 1 and price p_j = κ·r_j. That is the logit
equilibrium with rent equal to the cost of the last floor: every stationary point of F is an equilibrium of
the model and vice versa, and each price is the slope of a term of F at its site's load, a Lagrange
multiplier. A function whose gradient gives every player's cost makes this a potential game
([Sandholm 2001](https://doi.org/10.1006/jeth.2000.2696)).

When F is convex (no scale term, weak nuisance), the minimum is unique. With a **fixed supply** instead, the
term Σ κ·r_j²/2 becomes the constraint r_j = c, each site's price is that constraint's multiplier, and F is
entropic optimal transport. Sinkhorn's algorithm solves it by alternately rescaling rows (classes) and
columns (sites); in logs the column step is a_j += τ·log(r_j/c), the page's set-point rule
([Cuturi 2013](https://arxiv.org/abs/1306.0895)).
Tests: `formal: the average-flow equilibrium is where the free energy is lowest`;
`formal: fixed supply ⇄ a set point is Sinkhorn…`.

## 3. The nuisance is counted half

Each type-A arrival at j suffers ν·κ·r_jB, so type A suffers r_jA·ν·κ·r_jB in total there, and type B
suffers the same amount. The nuisance actually suffered is 2·ν·κ·Σ_j r_jA·r_jB, twice the term in F.

The true total cost is therefore W = F + ν·κ·Σ_j r_jA·r_jB. Its slope for a type-A arrival at j is the slope
of F plus ν·κ·r_jB: the nuisance this arrival causes the B's already there. Charging each arrival that amount
(a Pigouvian tax, equal to the nuisance it suffers, so "counting the nuisance twice") makes the equilibrium
a stationary point of W instead of F.

When ν is small, W is convex and the charged equilibrium is the optimum. When ν is large, the bilinear term
makes W non-convex: several separated layouts are local minima, and the charge only guarantees reaching one
of them. A network trained by gradient descent on a total loss computes the slope of W, not F, which is why
it "internalizes" interference without a tax. For nuisance that isn't mutual, see section 17.
Test: `formal: the equilibrium counts half the nuisance…`.

## 4. Taxes: shift invariance and capitalization

- **Per resident.** Adding H to every c_j leaves e^{−(c_j+H)/τ} ÷ Σ_i e^{−(c_i+H)/τ} unchanged, so in a closed
  city nothing moves. Only an untaxed outside option breaks the symmetry. In an open city people leave until
  the expected utility of staying, −τ·log Σ_i e^{−c_i/τ} − H, is back at its reference. To first order that
  logsum changes by −Σ_i P_i·Δc_i, so the occupancy-weighted average rent must fall by about H: the tax is
  capitalized into land.
- **On buildings.** The price is (1 + θ)·κ·r_j, the same as building cost κ' = (1 + θ)·κ.
- **On land value.** The landowner's residual p·r − (1 + θ)·κ·r²/2 appears in no c_j and no term of F, so
  taxing any share of it changes nothing.

Tests: `taxes: …` (three tests, both solvers).

## 5. When experts collapse

Turn balancing off and make everything else symmetric across K experts, so only the scale term
ρ·log(1 + r/r_0) differs. An expert's share is ∝ (1 + r_j/r_0)^{ρ/τ}: the pull grows as a power of use, an
urn process ([Arthur 1989](https://doi.org/10.2307/2234208)). At the even split r_j = r, perturb loads by δ_j
with Σ δ_j = 0. The next round's loads move by

δ_j' = r·(ρ/τ) ÷ (r_0 + r) · δ_j

so the even split is unstable when (ρ/τ)·r ÷ (r_0 + r) > 1, that is, when **ρ/τ > 1 + r_0/r**. The same
condition is where F's curvature, τ/r − ρ/(r_0 + r), turns negative. With the page's r_0/r = 0.2 the
threshold is 1.2; the simulation is stable at ρ/τ = 1 and collapses at 1.5.
Test: `formal: rich-get-richer collapses when ρ/τ exceeds 1 + r₀/load…`.

## 6. Overflow at a full expert is Erlang loss

If a full expert drops tokens and the router can't see that it's full, each expert sees a Poisson stream (a
random split of a Poisson stream is Poisson), holds each token for an exponential time, and has n slots.
That's Erlang's loss system: the share dropped is

B(n, A) = (A^n/n!) ÷ Σ_{k=0}^{n} A^k/k!, with A = arrival rate × mean stay.

At capacity equal to the average load, B(80, 80) = 0.084 and B(320, 320) = 0.043: for large n,
B(n, n) ≈ 1/(√(πn/2) + 2/3), so it halves when agents get four times more numerous and smaller. Average flows
have no fluctuations and drop almost nothing (0.4%, from slight imbalance), which is why real mixtures of
experts run with capacity factors above 1 ([Fedus et al. 2022](https://arxiv.org/abs/2101.03961)).
Test: `formal: capacity overflow is Erlang loss…`.

## 7. Backprop's signals are prices, and an activation is a public good

A network computes z_l = W_l·h_{l−1} + b_l and h_l = f(z_l), ending in a loss L(h_L). Treat "layer l outputs
f(z_l)" as a constraint with multiplier λ_l:

ℒ = L(h_L) + Σ_l λ_lᵀ·(f(W_l·h_{l−1} + b_l) − h_l)

Stationarity in h_l gives λ_L = ∂L/∂h_L and λ_{l−1} = W_lᵀ·(f′(z_l) ⊙ λ_l): the backward sweep. So the
signals backprop computes are the multipliers ([LeCun 1988](http://yann.lecun.com/exdb/publis/pdf/lecun-88.pdf)),
and π_l = −λ_l is a shadow price: the loss saved by one more unit of layer l's output.

Unit i's output is read by every unit k of the next layer at once. Buyer k values one more unit of h_i at
π_k·f′(z_k)·W_ki, and the supplier's price is π_i = Σ_k π_k·f′(z_k)·W_ki: the **sum** of its users' marginal
values. That is [Samuelson (1954)](https://doi.org/10.2307/1925895)'s condition for a public good. (For a
rival good, which one buyer uses up, marginal values would be equal across buyers instead.)
Tests: `backprop: the adjoint sweep…`; `backprop prices are shadow prices…`.

## 8. Zero profit for linear and ReLU units without biases

Unit k earns π_k·h_k = π_k·f(z_k) and pays each supplier i its marginal contribution π_k·f′(z_k)·W_ki·h_i,
which totals π_k·f′(z_k)·(z_k − b_k). Its profit is

π_k·(f(z_k) − f′(z_k)·z_k) + π_k·f′(z_k)·b_k

Linear and ReLU units satisfy f(z) = f′(z)·z, so profit is π_k·f′(z_k)·b_k: **zero without a bias, and the
bias's rent with one**. By section 7, each supplier's revenue is exactly the payments it receives, so with
zero profit every layer's total revenue equals the next layer's, and the value of the output π_L·h_L equals
the value attributed to the input π_0·x. This is product exhaustion
([Wicksteed 1894](https://en.wikipedia.org/wiki/Philip_Wicksteed); later stated via Euler's theorem on
homogeneous functions), and it's why Gradient × Input attributions sum to the output in bias-free ReLU
networks ([Ancona et al. 2018](https://arxiv.org/abs/1711.06104)). Curved units (tanh) earn rents or losses.
Test: `Euler…`.

## 9. The bucket brigade is TD(0)

Under a fixed policy, give each state's rule a strength S_i. When rule i acts it pays its bid, b·S_i, to the
rule before it and a tax x·S_i; it receives the reward r and, when the next rule j acts, j's bid b·S_j. So

S_i ← S_i − (b + x)·S_i + b·S_j + r = S_i + (b + x)·[ r/(b + x) + (b/(b + x))·S_j − S_i ]

which is TD(0) on S with step α = b + x, discount γ = b/(b + x), and rewards scaled by 1/(b + x). With no
tax, γ = 1: **the tax is the discount**. [Sutton (1988)](https://doi.org/10.1007/BF00115009) made the link,
noting that Holland pays the rules whose messages triggered the winner rather than the one just before it in
time; this identity is the one-rule-per-step case.
Test: `bucket brigade with bids proportional to wealth is TD(0)…`.

## 10. Markets for control: Vickrey is Q-learning, first price is SARSA

Agents each own an action and bid a valuation v(s, a). The highest bidder at state s acts, pays a price to
the previous winner, and earns the reward plus γ times the price the next winner pays. It moves its valuation
toward what it earned: v(s, a) += η·(r + γ·P(s′) − v(s, a)).

- **Vickrey (second price) with two clones per action.** P(s′) is the highest bid among the other agents.
  The top bidder's clone bids the same, so P(s′) = max_a′ v(s′, a′) whoever wins, even an exploring agent.
  The update is Q-learning's, off-policy, at any exploration rate. At v = Q*, the greedy winner pays
  Q*(s, a*) and earns r + γ·max Q*(s′, ·) = Q*(s, a*): zero profit, so bidding Q* is an equilibrium
  ([Chang et al. 2020](https://arxiv.org/abs/2007.02382)).
- **First price.** P(s′) is the next winner's own bid. With ε-greedy winners its expected value is
  (1 − ε)·max v + ε·mean v: (expected) SARSA, which learns the exploring policy's values.
- **Vickrey without clones.** The greedy winner (probability p = 1 − ε + ε/n_A) pays the second-highest bid;
  an explorer pays the highest. The target becomes r + γ·(p·v₍₂₎ + (1 − p)·v₍₁₎), so credit leaks to the
  runner-up and values settle below Q*. The test computes this fixed point in advance and finds the market
  within 0.1 of it, about 3 below Q* (of 8).

Tests: `market for control…`; `markets learn…`.

## 11. Broadcast scalars are unbiased

- **Node perturbation.** Add independent noise ξ_k with variance σ² to each unit's input, broadcast the
  change in loss ΔL ≈ ∇L·ξ, and let each unit step by −η·ΔL·ξ_k/σ². Since E[ξ_j·ξ_k] = σ²·[j = k], the
  expected step is −η·∂L/∂z_k, plus terms that vanish as σ → 0.
- **REINFORCE.** By the policy gradient theorem, E[G·∇log π(a | s)] = ∇J, where G is the return that
  followed ([Williams 1992](https://doi.org/10.1007/BF00992696)). Unbiased, but one scalar for everything
  means high variance; it was the slowest learner on the shared tasks.

Tests: `node perturbation…`; `control with a white box…`.

## 12. Predictive coding's errors are backprop's prices, to first order

Clamp the input, pull the output toward the target with strength β, and let activities relax to the
minimum of the summed squared prediction errors. At equilibrium each layer's error, divided by β, equals
backprop's signal for that layer up to terms of order β
([Whittington & Bogacz 2017](https://doi.org/10.1162/NECO_a_00949); the same argument underlies equilibrium
propagation, [Scellier & Bengio 2017](https://doi.org/10.3389/fncom.2017.00024)). In the tests the gap is
under 0.01 at β = 0.001 and shrinks in proportion to β. The prices are found by local trial and error, a
tâtonnement, rather than a sweep.
Test: `predictive coding…`.

## 13. A market for a dense layer: what a unit buys

Let each unit of a dense network be a firm. Unit k sells its output h_k at a price c_k per unit, and buys
each input h_i. There are two ways to charge it for inputs.

- **Its marginal contribution,** c_k·f′(z_k)·W_ki·h_i, as in section 8. Then its profit is
  c_k·(f(z_k) − f′(z_k)·z_k), which for bias-free ReLU units is zero **for every weight**. "Raise your
  profit" gives no learning signal at all.
- **A price per unit of input,** q_ki·h_i, with q_ki fixed by the market rather than by k's own weights.
  Then ∂profit/∂W_ki = c_k·f′(z_k)·h_i, backprop's update when c_k is backprop's price.

So the market below uses per-unit prices. Buyer k's marginal value for one more unit of h_i is
v_ki = c_k·f′(z_k)·W_ki, and supplier i learns from its credit c_i, whatever it is told:

- **Honest:** c_i = Σ_k v_ki each example, the Samuelson sum of section 7, so the market is backprop.
- **Voluntary:** each buyer chooses what to pay. It gets h_i whether it pays or not (the good is
  non-excludable), and its payment only helps later, through the supplier's learning, and helps every
  other buyer just as much. With a small learning rate the benefit to the payer is of order η against a
  cost of order 1, so it pays nothing: the private provision of a public good, where contributions fall
  short ([Bergstrom, Blume & Varian 1986](https://doi.org/10.1016/0047-2727(86)90024-1)). Then c_i = 0 and
  only the last layer learns.

Test: `a market for a dense layer…`.

## 14. Clarke payments for a feature, and who pays the gap

Take one supplier and one example. The decision is how far to push the supplier, d. Buyer k gains v_k·d,
and the push costs d²/2: the step a gradient update takes is the d that maximizes g·d − d²/(2η), so the
quadratic is the step's own cost. Welfare Σ_k v_k·d − d²/2 is highest at d* = Σ_k v_k, backprop's price.

Clarke's payment ([Clarke 1971](https://doi.org/10.1007/BF01726210); a
[Groves 1973](https://doi.org/10.2307/1914085) mechanism) charges buyer k what its report costs everyone
else. With A the sum of the others' values and r_k its report,

t_k = max_d (A·d − d²/2) − (A·(A + r_k) − (A + r_k)²/2) = r_k²/2

Buyer k's utility v_k·(A + r_k) − r_k²/2 is highest at r_k = v_k whatever A is, so reporting truly is a
dominant strategy, and the supplier learns exactly as under backprop. The payments total Σ_k v_k²/2, while
the push costs (Σ_k v_k)²/2. The gap is

(Σ_k v_k)²/2 − Σ_k v_k²/2 = Σ_{j<k} v_j·v_k

It is positive when buyers' values agree and negative when they conflict. With n buyers who agree exactly,
payments cover 1/n of the cost. With uncorrelated values they cover it on average. No truthful mechanism of
this kind balances its budget in general
([Green & Laffont 1977](https://doi.org/10.2307/1911219)), so if the supplier must be paid for its push,
someone outside the market makes up Σ_{j<k} v_j·v_k: a planner's subsidy that grows with how much the
buyers agree about the feature. On the ladder task the payments cover 95% of the cost with independent
outputs and 80% when the outputs are made nearly alike.

Test: `VCG for a feature…`.

## 15. Prices that don't vary with the example can't teach a feature

Supplier i's average update is E[c_i·f′(z_i)·x]. Split it:

E[c·f′(z)·x] = E[c]·E[f′(z)·x] + Cov(c, f′(z)·x)

A price fixed across examples keeps only the first term: a fixed vector E[f′(w·x)·x] times a number. For
inputs symmetric about zero, tanh′ is even, so E[tanh′(w·x)·x] = 0: no drift at all. For Gaussian inputs
and a bias-free ReLU, E[1(w·x > 0)·x] = w / (|w|·√(2π)): the update points along the unit's own weights, so
a price can make it grow or shrink but never turn. Everything a hidden unit learns about *which* feature to
compute is in the covariance term: the part of its price that varies with the example. In economic terms,
backprop runs a complete set of state-contingent prices, one per unit per example
([Arrow 1964](https://doi.org/10.2307/2296188)); a posted price is one price for all states.

This bites in two designs:

- **An honest price averaged over examples** (signed, true, but not per example) improves the hidden
  features by at most about 1.3×, against 6× (tanh) to 35× (ReLU) for per-example prices.
- **Excludable posted asks** are worse. A supplier asks each buyer a price per unit; a buyer keeps
  access while its value at best use, (E[r·h])²/(2·E[h²]) with r its error without the input, covers the
  ask. The ask is non-negative, so it only ever says "produce more": ReLU suppliers grow along their own
  weights (hidden weights double in size), and about half the connections are refused at any moment as
  asks bounce around buyers' values. When suppliers instead set each ask at 90% of the buyer's true value,
  every connection is bought, and suppliers grow until the buyers' learning diverges.

Valuing access at the buyer's current weights instead of at best use made every buyer refuse early in
training, when random weights make most inputs look harmful, and a refused connection could never be learned
again. That was a design error, found while building, not a result.

Tests: `a price that doesn't vary with the example…`; `excludable posted prices…`.

## 16. Access sold at its true value is a difference reward

If a supplier can exclude, its buyers' loss without it is measurable: D_i = L(without i) − L(with i). That
is the "wonderful life utility" of [Wolpert & Tumer (1999)](https://arxiv.org/abs/cs/9908014), now usually
called a **difference reward**. It says how much the
supplier is worth, not which way to change, so each supplier jitters its own net input by ξ_i and
correlates the change in D_i with ξ_i. With every hidden unit jittered and g = ∂L/∂z,

D_i(ξ) − D_i(0) = Σ_{j≠i} (g_j^{(−i)} − g_j)·ξ_j − g_i·ξ_i + O(σ²)

where g^{(−i)} is the same price in the network without i. So E[(D_i(ξ) − D_i(0))·ξ_i]/σ² = −g_i: unbiased.
Node perturbation's broadcast change in loss carries Σ_{j≠i} g_j·ξ_j as noise; here the other units enter
only through how much removing i changes their prices. In the test the variance is about 9% of node
perturbation's, and on the ladder task its features come within 2× of backprop's best-readout loss,
against 3× (tanh) to 6× (ReLU) for node perturbation.

It is an idealization: a supplier charging every buyer its true value example by example needs either
honest buyers or a view of their losses, which is the reporting problem of section 14 again.

Test: `excludable access sold at its true value…`.

## 17. Without a shared potential

Let the nuisance be a matrix: use k at site j suffers ν·κ·Σ_{q≠k} N_kq·r_jq, where N_kq says how much k
minds q (all ones is the symmetric model above). Use k's cost then responds to use q's load with slope
κ·(1 + ν·N_kq), the 1 coming from the shared rent. A potential needs these cross-slopes to match both ways
([Monderer & Shapley 1996](https://doi.org/10.1006/game.1996.0044)), so F exists only when N is symmetric.
What decides whether the model still settles?

**A sufficient condition.** If the symmetric part of how costs respond to loads, together with the entropy
term, pushes back against every shift, the game is *stable*, and many adjustment rules settle at its one
equilibrium with or without a potential
([Hofbauer & Sandholm 2009](https://doi.org/10.1016/j.jet.2009.01.007)). A chase, N = [[0, 1], [−1, 0]]
(A avoids B, B seeks A), has no symmetric nuisance at all, so it is stable at any ν.

**At one site.** Take a site where each use's load is x, and shift how that load is split among the uses
while keeping the total, so the shared rent doesn't change. Once the nuisance memory has caught up, a logit
choice moves each use's load by −(x/τ) times the change in its cost, so a shift δ in the split produces
−g·N·δ with g = ν·κ·x/τ. The split relaxes as δ′ = −δ − g·N·δ, and the mixed state breaks when some
eigenvalue λ of N, on shifts that sum to zero, has −1 − g·Re λ > 0.

- **Two uses.** The shifts that sum to zero are one direction, (δ, −δ), so λ = −(N_AB + N_BA)/2 is real and
  nothing can rotate. One-sided nuisance (λ = −1/2) breaks at g = 2 into separation, and the separated
  layout is stable: B doesn't mind A. A chase (λ = 0) never breaks.
- **Three uses that each mind the next** (A minds B, B minds C, C minds A). The shifts that sum to zero are
  a plane, and there N has λ = −1/2 ± i·√3/2; its symmetric part (N + Nᵀ)/2 has λ = −1/2 twice. Both
  break at g = 2, that is at ν = 2τ/(κ·x). The symmetric control breaks into separated uses, a minimum of F,
  and stops. The cyclic one breaks into rotation, and there is no separated layout for it to rest in:
  whichever use moves away from the one it minds lands next to the one that minds it.

With the busiest site's per-use load x = 0.2585, τ = 0.15 and κ = 10, the predicted threshold is
ν = 0.116. Both the cyclic uses and the control are mixed and still at 0.11 and moving at 0.12. Past it the
control separates and stops, while the cyclic uses' loads keep moving by 70–110% of their size every 1000
time units, with individual agents too. The motion is irregular rather than a clean cycle. It is the
spatial rock–paper–scissors of ecology, where cyclic dominance keeps populations on the move
([Reichenbach, Mobilia & Frey 2007](https://doi.org/10.1038/nature06095)). Two uses settled in every case
tried, including a nuisance memory 50× longer.

**The Pigouvian charge restores a potential.** The nuisance actually suffered is
ν·κ·Σ_j Σ_k Σ_{q≠k} N_kq·r_jk·r_jq, and its slope for use k at site j is ν·κ·Σ_q (N_kq + N_qk)·r_jq: what k
suffers plus what it causes. Charging each arrival the nuisance it causes therefore replaces N by N + Nᵀ,
which is symmetric, so the true total cost is a potential whatever N was. One-sided nuisance with the charge
is exactly symmetric nuisance, and the charge settles the cyclic uses.

Tests: `formal: one-sided nuisance has no free energy…`; `formal: three uses that each mind the next…`.

## 18. One price per expert: rationing by auction, credit by bids

Tokens t, experts e with capacity c each, and bids v_te, each expert's forecast of the loss reduction it
would deliver on token t; serving nobody is worth 0. The best allocation solves

maximize Σ v_te·x_te subject to Σ_e x_te ≤ 1 for each token, Σ_t x_te ≤ c for each expert, x ≥ 0

whose dual is: minimize Σ_t u_t + c·Σ_e λ_e subject to u_t + λ_e ≥ v_te and u, λ ≥ 0. Here λ_e is expert
e's capacity price (the multiplier of its capacity) and u_t is token t's surplus.

**The auction.** Each token takes the expert with the highest v_te − λ_e, or nothing if all are negative.
An overloaded expert raises its price by its (c+1)-th largest margin (a token's lead over its next option),
plus a small ε, so exactly c tokens stay. Prices only rise, and tokens leave an expert only when its own
price rises, so a full expert stays full. At the end every token holds its best option at the posted
prices, so u_t = max(0, max_e (v_te − λ_e)) is dual feasible; each served token has u_t = v_te − λ_e, each
unserved one u_t = 0, and every expert with a positive price is full. That is complementary slackness, so
the allocation is optimal and the value served splits exactly into token surplus plus capacity rents:
Σ u_t + c·Σ λ_e. (Within ε per token; the ε is what keeps displaced tokens from trading places in tiny
steps, as in [Bertsekas 1988](https://doi.org/10.1007/BF02186476).)

**Why it rations better than a bias.** When capacity binds, a token stays served only if its lead over its
next option beats the price, so the tokens that lose out are those worth least. A balancing bias shifts every
token's choice by the same amount and then drops overflow in arrival order, or by gate probability as in
batch prioritized routing ([Riquelme et al. 2021](https://arxiv.org/abs/2106.05974)), which tracks value only
loosely. On the ladder task the dropped tokens are worth 0.38 of an average token under the auction, 0.74
when dropped by gate probability and 1.02 in arrival order.

**Why it assigns credit worse.** The auction compares bids across tokens, so each bid must be right as an
*amount*, a forecast of ½‖y‖² − ½‖y − W_e·x‖². A router score only needs the right ranking for each token,
and its gradient through the gate reaches every expert's score on every token. With linear bids, which can't
represent that quadratic, experts fit their clusters 30–90× worse than under the gate (0.091 against
0.001–0.003); quadratic bids narrow it to 4–10× (0.013). Letting every expert learn its value on every token made things worse, not better: each bid
then has to fit its value on clusters it never serves. So the gap comes from forecasting amounts, not from
learning only on the tokens won. With capacity to spare, those bid errors turn away 4% of tokens, against
1.8% dropped under the gate.

Tests: `one price per expert…`; `mixture of experts: one auction price…`.

## 19. A centre that isn't given: agglomeration ⇄ wiring economy

The land market pins every arrival to one point: households commute downtown, spikes arrive from one input
neuron. Replace the point with the arrivals themselves. A type-k arrival at site j gains

G_kj = s·κ·Σ_q W_kq·(B_kq ∗ r_q)_j,   (B_kq ∗ r_q)_j = Σ_i B_kq(d_ij)·r_iq,   B_kq(d) = e^{−d/ℓ_kq} ÷ Z_kq

where W_kq is how much type k deals with type q (trips ⇄ connections), ℓ_kq the reach of those dealings, and
Z_kq the kernel's sum from the sheet's most central site, so a uniform load r gives a field of r. Its cost
c_kj loses G_kj. With a pinned source and s = 0 this is the land market; with no source (`sources: 'anywhere'`)
the term alone places arrivals.

**The potential.** Add to F the pairwise term −(s·κ/2)·Σ_{k,q} W_kq·Σ_{i,j} r_ik·B_kq(d_ij)·r_jq. Its slope in
r_jk is −(s·κ/2)·Σ_q [W_kq·(B_kq ∗ r_q)_j + W_qk·(B_qk ∗ r_q)_j], which equals −G_kj exactly when W and ℓ are
symmetric. So with symmetric dealings every price stays a Lagrange multiplier of one function, and section 17
applies as before: asymmetric W (B reads A, A doesn't read B) has no potential. Rent is still κ·r_j and still
the slope of the building cost ⇄ self-inhibition.
Test: `agglomeration: with no centre given…` (price = κ·load to 10⁻⁴; 40 of 40 random transfers raise F).

**When a uniform plain breaks.** On an unbounded sheet with one type, the uniform load r is an equilibrium.
Perturb it by a wave of wavenumber k. The attraction changes the cost by −s·κ·B̂(k)·δr, with B̂ the kernel's
Fourier transform normalized to B̂(0) = 1; the rent by κ·δr; and the logit's entropy pushes back with
τ/r per unit. The wave grows when

s·B̂(k) > 1 + τ/(κ·r)

For an exponential kernel B̂ is largest at k = 0, so the first mode to break is the longest one: the whole
plain's load gathers into one centre as soon as s > 1 + τ/(κ r) ≈ 1.13 here. Below that the plain stays
flat. With a second kernel of the opposite sign and a longer reach ℓ_C (competition ⇄ lateral inhibition),
the condition is s·B̂(k) − b·B̂_C(k) > 1 + τ/(κ r). The long kernel's transform falls off faster in k, so the
k = 0 mode can be stable while a finite k is not: a pattern with a wavelength of order the kernels' reaches,
Turing's mechanism in the form Krugman used for the spacing of business districts and Amari and Ermentrout &
Cowan for periodic activity in neural fields.

**The black hole.** At a single site the kernel's own weight is B(0)/Z = 1/Z. If s·W_kk/Z approaches 1 the
attraction a unit of load exerts on its own site matches the rent it adds, and everything piles onto one site:
the whole city in one tower. Z grows with the reach (≈ 2πℓ² on the plane: 6 at ℓ = 1, 25 at ℓ = 2), so short
reaches collapse first. Krugman's core–periphery model has the same condition and name
([Krugman 1991](https://doi.org/10.1086/261763)).
Test: `agglomeration: a strong short-range pull alone collapses…` (s = 5, ℓ = 1.25: 1 parcel in the flows,
16 with agents).

**A bounded plain.** The sheet is a disc of radius 12, and that decides where things form. The attraction
is a sum over partners within reach, so the disc's middle, with partners on every side, is the most
accessible site and the centre forms there in both solvers (centroid within 0.2 of the origin). A pinned
feature elsewhere wins if its pull beats that advantage: a harbour at (7, 2) pulling at 0.05, a twentieth of
the land market's commute cost, moves the centroid to (5.3, 1.5). Competition has the opposite boundary
effect: a site at the rim has fewer competitors within reach, so a repelling kernel read as a sum drives the
towns onto the rim, where they form a ring at mean distance 9–10 whatever the reach. The competition field is
therefore read as a local density, the kernel sum divided by the site's own kernel mass, which treats rim and
interior alike. Only short reaches then give interior towns on a disc this size: for one type a ring of
3–4 towns around a hollow middle (s = 5, ℓ = 1.25, competition 10 at reach 3); for firms among homes, 5–7
dense towns at mean distance 6 from the centre (spillovers 3 at reach 1, competition 20 at reach 3). On a
much larger plain, or a torus, the array would fill the interior and the centre's position would be set by
history rather than geometry; that isn't simulated.

**Why a field, and when it fails.** Attraction here is a *field*: a unit gains in proportion to how many
partners are within reach, like a spillover or a wire to each partner. One job is not like that: a household
needs one, and a second firm nearby adds little. The model has an optional saturating gain
x₀·log(1 + field/x₀) for that case, but saturation alone never produced towns: it dissolves the firm cluster
into a mixed carpet rather than splitting it. What splits a cluster is a push, not a weaker pull. Fujita and
Ogawa's polycentric regime comes from a rival, one-to-one commute cost against a non-rival spillover
([Fujita & Ogawa 1982](https://doi.org/10.1016/0166-0462(82)90031-X)); here the push is competition for
customers, with the same qualitative result.

**The neural field.** With one type, each site's load follows the logit with cost κ·r_j − G_j and a fixed
total. That is local excitation through the kernel, inhibition of a neuron by its own activity (adaptation),
and a global constraint on the total (the softmax's normalization: divisive inhibition). Amari's field
equation has the same ingredients and the same solutions: a bump wherever activity happens to start, captured
by a weak external input; periodic arrays under longer-range inhibition
([Amari 1977](https://doi.org/10.1007/BF00337259); [Ermentrout & Cowan 1979](https://doi.org/10.1007/BF00336965)).
The dynamics differ (his is a differential equation on activity, this a logit over sites with a lagged
field), so the pairing is of resting states, not trajectories.

**What the three settings measure.**

| Setting | Flows | Agents |
|---|---|---|
| One type, pull 2 at reach 2 | centre at (0.0, 0.0), 241 parcels, peak load 0.64, partners 5.8 apart | (0.2, 0.0), 214, 0.67, 5.7; profile about the centre within 15% |
| … with a harbour at (7, 2) pulling 0.05 | centroid (5.3, 1.5) | (5.4, 1.5) |
| … pull 5 at reach 1.25 | one tower: 1 parcel | 16 parcels |
| … and competition 10 at reach 3 | 4 towns in a ring, 420 parcels, hollow middle | 3 towns, 353 parcels |
| Firms and homes, spillovers 1.5 at reach 1 | firms on 1 parcel in 10 hold 100%; overlap with homes 0%; firms at distance 1.3, homes at 7.1 | the same (1.6, 6.9) |
| … spillovers 0.5, need for each other 2 | overlap 62%, firms spread (66% on the busiest tenth) | overlap 50% |
| … spillovers 3, competition 20 at reach 3 | 7 firm towns, each dense (90%) and apart from homes (1%), at mean distance 6.0 | 5 towns, 93%, 1%, 6.2 |
| Hierarchy, input at the edge | kinds at 1.8 < 4.6 < 7.8 from the input; hops 4.1 + 5.2 against 22.5 shuffled | 1.9 < 4.6 < 7.5; 4.1 + 4.7 |
| … input in the middle | 1.6 < 3.6 < 6.1; hops 10.5: rings cost more | — |

Tests: `agglomeration: with no centre given…`; `agglomeration: a strong short-range pull alone…`;
`firms and homes: spillovers give one segregated centre…`; `hierarchy: a chain of populations…`.

## 20. Geography, and the geography people make

Section 19 left one thing given: the plain's shape, which put the centre in the middle. Real plains have
coasts, rivers and passes, and what those are worth changes with what people can build. Both become fields.

**Given geography.** A layer g_m(j) over the sites and a weight w_km per type: an arrival of type k gains
κ·Σ_m w_km·g_m(j). The pinned downtown and the harbour of section 19 are the case of a layer that is one
point. The term is linear in r, so F gains −κ·Σ_j r_j·Σ_m w_km·g_m(j) and every price stays a multiplier.

**Made geography.** A level T_j of technology ⇄ infrastructure at each site, with

dT_j/dt = α·r_j + D·((B_T ∗ T)_j − T_j) − δ·T_j

learning by doing where the load is, diffusion to neighbours through a kernel B_T of reach ℓ_T normalized
to each site's own kernel mass (so a flat field stays flat), and decay with disuse. The first term is
Arrow's learning by doing; the second is Hägerstrand's mean information field, the contact kernel through
which innovations spread ([Hägerstrand 1965](https://doi.org/10.1017/S0003975600001132)), and knowledge
spillovers do fall off with distance ([Jaffe, Trajtenberg & Henderson 1993](https://doi.org/10.2307/2118401)).
It does three things to the cost:

1. **It is worth living on.** A gain κ·v·T_j, like a given layer: roads, a port, schools ⇄ myelinated,
   vascularized tissue that is cheaper to use.
2. **It fades the given layers.** The weight on g_m becomes w_km·e^{−γ·T_j}: with rail and road, the coast
   carries less of what only ships carried.
3. **It lengthens the reach of dealings.** ℓ_ij = ℓ·(1 + β·(T_i + T_j)/2), the mean technology at the two
   ends, which keeps the kernel symmetric, with B normalized by (ℓ_ij/ℓ)² (the plane's kernel mass) so the
   same total pull spreads over more partners instead of adding to it. Without the renormalization a longer
   reach counted more partners and made the city denser; with it the city spreads, which is what highways
   did ([Baum-Snow 2007](https://doi.org/10.1162/qjec.122.2.775)).

For a given T all three are slopes of one function, F gaining −κ·Σ_j r_j·(Σ_m w_km·e^{−γT_j}·g_m(j) + v·T_j)
with the pairwise term of section 19 built on the lengthened reach. T itself moves slowly through F: the
model is quasi-static, and the test freezes T to check prices and transfers.
Test: `geography: a longer reach spreads the city…` (price = κ·load to 10⁻³; 40 of 40 transfers raise F).

**What it shows.** A coast along the west side of the plain, worth 0.3 in rent units to households, with the
one-type agglomeration of section 19 (pull 2 at reach 2); technology learns at 0.005 per unit load, spreads
at 0.03 with reach 3, decays at 0.001, is worth 1 per unit, fades the coast at γ = 4 and lengthens reach at
β = 0.5.

| | Centre's distance inland | Share on the coast | Parcels used |
|---|---|---|---|
| No technology | 3.5 | 58% | 114 |
| Technology that only fades the coast (v = 0, β = 0), t = 3000 | 7.1 | 14% | 216 |
| … and is worth living on (v = 1, β = 0) | 4.1 | 42% | 104 |
| … and lengthens reach too (the page's setting) | 5.3 | 29% | 179 |

With the coast's worth gone and nothing of its own to stand on, the city drifts toward the plain's middle,
where section 19 put it. With made ground worth living on it stays within a few parcels of the shore: the
made layer is highest where the city already was, so it anchors the city there. That is the mechanism
Bleakley and Lin found for portage sites, which stayed large long after goods stopped being carried around
rapids ([Bleakley & Lin 2012](https://doi.org/10.1093/qje/qjs011)): geography decides where a city starts,
what the city builds decides whether it stays. The reach boost spreads the city over 1.6× the land at lower
density without emptying it ([Gaspar & Glaeser 1998](https://doi.org/10.1006/juec.1996.2031)). Technology
spreads inland ahead of the people: by t = 2000 the middle of the plain has more than half the coast's level.
The agents and flows agree on the whole course (centre within 1 parcel, coast share within 8 points,
technology within 0.1).

**The network reading.** Myelin forms where axons are active and is lost with disuse
([Gibson et al. 2014](https://doi.org/10.1126/science.1252304);
[McKenzie et al. 2014](https://doi.org/10.1126/science.1254960); [Fields 2015](https://doi.org/10.1038/nrn4023)).
It speeds conduction, so farther partners fall within the same latency: a longer effective reach along used
tracts. Myelinated ground is cheaper to use (v), and a map that formed against a sensory edge stops needing
it once its own structure carries the signal (γ). The pairing is of form and resting states; the dynamics of
myelination are not these equations.

**Two things to know.** The "coast" is still the disc's rim, so the plain's middle keeps its pull from
section 19, and that pull is what the freed city drifts toward; on a plain large next to the reach of
dealings there would be nowhere in particular to drift to. And with made geography worth living on and no
given geography at all, the blob eventually leaves the middle: the made layer is a second attractor that
history places, and in the flows it wandered off-centre after about 2500 time units.

Tests: `geography: a coast worth a little…`; `geography: technology that only fades the coast…`;
`geography: a longer reach spreads the city…`.
