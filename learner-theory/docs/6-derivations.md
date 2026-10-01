# Derivations

Short proofs of the identities the other docs rely on. Each one is also checked numerically by a test,
named at the end of its section. Notation follows [doc 3](3-one-model-two-readings.md) (sections 1–6) and
[doc 5](5-learners-as-economies.md) (sections 7–12).

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
it "internalizes" interference without a tax.
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
