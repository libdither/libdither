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
// environment nobody can differentiate), Part C on unsupervised competition. learners.test.mjs
// checks each named learner against its textbook definition.

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

export { flat };
