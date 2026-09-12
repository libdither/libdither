# On Censorship

> Censorship is the suppression of speech, public communication, or other information. [1]

Warning: Some Philosophy Ahead.

Dither is an internet protocol and internet protocols are products of the social constructs endorsed by the author(s). Social constructions are like memes (i.e. darwinian agents), they live and die and change form by how many people believe/perpetuate them (oftentimes weighted by how capable the individual believers are to realize the content of the construction).

Another such social construction is the conception on what speech in what context is acceptable. So far, in liberal countries at least, speech is widely regarded as something to be protected. This protection however has some notable exceptions (in approximate order of legal severity):
 - Child sexual abuse material.
 - Non-consensual sexual imagery.
 - Restrictions on publishing false statements with intent to harm a reputation.
 - Restrictions on harassment (threatening/stalking) of individuals.
 - Restrictions on publishing copyrighted material.
 - Restrictions on speech that encourages violence towards a person or group or in general.

Any good protocol engineer (and by extension social-construction-constructor) who wants their construction to be successful, should take into consideration potential conflict with the social construct under construction and other social constructions out in the world, constructions that may induce people to not spread your construction, or actively obstruct its propagation.

So how is Dither going to deal with this issue? In what context would Dither even encouter these issues? It depends on the application.

**Private Chat Applications** (between individuals or small group chats), are often small and don't have the potential to violate any restrictions on public speech. They can (and do) however facilitate propagation of CSAM and other content.
 - Even detecting CSAM between two consenting parties is likely impossible without control over hardware (like how Apple does local on-device scanning), but it might be possible to have a system where unconsenting receivers of CSAM can report the offence and notify other nodes to investigate the offending node.

**Public Chat Applications** (i.e. servers managed by individuals with many people partitipcating) are much closer to 

Taking Dither's current planned structure as a given (i.e. anonymous routing, provably owned accounts) there are not a whole lot of options here. There are also many different possibilities based on the specific social network application being built on Dither.

If we define broadly a "social network" based on what users are allowed to do:
 1. construct a public or semi-public profile within a bounded system
 2. articulate a list of other users with whom they share a connection, and 
 3. view and traverse their list of connections and those made by others within the system.

 - Ignore the issue of illegality and potential government restriction.
   - This means going the way of TOR, USENET, IPFS and BitTorrent which are frequently restricted by governments around the world and regular people are often suspicious of their usage.
 - On-device scanning for illegal material + centralized moderation team that ensures communities built on Dither self-regulate.
   - This is much like how centralized protocols work, i.e. Reddit, Twitter, Facebook and it is the best platforms have come up with so far to comply with government restriction.
   - This would go against Dither's goal of decentralization and centralized censorship always has the problem of do people truth the censors to be just.
 - Public social groups must self-regulate and can their owners can disconnect from each other (similar to mastodon or other federated media).
 - Peer-to-peer social accountability where all nodes monitor their peers for certain behavior and chose from some set of protocols to initiate collective judgement of the node in question.
   - Has the effect of hiding objectional behavior from the regular user, and discourages people from disabling it unless they want to be unable to access the rest of the network.
   - This recognizes that it is practically very difficult to entirely eliminate behavior that the majority abhors, and that there is a spectrum of behavior ranging from abhorrant to tolerable that can invoke varying levels of collective consequence from the network.
   - Issues: Very theoretical, some types of collective consequence may cause network splits, but it is not clear if that is a good or bad thing.

[1] https://en.wikipedia.org/wiki/Censorship