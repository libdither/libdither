
The types:

```
Binary : Type
WasmExecution : Binary -> { Binary, Latency, ResourceUsage }


```

The goal is to have an optimizer that can optimize itself.
 - What does it mean to optimize itself? => It means what whatever function the original optimizer was optimizing for, it can now optimize that function better.
 - What other function was it optimizing for?

What is a neural network, type theoretically?
```
Input : Type
Output : Type
NeuralNet : Input -> Output
```