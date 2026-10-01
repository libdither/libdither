// A population of adapting neurons competing for input events, checked against the
// Alonso–Muth city it should be equivalent to.
//
//   neuron j            = a parcel of land at distance d_j from where inputs arrive
//   c_j = t·d_j         = commute (conduction/wiring energy per event)
//   rate r_j            = floor space built on the parcel (events it houses per unit time)
//   adaptation a_j      = rent from the construction-cost curve: +β per spike, decays with τa,
//                         so a_j → κ·r_j (κ = β·τa): a quadratic cost of building tall
//   cap price λ_j       = shadow price of a height limit: +η per spike, −η·rMax per unit time,
//                         floored at 0 (integral control → hard cap on the rate)
//   winner              = logit choice over c_j + a_j + λ_j (lateral-inhibition competition)
//   outside option V    = the event is dropped (people leave) if the cheapest place costs more
//
// Deterministic equilibrium (τ → 0): r_j = min(cap_j, max(0, (μ − c_j)/κ)),
// closed city Σ r_j = Λ; price at an occupied parcel = μ − c_j (linear bid-rent).
const t = 1;
const beta = 0.1;
const tauA = 100;
const kappa = beta * tauA;
const tau = Number(process.env.TAU ?? 0.1);
const etaCap = 0.02;
const Rmax = 17;

const dist = [];
for (let i = -Rmax; i <= Rmax; i++) for (let k = -Rmax; k <= Rmax; k++) {
  const d = Math.hypot(i, k);
  if (d <= Rmax) dist.push(d);
}
const N = dist.length;
const c = Float64Array.from(dist, (d) => t * d);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const ratesAt = (mu, cap) => Float64Array.from(c, (cj, j) => Math.min(cap[j], Math.max(0, (mu - cj) / kappa)));
const total = (r) => r.reduce((s, x) => s + x, 0);
function bisect(f, lo, hi) {
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
// served(μ): share of arriving events that stay when the price level is μ.
function equilibrium(cap, lambda, served = () => 1) {
  const mu = bisect((m) => total(ratesAt(m, cap)) - lambda * served(m), 0, 200);
  const r = ratesAt(mu, cap);
  return { mu, r, served: total(r) / lambda };
}

function simulate({ cap, lambda, V, seed, burn = 1500, measure = 4000 }) {
  const rng = mulberry32(seed);
  const a = new Float64Array(N);
  const lam = new Float64Array(N);
  const spikes = new Float64Array(N);
  const priceSum = new Float64Array(N);
  const w = new Float64Array(N);
  let now = 0, arrived = 0, served = 0, samples = 0, bestSum = 0;
  while (now < burn + measure) {
    const dt = -Math.log(1 - rng()) / lambda;
    now += dt;
    const decay = Math.exp(-dt / tauA);
    let best = Infinity;
    for (let j = 0; j < N; j++) {
      a[j] *= decay;
      if (cap[j] < Infinity) lam[j] = Math.max(0, lam[j] - etaCap * cap[j] * dt);
      const p = c[j] + a[j] + lam[j];
      if (p < best) best = p;
    }
    const measuring = now > burn;
    if (measuring) {
      arrived++;
      bestSum += best;
      if (arrived % 25 === 0) { for (let j = 0; j < N; j++) priceSum[j] += a[j] + lam[j]; samples++; }
    }
    if (V && best > V(rng)) continue; // leaves for another city
    let sum = 0;
    for (let j = 0; j < N; j++) { const x = Math.exp(-(c[j] + a[j] + lam[j] - best) / tau); w[j] = x; sum += x; }
    let u = rng() * sum, win = N - 1;
    for (let j = 0; j < N; j++) { u -= w[j]; if (u <= 0) { win = j; break; } }
    a[win] += beta;
    if (cap[win] < Infinity) lam[win] += etaCap;
    if (measuring) { spikes[win]++; served++; }
  }
  return {
    r: Float64Array.from(spikes, (s) => s / measure),
    price: Float64Array.from(priceSum, (s) => s / samples),
    served: served / arrived,
    level: bestSum / arrived,
  };
}

// ---------------------------------------------------------------------------
const INF = new Float64Array(N).fill(Infinity);
const xbar0 = 9;
const lambda = total(ratesAt(xbar0 * t, INF)); // demand that puts the free edge at 9
const free = equilibrium(INF, lambda);
const rMax = 0.4 * (free.mu / kappa); // lid at 40% of the free-market peak rate
const lid = Float64Array.from(dist, () => rMax);
const hole = Float64Array.from(dist, (d) => (d <= 2.5 ? Infinity : rMax));
const openServed = (m) => (m <= free.mu ? 1 : 0); // perfectly elastic: leave if pricier than before
const someServed = (s) => (m) => (m <= free.mu ? 1 : Math.exp(-(m - free.mu) / s));

const freeSim = simulate({ cap: INF, lambda, seed: 7 });
const ref = freeSim.level;
const scenarios = [
  { name: 'No rules', cap: INF },
  { name: 'Height limit (rate cap)', cap: lid },
  { name: 'Height limit, exempt centre', cap: hole },
  { name: 'Height limit, some can leave', cap: lid, served: someServed(1.5), V: (rng) => ref - 1.5 * Math.log(1 - rng()) },
  { name: 'Height limit, free to leave', cap: lid, served: openServed, V: () => ref },
];

const fmt = (x, d = 2) => x.toFixed(d);
const pct = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(0)}%`;
const used = (r) => r.reduce((n, x) => n + (x > 1e-9 ? 1 : 0), 0);
const usedSim = (r) => r.reduce((n, x) => n + (x >= 0.05 * rMax ? 1 : 0), 0);
const commute = (r) => { let s = 0, m = 0; for (let j = 0; j < N; j++) { s += r[j] * dist[j]; m += r[j]; } return s / m; };
const peak = (r) => { let s = 0, n = 0; for (let j = 0; j < N; j++) if (dist[j] < 1.01) { s += r[j]; n++; } return s / n; };
const flows = (r, cap) => {
  let squeezed = 0, downtown = 0, denser = 0, sprawl = 0;
  for (let j = 0; j < N; j++) {
    const dlt = r[j] - free.r[j];
    if (dlt < 0) squeezed -= dlt;
    else if (dist[j] > xbar0) sprawl += dlt;
    else if (cap[j] === Infinity && dist[j] <= 2.5) downtown += dlt;
    else denser += dlt;
  }
  const never = total(free.r) - total(r);
  const D = Math.max(squeezed, downtown + denser + sprawl) || 1;
  return `${fmt(downtown / D * 100, 0)}/${fmt(denser / D * 100, 0)}/${fmt(sprawl / D * 100, 0)}/${fmt(Math.max(0, never) / D * 100, 0)}`;
};

console.log(`τ=${tau}; N=${N} neurons, demand Λ=${fmt(lambda, 1)} events/unit time, free edge ${xbar0}, κ=${kappa}, rate cap ${fmt(rMax, 3)}\n`);
console.log('scenario | land used (theory / sim) | mean commute (theory / sim) | price level μ | served (theory / sim) | centre rate (theory / sim) | where squeezed went: downtown/suburbs/sprawl/never (theory)');
const results = [];
for (const [i, s] of scenarios.entries()) {
  const eq = equilibrium(s.cap, lambda, s.served);
  const sim = i === 0 ? freeSim : simulate({ cap: s.cap, lambda, V: s.V, seed: 7 + i });
  results.push({ s, eq, sim });
  console.log(
    `${s.name} | ${used(eq.r)} / ${usedSim(sim.r)} | ${fmt(commute(eq.r))} / ${fmt(commute(sim.r))} | ${fmt(eq.mu)} | ${fmt(eq.served, 3)} / ${fmt(sim.served, 3)} | ${fmt(peak(eq.r), 3)} / ${fmt(peak(sim.r), 3)} | ${i === 0 ? '—' : flows(eq.r, s.cap)}`,
  );
}

// Rent profile: is the price at each neuron the Alonso bid-rent μ − t·d?
console.log('\nprice (a + λ) by distance ring vs bid-rent μ − t·d, occupied rings only');
for (const k of [0, 1, 2]) {
  const { s, eq, sim } = results[k];
  const rows = [];
  for (let ring = 0; ring < 14; ring++) {
    let ps = 0, n = 0, dsum = 0;
    for (let j = 0; j < N; j++) if (dist[j] >= ring && dist[j] < ring + 1 && eq.r[j] > 0) { ps += sim.price[j]; dsum += dist[j]; n++; }
    if (n) rows.push(`${ring}-${ring + 1}: ${fmt(ps / n)} vs ${fmt(eq.mu - t * (dsum / n))}`);
  }
  console.log(`${s.name}: ${rows.join(' | ')}`);
}

console.log('\nprice level offered by the simulated free network:', fmt(ref), 'vs theory', fmt(free.mu));
