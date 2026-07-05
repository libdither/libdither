# 1 · Identity

Sooner or later, everything in this book counts something. Votes in a decision. Witnesses to a timestamp. Contributors to a project. Recipients of a basic income. And the cheapest attack on anything that counts is to *be many*: one operator, a thousand accounts, a thousand shares of whatever is being handed out.

Today a somebody-in-charge stops this. Google checks your phone number, the passport office checks your face, the platform bans duplicates as it finds them. A decentralized network has no desk to present your face at. This is the Sybil problem, and it sits under every other chapter: voting is meaningless if one person can vote a thousand times, consensus is meaningless if the "independent" parties are sock-puppets, and an income drip is a money pump for whoever scripts account creation fastest.

The obvious decentralized fix is a *proof of personhood*: verify that each account is a unique human. It walks into a dilemma. A cheap proof (an email, a captcha, a small fee) is forgeable at scale. A strong proof (biometrics, government ID) rebuilds the surveillance we were trying to escape, and still needs someone to check it. "Is this account a distinct person?" turns out to be a question only an authority can answer, which disqualifies it here.

## Ask a different question

So don't ask it. Ask instead: **how much independent information does this participant contribute?**

Watch behavior over time: forecast errors, transaction timing, verdicts, service patterns. Subtract everything explainable by public information; what remains is the account's *residual* stream, the part that comes from its own private situation. Two strangers' residuals wander independently. A puppeteer's thousand accounts stay correlated no matter how carefully they are scripted, because they share the one thing that matters: a single controller's private state.

Measure the correlation and count what it implies. For a cluster of `k` accounts with mutual correlation `ρ`, the number of independent voices actually present is

```
n_eff = k / (1 + (k−1)·ρ)
```

Perfect puppets (`ρ → 1`) collapse to one voice no matter how many accounts they open. Genuine strangers (`ρ → 0`) count fully. There is no verdict, no expulsion, no personhood certificate. Only a weight.

One rule then makes it bite: **every weight in the system is issued per unit of `n_eff`, never per account.** Votes. The income drip. Influence over aggregated beliefs. The power to witness a timestamp. Open a thousand accounts and the thousand share approximately one vote, one income, one voice.

## Faking independence costs what honesty costs

The remaining attack is deliberate decorrelation: script the thousand accounts to *look* independent on every monitored dimension. But the monitored dimensions are the dimensions the network pays for — forecast accuracy, storage served, bytes routed, computation delivered. Passing an independence test on paid work means producing `k` separately maintained streams of real, individually rewarded work: `k` information positions, `k` resource commitments. In the limit, the cheapest way to fake `k` agents is to *be* `k` agents. At which point, from the network's side of the boundary, they are `k` agents. Identity here is not a credential; it is an accumulated signature of real work.

## What about honest communities?

An objection surfaces immediately: a close-knit community whose members think alike will register as correlated. Are they punished as colluders? No — they are *measured*. Agents correlated through shared private channels really do contribute less independent information to an aggregate, and weighting them accordingly is accurate inference. The weight is graduated and recoverable: act on your own information and it grows back. The feared autoimmune disease was an artifact of demanding a yes/no classifier; a continuous weight never asks the unanswerable question.

⚠️ Three things stay open. This is an arms race, and how much behavioral monitoring is *enough* at any finite richness is an empirical question, not a theorem. Estimating the correlation structure across millions of accounts needs a prior on where correlation should be expected; the coordinate space of [chapter 4](04-routing.md) supplies one, but the estimator itself is undesigned. And a newborn account has no history at all, so the boundary is weakest at birth — [chapter 6](06-money.md) closes that hole with local vouching.

📐 Formal treatment: [Mathematical Core §3](mathematical-core.md) — `n_eff = 1ᵀΣ⁻¹1`, the GLS weights, and the mimicry-cost proposition.

---

You can now count independent minds without learning anyone's name. What you cannot yet do is establish *when* anything happened, and money, forecasts, and auctions all hang on before-and-after. That is [chapter 2](02-ordering.md).
