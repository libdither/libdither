// The explainer's models. Small on purpose: each one is the research's equation with nothing else around it,
// so a reader can see the mechanism move. The numbers they give are checked against the research in
// explainer.test.mjs. Plain script (no modules), so the page opens straight from the file; the tests load it
// with `new Function`.
//
//   race     a choice as a race of exponential clocks (the logit ⇄ first spike)
//   Line     a city on a line: rent ⇄ adaptation, the bid-rent line, a height limit, an open city
//   Plain    a plain that wraps around: a centre that forms by itself, towns, the regime map, the black
//            hole, a saturating gain, the onset time (one type, the one-model page's agglomeration setting)
//   Brigade  a chain of stages passing payments backward: the bucket brigade ⇄ TD(0)
//
// Where the one-model page's average flows re-choose the whole load every round, these models let the load
// relax toward the choice over a stay (as the page's agents do), so a parcel holding most of everything
// settles instead of hopping (NEXT_STEPS, Engineering). A site whose load is large next to τ/κ answers a
// price change violently (by κ·r/τ·(1 − p) times, p its share of the choice), so its step is shortened to
// half of 1/(1 + κ·r/τ·(1 − p)): the same fixed point, reached without chatter.
var Explainer = (() => {
  'use strict';

  // a small seeded generator (mulberry32), so a run can be repeated
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let x = Math.imul(s ^ (s >>> 15), 1 | s);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  // P(j) ∝ exp(−c_j/τ)
  function softmax(costs, tau) {
    let mn = Infinity;
    for (const c of costs) if (c < mn) mn = c;
    const p = costs.map((c) => Math.exp(-(c - mn) / tau));
    const z = p.reduce((a, v) => a + v, 0);
    return p.map((v) => v / z);
  }

  // One race: each option's clock rings after an exponential time with rate exp(−c_j/τ); the first to ring
  // wins. The chance that j wins is exactly the softmax above (the first of exponential clocks).
  function race(costs, tau, rnd) {
    let best = -1;
    let tBest = Infinity;
    const times = costs.map((c, j) => {
      const u = Math.max(1e-12, rnd());
      const t = -Math.log(u) / Math.exp(-c / tau);
      if (t < tBest) {
        tBest = t;
        best = j;
      }
      return t;
    });
    return { winner: best, times };
  }

  // ------------------------------------------------------------------ a city on a line
  // Sites x = −R..R, a centre at 0 (a downtown ⇄ an input neuron). An arrival at x pays the commute t·|x|
  // ⇄ the wiring cost, the rent a_x = κ·r_x ⇄ the adaptation, and a shadow price b_x if the site is full
  // (a height limit ⇄ a firing-rate cap). The load r relaxes toward D times the choice over a stay. With an
  // outside option, arrivals may leave instead: an open city ⇄ the input fading before any neuron fires.
  function Line(opts = {}) {
    const o = Object.assign({ radius: 20, demand: 12, commute: 1, kappa: 10, tau: 0.5, stay: 20, cap: Infinity, outside: null, dt: 1 / 3, seed: 1 }, opts);
    const N = 2 * o.radius + 1;
    const x = Float64Array.from({ length: N }, (_, j) => j - o.radius);
    const r = new Float64Array(N);
    const a = new Float64Array(N);
    const b = new Float64Array(N);
    const cost = new Float64Array(N);
    const P = new Float64Array(N);
    let time = 0;
    let leaving = 0;
    const rnd = rng(o.seed);
    for (let j = 0; j < N; j++) r[j] = 0.01 * (o.demand / N) * rnd();
    function costs() {
      for (let j = 0; j < N; j++) {
        a[j] = o.kappa * r[j];
        cost[j] = o.commute * Math.abs(x[j]) + a[j] + b[j];
      }
    }
    function step(dt = o.dt) {
      costs();
      // the choice, with the outside option as one more clock
      const opts = o.outside == null ? cost : [...cost, o.outside];
      const p = softmax(Array.from(opts), o.tau);
      leaving = o.outside == null ? 0 : p[N];
      for (let j = 0; j < N; j++) P[j] = p[j];
      const eta = Math.min(1, dt / o.stay);
      for (let j = 0; j < N; j++) r[j] += Math.min(eta, 0.5 / (1 + ((o.kappa * r[j]) / o.tau) * (1 - P[j]))) * (o.demand * P[j] - r[j]);
      // a full site: its shadow price rises until the load it draws fits under the cap, and falls when it has room
      if (Number.isFinite(o.cap)) for (let j = 0; j < N; j++) b[j] = Math.max(0, b[j] + 0.5 * o.tau * Math.log((r[j] + 1e-9) / o.cap));
      else b.fill(0);
      time += dt;
    }
    function run(units) {
      const n = Math.round(units / o.dt);
      for (let i = 0; i < n; i++) step();
      return self;
    }
    function metrics() {
      let peak = 0;
      let total = 0;
      for (let j = 0; j < N; j++) {
        total += r[j];
        if (r[j] > peak) peak = r[j];
      }
      let used = 0;
      let width = 0;
      for (let j = 0; j < N; j++) if (r[j] > 0.02 * peak) { used++; width = Math.max(width, Math.abs(x[j])); }
      // the bid-rent slope: rent against distance over the occupied sites on one side
      const pts = [];
      for (let j = 0; j < N; j++) if (x[j] >= 0 && r[j] > 0.1 * peak) pts.push([x[j], a[j] + b[j]]);
      let slope = NaN;
      if (pts.length >= 3) {
        const n = pts.length;
        const mx = pts.reduce((s, [u]) => s + u, 0) / n;
        const my = pts.reduce((s, [, v]) => s + v, 0) / n;
        let sxy = 0;
        let sxx = 0;
        for (const [u, v] of pts) {
          sxy += (u - mx) * (v - my);
          sxx += (u - mx) ** 2;
        }
        slope = sxy / sxx;
      }
      const flat = [];
      for (let j = 0; j < N; j++) if (r[j] > 0.1 * peak) flat.push(cost[j]);
      const level = flat.length ? flat.reduce((s, v) => s + v, 0) / flat.length : NaN;
      const spread = flat.length ? Math.max(...flat) - Math.min(...flat) : NaN;
      return { peak, total, used, width, slope, level, spread, leaving, centreRent: a[o.radius] + b[o.radius] };
    }
    const self = { o, N, x, r, a, b, cost, P, step, run, metrics, get time() { return time; }, set(patch) { Object.assign(o, patch); } };
    costs();
    return self;
  }

  // ------------------------------------------------------------------ a plain that wraps around
  // One type on a P × P torus. An arrival at j pays rent κ·r_j and gains s·κ·S((B ∗ h)_j) from the partners
  // within reach ℓ (B(d) = e^{−d/ℓ}/Z, normalized so a flat load gives a flat field; S the gain: the identity,
  // or x₀·log(1 + f/x₀) when it saturates), and pays b·κ·(B_C ∗ h)_j for competitors within reach ℓ_C. The
  // field h is what arrivals believe about where the others are: it follows the load with memory m. The load
  // relaxes toward D times the choice over a stay.
  function Plain(opts = {}) {
    const o = Object.assign({ period: 21, demand: 53.58, kappa: 10, tau: 0.15, s: 2, reach: 2, b: 0, reachC: 3, saturate: 0, memory: 40, stay: 20, dt: 1 / 3, ripple: 0.02, seed: 1 }, opts);
    const P = o.period;
    const N = P * P;
    const xs = new Int16Array(N);
    const ys = new Int16Array(N);
    for (let j = 0; j < N; j++) {
      xs[j] = (j % P) - (P >> 1);
      ys[j] = Math.floor(j / P) - (P >> 1);
    }
    const wrap = (d) => d - P * Math.round(d / P);
    const dist = (i, j) => Math.hypot(wrap(xs[i] - xs[j]), wrap(ys[i] - ys[j]));
    const r = new Float64Array(N);
    const h = new Float64Array(N);
    const cost = new Float64Array(N);
    const field = new Float64Array(N);
    const fieldC = new Float64Array(N);
    const Pj = new Float64Array(N);
    let KB = null;
    let KC = null;
    let built = { reach: null, reachC: null };
    let time = 0;
    let shown = null;
    let rnd = rng(o.seed);
    const rbar = () => o.demand / N;
    const theta = () => 1 + o.tau / (o.kappa * rbar());
    // a kernel over the torus, divided by its own mass (the same from every site here)
    function kernel(ell) {
      const K = new Float32Array(N * N);
      let Z = 0;
      for (let i = 0; i < N; i++) Z += Math.exp(-dist(0, i) / ell);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) K[j * N + i] = Math.exp(-dist(j, i) / ell) / Z;
      return { K, Z };
    }
    function build() {
      if (built.reach !== o.reach) { KB = kernel(o.reach); built.reach = o.reach; }
      if (built.reachC !== o.reachC) { KC = kernel(o.reachC); built.reachC = o.reachC; }
    }
    function reset(seed = o.seed) {
      rnd = rng(seed);
      time = 0;
      shown = null;
      const m = rbar();
      for (let j = 0; j < N; j++) {
        r[j] = m;
        h[j] = o.ripple * m * rnd(); // a little random recent use: symmetry breaking
      }
    }
    const S = (f) => (o.saturate > 0 ? o.saturate * Math.log(1 + f / o.saturate) : f);
    function convolve(K, src, out) {
      for (let j = 0; j < N; j++) {
        let f = 0;
        const row = j * N;
        for (let i = 0; i < N; i++) f += K[row + i] * src[i];
        out[j] = f;
      }
    }
    function step(dt = o.dt) {
      build();
      convolve(KB.K, h, field);
      if (o.b > 0) convolve(KC.K, h, fieldC);
      let mn = Infinity;
      for (let j = 0; j < N; j++) {
        cost[j] = o.kappa * r[j] - o.s * o.kappa * S(field[j]) + (o.b > 0 ? o.b * o.kappa * fieldC[j] : 0);
        if (cost[j] < mn) mn = cost[j];
      }
      let z = 0;
      for (let j = 0; j < N; j++) {
        Pj[j] = Math.exp(-(cost[j] - mn) / o.tau);
        z += Pj[j];
      }
      const eta = Math.min(1, dt / o.stay);
      const eps = Math.min(1, dt / o.memory);
      for (let j = 0; j < N; j++) {
        Pj[j] /= z;
        r[j] += Math.min(eta, 0.5 / (1 + ((o.kappa * r[j]) / o.tau) * (1 - Pj[j]))) * (o.demand * Pj[j] - r[j]);
        h[j] += eps * (r[j] - h[j]);
      }
      time += dt;
      if (shown == null && peakOverMean() > 2) shown = time;
    }
    function run(units) {
      const n = Math.round(units / o.dt);
      for (let i = 0; i < n; i++) step();
      return self;
    }
    function peakOverMean() {
      let peak = 0;
      for (let j = 0; j < N; j++) if (r[j] > peak) peak = r[j];
      return peak / rbar();
    }
    // centres: local maxima of the load smoothed by the kernel, above a quarter of the highest, as the
    // one-model page counts them
    function metrics() {
      build();
      let peak = 0;
      for (let j = 0; j < N; j++) if (r[j] > peak) peak = r[j];
      let used = 0;
      for (let j = 0; j < N; j++) if (r[j] > 0.02 * peak) used++;
      const sm = new Float64Array(N);
      convolve(KB.K, r, sm);
      let mx = 0;
      for (const v of sm) if (v > mx) mx = v;
      let peaks = 0;
      for (let j = 0; j < N; j++) {
        if (sm[j] < 0.25 * mx) continue;
        let top = true;
        for (let i = 0; i < N && top; i++) if (i !== j && dist(i, j) <= 2.5 && sm[i] > sm[j]) top = false;
        if (top) peaks++;
      }
      const mod = peak / rbar();
      return { peak, share: peak / o.demand, modulation: mod, used, peaks, shown, time, label: o.demand > 0 && peak / o.demand > 0.9 ? 'one parcel' : mod < 1.3 ? 'flat' : peaks >= 2 ? `${peaks} towns` : 'one centre' };
    }
    // the kernel's transform along x for reach ell, 1 at k = 0
    function transform(ell) {
      let Z = 0;
      for (let i = 0; i < N; i++) Z += Math.exp(-dist(0, i) / ell);
      return (k) => {
        let t = 0;
        for (let i = 0; i < N; i++) t += Math.exp(-dist(0, i) / ell) * Math.cos(k * wrap(xs[i] - xs[0]));
        return t / Z;
      };
    }
    // The map: for a pull s and competition b, which wave grows. On the torus the uniform wave is fixed by
    // the total, so the longest wave that counts is one bump across the plain (m = 1); m bumps per side make
    // m² towns. With a saturating gain the pull counts as s/(1 + r̄/x₀), the gain's slope at the flat plain.
    // The growth rate comes from one round linearized about the flat plain: the logit answers a cost wave with
    // δr* = −α·δr + α·λ·δh (α = κ·r̄/τ), the load moves η = dt/stay of the way to it, the field ε = dt/m of
    // the way to the load. The round is [[1 − η(1 + α), η·α·λ], [ε, 1 − ε]]; its larger eigenvalue μ gives
    // the rate log(μ) per round, which crosses zero exactly at λ = θ.
    function predictor() {
      const ks = Array.from({ length: Math.floor(P / 2) + 1 }, (_, m) => (2 * Math.PI * m) / P);
      const B = ks.map(transform(o.reach));
      const C = ks.map(transform(o.reachC));
      const thr = theta();
      const m0 = rbar();
      const slope = o.saturate > 0 ? 1 / (1 + m0 / o.saturate) : 1;
      const alpha = (o.kappa * m0) / o.tau;
      const eta = Math.min(1, o.dt / o.stay);
      const eps = Math.min(1, o.dt / o.memory);
      const sub = 1 / o.dt;
      const rate = (lambda) => {
        const a11 = 1 - eta * (1 + alpha);
        const a12 = eta * alpha * lambda;
        const a21 = eps;
        const a22 = 1 - eps;
        const tr = a11 + a22;
        const det = a11 * a22 - a12 * a21;
        const mu = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
        return mu > 0 ? Math.log(mu) * sub : -Infinity;
      };
      const a0 = (2 * Math.sqrt(Math.PI) * (o.ripple / Math.sqrt(12))) / Math.sqrt(N);
      const onset = (g) => (g > 0 ? Math.log(1 / a0) / g : Infinity);
      const parcel = singleParcel();
      const at = (s, b) => {
        const sE = s * slope;
        let best = -Infinity;
        let mStar = 1;
        for (let m = 1; m < ks.length; m++) {
          const v = sE * B[m] - b * C[m];
          if (v > best) {
            best = v;
            mStar = m;
          }
        }
        const g = rate(best);
        const regime = s >= parcel(b) ? 'one parcel' : best > thr ? (mStar === 1 ? 'one centre' : 'towns') : 'flat';
        return { regime, lambda: best, m: mStar, towns: mStar * mStar, rate: g, onset: onset(g), sEff: sE, border: parcel(b) };
      };
      return { at, ks, B, C, thr, slope, rate, onset, border: parcel, sStar: thr / B[1] / slope };
    }
    // the pull past which one parcel holding everything is the cheapest site for a new arrival, with the
    // nearest neighbour (or a far site, with competition) deciding
    function singleParcel() {
      const D = o.demand;
      let Z = 0;
      let ZC = 0;
      const ds = new Set();
      for (let i = 0; i < N; i++) {
        const d = dist(0, i);
        Z += Math.exp(-d / o.reach);
        ZC += Math.exp(-d / o.reachC);
        if (d > 0.5) ds.add(Math.round(d * 1000) / 1000);
      }
      const gain0 = S(D / Z);
      return (b) => {
        let need = 0;
        for (const d of ds) {
          const own = gain0 - S((D * Math.exp(-d / o.reach)) / Z);
          if (!(own > 0)) continue;
          need = Math.max(need, (D * (1 + (b * (1 - Math.exp(-d / o.reachC))) / ZC)) / own);
        }
        return need;
      };
    }
    // a site drawn from the current choice probabilities (an arrival landing)
    function sample() {
      let u = rnd();
      for (let j = 0; j < N; j++) {
        u -= Pj[j];
        if (u <= 0) return j;
      }
      return N - 1;
    }
    const self = {
      o, N, P, xs, ys, r, h, cost, Pj, step, run, reset, metrics, predictor, singleParcel, transform, sample, peakOverMean, theta, rbar,
      get time() { return time; },
      set(patch) { Object.assign(o, patch); },
    };
    reset();
    return self;
  }

  // ------------------------------------------------------------------ a chain passing payments backward
  // n stages in a row: the first reads the world, each later one reads the one before, the last acts and is
  // paid a reward R. When a stage fires it pays the stage it read from a bid, a fraction β of its own strength,
  // and pays a tax, a fraction t of its strength, to nobody. So each episode
  //   S_k ← S_k − (β + t)·S_k + β·S_{k+1}     (the last gets R instead of a bid)
  // and the strengths settle at S_k = γ^{n−1−k}·R/(β + t) with γ = β/(β + t): the discounted value of the
  // reward from stage k, which is what TD(0) learns, with the tax acting as the discount.
  function Brigade(opts = {}) {
    const o = Object.assign({ n: 5, bid: 0.5, tax: 0.1, reward: 10 }, opts);
    const S = new Float64Array(o.n);
    let episodes = 0;
    const flows = new Float64Array(o.n); // what each stage received last episode
    function episode() {
      const n = o.n;
      const paid = Array.from(S, (v) => o.bid * v);
      for (let k = 0; k < n; k++) {
        const income = k === n - 1 ? o.reward : paid[k + 1];
        flows[k] = income;
        S[k] += income - paid[k] - o.tax * S[k];
      }
      episodes++;
    }
    function run(count) {
      for (let i = 0; i < count; i++) episode();
      return self;
    }
    function target() {
      const g = o.bid / (o.bid + o.tax);
      return Array.from({ length: o.n }, (_, k) => (g ** (o.n - 1 - k) * o.reward) / (o.bid + o.tax));
    }
    const self = { o, S, flows, episode, run, target, get episodes() { return episodes; }, set(patch) { Object.assign(o, patch); }, reset() { S.fill(0); flows.fill(0); episodes = 0; } };
    return self;
  }

  return { rng, softmax, race, Line, Plain, Brigade };
})();
