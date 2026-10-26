// ---------------------------------------------------------------------------------------
// THE GPU LEDGER: what the game hands the graphics card, in bytes, as the owner plays it (the owner's iPhone XR, v285: the graphics
// taken back while the camera swept the basement, at 962 geometries and 113 textures, and at the Raceway at only 266 and 101: the count
// is not what Safari weighs). WebGL's own calls are wrapped (texImage2D, texStorage2D, bufferData, renderbufferStorage, linkProgram,
// and their deletes), so the totals are what was asked of the card, not what three.js thinks it holds: textures (their mips counted),
// buffers, render targets and the drawing buffer, and the programs linked. The game boots headless as an iPhone XR held landscape (the
// renderer stubbed to "Apple GPU", so the phone's tier), goes to a room the Index's way, and turns the camera a full circle in 24 steps
// (two frames a step), the ledger read after each; then the largest live allocations, with their makers.
// One look, not a gate (CLAUDE.md, test lean).
//
// Prior art: Xcode's GPU frame capture memory report, Chrome's about:gpu memory tab, scripts/arrivalprobe.mjs (the boot and the trip).
//
//   node scripts/gpuledger.mjs [room id, default lab] [--top N]
// ---------------------------------------------------------------------------------------
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const room = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'lab';
const top = Number(process.argv[process.argv.indexOf('--top') + 1]) || 15;
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5196, strictPort: false } });
await server.listen();
const browser = await chromium.launch({ args: ['--js-flags=--expose-gc', '--enable-precise-memory-info', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
try {
  const ctx = await browser.newContext({ ...devices['iPhone XR landscape'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
    // the ledger: every allocation keyed by its WebGL object, its bytes and its maker (the first frame of the stack inside src/)
    const L = (window.__gpu = { live: new Map(), programs: 0, peak: 0 });
    const maker = () => ((new Error().stack || '').split('\n').slice(3).map((l) => (l.match(/\/src\/([^?:)]+:\d+)/) || [])[1]).filter(Boolean).slice(0, 3).join(' < ') || '(three)');
    const BPP = { 0x1908: 4, 0x8058: 4, 0x8c43: 4, 0x1907: 3, 0x8051: 3, 0x1903: 1, 0x8229: 1, 0x822b: 2, 0x8227: 2, 0x1909: 1, 0x190a: 2, 0x881a: 8, 0x8814: 16, 0x822f: 8, 0x8230: 16, 0x822d: 2, 0x822e: 4, 0x8c3a: 4, 0x81a5: 2, 0x81a6: 4, 0x8cac: 4, 0x88f0: 4, 0x8d48: 1 };
    const total = () => { let b = 0; for (const v of L.live.values()) b += v.b; return b; };
    const put = (key, kind, b, extra) => { const o = L.live.get(key) || { kind, b: 0, who: maker(), parts: {} }; o.parts[extra] = b; o.b = Object.values(o.parts).reduce((x, y) => x + y, 0); o.kind = kind; L.live.set(key, o); L.peak = Math.max(L.peak, total()); };
    for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const gp = P.getParameter; P.getParameter = function (k) { return k === 0x9246 ? 'Apple GPU' : k === 0x9245 ? 'Apple Inc.' : gp.call(this, k); };
      const bound = new WeakMap(), cur = (gl, target) => (bound.get(gl) || {})[target];
      const bindT = P.bindTexture; P.bindTexture = function (t, tex) { const m = bound.get(this) || {}; m['t' + t] = tex; bound.set(this, m); return bindT.call(this, t, tex); };
      const bindB = P.bindBuffer; P.bindBuffer = function (t, buf) { const m = bound.get(this) || {}; m['b' + t] = buf; bound.set(this, m); return bindB.call(this, t, buf); };
      const bindR = P.bindRenderbuffer; P.bindRenderbuffer = function (t, rb) { const m = bound.get(this) || {}; m.r = rb; bound.set(this, m); return bindR.call(this, t, rb); };
      const texTarget = (t) => (t >= 0x8515 && t <= 0x851a ? 0x8513 : t);
      const ti = P.texImage2D; P.texImage2D = function (t, lvl, ifmt, ...a) {
        let w, h; if (a.length >= 6) { w = a[0]; h = a[1]; } else { const s = a[2]; w = s?.videoWidth || s?.naturalWidth || s?.width || 0; h = s?.videoHeight || s?.naturalHeight || s?.height || 0; }
        const tex = cur(this, 't' + texTarget(t)); if (tex) put(tex, 'texture', w * h * (BPP[ifmt] || 4), `${t}.${lvl}`);
        return ti.call(this, t, lvl, ifmt, ...a);
      };
      if (P.texStorage2D) { const ts = P.texStorage2D; P.texStorage2D = function (t, levels, ifmt, w, h) { const tex = cur(this, 't' + t); let b = 0; for (let l = 0, W = w, H = h; l < levels; l++, W = Math.max(1, W >> 1), H = Math.max(1, H >> 1)) b += W * H * (BPP[ifmt] || 4); if (tex) put(tex, 'texture', b * (t === 0x8513 ? 6 : 1), 's'); return ts.call(this, t, levels, ifmt, w, h); }; }
      if (P.texStorage3D) { const ts = P.texStorage3D; P.texStorage3D = function (t, levels, ifmt, w, h, d) { const tex = cur(this, 't' + t); if (tex) put(tex, 'texture', w * h * d * (BPP[ifmt] || 4) * (levels > 1 ? 4 / 3 : 1), 's'); return ts.call(this, t, levels, ifmt, w, h, d); }; }
      const gm = P.generateMipmap; P.generateMipmap = function (t) { const o = L.live.get(cur(this, 't' + t)); if (o && !o.parts.mips) { o.parts.mips = Math.round(o.b / 3); o.b += o.parts.mips; } return gm.call(this, t); };
      const bd = P.bufferData; P.bufferData = function (t, src, usage) { const buf = cur(this, 'b' + t), b = typeof src === 'number' ? src : src?.byteLength || 0; if (buf) put(buf, t === 0x8893 ? 'index' : 'vertex', b, 'd'); return bd.call(this, t, src, usage); };
      const rs = P.renderbufferStorage; P.renderbufferStorage = function (t, ifmt, w, h) { const rb = (bound.get(this) || {}).r; if (rb) put(rb, 'target', w * h * (BPP[ifmt] || 4), 'd'); return rs.call(this, t, ifmt, w, h); };
      if (P.renderbufferStorageMultisample) { const rm = P.renderbufferStorageMultisample; P.renderbufferStorageMultisample = function (t, s, ifmt, w, h) { const rb = (bound.get(this) || {}).r; if (rb) put(rb, 'target', w * h * (BPP[ifmt] || 4) * Math.max(1, s), 'd'); return rm.call(this, t, s, ifmt, w, h); }; }
      for (const [n, kind] of [['deleteTexture'], ['deleteBuffer'], ['deleteRenderbuffer']]) { const f = P[n]; P[n] = function (o) { L.live.delete(o); return f.call(this, o); }; }
      const lp = P.linkProgram; P.linkProgram = function (p) { L.programs++; return lp.call(this, p); };
      const dp = P.deleteProgram; P.deleteProgram = function (p) { L.programs--; return dp.call(this, p); };
    }
  });
  await page.goto(`${server.resolvedUrls.local[0]}?clock=1791160275000`, { waitUntil: 'commit' });
  for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const res = await page.evaluate(async (room) => {
    const G = __game, g = G.game, L = window.__gpu, cv = G.renderer.domElement;
    const read = () => { const by = {}; for (const v of L.live.values()) by[v.kind] = (by[v.kind] || 0) + v.b; const db = cv.width * cv.height * 4 * 2; return { ...Object.fromEntries(Object.entries(by).map(([k, v]) => [k, +(v / 1e6).toFixed(1)])), canvas: +(db / 1e6).toFixed(1), heap: (gc(), Math.round(performance.memory.usedJSHeapSize / 1048576)), total: +((Object.values(by).reduce((a, b) => a + b, 0) + db) / 1e6).toFixed(1), programs: L.programs }; };
    document.getElementById('overlay').style.display = 'none';
    for (let i = 0; i < 20; i++) { G.tick(1 / 30); G.draw(); }
    const steps = [['title', read()]];
    g.course.goRoom(room); for (let i = 0; i < 40; i++) { G.tick(1 / 30); G.draw(); await new Promise((r) => setTimeout(r, 0)); }
    steps.push(['arrived', read()]);
    const cam = g.camera?.ctrl || g.cam || null, P = g.player;
    for (let k = 1; k <= 24; k++) { if (P) P.yaw = (P.yaw || 0) + (Math.PI * 2) / 24; if (g.input) g.input.dx = 0; if (cam && 'yaw' in cam) cam.yaw += (Math.PI * 2) / 24; for (let i = 0; i < 2; i++) { G.tick(1 / 30); G.draw(); } await new Promise((r) => setTimeout(r, 0)); if (k % 6 === 0) steps.push([`turned ${k * 15} deg`, read()]); }
    const live = [...L.live.values()].sort((a, b) => b.b - a.b);
    const byWho = new Map(); for (const v of live) { const k = `${v.kind} ${v.who}`; const o = byWho.get(k) || { b: 0, n: 0 }; o.b += v.b; o.n++; byWho.set(k, o); }
    return { canvas: [cv.width, cv.height], tier: g.graphics?.tier, zone: g.zones?.current, steps, peak: +(L.peak / 1e6).toFixed(1), byWho: [...byWho].sort((a, b) => b[1].b - a[1].b).map(([k, v]) => [k, v.n, +(v.b / 1e6).toFixed(2)]) };
  }, room);
  console.log(`${room}: in ${res.zone}, tier ${res.tier}, canvas ${res.canvas.join(' x ')}; ledger peak ${res.peak} MB (textures, buffers, targets; the drawing buffer aside)`);
  for (const [w, r] of res.steps) console.log(`  ${w.padEnd(16)} ${JSON.stringify(r)}`);
  console.log(`the largest makers, live at the end (kind maker: count, MB):`);
  for (const [k, n, b] of res.byWho.slice(0, top)) console.log(`  ${String(b).padStart(7)} MB  x${n}  ${k}`);
} finally {
  if (errs.length) console.log(`page errors (${errs.length}):\n  ${errs.slice(0, 8).join('\n  ')}`);
  await browser.close(); await server.close();
}
