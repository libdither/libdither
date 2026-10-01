# Taxes, and what they need from a model

Which taxes have an exact counterpart in a neural network? The bar was strict: only taxes where the
pairing is exact, not merely suggestive, went into the one-model page ([doc 3](3-one-model-two-readings.md)).
This doc covers those, the ones that almost fit, and the ones that need a different kind of model, where
it turns out learning systems with literal taxes do exist.

## The principle

A network collects nothing. So the only part of a tax that can carry over is what it does to choices. A tax
has a network counterpart exactly when it changes some term of an arrival's cost c_j (or of the free energy
F) in a way a network can also change.

## Taxes with exact counterparts

| Tax | In the model | In the network | Why it's exact | What it does |
|---|---|---|---|---|
| On land value | Takes a share of the landowner's residual p·r − (1+θ)·κ·r²/2 | **Nothing.** A network has no landowner | That residual appears in no cost and no term of F | Revenue appears; the city doesn't move at all, in both solvers ([George 1879](https://en.wikipedia.org/wiki/Progress_and_Poverty); [Brueckner 1986](https://doi.org/10.1086/ntj41792157)) |
| On buildings | κ → (1+θ)·κ | **Stronger adaptation per spike** (heavier self-inhibition) | It multiplies the same parameter as the cost of building up | Identical to a higher building cost: shorter buildings, a wider city (213 → 277 parcels at θ = 0.5) |
| Per resident, the same everywhere | +H at every site | **Global inhibition:** the same inhibition on every neuron | A softmax ignores anything added to every option; shared inhibition changes how fast a winner-take-all layer fires, never which neuron wins ([Nessler et al. 2013](https://doi.org/10.1371/journal.pcbi.1003037)) | A closed city doesn't move. In an open city enough people leave that rents fall by about H: landowners end up paying it ([Oates 1969](https://doi.org/10.1086/259584)) |
| Pigouvian, on nuisance | Charges again the nuisance an arrival causes, ν·κ·r_{j,−k} | **Counting the interference a feature causes others**, as training on the total loss does | Suffered plus caused is the slope of the true total cost ([doc 6](6-derivations.md#3-the-nuisance-is-counted-half)) | Nuisance per trip falls about sevenfold (0.033 → 0.005); lowers the true cost when nuisance is weak, only a local optimum when strong ([Pigou 1920](https://en.wikipedia.org/wiki/Arthur_Cecil_Pigou)) |
| Per unit of distance (fuel) | Adds to t | **A steeper wiring cost**, a steeper ALiBi slope | The same parameter | What the commute knob already does |

Two literature limits were respected rather than overclaimed:

- [Brueckner & Kim (2003)](https://doi.org/10.1023/a:1022260512147) find that a building tax causes sprawl
  only when dwelling size is fixed, as it is in this model. Where dwellings can shrink, the effect can
  reverse.
- [Oates & Schwab (1997)](https://doi.org/10.1086/ntj41789240) credit Pittsburgh's 1980s building boom
  mainly to a shortage of commercial space, not to its land tax, so nothing here claims the tax caused it.

One wrinkle: commuting harms no one else in this model, so a fuel tax is a pure distortion here. It becomes
the Pigouvian case only once commuting has an emissions or congestion cost.

**Left out because nothing in the model responds to them:** a vacancy tax (the built stock affects no
choice), a transfer tax (stays don't depend on the cost of moving), a Harberger tax (owners set no prices;
[Weyl & Zhang 2022](https://doi.org/10.1257/pol.20200426)), and a road congestion toll (commutes don't slow
with traffic).

## Taxes that almost fit

These reduce to taxes above, or need one small addition:

| Tax | In this model | Network counterpart |
|---|---|---|
| Sales tax on rent | Tenants pay rent × (1 + rate): the same allocation as the building tax, but it also takes part of what landowners keep | Stronger adaptation |
| Sales tax per purchase, the same at every site | Identical to the tax per resident | Global inhibition |
| Income tax when everyone earns the same fixed income | A lump sum, so identical to the tax per resident | Global inhibition |
| Tax on pure profit | Neutral, like the land tax | Nothing |
| Wage tax, in the commuting ⇄ attention setting | Shrinks the pay gap between employers while commuting and staying home stay untaxed, so more people stay home. Needs a base-wage parameter | Content scores shrink relative to the distance penalty, and more attention goes to the sink. Exact, but "wage ⇄ content score" has no standard name |

## Taxes that need a different model

Each of these acts on something this model doesn't have:

- **Capital gains, wealth and estate taxes** need assets held over time, changing prices, and decisions to
  sell. Nothing here is owned or sold.
- **Income tax's effect on hours, and progressive rates,** need a choice of hours and unequal incomes.
- **Corporate tax on the normal return to capital** needs capital and investment.
- **A broad sales tax or VAT** needs more than one good.
- **Tariffs** need trade between regions.

A richer economy (budgets, a second good, flexible home sizes, hours, durable owned buildings, savings, a
government budget) is a quantitative spatial model like
[Ahlfeldt, Redding, Sturm & Wolf (2015)](https://doi.org/10.3982/ECTA10876). But that still wouldn't give
these taxes a network counterpart. **Income, wealth and gains taxes tax an agent's budget, and spikes have
no budget.** Nothing carries over from one spike's choice to the next.

## Where taxes are literal: learning systems with money

Some learning systems do have budgets: economies of agents rather than layers of neurons.

- **Classifier systems.** Rules hold "strength" (wealth) and bid for the right to act. Wilson's ZCS weakens
  "matching classifiers which advocate actions other than the selected action"
  ([Wilson 1994](https://doi.org/10.1162/evco.1994.2.1.1)): a tax on idle capacity.
- **Baum's Hayek machine.** Agents hold wealth and bid at auction to control the task, paying the previous
  owner. They pay "a small amount of tax proportional to the amount of computation time they have used"
  ([Kwee, Hutter & Schmidhuber 2001](https://arxiv.org/abs/cs/0105025)), and agents that go broke are
  removed.

In these systems one tax has an exact meaning. In Holland's bucket brigade with bids proportional to
wealth, a tax on each acting rule's strength is exactly a **discount factor**: the brigade is TD(0) with
step size bid + tax and discount bid ÷ (bid + tax) (tested; derivation in
[doc 6](6-derivations.md#9-the-bucket-brigade-is-td0)). A tax on wealth makes the economy value the future
less, the way γ < 1 does in reinforcement learning.

This is what led to [doc 5](5-learners-as-economies.md): if taxes need budgets, the right second reading
of a general economy isn't a layer of neurons but a learner made of agents with money, and that raises the
question of how such learners relate to backprop.
