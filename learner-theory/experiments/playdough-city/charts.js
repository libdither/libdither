// SVG charts: the downtown-to-edge cross-section and the "where did it go" bar.
import { COVERAGE, UNITS } from './model.js';

const SVG = 'http://www.w3.org/2000/svg';
const MI = UNITS.M_PER_MILE;
const SQFT = UNITS.SQFT_PER_M2;
const CAP_RATE = 0.05; // land value = land rent / 5%

export const MEASURES = [
  {
    key: 'far',
    label: 'Floor space',
    unit: 'floor space per sq ft of lot (FAR)',
    get: (R, i) => R.far[i],
    fmt: (v) => v.toFixed(2),
    lid: (rules) => rules.heightCap * COVERAGE,
    washes: true,
  },
  {
    key: 'stories',
    label: 'Height',
    unit: 'stories',
    get: (R, i) => R.stories[i],
    fmt: (v) => v.toFixed(1),
    lid: (rules) => rules.heightCap,
    washes: true,
  },
  {
    key: 'rent',
    label: 'Rent',
    unit: '$ per sq ft per month',
    get: (R, i) => R.rentFloor[i] / SQFT / 12,
    fmt: (v) => '$' + v.toFixed(2),
  },
  {
    key: 'home',
    label: 'Home size',
    unit: 'sq ft per household',
    get: (R, i) => R.home[i] * SQFT,
    fmt: (v) => Math.round(v).toLocaleString('en-US'),
  },
  {
    key: 'density',
    label: 'Homes per acre',
    unit: 'households per acre, streets included',
    get: (R, i) => (R.area[i] > 0 ? R.households[i] / (R.area[i] / UNITS.M2_PER_ACRE) : 0),
    fmt: (v) => v.toFixed(1),
  },
  {
    key: 'land',
    label: 'Land value',
    unit: '$ per sq ft of lot (rent capitalised at 5%)',
    get: (R, i) => R.landRent[i] / CAP_RATE / SQFT,
    fmt: (v) => '$' + (v >= 100 ? Math.round(v) : v.toFixed(1)),
  },
];

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}

function niceStep(range, target) {
  const raw = range / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
}

function css(root, name) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

/**
 * Cross-section chart. Free market vs. with rules along the radius, with the
 * gained floor space shaded by where it landed (same colours as the 3D view).
 */
export function renderProfile({ plot, legend, table, tableOpen, root, base, city, rules, measureKey }) {
  const M = MEASURES.find((m) => m.key === measureKey) || MEASURES[0];
  const B = base.rings;
  const C = city.rings;
  const capActive = Number.isFinite(rules.heightCap);
  const exemptMi = capActive ? (rules.exemptRadiusKm * 1000) / MI : 0;
  const baseEdgeMi = base.edge / MI;
  const cityEdgeMi = city.edge / MI;
  const ugbMi = Number.isFinite(rules.growthBoundaryKm) ? (rules.growthBoundaryKm * 1000) / MI : null;

  const colors = {
    ref: css(root, '--reference'),
    ink: css(root, '--text-primary'),
    grid: css(root, '--grid'),
    axis: css(root, '--axis'),
    muted: css(root, '--text-muted'),
    sprawl: css(root, '--series-1'),
    suburbs: css(root, '--series-2'),
    downtown: css(root, '--series-3'),
    surface: css(root, '--surface-1'),
  };

  const W = Math.max(280, plot.clientWidth || 600);
  const H = 250;
  const m = { l: 46, r: 14, t: 18, b: 30 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;

  const xs = (i, R) => R.x[i] / MI;
  const series = (R) => {
    const pts = [];
    for (let i = 0; i < R.x.length; i++) pts.push([xs(i, R), M.get(R, i)]);
    return pts;
  };
  const sb = series(B);
  const sc = series(C);
  const xMax = Math.max(baseEdgeMi, cityEdgeMi, ugbMi && ugbMi < 1.5 * baseEdgeMi ? ugbMi : 0) * 1.04;
  let yMax = 0;
  for (const [, v] of sb) yMax = Math.max(yMax, v);
  for (const [, v] of sc) yMax = Math.max(yMax, v);
  const lidV = M.lid && capActive ? M.lid(rules) : null;
  if (lidV != null && lidV < yMax * 1.6) yMax = Math.max(yMax, lidV);
  yMax = yMax > 0 ? yMax * 1.1 : 1;
  const yStep = niceStep(yMax, 4);
  yMax = Math.ceil(yMax / yStep) * yStep;
  const X = (v) => m.l + (v / xMax) * iw;
  const Y = (v) => m.t + ih - (Math.min(v, yMax) / yMax) * ih;

  plot.replaceChildren();
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  svg.setAttribute('aria-label', `${M.label} by distance from downtown, free market vs. with these rules`);
  plot.appendChild(svg);

  // Grid + y axis
  for (let v = 0; v <= yMax + 1e-9; v += yStep) {
    el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: v === 0 ? colors.axis : colors.grid, 'stroke-width': 1 }, svg);
    const t = el('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }, svg);
    t.textContent = M.fmt(v).replace(/\.00$/, '');
  }
  // x axis
  const xStep = niceStep(xMax, 7);
  for (let v = 0; v <= xMax + 1e-9; v += xStep) {
    const t = el('text', { x: X(v), y: H - m.b + 16, 'text-anchor': 'middle' }, svg);
    t.textContent = String(Math.round(v * 10) / 10);
  }
  const xl = el('text', { x: W - m.r, y: H - 2, 'text-anchor': 'end' }, svg);
  xl.textContent = 'miles from downtown';

  // Washes: gained floor space coloured by destination; squeezed floor space grey.
  const n = Math.max(B.x.length, C.x.length);
  const val = (R, i, edge) => (i < R.x.length && R.x[i] < edge ? M.get(R, i) : 0);
  const ringMi = (i) => ((i + 0.5) * 50) / MI;
  if (M.washes) {
    const zoneOf = (x) => (x < exemptMi ? 'downtown' : x < baseEdgeMi ? 'suburbs' : 'sprawl');
    const bands = { downtown: [], suburbs: [], sprawl: [], lost: [] };
    for (let i = 0; i < n; i++) {
      const x = ringMi(i);
      const vb = val(B, i, base.edge);
      const vc = val(C, i, city.edge);
      bands[zoneOf(x)].push([x, Math.max(vb, vc), vb]);
      bands.lost.push([x, vb, Math.min(vb, vc)]);
    }
    const area = (pts, fill, opacity) => {
      if (pts.length < 2) return;
      let d = `M${X(pts[0][0])},${Y(pts[0][1])}`;
      for (const p of pts) d += `L${X(p[0])},${Y(p[1])}`;
      for (let j = pts.length - 1; j >= 0; j--) d += `L${X(pts[j][0])},${Y(pts[j][2])}`;
      el('path', { d: d + 'Z', fill, 'fill-opacity': opacity, stroke: 'none' }, svg);
    };
    area(bands.lost, colors.muted, 0.18);
    area(bands.downtown, colors.downtown, 0.3);
    area(bands.suburbs, colors.suburbs, 0.3);
    area(bands.sprawl, colors.sprawl, 0.3);
  }

  // Reference lines
  const vref = (x, label, anchor = 'start') => {
    if (x == null || x <= 0 || x > xMax) return;
    el('line', { x1: X(x), x2: X(x), y1: m.t, y2: m.t + ih, stroke: colors.axis, 'stroke-width': 1 }, svg);
    const t = el('text', { x: X(x) + (anchor === 'start' ? 4 : -4), y: m.t - 5, 'text-anchor': anchor, class: 'ref-label' }, svg);
    t.textContent = label;
  };
  vref(baseEdgeMi, 'free-market edge', cityEdgeMi > baseEdgeMi ? 'end' : 'start');
  if (Math.abs(cityEdgeMi - baseEdgeMi) > 0.05) vref(cityEdgeMi, 'edge now', cityEdgeMi > baseEdgeMi ? 'start' : 'end');
  if (exemptMi > 0) vref(exemptMi, 'no-limit downtown');
  if (ugbMi && Math.abs(ugbMi - cityEdgeMi) > 0.05) vref(ugbMi, 'growth boundary');
  if (lidV != null && lidV <= yMax) {
    el('line', { x1: X(exemptMi), x2: W - m.r, y1: Y(lidV), y2: Y(lidV), stroke: colors.ink, 'stroke-width': 1, 'stroke-opacity': 0.5 }, svg);
    const t = el('text', { x: W - m.r, y: Y(lidV) - 4, 'text-anchor': 'end', class: 'ref-label' }, svg);
    t.textContent = 'height limit';
  }

  // Lines
  const line = (pts, stroke) => {
    if (!pts.length) return;
    let d = '';
    pts.forEach(([x, v], j) => (d += `${j ? 'L' : 'M'}${X(x)},${Y(v)}`));
    el('path', { d, fill: 'none', stroke, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
  };
  line(sb, colors.ref);
  line(sc, colors.ink);

  // Legend (line keys for lines, swatches for washes)
  legend.replaceChildren();
  const item = (key, text) => {
    const s = document.createElement('span');
    s.className = 'item';
    s.appendChild(key);
    s.appendChild(document.createTextNode(text));
    legend.appendChild(s);
  };
  const lineKey = (c) => {
    const k = document.createElement('span');
    k.className = 'line-key';
    k.style.background = c;
    return k;
  };
  const swatch = (c, op) => {
    const k = document.createElement('span');
    k.className = 'swatch';
    k.style.background = c;
    k.style.opacity = op;
    return k;
  };
  item(lineKey(colors.ref), 'Free market');
  item(lineKey(colors.ink), 'With these rules');
  if (M.washes) {
    item(swatch(colors.muted, 0.45), 'Squeezed out');
    item(swatch(colors.sprawl, 0.6), 'Sprawl');
    item(swatch(colors.suburbs, 0.6), 'Suburbs built up');
    if (exemptMi > 0) item(swatch(colors.downtown, 0.6), 'Taller downtown');
  }

  // Hover: crosshair snaps to the nearest ring.
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.hidden = true;
  plot.appendChild(tip);
  const cross = el('line', { y1: m.t, y2: m.t + ih, stroke: colors.axis, 'stroke-width': 1, visibility: 'hidden' }, svg);
  const dotB = el('circle', { r: 4, fill: colors.ref, stroke: colors.surface, 'stroke-width': 2, visibility: 'hidden' }, svg);
  const dotC = el('circle', { r: 4, fill: colors.ink, stroke: colors.surface, 'stroke-width': 2, visibility: 'hidden' }, svg);
  const hit = el('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent', tabindex: 0 }, svg);
  const show = (xMi) => {
    const i = Math.max(0, Math.min(n - 1, Math.round((xMi * MI) / 50 - 0.5)));
    const x = ringMi(i);
    const inB = i < B.x.length && B.x[i] < base.edge;
    const inC = i < C.x.length && C.x[i] < city.edge;
    cross.setAttribute('x1', X(x));
    cross.setAttribute('x2', X(x));
    cross.setAttribute('visibility', 'visible');
    for (const [dot, ok, R] of [
      [dotB, inB, B],
      [dotC, inC, C],
    ]) {
      dot.setAttribute('visibility', ok ? 'visible' : 'hidden');
      if (ok) {
        dot.setAttribute('cx', X(x));
        dot.setAttribute('cy', Y(M.get(R, i)));
      }
    }
    tip.replaceChildren();
    const title = document.createElement('div');
    title.className = 'tt-title';
    title.textContent = `${x.toFixed(1)} mi from downtown · ${M.unit}`;
    tip.appendChild(title);
    const row = (color, value, label) => {
      const r = document.createElement('div');
      r.className = 'tt-row';
      const b = document.createElement('b');
      const key = document.createElement('i');
      key.className = 'key';
      key.style.background = color;
      b.appendChild(key);
      b.appendChild(document.createTextNode(value));
      const s = document.createElement('span');
      s.textContent = label;
      r.append(b, s);
      tip.appendChild(r);
    };
    row(colors.ink, inC ? M.fmt(M.get(C, i)) : 'farmland', 'with these rules');
    row(colors.ref, inB ? M.fmt(M.get(B, i)) : 'farmland', 'free market');
    tip.hidden = false;
    const px = X(x);
    tip.style.left = `${Math.min(px + 12, W - 200)}px`;
    tip.style.top = `${m.t + 8}px`;
  };
  const hide = () => {
    tip.hidden = true;
    for (const d of [cross, dotB, dotC]) d.setAttribute('visibility', 'hidden');
  };
  hit.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    show(((px - m.l) / iw) * xMax);
  });
  hit.addEventListener('pointerleave', hide);
  let kbX = 0;
  hit.addEventListener('focus', () => show(kbX));
  hit.addEventListener('blur', hide);
  hit.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      kbX = Math.max(0, Math.min(xMax, kbX + (e.key === 'ArrowRight' ? 0.5 : -0.5)));
      show(kbX);
      e.preventDefault();
    }
  });

  // Table view
  table.hidden = !tableOpen;
  if (tableOpen) {
    const t = document.createElement('table');
    t.className = 'data';
    const head = t.createTHead().insertRow();
    for (const h of ['Miles from downtown', 'Free market', 'With these rules']) {
      const th = document.createElement('th');
      th.textContent = h;
      head.appendChild(th);
    }
    const body = t.createTBody();
    const step = xMax > 12 ? 1 : 0.5;
    for (let x = 0; x <= xMax; x += step) {
      const i = Math.max(0, Math.round((x * MI) / 50 - 0.5));
      const inB = i < B.x.length && B.x[i] < base.edge;
      const inC = i < C.x.length && C.x[i] < city.edge;
      const r = body.insertRow();
      r.insertCell().textContent = x.toFixed(1);
      r.insertCell().textContent = inB ? M.fmt(M.get(B, i)) : '—';
      r.insertCell().textContent = inC ? M.fmt(M.get(C, i)) : '—';
    }
    const cap = t.createCaption();
    cap.textContent = M.unit;
    cap.style.textAlign = 'left';
    cap.style.color = 'var(--text-secondary)';
    table.replaceChildren(t);
  }
  return M;
}

const FLOW_SEGMENTS = [
  { key: 'sprawl', label: 'Sprawl onto farmland', color: '--series-1', ink: '#fff' },
  { key: 'denser', label: 'Suburbs built up (inside the old edge)', color: '--series-2', ink: '#fff' },
  { key: 'downtown', label: 'Taller downtown', color: '--series-3', ink: '#0b0b0b' },
  { key: 'neverBuilt', label: 'Never built (smaller homes, or people leave)', color: '--never-built', ink: '#0b0b0b' },
];

/**
 * "Where did the squeezed floor space go?" as one 100% bar plus a legend with values.
 * Shares are out of the larger of "squeezed" and "rebuilt elsewhere": when total
 * floor space falls, the bar is the squeezed amount and "never built" is the net
 * loss; when it rises (households pushed out take bigger homes), the bar is the
 * rebuilt amount and "never built" is zero.
 */
export function renderFlows({ bar, legend, note, table, tableOpen, root, flows, base, city, homeSamePlace }) {
  const S = flows.squeezed;
  const D = Math.max(S, flows.gains);
  bar.replaceChildren();
  legend.replaceChildren();
  const msqft = (m2) => ((m2 * SQFT) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const rows = FLOW_SEGMENTS.map((s) => ({ ...s, v: flows[s.key], share: D > 0 ? flows[s.key] / D : 0 }));
  const tiny = S < base.floor * 1e-4;

  // The tooltip lives in the card, not the bar, so the bar's children are only segments.
  const card = bar.parentElement;
  let tip = card.querySelector(':scope > .tooltip.flows-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'tooltip flows-tip';
    card.appendChild(tip);
  }
  tip.hidden = true;

  if (!tiny) {
    for (const r of rows) {
      if (r.share < 0.0005) continue;
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.style.flex = `${r.share} 1 0`;
      seg.style.background = css(root, r.color);
      seg.tabIndex = 0;
      const pct = `${Math.round(r.share * 100)}%`;
      const w = (bar.clientWidth || 300) * r.share;
      if (w > pct.length * 8 + 14) {
        const lab = document.createElement('span');
        lab.textContent = pct;
        lab.style.color = r.ink;
        seg.appendChild(lab);
      }
      const showTip = () => {
        tip.replaceChildren();
        const t = document.createElement('div');
        t.className = 'tt-title';
        t.textContent = r.label;
        const row = document.createElement('div');
        row.className = 'tt-row';
        const b = document.createElement('b');
        b.textContent = `${(r.share * 100).toFixed(1)}%`;
        const s = document.createElement('span');
        s.textContent = `${msqft(r.v)}M sq ft`;
        row.append(b, s);
        tip.append(t, row);
        tip.hidden = false;
        const cr = card.getBoundingClientRect();
        const sr = seg.getBoundingClientRect();
        tip.style.left = `${Math.max(8, Math.min(sr.left - cr.left + sr.width / 2 - 90, cr.width - 200))}px`;
        tip.style.top = `${sr.bottom - cr.top + 6}px`;
      };
      seg.addEventListener('pointerenter', showTip);
      seg.addEventListener('focus', showTip);
      seg.addEventListener('pointerleave', () => (tip.hidden = true));
      seg.addEventListener('blur', () => (tip.hidden = true));
      bar.appendChild(seg);
    }
  }

  for (const r of rows) {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = css(root, r.color);
    const lab = document.createElement('span');
    lab.textContent = r.label;
    const pct = document.createElement('span');
    pct.className = 'num pct';
    pct.textContent = tiny ? '—' : `${(r.share * 100).toFixed(0)}%`;
    const abs = document.createElement('span');
    abs.className = 'num muted';
    abs.textContent = tiny ? '' : `${msqft(r.v)}M sq ft`;
    legend.append(sw, lab, pct, abs);
  }

  const nb = D > 0 ? flows.neverBuilt / D : 0;
  if (tiny) {
    note.textContent = 'Nothing is squeezed with these settings, so there is nothing to account for.';
  } else if (flows.extra > 0.001 * S) {
    note.textContent = `More than the squeezed floor space gets rebuilt: total floor space rises ${((flows.extra / base.floor) * 100).toFixed(2)}%, because households pushed out to cheaper land take bigger homes. The shares above are out of everything rebuilt.`;
  } else if (nb < 0.005) {
    note.textContent = 'Play-dough is conserved: everything squeezed out reappears somewhere else, exactly as in the video.';
  } else {
    const left = base.households - city.households;
    const parts = [];
    if (left > 500) parts.push(`${Math.round(left / 1000).toLocaleString('en-US')}k households moved to other metros`);
    if (homeSamePlace < -0.001)
      parts.push(`homes at any given spot shrink ${Math.abs(homeSamePlace * 100).toFixed(1)}% (partly offset as movers take bigger homes farther out)`);
    if (!parts.length) parts.push('less floor space gets built in total');
    note.textContent = `Play-dough would put 0% in “never built”. Here it's ${(nb * 100).toFixed(0)}% on net: ${parts.join(', and ')}.`;
  }

  table.hidden = !tableOpen;
  if (tableOpen) {
    const t = document.createElement('table');
    t.className = 'data';
    const head = t.createTHead().insertRow();
    for (const h of ['Where it went', 'Share', 'Million sq ft']) {
      const th = document.createElement('th');
      th.textContent = h;
      head.appendChild(th);
    }
    const body = t.createTBody();
    for (const r of rows) {
      const tr = body.insertRow();
      tr.insertCell().textContent = r.label;
      tr.insertCell().textContent = tiny ? '—' : `${(r.share * 100).toFixed(1)}%`;
      tr.insertCell().textContent = tiny ? '—' : msqft(r.v);
    }
    const tr = body.insertRow();
    tr.insertCell().textContent = 'Total squeezed out';
    tr.insertCell().textContent = tiny ? '—' : `${((S / D) * 100).toFixed(1)}%`;
    tr.insertCell().textContent = msqft(S);
    if (flows.extra > 0) {
      const tx = body.insertRow();
      tx.insertCell().textContent = 'Extra floor space (bigger homes on cheaper land)';
      tx.insertCell().textContent = `${((flows.extra / D) * 100).toFixed(1)}%`;
      tx.insertCell().textContent = msqft(flows.extra);
    }
    table.replaceChildren(t);
  }
}
