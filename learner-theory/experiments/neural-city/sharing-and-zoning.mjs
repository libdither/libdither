// Sharing vs separating two uses on the same neurons: the land-use version of superposition.
//
// Two input types, A and B, compete for neurons around a central input, as in rents-and-lids.mjs.
// Each neuron tracks recent activity per type (a_A, a_B: +β per spike, decay τa). An event of type X
// at neuron j pays
//     t·d_j            commute
//   + a_A + a_B        rent: the neuron's capacity is shared by both uses
//   + ν·a_Y            nuisance from the other use's recent activity (industry next to homes)
// so two uses that are active at the same time interfere when co-located, and uses active at
// different times don't. That is the rule Toy Models of Superposition found for features:
// co-active features get separate directions, mutually exclusive ones share.
//
// Timing:   "steady"     A and B arrive interleaved, all the time (co-active)
//           "day/night"  A only by day, B only by night, each phase 5·τa long (never co-active)
// Zoning:   "mixed"      any neuron may serve either use
//           "single-use" neurons alternate A-only / B-only in a checkerboard, so both uses still
//                        have land at every distance: the rule bans sharing, nothing else.
const t = 1, beta = 0.1, tauA = 100, kappa = beta * tauA, tau = 0.1, Rmax = 17;
let phase = 5 * tauA;

const dist = [], parity = [];
for (let i = -Rmax; i <= Rmax; i++) for (let k = -Rmax; k <= Rmax; k++) {
  const d = Math.hypot(i, k);
  if (d <= Rmax) { dist.push(d); parity.push((i + k) & 1); }
}
const N = dist.length;
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const bisect = (f, lo, hi) => { for (let i = 0; i < 100; i++) { const x = (lo + hi) / 2; if (f(x) > 0) hi = x; else lo = x; } return (lo + hi) / 2; };

// Demand putting the edge of a one-use city at 9 (same as rents-and-lids.mjs).
const lambda = dist.reduce((s, d) => s + Math.max(0, 9 - t * d) / kappa, 0);

// Deterministic predictions, ignoring transitions between phases.
// A use with demand D on a set of neurons S fills S out to the radius where Σ_S (μ − t·d)/κ = D.
function fill(S, D) {
  const mu = bisect((m) => S.reduce((s, j) => s + Math.max(0, m - t * dist[j]) / kappa, 0) - D, 0, 100);
  return { mu, used: S.filter((j) => dist[j] < mu / t), rate: (j) => Math.max(0, mu - t * dist[j]) / kappa };
}
const all = [...Array(N).keys()];
const zoneA = all.filter((j) => parity[j] === 0), zoneB = all.filter((j) => parity[j] === 1);
function theory(timing, zoning) {
  // Steady: each use has demand λ/2 at all times. Day/night: one use at a time with demand λ.
  const D = timing === 'steady' ? lambda / 2 : lambda;
  if (zoning === 'single-use') {
    const a = fill(zoneA, D), b = fill(zoneB, D);
    const used = new Set([...a.used, ...b.used]);
    const commute = (a.used.reduce((s, j) => s + a.rate(j) * dist[j], 0) + b.used.reduce((s, j) => s + b.rate(j) * dist[j], 0)) / (2 * D);
    return { land: used.size, commute };
  }
  const f = fill(all, lambda); // shared: the two uses together behave like one use with demand λ
  return { land: f.used.length, commute: f.used.reduce((s, j) => s + f.rate(j) * dist[j], 0) / lambda };
}

function simulate({ timing, zoning, nu, seed, burn = 2 * phase, measure = 8 * phase }) {
  const rng = mulberry32(seed);
  const aA = new Float64Array(N), aB = new Float64Array(N), w = new Float64Array(N), cost = new Float64Array(N);
  const spA = new Float64Array(N), spB = new Float64Array(N);
  let now = 0, n = 0, paid = 0, nuisance = 0;
  while (now < burn + measure) {
    const dt = -Math.log(1 - rng()) / lambda;
    now += dt;
    const decay = Math.exp(-dt / tauA);
    const isA = timing === 'steady' ? rng() < 0.5 : Math.floor(now / phase) % 2 === 0;
    let best = Infinity;
    for (let j = 0; j < N; j++) {
      aA[j] *= decay; aB[j] *= decay;
      if (zoning === 'single-use' && parity[j] !== (isA ? 0 : 1)) { cost[j] = Infinity; continue; }
      cost[j] = t * dist[j] + aA[j] + aB[j] + nu * (isA ? aB[j] : aA[j]);
      if (cost[j] < best) best = cost[j];
    }
    let sum = 0;
    for (let j = 0; j < N; j++) { const x = cost[j] === Infinity ? 0 : Math.exp(-(cost[j] - best) / tau); w[j] = x; sum += x; }
    let u = rng() * sum, win = N - 1;
    for (let j = 0; j < N; j++) { u -= w[j]; if (u <= 0) { win = j; break; } }
    if (now > burn) {
      n++;
      paid += cost[win];
      nuisance += nu * (isA ? aB[win] : aA[win]);
      (isA ? spA : spB)[win]++;
    }
    (isA ? aA : aB)[win] += beta;
  }
  // A neuron counts as urban if either use gives it ≥ 2% of a free-market centre neuron's load
  // while that use is present (each use is present, or at half demand, for half the time).
  const floor = 0.02 * (9 / kappa) * measure / 2;
  let land = 0, mixed = 0, dsum = 0;
  for (let j = 0; j < N; j++) {
    const s = spA[j] + spB[j];
    dsum += s * dist[j];
    if (Math.max(spA[j], spB[j]) < floor) continue;
    land++;
    if (Math.min(spA[j], spB[j]) >= 0.2 * s) mixed++;
  }
  return { land, commute: dsum / n, mixedShare: mixed / land, costPerEvent: paid / n, nuisancePerEvent: nuisance / n };
}

const fmt = (x, d = 2) => x.toFixed(d);
const scenarios = [
  { timing: 'steady', zoning: 'mixed', nu: 0, note: 'compatible uses, used at the same time' },
  { timing: 'steady', zoning: 'mixed', nu: 2, note: 'incompatible uses, used at the same time' },
  { timing: 'steady', zoning: 'single-use', nu: 2, note: '…with single-use zoning' },
  { timing: 'day/night', zoning: 'mixed', nu: 2, note: 'incompatible uses, used at different times' },
  { timing: 'day/night', zoning: 'single-use', nu: 2, note: '…with single-use zoning' },
];
console.log(`N=${N}, demand λ=${fmt(lambda, 1)}, phase ${phase} (${phase / tauA}·τa), τ=${tau}\n`);
console.log('timing | zoning | ν | neurons in use (theory / sim) | mean distance (theory / sim) | neurons serving both uses | cost per event | of which nuisance | ');
for (const [i, s] of scenarios.entries()) {
  const th = theory(s.timing, s.zoning);
  const sim = simulate({ ...s, seed: 11 + i });
  console.log(`${s.timing} | ${s.zoning} | ${s.nu} | ${th.land} / ${sim.land} | ${fmt(th.commute)} / ${fmt(sim.commute)} | ${Math.round(sim.mixedShare * 100)}% | ${fmt(sim.costPerEvent)} | ${fmt(sim.nuisancePerEvent)} | ${s.note}`);
}

// How much does timesharing save as the phases get long compared with the time the previous
// use's activity takes to clear (τa)? Theory (instant clearance): mixed = one-use city, zoned = +63%.
if (process.env.SWEEP) {
  console.log('\nphase/τa | neurons in use: mixed / single-use | mean distance: mixed / single-use | cost per event: mixed / single-use | nuisance paid, mixed');
  for (const k of process.env.SWEEP.split(',').map(Number)) {
    phase = k * tauA;
    const m = simulate({ timing: 'day/night', zoning: 'mixed', nu: 2, seed: 101 });
    const z = simulate({ timing: 'day/night', zoning: 'single-use', nu: 2, seed: 102 });
    console.log(`${k} | ${m.land} / ${z.land} | ${fmt(m.commute)} / ${fmt(z.commute)} | ${fmt(m.costPerEvent)} / ${fmt(z.costPerEvent)} | ${fmt(m.nuisancePerEvent)}`);
  }
}
