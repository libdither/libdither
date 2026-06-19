# Open Questions — Research Scratchpad

*Raw questions that seeded the analytical notes. Each is tagged with its current status; several were taken up and answered (or reduced to measurable quantities) in [living-system.md](living-system.md) and [mathematical-core.md](mathematical-core.md). Kept here as a provenance trail and a list of what genuinely remains.*

---

1. **Unification vs. anonymization.** How does the unification of storage/compute/routing square with the anonymization of routing? What is a node in this context? Is there a connection to cryptography here?
   → **Partially addressed.** "What is a node" is answered: a node is a Markov blanket / agent solving one control problem ([living-system.md](living-system.md) §2, [mathematical-core.md](mathematical-core.md) §0), and the unification is formalized as min-cost flow over the three `MATERIALIZE` edges ([mathematical-core.md](mathematical-core.md) §1). **Still open:** the tension between that unification and *anonymous* routing — anonymization deliberately hides the spacetime path that the min-cost-flow optimizer wants to expose — and whether there is a clean cryptographic framing of it.

2. **Connections to compiler theory.** Is there a relation between the unification and optimizing compilers / superoptimization? What is the existing mathematical research (topological / categorical connections)? Can we flesh this out mathematically, perhaps in disp syntax?
   → **Still open.** Gestured at — tree-calculus reduction steps give a machine-independent work metric and disp is the value algebra ([mathematical-core.md](mathematical-core.md) §1.1, §1.5) — but the superoptimization / categorical connection is not developed.

3. **When are Markov blankets a useful abstraction?** Node-level blankets (inputs/outputs) feel natural, but the others feel more constructed / drawable in many ways. When is the abstraction load-bearing rather than decorative?
   → **Partially addressed.** The honest answer is that the blanket framing is a *design heuristic and organizing language*, not free predictive math ([living-system.md](living-system.md) §8, "FEP is slippery"). [mathematical-core.md](mathematical-core.md) §1.3 de-metaphorizes it by *choosing* the free-energy functional and *deriving* alignment (Prop. 1). The non-arbitrary blankets are exactly the three nesting levels node ⊂ zone ⊂ network (§0); other drawings are not claimed to be load-bearing.

4. **The dark-room problem.** Is there LessWrong / FEP literature on the dark-room issue, with obvious solutions / regularizers? Or does it solve itself by running into the real world?
   → **Resolved (in principle).** The dark room is the FEP failure mode where an agent minimizes surprise by predicting a trivial niche. It is formalized as a bifurcation at deference slope `L = 1` ([mathematical-core.md](mathematical-core.md) §2, Prop. 3 — viability inequality **V1**) and countered by *epistemic-value rewards* and *reality-coupling* ([living-system.md](living-system.md) §3). "Solves itself by hitting reality" is exactly the reality-coupling / between-network-selection answer ([living-system.md](living-system.md) §6).

5. **Is Sybil resistance elegantly solvable?** Is there a theoretically clean solution, or only best-approximation? If approximate, who wins, and are there provable bounds?
   → **Largely resolved / reframed.** Stop asking "is this a person?"; ask how much *independent information* the constituent contributes — `n_eff = 1ᵀΣ⁻¹1` ([mathematical-core.md](mathematical-core.md) §3, viability inequality **V2**). Provable content: the mimicry-cost bound (Prop. 6) — faking `k` agents costs ≈ being `k` agents — but it is asymptotic. **Genuinely-open residue:** the arms-race floor at finite monitoring richness ([mathematical-core.md](mathematical-core.md) §8, Open-1).

6. **A framework for coupling Markov blankets.** Is there a mathematical framework for the general nature of coupling between blankets — correspondences between the modeled ("demiurge") world and real life?
   → **Partially addressed.** Cooperation is formalized as a continuous coupling field over the latency-trust coordinate space ([living-system.md](living-system.md) §6, [mathematical-core.md](mathematical-core.md) §5): edge weight = degree of fate-sharing. A *general* theory of coupled blankets — and the model-vs-reality correspondence the "demiurge" phrasing was reaching for — is not yet developed; it overlaps with the still-open grand-conjecture stability proof ([mathematical-core.md](mathematical-core.md) §7).

---

## From the money-layer redesign (pool-equity currency)

*Raised by the [Value as Flow](value-as-flow.md) rework and its [proposed crux resolution](value-as-flow.md#the-remaining-crux). These are the honest residue **after** that resolution — what it still owes.*

7. **Measuring the cooperation field `κ`.** Zone boundaries and the `δ`-coupling are defined by fate-sharing `κ`, read off the residual-correlation matrix `Σ` — the *same* object the immune system reads as Sybil-correlation, but with opposite sign. Can honest dense cooperation (common-shock exposure, autonomous action) be separated from puppetry (shared private controller state, mimicked independence) at finite monitoring richness?
   → **Open.** The same arms-race floor as the mimicry-cost bound ([mathematical-core.md](mathematical-core.md) §8, Open-1) — but now load-bearing for *where zones are drawn*, not only for voting weight.

8. **Stability of the `δ_min` homeostatic loop.** The global baseline is set by a controller that senses concentration through the truth machine's (lagged) accuracy and adjusts demurrage. Plant lag `~1/δ` plus sensor delay `τ` make a naïve bang-bang / high-gain-integral controller oscillate — monetary boom-bust. A damped PI controller with slew-limited `δ` over a low-pass-filtered signal *should* be stable, but the stable-vs-limit-cycle boundary is unmapped.
   → **Open — first thing to simulate.** Sweep `(k_p, k_i, τ, δ-slew)` in the coupled agent-based model; this is the money-layer slice of the grand-conjecture stability question ([mathematical-core.md](mathematical-core.md) §7). Controller sketch in [Value as Flow](value-as-flow.md#the-remaining-crux).

9. **Bootstrapping the set-point.** Homeostasis (Q8) needs a working truth machine as its sensor — but the truth machine needs dispersed capital (A2), which needs `δ_min`. Chicken-and-egg. Likely answer: start `δ_min` as a conservative constant and hand control to the loop once the truth machine is live and calibrated — but the hand-over criterion is unspecified.
   → **Open.**

10. **Transparency vs. privacy of zone metabolism.** Boundary-reputation enforcement (illiquidity-punishing havens) requires neighbours to *observe* a zone's `δ_z` and concentration. That transparency fights the currency's transaction-privacy goal (the zk / secure-aggregation story). What is the minimal disclosure — perhaps a zero-knowledge proof of "`δ_z ≥ δ_min` **and** my Gini `≤ β`" — that enables enforcement without exposing the cap table?
    → **Open.** Points toward a *proof-of-compliance* primitive rather than raw disclosure.
