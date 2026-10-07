// Figures for WALKTHROUGH.md that the interactive pages don't draw. Run from learner-theory/:
//   node walkthrough/figures.mjs      # about a minute; writes walkthrough/img/*.svg
// Every number comes from the engines themselves (experiments/learners/learners.mjs and the model
// inside experiments/one-model/index.html), with the same seeds as the tests and the ladder.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as X from '../experiments/learners/learners.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = join(here, 'img');
mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------- drawing helpers
// Colours: the light reference palette; the first three slots pass every colour-vision check for any
// pair, and the fourth (violet) passes with blue/orange/aqua on a light surface. Clusters also get
// distinct shapes, so colour never carries identity alone.
const C = { surface: '#fcfcfb', ink: '#0b0b0b', ink2: '#52514e', muted: '#898781', grid: '#e1e0d9', axis: '#c3c2b7', blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a', violet: '#4a3aa7', wash: '#f0efec' };
const SERIES = [C.blue, C.orange, C.aqua, C.violet];
const FONT = 'system-ui, -apple-system, &quot;Segoe UI&quot;, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (v) => +v.toFixed(1);
const text = (x, y, s, { size = 13, fill = C.ink2, anchor = 'start', weight = 400 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;
// several lines of text, `gap` apart
const lines = (x, y, rows, opts = {}, gap = 18) => rows.map((r, i) => text(x, y + i * gap, r, opts)).join('');
const line = (x1, y1, x2, y2, { stroke = C.axis, width = 1, dash = '' } = {}) =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const svg = (name, w, h, title, body) => {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" font-family="${FONT}">
<title>${esc(title)}</title>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink2}"/></marker>
<marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.blue}"/></marker>
<marker id="arrow-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.orange}"/></marker></defs>
<rect width="${w}" height="${h}" rx="10" fill="${C.surface}"/>
${body}
</svg>
`;
  writeFileSync(join(out, `${name}.svg`), s);
  console.log(`img/${name}.svg`);
};
// a cluster's mark: circle, square, triangle, diamond; r is the radius of the same-area circle
const mark = (k, x, y, r, fill) => {
  if (k === 0) return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"/>`;
  if (k === 1) {
    const a = r * Math.sqrt(Math.PI) / 2;
    return `<rect x="${f(x - a)}" y="${f(y - a)}" width="${f(2 * a)}" height="${f(2 * a)}" rx="1.5" fill="${fill}"/>`;
  }
  if (k === 2) {
    const a = r * 1.55;
    return `<path d="M${f(x)},${f(y - a)} L${f(x + a * 0.87)},${f(y + a * 0.5)} L${f(x - a * 0.87)},${f(y + a * 0.5)} z" fill="${fill}"/>`;
  }
  const a = r * 1.25;
  return `<path d="M${f(x)},${f(y - a)} L${f(x + a)},${f(y)} L${f(x)},${f(y + a)} L${f(x - a)},${f(y)} z" fill="${fill}"/>`;
};
const sample = (r, n) => Float64Array.from({ length: n }, () => r.normal());

// ================================================================= 1. a learner is a chain of stages
{
  const W = 940;
  const H = 525;
  let b = '';
  // top: a dense network as firms
  b += text(24, 34, 'A dense network: white-box stages', { size: 15, fill: C.ink, weight: 600 });
  b += text(24, 54, 'Each unit is a firm. Its output is a good every unit in the next layer reads at once; credit comes back as a price.', { size: 12.5 });
  const cols = [
    { x: 110, n: 3, label: 'inputs x' },
    { x: 330, n: 4, label: 'hidden units' },
    { x: 550, n: 2, label: 'output units' },
  ];
  const ys = (n) => Array.from({ length: n }, (_, i) => 150 + (i - (n - 1) / 2) * 42);
  for (let c = 0; c < cols.length - 1; c++) {
    for (const y1 of ys(cols[c].n)) for (const y2 of ys(cols[c + 1].n)) b += line(cols[c].x + 14, y1, cols[c + 1].x - 14, y2, { stroke: C.axis });
  }
  for (const col of cols) {
    for (const y of ys(col.n)) b += `<circle cx="${col.x}" cy="${y}" r="13" fill="${col.n === 3 ? C.wash : C.surface}" stroke="${C.ink2}" stroke-width="1.5"/>`;
    b += text(col.x, 246, col.label, { anchor: 'middle', size: 12 });
  }
  b += `<rect x="690" y="122" width="150" height="56" rx="8" fill="${C.wash}" stroke="${C.axis}"/>`;
  b += text(765, 146, 'the customer', { anchor: 'middle', fill: C.ink, weight: 600 });
  b += text(765, 164, 'pays y − h per unit', { anchor: 'middle', size: 12 });
  b += `<path d="M566,150 L686,150" stroke="${C.ink2}" stroke-width="1.5" fill="none" marker-end="url(#arrow)"/>`;
  b += text(170, 84, 'goods flow forward →', { size: 12, fill: C.ink2 });
  b += `<path d="M760,184 C 700,330 420,330 140,205" stroke="${C.blue}" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>`;
  b += text(455, 322, '← prices flow back: what one more unit of each output is worth (backprop’s signals)', { anchor: 'middle', size: 12, fill: C.ink2 });
  // bottom: a market for control
  b += line(24, 345, W - 24, 345, { stroke: C.grid });
  b += text(24, 375, 'A market for control: black-box stages', { size: 15, fill: C.ink, weight: 600 });
  b += text(24, 395, 'Each stage is a moment in time. Agents bid to own the world’s state; the winner acts, and the next owner buys the state from it.', { size: 12.5 });
  const states = [110, 330, 550, 770];
  states.forEach((x, i) => {
    b += `<rect x="${x - 26}" y="${443}" width="52" height="34" rx="6" fill="${C.wash}" stroke="${C.ink2}" stroke-width="1.5"/>`;
    b += text(x, 465, `state ${i}`, { anchor: 'middle', size: 12, fill: C.ink });
    if (i === states.length - 1) return;
    const mid = (x + states[i + 1]) / 2;
    b += `<path d="M${x + 28},460 L${states[i + 1] - 30},460" stroke="${C.ink2}" stroke-width="1.5" fill="none" marker-end="url(#arrow)"/>`;
    for (let a = 0; a < 3; a++) {
      const ax = mid - 30 + a * 30;
      const win = a === (i % 3);
      b += `<circle cx="${ax}" cy="423" r="${win ? 8 : 6}" fill="${win ? C.orange : C.surface}" stroke="${win ? C.orange : C.muted}" stroke-width="1.5"/>`;
    }
    b += `<path d="M${states[i + 1] - 34},491 C ${mid + 30},507 ${mid - 30},507 ${x + 34},491" stroke="${C.blue}" stroke-width="2" fill="none" marker-end="url(#arrow-blue)"/>`;
  });
  b += text(716, 427, 'agents bidding; filled: the winner', { size: 12 });
  b += text(W - 24, 512, 'payment for the state flows back', { anchor: 'end', size: 12 });
  svg('stages', W, H, 'A learner as a chain of stages: a dense network and a market for control', b);
}

// ================================================================= 2. what one hidden unit is told
{
  const r0 = X.rng(10);
  const T = Float64Array.from({ length: 32 }, () => r0.normal() / Math.sqrt(8));
  const data = Array.from({ length: 200 }, () => {
    const x = sample(r0, 8);
    return [x, X.matvec(T, 4, 8, x)];
  });
  // train a little with backprop, then ask what hidden unit u would be told on the next 80 examples
  const net0 = X.makeNet({ sizes: [8, 16, 4], act: 'relu', seed: 12 });
  for (let ep = 0; ep < 5; ep++) for (const [x, y] of data) X.step(net0, x, y, 'backprop', 0.01);
  const copy = () => ({ ...net0, W: net0.W.map((w) => Float64Array.from(w)), b: net0.b.map((v) => Float64Array.from(v)) });
  const u = 1;
  const examples = data.slice(0, 80);
  const push = (design) => {
    const net = copy();
    const m = X.makeDenseMarket(net, { design });
    if (design === 'posted' || design === 'average') for (const [x, y] of data.slice(80)) X.denseMarketStep(net, x, y, 0, m); // let asks and averages settle
    return examples.map(([x, y]) => {
      const { fw, c } = X.denseMarketStep(net, x, y, 0, m);
      return c[1][u] * (fw.z[1][u] > 0 ? 1 : 0);
    });
  };
  const access = (() => {
    const net = copy();
    const r = X.rng(5);
    return examples.map(([x, y]) => -X.accessStep(net, x, y, 0, { sigma: 1e-3, rng: r })[1][u]);
  })();
  const rows = [
    ['honest price (backprop)', push('honest')],
    ['access sold at its true value', access],
    ['honest price, averaged', push('average')],
    ['posted asks, excludable', push('posted')],
    ['voluntary payment', push('voluntary')],
  ];
  // scale to the honest price; the perturbation estimate's rare spikes are clipped and marked
  const lim = Math.max(...rows[0][1].map(Math.abs)) * 1.15;
  const W = 940;
  const rowH = 74;
  const left = 230;
  const right = W - 30;
  const top = 70;
  const H = top + 18 + rows.length * rowH + 50;
  let b = text(24, 32, 'What one hidden unit is told, example by example', { size: 15, fill: C.ink, weight: 600 });
  b += lines(24, 52, ['The push on its input (price × f′(z)) on 80 examples in a row, from the same weights in every row.', 'Only a push that varies from example to example can turn a unit toward a new feature.'], { size: 12.5 });
  rows.forEach(([label, v], i) => {
    const y0 = top + 18 + i * rowH + rowH / 2;
    const sy = (val) => y0 - (Math.max(-lim, Math.min(lim, val)) / lim) * (rowH / 2 - 8);
    const sx = (k) => left + (k / (v.length - 1)) * (right - left);
    b += line(left, y0, right, y0, { stroke: C.axis });
    b += text(left - 14, y0 + 4, label, { anchor: 'end', fill: C.ink });
    const pts = v.map((val, k) => `${f(sx(k))},${f(sy(val))}`).join(' ');
    b += `<polyline points="${pts}" fill="none" stroke="${C.blue}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    v.forEach((val, k) => {
      if (Math.abs(val) <= lim) return;
      const yy = sy(val) + (val > 0 ? -6 : 6);
      b += `<path d="M${f(sx(k) - 5)},${f(yy + (val > 0 ? 4 : -4))} L${f(sx(k) + 5)},${f(yy + (val > 0 ? 4 : -4))} L${f(sx(k))},${f(yy - (val > 0 ? 4 : -4))} z" fill="${C.ink2}"/>`;
    });
  });
  b += text(left, H - 22, 'example 1', { size: 12, fill: C.muted });
  b += text(right, H - 22, 'example 80', { size: 12, fill: C.muted, anchor: 'end' });
  b += text((left + right) / 2, H - 22, `same scale in every row (±${lim.toFixed(2)}); grey line: zero; ▲▼: off the scale`, { size: 12, fill: C.muted, anchor: 'middle' });
  svg('dense-prices', W, H, 'The push one hidden unit receives on each of 80 examples under five market designs', b);
}

// ================================================================= 3. how much the hidden features improved
{
  const r0 = X.rng(10);
  const T = Float64Array.from({ length: 32 }, () => r0.normal() / Math.sqrt(8));
  const data = Array.from({ length: 200 }, () => {
    const x = sample(r0, 8);
    return [x, X.matvec(T, 4, 8, x)];
  });
  const median = (xs) => [...xs].sort((a, c) => a - c)[1];
  const market = (design) => (net, x, y, st) => X.denseMarketStep(net, x, y, 0.01, st.m || (st.m = X.makeDenseMarket(net, { design })));
  const designs = [
    ['backprop (honest market, VCG)', (net, x, y) => X.step(net, x, y, 'backprop', 0.01)],
    ['access sold at its true value', (net, x, y, st) => X.accessStep(net, x, y, 0.01, { sigma: 1e-3, rng: st.r })],
    ['node perturbation', (net, x, y, st) => X.step(net, x, y, 'perturb', 0.002, { sigma: 1e-3, rng: st.r })],
    ['honest price, averaged', market('average')],
    ['voluntary payment', market('voluntary')],
    ['posted asks, excludable', market('posted')],
  ];
  const gain = {};
  for (const act of ['relu', 'tanh']) {
    const start = median([12, 13, 14].map((seed) => X.bestReadoutLoss(X.makeNet({ sizes: [8, 16, 4], act, seed }), data)));
    gain[act] = designs.map(([, stepFn]) => {
      const after = median([12, 13, 14].map((seed) => {
        const net = X.makeNet({ sizes: [8, 16, 4], act, seed });
        const st = { r: X.rng(seed + 1) };
        for (let ep = 0; ep < 30; ep++) for (const [x, y] of data) stepFn(net, x, y, st);
        return X.bestReadoutLoss(net, data);
      }));
      return start / after;
    });
  }
  const W = 940;
  const left = 250;
  const right = W - 40;
  const top = 92;
  const rowH = 40;
  const H = top + designs.length * rowH + 64;
  const lo = Math.log10(0.15);
  const hi = Math.log10(60);
  const sx = (v) => left + ((Math.log10(v) - lo) / (hi - lo)) * (right - left);
  let b = text(24, 32, 'How much the hidden layer learned under each market design', { size: 15, fill: C.ink, weight: 600 });
  b += text(24, 52, 'Best loss any linear readout reaches on the hidden features: at the start ÷ after 30 passes. 1× means the hidden layer learned nothing.', { size: 12.5 });
  // legend
  b += `<circle cx="${left}" cy="74" r="5" fill="${C.blue}"/>` + text(left + 10, 78, 'ReLU network', { size: 12 });
  b += `<circle cx="${left + 120}" cy="74" r="5" fill="${C.orange}"/>` + text(left + 130, 78, 'tanh network', { size: 12 });
  for (const v of [0.2, 0.5, 1, 2, 5, 10, 20, 50]) {
    b += line(sx(v), top - 6, sx(v), top + designs.length * rowH - 10, { stroke: v === 1 ? C.axis : C.grid });
    b += text(sx(v), top + designs.length * rowH + 8, `${v}×`, { anchor: 'middle', size: 12, fill: C.muted });
  }
  b += text(sx(1) + 6, top + 4, 'no learning', { size: 11.5, fill: C.muted });
  designs.forEach(([label], i) => {
    const y = top + i * rowH + 12;
    b += text(left - 14, y + 4, label, { anchor: 'end', fill: C.ink });
    const a = gain.relu[i];
    const t = gain.tanh[i];
    b += line(sx(Math.min(a, t)), y, sx(Math.max(a, t)), y, { stroke: C.grid, width: 2 });
    b += `<circle cx="${f(sx(t))}" cy="${y}" r="6" fill="${C.orange}" stroke="${C.surface}" stroke-width="2"/>`;
    b += `<circle cx="${f(sx(a))}" cy="${y}" r="6" fill="${C.blue}" stroke="${C.surface}" stroke-width="2"/>`;
    if (Math.abs(Math.log(a / t)) < 0.02) b += text(sx(a) + 12, y + 4, 'both 1×', { size: 12, fill: C.ink2 });
    if (i === 0) {
      b += text(sx(a), y - 12, `${a.toFixed(0)}×`, { anchor: 'middle', size: 12, fill: C.ink2 });
      b += text(sx(t), y - 12, `${t.toFixed(1)}×`, { anchor: 'middle', size: 12, fill: C.ink2 });
    }
  });
  b += text((left + right) / 2, H - 18, 'improvement in the hidden features (log scale)', { anchor: 'middle', size: 12, fill: C.muted });
  svg('dense-features', W, H, 'How much the hidden features improved under each dense-layer market design', b);
  console.log('  gains', JSON.stringify(gain));
}

// ================================================================= 4–5. three uses that each mind the next
{
  const html = readFileSync(join(here, '..', 'experiments', 'one-model', 'index.html'), 'utf8');
  const src = html.slice(html.indexOf('/* MODEL:BEGIN */'), html.indexOf('/* MODEL:END */'));
  const M = new Function(`${src}; return OneModel;`)();
  const base = M.PRESETS.find((p) => p.id === 'mixed').config;
  const make = (matrix) => M.create(M.merge(base, { types: [{ share: 1 / 3 }, { share: 1 / 3 }, { share: 1 / 3 }], schedule: { kind: 'steady' }, nuisance: { strength: 0.5, matrix } }));
  const cases = [
    ['Each minds the next (A minds B, B minds C, C minds A)', [[0, 1, 0], [0, 0, 1], [1, 0, 0]]],
    ['Symmetric control (each minds both others half as much)', [[0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]]],
  ];
  const frames = [3000, 3150, 3300, 3450, 3600];
  const runs = cases.map(([, matrix]) => {
    const sim = make(matrix);
    const snaps = [];
    const moved = [];
    let prev = Float64Array.from(sim.rk);
    for (let t = 1; t <= frames.at(-1); t++) {
      sim.run(1);
      if (t % 50 === 0) {
        let d = 0;
        let n = 0;
        for (let i = 0; i < prev.length; i++) {
          d += (sim.rk[i] - prev[i]) ** 2;
          n += prev[i] ** 2;
        }
        moved.push([t, Math.sqrt(d / Math.max(n, 1e-12))]);
        prev = Float64Array.from(sim.rk);
      }
      if (frames.includes(t)) snaps.push(Float64Array.from(sim.rk));
    }
    return { sim, snaps, moved };
  });
  const { sim } = runs[0];
  const N = sim.N;
  const R = Math.max(...Array.from({ length: N }, (_, j) => Math.hypot(sim.layout.x[j], sim.layout.y[j])));
  const maxLoad = Math.max(...runs.flatMap((r) => r.snaps.flatMap((s) => Array.from({ length: N }, (_, j) => s[3 * j] + s[3 * j + 1] + s[3 * j + 2]))));
  const mix = (hex, t) => {
    // blend a colour toward the neutral wash by t (0: pure, 1: wash)
    const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
    return `rgb(${[0, 1, 2].map((i) => Math.round(p(hex, i) * (1 - t) + p(C.wash, i) * t)).join(',')})`;
  };
  const panel = 160;
  const W = 40 + frames.length * (panel + 12) + 10;
  const H = 140 + cases.length * (panel + 56) + 20;
  let b = text(24, 32, 'Three uses on one sheet: what never settling looks like', { size: 15, fill: C.ink, weight: 600 });
  b += lines(24, 52, ['Each mark is a site: its colour and shape are the use with the most load there, paler where uses mix,', 'and its size is the total load there. Nuisance strength ν = 0.5, average flows, snapshots 150 time units apart.'], { size: 12.5 });
  ['Use A', 'Use B', 'Use C'].forEach((name, k) => {
    b += mark(k, 32 + k * 90, 98, 6, SERIES[k]) + text(44 + k * 90, 102, name, { size: 12 });
  });
  runs.forEach((run, ci) => {
    const y0 = 140 + ci * (panel + 56);
    b += text(24, y0 + 4, cases[ci][0], { fill: C.ink, weight: 600 });
    run.snaps.forEach((s, fi) => {
      const x0 = 30 + fi * (panel + 12);
      const cx = x0 + panel / 2;
      const cy = y0 + 18 + panel / 2;
      b += `<circle cx="${cx}" cy="${cy}" r="${panel / 2}" fill="${C.wash}" fill-opacity="0.5"/>`;
      for (let j = 0; j < N; j++) {
        const a = [s[3 * j], s[3 * j + 1], s[3 * j + 2]];
        const tot = a[0] + a[1] + a[2];
        if (tot < 0.02 * maxLoad) continue;
        const k = a.indexOf(Math.max(...a));
        const purity = (a[k] / tot - 1 / 3) / (2 / 3); // 0 evenly mixed, 1 one use only
        const px = cx + (sim.layout.x[j] / R) * (panel / 2 - 6);
        const py = cy + (sim.layout.y[j] / R) * (panel / 2 - 6);
        b += mark(k, px, py, 0.8 + 2.6 * Math.sqrt(tot / maxLoad), mix(SERIES[k], 0.75 * (1 - purity)));
      }
      b += text(cx, y0 + panel + 36, fi === 0 ? `t = ${frames[0]}` : `+${frames[fi] - frames[0]}`, { anchor: 'middle', size: 12, fill: C.muted });
    });
  });
  svg('three-uses', W, H, 'Snapshots of three uses on one sheet: cyclic nuisance keeps moving, a symmetric control settles', b);

  // motion over time
  const W2 = 940;
  const H2 = 350;
  const left = 70;
  const right = W2 - 150;
  const top = 100;
  const bottom = H2 - 50;
  const tMax = frames.at(-1);
  const lo = -5;
  const hi = 0;
  const sx = (t) => left + (t / tMax) * (right - left);
  const sy = (v) => bottom - ((Math.min(hi + 0.3, Math.log10(Math.max(v, 1e-5))) - lo) / (hi - lo)) * (bottom - top);
  let m = text(24, 32, 'How much the loads move, every 50 time units', { size: 15, fill: C.ink, weight: 600 });
  m += text(24, 52, 'Root of the summed squared change in every use’s load at every site, relative to their size (log scale). Both start mixed and break apart.', { size: 12.5 });
  m += text(24, 70, 'Changes below 10⁻⁵ are drawn on the bottom line.', { size: 12.5 });
  for (let e = lo; e <= hi; e++) {
    m += line(left, sy(10 ** e), right, sy(10 ** e), { stroke: C.grid });
    m += text(left - 8, sy(10 ** e) + 4, { 0: '1', '-1': '0.1', '-2': '0.01', '-3': '0.001', '-4': '10⁻⁴', '-5': '10⁻⁵' }[e], { anchor: 'end', size: 12, fill: C.muted });
  }
  for (let t = 0; t <= tMax; t += 600) m += text(sx(t), bottom + 20, `${t}`, { anchor: 'middle', size: 12, fill: C.muted });
  m += text((left + right) / 2, H2 - 8, 'time', { anchor: 'middle', size: 12, fill: C.muted });
  runs.forEach((run, ci) => {
    const pts = run.moved.filter(([t]) => t > 50).map(([t, v]) => `${f(sx(t))},${f(sy(v))}`).join(' ');
    m += `<polyline points="${pts}" fill="none" stroke="${SERIES[ci]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const [tl, vl] = run.moved.at(-1);
    m += `<circle cx="${f(sx(tl))}" cy="${f(sy(vl))}" r="4" fill="${SERIES[ci]}" stroke="${C.surface}" stroke-width="2"/>`;
    m += text(sx(tl) + 10, sy(vl) + 4, ci === 0 ? 'cyclic: keeps moving' : 'symmetric: settles', { size: 12, fill: C.ink2 });
  });
  m += `<circle cx="${left}" cy="86" r="5" fill="${SERIES[0]}"/>` + text(left + 10, 90, 'each minds the next', { size: 12 });
  m += `<circle cx="${left + 160}" cy="86" r="5" fill="${SERIES[1]}"/>` + text(left + 170, 90, 'symmetric control', { size: 12 });
  svg('three-uses-motion', W2, H2, 'How much the loads move over time: the cyclic case never settles, the symmetric control does', m);
}

// ================================================================= 6. one batch of tokens under three routers
{
  const designs = [
    ['Gate + bias, drop in arrival order', 'gate', {}],
    ['Gate + bias, drop by gate probability', 'gate', { priority: true }],
    ['Auction, one price per expert', 'auction', {}],
  ];
  const runs = designs.map(([, design, opt]) => X.trainMoE(design, { seed: 1, cf: 1, ...opt }));
  const maxWorth = Math.max(...runs[0].example.tokens.map((t) => t.worth));
  const meanWorth = runs[0].example.tokens.reduce((s, t) => s + t.worth, 0) / runs[0].example.tokens.length;
  const cell = 21;
  const K = 4;
  const cap = runs[0].example.cap;
  const panelW = K * (cell + 8) + 150;
  const W = 30 + designs.length * (panelW + 20);
  const top = 150;
  const H = top + cap * cell + 70;
  const rOf = (worth) => 1.6 + 7.2 * Math.sqrt(worth / maxWorth);
  let b = text(24, 32, 'One batch of 64 tokens, four experts with room for 16 each', { size: 15, fill: C.ink, weight: 600 });
  b += lines(24, 52, ['Each mark is a token: shape and colour give its cluster, area what serving it is worth (½‖y‖²).', 'Tokens nobody serves go to the dashed tray. Trained at capacity 1×; the same test batch in every panel.'], { size: 12.5 });
  ['cluster 1', 'cluster 2', 'cluster 3', 'cluster 4'].forEach((name, k) => {
    b += mark(k, 32 + k * 100, 98, 6, SERIES[k]) + text(44 + k * 100, 102, name, { size: 12 });
  });
  runs.forEach((run, di) => {
    const x0 = 30 + di * (panelW + 20);
    const { tokens, where } = run.example;
    b += text(x0, top - 14, designs[di][0], { size: 12, fill: C.ink, weight: 600 });
    for (let e = 0; e < K; e++) {
      const cx = x0 + e * (cell + 8);
      b += `<rect x="${cx}" y="${top}" width="${cell}" height="${cap * cell}" rx="4" fill="${C.wash}"/>`;
      const mine = tokens.map((t, i) => ({ ...t, i })).filter((t) => where[t.i] === e);
      mine.forEach((t, s) => {
        b += mark(t.c, cx + cell / 2, top + cap * cell - cell / 2 - s * cell, rOf(t.worth), SERIES[t.c]);
      });
      b += text(cx + cell / 2, top + cap * cell + 18, `${e + 1}`, { anchor: 'middle', size: 12, fill: C.muted });
    }
    b += text(x0 + K * (cell + 8) / 2 - 4, top + cap * cell + 36, 'experts', { anchor: 'middle', size: 12, fill: C.muted });
    // the tray of dropped tokens
    const tx = x0 + K * (cell + 8) + 14;
    const dropped = tokens.filter((_, i) => where[i] < 0);
    b += `<rect x="${tx}" y="${top}" width="118" height="${cap * cell}" rx="4" fill="none" stroke="${C.axis}" stroke-dasharray="4 3"/>`;
    dropped.forEach((t, s) => {
      b += mark(t.c, tx + 16 + (s % 4) * 28, top + 16 + Math.floor(s / 4) * 26, rOf(t.worth), SERIES[t.c]);
    });
    const worth = dropped.reduce((s, t) => s + t.worth, 0) / Math.max(1, dropped.length) / meanWorth;
    b += text(tx + 59, top + cap * cell + 18, `dropped: ${dropped.length}`, { anchor: 'middle', size: 12, fill: C.ink2 });
    b += text(tx + 59, top + cap * cell + 36, `worth ${worth.toFixed(2)} of average`, { anchor: 'middle', size: 12, fill: C.ink2 });
  });
  svg('experts-batch', W, H, 'One batch of tokens routed to four experts by a gate with a balancing bias and by an auction', b);
}

// ================================================================= 7. what the kernels predict: a regime map
// For the one-type agglomeration setting on a wrapping plain (no edge), the growth rate of a wave with m bumps
// per side is s·B̂(k_m) − b·B̂_C(k_m), k_m = 2πm/P; it grows when that exceeds 1 + τ/(κ·r̄). Shaded: the
// prediction over the knobs. Marks: runs of the model at those knobs, a disc where the outcome matched and a
// cross where it did not (docs/6 §21).
{
  const html = readFileSync(join(here, '..', 'experiments', 'one-model', 'index.html'), 'utf8');
  const src = html.slice(html.indexOf('/* MODEL:BEGIN */'), html.indexOf('/* MODEL:END */'));
  const M = new Function(`${src}; return OneModel;`)();
  const base = M.PRESETS.find((p) => p.id === 'agglomeration').config;
  const torus = (patch) => M.create(M.merge(base, M.merge({ layout: { kind: 'sheet', radius: 10, periodic: true }, sources: 'anywhere', sourceAt: null, distanceCost: 0 }, patch)));
  const probe = torus({});
  const P = probe.layout.period;
  const thr = 1 + probe.cfg.temperature / (probe.cfg.price.kappa * (probe.cfg.demand / probe.N));
  const ks = Array.from({ length: Math.floor(P / 2) + 1 }, (_, m) => (2 * Math.PI * m) / P);
  const Ch = ks.map(probe.kernelTransform(3));
  const predict = (Bh, s, b) => {
    let best = 1;
    for (let m = 2; m < ks.length; m++) if (s * Bh[m] - b * Ch[m] > s * Bh[best] - b * Ch[best]) best = m;
    const rate = s * Bh[best] - b * Ch[best];
    return rate > thr ? (best === 1 ? 'centre' : `${best * best} towns`) : 'flat';
  };
  const observe = (sim) => {
    const m = sim.metrics();
    const mean = sim.rAvg.reduce((a, v) => a + v, 0) / sim.N;
    const mod = m.peak / mean;
    return mod > sim.N / 2 ? 'one parcel' : mod < 1.3 ? 'flat' : m.peaks >= 2 ? `${m.peaks} towns` : 'centre';
  };
  // each run: pull, competition, and where its label goes
  const panels = [
    { ell: 2, points: [[1.6, 0, 'left'], [2, 0, 'right'], [4, 6, 'above'], [6, 4, 'left']] },
    { ell: 1.25, points: [[3, 4, 'left'], [5, 10, 'below'], [4, 4, 'below'], [6, 12, 'left']] },
  ];
  const sMin = 1, sMax = 6, bMin = 0, bMax = 12, nx = 40, ny = 30;
  const pw = 330, ph = 240, mL = 46, mT = 36, mB = 40, mR = 14;
  const W = 2 * pw + 60, H = ph + 112;
  const fill = { flat: C.wash, centre: `${C.blue}55`, towns: `${C.orange}66` };
  let b = text(W / 2, 22, 'Fate of a flat plain predicted from the two kernels alone (wrapping plain, period 21)', { anchor: 'middle', size: 14, fill: C.ink, weight: 600 });
  panels.forEach(({ ell, points }, pi) => {
    const Bh = ks.map(probe.kernelTransform(ell));
    const x0 = 15 + pi * (pw + 30), y0 = 40;
    const iw = pw - mL - mR, ih = ph - mT - mB;
    const X = (s) => x0 + mL + ((s - sMin) / (sMax - sMin)) * iw;
    const Y = (bb) => y0 + mT + ih - ((bb - bMin) / (bMax - bMin)) * ih;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const s = sMin + ((i + 0.5) / nx) * (sMax - sMin), bb = bMin + ((j + 0.5) / ny) * (bMax - bMin);
        const r = predict(Bh, s, bb);
        b += `<rect x="${f(X(s) - iw / nx / 2)}" y="${f(Y(bb) - ih / ny / 2)}" width="${f(iw / nx + 0.4)}" height="${f(ih / ny + 0.4)}" fill="${fill[r.endsWith('towns') ? 'towns' : r]}"/>`;
      }
    }
    b += `<rect x="${f(x0 + mL)}" y="${f(y0 + mT)}" width="${f(iw)}" height="${f(ih)}" fill="none" stroke="${C.axis}"/>`;
    b += text(x0 + mL + iw / 2, y0 + mT - 10, `reach of dealings ℓ = ${ell}, competition reach 3`, { anchor: 'middle', size: 12, fill: C.ink2 });
    for (const v of [1, 2, 3, 4, 5, 6]) b += text(X(v), y0 + mT + ih + 14, String(v), { anchor: 'middle', size: 11, fill: C.muted });
    for (const v of [0, 4, 8, 12]) b += text(x0 + mL - 6, Y(v) + 4, String(v), { anchor: 'end', size: 11, fill: C.muted });
    b += text(x0 + mL + iw / 2, y0 + mT + ih + 30, 'pull of being near others ⇄ excitation (s)', { anchor: 'middle', size: 11, fill: C.muted });
    b += `<text x="${f(x0 + 12)}" y="${f(y0 + mT + ih / 2)}" font-size="11" fill="${C.muted}" text-anchor="middle" transform="rotate(-90 ${f(x0 + 12)} ${f(y0 + mT + ih / 2)})">competition ⇄ inhibition (b)</text>`;
    for (const [s, bb, pos] of points) {
      const want = predict(Bh, s, bb);
      const sim = torus({ interaction: { strength: s, reach: ell, compete: { strength: bb, reach: 3 } } });
      sim.run(3000);
      const got = observe(sim);
      const ok = got === want || (want.endsWith('towns') && got === want);
      const x = X(s), y = Y(bb);
      b += ok ? `<circle cx="${f(x)}" cy="${f(y)}" r="5.5" fill="${C.ink}" stroke="${C.surface}" stroke-width="2"/>` : `<path d="M${f(x - 5)},${f(y - 5)} L${f(x + 5)},${f(y + 5)} M${f(x - 5)},${f(y + 5)} L${f(x + 5)},${f(y - 5)}" stroke="${C.ink}" stroke-width="2.5"/>`;
      const parts = ok ? [got] : [got, `(predicted ${want})`];
      const n = parts.length;
      const place = {
        left: (i) => [x - 10, y + 4 - ((n - 1) * 13) / 2 + i * 13, 'end'],
        right: (i) => [x + 10, y + 4 - ((n - 1) * 13) / 2 + i * 13, 'start'],
        above: (i) => [x, y - 10 - (n - 1 - i) * 13, 'middle'],
        below: (i) => [x, y + 18 + i * 13, 'middle'],
        'below-left': (i) => [x - 10, y + 18 + i * 13, 'end'],
      }[pos];
      parts.forEach((t, i) => { const [tx, ty, anchor] = place(i); b += text(tx, ty, t, { anchor, size: 11, fill: C.ink }); });
      console.log(`regime map ℓ=${ell} s=${s} b=${bb}: predicted ${want}, got ${got}`);
    }
  });
  const ly = H - 40;
  const sw = (x, col) => `<rect x="${f(x)}" y="${f(ly - 9)}" width="14" height="12" fill="${col}" stroke="${C.axis}"/>`;
  b += sw(20, fill.flat) + text(40, ly, 'stays flat', { size: 12 }) + sw(120, fill.centre) + text(140, ly, 'one centre (the longest wave grows)', { size: 12 }) + sw(370, fill.towns) + text(390, ly, 'towns (a shorter wave grows fastest)', { size: 12 });
  const ly2 = ly + 20;
  b += `<circle cx="${f(27)}" cy="${f(ly2 - 4)}" r="5" fill="${C.ink}"/>` + text(40, ly2, 'a run of the model that matched the prediction', { size: 12 }) + `<path d="M${f(335)},${f(ly2 - 9)} L${f(345)},${f(ly2 + 1)} M${f(335)},${f(ly2 + 1)} L${f(345)},${f(ly2 - 9)}" stroke="${C.ink}" stroke-width="2"/>` + text(352, ly2, 'a run that did not (the towns merged into one parcel)', { size: 12 });
  svg('regime-map', W, H, 'Predicted fate of a flat plain over pull and competition for two reaches, with model runs marked', b);
}
