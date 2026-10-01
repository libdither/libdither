import { COVERAGE, DEFAULT_ECON, NO_RULES, UNITS, compare, solveBaseline, solveCity } from './model.js';
import { createScene } from './scene.js';
import { MEASURES, renderFlows, renderProfile } from './charts.js';

const MI = UNITS.M_PER_MILE;
const SQFT = UNITS.SQFT_PER_M2;
const SQMI = MI * MI;
const ANNUALISE = 0.065; // construction cost → yearly cost (interest + depreciation)

const LID_VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, Infinity];
const MIGRATION_VALUES = [0, 0.5, 1, 2, 4, 8, Infinity];
const MIGRATION_LABELS = ['No (play-dough)', 'Barely', 'A little', 'Some', 'Quite easily', 'Very easily', 'Freely (open city)'];
const HEIGHT_COST_VALUES = [0.5, 0.6, 0.72, 0.85, 1, 1.25, 1.5];
const HEIGHT_COST_LABELS = ['Cheap', 'Low', '2%-per-floor rule', 'Moderate', 'Ahlfeldt–McMillen fit', 'High', 'Very high'];
const UGB_NONE = 80;
const ugbMiles = (idx) => 2 + idx * 0.5;

const CITY_PRESETS = {
  mid: { label: 'Mid-size metro', households: 1_200_000, income: 80_000, commutePerKm: 1000 },
  big: { label: 'Big metro', households: 2_500_000, income: 85_000, commutePerKm: 1000 },
  superstar: { label: 'Superstar metro', households: 4_000_000, income: 150_000, commutePerKm: 2000 },
};

const state = {
  econ: { ...DEFAULT_ECON, demandFlex: 0, migration: 0 },
  rules: { ...NO_RULES },
  measure: 'far',
  step: 0,
  profileTable: false,
  flowsTable: false,
};

const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
const root = /** @type {HTMLElement} */ (document.querySelector('.viz-root'));

// ---------------------------------------------------------------------------
// Formatting

const signed = (x, digits = 0) => {
  const v = Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x;
  return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(digits);
};
const pct = (x, digits = 0) => `${signed(x * 100, digits)}%`;
const share = (x) => `${Math.round(x * 100)}%`;
/** Unsigned percent, for phrases whose verb carries the sign ("rents rise 3.2%"). */
const mag = (x, digits = 0) => `${Math.abs(x * 100).toFixed(digits)}%`;
/** "23% more" / "5% less" */
const chg = (x, up, down) => `${share(Math.abs(x))} ${x >= 0 ? up : down}`;
const trimNum = (x) => String(Number(x.toFixed(2)));
const miles = (m, digits = 1) => (m / MI).toFixed(digits);
const sqmi = (m2) => Math.round(m2 / SQMI).toLocaleString('en-US');
const hh = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)} million` : `${Math.round(n / 1e3).toLocaleString('en-US')}k`);
const stories = (s) => (s >= 10 ? s.toFixed(0) : s.toFixed(1));
const money = (x) => `$${Math.round(x).toLocaleString('en-US')}`;

// ---------------------------------------------------------------------------
// Solve. The baseline is cached on everything except migration, which it ignores.

let cache = { key: '', base: null };
function baseline() {
  const { migration, ...rest } = state.econ;
  const key = JSON.stringify(rest);
  if (key !== cache.key) cache = { key, base: solveBaseline(state.econ) };
  return cache.base;
}
function solve() {
  const base = baseline();
  const city = solveCity(state.econ, state.rules, base);
  const cmp = compare(base, city, state.rules, state.econ);
  return { base, city, cmp, econ: state.econ, rules: state.rules };
}

// ---------------------------------------------------------------------------
// Tour

const MILE_KM = MI / 1000;
/** Each step sets its full state (rules and both assumptions) so any step can be opened directly. */
const setup = (s, rules, demandFlex, migration) => {
  s.rules = { ...NO_RULES, ...rules };
  s.econ.demandFlex = demandFlex;
  s.econ.migration = migration;
};
const LID = { heightCap: 1 };
const HOLE = { heightCap: 1, exemptRadiusKm: MILE_KM };
const STEPS = [
  {
    title: 'The natural lump',
    apply: (s) => setup(s, {}, 0, 0),
    body: ({ base, econ }) => [
      `A model city of ${hh(econ.households)} households, all commuting to one downtown. With no rules, builders go taller where commutes are short and land is dear, and the city tapers to single houses at the edge. The result is a smooth mound, ${stories(base.totals.tallest)} stories at its peak and ${miles(base.edge)} miles from downtown to the edge.`,
      `${
        base.totals.shareHouseholds3Plus <= 0.5
          ? `Most of it is low-rise: ${share(1 - base.totals.shareHouseholds3Plus)} of households live in buildings under 3 stories.`
          : `Most households (${share(base.totals.shareHouseholds3Plus)}) live in buildings of 3+ stories.`
      } The brown paper is the land this free-market city needs, and green is farmland.`,
      `We start with the video's two play-dough assumptions: nobody can live in less space, and nobody can leave.`,
    ],
  },
  {
    title: 'Put a lid on it',
    apply: (s) => setup(s, LID, 0, 0),
    body: ({ base, cmp, econ }) => {
      const f = cmp.flows;
      const S = f.squeezed || 1;
      const out = [
        `The lid caps buildings at one story over half the lot, a floor-area ratio of 0.5: about the floor space of a typical single-family lot. ${share(f.squeezed / base.floor)} of the free-market city's floor space was above it.`,
      ];
      if (f.neverBuilt / S < 0.01)
        out.push(
          `Play-dough can't vanish, so all of it reappears. The suburbs bulk up (${share(f.denser / S)}) and the rest spills onto farmland (${share(f.sprawl / S)}). The city covers ${chg(cmp.area, 'more', 'less')} land, and the average commute is ${chg(cmp.commute, 'longer', 'shorter')}.`,
        );
      else
        out.push(
          `${share(1 - f.neverBuilt / S)} of it reappears elsewhere and ${share(f.neverBuilt / S)} is never built. Urban land changes by ${pct(cmp.area)}.`,
        );
      if (base.feasible && base.totals.tallest > 1.5) {
        const three = { ...NO_RULES, heightCap: 3 };
        const k3 = compare(base, solveCity(econ, three, base), three, econ);
        out.push(
          k3.area < 0.03
            ? `Why not a 3-story limit? Here it would barely matter (urban land ${pct(k3.area)}): the free market builds only ${stories(base.totals.tallest)} stories even downtown. The lid that bites is the low one.`
            : `Even a 3-story limit would matter here: urban land ${pct(k3.area)}.`,
        );
      }
      return out;
    },
  },
  {
    title: 'Cut a hole in the lid',
    apply: (s) => setup(s, HOLE, 0, 0),
    body: ({ base, city, cmp }) => {
      const r = cmp.tallestRatio;
      const vs = r > 1.02 ? `taller than the free market's ${stories(base.totals.tallest)}` : `no taller than the free market's ${stories(base.totals.tallest)}`;
      const out = [
        `Now there's no limit within a mile of downtown, as in a typical American city. Downtown rises to ${stories(city.totals.tallest)} stories, ${vs}, because the lid makes space scarce everywhere else.`,
        `The rest of the city still sprawls, onto ${chg(cmp.area, 'more', 'less')} land than the free market. Spike plus pancake.`,
      ];
      if (r < 1.5)
        out.push(
          `The spike is modest here because building tall gets expensive fast. Open “The city” below the controls and pick the Superstar metro, or a flatter cost of height: the same rules push downtown much higher.`,
        );
      return out;
    },
  },
  {
    title: 'Is demand really play-dough?',
    apply: (s) => setup(s, HOLE, 0.5, 0),
    body: ({ cmp }) => {
      const f = cmp.flows;
      const S = f.squeezed || 1;
      return [
        `Play-dough can't be compressed, but households can: when space costs more, they take less of it. At a typical long-run price elasticity of 0.5, rent at any given spot rises ${mag(cmp.rentSamePlace, 1)} and homes there shrink ${mag(cmp.homeSamePlace, 1)}.`,
        `But the households pushed outward take bigger homes on cheaper land, so on net only ${share(f.neverBuilt / Math.max(S, f.gains))} of the squeezed floor space goes unbuilt, and urban land still grows ${share(cmp.area)}. As long as nobody can leave, the play-dough shortcut holds up well.`,
      ];
    },
  },
  {
    title: 'What if people can move away?',
    apply: (s) => setup(s, HOLE, 0.5, Infinity),
    body: ({ cmp }) => [
      `Now people can move to other metros, and they move freely. The lid no longer spreads the city at all (urban land ${pct(cmp.area)}). Instead ${hh(Math.max(0, cmp.householdsLost))} households (${share(-cmp.households)}) leave, and the ones who stay are exactly as well off as with no rules.`,
      `The dough still spills, just outside this model: the people who leave need homes in other metros. Real metros sit somewhere between this and the closed city. Try the “move to other cities” slider.`,
    ],
  },
  {
    title: 'Parking minimums',
    apply: (s) => setup(s, { parkingPer1000sqft: 1 }, 0.5, 2),
    body: ({ cmp }) => [
      `The height limit is gone. Instead, every 1,000 sq ft of housing needs 1 parking space beyond what residents would pay for. Builders pave surface lots where land is cheap and build garages where it's dear. With some people able to leave, urban land grows ${share(cmp.area)} and ${hh(Math.max(0, cmp.householdsLost))} households leave.`,
      `Treat this as an upper bound: in real suburbs, much of that parking would have been built anyway.`,
    ],
  },
  {
    title: 'Keep urban urban: a growth boundary',
    // Exactly at the free-market edge, off the slider's half-mile grid: any slack
    // would let the lid spread the city a little and blur the point of the step.
    apply: (s, base) => setup(s, { ...HOLE, growthBoundaryKm: base?.feasible ? base.edge / 1000 : Infinity }, 0.5, 2),
    body: ({ cmp }) => [
      `The lid is back, with a growth boundary at the free-market edge. The boundary stops the sprawl, but the lid is still squeezing, so the demand goes somewhere else: rents at the same homes rise ${mag(cmp.rentSamePlace, 1)}, homes shrink ${mag(cmp.homeSamePlace, 1)}, and ${hh(Math.max(0, cmp.householdsLost))} households leave.`,
      `Now lift the lid (set Height limit to “No limit”). The free-market city fits inside the boundary on its own. Urban stays urban, which is the video's point.`,
    ],
  },
  {
    title: 'Your turn',
    apply: () => {},
    body: () => [
      `Every slider is live, and the cards under the map score the video's claims against whatever you set.`,
      `Two things to try. Make commuting cheap (“The city”, below the controls), the way cars and highways did, and the free market sprawls with no rules at all. Or pick the Superstar metro and watch a hole in the lid push downtown much higher.`,
    ],
  },
];

function goToStep(i) {
  state.step = Math.max(0, Math.min(STEPS.length - 1, i));
  // Apply twice: the first pass sets the assumptions the baseline depends on,
  // the second can then place rules relative to that baseline.
  STEPS[state.step].apply(state, null);
  STEPS[state.step].apply(state, baseline());
  syncControls();
  schedule();
}

function renderTour(res) {
  const step = STEPS[state.step];
  $('tour-count').textContent = `Step ${state.step + 1} of ${STEPS.length}`;
  $('tour-title').textContent = step.title;
  $('tour-body').replaceChildren(
    ...step.body(res).map((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    }),
  );
  $('tour-back').toggleAttribute('disabled', state.step === 0);
  $('tour-next').textContent = state.step === STEPS.length - 1 ? 'Start over' : 'Next';
  const dots = $('tour-dots');
  if (dots.childElementCount !== STEPS.length) {
    dots.replaceChildren(
      ...STEPS.map((s, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', `Step ${i + 1}: ${s.title}`);
        b.addEventListener('click', () => goToStep(i));
        return b;
      }),
    );
  }
  [...dots.children].forEach((b, i) => (i === state.step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
}

// ---------------------------------------------------------------------------
// Verdict: the video's claims, scored live.

const CLAIM_QS = [
  'Height limits squish the city out past its limits, onto farmland.',
  'All of that demand has to go somewhere.',
  'Allow height only downtown and you get supertalls in the middle and sprawl everywhere else.',
  'Left alone, the city takes a mid-rise, Barcelona-style shape.',
];

function claims(res) {
  const { base, city } = res;
  if (!base.feasible)
    return CLAIM_QS.map((q) => ({ q, status: 'na', text: "Can't judge: even with no rules, this city can't house everyone (see the warning on the map)." }));
  const out = claimsFeasible(res);
  if (!city.feasible)
    for (let k = 0; k < 3; k++)
      out[k] = { q: CLAIM_QS[k], status: 'na', text: "Can't judge: these rules have no equilibrium (see the warning on the map)." };
  return out;
}

function claimsFeasible({ base, city, cmp, rules, econ }) {
  const f = cmp.flows;
  const S = f.squeezed;
  const squeezedAny = S > base.floor * 1e-3;
  const capActive = Number.isFinite(rules.heightCap);
  const others = [];
  if (rules.parkingPer1000sqft > 0) others.push('parking minimums');
  if (Number.isFinite(rules.growthBoundaryKm)) others.push('a growth boundary');
  const alsoNote = others.length ? ` (${others.join(' and ')} also on)` : '';
  const out = [];

  // 1. Height limits push the city onto farmland.
  {
    const q = 'Height limits squish the city out past its limits, onto farmland.';
    let status;
    let text;
    if (!capActive) {
      status = 'na';
      text = "No height limit is set, so this isn't being tested.";
      if (others.length && cmp.area > 0.02)
        text += ` (The other rules still spread the city: urban land grows ${share(cmp.area)}.)`;
    } else if (!squeezedAny) {
      status = 'na';
      text = `The limit is above anything the free market builds here (${stories(base.totals.tallest)} stories), so it changes nothing. Try a lower one.`;
    } else if (cmp.area > 0.02) {
      status = 'yes';
      text = `Yes. Urban land grows ${share(cmp.area)} (${sqmi(cmp.newUrbanLandM2)} more sq mi of former farmland), and the edge moves ${miles(city.edge - base.edge)} mi out${alsoNote}.`;
    } else {
      const why = [];
      if (cmp.householdsLost > 1000) why.push(`${hh(cmp.householdsLost)} households leave for other metros instead`);
      if (Number.isFinite(rules.growthBoundaryKm) && city.edge >= rules.growthBoundaryKm * 1000 - 60)
        why.push(`the growth boundary holds, so rents rise ${mag(cmp.rentSamePlace, 1)} instead`);
      status = cmp.area > 0.002 ? 'partly' : 'no';
      const reason = why.join('; ');
      text = `${status === 'partly' ? 'Barely' : 'No'}: urban land ${pct(cmp.area, 1)}.${reason ? ' ' + reason[0].toUpperCase() + reason.slice(1) + '.' : ''}`;
    }
    out.push({ q, status, text });
  }

  // 2. The squeezed demand has to go somewhere.
  {
    const q = 'All of that demand has to go somewhere.';
    let status;
    let text;
    if (!squeezedAny) {
      status = 'na';
      text = 'Nothing is squeezed with these settings.';
    } else {
      const D = Math.max(S, f.gains);
      const nb = f.neverBuilt / D;
      const where = `${share(f.sprawl / D)} as sprawl, ${share(f.denser / D)} in the suburbs${f.downtown / D >= 0.005 ? `, ${share(f.downtown / D)} downtown` : ''}`;
      const reasons = [];
      if (cmp.householdsLost > 1000) reasons.push(`${hh(cmp.householdsLost)} households leave`);
      if (cmp.homeSamePlace < -0.001) reasons.push(`homes at any given spot shrink ${mag(cmp.homeSamePlace, 1)}, though movers take bigger homes farther out`);
      const why = reasons.length ? reasons.join('; ') : 'people take less space or leave';
      if (f.extra > 0.001 * S) {
        status = 'yes';
        text = `Yes, and then some. All of it is rebuilt elsewhere (${where}), and total floor space even rises slightly (${(cmp.floor * 100).toFixed(2)}%): households pushed out to cheaper land take bigger homes.`;
      } else if (nb < 0.05) {
        status = 'yes';
        text = `Yes. ${share(1 - nb)} of the squeezed floor space is rebuilt elsewhere: ${where}.`;
      } else if (nb < 0.5) {
        status = 'partly';
        text = `Mostly. ${share(1 - nb)} is rebuilt elsewhere (${where}), and on net ${share(nb)} is never built: ${why}.`;
      } else {
        status = 'no';
        const where2 =
          cmp.householdsLost > 1000
            ? " Much of it lands in other metros, not on this city's farmland."
            : ' People absorb it by living in less space.';
        text = `Not as sprawl. ${share(nb)} is never built: ${why}.${where2}`;
      }
    }
    out.push({ q, status, text });
  }

  // 3. A hole in the lid makes supertalls (plus sprawl).
  {
    const q = 'Allow height only downtown and you get supertalls in the middle and sprawl everywhere else.';
    let status;
    let text;
    const r = cmp.tallestRatio;
    if (!(capActive && rules.exemptRadiusKm > 0)) {
      status = 'na';
      text = 'Set a height limit and a hole in the lid to test this.';
    } else if (!squeezedAny) {
      status = 'na';
      text = "The limit doesn't bind here, so the hole makes no difference.";
    } else if (r >= 1.5 && cmp.area > 0.02) {
      status = 'yes';
      const tall = city.totals.tallest;
      text = `Yes. Downtown shoots up to ${stories(tall)} stories against ${stories(base.totals.tallest)} in the free market (${pct(r - 1)}), while urban land grows ${share(cmp.area)}: spike plus pancake.${tall < 80 ? ' Not supertall (that takes roughly 80+ stories), but the shape is there.' : ''}`;
    } else if (r > 1.05) {
      status = 'partly';
      text = `Partly. Downtown gets taller, from ${stories(base.totals.tallest)} to ${stories(city.totals.tallest)} stories (${pct(r - 1)}), but that's a bump, not supertalls: tall buildings cost much more per sq ft. Urban land ${pct(cmp.area)}. Bigger, richer cities, or a flatter cost of height, give much taller downtowns.`;
    } else {
      status = 'no';
      const open = econ.migration === Infinity ? ": when people can leave freely, rent at any given spot doesn't rise, so nothing pushes towers higher" : '';
      text = `No. Downtown is no taller than the free market's ${stories(base.totals.tallest)} stories${open}.`;
    }
    out.push({ q, status, text });
  }

  // 4. Left alone: a compact mid-rise lump. Mid-rise is the usual 4–12 stories, so
  // it's a mid-rise city only if the average household's building has 4+.
  {
    const q = CLAIM_QS[3];
    const t = base.totals.tallest;
    const avg = base.totals.avgStoriesPerHousehold;
    const low = 1 - base.totals.shareHouseholds3Plus;
    const shape = `It tapers smoothly from ${stories(t)} stories downtown to houses ${miles(base.edge)} mi out, with no plateau and no spike.`;
    const mix = `the average household's building has ${stories(avg)} stories, and ${share(low)} of households live in buildings under 3 stories`;
    let status;
    let text;
    if (t > 12) {
      status = 'partly';
      text = `Partly. ${shape} But downtown is high-rise, not mid-rise: ${stories(t)} stories. Across the city, ${mix}.`;
    } else if (avg >= 4) {
      status = 'yes';
      text = `Yes. With no rules it's a mid-rise city: ${mix}. ${shape}`;
    } else if (t >= 4) {
      status = 'partly';
      text = `Partly. ${shape} But only the core is mid-rise: ${mix}.`;
    } else {
      status = 'partly';
      text = `Partly. ${shape} But it's low-rise all the way: demand here isn't strong enough to pay for building 4+ stories anywhere.`;
    }
    out.push({ q, status, text });
  }
  return out;
}

const STATUS = {
  yes: { icon: '✓', label: 'Holds' },
  partly: { icon: '~', label: 'Partly' },
  no: { icon: '✕', label: "Doesn't hold" },
  na: { icon: '–', label: 'Not tested' },
};

function renderClaims(res) {
  $('claims').replaceChildren(
    ...claims(res).map((c) => {
      const d = document.createElement('div');
      d.className = 'claim';
      const q = document.createElement('q');
      q.textContent = c.q;
      const s = document.createElement('div');
      s.className = `status ${c.status}`;
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = STATUS[c.status].icon;
      s.append(icon, document.createTextNode(STATUS[c.status].label));
      const p = document.createElement('p');
      p.textContent = c.text;
      d.append(q, s, p);
      return d;
    }),
  );
}

// ---------------------------------------------------------------------------
// Stat tiles

function renderTiles({ base, city, cmp, econ }) {
  const t = city.totals;
  const b = base.totals;
  const ok = base.feasible && city.feasible;
  const baseRentSqft = b.avgRentPerM2 / SQFT / 12;
  const tiles = [
    ['Urban land', `${sqmi(t.urbanAreaM2)} sq mi`, `${pct(cmp.area)} · edge ${miles(city.edge)} mi (free market ${miles(base.edge)})`],
    [
      'Households',
      hh(t.households),
      cmp.householdsLost > 500 ? `${hh(cmp.householdsLost)} moved to other metros` : econ.migration === 0 ? 'fixed: nobody can leave' : 'unchanged',
    ],
    ['Average commute', `${miles(t.avgCommuteM)} mi`, `${pct(cmp.commute)} vs free market`],
    ['Rent, same homes and places', pct(cmp.rentSamePlace, 1), `free market averages $${baseRentSqft.toFixed(2)}/sq ft/month`],
    ['Home size, same places', pct(cmp.homeSamePlace, 1), `average home now ${Math.round(t.avgHomeM2 * SQFT).toLocaleString('en-US')} sq ft`],
    ['Tallest building', `${stories(t.tallest)} stories`, `free market ${stories(b.tallest)}`],
    [
      "Residents' cost of the rules",
      ok ? `${(-cmp.welfare * 100).toFixed(1)}%` : '—',
      econ.migration === Infinity ? 'of income: those who stay are as well off; others left' : 'of income, as if it fell by this much',
    ],
    ["Landowners' land rent", `$${(t.landRentTotal / 1e9).toFixed(1)}B/yr`, `${pct(cmp.landRent)} vs free market`],
  ];
  if (!ok) for (const tile of tiles) tile[2] = base.feasible ? 'no equilibrium: the most these rules can house' : 'no free-market equilibrium to compare with';
  $('tiles').replaceChildren(
    ...tiles.map(([label, value, delta]) => {
      const d = document.createElement('div');
      d.className = 'tile';
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = label;
      const v = document.createElement('div');
      v.className = 'value';
      v.textContent = value;
      const s = document.createElement('div');
      s.className = 'delta';
      s.textContent = delta;
      d.append(l, v, s);
      return d;
    }),
  );
  $('stats-sub').textContent = base.feasible
    ? `The free market here is the same city with no rules: ${hh(econ.households)} households, ${sqmi(b.urbanAreaM2)} sq mi.`
    : `Even with no rules, this city can house only ${hh(b.households)} of ${hh(econ.households)} households.`;
}

// ---------------------------------------------------------------------------
// Scene overlays

function renderLegend(items, exaggeration) {
  $('scene-legend').replaceChildren(
    ...items.map((it) => {
      const row = document.createElement('div');
      row.className = 'row';
      const sw = document.createElement('span');
      sw.className = `swatch ${it.kind}`;
      if (it.kind === 'ring') sw.style.borderColor = it.color;
      else sw.style.background = it.color;
      row.append(sw, document.createTextNode(it.label));
      return row;
    }),
  );
  $('scene-note').textContent = `Block volume = floor space · heights ×${Math.round(exaggeration)}`;
}

function renderAlert({ base, city, econ, rules }) {
  const a = $('scene-alert');
  if (base.feasible && city.feasible) {
    a.hidden = true;
    return;
  }
  a.hidden = false;
  const s = document.createElement('strong');
  const p = document.createElement('span');
  if (!base.feasible) {
    s.textContent = "This city can't house everyone, even with no rules.";
    p.textContent = `With these incomes, commuting costs and construction costs, a free market can house only ${hh(base.households)} of ${hh(econ.households)} households, even with everyone spending every spare dollar on rent. Under “The city”, lower the number of households, raise incomes, or cut commuting or construction costs.`;
  } else {
    const active = [];
    if (Number.isFinite(rules.heightCap)) active.push('the height limit');
    if (rules.parkingPer1000sqft > 0) active.push('the parking minimum');
    if (Number.isFinite(rules.growthBoundaryKm)) active.push('the growth boundary');
    const homes = econ.demandFlex === 0 ? "homes can't shrink" : 'homes can only shrink so far';
    const leave = econ.migration === 0 ? 'nobody can leave' : 'too few people can leave';
    s.textContent = "The rules can't fit everyone: there's no equilibrium.";
    p.textContent = `Under ${active.join(' and ')}, the city can hold only ${hh(city.households)} households even with everyone spending every spare dollar on rent, because ${homes} and ${leave}.${econ.demandFlex === 0 && econ.migration === 0 ? ' Play-dough in a sealed box has nowhere to go.' : ''} In reality people double up or move away: turn up either “How people respond” slider, or loosen the rules.`;
  }
  a.replaceChildren(s, p);
}

let lastRes = null;
function onHover(hit, x, y) {
  const tip = $('scene-tooltip');
  if (!hit || !lastRes) {
    tip.hidden = true;
    return;
  }
  const { base, city, rules } = lastRes;
  const i = hit.ring;
  const C = city.rings;
  const B = base.rings;
  const inB = hit.distM < base.edge && i < B.x.length;
  tip.replaceChildren();
  const title = document.createElement('div');
  title.className = 'tt-title';
  title.textContent = `${(hit.distM / MI).toFixed(1)} mi from downtown${inB ? '' : ' · farmland in the free market'}`;
  tip.appendChild(title);
  const row = (value, label, free) => {
    const r = document.createElement('div');
    r.className = 'tt-row';
    const b = document.createElement('b');
    b.textContent = value;
    const s = document.createElement('span');
    s.textContent = free != null ? `${label} (free market ${free})` : label;
    r.append(b, s);
    tip.appendChild(r);
  };
  row(stories(C.stories[i]), 'stories', inB ? stories(B.stories[i]) : null);
  row(C.far[i].toFixed(2), 'floor-area ratio', inB ? B.far[i].toFixed(2) : null);
  const dens = (R) => (R.households[i] / (R.area[i] / UNITS.M2_PER_ACRE)).toFixed(1);
  row(dens(C), 'homes per acre', inB ? dens(B) : null);
  const rent = (R) => `$${(R.rentFloor[i] / SQFT / 12).toFixed(2)}`;
  row(rent(C), 'rent per sq ft/month', inB ? rent(B) : null);
  const home = (R) => Math.round(R.home[i] * SQFT).toLocaleString('en-US');
  row(home(C), 'sq ft per home', inB ? home(B) : null);
  if (C.parking[i] > 0.005) row(`${Math.round(C.parking[i] * 100)}%`, 'of the lot is surface parking', null);
  // Compare floor space, not stories: stories bottom out at 1 for houses that don't fill their lot.
  const heightIndex = C.far[i] / (1 - C.parking[i]) / COVERAGE;
  if (C.capped[i] && Number.isFinite(rules.heightCap) && heightIndex >= rules.heightCap * (1 - 1e-6))
    row('At the lid', 'the height limit binds here', null);
  tip.hidden = false;
  const card = $('scene-card').getBoundingClientRect();
  tip.style.left = `${Math.min(x + 14, card.width - 260)}px`;
  tip.style.top = `${Math.min(y + 14, card.height - 170)}px`;
}

// ---------------------------------------------------------------------------
// Controls

function setOut(id, text) {
  $(`${id}-out`).textContent = text;
}

function lidIndex(v) {
  const i = LID_VALUES.indexOf(v);
  if (i >= 0) return i;
  let best = 0;
  LID_VALUES.forEach((x, j) => {
    if (Math.abs(x - v) < Math.abs(LID_VALUES[best] - v)) best = j;
  });
  return best;
}

function nearestIndex(values, v) {
  let best = 0;
  values.forEach((x, j) => {
    if (Math.abs(x - v) < Math.abs(values[best] - v)) best = j;
  });
  return best;
}

function syncControls() {
  const { econ, rules } = state;
  const set = (id, v) => (/** @type {HTMLInputElement} */ ($(id)).value = String(v));
  set('lid', lidIndex(rules.heightCap));
  set('exempt', Math.round(((rules.exemptRadiusKm * 1000) / MI) * 4));
  set('parking', Math.round(rules.parkingPer1000sqft * 4));
  set('ugb', Number.isFinite(rules.growthBoundaryKm) ? Math.round(((rules.growthBoundaryKm * 1000) / MI - 2) * 2) : UGB_NONE);
  set('flex', Math.round(econ.demandFlex * 20));
  set('migration', Math.max(0, MIGRATION_VALUES.indexOf(econ.migration)));
  set('households', Math.round(econ.households / 1e5));
  set('income', Math.round(econ.income / 1000));
  set('commute', Math.round((econ.commutePerKm * MI) / 1000 / 100) * 100);
  set('build', Math.round(econ.buildCostRef / ANNUALISE / SQFT / 5) * 5);
  set('edgecost', Math.round((econ.farmRent * UNITS.M2_PER_ACRE) / 250) * 250);
  set('heightcost', nearestIndex(HEIGHT_COST_VALUES, econ.heightCostScale));
  syncOutputs();
}

function syncOutputs() {
  const { econ, rules } = state;
  const cap = rules.heightCap;
  setOut('lid', Number.isFinite(cap) ? `${cap === 0.5 ? '½' : cap} ${cap <= 1 ? 'story' : 'stories'} · FAR ${trimNum(cap / 2)}` : 'No limit');
  const ex = (rules.exemptRadiusKm * 1000) / MI;
  setOut('exempt', ex > 0 ? `${trimNum(ex)} mi` : 'None');
  $('exempt-control').classList.toggle('disabled', !Number.isFinite(cap));
  setOut('parking', rules.parkingPer1000sqft > 0 ? `${rules.parkingPer1000sqft} per 1,000 sq ft` : 'None');
  setOut('ugb', Number.isFinite(rules.growthBoundaryKm) ? `${((rules.growthBoundaryKm * 1000) / MI).toFixed(1)} mi` : 'None');
  setOut('flex', econ.demandFlex === 0 ? '0 (play-dough)' : econ.demandFlex.toFixed(2));
  setOut('migration', MIGRATION_LABELS[Math.max(0, MIGRATION_VALUES.indexOf(econ.migration))]);
  setOut('households', `${(econ.households / 1e6).toFixed(1)}M (≈${((econ.households * 2.5) / 1e6).toFixed(1)}M people)`);
  setOut('income', money(econ.income));
  setOut('commute', `${money((econ.commutePerKm * MI) / 1000)}/mi/yr`);
  setOut('build', `${money(econ.buildCostRef / ANNUALISE / SQFT)}/sq ft`);
  setOut('edgecost', `${money(econ.farmRent * UNITS.M2_PER_ACRE)}/acre/yr`);
  setOut('heightcost', HEIGHT_COST_LABELS[nearestIndex(HEIGHT_COST_VALUES, econ.heightCostScale)]);
  $('assume-dough').setAttribute('aria-pressed', String(econ.demandFlex === 0 && econ.migration === 0));
  $('assume-real').setAttribute('aria-pressed', String(econ.demandFlex === 0.5 && econ.migration === 2));
  const presetButtons = $('city-presets').children;
  Object.values(CITY_PRESETS).forEach((p, i) => {
    const on = p.households === econ.households && p.income === econ.income && Math.abs(p.commutePerKm - econ.commutePerKm) < 1e-6;
    presetButtons[i]?.setAttribute('aria-pressed', String(on));
  });
}

function bindControls() {
  const num = (id) => Number(/** @type {HTMLInputElement} */ ($(id)).value);
  const on = (id, fn) =>
    $(id).addEventListener('input', () => {
      fn(num(id));
      syncOutputs();
      schedule();
    });
  on('lid', (v) => (state.rules = { ...state.rules, heightCap: LID_VALUES[v] }));
  on('exempt', (v) => (state.rules = { ...state.rules, exemptRadiusKm: ((v / 4) * MI) / 1000 }));
  on('parking', (v) => (state.rules = { ...state.rules, parkingPer1000sqft: v / 4 }));
  on('ugb', (v) => (state.rules = { ...state.rules, growthBoundaryKm: v >= UGB_NONE ? Infinity : (ugbMiles(v) * MI) / 1000 }));
  on('flex', (v) => (state.econ = { ...state.econ, demandFlex: v / 20 }));
  on('migration', (v) => (state.econ = { ...state.econ, migration: MIGRATION_VALUES[v] }));
  on('households', (v) => (state.econ = { ...state.econ, households: v * 1e5 }));
  on('income', (v) => (state.econ = { ...state.econ, income: v * 1000 }));
  on('commute', (v) => (state.econ = { ...state.econ, commutePerKm: (v * 1000) / MI }));
  on('build', (v) => (state.econ = { ...state.econ, buildCostRef: v * SQFT * ANNUALISE }));
  on('edgecost', (v) => (state.econ = { ...state.econ, farmRent: v / UNITS.M2_PER_ACRE }));
  on('heightcost', (v) => (state.econ = { ...state.econ, heightCostScale: HEIGHT_COST_VALUES[v] }));

  $('assume-dough').addEventListener('click', () => {
    state.econ = { ...state.econ, demandFlex: 0, migration: 0 };
    syncControls();
    schedule();
  });
  $('assume-real').addEventListener('click', () => {
    state.econ = { ...state.econ, demandFlex: 0.5, migration: 2 };
    syncControls();
    schedule();
  });

  const presets = $('city-presets');
  for (const p of Object.values(CITY_PRESETS)) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = p.label;
    b.addEventListener('click', () => {
      state.econ = { ...state.econ, households: p.households, income: p.income, commutePerKm: p.commutePerKm };
      syncControls();
      schedule();
    });
    presets.appendChild(b);
  }

  const tabs = $('profile-tabs');
  for (const m of MEASURES) {
    const b = document.createElement('button');
    b.textContent = m.label;
    b.setAttribute('aria-pressed', String(m.key === state.measure));
    b.addEventListener('click', () => {
      state.measure = m.key;
      [...tabs.children].forEach((c, i) => c.setAttribute('aria-pressed', String(MEASURES[i].key === m.key)));
      if (lastRes) renderCharts(lastRes);
    });
    tabs.appendChild(b);
  }
  for (const [btn, keyName] of [
    ['profile-table-btn', 'profileTable'],
    ['flows-table-btn', 'flowsTable'],
  ]) {
    $(btn).addEventListener('click', () => {
      state[keyName] = !state[keyName];
      $(btn).setAttribute('aria-expanded', String(state[keyName]));
      $(btn).textContent = state[keyName] ? 'Hide table' : 'Table';
      if (lastRes) renderCharts(lastRes);
    });
  }

  $('tour-back').addEventListener('click', () => goToStep(state.step - 1));
  $('tour-next').addEventListener('click', () => goToStep(state.step === STEPS.length - 1 ? 0 : state.step + 1));
}

// ---------------------------------------------------------------------------
// Render loop

let scene;
let pending = false;
/** Coalesce bursts of input into one solve. A timer, not rAF, so it also runs in background tabs. */
function schedule() {
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    render();
  }, 0);
}

function renderCharts(res) {
  const M = renderProfile({
    plot: $('profile-plot'),
    legend: $('profile-legend'),
    table: $('profile-table'),
    tableOpen: state.profileTable,
    root,
    base: res.base,
    city: res.city,
    rules: res.rules,
    measureKey: state.measure,
  });
  $('profile-sub').textContent = `${M.label}, in ${M.unit}.`;
  const f = res.cmp.flows;
  $('flows-sub').textContent =
    f.squeezed > res.base.floor * 1e-4
      ? `The rules squeezed out ${share(f.squeezed / res.base.floor)} of the free-market city's floor space. Here's where it went.`
      : 'These rules squeeze nothing out.';
  renderFlows({
    bar: $('flows-bar'),
    legend: $('flows-legend'),
    note: $('flows-note'),
    table: $('flows-table'),
    tableOpen: state.flowsTable,
    root,
    flows: f,
    base: res.base,
    city: res.city,
    homeSamePlace: res.cmp.homeSamePlace,
  });
}

function render() {
  const res = solve();
  lastRes = res;
  const { exaggeration, legend } = scene.update(res);
  renderLegend(legend, exaggeration);
  renderAlert(res);
  renderClaims(res);
  renderTiles(res);
  renderCharts(res);
  renderTour(res);
}

function init() {
  scene = createScene({ canvas: /** @type {HTMLCanvasElement} */ ($('scene')), root, onHover });
  bindControls();
  STEPS[0].apply(state, null);
  syncControls();
  render();
  new ResizeObserver(() => lastRes && renderCharts(lastRes)).observe($('profile-plot'));
  const retheme = () => {
    scene.refreshTheme();
    schedule();
  };
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', retheme);
  // A host page can force a theme with <html data-theme="light|dark">.
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

init();
