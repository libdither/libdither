# Next steps

What's settled, what's open, and what to do about each open part. The gaps are ordered by how much closing
them would change the picture. Each has a concrete experiment and what result would count for or against
the idea.

## Where things stand

**Settled** (exact, derived in [docs/6](docs/6-derivations.md), and tested):

- Land markets and competitive layers of neurons are one model for *allocation*: logit choice is a race of
  noisy neurons, rent is adaptation, fees are load-balancing biases, and all of them are multipliers of one
  free energy ([docs/3](docs/3-one-model-two-readings.md)).
- For *credit*, backprop's signals are prices, an activation's price is a public-good sum, and bias-free
  linear or ReLU networks keep exact money accounts. Auction markets for control are Q-learning or SARSA
  depending on the price rule; the bucket brigade is TD(0) with its tax as the discount
  ([docs/5](docs/5-learners-as-economies.md)).

**Open:** the claim that one model runs continuously from a market of agents to backprop. It holds at both
ends and at several points between, but the two ends are separate engines, and no market learner here learns
a representation.

## 1. A market for a dense layer

*The most informative next experiment: it tests gaps 1a and 1b at once.*

**1a. Activations are public goods, so markets may need a planner for them.** An activation's backprop
price is the sum of what every reader would pay for it ([Samuelson 1954](https://doi.org/10.2307/1925895)).
Samuelson's own point in that paper is that no decentralized price system finds such values, because each
reader gains by understating its share. That may explain why markets work for rival goods (control of the
world) but have never matched backprop on dense representations. This is a hypothesis; nothing here tests
it yet.

**1b. No market learner here learns a representation.** In the market engine each agent's technology is a
fixed action; only bids adapt. So moving from Hayek to backprop changes two things at once: how credit is
priced, and whether units learn continuous features.

**What to do.** Build a dense layer whose units buy their inputs from the layer below and sell their output
to the layer above, and that learn their weights to maximize their own profit at the prices they face. Run
three versions on the supervised task in `ladder.mjs`:

1. Buyers report their marginal values honestly. If prices then converge to backprop's, the market is a
   decentralized way to compute backprop (expected, given section 7 of docs/6).
2. Buyers report strategically, to maximize their own profit. Samuelson predicts under-reporting and
   under-supplied features.
3. Buyers pay Clarke–Groves (VCG) prices, the standard mechanism that makes honest reporting of public-good
   values a dominant strategy ([Clarke 1971](https://doi.org/10.1007/BF01726210);
   [Groves 1973](https://doi.org/10.2307/1914085)). VCG doesn't balance its budget; note who pays the gap.

[Schmidhuber's neural bucket brigade (1989)](https://doi.org/10.1080/09540098908915650), where winning units
pass "weight substance" back to the connections that set them up, is the closest prior design and the
first thing to reimplement.

**What would count.** Support: version 1 matches backprop's loss, version 2 is clearly worse, version 3
recovers version 1. Against: version 2 learns about as well as version 1 (free-riding doesn't bite), or
version 1 fails even with honest values (the obstacle is elsewhere).

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

## 3. Two kinds of price that are never unified

**What's missing.** The one-model page's prices *ration capacity* during the forward pass: rent, adaptation,
balancing biases. The learners' prices *carry credit* backward. In a real economy one price does both, and so
does a bid in Chang et al.'s market. Engineered networks split them: a mixture of experts has a balancing
bias for rationing and a gradient for credit. Nothing yet says when one price can do both jobs.

**What to do.** Take a mixture-of-experts layer with capacity limits and replace "router score + balancing
bias" with experts bidding for each token their expected reduction in loss, paying a Vickrey price, with
capacity enforced by the auction. Compare with DeepSeek-style balancing plus gradient
([Wang et al. 2024](https://arxiv.org/abs/2408.15664)) on load evenness, dropped tokens, and loss.

**What would count.** If one auction price balances load and trains as well as the two-signal design, the
split is an engineering convenience. If it can't, look for the reason in the rival/non-rival distinction:
tokens are rival (one expert each), activations are not.

## 4. Games with no shared potential

**What's missing.** Both projects assume one function that every choice lowers (a potential game). Many
learners lack one: GANs ([Goodfellow et al. 2014](https://arxiv.org/abs/1406.2661)), multi-agent RL with
competing goals, and general exchange economies, where price adjustment can cycle forever
([Scarf 1960](https://doi.org/10.2307/2556215)). The taxonomy has no dimension for "is there a shared
potential?"

**What to do.**

- **Inside the existing model:** make nuisance one-sided (industry bothers homes, homes don't bother
  industry). That breaks the symmetry that makes F a potential. Predict whether the two solvers cycle, and
  test it.
- **In the learners engine:** add a two-objective stage and use the decomposition of
  [Balduzzi et al. (2018)](https://arxiv.org/abs/1802.05642) into a potential part and a rotational part to
  place learners on the new dimension.

**What would count.** If one-sided nuisance produces sustained cycles, the "one free energy" story has a
clear boundary that the docs should state. If it still settles, find out why.

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

## 10. Calibration against real data

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

## Engineering

- **Merge the two learner engines** (`learners.mjs` Part A and Part B) into one code path where a stage's
  price formation, accounting and allocation are settings. That's what "one parametrized model" should mean
  in code, and it's a prerequisite for item 1.
- **An interactive learners page,** like the one-model page, where the ten dimensions are knobs and the
  ladder runs live.
- **Vendor three.js** for the play-dough page, which loads it from a CDN; the other pages work offline.
