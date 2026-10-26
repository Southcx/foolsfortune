// ---------------------------------------------------------------------------------------
// THE WEBKIT PROBE: the built game in WebKit itself, as an iPhone XR held landscape (the owner's iPhone, v287: the graphics taken back on
// turning the camera in the workshop and on arriving at the Raceway, never on a desk). Chromium's ANGLE forgives what WebKit's may not,
// so this boots `dist/` in Playwright's WebKit (Safari's engine on Linux, its GL in software: the fault a phone's GPU makes is not
// reproduced, but every WebGL error and warning WebKit's own validation raises is), turns the camera a full circle in the workshop,
// walks to the basement and turns again, then goes to a room the Index's way, and reports: each console line WebKit wrote about WebGL
// (counted by its text), the page's errors, and whether the context was lost.
// One look, not a gate (CLAUDE.md, test lean). Needs Playwright's WebKit (PLAYWRIGHT_BROWSERS_PATH, if not the default) and a build.
//
// Prior art: scripts/arrivalprobe.mjs (the trip), scripts/gpuledger.mjs (the turn); Safari's Web Inspector console, which prints the same.
//
//   npm run build && node scripts/webkitprobe.mjs [room id, default raceway] [--port 5199]
// ---------------------------------------------------------------------------------------
import path from 'node:path';
import { preview } from 'vite';
import { webkit, devices } from 'playwright';
import { execSync } from 'node:child_process';

/** The resident memory of WebKit's processes now, MB by process name (what WebKit and its ANGLE truly hold, overheads and all). */
const rss = () => { const by = {}; for (const l of execSync('ps -eo rss,comm').toString().split('\n').slice(1)) { const [kb, ...c] = l.trim().split(/\s+/); const n = c.join(' '); if (/WPE|WebKit|MiniBrowser/.test(n)) by[n] = Math.round(((by[n] || 0) + Number(kb) / 1024)); } return by; };

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const room = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'raceway';
const port = Number(process.argv[process.argv.indexOf('--port') + 1]) || 5199;
const server = await preview({ root: ROOT, logLevel: 'error', preview: { host: '127.0.0.1', port, strictPort: false } });
const url = server.resolvedUrls.local[0];
const browser = await webkit.launch();
const lines = new Map(), errs = [];
const note = (t) => { const k = t.replace(/\d+/g, '#').slice(0, 220); lines.set(k, (lines.get(k) || 0) + 1); };
try {
  const ctx = await browser.newContext({ ...devices['iPhone XR landscape'] });
  const page = await ctx.newPage();
  page.on('console', (m) => { const t = m.text(); if (/webgl|gl_|context|shader|program|framebuffer|texture|buffer/i.test(t)) note(`[${m.type()}] ${t}`); });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
    window.__lost = [];
    // each draw checked from the first: the object three was drawing when WebGL refused (caught as three assigns its draw entry; the
    // probe's own cost, never the game's)
    const bad = (window.__bad = new Map()); let cur = null;
    Object.defineProperty(Object.prototype, 'renderBufferDirect', { configurable: true, set(fn) {
      Object.defineProperty(this, 'renderBufferDirect', { configurable: true, writable: true, value: function (c, sc, geo, m, o, gr) { cur = { geo, m, o }; return fn.call(this, c, sc, geo, m, o, gr); } });
    } });
    for (const fn of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const f = WebGL2RenderingContext.prototype[fn];
      WebGL2RenderingContext.prototype[fn] = function (...a) { f.apply(this, a); const e = this.getError(); if (!e || !cur) return; const { geo, m, o } = cur;
        const at = Object.entries(geo.attributes).map(([k, v]) => `${k}:${v.count}${v.isInstancedBufferAttribute ? 'i' : ''}${v.isInterleavedBufferAttribute ? 'I' : ''}`).join(' ');
        let p = o.parent, path = ''; for (let d = 0; p && d < 5; d++, p = p.parent) if (p.name) path = `${p.name}/${path}`;
        const k = `${fn} 0x${e.toString(16)} ${m.name || m.type}/${o.name || o.type}${o.isInstancedMesh ? '(instanced)' : ''} in ${path || '-'} args ${a.slice(1).join(',')} count ${o.count ?? '-'} ic ${geo.instanceCount ?? '-'} range ${geo.drawRange.start}+${geo.drawRange.count} attrs ${at}`;
        bad.set(k, (bad.get(k) || 0) + 1); };
    }
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...a) { const c = gc.apply(this, a); if (c && /webgl/.test(a[0]) && !this.__watched) { this.__watched = true; this.addEventListener('webglcontextlost', (e) => window.__lost.push({ at: performance.now(), why: e.statusMessage || '' })); } return c; };
  });
  await page.exposeFunction('__rss', () => rss());
  await page.goto(`${url}?clock=1791160275000`, { waitUntil: 'commit' });
  let ready = false;
  for (let i = 0; i < 400 && !ready; i++) { await new Promise((r) => setTimeout(r, 1000)); ready = await page.evaluate('!!window.__ready').catch(() => false); }
  if (!ready) throw new Error('the game never said it was ready');
  const steps = await page.evaluate(async (room) => {
    const G = __game, g = G.game, out = [], gl = G.renderer.getContext(), bad = window.__bad;
    const errs = () => { const e = []; for (let i = 0; i < 8; i++) { const x = gl.getError(); if (!x) break; e.push(x.toString(16)); } return e; };
    const frames = async (n) => { for (let i = 0; i < n; i++) { G.tick(1 / 30); G.draw(); await new Promise((r) => setTimeout(r, 0)); } };
    const turn = async (label) => { for (let k = 1; k <= 24; k++) { g.player.yaw += Math.PI / 12; await frames(2); } out.push([label, g.zones?.current, errs(), G.renderer.info.memory.geometries, G.renderer.info.memory.textures, gl.isContextLost(), await window.__rss()]); };
    document.getElementById('overlay').style.display = 'none';
    await frames(20); out.push(['start', g.zones?.current, errs(), 0, 0, gl.isContextLost(), await window.__rss()]);
    await turn('workshop turned');
    g.course.goRoom('lab'); await frames(30); await turn('basement turned');
    const depart = () => g.course.goRoom(room);
    if (!(g.gateRing?.depart(depart))) g.seam?.cross(depart) || depart();
    let n = 0; do { await frames(1); n++; } while (g.seam?.busy && n < 1500);
    await frames(30); await turn(`${room} turned`);
    return { out, lost: window.__lost, bad: [...bad] };
  }, room);
  console.log(`WebKit ${browser.version()} as the iPhone XR: ${url}`);
  for (const [w, z, e, geo, tex, lost, mem] of steps.out) console.log(`  ${w.padEnd(18)} in ${z}; GL errors ${e.length ? e.join(' ') : 'none'}; geometries ${geo}, textures ${tex}${lost ? '; CONTEXT LOST' : ''}; resident MB ${JSON.stringify(mem)}`);
  console.log(`draws WebGL refused (${steps.bad.length} kinds):`); for (const [k, n] of steps.bad) console.log(`  x${n}  ${k}`);
  console.log(`context losses: ${steps.lost.length ? JSON.stringify(steps.lost) : 'none'}`);
  console.log(`WebGL console lines (${[...lines.values()].reduce((a, b) => a + b, 0)}):`);
  for (const [k, n] of [...lines].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`  x${n}  ${k}`);
} finally {
  if (errs.length) console.log(`page errors (${errs.length}):\n  ${errs.slice(0, 8).join('\n  ')}`);
  await browser.close(); await new Promise((r) => server.httpServer.close(r));
}
