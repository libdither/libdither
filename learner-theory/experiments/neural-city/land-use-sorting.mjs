// Land USE by learning: two input types with different costs of delay compete for neurons.
// Each neuron's tuning w_j (0 = routine, 1 = urgent) is learned by a Hebbian rule; serving a
// type the neuron isn't tuned for costs m·mismatch. Alonso's prediction with two household
// types: the type with the steeper bid-rent (urgent, t_A > t_B) takes an inner ring, the other
// an outer ring, and the rent curve has a kink at the boundary.
const tA = 2, tB = 0.5; // cost per unit distance for urgent / routine inputs
const beta = 0.1, tauA = 100, kappa = beta * tauA;
const tau = 0.1, m = Number(process.env.M ?? 3), etaW = 0.05;
const Rmax = 17;

const dist = [];
for (let i = -Rmax; i <= Rmax; i++) for (let k = -Rmax; k <= Rmax; k++) {
  const d = Math.hypot(i, k);
  if (d <= Rmax) dist.push(d);
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

// Deterministic two-type city.
function supply(muA, muB) {
  let sA = 0, sB = 0;
  const use = new Int8Array(N), r = new Float64Array(N);
  for (let j = 0; j < N; j++) {
    const a = muA - tA * dist[j], b = muB - tB * dist[j];
    const bid = Math.max(a, b);
    if (bid <= 0) continue;
    r[j] = bid / kappa;
    if (a >= b) { sA += r[j]; use[j] = 1; } else { sB += r[j]; use[j] = 2; }
  }
  return { sA, sB, use, r };
}
function solve(lamA, lamB) {
  const muBfor = (muA) => bisect((muB) => supply(muA, muB).sB - lamB, 0, 100);
  const muA = bisect((x) => supply(x, muBfor(x)).sA - lamA, 0, 200);
  const muB = muBfor(muA);
  return { muA, muB, ...supply(muA, muB) };
}

function simulate({ lamA, lamB, seed, burn = 3000, measure = 4000 }) {
  const rng = mulberry32(seed);
  const a = new Float64Array(N), w = new Float64Array(N).fill(0.5), wts = new Float64Array(N);
  const spikes = new Float64Array(N), priceSum = new Float64Array(N);
  const lambda = lamA + lamB;
  let now = 0, samples = 0, n = 0;
  while (now < burn + measure) {
    const dt = -Math.log(1 - rng()) / lambda;
    now += dt;
    const decay = Math.exp(-dt / tauA);
    const urgent = rng() < lamA / lambda;
    const t = urgent ? tA : tB;
    let best = Infinity;
    for (let j = 0; j < N; j++) {
      a[j] *= decay;
      const cost = t * dist[j] + m * (urgent ? 1 - w[j] : w[j]) + a[j];
      wts[j] = cost;
      if (cost < best) best = cost;
    }
    let sum = 0;
    for (let j = 0; j < N; j++) { const x = Math.exp(-(wts[j] - best) / tau); wts[j] = x; sum += x; }
    let u = rng() * sum, win = N - 1;
    for (let j = 0; j < N; j++) { u -= wts[j]; if (u <= 0) { win = j; break; } }
    a[win] += beta;
    w[win] += etaW * ((urgent ? 1 : 0) - w[win]); // Hebbian: tuning follows what the neuron serves
    if (now > burn) {
      spikes[win]++;
      if (++n % 25 === 0) { for (let j = 0; j < N; j++) priceSum[j] += a[j]; samples++; }
    }
  }
  return { r: Float64Array.from(spikes, (s) => s / measure), w, price: Float64Array.from(priceSum, (s) => s / samples) };
}

const lamA = 38, lamB = 38;
const eq = solve(lamA, lamB);
const boundary = (eq.muA - eq.muB) / (tA - tB);
console.log(`theory: μA=${eq.muA.toFixed(2)} μB=${eq.muB.toFixed(2)}, urgent inside d < ${boundary.toFixed(2)}, city edge ${(eq.muB / tB).toFixed(2)}`);
for (const seed of (process.env.SEEDS ?? "1,2").split(",").map(Number)) {
  const sim = simulate({ lamA, lamB, seed });
  const rows = [];
  for (let ring = 0; ring < 16; ring += 1) {
    let nA = 0, nAct = 0, ps = 0, pt = 0;
    for (let j = 0; j < N; j++) {
      if (dist[j] < ring || dist[j] >= ring + 1 || sim.r[j] < 0.02) continue;
      nAct++;
      if (sim.w[j] > 0.5) nA++;
      ps += sim.price[j];
      pt += Math.max(eq.muA - tA * dist[j], eq.muB - tB * dist[j]);
    }
    if (nAct) rows.push(`${ring}-${ring + 1}: urgent ${Math.round((nA / nAct) * 100)}% (theory ${ring + 1 <= boundary ? 100 : ring >= boundary ? 0 : 'mix'}), rent ${(ps / nAct).toFixed(2)} vs ${(pt / nAct).toFixed(2)}`);
  }
  console.log(`\nseed ${seed}\n` + rows.join('\n'));
}
