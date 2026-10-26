// ---------------------------------------------------------------------------------------
// THE ARRIVAL PROBE: one trip into a place on an emulated phone, measured (the owner's iPhone, v283 and v284: the graphics taken back
// on arriving at the Raceway). The game boots headless as an iPhone XR held landscape (its WebGL renderer stubbed to "Apple GPU" so it
// boots the phone's tier), walks to the basement, and goes to the place the Index's way (the Gate's gate-out under the seam, so a staged
// arrival and the seam's warm-up run as on the phone), stepping frames until the cover lifts. It reports: the frames the arrival took
// and the longest; the JS heap before, at its peak and after (gc'd, the dev build's: compare runs, not builds); the textures first
// uploaded on the way in, largest first, with their makers; the scene's geometry before and after and its largest meshes; the heap's
// biggest allocators on the way in (the sampling profiler, collected garbage included); and the field report's line for the lift.
// One look, not a gate (CLAUDE.md, test lean).
//
// Prior art: scripts/phonememory.mjs (the maker hook on a texture's uuid), Chrome's heap sampling profiler, a console's level-load
// budget sheet (frames, peak memory, uploads per transition).
//
//   node scripts/arrivalprobe.mjs [room id, default raceway] [--top N]
// ---------------------------------------------------------------------------------------
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const room = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'raceway';
const top = Number(process.argv[process.argv.indexOf('--top') + 1]) || 12;
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5195, strictPort: false } });
await server.listen();
const browser = await chromium.launch({ args: ['--js-flags=--expose-gc', '--enable-precise-memory-info', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
try {
  const ctx = await browser.newContext({ ...devices['iPhone XR landscape'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
    for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) { const gp = P.getParameter; P.getParameter = function (k) { return k === 0x9246 ? 'Apple GPU' : k === 0x9245 ? 'Apple Inc.' : gp.call(this, k); }; }
    const made = (window.__madeTex = []);
    Object.defineProperty(Object.prototype, 'uuid', { configurable: true, set(v) {
      Object.defineProperty(this, 'uuid', { value: v, writable: true, enumerable: true, configurable: true });
      if (!this.isTexture) return;
      const st = (new Error().stack || '').split('\n').slice(2).map((l) => l.trim()).filter((l) => !/node_modules|\.vite\/deps/.test(l));
      this.__maker = st.map((l) => (l.match(/\/src\/([^?:)]+:\d+)/) || [])[1]).filter(Boolean).slice(0, 2).join(' < ');
      made.push(new WeakRef(this));
    } });
  });
  await page.goto(`${server.resolvedUrls.local[0]}?clock=1791160275000`, { waitUntil: 'commit' });
  for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const cdp = await ctx.newCDPSession(page);
  await page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; const G = __game; for (let i = 0; i < 20; i++) { G.tick(1 / 30); G.draw(); } G.game.course.goRoom('lab'); for (let i = 0; i < 20; i++) { G.tick(1 / 30); G.draw(); } }); // (the basement first, as the owner goes)
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 16384, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  const res = await page.evaluate(async (room) => {
    const G = __game, g = G.game, R = G.renderer;
    const geo = () => { const seen = new Map(); g.scene.traverse((o) => { const ge = o.geometry; if (!ge || seen.has(ge)) return; let b = ge.index?.array?.byteLength || 0, v = 0; for (const a of Object.values(ge.attributes || {})) { b += a.array?.byteLength || 0; v = a.count || v; } seen.set(ge, { b, v, who: `${o.name || o.type} ${[].concat(o.material)[0]?.type || ''}`, vis: o.visible }); }); return [...seen.values()]; };
    const up = () => { const s = new Set(); for (const r of window.__madeTex) { const t = r.deref(); if (t && R.properties.get(t)?.__webglTexture) s.add(t); } return s; };
    const lifts = []; g.events.on('seam.lift', (e) => lifts.push(e));
    gc(); const h0 = performance.memory.usedJSHeapSize, g0 = geo(), u0 = up();
    let peak = h0, frames = 0, worst = 0;
    const depart = () => g.course.goRoom(room);
    if (!(g.gateRing?.depart(depart))) g.seam?.cross(depart) || depart();
    do { const t = performance.now(); G.tick(1 / 30); if (!g.seam?.covering) G.draw(); worst = Math.max(worst, performance.now() - t); frames++; peak = Math.max(peak, performance.memory.usedJSHeapSize); await new Promise((r) => setTimeout(r, 0)); } while (g.seam?.busy && frames < 1500);
    for (let i = 0; i < 20; i++) { G.tick(1 / 30); G.draw(); }
    gc(); const h1 = performance.memory.usedJSHeapSize, g1 = geo();
    const fresh = [];
    for (const r of window.__madeTex) { const t = r.deref(); if (!t || u0.has(t) || !R.properties.get(t)?.__webglTexture) continue; const im = t.userData?.baked || t.image || {}; const w = im.width || t.width || 0, h = im.height || t.height || 0, bpp = t.type === 1015 ? 16 : t.type === 1016 ? 8 : 4; fresh.push({ mb: (w * h * (im.depth || 1) * bpp * (t.generateMipmaps && t.minFilter >= 1007 ? 4 / 3 : 1)) / 1e6, s: `${w}x${h} ${t.__maker || t.name || ''}` }); }
    const sum = (a) => a.reduce((x, y) => x + y.b, 0) / 1e6;
    return { zone: g.zones?.current, frames, worst: Math.round(worst), heap: [h0, peak, h1].map((b) => Math.round(b / 1048576)), geo: [sum(g0), sum(g1)], big: g1.sort((a, b) => b.b - a.b), fresh: fresh.sort((a, b) => b.mb - a.mb), lifts, buildMs: g.raceway?.buildMs, programs: R.info.programs?.length, mem: R.info.memory };
  }, room);
  const { profile } = await cdp.send('HeapProfiler.stopSampling');
  const by = new Map();
  const walk = (n, owner) => { const f = n.callFrame, here = (f.url.match(/\/src\/([^?]+)/) || [])[1], key = here ? `${here}:${f.functionName || '(anon)'}:${f.lineNumber + 1}` : owner; if (n.selfSize) by.set(key || '(engine)', (by.get(key || '(engine)') || 0) + n.selfSize); for (const c of n.children) walk(c, key); };
  walk(profile.head, null);
  const mb = (x) => x.toFixed(2).padStart(6);
  console.log(`arrival at ${room}: in ${res.zone}; ${res.frames} frames under the cover, the longest ${res.worst} ms; programs ${res.programs}; GPU ${JSON.stringify(res.mem)}`);
  console.log(`heap MB (dev): before ${res.heap[0]}, peak ${res.heap[1]}, after ${res.heap[2]}; scene geometry MB ${res.geo[0].toFixed(1)} -> ${res.geo[1].toFixed(1)}`);
  console.log(`cover lifts: ${JSON.stringify(res.lifts)}; build ms ${JSON.stringify(res.buildMs || {})}`);
  console.log(`textures first uploaded on the way in (${res.fresh.length}, ${res.fresh.reduce((a, r) => a + r.mb, 0).toFixed(1)} MB):`); for (const r of res.fresh.slice(0, top)) console.log(`  ${mb(r.mb)} MB  ${r.s}`);
  console.log('largest meshes after:'); for (const r of res.big.slice(0, top)) console.log(`  ${mb(r.b / 1e6)} MB  v${r.v} ${r.vis ? '' : '(hidden) '}${r.who}`);
  console.log('allocated on the way in, by function (garbage included):'); for (const [k, v] of [...by].sort((a, b) => b[1] - a[1]).slice(0, top)) console.log(`  ${mb(v / 1048576)} MB  ${k}`);
} finally {
  if (errs.length) console.log(`page errors (${errs.length}):\n  ${errs.slice(0, 8).join('\n  ')}`);
  await browser.close(); await server.close();
}
