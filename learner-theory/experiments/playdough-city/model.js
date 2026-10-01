/**
 * Play-dough City — the equilibrium model.
 *
 * A standard monocentric city (Alonso 1964, Muth 1969, Mills 1967; notation after
 * Brueckner 1987) with the land-use rules analysed by Bertaud & Brueckner (2005):
 * a building-height cap, an optional exempt downtown, parking minimums and an
 * urban growth boundary. Pure functions, no DOM, so it can be tested under Node.
 *
 * Households
 *   Identical households all commute to one job centre at x = 0. Income net of
 *   commuting is Y(x) = income − t·x. Preferences are Stone–Geary,
 *   U = c^(1−α) (q − qMin)^α, which gives one "demand flexibility" dial:
 *     η = 0  →  α = 0: every household needs exactly qMin of floor space no
 *               matter the price. Housing demand is incompressible — play-dough.
 *     η = 1  →  qMin = 0: Cobb–Douglas; floor space demand has price elasticity −1.
 *   (η is the price elasticity — and the income elasticity — at the calibration
 *   point: income, housingShare, refHomeM2.) Everyone ends up equally well off
 *   wherever they live, so the rent per m² of floor space p(x) falls with
 *   distance exactly enough to pay for the extra commute.
 *
 * Developers
 *   On each m² of lot, a developer picks floor-area ratio F to maximise
 *   p·F − cost(F) and pays the rest to the landowner as land rent. The
 *   construction cost per m² of floor rises with height, with elasticity
 *     θ(h) = max(0.25, s·0.164·√h),   h = stories, s = heightCostScale
 *   At s = 1 the √h term matches the per-floor cost increases Ahlfeldt &
 *   McMillen (2018, Table 6) report at 2.5, ≈15 and 110 floors (≈10%, ≈4% and
 *   ≈1.6% per floor). Their elasticities are sample-average slopes and the
 *   supertall one rests on engineering estimates, so s is a user dial; s ≈ 0.72
 *   reproduces the "2% more per floor" rule of thumb over 2–110 floors. The
 *   0.25 floor makes low-density housing Cobb–Douglas in land and capital
 *   (land share 20%). Stories are FAR / COVERAGE on the building's share of the
 *   lot; below one story a house simply covers less of its lot.
 *
 * Land market
 *   Converting farmland to urban use gives up farm rent and pays for streets,
 *   which take (1 − developableShare) of it. Land is urban where
 *   developableShare × lot rent ≥ farmRent, and only inside the growth boundary.
 *   The city edge moves until the population fits.
 *
 * Population
 *   Closed city (migration = 0): the population is fixed. Nobody can leave, so
 *   the city must house everyone. Open city (migration = ∞): people leave until
 *   residents are exactly as well off as with no rules. In between, population
 *   ∝ (real income)^migration.
 *
 * Units: metres, m², US dollars per year.
 */

export const UNITS = Object.freeze({
  M_PER_MILE: 1609.344,
  SQFT_PER_M2: 10.76391041671,
  M2_PER_ACRE: 4046.8564224,
});

/** @typedef {typeof DEFAULT_ECON} Econ */
export const DEFAULT_ECON = Object.freeze({
  households: 2_500_000,
  income: 85_000, // $/yr per household
  commutePerKm: 1000, // $/yr per km of distance from the job centre (round trips; time + money)
  housingShare: 0.3, // share of income spent on housing at the calibration point
  refHomeM2: 150, // floor space chosen at the calibration point (≈1,600 sq ft)
  demandFlex: 0.5, // η, see header. 0 = play-dough
  migration: 0, // % population change per % change in residents' real income. Infinity = open city
  buildCostRef: 130, // $/yr per m² of floor for a 2-story building (≈$2,000/m² annualised at 6.5%)
  heightCostScale: 1, // steepness of the cost of height; 1 = Ahlfeldt–McMillen fit, ≈0.72 = 2%-per-floor rule
  farmRent: 0.6, // $/yr per m² of land converted: farm rent plus the yearly cost of new roads and pipes (≈$2,400/acre/yr)
  developableShare: 0.6, // share of urban land in residential lots (the rest: streets, parks, other uses)
  parkingLandPerSpace: 30, // m² of land per surface parking space, aisles included
  structuredParkingCost: 2000, // $/yr per garage space (≈$30k annualised)
});

/**
 * @typedef {Object} Rules
 * @property {number} heightCap        stories; Infinity = no cap
 * @property {number} exemptRadiusKm   no cap inside this radius (the hole in the lid)
 * @property {number} parkingPer1000sqft  required spaces per 1,000 sq ft of floor space
 * @property {number} growthBoundaryKm no urban use beyond this radius; Infinity = none
 */
export const NO_RULES = Object.freeze({
  heightCap: Infinity,
  exemptRadiusKm: 0,
  parkingPer1000sqft: 0,
  growthBoundaryKm: Infinity,
});

export const COVERAGE = 0.5;
const THETA_LOW = 0.25;
const THETA_SQRT = 0.164;
const REF_STORIES = 2;
const RING_M = 50; // radial resolution of the solver
export const RING_METERS = RING_M;

/**
 * Throws on inputs the model can't give a meaningful answer for. The UI's
 * sliders never produce these; programmatic callers might.
 * @param {Econ} econ
 * @param {Rules} rules
 */
export function validate(econ, rules = NO_RULES) {
  const bad = (msg) => {
    throw new RangeError(`Play-dough City model: ${msg}`);
  };
  const pos = (k) => {
    if (!(econ[k] > 0) || !Number.isFinite(econ[k])) bad(`${k} must be a positive number (got ${econ[k]})`);
  };
  for (const k of ['households', 'income', 'commutePerKm', 'refHomeM2', 'buildCostRef', 'parkingLandPerSpace', 'structuredParkingCost'])
    pos(k);
  if (!(econ.housingShare > 0 && econ.housingShare < 1)) bad(`housingShare must be in (0, 1) (got ${econ.housingShare})`);
  if (!(econ.demandFlex >= 0 && econ.demandFlex <= 1)) bad(`demandFlex must be in [0, 1] (got ${econ.demandFlex})`);
  if (!(econ.migration >= 0)) bad(`migration must be ≥ 0 or Infinity (got ${econ.migration})`);
  if (!(econ.farmRent >= 0) || !Number.isFinite(econ.farmRent)) bad(`farmRent must be ≥ 0 (got ${econ.farmRent})`);
  if (!(econ.developableShare > 0 && econ.developableShare <= 1)) bad(`developableShare must be in (0, 1]`);
  if (!(econ.heightCostScale > 0) || !Number.isFinite(econ.heightCostScale)) bad('heightCostScale must be positive');
  if (!(rules.heightCap > 0)) bad(`heightCap must be > 0 stories, or Infinity for none (got ${rules.heightCap})`);
  if (!(rules.exemptRadiusKm >= 0)) bad('exemptRadiusKm must be ≥ 0');
  if (!(rules.parkingPer1000sqft >= 0) || !Number.isFinite(rules.parkingPer1000sqft)) bad('parkingPer1000sqft must be ≥ 0');
  if (!(rules.growthBoundaryKm > 0)) bad('growthBoundaryKm must be > 0 km, or Infinity for none');
}

// ---------------------------------------------------------------------------
// Construction cost curve, tabulated on a log grid of stories h (one table per
// heightCostScale). acShape(h) = AC(h) / AC(REF_STORIES); MC = AC·(1 + θ).

/**
 * @param {number} h stories
 * @param {number} [scale] heightCostScale
 */
export function costElasticity(h, scale = 1) {
  return Math.max(THETA_LOW, scale * THETA_SQRT * Math.sqrt(h));
}

const GRID_N = 6001;
const LNH_LO = Math.log(1e-5);
const LNH_HI = Math.log(5000);
const LNH_STEP = (LNH_HI - LNH_LO) / (GRID_N - 1);

function buildCost(scale) {
  const lnAC = new Float64Array(GRID_N);
  const lnMC = new Float64Array(GRID_N);
  const theta = new Float64Array(GRID_N);
  for (let i = 0; i < GRID_N; i++) theta[i] = costElasticity(Math.exp(LNH_LO + i * LNH_STEP), scale);
  // d ln AC / d ln h = θ(h); trapezoid in ln h.
  for (let i = 1; i < GRID_N; i++) lnAC[i] = lnAC[i - 1] + 0.5 * (theta[i] + theta[i - 1]) * LNH_STEP;
  const ref = interpGrid(lnAC, Math.log(REF_STORIES));
  for (let i = 0; i < GRID_N; i++) {
    lnAC[i] -= ref;
    lnMC[i] = lnAC[i] + Math.log(1 + theta[i]);
  }
  return { lnAC, lnMC };
}

const costCache = new Map();
function costTable(scale = 1) {
  const key = Math.round(scale * 1e6) / 1e6;
  let t = costCache.get(key);
  if (!t) {
    t = buildCost(key);
    costCache.set(key, t);
    if (costCache.size > 24) costCache.delete(costCache.keys().next().value);
  }
  return t;
}

/** Linear interpolation of a grid array at ln h. */
function interpGrid(arr, lnh) {
  let f = (lnh - LNH_LO) / LNH_STEP;
  if (f <= 0) return arr[0] + f * (arr[1] - arr[0]);
  if (f >= GRID_N - 1) return arr[GRID_N - 1] + (f - (GRID_N - 1)) * (arr[GRID_N - 1] - arr[GRID_N - 2]);
  const i = Math.floor(f);
  f -= i;
  return arr[i] * (1 - f) + arr[i + 1] * f;
}

/** Invert a strictly increasing grid array: the ln h where arr(ln h) = target. */
function invertGrid(arr, target) {
  if (target <= arr[0]) return LNH_LO - (arr[0] - target) / Math.max(arr[1] - arr[0], 1e-12);
  if (target >= arr[GRID_N - 1]) return LNH_HI;
  let lo = 0;
  let hi = GRID_N - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= target) lo = mid;
    else hi = mid;
  }
  return LNH_LO + (lo + (target - arr[lo]) / (arr[hi] - arr[lo])) * LNH_STEP;
}

/** Average construction cost per m² of floor, in units of AC(2 stories). */
export function acShape(h, scale = 1) {
  return Math.exp(interpGrid(costTable(scale).lnAC, Math.log(h)));
}
/** Marginal construction cost per m² of floor, in units of AC(2 stories). */
export function mcShape(h, scale = 1) {
  return Math.exp(interpGrid(costTable(scale).lnMC, Math.log(h)));
}

// ---------------------------------------------------------------------------
// Supply: what a developer builds on 1 m² of lot at floor rent p.

/**
 * @typedef {Object} Build
 * @property {number} far        floor space per m² of lot
 * @property {number} rent       land rent, $/yr per m² of lot
 * @property {number} stories
 * @property {number} footprint  share of the lot under the building
 * @property {number} parking    share of the lot used for surface parking
 * @property {'none'|'structured'|'surface'} mode
 */

const EMPTY = Object.freeze({ far: 0, rent: 0, stories: 0, footprint: 0, parking: 0, mode: 'none' });

/**
 * With a parking minimum of n spaces per m² of floor, the developer either
 * builds garages (cost n·cs per m² of floor) or surface lots (m = n·landPerSpace
 * m² of land per m² of floor). For a fixed building height, profit is linear in
 * how much floor space is served by surface spaces, so the optimum is a corner:
 * all garage or all surface, never a mix. Surface wins exactly when the
 * all-garage land rent is below cs / landPerSpace (a surface space's land would
 * earn less than the garage space costs). Both regimes are solved exactly.
 *
 * @param {Econ} econ
 * @param {Rules} rules
 */
export function makeSupply(econ, rules) {
  const cost = costTable(econ.heightCostScale ?? 1);
  const acRef = econ.buildCostRef;
  const n = rules.parkingPer1000sqft / (1000 / UNITS.SQFT_PER_M2); // spaces per m² of floor
  const perFloorGarage = n * econ.structuredParkingCost;
  const m = n * econ.parkingLandPerSpace;
  const ac = (h) => Math.exp(interpGrid(cost.lnAC, Math.log(h)));

  // Surface regime first-order condition, in units of acRef:
  //   p = MC(z)·(1 + m z) − m z·AC(z),  z = COVERAGE·h (FAR on the non-parking land)
  // which is increasing in z.
  let lnG = null;
  if (m > 0) {
    lnG = new Float64Array(GRID_N);
    for (let i = 0; i < GRID_N; i++) {
      const z = COVERAGE * Math.exp(LNH_LO + i * LNH_STEP);
      lnG[i] = Math.log(Math.exp(cost.lnMC[i]) * (1 + m * z) - m * z * Math.exp(cost.lnAC[i]));
    }
  }

  /** @returns {Build} */
  function garage(p, capStories) {
    const pGarage = p - perFloorGarage;
    if (!(pGarage > 0)) return EMPTY;
    let h = Math.exp(invertGrid(cost.lnMC, Math.log(pGarage / acRef)));
    if (h > capStories) h = capStories;
    const far = COVERAGE * h;
    const rent = far * (pGarage - acRef * ac(h));
    if (!(rent > 0)) return EMPTY;
    return {
      far,
      rent,
      stories: Math.max(1, h),
      footprint: COVERAGE * Math.min(h, 1),
      parking: 0,
      mode: n > 0 ? 'structured' : 'none',
    };
  }

  /** @returns {Build} */
  function surface(p, capStories) {
    if (!lnG || !(p > 0)) return EMPTY;
    let h = Math.exp(invertGrid(lnG, Math.log(p / acRef)));
    if (h > capStories) h = capStories;
    const z = COVERAGE * h;
    const a = 1 / (1 + m * z); // share of the lot left for the building
    const far = z * a;
    const rent = far * (p - acRef * ac(h));
    if (!(rent > 0)) return EMPTY;
    return { far, rent, stories: Math.max(1, h), footprint: a * COVERAGE * Math.min(h, 1), parking: 1 - a, mode: 'surface' };
  }

  /** The better of the two regimes. */
  function supply(p, capStories) {
    const g = garage(p, capStories);
    if (!lnG) return g;
    const s = surface(p, capStories);
    return s.rent > g.rent ? s : g;
  }
  supply.garage = garage;
  supply.surface = surface;
  supply.hasParking = m > 0;
  /** All-garage land rent at which surface parking starts to win. */
  supply.switchRent = m > 0 ? econ.structuredParkingCost / econ.parkingLandPerSpace : Infinity;
  return supply;
}

// ---------------------------------------------------------------------------
// Demand: Stone–Geary households.

/**
 * @param {Econ} econ
 */
export function makeDemand(econ) {
  const s = econ.housingShare;
  const eta = Math.min(1, Math.max(0, econ.demandFlex));
  const alpha = eta * s;
  const qMin = eta >= 1 ? 0 : (econ.refHomeM2 * (1 - eta)) / (1 - alpha);
  const lnA = (alpha > 0 ? alpha * Math.log(alpha) : 0) + (1 - alpha) * Math.log(1 - alpha);
  return { alpha, qMin, lnA };
}

/** ln of indirect utility at floor rent p and net income Y. */
function lnV(d, p, Y) {
  const sup = Y - p * d.qMin;
  if (sup <= 0) return -Infinity;
  return d.lnA + Math.log(sup) - d.alpha * Math.log(p);
}

/** Floor space a household chooses. */
function homeSize(d, p, Y) {
  return d.qMin + (d.alpha * (Y - p * d.qMin)) / p;
}

/**
 * The floor rent at which a household with net income Y gets utility e^lnU.
 * Returns 0 if no positive rent works (the household can't reach lnU there).
 */
function bidRent(d, Y, lnU, guess) {
  if (!(Y > 0)) return 0;
  const { alpha, qMin, lnA } = d;
  if (alpha === 0) {
    const p = (Y - Math.exp(lnU)) / qMin;
    return p > 0 ? p : 0;
  }
  if (qMin === 0) return Math.exp((lnA + Math.log(Y) - lnU) / alpha);
  // Solve f(z) = ln(Y − e^z·qMin) − α z + lnA − lnU = 0 for z = ln p; f is decreasing.
  let zHi = Math.log(Y / qMin);
  let zLo = Math.min(zHi, (Math.log(Y) + lnA - lnU) / alpha) - 1;
  const f = (z) => Math.log(Y - Math.exp(z) * qMin) - alpha * z + lnA - lnU;
  for (let k = 0; k < 200 && f(zLo) <= 0; k++) zLo -= 2 * (k + 1);
  let z = guess > 0 ? Math.log(guess) : 0.5 * (zLo + zHi);
  if (!(z > zLo && z < zHi)) z = 0.5 * (zLo + zHi);
  for (let it = 0; it < 100; it++) {
    const ez = Math.exp(z);
    const rest = Y - ez * qMin;
    const fz = Math.log(rest) - alpha * z + lnA - lnU;
    if (fz > 0) zLo = z;
    else zHi = z;
    if (Math.abs(fz) < 1e-13) break;
    const dz = -fz / (-(ez * qMin) / rest - alpha);
    let zn = z + dz;
    if (!(zn > zLo && zn < zHi)) zn = 0.5 * (zLo + zHi);
    if (Math.abs(zn - z) < 1e-14) {
      z = zn;
      break;
    }
    z = zn;
  }
  return Math.exp(z);
}

// ---------------------------------------------------------------------------
// The city at a given utility level.

/**
 * @typedef {Object} Rings  per-ring results; ring i spans [i·RING_M, outer[i]]
 * @property {Float64Array} x          radius the ring was evaluated at (its midpoint), m
 * @property {Float64Array} outer      outer radius of the urban part of the ring, m
 * @property {Float64Array} area       urban land (lots + streets) in the ring, m²
 * @property {Float64Array} rentFloor  $/yr per m² of floor
 * @property {Float64Array} home       m² of floor per household
 * @property {Float64Array} far        floor space per m² of lot
 * @property {Float64Array} stories
 * @property {Float64Array} footprint
 * @property {Float64Array} parking    share of lots used for surface parking
 * @property {Float64Array} landRent   $/yr per m² of lot
 * @property {Float64Array} households
 * @property {Uint8Array}   capped     1 where the height cap applies
 */

function makeContext(econ, rules) {
  return {
    econ,
    rules,
    demand: makeDemand(econ),
    supply: makeSupply(econ, rules),
    tPerM: econ.commutePerKm / 1000,
    capStories: rules.heightCap,
    // The exempt radius acts on whole rings (by ring midpoint), i.e. it snaps to
    // the 50 m ring grid; the population error from this is below 0.1%.
    exemptM: Math.max(0, rules.exemptRadiusKm) * 1000,
    ugbM: rules.growthBoundaryKm * 1000,
  };
}

function blend(g, s, fg) {
  return {
    far: fg * g.far + (1 - fg) * s.far,
    rent: fg * g.rent + (1 - fg) * s.rent,
    stories: fg * g.stories + (1 - fg) * s.stories,
    footprint: fg * g.footprint + (1 - fg) * s.footprint,
    parking: (1 - fg) * s.parking,
    mode: fg >= 0.5 ? g.mode : s.mode,
  };
}

/**
 * What the annulus between radii r0 < r1 holds at utility lnU, evaluated at its
 * midpoint. If a parking minimum is on and the garage/surface switch falls inside
 * the annulus, the annulus is split at the switch radius (by area), so population
 * stays continuous in utility.
 */
function evalAnnulus(ctx, r0, r1, lnU, guess) {
  const { econ, demand, supply, tPerM, capStories, exemptM } = ctx;
  const x = 0.5 * (r0 + r1);
  const Y = econ.income - tPerM * x;
  if (!(Y > 0)) return null;
  const p = bidRent(demand, Y, lnU, guess);
  if (!(p > 0)) return null;
  const capped = Number.isFinite(capStories) && x >= exemptM;
  const cap = capped ? capStories : Infinity;
  let b = supply(p, cap);
  if (supply.hasParking) {
    const K = supply.switchRent;
    const garageRentAt = (r) => {
      const Yr = econ.income - tPerM * r;
      if (!(Yr > 0)) return 0;
      const pr = bidRent(demand, Yr, lnU, p);
      return pr > 0 ? supply.garage(pr, cap).rent : 0;
    };
    const g0 = garageRentAt(r0);
    const g1 = garageRentAt(r1);
    if (g0 >= K !== g1 >= K && g0 !== g1) {
      const rs = r0 + ((r1 - r0) * (g0 - K)) / (g0 - g1);
      const fg = (rs * rs - r0 * r0) / (r1 * r1 - r0 * r0); // area share on the garage side
      b = blend(supply.garage(p, cap), supply.surface(p, cap), Math.min(1, Math.max(0, fg)));
    }
  }
  if (!(b.far > 0)) return null;
  return { x, Y, p, q: homeSize(demand, p, Y), b, capped, rent: b.rent };
}

/**
 * The urban area, households and floor space at utility lnU, plus the ring table.
 * Every ring's area stays inside its own radial span, and the partial ring at the
 * edge is evaluated at the midpoint of its urban part, so the totals are
 * continuous in lnU (the solvers rely on this).
 */
function cityAt(ctx, lnU) {
  const { econ, ugbM } = ctx;
  const psi = econ.developableShare;
  const rA = econ.farmRent;
  /** @type {Array<{i:number,inner:number,outer:number,area:number,ev:any}>} */
  const rows = [];
  let prevP = 0;
  let last = null; // evaluation of the last ring whose midpoint is urban
  let next = null; // evaluation of the first ring whose midpoint is not
  let stoppedByNothing = false;

  for (let i = 0; ; i++) {
    const inner = i * RING_M;
    const outer = inner + RING_M;
    const ev = inner < ugbM ? evalAnnulus(ctx, inner, outer, lnU, prevP) : null;
    if (!ev || psi * ev.rent < rA) {
      next = ev;
      stoppedByNothing = !ev && inner < ugbM; // no one can pay rent here at all
      break;
    }
    rows.push({ i, inner, outer, area: Math.PI * (outer * outer - inner * inner), ev });
    last = ev;
    prevP = ev.p;
    if (inner > 400_000) break; // safety: 400 km
  }

  let edge = 0;
  if (last) {
    const lastRow = rows[rows.length - 1];
    if (next) {
      const a = psi * last.rent - rA;
      const b = psi * next.rent - rA;
      const w = a > b ? a / (a - b) : 1;
      edge = last.x + Math.min(1, Math.max(0, w)) * RING_M;
    } else edge = stoppedByNothing ? lastRow.outer : last.x + RING_M;
    edge = Math.min(edge, ugbM);

    // Re-evaluate the partial ring at the midpoint of its urban part.
    if (edge < lastRow.outer) {
      rows.pop();
      if (edge > lastRow.inner) {
        const ev = evalAnnulus(ctx, lastRow.inner, edge, lnU, last.p);
        if (ev)
          rows.push({ i: lastRow.i, inner: lastRow.inner, outer: edge, area: Math.PI * (edge * edge - lastRow.inner ** 2), ev });
      }
    } else if (edge > lastRow.outer) {
      const ev = evalAnnulus(ctx, lastRow.outer, edge, lnU, last.p);
      if (ev)
        rows.push({ i: lastRow.i + 1, inner: lastRow.outer, outer: edge, area: Math.PI * (edge * edge - lastRow.outer ** 2), ev });
    }
  }

  let households = 0;
  let floor = 0;
  for (const r of rows) {
    const fl = r.area * psi * r.ev.b.far;
    r.floor = fl;
    r.households = fl / r.ev.q;
    floor += fl;
    households += r.households;
  }
  return { households, floor, edge, rows };
}

// ---------------------------------------------------------------------------
// Solvers

/**
 * Root of a monotone f on [lo, hi]. Returns NaN unless f(lo) and f(hi) have
 * opposite signs. Bisection until the bracket is tight enough for f to be
 * smooth (the empty-city cutoff makes f jump near one end), then Illinois
 * false position, which never leaves the bracket.
 */
function findRoot(f, lo, hi, tol = 1e-11) {
  let flo = f(lo);
  let fhi = f(hi);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (!(flo < 0 !== fhi < 0) || Number.isNaN(flo) || Number.isNaN(fhi)) return NaN;
  for (let k = 0; k < 14; k++) {
    const mid = 0.5 * (lo + hi);
    const fm = f(mid);
    if (fm === 0) return mid;
    if (fm > 0 === flo > 0) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
      fhi = fm;
    }
  }
  let side = 0;
  for (let k = 0; k < 100; k++) {
    const x = (lo * fhi - hi * flo) / (fhi - flo);
    const fx = f(x);
    if (Math.abs(fx) < tol || hi - lo < 1e-14) return x;
    if (fx > 0 === fhi > 0) {
      hi = x;
      fhi = fx;
      if (side === -1) flo /= 2;
      side = -1;
    } else {
      lo = x;
      flo = fx;
      if (side === 1) fhi /= 2;
      side = 1;
    }
  }
  return (lo * fhi - hi * flo) / (fhi - flo);
}

/**
 * @typedef {Object} City
 * @property {number} lnU
 * @property {number} households
 * @property {number} edge         m
 * @property {number} floor        m² of floor space
 * @property {number} realIncome   residents' money-metric income ÷ income (1 = as well off as the free-market city)
 * @property {boolean} feasible    false if no equilibrium exists (the city shown is the most it can house)
 * @property {Rings} rings
 * @property {Object} totals
 */

/**
 * The free-market city: no rules, closed, with econ.households households. If
 * the city can't house that many at any rent (incomes too low for the commuting
 * and building costs), returns the most it can house with feasible = false.
 * @param {Econ} econ
 * @returns {City & {centreRent: number}}
 */
export function solveBaseline(econ) {
  validate(econ, NO_RULES);
  const ctx = makeContext(econ, NO_RULES);
  const d = ctx.demand;
  const N0 = econ.households;
  // Parametrise by the rent at the centre; population rises with it. The top of
  // the range is the most a household with no commute could pay.
  const pMax = d.qMin > 0 ? (econ.income / d.qMin) * (1 - 1e-9) : 1e9;
  const lnUof = (lnp) => lnV(d, Math.exp(lnp), econ.income);
  const g = (lnp) => {
    const c = cityAt(ctx, lnUof(lnp));
    return (c.households > 0 ? Math.log(c.households) : -700) - Math.log(N0);
  };
  const lnLo = Math.log(1e-3);
  const lnHi = Math.log(pMax);
  if (g(lnHi) < 0) {
    return { ...finish(ctx, lnUof(lnHi), 1, false), centreRent: pMax };
  }
  const lnp = findRoot(g, lnLo, lnHi);
  if (Number.isNaN(lnp)) return { ...finish(ctx, lnUof(lnHi), 1, false), centreRent: pMax };
  return { ...finish(ctx, lnUof(lnp), 1, true), centreRent: Math.exp(lnp) };
}

/**
 * The city under `rules`, compared with `baseline` (same econ).
 * @param {Econ} econ
 * @param {Rules} rules
 * @param {ReturnType<typeof solveBaseline>} baseline
 * @returns {City}
 */
export function solveCity(econ, rules, baseline) {
  validate(econ, rules);
  const ctx = makeContext(econ, rules);
  const d = ctx.demand;
  const N0 = econ.households;
  const p0 = baseline.centreRent;
  const eps = econ.migration;
  // Parametrise by residents' real income R (money-metric at the free-market
  // centre rent): R = 1 is the free-market utility.
  const lnUofR = (lnR) => lnV(d, p0, Math.exp(lnR) * econ.income);
  if (!baseline.feasible) {
    // No free-market equilibrium to compare against; show the most the rules can house.
    return finish(ctx, lnUofR(Math.log((p0 * d.qMin) / econ.income + 1e-9) + 1e-12), NaN, false);
  }
  if (!Number.isFinite(eps)) return finish(ctx, lnUofR(0), 1, true);

  const lnRlo = Math.log((p0 * d.qMin) / econ.income + 1e-9) + 1e-12;
  const lnRhi = Math.log(4);
  const g = (lnR) => {
    const c = cityAt(ctx, lnUofR(lnR));
    const lhs = c.households > 0 ? Math.log(c.households) : -700;
    return lhs - Math.log(N0) - eps * lnR;
  };
  if (g(lnRlo) < 0) {
    // Even at subsistence the rules can't fit the people who stay (only possible
    // when few can leave and floor space demand has a hard floor).
    return finish(ctx, lnUofR(lnRlo), Math.exp(lnRlo), false);
  }
  const lnR = findRoot(g, lnRlo, lnRhi);
  if (Number.isNaN(lnR)) return finish(ctx, lnUofR(lnRhi), 4, false);
  return finish(ctx, lnUofR(lnR), Math.exp(lnR), true);
}

/** Build the ring table and totals for a solved utility level. */
function finish(ctx, lnU, realIncome, feasible) {
  const { econ, demand } = ctx;
  const c = cityAt(ctx, lnU);
  const n = c.rows.length;
  const rings = {
    x: new Float64Array(n),
    outer: new Float64Array(n),
    area: new Float64Array(n),
    rentFloor: new Float64Array(n),
    home: new Float64Array(n),
    far: new Float64Array(n),
    stories: new Float64Array(n),
    footprint: new Float64Array(n),
    parking: new Float64Array(n),
    landRent: new Float64Array(n),
    households: new Float64Array(n),
    capped: new Uint8Array(n),
  };
  const psi = econ.developableShare;
  let hh = 0;
  let floor = 0;
  let commute = 0;
  let spend = 0;
  let landRentTotal = 0;
  let parkingLand = 0;
  let storiesHH = 0;
  let hh3 = 0;
  let tallest = 0;
  for (let i = 0; i < n; i++) {
    const r = c.rows[i];
    const ev = r.ev;
    rings.x[i] = ev.x;
    rings.outer[i] = r.outer;
    rings.area[i] = r.area;
    rings.rentFloor[i] = ev.p;
    rings.home[i] = ev.q;
    rings.far[i] = ev.b.far;
    rings.stories[i] = ev.b.stories;
    rings.footprint[i] = ev.b.footprint;
    rings.parking[i] = ev.b.parking;
    rings.landRent[i] = ev.b.rent;
    rings.capped[i] = ev.capped ? 1 : 0;
    rings.households[i] = r.households;
    hh += r.households;
    floor += r.floor;
    commute += r.households * ev.x;
    spend += r.households * ev.p * ev.q;
    // Differential land rent: what urban use earns over farming on the same land.
    landRentTotal += r.area * (psi * ev.b.rent - econ.farmRent);
    parkingLand += r.area * psi * ev.b.parking;
    storiesHH += r.households * ev.b.stories;
    if (ev.b.stories >= 3) hh3 += r.households;
    if (ev.b.stories > tallest) tallest = ev.b.stories;
  }
  return {
    lnU,
    households: hh,
    edge: c.edge,
    floor,
    realIncome,
    feasible,
    rings,
    totals: {
      households: hh,
      edgeM: c.edge,
      urbanAreaM2: Math.PI * c.edge * c.edge,
      floorM2: floor,
      avgHomeM2: hh > 0 ? floor / hh : 0,
      avgCommuteM: hh > 0 ? commute / hh : 0,
      avgRentPerM2: floor > 0 ? spend / floor : 0,
      avgHousingSpend: hh > 0 ? spend / hh : 0,
      tallest,
      avgStoriesPerHousehold: hh > 0 ? storiesHH / hh : 0,
      shareHouseholds3Plus: hh > 0 ? hh3 / hh : 0,
      landRentTotal,
      parkingLandM2: parkingLand,
      realIncome,
      demand,
    },
  };
}

// ---------------------------------------------------------------------------
// Where did the squeezed dough go?

/**
 * Compares floor space ring by ring. "Squeezed" is floor space the free market
 * would have built that the rules removed. It either reappears somewhere else —
 * taller exempt downtown, denser elsewhere inside the free-market footprint, or
 * on farmland beyond it (sprawl) — or is never built at all, because households
 * make do with less space or leave. The ring straddling the old edge is split
 * by area. The identity is
 *   downtown + denser + sprawl = squeezed + (city floor − free-market floor)
 * so "neverBuilt" is the net loss of floor space. That can be negative — with
 * flexible home sizes, households pushed out to cheaper land may take bigger
 * homes — and then it is reported as "extra" instead.
 *
 * @param {City} base
 * @param {City} city
 * @param {Rules} rules
 * @param {Econ} econ
 */
export function whereDidItGo(base, city, rules, econ) {
  const psi = econ.developableShare;
  const B = base.rings;
  const C = city.rings;
  const n = Math.max(B.x.length, C.x.length);
  const capActive = Number.isFinite(rules.heightCap);
  const exemptM = capActive ? Math.max(0, rules.exemptRadiusKm) * 1000 : 0;
  const oldEdge = base.edge;
  let squeezed = 0;
  let downtown = 0;
  let denser = 0;
  let sprawl = 0;
  for (let i = 0; i < n; i++) {
    const inner = i * RING_M;
    const vb = i < B.x.length ? B.area[i] * psi * B.far[i] : 0;
    let vcIn = 0;
    let vcOut = 0;
    if (i < C.x.length && C.area[i] > 0) {
      const vc = C.area[i] * psi * C.far[i];
      const out = Math.max(0, Math.PI * (C.outer[i] ** 2 - Math.max(inner, oldEdge) ** 2));
      const outShare = Math.min(1, out / C.area[i]);
      vcOut = vc * outShare;
      vcIn = vc - vcOut;
    }
    sprawl += vcOut;
    const d = vcIn - vb;
    if (d < 0) squeezed -= d;
    else if (inner + 0.5 * RING_M < exemptM) downtown += d;
    else denser += d;
  }
  const gains = downtown + denser + sprawl;
  return {
    squeezed,
    downtown,
    denser,
    sprawl,
    gains,
    neverBuilt: Math.max(0, squeezed - gains),
    extra: Math.max(0, gains - squeezed),
  };
}

/**
 * Headline comparisons against the free-market baseline. Rent and home size are
 * compared at the same places, weighted by where free-market households live, so
 * they aren't skewed by people moving out to cheaper areas.
 *
 * @param {City} base
 * @param {City} city
 * @param {Rules} rules
 * @param {Econ} econ
 */
export function compare(base, city, rules, econ) {
  const B = base.rings;
  const C = city.rings;
  const m = Math.min(B.x.length, C.x.length);
  let rent0 = 0;
  let rent1 = 0;
  let home0 = 0;
  let home1 = 0;
  for (let i = 0; i < m; i++) {
    const h = B.households[i];
    rent0 += h * B.home[i] * B.rentFloor[i];
    rent1 += h * B.home[i] * C.rentFloor[i];
    home0 += h * B.home[i];
    home1 += h * C.home[i];
  }
  const ratio = (a, b) => (b > 0 ? a / b - 1 : 0);
  return {
    rentSamePlace: ratio(rent1, rent0),
    homeSamePlace: ratio(home1, home0),
    households: ratio(city.households, base.households),
    householdsLost: base.households - city.households,
    area: ratio(city.edge * city.edge, base.edge * base.edge),
    newUrbanLandM2: Math.PI * (city.edge * city.edge - base.edge * base.edge),
    commute: ratio(city.totals.avgCommuteM, base.totals.avgCommuteM),
    floor: ratio(city.floor, base.floor),
    tallestRatio: base.totals.tallest > 0 ? city.totals.tallest / base.totals.tallest : 1,
    welfare: city.realIncome - 1,
    landRent: ratio(city.totals.landRentTotal, base.totals.landRentTotal),
    flows: whereDidItGo(base, city, rules, econ),
  };
}

/** Exposed for tests only. */
export const _internals = { lnV, homeSize, bidRent, makeContext, cityAt };
