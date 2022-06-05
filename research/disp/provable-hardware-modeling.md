# Provable Hardware Modeling

How do we make fast code?

We must have a model of our hardware (the thing we are running the code on)
 - CPU Manual detailing performance characteristics. (i.e. Intel x86_64 manual)

We must have algorithms tailor-made for that hardware to run as fast as possible.
 - To do this we typically manually write algorithms we think will run fast and then compare them to other algorithms using benchmarks.

What if we could deterministically compute whether or not an algorithm is faster than another using a software model of the CPU instead of benchmarks?
 - No more annoying statistics and machine-specific benchmark innacuracies. Faster algorithms are provably faster for a given model.
 - New, faster algorithms can immediately be adopted by everyone using a system of proof broadcasting. (i.e. Bob has a new algorithm, Bob prooves its faster, Bob broadcasts algorithm to everyone, everyone checks proof, everyone uses new algorithm)
 - 

How?
 - Instead of using benchmarks to compare algorithms, we write proofs about our model and verify those proofs with benchmarks of the given CPU.
 - If we have the CPU schematics, we can do even better by directly translating the schematic layout to the software model.
 - Models will be intensely modular and should reflect the real-life layout of the system.


