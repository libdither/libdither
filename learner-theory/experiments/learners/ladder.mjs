// Run with: node experiments/learners/ladder.mjs
// Every setting of the general learner on the same tasks, so the README can say where each lands.
import * as X from './learners.mjs';

const sample = (r, n) => Float64Array.from({ length: n }, () => r.normal());
const fmt = (v, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : '—');
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// ---------------------------------------------------------------- white-box stages: a supervised task
function supervised() {
  const r0 = X.rng(10);
  const T = Float64Array.from({ length: 32 }, () => r0.normal() / Math.sqrt(8));
  const data = Array.from({ length: 200 }, () => {
    const x = sample(r0, 8);
    return [x, X.matvec(T, 4, 8, x)];
  });
  const meanLoss = (net) => data.reduce((s, [x, y]) => s + X.loss(X.forward(net, x).h[2], y), 0) / data.length;
  const rows = [];
  const settings = [
    ['backprop', 'backprop', {}, 0.01, 'exact vector prices from a backward sweep'],
    ['feedback, align = 0.5', 'feedback', { align: 0.5 }, 0.01, 'half-right price map'],
    ['feedback alignment', 'feedback', { align: 0 }, 0.01, 'a fixed random price map'],
    ['direct feedback alignment', 'direct', {}, 0.01, 'output price sent straight to each layer'],
    ['predictive coding', 'relax', { beta: 0.01, steps: 300, rate: 0.2 }, 0.01, 'prices found by local relaxation'],
    ['node perturbation', 'perturb', { sigma: 1e-3 }, 0.002, 'one broadcast scalar'],
  ];
  for (const [label, mode, opt, eta, how] of settings) {
    const finals = [];
    for (const seed of [12, 13, 14]) {
      const net = X.makeNet({ sizes: [8, 16, 4], act: 'tanh', seed });
      const r = X.rng(seed + 1);
      for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) X.step(net, x, y, mode, eta, { ...opt, rng: r });
      finals.push(meanLoss(net));
    }
    const start = meanLoss(X.makeNet({ sizes: [8, 16, 4], act: 'tanh', seed: 12 }));
    rows.push([label, how, fmt(start), fmt(median(finals), 4)]);
  }
  return rows;
}

// ---------------------------------------------------------------- black-box stages: a control task
function control() {
  const mdp = X.makeMDP({ nS: 6, nA: 3, gamma: 0.9, seed: 5 });
  const Q = X.valueIteration(mdp);
  const opt = Q.map((q) => q.indexOf(Math.max(...q)));
  const rows = [];
  const markets = [
    ['market, Vickrey, cloned', 2, 'second', 'Q-learning: off-policy'],
    ['market, Vickrey, no clones', 1, 'second', 'credit leaks to the runner-up'],
    ['market, first price (bucket-brigade auction)', 1, 'first', 'SARSA: on-policy'],
  ];
  for (const [label, clones, pricing, reads] of markets) {
    const errs = [];
    const pols = [];
    for (const seed of [11, 12, 13]) {
      const m = X.makeMarket(mdp, { clones, seed });
      const r = X.rng(seed + 50);
      for (let ep = 0; ep < 15000; ep++) X.marketEpisode(m, { start: Math.floor(r() * mdp.nS), horizon: 30, pricing, eta: 0.1, alloc: 'argmax', explore: 0.2 });
      let err = 0;
      let ok = 0;
      for (let s = 0; s < mdp.nS; s++) {
        const qa = Array.from({ length: mdp.nA }, (_, a) => Math.max(...m.agents.filter((g) => g.action === a).map((g) => g.value[s])));
        if (qa.indexOf(Math.max(...qa)) === opt[s]) ok++;
        err += (qa[opt[s]] - Q[s][opt[s]]) / mdp.nS;
      }
      errs.push(err);
      pols.push(ok);
    }
    rows.push([label, reads, fmt(median(errs)), `${median(pols)}/6`]);
  }
  // the same task with a white box (exact policy gradient through the known model) and with REINFORCE
  {
    const J = (th) => X.policyGradient(mdp, th).J;
    const Jstar = Q.reduce((s, q) => s + Math.max(...q), 0) / mdp.nS;
    const th = Array.from({ length: mdp.nS }, () => [0, 0, 0]);
    for (let it = 0; it < 3000; it++) {
      const g = X.policyGradient(mdp, th).grad;
      for (let s = 0; s < mdp.nS; s++) for (let a = 0; a < mdp.nA; a++) th[s][a] += 5 * g[s][a];
    }
    const okExact = th.filter((row, s) => row.indexOf(Math.max(...row)) === opt[s]).length;
    rows.push(['exact policy gradient (known model)', 'vector prices: the white-box end', `policy value ${fmt(J(th) - Jstar)}`, `${okExact}/6`]);
    const oks = [];
    const gaps = [];
    for (const seed of [1, 2, 3]) {
      const t = Array.from({ length: mdp.nS }, () => [0, 0, 0]);
      const r = X.rng(seed);
      for (let ep = 0; ep < 15000; ep++) X.reinforceEpisode(mdp, t, r, { horizon: 30, eta: 0.01 });
      oks.push(t.filter((row, s) => row.indexOf(Math.max(...row)) === opt[s]).length);
      gaps.push(J(t) - Jstar);
    }
    rows.push(['REINFORCE', 'one broadcast scalar (the return)', `policy value ${fmt(median(gaps))}`, `${median(oks)}/6`]);
  }
  // a Hayek-style population on an easier task (γ = 0.5)
  const easy = X.makeMDP({ nS: 6, nA: 3, gamma: 0.5, seed: 5 });
  const Qe = X.valueIteration(easy);
  const optE = Qe.map((q) => q.indexOf(Math.max(...q)));
  const pols = [];
  const errs = [];
  for (const seed of [21, 22, 23, 24, 25]) {
    const h = X.makeHayek(easy, { seed, perState: 3, endow: 1, maxBid: 1 });
    const r = X.rng(seed + 100);
    for (let ep = 0; ep < 20000; ep++) X.hayekEpisode(h, { start: Math.floor(r() * easy.nS), horizon: 20, tax: 0, birth: 3, mutate: 0.2, jitter: 0.05 });
    let ok = 0;
    let err = 0;
    for (let s = 0; s < easy.nS; s++) {
      let win = null;
      for (const ag of h.agents) if (ag.s === s && ag.wealth > 0 && (!win || ag.bid > win.bid)) win = ag;
      if (win && win.a === optE[s]) ok++;
      err += ((win ? win.bid : 0) - Qe[s][optE[s]]) / easy.nS;
    }
    pols.push(ok);
    errs.push(err);
  }
  rows.push(['Hayek-style population (γ = 0.5)', 'evolved bids, births and deaths', fmt(median(errs)), `${Math.min(...pols)}–${Math.max(...pols)}/6`]);
  return rows;
}

// ---------------------------------------------------------------- competition without prices
function unsupervised() {
  const r = X.rng(31);
  const centres = [[0, 0], [3, 0], [0, 3]];
  const data = Array.from({ length: 600 }, (_, i) => Float64Array.from([centres[i % 3][0] + 0.3 * r.normal(), centres[i % 3][1] + 0.3 * r.normal()]));
  const bad = [[1, 1], [-4, -4], [-4, -3.5]];
  const covered = (W) => centres.filter((c) => Math.min(...W.map((w) => Math.hypot(w[0] - c[0], w[1] - c[1]))) < 0.4).length;
  const rows = [];
  for (const [label, opt] of [
    ['hard competition (winner-take-all)', { alloc: 'hard' }],
    ['soft competition, τ = 0.5', { alloc: 'soft', tau: 0.5 }],
    ['hard competition + conscience (a price)', { alloc: 'hard', conscience: 0.01 }],
  ]) {
    const res = X.competitive(data, { K: 3, steps: 8000, eta: 0.02, init: bad, ...opt });
    rows.push([label, `${covered(res.W)}/3`, res.wins.map((w) => (w / 8000).toFixed(2)).join(', ')]);
  }
  return rows;
}

// ---------------------------------------------------------------- a market for a dense layer
// The same supervised task. A hidden unit sells its output to the four output units; the designs differ
// in what it is told (its credit). "Best readout" is the lowest loss any linear readout could reach on
// the hidden layer's features: how much the hidden layer itself learned.
function denseMarket(act) {
  const r0 = X.rng(10);
  const T = Float64Array.from({ length: 32 }, () => r0.normal() / Math.sqrt(8));
  const data = Array.from({ length: 200 }, () => {
    const x = sample(r0, 8);
    return [x, X.matvec(T, 4, 8, x)];
  });
  const meanLoss = (net) => data.reduce((s, [x, y]) => s + X.loss(X.forward(net, x).h[2], y), 0) / data.length;
  const market = (design) => (net, x, y, st) => X.denseMarketStep(net, x, y, 0.01, st.m || (st.m = X.makeDenseMarket(net, { design })));
  const settings = [
    ['backprop (= honest market = VCG)', 'its exact price, each example', (net, x, y) => X.step(net, x, y, 'backprop', 0.01)],
    ['access sold at its true value', 'what its buyers would lose without it, each example (a difference reward)', (net, x, y, st) => X.accessStep(net, x, y, 0.01, { sigma: 1e-3, rng: st.r })],
    ['node perturbation', 'one broadcast change in loss', (net, x, y, st) => X.step(net, x, y, 'perturb', 0.002, { sigma: 1e-3, rng: st.r })],
    ['honest price, averaged', 'its exact price, averaged over examples', market('average')],
    ['posted asks, excludable', 'the asks its buyers accept', market('posted')],
    ['voluntary payment (= readout only)', 'nothing: buyers get its output anyway', market('voluntary')],
  ];
  const start = median([12, 13, 14].map((seed) => X.bestReadoutLoss(X.makeNet({ sizes: [8, 16, 4], act, seed }), data)));
  const rows = settings.map(([label, told, stepFn]) => {
    const losses = [];
    const feats = [];
    for (const seed of [12, 13, 14]) {
      const net = X.makeNet({ sizes: [8, 16, 4], act, seed });
      const st = { r: X.rng(seed + 1) };
      for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) stepFn(net, x, y, st);
      losses.push(meanLoss(net));
      feats.push(X.bestReadoutLoss(net, data));
    }
    return [label, told, fmt(median(losses), 4), fmt(median(feats), 4)];
  });
  return { start, rows };
}
// Under VCG each buyer pays v²/2 and the supplier's push costs (Σ v)²/2. How much of the cost the
// payments cover, as the four outputs are made more alike (rho), so their values for a feature agree.
function vcgBudget() {
  const rb = X.rng(99);
  const base = Float64Array.from({ length: 8 }, () => rb.normal() / Math.sqrt(8));
  return [0, 0.5, 0.9, 0.99].map((rho) => {
    const r0 = X.rng(10);
    const T0 = Float64Array.from({ length: 32 }, () => r0.normal() / Math.sqrt(8));
    const T = Float64Array.from(T0, (v, k) => Math.sqrt(rho) * base[k % 8] + Math.sqrt(1 - rho) * v);
    const data = Array.from({ length: 200 }, () => {
      const x = sample(r0, 8);
      return [x, X.matvec(T, 4, 8, x)];
    });
    const shares = [12, 13, 14].map((seed) => {
      const net = X.makeNet({ sizes: [8, 16, 4], act: 'relu', seed });
      const m = X.makeDenseMarket(net, { design: 'vcg' });
      for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) X.denseMarketStep(net, x, y, 0.01, m);
      return m.paid / m.cost;
    });
    return [String(rho), fmt(median(shares), 2)];
  });
}

// ---------------------------------------------------------------- one price for rationing and credit
// A mixture of 4 linear experts on inputs from 4 clusters, each with its own linear map; batches of 64,
// capacity cf × 16 per expert. "Gate" is a router trained through its gate plus DeepSeek's balancing bias;
// "auction" is experts bidding their forecast loss reduction, cleared with one price per expert.
function experts(cf) {
  const settings = [
    ['gate + bias, overflow dropped in arrival order', 'gate', {}],
    ['gate + bias, overflow dropped by gate probability', 'gate', { priority: true }],
    ['gate, no bias', 'gate', { bias: false }],
    ['auction, quadratic bids', 'auction', {}],
    ['auction, linear bids', 'auction', { features: 'linear', routerRate: 1 }],
    ['bids, no capacity', 'auction', { capacity: false }],
  ];
  return settings.map(([label, design, opt]) => {
    const rs = [1, 2, 3].map((seed) => X.trainMoE(design, { seed, cf, ...opt }));
    const m = (f) => median(rs.map(f));
    return [label, fmt(m((r) => r.loss), 3), `${fmt(100 * m((r) => r.drop), 1)}%`, fmt(m((r) => r.dropValue), 2), fmt(m((r) => r.load), 2), fmt(m((r) => Math.max(...r.fit)), 3)];
  });
}

const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
console.log('Supervised task (tanh 8→16→4 net, linear teacher, 30 epochs of 200 samples; median of 3 seeds)\n');
console.log(table(['Setting', 'Prices', 'Loss at start', 'Loss after'], supervised()));
console.log('\nControl task (6-state MDP; values vs Q* at the optimal action; median of seeds)\n');
console.log(table(['Setting', 'Equivalent to', 'Error (values, or the policy’s value vs optimal)', 'Optimal actions'], control()));
console.log('\nUnsupervised task (3 clusters; one unit starts in the middle, two far away)\n');
console.log(table(['Setting', 'Clusters covered', 'Share of wins'], unsupervised()));
for (const act of ['relu', 'tanh']) {
  const { start, rows } = denseMarket(act);
  console.log(`\nA market for a dense layer (${act} 8→16→4 net, no biases, same task; median of 3 seeds; best readout at start ${fmt(start, 4)})\n`);
  console.log(table(['Setting', 'Each hidden unit is told', 'Loss after', 'Best readout on its features'], rows));
}
console.log('\nVCG: share of the supplier’s cost that buyers’ payments cover, as the outputs are made alike (ReLU, median of 3 seeds)\n');
console.log(table(['rho', 'Payments ÷ cost'], vcgBudget()));
for (const cf of [1, 1.25]) {
  console.log(`\nOne price for rationing and credit: a mixture of experts at capacity ${cf}× the average load (median of 3 seeds)\n`);
  console.log(table(['Setting', 'Loss', 'Dropped', 'Dropped tokens’ worth ÷ average', 'Busiest expert ÷ average', 'Worst cluster’s best fit'], experts(cf)));
}
