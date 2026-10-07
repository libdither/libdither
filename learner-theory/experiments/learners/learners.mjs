// Learners as staged production economies.
//
// A learner is a sequence of stages. At each stage some units turn an incoming good into an
// outgoing good: a layer's units turn activations into activations; an agent turns the world's
// state into the next state by acting. Learning is the units changing how they produce in response
// to credit, and credit is a price: how much a unit of a good is worth to whatever comes after.
//
// The named learners differ along a few dimensions:
//   allocation       who produces: every unit (dense), a weighted coalition (softmax), one winner (auction)
//   rivalry          whether a good can be used by many buyers at once (activations) or only one (control)
//   price formation  exact adjoint sweep, relaxation, a fixed wrong map, a broadcast scalar with local
//                    correlation, a payment discovered by auction, or none at all
//   granularity      a price per coordinate of the good (a vector) or one price for the whole good (a scalar)
//   accounting       prices as imputed signals, or as money actually paid, conserved, and taxed
//   response         gradient on the value of one's output, revising one's bid, Hebbian, or selection
//   population       a fixed set of units, or units that are born rich and die broke
//
// Part A works on white-box stages (known, differentiable layers), Part B on black-box stages (an
// environment nobody can differentiate), Part C on unsupervised competition, Part D on a market for
// the units of a dense layer, Part E on one price for both rationing and credit in a mixture of experts.
// learners.test.mjs checks each named learner against its textbook definition.

// ---------------------------------------------------------------- small numerics
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  next.normal = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  return next;
}
const zeros = (n) => new Float64Array(n);
export const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};
// M is rows × cols, row-major
export function matvec(M, rows, cols, x, out = zeros(rows)) {
  for (let i = 0; i < rows; i++) {
    let s = 0;
    for (let j = 0; j < cols; j++) s += M[i * cols + j] * x[j];
    out[i] = s;
  }
  return out;
}
export function matTvec(M, rows, cols, y, out = zeros(cols)) {
  out.fill(0);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) out[j] += M[i * cols + j] * y[i];
  return out;
}
const ACT = {
  linear: { f: (z) => z, df: () => 1 },
  relu: { f: (z) => (z > 0 ? z : 0), df: (z) => (z > 0 ? 1 : 0) },
  tanh: { f: (z) => Math.tanh(z), df: (z) => 1 - Math.tanh(z) ** 2 },
};
export const cosine = (a, b) => dot(a, b) / Math.sqrt(dot(a, a) * dot(b, b) + 1e-300);
const flat = (arrs) => Float64Array.from(arrs.flatMap((a) => [...a]));

// ================================================================= Part A: white-box stages
// A feedforward network: stage l turns h[l-1] into h[l] = f(W[l] h[l-1] + b[l]). Every unit of a layer
// produces (dense allocation), and an activation is a non-rival good: every unit of the next layer
// uses all of it.
export function makeNet({ sizes, act = 'relu', bias = false, seed = 1, scale = 1 }) {
  const r = rng(seed);
  const W = [];
  const b = [];
  const R = []; // fixed random feedback matrices, for feedback alignment
  const D = []; // fixed random matrices from the output straight to each layer (direct feedback alignment)
  for (let l = 1; l < sizes.length; l++) {
    const rows = sizes[l];
    const cols = sizes[l - 1];
    const sd = scale / Math.sqrt(cols);
    W.push(Float64Array.from({ length: rows * cols }, () => sd * r.normal()));
    b.push(bias ? Float64Array.from({ length: rows }, () => 0.1 * r.normal()) : zeros(rows));
    R.push(Float64Array.from({ length: rows * cols }, () => sd * r.normal()));
  }
  const out = sizes[sizes.length - 1];
  for (let l = 1; l < sizes.length; l++) D.push(Float64Array.from({ length: out * sizes[l] }, () => r.normal() / Math.sqrt(out)));
  // the output layer is linear, so the last stage's good is the prediction itself
  const acts = sizes.slice(1).map((_, i) => (i === sizes.length - 2 ? 'linear' : act));
  return { sizes, acts, bias, W, b, R, D };
}

export function forward(net, x, noise = null) {
  const h = [Float64Array.from(x)];
  const z = [null];
  for (let l = 1; l < net.sizes.length; l++) {
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    const zl = matvec(net.W[l - 1], rows, cols, h[l - 1]);
    for (let i = 0; i < rows; i++) zl[i] += net.b[l - 1][i] + (noise ? noise[l][i] : 0);
    const { f } = ACT[net.acts[l - 1]];
    z.push(zl);
    h.push(Float64Array.from(zl, f));
  }
  return { h, z };
}
// squared error, the final demand: L = ½‖h_L − y‖²
export function loss(hL, y) {
  let s = 0;
  for (let i = 0; i < y.length; i++) s += (hL[i] - y[i]) ** 2;
  return s / 2;
}

// Credit: for each layer, an estimate of e[l] = ∂L/∂z[l] (the adjoint of a unit's net input) and
// a[l] = ∂L/∂h[l] (the adjoint of its output). Minus a[l] is the price of layer l's output: what one
// more unit of it is worth in reduced loss.
//   backprop   a[l−1] = W[l]ᵀ e[l]: exact prices, computed by a central backward sweep
//   feedback   a[l−1] = M[l]ᵀ e[l] with M = (1 − align)·R + align·W: R fixed and random. align = 0 is
//              feedback alignment, align = 1 is backprop; in between, partly wrong prices
//   direct     a[l] = D[l]ᵀ a[L]: every layer hears the output's price through its own fixed random map
//   perturb    node perturbation: jitter every unit, broadcast one scalar (the change in loss), and let
//              each unit correlate it with its own jitter. Unbiased for small jitter
//   relax      predictive coding: settle a network of local prediction errors with the output weakly
//              pulled toward the target; the errors, scaled, are the prices (tâtonnement, not a sweep)
export function credit(net, x, y, mode = 'backprop', opt = {}) {
  const L = net.sizes.length - 1;
  const fw = forward(net, x);
  const hL = fw.h[L];
  const aOut = Float64Array.from(hL, (v, i) => v - y[i]);
  const e = Array(L + 1).fill(null);
  const a = Array(L + 1).fill(null);
  a[L] = aOut;
  const eOf = (l) => Float64Array.from(a[l], (v, i) => v * ACT[net.acts[l - 1]].df(fw.z[l][i]));
  if (mode === 'backprop' || mode === 'feedback') {
    const align = mode === 'backprop' ? 1 : (opt.align ?? 0);
    for (let l = L; l >= 1; l--) {
      e[l] = eOf(l);
      if (l === 1) break;
      const rows = net.sizes[l];
      const cols = net.sizes[l - 1];
      const M = align === 1 ? net.W[l - 1] : Float64Array.from(net.W[l - 1], (w, k) => (1 - align) * net.R[l - 1][k] + align * w);
      a[l - 1] = matTvec(M, rows, cols, e[l]);
    }
  } else if (mode === 'direct') {
    e[L] = eOf(L);
    for (let l = L - 1; l >= 1; l--) {
      a[l] = matTvec(net.D[l - 1], net.sizes[L], net.sizes[l], aOut);
      e[l] = eOf(l);
    }
  } else if (mode === 'perturb') {
    const r = opt.rng || rng(opt.seed || 7);
    const sigma = opt.sigma ?? 1e-3;
    const base = loss(hL, y);
    const noise = net.sizes.map((n, l) => (l === 0 ? null : Float64Array.from({ length: n }, () => sigma * r.normal())));
    const dL = loss(forward(net, x, noise).h[L], y) - base;
    for (let l = 1; l <= L; l++) e[l] = Float64Array.from(noise[l], (xi) => (dL * xi) / (sigma * sigma));
  } else if (mode === 'relax') {
    // Energy: Σ_l ½‖h[l] − f(W h[l−1] + b)‖² + β·L(h[L]). Settle h[1..L] by gradient descent, h[0] = x.
    const beta = opt.beta ?? 1e-3;
    const steps = opt.steps ?? 2000;
    const rate = opt.rate ?? 0.2;
    const h = fw.h.map((v) => Float64Array.from(v));
    const pred = (l) => {
      const zl = matvec(net.W[l - 1], net.sizes[l], net.sizes[l - 1], h[l - 1]);
      for (let i = 0; i < zl.length; i++) zl[i] += net.b[l - 1][i];
      return zl;
    };
    let eps = [];
    let zs = [];
    for (let it = 0; it <= steps; it++) {
      zs = [null];
      eps = [null];
      for (let l = 1; l <= L; l++) {
        const zl = pred(l);
        zs.push(zl);
        eps.push(Float64Array.from(h[l], (v, i) => v - ACT[net.acts[l - 1]].f(zl[i])));
      }
      if (it === steps) break;
      for (let l = 1; l <= L; l++) {
        const grad = Float64Array.from(eps[l]);
        if (l === L) for (let i = 0; i < grad.length; i++) grad[i] += beta * (h[L][i] - y[i]);
        else {
          const rows = net.sizes[l + 1];
          const back = matTvec(net.W[l], rows, net.sizes[l], Float64Array.from(eps[l + 1], (v, i) => v * ACT[net.acts[l]].df(zs[l + 1][i])));
          for (let i = 0; i < grad.length; i++) grad[i] -= back[i];
        }
        for (let i = 0; i < grad.length; i++) h[l][i] -= rate * grad[i];
      }
    }
    // At equilibrium ε[l] = −β·a[l] to first order in β, so the prices are −ε/β.
    for (let l = 1; l <= L; l++) {
      a[l] = Float64Array.from(eps[l], (v) => -v / beta);
      e[l] = Float64Array.from(a[l], (v, i) => v * ACT[net.acts[l - 1]].df(zs[l][i]));
    }
  } else if (mode !== 'none') throw new Error(`unknown credit ${mode}`);
  return { fw, e, a, loss: loss(hL, y) };
}

// The weight update each credit mode implies: every unit lowers the loss-value of its own output at
// the posted prices, taking its inputs as given: ΔW[l] = −η e[l] h[l−1]ᵀ.
export function gradients(net, cr) {
  const L = net.sizes.length - 1;
  const gW = [];
  const gb = [];
  for (let l = 1; l <= L; l++) {
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    const g = zeros(rows * cols);
    const el = cr.e[l] || zeros(rows);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) g[i * cols + j] = el[i] * cr.fw.h[l - 1][j];
    gW.push(g);
    gb.push(Float64Array.from(el));
  }
  return { gW, gb };
}
export function step(net, x, y, mode, eta, opt = {}) {
  const cr = credit(net, x, y, mode, opt);
  const { gW, gb } = gradients(net, cr);
  for (let l = 0; l < gW.length; l++) {
    for (let k = 0; k < gW[l].length; k++) net.W[l][k] -= eta * gW[l][k];
    if (net.bias) for (let k = 0; k < gb[l].length; k++) net.b[l][k] -= eta * gb[l][k];
  }
  return cr;
}
export function finiteDiffGrad(net, x, y, h = 1e-6) {
  const L = net.sizes.length - 1;
  const lossAt = () => loss(forward(net, x).h[L], y);
  return net.W.map((W) =>
    Float64Array.from(W, (_, k) => {
      const w0 = W[k];
      W[k] = w0 + h;
      const up = lossAt();
      W[k] = w0 - h;
      const dn = lossAt();
      W[k] = w0;
      return (up - dn) / (2 * h);
    }),
  );
}

// Accounting with backprop's prices π[l] = −a[l]. A unit's revenue is the value of its output at its
// price; it "pays" each supplier its marginal contribution, π_i·f′(z_i)·W_ij·h_j. An activation is
// non-rival, so a supplier's revenue is the sum of every buyer's payment: Samuelson's condition for a
// public good. A unit's profit is revenue minus payments: zero for a unit with no bias and a
// positively homogeneous f (linear, ReLU: f′(z)·z = f(z)), by Euler's theorem; otherwise a rent.
export function accounts(net, cr) {
  const L = net.sizes.length - 1;
  const layers = [];
  for (let l = 1; l <= L; l++) {
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    const price = Float64Array.from(cr.a[l], (v) => -v);
    const revenue = Float64Array.from(price, (p, i) => p * cr.fw.h[l][i]);
    const paidTo = zeros(cols); // what layer l pays each unit of layer l−1
    const paidBy = zeros(rows); // what each unit of layer l pays its suppliers in total
    for (let i = 0; i < rows; i++) {
      const m = price[i] * ACT[net.acts[l - 1]].df(cr.fw.z[l][i]);
      for (let j = 0; j < cols; j++) {
        const pay = m * net.W[l - 1][i * cols + j] * cr.fw.h[l - 1][j];
        paidTo[j] += pay;
        paidBy[i] += pay;
      }
    }
    const profit = Float64Array.from(revenue, (r, i) => r - paidBy[i]);
    layers.push({ price, revenue, paidTo, paidBy, profit });
  }
  // value entering stage l from upstream: the total revenue of layer l−1's units (the inputs' value at l = 1)
  const totalRevenue = layers.map((ly) => ly.revenue.reduce((s, v) => s + v, 0));
  const inputValue = layers[0].paidTo.reduce((s, v) => s + v, 0);
  return { layers, totalRevenue, inputValue };
}

// ---------------------------------------------------------------- allocation: a mixture-of-experts stage
// K experts each produce the whole output; a gate scores them. 'soft': output = Σ softmax(score/τ)·expert,
// a weighted coalition (logit allocation). 'hard': the top scorer alone produces (an auction for a
// rival good: the input can be processed by one expert).
export function makeMoE({ dIn, dOut, K, seed = 3 }) {
  const r = rng(seed);
  const E = Array.from({ length: K }, () => Float64Array.from({ length: dOut * dIn }, () => r.normal() / Math.sqrt(dIn)));
  const G = Float64Array.from({ length: K * dIn }, () => r.normal() / Math.sqrt(dIn));
  return { dIn, dOut, K, E, G, bias: zeros(K) };
}
export function moeForward(m, x, { alloc = 'soft', tau = 1 } = {}) {
  const score = matvec(m.G, m.K, m.dIn, x);
  for (let k = 0; k < m.K; k++) score[k] -= m.bias[k]; // a price per expert, e.g. a load-balancing bias
  let alpha;
  if (alloc === 'soft') {
    const mx = Math.max(...score);
    alpha = Float64Array.from(score, (s) => Math.exp((s - mx) / tau));
    const z = alpha.reduce((s, v) => s + v, 0);
    for (let k = 0; k < m.K; k++) alpha[k] /= z;
  } else {
    alpha = zeros(m.K);
    alpha[score.indexOf(Math.max(...score))] = 1;
  }
  const outs = m.E.map((E) => matvec(E, m.dOut, m.dIn, x));
  const y = zeros(m.dOut);
  for (let k = 0; k < m.K; k++) for (let i = 0; i < m.dOut; i++) y[i] += alpha[k] * outs[k][i];
  return { score, alpha, outs, y };
}
// Exact gradient of ½‖y − target‖² for the soft mixture, gate included.
export function moeGrad(m, x, target, tau = 1) {
  const fw = moeForward(m, x, { alloc: 'soft', tau });
  const g = Float64Array.from(fw.y, (v, i) => v - target[i]);
  const gE = fw.outs.map((_, k) => {
    const out = zeros(m.dOut * m.dIn);
    for (let i = 0; i < m.dOut; i++) for (let j = 0; j < m.dIn; j++) out[i * m.dIn + j] = fw.alpha[k] * g[i] * x[j];
    return out;
  });
  // d loss / d score_k = α_k (g·out_k − g·y) / τ
  const gy = dot(g, fw.y);
  const gScore = Float64Array.from(fw.outs, (o, k) => (fw.alpha[k] * (dot(g, o) - gy)) / tau);
  const gG = zeros(m.K * m.dIn);
  for (let k = 0; k < m.K; k++) for (let j = 0; j < m.dIn; j++) gG[k * m.dIn + j] = gScore[k] * x[j];
  return { gE, gG, loss: loss(fw.y, target) };
}

// ================================================================= Part B: black-box stages
// An environment is a stage nobody can differentiate, so prices can only be scalars: what the next
// user of the state is willing to pay for it. Tabular MDP: next[s][a], reward[s][a], discount γ.
export function makeMDP({ nS = 6, nA = 3, gamma = 0.9, seed = 5 } = {}) {
  const r = rng(seed);
  const next = Array.from({ length: nS }, () => Array.from({ length: nA }, () => Math.floor(r() * nS)));
  const reward = Array.from({ length: nS }, () => Array.from({ length: nA }, () => Math.round(r() * 100) / 100));
  return { nS, nA, gamma, next, reward };
}
export function valueIteration(mdp, iters = 2000) {
  const Q = Array.from({ length: mdp.nS }, () => zeros(mdp.nA));
  for (let it = 0; it < iters; it++) {
    const V = Q.map((q) => Math.max(...q));
    for (let s = 0; s < mdp.nS; s++) for (let a = 0; a < mdp.nA; a++) Q[s][a] = mdp.reward[s][a] + mdp.gamma * V[mdp.next[s][a]];
  }
  return Q;
}

// A market for control (Chang et al. 2020). Each primitive owns one action; `clones` primitives share
// each action. At every state the primitives bid their valuation of acting there; the winner acts, pays
// a price to the previous winner (who sold it the state), and is paid by the next winner (who buys the
// state it produced) plus the reward. pricing 'first': the winner pays its own bid (Holland's bucket
// brigade auction); 'second': it pays the highest competing bid (Vickrey). Learning: a winner moves its
// valuation toward the revenue it realized: reward + γ·(what the next winner paid it).
// alloc 'softmax' picks the winner by a logit over bids at temperature tau (exploration); 'argmax' by
// highest bid with a fraction `explore` of random winners.
export function makeMarket(mdp, { clones = 2, init = 0, seed = 11 } = {}) {
  const r = rng(seed);
  const agents = [];
  for (let a = 0; a < mdp.nA; a++) for (let c = 0; c < clones; c++) agents.push({ action: a, value: Float64Array.from({ length: mdp.nS }, () => init + 1e-3 * r()), wealth: 0 });
  return { mdp, agents, r };
}
function priceOf(market, s, winner, pricing) {
  if (pricing === 'first') return market.agents[winner].value[s];
  let best = -Infinity;
  market.agents.forEach((ag, i) => {
    if (i !== winner && ag.value[s] > best) best = ag.value[s];
  });
  return best;
}
function pickWinner(market, s, { alloc = 'argmax', tau = 0.1, explore = 0.1 }) {
  const ags = market.agents;
  const r = market.r;
  if (alloc === 'softmax') {
    // Gumbel-max: the same as drawing from softmax(value/τ)
    let best = -1;
    let bestScore = -Infinity;
    ags.forEach((ag, i) => {
      const sc = ag.value[s] - tau * Math.log(-Math.log(1 - r() * (1 - 1e-12)));
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    return best;
  }
  if (r() < explore) return Math.floor(r() * ags.length);
  let best = 0;
  ags.forEach((ag, i) => {
    if (ag.value[s] > ags[best].value[s] || (ag.value[s] === ags[best].value[s] && r() < 0.5)) best = i;
  });
  return best;
}
// One episode of `horizon` steps. Returns the money flows for accounting.
export function marketEpisode(market, { start = 0, horizon = 40, pricing = 'second', eta = 0.1, learn = true, ...pickOpt } = {}) {
  const { mdp } = market;
  let s = start;
  let prev = -1;
  let prevState = -1;
  let prevReward = 0;
  let paidIn = 0; // money entering as reward
  for (let t = 0; t < horizon; t++) {
    const w = pickWinner(market, s, pickOpt);
    const price = priceOf(market, s, w, pricing);
    if (prev >= 0) {
      // the previous winner sold this state to w: its revenue is its reward plus γ·price
      const revenue = prevReward + mdp.gamma * price;
      const ag = market.agents[prev];
      ag.wealth += revenue - ag.lastPaid;
      if (learn) ag.value[prevState] += eta * (revenue - ag.value[prevState]);
    }
    market.agents[w].lastPaid = price;
    const a = market.agents[w].action;
    prevReward = mdp.reward[s][a];
    paidIn += prevReward;
    prev = w;
    prevState = s;
    s = mdp.next[s][a];
  }
  return { paidIn };
}

// The same control task with a white box: if the environment's model is known, the value of every
// action can be computed exactly and a softmax policy can follow the exact gradient (the policy
// gradient theorem): vector prices for control. REINFORCE uses only the sampled return, a broadcast scalar.
function solve(A, b) {
  // Gaussian elimination with partial pivoting; A is n×n (array of rows)
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}
export function softmaxPolicy(theta, s, tau = 1) {
  const mx = Math.max(...theta[s]);
  const e = theta[s].map((v) => Math.exp((v - mx) / tau));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
}
// J = Σ_s μ(s) V^π(s) with μ uniform; returns J and its exact gradient in the logits θ.
export function policyGradient(mdp, theta) {
  const { nS, nA, gamma } = mdp;
  const pi = Array.from({ length: nS }, (_, s) => softmaxPolicy(theta, s));
  const P = Array.from({ length: nS }, () => new Array(nS).fill(0));
  const rPi = new Array(nS).fill(0);
  for (let s = 0; s < nS; s++) for (let a = 0; a < nA; a++) {
    P[s][mdp.next[s][a]] += pi[s][a];
    rPi[s] += pi[s][a] * mdp.reward[s][a];
  }
  const I_gP = P.map((row, i) => row.map((v, j) => (i === j ? 1 : 0) - gamma * v));
  const V = solve(I_gP, rPi);
  // discounted visits d = μᵀ (I − γP)^{-1}: solve the transposed system
  const T = I_gP[0].map((_, j) => I_gP.map((row) => row[j]));
  const d = solve(T, new Array(nS).fill(1 / nS));
  const grad = Array.from({ length: nS }, (_, s) =>
    Array.from({ length: nA }, (_, a) => d[s] * pi[s][a] * (mdp.reward[s][a] + gamma * V[mdp.next[s][a]] - V[s])),
  );
  return { J: V.reduce((a, b) => a + b, 0) / nS, grad, V };
}
// REINFORCE on the same task: sample an episode, and push each action's logit by the return that followed it.
export function reinforceEpisode(mdp, theta, r, { horizon = 40, eta = 0.01, baseline = null } = {}) {
  let s = Math.floor(r() * mdp.nS);
  const steps = [];
  for (let t = 0; t < horizon; t++) {
    const pi = softmaxPolicy(theta, s);
    let u = r();
    let a = 0;
    while (a < mdp.nA - 1 && (u -= pi[a]) > 0) a++;
    steps.push([s, a, mdp.reward[s][a], pi]);
    s = mdp.next[s][a];
  }
  let G = 0;
  for (let t = steps.length - 1; t >= 0; t--) {
    const [st, a, rew, pi] = steps[t];
    G = rew + mdp.gamma * G;
    const adv = G - (baseline ? baseline[st] : 0);
    const disc = mdp.gamma ** t;
    for (let b = 0; b < mdp.nA; b++) theta[st][b] += eta * disc * adv * ((b === a ? 1 : 0) - pi[b]);
  }
}

// Holland's bucket brigade with bids proportional to strength (wealth). Rule i (one per state, under a
// fixed policy) bids bid·S_i; the winner pays its bid to the previous winner and a tax tax·S_i, and
// receives the reward. This is TD(0) on V = S with step α = bid + tax, discount γ = bid/(bid + tax) and
// reward scaled by 1/(bid + tax): the tax plays the part of discounting.
export function bucketBrigade(trajectory, rewards, S, { bid = 0.1, tax = 0 }) {
  // trajectory: states s_0..s_T; rewards: r_1..r_T (r_t follows the move from s_{t−1})
  let taxes = 0;
  for (let t = 0; t + 1 < trajectory.length; t++) {
    const i = trajectory[t];
    const j = trajectory[t + 1];
    const pay = bid * S[j]; // j's bid, paid to i for the state i produced
    const out = (bid + tax) * S[i]; // i's own bid (paid earlier, to its supplier) and its tax
    taxes += tax * S[i];
    S[i] += -out + pay + rewards[t];
  }
  return { taxes };
}
export function td0(trajectory, rewards, V, { alpha, gamma }) {
  for (let t = 0; t + 1 < trajectory.length; t++) {
    const i = trajectory[t];
    const j = trajectory[t + 1];
    V[i] += alpha * (rewards[t] + gamma * V[j] - V[i]);
  }
}

// A Hayek-style population (Baum 1999; Kwee, Hutter & Schmidhuber 2001). Agents are rules (state,
// action, bid) with wealth. At each state the solvent agent with the highest bid wins (it may bid more
// than it holds, and dies if that leaves it broke),
// pays its bid to the previous winner, acts, collects the reward and is later paid by the next winner.
// Each action costs a tax. Agents richer than `birth` spawn a child (a mutated copy, endowed from the
// parent's wealth); agents that go broke die. States with no affordable bidder get a random newcomer.
export function makeHayek(mdp, { seed = 21, perState = 3, endow = 1, maxBid = 1 } = {}) {
  const r = rng(seed);
  const agents = [];
  for (let s = 0; s < mdp.nS; s++) for (let k = 0; k < perState; k++) agents.push({ s, a: Math.floor(r() * mdp.nA), bid: maxBid * r(), wealth: endow, lastWin: 0 });
  return { mdp, agents, r, endow, maxBid, births: 0, deaths: 0, episode: 0 };
}
export function hayekEpisode(h, { start = 0, horizon = 40, tax = 0.01, birth = 4, mutate = 0.1, idle = 50, jitter = 0.05 } = {}) {
  const { mdp, r } = h;
  h.episode++;
  let s = start;
  let prev = null;
  let money = 0;
  for (let t = 0; t < horizon; t++) {
    let win = null;
    for (const ag of h.agents) if (ag.s === s && ag.wealth > 0 && (!win || ag.bid > win.bid || (ag.bid === win.bid && r() < 0.5))) win = ag;
    if (!win) {
      win = { s, a: Math.floor(r() * mdp.nA), bid: h.maxBid * r(), wealth: h.endow, lastWin: h.episode };
      h.agents.push(win);
      money += h.endow; // a newcomer's endowment is new money
    }
    win.lastWin = h.episode;
    win.wealth -= win.bid + tax;
    money -= tax;
    // the buyer pays the seller, discounted as in the market MDP; the first buyer of an episode pays no one
    if (prev) prev.wealth += mdp.gamma * win.bid;
    money -= prev ? (1 - mdp.gamma) * win.bid : win.bid;
    const rew = mdp.reward[s][win.a];
    win.wealth += rew;
    money += rew;
    prev = win;
    s = mdp.next[s][win.a];
  }
  // births and deaths
  const kids = [];
  for (const ag of h.agents) {
    if (ag.wealth > birth) {
      const child = { s: ag.s, a: r() < mutate ? Math.floor(r() * mdp.nA) : ag.a, bid: Math.max(0, ag.bid + jitter * r.normal()), wealth: h.endow, lastWin: h.episode };
      ag.wealth -= h.endow;
      kids.push(child);
      h.births++;
    }
  }
  // the broke die; so do agents that haven't won for `idle` episodes (as in Hayek4). Their wealth,
  // positive or negative, leaves with them.
  const dying = h.agents.filter((ag) => !(ag.wealth > 0 && h.episode - ag.lastWin <= idle));
  h.agents = h.agents.filter((ag) => ag.wealth > 0 && h.episode - ag.lastWin <= idle).concat(kids);
  h.deaths += dying.length;
  return { money, removed: dying.reduce((sum, ag) => sum + ag.wealth, 0) };
}

// ================================================================= Part C: competition without prices
// Unsupervised competitive learning: units compete for each input (hard: the nearest wins; soft:
// a logit over −distance²/τ), and the winner's weights move toward the input it won (instar, Hebbian).
// An optional "conscience" (DeSieno 1988) is a price per unit that rises when it wins more than its
// share: the load-balancing bias of a mixture of experts.
export function competitive(data, { K, steps = 4000, eta = 0.05, alloc = 'hard', tau = 0.1, conscience = 0, seed = 31, init = null }) {
  const r = rng(seed);
  const d = data[0].length;
  const W = init ? init.map((w) => Float64Array.from(w)) : Array.from({ length: K }, () => Float64Array.from(data[Math.floor(r() * data.length)]));
  const price = zeros(K);
  const wins = zeros(K);
  for (let t = 0; t < steps; t++) {
    const x = data[Math.floor(r() * data.length)];
    const cost = W.map((w, k) => {
      let s = 0;
      for (let i = 0; i < d; i++) s += (x[i] - w[i]) ** 2;
      return s + price[k];
    });
    let alpha;
    if (alloc === 'soft') {
      const mn = Math.min(...cost);
      alpha = cost.map((c) => Math.exp(-(c - mn) / tau));
      const z = alpha.reduce((s, v) => s + v, 0);
      alpha = alpha.map((v) => v / z);
    } else {
      alpha = cost.map(() => 0);
      alpha[cost.indexOf(Math.min(...cost))] = 1;
    }
    for (let k = 0; k < K; k++) {
      wins[k] += alpha[k];
      for (let i = 0; i < d; i++) W[k][i] += eta * alpha[k] * (x[i] - W[k][i]);
      // tâtonnement on the share of inputs won: raise the price of a unit that wins more than 1/K
      if (conscience) price[k] += conscience * (alpha[k] - 1 / K);
    }
  }
  return { W, wins, price };
}

// ================================================================= Part D: a market for a dense layer
// The units of a dense network as firms. A unit buys its inputs at a price per unit of each input and
// sells its output; it raises its own profit at the prices it faces, taking them as given:
// ΔW_ki = η·g_k·h_i, with g_k = c_k·f′(z_k) its output's price per unit of net input. A unit doesn't pay
// its suppliers their marginal contribution π_k·f′(z_k)·W_ki·h_i: that payment grows with its own
// weights, and for bias-free ReLU units it leaves profit at exactly zero for every weight (Euler), so
// "raise your profit" would say nothing. The last layer is paid by the customer, honestly, the price
// y − h per unit. Each buyer k's marginal value for one more unit of supplier i's output is
// v_ki = g_k·W_ki, and the designs differ only in what supplier i is told, its credit c_i:
//   honest     Σ_k v_ki each example: backprop's price, paid as money
//   voluntary  what self-interested buyers pay for a good they get anyway (non-excludable): nothing
//   vcg        buyers report values and pay a Clarke tax v²/2 (Clarke 1971); reporting truly is
//              dominant, so c_i = Σ_k v_ki, and the books record what the supplier's push costs
//   average    the honest price averaged over examples: signed and true, but not per example
//   posted     excludable: a supplier asks each buyer a price per unit of its output; a buyer that
//              refuses is cut off. One hidden layer only (the buyers are the linear outputs)
export function makeDenseMarket(net, { design = 'honest', ema = 0.01, askStep = 1e-3 } = {}) {
  const L = net.sizes.length - 1;
  if (design === 'posted' && L !== 2) throw new Error('posted prices: one hidden layer only');
  const m = { design, ema, askStep, n: 0, paid: 0, cost: 0, avg: [], ask: null, sub: null, val: null, hh: null, qty: null };
  for (let l = 1; l < L; l++) m.avg[l] = zeros(net.sizes[l]);
  if (design === 'posted') {
    const n = net.sizes[2] * net.sizes[1];
    m.ask = zeros(n);
    m.sub = Float64Array.from({ length: n }, () => 1);
    m.val = zeros(n);
    m.hh = zeros(n);
    m.qty = zeros(n);
  }
  return m;
}
// forward with optional connection masks (mask[l−1][k·cols + i] ∈ {0, 1}), one unit removed (drop =
// [l, i]), and noise added to net inputs
export function forwardMasked(net, x, { mask = null, drop = null, noise = null } = {}) {
  const h = [Float64Array.from(x)];
  const z = [null];
  for (let l = 1; l < net.sizes.length; l++) {
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    const W = net.W[l - 1];
    const M = mask && mask[l - 1];
    const zl = zeros(rows);
    for (let k = 0; k < rows; k++) {
      let s = 0;
      for (let i = 0; i < cols; i++) s += W[k * cols + i] * h[l - 1][i] * (M ? M[k * cols + i] : 1);
      zl[k] = s + net.b[l - 1][k] + (noise && noise[l] ? noise[l][k] : 0);
    }
    const hl = Float64Array.from(zl, ACT[net.acts[l - 1]].f);
    if (drop && drop[0] === l) hl[drop[1]] = 0;
    z.push(zl);
    h.push(hl);
  }
  return { h, z };
}
export function denseMarketStep(net, x, y, eta, m) {
  const L = net.sizes.length - 1;
  const mask = m.design === 'posted' ? [null, m.sub] : null;
  const fw = forwardMasked(net, x, { mask });
  const warm = Math.max(m.ema, 1 / (m.n + 1)); // running averages: plain means while they warm up
  const c = Array(L + 1).fill(null);
  const g = Array(L + 1).fill(null);
  c[L] = Float64Array.from(fw.h[L], (v, i) => y[i] - v);
  for (let l = L; l >= 1; l--) {
    g[l] = Float64Array.from(c[l], (v, k) => v * ACT[net.acts[l - 1]].df(fw.z[l][k]));
    if (l === 1) break;
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    const W = net.W[l - 1];
    c[l - 1] = zeros(cols);
    for (let i = 0; i < cols; i++) {
      let sum = 0;
      let sq = 0;
      for (let k = 0; k < rows; k++) {
        const v = g[l][k] * W[k * cols + i];
        if (m.design !== 'posted') {
          sum += v;
          sq += v * v;
          continue;
        }
        const j = k * cols + i;
        if (!m.sub[j]) continue;
        const hi = fw.h[l - 1][i];
        sum += m.ask[j];
        m.paid += m.ask[j] * hi;
        // the buyer values access at its best use: the loss it could remove with the best weight on
        // input i, (E[r·h])² / (2·E[h²]), r its error without i. Never negative.
        const r = c[l][k] + W[j] * hi;
        m.val[j] += warm * (r * hi - m.val[j]);
        m.hh[j] += warm * (hi * hi - m.hh[j]);
        m.qty[j] += warm * (hi - m.qty[j]);
      }
      if (m.design === 'honest' || m.design === 'vcg' || m.design === 'posted') c[l - 1][i] = sum;
      if (m.design === 'vcg') {
        m.paid += sq / 2;
        m.cost += (sum * sum) / 2;
      }
      if (m.design === 'average') {
        m.avg[l - 1][i] += warm * (sum - m.avg[l - 1][i]);
        c[l - 1][i] = m.avg[l - 1][i];
      }
    }
  }
  for (let l = 1; l <= L; l++) {
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    const M = mask && mask[l - 1];
    for (let k = 0; k < rows; k++) for (let i = 0; i < cols; i++) net.W[l - 1][k * cols + i] += eta * g[l][k] * fw.h[l - 1][i] * (M ? M[k * cols + i] : 1);
  }
  if (m.design === 'posted') {
    // keep access while its value covers its cost; a supplier raises an accepted ask and lowers a refused one
    for (let j = 0; j < m.ask.length; j++) {
      const worth = m.hh[j] > 1e-12 ? (m.val[j] * m.val[j]) / (2 * m.hh[j]) : Infinity;
      m.sub[j] = worth >= m.ask[j] * m.qty[j] ? 1 : 0;
      m.ask[j] = Math.max(0, m.ask[j] + (m.sub[j] ? m.askStep : -m.askStep));
    }
  }
  m.n++;
  return { fw, c };
}
// Excludable access sold at each buyer's true value, example by example. Supplier i's fee is what its
// buyers would lose without it: D_i = L(without i) − L(with i), a difference reward (Wolpert & Tumer
// 1999). D_i alone says how much, not which way, so each supplier jitters its own net input and
// correlates the change in its fee with its jitter. Removing i from both terms cancels the other
// units' jitter to first order, which a broadcast change in loss (node perturbation) doesn't.
// The output layer is paid by the customer, as in the market above.
export function accessStep(net, x, y, eta, { sigma = 1e-3, rng: r = rng(17) } = {}) {
  const L = net.sizes.length - 1;
  const noise = net.sizes.map((n, l) => (l === 0 || l === L ? null : Float64Array.from({ length: n }, () => sigma * r.normal())));
  const lossOf = (opt) => loss(forwardMasked(net, x, opt).h[L], y);
  const base = lossOf({});
  const jit = lossOf({ noise });
  const fw = forward(net, x);
  const e = Array(L + 1).fill(null);
  for (let l = 1; l < L; l++) {
    e[l] = Float64Array.from(noise[l], (xi, i) => {
      const fee = lossOf({ noise, drop: [l, i] }) - jit;
      const fee0 = lossOf({ drop: [l, i] }) - base;
      return (-(fee - fee0) * xi) / (sigma * sigma);
    });
  }
  e[L] = Float64Array.from(fw.h[L], (v, i) => (v - y[i]) * ACT[net.acts[L - 1]].df(fw.z[L][i]));
  for (let l = 1; l <= L; l++) {
    const rows = net.sizes[l];
    const cols = net.sizes[l - 1];
    for (let k = 0; k < rows; k++) for (let i = 0; i < cols; i++) net.W[l - 1][k * cols + i] -= eta * e[l][k] * fw.h[l - 1][i];
  }
  return e;
}

// ================================================================= Part E: one price for rationing and credit
// A mixture-of-experts layer with a capacity per expert, routed two ways.
//   gate     the engineered split: a router score trained by the gradient through its gate (credit) plus a
//            balancing bias moved by DeepSeek's fixed step toward the average load (rationing). Tokens over
//            capacity are dropped, in arrival order or by gate probability (batch prioritized routing).
//   auction  one price: each expert bids its forecast of the loss reduction it would deliver on a token.
//            An ascending auction with one price per expert assigns tokens subject to capacity (rationing),
//            and each expert moves its bid toward the loss reduction it realized, what it is paid (credit).
// The task: inputs from NC clusters, each with its own linear map; a dropped token costs ½‖y‖².
export function makeMoETask({ D = 8, O = 4, NC = 4, seed = 7 } = {}) {
  const r = rng(seed);
  const mu = Array.from({ length: NC }, () => Float64Array.from({ length: D }, () => 1.5 * r.normal()));
  const T = Array.from({ length: NC }, () => Float64Array.from({ length: O * D }, () => r.normal() / Math.sqrt(D)));
  const sample = (rr) => {
    const c = Math.floor(rr() * NC);
    const x = Float64Array.from(mu[c], (m) => m + rr.normal());
    return { c, x, y: matvec(T[c], O, D, x) };
  };
  return { D, O, NC, sample };
}
// Each token takes the expert with the highest value minus price, or nothing (worth `outside`); an
// overloaded expert raises its price by its (cap+1)-th largest margin, so exactly cap tokens stay. Prices
// only rise, a full expert stays full, and at the end every token holds its best option at the posted
// prices and every expert with a positive price is full: the complementary slackness of the assignment
// problem, so the assignment maximizes total value (to within eps per token; each raise adds eps, which
// stops displaced tokens from ping-ponging in tiny steps). Returns the assignment (−1: not served), the
// prices (capacity multipliers) and each token's surplus.
export function auctionAssign(value, cap, { outside = 0, eps = 1e-3 } = {}) {
  const nT = value.length;
  const nE = value[0].length;
  const price = zeros(nE);
  const where = new Int32Array(nT);
  const surplus = zeros(nT);
  for (let round = 0; round < 10000; round++) {
    const load = new Int32Array(nE);
    const margins = Array.from({ length: nE }, () => []);
    for (let t = 0; t < nT; t++) {
      let best = outside;
      let second = outside;
      let e1 = -1;
      for (let e = 0; e < nE; e++) {
        const net = value[t][e] - price[e];
        if (net > best) {
          second = best;
          best = net;
          e1 = e;
        } else if (net > second) second = net;
      }
      where[t] = e1;
      surplus[t] = Math.max(0, best);
      if (e1 >= 0) {
        load[e1]++;
        margins[e1].push(best - second);
      }
    }
    let over = false;
    for (let e = 0; e < nE; e++) {
      if (load[e] <= cap) continue;
      over = true;
      price[e] += margins[e].sort((a, b) => b - a)[cap] + eps;
    }
    if (!over) break;
  }
  return { where, price, surplus };
}
const sqn = (a) => a.reduce((s, v) => s + v * v, 0);
const quadFeatures = (x) => {
  const f = [...x];
  for (let i = 0; i < x.length; i++) for (let j = i; j < x.length; j++) f.push((x[i] * x[j]) / 4);
  return Float64Array.from(f);
};
// Train and evaluate one routing design. Returns test loss, share of tokens dropped, how much the
// dropped tokens were worth (½‖y‖² relative to the average token), offered or served load (max ÷ mean),
// each cluster's best expert fit (its loss with the expert that fits it best), and the routing of the
// first test batch (for drawing).
export function trainMoE(design, { task = makeMoETask(), K = 4, B = 64, cf = 1, steps = 3000, eta = 0.02, routerRate = 5, bias = true, biasStep = 0.01, priority = false, capacity = true, features = 'quadratic', seed = 1 } = {}) {
  const { D, O, NC } = task;
  const r = rng(seed + 100);
  const rw = rng(seed);
  const rr = rng(seed + 5);
  const W = Array.from({ length: K }, () => Float64Array.from({ length: O * D }, () => (0.1 * rw.normal()) / Math.sqrt(D)));
  const phi = design === 'auction' && features === 'quadratic' ? quadFeatures : (x) => x;
  const nF = phi(new Float64Array(D)).length;
  const G = Array.from({ length: K }, () => Float64Array.from({ length: nF + 1 }, () => 0.01 * rr.normal()));
  const b = zeros(K);
  const cap = Math.ceil((cf * B) / K);
  const ev = { drop: 0, n: 0, load: 0, batches: 0, dropValue: 0, value: 0 };
  let example = null; // the first test batch: each token's cluster and worth, and where it went
  const step = (batch, train) => {
    const nT = batch.length;
    const feats = batch.map(({ x }) => phi(x));
    const score = feats.map((f) => G.map((g) => g[nF] + dot(g.subarray(0, nF), f)));
    const where = new Int32Array(nT).fill(-1);
    let maxLoad = 0;
    if (design === 'gate') {
      const pick = score.map((sc) => {
        let e = 0;
        for (let k = 1; k < K; k++) if (sc[k] + (bias ? b[k] : 0) > sc[e] + (bias ? b[e] : 0)) e = k;
        return e;
      });
      const prob = score.map((sc, t) => {
        const m = Math.max(...sc);
        return Math.exp(sc[pick[t]] - m) / sc.reduce((z, v) => z + Math.exp(v - m), 0);
      });
      const order = [...Array(nT).keys()];
      if (priority) order.sort((u, v) => prob[v] - prob[u]);
      const offered = new Int32Array(K);
      for (const t of order) {
        if (!capacity || offered[pick[t]] < cap) where[t] = pick[t];
        offered[pick[t]]++;
      }
      maxLoad = Math.max(...offered);
      if (train && bias) for (let k = 0; k < K; k++) b[k] += biasStep * Math.sign(nT / K - offered[k]);
    } else {
      const got = capacity ? auctionAssign(score, cap).where : Int32Array.from(score, (sc) => (Math.max(...sc) > 0 ? sc.indexOf(Math.max(...sc)) : -1));
      where.set(got);
      const served = new Int32Array(K);
      for (const e of got) if (e >= 0) served[e]++;
      maxLoad = Math.max(...served);
    }
    let total = 0;
    const gW = W.map(() => zeros(O * D));
    const gG = G.map(() => zeros(nF + 1));
    for (let t = 0; t < nT; t++) {
      const { x, y } = batch[t];
      const e = where[t];
      const worth = sqn(y) / 2;
      if (!train) ev.value += worth;
      if (e < 0) {
        total += worth;
        if (!train) {
          ev.drop++;
          ev.dropValue += worth;
        }
        continue;
      }
      const out = matvec(W[e], O, D, x);
      let p = 1;
      let P = null;
      if (design === 'gate') {
        const m = Math.max(...score[t]);
        P = score[t].map((v) => Math.exp(v - m));
        const z = P.reduce((a, c) => a + c, 0);
        P = P.map((v) => v / z);
        p = P[e];
      }
      const res = Float64Array.from(y, (v, i) => v - p * out[i]);
      total += sqn(res) / 2;
      if (!train) continue;
      for (let i = 0; i < O; i++) for (let j = 0; j < D; j++) gW[e][i * D + j] -= p * res[i] * x[j];
      if (design === 'gate') {
        const dLdp = -res.reduce((s, v, i) => s + v * out[i], 0);
        for (let k = 0; k < K; k++) {
          const ds = dLdp * p * ((k === e ? 1 : 0) - P[k]);
          for (let j = 0; j < D; j++) gG[k][j] += ds * x[j];
          gG[k][nF] += ds;
        }
      } else {
        const err = score[t][e] - (worth - sqn(res) / 2); // bid minus the loss reduction realized
        for (let j = 0; j < nF; j++) gG[e][j] += err * feats[t][j];
        gG[e][nF] += err;
      }
    }
    if (train) {
      for (let k = 0; k < K; k++) {
        for (let i = 0; i < O * D; i++) W[k][i] -= (eta * gW[k][i]) / nT;
        for (let i = 0; i <= nF; i++) G[k][i] -= (routerRate * eta * gG[k][i]) / nT;
      }
    } else {
      ev.n += nT;
      ev.load += maxLoad / (nT / K);
      ev.batches++;
      example ||= { tokens: batch.map(({ c, y }) => ({ c, worth: sqn(y) / 2 })), where: Array.from(where), cap };
    }
    return total / nT;
  };
  for (let s = 0; s < steps; s++) step(Array.from({ length: B }, () => task.sample(r)), true);
  const rt = rng(999);
  let loss = 0;
  for (let s = 0; s < 40; s++) loss += step(Array.from({ length: B }, () => task.sample(rt)), false) / 40;
  const fit = Array.from({ length: NC }, () => Infinity);
  const re = rng(4242);
  const sums = Array.from({ length: K }, () => zeros(NC));
  const counts = zeros(NC);
  for (let s = 0; s < 2000; s++) {
    const { c, x, y } = task.sample(re);
    counts[c]++;
    for (let e = 0; e < K; e++) sums[e][c] += sqn(Float64Array.from(matvec(W[e], O, D, x), (v, i) => y[i] - v)) / 2;
  }
  for (let c = 0; c < NC; c++) for (let e = 0; e < K; e++) fit[c] = Math.min(fit[c], sums[e][c] / counts[c]);
  return { loss, drop: ev.drop / ev.n, dropValue: ev.drop ? ev.dropValue / ev.drop / (ev.value / ev.n) : 0, load: ev.load / ev.batches, fit, example };
}

// How good a network's last hidden layer is as features: the lowest loss any linear readout could reach
// on them over `data` (least squares, with a tiny ridge for safety).
export function bestReadoutLoss(net, data) {
  const L = net.sizes.length - 1;
  const H = data.map(([x]) => forward(net, x).h[L - 1]);
  const n = H[0].length;
  const dOut = data[0][1].length;
  const A = Array.from({ length: n }, () => zeros(n + dOut));
  data.forEach(([, y], t) => {
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) A[a][b] += H[t][a] * H[t][b];
      for (let k = 0; k < dOut; k++) A[a][n + k] += H[t][a] * y[k];
    }
  });
  for (let a = 0; a < n; a++) A[a][a] += 1e-8 * data.length;
  for (let col = 0; col < n; col++) {
    let p = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[p][col])) p = r;
    [A[col], A[p]] = [A[p], A[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let k = col; k < n + dOut; k++) A[r][k] -= f * A[col][k];
    }
  }
  const R = A.map((row, a) => Float64Array.from(row.slice(n), (v) => v / A[a][a]));
  let total = 0;
  data.forEach(([, y], t) => {
    for (let k = 0; k < dOut; k++) {
      let p = 0;
      for (let a = 0; a < n; a++) p += H[t][a] * R[a][k];
      total += 0.5 * (p - y[k]) ** 2;
    }
  });
  return total / data.length;
}

export { flat };
