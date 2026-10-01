// The 3D view: the city as play-dough. Block volume is floor space, so the
// dough's volume is literal; heights are exaggerated so the mound is visible.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COVERAGE, RING_METERS } from './model.js';

const STORY_KM = 0.0033;
const STREET = 0.84; // block side as a share of the cell side
const MAX_CELLS = 60000;

function cssColor(el, name) {
  return new THREE.Color(getComputedStyle(el).getPropertyValue(name).trim() || '#ff00ff');
}

function circle(radius, color, dashed = false) {
  const pts = [];
  const n = 256;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: radius * 0.03, gapSize: radius * 0.02 })
    : new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}

/**
 * @param {{canvas: HTMLCanvasElement, root: HTMLElement, onHover: (hit: null | {ring: number, distM: number}, x: number, y: number) => void}} opts
 */
export function createScene({ canvas, root, onHover }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.2, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 1;
  controls.maxDistance = 600;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a60, 1.25);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-60, 90, 40);
  scene.add(hemi, sun);

  const colors = {};
  function readColors() {
    for (const [k, v] of Object.entries({
      sky: '--scene-sky',
      farm: '--scene-farm',
      paper: '--scene-paper',
      paved: '--scene-paved',
      dough: '--scene-dough',
      ghost: '--scene-ghost',
      lid: '--scene-lid',
      edge: '--scene-edge',
      ugb: '--scene-ugb',
      parking: '--scene-parking',
      sprawl: '--series-1',
      suburbs: '--series-2',
      downtown: '--series-3',
      text: '--text-secondary',
    })) {
      colors[k] = cssColor(root, v);
    }
  }
  readColors();

  const farm = new THREE.Mesh(new THREE.CircleGeometry(900, 128), new THREE.MeshLambertMaterial());
  farm.rotation.x = -Math.PI / 2;
  scene.add(farm);

  const groundGroup = new THREE.Group(); // paper, paved ring, outlines: rebuilt per update
  scene.add(groundGroup);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const blocks = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), MAX_CELLS);
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blocks.frustumCulled = false;
  scene.add(blocks);

  const tileGeo = new THREE.BoxGeometry(1, 1, 1);
  tileGeo.translate(0, 0.5, 0);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshLambertMaterial(), MAX_CELLS);
  tiles.frustumCulled = false;
  scene.add(tiles);

  // The free-market city as a ghost: a faint surface plus radial "cage" lines,
  // so it reads as an outline without competing with the category colours.
  const ghostMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ghostLineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85 });
  const ghost = new THREE.Group();
  scene.add(ghost);

  const lidMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lidGroup = new THREE.Group();
  scene.add(lidGroup);

  let cells = []; // per instance: { ring, distM }
  let last = null;
  let fitFor = 0;
  let needsRender = true;

  function applyThemeColors() {
    scene.background = colors.sky.clone();
    scene.fog = new THREE.Fog(colors.sky.clone(), 60, 400);
    farm.material.color.copy(colors.farm);
    tiles.material.color.copy(colors.parking);
    ghostMat.color.copy(colors.ghost);
    ghostLineMat.color.copy(colors.ghost);
    lidMat.color.copy(colors.lid);
  }
  applyThemeColors();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsRender = true;
  }
  new ResizeObserver(resize).observe(canvas);

  function fit(radiusKm) {
    // Low, oblique view so heights read: about 17° above the horizon.
    const r = radiusKm * 1.15;
    camera.position.set(r * 0.2, r * 0.62, r * 2.0);
    controls.target.set(0, 0, 0);
    controls.update();
    scene.fog.near = r * 3;
    scene.fog.far = r * 9;
    fitFor = radiusKm;
  }

  /**
   * @param {{base: any, city: any, rules: any}} data
   * @returns {{exaggeration: number, legend: Array<{kind: string, label: string, color: string}>}}
   */
  function update(data) {
    last = data;
    const { base, city, rules } = data;
    const baseEdgeKm = base.edge / 1000;
    const cityEdgeKm = city.edge / 1000;
    if (!fitFor || Math.abs(baseEdgeKm / fitFor - 1) > 0.2) fit(baseEdgeKm);

    // Vertical scale: the free-market peak stands a quarter as tall as the city's radius.
    const peakFar = Math.max(base.rings.far[0] || 0.3, 0.3);
    // Layer heights, proportional to city size so depth precision holds at any scale.
    const E = baseEdgeKm;
    const paperY = 0.0008 * E;
    const tileY = 0.001 * E;
    const blockY = 0.0012 * E;
    const lineY = 0.0016 * E;
    const vscale = (0.25 * baseEdgeKm) / peakFar; // km per unit of FAR
    const exaggeration = vscale / (STORY_KM / COVERAGE);

    // Ground
    for (const child of [...groundGroup.children]) {
      groundGroup.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }
    const paper = new THREE.Mesh(
      new THREE.CircleGeometry(baseEdgeKm, 160),
      new THREE.MeshLambertMaterial({ color: colors.paper }),
    );
    paper.rotation.x = -Math.PI / 2;
    paper.position.y = paperY;
    groundGroup.add(paper);
    if (cityEdgeKm > baseEdgeKm * 1.001) {
      const paved = new THREE.Mesh(
        new THREE.RingGeometry(baseEdgeKm, cityEdgeKm, 160),
        new THREE.MeshLambertMaterial({ color: colors.paved }),
      );
      paved.rotation.x = -Math.PI / 2;
      paved.position.y = paperY;
      groundGroup.add(paved);
    }
    const lift = lineY;
    const baseRing = circle(baseEdgeKm, colors.edge);
    baseRing.position.y = lift;
    groundGroup.add(baseRing);
    if (Math.abs(cityEdgeKm / baseEdgeKm - 1) > 0.002) {
      const cityRing = circle(cityEdgeKm, colors.text);
      cityRing.position.y = lift;
      groundGroup.add(cityRing);
    }
    const ugbKm = rules.growthBoundaryKm;
    if (Number.isFinite(ugbKm)) {
      const u = circle(ugbKm, colors.ugb, true);
      u.position.y = lift * 1.5;
      groundGroup.add(u);
    }

    // Blocks
    const cell = baseEdgeKm / 36;
    const reach = Math.max(cityEdgeKm, 0.001);
    const n = Math.ceil(reach / cell);
    const capActive = Number.isFinite(rules.heightCap);
    const exemptKm = capActive ? rules.exemptRadiusKm : 0;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const col = new THREE.Color();
    const R = city.rings;
    const B = base.rings;
    let k = 0;
    let kt = 0;
    const seen = { sprawl: false, suburbs: false, downtown: false, parking: false };
    cells = [];
    for (let ix = -n; ix <= n && k < MAX_CELLS; ix++) {
      for (let iz = -n; iz <= n && k < MAX_CELLS; iz++) {
        const cx = (ix + 0.5) * cell;
        const cz = (iz + 0.5) * cell;
        const dKm = Math.hypot(cx, cz);
        const dM = dKm * 1000;
        if (dM >= city.edge) continue;
        const i = Math.floor(dM / RING_METERS);
        if (i >= R.far.length) continue;
        const far = R.far[i];
        const pk = R.parking[i];
        const inBase = dM < base.edge && i < B.far.length;
        const baseFar = inBase ? B.far[i] : 0;
        const side = cell * STREET * Math.sqrt(1 - pk);
        const h = Math.max((far / (1 - pk)) * vscale, 0.0005);
        pos.set(cx, blockY, cz);
        scl.set(side, h, side);
        m.compose(pos, q, scl);
        blocks.setMatrixAt(k, m);

        col.copy(colors.dough);
        if (!inBase) {
          col.copy(colors.sprawl);
          seen.sprawl = true;
        } else {
          const rel = baseFar > 0 ? far / baseFar - 1 : 1;
          if (rel > 0.02) {
            const target = dKm < exemptKm ? colors.downtown : colors.suburbs;
            if (dKm < exemptKm) seen.downtown = true;
            else seen.suburbs = true;
            col.lerp(target, 0.35 + 0.65 * Math.min(1, (rel - 0.02) / 0.3));
          }
        }
        blocks.setColorAt(k, col);
        cells.push({ ring: i, distM: dM });
        k++;

        if (pk > 0.01) {
          seen.parking = true;
          pos.set(cx, tileY, cz);
          scl.set(cell * STREET, 0.0004 * E, cell * STREET);
          m.compose(pos, q, scl);
          tiles.setMatrixAt(kt++, m);
        }
      }
    }
    blocks.count = k;
    blocks.instanceMatrix.needsUpdate = true;
    if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
    blocks.computeBoundingSphere();
    tiles.count = kt;
    tiles.instanceMatrix.needsUpdate = true;

    // Ghost: the free-market mound as a surface of revolution plus profile lines.
    for (const child of [...ghost.children]) {
      ghost.remove(child);
      child.geometry.dispose();
    }
    const pts = [new THREE.Vector2(0, (B.far[0] || 0) * vscale)];
    const step = Math.max(1, Math.floor(B.far.length / 240));
    for (let i = 0; i < B.far.length; i += step) pts.push(new THREE.Vector2(B.x[i] / 1000, B.far[i] * vscale));
    pts.push(new THREE.Vector2(baseEdgeKm, B.far[B.far.length - 1] * vscale));
    pts.push(new THREE.Vector2(baseEdgeKm, 0));
    const surface = new THREE.Mesh(new THREE.LatheGeometry(pts, 128), ghostMat);
    surface.renderOrder = 2;
    ghost.add(surface);
    const SPOKES = 32;
    for (let k = 0; k < SPOKES; k++) {
      const a = (k / SPOKES) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x * c, p.y, p.x * sn))),
        ghostLineMat,
      );
      line.renderOrder = 2;
      ghost.add(line);
    }
    ghost.position.y = blockY;

    // Lid: a translucent disc at the cap, with a hole for the exempt downtown.
    for (const child of [...lidGroup.children]) {
      lidGroup.remove(child);
      child.geometry.dispose();
      if (child.material !== lidMat) child.material.dispose();
    }
    // A lid far above everything the free market builds doesn't bind; drawing it
    // would only put a haze over the camera.
    const lidDrawn = capActive && rules.heightCap * COVERAGE <= 1.6 * peakFar;
    if (lidDrawn) {
      const y = blockY + rules.heightCap * COVERAGE * vscale;
      const outer = Math.max(cityEdgeKm, baseEdgeKm) * 1.06;
      const inner = Math.min(exemptKm, outer * 0.99);
      const disc = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 160), lidMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = y;
      disc.renderOrder = 3;
      lidGroup.add(disc);
      for (const r of inner > 0 ? [inner, outer] : [outer]) {
        const c = circle(r, colors.text);
        c.position.y = y;
        lidGroup.add(c);
      }
      const rimH = Math.max(0.012 * E, 0.08 * y);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(outer, outer, rimH, 160, 1, true), lidMat);
      rim.position.y = y - rimH / 2;
      rim.renderOrder = 3;
      lidGroup.add(rim);
    }

    needsRender = true;
    const hex = (c) => '#' + c.getHexString();
    const legend = [
      { kind: 'swatch', label: 'Farmland', color: hex(colors.farm) },
      { kind: 'swatch', label: 'Free-market footprint (the brown paper)', color: hex(colors.paper) },
      { kind: 'swatch', label: 'Buildings, no more floor space than free market', color: hex(colors.dough) },
      { kind: 'ghost', label: 'Free-market city (ghost)', color: hex(colors.ghost) },
    ];
    if (seen.sprawl) legend.push({ kind: 'swatch', label: 'Sprawl onto farmland', color: hex(colors.sprawl) });
    if (seen.suburbs) legend.push({ kind: 'swatch', label: 'Suburbs built up', color: hex(colors.suburbs) });
    if (seen.downtown) legend.push({ kind: 'swatch', label: 'Taller downtown', color: hex(colors.downtown) });
    if (lidDrawn) legend.push({ kind: 'lid', label: 'The lid (height limit)', color: hex(colors.lid) });
    else if (capActive) legend.push({ kind: 'lid', label: 'The lid (far above the city, not drawn)', color: hex(colors.lid) });
    if (seen.parking) legend.push({ kind: 'swatch', label: 'Surface parking', color: hex(colors.parking) });
    if (Number.isFinite(ugbKm)) legend.push({ kind: 'ring', label: 'Growth boundary', color: hex(colors.ugb) });
    return { exaggeration, legend };
  }

  // Hover
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  // Hover is handled in the pointer event (throttled), not the render loop, so it
  // works even when rendering is idle.
  let lastHover = 0;
  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastHover < 30) return;
    lastHover = now;
    hoverAt(e);
  });
  canvas.addEventListener('pointerleave', () => onHover(null, 0, 0));
  function hoverAt(e) {
    if (!cells.length) return;
    if (e.buttons) {
      onHover(null, 0, 0);
      return;
    }
    camera.updateMatrixWorld();
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(blocks, false)[0];
    if (hit && hit.instanceId != null && cells[hit.instanceId]) {
      onHover(cells[hit.instanceId], e.clientX - rect.left, e.clientY - rect.top);
    } else onHover(null, 0, 0);
  }

  controls.addEventListener('change', () => {
    needsRender = true;
  });
  function tick() {
    controls.update();
    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
    requestAnimationFrame(tick);
  }
  resize();
  requestAnimationFrame(tick);

  /** Re-read colours after a theme change; the caller then re-runs update(). */
  function refreshTheme() {
    readColors();
    applyThemeColors();
    if (fitFor) {
      scene.fog.near = fitFor * 1.15 * 3;
      scene.fog.far = fitFor * 1.15 * 9;
    }
  }

  // Debug handle for automated screenshots; harmless in normal use.
  window.__playdough = { scene, camera, controls, requestRender: () => (needsRender = true) };

  return { update, refreshTheme };
}
