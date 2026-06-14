# Worked Example — Impact Markets for Science

> *Part I · The Engine — Chapter 3*

The mechanism is abstract; let's run one question all the way through it. The setting is the one the idea was born in: **deciding which scientific work matters**, so funding can follow.

## The setting

A top-tier venue does two separable things:

- **Dissemination** — spreading the work. Increasingly served by other channels.
- **Credentialing** — the prestige of acceptance, which is the real prize. Prestige is society's signal for *"high odds of future impact,"* used to route funding and resources.

But prestige is a *retroactive, lossy proxy*: things become prestigious because they turn out useful. So why not estimate the underlying quantity — **future impact** — directly, with the engine from the [previous chapter](mechanism.md), and keep prestige only as a fallback?

Map the roles:

| Role | In this example |
|---|---|
| Candidates $Q$ | This year's papers / results |
| Forecasters $P$ | Researchers who read them and have a view on what will matter |
| Resolvers $F$ | A funding body that will, years later, judge realized impact and pay out |

## One question, start to finish

**Question $q$:** *"Will resolver $j$ judge paper X to be high-impact by 2030?"* Outcome space $\Omega_q = \{\text{yes}, \text{no}\}$.

**2025 — forecasts accumulate.** The crowd is skeptical; the consensus (reference) belief sits at $p^{\text{ref}} = 0.30$. Three forecasters act:

- **Alice** has read the paper closely and thinks it's a sleeper hit. She publishes $p_{\text{Alice}} = 0.80$, early.
- **Bob** just echoes the crowd: $p_{\text{Bob}} = 0.30$.
- **Carol** is a reflexive contrarian and bets it flops: $p_{\text{Carol}} = 0.10$.

All three forecasts are timestamped and tamper-evident, so "Alice said this in 2025" is later unforgeable.

**2030 — a resolver decides.** Resolver $j$, now with five years of citations, downstream results, and comparison papers, privately declares the verdict: **yes**, high-impact. (Had the evidence been hopelessly muddy, $j$ could have simply *discarded* the question and paid no one.)

**Scoring.** Using the log score $S(p,\omega)=\ln p(\omega)$ with outcome = yes, each forecaster's reward contribution is $S(p_i) - S(p^{\text{ref}})$:

| Forecaster | Belief | $\ln p$ | minus $\ln 0.30$ | Reward $\rho$ |
|---|---|---|---|---|
| Alice | 0.80 | $-0.22$ | $-(-1.20)$ | **$+0.98$** |
| Bob | 0.30 | $-1.20$ | $-(-1.20)$ | $0.00$ |
| Carol | 0.10 | $-2.30$ | $-(-1.20)$ | $-1.10$ |

Alice is paid handsomely for being **right and different from the crowd**. Bob, who only echoed consensus, earns nothing — he added no information. Carol, who was different and *wrong*, is penalized.

The penalty is symmetric and keeps confidence honest. Had the verdict been **no**, Alice's confident 0.80 would have scored $\ln(0.20) - \ln(0.70) = -1.25$ — a large loss. You are only rewarded for moving belief toward what the resolver eventually concludes.

**Reputation and payout.** Summed over many questions, Alice's reputation with this resolver is $R_{\text{Alice},j} = \sum_q \rho_{\text{Alice},j,q}$. Resolver $j$ then splits its budget $B_j$ across forecasters in proportion to their reputation — Alice gets a large share, Bob ~none, Carol less than she started with.

## Two phases, because reputation has a cold start

Before anyone has a track record, there is nothing to weight. So the system runs in two phases:

1. **Bootstrap.** A *play-money* market with tokens handed to reviewers, to seed forecasts and begin accumulating reputation before real budgets are at stake.
2. **Allocation.** Once reputations exist, retroactive scoring against resolvers' eventual impact verdicts converts forecaster reputation into real credentialing and funding weight.

## What this example deliberately does *not* claim

The construction's own non-goals, stated honestly:

- It does **not** measure non-observable impact — only impact that is, for the targeted cases, publicly and quantitatively observable.
- It does **not** settle whether prestige *should* exist.
- It does **not** claim to align science with societal good.

It assumes only that impact is observable for the cases it targets, and that prestige *ought to* track it. That narrow scope is what makes it tractable.

---

The same three roles and the same scoring reappear in [governance](living-system.md) (resolvers = voters' delegated fact-finders, candidates = policies) and, more surprisingly, inside the network itself — which is where [Part II](substrate.md) goes.
