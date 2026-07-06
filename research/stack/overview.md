# The Decentralization Stack

> 🚧 **Draft**, and openly a rabbit hole. One more thing, up front: 🤖 **nearly every document in this section was drafted by an AI collaborator**, working from the author's designs and direction — [read what that means](ai-disclosure.md) before trusting a fluent sentence. The math lives in the [Reference](mathematical-core.md); open problems are marked ⚠️ next to the claims they qualify; the rawest new material is in the [working notes](notes/protocols-as-priors.md).

> *"If you wish to make an apple pie from scratch, you must first invent the universe."*
> — Carl Sagan

We wished to make a chat app.

That is not a framing device. The oldest design document in this repository, written around 2020, describes the whole ambition in one line: *"tl;dr Discord but decentralized and better."* The history file next to it has three year-headings and a single bullet point that says "Conception," which tells you roughly how the last few years have gone. This book is what we found at the bottom of that one-line plan, arranged so that you can climb down with more dignity than we did.

## The descent

Picture the community you'd actually build this for. Ours, for the sake of the book, is a knitting circle: forty people who argue about cable patterns with the intensity of a border dispute, five years of running jokes, and a pinned message in which Sarah finally concedes that the scarf was cursed. All of it lives in a Discord server, which is to say: all of it exists at the pleasure of a company that has never heard of these people and would not notice their disappearance. One policy change, one bad quarter, one wrongly-banned moderator, and the whole shared memory of the place is gone. You have probably watched this happen to a community you loved. Most people online have, by now.

So you decide to build them something better. How hard could it be?

The first attempt is the obvious one: rent a server, run the chat yourself. Congratulations — you are now the company. You pay the bill, you hold the logs, you can be subpoenaed, and the community's five years of history now has a bus factor of exactly you. Federation (the Matrix move) improves this less than you'd hope: a smaller landlord is still a landlord, and "trust your homeserver admin" is a sentence with the word *trust* doing regrettable work.

The second attempt is real peer-to-peer, messages living on the members' own machines, and this is where the trapdoor opens. Each problem you solve turns out to have been standing on another one:

1. Laptops sleep. For the archive to survive the night it has to live on machines that aren't yours — which means *strangers* have to hold the knitting circle's data.
2. Strangers will not store five years of scarf discourse out of love. You have to pay them. Now you need a market for storage, and while you're at it bandwidth and compute, because a chat app with search needs all three.
3. Pay them with *what*? A card processor is the somebody-in-charge again, wearing a fee schedule. A token is whales and volatility. You need money that works here, which turns out to be its own abyss.
4. Before any of that: the free tier, the spam, the vote-kicks. What stops one bored teenager from being forty enthusiastic new members? You need to count people, and there is no passport desk.
5. "Anonymous" was in the original pitch, so the network can't leak who talks to whom — the routes themselves have to keep secrets.
6. That stranger holding the archive: is she actually holding it? She says the search index she computed is correct. Is it? You need to check work you didn't do, done by people you'll never meet.
7. Moderation. Somebody posts something awful, or merely wrong, and the group needs a way to decide what it believes without appointing a mod-king — because the mod-king is the somebody-in-charge again, at the smallest possible scale, and he is tired.
8. The group fund, the rule changes, the eternal argument about whether the crochet people may join: deciding together, without the decision being buyable.
9. And someday — there is always a someday — the schism. Half the circle storms off to found a rival network. What happens to the shared history, the shared money, the shared reputation? Forks and mergers need to be survivable, which means they need to be *designed for*.

Somewhere around the fifth item you have stopped building a chat app. What you are building is a small economy with an immune system and a shared memory — the least evasive word for it is an *organism*. We know how that sounds. The rest of this book is us earning that sentence slowly.

## The bet

There is one precedent for strangers cooperating at scale with nobody in charge, and it has been in production for four billion years. Biology's trick is specific enough to copy: **ship shared priors, refine them at runtime, select between whole systems.** Every cell carries the genome — the agreements pre-loaded before any interaction. Lifetime learning tunes behavior against evidence. And selection between organisms retires the priors that stopped working. Nothing decides; everything is decided anyway.

So that is the design: every institution in this book — the market, the money, the identity machinery, the governance — is a *shipped prior*, a good default with an explicit update path, not a claim of correctness. The network pays its participants to refine the priors against reality (that's the market), refines deliberately what evidence can't settle (that's governance), and keeps exit cheap so better-run networks can win (that's evolution, and it is load-bearing, not decorative).

The walls from the descent, and where each one falls:

| The wall | Who handles it for you today | Where |
|---|---|---|
| checking work you didn't do | every server you've ever believed | [1 · The Agent](01-agent.md) |
| talking without being watched; proving what happened when | ISPs, platforms, notaries | [2 · Coupling](02-coupling.md) |
| counting people without a passport desk | Google sign-in, the passport desk | [2 · Coupling](02-coupling.md), [5 · Immunity](05-immune.md) |
| paying strangers for storage, bandwidth, compute | the cloud oligopoly | [3 · The Market](03-market.md) |
| deciding what the group believes | editors, oracles, the tired mod | [3 · The Market](03-market.md) |
| money that can't pool into a weapon | banks, central banks | [4 · Money](04-money.md) |
| spam, puppets, echo chambers, capture | trust & safety departments | [5 · The Immune System](05-immune.md) |
| deciding together, unbuyably | boards, foundations, mod-kings | [6 · Governance](06-governance.md) |
| surviving forks, mergers, and your own success | nobody, honestly | [7 · Evolution](07-evolution.md) |

## Five ways it dies

Everything below is written against five failure modes — formally, viability conditions V1–V5 ([Mathematical Core §7](mathematical-core.md)). In plain words: **it starts believing itself** (forecasts feed the verdicts that score them, and the shared model detaches from reality); **one actor wears a thousand faces** (everything that counts gets counterfeited); **wealth pools until the richest set the truth**; **leaving gets too expensive to matter** (and with exit dies the selection pressure that keeps any of this on course); and **it mistakes correlation for cause and acts on it**. Each chapter will tell you which of the five it is defending against, because knowing exactly how your design dies is most of designing.

## How to read it

Front to back; the book grows the thing from one node to two to an economy to something that can fork and survive it. The knitting circle will keep showing up — them, the friend with the NAS in her closet, and Dana, whose relationship to voting will become mathematically interesting around chapter 6. If you want theorems instead of yarn, the [Mathematical Core](mathematical-core.md) is the same book with the jokes removed, and the [roadmap](roadmap.md), [glossary](glossary.md), [open questions](open-questions.md), and [working notes](notes/predictive-materialization.md) round out the reference shelf.

One structural confession before we start: there is no clean foundation under all this, no single primitive the rest bolts onto. The nearest thing to a root is a habit — *prediction* — and the nearest thing to a keystone is the correlation machinery of chapter 5, which is maintained by the running system rather than installed before it, the way a cell membrane is maintained by the metabolism it makes possible. Books about towers get to start at the ground floor. This is a book about an organism, so we start with a cell.
