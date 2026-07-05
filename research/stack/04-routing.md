# 4 · Routing

Every request you make on today's internet is a small confession. Your ISP sees the address, the CDN sees the file, the platform logs the query, the time, and what you did next. Encryption protects the content and nothing else, and the nothing else — who wants what, when, from where — is the business model.

The job: move data between nodes, and *find* who holds a given value, without revealing who wants what and without publishing the network's own structure to observers. Three cooperating pieces:

**Distance-aware anonymous routing (DAR).** Nodes embed themselves in a latency coordinate space (Vivaldi-style): nearby in the space means cheap to reach in the world. Traffic is onion-wrapped (HORNET-style), so a relay learns only its predecessor and successor, never source or destination. The same layer provides geometry for efficiency and blindness for privacy.

**Data-trail search (DTS).** There is no global index of who-holds-what; an index is a surveillance gift. Instead, retrievals leave breadcrumbs, and searches follow the trails of previous fetches to locate rare data.

**Reverse hash lookup (RHL).** Given a content hash, find providers — without announcing yourself as a seeker to the whole network.

The quiet star of this chapter is the coordinate space itself, because everything after it reuses it. It is where [chapter 2](02-ordering.md)'s zonal quorums are drawn, where [chapter 1](01-identity.md)'s correlation estimator gets its prior (correlation between neighbors is expected; correlation between strangers is informative), where [chapter 6](06-money.md)'s currency zones live, and where newcomers get vouched into the network. One geometry, five jobs. The book calls it the body map.

⚠️ Open: this is the least-validated chapter of the stack. The DAR design has no simulation results (reviving the old `dither-sim` work is the cheapest de-risking step available). The relay incentive game — who pays whom for carrying traffic, and how bargaining settles — is unresolved and waits on chapters 5 and 6. And one tension has no answer yet: anonymization deliberately hides the very paths that the next chapter's optimizer wants to price.

---

Data can now move without being watched. But relays burn electricity and disks fill, and nobody does either for love at scale. Someone has to be paid, in something, at a price someone sets. That is [chapter 5](05-market.md).
