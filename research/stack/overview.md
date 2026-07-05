# The Decentralization Stack

> 🚧 **Draft.** Recently rewritten from a two-part problem-map into this single sequence. The math lives in the [Reference](mathematical-core.md); open problems are marked ⚠️ inline, next to the claims they qualify.

The internet was born decentralized, and it did not stay that way. Nobody voted for the change. Centralization won because a short list of hard problems has, for as long as we have had networks, exactly one proven solution: put somebody in charge.

And it works. That is the uncomfortable part. A registry really does solve identity; a bank really does solve payment; an editor really does solve truth. The cost arrives later, when whoever you put in charge notices what the position is worth. The registry becomes a surveillance business, the bank becomes a chokepoint, the editor becomes a gatekeeper. You cannot fire them, because everything else was built on top of them. The somebody-in-charge starts as a solution and ends as the problem.

This book goes down the list and removes, one at a time, each reason a center was needed. Here is the list; it doubles as the table of contents.

| Ch. | The job | Who does it for you today |
|---|---|---|
| [1 · Identity](01-identity.md) | tell distinct participants apart | Google sign-in, the passport office |
| [2 · Ordering](02-ordering.md) | agree on what happened before what | notaries, certificate authorities, blockchains |
| [3 · Substrate](03-substrate.md) | trust a result you didn't compute yourself | every server you have ever believed |
| [4 · Routing](04-routing.md) | move and find data without being watched | ISPs, CDNs, platforms |
| [5 · The Resource Market](05-market.md) | buy and sell storage, bandwidth, compute | the cloud oligopoly |
| [6 · Money](06-money.md) | hold and transfer value | banks and central banks |
| [7 · Truth](07-truth.md) | turn dispersed knowledge into shared belief | editors, oracles, expert committees |
| [8 · Reflexivity](08-reflexivity.md) | keep shared belief coupled to reality | (nobody does this well) |
| [9 · Governance](09-governance.md) | turn preferences into collective action | boards, ministries, foundations |
| [10 · The Organism](10-organism.md) | make the above one system, not nine | — |

The goal these serve is [Dither](../dither.md): replace the centralized internet with decentralized alternatives unified by one modular protocol, under four design tenets — useful, modular and modelable, interoperable, self-reliant. This section is the hard half of "modelable": showing that the pieces form one coherent system rather than a pile of unrelated mechanisms.

## Five ways it dies

Every design below is written against five failure modes. They are formalized later as the viability conditions V1–V5 ([Mathematical Core §7](mathematical-core.md)); in plain words:

1. **It starts believing itself.** Forecasts feed back into the verdicts that score them, and the system settles into a stable fiction. (V1, [chapter 8](08-reflexivity.md))
2. **One actor wears a thousand faces.** Everything that counts participants gets counterfeited. (V2, [chapter 1](01-identity.md))
3. **Wealth pools until the richest set the truth.** Concentrated capital captures the shared world-model. (V3, [chapter 6](06-money.md))
4. **Leaving becomes too expensive to matter.** Without cheap exit there is no competition between networks, and no correction. (V4, [chapter 10](10-organism.md))
5. **It mistakes correlation for cause and acts on it.** A market's estimate gets wired straight into a decision. (V5, [chapter 9](09-governance.md) and [Futarchy and Causality](futarchy-causality.md))

## The shape of the thing

There is no single root; the stack is a set of interdependent problems, not a tower. But the dependencies have a shape. Identity sits under everything, because every counted or weighted thing needs it. Ordering, the substrate, routing, and money are near-primitives on top of it. The resource market is where they first combine. Truth stands on ordering and money; governance stands on truth. Money and truth form the stack's one genuine cycle — each needs the other sound — which is why those two are co-designed rather than stacked.

## How to read it

Straight through. Each chapter opens with the somebody it removes and closes the same way: what you can now build, and what is still missing. The [Reference](mathematical-core.md) chapters at the end hold the formal treatment, the [glossary](glossary.md), the [roadmap](roadmap.md), and the [open questions](open-questions.md).
