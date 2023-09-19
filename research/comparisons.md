# Comparisons to Other P2P Networks

As Dither aims to be the best possible design, it must improve in ideas and implementation over the competition. While Dither is not working software yet, this page exists to provide an active list on how Dither improves (or doesn't) over other P2P network implementations.

## Bittorrent

File Sharing using Kademlia DHT see [directional trail search](./dither/directional-trail-search.md) for how Dither plans to improve file search, latency, and throughput, while also maintaining anonymity.

### TOR
Anonymity with centrally managed proxies. Dither is decentralized with other features. See [dither's routing scheme](./dither/routing.md) for more details.

### I2P
Anonymity with peer-to-peer proxies. See [dither's routing](./dither/routing.md) for how it achieves more a flexible anonymity/performance trade-off and how it achieves a bandwidth exchange scheme that is more friendly to devices who can't contribute much bandwidth.