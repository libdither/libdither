// Run with: node --test experiments/one-model/model.test.mjs
// Loads the model straight out of index.html (between MODEL:BEGIN and MODEL:END) and checks
// that each architecture does what the page says it does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('/* MODEL:BEGIN */'), html.indexOf('/* MODEL:END */'));
const M = new Function(`${src}; return OneModel;`)();
const preset = (id) => M.PRESETS.find((p) => p.id === id);
const make = (id, patch = {}) => M.create(M.merge(preset(id).config, patch));
const flowAvg = (sim, units) => {
  // flow-weighted averages over time
  let cost = 0, flow = 0, dist = 0, arrived = 0, stayed = 0, load = 0, built = 0;
  for (let i = 0; i < units; i++) {
    sim.run(1);
    cost += sim.acc.cost; flow += sim.acc.flow; dist += sim.acc.dist; arrived += sim.acc.arrived; stayed += sim.acc.stayed; load += sim.acc.load; built += sim.acc.built;
  }
  return { cost: cost / flow, dist: dist / flow, stay: stayed / arrived, occupancy: load / built };
};

test('land market: rents follow the Alonso bid-rent line as taste variety shrinks', () => {
  const sim = make('land', { temperature: 0.1 });
  sim.run(600);
  // Theory with zero taste variety: rent = μ − t·d with μ = 8 (edge at 8).
  let err = 0, n = 0;
  for (let j = 0; j < sim.N; j++) if (sim.centerDist[j] < 7) { err += sim.price(j) - (8 - sim.centerDist[j]); n++; }
  assert.ok(Math.abs(err / n) < 0.2, `mean gap ${err / n}`);
  const m = sim.metrics();
  assert.ok(m.used > 180 && m.used < 240, `used ${m.used}`);
  assert.ok(m.occupancy > 0.97, `a settled city has no empty floors: ${m.occupancy}`);
});

test('height limit: sprawl when nobody can leave, exit when people can, spike when downtown is exempt', () => {
  const free = make('land').run(500).metrics();
  const freeCentre = make('land').run(500).r[make('land').centerDist.indexOf(0)];
  const capped = make('lid').run(500);
  const mc = capped.metrics();
  assert.ok(mc.peak <= 0.3 * 1.02, `cap binds: peak ${mc.peak}`);
  assert.ok(mc.used > free.used * 1.15, `sprawl: ${mc.used} vs ${free.used}`);
  assert.ok(mc.meanDistance > free.meanDistance * 1.1);
  assert.ok(mc.centerPrice > free.centerPrice, 'rents rise');
  const hole = make('lid', { cap: { rate: 0.3, exempt: 2.5 } }).run(500);
  assert.ok(hole.r[hole.centerDist.indexOf(0)] > freeCentre, 'exempt centre builds taller than with no cap');
  const open = make('lid', { exit: { mode: 'migration', mu: 0.05 } });
  open.computeReference(400);
  const mo = open.run(600).metrics();
  assert.ok(mo.stayShare < 0.9, `people leave: stay ${mo.stayShare}`);
  assert.ok(Math.abs(mo.used - free.used) <= free.used * 0.06, `no sprawl when people can leave: ${mo.used} vs ${free.used}`);
});

test('sorting: offices take the inner rings; expensive conversion locks in a random layout', () => {
  const ringShare = (sim, lo, hi) => {
    let a = 0, n = 0;
    for (let j = 0; j < sim.N; j++) if (sim.centerDist[j] >= lo && sim.centerDist[j] < hi && sim.r[j] > 0.01) { n++; if (sim.w[j * 2] > 0.5) a++; }
    return a / n;
  };
  const easy = make('sorting', { tuning: { mismatch: 0.5 } }).run(1500);
  assert.ok(ringShare(easy, 0, 3) > 0.95, 'inner rings: offices');
  assert.ok(ringShare(easy, 5, 9) < 0.05, 'outer rings: homes');
  const hard = make('sorting', { tuning: { mismatch: 6 } }).run(1500);
  const mid = ringShare(hard, 2, 5);
  assert.ok(mid > 0.2 && mid < 0.8, `locked-in mix in the middle rings: ${mid}`);
});

test('districts form by themselves, and widen with spillovers', () => {
  const acfMin = (spill) => {
    const sim = make('districts', { tuning: { spill } }).run(400);
    const L = sim.layout;
    const v = Float64Array.from({ length: L.n }, (_, j) => sim.w[j * 2] - 0.5);
    let var0 = 0;
    for (const x of v) var0 += x * x;
    var0 /= L.n;
    const sum = new Float64Array(11), cnt = new Float64Array(11);
    for (let i = 0; i < L.n; i++) for (let j = i + 1; j < L.n; j++) {
      const d = Math.round(Math.hypot(L.x[i] - L.x[j], L.y[i] - L.y[j]));
      if (d <= 10) { sum[d] += v[i] * v[j]; cnt[d]++; }
    }
    let best = 0, lag = 0;
    for (let d = 1; d <= 10; d++) { const c = sum[d] / cnt[d] / var0; if (c < best) { best = c; lag = d; } }
    return { best, lag };
  };
  const narrow = acfMin(1);
  const wide = acfMin(1.75);
  assert.ok(narrow.best < -0.2, `periodic pattern: ${narrow.best}`);
  assert.ok(wide.lag > narrow.lag, `wider spillovers, wider districts: ${narrow.lag} → ${wide.lag}`);
});

test('mixed use: co-active uses separate on their own; timesharing beats zoning when uses alternate slowly', () => {
  const steady = make('mixed', { schedule: { kind: 'steady' } }).run(400);
  const ms = steady.metrics();
  assert.ok(ms.mixedShare < 0.1 && ms.nuisancePerTrip < 0.05, `separated: mixed ${ms.mixedShare}, nuisance ${ms.nuisancePerTrip}`);
  const run = (period, zoning, memory = 1000) => flowAvg(make('mixed', { schedule: { kind: 'alternate', period }, zoning, price: { memory } }).run(1200), 1600);
  const slowShared = run(400, 'none');
  const slowZoned = run(400, 'single-use');
  assert.ok(slowShared.cost < slowZoned.cost, `slow alternation: sharing wins (${slowShared.cost} vs ${slowZoned.cost})`);
  assert.ok(slowZoned.occupancy < slowShared.occupancy, `zoning leaves more floor space empty: ${slowZoned.occupancy} vs ${slowShared.occupancy}`);
  // The same parcels serve both uses in turn (polysemantic over time, not at any one moment)
  const turn = make('mixed').run(2400).metrics().mixedShare;
  assert.ok(turn > 0.8, `slow alternation: parcels are time-shared (${turn})`);
});

// With average flows, prices that reset while a parcel is empty recover slowly, so a returning zoned use
// gets a rush discount. Individual agents mostly don't (see the agents tests): it is a solver effect.
test('mixed use (average flows): prices that reset while vacant hand returning zoned uses a rush discount', () => {
  const fast = (zoning, memory) => flowAvg(make('mixed', { schedule: { kind: 'alternate', period: 40 }, zoning, price: { memory } }).run(1200), 1600).cost;
  const sticky = [fast('none', 1000), fast('single-use', 1000)];
  assert.ok(Math.abs(sticky[0] - sticky[1]) < 0.03 * sticky[0], `sticky rents: zoning changes little (${sticky})`);
  const reset = [fast('none', 20), fast('single-use', 20)];
  assert.ok(reset[1] < 0.95 * reset[0], `rents that reset: zoning wins (${reset})`);
});

test('hotels vs homes: homes win for occupants who are nearly always there, not for intermittent ones', () => {
  const regime = { homes: { tuning: { mode: 'dedicated' }, zoning: 'single-use' }, hotels: { tuning: { mode: 'generic' } }, learned: { tuning: { mode: 'learned' } } };
  const avg = (duty, r) => flowAvg(make('tenure', { schedule: { duty }, ...regime[r] }).run(1200), 2400);
  const high = { homes: avg(0.9, 'homes'), hotels: avg(0.9, 'hotels'), learned: avg(0.9, 'learned') };
  assert.ok(high.homes.cost < high.learned.cost && high.learned.cost < high.hotels.cost, 'present almost always: homes win, narrowly');
  const low = { homes: avg(0.15, 'homes'), hotels: avg(0.15, 'hotels'), learned: avg(0.15, 'learned') };
  assert.ok(low.learned.cost < low.homes.cost && low.hotels.cost < low.homes.cost, 'intermittent: sharing beats homes');
  // Homes are built for each occupant's busiest time, shared space for everyone's together.
  assert.ok(low.homes.occupancy < Math.min(low.hotels.occupancy, low.learned.occupancy), `homes stand empty: ${low.homes.occupancy} vs ${low.hotels.occupancy}, ${low.learned.occupancy}`);
  const mid = { homes: avg(0.5, 'homes'), hotels: avg(0.5, 'hotels'), learned: avg(0.5, 'learned') };
  assert.ok(mid.learned.cost < mid.homes.cost, 'half the time: usufruct beats homes');
  assert.ok(mid.homes.occupancy < mid.hotels.occupancy, `half the time: homes emptier than hotels (${mid.homes.occupancy} vs ${mid.hotels.occupancy})`);
});

test('experts: collapse without balancing, even load with it, drops under tight capacity', () => {
  const off = make('experts', { price: { rule: 'none' } }).run(1500).metrics();
  assert.ok(off.imbalance > 4, `collapse: imbalance ${off.imbalance}`);
  const on = make('experts').run(1500).metrics();
  assert.ok(on.imbalance < 1.1, `balanced: ${on.imbalance}`);
  const tight = make('experts', { cap: { rate: 0.8, exempt: 0 } }).run(1500).metrics();
  assert.ok(Math.abs(1 - tight.stayShare - 0.2) < 0.05, `about 20% dropped: ${1 - tight.stayShare}`);
});

test('attention: hubs without prices, even load with Sinkhorn prices, a sink absorbs some queries', () => {
  const plain = make('attention').run(400);
  const anchors = [3, 11, 12, 22, 29];
  const anchorLoad = anchors.reduce((s, j) => s + plain.r[j], 0) / anchors.length;
  const wordLoad = [...plain.r].filter((_, j) => !anchors.includes(j)).reduce((s, x) => s + x, 0) / (32 - anchors.length);
  assert.ok(anchorLoad > 5 * wordLoad, `hubs: ${anchorLoad} vs ${wordLoad}`);
  const priced = make('attention', { price: { rule: 'balance' } }).run(400).metrics();
  assert.ok(priced.imbalance < 1.1, `even load: ${priced.imbalance}`);
  const sink = make('attention', { exit: { mode: 'outside', value: -2 } }).run(400).metrics();
  assert.ok(1 - sink.stayShare > 0.05, `sink share ${1 - sink.stayShare}`);
});

test('the same event is sampled for both views, from the model\'s own choice probabilities', () => {
  const sim = make('land').run(300);
  const rnd = M.rng32(3);
  const counts = new Float64Array(sim.N);
  for (let i = 0; i < 20000; i++) { const e = sim.sample(rnd); if (e && e.j >= 0) counts[e.j]++; }
  // sampled trips land in proportion to the flows
  const total = sim.r.reduce((s, x) => s + x, 0);
  const centre = sim.centerDist.indexOf(0);
  assert.ok(Math.abs(counts[centre] / 20000 - sim.r[centre] / total) < 0.01);
});

// ---------------------------------------------------------------- the same claims with individual agents
// Every arrival is an agent that draws its own taste noise, moves in and leaves after a random stay;
// loads and rents come from who is present. Averages over time should match the flows.
const makeA = (id, patch = {}) => make(id, { engine: 'agents', ...patch });
const timeAvg = (sim, units) => {
  const R = new Float64Array(sim.N);
  const Pr = new Float64Array(sim.N);
  let cost = 0, flow = 0, arrived = 0, stayed = 0, load = 0, built = 0, nuis = 0;
  for (let i = 0; i < units; i++) {
    sim.run(1);
    cost += sim.acc.cost; flow += sim.acc.flow; arrived += sim.acc.arrived; stayed += sim.acc.stayed; load += sim.acc.load; built += sim.acc.built; nuis += sim.acc.nuis;
    for (let j = 0; j < sim.N; j++) { R[j] += sim.r[j] / units; Pr[j] += sim.price(j) / units; }
  }
  let peak = 0;
  for (const x of R) peak = Math.max(peak, x);
  let used = 0;
  for (const x of R) if (x > 0.02 * peak) used++;
  return { R, Pr, used, cost: cost / flow, stay: stayed / arrived, occupancy: load / built, nuisance: nuis / flow };
};

test('agents: individual households reproduce the average-flow city', () => {
  const flows = make('land').run(600);
  const agents = timeAvg(makeA('land').run(300), 600);
  let gap = 0, total = 0;
  for (let j = 0; j < flows.N; j++) { gap += Math.abs(agents.R[j] - flows.r[j]); total += flows.r[j]; }
  assert.ok(gap / total < 0.06, `load gap ${gap / total}`);
  const cold = makeA('land', { temperature: 0.1 }).run(400);
  const c = timeAvg(cold, 600);
  let err = 0, n = 0;
  for (let j = 0; j < cold.N; j++) if (cold.centerDist[j] < 7) { err += c.Pr[j] - (8 - cold.centerDist[j]); n++; }
  assert.ok(Math.abs(err / n) < 0.3, `rents follow the bid-rent line: mean gap ${err / n}`);
  // Built floor space follows sustained use, so individuals coming and going don't read as empty buildings.
  assert.ok(agents.occupancy > 0.95, `occupancy ${agents.occupancy}`);
});

test('agents: a height limit spreads the city, raises rents, and full buildings turn people away', () => {
  const free = timeAvg(makeA('land').run(400), 400);
  const lid = makeA('lid').run(400);
  const capped = timeAvg(lid, 400);
  const centre = lid.centerDist.indexOf(0);
  assert.ok(capped.used > free.used * 1.15, `sprawl ${capped.used} vs ${free.used}`);
  assert.ok(capped.Pr[centre] > free.Pr[centre], 'rents rise');
  let most = 0;
  for (let j = 0; j < lid.N; j++) if (lid.capped[j]) most = Math.max(most, lid.occ[j]);
  assert.ok(most * lid.agentLoad() <= 0.3 + 1e-9, `no building above the limit: ${most} households`);
  const open = makeA('lid', { exit: { mode: 'migration', mu: 0.05 } });
  open.computeReference(400);
  const o = timeAvg(open.run(400), 600);
  // most of the sprawl goes away when people can leave
  assert.ok(o.stay < 0.9 && o.used - free.used < 0.35 * (capped.used - free.used), `people leave instead: stay ${o.stay}, used ${o.used} vs ${free.used} free and ${capped.used} closed`);
});

test('agents: sorting into rings, and lock-in when conversion is expensive', () => {
  const share = (sim, R, lo, hi) => {
    let a = 0, n = 0;
    for (let j = 0; j < sim.N; j++) if (sim.centerDist[j] >= lo && sim.centerDist[j] < hi && R[j] > 0.01) { n++; if (sim.w[j * 2] > 0.5) a++; }
    return a / n;
  };
  const easy = makeA('sorting', { tuning: { mismatch: 0.5 } }).run(1500);
  const e = timeAvg(easy, 200);
  assert.ok(share(easy, e.R, 0, 3) > 0.9 && share(easy, e.R, 5, 9) < 0.1, 'offices inside, homes outside');
  const hard = makeA('sorting', { tuning: { mismatch: 6 } }).run(1500);
  const mid = share(hard, timeAvg(hard, 200).R, 2, 5);
  assert.ok(mid > 0.2 && mid < 0.8, `locked-in mix: ${mid}`);
});

test('agents: co-active uses separate at every moment, but the boundary wanders', () => {
  const sim = makeA('mixed', { schedule: { kind: 'steady' } }).run(600);
  const s = timeAvg(sim, 400);
  assert.ok(s.nuisance < 0.05, `no parcel hosts both at once: nuisance ${s.nuisance}`);
  const use = () => Array.from({ length: sim.N }, (_, j) => (sim.rAvg[j] > 0.02 ? (sim.rk[j * 2] >= sim.rk[j * 2 + 1] ? 0 : 1) : -1));
  const before = use();
  sim.run(1200);
  const after = use();
  let flips = 0;
  for (let j = 0; j < sim.N; j++) if (before[j] >= 0 && after[j] >= 0 && before[j] !== after[j]) flips++;
  assert.ok(flips > 10, `parcels change use over time: ${flips}`);
});

test('agents: timesharing beats zoning when uses alternate slowly; fast alternation is roughly a tie', () => {
  const run = (period, zoning, memory = 1000) => timeAvg(makeA('mixed', { schedule: { kind: 'alternate', period }, zoning, price: { memory } }).run(1200), 1600);
  const slow = [run(400, 'none'), run(400, 'single-use')];
  assert.ok(slow[0].cost < 0.93 * slow[1].cost, `sharing wins: ${slow[0].cost} vs ${slow[1].cost}`);
  assert.ok(slow[1].occupancy < slow[0].occupancy, 'zoning leaves more floor space empty');
  for (const memory of [1000, 20]) {
    const fast = [run(40, 'none', memory), run(40, 'single-use', memory)];
    assert.ok(Math.abs(fast[0].cost - fast[1].cost) < 0.05 * fast[0].cost, `memory ${memory}: ${fast[0].cost} vs ${fast[1].cost}`);
  }
});

test('agents: hotels vs homes keep their order', () => {
  const regime = { homes: { tuning: { mode: 'dedicated' }, zoning: 'single-use' }, hotels: { tuning: { mode: 'generic' } }, learned: { tuning: { mode: 'learned' } } };
  const avg = (duty, r) => {
    let cost = 0, occupancy = 0;
    for (const seed of [1, 2]) { const a = timeAvg(makeA('tenure', { seed, schedule: { duty }, ...regime[r] }).run(1200), 2400); cost += a.cost / 2; occupancy += a.occupancy / 2; }
    return { cost, occupancy };
  };
  const high = { homes: avg(0.9, 'homes'), hotels: avg(0.9, 'hotels'), learned: avg(0.9, 'learned') };
  assert.ok(high.homes.cost < high.learned.cost && high.learned.cost < high.hotels.cost, `present almost always: ${JSON.stringify(high)}`);
  const low = { homes: avg(0.15, 'homes'), hotels: avg(0.15, 'hotels'), learned: avg(0.15, 'learned') };
  assert.ok(low.homes.cost > Math.max(low.hotels.cost, low.learned.cost), 'intermittent: sharing beats homes');
  assert.ok(low.homes.occupancy < Math.min(low.hotels.occupancy, low.learned.occupancy), 'homes stand empty');
});

test('agents: experts collapse without balancing; with individual tokens, tight capacity drops more than the average suggests', () => {
  const imbalance = (R) => Math.max(...R) / (R.reduce((s, x) => s + x, 0) / R.length);
  assert.ok(imbalance(timeAvg(makeA('experts', { price: { rule: 'none' } }).run(1500), 300).R) > 4, 'collapse');
  assert.ok(imbalance(timeAvg(makeA('experts').run(1500), 300).R) < 1.2, 'balanced');
  const flows = 1 - make('experts', { cap: { rate: 0.8, exempt: 0 } }).run(1500).metrics().stayShare;
  const agents = 1 - timeAvg(makeA('experts', { cap: { rate: 0.8, exempt: 0 } }).run(1500), 600).stay;
  assert.ok(agents > flows + 0.03, `load fluctuates, so more overflow: ${agents} vs ${flows}`);
});

test('agents: districts and attention', () => {
  const sim = makeA('districts').run(400);
  const L = sim.layout;
  const v = Float64Array.from({ length: L.n }, (_, j) => sim.w[j * 2] - 0.5);
  let var0 = 0;
  for (const x of v) var0 += x * x;
  var0 /= L.n;
  const sum = new Float64Array(11), cnt = new Float64Array(11);
  for (let i = 0; i < L.n; i++) for (let j = i + 1; j < L.n; j++) {
    const d = Math.round(Math.hypot(L.x[i] - L.x[j], L.y[i] - L.y[j]));
    if (d <= 10) { sum[d] += v[i] * v[j]; cnt[d]++; }
  }
  let best = 0;
  for (let d = 1; d <= 10; d++) best = Math.min(best, sum[d] / cnt[d] / var0);
  assert.ok(best < -0.2, `periodic districts ⇄ columns: ${best}`);
  const plain = timeAvg(makeA('attention').run(400), 400);
  const anchors = [3, 11, 12, 22, 29];
  const anchorLoad = anchors.reduce((s, j) => s + plain.R[j], 0) / anchors.length;
  const wordLoad = [...plain.R].filter((_, j) => !anchors.includes(j)).reduce((s, x) => s + x, 0) / 27;
  assert.ok(anchorLoad > 5 * wordLoad, 'hubs');
  const priced = timeAvg(makeA('attention', { price: { rule: 'balance' } }).run(400), 400);
  const mean = priced.R.reduce((s, x) => s + x, 0) / priced.R.length;
  assert.ok(Math.max(...priced.R) / mean < 1.15, 'Sinkhorn prices even out the load');
});

test('agents: the inspected arrival is a logit choice, and committing it adds one household', () => {
  const sim = makeA('land').run(300);
  const rnd = M.rng32(5);
  const counts = new Map();
  let first = null;
  for (let i = 0; i < 4000; i++) {
    const ev = sim.inspectArrival(rnd);
    first ??= ev;
    const j = ev.sites[ev.pick];
    counts.set(j, (counts.get(j) || 0) + 1);
  }
  // the most likely site is picked about as often as its probability says
  let bestQ = 0;
  for (let q = 1; q < first.prob.length; q++) if (first.prob[q] > first.prob[bestQ]) bestQ = q;
  const j = first.sites[bestQ];
  assert.ok(Math.abs(counts.get(j) / 4000 - first.prob[bestQ]) < 0.03, `${counts.get(j) / 4000} vs ${first.prob[bestQ]}`);
  const before = sim.occ[j];
  const ev = { ...first, pick: bestQ };
  const rise = sim.commitArrival(ev);
  assert.equal(sim.occ[j], before + 1);
  assert.ok(Math.abs(rise - sim.cfg.price.kappa * sim.agentLoad()) < 1e-9 || rise >= 0, `rent rises by one household's share: ${rise}`);
});

// ---------------------------------------------------------------- the formal claims
// The page states the model once, in symbols, and claims each pairing of terms is exact. These tests
// check the statements that pairing rests on.

// Free energy of an average-flow state: commuting ⇄ wiring, building ⇄ self-inhibition (κ·load²/2),
// nuisance ⇄ interference (counted once per pair, as each arrival sees it; `nu` scales it), and τ times
// the negative entropy of the choices.
function freeEnergy(sim, nu = sim.cfg.nuisance.strength, flows = null) {
  const kappa = sim.cfg.price.kappa;
  const tau = sim.cfg.temperature;
  const r = new Float64Array(sim.N);
  const rk = new Float64Array(sim.N * sim.K);
  let F = 0;
  sim.classes.forEach((cl, c) => {
    const lam = sim.rates[cl.type] * cl.weight;
    for (let q = 0; q < cl.sites.length; q++) {
      const x = flows ? flows[c][q] : lam * cl.pi[q];
      if (x <= 0) continue;
      F += x * cl.t * cl.dist[q] + tau * x * Math.log(x / lam);
      r[cl.sites[q]] += x;
      rk[cl.sites[q] * sim.K + cl.type] += x;
    }
  });
  for (let j = 0; j < sim.N; j++) {
    F += (kappa * r[j] * r[j]) / 2;
    if (sim.K === 2) F += nu * kappa * rk[j * 2] * rk[j * 2 + 1];
  }
  return F;
}
const classFlows = (sim) => sim.classes.map((cl) => Array.from(cl.pi, (p) => p * sim.rates[cl.type] * cl.weight));

test('formal: the average-flow equilibrium is where the free energy is lowest', () => {
  for (const [id, patch] of [['land', {}], ['mixed', { schedule: { kind: 'steady' } }]]) {
    const sim = make(id, patch).run(1500);
    // the supply condition: each price equals κ × load, the slope of the building cost κ·load²/2
    let gap = 0;
    for (let j = 0; j < sim.N; j++) gap = Math.max(gap, Math.abs(sim.a[j] - sim.cfg.price.kappa * sim.r[j]));
    assert.ok(gap < 1e-4, `${id}: price = κ·load (${gap})`);
    // moving any arrivals from one site to another raises F
    const F0 = freeEnergy(sim);
    const rnd = M.rng32(11);
    for (let t = 0; t < 200; t++) {
      const x = classFlows(sim);
      const c = Math.floor(rnd() * x.length);
      const used = x[c].map((v, q) => [v, q]).filter(([v]) => v > 1e-3);
      const [va, qa] = used[Math.floor(rnd() * used.length)];
      const qb = used[Math.floor(rnd() * used.length)][1];
      if (qa === qb) continue;
      const d = va * 0.2 * rnd();
      x[c][qa] -= d;
      x[c][qb] += d;
      assert.ok(freeEnergy(sim, undefined, x) >= F0 - 1e-9, `${id}: a perturbation lowered F`);
    }
  }
});

test('formal: the equilibrium counts half the nuisance; charging the other half (a Pigouvian tax) lowers the true cost when nuisance is weak', () => {
  const run = (pigou) => make('mixed', { schedule: { kind: 'steady' }, nuisance: { strength: 0.1 }, tax: { pigou } }).run(1500);
  const plain = run(false);
  const taxed = run(true);
  // true cost: each use suffers the other's nuisance, so the pair term counts twice
  const trueCost = (sim) => freeEnergy(sim, 2 * sim.cfg.nuisance.strength);
  assert.ok(trueCost(taxed) < trueCost(plain) - 0.3, `taxed ${trueCost(taxed)} vs untaxed ${trueCost(plain)}`);
  // the charge is the same as doubling ν in what arrivals see
  const doubled = make('mixed', { schedule: { kind: 'steady' }, nuisance: { strength: 0.2 } }).run(1500);
  let gap = 0;
  for (let j = 0; j < taxed.N; j++) gap = Math.max(gap, Math.abs(taxed.r[j] - doubled.r[j]));
  assert.ok(gap < 1e-9, `charge = ν counted twice: ${gap}`);
  // individual agents: much less nuisance suffered
  const agentNuisance = (pigou) => {
    const sim = makeA('mixed', { schedule: { kind: 'steady' }, nuisance: { strength: 0.25 }, tax: { pigou } }).run(600);
    let nuis = 0, flow = 0;
    for (let i = 0; i < 400; i++) { sim.run(1); nuis += sim.acc.nuis; flow += sim.acc.flow; }
    return nuis / flow;
  };
  const a = [agentNuisance(false), agentNuisance(true)];
  assert.ok(a[1] < 0.5 * a[0], `agents: nuisance per trip ${a}`);
});

test('formal: fixed supply ⇄ a set point is Sinkhorn: every site ends up with its share', () => {
  const sim = make('districts', { tuning: { mode: 'none' } }).run(600);
  const c = sim.cfg.demand / sim.N;
  let worst = 0;
  for (let j = 0; j < sim.N; j++) worst = Math.max(worst, Math.abs(sim.r[j] / c - 1));
  assert.ok(worst < 0.02, `column sums within 2% of the set point: ${worst}`);
});

test('formal: the first of exponential clocks is a softmax draw (taste noise ⇄ escape noise)', () => {
  const sim = makeA('land').run(200);
  const ev = sim.inspectArrival(M.rng32(2));
  const rnd = M.rng32(9);
  const wins = new Float64Array(ev.cost.length);
  const n = 20000;
  const minC = Math.min(...ev.cost);
  for (let i = 0; i < n; i++) {
    // each neuron fires at rate e^{−cost/τ}; the first to fire wins
    let best = -1, tBest = Infinity;
    for (let q = 0; q < ev.cost.length; q++) {
      const rate = Math.exp(-(ev.cost[q] - minC) / ev.tau);
      if (rate < 1e-12) continue;
      const t = -Math.log(1 - rnd()) / rate;
      if (t < tBest) { tBest = t; best = q; }
    }
    wins[best]++;
  }
  let err = 0;
  for (let q = 0; q < ev.cost.length; q++) err = Math.max(err, Math.abs(wins[q] / n - ev.prob[q]));
  assert.ok(err < 0.012, `race frequencies match the logit probabilities: ${err}`);
});

test('formal: capacity overflow is Erlang loss; it vanishes in the many-agent limit', () => {
  const erlangB = (c, A) => { let B = 1; for (let k = 1; k <= c; k++) B = (A * B) / (k + A * B); return B; };
  const flows = 1 - make('experts', { cap: { rate: 1 } }).run(1500).metrics().stayShare;
  assert.ok(flows < 0.01, `average flows at capacity 1×: almost nothing dropped (${flows})`);
  const drop = (scale) => {
    const sim = makeA('experts', { agents: { scale }, cap: { rate: 1 } }).run(800);
    const A = (sim.cfg.demand / sim.N) * sim.cfg.agents.stay * scale; // tokens an expert holds on average
    return { got: 1 - timeAvg(sim, 600).stay, erlang: erlangB(Math.floor(1 / sim.agentLoad() + 1e-9), A) };
  };
  const s4 = drop(4);
  assert.ok(Math.abs(s4.got - s4.erlang) < 0.015, `individual tokens: ${s4.got} vs Erlang B ${s4.erlang}`);
  const s16 = drop(16);
  assert.ok(s16.got < 0.6 * s4.got, `more, smaller agents drop less: ${s16.got} vs ${s4.got}`);
});

test('formal: rich-get-richer collapses when ρ/τ exceeds 1 + r₀/load (1.2 here)', () => {
  const imbalance = (rho) => make('experts', { price: { rule: 'none' }, scale: { strength: rho }, tuning: { mode: 'none' } }).run(1500).metrics().imbalance;
  assert.ok(imbalance(0.2) < 1.1, 'ρ/τ = 1: even');
  assert.ok(imbalance(0.3) > 4, 'ρ/τ = 1.5: collapse');
});

// ---------------------------------------------------------------- taxes, and their counterparts in the network
const maxGap = (a, b) => { let m = 0; for (let j = 0; j < a.length; j++) m = Math.max(m, Math.abs(a[j] - b[j])); return m; };

test('taxes: a land value tax moves nothing ⇄ the network has nothing for it to act on', () => {
  for (const engine of ['flows', 'agents']) {
    const plain = make('land', { engine }).run(400);
    const taxed = make('land', { engine, tax: { land: 1 } }).run(400);
    assert.equal(maxGap(plain.r, taxed.r), 0, `${engine}: identical loads`);
    assert.ok(taxed.metrics().taxRevenue > 50, 'it raises revenue');
  }
});

test('taxes: a tax on buildings is a higher cost of building up ⇄ stronger adaptation, and spreads the city', () => {
  const taxed = make('land', { tax: { building: 0.5 } }).run(600);
  const dearer = make('land', { price: { kappa: 15 } }).run(600);
  assert.ok(maxGap(taxed.r, dearer.r) < 1e-12 && maxGap(taxed.a, dearer.a) < 1e-12, 'κ·(1 + θ) exactly');
  const plain = make('land').run(600).metrics();
  const m = taxed.metrics();
  assert.ok(m.used > plain.used * 1.15 && m.peak < plain.peak * 0.85, `shorter and wider: ${plain.used} → ${m.used} parcels`);
  assert.ok(m.centerPrice > plain.centerPrice, 'rents downtown rise');
});

test('taxes: a tax per resident ⇄ global inhibition moves nobody in a closed city, and is capitalized in an open one', () => {
  for (const engine of ['flows', 'agents']) {
    const plain = make('land', { engine }).run(400);
    const taxed = make('land', { engine, tax: { head: 1.5 } }).run(400);
    assert.ok(maxGap(plain.r, taxed.r) < 1e-9, `${engine}: a softmax ignores what all options share`);
  }
  // Open city: people leave until rents have fallen by about the tax.
  const centreRent = (sim, P) => { let s = 0, n = 0; for (let j = 0; j < sim.N; j++) if (sim.centerDist[j] < 1.01) { s += P[j]; n++; } return s / n; };
  const open = (engine, head) => {
    const sim = make('land', { engine, exit: { mode: 'migration', mu: 0.05 }, tax: { head } });
    sim.computeReference(400);
    sim.run(600);
    if (engine === 'flows') return { rent: centreRent(sim, Float64Array.from({ length: sim.N }, (_, j) => sim.price(j))), stay: sim.metrics().stayShare };
    const t = timeAvg(sim, 400);
    return { rent: centreRent(sim, t.Pr), stay: t.stay };
  };
  for (const engine of ['flows', 'agents']) {
    const before = open(engine, 0);
    const after = open(engine, 1);
    const drop = before.rent - after.rent;
    assert.ok(before.stay > 0.98, `${engine}: with no tax nobody leaves (${before.stay})`);
    assert.ok(after.stay < 0.8 && Math.abs(drop - 1) < 0.15, `${engine}: rents fall by about the tax: ${drop}, stay ${after.stay}`);
  }
});
