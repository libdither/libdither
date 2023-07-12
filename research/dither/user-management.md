# User Magagement

## Desirable Properties

 - Flexible Provenance
   - A user should be able to choose how strong the link between the data they publish and themselves is. (i.e. optional / zk proof / ring signature signing)
 - Flexible Privacy
   - A user should be able to choose to a reasonable extent who can see the data they publish. (i.e. one-to-many group-based publishing)
 - Multi-device support & Realistic recovery mechanisms from compromised devices.
   - If a user looses access to their devices or a mechanism of authentication (password) or device gets compromised, there should be realistic mechanisms to recover the damage both to the public and privately.
 - Anonymous Collective Feedback
   - For mechanisms of collective feedback (like/dislike counters, analytics), the data associated with the feedback event should not in general be attributable to a particular group, but should be verifiable that it was a unique member of the group that did the feedback.
 - Flexible Storage Permissions
   - Encrypted data associated with a user, stored across many different computers, should support permission hierarchies based on the sensitivity of the data. I.e. requiring more factors of authentication.
 - Web-of-trust Identity
   - Data associated with a user's identity should be vouchable by other users (in a web-of-trust) or by mechanistic processes. The identifying data should

## Inspiration
 - Scuttlebutt
 - Polycentric