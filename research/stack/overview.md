# The Decentralization Stack

> 🚧 **Draft — restructure in progress.** This problem-map reorganization supersedes the earlier prediction-market-first draft. Part A (core ideas) is a sketch; the in-depth Part B chapters are not yet written.

*This section is the conceptual core of Dither: the full set of problems that stand between us and a [decentralized, privacy-respecting Internet](../dither.md), a short core idea for each, and — in depth — how the solutions lean on one another.*

## The goal

Dither's end-goal is to **replace the centralized Internet** with decentralized alternatives unified by one modular protocol, under four [design tenets](../dither.md#core-design-tenets): it should be **useful**, **modular & modelable**, **interoperable**, and ultimately **self-reliant**. This section is about the hard part of "modelable": showing that the pieces form *one coherent system* rather than a pile of unrelated mechanisms.

## There is no single root

It is tempting to pick one idea — a currency, or a prediction market — and call it the seed everything grows from. That framing is wrong and it misleads. The stack is **a set of interdependent problems**; the closest thing to a root is *boundary integrity* (knowing who is a distinct participant), and the closest thing to a recurring *principle* is *prediction* (agents persist by predicting their environment). But neither is "the thing the rest is built on." The honest picture is a **dependency graph**, shown below.

## The problem map

Eight problems, each stated in one line. ([Part A](core/identity.md) gives a short core idea for each; Part B develops them in depth.)

| # | Problem | In one line |
|---|---|---|
| 1 | **Boundary & Identity** | Tell distinct participants apart (Sybil resistance) with no central registry and without breaking anonymity. *The problem under all the others.* |
| 2 | **Ordering & Timestamps** | Agree "this happened before that" — and that a record wasn't backdated — without a global clock or blockchain. |
| 3 | **A Verifiable Substrate** | Express computation as portable, content-addressed data whose results anyone can independently check (disp). |
| 4 | **Anonymous Routing & Retrieval** | Move data between nodes and *find* who holds a value, without revealing who wants what. |
| 5 | **One Resource Market** | Buy and sell storage, bandwidth, and compute as a single priced flow, not three markets. |
| 6 | **Non-Concentrating Money** | A medium of exchange that resists the wealth concentration which wrecks aggregation. |
| 7 | **Aggregating Truth** | Combine dispersed expert knowledge into a shared world-model with no corruptible oracle. |
| 8 | **Deciding Together** | Combine people's preferences with that world-model into collective decisions that resist capture. |

Plus the **composition** question — how these eight become *one living system* — and the cross-cutting concerns that ride on top of it: bootstrapping new users, exit/competition between networks, and the threat model.

## How they depend on each other

```
                 ┌──────────────────────────┐
   ROOT          │  1 · Boundary & Identity  │  every weighted/counted thing needs it
                 └────────────┬─────────────┘
                              │ distinct participants
        ┌──────────────┬──────┴──────┬──────────────────┐
        ▼              ▼             ▼                   ▼
  2 · Ordering &  3 · Verifiable  4 · Anonymous     6 · Non-Concentr.
     Timestamps      Substrate      Routing            Money
        │              │             │                   │
        │              └──────┬──────┘                   │ prices / denominates
        │                     ▼                          │
        │            5 · One Resource Market ◄───────────┘
        │                     │
        └─────────┬───────────┘
                  ▼
          7 · Aggregating Truth  ◄────►  6 · Money
                  │              (δ-dial ⇄ dispersion: co-designed cycle)
                  ▼
          8 · Deciding Together
                  │
                  ▼
   Composition — one living system  (+ bootstrapping · exit · threat model)
```

Read it top-down: identity is the root; timestamps, the substrate, routing, and money are near-primitives; the resource market is the first place they combine; the truth machine sits on top of money and timestamps; governance sits on the truth machine. The one genuine **cycle** — money ⇄ truth machine — is why those two must be *co-designed*, not stacked.

## How to read this section

- **[Part A · Core Ideas](core/identity.md)** — eight short chapters, one seed solution per problem. Read these and you'll hold the whole shape in your head, including where each idea is still thin.
- **Part B · In Depth** *(drafting)* — the same eight, developed in dependency order at engineering depth, **each ending with a "where it could break in implementation" section.** This is also the stack-wide threat model the [roadmap](roadmap.md) flags as missing.
- **Reference** — the formal [Mathematical Core](mathematical-core.md), the [Futarchy & Causality](futarchy-causality.md) deep dive, a [glossary](glossary.md), the engineering [roadmap](roadmap.md), and [open questions](open-questions.md).

> **Conventions.** Honest caveats are marked `⚠️` inline, next to the claim they qualify. Knowing exactly where this design might break is a feature, not an embarrassment — it's what Part B is *for*.
