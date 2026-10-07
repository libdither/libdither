// Screenshots of the two interactive pages for WALKTHROUGH.md. Run from learner-theory/:
//   node walkthrough/capture.mjs            # needs Chromium on PATH (or CHROME=/path/to/chrome)
// Serves experiments/ itself, drives headless Chromium over the DevTools protocol (Node's built-in
// WebSocket, no packages), and writes WebP images to walkthrough/img/. The play-dough page loads three.js
// from a CDN, so it needs a network connection.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, '..', 'experiments');
const out = join(here, 'img');
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- a static server for experiments/
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(root) || !existsSync(path)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(readFileSync(path));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ---------------------------------------------------------------- headless Chromium over CDP
const port = 9300 + Math.floor(Math.random() * 500);
const profile = `/tmp/learner-theory-capture-${port}`;
const chrome = spawn(process.env.CHROME || 'chromium', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank',
], { stdio: 'ignore' });
let pageUrl = null;
for (let i = 0; i < 100 && !pageUrl; i++) {
  await sleep(100);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    pageUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
  } catch {}
}
if (!pageUrl) throw new Error('Chromium did not start');
const ws = new WebSocket(pageUrl);
await new Promise((r) => ws.addEventListener('open', r));
let nextId = 1;
const pending = new Map();
const waiters = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  } else if (msg.method) for (const w of waiters.splice(0)) if (w.method === msg.method) w.resolve(msg.params);
    else waiters.push(w);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
const goto = async (url) => {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
};
// screenshot the union of the elements matching `selector`, padded, in page coordinates
const shoot = async (name, selector, pad = 8) => {
  const box = await evaluate(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
    els[0].scrollIntoView({ block: 'start' });
    const rs = els.map((e) => e.getBoundingClientRect());
    const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top));
    const w = Math.max(...rs.map((r) => r.right)) - x, h = Math.max(...rs.map((r) => r.bottom)) - y;
    return { x: x + scrollX, y: y + scrollY, w, h };
  })()`);
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + 2 * pad, height: box.h + 2 * pad, scale: 1 };
  await sleep(150); // let a resize from scrolling settle and the page redraw
  const { data } = await send('Page.captureScreenshot', { format: 'webp', quality: 85, clip });
  writeFileSync(join(out, `${name}.webp`), Buffer.from(data, 'base64'));
  console.log(`img/${name}.webp`);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1300, deviceScaleFactor: 1.5, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

// ---------------------------------------------------------------- one model, two readings
// Each setting is stepped with the page's own synchronous hook, then both views are captured.
const SETTINGS = [
  ['land', 600],
  ['agglomeration', 900],
  ['firmshomes', 1200],
  ['hierarchy', 1200],
  ['lid', 600],
  ['sorting', 1500],
  ['districts', 900],
  ['mixed', 1300],
  ['experts', 900],
  ['attention', 400],
];
await goto(`${base}/one-model/index.html#land`);
await sleep(500);
for (const [id, units] of SETTINGS) {
  await evaluate(`(() => {
    const h = window.__oneModel;
    h.S.paused = true;
    h.loadPreset(${JSON.stringify(id)});
    h.S.paused = true;
    h.step(${units});
    h.render();
  })()`);
  await sleep(400);
  await evaluate(`window.__oneModel.render()`);
  await sleep(200);
  await shoot(`one-model-${id}`, 'section[aria-label="The same state drawn two ways"] figure', 6);
}
// Knob settings of the agglomeration rows: a harbour, and towns
const VARIANTS = [
  ['agglomeration', 'harbour', `h.S.sim.setConfig({ sources: 'center', sourceAt: [7, 2], distanceCost: 0.1 })`, 900],
  ['firmshomes', 'towns', `h.S.sim.setConfig({ interaction: { matrix: [[3, 1], [1, 0]], compete: { strength: 20, reach: 3, matrix: [[1, 0], [0, 0]] } } })`, 1500],
];
for (const [id, name, patch, units] of VARIANTS) {
  await evaluate(`(() => { const h = window.__oneModel; h.S.paused = true; h.loadPreset(${JSON.stringify(id)}); h.S.paused = true; ${patch}; h.S.sim.reset(); h.step(${units}); h.render(); })()`);
  await sleep(400);
  await evaluate(`window.__oneModel.render()`);
  await sleep(200);
  await shoot(`one-model-${id}-${name}`, 'section[aria-label="The same state drawn two ways"] figure', 6);
}
// Follow one arrival: the walkthrough panel for a single choice
await evaluate(`(() => { const h = window.__oneModel; h.S.paused = true; h.loadPreset('land'); h.S.paused = true; h.step(600); h.render(); })()`);
await evaluate(`document.getElementById('g-follow').click()`);
await sleep(600);
for (let i = 0; i < 2; i++) {
  // on to the step that shows what every option costs this arrival
  await evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Next step').click()`);
  await sleep(400);
}
await evaluate(`window.__oneModel.render()`);
await sleep(300);
await shoot('one-model-follow', 'section[aria-label="The same state drawn two ways"] figure', 6);

// ---------------------------------------------------------------- the play-dough city
// Steps 1–3 of the page's tour: no rules, a lid, a lid with a hole in it.
await goto(`${base}/playdough-city/index.html`);
await sleep(4000);
for (let step = 1; step <= 3; step++) {
  await sleep(2500);
  await shoot(`playdough-step${step}`, 'canvas', 0);
  await evaluate(`document.getElementById('tour-next').click()`);
}

ws.close();
chrome.kill();
server.close();
await sleep(300);
rmSync(profile, { recursive: true, force: true });
