# 8 · Reflexivity

A question is live: *will treatment X be judged effective?* The forecast drifts to 0.9. A resolver, privately unsure, opens the interface to record a verdict and sees the 0.9. The market is usually right, they think, and their verdict shades toward yes. Forecasters, paid to predict verdicts, watch verdicts track the forecast and grow more confident in the 0.9 for that reason alone. Somewhere in this loop, the actual treatment stopped mattering.

This is the failure that [assumption A5](07-truth.md#assumptions) ruled out by fiat, and this chapter has to earn instead. It has a name in the active-inference literature: the **dark room**. An agent scored on predictive accuracy can cheat by making its world trivial to predict. A market scored on predicting verdicts can cheat — collectively, with nobody intending it — by becoming the thing that generates the verdicts. It is the same failure at three scales: the market's self-fulfilling fiction, the social echo chamber, the captured commons.

Model it. A resolver's verdict is a blend: a fraction $\lambda$ of deference to the published forecast $p$ (through a response curve $g$), the rest driven by their private signal. Forecasters, optimizing properly, publish the fixed point of $p = \lambda\,g(p) + (1-\lambda)\,\pi$, where $\pi$ is the honest-evidence posterior. Solving it gives a result that fear does not predict:

**if deference is linear and $\lambda < 1$, the fixed point is $\pi$.** The influence flows through the loop and cancels; the forecast stays pinned to the evidence. Influence alone does no damage at all.

The trap requires *nonlinearity*: conformity that responds to consensus more than proportionally. Define the deference slope $L = \lambda \cdot \sup|g'|$. Below $L = 1$, the truthful forecast is the unique equilibrium, though quality degrades smoothly as $\lambda$ grows — deferring resolvers are correlated resolvers, worth fewer independent voices by [chapter 1](01-identity.md)'s accounting. At $L = 1$ the system bifurcates, and above it stable *fiction equilibria* exist: forecasts near certainty, evidence nowhere near it. The whole reflexivity question compresses into one scalar and one safety condition, **$L < 1$** — the first of the five deaths (V1).

A measurable scalar is a controllable one. Three levers:

1. **Blind resolution.** Do not display the current consensus while a resolver records a verdict. $\lambda$ will not reach zero, since public belief leaks through the world, but the highest-bandwidth channel from forecast to verdict is cut by an interface decision.
2. **Reality coupling.** Pay resolvers a small bonus on their own verdicts, scored against evidence that arrives later. Using your private signal becomes profitable, and $\lambda$ falls. At network scale the same lever is *exit*: a self-deluding network loses members to one that is not ([ch. 10](10-organism.md)).
3. **Epistemic value routing.** Weight question budgets toward uncertainty that matters for live decisions, so optimization power concentrates where reality can still push back. Done with lagged weights, this leaves the scoring rule's properness intact.

And $L$ itself can be estimated in production: randomize what consensus, if any, resolvers see at verdict time, and regress verdicts on the display. The first pilot's primary measurement is $\hat{L}$ — the system's measured distance from its own cliff edge.

⚠️ Open: all of the above fixes the geometry of the risk, not the human inputs. The shape of the deference curve $g$ in this setting is unmeasured until a pilot runs, and the whole-system version of the question — this loop coupled to money and governance at once — is the grand conjecture, still unproven.

📐 Formal treatment: [Mathematical Core §2](mathematical-core.md). The causal twin of this trap, markets that flawlessly predict confounded verdicts, is [Futarchy and Causality](futarchy-causality.md).

---

Perception is guarded against watching itself. What remains is action: turning belief and preference into decisions, without wiring the market's output straight into the switch. That is [chapter 9](09-governance.md).
