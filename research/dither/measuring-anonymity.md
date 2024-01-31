# Measuring Anonymity in Overlay Routing Networks

How does one know if a anonymous routing system is truly anonymous? What does it mean to be anonymous anyway? This document outlines research into this topic.

Anonymity is a kind of security, mainly, the security of being indistinguishable. Naturally this begs the question as to the set of things that one is indistinguishable *in*. For classic examples of anonymity, this is the notion of "entropy" from information theory. Entropy applied to aonomity is a measure of the amount of information one has to distinguish between items in a set, and thus how much they are able to reduce the "anonymity set" (the set containing you and many other entities that are indistinguishable from you). For anonymous routing networks however, applying such a notion is not as simple as `number-of-users = anonymity-set`, exactly how much anonymity someone has depends on the exact threat model used (i.e. what capabilities does the adversary have to passively or actively collect information useful for de-anonymizing), as well as the details of the anonymous routing protocol including node selection algorithms, applications its used for, network topology and trustworthiness, etc. This is to say, measuring anonymity in a distributed system is a complicated.

### Research

 - [Mixnet and ACN Research](https://github.com/lehnberg/mixnet-and-acn-research)

 - Why I'm not an Entropist - https://www.freehaven.net/anonbib/cache/entropist.pdf