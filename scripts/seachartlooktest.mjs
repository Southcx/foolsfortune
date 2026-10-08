// ---------------------------------------------------------------------------------------
// THE SEA CHART'S LOOK, HEADLESS (ui/seachart/, vfx/rutter.js; Calissa's; casebook rules 96 and 97): Dovina's real sea charts and
// portents drawn at every tier, scale and look; what a portent hides moving no pixel (one waypoint at a time, its type, strength and a
// dim star's feeling scrambled, the canvas compared); the canvases a long session keeps staying flat; the SeaChartCanvas picking each
// waypoint at the scales a window gives; the rutter built, opened and let go. One PASS/FAIL line a check. Dev server up (URL=...).
//
//   URL=http://127.0.0.1:5173/ node scripts/seachartlooktest.mjs
//
// Prior art: scripts/seacharttest.mjs (the window's checks) and a differential test (draw twice, change only what must not matter).
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';

const base = process.env.URL || 'http://127.0.0.1:5173/', exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--js-flags=--expose-gc'] });
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${typeof info === 'string' ? info : JSON.stringify(info)}`); };
const open = async (w = 1280, h = 720, dpr = 1) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { window.__cv = []; const mk = document.createElement.bind(document); document.createElement = (t, o) => { const el = mk(t, o); if (String(t).toLowerCase() === 'canvas') window.__cv.push(new WeakRef(el)); return el; }; });
  await page.route('**/__seachartlook.html', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body style="margin:0"></body>' })); // (a blank page of the dev server's origin, so /src/ modules import)
  await page.goto(`${base}__seachartlook.html`);
  return { page, errors, close: () => ctx.close() };
};

const A = await open();
const imp = 'const P = await import("/src/progress/econ/passage.js"), S = await import("/src/ui/seachart/seachart.js");';

// 1. every tier, scale and look, over the real generator
const r1 = await A.page.evaluate(`(async () => { ${imp}
  const isl = ['margarite', 'anagami', 'entra'], out = { drawn: 0, thrown: [], tiers: {} }, canvas = document.createElement('canvas');
  for (const from of isl) for (const to of isl) { if (from === to) continue;
    for (let day = 0; day < 4; day++) for (const danger of [-1, 2]) for (const casks of [0, 8]) {
      const chart = P.seaChart({ from, to, day, danger, distance: 6 + Math.abs(isl.indexOf(from) - isl.indexOf(to)) * 2, casks, leviathan: day % 2 === 0, bounty: day % 3 === 0 });
      for (const [sight, level] of [[0.35, 1], [1, 1], [1.62, 99]]) for (const atCol of [-1, 1]) {
        const portents = {}; for (const w of Object.values(chart.waypoints)) if (w.col > atCol) { const p = P.portent(chart, w, w.col - atCol, sight, level); portents[w.id] = p; out.tiers[p.tier] = (out.tiers[p.tier] || 0) + 1; }
        for (const look of ['crude', 'ink']) for (const scale of [1, 2, 3]) { try { S.drawSeaChart(canvas, chart, { scale, look, t: day * 1.7, portents, drafted: atCol < 0 ? [] : [chart.first[0]], trumpOf: () => 'trumps', ghost: P.lanes(chart)[0], drift: [chart.edges[0]], classOf: P.classOf }); out.drawn++; } catch (e) { out.thrown.push(e.message); } }
      } } }
  return out; })()`);
check('every tier, scale and look draws over the real sea charts', r1.thrown.length === 0 && r1.drawn > 2000 && ['exact', 'two', 'three', 'class', 'star'].every((t) => r1.tiers[t]), { drawn: r1.drawn, tiers: r1.tiers, thrown: r1.thrown.slice(0, 3) });

// 2. what a portent hides moves no pixel
const r2 = await A.page.evaluate(`(async () => { ${imp}
  const ca = document.createElement('canvas'), cb = document.createElement('canvas'), tally = {}; let leaks = 0, n = 0;
  for (const [from, to] of [['margarite', 'entra'], ['anagami', 'entra'], ['anagami', 'margarite']]) for (let day = 0; day < 6; day++) {
    const chart = P.seaChart({ from, to, day, danger: 1, distance: 8, casks: 4, leviathan: day % 2 === 0, bounty: day % 3 === 0 });
    for (const [sight, level] of [[0.35, 1], [1, 1], [1.62, 99]]) {
      const portents = {}; for (const w of Object.values(chart.waypoints)) portents[w.id] = P.portent(chart, w, w.col + 1, sight, level);
      const opt = { scale: 1, t: 0, portents, drafted: [], trumpOf: (a, b) => ((a.length * 7 + b.length) % 3 ? null : 'trumps'), classOf: P.classOf };
      S.drawSeaChart(ca, chart, opt); const D = ca.getContext('2d').getImageData(0, 0, ca.width, ca.height).data;
      for (const w of Object.values(chart.waypoints)) { const p = portents[w.id]; if (p.tier === 'exact') continue;
        const scr = JSON.parse(JSON.stringify(chart)), q = scr.waypoints[w.id]; q.type = P.classOf(q.type) === 'boss' ? 'shoal' : 'leviathan'; q.strength = (q.strength + 2) % 5; if (p.tier === 'star') q.feel = q.feel === 'dread' ? 'wonder' : 'dread';
        S.drawSeaChart(cb, scr, opt); const E = cb.getContext('2d').getImageData(0, 0, cb.width, cb.height).data; n++; tally[p.tier] = (tally[p.tier] || 0) + 1;
        for (let i = 0; i < D.length; i += 4) if (Math.abs(D[i] - E[i]) + Math.abs(D[i + 1] - E[i + 1]) + Math.abs(D[i + 2] - E[i + 2]) > 6) { leaks++; break; } } } }
  return { leaks, n, tally }; })()`);
check('a waypoint\'s hidden type, strength and (dim star) feeling move no pixel anywhere', r2.leaks === 0 && r2.n > 500, r2);

// 2b. the icons' class table is kept in step with Dovina's pool: every type has an emblem and the class she gives it
const r2b = await A.page.evaluate(`(async () => { ${imp}
  const I = await import("/src/ui/seachart/icons.js"), bad = [];
  for (const [type, t] of Object.entries(P.PASSAGE.types)) if (!I.EMBLEMS[type] || I.EMBLEMS[type].cls !== t.cls) bad.push(type + ':' + (I.EMBLEMS[type]?.cls ?? 'no emblem') + ' vs ' + t.cls);
  return { bad, types: Object.keys(P.PASSAGE.types).length }; })()`);
check('every waypoint type of passage.js has an emblem and the same class in the icons', r2b.bad.length === 0, r2b);

// 3. the canvases a long session keeps stay flat (80 sea charts, two looks, at 2x)
const r3 = await A.page.evaluate(`(async () => { ${imp}
  const mpx = () => { let a = 0; for (const w of window.__cv) { const c = w.deref(); if (c) a += c.width * c.height; } return a / 1e6; };
  const gc = async () => { for (let i = 0; i < 4; i++) { globalThis.gc(); await new Promise((r) => setTimeout(r, 40)); } };
  const c = document.createElement('canvas'), draw = (from, to) => { for (let day = from; day < to; day++) { const chart = P.seaChart({ from: 'margarite', to: 'entra', day, danger: 1, distance: 8 }), portents = {}; for (const w of Object.values(chart.waypoints)) portents[w.id] = P.portent(chart, w, w.col + 1, 1, 1); S.drawSeaChart(c, chart, { scale: 2, portents, classOf: P.classOf }); S.drawSeaChart(c, chart, { scale: 2, look: 'ink', portents, classOf: P.classOf }); } };
  draw(100, 130); await gc(); const a = mpx(); draw(130, 210); await gc(); return { a: +a.toFixed(2), b: +mpx().toFixed(2) }; })()`);
check('80 more sea charts keep no more canvas pixels (under 3 Mpx more)', r3.b - r3.a < 3, r3);

// 4. SeaChartCanvas: the scale a window gives, a pick on every waypoint, the loop stopping with the page
await A.close();
const dom = [];
for (const [w, h, dpr, want] of [[854, 480, 1, 1], [1920, 1080, 1, 2], [1920, 1080, 2, 4]]) {
  const B = await open(w, h, dpr);
  dom.push([w, h, dpr, want, await B.page.evaluate(`(async () => { ${imp}
    document.body.style.cssText = 'margin:0;background:#2a140d'; const win = document.createElement('div'); win.style.cssText = 'width:min(720px, calc(100% - 24px));padding:18px 22px'; document.body.appendChild(win);
    const chart = P.seaChart({ from: 'margarite', to: 'entra', day: 3, danger: 1, distance: 8, casks: 4 }), portents = {}; for (const w of Object.values(chart.waypoints)) portents[w.id] = P.portent(chart, w, w.col + 1, 1, 1);
    const sc = new S.SeaChartCanvas({}); win.appendChild(sc.canvas); sc.set(chart, { portents, classOf: P.classOf }); await new Promise((r) => setTimeout(r, 300));
    const rect = sc.canvas.getBoundingClientRect(), k = rect.width / S.CHART_SIZE.w, at = S.layout(chart), wrong = [];
    for (const [id, p] of Object.entries(at)) { const got = sc.pick(rect.left + p.x * k, rect.top + p.y * k); if (got !== id) wrong.push(id + '>' + got); }
    let frames = 0; const d = sc.draw.bind(sc); sc.draw = (...a) => { frames++; return d(...a); }; sc.canvas.remove(); await new Promise((r) => setTimeout(r, 400));
    return { scale: sc.scale(), wrong, framesAfterRemoved: frames, devicePx: rect.width * devicePixelRatio }; })()`), B.errors]);
  await B.close();
}
for (const [w, h, dpr, want, r, errors] of dom) check(`SeaChartCanvas at ${w}x${h} @${dpr}: scale ${want}, every waypoint picked, the loop stops with the page`, r.scale === want && r.wrong.length === 0 && r.framesAfterRemoved === 0 && errors.length === 0, r);

// 5. the rutter: built, opened, let go
const C = await open();
const r5 = await C.page.evaluate(`(async () => { ${imp}
  const R = await import("/src/vfx/rutter.js"), chart = P.seaChart({ from: 'margarite', to: 'entra', day: 3, danger: 1, distance: 8, casks: 4 }), ids = []; let id = chart.first[0]; while (id) { ids.push(id); id = P.next(chart, id)[0]; }
  const rutter = { from: 'margarite', to: 'entra', day: 3, passage: ids, legs: ids.map((i) => chart.waypoints[i].type), feels: ids.map((i) => chart.waypoints[i].feel), stormsAt: ids.filter((i) => chart.waypoints[i].storm), rank: 'S', read: 0.5 };
  const out = {}; for (const [name, o] of [['alone', {}], ['with its chart', { chart }]]) { const b = new R.Rutter({ rutter, ...o }); for (const k of [0, 0.5, 1]) b.open(k); let g = 0; b.group.traverse((m) => { if (m.geometry) g++; }); out[name] = g; b.dispose(); }
  const t = R.rutterThing(); t.dispose(); out.spread = R.rutterSpread(rutter, { chart }).width; out.noStrength = R.chartOfRutter(rutter).waypoints[ids[0]].strength === null; out.strength = R.chartOfRutter({ ...rutter, strengths: ids.map(() => 3) }).waypoints[ids[0]].strength; return out; })()`);
check('a rutter builds alone and with its chart, opens, spreads and is let go; a strength it was not told is none, not a default', r5.alone > 5 && r5['with its chart'] === r5.alone && r5.spread === 1024 && r5.noStrength && r5.strength === 3 && C.errors.length === 0, { ...r5, errors: C.errors.slice(0, 2) });
await C.close();
await browser.close();
console.log(fails ? `sea chart look: ${fails} FAILED` : 'sea chart look: all passed'); process.exitCode = fails ? 1 : 0;
