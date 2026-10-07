# Learner theory

Research into whether land markets, neural networks and learning algorithms are one kind of system. Two
results so far:

- **Allocation:** a land market and a competitive layer of neurons are exactly the same model. Rent is a
  neuron's adaptation, a height limit is a firing-rate cap, and firms with fees are a mixture of experts with
  load balancing. All their prices are Lagrange multipliers of one free energy. The centre need not be given:
  when each arrival gains from being near the others it deals with, a downtown ⇄ a bump of activity forms by
  itself, firms and homes sort into one centre, a mixed sheet or several towns, and a chain of kinds lays
  itself out from a harbour ⇄ a sensory input in order, with the shortest wiring. Geography is a layer over
  the sites, and technology ⇄ myelin a layer the arrivals make that changes what they want: a city founded
  for its coast stays after the coast stops mattering only if what it built is worth living on.
- **Credit:** learners from a market of bidding agents down to backprop fit one parametrized model in which
  credit is a price. An auction market for control is Q-learning or SARSA depending on its price rule;
  Holland's bucket brigade is TD(0), with its tax acting as the discount; backprop's signals are shadow
  prices that, in bias-free ReLU networks, balance exactly as money.

Both are one textbook idea, prices as Lagrange multipliers ([doc 7](docs/7-the-common-core.md)), and the
later experiments mark where it stops: a market of units learns dense features only with prices that are per
example, signed and honestly reported; one auction price per expert rations capacity better than a balancing
bias but assigns credit worse; and three uses that each mind the next never settle.

It started from a video about height limits and urban sprawl, and grew one question at a time.
[`TRANSCRIPT.md`](TRANSCRIPT.md) tells that story.

## Reading order

0. [A visual walkthrough](WALKTHROUGH.md): what each model looks like, with screenshots of the pages and
   figures drawn from the engines. The quickest way in.
1. [Do height limits cause sprawl?](docs/1-height-limits-and-sprawl.md): the city model the rest builds on.
2. [What plays the role of land in a learning system?](docs/2-what-plays-land-in-a-network.md): the search
   for land inside a network, plus sharing (superposition as mixed use) and individuation (hotels vs homes).
3. [One model, two readings](docs/3-one-model-two-readings.md): the shared model, its nine settings, and
   why each pairing is exact.
4. [Taxes](docs/4-taxes.md): which taxes have network counterparts, and why income and wealth taxes need
   agents with budgets.
5. [Learners as economies](docs/5-learners-as-economies.md): credit as a price, ten dimensions, and the path
   from a Hayek economy to backprop.
6. [Derivations](docs/6-derivations.md): short proofs of every identity the docs use.
7. [The common core](docs/7-the-common-core.md): every price above is a Lagrange multiplier; the prior work
   from networking, which results are textbook and which are new, and where the idea stops.
8. [`NEXT_STEPS.md`](NEXT_STEPS.md): open gaps, and the experiment that would close each.

[`docs/references.md`](docs/references.md) points to all the sources.

## Status

| Experiment | What it is | Maturity | Tests |
|---|---|---|---|
| [`playdough-city`](experiments/playdough-city/) | Interactive 3D page scoring the video's claims with a standard urban-economics model | Complete | 24 pass |
| [`neural-city`](experiments/neural-city/) | Scripts showing a competitive network reproduces the city's equilibrium within 1–4% | Superseded by `one-model`; one result disputed (see NEXT_STEPS) | Scripts print their checks |
| [`one-model`](experiments/one-model/) | One model drawn as an economy and as a neural network, thirteen settings, two solvers, a formal section, taxes, agglomeration, geography and technology, 115 checked references | Mature prototype | 37 pass |
| [`learners`](experiments/learners/) | Engine for learners as staged production economies, tested identities, a comparison of all settings, a market for a dense layer, one price for a mixture of experts | First pass: separate engines, no interactive page | 21 pass |

## Running it

Everything is plain JavaScript with no dependencies. Run commands from this folder (`learner-theory/`), with
Node 20 or later.

```bash
# play-dough city: the page loads three.js from a CDN, so it needs a network connection
node experiments/playdough-city/serve.mjs                 # then open http://localhost:5180/
node --test experiments/playdough-city/model.test.mjs     # 24 tests, about 1 s

# one model, two readings: open the file directly in a browser, no server needed
xdg-open experiments/one-model/index.html                 # or open it from a file manager
node --test experiments/one-model/model.test.mjs          # 37 tests, about 7 min

# learners
node --test experiments/learners/learners.test.mjs        # 21 tests, about 6 s
node experiments/learners/ladder.mjs                      # every setting on shared tasks, about 55 s

# neural city: each script prints its own comparison with theory
TAU=0.1 node experiments/neural-city/rents-and-lids.mjs   # about 45 s
```

Each experiment's README has its full details and run options.

## Folder map

| Path | Contents |
|---|---|
| `TRANSCRIPT.md` | The research log: each phase's prompt, what was built, what came out, and every correction |
| `transcript/conversation.md` | The prompts and the assistant's answers, word for word |
| `NEXT_STEPS.md` | Open gaps and how to close them |
| `WALKTHROUGH.md`, `walkthrough/` | The visual walkthrough, its images, and the scripts that make them |
| `docs/` | Standalone explanations, readable without the code |
| `experiments/` | The four experiments, each with its own README |

## How this was made

The research was done in a chat with Claude (an AI model) between 24 September and 1 October 2026, inside
a checkout of CivicMapper (a land-value mapping app by the Center for Land Economics), and moved here
afterwards; later sessions in this repository added the follow-up experiments, the walkthrough and the
agglomeration settings (2–7 October). Every claim on the pages has a test, and every reference was checked against its source, but
the work hasn't been reviewed by a human expert in either field.
