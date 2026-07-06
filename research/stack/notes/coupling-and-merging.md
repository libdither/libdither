# Working Note · Coupling and Merging

> 🧪🤖 **Working note** (AI-drafted — [provenance](../ai-disclosure.md)). Source material for the rewritten [Coupling](../02-coupling.md), [Money](../04-money.md), and [Governance](../06-governance.md) chapters.

## The move

Two agents **couple** when the predicted surplus of coupling exceeds its cost, through instruments that are explicit, priced, and reversible. The instruments, and what each one is the seed of:

| Instrument | What it is at n=2 | What it grows into |
|---|---|---|
| capability advertisement | "here is what I can predict/serve" | routing, the market |
| attestation | signed receipt of the other's message | witnessing, timestamps, ordering |
| credit line | a bilateral IOU ledger | money (mutual credit); the barter ratio is the first exchange rate |
| fate-sharing | holding claims on each other | pool equity, zones, merged networks |

Nothing forces cooperation. The protocol's job is to make coupling *cheap to enter, visible in the ledgers, and cheap to exit*, so it happens exactly where surplus exists — the anti-Moloch stance is "easy and explicit," never "mandatory."

## The growth story (1 → 2 → 4 → 8)

Every institution has a birthday in this sequence:

- **n=1.** A node alone: its storage is its model plus residuals, its truth is its posterior, its money is meaningless.
- **n=2.** Coupling for redundancy, specialization, latency. Attestations begin ordering; the credit line begins money; comparing notes begins truth. Governance is unanimity.
- **n=4.** Transitive vouching (the first independence inference); credit lines net multilaterally (the clearing layer is born); a 2-of-3 witness quorum becomes possible; the two pair-ledgers get an exchange rate.
- **n=8+.** The first stranger arrives and Sybil pressure begins; a hub emerges because it is central; the coalition notices hoarding and reaches for demurrage; unanimity stops scaling and voting appears.

**Merging two established networks is the n=2 story again with bigger participants.** Nothing new happens; the messages are larger.

## Coupling surplus, formally (sketch)

Couple/merge when `G(A,B) − C(A,B) > 0`, where

- `G` = exploitable shared structure: common demand (shared caching), complementary specialization (gains from trade), risk pooling (variance reduction), netting (liquidity savings). In free-energy terms `F_{A⊕B} = F_A + F_B − G`.
- `C` = coordination cost: consensus latency across the joint boundary, policy compromise, capture exposure.

`κ(A,B)` is the accumulated, observed `G − C`. Diminishing `G` with distance/heterogeneity plus growing `C` with size gives an optimal coalition size — Mundell's optimal currency areas and the Coasean firm boundary as two instances of one inequality. Self-similar: the same formula at node, cluster, and network scale.

## Money is the merge protocol

Under pool-equity money, every trade leaves you holding shares of counterparties' pools. Cross-holdings make `∂(my welfare)/∂(your survival) > 0` — fitness alignment in the multi-level-selection sense, implemented by the cap table. So networks do not *decide* to merge: **they trade, and trade is merging in slow motion.** As cross-holdings deepen, κ rises, shared quorums and a shared demurrage floor start paying for themselves, and the exchange rate drifts toward 1. The merge is the limit of entanglement; de-merging is symmetric (sell down, exit). This answers "why would nodes merge" with an accounting identity instead of an argument.

## Identity is subjective, local, and stake-scaled

There is no global registry and no global correlation matrix — another instance of "no global anything." Each node (and, in practice, each zone for its own drip) maintains a *local posterior* over each counterparty, fed by evidence streams:

1. **locality** — latency triangulation, physical presence: attackers fake nodes, not nodes *everywhere*;
2. **trusted authorizers** — the desk returns, demoted from root to evidence: an attestor whose track record is itself auditable;
3. **stake-backed vouching** — vouchers lose stake if the vouchee proves to be a puppet;
4. **behavioral residuals** — the paid-work streams;
5. **continuity** — hash-entangled history; aging an identity is costly;
6. **hardware commitment** — a disk commits once.

Required confidence scales with value at risk: a small trade needs a weak posterior, a large vote a strong one. For distant agents you never compute fine-grained `n_eff` at all — **confidence composes along trust paths with attenuation, exactly like exchange rates**. Identity confidence, trust, and χ are one family: fields over the body map that compose along routes. This dissolves the identity trilemma (strong/cheap/private) — it constrained a single global credential that no longer exists.

## Delegation, resolved by the same accounting

Under quadratic voting, `k` independent aligned voters with budget `c` each cast `k√c` votes; a bloc pooling `kc` into one delegate casts `√(kc)` — the two endpoints of the independence spectrum. One formula interpolates:

```
votes(bloc)  =  √( n_eff(bloc) · pooled credits )
```

ρ=1 gives `√(kc)` (one mind, pooled purse); ρ=0 gives `k√c` (k minds). Delegation is *voluntary correlation, priced by the machinery that already prices involuntary correlation* — no new mechanism. And the position on the spectrum is measurable: delegators who sometimes override or split demonstrate independent preference-formation and earn toward `k√c`; blind followers converge to `√(kc)`.

Two distinct axes fall out, answering "real but not trusted": **distinctness** (how many sources — Σ's shared-noise component) vs. **trust/alignment** (do I want shared fate — κ, built from history). Co-governance requires both; neither implies the other.

## Open

- Separating the Σ components (shared source vs. shared fate vs. honestly-shared truth) at finite monitoring richness — the load-bearing estimation problem of the whole design.
- Clearing-layer mechanics: who runs a clearing node, its incentives and attack surface, quote manipulation at thin boundaries.
- Preference-independence measurement for delegation without incentivizing performative disagreement.
