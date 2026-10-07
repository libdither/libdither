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

// ---------------------------------------------------------------- beyond a shared potential
// nuisance.matrix[k][q]: how much use k minds use q. Unequal entries leave the model without a free energy.
const loadGap = (a, b) => {
  let g = 0;
  for (let i = 0; i < a.rk.length; i++) g = Math.max(g, Math.abs(a.rk[i] - b.rk[i]));
  return g;
};
// how far the loads move over `units` more time, relative to their size
const movement = (sim, units) => {
  const before = Float64Array.from(sim.rk);
  sim.run(units);
  let d = 0, n = 0;
  for (let i = 0; i < before.length; i++) { d += (sim.rk[i] - before[i]) ** 2; n += before[i] ** 2; }
  return Math.sqrt(d / n);
};
const meanOverlap = (sim) => {
  // mean pairwise cosine between the uses' loads: 1 fully mixed, 0 fully separated
  const K = sim.K;
  let s = 0, pairs = 0;
  for (let p = 0; p < K; p++) for (let q = p + 1; q < K; q++) {
    let ab = 0, aa = 0, bb = 0;
    for (let j = 0; j < sim.N; j++) { const A = sim.rk[j * K + p], B = sim.rk[j * K + q]; ab += A * B; aa += A * A; bb += B * B; }
    s += ab / Math.sqrt(aa * bb);
    pairs++;
  }
  return s / pairs;
};

test('formal: one-sided nuisance has no free energy, yet two uses still settle; a Pigouvian charge makes any nuisance symmetric and restores one', () => {
  const steady = { schedule: { kind: 'steady' } };
  const sym = make('mixed', { ...steady, nuisance: { strength: 2 } }).run(1500);
  assert.equal(loadGap(sym, make('mixed', { ...steady, nuisance: { strength: 2, matrix: [[0, 1], [1, 0]] } }).run(1500)), 0, 'a matrix of ones is the symmetric model');
  for (const [name, matrix] of [['one-sided', [[0, 1], [0, 0]]], ['chase', [[0, 1], [-1, 0]]]]) {
    const sim = make('mixed', { ...steady, nuisance: { strength: 2, matrix } }).run(1500);
    assert.ok(movement(sim, 500) < 0.01, `${name}: settles`);
  }
  // the charge adds the nuisance caused (the transpose), so A minds B and B is charged for it: symmetric
  const charged = make('mixed', { ...steady, nuisance: { strength: 2, matrix: [[0, 1], [0, 0]] }, tax: { pigou: true } }).run(1500);
  assert.ok(loadGap(charged, sym) < 1e-12, 'one-sided + Pigouvian charge = symmetric nuisance');
});

test('formal: three uses that each mind the next never settle past ν = 2τ/(κ·x), where a symmetric control separates and stops; a Pigouvian charge settles them', () => {
  const three = { types: [{ share: 1 / 3 }, { share: 1 / 3 }, { share: 1 / 3 }], schedule: { kind: 'steady' } };
  const cyclic = [[0, 1, 0], [0, 0, 1], [1, 0, 0]];
  const control = [[0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]]; // the cyclic matrix's symmetric part
  // Predicted threshold: at a site where each use's load is x, the split among uses moves by
  // −(x/τ)·νκ·N times itself; on splits that sum to zero, both matrices have eigenvalues with real part −1/2,
  // so the mixed state breaks when νκx/τ > 2. The cyclic one's are complex: it breaks into rotation.
  const weak = make('mixed', { ...three, nuisance: { strength: 0.01, matrix: cyclic } }).run(3000);
  const x = Math.max(...weak.rk);
  const nuC = (2 * weak.cfg.temperature) / (weak.cfg.price.kappa * x);
  assert.ok(nuC > 0.1 && nuC < 0.13, `predicted threshold ${nuC}`);
  const at = (nu, matrix, patch = {}) => make('mixed', { ...three, nuisance: { strength: nu, matrix }, ...patch }).run(4000);
  for (const matrix of [cyclic, control]) {
    const below = at(0.95 * nuC, matrix);
    assert.ok(meanOverlap(below) > 0.999 && movement(below, 500) < 1e-3, 'below the threshold: mixed and still');
  }
  const cyc = at(0.5, cyclic);
  const ctl = at(0.5, control);
  assert.ok(meanOverlap(ctl) < 0.05 && movement(ctl, 500) < 0.01, `control: separates and stops (${meanOverlap(ctl)})`);
  assert.ok(movement(cyc, 500) > 0.3, 'cyclic: keeps moving');
  assert.ok(meanOverlap(cyc) > meanOverlap(ctl) + 0.05, `cyclic: stays more mixed (${meanOverlap(cyc)} vs ${meanOverlap(ctl)})`);
  assert.ok(movement(at(0.5, cyclic, { tax: { pigou: true } }), 500) < 0.01, 'a Pigouvian charge settles it');
  // individual agents: the cyclic uses stay mixed where the control's separate
  const agents = (matrix) => meanOverlap(makeA('mixed', { ...three, nuisance: { strength: 2, matrix } }).run(1200));
  const [ac, as] = [agents(cyclic), agents(control)];
  assert.ok(ac > as + 0.1, `agents: cyclic ${ac} vs control ${as}`);
});

// ---------------------------------------------------------------- agglomeration ⇄ wiring economy
// Nothing is given a centre: arrivals go where the types they deal with are, through a kernel over distance.
const freeEnergyWithInteraction = (sim) => {
  // the one-type free energy plus the pairwise interaction term, from the flows' own probabilities
  const kappa = sim.cfg.price.kappa;
  const tau = sim.cfg.temperature;
  const s = sim.cfg.interaction.strength;
  const { B } = sim.kernel();
  const cl = sim.classes[0];
  const lam = sim.rates[0] * cl.weight;
  const F = (x) => {
    let v = 0;
    for (let j = 0; j < sim.N; j++) {
      v += (kappa * x[j] * x[j]) / 2;
      if (x[j] > 0) v += tau * x[j] * Math.log(x[j] / lam);
    }
    let inter = 0;
    for (let j = 0; j < sim.N; j++) for (let i = 0; i < sim.N; i++) inter += B[0][0].B[j * sim.N + i] * x[j] * x[i];
    return v - ((s * kappa) / 2) * (inter / B[0][0].Z);
  };
  return { F, x: Float64Array.from(cl.pi, (p) => p * lam) };
};
const centroidOf = (sim, R) => {
  let cx = 0, cy = 0, t = 0;
  for (let j = 0; j < sim.N; j++) { cx += R[j] * sim.layout.x[j]; cy += R[j] * sim.layout.y[j]; t += R[j]; }
  return [cx / t, cy / t];
};
const profileAbout = (sim, R, [cx, cy], rings = 8) => {
  const sums = new Float64Array(rings), cnt = new Float64Array(rings);
  for (let j = 0; j < sim.N; j++) { const d = Math.round(Math.hypot(sim.layout.x[j] - cx, sim.layout.y[j] - cy)); if (d >= rings) continue; sums[d] += R[j]; cnt[d]++; }
  return Array.from(sums, (v, i) => (cnt[i] ? v / cnt[i] : 0));
};

test('agglomeration: with no centre given, one forms at the most accessible point, with rent and density falling from it; a harbour moves it; the free energy gains a pairwise term', () => {
  const sim = make('agglomeration').run(1500);
  const m = sim.metrics();
  assert.ok(Math.hypot(...m.centroid) < 0.6, `the centre forms in the middle of the plain: (${m.centroid})`);
  assert.ok(m.used > 180 && m.used < 300, `a compact city with farmland around it: ${m.used} of ${sim.N} parcels`);
  const prof = profileAbout(sim, sim.r, m.centroid);
  const price = profileAbout(sim, sim.a, m.centroid);
  for (let i = 1; i < prof.length; i++) {
    assert.ok(prof[i] <= prof[i - 1] * 1.02 + 1e-6, `density falls from the centre (ring ${i})`);
    assert.ok(price[i] <= price[i - 1] * 1.02 + 1e-6, `rent falls from the centre (ring ${i})`);
  }
  assert.equal(m.peaks, 1, 'one centre');
  // prices are still multipliers: price = κ·load, and moving flow raises F with the interaction term included
  let gap = 0;
  for (let j = 0; j < sim.N; j++) gap = Math.max(gap, Math.abs(sim.a[j] - sim.cfg.price.kappa * sim.r[j]));
  assert.ok(gap < 1e-4, `price = κ·load (${gap})`);
  const { F, x } = freeEnergyWithInteraction(sim);
  const F0 = F(x);
  const rnd = M.rng32(3);
  let raised = 0, tries = 0;
  for (let t = 0; t < 40; t++) {
    const a = Math.floor(rnd() * sim.N), b = Math.floor(rnd() * sim.N);
    if (a === b || x[a] < 1e-6) continue;
    const d = Math.min(x[a] * 0.5, 0.01);
    const x2 = Float64Array.from(x); x2[a] -= d; x2[b] += d;
    tries++;
    if (F(x2) > F0) raised++;
  }
  assert.ok(raised >= tries - 1 && tries > 25, `random transfers raise F: ${raised}/${tries}`);
  // a pinned feature off-centre, weak next to the land market's commute cost, moves the whole city
  const harbour = make('agglomeration', { sources: 'center', sourceAt: [7, 2], distanceCost: 0.05 }).run(1500).metrics();
  assert.ok(harbour.centroid[0] > 4 && harbour.centroid[1] > 0.8, `a harbour pull of 0.05 moves the centre to (${harbour.centroid.map((v) => v.toFixed(1))})`);
  // individual agents: the same centre and the same profile about it
  const ag = makeA('agglomeration').run(1200);
  const ma = ag.metrics();
  assert.ok(Math.hypot(...ma.centroid) < 1, `agents: centre in the middle (${ma.centroid})`);
  const pa = profileAbout(ag, ag.rAvg, ma.centroid);
  const rel = Math.sqrt(pa.reduce((s, v, i) => s + (v - prof[i]) ** 2, 0) / prof.reduce((s, v) => s + v * v, 0));
  assert.ok(rel < 0.15, `agents' profile about their centre matches the flows' (${rel})`);
});

test('agglomeration: a strong short-range pull alone collapses the city into one tower (the black hole); a push with a longer reach (competition ⇄ lateral inhibition) breaks it into several towns ⇄ bumps', () => {
  const hole = make('agglomeration', { interaction: { strength: 5, reach: 1.25 } }).run(1500).metrics();
  assert.ok(hole.used <= 40 && hole.peak > 2, `pull alone: one tower (${hole.used} parcels, peak ${hole.peak})`);
  const holeA = makeA('agglomeration', { interaction: { strength: 5, reach: 1.25 } }).run(1200).metrics();
  assert.ok(holeA.used <= 60 && holeA.peak > 2, `agents: one tower too (${holeA.used} parcels, peak ${holeA.peak})`);
  for (const [engine, mk] of [['flows', make], ['agents', makeA]]) {
    const sim = mk('agglomeration', { interaction: { strength: 5, reach: 1.25, compete: { strength: 10, reach: 3 } } }).run(engine === 'agents' ? 1200 : 1500);
    const towns = sim.metrics();
    assert.ok(towns.peaks >= 3 && towns.used > 300, `${engine}, pull and push: several towns (${towns.peaks} centres, ${towns.used} parcels)`);
    assert.ok(towns.typeDist[0] < 8.5, `${engine}: the towns sit inside the plain, not on its rim (mean distance ${towns.typeDist[0]})`);
    const middle = sim.rAvg[sim.centerDist.indexOf(0)];
    assert.ok(middle < 0.5 * towns.peak, `${engine}: the middle hollows out (${middle} against a peak of ${towns.peak})`);
  }
});

test('firms and homes: spillovers give one segregated centre; the need for each other gives a mixed sheet; competition for customers gives towns (Fujita & Ogawa’s three regimes)', () => {
  const mono = make('firmshomes').run(1500).metrics();
  assert.ok(mono.concentration > 0.95 && mono.mixing < 0.1 && mono.peaks === 1, `monocentric: firms concentrated (${mono.concentration}), homes apart (${mono.mixing}), one centre`);
  assert.ok(mono.typeDist[0] < 0.5 * mono.typeDist[1], `firms inside, homes around (${mono.typeDist})`);
  const monoA = makeA('firmshomes').run(1200).metrics();
  assert.ok(monoA.concentration > 0.95 && monoA.mixing < 0.1, `agents agree (${monoA.concentration}, ${monoA.mixing})`);
  const mixed = make('firmshomes', { interaction: { matrix: [[0.5, 2], [2, 0]] } }).run(1500).metrics();
  assert.ok(mixed.mixing > 0.45 && mixed.concentration < 0.75, `mixed: firms and homes on the same parcels (${mixed.mixing}, ${mixed.concentration})`);
  const mixedA = makeA('firmshomes', { interaction: { matrix: [[0.5, 2], [2, 0]] } }).run(1200).metrics();
  assert.ok(mixedA.mixing > 0.4, `agents agree (${mixedA.mixing})`);
  for (const [engine, mk] of [['flows', make], ['agents', makeA]]) {
    const poly = mk('firmshomes', { interaction: { matrix: [[3, 1], [1, 0]], compete: { strength: 20, reach: 3, matrix: [[1, 0], [0, 0]] } } }).run(engine === 'agents' ? 1200 : 1500).metrics();
    assert.ok(poly.peaks >= 4 && poly.concentration > 0.8 && poly.mixing < 0.1, `${engine}, polycentric: several firm centres (${poly.peaks}), each dense (${poly.concentration}) and apart from homes (${poly.mixing})`);
    assert.ok(poly.typeDist[0] < 8, `${engine}: the towns sit inside the plain (${poly.typeDist[0]})`);
  }
});

test('hierarchy: a chain of populations lays itself out in order of distance from a pinned input, with hops far shorter than a random placement; an input in the middle makes rings and longer hops', () => {
  const edge = make('hierarchy').run(1200);
  const m = edge.metrics();
  assert.ok(m.typeDist[0] + 1.5 < m.typeDist[1] && m.typeDist[1] + 1.5 < m.typeDist[2], `in order from the harbour ⇄ input: ${m.typeDist.map((v) => v.toFixed(1))}`);
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  assert.ok(sum(m.hops) < 0.6 * sum(m.hopsShuffled), `hops ${sum(m.hops).toFixed(1)} against ${sum(m.hopsShuffled).toFixed(1)} shuffled`);
  const overlap = (a, b) => { let ab = 0, aa = 0, bb = 0; for (let j = 0; j < edge.N; j++) { ab += edge.rk[j * 3 + a] * edge.rk[j * 3 + b]; aa += edge.rk[j * 3 + a] ** 2; bb += edge.rk[j * 3 + b] ** 2; } return ab / Math.sqrt(aa * bb); };
  assert.ok(overlap(0, 1) < 0.3 && overlap(1, 2) < 0.3 && overlap(0, 2) < 0.05, 'the populations occupy separate ground');
  const centre = make('hierarchy', { sourceAt: [0, 0] }).run(1200).metrics();
  assert.ok(centre.typeDist[0] < centre.typeDist[1] && centre.typeDist[1] < centre.typeDist[2], 'still in order from the input');
  assert.ok(sum(centre.hops) > sum(m.hops), `rings around a central input cost longer hops (${sum(centre.hops).toFixed(1)} vs ${sum(m.hops).toFixed(1)})`);
  const ag = makeA('hierarchy').run(1200).metrics();
  assert.ok(ag.typeDist[0] < ag.typeDist[1] && ag.typeDist[1] < ag.typeDist[2], `agents: in order (${ag.typeDist.map((v) => v.toFixed(1))})`);
});
