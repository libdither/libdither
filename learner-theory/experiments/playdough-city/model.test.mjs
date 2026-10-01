// Run with: node --test experiments/playdough-city/model.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ECON,
  NO_RULES,
  RING_METERS,
  compare,
  costElasticity,
  makeDemand,
  makeSupply,
  solveBaseline,
  solveCity,
  whereDidItGo,
  _internals,
} from './model.js';

const econ = { ...DEFAULT_ECON, demandFlex: 0.5, migration: 0 };
const base = solveBaseline(econ);
const lid1 = { ...NO_RULES, heightCap: 1 };
const hole = { ...NO_RULES, heightCap: 1, exemptRadiusKm: 1.6 };
const parking = { ...NO_RULES, parkingPer1000sqft: 1 };

const close = (a, b, rel, msg) => assert.ok(Math.abs(a / b - 1) < rel, `${msg}: ${a} vs ${b}`);

test('cost curve matches the Ahlfeldt–McMillen estimates it is fitted to', () => {
  // Table 6 (elasticity of cost per floor space w.r.t. height, at the sample's mean
  // height): 0.251 small (2.5 floors), 0.634 tall residential (15.6), 1.729 supertall (110).
  assert.ok(Math.abs(costElasticity(2.5) - 0.251) < 0.02);
  assert.ok(Math.abs(costElasticity(15.6) - 0.634) < 0.03);
  assert.ok(Math.abs(costElasticity(110) - 1.729) < 0.03);
  // The per-floor increases they report: ≈9.9%, ≈4.1%, ≈1.6%.
  assert.ok(Math.abs(costElasticity(2.5) / 2.5 - 0.099) < 0.01);
  assert.ok(Math.abs(costElasticity(15.6) / 15.6 - 0.041) < 0.003);
  assert.ok(Math.abs(costElasticity(110) / 110 - 0.016) < 0.001);
});

test('Stone–Geary demand hits its calibration point', () => {
  for (const eta of [0, 0.25, 0.5, 1]) {
    const d = makeDemand({ ...econ, demandFlex: eta });
    const p0 = (econ.housingShare * econ.income) / econ.refHomeM2;
    close(_internals.homeSize(d, p0, econ.income), econ.refHomeM2, 1e-12, `home size at eta=${eta}`);
    const h = 1e-6;
    const el =
      (Math.log(_internals.homeSize(d, p0 * (1 + h), econ.income)) -
        Math.log(_internals.homeSize(d, p0 * (1 - h), econ.income))) /
      (Math.log(1 + h) - Math.log(1 - h));
    assert.ok(Math.abs(el + eta) < 1e-6, `price elasticity at eta=${eta}: ${el}`);
  }
});

test('bid rent inverts indirect utility', () => {
  for (const eta of [0, 0.3, 1]) {
    const d = makeDemand({ ...econ, demandFlex: eta });
    const lnU = _internals.lnV(d, 200, 70_000);
    const p = _internals.bidRent(d, 70_000, lnU, 0);
    close(p, 200, 1e-9, `eta=${eta}`);
  }
});

test('supply: land rent rises with floor rent; a cap never raises it', () => {
  const s = makeSupply(econ, NO_RULES);
  let prev = -1;
  for (let p = 20; p < 3000; p *= 1.1) {
    const free = s(p, Infinity);
    const capped = s(p, 2);
    assert.ok(free.rent >= prev);
    assert.ok(capped.rent <= free.rent + 1e-9);
    assert.ok(capped.stories <= 2 + 1e-9);
    prev = free.rent;
  }
});

test('supply with parking: surface lots where land is cheap, garages where it is dear', () => {
  const s = makeSupply(econ, parking);
  assert.equal(s(150, Infinity).mode, 'surface');
  assert.equal(s(2000, Infinity).mode, 'structured');
  // Parking is a cost: it can only lower land rent.
  const free = makeSupply(econ, NO_RULES);
  for (const p of [100, 300, 1000]) assert.ok(s(p, Infinity).rent <= free(p, Infinity).rent);
});

test('baseline houses exactly the target population, edge at farm rent', () => {
  close(base.households, econ.households, 1e-6, 'population');
  // Urban land (lots + streets) must out-earn farming: developableShare × lot rent ≥ farm rent.
  const lr = base.rings.landRent;
  assert.ok(econ.developableShare * lr[lr.length - 1] >= econ.farmRent * (1 - 1e-6), 'last urban ring beats farm rent');
  assert.equal(base.feasible, true);
  assert.equal(base.realIncome, 1);
  // Density falls with distance: the free market builds a smooth cone.
  for (let i = 1; i < base.rings.far.length; i++) assert.ok(base.rings.far[i] <= base.rings.far[i - 1] + 1e-12);
});

test('no rules reproduces the baseline', () => {
  const c = solveCity(econ, NO_RULES, base);
  close(c.edge, base.edge, 1e-6, 'edge');
  close(c.households, base.households, 1e-6, 'households');
  assert.ok(Math.abs(c.realIncome - 1) < 1e-6);
});

test('a lid above the free-market skyline changes nothing', () => {
  const c = solveCity(econ, { ...NO_RULES, heightCap: base.totals.tallest + 0.5 }, base);
  close(c.edge, base.edge, 1e-6, 'edge');
});

test('closed city: a binding lid spreads the city and costs residents (Bertaud & Brueckner)', () => {
  const c = solveCity(econ, lid1, base);
  const k = compare(base, c, lid1, econ);
  assert.ok(c.feasible);
  close(c.households, econ.households, 1e-6, 'population fixed');
  assert.ok(k.area > 0.05, `footprint grows: ${k.area}`);
  assert.ok(k.welfare < -0.005, `residents lose: ${k.welfare}`);
  assert.ok(k.rentSamePlace > 0, `rent at the same place rises: ${k.rentSamePlace}`);
  assert.ok(k.flows.sprawl > 0);
});

test('open city: the same lid causes no sprawl — people leave instead', () => {
  const open = { ...econ, migration: Infinity };
  const b = solveBaseline(open);
  const c = solveCity(open, lid1, b);
  const k = compare(b, c, lid1, open);
  assert.ok(Math.abs(c.edge - b.edge) <= RING_METERS, `edge unchanged: ${c.edge} vs ${b.edge}`);
  assert.ok(k.households < -0.05, `population falls: ${k.households}`);
  assert.ok(Math.abs(k.welfare) < 1e-9);
  assert.ok(Math.abs(k.rentSamePlace) < 1e-6, 'rents at a given place are pinned by the outside option');
});

test('hole in the lid: exempt downtown out-builds the free market (closed city)', () => {
  const c = solveCity(econ, hole, base);
  assert.ok(c.rings.stories[0] > base.rings.stories[0] * 1.02);
  const k = compare(base, c, hole, econ);
  assert.ok(k.flows.downtown > 0 && k.flows.sprawl > 0);
});

test('play-dough limit: fixed home sizes + nobody leaves ⇒ floor space is conserved exactly', () => {
  const dough = { ...econ, demandFlex: 0, migration: 0 };
  const b = solveBaseline(dough);
  for (const rules of [lid1, hole, parking]) {
    const c = solveCity(dough, rules, b);
    close(c.floor, b.floor, 1e-6, 'total floor space');
    const f = whereDidItGo(b, c, rules, dough);
    assert.ok(f.neverBuilt / f.squeezed < 1e-4, `never built: ${f.neverBuilt / f.squeezed}`);
  }
});

test('where-did-it-go identity holds, including when total floor space rises', () => {
  const cases = [
    [lid1, econ],
    [hole, { ...econ, migration: 2 }],
    [parking, econ],
    // Flexible demand + a mildly binding cap: displaced households take bigger
    // homes farther out, so total floor space rises (reviewer's case).
    [{ ...NO_RULES, heightCap: 3 }, { ...econ, demandFlex: 1 }],
    [{ ...NO_RULES, heightCap: 2.5 }, { ...econ, households: 1_200_000, income: 80_000, demandFlex: 1 }],
  ];
  let sawExtra = false;
  for (const [rules, e] of cases) {
    const b = e === econ ? base : solveBaseline(e);
    const c = solveCity(e, rules, b);
    const f = whereDidItGo(b, c, rules, e);
    close(f.downtown + f.denser + f.sprawl, f.gains, 1e-12, 'gains');
    close(f.squeezed + (c.floor - b.floor), f.gains, 1e-6, 'squeezed + net change = rebuilt');
    close(f.gains + f.neverBuilt - f.extra, f.squeezed, 1e-6, 'identity');
    assert.ok(f.neverBuilt === 0 || f.extra === 0);
    if (f.extra > 0) sawExtra = true;
  }
  assert.ok(sawExtra, 'at least one case where total floor space rises');
});

test('sprawl is the floor space beyond the old edge, split by area', () => {
  // Reviewer's case: mid-size metro, 2.5-story cap. Classifying the ring that
  // straddles the old edge by its centre used to swing the sprawl share wildly.
  for (const eta of [0, 0.5]) {
    const e = { ...econ, households: 1_200_000, income: 80_000, demandFlex: eta };
    const b = solveBaseline(e);
    const rules = { ...NO_RULES, heightCap: 2.5 };
    const c = solveCity(e, rules, b);
    const f = whereDidItGo(b, c, rules, e);
    const annulus = Math.PI * (c.edge ** 2 - b.edge ** 2) * e.developableShare;
    // Bound sprawl by the annulus beyond the old edge times the min/max FAR there.
    let lo = Infinity;
    let hi = 0;
    for (let i = 0; i < c.rings.x.length; i++)
      if (c.rings.outer[i] > b.edge) {
        lo = Math.min(lo, c.rings.far[i]);
        hi = Math.max(hi, c.rings.far[i]);
      }
    assert.ok(c.edge > b.edge);
    assert.ok(f.sprawl >= annulus * lo * 0.999 && f.sprawl <= annulus * hi * 1.001, `eta=${eta}: sprawl ${f.sprawl} vs [${annulus * lo}, ${annulus * hi}]`);
  }
});

test('an unaffordable free-market city is flagged, not silently mis-solved', () => {
  // Reviewer's case: income $40k, commuting $5,000/mi, construction $450/sq ft.
  const poor = { ...econ, demandFlex: 0, income: 40_000, commutePerKm: 5000 / 1.609344, buildCostRef: 450 * 10.76391041671 * 0.065 };
  const b = solveBaseline(poor);
  assert.equal(b.feasible, false);
  assert.ok(b.households < poor.households);
  const c = solveCity(poor, NO_RULES, b);
  assert.equal(c.feasible, false);
});

test('baseline houses everyone, or says it cannot, across the slider ranges', () => {
  for (const households of [500_000, 6_000_000])
    for (const income of [40_000, 250_000])
      for (const perMile of [500, 5000])
        for (const buildSqft of [100, 450])
          for (const demandFlex of [0, 0.5, 1]) {
            const e = { ...econ, households, income, commutePerKm: perMile / 1.609344, buildCostRef: buildSqft * 10.76391041671 * 0.065, demandFlex };
            const b = solveBaseline(e);
            if (b.feasible) close(b.households, households, 1e-6, JSON.stringify({ households, income, perMile, buildSqft, demandFlex }));
            else assert.ok(b.households < households * (1 + 1e-9));
          }
});

test('play-dough conservation also holds with parking regime switches (reviewer worst case)', () => {
  const dough = { ...econ, demandFlex: 0, migration: 0, households: 4_000_000, income: 150_000, commutePerKm: 2000 };
  const b = solveBaseline(dough);
  for (const spaces of [0.5, 1, 2.25, 3]) {
    const rules = { ...NO_RULES, parkingPer1000sqft: spaces };
    const c = solveCity(dough, rules, b);
    close(c.households, dough.households, 1e-6, `households, ${spaces} spaces`);
    close(c.floor, b.floor, 1e-6, `floor, ${spaces} spaces`);
  }
});

test('population is continuous in utility (no jumps for the solver to land in)', () => {
  const e = { ...econ, households: 4_000_000, income: 150_000, commutePerKm: 2000, demandFlex: 0.5 };
  const b = solveBaseline(e);
  const ctx = _internals.makeContext(e, { ...NO_RULES, parkingPer1000sqft: 2.25, heightCap: 3, exemptRadiusKm: 1.6 });
  // Population changes smoothly with utility, so over a tiny range every step is
  // about the same size; a jump (e.g. a whole ring switching parking regime)
  // would stand out against the typical step.
  const steps = [];
  let prev = null;
  for (let k = -200; k <= 200; k++) {
    const n = _internals.cityAt(ctx, b.lnU + k * 2e-5).households;
    if (prev !== null) steps.push(Math.abs(n / prev - 1));
    prev = n;
  }
  const sorted = [...steps].sort((x, y) => x - y);
  const ratio = sorted[sorted.length - 1] / sorted[sorted.length >> 1];
  assert.ok(ratio < 1.2, `largest step is ${ratio.toFixed(2)}× the median step`);
});

test('invalid inputs throw instead of returning nonsense', () => {
  assert.throws(() => solveBaseline({ ...econ, commutePerKm: 0 }));
  assert.throws(() => solveBaseline({ ...econ, housingShare: 1 }));
  assert.throws(() => solveBaseline({ ...econ, migration: NaN }));
  assert.throws(() => solveCity(econ, { ...NO_RULES, heightCap: 0 }, base));
  assert.throws(() => solveCity(econ, { ...NO_RULES, growthBoundaryKm: -1 }, base));
});

test('a flatter cost of height lets the exempt downtown grow taller', () => {
  const steep = { ...econ, households: 4_000_000, income: 150_000, commutePerKm: 2000, demandFlex: 0 };
  const flat = { ...steep, heightCostScale: 0.72 };
  const tallest = (e) => solveCity(e, hole, solveBaseline(e)).totals.tallest;
  assert.ok(tallest(flat) > tallest(steep) * 1.2);
});

test('growth boundary binds: edge at the boundary, rents up, residents worse off', () => {
  const ugb = { ...lid1, growthBoundaryKm: (base.edge / 1000) * 0.9 };
  const c = solveCity(econ, ugb, base);
  const k = compare(base, c, ugb, econ);
  assert.ok(Math.abs(c.edge - base.edge * 0.9) < 1);
  assert.ok(k.rentSamePlace > 0.02);
  assert.ok(k.welfare < compare(base, solveCity(econ, lid1, base), lid1, econ).welfare);
});

test('growth boundary at the free-market edge: harmless alone, holds the edge under a lid', () => {
  const at = { ...NO_RULES, growthBoundaryKm: base.edge / 1000 };
  const k0 = compare(base, solveCity(econ, at, base), at, econ);
  assert.ok(Math.abs(k0.households) < 1e-9 && Math.abs(k0.floor) < 1e-9 && k0.flows.squeezed < base.floor * 1e-9);
  const withLid = { ...hole, growthBoundaryKm: base.edge / 1000 };
  const c = solveCity(econ, withLid, base);
  const k = compare(base, c, withLid, econ);
  assert.ok(c.feasible);
  assert.ok(Math.abs(k.area) < 1e-9 && k.flows.sprawl === 0);
  assert.ok(k.rentSamePlace > 0.02);
});

test('parking minimums spread a closed city', () => {
  const c = solveCity(econ, parking, base);
  assert.ok(c.edge > base.edge * 1.02);
});

test('play-dough + growth boundary + lid can be infeasible, and says so', () => {
  const dough = { ...econ, demandFlex: 0, migration: 0 };
  const b = solveBaseline(dough);
  const c = solveCity(dough, { ...lid1, growthBoundaryKm: (b.edge / 1000) * 0.7 }, b);
  assert.equal(c.feasible, false);
  assert.ok(c.households < dough.households);
});
