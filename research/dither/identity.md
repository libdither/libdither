# Identity

Identification is needed when one party must store and retrieve data associated with another party for the purpose of specific interaction.

Formally, identification is the process by which one party (identifier) under some assumptions internally associates some external stimulus with the known identity of another party, thus changing the identifying party's behavior.

For Example: 
 - A service (identifying party) must identify a user (identified party) using a username and password (external stimulus) to allow the user to log in (changed behavior).
   - Main Assumption: The user's password or computer they are using has not been compromised.
 - An individual must identify a fellow human being using their senses before treating them not as a stranger.
   - Main Assumption: The fellow human is not attempting to disguise themselves as someone else.
 - When receiving an encrypted message from a friend, the receiver must identify the friend by verifying the signature of the message using the friend's known public key.
   - Main Assumption: The public key truly does belong to the friend and the friend's private key has not been compromised.

## Design

In Dither, there will be two general categories of identification.
 - Cryptographic identification
 - Characteristic-based identification.

Cryptographic identification will occur for when one needs to identify an party on other other end of a specific communication channel.

Characteristic-based identification will occur when one needs to find publically-declared associated data (i.e. public keys) of another party given only knowing certain characteristics of the other party.
