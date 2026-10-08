// ---------------------------------------------------------------------------------------
// THE PERF CHECK: the other machine half of Petra's gate (docs/ARCHITECTURE.md, "The gate", "Budgets"). It starts its own dev server,
// opens the game headless in manual mode, and measures three standing places, the workshop, the dunes and a hall of the Dunemaw's bottom floor: what a frame costs to simulate
// (tick) and to draw, how many draw calls and triangles a frame takes (every pass of the present counted), how many shader programs,
// geometries and textures are alive, the heap, and the boot. Then it holds the numbers against the last published build's
// (scripts/perf-baseline.json) and against the hard budgets, and says which moved.
//
// The software renderer (SwiftShader) is slow and its times are only good for comparison against themselves: what matters is the
// change, not the milliseconds. The counts (calls, triangles, programs) are exact and should not drift without a reason.
//
// Prior art: Unreal's `stat unit` and `stat scenerendering` (game, draw, GPU; draw calls and primitives), the frame budgets of console
// certification (a fixed cost per frame, checked on every build), and Chromium's perf bots (a recorded baseline, a tolerance, an alert).
//
//   npm run perf              measure, compare, exit 1 if a budget or a tolerance is broken
//   npm run perf -- --record  write today's numbers as the baseline (Petra, when a build is published)
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = path.join(ROOT, 'scripts', 'perf-baseline.json');
const record = process.argv.includes('--record');

// hard budgets (docs/ARCHITECTURE.md, "Budgets"): a sixth-generation console's frame, roughly
const BUDGET = { calls: 450, tris: 350_000, programs: 160, heapMB: 350 }; // (programs: each raise is a commit with its reason; docs/ARCHITECTURE.md)
// (heapMB is the DEV server's heap, which holds every module's source text and source map: it grows with the code, not only with what a
// player's page holds. v117: 345 here, 228 in the built game (vite preview, gc'd), up 5 from 223 before that round's merges; raised
// 340 -> 350 for that, Petra. The built figure is the one to watch: see the casebook, 2026-10-08.)
// how far a number may move from the baseline before the gate asks why (counts are exact; times are a software renderer's, so looser)
const TOL = { calls: 0.08, tris: 0.08, programs: 0.06, geos: 0.1, tex: 0.1, heapMB: 0.12, tick: 0.25, draw: 0.25, bootS: 0.3 };

const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5180, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
// (the calendar held at a calm game noon on Anagami: the hour and the weather are part of the picture, so every run measures the same one;
// CLOCK=now measures whatever the wall clock gives, CLOCK=<ms> another moment)
const CLOCK = process.env.CLOCK === 'now' ? null : process.env.CLOCK || 1791160275000;
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] }); // (gc before the heap is read: without it the reading is whatever garbage is lying about, ±10 MB a run)
let out = null, errs = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  const t0 = Date.now();
  await page.goto(`${url}${CLOCK ? `?clock=${CLOCK}` : ''}`, { waitUntil: 'commit' });
  for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  const bootS = (Date.now() - t0) / 1000;
  await page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
  out = await page.evaluate(() => {
    const G = __game, R = G.renderer;
    let calls = 0, tris = 0;
    const rr = R.render.bind(R); R.render = (s, c) => { rr(s, c); calls += R.info.render.calls; tris += R.info.render.triangles; };
    const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const bootSet = new Set(R.info.programs || []), bootProgs = bootSet.size; // (what the warm-up compiled: anything after this is compiled in play, a hitch on a real GPU)
    // (the big things drawn in every zone: a top-level object no zone claims, or one marked zoneFree, with its triangles. A big one here
    // is drawn from everywhere: tag `userData.zone` if it belongs to one place)
    const loose = () => {
      const Z = G.zones || G.game?.zones, out = [];
      for (const o of G.scene.children) {
        if (!o.visible) continue;
        const free = !!o.userData.zoneFree, z = Z?.place?.(o);
        if (z != null && !free) continue;
        let n = 0;
        o.traverseVisible((m) => { if (m.isMesh && m.geometry) { const g = m.geometry; n += ((g.index ? g.index.count : g.attributes.position?.count || 0) / 3) * (m.isInstancedMesh ? m.count : 1); } });
        if (n > 20000) out.push(`${o.name || o.type}${free ? ' (zoneFree)' : ''} ${Math.round(n)}`);
      }
      return out;
    };
    const place = () => {
      for (let i = 0; i < 40; i++) { G.tick(1 / 60); G.draw(); }
      const tk = [], dr = [];
      let fc = 0, ft = 0;
      for (let i = 0; i < 60; i++) {
        let t = performance.now(); G.tick(1 / 60); tk.push(performance.now() - t);
        calls = 0; tris = 0; t = performance.now(); G.draw(); dr.push(performance.now() - t); fc = calls; ft = tris;
      }
      return { tick: +med(tk).toFixed(2), draw: +med(dr).toFixed(1), calls: fc, tris: ft, programs: R.info.programs?.length || 0, geos: R.info.memory.geometries, tex: R.info.memory.textures, loose: loose() };
    };
    const workshop = place();
    G.course.toDunes(); for (let i = 0; i < 60; i++) G.tick(1 / 60);
    const dunes = place();
    // the Great Dunemaw's bottom floor, standing in a hall when it has one (docs/plans/DUNEMAW.md's budget is for a hall: 60 draws, 120k triangles)
    const W = G.game.well; W.enter(); W.goTo(3); for (let i = 0; i < 30; i++) G.tick(1 / 60);
    const hall = W.cur.cells.find((c) => c.hall != null);
    if (hall) G.course.teleport(new G.THREE.Vector3(hall.x, hall.y + 2, hall.z), 0, { keepPool: true });
    for (let i = 0; i < 30; i++) G.tick(1 / 60);
    const well = place();
    if (window.gc) { gc(); gc(); } // (the live heap, not the live heap plus this run's garbage)
    return { workshop, dunes, well, heapMB: Math.round((performance.memory?.usedJSHeapSize || 0) / 1e6), lateProgs: (R.info.programs?.length || 0) - bootProgs, lateNames: (R.info.programs || []).filter((q) => !bootSet.has(q)).map((q) => q.name || q.type || '?') };
  });
  out.bootS = +bootS.toFixed(1);
} finally {
  await browser.close();
  await server.close();
}

// ---- compare
let base = null;
try { base = JSON.parse(fs.readFileSync(BASE, 'utf8')); } catch { /* none yet */ }
const fails = [], rows = [];
const cmp = (label, key, now, was, tol, budget) => {
  const d = was ? (now - was) / was : 0;
  const over = budget != null && now > budget;
  const moved = was != null && tol != null && d > tol;
  if (over) fails.push(`${label} ${key} ${now} is over the budget (${budget})`);
  if (moved) fails.push(`${label} ${key} ${now} is ${(d * 100).toFixed(0)}% above the baseline (${was})`);
  rows.push(`  ${(label + ' ' + key).padEnd(18)} ${String(now).padStart(9)}   ${was == null ? '' : `was ${String(was).padStart(8)}  ${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%`}${over || moved ? '   <-- ' : ''}`);
};
const WELL_BUDGET = { calls: 88, tris: 120000 }; // (a floor of the Great Dunemaw, standing in a hall: docs/plans/DUNEMAW.md. Measured 2026-10-06: 67 calls, 56,412 tris, the walls merged per set and the sand one mesh a floor; the budget is that with 20% to spare. Raised 80 to 88 on 2026-10-07: 79 to 85 measured, of which the Courier's belt is about 30 in every zone (the Veritome's rest bake 10, the Sondelass's 6, the Soul Brush's 6 at rest and 11 awake, the psygun's 2); rest bakes merged by material are the cut)
for (const p of ['workshop', 'dunes', 'well']) {
  const n = out[p], b = base?.[p] || {};
  for (const k of ['tick', 'draw', 'calls', 'tris', 'programs', 'geos', 'tex']) cmp(p, k, n[k], b[k], TOL[k], p === 'well' ? WELL_BUDGET[k] ?? BUDGET[k] : BUDGET[k]);
}
cmp('all', 'heapMB', out.heapMB, base?.heapMB, TOL.heapMB, BUDGET.heapMB);
cmp('all', 'bootS', out.bootS, base?.bootS, TOL.bootS, null);
console.log(`perf (${url}; SwiftShader: times are relative)${base ? `, against the baseline of ${base.when} (${base.build})` : ', no baseline yet'}:`);
console.log(rows.join('\n'));
// (not gated, but read at every review: programs compiled in play, and the big things no zone hides)
console.log(`  programs compiled after the warm-up: ${out.lateProgs}${base?.lateProgs != null ? ` (was ${base.lateProgs})` : ''}${out.lateProgs > (base?.lateProgs ?? out.lateProgs) ? '   <-- each is a hitch the first time it is drawn' : ''}${out.lateNames?.length ? ` (${out.lateNames.join(', ')})` : ''}`);
for (const p of ['workshop', 'dunes', 'well']) if (out[p].loose.length) console.log(`  drawn in every zone, from the ${p}: ${out[p].loose.join(', ')}`);
if (errs.length) { console.log(`page errors: ${errs.slice(0, 3).join(' | ')}`); fails.push('the page threw'); }
if (record) {
  const build = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { return '?'; } })();
  const { lateNames, ...keep } = out; fs.writeFileSync(BASE, JSON.stringify({ when: new Date().toISOString().slice(0, 16), build, ...keep, workshop: { ...keep.workshop, loose: undefined }, dunes: { ...keep.dunes, loose: undefined }, well: { ...keep.well, loose: undefined } }, null, 1) + '\n');
  console.log('baseline recorded');
}
console.log(fails.length ? `\nperf: OVER\n  ${fails.join('\n  ')}` : '\nperf: OK');
process.exit(fails.length && !record ? 1 : 0);
