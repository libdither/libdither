# 2 · Ordering

You sold a month of storage and were paid for it; the buyer now claims the payment never happened. Or: back in March you predicted a result that became obvious in November, and you want credit for March. Or: two people bought the same name at nearly the same moment, and one of them has to lose. Three disputes, one question: *what happened before what?*

Today the timeline is whoever's database you both trust — the platform's transaction log, a notary, a certificate authority's clock. The crypto reflex is a blockchain, which answers the question by paying the entire world to agree on a total order of everything. That works, but look at the price: global consensus, always on, for every event, contested or not. Almost nothing needs it.

Sort the jobs by how much agreement they actually require.

**Payments need almost none.** A payment from a single-owner account has one ordering that matters: the *sender's* own sequence of spends, which is what prevents double-spending, and the sender can simply provide it. This is a theorem, not a hunch: asset transfer between single-owner accounts has consensus number 1 (Guerraoui et al., *The Consensus Number of a Cryptocurrency*, PODC 2019). Byzantine reliable broadcast suffices. No miner, no global ledger, no fee paid to a lottery winner. An account shared by `k` owners needs agreement among the `k`, and no one else.

**Timestamps need witnesses, not consensus.** Publish the hash of your March forecast. Anyone who cites that hash inside their own signed messages has sandwiched it in time: the forecast provably existed before everything that cites it, and after everything it cites. To backdate it later, you would have to rewrite the signed histories of every independent witness in that causal web. Independent is the operative word, and it is [chapter 1](01-identity.md)'s number: witnesses are weighted by `n_eff`, so a thousand sock-puppet witnesses count as one. Gossip rate sets the precision, and minutes are ample for pinning forecasts.

**Only contested allocation needs real ordering.** Two buyers, one name: someone must pick a winner, and that does require agreement among strangers. But it is rare, local, and low-throughput. A small BFT quorum drawn from the surrounding zone settles it. No global machinery.

The summary is blunt: this stack needs a blockchain nowhere. It needs cheap causal timestamping everywhere, and zonal BFT in one narrow place.

⚠️ Open: the zonal quorum itself is undesigned (member selection, cross-zone disputes), and real-world timestamp precision is an empirical question about gossip rates.

📐 Formal treatment: [Mathematical Core §4.4](mathematical-core.md).

---

You can now order payments and pin claims in time. The next reason to hire a somebody: when a stranger's machine hands you a result, nothing yet tells you it is correct. That is [chapter 3](03-substrate.md).
