// Run with: node --test explainer/explainer.test.mjs
// Checks that the explainer's small models say what the page says they do, against the numbers of the research
// (docs/6 §1–2, §19, §21–22; docs/5 and §9 for the brigade).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./engine.js', import.meta.url), 'utf8');
const E = new Function(`${src}; return Explainer;`)();

test('a choice is a race: the first of exponential clocks wins with the softmax probability', () => {
  const costs = [0, 0.3, 0.8, 1.5];
  const tau = 0.5;
  const want = E.softmax(costs, tau);
  const rnd = E.rng(7);
  const n = 40000;
  const won = new Array(costs.length).fill(0);
  for (let i = 0; i < n; i++) won[E.race(costs, tau, rnd).winner]++;
  for (let j = 0; j < costs.length; j++) assert.ok(Math.abs(won[j] / n - want[j]) < 0.01, `option ${j}: won ${(won[j] / n).toFixed(3)} against softmax ${want[j].toFixed(3)}`);
});

test('a city on a line: rent falls by the commute cost per unit distance (the bid-rent line), occupied parcels cost the same, and the total is the demand', () => {
  const city = E.Line({ tau: 0.05, commute: 1, kappa: 10, demand: 12 }).run(800);
  const m = city.metrics();
  assert.ok(Math.abs(m.total - 12) < 0.01, `total load ${m.total.toFixed(3)}`);
  assert.ok(Math.abs(m.slope + 1) < 0.05, `rent slope ${m.slope.toFixed(3)} against −t = −1`);
  assert.ok(m.spread < 0.15, `occupied parcels all cost about the same (spread ${m.spread.toFixed(3)} around ${m.level.toFixed(2)})`);
  // a height limit spreads the city and raises the rent at the centre when nobody can leave
  const capped = E.Line({ tau: 0.05, commute: 1, kappa: 10, demand: 12, cap: 0.6 }).run(800).metrics();
  assert.ok(capped.peak < 0.6 * 1.05 && capped.width > m.width && capped.centreRent > m.centreRent, `capped: peak ${capped.peak.toFixed(2)}, width ${capped.width} vs ${m.width}, centre rent ${capped.centreRent.toFixed(2)} vs ${m.centreRent.toFixed(2)}`);
  // when people can leave instead, some do and the city hardly spreads
  const open = E.Line({ tau: 0.05, commute: 1, kappa: 10, demand: 12, cap: 0.6, outside: m.level + 0.2 }).run(800).metrics();
  assert.ok(open.leaving > 0.05 && open.width <= m.width + 2, `open: ${(100 * open.leaving).toFixed(0)}% leave, width ${open.width}`);
});

test('a plain that wraps around: the pull at which it gathers is the one the kernel predicts, competition makes four towns, and the rate is the one-round eigenvalue', () => {
  const plain = E.Plain({ reach: 2 });
  const pred = plain.predictor();
  assert.ok(Math.abs(pred.thr - 1.123) < 0.005 && Math.abs(pred.sStar - 1.72) < 0.03, `θ = ${pred.thr.toFixed(3)}, s* = ${pred.sStar.toFixed(3)} (the research: 1.123 and 1.72)`);
  const below = E.Plain({ reach: 2, s: 1.6 }).run(2500).metrics();
  const above = E.Plain({ reach: 2, s: 2.0 }).run(2500).metrics();
  assert.ok(below.modulation < 1.05 && below.label === 'flat', `s = 1.6: flat (peak ÷ mean ${below.modulation.toFixed(3)})`);
  assert.ok(above.peaks === 1 && above.modulation > 2 && above.label === 'one centre', `s = 2.0: one centre (${above.peaks} peak, peak ÷ mean ${above.modulation.toFixed(2)})`);
  const towns = E.Plain({ reach: 1.25, s: 5, b: 10 });
  assert.equal(towns.predictor().at(5, 10).towns, 4, 'four towns predicted at s = 5, b = 10');
  const mt = towns.run(3000).metrics();
  assert.ok(mt.peaks === 4 && mt.label === '4 towns', `four towns formed (${mt.peaks})`);
  // the growth rate near the border, measured against the one-round prediction
  const s = 2.25;
  const sim = E.Plain({ reach: 2, s });
  const g = sim.predictor().at(s, 0).rate;
  const pts = [];
  for (let t = 0; t < 4000; t += 10) {
    sim.run(10);
    const mod = sim.peakOverMean();
    if (mod > 1.02 && mod < 1.5) pts.push([sim.time, Math.log(mod - 1)]);
    if (mod > 2) break;
  }
  const n = pts.length;
  const mx = pts.reduce((a, [u]) => a + u, 0) / n;
  const my = pts.reduce((a, [, v]) => a + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const [u, v] of pts) {
    sxy += (u - mx) * (v - my);
    sxx += (u - mx) ** 2;
  }
  const measured = sxy / sxx;
  assert.ok(n >= 5 && Math.abs(measured / g - 1) < 0.1, `rate ${measured.toFixed(5)} measured against ${g.toFixed(5)} predicted`);
  const onset = sim.predictor().at(s, 0).onset;
  assert.ok(sim.metrics().shown != null && Math.abs(sim.metrics().shown / onset - 1) < 0.3, `shown at ${sim.metrics().shown} against ${onset.toFixed(0)} predicted`);
});

test('the black hole: one parcel holds everything past the pull its nearest neighbour sets, and a dense cluster forms below it; a saturating gain keeps four towns', () => {
  const plain = E.Plain({ reach: 1.25 });
  const border = plain.singleParcel()(0);
  assert.ok(border > 17.5 && border < 19, `border ${border.toFixed(2)} (the research: 18.1)`);
  const cluster = E.Plain({ reach: 1.25, s: 5 }).run(2000).metrics();
  assert.ok(cluster.peaks === 1 && cluster.used >= 8 && cluster.used <= 30 && cluster.share > 0.08 && cluster.share < 0.25, `pull 5: a cluster of ${cluster.used} parcels, busiest ${(100 * cluster.share).toFixed(0)}%`);
  const hole = E.Plain({ reach: 1.25, s: 20 }).run(2000).metrics();
  assert.ok(hole.share > 0.95 && hole.label === 'one parcel', `pull 20: one parcel holds ${(100 * hole.share).toFixed(0)}%`);
  const sat = E.Plain({ reach: 1.25, s: 6, b: 12, saturate: 2 });
  assert.ok(sat.singleParcel()(12) > 2 * E.Plain({ reach: 1.25 }).singleParcel()(12), 'the saturating gain pushes the border out');
  const ms = sat.run(3000).metrics();
  assert.ok(ms.peaks === 4 && ms.share < 0.03, `x₀ = 2 at s = 6, b = 12: ${ms.peaks} towns of finite size (busiest ${(100 * ms.share).toFixed(1)}%)`);
});

test('the bucket brigade settles at the discounted value of the reward, with the tax as the discount (TD(0))', () => {
  const chain = E.Brigade({ n: 5, bid: 0.5, tax: 0.1, reward: 10 }).run(300);
  const want = chain.target();
  const gamma = 0.5 / 0.6;
  for (let k = 0; k < 5; k++) assert.ok(Math.abs(chain.S[k] / want[k] - 1) < 0.01, `stage ${k}: ${chain.S[k].toFixed(3)} against γ^${4 - k}·R/(β + t) = ${want[k].toFixed(3)}`);
  assert.ok(Math.abs(chain.S[3] / chain.S[4] - gamma) < 0.01, `each stage is worth γ = ${gamma.toFixed(3)} of the next`);
});
