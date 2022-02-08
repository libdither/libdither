As fundamental freedoms are continually encroached upon, having a decentralized and democratic internet is more important than ever before. Unfortunately, the current state of progress for internet decentralization is a big fragmented mess of different projects trying to do different things, but not effectively enough. Not enough ideas are shared, not enough people are talking. The biggest usage of peer-to-peer tech is Bittorrent, which has been around for 2 decades. Other parts of internet decentralization have been mostly re-centralized by necessity for ease of use (such as LBRY or Ethereum). This fragmented ecosystem is in desperate need of one project that can replace all the necessary parts of the internet so that reliance on centralized services is not needed anymore.
## Projects that have inspired Dither
[Multiformats](https://multiformats.io/')
 - Multiformats aims to fix the problem of future-proofing systems into future ages of computing. Dither will use a few of the multiformats, such as multihash, to future-proof and to be compatible with IPFS.

[Stellar Conensus Protocol](https://www.stellar.org/)
 - Byzantine Federated Voting is a really fast and flexible system for consensus, it just has to be implemented well.

[Monero](https://www.getmonero.org/)
 - Monero is the only cryptocurrency that actually has most of what a crypto *currency* hould have. Transactions are completely anonymous, transaction fees are very low and it&apos;s not managed by a single company. Dither will improve on this with its own suite of cryptocurrencies that are all completely anonymous and take advantage of better consensus protocols for functionally instant payment.

[IPFS](https://ipfs.io/)
 - IPFS is a core project in the world of web3, and a really good start to the decentralized internet. However, it is simply too [slow and hard to interface with](https://www.publish0x.com/ecosystem-overviews-and-analysis/the-precarious-state-of-ipfs-in-the-year-2020-xmvxeg). Dither's [Directional Trail Search](docs/spec/dither/routing/distance-based-routing.md) will greatly improve on the speed and efficiency of fetching data, as well as supporting more ways of representing data and storing data more efficiently.

DNS - The Domain Name System is structurally decentralized, but it is centrally managed by ICANN, an organization with the authority to control domain name registration. Dither will have its own naming system that will replace DNS and allow for much better systems of naming things. This naming system will be built on the [Reverse Hash Lookup](docs/spec/dither/reverse-hash-lookup.md) system.

[TOR](https://www.torproject.org/) & [I2P](https://geti2p.net/en/)
 - These "Hidden Networks" are very important for obfuscating connections between people on the internet. However, they are *very slow* due to their nature of randomly routing connections through different nodes. Dither will improve on this with [Distance-Based Routing](docs/spec/dither/routing/distance-based-routing.html), a routing protocol that takes latency and throughput into account when routing packets, allowing for the user to choose between better privacy or faster connection. Dither may also implement a anonymous routing technology called [HORNET](https://arxiv.org/pdf/1507.05724v3.pdf) to allow for additional efficiency when establishing obfuscated connections.

Other projects that are inspiring dither are: [Nomia](https://github.com/scarf-sh/nomia), [IPLD](https://ipld.io/), [IOTA](https://www.youtube.com/watch?v=CZxH1V_zoug), [Solidity](https://soliditylang.org/), [Unison](https://www.unisonweb.org/), zk-STARKS, and more.
