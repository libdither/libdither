// Run with: node --test experiments/learners/learners.test.mjs
// Each test checks that a setting of the general learner is a named learner, or that a claim about
// prices, money or allocation holds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as X from './learners.mjs';

const relErr = (a, b) => {
  let n = 0;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    n += (a[i] - b[i]) ** 2;
    d += b[i] ** 2;
  }
  return Math.sqrt(n / (d + 1e-300));
};
const sample = (r, n) => Float64Array.from({ length: n }, () => r.normal());
// a teacher: y = T x, for supervised tasks
function teacher(dIn, dOut, seed) {
  const r = X.rng(seed);
  const T = Float64Array.from({ length: dIn * dOut }, () => r.normal() / Math.sqrt(dIn));
  return (x) => X.matvec(T, dOut, dIn, x);
}

// ================================================================= Part A: white-box stages
test('backprop: the adjoint sweep gives the exact gradient', () => {
  for (const act of ['linear', 'relu', 'tanh']) {
    const net = X.makeNet({ sizes: [4, 6, 5, 3], act, bias: true, seed: 2 });
    const r = X.rng(3);
    const x = sample(r, 4);
    const y = sample(r, 3);
    const { gW } = X.gradients(net, X.credit(net, x, y, 'backprop'));
    const fd = X.finiteDiffGrad(net, x, y);
    for (let l = 0; l < gW.length; l++) assert.ok(relErr(gW[l], fd[l]) < 1e-6, `${act}, layer ${l + 1}: ${relErr(gW[l], fd[l])}`);
  }
});

test('backprop prices are shadow prices: −a[l] is what one more unit of layer l’s output is worth', () => {
  // Lagrangian view (LeCun 1988): relax "h[l] = f(W h[l−1])" and the multiplier is the adjoint.
  const net = X.makeNet({ sizes: [3, 5, 4, 2], act: 'tanh', bias: true, seed: 4 });
  const r = X.rng(5);
  const x = sample(r, 3);
  const y = sample(r, 2);
  const cr = X.credit(net, x, y, 'backprop');
  const L = net.sizes.length - 1;
  const lossFrom = (l, hl) => {
    let h = hl;
    for (let m = l + 1; m <= L; m++) {
      const z = X.matvec(net.W[m - 1], net.sizes[m], net.sizes[m - 1], h);
      h = Float64Array.from(z, (v, i) => {
        const u = v + net.b[m - 1][i];
        return net.acts[m - 1] === 'tanh' ? Math.tanh(u) : net.acts[m - 1] === 'relu' ? Math.max(0, u) : u;
      });
    }
    return X.loss(h, y);
  };
  for (let l = 1; l <= L; l++) {
    const fd = Float64Array.from(cr.fw.h[l], (_, i) => {
      const up = Float64Array.from(cr.fw.h[l]);
      const dn = Float64Array.from(cr.fw.h[l]);
      up[i] += 1e-6;
      dn[i] -= 1e-6;
      return (lossFrom(l, up) - lossFrom(l, dn)) / 2e-6;
    });
    assert.ok(relErr(cr.a[l], fd) < 1e-6, `layer ${l}`);
  }
});

test('Euler: with homogeneous units and no biases, every unit breaks even and value is conserved from output to input', () => {
  const r = X.rng(6);
  for (const act of ['linear', 'relu']) {
    const net = X.makeNet({ sizes: [5, 7, 6, 3], act, bias: false, seed: 7 });
    const x = sample(r, 5);
    const y = sample(r, 3);
    const acc = X.accounts(net, X.credit(net, x, y, 'backprop'));
    for (const ly of acc.layers) for (const p of ly.profit) assert.ok(Math.abs(p) < 1e-12, `${act}: zero profit`);
    const values = [acc.inputValue, ...acc.totalRevenue];
    for (const v of values) assert.ok(Math.abs(v - values[values.length - 1]) < 1e-10, `${act}: conserved ${values}`);
  }
  // A supplier's revenue is the sum of what every buyer pays it (a non-rival good: Samuelson), for any units.
  const net = X.makeNet({ sizes: [5, 7, 6, 3], act: 'tanh', bias: true, seed: 8 });
  const x = sample(r, 5);
  const y = sample(r, 3);
  const cr = X.credit(net, x, y, 'backprop');
  const acc = X.accounts(net, cr);
  for (let l = 1; l < acc.layers.length; l++) assert.ok(relErr(acc.layers[l].paidTo, acc.layers[l - 1].revenue) < 1e-12, 'revenue = Σ buyers’ payments');
  // With biases or curved units, profits are rents: for ReLU they are exactly π·f′·b, the bias's share.
  const relu = X.makeNet({ sizes: [5, 7, 6, 3], act: 'relu', bias: true, seed: 9 });
  const crR = X.credit(relu, x, y, 'backprop');
  const accR = X.accounts(relu, crR);
  accR.layers.forEach((ly, k) => {
    const l = k + 1;
    ly.profit.forEach((p, i) => {
      const rent = ly.price[i] * (crR.fw.z[l][i] > 0 || relu.acts[l - 1] === 'linear' ? 1 : 0) * relu.b[l - 1][i];
      assert.ok(Math.abs(p - rent) < 1e-12, 'profit = bias rent');
    });
  });
  assert.ok(acc.layers.some((ly) => ly.profit.some((p) => Math.abs(p) > 1e-6)), 'tanh units with biases make profits and losses');
});

test('feedback alignment: align = 1 is backprop exactly; at align = 0 the net still learns, and its forward weights come to agree with the fixed feedback', () => {
  const f = teacher(8, 4, 10);
  const r = X.rng(11);
  const data = Array.from({ length: 200 }, () => {
    const x = sample(r, 8);
    return [x, f(x)];
  });
  const net = X.makeNet({ sizes: [8, 16, 4], act: 'tanh', seed: 12 });
  const [x0, y0] = data[0];
  const bp = X.gradients(net, X.credit(net, x0, y0, 'backprop')).gW;
  const fa1 = X.gradients(net, X.credit(net, x0, y0, 'feedback', { align: 1 })).gW;
  bp.forEach((g, l) => assert.ok(relErr(fa1[l], g) < 1e-15, 'align = 1 is backprop'));
  const meanLoss = (n) => data.reduce((s, [x, y]) => s + X.loss(X.forward(n, x).h[2], y), 0) / data.length;
  const priceAgreement = (n) => {
    // cosine between the hidden layer's update under feedback alignment and under backprop, over the data
    const fa = new Float64Array(16 * 8);
    const bpSum = new Float64Array(16 * 8);
    for (const [x, y] of data) {
      const g1 = X.gradients(n, X.credit(n, x, y, 'feedback', { align: 0 })).gW[0];
      const g2 = X.gradients(n, X.credit(n, x, y, 'backprop')).gW[0];
      for (let k = 0; k < fa.length; k++) { fa[k] += g1[k]; bpSum[k] += g2[k]; }
    }
    return X.cosine(fa, bpSum);
  };
  const before = { loss: meanLoss(net), agree: priceAgreement(net) };
  for (let ep = 0; ep < 60; ep++) for (const [x, y] of data) X.step(net, x, y, 'feedback', 0.01, { align: 0 });
  const after = { loss: meanLoss(net), agree: priceAgreement(net) };
  assert.ok(after.loss < 0.1 * before.loss, `learns: ${before.loss} → ${after.loss}`);
  assert.ok(after.agree > 0.7 && after.agree > before.agree + 0.3, `updates come to agree: ${before.agree} → ${after.agree}`);
  assert.ok(X.cosine(net.W[1], net.R[1]) > 0.5, 'the forward weights align with the fixed feedback');
});

test('node perturbation: one broadcast number, correlated with each unit’s own jitter, is an unbiased gradient', () => {
  const net = X.makeNet({ sizes: [4, 5, 3], act: 'tanh', bias: true, seed: 13 });
  const r = X.rng(14);
  const x = sample(r, 4);
  const y = sample(r, 3);
  const exact = X.credit(net, x, y, 'backprop').e;
  const sum = [null, new Float64Array(5), new Float64Array(3)];
  const n = 20000;
  const noise = X.rng(15);
  for (let k = 0; k < n; k++) {
    const est = X.credit(net, x, y, 'perturb', { rng: noise, sigma: 1e-4 }).e;
    for (let l = 1; l <= 2; l++) for (let i = 0; i < est[l].length; i++) sum[l][i] += est[l][i] / n;
  }
  for (let l = 1; l <= 2; l++) assert.ok(X.cosine(sum[l], exact[l]) > 0.97, `layer ${l}: cosine ${X.cosine(sum[l], exact[l])}`);
});

test('predictive coding: settled prediction errors are backprop’s prices, to first order in the nudge', () => {
  const net = X.makeNet({ sizes: [4, 6, 5, 3], act: 'tanh', bias: true, seed: 16 });
  const r = X.rng(17);
  const x = sample(r, 4);
  const y = sample(r, 3);
  const bp = X.credit(net, x, y, 'backprop');
  const err = (beta) => {
    const pc = X.credit(net, x, y, 'relax', { beta, steps: 4000, rate: 0.2 });
    return Math.max(...[1, 2, 3].map((l) => relErr(pc.a[l], bp.a[l])));
  };
  const small = err(1e-3);
  const big = err(1e-2);
  assert.ok(small < 0.01, `β = 0.001: ${small}`);
  assert.ok(big > 5 * small, `the gap scales with β: ${small} vs ${big}`);
});

test('mixture of experts: the soft gate’s gradient is exact, and as the temperature falls the coalition becomes one winner', () => {
  const m = X.makeMoE({ dIn: 4, dOut: 3, K: 5, seed: 18 });
  const r = X.rng(19);
  const x = sample(r, 4);
  const y = sample(r, 3);
  const g = X.moeGrad(m, x, y, 0.7);
  const lossAt = () => X.loss(X.moeForward(m, x, { alloc: 'soft', tau: 0.7 }).y, y);
  const fd = (arr) =>
    Float64Array.from(arr, (_, k) => {
      const v = arr[k];
      arr[k] = v + 1e-6;
      const up = lossAt();
      arr[k] = v - 1e-6;
      const dn = lossAt();
      arr[k] = v;
      return (up - dn) / 2e-6;
    });
  assert.ok(relErr(g.gG, fd(m.G)) < 1e-6, 'gate');
  m.E.forEach((E, k) => assert.ok(relErr(g.gE[k], fd(E)) < 1e-6, `expert ${k}`));
  const hard = X.moeForward(m, x, { alloc: 'hard' }).alpha;
  const cold = X.moeForward(m, x, { alloc: 'soft', tau: 1e-3 }).alpha;
  assert.ok(relErr(cold, hard) < 1e-6, 'τ → 0: the soft coalition is the auction’s winner');
  // a price per expert moves the winner, as a load-balancing bias does
  const w = hard.indexOf(1);
  m.bias[w] = 100;
  assert.notEqual(X.moeForward(m, x, { alloc: 'hard' }).alpha.indexOf(1), w);
});

// ================================================================= Part B: black-box stages
const mdp = X.makeMDP({ nS: 6, nA: 3, gamma: 0.9, seed: 5 });
const Qstar = X.valueIteration(mdp);
const greedy = (q) => q.indexOf(Math.max(...q));

test('market for control: bidding Q* in a cloned Vickrey society is an equilibrium where every winner breaks even and credit is conserved', () => {
  const m = X.makeMarket(mdp, { clones: 2 });
  m.agents.forEach((ag) => ag.value.set(Qstar.map((q) => q[ag.action])));
  const price = (s, winnerAction) => {
    // highest competing bid: with clones, the winner's twin bids the same
    let best = -Infinity;
    let skipped = false;
    for (const ag of m.agents) {
      if (!skipped && ag.action === winnerAction) { skipped = true; continue; }
      best = Math.max(best, ag.value[s]);
    }
    return best;
  };
  for (let s = 0; s < mdp.nS; s++) {
    const a = greedy(Qstar[s]);
    const s2 = mdp.next[s][a];
    const paid = price(s, a);
    const received = mdp.reward[s][a] + mdp.gamma * price(s2, greedy(Qstar[s2]));
    assert.ok(Math.abs(paid - Qstar[s][a]) < 1e-9, 'the winner pays what it bid');
    assert.ok(Math.abs(received - paid) < 1e-9, `state ${s}: utility ${received - paid}`);
  }
  // Without clones the winner pays the runner-up's bid, so payments no longer match valuations.
  const solo = X.makeMarket(mdp, { clones: 1 });
  solo.agents.forEach((ag) => ag.value.set(Qstar.map((q) => q[ag.action])));
  const runnerUp = (s) => [...Qstar[s]].sort((p, q) => q - p)[1];
  const gap = Math.max(...Qstar.map((q, s) => Math.abs(q[greedy(q)] - runnerUp(s))));
  assert.ok(gap > 0.1, 'credit leaks without clones');
});

test('markets learn: cloned Vickrey is Q-learning (it finds Q* at any exploration); first-price is SARSA; Vickrey without clones leaks credit', () => {
  const eps = 0.2;
  const train = (clones, pricing, episodes, eta, seed) => {
    const m = X.makeMarket(mdp, { clones, seed });
    const r = X.rng(seed + 50);
    for (let ep = 0; ep < episodes; ep++) X.marketEpisode(m, { start: Math.floor(r() * mdp.nS), horizon: 30, pricing, eta, alloc: 'argmax', explore: eps });
    return m;
  };
  // expected fixed points of each market's update, given ε-greedy winners
  const fixedPoint = (priceAt) => {
    const V = Array.from({ length: mdp.nS }, () => new Float64Array(mdp.nA));
    for (let it = 0; it < 3000; it++) {
      const P = V.map(priceAt);
      for (let s = 0; s < mdp.nS; s++) for (let a = 0; a < mdp.nA; a++) V[s][a] = mdp.reward[s][a] + mdp.gamma * P[mdp.next[s][a]];
    }
    return V;
  };
  const nA = mdp.nA;
  const sarsa = fixedPoint((v) => (1 - eps) * Math.max(...v) + (eps * v.reduce((s, x) => s + x, 0)) / nA);
  const leaky = fixedPoint((v) => {
    const s = [...v].sort((p, q) => q - p);
    const pGreedy = 1 - eps + eps / nA;
    return pGreedy * s[1] + (1 - pGreedy) * s[0];
  });
  const cloned = train(2, 'second', 15000, 0.1, 11);
  let worst = 0;
  for (let s = 0; s < mdp.nS; s++) for (const ag of cloned.agents) worst = Math.max(worst, Math.abs(ag.value[s] - Qstar[s][ag.action]));
  assert.ok(worst < 0.02, `cloned Vickrey: max |value − Q*| = ${worst}`);
  for (const [pricing, target, label] of [['first', sarsa, 'first-price ⇄ SARSA'], ['second', leaky, 'solitary Vickrey ⇄ second-best Bellman']]) {
    const m = train(1, pricing, 30000, 0.02, 11);
    let e = 0;
    for (let s = 0; s < mdp.nS; s++) for (const ag of m.agents) e = Math.max(e, Math.abs(ag.value[s] - target[s][ag.action]));
    assert.ok(e < 0.1, `${label}: max |value − predicted| = ${e}`);
  }
  // the leak is large: the best action's value ends up well below Q*
  const leak = Math.min(...Qstar.map((q, s) => q[greedy(q)] - leaky[s][greedy(q)]));
  assert.ok(leak > 1, `credit leaks: ${leak}`);
});

test('control with a white box: the exact policy gradient checks against finite differences and finds the optimal policy; REINFORCE’s broadcast return is the same gradient on average', () => {
  const theta = Array.from({ length: mdp.nS }, (_, s) => [0.1 * s, -0.2, 0.3]);
  const pg = X.policyGradient(mdp, theta);
  for (let s = 0; s < mdp.nS; s++) for (let a = 0; a < mdp.nA; a++) {
    const t2 = theta.map((row) => [...row]);
    t2[s][a] += 1e-6;
    const up = X.policyGradient(mdp, t2).J;
    t2[s][a] -= 2e-6;
    const dn = X.policyGradient(mdp, t2).J;
    assert.ok(Math.abs((up - dn) / 2e-6 - pg.grad[s][a]) < 1e-6, 'exact gradient');
  }
  const th = Array.from({ length: mdp.nS }, () => [0, 0, 0]);
  for (let it = 0; it < 3000; it++) {
    const g = X.policyGradient(mdp, th).grad;
    for (let s = 0; s < mdp.nS; s++) for (let a = 0; a < mdp.nA; a++) th[s][a] += 5 * g[s][a];
  }
  th.forEach((row, s) => assert.equal(row.indexOf(Math.max(...row)), greedy(Qstar[s]), `state ${s}`));
  // REINFORCE: the average update over many sampled episodes points along the exact gradient
  const r = X.rng(41);
  const avg = Array.from({ length: mdp.nS }, () => [0, 0, 0]);
  const n = 20000;
  for (let k = 0; k < n; k++) {
    const copy = theta.map((row) => [...row]);
    X.reinforceEpisode(mdp, copy, r, { horizon: 80, eta: 1 });
    for (let s = 0; s < mdp.nS; s++) for (let a = 0; a < mdp.nA; a++) avg[s][a] += (copy[s][a] - theta[s][a]) / n;
  }
  // the policy gradient theorem weights states by discounted visits from a uniform start, as policyGradient does
  const c = X.cosine(Float64Array.from(avg.flat()), Float64Array.from(pg.grad.flat()));
  assert.ok(c > 0.95, `cosine ${c}`);
});

test('bucket brigade with bids proportional to wealth is TD(0); a tax on strength is a discount', () => {
  const r = X.rng(23);
  const traj = [0];
  for (let t = 0; t < 500; t++) traj.push(mdp.next[traj[t]][Math.floor(r() * mdp.nA)]);
  const rewards = traj.slice(0, -1).map((s, t) => mdp.reward[s][Math.floor(t % mdp.nA)]);
  for (const [bid, tax] of [[0.1, 0], [0.1, 0.05], [0.3, 0.02]]) {
    const S = Float64Array.from({ length: mdp.nS }, (_, i) => 1 + i / 10);
    const V = Float64Array.from(S, (v) => v);
    X.bucketBrigade(traj, rewards, S, { bid, tax });
    X.td0(traj, rewards.map((v) => v / (bid + tax)), V, { alpha: bid + tax, gamma: bid / (bid + tax) });
    for (let i = 0; i < S.length; i++) assert.ok(Math.abs(S[i] - V[i]) < 1e-9, `bid ${bid}, tax ${tax}: ${S[i]} vs ${V[i]}`);
  }
});

test('Hayek: a population of bidding rules keeps exact books: rewards and endowments in, taxes and discounting out', () => {
  const easy = X.makeMDP({ nS: 6, nA: 3, gamma: 0.5, seed: 5 });
  const h = X.makeHayek(easy, { seed: 23, perState: 3, endow: 1, maxBid: 1 });
  const r = X.rng(123);
  let born = 0;
  let died = 0;
  for (let ep = 0; ep < 2000; ep++) {
    const before = h.agents.reduce((s, ag) => s + ag.wealth, 0);
    const { money, removed } = X.hayekEpisode(h, { start: Math.floor(r() * easy.nS), horizon: 20, tax: 0.01, birth: 3, mutate: 0.2 });
    // the dead take their wealth with them; children's endowments come from their parents
    const after = h.agents.reduce((s, ag) => s + ag.wealth, 0);
    assert.ok(Math.abs(after + removed - before - money) < 1e-9, `episode ${ep}: books balance`);
    born = h.births;
    died = h.deaths;
  }
  assert.ok(born > 100 && died > 100, `agents are born and die: ${born}, ${died}`);
});

// ================================================================= Part C: competition without prices
function clusters(seed) {
  const r = X.rng(seed);
  const centres = [[0, 0], [3, 0], [0, 3]];
  const data = [];
  for (let i = 0; i < 600; i++) {
    const c = centres[i % 3];
    data.push(Float64Array.from([c[0] + 0.3 * r.normal(), c[1] + 0.3 * r.normal()]));
  }
  return { centres, data };
}
const nearestDist = (W, c) => Math.min(...W.map((w) => Math.hypot(w[0] - c[0], w[1] - c[1])));

test('competitive learning: each winner moves to the centre of the inputs it wins (Hebbian, no prices)', () => {
  const { centres, data } = clusters(31);
  const res = X.competitive(data, { K: 3, steps: 6000, eta: 0.02, init: [[0.2, 0.2], [2.5, 0.3], [0.3, 2.6]] });
  for (const c of centres) assert.ok(nearestDist(res.W, c) < 0.15, `centre ${c}`);
});

test('a conscience (a price for winning more than one’s share) revives dead units', () => {
  const { centres, data } = clusters(32);
  // one unit starts in the middle of everything, the other two far away: it wins every input, they starve
  const init = [[1, 1], [-4, -4], [-4, -3.5]];
  const plain = X.competitive(data, { K: 3, steps: 8000, eta: 0.02, init });
  const priced = X.competitive(data, { K: 3, steps: 8000, eta: 0.02, init, conscience: 0.01 });
  const covered = (W) => centres.filter((c) => nearestDist(W, c) < 0.4).length;
  assert.ok(covered(plain.W) < 3, `without a price, a cluster is left uncovered (${covered(plain.W)} of 3)`);
  assert.equal(covered(priced.W), 3, 'with the price, every cluster gets a unit');
  const shares = priced.wins.map((w) => w / 8000);
  assert.ok(Math.max(...shares) < 0.4, `balanced wins: ${shares.map((s) => s.toFixed(2))}`);
});

// ================================================================= Part D: a market for a dense layer
// the ladder's supervised task: a linear teacher, 200 examples; rho > 0 makes the four outputs alike
function supervisedData({ rho = 0, n = 200 } = {}) {
  const r0 = X.rng(10);
  const T = Float64Array.from({ length: 32 }, () => r0.normal() / Math.sqrt(8));
  const base = (() => { const rb = X.rng(99); return Float64Array.from({ length: 8 }, () => rb.normal() / Math.sqrt(8)); })();
  const Tm = rho ? Float64Array.from(T, (v, k) => Math.sqrt(rho) * base[k % 8] + Math.sqrt(1 - rho) * v) : T;
  return Array.from({ length: n }, () => {
    const x = sample(r0, 8);
    return [x, X.matvec(Tm, 4, 8, x)];
  });
}
const lastLayerOnly = (net, x, y, eta) => {
  const { gW } = X.gradients(net, X.credit(net, x, y, 'backprop'));
  const l = gW.length - 1;
  for (let k = 0; k < gW[l].length; k++) net.W[l][k] -= eta * gW[l][k];
};

test('a market for a dense layer: honest per-example prices are backprop; voluntary payment for an activation everyone gets anyway is nothing, so only the last layer learns', () => {
  const data = supervisedData({ n: 60 }).map(([x, y]) => [x.slice(0, 5), y.slice(0, 3)]);
  for (const act of ['relu', 'tanh']) {
    const bp = X.makeNet({ sizes: [5, 7, 6, 3], act, seed: 40 });
    const honest = X.makeNet({ sizes: [5, 7, 6, 3], act, seed: 40 });
    const ro = X.makeNet({ sizes: [5, 7, 6, 3], act, seed: 40 });
    const vol = X.makeNet({ sizes: [5, 7, 6, 3], act, seed: 40 });
    const mH = X.makeDenseMarket(honest, { design: 'honest' });
    const mV = X.makeDenseMarket(vol, { design: 'voluntary' });
    for (const [x, y] of data) {
      X.step(bp, x, y, 'backprop', 0.01);
      X.denseMarketStep(honest, x, y, 0.01, mH);
      lastLayerOnly(ro, x, y, 0.01);
      X.denseMarketStep(vol, x, y, 0.01, mV);
    }
    bp.W.forEach((W, l) => assert.ok(relErr(honest.W[l], W) < 1e-12, `${act}: honest = backprop, layer ${l + 1}`));
    ro.W.forEach((W, l) => assert.ok(relErr(vol.W[l], W) < 1e-12, `${act}: voluntary = last layer only, layer ${l + 1}`));
    const init = X.makeNet({ sizes: [5, 7, 6, 3], act, seed: 40 });
    assert.ok(relErr(vol.W[0], init.W[0]) === 0 && relErr(vol.W[1], init.W[1]) === 0, 'hidden layers never move');
  }
});

test('VCG for a feature: reporting truly is dominant, each buyer pays v²/2, and payments cover less of the supplier’s cost the more its buyers agree', () => {
  // One supplier, buyers with values v_k for its push d, which costs d²/2. The welfare-maximizing push
  // is Σ v (backprop's price); the Clarke tax for buyer k is (others' best welfare without k) − (their
  // welfare at the chosen push) = v_k²/2 whatever the others report.
  const r = X.rng(41);
  for (let trial = 0; trial < 50; trial++) {
    const v = r.normal();
    const others = 3 * r.normal();
    const tax = (rep) => (others ** 2) / 2 - (others * (others + rep) - (others + rep) ** 2 / 2);
    assert.ok(Math.abs(tax(v) - v * v / 2) < 1e-12, 'Clarke tax = v²/2');
    const utility = (rep) => v * (others + rep) - tax(rep);
    for (const dev of [-1, -0.3, -0.01, 0.01, 0.3, 1]) assert.ok(utility(v + dev) < utility(v), 'misreporting never pays');
  }
  // Learning under VCG is backprop's; the books show payments Σ v²/2 against the cost (Σ v)²/2.
  const ratio = (rho) => {
    const data = supervisedData({ rho });
    const net = X.makeNet({ sizes: [8, 16, 4], act: 'relu', seed: 12 });
    const bp = X.makeNet({ sizes: [8, 16, 4], act: 'relu', seed: 12 });
    const m = X.makeDenseMarket(net, { design: 'vcg' });
    for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) {
      X.denseMarketStep(net, x, y, 0.01, m);
      X.step(bp, x, y, 'backprop', 0.01);
    }
    bp.W.forEach((W, l) => assert.ok(relErr(net.W[l], W) < 1e-12, 'VCG learns as backprop does'));
    return m.paid / m.cost;
  };
  const [independent, similar, alike] = [0, 0.9, 0.99].map(ratio);
  assert.ok(independent > 0.85 && independent < 1.15, `independent outputs: payments ≈ cost (${independent})`);
  assert.ok(independent > similar && similar > alike && alike < independent - 0.1, `outputs that agree leave a deficit (${independent}, ${similar}, ${alike})`);
});

test('a price that doesn’t vary with the example can’t teach a feature: E[f′(w·x)·x] points along w (ReLU) or vanishes (tanh), so averaged prices barely improve the features', () => {
  const r = X.rng(42);
  const w = sample(r, 6);
  const N = 100000;
  const eRelu = new Float64Array(6);
  const eTanh = new Float64Array(6);
  for (let t = 0; t < N; t++) {
    const x = sample(r, 6);
    const z = X.dot(w, x);
    for (let j = 0; j < 6; j++) {
      eRelu[j] += (z > 0 ? x[j] : 0) / N;
      eTanh[j] += ((1 - Math.tanh(z) ** 2) * x[j]) / N;
    }
  }
  // for Gaussian x, E[1(w·x > 0)·x] = w / (|w|·√(2π)): a supplier paid a fixed price can only grow
  assert.ok(X.cosine(eRelu, w) > 0.999, 'ReLU: along w');
  assert.ok(Math.abs(Math.hypot(...eRelu) - 1 / Math.sqrt(2 * Math.PI)) < 0.01, 'ReLU: norm 1/√(2π)');
  assert.ok(Math.hypot(...eTanh) < 0.02 * Math.hypot(...eRelu), 'tanh: no drift at all');
  const data = supervisedData();
  for (const act of ['relu', 'tanh']) {
    const init = X.bestReadoutLoss(X.makeNet({ sizes: [8, 16, 4], act, seed: 12 }), data);
    const run = (design) => {
      const net = X.makeNet({ sizes: [8, 16, 4], act, seed: 12 });
      const m = X.makeDenseMarket(net, { design });
      for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) X.denseMarketStep(net, x, y, 0.01, m);
      return X.bestReadoutLoss(net, data);
    };
    const honest = run('honest');
    const average = run('average');
    assert.ok(honest < 0.2 * init, `${act}: per-example prices teach features (${init} → ${honest})`);
    assert.ok(average > 0.5 * init, `${act}: averaged prices barely do (${init} → ${average})`);
  }
});

test('excludable posted prices: an ask only ever says “more”, so suppliers grow along their own weights, buyers drop in and out, and the features barely improve', () => {
  const data = supervisedData();
  const net = X.makeNet({ sizes: [8, 16, 4], act: 'relu', seed: 12 });
  const init = X.makeNet({ sizes: [8, 16, 4], act: 'relu', seed: 12 });
  const m = X.makeDenseMarket(net, { design: 'posted' });
  let refused = 0;
  for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) {
    X.denseMarketStep(net, x, y, 0.01, m);
    refused += m.sub.length - m.sub.reduce((s, v) => s + v, 0);
  }
  const norm = (W) => Math.sqrt(X.dot(W, W));
  assert.ok(norm(net.W[0]) > 1.5 * norm(init.W[0]), `suppliers grow (${norm(init.W[0])} → ${norm(net.W[0])})`);
  let cos = 0;
  for (let k = 0; k < 16; k++) cos += X.cosine(net.W[0].slice(k * 8, k * 8 + 8), init.W[0].slice(k * 8, k * 8 + 8)) / 16;
  assert.ok(cos > 0.9, `directions barely move (${cos})`);
  assert.ok(refused > 0, 'some buyers refuse at some point');
  assert.ok(X.bestReadoutLoss(net, data) > 0.5 * X.bestReadoutLoss(init, data), 'features barely better than at the start');
});

test('excludable access sold at its true value per example is a difference reward: an unbiased price with a tenth of node perturbation’s variance', () => {
  for (const act of ['relu', 'tanh']) {
    const net = X.makeNet({ sizes: [6, 8, 3], act, seed: 21 });
    const r = X.rng(22);
    const x = sample(r, 6);
    const y = sample(r, 3);
    const exact = X.credit(net, x, y, 'backprop').e[1];
    const N = 4000;
    const mean = { access: new Float64Array(8), perturb: new Float64Array(8) };
    const sq = { access: new Float64Array(8), perturb: new Float64Array(8) };
    for (let t = 0; t < N; t++) {
      const got = { access: X.accessStep(net, x, y, 0, { sigma: 1e-3, rng: r })[1], perturb: X.credit(net, x, y, 'perturb', { sigma: 1e-3, rng: r }).e[1] };
      for (const k of ['access', 'perturb']) for (let i = 0; i < 8; i++) {
        mean[k][i] += got[k][i] / N;
        sq[k][i] += got[k][i] ** 2 / N;
      }
    }
    assert.ok(relErr(mean.access, exact) < 0.06, `${act}: unbiased (${relErr(mean.access, exact)})`);
    const variance = (k) => sq[k].reduce((s, v, i) => s + v - mean[k][i] ** 2, 0);
    assert.ok(variance('access') < 0.2 * variance('perturb'), `${act}: variance ${variance('access') / variance('perturb')} of node perturbation's`);
  }
});

// ================================================================= Part E: one price for rationing and credit
test('one price per expert: the ascending auction keeps every expert within capacity, leaves every token at its best option, and maximizes total value; tokens’ surplus plus capacity rents is that value', () => {
  const brute = (value, cap) => {
    const nE = value[0].length;
    const load = new Int32Array(nE);
    let best = 0;
    const rec = (t, acc) => {
      if (t === value.length) { best = Math.max(best, acc); return; }
      rec(t + 1, acc);
      for (let e = 0; e < nE; e++) if (load[e] < cap) { load[e]++; rec(t + 1, acc + value[t][e]); load[e]--; }
    };
    rec(0, 0);
    return best;
  };
  const r = X.rng(50);
  const eps = 1e-3;
  for (let trial = 0; trial < 200; trial++) {
    const value = Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => 2 * r.normal() + 0.5));
    const { where } = X.auctionAssign(value, 2, { eps });
    const got = where.reduce((s, e, t) => s + (e >= 0 ? value[t][e] : 0), 0);
    assert.ok(brute(value, 2) - got <= 7 * eps, 'optimal to within ε per token');
  }
  for (let trial = 0; trial < 20; trial++) {
    const value = Array.from({ length: 64 }, () => Array.from({ length: 4 }, () => 3 * r.normal() + 2));
    const cap = 16;
    const { where, price, surplus } = X.auctionAssign(value, cap, { eps });
    const load = new Int32Array(4);
    for (const e of where) if (e >= 0) load[e]++;
    for (let e = 0; e < 4; e++) {
      assert.ok(load[e] <= cap, 'within capacity');
      if (price[e] > 0) assert.equal(load[e], cap, 'an expert with a positive price is full');
    }
    let served = 0;
    where.forEach((e, t) => {
      const net = e >= 0 ? value[t][e] - price[e] : 0;
      for (let k = 0; k < 4; k++) assert.ok(net >= value[t][k] - price[k] - eps, 'every token holds its best option');
      assert.ok(net >= -eps, 'or nothing');
      if (e >= 0) served += value[t][e];
    });
    const dual = surplus.reduce((s, v) => s + v, 0) + cap * price.reduce((s, v) => s + v, 0);
    assert.ok(Math.abs(dual - served) < 64 * eps, `surplus + rents = value (${dual} vs ${served})`);
  }
});

test('mixture of experts: one auction price rations better than a balancing bias, dropping the least valuable tokens, but credits worse: its experts fit their clusters less well, and with slack capacity it loses', () => {
  const run = (cf) => ({
    arrival: X.trainMoE('gate', { cf }),
    priority: X.trainMoE('gate', { cf, priority: true }),
    auction: X.trainMoE('auction', { cf }),
    linear: X.trainMoE('auction', { cf, features: 'linear', routerRate: 1 }),
  });
  const tight = run(1);
  assert.ok(tight.auction.load <= 1 + 1e-9, 'the auction never serves more than capacity');
  assert.ok(tight.auction.dropValue < 0.5 && tight.priority.dropValue > 0.6 && tight.arrival.dropValue > 0.9, `dropped tokens’ worth: auction ${tight.auction.dropValue}, priority ${tight.priority.dropValue}, arrival ${tight.arrival.dropValue}`);
  assert.ok(tight.auction.loss < tight.priority.loss && tight.priority.loss < tight.arrival.loss, `tight capacity: ${tight.auction.loss} < ${tight.priority.loss} < ${tight.arrival.loss}`);
  const slack = run(1.25);
  assert.ok(slack.priority.loss < 0.8 * slack.auction.loss, `slack capacity: gradient routing wins (${slack.priority.loss} vs ${slack.auction.loss})`);
  for (const r of [tight, slack]) {
    assert.ok(Math.max(...r.priority.fit) < 0.5 * Math.max(...r.auction.fit), 'gate-trained experts fit their clusters better');
    assert.ok(r.linear.loss > r.auction.loss, 'a bid must forecast an amount: linear bids do worse');
  }
});
