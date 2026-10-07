// The page: wires the models in engine.js to the figures in index.html. Each figure is a demo with a
// frame(dt) and a draw(); demos run only while on screen. Plain script, no dependencies.
(() => {
  'use strict';
  const E = Explainer;
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

  // ------------------------------------------------------------ the two readings
  function applyReading(mode) {
    root.dataset.reading = mode;
    for (const el of $$('.d')) {
      const e = el.dataset.e;
      const n = el.dataset.n;
      el.textContent = mode === 'city' ? e : mode === 'net' ? n : `${e} ⇄ ${n}`;
    }
    for (const b of $$('#reading button')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  }
  for (const b of $$('#reading button')) b.addEventListener('click', () => applyReading(b.dataset.mode));
  applyReading('both');

  // ------------------------------------------------------------ colours, from the stylesheet
  let TOK = null;
  const tokens = () => {
    if (TOK) return TOK;
    const cs = getComputedStyle(root);
    const g = (n) => cs.getPropertyValue(n).trim();
    TOK = { surface: g('--surface'), surface2: g('--surface-2'), ink: g('--ink'), ink2: g('--ink-2'), muted: g('--muted'), grid: g('--grid'), axis: g('--axis'), blue: g('--blue'), orange: g('--orange'), aqua: g('--aqua'), violet: g('--violet'), heat: g('--heat').split(',').map((s) => s.trim()) };
    return TOK;
  };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const alpha = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const mix = (a, b, t) => {
    const A = hex(a);
    const B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  };
  const heat = (v) => {
    const ramp = tokens().heat;
    const n = ramp.length - 1;
    const p = Math.min(n - 1e-9, Math.max(0, v * n));
    const i = Math.floor(p);
    return mix(ramp[i], ramp[i + 1], p - i);
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    TOK = null;
    for (const d of demos) if (d.invalidate) d.invalidate();
  });

  // ------------------------------------------------------------ canvas helpers
  function fit(cv) {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }
  function txt(ctx, s, x, y, { size = 11, color, align = 'left', base = 'alphabetic', weight = 400 } = {}) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color || tokens().ink2;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.fillText(s, x, y);
  }
  function bar(ctx, x, y, w, h, color) {
    if (h <= 0 || w <= 0) return;
    const r = Math.min(4, w / 2, h);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
  function hbar(ctx, x, y, w, h, color) {
    if (h <= 0 || w <= 0) return;
    const r = Math.min(4, h / 2, w);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  }
  function polyline(ctx, pts, color, width = 2, dash = []) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
  }
  function dot(ctx, x, y, r, color, ring = true) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    if (ring) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = tokens().surface;
      ctx.stroke();
    }
  }
  function hline(ctx, x1, x2, y, color, width = 1, dash = []) {
    polyline(ctx, [[x1, y], [x2, y]], color, width, dash);
  }

  // ------------------------------------------------------------ tooltip and hover
  const tip = $('#tip');
  const showTip = (x, y, text) => {
    tip.textContent = text;
    tip.style.display = 'block';
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };
  const hideTip = () => (tip.style.display = 'none');
  function hover(cv, fn) {
    cv.addEventListener('pointermove', (ev) => {
      const r = cv.getBoundingClientRect();
      const text = fn(ev.clientX - r.left, ev.clientY - r.top, r);
      if (text) showTip(ev.clientX, ev.clientY, text);
      else hideTip();
    });
    cv.addEventListener('pointerleave', hideTip);
  }

  // ------------------------------------------------------------ controls and readouts
  function wire(fig, st, onChange, format = {}) {
    const outs = {};
    for (const inp of $$('[data-in]', fig)) {
      const key = inp.dataset.in;
      const out = $(`[data-out="${key}"]`, fig);
      const show = () => {
        if (out) out.textContent = (format[key] || ((v) => fmt(v, 2)))(Number(inp.value));
      };
      outs[key] = { inp, show };
      st[key] = Number(inp.value);
      show();
      inp.addEventListener('input', () => {
        st[key] = Number(inp.value);
        show();
        onChange(key);
      });
    }
    return {
      set(key, v) {
        st[key] = v;
        if (outs[key]) {
          outs[key].inp.value = v;
          outs[key].show();
        }
      },
    };
  }
  const ro = (fig, key, v) => {
    const el = $(`[data-ro="${key}"]`, fig);
    if (el) el.textContent = v;
  };
  const act = (fig, name, fn) => {
    const b = $(`[data-act="${name}"]`, fig);
    if (b) b.addEventListener('click', () => fn(b));
    return b;
  };

  // ------------------------------------------------------------ the loop: only demos on screen run
  const demos = [];
  const visible = new Set();
  const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '120px' });
  function register(fig, demo) {
    demo.fig = fig;
    demos.push(demo);
    io.observe(fig);
    demo.draw();
  }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const d of demos) if (visible.has(d.fig)) { d.frame(dt); d.draw(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ============================================================ 1. a choice is a race
  function raceDemo(fig) {
    const costs = [0, 0.5, 1, 1.6, 2.4];
    const names = ['A', 'B', 'C', 'D', 'E'];
    const st = { tau: 0.5 };
    let won = new Array(costs.length).fill(0);
    let total = 0;
    let anim = null;
    const rnd = E.rng(0x5eed);
    wire(fig, st, () => {});
    const cv = { costs: $('[data-cv="costs"]', fig), race: $('[data-cv="race"]', fig), wins: $('[data-cv="wins"]', fig) };
    const one = () => {
      const r = E.race(costs, st.tau, rnd);
      anim = { ...r, t: 0, dur: 1.4, tmax: Math.max(...r.times) };
      won[r.winner]++;
      total++;
    };
    act(fig, 'one', one);
    act(fig, 'many', () => {
      for (let i = 0; i < 1000; i++) won[E.race(costs, st.tau, rnd).winner]++;
      total += 1000;
      anim = null;
    });
    act(fig, 'reset', () => {
      won.fill(0);
      total = 0;
      anim = null;
    });
    hover(cv.wins, (x, y, r) => {
      const { w } = { w: r.width };
      const i = Math.floor(((x - 30) / (w - 40)) * costs.length);
      if (i < 0 || i >= costs.length) return null;
      const law = E.softmax(costs, st.tau)[i];
      return `${names[i]}: won ${total ? ((100 * won[i]) / total).toFixed(1) : '—'}% of ${total}; the law says ${(100 * law).toFixed(1)}%`;
    });
    const demo = {
      frame(dt) {
        if (anim) anim.t += dt;
      },
      draw() {
        const T = tokens();
        {
          const { ctx, w, h } = fit(cv.costs);
          const top = 10;
          const rowH = (h - top - 16) / costs.length;
          for (let j = 0; j < costs.length; j++) {
            const y = top + j * rowH;
            txt(ctx, names[j], 8, y + rowH / 2, { base: 'middle', color: T.ink });
            const len = (costs[j] / 3) * (w - 70);
            hbar(ctx, 26, y + rowH / 2 - 7, len, 14, T.blue);
            txt(ctx, costs[j].toFixed(1), 30 + len, y + rowH / 2, { base: 'middle', color: T.ink2 });
          }
          txt(ctx, 'cost', w - 8, h - 4, { align: 'right', color: T.muted });
        }
        {
          const { ctx, w, h } = fit(cv.race);
          const top = 10;
          const rowH = (h - top - 16) / costs.length;
          const x0 = 26;
          const x1 = w - 12;
          for (let j = 0; j < costs.length; j++) {
            const y = top + j * rowH + rowH / 2;
            txt(ctx, names[j], 8, y, { base: 'middle', color: T.ink });
            hline(ctx, x0, x1, y, T.grid);
            if (!anim) continue;
            const p = Math.min(1, anim.t / anim.dur);
            const tj = anim.times[j] / anim.tmax;
            const reached = p >= tj;
            const x = x0 + Math.min(p, tj) * (x1 - x0);
            const isWinner = j === anim.winner;
            if (reached) {
              dot(ctx, x, y, isWinner ? 7 : 4, isWinner ? T.blue : T.muted);
              if (isWinner) txt(ctx, 'rings first', x + 11, y, { base: 'middle', color: T.ink, weight: 600 });
            } else dot(ctx, x, y, 4, T.axis);
          }
          txt(ctx, anim ? 'time →' : 'press "Run one race"', w / 2, h - 4, { align: 'center', color: T.muted });
        }
        {
          const { ctx, w, h } = fit(cv.wins);
          const law = E.softmax(costs, st.tau);
          const n = costs.length;
          const left = 30;
          const bw = (w - 40) / n;
          const top = 14;
          const base = h - 20;
          const ymax = Math.max(0.3, ...law, ...(total ? won.map((v) => v / total) : [0])) * 1.1;
          for (const t of [0, 0.25, 0.5, 0.75, 1]) {
            if (t > ymax) continue;
            const y = base - (t / ymax) * (base - top);
            hline(ctx, left, w - 10, y, T.grid);
            txt(ctx, `${Math.round(t * 100)}%`, left - 4, y, { align: 'right', base: 'middle', color: T.muted, size: 10 });
          }
          let gap = 0;
          for (let j = 0; j < n; j++) {
            const share = total ? won[j] / total : 0;
            gap = Math.max(gap, Math.abs(share - law[j]));
            const x = left + j * bw + bw * 0.2;
            const bwid = Math.min(24, bw * 0.6);
            const hh = (share / ymax) * (base - top);
            bar(ctx, x, base - hh, bwid, hh, T.blue);
            const yl = base - (law[j] / ymax) * (base - top);
            hline(ctx, x - 4, x + bwid + 4, yl, T.orange, 2);
            txt(ctx, names[j], x + bwid / 2, h - 6, { align: 'center', color: T.ink2 });
          }
          hline(ctx, left, w - 10, base, T.axis);
          ro(fig, 'n', String(total));
          ro(fig, 'gap', total ? `${(100 * gap).toFixed(1)} points` : '—');
        }
      },
    };
    register(fig, demo);
  }

  // ============================================================ 2. a city on a line
  function lineDemo(fig) {
    const st = { commute: 1, kappa: 10, tau: 0.3, demand: 12, cap: 2 };
    let outside = null;
    const city = E.Line({});
    const sync = () => city.set({ commute: st.commute, kappa: st.kappa, tau: st.tau, demand: st.demand, cap: st.cap >= 2 ? Infinity : st.cap, outside });
    wire(fig, st, sync, { cap: (v) => (v >= 2 ? 'none' : fmt(v, 2)) });
    sync();
    const btnOut = act(fig, 'outside', (b) => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      // the outside option: a little dearer than what the uncapped city costs, so people leave only when the lid raises costs
      const level = E.Line({ commute: st.commute, kappa: st.kappa, tau: st.tau, demand: st.demand }).run(300).metrics().level;
      outside = on ? level + 0.25 : null;
      sync();
    });
    act(fig, 'reset', () => {
      city.r.fill(0.001);
      city.b.fill(0);
    });
    const cv = { city: $('[data-cv="city"]', fig), costs: $('[data-cv="costs"]', fig) };
    const sparks = [];
    const geom = (w) => ({ left: 36, right: w - 12, dx: (w - 48) / city.N });
    const xOf = (j, w) => geom(w).left + (j + 0.5) * geom(w).dx;
    hover(cv.costs, (x, y, r) => {
      const g = geom(r.width);
      const j = Math.floor((x - g.left) / g.dx);
      if (j < 0 || j >= city.N) return null;
      return `distance ${Math.abs(city.x[j])}: commute ${fmt(st.commute * Math.abs(city.x[j]))}, rent ${fmt(city.a[j] + city.b[j])}, total ${fmt(city.cost[j])}, floor space ${fmt(city.r[j])}`;
    });
    hover(cv.city, (x, y, r) => {
      const g = geom(r.width);
      const j = Math.floor((x - g.left) / g.dx);
      if (j < 0 || j >= city.N) return null;
      return `distance ${Math.abs(city.x[j])}: floor space ${fmt(city.r[j])}, rent ${fmt(city.a[j] + city.b[j])}`;
    });
    let m = city.metrics();
    let tick = 0;
    const demo = {
      frame(dt) {
        for (let i = 0; i < 12; i++) city.step();
        for (let i = 0; i < 2; i++) {
          let u = Math.random();
          let j = city.N - 1;
          for (let q = 0; q < city.N; q++) { u -= city.P[q]; if (u <= 0) { j = q; break; } }
          sparks.push({ j, age: 0 });
        }
        for (const s of sparks) s.age += dt;
        while (sparks.length && sparks[0].age > 0.6) sparks.shift();
        if (++tick % 6 === 0) m = city.metrics();
      },
      draw() {
        const T = tokens();
        {
          const { ctx, w, h } = fit(cv.city);
          const g = geom(w);
          const base = h - 18;
          let peakNow = 0;
          for (const v of city.r) if (v > peakNow) peakNow = v;
          const ymax = Math.max(0.5, peakNow, Number.isFinite(city.o.cap) ? city.o.cap : 0) * 1.15;
          for (let j = 0; j < city.N; j++) {
            const hh = (city.r[j] / ymax) * (base - 10);
            bar(ctx, xOf(j, w) - g.dx / 2 + 1, base - hh, Math.max(1, g.dx - 2), hh, T.blue);
          }
          if (Number.isFinite(city.o.cap)) {
            const yc = base - (city.o.cap / ymax) * (base - 10);
            hline(ctx, g.left, g.right, yc, T.ink2, 1.5, [5, 4]);
            txt(ctx, 'the lid', g.right, yc - 4, { align: 'right', color: T.ink2 });
          }
          for (const s of sparks) {
            const p = s.age / 0.6;
            const y = base - (city.r[s.j] / ymax) * (base - 10) - (1 - p) * 40;
            dot(ctx, xOf(s.j, w), y, 3, alpha(T.orange, 1 - p), false);
          }
          hline(ctx, g.left, g.right, base, T.axis);
          for (const d of [-20, -10, 0, 10, 20]) txt(ctx, d === 0 ? 'centre' : String(Math.abs(d)), xOf(d + 20, w), h - 4, { align: 'center', color: T.muted, size: 10 });
        }
        {
          const { ctx, w, h } = fit(cv.costs);
          const g = geom(w);
          const base = h - 18;
          const top = 10;
          const ymax = Math.max(2, m.level * 1.6, st.commute * 10) ;
          const Y = (v) => base - (Math.min(v, ymax) / ymax) * (base - top);
          for (const t of [0, 0.25, 0.5, 0.75, 1].map((f) => f * ymax)) {
            hline(ctx, g.left, g.right, Y(t), T.grid);
            txt(ctx, fmt(t, 1), g.left - 4, Y(t), { align: 'right', base: 'middle', color: T.muted, size: 10 });
          }
          const pts = (fn) => Array.from({ length: city.N }, (_, j) => [xOf(j, w), Y(fn(j))]);
          polyline(ctx, pts((j) => st.commute * Math.abs(city.x[j])), T.muted, 1.5);
          polyline(ctx, pts((j) => city.a[j] + city.b[j]), T.orange, 2);
          polyline(ctx, pts((j) => city.cost[j]), T.aqua, 2);
          if (Number.isFinite(m.level)) {
            txt(ctx, `the level, ${fmt(m.level)}`, xOf(city.N - 1, w), Y(m.level) - 6, { align: 'right', color: T.ink });
          }
          hline(ctx, g.left, g.right, base, T.axis);
          for (const d of [-20, -10, 0, 10, 20]) txt(ctx, d === 0 ? 'centre' : String(Math.abs(d)), xOf(d + 20, w), h - 4, { align: 'center', color: T.muted, size: 10 });
        }
        ro(fig, 'slope', Number.isFinite(m.slope) ? `${fmt(m.slope)} (the commute: −${fmt(st.commute)})` : '—');
        ro(fig, 'level', fmt(m.level));
        ro(fig, 'used', `${m.used} of ${city.N}`);
        ro(fig, 'leaving', outside == null ? 'nobody may' : `${(100 * m.leaving).toFixed(0)}%`);
      },
    };
    register(fig, demo);
  }

  // ============================================================ 3. the water level
  function waterDemo(fig) {
    const st = { demand: 12, commute: 1, kappa: 10 };
    const R = 20;
    const xs = Array.from({ length: 2 * R + 1 }, (_, j) => j - R);
    let mu = 0;
    const solve = () => {
      const f = (m) => xs.reduce((s, x) => s + Math.max(0, m - st.commute * Math.abs(x)), 0) / st.kappa - st.demand;
      let lo = 0;
      let hi = st.commute * R + st.kappa * st.demand;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (f(mid) > 0) hi = mid;
        else lo = mid;
      }
      mu = (lo + hi) / 2;
    };
    wire(fig, st, solve);
    solve();
    const cv = $('[data-cv="water"]', fig);
    const geom = (w, h) => ({ left: 40, right: w - 14, top: 16, base: h - 22, ymax: Math.max(st.commute * R * 1.05, mu * 1.3) });
    hover(cv, (x, y, r) => {
      const g = geom(r.width, r.height);
      const j = Math.round(((x - g.left) / (g.right - g.left)) * (xs.length - 1));
      if (j < 0 || j >= xs.length) return null;
      const depth = Math.max(0, mu - st.commute * Math.abs(xs[j]));
      return `distance ${Math.abs(xs[j])}: depth ${fmt(depth)} = rent; floor space ${fmt(depth / st.kappa)}`;
    });
    const demo = {
      frame() {},
      draw() {
        const T = tokens();
        const { ctx, w, h } = fit(cv);
        const g = geom(w, h);
        const X = (x) => g.left + ((x + R) / (2 * R)) * (g.right - g.left);
        const Y = (v) => g.base - (v / g.ymax) * (g.base - g.top);
        // the water
        ctx.fillStyle = alpha(T.blue, 0.22);
        ctx.beginPath();
        let started = false;
        for (const x of xs) {
          const v = st.commute * Math.abs(x);
          if (v < mu) {
            if (!started) { ctx.moveTo(X(x), Y(mu)); started = true; }
            ctx.lineTo(X(x), Y(v));
          }
        }
        if (started) {
          const edge = mu / st.commute;
          ctx.lineTo(X(Math.min(R, edge)), Y(mu));
          ctx.closePath();
          ctx.fill();
        }
        // the skyline inside the water: floor space × κ is the depth, drawn as thin bars
        for (const x of xs) {
          const depth = mu - st.commute * Math.abs(x);
          if (depth <= 0) continue;
          const bw = (g.right - g.left) / xs.length;
          bar(ctx, X(x) - bw / 2 + 1, Y(mu), Math.max(1, bw - 2), Y(mu - depth) - Y(mu), alpha(T.blue, 0.35));
        }
        polyline(ctx, xs.map((x) => [X(x), Y(st.commute * Math.abs(x))]), T.muted, 1.5);
        hline(ctx, g.left, g.right, Y(mu), T.blue, 2);
        txt(ctx, `the level μ = ${fmt(mu)}`, g.right - 4, Y(mu) - 6, { align: 'right', color: T.ink, weight: 600 });
        txt(ctx, 'the commute cost, a valley', X(-R * 0.72) + 6, Y(st.commute * R * 0.72) - 10, { align: 'left', color: T.ink2 });
        hline(ctx, g.left, g.right, g.base, T.axis);
        for (const d of [-20, -10, 0, 10, 20]) txt(ctx, d === 0 ? 'centre' : String(Math.abs(d)), X(d), h - 6, { align: 'center', color: T.muted, size: 10 });
        for (const f of [0.25, 0.5, 0.75, 1]) txt(ctx, fmt(f * g.ymax, 1), g.left - 4, Y(f * g.ymax), { align: 'right', base: 'middle', color: T.muted, size: 10 });
        ro(fig, 'mu', fmt(mu));
        ro(fig, 'edge', `${fmt(mu / st.commute, 1)} from the centre`);
        ro(fig, 'centre', fmt(mu));
      },
    };
    register(fig, demo);
  }

  // ============================================================ 4 and 5. a plain that wraps around
  const PRESETS = {
    flat: { s: 1.5, b: 0, reach: 2, saturate: 0 },
    centre: { s: 2.5, b: 0, reach: 2, saturate: 0 },
    towns: { s: 5, b: 10, reach: 1.25, saturate: 0 },
    cluster: { s: 5, b: 0, reach: 1.25, saturate: 0 },
    hole: { s: 20, b: 0, reach: 1.25, saturate: 0 },
    saturated: { s: 6, b: 12, reach: 1.25, saturate: 2 },
    slow: { s: 1.8, b: 0, reach: 2, saturate: 0 },
  };
  const S_MAX = 64;
  const B_MAX = 12;
  const SLOW = 3000;
  function plainDemo(fig) {
    const st = { s: 2, b: 0, reach: 2, saturate: 0, speed: 10 };
    const sim = E.Plain({});
    let pred = null;
    let mapImg = null;
    let paused = false;
    let seed = 1;
    const sparks = [];
    const getPred = () => pred || (pred = sim.predictor());
    const ctl = wire(fig, st, (key) => {
      if (key === 'reach' || key === 'saturate') {
        sim.set({ reach: st.reach, saturate: st.saturate });
        pred = null;
        mapImg = null;
      } else if (key === 's' || key === 'b') sim.set({ s: Math.min(S_MAX, Math.max(1, st.s)), b: Math.min(B_MAX, Math.max(0, st.b)) });
    }, { saturate: (v) => (v > 0 ? fmt(v, 2) : 'never'), speed: (v) => `${v}× ` });
    const setKnobs = (p) => {
      for (const k of ['s', 'b', 'reach', 'saturate']) ctl.set(k, p[k]);
      sim.set({ s: p.s, b: p.b, reach: p.reach, saturate: p.saturate });
      pred = null;
      mapImg = null;
    };
    const restart = () => {
      seed = (seed * 7 + 13) & 0xffff;
      sim.reset(seed);
      sparks.length = 0;
    };
    for (const b of $$('[data-preset]', fig)) b.addEventListener('click', () => { setKnobs(PRESETS[b.dataset.preset]); restart(); paused = false; pauseBtn.setAttribute('aria-pressed', 'false'); });
    act(fig, 'reset', restart);
    const pauseBtn = act(fig, 'pause', (b) => {
      paused = !paused;
      b.setAttribute('aria-pressed', String(paused));
    });
    setKnobs(PRESETS[fig.dataset.preset] || PRESETS.centre);
    sim.reset(seed);
    const cv = { plain: $('[data-cv="plain"]', fig), map: $('[data-cv="map"]', fig), waves: $('[data-cv="waves"]', fig), onset: $('[data-cv="onset"]', fig) };
    const P = sim.P;
    // the map's geometry: pull on a log axis, competition linear
    const mapGeom = (w, h) => ({ left: 34, right: w - 10, top: 10, base: h - 30 });
    const sOf = (fx) => 2 ** (Math.min(1, Math.max(0, fx)) * Math.log2(S_MAX));
    const fxOf = (s) => Math.log2(Math.min(S_MAX, Math.max(1, s))) / Math.log2(S_MAX);
    let dragging = false;
    const fromPointer = (ev) => {
      const r = cv.map.getBoundingClientRect();
      const g = mapGeom(r.width, r.height);
      const fx = (ev.clientX - r.left - g.left) / (g.right - g.left);
      const fy = (g.base - (ev.clientY - r.top)) / (g.base - g.top);
      return { s: Math.round(sOf(fx) * 100) / 100, b: Math.round(Math.min(B_MAX, Math.max(0, fy * B_MAX)) * 2) / 2 };
    };
    cv.map.addEventListener('pointerdown', (ev) => {
      dragging = true;
      cv.map.setPointerCapture(ev.pointerId);
      const { s, b } = fromPointer(ev);
      ctl.set('s', s);
      ctl.set('b', b);
      sim.set({ s, b });
    });
    cv.map.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const { s, b } = fromPointer(ev);
      ctl.set('s', s);
      ctl.set('b', b);
      sim.set({ s, b });
    });
    cv.map.addEventListener('pointerup', () => (dragging = false));
    cv.map.addEventListener('pointercancel', () => (dragging = false));
    hover(cv.map, (x, y, r) => {
      if (dragging) return null;
      const g = mapGeom(r.width, r.height);
      const fx = (x - g.left) / (g.right - g.left);
      const fy = (g.base - y) / (g.base - g.top);
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
      const s = sOf(fx);
      const b = fy * B_MAX;
      const a = getPred().at(s, b);
      const when = a.regime === 'flat' || a.regime === 'one parcel' ? '' : `, should show after ${a.onset > 1e5 ? 'over 100 000' : fmt(a.onset, 0)} time units`;
      return `pull ${fmt(s)}, competition ${fmt(b, 1)}: ${a.regime === 'towns' ? `${a.towns} towns` : a.regime}${when}`;
    });
    hover(cv.plain, (x, y, r) => {
      const cell = Math.min(r.width, r.height) / P;
      const i = Math.floor(x / cell);
      const j = Math.floor(y / cell);
      if (i < 0 || i >= P || j < 0 || j >= P) return null;
      const idx = j * P + i;
      return `site (${sim.xs[idx]}, ${sim.ys[idx]}): ${fmt(sim.r[idx], 3)}, ${fmt(sim.r[idx] / sim.rbar(), 1)}× the flat plain`;
    });
    let m = sim.metrics();
    let tick = 0;
    function drawMap(w, h) {
      const T = tokens();
      const off = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      off.width = Math.round(w * dpr);
      off.height = Math.round(h * dpr);
      const ctx = off.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = mapGeom(w, h);
      const pr = getPred();
      const nx = 48;
      const ny = 30;
      const cw = (g.right - g.left) / nx;
      const ch = (g.base - g.top) / ny;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const a = pr.at(sOf((i + 0.5) / nx), ((j + 0.5) / ny) * B_MAX);
          const slow = a.onset > SLOW ? 0.45 : 1;
          ctx.fillStyle = a.regime === 'one parcel' ? alpha(T.ink, 0.3) : a.regime === 'flat' ? T.surface2 : a.regime === 'one centre' ? alpha(T.blue, 0.35 * slow) : alpha(T.orange, 0.4 * slow);
          ctx.fillRect(g.left + i * cw, g.base - (j + 1) * ch, cw + 0.5, ch + 0.5);
        }
      }
      ctx.strokeStyle = T.axis;
      ctx.lineWidth = 1;
      ctx.strokeRect(g.left, g.top, g.right - g.left, g.base - g.top);
      for (const v of [1, 2, 4, 8, 16, 32, 64]) txt(ctx, String(v), g.left + fxOf(v) * (g.right - g.left), g.base + 13, { align: 'center', color: T.muted, size: 10 });
      for (const v of [0, 4, 8, 12]) txt(ctx, String(v), g.left - 5, g.base - (v / B_MAX) * (g.base - g.top), { align: 'right', base: 'middle', color: T.muted, size: 10 });
      txt(ctx, 'pull s (log scale)', (g.left + g.right) / 2, h - 4, { align: 'center', color: T.muted, size: 10 });
      ctx.save();
      ctx.translate(10, (g.top + g.base) / 2);
      ctx.rotate(-Math.PI / 2);
      txt(ctx, 'competition b', 0, 0, { align: 'center', color: T.muted, size: 10 });
      ctx.restore();
      return off;
    }
    const demo = {
      invalidate() {
        mapImg = null;
      },
      frame(dt) {
        if (!paused) {
          const steps = Math.round(st.speed / sim.o.dt);
          for (let i = 0; i < steps; i++) sim.step();
          for (let i = 0; i < 3; i++) sparks.push({ j: sim.sample(), age: 0 });
        }
        for (const s of sparks) s.age += dt;
        while (sparks.length && sparks[0].age > 0.5) sparks.shift();
        if (++tick % 8 === 0) m = sim.metrics();
      },
      draw() {
        const T = tokens();
        const pr = getPred();
        const here = pr.at(st.s, st.b);
        {
          const { ctx, w, h } = fit(cv.plain);
          const cell = Math.min(w, h) / P;
          let peak = 0;
          for (const v of sim.r) if (v > peak) peak = v;
          const vmax = Math.max(peak, 4 * sim.rbar());
          for (let j = 0; j < sim.N; j++) {
            const i = j % P;
            const k = Math.floor(j / P);
            ctx.fillStyle = heat(sim.r[j] / vmax);
            ctx.fillRect(i * cell + 0.5, k * cell + 0.5, cell - 1, cell - 1);
          }
          for (const s of sparks) {
            const p = s.age / 0.5;
            const i = s.j % P;
            const k = Math.floor(s.j / P);
            ctx.beginPath();
            ctx.arc((i + 0.5) * cell, (k + 0.5) * cell, 2 + 4 * p, 0, 2 * Math.PI);
            ctx.strokeStyle = alpha(T.orange, 1 - p);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        {
          const { ctx, w, h } = fit(cv.map);
          if (!mapImg || mapImg.width !== Math.round(w * (window.devicePixelRatio || 1))) mapImg = drawMap(w, h);
          ctx.drawImage(mapImg, 0, 0, w, h);
          const g = mapGeom(w, h);
          const x = g.left + fxOf(st.s) * (g.right - g.left);
          const y = g.base - (Math.min(B_MAX, st.b) / B_MAX) * (g.base - g.top);
          dot(ctx, x, y, 6, T.ink);
        }
        if (cv.waves) {
          const { ctx, w, h } = fit(cv.waves);
          const g = { left: 34, right: w - 10, top: 14, base: h - 30 };
          const M = Math.min(10, pr.ks.length - 1);
          const pull = Array.from({ length: M }, (_, i) => here.sEff * pr.B[i + 1]);
          const push = Array.from({ length: M }, (_, i) => st.b * pr.C[i + 1]);
          const diff = pull.map((v, i) => v - push[i]);
          const ymax = Math.max(pr.thr * 1.3, ...pull) * 1.08;
          const ymin = Math.min(0, ...diff) * 1.1;
          const X = (i) => g.left + ((i + 0.5) / M) * (g.right - g.left);
          const Y = (v) => g.base - ((v - ymin) / (ymax - ymin)) * (g.base - g.top);
          hline(ctx, g.left, g.right, Y(0), T.axis);
          hline(ctx, g.left, g.right, Y(pr.thr), T.ink2, 1.5, [5, 4]);
          txt(ctx, `θ = ${fmt(pr.thr)}`, g.right - 2, Y(pr.thr) - 5, { align: 'right', color: T.ink2 });
          polyline(ctx, pull.map((v, i) => [X(i), Y(v)]), T.blue, 2);
          if (st.b > 0) polyline(ctx, push.map((v, i) => [X(i), Y(v)]), T.orange, 2);
          polyline(ctx, diff.map((v, i) => [X(i), Y(v)]), T.ink, 2);
          const best = here.m - 1;
          if (best >= 0 && best < M) {
            dot(ctx, X(best), Y(diff[best]), 6, T.ink);
            txt(ctx, diff[best] > pr.thr ? `grows: ${here.m === 1 ? 'one centre' : `${here.towns} towns`}` : 'held down', best < 2 ? X(best) + 9 : best > M - 3 ? X(best) - 9 : X(best), Y(diff[best]) - 11, { align: best < 2 ? 'left' : best > M - 3 ? 'right' : 'center', color: T.ink, weight: 600 });
          }
          for (let i = 0; i < M; i++) txt(ctx, String(i + 1), X(i), g.base + 13, { align: 'center', color: T.muted, size: 10 });
          txt(ctx, 'bumps across the plain', (g.left + g.right) / 2, h - 4, { align: 'center', color: T.muted, size: 10 });
          for (const v of ymax < 3 ? [0, 0.5, 1, 1.5, 2, 2.5] : [0, 1, 2, 3, 4, 5, 6]) if (v < ymax && v > ymin) txt(ctx, String(v), g.left - 5, Y(v), { align: 'right', base: 'middle', color: T.muted, size: 10 });
        }
        if (cv.onset) {
          const { ctx, w, h } = fit(cv.onset);
          const g = { left: 44, right: w - 10, top: 14, base: h - 30 };
          const sStar = pr.sStar * (st.b > 0 ? 1 : 1);
          // the border for this competition: where the fastest wave's growth crosses θ
          let border = NaN;
          for (let s = 1; s <= S_MAX; s *= 1.005) if (pr.at(s, st.b).lambda > pr.thr) { border = s; break; }
          const sLo = Number.isFinite(border) ? border * 0.95 : 1;
          const sHi = Number.isFinite(border) ? Math.max(border * 3, border + 1.5) : 8;
          const tLo = 50;
          const tHi = 20000;
          const X = (s) => g.left + ((s - sLo) / (sHi - sLo)) * (g.right - g.left);
          const Y = (t) => g.base - ((Math.log10(t) - Math.log10(tLo)) / (Math.log10(tHi) - Math.log10(tLo))) * (g.base - g.top);
          for (const t of [100, 1000, 10000]) {
            hline(ctx, g.left, g.right, Y(t), T.grid);
            txt(ctx, String(t), g.left - 4, Y(t), { align: 'right', base: 'middle', color: T.muted, size: 10 });
          }
          ctx.strokeStyle = T.axis;
          ctx.strokeRect(g.left, g.top, g.right - g.left, g.base - g.top);
          if (Number.isFinite(border)) {
            polyline(ctx, [[X(border), g.top], [X(border), g.base]], T.ink2, 1.5, [5, 4]);
            txt(ctx, `border ${fmt(border)}`, X(border) + 4, g.top + 11, { color: T.ink2 });
            const pts = [];
            for (let s = border * 1.002; s <= sHi; s += (sHi - sLo) / 200) {
              const a = pr.at(s, st.b);
              if (a.onset > tHi || a.onset < tLo || a.regime === 'one parcel') continue;
              pts.push([X(s), Y(a.onset)]);
            }
            polyline(ctx, pts, T.blue, 2);
            if (here.onset >= tLo && here.onset <= tHi && st.s >= sLo && st.s <= sHi) dot(ctx, X(st.s), Y(here.onset), 5, T.blue);
            if (m.shown != null && st.s >= sLo && st.s <= sHi && m.shown >= tLo && m.shown <= tHi) {
              dot(ctx, X(st.s), Y(m.shown), 6, T.orange);
              txt(ctx, `this run: ${fmt(m.shown, 0)}`, X(st.s) + 9, Y(m.shown) + 4, { color: T.ink, weight: 600 });
            }
          } else txt(ctx, 'no wave grows at this competition', (g.left + g.right) / 2, (g.top + g.base) / 2, { align: 'center', color: T.ink2 });
          const ticks = [];
          for (let s = Math.ceil(sLo * 2) / 2; s <= sHi; s += 0.5) ticks.push(s);
          for (const s of ticks.filter((_, i, a) => a.length <= 8 || i % 2 === 0)) txt(ctx, fmt(s, 1), X(s), g.base + 13, { align: 'center', color: T.muted, size: 10 });
          txt(ctx, 'pull s, at this competition', (g.left + g.right) / 2, h - 4, { align: 'center', color: T.muted, size: 10 });
          void sStar;
        }
        ro(fig, 'predicted', here.regime === 'towns' ? `${here.towns} towns` : here.regime);
        ro(fig, 'seen', m.label);
        ro(fig, 'mod', fmt(m.modulation, 1));
        ro(fig, 'share', `${(100 * m.share).toFixed(1)}%`);
        ro(fig, 'time', `${fmt(sim.time, 0)}${paused ? ' (paused)' : ''}`);
        ro(fig, 'rate', here.rate > 0 ? `${fmt(here.rate, 4)} per time unit` : 'none grows');
        ro(fig, 'onset', here.regime === 'flat' ? '— (stays flat)' : here.regime === 'one parcel' ? '— (one parcel)' : `${here.onset > 1e5 ? 'over 100 000' : fmt(here.onset, 0)} time units`);
        ro(fig, 'shown', m.shown == null ? 'not yet' : `${fmt(m.shown, 0)} time units`);
        ro(fig, 'border', fmt(here.border, 1));
      },
    };
    register(fig, demo);
  }

  // ============================================================ 6. the bucket brigade
  function brigadeDemo(fig) {
    const n = 6;
    const st = { bid: 0.5, tax: 0.1, reward: 10 };
    const chain = E.Brigade({ n });
    let running = true;
    let clock = 0;
    const coins = [];
    wire(fig, st, () => chain.set({ bid: st.bid, tax: st.tax, reward: st.reward }));
    chain.set({ bid: st.bid, tax: st.tax, reward: st.reward });
    const episode = () => {
      for (let k = n - 1; k >= 1; k--) coins.push({ from: k, to: k - 1, amount: st.bid * chain.S[k], t: 0 });
      coins.push({ from: n, to: n - 1, amount: st.reward, t: 0 });
      chain.episode();
    };
    const runBtn = act(fig, 'run', (b) => {
      running = !running;
      b.setAttribute('aria-pressed', String(running));
    });
    act(fig, 'step', () => {
      running = false;
      runBtn.setAttribute('aria-pressed', 'false');
      episode();
    });
    act(fig, 'reset', () => {
      chain.reset();
      coins.length = 0;
    });
    const cv = $('[data-cv="chain"]', fig);
    const geom = (w, h) => ({ left: 30, right: w - 90, boxTop: h - 56, boxH: 34, barBase: h - 70, barTop: 24 });
    const xOf = (k, g) => g.left + ((k + 0.5) / n) * (g.right - g.left);
    hover(cv, (x, y, r) => {
      const g = geom(r.width, r.height);
      const k = Math.floor(((x - g.left) / (g.right - g.left)) * n);
      if (k < 0 || k >= n) return null;
      return `stage ${k + 1}: strength ${fmt(chain.S[k])}, TD(0) value ${fmt(chain.target()[k])}`;
    });
    const demo = {
      frame(dt) {
        if (running) {
          clock += dt;
          if (clock > 0.35) {
            clock = 0;
            episode();
          }
        }
        for (const c of coins) c.t += dt / 0.33;
        for (let i = coins.length - 1; i >= 0; i--) if (coins[i].t >= 1) coins.splice(i, 1);
      },
      draw() {
        const T = tokens();
        const { ctx, w, h } = fit(cv);
        const g = geom(w, h);
        const target = chain.target();
        const vmax = Math.max(...target, ...chain.S, 1) * 1.15;
        const Y = (v) => g.barBase - (v / vmax) * (g.barBase - g.barTop);
        const slot = (g.right - g.left) / n;
        // stages
        for (let k = 0; k < n; k++) {
          const x = xOf(k, g);
          ctx.fillStyle = T.surface2;
          ctx.strokeStyle = T.axis;
          ctx.beginPath();
          ctx.roundRect(x - slot * 0.4, g.boxTop, slot * 0.8, g.boxH, 6);
          ctx.fill();
          ctx.stroke();
          txt(ctx, k === 0 ? 'reads the world' : k === n - 1 ? 'acts' : `stage ${k + 1}`, x, g.boxTop + g.boxH / 2, { align: 'center', base: 'middle', color: T.ink, size: 11 });
          const bw = Math.min(24, slot * 0.5);
          const hh = g.barBase - Y(chain.S[k]);
          bar(ctx, x - bw / 2, Y(chain.S[k]), bw, hh, T.blue);
          hline(ctx, x - bw / 2 - 5, x + bw / 2 + 5, Y(target[k]), T.orange, 2);
          if (k === n - 1 || k === 0) txt(ctx, fmt(target[k], 1), x + bw / 2 + 8, Y(target[k]) + 4, { color: T.ink2, size: 10 });
        }
        // the world, paying the reward
        const xr = g.right + 40;
        ctx.fillStyle = T.surface2;
        ctx.strokeStyle = T.axis;
        ctx.beginPath();
        ctx.roundRect(xr - 32, g.boxTop, 64, g.boxH, 6);
        ctx.fill();
        ctx.stroke();
        txt(ctx, `reward ${st.reward}`, xr, g.boxTop + g.boxH / 2, { align: 'center', base: 'middle', color: T.ink, size: 11 });
        hline(ctx, g.left, xr + 32, g.barBase + 1, T.axis);
        // payments on their way, backward along arcs
        for (const c of coins) {
          const x0 = c.from === n ? xr : xOf(c.from, g);
          const x1 = xOf(c.to, g);
          const p = c.t;
          const x = x0 + (x1 - x0) * p;
          const y = g.boxTop - 8 - Math.sin(Math.PI * p) * 26;
          dot(ctx, x, y, 5, T.aqua);
          if (p > 0.3 && p < 0.7) txt(ctx, fmt(c.amount, 1), x, y - 9, { align: 'center', color: T.ink2, size: 10 });
        }
        txt(ctx, 'payments flow backward each episode', g.left, 14, { color: T.ink2 });
        const gamma = st.bid / (st.bid + st.tax);
        let ratio = 0;
        let cnt = 0;
        for (let k = 0; k < n - 1; k++) if (chain.S[k + 1] > 1e-9) { ratio += chain.S[k] / chain.S[k + 1]; cnt++; }
        let gap = 0;
        for (let k = 0; k < n; k++) gap = Math.max(gap, Math.abs(chain.S[k] - target[k]) / Math.max(1e-9, target[k]));
        ro(fig, 'episodes', String(chain.episodes));
        ro(fig, 'gamma', fmt(gamma, 3));
        ro(fig, 'ratio', cnt ? fmt(ratio / cnt, 3) : '—');
        ro(fig, 'gap', chain.episodes ? `${(100 * gap).toFixed(1)}%` : '—');
      },
    };
    register(fig, demo);
  }

  // ------------------------------------------------------------ mount every figure
  const kinds = { race: raceDemo, line: lineDemo, water: waterDemo, plain: plainDemo, brigade: brigadeDemo };
  for (const fig of $$('figure[data-demo]')) kinds[fig.dataset.demo](fig);
  window.__explainer = { demos };
})();
