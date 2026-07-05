# The Decentralization Stack

> 🚧 **Draft.** Third major revision: the book is now organized around one learning loop at three timescales, rather than one chapter per mechanism. The math lives in the [Reference](mathematical-core.md); open problems are marked ⚠️ inline, next to the claims they qualify; the newest design material is in the [working notes](notes/protocols-as-priors.md).

The internet was born decentralized, and it did not stay that way. Nobody voted for the change. Centralization won because a short list of hard problems has, for as long as we have had networks, exactly one proven solution: put somebody in charge.

And it works. That is the uncomfortable part. A registry really does solve identity; a bank really does solve payment; an editor really does solve truth. The cost arrives later, when whoever you put in charge notices what the position is worth. The registry becomes a surveillance business, the bank becomes a chokepoint, the editor becomes a gatekeeper. You cannot fire them, because everything else was built on top of them. The somebody-in-charge starts as a solution and ends as the problem.

There is one system that solves all of these problems at scale with nobody in charge, and it has been running for four billion years. Biology gets strangers to cooperate — genes in a chromosome, cells in a body, insects in a colony — by a specific trick: **ship shared priors, refine them at runtime, and select between whole systems.** Every cell carries the genome: the agreements pre-loaded before any interaction. Lifetime learning tunes behavior against evidence. Selection between organisms replaces the priors that stopped working. That is the bet this book makes:

> **Build the network the way biology builds organisms. An institution is a shared prior over joint behavior. Ship good ones, pay participants to refine them against reality, and keep selection between networks alive so better priors can replace them.**

The jobs the priors must cover are exactly the jobs the somebodies do today:

| The job | Who does it for you today | Where |
|---|---|---|
| trust a result you didn't compute | every server you have ever believed | [1 · The Agent](01-agent.md) |
| tell participants apart | Google sign-in, the passport office | [2 · Coupling](02-coupling.md), [5 · Immunity](05-immune.md) |
| agree on what happened before what | notaries, blockchains | [2 · Coupling](02-coupling.md) |
| move and find data without being watched | ISPs, CDNs, platforms | [2 · Coupling](02-coupling.md) |
| buy and sell storage, bandwidth, compute | the cloud oligopoly | [3 · The Market](03-market.md) |
| turn dispersed knowledge into shared belief | editors, oracles, expert committees | [3 · The Market](03-market.md) |
| hold and transfer value | banks and central banks | [4 · Money](04-money.md) |
| turn preferences into collective action | boards, ministries, foundations | [6 · Governance](06-governance.md) |

## One loop, three timescales

Underneath the eight jobs there are two primitives. **The loop:** an agent spends resources to reduce uncertainty until it is confident enough to act, where "enough" scales with the stakes. **The move:** two agents couple — share predictions, attestations, credit, fate — when the surplus of coupling beats its cost. Everything else in the book is these two, recursed.

The system then learns at three speeds:

- **Fast — the market.** Prices, routes, trust weights, and model parameters update automatically against evidence, *within* the shipped priors. Every payment in the system is a payment for beating the shared reference; markets pay for prior improvement.
- **Medium — governance.** Where evidence cannot pin the choice (values, parameters, boundaries), the coalition refines priors deliberately.
- **Slow — evolution.** New protocol versions and new networks replace the prior-generating machinery itself, selected by adoption and exit.

## Five ways it dies

Each design below is written against five failure modes — the ways a refinement loop breaks. They are formalized as viability conditions V1–V5 ([Mathematical Core §7](mathematical-core.md)); in plain words:

1. **It starts believing itself.** Forecasts feed back into the verdicts that score them; the fast loop's measurements corrupt. (V1, [ch. 5](05-immune.md))
2. **One actor wears a thousand faces.** Everything that counts participants gets counterfeited. (V2, [ch. 5](05-immune.md))
3. **Wealth pools until the richest set the truth.** Concentrated capital captures the medium loop. (V3, [ch. 4](04-money.md))
4. **Leaving becomes too expensive to matter.** Selection between networks dies; the slow loop stops. (V4, [ch. 7](07-evolution.md))
5. **It mistakes correlation for cause and acts on it.** A market estimate gets wired straight into a decision. (V5, [ch. 6](06-governance.md), [Futarchy and Causality](futarchy-causality.md))

## How to read it

Straight through: the book grows the system from one node, to two, to clusters, to an economy, to a self-governing organism, and each chapter closes with what you can now build and what is still missing. There is no single root among the jobs — the closest thing to a root is *prediction* (the loop every agent runs), and the load-bearing wall is *boundary integrity* (chapter 5's correlation machinery), which is maintained by the running system rather than installed before it. The [Reference](mathematical-core.md) holds the formal treatment, the [glossary](glossary.md), the [roadmap](roadmap.md), the [open questions](open-questions.md), and the [working notes](notes/predictive-materialization.md) where the newest material lives in raw form.
