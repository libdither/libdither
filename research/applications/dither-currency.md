# Dither Currency (Ideas are Work-In-Progress)

Problems:

Market:
 - Efficient allocation of finite resources and prioritization of individual's desires.
 - Using existing cryptocurrencies knowing that a small number of people might have control over most of the supply (due to first mover advantage) is un-ideal. Also inequality creates various negative effects.

Scale:
 - Existing cryptocurrencies do not scale well with users or nodes.
 - Existing cryptocurrencies do not have transaction confirmation latency that is a linear function of inter-node distance.
 - Existing cryptocurrencies don't have mechanisms to ensure facilitating nodes are incentivized to be placed intelligently (e.g. geographically intermediate to source and destinations)
 - Existing cryptocurrencies require full histories to be verified and stored.
 - Existing cryptocurrencies can't pin/store money to specific geographic/network topology for faster transactions.
 - Existing cryptocurrencies require network-wide consensus for parties that are physically close to each other.
 - Existing cryptocurrencies require network segmentation of various forms to scale effectively and cannot work on raw topologies.

Security / Decentralization:
 - Existing cryptocurrencies do not have ways to rationally ensure up to a desired probability that a given transaction went through correctly.
 - Existing cryptocurrencies do not allow flexible tradeoffs between anonymity and transaction speed. 
 - Existing cryptocurrencies are vulnerable to large sections of far away parts of the network being hacked causing the whole network to collapse.
 - Existing cryptocurrencies are vulnerable to sybil attacks of various forms.

Philosophy:
 - Currencies are necessary for efficient allocation of scarce resources and for efficient prioritization of individual desires. In the setting of decentralized networks this pops up everywhere from data storage to routing to compute which need real-world resources, and thus real-world payment to be supplied.
 - Almost any fixed commodity has the tendency to be hoarded and left unspent and currencies are no exception, thus to ensure this currency stays as medium of exchange more than a store of value, the currency will by-default automatically redistribute 1% of money from all users per month to a central pot to be reinvested by an intelligent democratic mechanism. 



The two notable areas of improvement are:
 - Physical and digital implementation
 - More efficient and just economies.

This page has some potentially uneducated and most definitely *incomplete* ideas.

### Implementation

Dither's built-in cryptocurrency aims to solve all existing problems with crypto:
 - Scalability
   - Uses IOTA block structure combined with Federated Byzantine Voting for coordination.
   - Most users won't store the entire network history, just a slice of the current state relevent to performing transactions.
 - Speed
   - Using Stellar Consensus Protocol and IOTA will be helpful to speed.
   - Bad Idea?: Also, there will be establishment of Zones in the network that have their own sub-exchanging separate from the rest of the network for fast local transactions. Usage of zones will be faster than sending transactions to the global network, however, for security purposes, zones must report transactions
 - Anonymity
   - Will use zk-STARKS to obfuscate transaction amounts and sender
 - Transaction Cost
   - Network is maintained by users, no mining necessary, therefore no fees will be required to transfer tokens.
 - Volatility
   - There will be a system of provable currency deletion where you can create Dither Coins from thin air by proving that you send a certain amount of other support crypto coins to a public key with no corresponding private key (i.e. proving that they are inaccessable). The amount of coins created will be market exchange rate of the given coin into the U.S. dollar at the time of the transaction. (exchange rate is maintained by the network)
   - **This will ensure that the value of Dithercoin is tied to the US dollar.**
 - Ease of Use
   - Dither Coin will be built-in to all aspects of Dither for tipping and other things
   - There will be SDKs so that Dither Coin can be built into other applications.
 - Ease of Purchase
   - A system for peer-to-peer purchase of Dither Coin using other assets will be created using Dither Chain. (Idea WIP)

# Economics

Some work needs to be done to counteract some of the negative sociological aspects of both new currencies and capitalism in general, namely enterprises that do not reasonably factor negative externalities into the price (land use, pollution, exploitative practices, etc.), and potentially harmful concentrations of economic power.