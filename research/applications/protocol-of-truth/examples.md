# Potential Examples for the Protocol of Truth

To flesh out the idea and provide context of what this might look like, here are some real-world examples of videos that would be labeled under the protocol of truth.

## Example 1: Simple Factual Error

In Youtuber Fireship's video "Rust in 100 Seconds" at 0:55 he incorrectly says that mutable values are stored in the heap.

Ideal processes of correction:
 - Someone realizes that there is an error and creates an `Objection`
   - Objections come with 3 parts: `Selection`, `Type`, `Reason`, and `Evidence` 
   - For the `Selection`, they use the `Transcript` selection type and select the following lines:
	 ```
	 00:55 mutable values or objects with an
	 00:57 unknown size at compile time are stored
	 00:59 in the heap memory
	 ```
   - They set the [`Type`](./protocol-types.md) to `Error`.
   - For the `Reason` they say:
   - ```
     "While objects with unknown size at compile time are typically stored in the heap, mutable objects can be stored on the stack OR the heap."
	 ```
   - They do not give any `Evidence` as this is common knowledge in rust.
 - As people come to the video, they see the label on the video as `Pending - Potential Error` and click to see the `Objection` to do one of the following:
   - Mark the `Objection` as `True`
   - Mark the `Objection` as `False`
   - Flag the `Objection` as `Incomplete`
   - Flag the `Objection` as `Unknown`
 - When flagging an Objection, you must have at least 10 karma and a verified human account. If you mark an objection as True while the statement is resolved as false or vice versa, you will loose 5 truth karma. If marked correctly you will gain 1 truth karma.
 - Confident people may also stake 100, 1000, or 10,000 karma to add 2, 3, or 4 votes respectively. (You will also loose half of your staked karma if you mark incorrectly, although you will gain more points if guessed correctly).
 - People may also stake their karma (max 10) on a resolution for increased karma return when the Objection comes to consensus in their favor. that they agree or that they are completely confident with the `Objection` (beause it is obvious). Or they comment under the objection with 
 - If after a substantial period of time there is a 4/5th majority either way (True or False or Unknown), the objection will be marked true or false, which will change the label of the video. If there is no super consensus, it is marked as controversial. Controversial resolutions will only effect the video label for certain `Objection` types.
 - Ideally, the creator sees the `Objection` and the supporting "True" marks from the community, admits that they make an error and personally mark the `Objection` as True so that the community knows that the `Objection` has been acknowledged by the original creator.
   - In this case, Fireship could create a patch to that part of the video in response to the `Objection` and link to the original Objection to revert the "small error" label.