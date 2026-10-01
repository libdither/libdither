// Hotels vs homes: when should the whole give a part its own customized space?
//
// K occupant types come and go. Each is present a fraction p of the time (its duty cycle), in
// on/off spells averaging 10·τa per cycle, and while present sends events at rate λ/(K·p), so
// average demand is λ whatever p is. Neurons sit around a central input as in rents-and-lids.mjs.
// An event of type k at neuron j pays
//     t·d_j + a_j + m·(1 − w_jk)
// where a_j is the neuron's rent (shared by every type it serves) and w_j is its tuning, the
// customization: a neuron tuned to k serves k at no mismatch and everyone else at mismatch m.
//
//   homes    each neuron belongs to one type: fully customized, and nobody else may use it
//   hotels   tuning is fixed and uniform: anyone may use any neuron, at mismatch m·(1 − 1/K)
//   learned  anyone may use any neuron, and tuning follows whoever uses it (Hebbian, rate η)
//
// This is the phase diagram Toy Models of Superposition found for features (frequent, important
// features get dedicated dimensions; sparse ones share) posed as a housing question.
const t = 1, beta = 0.1, tauA = 100, tau = 0.1, Rmax = 17, K = 8, eta = 0.02;
const cycle = 10 * tauA;
const m = Number(process.env.M ?? 2);
const p = Number(process.env.P ?? 0.5);

const dist = [], owner = [];
for (let i = -Rmax; i <= Rmax; i++) for (let k = -Rmax; k <= Rmax; k++) {
  const d = Math.hypot(i, k);
  if (d <= Rmax) { dist.push(d); owner.push((((i + 3 * k) % K) + K) % K); }
}
const N = dist.length;
const lambda = dist.reduce((s, d) => s + Math.max(0, 9 - t * d) / (beta * tauA), 0);
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate(regime, seed, burn = 2 * cycle, measure = 8 * cycle) {
  const rng = mulberry32(seed);
  const exp = (mean) => -Math.log(1 - rng()) * mean;
  const a = new Float64Array(N), w = new Float64Array(N * K).fill(1 / K), cost = new Float64Array(N);
  if (regime === 'homes') { w.fill(0); for (let j = 0; j < N; j++) w[j * K + owner[j]] = 1; }
  const on = Array.from({ length: K }, () => rng() < p);
  const toggleAt = on.map((x) => exp(x ? p * cycle : (1 - p) * cycle));
  const rateEach = lambda / (K * p);
  const spikes = new Float64Array(N);
  let now = 0, n = 0, paidTotal = 0, paidMismatch = 0, dsum = 0;
  while (now < burn + measure) {
    const present = [];
    for (let k = 0; k < K; k++) if (on[k]) present.push(k);
    const nextToggle = Math.min(...toggleAt);
    const dt = present.length ? exp(1 / (rateEach * present.length)) : Infinity;
    if (now + dt >= nextToggle) {
      const k = toggleAt.indexOf(nextToggle);
      const decay = Math.exp(-(nextToggle - now) / tauA);
      for (let j = 0; j < N; j++) a[j] *= decay;
      now = nextToggle;
      on[k] = !on[k];
      toggleAt[k] = now + exp(on[k] ? p * cycle : (1 - p) * cycle);
      continue;
    }
    now += dt;
    const decay = Math.exp(-dt / tauA);
    const k = present[Math.floor(rng() * present.length)];
    let best = Infinity;
    for (let j = 0; j < N; j++) {
      a[j] *= decay;
      if (regime === 'homes' && owner[j] !== k) { cost[j] = Infinity; continue; }
      cost[j] = t * dist[j] + a[j] + m * (1 - w[j * K + k]);
      if (cost[j] < best) best = cost[j];
    }
    let sum = 0;
    for (let j = 0; j < N; j++) { const x = cost[j] === Infinity ? 0 : Math.exp(-(cost[j] - best) / tau); cost[j] = x; sum += x; }
    let u = rng() * sum, win = N - 1;
    for (let j = 0; j < N; j++) { u -= cost[j]; if (u <= 0) { win = j; break; } }
    const mismatch = m * (1 - w[win * K + k]);
    if (now > burn) {
      n++;
      paidTotal += t * dist[win] + a[win] + mismatch;
      paidMismatch += mismatch;
      dsum += dist[win];
      spikes[win]++;
    }
    a[win] += beta;
    if (regime === 'learned') for (let q = 0; q < K; q++) w[win * K + q] += eta * ((q === k ? 1 : 0) - w[win * K + q]);
  }
  // Customization of the neurons actually in use: max tuning weight, spike-weighted.
  // Footprint: the fewest neurons that together handle 99% of events.
  let spec = 0, sw = 0, land = 0, acc = 0;
  for (const x of [...spikes].sort((u, v) => v - u)) { if (acc >= 0.99 * n) break; acc += x; land++; }
  for (let j = 0; j < N; j++) {
    let mx = 0;
    for (let q = 0; q < K; q++) mx = Math.max(mx, w[j * K + q]);
    spec += spikes[j] * mx; sw += spikes[j];
  }
  return { cost: paidTotal / n, mismatch: paidMismatch / n, commute: dsum / n, customization: spec / sw, land };
}

const f = (x, d = 2) => x.toFixed(d);
const out = ['homes', 'hotels', 'learned'].map((r, i) => [r, simulate(r, 1000 * p + 10 * m + i)]);
const best = out.reduce((b, x) => (x[1].cost < b[1].cost ? x : b));
console.log(
  `m=${m} p=${p} | ` +
    out.map(([r, s]) => `${r}: cost ${f(s.cost)} (mismatch ${f(s.mismatch)}, distance ${f(s.commute)}, land ${s.land}, customization ${f(s.customization)})`).join(' | ') +
    ` | best: ${best[0]}`,
);
