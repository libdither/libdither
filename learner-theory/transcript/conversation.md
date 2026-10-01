# Conversation log

The research happened in one long chat with Claude between 24 September and 1 October 2026. It took
place inside the CivicMapper repository (a land-value mapping app by the Center for Land Economics), so
"this repo" in the answers means that one, and paths like `experiments/one-model/` are now
`learner-theory/experiments/one-model/`.

This file keeps the user's prompts and the assistant's substantive answers word for word. It leaves out
progress messages, tool calls, and the opening exchange (a CivicMapper feature question unrelated to this
research). Later turns sometimes correct earlier ones; a **Later corrected** note marks each place.
`../TRANSCRIPT.md` tells the same story as a structured research log.

## 1. The video and machine learning

*2026-09-24 16:55 UTC*

**User:**

> does this video remind you at all of any particular phenomenon from machine learning?

**User, a moment later:**

> https://www.youtube.com/watch?v=-Qn4iZgQY8k

**Assistant:**

I read the auto-generated transcript rather than watching it. The video is "Play-dough explains the American City" by Lars Doucet, who is also behind the Center for Land Economics that maintains this repo. His demo: a fixed lump of play-dough stands for demand, and a sour-cream lid stands for height limits and zoning. Press the lid down and the dough spreads past the city limits into farmland. Cut a hole in the lid only at the center and you get both at once: supertall towers in the middle and sprawl all around.

Yes, it reminds me of one thing in particular: **probability mass has to go somewhere.** A softmax output always sums to 1, just as the play-dough keeps the same volume. When you push down some outputs, the mass doesn't disappear. It moves to wherever the constraints still allow it, and often not where you meant it to go. His two demos match two versions of this:

- **Capping the peak makes it spread out.** Penalizing a model for being too confident, or raising the sampling temperature, flattens the peak and fattens the tails. That's the lid spreading the dough into farmland.
- **Pushing down everywhere except one spot makes that spot taller.** Ren & Sutherland ("Learning Dynamics of LLM Finetuning," ICLR 2025) call this the **"squeezing effect."** In preference training like DPO, pushing down the probability of responses the model already rates as unlikely mostly pushes that mass onto whatever it already rates highest. The peak gets sharper. That's the supertall poking up through the one hole in the lid.

Two related ideas:

- **Specification gaming (Goodhart's law).** His line "they will wind up building wherever the rules will allow them" is exactly how an optimizer treats constraints. Block one route and the optimization pressure finds the next unblocked one. Patching one reward hack often just moves the behavior somewhere else.
- **Piling up at a clip boundary.** Hard limits make values pile up right at the limit. In the original Wasserstein GAN, clipping the weights to a fixed range pushed most of them to the two ends of that range. Cities do the same thing: lots of buildings end up exactly at the height limit.

The "Built vs. Land Value" view from earlier would show this demo on real data. Brightly colored, expensive land with short buildings on it is the flattened dough, and a few tall downtown towers are the hole in the lid.

Was there a specific phenomenon you had in mind? My guess is the probability-mass one.

## 2. Weight decay

*2026-09-24 16:58 UTC*

**User:**

> i'm wondering if there's any relation here to what happens when we don't have weight decay / l2 weight pressure

**Assistant:**

Yes, but the closest match isn't the lid in the video. It's the policy Lars is arguing for. He's a Georgist, so he favors a land value tax (LVT), and weight decay works a lot like one.

### Weight decay is a tax on holding

With decoupled weight decay, each training step does `w ← (1 − ηλ)·w − η·∇L`. Every weight gives up a fixed fraction of its size each step, whether or not it's doing anything useful. A weight stays large only if the loss gradient keeps pushing it back up. It settles where the two balance: `∇L = −λw`.

A land value tax works the same way. Holding land costs money whether you build on it or not, so land that isn't earning its keep gets used or sold.

### What happens without it

Remove weight decay and the failures look like a city with no holding cost:

- **Idle holdings stick around.** In grokking, a network first memorizes the training set and only much later learns the general rule. Power et al. (2022) found weight decay was the most effective way to make grokking happen. Nanda et al. (2023) showed the jump in test accuracy comes from a final "cleanup" phase, where weight decay removes the memorization circuit. Without weight decay, the memorized solution just sits there, like a lot held vacant for speculation.
- **History decides the layout.** In a ReLU network you can scale one layer up and the next one down and get the same function. Without weight decay, gradient descent keeps the difference in layer sizes it started with (Du, Hu & Lee, 2018), so whatever split came from initialization stays forever. Weight decay pushes toward the cheapest, balanced split. The city version is a 1900 parcel layout surviving because nothing pressures it to change.
- **The network stops adapting.** For weights that feed into a normalization layer, their overall scale doesn't affect the output. Without weight decay that scale keeps growing, and the effective learning rate shrinks roughly as 1/‖w‖² (van Laarhoven, 2017). In continual learning, networks gradually lose the ability to learn new tasks (Dohare et al., *Nature* 2024), and L2 regularization is one of the fixes that helps. That's a city where nothing ever gets redeveloped.

### Where the analogy breaks

A land value tax charges for the land and not the building, so it doesn't discourage building. Weight decay charges for the size of the weight itself, which is the building. Because the L2 penalty is squared, it's cheaper to spread a contribution over many small weights than to put it in one large one. Splitting 1 across two weights costs 0.5² + 0.5² = 0.5 instead of 1.

So L2 also acts as a soft height limit, and it produces the spread-out sprawl from the first demo. L1 is the opposite. It charges a flat cost per unit, which drives most weights to exactly zero and keeps a few large ones: a compact core surrounded by untouched wilderness. That's closer to the city Lars wants.

So weight decay is partly the Georgist tax (use it or lose it) and partly the lid (it penalizes height and rewards spreading). Without it you lose both effects: nothing clears out idle weights, and nothing stops a few from growing very large. These are analogies rather than exact equivalences, but the use-it-or-lose-it part holds up well.

> **Later corrected:** The next answer revises this: weights are closer to buildings (capital) than to land, and L2 on factored weights acts like L1 on how latent directions are used, which concentrates rather than spreads.

## 3. Is land the weights or the latent space?

*2026-09-24 17:15 UTC*

**User:**

> think deeper on this topic. Is the direct land analogy here weights or is it something else? (possibly latent space usage?)

**Assistant:**

Latent space is the better candidate for the land. Weights are closer to the buildings: they're what training constructs on top of the land. Changing that mapping also reverses part of what I told you about weight decay.

### A test for "land"

In Georgist economics, land has four properties:
1. The supply is fixed.
2. Its value comes from its location relative to everything else.
3. Improvements are built on it through effort.
4. Holding it idle imposes costs on others.

**Weights** pass the first test: the parameter count is fixed. They fail the others. At initialization, the hidden units in a layer are interchangeable (you can shuffle them without changing anything), so they have no location of their own. A weight's value is also the thing training produced. There's no separate "lot" underneath it. That makes weights capital.

**Latent directions** pass all four. The residual stream has a fixed number of dimensions. A direction's value is relational: it helps to sit near related features that downstream layers read together, and it hurts to sit near unrelated ones. The weights that write into and read from a direction are the improvements. A stale feature still writing into a direction adds interference to anything placed near it, which is the cost to others.

### Latent space behaves like an urban land market

- **Density is superposition.** A space with d dimensions can hold far more than d features as nearly perpendicular directions, the way buildings go up on fixed land. The cost is interference between features, which plays the role of congestion.
- **Features sort like bid-rent.** In Anthropic's *Toy Models of Superposition*, important, frequently used features get their own dimensions. Rarer ones share space in superposition. Low-value ones aren't represented at all, so they're priced out. That's the same pattern as bid-rent theory, where the highest bidders take the city center.

### This reverses what I said about weight decay

I said L2 causes sprawl. That's true in weight space, but in latent space it does the opposite. Take a layer split into two matrices, W = AB. The smallest possible ‖A‖² + ‖B‖² over all such splits equals 2‖W‖₊ (twice the nuclear norm, the sum of W's singular values). So a tax on the buildings turns into a flat per-unit charge on how intensively each latent direction is used.

That pushes low-value directions all the way to zero. For simple losses it literally subtracts a fixed amount from every singular value and zeroes the ones that fall below it. The result is low-rank and compact: "urban stays urban." Kobayashi et al. (2024) showed this happening in attention layers. So L2 on weights acts like L1 on how the latent space is used.

It still isn't a real land value tax, though. It charges for how intensively a direction is used, not for holding the lot.

### The video, happening inside a transformer

This is the closest match I found:
- **The mandate.** Softmax attention must spend all of its attention because the weights sum to 1. That works like a parking minimum.
- **The parking lot.** A head with nothing useful to attend to still has to put its attention somewhere, so models dump it on a junk position, usually the first token. This is called an *attention sink*.
- **The supertall.** To make that work, models build *massive activations* (Sun et al., 2024): a few fixed channels with values orders of magnitude larger than everything else.
- **Removing the mandate.** Qwen's gated attention (NeurIPS 2025) lets each head scale its output toward zero, and both the sinks and the massive activations largely disappear.

### Vacant lots, and a tax that creates them

- **Literal vacant latent land.** Examples are dead codes in vector-quantized models (code vectors placed where no data lands, so they never get selected or updated), inactive latent units in VAEs, and dormant neurons in reinforcement learning (Sokar et al., 2023).
- **The VAE's KL term is a tax on use.** It charges each latent dimension for the information it carries. Dimensions whose value doesn't cover the charge get abandoned, which is called posterior collapse. That's the Georgist complaint about taxing buildings reproduced exactly: it leaves land idle. The fix, "free bits" (Kingma et al., 2016), exempts the first few units of information per dimension from the charge.

### Where the analogy breaks: gradient descent is a central planner

Idle land in cities is a problem of many separate owners, through speculation and holdouts. Gradient descent is a single planner with a single objective, so nobody hoards. Unused capacity in a network comes from the planner getting no signal: a dead unit receives no gradient. That's why the ML fixes reset the lot (codebook restarts, ReDo, continual backprop) instead of taxing it.

It also explains why a true land value tax has no ML counterpart. A charge that doesn't depend on how a slot is used has zero gradient, so it changes nothing. That's the ML version of "an LVT doesn't distort behavior." With a single planner, there's no hoarding for it to fix.

The one place with something like real ownership is **mixture-of-experts** routing:
- Experts compete for tokens.
- An expert's capacity limit works like zoning, and tokens over the limit get dropped or skip the expert, which is the spillover.
- Expert collapse is a few experts getting everything while the rest sit idle.
- DeepSeek-V3 handles this with a per-expert bias that goes up when an expert is underused and down when it's overloaded. That's a price that clears the market rather than a penalty.

If you wanted to test Georgist ideas in ML, MoE routing is where I'd do it.

**The mapping:** latent space is the land, weights are the buildings, and the gradient signal is demand. Weight decay taxes the buildings but ends up concentrating how the land is used. The softmax sum-to-1 rule is the parking mandate.

Sources:
- [Gated Attention for LLMs (arXiv 2505.06708)](https://arxiv.org/abs/2505.06708)
- [NeurIPS 2025 listing](https://papers.nips.cc/paper_files/paper/2025/hash/904e89bb4e632e75fb47f093b620b257-Abstract-Conference.html)
- [DeepSeek-V3 Technical Report](https://arxiv.org/pdf/2412.19437)

> **Later corrected:** The user pushed back on "gradient descent is a central planner", and the next answer withdraws it: backprop is better read as a price system (LeCun 1988).

## 4. Backprop as a price system; 2D land vs high-dimensional latent space

*2026-09-24 17:56 UTC*

**User:**

> gradient descent is *not* a central planner, it is a top-down error propagator. It says how to change (capital/profit-motive-similar) not what weights should be set to right? And there are more decentralized alternatives to gradient descent (predictive coding) that still manage to do the same things. It's all about predicting the environment by searching through a space of internal configurations that match memorized data / grokking right? Also, could we narrow it even further and make the latent analogy work better by thinking of land as like a 2-3d latent space compared to the very high dimensional latent spaces, but where both are trying to maximize angle usage (or closeness to other pieces of complementary useful land / stored data in representation)?

**Assistant:**

You're right, and "central planner" was the wrong label. Here's the corrected version. After that, I think your low-dimensional idea is the stronger model.

### Backprop works like a price system

LeCun (1988) derived backprop as computing the Lagrange multipliers of the network's forward computation, and Lagrange multipliers are shadow prices. Each unit gets one number, δ: how much the loss changes per unit change in its activation. That's its price. The weight update, Δw = −η·δ·(input), combines that price with purely local information: what the unit itself saw. Local knowledge plus a price is Hayek's description of a market, not a plan.

With weights as capital, **weight decay is depreciation**, not a land tax. Each step, every weight loses a fixed fraction of itself and is maintained only by returns (the gradient). It settles where new investment equals depreciation, which is a Solow steady state.

What I should have said is that gradient descent avoids Georgist problems for two reasons, neither of which is central control:
- **The chain rule prices in first-order externalities.** A weight's gradient already includes its effects on everything downstream.
- **The agents are myopic.** They respond only to current marginal returns, so nothing holds a weight for future appreciation. There's no speculation.

That makes idle capacity a *missing market* rather than hoarding: a dead ReLU unit's price is exactly zero, so it gets no signal. The market failure that remains is second-order. Every weight moves at once, assuming the others hold still. At high learning rates this acts like the cobweb model in economics (farmers planting based on last year's price) and produces oscillations and loss spikes.

**Predictive coding** supports your point. Each layer updates from its own local prediction error. The local errors add up to one global energy, and at equilibrium they equal backprop's gradients (Whittington & Bogacz 2017; exactly equal under an extra assumption, per Song et al. 2020). Decentralized agents reaching the same answer as the global computation is the welfare theorem story: a competitive equilibrium matches the planner's optimum when externalities are priced.

There's a twist. A newer predictive-coding variant, *prospective configuration* (Song et al., *Nature Neuroscience* 2024), first works out what activity each neuron *should* have, then moves the weights to match. That's a quantity target rather than a price, and they found it reduces interference between tasks. This is Weitzman's "Prices vs. Quantities" (1974) question showing up in learning rules: gradients are prices, targets are quantities.

### Grokking as redevelopment

I'd correct one part of your framing: fitting the training data is the constraint, not the goal. Many configurations fit it, and they differ in how much capacity they use:
- **Memorization** gives each training example its own parcel, like a lookup table. That's sprawl.
- **The generalizing solution** serves every example with one shared, compact circuit. For modular addition it's a handful of Fourier directions.
- **Grokking** is the switch from the first to the second.

My guess at why memorization comes first (this is analogy, not established): each example can be developed on its own, while the compact circuit needs many components to change together. That's the land-assembly problem. Depreciation (weight decay) makes holding the sprawl expensive, which fits with weight decay speeding up grokking.

### 2D land vs. high-dimensional latent space

I think this is the right move. Both have the same two forces:
- **Attraction:** complementary things want to be close. Cities call it agglomeration, contrastive learning calls it alignment.
- **Repulsion:** unrelated things want to be far apart and use all the angles. Cities call it congestion, ML calls it interference or uniformity.

Wang & Isola (2020) showed that contrastive learning optimizes exactly these two terms on a hypersphere.

What dimension changes is which one is scarce:
- **In 2D, adjacency is scarce.** At most 6 equal circles can touch a central one. That's the kissing number, and it's why H3, the hex grid this repo uses, gives each cell 6 neighbors. You can't sit next to everything you complement, so closeness is valuable, and that value is rent.
- **In high dimensions, adjacency is nearly free.** The kissing number is 12 in 3D and 196,560 in 24D, growing exponentially. A feature can be close to many complements and nearly perpendicular to everything else at once. The scarce thing becomes interference instead.
- **Same packing problem, different dimension.** The most even arrangement in 2D is hexagonal, and Christaller's central place theory (1933) predicts hexagonal market areas. In higher dimensions, Anthropic's *Toy Models of Superposition* found features settling into regular polytopes: pairs, triangles, pentagons, tetrahedra.

t-SNE gives the bridge a name. van der Maaten & Hinton called it the **crowding problem**: points that can all be equally close neighbors in high dimensions don't fit around each other in 2D. That gives a clean model of the video:
- A city is a 2D embedding of the economy's high-dimensional structure of who benefits from being near whom.
- Building height adds a partial third dimension.
- A height cap takes that dimension away. Crowding gets worse, points get pushed outward (sprawl), and complementary pairs get pulled apart (longer commutes).

One subtlety is that "close" means different things in the two spaces. In the toy models, features that are active at the same time prefer to be perpendicular so they don't interfere. Features that are never active together can share one direction, pointing opposite ways. So complementary features that fire together end up in the same subspace but on different axes: same neighborhood, different lots. Mutually exclusive features time-share one lot, like shared parking between a church on Sundays and offices on weekdays.

### A literal 2D version already exists: the cortex

The brain has a 2D sheet, a wiring cost that grows with distance (a commute), and high-dimensional features to lay out on it. Durbin & Mitchison (1990) modeled cortical maps as exactly this dimension-reduction problem. Their model reproduces orientation pinwheels and ocular-dominance stripes, which are effectively the brain's zoning map.

ML has versions of this too:
- **Kohonen self-organizing maps** place learned prototypes on a 2D grid where neighbors stay similar.
- **Topographic deep networks**, such as TDANN (Margalit et al. 2024), give a normal network's units positions on a sheet plus a wiring-like penalty, and get cortex-like maps.

### So what counts as land

My refined answer: land is any space where adjacency is scarce. A raw high-dimensional residual stream is barely land-like, because closeness is cheap there. A space becomes more land-like as it gets lower-dimensional or as distance gets more costly. Examples are cortical sheets, topographic networks, self-organizing maps, and chip layouts. AlphaChip's placement objective literally includes wirelength, congestion, and density. And cities, of course.

That also suggests a way to test the video's claim in ML. Take a topographic network and add a cap on how many units can sit at one location, the equivalent of a height limit. The prediction is sprawl: the same function spread over more area, with complementary units farther apart.

## 5. Building the play-dough city model

*2026-09-24 18:11 UTC*

**User:**

> can you make an interactive web visualization to try and test the video's claim intuitively? put in a lot of effort to make sure you are really modeling a real phenomenon, taking care to stop and rethink if you identify any parts that don't quite cohere

**Assistant:**

The page is built and checked. An independent review of the model's math is still running, and I'll fold in whatever it finds before giving you the full write-up.

Where it stands:
- **Page:** built in `experiments/playdough-city/`. To open it, run `node experiments/playdough-city/serve.mjs` and go to http://localhost:5180/. It isn't committed, and the `viz/` app isn't touched.
- **Checks so far:** 16/16 model tests pass. I've clicked through the 8-step tour, both themes, the phone layout, and extreme slider settings with no errors.

**Assistant:**

The review found five real bugs and about ten overstatements. It also verified the core (household side, supply, cost curve, ring integration, equilibrium conditions, Bertaud & Brueckner's welfare formula) against independent brute-force checks, so the fixes are targeted. I'll fix all of them rather than defer any:

- **Bugs:**
  1. The baseline solver can silently fail and then blame rules that aren't set.
  2. Infeasible states print false claims.
  3. The "where did it go" shares can exceed 100% when total floor space rises (real economics: displaced households take bigger homes farther out).
  4. The edge-ring sliver is double-counted.
  5. The parking regime flips per ring, creating population jumps that break exact play-dough conservation.
- **Text:** the "mid-rise" verdict looks only at the peak ring, though 90% of households live in 1–2 story buildings, plus several overstatements.
- **Cost curve:** it's the most uncertain input and drives the supertall verdict. It matches the paper's per-floor figures (10% at 2.5 floors, 4% at 15, 1.6% at 110), but the common 2%-per-floor rule would be flatter. So I'll add a "cost of building tall" slider rather than hide that sensitivity.

Starting with the model:

*2026-09-24 19:59 UTC, user: "continue".*

**Assistant:**

I've built the interactive model and tested all four of the video's claims with it. The sprawl claim holds, but only if nobody can leave the city. The "supertalls" and "natural mid-rise lump" claims are only partly right. All 24 model tests pass, and I stepped through every tour step in the browser with no console errors.

**To run it:**
```bash
node experiments/playdough-city/serve.mjs                # http://localhost:5180/
node --test experiments/playdough-city/model.test.mjs    # model tests
```
The server is already running on port 5180. Nothing is committed; `experiments/` is untracked.

### The model
It's the standard textbook model of a city where everyone commutes to one downtown. It is the same model Bertaud & Brueckner (2005) used to estimate what Bangalore's height limits cost residents. The cost of building tall is fitted to Ahlfeldt & McMillen's (2018) Chicago estimates.

The video's play-dough rests on two separate assumptions: nobody can live in less space, and nobody can leave. Each gets its own slider. With both at zero, total floor space stays exactly the same under any rule, just like the dough, and a test checks that. The page grades each claim live against whatever settings you choose. Where a combination has no equilibrium, it says so instead of showing a wrong answer.

### What it found
Default city: 2.5 million households.

| Claim | Verdict |
|---|---|
| 1. Height limits squish the city onto farmland | **Holds only if nobody can leave.** A 1-story limit spreads the city over 45% more land. If people can move freely, the city doesn't grow at all and 35% of households leave instead. That demand spills into other metros, which the model doesn't show. |
| 2. The demand has to go somewhere | **Nearly exact while nobody can leave.** Even when homes can shrink, only about 6% of the squeezed floor space goes unbuilt, because people pushed outward take bigger homes on cheaper land. Most of it bulks up existing suburbs (about 70%); only 20–30% lands on new farmland. |
| 3. Height only downtown → supertalls plus sprawl | **The shape is real; the height isn't.** Downtown goes from 4.3 to 5.4 stories. The biggest, richest preset reaches 13.5 stories, or 21 if building tall is cheap. Those are high-rises; nothing gets near supertall (roughly 80+ stories). |
| 4. Left alone, the city is a mid-rise, Barcelona-style lump | **Partly.** It is a smooth mound, but 83% of households live in buildings under 3 stories. Only the biggest preset is mid-rise on average. |

Two more results:
- Limits of 3 stories or higher barely matter at this size (+1% land). The limit that bites is the one around single-family-house scale.
- The cost to residents is 3.7–4.8% of income, within the 3–6% Bertaud & Brueckner found for Bangalore.

### What I caught and fixed in the last pass
- **Cost of building tall:** my curve overstated the cost of 2–5 story buildings by about 20% compared with the paper. It now matches the paper's three estimates. The free-market city got slightly taller (3.9 → 4.3 stories) and the 1-story limit's effect went from +39% to +45% land.
- **Growth-boundary tour step:** the slider moves in half-mile steps, so the boundary sat 0.3 mi past the city's natural edge. The city grew 5% into that gap, so claim 1 showed "Holds" on the step meant to show the boundary stopping sprawl. The boundary now sits exactly at the edge.
- **Claim 4 contradicted itself** in the biggest preset ("mostly low-rise: … 67% live in 3+ stories"). It now uses the standard definition of mid-rise (4–12 stories) and reads correctly for every preset.
- **"Supertall" caveat:** it used to disappear at 20 stories; it now applies to anything under about 80.
- **Test command:** the one in the README failed on Node 24, which doesn't accept a folder there. It now names the test file.

### Limits
- Everyone works in one downtown, and real downtown towers are mostly offices, which the model leaves out.
- There's no income mix, and it shows only the long-run end state, not the decades cities take to adjust.
- The height limit caps floor space rather than homes per lot, which is how single-family zoning actually works.
- The model city is about 3–4× denser than real US metros of its size, largely because it ignores cheap car commuting and the taste for yards.
- The cut-offs behind each verdict are judgment calls, written into the code: a spike is 1.5× the free-market height, sprawl is 2% more land, mid-rise is 4 stories.

I can commit this, move it into `viz/` as a page, or extend it, for example with the machine-learning analogy we discussed earlier.

## 6. Next steps for the neural-network comparison

*2026-09-24 20:18 UTC*

**User:**

> What's next for comparing this to neural networks?

**Assistant:**

The next step is a toy network that runs the same experiment as the city page, with the same "where did it go?" accounting, so the two can be compared number for number.

### What the city model changes about the question

- **Every effect's size depended on the cost of building tall.** In a network, the cost of packing more in is interference between features that share units. That depends on how often those features are active at the same time. Superposition is mostly timesharing: several residents can share one apartment if they're rarely home at once. So feature sparsity works as the network's "cost of building tall" dial, and it's one we can turn.
- **Sprawl only happened when nobody could leave.** In a network, leaving means a feature stops being represented, which is cheap for unimportant features. So a cap should mostly drop marginal features rather than spread out the rest, unless every feature matters.
- **Sprawl only costs something because of commuting.** Ordinary networks have no geometry, so there is no commute. The video's mechanism needs a wiring cost, which brains have and topographic networks imitate.

### The toy

It would be a small autoencoder like the one in Toy Models of Superposition (Elhage et al. 2022). Its hidden units would sit on a sheet, and a wiring cost that grows with distance from a central readout would act as the commute. That cost is similar to the wiring penalty in Liu, Gan & Tegmark's brain-inspired modular training. Interference comes from the task itself; the wiring cost is the only thing added.

| City | Toy network |
|---|---|
| Land | Hidden units on a sheet |
| Downtown | The readout, at the centre |
| Households | Features the network must reconstruct |
| Height | Features per unit (superposition) |
| Cost of building tall | Interference, which is low when features are rarely active together |
| Height limit | A cap on each unit's weights (a standard max-norm constraint) |
| Hole in the lid | No cap near the readout |
| Farmland | Unused units |
| Leaving | A feature the network stops representing |

The 3D view carries over directly: each unit's block height is how many features it holds.

### Tests, and what would count against the analogy

1. **Cost of height.** Vary sparsity.
   - Prediction: sparse features behave like a big city. There's a tall centre, a cap squeezes a lot, and an exempt centre spikes. Dense features behave like a small town that a cap barely touches.
   - It fails if superposition doesn't respond to the cap and the hole the way building height does.
2. **Sprawl or exit.** Vary feature importance, from "every feature matters" to "many features barely matter".
   - Prediction: the cap spreads the network out in the first case and drops features in the second.
   - It fails if the network does the same thing in both cases.
3. **Land dimension (your 2D vs high-D question).** Put the units on a line, a sheet, a cube and higher.
   - As a rough rule, a cap that cuts density by a factor k widens the city by k^(1/d): 2× on a line, 1.41× on a sheet, 1.26× in 3D and 1.07× in 10D. So the video's effect should fade as the land's dimension rises.
   - The city model can run the same sweep with a small change to how it computes ring area, so the two curves can be compared.
4. **Learning rules (your decentralization point).**
   - I first considered checking that backprop's implicit prices satisfy the city's balance condition: rent falls with distance by exactly the extra commute cost. That test can't fail, because every condition of the city's balance becomes "the gradient is zero" in the network, and any trained network satisfies that.
   - The version that can fail compares learning rules. Train the same toy with predictive coding, which uses only local errors, and with feedback alignment, which sends errors back through fixed random weights (in effect, wrong prices).
   - Prediction: if decentralized learners really reach the same outcome as backprop, predictive coding builds the same city and feedback alignment builds a different one.

### Where it could break

- **Superposition snaps to fixed fractions.** Elhage et al. saw features settle at 1/2, 2/3 or 2/5 of a dimension, so the network might build terraces instead of claim 4's smooth mound.
- **Gradient descent doesn't always find the best layout.** Different random seeds can settle differently, while the city model always jumps straight to the long-run outcome. Each result needs several seeds with the spread reported. Seed dependence would itself be the "history decides the layout" effect we discussed earlier.

### Practicalities and order

The Python on this machine has no numpy or PyTorch, so I'd write the toy in plain JavaScript like `model.js`. At toy size (about 50 features and 150 units), I'd guess a run takes seconds to a couple of minutes, and seed sweeps can run in parallel.

1. The land-dimension sweep in the city model. It's quick and sets the predictions for test 3.
2. The toy with tests 1–3 over several seeds, as a second tab on the page.
3. The learning-rule comparison, which needs a predictive-coding implementation.

Should I start with step 1?

> **Later corrected:** The next answer rejects this plan. Superposition is not building height (its cost falls on others, so it is an externality), units in a dense code have no location, and the sheet plus wiring cost would have made the result circular.

## 7. Coherence audit: what plays the role of land

*2026-09-24 20:41 UTC*

**User:**

> do some more reflection for coherence of this correspondence, find errors and explore other potential correspondences that might cohere better. keep going until you find something perfect, keeping in mind that we want to figure out what the distributed, potentially topological/informationally-constrained "learning network" equivalent of land allocation is, potentially thinking about reflections of the wider economy as well

**Assistant:**

I found a correspondence that holds up exactly, not just by analogy: **neurons on a sheet competing for incoming events, where each neuron's adaptation acts as its price**.

Every spike raises the neuron's price for the next event, and the price decays over time. That price is a land rent in Alonso's sense. In simulation the network reproduces the city model's equilibrium within a few percent under every rule from the video. When the neurons also learn what to respond to, they sort into rings of land use the way Alonso's theory predicts.

My earlier candidate, superposition, turned out not to be land. It's a different property regime: shared spectrum, like radio bandwidth.

### Errors in my last proposal

- **Superposition isn't building height.** Height is a more intensive use of a parcel you control, and its cost (construction) falls on you. Superposition is several features sharing one channel, and its cost (interference) falls on the others sharing it. That's an externality, so sparsity was never a "cost of height" dial.
- **Features in a distributed code have no location.** Every feature uses every unit a little, so "which unit does it live on?" has no answer. Land requires exclusive use.
- **The weight cap wouldn't have bound.** With separate encoder and decoder weights, a ReLU network can shrink one side and grow the other.
- **It was circular.** The sheet and the wiring cost were my additions, so any city-like behavior would have come from the loss I wrote.
- **Nothing in it was a price.** A plain network has no per-unit capacity limit, so there's nothing for a rent to ration. Dead units are what a missing price looks like.
- **An older one:** I called softmax's sum-to-one rule a parking minimum. The exact version is a demand system with no "none of the above" option, which economists include as standard (Berry 1994). Attention sinks are models building that option out of the first token.

### What counts as land

I required six properties. The capacity must be:
1. fixed in amount;
2. tied to a location whose value comes from access;
3. used exclusively;
4. able to be used more intensively, at a rising cost;
5. backed by an outside use at the margin;
6. allocated by a local price, not a planner.

| Candidate | Verdict |
|---|---|
| Weights | Capital: produced by training, with no location of their own |
| Units in an ordinary network | Interchangeable and with no capacity limit, so no rent |
| Latent dimensions | Shared rather than exclusive, so spectrum (see below) |
| Bits per parameter | A real "taller vs. more land" trade-off: training at lower precision reduces the effective parameter count (Kumar et al. 2024). But there's no location. |
| Chip memory hierarchy | A literal bid-rent curve: memory near the processor is fast, scarce and expensive. But caching rules allocate it, not learning. |
| Mixture-of-experts capacity | Exclusive and priced. DeepSeek adds a per-expert bias, raised when an expert is underused and lowered when it's overloaded: a price with the sign flipped. No geography, though. |
| **Adapting neurons competing on a sheet** | **Meets all six** |

### The match

| City | Network |
|---|---|
| Parcel of land | Neuron (fixed number, fixed position) |
| Distance to downtown | Conduction distance from where inputs arrive |
| Household | An input event, handled by one neuron |
| Floor space | Firing rate |
| Rent | Adaptation level |
| Cost of building tall | How adaptation decays: exponential decay gives a cost that rises with rate; a fixed target rate gives a hard cap |
| Height limit | Maximum firing rate |
| Farmland past the edge | Neurons that stay silent |
| People leaving | Inputs the network ignores |
| Building type; redevelopment | The neuron's tuning, learned by a Hebbian rule; the cost of retuning it |

**Why it's exact.** Raising a neuron's price when it's overused and lowering it when it's underused is textbook price adjustment toward supply meeting demand. Here the constraint is that each neuron has limited capacity. The noisy competition between neurons is exactly a logit location choice. So the equilibrium conditions are the city's own.

**What's already known.**
- Reading neural thresholds and inhibitory weights as Lagrange multipliers is established (Zylberberg, Murphy & DeWeese 2011).
- So is reading homeostatic changes in excitability as dual gradient ascent (Habenschuss, Bill & Nessler 2012).
- I found no one connecting either to land rent or checking a city's predictions against them.

**Why a network like this would use prices at all.** In economics, the price mechanism needs the smallest possible messages among decentralized mechanisms that reach efficient, voluntary allocations (Hurwicz; Mount & Reiter 1974). Jordan (1982) showed it's the only mechanism that does. That's a theorem about exchange economies, so here it's a suggestion, not a proof. But one number per scarce resource is exactly what an adaptation variable is.

### Simulation results

I simulated 901 neurons and compared them with the city model's equilibrium on the same grid.

| Rule | Neurons in use: theory (sim) | Mean distance: theory (sim) | Inputs handled: theory (sim) |
|---|---|---|---|
| None | 249 (258) | 4.49 (4.57) | 100% |
| Firing-rate cap | 305 (305) | 5.60 (5.60) | 100% |
| Cap, centre exempt | 285 (286) | 4.87 (4.91) | 100% |
| Cap, some inputs can leave | 277 (277) | 5.16 (5.19) | 84% (85%) |
| Cap, inputs leave freely | 249 (252) | 4.99 (5.01) | 78% (78%) |

- **Rents:** adaptation levels fall with distance along the bid-rent line. The gap shrinks with the noise in the competition, as theory predicts.
- **The video's results carry over:**
  - When no input can leave, the cap spreads the network over 22% more neurons.
  - When inputs can leave freely, nothing spreads and 22% of them are dropped.
  - An exempt centre fires about 5% faster than with no cap at all: that's the spike.
- **Where the squeezed load goes:** 83% into denser "suburbs" and 17% into sprawl, the same pattern as the city page.
- **Land use through learning:** I gave the network two input types, urgent (delay is costly) and routine, and let each neuron learn its tuning.
  - Urgent inputs took the inner ring and routine inputs the outer ring, with the boundary where Alonso's theory puts it and rents within 0.1 of theory.
  - When retuning a neuron is expensive, whatever layout forms first gets locked in, and rents end up 20–30% above the frictionless level. That's durable buildings, or a critical period. I didn't design for this; it emerged.

### Where superposition fits: spectrum, not land

In a dense code, features send signals along nearly perpendicular directions and interfere in proportion to their overlap and how often they're active together. That's how CDMA phones share radio bandwidth. The right economics is spectrum economics (Coase 1959, where the Coase theorem first appears), not land economics.

The two regimes coexist, and Toy Models of Superposition shows which one appears when.
- With frequently active features, the model gives the most important ones dedicated dimensions and drops the rest.
- With sparse features, it shares.

That matches Demsetz's (1967) theory of property: exclusive rights appear when the gains from internalizing an externality exceed the cost of doing so. The resemblance is structural, not exact.

The same institutions appear when several Hebbian neurons try to avoid all learning the same thing:
- **No rules:** Oja-rule neurons with no interaction all learn the same top component. Everyone crowds onto the best spot, like Hotelling's sellers bunching together.
- **Priority rights:** Sanger's rule has neuron k learn the k-th component, after the earlier neurons. First in time, first in right.
- **Prices plus a tax:** Földiák's network gives each neuron a threshold that targets a firing probability (a price on its capacity). It adds anti-Hebbian inhibition between neurons that fire together (a Pigouvian tax on overlap). The neurons end up differentiated. That mirrors d'Aspremont et al. (1979): firms that choose locations and then compete on price move to opposite ends when transport costs are quadratic.

### The wider economy

Each kind of constraint in a network carries its own price.

| Economy | Network | How close |
|---|---|---|
| Land rent | Adaptation, homeostatic thresholds, expert-balancing bias | Exact, simulated |
| Tax on overlapping use | Inhibition between neurons that fire together | Exact: both are Lagrange multipliers |
| Spectrum, a congestible commons | Dense latent dimensions | Same math as CDMA |
| Prices of intermediate goods | Backprop's error signals (or predictive-coding errors) | Exact |
| Capital and depreciation | Weights and weight decay | Close |
| Trade that falls off with distance (gravity law) | Cortical connections, which fall off exponentially with distance (Ercsey-Ravasz et al. 2013) | Same form |
| Firms | Modules, which appear when connections cost something (Clune et al. 2013) | Structural |
| Budget | Energy: the cost of each extra bit rises with firing rate, which favors low rates (Levy & Baxter 1996). The brain is low-rise because building tall is expensive, not because of a rule. | Close |
| Outside option in demand | Attention sinks | Same form |

### What still doesn't carry over

- **Floor space is a flow.** Neurons handle events over time, so this is a city of hotel rooms, not homes. The two match in steady state but not in how they change. The version with permanent residents would be memory allocation, where specific neurons hold specific memories.
- **Nobody collects the rent.** Adaptation rations capacity but transfers nothing. So the Georgist questions (who captures rent, and whether to tax it) have no counterpart inside a single network with one objective. They need several agents with separate goals sharing located capacity, such as shared compute or a context window that competing tools share.
- **One centre.** Real cortex gets input everywhere, so the general case has many centres and clustering. Neighbours learning together in self-organizing maps is a knowledge spillover that fades with distance, as in Lucas & Rossi-Hansberg (2002). I haven't simulated that.

The scripts and a README are in `experiments/neural-city/`; the runs take about 45 s and 20 s, and nothing is committed. Possible next steps: the many-centre version with neighbours learning together, a "neural city" tab on the play-dough page, or a multi-agent setup where the Georgist question comes back.

> **Later corrected:** The next answer revises "superposition is spectrum, not land" to "superposition is land used in shared mode (mixed use)", following the user's suggestion.

## 8. Superposition as mixed use; individuation

*2026-09-24 21:34 UTC*

**User:**

> can superposition in the land context be like different land uses that are exclusive / bad when they co-occur (i.e. heavy industry and residential?).    And can there be another dimension here of individuated-ness? i.e. hotel vs homes is a matter of how individuated it is, how much control the individual is given by the overall system to control its local environment, with various degrees along this spectrum, where superagents tends towards homogenizing / individuality-draining their constituents to the degree non-helpful to the superagent's survival/effectiveness. See if you can think further to create a model that coheres even further, do some research to see if people are already thinking about this.

**Assistant:**

The claim check is back, with a few corrections I'll fold in. The main ones:
- **Scott:** he treats legibility as ordinary statecraft. His disasters need high-modernist ideology, an authoritarian state and a weak civil society as well, so failure can't be attributed to legibility alone.
- **Rentier states:** the evidence is mixed.
- **Euclid v. Ambler (1926):** besides separating industry from homes, it explicitly approved keeping apartments out of single-family districts. That second part is the density exclusion the video is about.

I'm now waiting on the prior-work search before writing everything up.

**Assistant:**

Both ideas hold up, and together they fill in the picture. I simulated each in the neural city, checked the literature, and got a model of four questions about any piece of space, each with one rule. As far as the research turned up, nobody has combined these, though every piece has close precursors.

### 1. Superposition as mixed land use

Last time I said superposition is spectrum rather than land. Your framing is better. Superposition is land used in shared mode (mixed use, timesharing), and interference is the nuisance between the uses.

The rule for when uses can share isn't whether they're different. It's whether they peak at the same time, within the time their effects linger. The same rule shows up in several places:
- **Toy Models of Superposition:** features active at the same time get perpendicular directions, while features that never co-occur share one.
- **Dorrell, Whittington et al. (ICLR 2025):** they proved an exact version. Mixing is preferred when two signals don't hit their extremes at the same time.
- **Network engineering:** it's the statistical-multiplexing rule for sharing a link.
- **Jane Jacobs:** it's her case for mixed uses, which put people on the street at different times of day.

The simulation puts two uses on the same neurons. Each pays a nuisance cost for the other's recent activity there.

| Timing | Neurons in use (mixed / single-use zoning) | Cost per event (mixed / zoned) |
|---|---|---|
| Both uses active all the time | 261 / 266 (only 3% of neurons end up shared) | 8.89 / 8.88 |
| Day/night, switching at 1× the time activity takes to fade | 347 / 324 | 9.99 / **8.86** |
| Day/night at 20× that time | 277 / 405 | **9.08** / 10.98 |

- **Co-active incompatible uses** get separated by the network with no rule, and the footprint doesn't grow.
- **Slowly alternating uses** timeshare. Zoning them apart spreads the city 46%.
- **Fast alternation:** the network keeps mixing and pays for it, because each event counts the nuisance it suffers but not the nuisance it leaves behind. Zoning wins there.
- **Why a trained network needs no zoning:** with a single objective it internalizes that nuisance, like Coase's world with free bargaining. Cities, and networks that learn by local rules, don't internalize it.

The ruling that established zoning in the US, *Euclid v. Ambler* (1926), bundled two different things. It upheld separating industry from homes, which is a real co-active nuisance. In the same opinion it upheld keeping apartments out of single-family districts ("a mere parasite"). That second part is density exclusion, which is the video's subject, not nuisance.

### 2. Individuation

This is a separate axis: how much the occupant may reshape its space, keep others out, and for how long. Economics already has a graded version. Schlager & Ostrom (1992) define a ladder of rights:
- **Authorized users** may use the resource.
- **Claimants** may also "transform the resource by making improvements."
- **Proprietors** may also exclude others.
- **Owners** may also sell.

Hotel versus home is a climb up that ladder.

It's tied to the sharing axis: customizing a space for one occupant makes it worse for everyone else. So customized space tends to be dedicated (homes) and generic space shared (hotels). In the simulation, eight occupant types come and go. A tuned neuron serves its type cheaply and others poorly (mismatch cost m).

| m (value of customization) | Share of time each type is present | Homes | Hotels | Learned (customization follows use) |
|---|---|---|---|---|
| low (1) | 10% | 14.49 | 11.38 | **10.62** |
| low (1) | 90% | **8.97** | 9.81 | 9.02 |
| high (3) | 50% | 10.58 | 11.74 | **9.58** |

- **Homes vs hotels:** dedicated, customized space wins only when occupants are nearly always present. When they come and go, most homes sit empty and the footprint balloons, like a city of second homes. This is the superposition phase diagram restated as housing.
- **Learned:** customization that follows use (usufruct, in property terms) beats both unless occupancy is nearly constant.

**The rule the research turned up: a whole protects each part in proportion to how much it depends on that part.** Examples at different scales:
- **Weights:** EWC protects parameters in proportion to how much the loss depends on them.
- **Units:** continual backprop resets the least useful ones.
- **Neurons:** Harris (2008) proposes a neuron's recent changes are consolidated when downstream neurons strengthen their reliance on it.
- **Firms:** Hart & Moore (1990) conclude that indispensable parties should own.
- **Societies:** *Gradual Disempowerment* (Kulveit et al. 2025) argues that systems stay aligned with people because they rely on human labor. It draws on the rentier-state argument, whose empirical support is mixed.

**One correction to your framing: "drain individuality where it doesn't help" is slightly off.** A 2026 post, "Coalitional Darwinism and the Instrumental Utility of Individuality", argues that a whole should police only what affects its own function. It should keep neutral variation as a reserve for exploration.

Biology fits that. Bodies strip cells of their ability to compete and reproduce on their own (Godfrey-Smith's "de-Darwinization"), yet they cultivate enormous differences between cell types. So individuality splits into two parts:
- **Difference:** what the part does. Wholes cultivate it where it helps.
- **Autonomy:** whose goals the part pursues. Wholes suppress it where it conflicts.

Levin's work is the closest to your dial: gap junctions between cells "partially erase" each cell's informational identity, and cancer is cells reclaiming it.

**The dial exists as an institution.** In Weyl & Zhang's (2022) "depreciating licenses," holders name a price at which they must sell and pay a percentage of it each period:
- A high rate acts like a hotel: space moves to whoever values it most, but nobody invests in it.
- A low rate acts like a home: strong investment, but holdouts.
- They set the rate from observed turnover.

**This ties back to the video.** Height limits and single-use zoning come from individuation gone wrong. Incumbent homeowners hold exclusion rights over their neighbours' land beyond anything the metro depends on them for. Fischel's "homevoters" are strongest in suburbs and small towns. The result is Heller's anticommons (too many vetoes, so land is underused), which means the lids, which means sprawl.

### 3. The model

| Question about a piece of space | Rule | Network | City |
|---|---|---|---|
| Who gets it, and how intensively? | A local price rations it | adaptation, thresholds | rent, height |
| Can several uses share it? | Only if their peaks don't coincide within the time effects linger | superposition | mixed use, zoning |
| How much can the occupant reshape it, and for how long? | Protection in proportion to the whole's dependence on the occupant; neutral variation tolerated | plasticity, consolidation | hotel, lease, ownership |
| Who sets the rules, and for whom? | A whole whose success depends on its parts treats them well | global objective vs local rules | metro vs neighbourhood |

On the last row: a government funded by land rent profits from making its territory valuable to residents, because rent rises with how good a place is to live. That's the logic behind the Henry George theorem. A whole funded independently of its parts has no such incentive.

### What exists and what doesn't

**Closest precursors:**
- Scherlis et al. (2022) treat superposition as a capacity budget, but with a single global price and no location.
- Baum's "Hayek machine" rests on property rights and conserved money, and calls Holland's classifier systems a tragedy of the commons.
- Lewis & Harris model neurons as a marketplace.
- Watson, Levin & Buckley (2022) treat individuality as a matter of degree.

**Not found anywhere:**
- Rent tied to a location inside networks or brains.
- Superposition treated as zoning or multiplexing with externalities.
- Protection-by-dependence stated as one principle across scales.
- A pairing of developmental biology's "two big ideas" with economic geography's:
  - positional information (cells reading a pre-existing gradient) with von Thünen and Alonso;
  - Turing patterns with Krugman's self-organizing cities.
  
  Krugman even wrote that a von Thünen model is unlike an embryo because it isn't self-organizing, but embryos use both mechanisms.

My neural city has an externally fixed centre, so it's the von Thünen kind. Centres forming by themselves, the Krugman–Turing kind, is the untested piece and the natural next simulation.

The new scripts are `experiments/neural-city/sharing-and-zoning.mjs` (about 2 minutes) and `hotels-and-homes.mjs` (about 1 minute per setting); the README there has the results. Nothing is committed.

Sources:
- [Dorrell, Whittington et al., "Don't Cut Corners" (ICLR 2025)](https://arxiv.org/abs/2410.06232)
- [Elhage et al., Toy Models of Superposition](https://transformer-circuits.pub/2022/toy_model/index.html)
- [Scherlis et al., Polysemanticity and Capacity](https://arxiv.org/abs/2210.01892)
- [Schlager & Ostrom 1992](https://www.jstor.org/stable/3146375)
- [Weyl & Zhang, Depreciating Licenses (AEJ: Policy 2022)](https://www.aeaweb.org/articles?id=10.1257%2Fpol.20200426) and [SSRN version](https://papers.ssrn.com/abstract=2744810)
- [Euclid v. Ambler Realty (1926)](https://www.law.cornell.edu/supremecourt/text/272/365)
- [Kirkpatrick et al., EWC](https://www.pnas.org/doi/10.1073/pnas.1611835114)
- [Dohare et al., Loss of plasticity](https://pmc.ncbi.nlm.nih.gov/articles/PMC11338828/)
- [Harris 2008](https://pubmed.ncbi.nlm.nih.gov/18255165/) and [Lewis & Harris, neural marketplace](https://www.biorxiv.org/content/10.1101/013185v1)
- [Hart & Moore / Grossman & Hart](https://ideas.repec.org/a/ucp/jpolec/v94y1986i4p691-719.html)
- [Kulveit et al., Gradual Disempowerment](https://arxiv.org/abs/2501.16946)
- [Drago & Laine, The Intelligence Curse](https://intelligence-curse.ai/intelligence-curse.pdf)
- [Coalitional Darwinism and the Instrumental Utility of Individuality](https://www.lesswrong.com/posts/Tm2dCH6dHE2ber53Y/coalitional-darwinism-and-the-instrumental-utility-of)
- [Levin 2019](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.02688/full) and [TAME 2022](https://www.frontiersin.org/articles/10.3389/fnsys.2022.768201/full)
- [Watson, Levin & Buckley 2022](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2022.823588/full)
- [Baum & Durdanovic](http://www.whatisthought.com/ptech.pdf)
- [Fischel, The Homevoter Hypothesis](https://www.hup.harvard.edu/books/9780674015951)
- [Heller, Tragedy of the Anticommons](https://repository.law.umich.edu/facarticles/609/)
- [Krugman, The Self-Organizing Economy](https://archive.org/details/selforganizingec0000krug)
- [Green & Sharpe, positional information and reaction–diffusion](https://pubmed.ncbi.nlm.nih.gov/25804733/)

> **Later corrected:** The claim that zoning wins when uses alternate quickly did not survive the agent-based re-run (26 Sep): with individual agents it is roughly a tie. See the one-model README.

## 9. One model, two readings: first build

*2026-09-25 00:23 UTC*

**User:**

> Might it be possible to create a single general model that we can visualize in two different ways--a neural network, and an economy--perhaps general enough to represent different architectures for both in order to see the bijection more fully? Put max effort and try and build this in a new html file, iterating until you are sure you've crystalized the perfect way to express, visualize, and intuitively explain variance in both from a single model

*2026-09-25 01:12 UTC, user: asked the assistant to resume a cut-off reply.*

**Assistant:**

I built the page at `experiments/one-model/index.html`: one model you can switch between eight architectures, each drawn side by side as a land economy and as a neural network. The 10 model tests pass, and I checked all eight settings in the browser in light and dark mode and at phone width, with no errors.

It's a single file with nothing to install, so you can open it directly; `#tenure`, `#experts` and the other setting names work as links. It's also served at `http://localhost:5181/`.

### The model
Arrivals (households or input events) each pick a site (a parcel or a unit) by one softmax formula:

`U = −t·distance − price − m·(1 − fit) − ν·clash + ρ·log(1 + use)`

- **Prices** rise with load. In the economy that's rent; in the network it's adaptation, a threshold, or a load-balancing bias.
- **Fit** follows what a site serves: redevelopment in the economy, Hebbian learning in the network.
- **Variation across architectures** is just which terms are switched on. A table at the top shows this for each setting.

The eight settings, economy ⇄ network:
- Land market ⇄ competitive layer with adaptation
- Height limit ⇄ firing-rate cap
- Offices in the centre, homes in the rings ⇄ fast inputs claim the nearest units
- Districts ⇄ ocular-dominance columns
- Mixed use vs zoning ⇄ shared vs dedicated units (superposition)
- Hotels vs homes ⇄ plastic vs dedicated units
- Firms with fees ⇄ mixture of experts with load balancing
- Commuting ⇄ attention over a sequence

The two views draw the same numbers. Every moving dot is one sampled event shown in both views, and hovering a site highlights its counterpart. Each setting has a two-column story, the terms it adds compared with the land market, the equation with unused terms dimmed, and knobs, readouts and charts labelled in both vocabularies. The page ends with a dictionary and a "Where the correspondence breaks" section.

### What the final round of checking changed
I tested each claim on the page against the model itself, across several random seeds, and three were wrong or misleading:

1. **Hotels vs homes contradicted its own picture.** Empty homes were drawn as farmland, so dedicated space looked like it used *less* land. I added a built stock that goes up with use and comes down slowly. Built-but-empty space is now drawn faded in both views, and occupancy (utilization in the network) is in the readout. That shows why dedicated space loses when occupants come and go: it must be built for each occupant's busiest moment, while shared space only needs the busiest moment of everyone together. At 15% presence homes are the emptiest regime on every seed. At 90%, homes win, but only narrowly (8.18 vs 8.22 for usufruct, vs 8.78 for hotels).
2. **"Zoning helps when uses alternate quickly" only holds if prices reset while a parcel is empty.** That fits neurons, whose adaptation recovers during a pause, but not cities, where rents are sticky. With sticky rents the uses separate on their own, and zoning makes no difference (9.93 vs 9.94). The mixed-use setting now has a knob for this, and it's listed as a place where the correspondence breaks.
3. **The "shared by both uses ⇄ polysemantic units" readout couldn't see sharing over time.** It showed 0% when 98% of use was time-shared. It now looks at a site's whole history, which is also how polysemanticity is measured in networks.

I also fixed some label overlaps, a table that overflowed on phones, and the wording of one citation.

### Limits
- The page solves for average flows; the dots are sampled from those averages.
- The built stock is bookkeeping only: it doesn't feed back into rents.
- Prices here ration capacity but nobody collects them, so Georgist questions have no counterpart inside one network.
- The model covers one layer, not a chain of layers.

Nothing is committed. `experiments/one-model/` also has a `README.md` and the test file (run with `node --test experiments/one-model/model.test.mjs`, about 20 s). Two local servers are still running, on ports 5180 (play-dough city) and 5181 (this page).

> **Later corrected:** Item 2 here ("zoning helps when uses alternate quickly, if prices reset") was later traced to the average-flow solver and withdrawn (26 Sep).

## 10. Agents, clearer neurons, tooltips

*2026-09-25 18:31 UTC*

**User:**

> Can we see if we can make this more agent-based simulate-y? Also, the neuron design I'm a little confused by, I wonder if we can make it more clear what exactly is going on. Also, please add reusable tooltips to explain terms inline in the text.

**Assistant:**

Three changes, then. Here's how I'll approach each before I start:

- **Agent-based:** the model will get a second solver where every arrival is a real agent. On the economy side that's a household who picks a parcel with its own taste noise, moves in and leaves after a while. On the network side it's a spike whose adaptation lasts a while. Rents and thresholds then come from who is actually present. The existing average-flow solver stays as a toggle and as the reference the agents should match.
- **Clearer neurons:** each view gets a plain "how to read this" line, and each neuron glyph will encode one thing (recent spikes, which is also how adapted it is). Hovering a neuron will show its spike train and threshold over time. A step-by-step "follow one arrival" mode will show a single spike competing across the layer.
- **Tooltips:** one glossary and one shared tooltip component, used for marked terms anywhere in the text.

First I'll re-read the model code I'm about to extend.

*2026-09-26 01:08 UTC, user: "continue".*

*2026-09-26 02:55 UTC, user: asked the assistant to resume a cut-off reply.*

**Assistant:**

All three are done in `experiments/one-model/index.html`. The page now runs individual agents by default, and all 19 tests pass. Building the agent version also showed that one conclusion I gave you last time was wrong; that's covered below.

**Agent-based.** Every arrival is an individual: a household on the economy side, a spike on the network side. It adds its own random taste to the costs, picks a site, stays a random time (20 time units on average) and leaves. Rent and adaptation come from who is actually there: each household adds 0.5 to its building's rent, which is also one spike's addition to its neuron's adaptation. Buildings are drawn one floor per household, and every moving dot is a real arrival. A "Simulate" knob switches back to the average-flow solver, which the agents are tested against. On the land market their long-run pattern is within about 2% of it.

**Clearer neurons.** Each neuron's size now means one thing: how many spikes it fired lately, which is also how adapted (hard to fire) it is. A neuron flashes when a spike reaches it. A ring appears only where a rule adds to the threshold, such as a rate cap or a balancing bias. Each view has a one-line "how to read this". Hovering a neuron shows its recent spikes and its threshold over time; hovering a parcel shows move-ins and rent, which are the same data. **Follow one arrival** pauses and walks through a single choice in five steps, in both vocabularies and with real numbers. In the land market it shows parcels that cost the same once commute and rent are added (2.0 + 5.1 vs 5.8 + 1.5, both about 7.2), which is the bid-rent equilibrium. The likeliest picks are usually parcels someone just left.

**Tooltips.** There's one glossary of about 60 terms and one shared tooltip. Marked text anywhere on the page (stories, legends, readouts, dictionary, caveats) gets a dotted underline. Each tooltip gives a definition and the term's counterpart in the other reading, such as rent ⇄ adaptation. To add a term, add an entry to `GLOSSARY` and write `[[key|text]]` in the text.

**What changed in the findings.**
- **Correction:** last time I said single-use zoning wins when uses alternate quickly, as long as prices reset while a parcel is empty. With agents it's roughly a tie. The earlier result came from the average-flow solver: its prices recover slowly after a vacancy, which gave returning zoned uses a spurious discount. The page, README and tests now say this.
- **Boundaries wander:** with agents, uses that avoid each other stay apart at every moment, but where the boundary runs drifts over time. Average flows can't show this.
- **Extra overflow:** with capacity at 0.8× the average, individual tokens overflow 27% of the time, not the 20% the averages give. That's why real mixture-of-experts layers set capacity above 1.
- **Unchanged:** the other results hold with agents too, including sprawl under a height limit, sorting into rings, districts, hotels vs homes, expert collapse and attention hubs.

I checked the page in the browser for every setting with both solvers, in light and dark mode, and at phone width. There were no errors, and each frame takes under 10 ms against a 33 ms budget.

Nothing is committed; I updated the README and memory. The dev server is running again at http://localhost:5181/, or you can open the file directly. Tests: `node --test experiments/one-model/model.test.mjs` (about 35–50 s).

> **Later corrected:** The "27% vs 20% token overflow because load fluctuates" explanation was disproved in the next round: the excess came from rules that let the router see full experts. With Switch-style dropping, overflow matches the Erlang loss formula (about 9% at capacity 1×).

## 11. Pinnable popups, the formal pass, inline citations

*2026-09-26 20:00 UTC*

**User:**

> Could you make the tooltips persist when clicked and add links to them so I can see referenced concepts (e.g. deepseek bias thing and other un-tooltiped concepts that I don't have reference for, be liberal with your tooltipping and linking). Then I want you to go through until you feel like all the equivalent concepts are *formally* equivalent in some formalization of this model, and also improve page to reference past literature in-line as opposed to citation links at bottom (you can do both via popup footnote links). Aim for maximum self-coherence and grounding in intuition as possible.

**Assistant:**

All three parts are done in `experiments/one-model/index.html`: pinnable popups with links, a formal pass over every pairing, and inline citations. All 25 tests pass. The formal pass found one wrong explanation on the page, now corrected.

**Popups.** Hovering a term shows its definition; clicking, tapping or Enter pins it. Terms and citations inside a pinned popup open in the same popup, with a Back button, and Escape or clicking outside closes it. Each term gives both readings, its symbol in the model, and "Read more" links. I took your request to be liberal literally: about 110 terms, including the knob labels, legends, chart notes, readouts and walkthrough text. The DeepSeek bias entry now gives the actual rule and links to the paper.

**Citations.** The old "Sources" list is gone; there are now 60–80 author–year citations inline throughout the text. Each opens its full reference, with a line on what the page uses it for and a link. A reference list of 82 entries is built at the bottom. I checked every DOI against the title, authors and year it resolves to, every arXiv ID against arXiv, and every Wikipedia link against Wikipedia. That caught one DOI I had wrong, and two Wikipedia pages that are about something else ("Increasing returns" redirects to *Diminishing returns*).

**The formal pass.** A new section, "The model in symbols", states the model once as a random process. The dictionary now pairs each symbol with its meaning in both fields and says which standard model in each field uses exactly that form. The main results:
- **Taste noise ⇄ neuron noise, exactly.** If neurons race to fire and the first one takes the input, the winner follows the same logit/softmax as a household choosing with random tastes.
- **Every price is the same kind of number.** The average flows settle at the minimum of one "free energy" (total cost minus τ × the variety of choices), and every price is a Lagrange multiplier. Economists know this as stochastic traffic equilibrium; in machine learning it's entropic optimal transport, which Sinkhorn solves. Tests check both halves: each price equals κ × load, and moving any arrivals raises the free energy.
- **Where it's only "the same form", the page says so.** The distance cost is exactly ALiBi, but only the same shape as cortex's exponential fall-off of connections. The set-point rule shares its resting point with Földiák's, not its step size.
- **What the free energy leaves out.** Rents that remember through vacancies depend on history. Tuning follows the mix a site serves rather than optimizing anything. Arrivals count only the nuisance they suffer, not the nuisance they cause; charging them for it (a Pigouvian tax) lowers the true total cost, which a test confirms.

**What checking turned up.**
- **Correction:** last time I said experts at capacity 0.8 drop 27% of individual tokens against 20% for average flows, "because load fluctuates". That's wrong. With 64× the agents, drops rose to 34% while 16% of capacity sat idle. The cause was the rules: the router could see which experts were full, and extra prices pushed tokens away. Now a full expert simply drops the overflow, as in Switch Transformer, and the numbers match Erlang's loss formula: at capacity 1×, 9% of tokens are dropped against 0.4% for flows, halving with 4× the agents.
- **DeepSeek's rule, exactly.** The experts setting now uses DeepSeek's actual bias update (a fixed step toward average load, checked against both papers). It keeps loads within about 3% of even.
- **Collapse threshold.** I derived that the even split breaks when ρ/τ > 1 + r₀/load (1.2 here); simulation collapses between 1.0 and 1.5.

I checked every setting in the browser in light and dark mode and at phone width. There were no errors or unrendered markers, and popups stay on screen.

Nothing is committed. I've updated the README and my memory notes. The page is at http://localhost:5181/, and the tests run with `node --test experiments/one-model/model.test.mjs` (about 55 s).

## 12. Taxes with exact network counterparts

*2026-10-01 03:33 UTC*

**User:**

> Can you add various kinds of taxes and their corresponding conceptions in neuron-view, only add if you are 100% confident

**Assistant:**

I added five taxes. Each has an exact counterpart in the neural network, and four are checked by new tests (28/28 pass). Three are in a new setting, **Taxes on land, buildings and residents ⇄ Global inhibition and stronger adaptation**; the Pigouvian charge is a new toggle in the mixed-use setting.

| Tax | Neural counterpart | Why it's exact | What happens |
|---|---|---|---|
| On land value | **Nothing.** A network has no landowner. | It taxes only what landowners keep above building costs, which appears in no one's costs. | Revenue appears and nothing else changes; loads are identical to the untaxed city. |
| On buildings | **Stronger adaptation per spike** | It multiplies the same parameter as the cost of building up. | Identical to a 50% higher building cost: shorter buildings, a wider city (213 → 277 parcels at a 50% rate). |
| Per resident (the same everywhere) | **Global inhibition:** the same inhibition on every neuron | A softmax ignores anything added to every option. Nessler et al. (2013) state that shared inhibition leaves which neuron fires unchanged. | In a closed city nothing moves. If people can leave freely, enough do that rents fall by about the tax: landowners end up paying it. |
| Pigouvian charge on nuisance | **Counting the interference a feature causes the others**, as training on the total loss does | It equals counting the nuisance twice in each arrival's cost. | Nuisance per trip falls about sevenfold (0.033 → 0.005). |
| Per unit of distance (a fuel tax) | **A steeper wiring cost per unit of distance** | It adds to the same distance cost. | The same as raising the existing commute knob, so there's no separate control. |

In the network nothing is collected, so the economy view shows tax revenue and the network view says "Nothing collected".

**What checking turned up:**
- **Another solver artifact, fixed.** With individual agents, rents first fell 0.18 short of the tax. Agents were comparing their noisy offer against a reference from the smooth average-flow solver, and noise makes that offer look better on average. They now compare a smoothed offer against a reference from their own solver, and both solvers agree that rents fall by about the tax.
- **The Pigouvian claim needed narrowing.** With weak nuisance it lowers the true cost. With strong nuisance, several separated layouts are each stable and the charge only guarantees one of them; once it came out slightly worse. The page's formal section previously overclaimed this and now says it.
- **Two literature limits I respected.** Brueckner & Kim (2003) find that a building tax causes sprawl only when dwelling size is fixed, as it is here; the page says so. Oates & Schwab (1997) credit Pittsburgh's 1980s building boom mainly to a shortage of commercial space, not its land tax, so the page doesn't claim the tax caused it.

**Left out**, because nothing in this model responds to them: a vacancy tax, a transfer tax, a Harberger (self-assessed) tax and a road congestion toll. The page lists them with the reason for each.

The four new references are checked against their DOIs and abstracts, and there are seven new glossary terms. I checked the new setting and the walkthrough in the browser; the README and my memory notes are updated. Nothing is committed, and the page is at http://localhost:5181/#taxes.

## 13. Which other taxes fit

*2026-10-01 04:58 UTC*

**User:**

> what about sales, capital gains, income, and other standard taxes? (are those includable in here?) or do we need a more general more of the economy?)

**Assistant:**

Some of these taxes fit the current model; most don't. The deeper problem is on the network side: even a more general economic model wouldn't give income or wealth taxes a counterpart in a layer of neurons.

**What fits now.** These either reduce exactly to taxes the page already has, or need one small addition:

| Tax | In this model | Network counterpart |
|---|---|---|
| Sales tax on rent | Tenants pay the rent × (1 + rate), the same allocation as the tax on buildings. The money splits differently: a rent tax also takes part of what landowners keep. | Stronger adaptation |
| Sales tax charged per purchase, the same at every site | Identical to the tax per resident | Global inhibition |
| Income tax, where everyone earns the same fixed income | A lump sum, so identical to the tax per resident | Global inhibition |
| Tax on pure profit (revenue above all costs) | Neutral, like the land tax | Nothing |
| Wage tax, in the commuting setting | Taxing wages shrinks the pay gap between employers, while commuting and staying home stay untaxed, so more people stay home. This needs one new parameter, the base wage level. | Content scores shrink relative to the distance penalty, and more attention goes to the sink. Exact, but "wage ⇄ content score" has no standard name in neuroscience or ML. |

There's one wrinkle with the fuel tax already on the page: commuting here harms no one else, so a fuel tax is a pure distortion. It becomes the Pigouvian case only if I add an emissions or congestion cost.

**What doesn't fit.** Each of these taxes acts on something the model doesn't have:
- **Capital gains, wealth and estate taxes:** need assets held over time, changing prices and decisions to sell (the lock-in effect). Nothing here is owned or sold.
- **Income tax's effect on hours worked, and progressive rates:** need a choice of hours and unequal incomes.
- **Corporate tax on the normal return to capital:** needs capital and investment.
- **A broad sales tax or VAT across many goods:** needs more than one good. With fixed housing it would act like an income tax anyway.
- **Tariffs:** need trade between regions.

A more general model would need budgets, a second good, flexible floor space per household, hours or participation, durable owned buildings, savings, and a government budget. That's a quantitative spatial equilibrium model like Ahlfeldt et al. (2015), which the page already cites.

**Why that still wouldn't be enough.** Income, wealth and gains taxes tax an agent's budget, and spikes and tokens have no budget. Nothing carries over from one spike's choice to the next. This is the same limit as the page's "nobody collects the rent".

Learning systems that do have such taxes exist, but they are economies of agents rather than layers of neurons:
- **Classifier systems:** rules hold "strength" (wealth) and bid for the right to act. Rules that matched the input but didn't act lose strength to a tax ([Bull 2014](https://arxiv.org/pdf/1401.3607)).
- **Baum's Hayek machine:** agents hold wealth and bid at auction to control the task, paying the previous owner. They pay a tax proportional to the computation they use; earlier versions charged a fixed tax per agent and removed agents that ran out of money ([Kwee, Hutter & Schmidhuber 2001](https://arxiv.org/pdf/cs/0105025)).

In those systems income and wealth taxes are literal, not analogies. But you'd be pairing an economy with a market-based learner, not with a neural network.

My suggestion: I can add the fitting rows to the page's tax table, plus the wage tax as a tested knob in the commuting setting, at the same 100% bar. Or I can build the general model with a market-based learner as its second reading, which would be a separate page. Which do you want?

Sources:
- [Bull (2014), A Brief History of Learning Classifier Systems: From CS-1 to XCS](https://arxiv.org/pdf/1401.3607)
- [Kwee, Hutter & Schmidhuber (2001), Market-Based Reinforcement Learning in Partially Observable Worlds](https://arxiv.org/pdf/cs/0105025)

## 14. One parametrized model of learners

*2026-10-01 17:21 UTC*

**User:**

> Hmm... is there a general model that can be paired down / specialized to recover various kinds of learners? Can we make a general parametrizable model of learners that goes from full market-based to like simple linear matrices + backprop? What are the various dimensions of variability here? Investigate comprehensively

**Assistant:**

I've built and tested the engine, but the write-up isn't finished: its reference list waits on the literature check, which is still running. I'll finish it when that reports.

So far, in `experiments/learners/`, 14 tests pass:

- **Network end:**
  - Backprop's credit signals are exact prices: what one more unit of a layer's output is worth.
  - For linear or ReLU units without biases, every unit breaks even and value is conserved from output to input.
  - Feedback alignment, predictive coding and node perturbation each reproduce as a different way of forming those prices.
- **Market end:**
  - A Vickrey auction market with cloned agents is Q-learning.
  - A first-price market is SARSA.
  - Without clones, credit leaks to a fixed point I predicted in advance.
  - Holland's bucket brigade is TD(0), and its tax is exactly a discount factor.

One honest negative: my minimal Hayek-style population of agents that are born and die finds the optimal policy at only 3 to 5 of 6 states.

**Assistant:**

The literature check is back: of 34 items, 22 are verified, 11 partly verified, and 1 not confirmed. Some of my draft's claims need changing:

- **Holland's own existence and bid taxes couldn't be confirmed from a primary source.** I'll cite the taxes that are documented instead: Wilson's ZCS tax on rules that match but don't act, and the Hayek computation tax.
- **Sutton (1988) adds a caveat to "bucket brigade = TD(0)".** Holland's version pays the rules that triggered the winner, not just the previous one in time. My identity covers the case where one rule acts per step.
- **The "two principles" are Baum's, not Hayek's.** Baum also writes that single-state agents make Hayek "basically reduce to Q-learning", which matches my tabular result.
- **"Euler's theorem" is the later form.** Product exhaustion is Wicksteed's 1894 claim; he didn't use Euler.

Reading the current draft to make these edits and add the references:

**Assistant:**

Yes, mostly. The unifying idea is to treat credit as a price: what one more unit of an intermediate good is worth to whatever comes after it. With that, one parametrized model reproduces learners from Baum's Hayek market down to backprop, and 14 tests check each claimed equivalence. Everything is in `experiments/learners/`, with a write-up in `README.md` and 38 references checked against the sources themselves.

**The model.** A learner is a chain of stages: layers in a network, time steps in control. Units at each stage turn an incoming good (activations, or the world's state) into an outgoing one. Each named learner is this model with some choices fixed.

**The dimensions:**
1. **Who produces:** every unit, a weighted coalition (softmax), or one winner (an auction). Temperature slides continuously between the last two; this is the logit choice from the one-model page.
2. **Rivalry:** an activation is non-rival (every next-layer unit reads it), so its value is the sum of its users' marginal values. That is exactly backprop's backward step. Control of the world is rival, so it goes to one buyer by auction.
3. **White box or black box:** exact per-coordinate prices need differentiable, known stages. Through an environment, prices can only be scalars: forecasts, payments or broadcasts. Needing the next layer's weights to compute a price (the "weight transport" problem) is Hayek's knowledge problem.
4. **How prices are formed:**
   - an exact backward sweep (backprop);
   - local relaxation (predictive coding, equilibrium propagation);
   - a fixed wrong map (feedback alignment);
   - a learned forecast (TD, synthetic gradients);
   - an auction payment (bucket brigade, Vickrey societies, Hayek);
   - one broadcast scalar (REINFORCE, node perturbation);
   - none (Hebbian learning).
5. **Price granularity:** per coordinate, per agent, or one number for everything.
6. **Accounting:** prices as signals nobody pays (backprop), or real money that is conserved and taxed (markets).
7. **Response:** a gradient, revising a bid, Hebbian moves, or selection.
8. **Population:** fixed, or agents born rich and dying broke.
9. **Horizon:** one step, bootstrapped one step ahead, or a full unroll.
10. **Incentives:** one shared objective, or private profit made to line up with it.

**The path from Hayek to backprop.** Each step changes a few settings and is tested:

| Setting | Equals | How checked |
|---|---|---|
| Market with fixed agents that learn their valuations; Vickrey prices, two clones per action | Q-learning | Reaches the optimal values exactly, at any exploration rate |
| Same market, first-price auction | SARSA | Matches SARSA's fixed point |
| Vickrey without clones | — | Values settle about 3 points (out of ~8) low, at a fixed point I predicted in advance |
| Holland's bucket brigade with bids proportional to wealth | TD(0) | Exact identity; the tax on strength is exactly a discount factor |
| A broadcast return | REINFORCE | Its average update equals the exact gradient |
| Stages made white-box; prices from a fixed wrong map | Feedback alignment | Learns; agreement with backprop rises from 0.28 to 0.79 |
| Prices from local relaxation | Predictive coding | Equals backprop's prices to first order |
| Prices from an exact sweep | Backprop | Exact against finite differences |

At the far end, for linear or ReLU units without biases, backprop's prices also balance as real money: every unit breaks even, and value is conserved from output to input. That is Wicksteed's product exhaustion, and biases are where rents appear. So linear layers plus backprop is still a market, just a planned one: Lange's computer instead of Hayek's trading.

**Measured on shared tasks:**
- **Supervised:** backprop and predictive coding reach the same loss, then direct feedback alignment, feedback alignment, and last node perturbation.
- **Control:** exact gradients through a known model and the cloned Vickrey market both find the optimum; REINFORCE and the first-price market get close.
- **Unsupervised competition:** without a price for winning too often, units that start far from the data never win and stay dead; with one, every cluster gets a unit.

**What didn't work, and corrections:**
- **My Hayek population is weak.** Agents that are born and die find the optimal policy at only 3 to 5 of 6 states, because their bids rise only through mutation. That's a limit of my minimal version, not a verdict on Baum's.
- **Holland's own taxes couldn't be verified.** No accessible primary source shows them, so the write-up cites the taxes documented in later systems (ZCS and Hayek4).
- **Sutton's link between the bucket brigade and TD(0) has a caveat.** My identity covers the case with one acting rule per step.

**Limits:**
- It's two engines sharing concepts (one for networks, one for control), not one code path.
- All tasks are small, so the tests establish identities and fixed points, not performance at scale.

**This closes your tax question.** In market learners, income and wealth taxes act on real budgets, and one of them is exactly a discount factor.

Nothing is committed. Next, I could merge the two engines into a single code path, or build an interactive page like the one-model page where you turn these dimensions as knobs.

## 15. Overview and conceptual gaps

*2026-10-01 21:34 UTC*

**User:**

> Give me an overview of the research so far and how far along it is as well as any potential conceptual gaps you can identify

**Assistant:**

The research has two finished layers and one early one:

- **Done:** land markets and competitive neural layers are the same model, made formally exact for allocation.
- **First pass:** the generalization to how learners assign credit.

The biggest gaps sit at the joint between those two, plus a few things the learner framework doesn't address at all. Nothing is committed yet; all of `experiments/` is untracked.

### The arc

1. **Play-dough City** scored a video's claims about height limits and sprawl against a standard urban-economics model.
2. **Neural City** showed that a competitive network with adaptation reproduces that city's equilibrium to within about 1–4%.
3. **One model, two readings** made the match formal: one model drawn as a land economy and as a neural network, with taxes added at your request.
4. **Learners as economies:** your question about which taxes fit led to a framework where credit assignment is pricing, running from market-based learners to backprop.

### Where each stands

| Project | What it establishes | Maturity | Tests |
|---|---|---|---|
| `playdough-city` | The video's sprawl claims, checked against a standard city model | Complete interactive page | Its own suite; not re-run today |
| `neural-city` | A competitive network matches the city's equilibrium (1–4%) | Scripts; superseded by `one-model` | Run as scripts |
| `one-model` | 9 settings with exact city ⇄ network pairings; two solvers; a formal model; 86 verified references; taxes | Mature prototype | 28/28 pass |
| `learners` | Learners as staged economies: 10 dimensions, 14 tested equivalences, 38 verified references | Early: a framework, a write-up, no interactive page | 14/14 pass |

The results I'd call solid:
- **Allocation:** logit choice is softmax.
- **Prices:** rent ⇄ adaptation and fees ⇄ the load-balancing bias are each other's counterparts. Both are Lagrange multipliers of one free energy.
- **Externality:** the equilibrium counts only half the nuisance, which is why a Pigouvian charge helps.
- **Expert overflow** is Erlang loss.
- **Backprop's gradients are prices.** For linear or ReLU units without biases, they balance exactly as money.
- **Market learners:** the cloned Vickrey market is Q-learning, and the bucket brigade is TD(0), with its tax as the discount.

Each simulation also caught at least one artifact in my own solvers, which I fixed.

### Conceptual gaps

**1. Two kinds of price that are never unified.** This is the biggest seam.
- The one-model page's prices *ration capacity* during the forward pass: rent, adaptation, balancing biases.
- The learners' prices *carry credit* backward: what an output is worth to the objective.
- In a real economy one price does both, and so does a bid in the market-for-control learners. Engineered networks split them into a router's bias and a gradient.

Nothing yet says when they can coincide and when they must be separate.

**2. Activations are public goods, which may explain why dense networks need a planner.** I verified exactly that an activation's backprop price is Samuelson's public-good sum. In the same paper, Samuelson argued that no decentralized price system can find such values, because each user gains by understating its share. That would explain why markets work for rival goods like control but have never matched backprop on dense representations. It's a hypothesis I haven't tested. The test would be a market version of a dense layer whose units report their values strategically.

**3. No market learner here learns a representation.** In the market engine, each agent's technology is a fixed action; only bids adapt. So the path from Hayek to backprop changes two things at once: how credit is priced, and whether units learn continuous features. The bridge would be Schmidhuber's neural bucket brigade, a market for credit inside a network, which I haven't implemented. Until it is, "one spectrum" rests on two separate engines that agree at their endpoints.

**4. Strategic behaviour is assumed away.** Every market agent bids its learned valuation honestly. Bid shading, collusion and bubbles (the reasons Chang et al. need Vickrey prices and clones) are cited, not simulated.

**5. Everything is a potential game.** Both projects assume a single function that every choice lowers. Many learners lack one: GANs, multi-agent RL with competing goals, and general exchange economies can cycle instead of settling. The framework has no dimension for "is there a shared potential?"

**6. Prices on data are missing.** The taxonomy prices internal goods, but many learners price their examples instead:
- boosting reweights examples by multiplicative weights;
- distributionally robust optimization uses adversarial example weights;
- support vector machines' dual multipliers price the margin constraints;
- curriculum learning and importance sampling decide which examples count, and how much.

That's a missing dimension.

**7. Nothing about generalization.** The framework explains credit and allocation, not why a learned function works on new inputs, which is arguably the main thing learners do. The economic side has a candidate, forecasting future demand versus fitting past demand, but I haven't developed it.

**8. Fixed points, not speeds.** The tests check identities and resting points. Why a broadcast scalar learns slowly, and what price discovery costs in variance and time, rest on small comparisons on toy tasks; nothing has been measured at scale.

**9. Smaller gaps:**
- The link between depth and time (the bucket brigade as backprop through time) is argued but not demonstrated.
- The one-model page's network is a competitive layer at inference, not a trained network. So its claim that "trained networks internalize externalities" is argued from the math but never simulated. The learners engine could now test it.
- The Hayek population is weak: 3 to 5 of 6 states correct.
- Nothing is calibrated to real data. The repo has real parcels, so the city side could be checked against actual bid-rent gradients and building heights, which your standing preference for calibrated models would ask for.

### How far along overall

The city ⇄ network correspondence for allocation is essentially finished and rigorous. The learner generalization has a sound taxonomy and its identities are tested. But its central claim, one continuous spectrum from markets to backprop, is supported only at the endpoints and some points between, with representation learning on the backprop side only.

The highest-value next steps, in order:
1. Implement a market version of a dense layer. It tests gaps 2 and 3 at once.
2. Simulate strategic bidding (gap 4).
3. Add prices on data and non-potential dynamics to the taxonomy (gaps 5 and 6).

Separately, the one-model page is ready to commit, or to move into the app, whenever you want.
