# Neural city

A test of whether a competitive neural network is a land market in the exact sense, not just by
analogy. Companion to `../playdough-city/`.

The network: neurons on a sheet compete for input events that arrive at the centre. Each event goes
to the neuron with the lowest cost. That cost is conduction distance plus the neuron's
adaptation level. Adaptation rises with every spike the neuron fires and decays over time.

| City | Network |
|---|---|
| Parcel of land | Neuron (fixed number, fixed position) |
| Distance to downtown | Conduction distance from where inputs arrive |
| Household | Input event, handled by one neuron |
| Floor space | Firing rate |
| Rent | Adaptation level: exponential decay gives a rising cost of height, integral control gives a hard cap |
| Height limit | Maximum firing rate |
| Edge of the city | Neurons that stay silent |
| Leaving the city | Inputs the network ignores |
| Building type | The neuron's tuning, learned by a Hebbian rule |

```bash
TAU=0.1 node experiments/neural-city/rents-and-lids.mjs                  # ≈45 s
node experiments/neural-city/land-use-sorting.mjs                        # ≈20 s; M=0.75 or M=6 varies retuning cost
SWEEP=1,2,5,20 node experiments/neural-city/sharing-and-zoning.mjs       # ≈2 min
M=1 P=0.25 node experiments/neural-city/hotels-and-homes.mjs             # ≈1 min per (M, P)
```

`rents-and-lids.mjs` compares the simulated network with the city equilibrium it should equal. At
τ = 0.1 (choice noise), the number of neurons in use, mean distance and share of inputs handled
match theory within ≈1–4% under every rule:

- no rules
- a rate cap
- a cap with an exempt centre
- a cap where some inputs can leave
- a cap where inputs can leave freely

Adaptation levels follow the bid-rent line μ − t·d to within ≈1.4τ.

`land-use-sorting.mjs` adds two input types with different costs of delay. The urgent type takes the
inner ring and the routine type the outer ring, as Alonso predicts for two household types. The
learned layout matches the frictionless equilibrium when retuning a neuron is cheap. When retuning is
expensive, the first layout that forms gets locked in.

`sharing-and-zoning.mjs` puts two uses on the same neurons. Each use pays a nuisance cost for
the other's recent activity at a neuron (industry next to homes). This is the land version of
superposition: features that are active together get separate directions, while mutually exclusive
features can share one.

- **Uses active at the same time:** the network separates incompatible uses without any rule. Only
  about 3% of neurons serve both, and the footprint doesn't grow. Single-use zoning adds nothing.
- **Uses that alternate (day and night):** whether timesharing wins depends on phase length compared
  with the time activity takes to clear (τa):

  | Phase length ÷ τa | Neurons in use (mixed / single-use) | Cost per event (mixed / single-use) |
  |---|---|---|
  | 1 | 347 / 324 | 9.99 / 8.86 |
  | 2 | 401 / 357 | 10.41 / 9.30 |
  | 5 | 358 / 401 | 9.62 / 10.25 |
  | 20 | 277 / 405 | 9.08 / 10.98 |

  With slow alternation, sharing wins. With fast alternation the uses are effectively active at the
  same time, yet the network keeps mixing and pays the nuisance. Each event counts the nuisance it
  suffers but not the nuisance it leaves behind. Zoning does better in that regime.

  **Later disputed.** The one-model page re-ran this with individual agents and found fast
  alternation roughly a tie between mixing and zoning; its own zoning advantage turned out to come
  from how its average-flow solver lets prices recover (see `../one-model/README.md`). Why this
  script still shows zoning ahead (9.99 vs 8.86 at phase 1× τa) hasn't been traced; it is listed in
  `../../NEXT_STEPS.md`.

`hotels-and-homes.mjs` asks when the network should give a part its own customized space. Eight
occupant types come and go, and each is present a fraction p of the time. A neuron tuned to a type
serves it with no mismatch and serves everyone else at mismatch cost m. Three regimes:

- **Homes:** each neuron is customized to one type and reserved for it.
- **Hotels:** tuning stays generic, and anyone may use any neuron.
- **Learned:** anyone may use any neuron, and its tuning follows whoever uses it.

Cost per event for each regime:

| m | p | homes | hotels | learned | learned customization |
|---|---|---|---|---|---|
| 1 | 0.1 | 14.49 | 11.38 | **10.62** | 0.52 |
| 1 | 0.25 | 12.28 | 10.70 | **9.76** | 0.77 |
| 1 | 0.5 | 10.45 | 10.17 | **9.14** | 0.85 |
| 1 | 0.9 | **8.97** | 9.81 | 9.02 | 0.89 |
| 3 | 0.1 | 14.77 | 12.49 | **11.39** | 0.85 |
| 3 | 0.25 | 12.69 | 11.45 | **9.81** | 0.89 |
| 3 | 0.5 | 10.58 | 11.74 | **9.58** | 0.97 |
| 3 | 0.9 | **9.00** | 11.56 | 9.17 | 0.97 |

- **Homes vs hotels:** reserved, customized space beats shared generic space only when occupants are
  present most of the time, or when customization is worth a lot. That is Toy Models of
  Superposition's phase diagram (frequent, important features get dedicated dimensions) posed as a
  housing question.
- **Homes for intermittent occupants:** reserved space sits empty most of the time, like second
  homes, and the footprint balloons to 758–796 neurons.
- **Learned:** customization that follows use (control goes to whoever keeps using the space, which
  is usufruct) beats both fixed regimes unless occupants are nearly always present. How far it
  customizes rises with presence and with the value of customization.
