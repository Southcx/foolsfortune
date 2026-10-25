// ---------------------------------------------------------------------------------------
// THE PROGRAM CENSUS: every shader program the game compiles, headless, over perf's route (the workshop, the Dunes, the Great Dunemaw's
// bottom floor, the Spirit Garden, a showcase crossing), each attributed to the materials that use it and the source files that made
// them, its program flags and its shader text hashed, so near-duplicates show up as one row. One look, no loop: for an audit, not a gate.
// Prior art: three.js's own renderer.info.programs and its program cache key; Unity's shader variant collection report.
//   node scripts/programcensus.mjs [out.json]      (default /tmp/programcensus.json; GRAPHICS=high)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || '/tmp/programcensus.json');
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5190, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
    // every material's maker: the first stack frame outside three, kept as it is made (a uuid is assigned in every three constructor)
    const made = window.__madeMats = [];
    Object.defineProperty(Object.prototype, 'uuid', { configurable: true, set(v) {
      Object.defineProperty(this, 'uuid', { value: v, writable: true, enumerable: true, configurable: true });
      if (!this.isMaterial) return;
      const st = (new Error().stack || '').split('\n').slice(2).map((l) => l.trim());
      const own = st.filter((l) => !/node_modules|\.vite\/deps/.test(l)).map((l) => (l.match(/\/src\/([^?:)]+)/) || l.match(/\/scripts\/([^?:)]+)/) || [])[1]).filter(Boolean);
      made.push(new WeakRef(this)); this.__maker = own.slice(0, 3);
    } });
    // the shader text each program was linked from
    const src = new WeakMap(), P = WebGL2RenderingContext.prototype, ss = P.shaderSource;
    P.shaderSource = function (sh, s) { src.set(sh, s); return ss.call(this, sh, s); };
    window.__shaderSrc = src;
  });
  await page.goto(`${url}?graphics=${process.env.GRAPHICS || 'high'}&clock=1791160275000`, { waitUntil: 'commit' });
  for (let i = 0; i < 240; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  await page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
  const res = await page.evaluate(() => {
    const G = __game, R = G.renderer, phases = {};
    const snap = (k) => { phases[k] = (R.info.programs || []).map((p) => p.id); };
    const run = (n) => { for (let i = 0; i < n; i++) { G.tick(1 / 60); G.draw(); } };
    snap('boot');
    run(40); snap('workshop');
    G.course.toDunes(); run(80); snap('dunes');
    const W = G.game.well; W.enter(); W.goTo(3); run(60); snap('well');
    const Gm = G.game, Rm = Gm.realm;
    if (Rm) { Rm.enter(Gm.shrines?.get?.(Gm.shrines.last) || null); run(220); Gm.indexMenu?.close?.(); run(30); snap('garden'); Rm.leave(); run(120); }
    const E = Gm.emocean;
    if (E?.sailShowcase?.('anagami', [])) {
      for (let i = 0; i < 240 && !E.stage.active; i++) G.tick(1 / 60);
      E.wound = () => {};
      const L = E.trip?.layout?.legs?.[1];
      if (L) { E.t = (L.at + 6) * 1.5; run(120); }
      E.waves?.spawn?.({ role: 'swarm', formation: 'river', count: 48, cls: 0 }, 0); run(90);
      snap('crossing');
    }
    // programs -> the materials holding them, and their makers
    const users = new Map();
    for (const ref of window.__madeMats) {
      const m = ref.deref(); if (!m) continue;
      const pr = R.properties.get(m);
      for (const p of pr?.programs?.values?.() || []) {
        const u = users.get(p.id) || users.set(p.id, { mats: new Set(), makers: new Set(), types: new Set(), obc: new Set() }).get(p.id);
        u.mats.add(m.name || '(unnamed)'); u.types.add(m.type); for (const f of m.__maker || []) u.makers.add(f);
        if (m.onBeforeCompile && m.onBeforeCompile.toString().length > 40) u.obc.add((m.__maker || [])[0] || '?');
      }
    }
    const S = window.__shaderSrc;
    return { phases, programs: (R.info.programs || []).map((p) => {
      const u = users.get(p.id);
      const vs = S.get(p.vertexShader) || '', fs = S.get(p.fragmentShader) || '';
      return { id: p.id, name: p.name, key: p.cacheKey, usedTimes: p.usedTimes, vs, fs,
        mats: u ? [...u.mats] : [], makers: u ? [...u.makers] : [], types: u ? [...u.types] : [], obc: u ? [...u.obc] : [] };
    }) };
  });
  // strip three's prefix (#defines and the chunks it injects) so a body's identity is its own text
  const h = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
  const body = (s) => s.replace(/^#version[^\n]*\n/, '').split('\n').filter((l) => !/^\s*#define\s/.test(l)).join('\n');
  for (const p of res.programs) {
    p.vsBody = h(body(p.vs)); p.fsBody = h(body(p.fs)); p.vsLen = p.vs.length; p.fsLen = p.fs.length;
    p.defines = [...new Set((p.vs + '\n' + p.fs).split('\n').filter((l) => /^\s*#define\s/.test(l)).map((l) => l.trim()))];
    delete p.vs; delete p.fs;
  }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(`programs ${res.programs.length}; by phase ${Object.entries(res.phases).map(([k, v]) => `${k} ${v.length}`).join(', ')}; written ${out}`);
} finally {
  if (errs.length) console.log(`page errors (${errs.length}):\n  ${errs.slice(0, 8).join('\n  ')}`);
  await browser.close(); await server.close();
}
