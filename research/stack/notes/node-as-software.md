# Working Note · The Node as Software

> 🧪🤖 **Working note** (AI-drafted, human-directed — [provenance](../ai-disclosure.md)). Status: **design draft, v5** (four adversarial review rounds incorporated; changes logged in Appendix B). Open problems are marked ⚠️ next to the claims they qualify.

> *What actually runs on one machine. The [stack chapters](../overview.md) describe an economy; this document describes the six processes and one library a single node executes to participate in it, what each component reads and writes, how they depend on each other, and exactly where the design's trust assumptions live. If the chapters are the anatomy textbook, this is the cell biology.*

---

## 0. How to read this

Terms are defined here, in plain words, as they're used (jargon flagged in parentheses on first use; anything **in bold** is also in the glossary, Appendix A). Results from the stack chapters are cited, not re-derived. The altitude is deliberate: not "what should the network do" but "what is my laptop doing at 3am while I sleep." Designs like this one usually die in the gap between a beautiful mechanism and a running process, not in their mathematics. Wherever something is underspecified, untested, or an open research problem, it says so, in place.

Two project-specific terms appear throughout: **disp** is the project's programming language and evaluator (programs are content-addressed trees; evaluation is deterministic reduction, so two honest runs agree bit-for-bit, and "number of reduction steps" is a machine-independent unit of compute work); a **reduction trace** is the step-by-step record of such an evaluation, checkable by anyone.

The map: §1 the problem → §2 the one structural rule → §3 the six processes (the bulk) → §4 how they depend → §5 the consensus budget → §6 identity → §7 the markets → §8 money → §9 the security model → §10 scaling → §11 open problems.

The intended reader: an engineer evaluating whether to build this, or a reviewer trying to break it.

---

## 1. The problem, briefly

A community — forty people, five years of shared history — wants to keep its memory, its treasury, and its ability to make decisions together, without any company or admin holding the keys. Every existing answer reintroduces somebody-in-charge: the hosted platform (a company), the rented server (you), the federated homeserver (a smaller landlord), the global blockchain (a validator set, plus fees, plus the bizarre step of ordering every keystroke on the planet into one queue even though almost nothing anyone does conflicts with anything else).

The design stance taken here, inherited from the stack chapters:

- **Minimal consensus.** Agreement is expensive and centralizing, so the system buys exactly as little of it as possible, in the smallest possible jurisdictions, and says precisely where every gram of it is spent (§5).
- **No global anything.** There is no global ledger, no global identity registry, and — this is the unusual one — no global *consensus view of the truth*. Every opinion-like quantity (reputations, weights, world-models) is computed locally by each node from public, portable, signed records. Only scarcity (money, votes, entitlements) is ever agreed upon, because scarcity is the only thing that logically requires agreement.
- **Everything is a shipped prior — and shipped priors are dumb defaults.** Every mechanism here is a default with an explicit update path, and the defaults are deliberately the simplest versions that can work at all: fixed rates before feedback controllers, equal weights before estimated ones, play money before real money. Promotion from the dumb default is *earned by measured evidence* — a rule that recurs so often it gets a name (**earn-your-complexity**, §6.2). (See [protocols-as-priors](protocols-as-priors.md) for the philosophy.)

---

## 2. The one structural rule

**No authoritative state exists anywhere except in signed, content-addressed, hash-entangled logs.** Everything else — balances, reputations, weights, world-models — is a *view*: a pure function recomputed over logs, held only as a rebuildable cache. Inter-process communication on a node takes exactly three forms: (a) log reads and writes, (b) pure-function library calls (the Signer, hash functions, the evaluator), (c) read-only queries against another process's *cache of a view*. Nothing stateful ever passes between processes except through the log store.

Unpacking the three properties of a log:

- **Signed**: every entry carries the author's signature. Authorship is unforgeable and undeniable.
- **Content-addressed**: every chunk of data is named by its hash (its content, not its location). Identical content deduplicates for free; tampering breaks the name.
- **Hash-entangled**: every entry cites the hashes of the entries it builds on. A log is a tamper-evident causal chain: once other people's signed entries cite yours, your record is *sandwiched* — provably older than everything that cites it and newer than everything it cites.

Two patterns recur everywhere, so name them once:

- **Bind now, open later.** Verdicts are committed blind and revealed later (§3.6); escrows pre-sign their exits at lock time (§3.5); manifests pin their inputs before anyone computes on them (§3.7). Commit first, reveal at the zone's clock beat, let the gap between the two do the work.
- **Agree inputs, not answers.** Wherever the zone's quorum must act, its job is to agree on a small public input set (an **epoch manifest**); the computation over those inputs is deterministic, so anyone can do it and publish a verifiable trace. The quorum agrees the manifest; verifiable compute does the arithmetic (§5.5).

One cross-cutting discipline uses these logs: protocol runs (a purchase, a vote, a quorum session) are **session-typed** — the allowed message sequences are declared in advance as a type, and a run's transcript is checkable against that type by anyone (see [protocols-as-priors](protocols-as-priors.md); the guarantees hold among honest participants, which is why collateral and accountability layer on top — typed transcripts make misbehavior *provable*, not impossible).

What the rule buys:

1. **Portability.** Kill a service, reinstall, point it at the log store, and everything comes back. Moving to a competing network means copying your logs. Exit costs nothing because there was never any non-log state to hold hostage.
2. **Auditability.** Any dispute about behavior — a counterparty's, a quorum's, your own — is settled by replaying logs against the session type.
3. **Testability.** Every service is a pure function over logs plus a policy; feed it synthetic logs and check its behavior without a network.
4. **A visible coordination boundary.** The only places the node needs agreement with the outside world are where log *contents* must be agreed. Those turn out to be few, and §5 enumerates all of them.

The rule has a cost: logs grow. §10 (scaling) addresses retention, checkpoints, and pruning.

---

## 3. The six processes (and one library)

A full node runs six processes — three daemons (always on: Store, Transport, Sync), two engines (the Materializer, daemon and engine both; the Claims Engine, batch jobs plus a query cache), and one consensus-talker (the Zone Client, daemon-ish) — plus one library (the Signer). A light client (a phone) runs Signer + Store + Transport + Sync and buys verified answers from **coupled** peers (peers it has standing relationships with, §6.3) instead of running the engines.

Two pieces of zone vocabulary get used before their home section (§3.7): an **epoch tick** is the zone quorum's signed clock beat, and an **epoch** is the period between two ticks; **demurrage** is the per-tick melt on idle money balances (§8).

For each component: what it's for, what it reads and writes, its policies, what it absorbs (services you might have expected to exist separately but don't), and how it fails.

### 3.1 The Signer — a library

**Purpose.** Hold the node's private keys; produce signatures; nothing else. A pure-function call available to every process; it holds the only state that is not a view (the keys themselves — by necessity, and they never enter the logs).

**Policies.**

- *One account, one writer.* The node's money is a **single-owner account**: only this Signer can order spends from it. With only one writer, the writer's own signature is all the ordering a payment ever needs (§5.1).
- *Recovery.* The node pre-commits a **recovery circle**: a small k-of-n threshold of named co-signers (friends, other devices). Without this, key compromise is total loss by construction. (Technical note: a threshold circle is *not* a k-shared account in the strict sense of §5.2 — two disjoint k-subsets could sign conflicting recovery spends. That case degrades gracefully onto the standard equivocation path: proven fork, standing collapse, quorum ruling. All-k circles avoid it entirely.)

**Subsumes.** Wallet key management, identity keys, session keys.

**Failure modes.** Key theft (mitigated: recovery circle, hardware keys); key loss (same); coerced signing (unmitigated at this layer — the logs at least make post-hoc repudiation visible ⚠️).

### 3.2 Store — daemon

**Purpose.** Keep bytes. Holds the node's own append-only logs, chunks of public logs it has synced, and arbitrary content-addressed data (its own files, other people's archives it is paid to hold).

**Reads/writes.** Everything reads it. Everything appends through it. It enforces append-only semantics on logs and hash-integrity on chunks.

**Policies.**

- *Retention is a market decision, not a file-system decision.* What the Store keeps beyond its owner's data is determined by the Materializer (§3.5), which pays (or is paid) for retention. Log persistence of the claims layer is itself a paid storage contract like any other — the market funds its own memory out of resolver budgets (§7).
- *Indexes are disposable.* Views are maintained as incremental indexes over logs; any index can be rebuilt from the logs, so indexes may be dropped and rebuilt at will.
- *Checkpoints, with honest evidentiary weight.* (i) A node may prune its own history behind a **self-signed checkpoint** (a signed entry summarizing its log state at a tick, hash-entangled forward) — but a self-signed checkpoint is a *local storage optimization with zero evidentiary weight for counterparties*, because the pruned content can no longer be recomputed by anyone else. (ii) The checkpoints that matter for validation are the zone's **epoch manifests** (§3.7), which commit to the post-demurrage balance map — a deterministic function of the manifest's inputs, so committing to it costs the quorum nothing extra, and anyone can verify a balance assertion against it. (iii) This is the answer to *checkpoint fraud* — a node presenting a pruned history with an inflated balance: fraud is caught wherever the balance map is committed. (iv) Pruning never deletes the hash chain's spine, only bulk content; fork detection over pruned segments uses the retained spine and the manifest commitments.

**Subsumes.** The "ledger" (a balance is a view: transfer logs + the demurrage function + epoch ticks — there is no separate ledger process), the archive, the DHT's storage half (a distributed hash table is many nodes' Stores plus a way to find them — the finding is Transport's job: greedy routing on the latency-coordinate body map toward content-hint markers left by prior lookups ⚠️, inherited from the project's routing design notes and unvalidated in simulation).

**Failure modes.** Disk full (shed unpaid retention first); bit-rot (hash-check on read; repair from the network); holding illegal or toxic content ⚠️ (a real problem for any storage network; mitigations are zone-level content policies plus serving only content with known provenance — genuinely unsolved in general, flagged rather than decorated).

### 3.3 Transport — daemon

**Purpose.** Move bytes between nodes, privately. Maintains peer sessions, onion-routes traffic (each relay sees only its immediate neighbors), relays others' traffic, discovers new peers, and measures latencies.

**Reads/writes.** Writes session receipts and latency measurements to logs. Reads peer addresses and capability advertisements (which are claims, §3.6).

**Policies.**

- *Privacy at the network layer.* Requests are onion-wrapped so that fetching data does not confess your interests to whoever watches the wire.
- *The body map.* Latency measurements between peers are continuously recorded; from them the node maintains its patch of the shared latency-coordinate space (the "body map" — near in the map means cheap to reach in the world). Not a separate service; Transport taking its own pulse.
- *Peer diversity as a security parameter.* The node deliberately maintains sessions beyond its friends, because fork detection (§3.4) only works if log heads circulate widely. Eclipse resistance (an attacker controlling all your connections) is a Transport-level property, and it is load-bearing for the timestamp layer and for payment finality ⚠️ (§3.5, §9.1).

**Subsumes.** Peer discovery, NAT traversal, relaying, the latency coordinate system, the anonymity layer's plumbing, DHT lookup (see §3.2).

**Failure modes.** Eclipse attacks (mitigated: diverse random sessions, anchor peers through multiple networks); traffic analysis by a global observer ⚠️ (onion routing raises the cost but does not solve a passive global adversary; out of scope, stated honestly); NAT/mobile churn (routine re-discovery).

### 3.4 Sync — daemon

**Purpose.** Keep the node's view of the world's logs current, and detect forks. Gossip: exchange log heads with peers, fetch missing chunks, compare what it hears.

**Reads/writes.** Reads logs and heads from peers; publishes its own node's heads (signed by the Signer); appends received entries to the Store.

**Policies.**

- *Anti-entropy.* Periodically reconcile logs with a random selection of peers — not only coupled ones. Random reconciliation is what makes forks eventually visible.
- *Witnessing is a one-line policy.* When syncing with a peer, sign their current head if asked (possibly for a fee) — the signed head citing the current tick, so the attestation is tick-anchored. A signature on a head is a timestamp: it sandwiches everything beneath it. There is no witness service and no witness election. **Witness weight** is applied at read time: a consumer evaluating how strongly a record is timestamped weights the signers by independence — as measured by the zone's dependence graph (§6.2), the same object the personhood machinery builds — and caps each signer at its **witness-weight cap**: the account's *maximum* personhood share across all zones, as attested by those zones' published manifests. (This cap handles a *single key* registered in many zones; the multi-key farming case is untouched by it — §11.2.)
- *Equivocation response.* Two conflicting signed heads from one key constitute a proven fork — an unforgeable, self-signed confession of misbehavior. Policy: the forking key's standing (§6.1) collapses to zero locally, the fork proof is gossiped, and the zone's personhood process is notified. Detection is automatic and local; *prevention* is impossible (this is the standard **fork-consistency** guarantee: history can be forked, but forks are detectable when the forked parties compare notes — and Sync is the comparing).
- *Spam control.* Sync effort for strangers is rate-limited and chargeable via the Materializer; newcomers without funds or standing get free minimum service through their voucher's node (§6.3).

**Subsumes.** The timestamping layer, the witness network, replication (the logs *are* the replicated data; merge = union of entangled entries).

**Failure modes.** Targeted eclipse keeping two forks alive for specific victims (mitigated as above); partition (logs diverge, then merge on reunion — order within each cone is preserved; cross-cone order during the partition is genuinely ambiguous, and anything depending on it must wait); spam (as above).

### 3.5 The Materializer — daemon and economic engine

**Purpose.** Turn requests into values, and resources into income. This is where the node participates in the economy. Its job, in one line: **given `(value wanted, confidence needed, deadline, budget)`, produce `(value, confidence achieved, receipt)` — and symmetrically, decide what to hold, pre-compute, and offer, at what prices.**

**Reads/writes.** Reads demand (incoming requests), price quotes and capability advertisements (claims, §3.6), standing weights (§6.1) from the Claims Engine's cache, epoch ticks and validation rules (§3.7), its own service history. Writes offers, receipts, delivery proofs, payment transfers, and its own service logs.

#### The request path

When a request arrives (from the owner or a stranger):

1. **Serve from Store** if the value is held and its confidence label meets the need (see step 4).
2. **Fetch** from a peer advertising the best expected price/loss — chosen using standing weights, so sources with good track records are preferred.
3. **Compute** locally, if recomputation beats the fetch price.
4. **Generate** — produce an approximate answer from a local model, *labeled with its confidence*. A generated completion is a different type of thing from canonical bits, and the type system enforces the distinction: `Exact(V)` never silently arises from `Approx(V, c)`. This label is the entire difference between memory and hallucination, and it is enforced by the compiler, not by policy. (The models are produced and calibrated by the same machinery as everything else: model weights are trained as paid compute jobs, and a model's confidence labels are themselves claims — scored continuously against first-party delivery outcomes, so a model that over-claims confidence loses standing and stops being consulted.)
5. **Decline or escalate** if nothing meets the confidence threshold within budget — including answering "unknown, at this confidence" when that is the honest product.

#### Verification: the attestation ladder, first instance

Verification is not a separate service; it is the Materializer's sourcing policy — a ladder of increasing certainty at increasing cost, climbed only as far as the stakes justify:

1. **Predicate checks** — disp types are predicates on results; checking is usually far cheaper than computing.
2. **Sampled re-execution** — k independent executors redo the job, drawn from tick-anchored randomness *after* delivery (so the fraudster can't predict which jobs are checked or by whom); fraud *on a sampled job* escapes only if all k collude on the same wrong answer (fraud on an *unsampled* job escapes regardless — which is why sampling rates are priced).
3. **Trace bisection** — on disagreement, binary-search the reduction trace to the first divergent step; a single step is machine-checkable by anyone running the evaluator. Self-refereeing: no third party, no consensus object.
4. **Full re-execution** — the top of the ladder.

Evidence from these checks is accumulated as **e-values** — a statistical framework that keeps false-positive control under adversarially-shaped evidence and arbitrary stopping rules, where classical sequential testing assumes well-behaved randomness. (Technical note: the e-values must be *conditional* — each valid given the evidence accumulated so far — or merged by averaging, which is always safe.) The control is on the false-positive rate, so an adversary delivering *subtly less* than promised, below the detection threshold, is handled by pricing instead: pay per verified unit delivered, so under-delivery is under-payment, not profit. How much checking to buy scales with what's at stake: a meme gets the sniff test, a treasury signature gets the top of the ladder.

#### The offer path

The node's economic intelligence is its *demand model*: a predictor of what will be requested, where, when — trained on **first-party service logs** (demand the node itself experienced; ground truth it does not have to trust anyone for). Public "coordination models" (shared predictors of prices and demand, funded as public goods, §8) are used for bootstrapping and cross-checking, but the node's own survival rests on its own observations — by design, so that the fast economy and the claims layer do not share a single point of failure. Prices are posted offers in the claims layer; under the alignment argument of the stack (priced at marginal shortfall cost, a node's profit equals the reduction in collective unmet demand its action caused — [Mathematical Core §1](../mathematical-core.md)), each selfish caching decision is a step of gradient descent on the network's collective error ⚠️ (the alignment theorem assumes price-taking and convex costs; lumpy disks and monopoly relays break both — real mechanism design is owed here, and the Materializer's pricing policy is where it will live).

#### Settlement, finality, and escrow: the attestation ladder, second instance

A payment's finality is a claim like any other — "this is the unique spend from this account" — and it gets the same ladder, climbed to a height the amount justifies:

- **Small:** accept on broadcast receipt (double-spend risk on a coffee-sized payment is priced in).
- **Medium:** accept once the transfer's log head is **witness-entangled** — cited by tick-anchored signed heads of a recipient-chosen set of independent accounts (§3.4). Backdating or forking now requires rewriting those witnesses' causal cones.
- **Large:** accept after **N epoch ticks** with no conflicting spend surfacing anywhere the gossip layer can see (N set by the recipient).

A *proven* double-spend (two conflicting signed spends) locks the sender's account and collapses their standing. Resolution is deterministic where the rule applies: **the spend cited by the earlier tick-anchored witness-entangled head wins** — with both "witnesses" and "ticks" read as the *sender's home zone's* (cross-zone clocks aren't comparable, §3.7; a recipient accepting cross-zone witnesses is pricing that risk themselves). A same-tick tie, or neither branch entangled, locks both pending the sender's signed revocation of one branch (a self-confessed forker's only exit) or a zone-quorum ruling (§5.6 — the residual case buys the consensus object, and is priced as such). The losing payee holds a bad debt — exactly the risk priced into the recipient's choice of tier, and the reason *payment adjudication inherits the witness layer's eclipse assumptions* (§9.1).

For strangers and machine-speed work, settlement uses **bilateral escrow** with explicit release paths (a 2-of-2 shared account is otherwise a funds-locking machine). At lock time both owners record the escrow's validation rule on-log — so every path below is *pre-authorized by both owners*, which is what reconciles programmatic release with "only the owners order spends" (an instance of bind-now-open-later, §2):

1. **Cooperative release** — both sign; the happy path.
2. **Timeout refund** — pre-signed at lock time, effective after T ticks; the escrow cannot be griefed into permanent lock-up.
3. **Predicate-gated claim** — the payee can claim early by presenting a machine-checkable delivery proof (a disp predicate over the protocol transcript, evaluated by the validation rule itself).
4. **Arbitrated option** — for deliveries that are *not* machine-checkable (e.g., subjective quality), the parties may opt into a 3-shared account with a named arbitrator (a consensus object among exactly three parties, priced in §5.2) — or, more cheaply, skip escrow and use credit lines (§6.3) with statistical settlement instead.

**Subsumes** (this list is the point): the storage market, the compute market, the bandwidth market, retrieval, caching, memoization, replication policies, generative memory (model-plus-residual storage is a storage policy), search (a search query is a request for index entries; routing it is descent on expected loss), and market-making across zones (a clearing node is just a Materializer holding inventory in two zones' pools).

**Failure modes.** Bad demand model → capital bleed (bounded: the node risks only its own resources); spam requests (rate-limit by standing; strangers pre-pay via micro-escrow); bandwidth settlement ⚠️ (per-byte micropayment to anonymous relays is unsolved in the literature — the workable shape here is pairwise credit lines with periodic statistical settlement via e-value audits, which means paid anonymous routing exists only inside the credit/coupling graph, §11.3); monopoly positioning (contestability: routes and storage are rivalrous, and entry is permissionless, §9.4).

### 3.6 The Claims Engine — batch jobs + query cache

**Purpose.** One mechanism, three instances. A **claim** is `(statement, stake, resolver type, horizon)`; a **score** is `f(claim, resolution, reference)`. The engine publishes claims, tracks them, resolves them, and maintains the node's views over them. (Payment mechanics and money flows live in §7; the instance/flow correspondence is: instance 1 ↔ flows 1+2, instance 2 ↔ flow 3, instance 3 ↔ internal.)

**Instance 1 — the truth market (human resolvers, long horizons).** Forecasters publish timestamped probability distributions on open questions (in the knitting circle: "will the merino shortage materialize by winter?"). Resolvers — capital holders who want the answer — privately, retroactively (whenever the evidence ripens, about events whenever they occurred), declare verdicts, and may discard hopeless questions. Verdicts follow bind-now-open-later (§2): hash-committed blind, revealed at the next tick, revisable until reveal, frozen at reveal — and **a committed-but-unrevealed verdict at the reveal tick is a visible default** (the resolver's standing takes the fall, and the payout proceeds under a stated default rule, §7). A forecaster is paid for moving the resolver's belief toward the eventual verdict, relative to a reference (references and enforcement: §7). The scoring rule is strictly proper *for predicting the verdict*: a forecaster who believes the resolver will conclude `r` maximizes expected payment by reporting their honest distribution over `r`, and expected payment equals the Bregman-divergence improvement over the reference — for the log score, a KL improvement.

Two qualifications, stated where an implementer will see them:

- The properness guarantee covers *predicting the verdict*, not *being right about the world*. Truth-tracking is a property of the whole loop (who resolvers are, how they judge, whether the loop stays reality-coupled), not of the scoring rule alone.
- The guarantee assumes the verdict is exogenous to the report — so resolver assignment is drawn mechanically, and a forecaster cannot choose their judge. (Also: payouts are drawn from finite budgets, so the rule is proper *below the budget cap*; forecasters with extreme, far-from-reference beliefs see flattened incentives at the tails, and budgets should be sized with that in mind.)

Echoing the reference pays exactly zero. There is no oracle and no resolution instant.

**There is also no displayed consensus, and that choice is the reflexivity defense, so it gets a paragraph of its own.** A *reflexive* market is one whose outputs feed back into the thing it measures; the failure mode is a **dark room** — the system's model of the world detaches from the world and keeps confirming itself. The classical worry is that a canonical displayed consensus ("the market's current answer," shown to everyone) invites exactly this: social-influence experiments — most prominently Lorenz et al. 2011 — found that showing everyone the group's current estimate destroys collective accuracy while inflating confidence; later work contested the generality but consistently finds the *centralized-display* condition to be the dangerous one. So this design simply never builds the dangerous topology: every node computes its own aggregates over the public logs, weighted by its own standing weights, and "what the network thinks" is a function you run, not a number you watch.

Two honest limits on that defense. First, it is a *convention*, not a mechanism: the logs are public on purpose, so anyone can run a popular third-party aggregator, and a Schelling-point dashboard can recreate the dangerous topology socially. Second, the same channel exists one level down: if everyone bootstraps from the same few published standing summaries (§6.1's borrowed views), herding migrates from the forecasts to the *weights on* forecasts — and echo-discounting then amplifies it, because everyone's weights agree so nobody looks correlated to anyone. So the actual defense is measurement: per-epoch **drift audits**, run by this engine, watch both layers — for objectively-resolvable questions, shrinking diversity and rising confidence at flat accuracy; for subjective ones, only the diversity/confidence axes exist (which alarm on herding whether the crowd is right or wrong); and across nodes, *convergence of standing weight-vectors* toward a common set. ⚠️ The audits' *temporal precedence* — that these signals fire before accuracy visibly degrades — is a hypothesis to be validated by simulation (§11.5), not an established result.

**Instance 2 — the service-quality layer (machine resolvers, short horizons).** "Executor E will deliver value V by deadline D" is a claim resolved by a delivery receipt and a verification trace — same engine, mechanical resolution. The Materializer's confidence in counterparties is exactly this instance's scoring output.

**Instance 3 — the demand model (first-party resolver).** The node's own predictions about its future service demand, scored against realized demand from its own logs. This is what the Materializer prices against (the offer path, above).

**Standing** (the perception-side identity, §6.1) is a view computed here.

**Reads/writes.** Reads logs (forecasts, verdicts, receipts, service records) and zone state (budget escrows, question funding, personhood shares). Writes its own claims, verdicts (commit-reveal), and payments. Maintains a query cache consulted by the Materializer (standing for source selection) and by human UIs (blind verdict recording, forecast dashboards).

**Failure modes.** The deep ones (reflexivity, capture, correlation gaming) are treated in §6 and §9; at the process level: log volume (views are incremental; questions have lifecycles and close), resolver apathy ⚠️ (unanswered questions earn nothing and are eventually discarded — a real cold-start risk for the question supply), and UI risk (the blind-resolution interface must actually withhold aggregates at verdict time; a leaky UI silently reopens the reflexivity channel — and §3.6's two paragraphs on display topology are why that matters).

### 3.7 The Zone Client — daemon-ish

**Purpose.** The node's interface to the one thing that requires agreement: its zone. **Everything in the system that needs consensus lives behind this process's API.** Auditing the centralization of the whole design means reading this one directory.

A **zone** is a densely-coupled neighborhood of nodes (they trade, witness, and vouch for each other) that shares: a currency pool, a basic-income drip, a personhood registry, and a small quorum for the few decisions that need ordering. A node may belong to several zones (⚠️ the multi-zone farming attack — §11.2).

**Responsibilities.**

- *Epoch ticks.* The zone's quorum periodically signs an "epoch N begins" heartbeat. Ticks are the zone's clock: demurrage is computed against them, verdict reveals are scheduled by them, escrow timeouts and payment finality rules count them, and the drip is paid per tick. This is the honest cost of demurrage: whether "balance covers payment" is true depends on how much has decayed, i.e., on what time it is, and two validators at different instants disagree unless they share ticks.
- *Transfer validation.* A payment is valid if the sender ordered it (their signature chains it after their previous spends) and their balance — computed from transfer logs + demurrage against ticks — covers it. No global ordering anywhere: your spends are ordered by you. Finality policy lives in §3.5.
- *Epoch manifests.* Once per epoch the quorum agrees a **manifest**: the pool manifest (live capacity commitments backing the currency, §8), the post-demurrage **balance map** (so pruned history stays auditable, §3.2), and the input manifest for personhood-share computation (which logs, which cutoff, which estimator version — identified by hash). All computation over manifests follows agree-inputs-not-answers (§2).
- *UBI drip payouts.* Each epoch: decay proceeds split — a fraction φ (governance-set) goes to the communal pot (§7), and the residual is the drip pool; each account's drip = drip pool ÷ measured population × that account's personhood share. Paid from the zone's pool account (a quorum-operated account — one of the few genuinely shared accounts).
- *Voting.* Quadratic-preference ballots (caring more counts more, at quadratically increasing cost):
  1. Credits are **blind-issued** by the quorum against personhood shares (Chaumian blind signatures) in *fixed denominations* — one credential package per share-unit per epoch, so the quorum sizes issuance without learning which account received it.
  2. The credential embeds a secret known only to the voter, from which the voter derives, per election, a deterministic **nullifier** — a pseudonymous tag that marks ballots as coming from one credential without revealing which.
  3. A ballot attaches t credit tokens and counts √t votes; spending a token requires a zero-knowledge proof of the credential secret (so tokens are *not* transferable bearer instruments: a buyer would need the secret itself — and since the same secret backs the voter's credentials across elections, selling means handing over one's entire voting identity, present and future). Tokens carry serial numbers in a quorum-maintained spent-set; double-spends are rejected at tally.
  4. **Re-voting is allowed until the close, and only the latest ballot under a given nullifier counts** — so a voter coerced in the open can re-vote in private.
  5. After the close the quorum tallies and publishes the full transcript (every token's validity, every nullifier's final ballot, no account linkage).
  
  Honest limits: receipt-freeness is partial (a voter can still show a buyer which ballots they cast); the stronger fake-credential designs (the JCJ/Civitas family, needing an in-person registration ritual) are a named upgrade path, not the shipped default; and the sale-disincentive in step 3 is an argument, not a proof (§11.7).
- *Contested allocation.* Two parties want the same scarce name, the same auction slot, the same resource at the same time — including unresolved double-spend adjudication (§3.5): this is the one place needing real ordering, and it goes to the zone's BFT quorum (a small committee reaching Byzantine-fault-tolerant agreement — tolerating up to a third malicious members). Names mostly dissolve instead (self-certifying identifiers need no registry; human-meaningful names are the rare contested case).

**The quorum itself** ⚠️: a small committee, seated by personhood-weighted sortition from zone members, rotating per epoch, every decision signed and published. The zone's core trust assumption lives here and only here: **more than two-thirds of the quorum's personhood-weighted seats are live and non-colluding.** Mitigations: all outputs are verifiable or accountable from logs (a quorum that lies about arithmetic is exposed by anyone recomputing it; a quorum that stalls ticks is visible to everyone), membership is contestable through governance, and exit to other zones disciplines a bad quorum over the long run. Quorum seat selection is the one component that cannot be reduced to verifiable compute, and its design is an open problem (§11.1).

**Failure modes.** Tick withholding (liveness: rotating proposers, any-member fallback proposal, ultimately **zone fork** — expensive but possible: on a fork, each successor community recomputes all views from the portable logs, and contested succession is *adjudicated socially, not by any quorum* — the thing in dispute is which quorum is legitimate, so no quorum can rule on it; users, clearing nodes, and markets pick a successor, which is to say exit does the adjudicating); quorum capture (the zone's stated trust assumption — mitigated by sortition, rotation, transparency, exit); cross-zone tick skew (zones tick independently; cross-zone contracts use explicit tick-pairs — and cross-zone witnesses are un-comparable by construction, §3.5).

---

## 4. How the processes depend on each other

```
                 ┌────────┐
                 │ Signer │ (pure-function library: signs for everyone)
                 └───┬────┘
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   ┌────────┐   ┌───────────┐   (evaluator/hash libraries)
   │ Store  │   │ Transport │
   └───┬────┘   └─────┬─────┘
       │              │
       │              ▼
       │          ┌───────┐
       │          │ Sync  │
       │          └───┬───┘
       │              │
       ▼              ▼
   ┌──────────────────────┐
   │     Zone Client      │  (needs: Store, Sync, Signer)
   └──────────┬───────────┘
              │ ticks, validation rules, manifests, shares
              ▼
   ┌──────────────────────┐
   │     Materializer     │────────► Store (retention directives)
   └──────────┬───────────┘────────► Sync  (paid sync effort)
              ▲
              │ standing (view cache — degradable:
              │  cold-start fallback, §6.1)
   ┌──────────┴───────────┐
   │     Claims Engine    │  (needs: Store, Sync, Signer;
   └──────────────────────┘   reads zone state from logs)
```

All arrows are *data* dependencies, and all stateful data flows through logs (the two cache-query edges — Materializer reading standing, UIs reading views — are read-only queries of rebuildable caches per §2). There are no cycles of authoritative state.

The bootstrap order is the topological sort of the *load-bearing* edges of this graph (the standing edge is degradable — the Materializer runs on cold-start standing until the Claims Engine exists), and it doubles as the network's genesis sequence:

1. **A live peer** (Signer, Store, Transport, Sync): can hold data, talk privately, keep tamper-evident history.
2. **A minimal zone** (Zone Client): a vouching-seeded quorum issuing ticks and manifests; transfers and demurrage become meaningful (denominated in-kind at first — §8's genesis rule).
3. **A real economy** (Materializer): storage, compute, and routing sold for credit; the node can earn.
4. **The claims layer** (Claims Engine): starts in play-money mode (seed track records, calibrate — another dumb default, §1), then live budgets attach.

This ordering is a coherence check on the whole design: nothing needs the thing below it before the thing above it exists.

---

## 5. The consensus budget

Agreement is the scarce resource. This section spends the entire budget, item by item, with the theorem class that justifies each entry. The rule: **no invariant may be implemented with more coordination than its class requires** — excess coordination is treated as a bug, the way excess mutual exclusion is treated as a bug in concurrent code. ("Consensus number" is Herlihy's measure of an object's synchronization power: the maximum number of processes that can reach agreement using only that object; 1 means "no real agreement needed.")

| # | Object | Coordination required | Why that's the floor |
|---|---|---|---|
| 5.1 | Single-owner payments | **None.** Sender orders own spends; Byzantine consistent broadcast suffices (all honest observers eventually see the same single history per account) | Single-writer accounts have consensus number 1 (Guerraoui et al., PODC 2019). Caveats below the table. |
| 5.2 | Bilateral escrow, arbitrated escrow, all-k recovery circles | **The k owners only** (k=2 typical; k=3 with an arbitrator) | k-shared accounts have consensus number exactly k (same paper) — so shared accounts stay small and named, always. (k-of-n threshold circles are not this object; see §3.1 for their degradation path) |
| 5.3 | Demurrage | **Epoch ticks** (one quorum signature per epoch per zone) | Decay changes spending power without owner action, so validity is time-dependent; ticks make time a shared fact |
| 5.4 | Timestamps | **None** (hash-entanglement) + gossip for fork detection | Causal order within a cone is free (Lamport); forks are detectable, not preventable (fork consistency); wall-clock time exists only via ticks. No freshness lower bound ⚠️ (a hash made today can be cited next year — entanglement bounds *order*, not *age*; age-sensitive consumers must require recent citation) |
| 5.5 | Personhood shares, pool valuation, balance maps, drip amounts, vote tallies, communal-budget references, escrowed payouts | **Input agreement only** (epoch manifests) | The computations are deterministic over public inputs; verifiable compute does the arithmetic — agree inputs, not answers (§2) |
| 5.6 | Contested allocation (names, auctions, unresolved double-spends) | **Zonal BFT quorum** | Choosing one winner among concurrent claimants *is* consensus; cannot be had for less. Kept rare: names mostly self-certify. (Fork succession is *not* here — it is adjudicated socially, §3.7) |
| 5.7 | Untraceable payments | **Costs consensus** (2 for the starvation-free variant; worse for others) | Adding sender-untraceability provably raises the consensus number (Cachin et al. 2026). Their linear object gives a consensus-number-2 construction, which — this document's inference, not the paper's — maps onto a 2-shared/zone object here. Hence per-zone choice: pseudonymous-traceable transfers (free) + onion privacy by default; full untraceability where a zone votes to pay for it |

§5.1's caveats, outside the table for readability: liveness is owner-conditional; finality is a recipient-chosen confidence tier with a stated adjudication rule (§3.5), not an instant fact; there are no pull payments (only the owner can move funds); and key compromise is total without a recovery circle.

Not in the budget: global consensus of any kind. There is no blockchain, no global ordering, no planet-wide agreement, anywhere in the design.

---

## 6. Identity: three objects, three mathematics

The previous design generation used one statistic (signed correlation of behavior) for everything identity-flavored, and it broke in predictable ways: contrarian puppet pairs (one account zigs, one zags, both one hand) were counted as *more* independent than honest strangers; issuance accounting didn't sum; and tight-knit honest communities were disenfranchised in the name of inference. The repair is to answer three different questions with three different objects.

### 6.1 "Does listening to you make me smarter?" → **standing**

Per-observer, per-topic weights over informants. Fully subjective, computed locally, never agreed upon.

- **Sources, in order of strength.** (a) *First-party service and verification outcomes*: every delivery the Materializer checks — every sampled re-execution, predicate check, bisection — is a scored outcome about a counterparty; this data exists for every node, not just specialists. (b) *Payment-scored information*: the Claims Engine's payment records — for resolvers proper, and optionally for ordinary consumers paying small per-forecast amounts (which is just flow 1 with a small budget, §7). (c) *Priors*: vouching, locality, hardware commitment (a physical device that can only sign one history, e.g., a secure-enclave counter — an optional cold-start aid, not a load-bearing assumption, §9.1), age of log, and *borrowed views* (coupled peers' published standing summaries, used as priors and displaced by first-party data as it accrues — borrowed views are a bootstrap, never a steady state, and their herding risk is audited, §3.6).
- **Echo discounting:** correlated informants genuinely teach you less; standing weights downweight shared information (the statistically principled version of this exists and is battle-tested in forecasting tournaments — the partial-information aggregation framework of Satopää, Ungar, and collaborators). For *beliefs*, discounting echo is accurate inference.
- **Cold start:** weak priors plus cheap low-stakes interactions build history quickly.

### 6.2 "Are you a separate person?" → **personhood share**

A zone-agreed number in `[0, 1]` per account, gating *only* per-person entitlements: the UBI drip, vote credits, witness-weight caps, and eligibility for quorum sortition. **It does not gate earning** — anyone may sell storage, compute, and bandwidth immediately, because delivered work is machine-verifiable and needs no trust. (Permissionless economy at the bottom; gated entitlements at the top.)

- **Measured quantity: dependence, not correlation.** What makes two accounts one person is shared control, and shared control shows up as statistical *dependence* (their behaviors predict each other) regardless of whether they act alike, act opposite, or act in any scripted nonlinear relation. A contrarian pair is maximally dependent and collapses to one share. (The previous generation's signed-correlation measure missed exactly this and was gameable for free: negation is deterministic, and determinism is maximal dependence. The estimator must therefore be a true dependence measure — **distance correlation or a kernel independence statistic (HSIC)**, which is zero *if and only if* the streams are independent, including nonlinear coupling — not absolute correlation, which nonlinear scripts evade: corr(X, X²) = 0 for symmetric X.)
- **Estimation: pairwise, sparse, local — and public-input only.** "Do these two accounts behave like one hand?" is a two-party question, estimated from the pair's public behavioral logs by anyone. Only pairs with a social reason to be compared — vouching edges, dense trading, flags — are ever estimated: the object is a sparse dependence graph, not a global matrix. Two consequences. First, *un-estimated pairs contribute nothing*: an edge that isn't estimated doesn't exist in the graph, and an account whose neighborhood is too thin to estimate stays on the newcomer ramp (low share) until coverage accrues. Second, *private streams confer no share lift*: a two-party secure computation over private data could tell the two participants their own dependence statistic, but its output is self-reported, not a deterministic function of public inputs (§5.5) — and a Sybil holding both keys would simply report independence. So private-edge estimates are allowed for the participants' own use, and worthless for issuance.
- **The household correction ⚠️, honestly scoped.** People who share infrastructure (a family's NAT) correlate through shared network conditions, and people who share *lives* (spouses, housemates, close collaborators) are behaviorally dependent through shared events, timing, and information diet — without any shared control. The estimator conditions on network proximity, which covers the first case and not the second. So the design's line — *evidence is discounted by correlation (private inference); scarcity is discounted only by demonstrated shared control* — is an aspiration about the estimator, not a fact: "two friends who genuinely agree" keep two full shares only if the estimator can tell agreement from control on socially close pairs, which is exactly the open problem (§11.10). Until it is answered, some honest pairs will be merged — the mitigation is the published statistics and the governance appeal path, and the harm is a reduced share, never a ban.
- **The threshold cliff ⚠️.** Dependence just below the threshold means no edge, means separate clusters, means full shares — so the cheapest farm strategy is not evading the estimator but *tuning coupling to sit just under the cutoff*, and the payoff is discontinuous there. The threshold is the weakest joint in the construction; threshold choice and soft-edge refinements are part of §11.6.
- **Validation without ground truth.** There are no personhood labels to test against, so the estimator earns its complexity (§1) in two scoreable ways: (a) *held-out prediction* — does account A's behavior improve prediction of account B's held-out behavior, beyond the proximity prior alone? (a proper, scoreable quantity); (b) *planted calibration* — zones plant known-controlled sock-puppet pairs and known-distinct pairs (pre-registered) and measure the estimator's separation of the two. Both are continuous audits, not one-time checks.
- **Assembly, concretely.** Once per epoch, per the quorum's input manifest (log cutoff, estimator version hash, edge set):
  1. Estimate each edge's dependence with the manifest-pinned estimator (distance correlation / HSIC of behavioral residuals, shrunk toward the proximity prior).
  2. Take the connected components of the thresholded dependence graph — the **clusters**.
  3. Each cluster's total share = its **effective size**: for the two clean cases this is exact — a mutually fully-dependent cluster is worth exactly 1, genuine independents count in full — and for partial structure (a chain: A–B dependent, B–C dependent, A–C independent) the shipped default is the *participation ratio of the cluster's dependence matrix* (a standard spectral effective-rank measure: sum of eigenvalue magnitudes, squared, over sum of their squares — 1 for a clique, cardinality for the empty graph, sensible values between). Split the cluster total **equally among members**, and cap every account at 1.
  
  What is *proven* here: for clique-structured dependence, equal split within clusters and cluster totals summing to the measured population are exactly the Shapley values of the coalitional game "coalition value = effective independent size" — the accounting sums, a farm of k fully-dependent accounts totals exactly one share (1/k each), and no estimation fluke mints a super-person. What is a *tractable default*: the spectral effective size for non-clique clusters (chains, partial overlap), whose game-theoretic justification is open (§11.6).
- **Defense philosophy:** honest arms race, not proof. Per-dimension evasion is documented to be cheap. So shares *ramp in slowly* (new accounts start near zero and individuate over months of separately-maintained, individually-rewarded work), aged identities are expensive by construction (long hash-entangled histories cannot be manufactured on demand), vouching puts the voucher's stake at risk (§6.3), and any collective estimate must beat the dumb default on the validation criteria above before it is used (plug-in optimal weights from estimated dependence structures are a known error-amplifier, the same pathology as in portfolio optimization).

### 6.3 "Do I win when you win?" → **trust** (coupling)

The pairwise record of shared fate: trades completed, stakes held, vouches outstanding, history survived. Drives zone boundaries, exchange rates, delegation choices, and credit lines.

- **A vouch, defined once** (it is used all over the design): a signed declaration, by an established member, that a specific account is a distinct person they are prepared to be harmed by — operationally a package of four things: a *bandwidth grant* (the newcomer's initial sync service, §3.4), a *stake* (the voucher's own shares, slashable if the vouchee proves to be a puppet), a *dependence-graph edge* (§6.2 — the pair is guaranteed to be estimated, which is what lifts the newcomer off the ramp), and a *standing prior* (§6.1). Vouching is the zone's front door, and its price is the voucher's skin.
- **Path composition uses capacity semantics:** a vouching chain carries as much reliance as its weakest link can *stake* (Levien's attack-resistant trust metrics, the Advogato model; credit-network liquidity results, Dandekar et al. — value composing along trust paths has real theorems). What does *not* compose along paths: dependence and epistemic confidence — you cannot route-estimate whether two distant strangers are one person; that requires observing their joint behavior.
- Trust is also the graph along which anonymous paid routing exists (§11.3's bandwidth limitation) — the credit graph is the routable graph.

---

## 7. The markets, as flows of money and evidence

Three payment flows keep the claims layer alive; a design that draws only two of them starves. (An earlier iteration of this design drew two.)

**Flow 1 — resolvers pay forecasters** (per channel, per question), for improvement over a *reference* belief. Two things must be specified separately: the reference, and the enforcement.

*The reference* depends on whose money it is, and the distinction is load-bearing:

- **Own-money budgets:** the reference is the resolver's own lagged aggregate (their frozen prior: personal, and ungameable *by the forecaster*; the resolver who distorts it only degrades their own information).
- **Communal budgets** (governance-funded public questions): the reference must be mechanical — pinned in the question's funding manifest (a §5.5 object) as equal weights over forecasters with a minimum track record, or a manifest-named weight vector. Why: a resolver controlling both the reference and the verdict of a *communal* budget could collude with a forecaster — freeze a garbage prior, "predict" the obvious answer, split the maximal improvement payout — an extraction channel from communal funds, closed only by taking the reference out of the resolver's hands. Note what this costs: a small, public, agreed reference is a priced exception to the rule that weights are never agreed (§6.1), and the design spends it knowingly, per communal question.

*The enforcement* has two tiers:

- **Reputational** (baseline): the obligation is declared in the session type, so default is publicly provable; standing consequences do the rest. *Payment-shaving* — a resolver biasing their verdict to shrink legitimate payouts — is blunted by flow 2 and by the reputational cost of verdicts that visibly diverge from evidence.
- **Escrowed** (optional, buys better forecasts): the resolver locks the question budget in the zone's pool account at posting; at the reveal tick the payout vector is computed deterministically over public logs (§5.5) and released, no resolver action required. The liveness hole is closed too: a committed-but-unrevealed verdict at the reveal tick is a visible default, and the escrow pays out under the manifest-pinned default — split equally among timestamped forecasters, capped at budget, residual to the pot — so withholding a verdict can never reduce what the resolver pays.

**Flow 2 — zones pay resolvers** (reality-coupling bonuses): resolvers earn bonuses for verdicts that hold up. What "holds up" can mechanically mean without a truth oracle ⚠️: (a) where machine-checkable later evidence exists (a measurable quantity resolves), the bonus scores the verdict against it; (b) where it doesn't, the bonus scores **self-consistency** — a resolver's frozen verdict against their *own* later frozen verdicts on related questions and against their continued willingness to allocate on the rankings their verdicts produce (a resolver who disowns their own history forfeits the bonus). The naive version — score against the later crowd — would rebuild exactly the herding this design exists to prevent, and is rejected. The general case (bonus ground truth for subjective questions) is an open problem (§11.4); the flow exists in full mechanical form for the objective subset and in partial form elsewhere, alongside the always-on incentive that resolvers consume their own rankings.

**Flow 3 — everyone pays the Materializers** (fast economy): storage, bandwidth, compute priced per verified delivery. Machine-resolved claims; bilateral escrow for strangers; credit lines for regulars.

Who funds public questions nobody privately wants answered? Governance allocates from the communal pot (the φ fraction of demurrage proceeds, §3.7), guided by the market's own value-of-information estimates. The recursion (governance needs the market needs governance) is acknowledged and bridged by starting conservative; it is not eliminable ⚠️.

One rule above all, for anything the market touches: verdicts are **counterfactual contrasts** ("did X help, *relative to no-X*?"), hopelessly confounded questions get discarded, and no market estimate is ever wired mechanically into an allocation ([Futarchy and Causality](../futarchy-causality.md) — the full argument for why a market is an evidence instrument, never a decision rule).

---

## 8. Money, at the service level

- **Pool shares, mechanized.** A zone's money is shares in its members' *committed productive capacity*. Mechanically: (a) a member posts a **capacity commitment** to their log — "T bytes of storage for D epochs," provable ongoingly by proof-of-retrievability challenges (random spot-checks anyone can issue; with erasure-coded distinctness requirements so the same bytes can't back two commitments), or "C reduction-steps of compute per epoch" — compute and bandwidth are *bonded promises adjudicated on delivery failure*, since idle capacity is only provable by using it; (b) the commitment is bonded — a failure to deliver slashes a posted escrow and is a visible default (at genesis, when nothing else exists, bonds are denominated in other zones' shares or in-kind against *different* capacity than the one being committed — a bond denominated in the claim it underwrites is not a bond); (c) the quorum's epoch pool manifest (§3.7) ratifies the set of live commitments backing this epoch's pool; (d) shares issue to committed members per the manifest — a deterministic computation over public inputs (§5.5). The supply path is then: issuance grows as new commitments enter and shrinks as they expire, while the melt continuously recycles existing shares into the drip — dilution from new commitments is governed by the manifest process, i.e., by the same verifiable-compute-plus-quorum-inputs machinery as everything else (whether issuance should actively track capacity growth is a monetary-policy question for zone governance, not a mechanism).
- **Why anyone accepts shares (the acceptance anchor).** Shares are the *required settlement medium for capacity redemptions against pool members*: claiming committed storage, compute, or bandwidth from the pool requires shares. Anyone who wants the zone's services needs them; non-delivery against a valid redemption is a slashable default. (This is the same anchor as tax-driven state money, at zone scale: there is something you can only buy with this unit.)
- **Genesis denomination (the valuation bootstrap).** At genesis there are no prices, so commitments are denominated **in-kind**: the unit of account is initially the basket itself (one share ≈ a fixed bundle: so many byte-months, so many reduction-steps, so much bandwidth-capacity). Prices in shares emerge as the Materializer market clears; the basket anchors them. There is no circularity once the unit is the basket rather than a fiat abstraction. (The knitting circle's first zone: the circle plus its storers commits the first byte-months, and the first shares buy exactly those.)
- **Demurrage.** Idle share balances melt per tick (the proceeds split: a governance-set fraction φ to the communal pot, the residual to the drip — §3.7 — which pulls everyone toward the equal share). Steady state: wealth = baseline + (sustained net contribution) ÷ decay rate. What you pile up melts; what you keep doing persists.
- **The floor, honestly scoped.** There is no network-wide parameter (that would contradict §1). What exists:
  - *A convention*: a shared prior for the minimum decay rate — a Schelling point (a default everyone can coordinate on without communicating).
  - *A sensor*: each zone's governance watches the same globally-readable claims logs and computes its own view of budget concentration in the truth market (no agreement needed; it's a view) — alarm level is the **capture threshold** (the budget share beyond which one resolver's verdicts dominate forecaster incentives).
  - *An actuator*: inter-zone reserve policy — zones refuse to hold as reserves the shares of zones whose decay rate falls below the convention. A haven zone (low decay, attracting fugitive capital) finds its shares illiquid at every boundary.
  - *A shipped configuration*: the degenerate one — a fixed conventional decay rate, no feedback loop. ⚠️ The enforcement is only as strong as boundary liquidity, the concentration signal lags by months, and the loop's stability region is unmapped — the controller is an upgrade pending simulation (§11.5). Fast inner defense, active from day one: burst-spend caps on resolver budgets.
- **Exchange rates.** Discovered at boundaries by clearing nodes (Materializers holding inventory in two zones), anchored by resource arbitrage — firmly for storage and compute (a byte-month is a byte-month anywhere; arbitrage moves capacity), weakly for bandwidth and latency-bound service (you cannot arbitrage a millisecond across an ocean — rates there float on thinner anchors) — and composed along paths with spreads: path payments, made atomic by chaining predicate-gated escrows (§3.5) hop by hop. ⚠️ Thin-boundary manipulation (low-volume quote gaming) remains partially open; boundary reputation is the sketched defense.
- **Newcomers.** Vouched in locally (§6.3's vouch package); starting share bounded by vouch strength; drip ramps toward a full share as the behavioral signature individuates. A ramp, not a head start.

---

## 9. Security model

### 9.1 The trust assumptions, all of them

1. **Zone quorum:** >2/3 of personhood-weighted seats live and non-colluding, per zone per epoch. (The one irreducible assumption; every quorum output is either publicly verifiable or publicly accountable.)
2. **Fork detection and witness circulation work:** log heads circulate widely enough that equivocation is eventually seen and witness-entanglement is eventually achievable. (Transport diversity; §3.3–3.4. Payment *adjudication* inherits this too, §3.5.)
3. **Hash/signature primitives hold.** (Standard.)
4. **Mostly-shared reality:** on most questions, resolvers eventually agree — the truth market's target exists. (An assumption about the world, kept plausible by keeping the claims layer globally readable.)

Everything else is mechanism, audit, or cost floor. Notably absent from the assumptions: any estimator's correctness (estimates must earn their complexity, §1/§6.2, and every weight is capped), and any hardware (secure-enclave commitments are an optional cold-start accelerant for standing priors, not load-bearing).

### 9.2 Attack surface, per process

- **Signer:** theft/loss/coercion → recovery circle, hardware keys.
- **Store:** toxic content ⚠️, bit-rot, exhaustion → provenance policies, integrity checks, paid retention shedding; checkpoint fraud (inflated pruned history) → manifest-committed balance maps (§3.2).
- **Transport:** eclipse, traffic analysis ⚠️ → peer diversity, onion routing; global passive adversary out of scope.
- **Sync:** targeted fork eclipses → random anti-entropy; proven-fork response (standing zeroing).
- **Materializer:** demand-model bleed, spam, bandwidth-settlement gaming ⚠️, non-convexity of real resources ⚠️ → own-capital-only risk, prepaid strangers, credit-graph routing, contestability. Double-spend attempts → tiered finality with a stated adjudication rule (§3.5); escrow griefing → pre-signed timeouts and predicate claims.
- **Claims Engine:** reflexivity (no canonical display as convention + blind recording + per-epoch drift audits over both the forecast and standing layers, within their stated limits), reference-gaming of communal budgets (manifest-pinned mechanical references, §7), payment-shaving and verdict-withholding (flow 2, escrowed payouts with default rules), cold-start apathy ⚠️.
- **Zone Client:** quorum capture/stall (sortition, rotation, verifiable outputs, exit), household false positives (published statistics, governance appeal — §11.10), multi-zone farming ⚠️ (§11.2), vote-token markets ⚠️ (§11.7), estimator arms race (ramp, caps, earn-your-complexity).

### 9.3 The five deaths, mapped to mechanisms

The stack chapters name five failure attractors the whole design is written against; here is where each is bounded in this document:

| Death | Mechanism that bounds it |
|---|---|
| Believing itself (reflexive dark room) | No canonical consensus display; blind commit-reveal; per-epoch drift audits over forecasts and standing weights (hypothesized early-warning signals, pending simulation validation) |
| A thousand faces (Sybil) | True dependence measures (not correlation), sparse pairwise estimation, Shapley-consistent accounting, caps, slow ramp, time floors, planted-pair calibration |
| Wealth pools into a truth weapon | Demurrage + concentration-sensing reserve policy + burst caps *bound* stock concentration (steady-state stock is bounded; sustained-flow advantage is watched by the same sensor); pool-share money resists hoarding |
| Exit becomes impossible | The one structural rule (§2): all state is logs; all views recomputable; portability is a lint rule over the codebase |
| Acting on correlation as if cause | Verdicts are counterfactual contrasts; hopeless questions discarded; market output never wired mechanically into allocation (§7) |

### 9.4 Why the commons holds

Extraction is possible only where exit is expensive or entry is blocked. Entry is permissionless (anyone can earn by verified work), exit is free (all state portable), and every position of leverage (clearing nodes, quorum seats, hubs) is contestable by rivals with the same tools. The design's name for the disease it cannot otherwise treat is "extraction without contestability," and the entire §2 rule is the treatment.

---

## 10. Scaling and resources ⚠️ (first-pass, unmeasured)

- **Log growth.** Views are incremental indexes; raw logs are prunable behind checkpoints (§3.2) — with the tension that pruning raw history degrades re-verifiability of old standing. Policy: claims logs (forecasts, verdicts) are small and kept; bulk data is chunked and retention-priced.
- **Sync cost.** Proportional to coupled logs × update rate; light clients sync only what their views need.
- **Standing computation.** Per-observer over subscribed informants — O(informants × topics), not O(network²); the sparse dependence graph bounds personhood estimation to social-degree-many pairs per node.
- **The Materializer's market** is the resource hog by design (that's the economy); everything else is bookkeeping.

No measurement backs this section yet; it is a sketch of the intended shape, flagged accordingly.

---

## 11. Open problems, in rough dependency order

1. **Quorum seat selection.** Personhood-weighted sortition from a personhood registry that itself depends on... the whole system. Cold-start seats come from the vouching graph; the steady-state selection mechanism (and its capture-resistance) is the one component that cannot be reduced to verifiable compute and is therefore the top design problem.
2. **Multi-zone farming.** One person, k zone memberships under k different keys: k drips, k vote-credit endowments, and — because witness caps are per-key (§3.4) — k full-weight witness identities, which is load-bearing against payment finality (§3.5), not just the drip. Partial mitigations: linked accounts claiming in two zones produce a detectable equivocation; each zone's ramp means k memberships cost k separately-vouched, separately-maintained behavioral identities (most of the cost of being k people). Residual attack admitted; needs either cross-zone claim semantics or an honest cost analysis showing the attack is uneconomic.
3. **Bandwidth settlement.** Paid anonymous routing exists only inside the credit graph (§3.5, §6.3). Per-byte settlement to strangers is an open problem *in the literature*, not just here.
4. **Reality-coupling ground truth (flow 2's regress).** For subjective questions, "verdicts that hold up" has no mechanical definition that doesn't rebuild an oracle or a conformity game (§7). The flow is specified for the objective subset and partial (self-consistency) elsewhere; the general case is open — as is its funding bootstrap (governance money before governance is legitimate).
5. **Controller stability, twice over.** Both the reserve-policy feedback loop (§8 — shipped degenerate, as constants) and the drift-audit precedence hypothesis (§3.6) need agent-based simulation before activation.
6. **Personhood assembly refinements.** The game-theoretic justification of spectral effective size for non-clique clusters (§6.2); the threshold cliff (soft edges instead of a hard cutoff); richer characteristic functions; the approximation complexity of richer games (the clique construction is tractable by design; general Shapley computation is not).
7. **Voting upgrades.** The sale-disincentive (credential-secret reuse) is an argument, not a proof; receipt-freeness beyond partial (the JCJ/Civitas fake-credential family needs an in-person registration ritual — a real operational cost a zone must choose to pay).
8. **Non-convex substrate pricing** (lumpy disks, monopoly relays): the alignment theorem's assumptions fail where real capital is lumpy; mechanism design owed.
9. **Toxic-content policy for a paid storage network.**
10. **Household/institutional dependence false positives** — the socially-close-pairs problem (§6.2): estimator conditioning beyond network proximity, audit methodology, and the appeal process.
11. **The dependence estimator's finite-sample arms race** — asymptotically "faking k ≈ being k," but per-dimension evasion is documented cheap; the ramp and the caps carry the weight meanwhile.
12. **Global passive traffic analysis** — out of scope for this design; stated, not solved.

---

## Appendix A · Glossary (one line each)

- **Log** — append-only, signed, hash-entangled record; the system's only data structure.
- **View** — a pure function recomputed over logs (balances, standings, shares); never held as authoritative state.
- **Zone** — a densely-coupled neighborhood sharing a currency pool, a drip, a personhood registry, and a quorum.
- **Epoch tick** — the quorum's signed heartbeat; the zone's clock.
- **Epoch manifest** — the quorum's per-epoch agreed input set: pool commitments, balance map, estimator pins; the routine object of consensus (the exceptional ones are §5.6).
- **Claims engine / claims layer** — the one market mechanism (claims and scores) and its three instances: the truth market (human resolvers), service quality (machine resolvers), the demand model (first-party).
- **Standing** — your personal, per-topic weight on an informant, from first-party outcomes and paid track records.
- **Personhood share** — the zone's [0,1] weight on an account being a distinct person; gates entitlements only.
- **Trust (coupling)** — pairwise accumulated shared fate; drives coupling, credit, delegation.
- **Vouch** — a signed, staked declaration that an account is a distinct person: bandwidth grant + slashable stake + dependence edge + standing prior.
- **Claim** — `(statement, stake, resolver type, horizon)`; the one market object.
- **Materialize** — produce a value at a place and time and confidence, priced; the one economic activity.
- **Demurrage** — the per-tick melt on idle balances, recycled (pot fraction φ + drip residual).
- **Bind now, open later** — the commitment pattern: verdicts, escrow exits, manifest inputs.
- **Agree inputs, not answers** — the quorum agrees small public input sets; verifiable compute does the arithmetic.
- **Attestation ladder** — climb certainty only as far as the stakes justify: verification's ladder (predicate → sampled re-execution → bisection → re-execution) and finality's ladder (broadcast → witness-entanglement → N ticks) are one pattern.
- **e-value** — evidence measure with guarantees under adversarial data and optional stopping.
- **Fork consistency** — history can be forked, but forks are provably detectable on reunion.
- **Earn-your-complexity** — shipped priors are dumb defaults; an estimated or controlled variant may be used only after it beats the default on scoreable criteria.
- **disp** — the project's language/evaluator: content-addressed programs, deterministic reduction, machine-independent work unit.
- **Session type** — a declared protocol grammar; transcripts are checkable against it.

## Appendix B · Changelog

**v4 → v5** (adversarial review round 4 — rigor + form): closed the verdict-withholding liveness hole (no-reveal default rule, §3.6/§7); restricted personhood estimation to public-input edges (private MPC outputs confer no share lift, §6.2); pinned communal-budget references in funding manifests with the priced-exception note (§7); bound the voting protocol's two internal tensions (fixed-denomination blind issuance; token spend requires proof of the credential secret, §3.7); scoped deterministic finality to home-zone witnesses and ticks (§3.5); scoped "two friends keep two full shares" to the estimator's aspiration and named the threshold cliff (§6.2); corrected the capacity-commitment provability claim (PoR + erasure-coded distinctness; compute/bandwidth as bonded promises, §8); added post-delivery executor selection (§3.5); extended drift audits to the standing layer and stated no-canonical-display is a convention (§3.6); consolidated all payment/reference/enforcement mechanics in §7 with the instance/flow cross-map (§3.6/§7); naming discipline (claims engine vs. truth market; redemption/assertion/payout for non-market "claims"; dropped the dead κ symbol); named the agree-inputs-not-answers pattern (§2); added the §0 map and first-use glosses; attributed the five deaths (§9.3); added the money supply/dilution note, path-payment atomicity, resolver-draw mechanics, conditional-e-values note, capped-properness note, and the futarchy-causality citation; split the walls of text (§3.2, §3.7 voting, §8 floor, §7 flow 1); moved §5.1's caveats below the table; deduplicated multi-zone farming into §11.2.

**v3 → v4** (round 3): fixed the voting protocol (nullifiers; token-transferability flagged); fixed the bootstrap claim and diagram; closed the communal-budget reference-gaming channel; added the φ split; defined effective size for non-clique clusters; made fork-succession adjudication social; scoped the k-of-n recovery caveat, the witness cap, and same-tick ties; required tick-anchored witnesses; named vouch, the attestation ladder, and bind-now-open-later; promoted the no-canonical-display argument to a body paragraph; first-use glosses; §3.5 subsections; degenerate shipped configuration for the reserve loop.

**v2 → v3** (round 2): replaced the false "receipt-free by construction" claim with an explicit ballot protocol; replaced absolute correlation with true dependence measures (dCor/HSIC) plus ground-truth-free validation; fixed the process count; added the deterministic double-spend adjudication rule; specified checkpoint evidentiary weight and manifest-committed balance maps; replaced the "network-wide floor" with the reserve-policy convention; added the share acceptance anchor and genesis bond denomination; generalized standing's data sources; downgraded drift-audit precedence to a simulation-bound hypothesis.

**v1 → v2** (round 1): added payment finality tiers and double-spend disposition; specified the escrow state machine; restated §2's rule precisely; mechanized the money supply; qualified the properness claim; specified reality-coupling within limits; made personhood assembly a named construction; added the multi-zone farming attack; and a dozen citation, cross-reference, and precision fixes.

**v1** (initial draft): process decomposition, the one structural rule, consensus budget, identity split, three market flows, security model.
