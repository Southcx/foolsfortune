// ---------------------------------------------------------------------------------------
// THE PHONE'S MEMORY, BY MAKER: the game booted headless as an iPhone XR held landscape (Playwright's device, its WebGL renderer string
// stubbed to "Apple GPU" so render/graphics.js reads a phone and boots Minimum), every texture on the GPU in the workshop listed with the
// module that made it and its bytes, largest first; then the area dressings' teardown and build (vfx/bazaarhall.js, vfx/dunes/,
// vfx/raceway/) run once each way, the geometries counted round them. One look, not a gate (CLAUDE.md, test lean).
// Prior art: scripts/programcensus.mjs (its maker hook); Chrome's memory-infra by allocator; Unity's Memory Profiler by owner.
//   node scripts/phonememory.mjs [out.json]      (default /tmp/phonememory.json)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || '/tmp/phonememory.json');
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5192, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
try {
  const ctx = await browser.newContext({ ...devices['iPhone XR landscape'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
    for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) { const gp = P.getParameter; P.getParameter = function (k) { return k === 0x9246 ? 'Apple GPU' : k === 0x9245 ? 'Apple Inc.' : gp.call(this, k); }; }
    const made = window.__madeTex = [];
    Object.defineProperty(Object.prototype, 'uuid', { configurable: true, set(v) {
      Object.defineProperty(this, 'uuid', { value: v, writable: true, enumerable: true, configurable: true });
      if (!this.isTexture) return;
      const st = (new Error().stack || '').split('\n').slice(2).map((l) => l.trim()).filter((l) => !/node_modules|\.vite\/deps/.test(l));
      this.__maker = st.map((l) => (l.match(/\/src\/([^?:)]+)/) || [])[1]).filter(Boolean).slice(0, 2);
      made.push(new WeakRef(this));
    } });
  });
  await page.goto(`${url}?clock=1791160275000`, { waitUntil: 'commit' });
  for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const res = await page.evaluate(() => {
    document.getElementById('overlay').style.display = 'none';
    const G = __game, g = G.game, R = G.renderer;
    for (let i = 0; i < 30; i++) { G.tick(1 / 60); G.draw(); }
    const rows = [];
    for (const ref of window.__madeTex) {
      const t = ref.deref(); if (!t) continue;
      const p = R.properties.get(t); if (!p?.__webglTexture) continue; // (on the GPU now)
      const im = t.userData?.baked || t.image || {}, w = im.width || t.width || 0, h = im.height || t.height || 0, d = im.depth || 1;
      const bpp = t.type === 1016 || t.type === 1015 ? (t.type === 1015 ? 16 : 8) : 4; // (HalfFloat 8, Float 16 bytes a pixel, else 4)
      const mb = (w * h * d * bpp * (t.generateMipmaps && t.minFilter >= 1007 ? 4 / 3 : 1)) / 1e6;
      rows.push({ maker: (t.__maker || []).join(' < ') || '?', name: t.name || '', w, h, mb: +mb.toFixed(3) });
    }
    const tier = { graphics: G.game?.graphics?.tier ?? g.graphics?.tier, mobile: g.graphics?.machine?.mobile, textureScale: G.T?.visual?.textureScale };
    // the area dressings, each way once
    const geos = () => { const seen = new Set(); g.scene.traverse((o) => o.geometry && seen.add(o.geometry)); return seen.size; }, trip = {}; // (geometries in the scene: an area not drawn uploads nothing, so the renderer's count would not move)
    for (const [k, o] of [['bazaarHall', g.bazaarHall], ['dunesDress', g.dunesDress], ['racewayDress', g.racewayDress]]) {
      if (!o?.teardown) { trip[k] = 'none'; continue; }
      const a = geos(); o.teardown(g); for (let i = 0; i < 3; i++) { G.tick(1 / 60); G.draw(); }
      const b = geos(); o.build(g); for (let i = 0; i < 3; i++) { G.tick(1 / 60); G.draw(); }
      const c = geos(); o.teardown(g); o.teardown(g); o.build(g); o.build(g); for (let i = 0; i < 3; i++) { G.tick(1 / 60); G.draw(); }
      trip[k] = { before: a, down: b, up: c, again: geos(), built: o.built };
    }
    return { tier, rows, trip, geometriesMB: null };
  });
  // by maker (the first frame outside three), mine marked
  const by = new Map();
  for (const r of res.rows) { const k = r.maker.split(' < ')[0]; const e = by.get(k) || by.set(k, { mb: 0, n: 0, big: [] }).get(k); e.mb += r.mb; e.n++; e.big.push(`${r.name || '-'} ${r.w}x${r.h} ${r.mb.toFixed(2)}`); }
  const total = res.rows.reduce((a, r) => a + r.mb, 0);
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(`tier ${JSON.stringify(res.tier)}; textures on the GPU ${res.rows.length}, ${total.toFixed(1)} MB`);
  for (const [k, e] of [...by].sort((a, b) => b[1].mb - a[1].mb).slice(0, 30)) console.log(`${e.mb.toFixed(2).padStart(7)} MB  ${String(e.n).padStart(3)}  ${k}   ${e.big.sort((x, y) => parseFloat(y.split(' ').pop()) - parseFloat(x.split(' ').pop())).slice(0, 2).join('; ')}`);
  console.log('round trips (geometries):', JSON.stringify(res.trip));
} finally {
  if (errs.length) console.log(`page errors (${errs.length}):\n  ${errs.slice(0, 8).join('\n  ')}`);
  await browser.close(); await server.close();
}
