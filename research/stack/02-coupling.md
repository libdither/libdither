# 2 · Coupling

Enter the friend with the NAS in her closet. Every peer-to-peer project has one — the person whose spare machine and misplaced faith carry the whole early network — and ours arrives now, because your node has hit the wall that ended chapter 1: laptops sleep, and an archive with one copy is a countdown.

Nobody is in charge of the pair of you. So why does cooperation happen at all, and what do you actually *send* each other? The first question has a boring answer with interesting consequences: cooperation happens because it has surplus. She holds your residuals overnight and you hold hers; her node is good at maps and yours at code; her closet is physically near data you keep fetching. The second question has a four-part answer, and the four parts turn out to be seeds of everything else in the book:

- **Capability advertisements** — "here's what I can predict, serve, and check, and roughly what it costs me." The seed of routing, and of the market.
- **Attestations** — signed receipts: "I saw the hash of your message at my clock time." The seed of ordering, timestamps, and (give it three chapters) the entire notion of *before*.
- **Credit** — a running IOU ledger: you owe her three map-lookups, she owes you a night of backup. The seed of money. The exchange rate you settle on — lookups per gigabyte-night — is barter, which is what every exchange rate is before it grows up.
- **Fate** — standing claims on each other: stakes, commitments, skin in the game. The seed of zones, pools, and chapter 4.

Notice the stance. Nothing here is mandated; the design's whole posture toward cooperation is *make it explicit, priced, and reversible* — cheap to enter where surplus exists, cheap to leave when it stops. You do not defeat Moloch by ordering people to cooperate. You starve him, by making defection and exit boring, legible, and affordable.

## Couplings you can typecheck

"Explicit" can be taken literally. A coupling between two nodes is a protocol agreed in advance, and a protocol can be a *type* — a session type, declaring who may send what, in what order, under what obligations. This is mature theory rather than speculation (multiparty session types: well-typed participants provably follow the protocol, never deadlock, always make progress), and disp is a suspiciously good host for it. A protocol spec is a content-addressed tree, so protocols have hashes and versions diff like anything else, with no registry to capture. disp types are predicates, so a message slot can *require* things — "a transfer, signed by the sender, whose balance covers it." And since every message cites the hashes of what preceded it, a protocol run leaves a tamper-evident transcript, which means disputes about *behavior* get settled the way chapter 1 settled disputes about *computation*: bisect the transcript, find the first ill-typed step, done.

A contract, in this world, is a session type plus collateral plus an arbitration clause. What makes a protocol *good* has a four-part answer we develop in [a working note](notes/protocols-as-priors.md) — sound, incentive-compatible, self-measuring, evolvable — with one caveat worth carrying everywhere: types give you safety, but only incentives give you liveness. A counterparty can always go silent. Only stakes make silence expensive.

## Receipts become time

Here's the quiet magic trick in that second message type. Once the hash of your record appears inside your friend's signed messages, and hers inside third parties', your record is *sandwiched*: it provably existed before everything that cites it and after everything it cites. To backdate anything you'd have to rewrite the signed histories of every independent witness in the web — and there stands the whole timestamping design. No blockchain. Just gossip, signatures, and causality, with precision set by how fast receipts circulate.

Payments ride the same insight further than you'd expect. A payment from a single-owner account needs only the *sender's* ordering of their own spends — that's all double-spending prevention is — and the sender can just provide it. This is a theorem (consensus number 1; Guerraoui et al., 2019), not an optimization: reliable broadcast suffices, and the entire apparatus of global consensus turns out to be unnecessary for moving money. The one thing that genuinely needs strangers to agree is **contested allocation** — two buyers, one name — and that's rare, local, and small enough for a modest quorum drawn from the neighborhood.

## From pairs to a neighborhood

Run the coupling move a few more times and institutions start arriving on a schedule, none of them designed, all of them implied:

- **Four nodes.** Your friend vouches for her cousin — the first *transitive* trust. The pairwise IOUs start netting against each other — the clearing function is born, unnamed. Three nodes can now witness for two — the first quorum.
- **Eight.** The first true stranger shows up, and for the first time it matters whether "three enthusiastic newcomers" are three people or one bored one — Sybil pressure begins, and with it everything in [chapter 5](05-immune.md). One node ends up in the middle of most trades simply by being central, and the hub is born, useful and dangerous in equal measure. Unanimity stops scaling. Voting appears, and immediately misbehaves in ways we'll spend two chapters on.

A cluster that couples densely — trading, witnessing, vouching, netting — earns a name: a *zone*. Pool where the coupling surplus is high; deal at arm's length where it's low; the boundary falls where the surplus does. Hold that thought through [chapter 4](04-money.md), because the boundary is where money changes, in both senses.

Underneath all of it sits one shared piece of geometry. Nodes embed themselves in a latency coordinate space — near in the space means cheap to reach in the world — and this one map gets reused so relentlessly the book calls it the **body map**: quorums are drawn from it, currency zones live on it, newcomers are vouched into it, and chapter 5's statistics lean on it (correlation between neighbors is expected; correlation between strangers is a tell). Transport across the map is onion-wrapped, each relay learning only its neighbors, so fetching the archive doesn't confess your interests to whoever watches the wire. And retrieval composes with chapter 1's memory: a request is a partial context, each hop moves it toward nodes advertising lower expected loss on that kind of context, and the exact-bit fetch is the expensive last resort. (Descent on an uncertainty gradient, if you want it in one phrase.)

## Identity, at last

Now notice what this chapter never needed: a registry. At two nodes, identity is perception — you *know* her; the NAS is in her closet. The question "who is real" only grows teeth as strangers arrive, and the answer that scales is not a credential but a **posterior**: each node, and each zone for its own purposes, maintains its own working estimate of how distinct and how trustworthy each counterparty is. What feeds it is a portfolio of evidence streams, individually weak, collectively expensive to fake in bulk:

1. **Locality** — latency triangulation, physical presence. An attacker can fake nodes; faking nodes *everywhere* is another matter.
2. **Authorizers** — and here the passport desk returns, demoted from foundation to witness. A government office, an employer, the knitting circle's founder: each is just an attestor with an auditable track record, weighted like any other evidence.
3. **Stake-backed vouching** — vouch for a puppet, lose your stake.
4. **Behavioral streams** — the paid work of later chapters: service patterns, forecast records, transaction rhythms.
5. **Continuity** — hash-entangled history. Old identities are expensive *by construction*, which is the property forgers hate most.
6. **Hardware** — a disk only commits once.

Two properties of this posterior matter more than any stream feeding it. It's **stake-scaled**: a two-dollar trade needs a shrug of confidence, a treasury vote needs the full portfolio, and you buy exactly the certainty the interaction warrants — chapter 1's loop, pointed at personhood. And it **composes along paths**: you'll never compute a fine-grained estimate of a stranger nine hops away, and you don't need to; confidence flows through vouching chains with attenuation, exactly the way exchange rates will flow through trading chains in chapter 4. Identity confidence, trust, exchange rates: one family of objects, fields on the body map, composing along routes. The book will lean on that rhyme more than once.

⚠️ What we can't defend yet: the quorum design for contested allocation (member selection, cross-zone disputes) is unwritten; the relay-incentive game — who pays whom for carrying traffic — waits on the market; timestamp precision under real gossip is unmeasured (reviving the old `dither-sim` work is still the cheapest de-risking available, and still undone); and the typed-sessions program over disp is a note with ambitions, not code.

📐 Formal treatment: [Mathematical Core §4.4](mathematical-core.md), [§10.3](mathematical-core.md); the [coupling-and-merging note](notes/coupling-and-merging.md).

---

Two nodes, then eight; receipts that became timestamps; IOUs that will become money; a map that will become the skeleton of everything. The circle's archive now survives the night. What nobody can do yet is price anything beyond barter — and the moment a stranger's disk enters the picture, barter stops scaling. A market, then. [Chapter 3](03-market.md).
