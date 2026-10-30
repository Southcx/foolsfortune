// ---------------------------------------------------------------------------------------
// THE PERF CHECK: the other machine half of Petra's gate (docs/ARCHITECTURE.md, "The gate", "Budgets"). It starts its own dev server,
// opens the game headless in manual mode, and measures five standing places, the workshop, the Dunes, a hall of the Great Dunemaw's bottom floor, the Spirit Garden's gate and a crossing (the showcase crossing's chase leg), and the crossing's spectacle (a swarm of 48 and a leg's foes bursting into voxels): what a frame costs to simulate
// (tick: its middle, its 95th and its longest of 60 frames, the hitches) and to draw, how many draw calls and triangles a frame takes (every pass of the present counted), how many shader programs,
// geometries and textures are alive, the heap (the dev server's, and the built game's from dist/ over the same three places), and the boot. Then it holds the numbers against the last published build's
// (scripts/perf-baseline.json) and against the hard budgets, and says which moved.
//
// The software renderer (SwiftShader) is slow and its times are only good for comparison against themselves: what matters is the
// change, not the milliseconds. The counts (calls, triangles, programs) are exact and should not drift without a reason.
//
// Prior art: Unreal's `stat unit` and `stat scenerendering` (game, draw, GPU; draw calls and primitives), the frame budgets of console
// certification (a fixed cost per frame, checked on every build), and Chromium's perf bots (a recorded baseline, a tolerance, an alert).
//
// Only what a change can move is drawn again (the owner, 2026-10-25: "why are we not only running performance on chunks that have been
// affected by changes?"). The run keeps its last numbers in node_modules/.cache/perf.json with the commit and the dirty files' hashes they
// were taken at; the files changed since are mapped to the places they can move (SCOPE below: an area's own files its place, anything
// shared all of them), and a place nothing touched is carried from that run, marked "carried". The route is walked whole every time
// (its ticks are cheap and the heaps need it); what costs is SwiftShader's draws, 10 timed a place and 10 warm (20 timed until 2026-10-30,
// South's yes to the cut; 60 before that), and the built game's heap, read with 3 draws a place only when a build is recorded (--record,
// at publish) or asked for (--built): between publishes it is carried from the last reading. Two places drawn at once in two pages was
// weighed and not taken: SwiftShader's GPU process alone ran at 322% of the host's 400% (the census, 2026-10-30), so a second page buys
// at most a quarter and smears both pages' times. Prior art: every build system's incremental cache (make's mtimes, Bazel's content
// hashes), Chromium's perf bots bisecting only what a CL touched.
//
//   npm run perf              measure what changed since the last run, compare, exit 1 if a budget or a tolerance is broken
//   npm run perf -- --full    measure every place, whatever changed
//   npm run perf -- --only dunes,well   measure these places
//   npm run perf -- --plan    say what would be measured and why, and stop
//   npm run perf -- --draws crossing   list one frame's draws there by object and material (what a count's rise is made of)
//   npm run perf -- --built   read the built game's heap as well (dist/, after npm run build)
//   npm run perf -- --record  measure everything, the built game's heap too, and write today's numbers as the baseline (Petra, when a build is published)
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { createServer, preview } from 'vite';
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = path.join(ROOT, 'scripts', 'perf-baseline.json');
const record = process.argv.includes('--record'), builtWanted = record || process.argv.includes('--built');
const PLACES = ['workshop', 'dunes', 'well', 'garden', 'crossing', 'spectacle'];
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'perf.json');
const t00 = Date.now(), stage = {}; // (real seconds a stage took, said at the end: where a run's time goes)

// What a changed file can move. The first prefix that matches wins; a file under src/ that matches none is shared: every place.
// [] is a file no measured place draws (another area's own): the workshop is measured for it, for the boot's programs and heap.
const SCOPE = [
  [['docs/', 'tests/', 'source_assets/', 'scripts/sweeps/', 'scripts/stress', 'scripts/casino', 'scripts/economy', 'scripts/spreads', 'README', 'CLAUDE.md', '.claude/'], null], // (nothing the game runs)
  [['src/world/well/', 'src/vfx/dunemaw', 'src/creatures/jelly/', 'src/progress/combat/dunemaw'], ['well']],
  [['src/world/garden/', 'src/vfx/garden/', 'src/progress/garden', 'src/progress/harmony', 'src/progress/decor', 'src/progress/spiritlife', 'src/progress/mycelium', 'src/progress/seasons'], ['garden']],
  [['src/world/emocean/', 'src/progress/rail/', 'src/vfx/railfoes', 'src/vfx/railhazards', 'src/vfx/voxels/', 'src/vfx/shipkit/', 'src/vfx/crossinglook', 'src/vfx/railshots', 'src/vfx/refitsweep', 'src/vfx/railfoemarks', 'src/vfx/telegraph', 'src/vfx/bossparts', 'src/vfx/partcraze', 'src/courier/ship/', 'src/music/legs', 'src/ui/railreadout', 'src/ui/railresults'], ['crossing', 'spectacle']],
  [['src/world/dunes/', 'src/vfx/dunes/', 'src/creatures/wisp/'], ['dunes']],
  [['src/world/basement/', 'src/world/props/', 'src/world/level.js', 'src/world/testroom/', 'src/world/treasury'], ['workshop']],
  [['src/world/raceway/', 'src/vfx/raceway', 'src/world/bazaar/', 'src/vfx/bazaar', 'src/world/opensea/', 'src/vfx/opensea/', 'src/creatures/seaserpent/', 'src/world/duel/', 'src/vfx/duelview', 'src/progress/casino/', 'src/progress/duel/', 'src/world/emocean/margarite', 'src/workbench/'], []],
];
const scopeOf = (f) => {
  for (const [prefixes, places] of SCOPE) if (prefixes.some((x) => f.startsWith(x))) return places;
  return f.startsWith('src/') || f === 'index.html' || f.startsWith('vite') || f.startsWith('package') || f === 'scripts/perf.mjs' ? PLACES : null; // (other scripts: nothing the game runs)
};
const git = (a) => { try { return execSync(`git ${a}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };
const dirtyNow = () => { // ({ path: blob hash } of every file differing from HEAD, untracked ones too)
  const files = [...new Set([...git('diff --name-only HEAD').split('\n'), ...git('ls-files --others --exclude-standard').split('\n')].filter((f) => f && fs.existsSync(path.join(ROOT, f))))];
  const hashes = files.length ? git(`hash-object -- ${files.map((f) => `'${f}'`).join(' ')}`).trim().split('\n') : [];
  return Object.fromEntries(files.map((f, i) => [f, hashes[i]]));
};
const head = git('rev-parse HEAD').trim(), dirty = dirtyNow();
let cache = null;
try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { /* the first run */ }
const onlyArg = process.argv.find((a, i) => process.argv[i - 1] === '--only');
const drawsArg = (process.argv.find((a, i) => process.argv[i - 1] === '--draws') || '').split(',').filter(Boolean);
let want, why;
if (record || process.argv.includes('--full') || !cache?.commit || !git(`cat-file -t ${cache.commit}`).trim()) { want = new Set(PLACES); why = record ? 'recording' : cache ? 'full' : 'no last run kept'; }
else if (onlyArg || drawsArg.length) { want = new Set((onlyArg ? onlyArg.split(',') : drawsArg).filter((p) => PLACES.includes(p))); why = 'asked'; }
else {
  const changed = new Set(git(`diff --name-only ${cache.commit} HEAD`).split('\n').filter(Boolean));
  const hashOf = (f) => (fs.existsSync(path.join(ROOT, f)) ? git(`hash-object -- '${f}'`).trim() : null);
  for (const f of [...changed]) if (cache.dirty?.[f] && hashOf(f) === cache.dirty[f]) changed.delete(f); // (committed as it was measured dirty)
  for (const [f, h] of Object.entries(dirty)) if (cache.dirty?.[f] !== h) changed.add(f); // (dirty now, and not as it was measured)
  for (const f of Object.keys(cache.dirty || {})) if (!(f in dirty)) changed.add(f); // (dirty then, put back since)
  want = new Set();
  const moved = [];
  for (const f of changed) { const s = scopeOf(f); if (!s) continue; moved.push(f); (s.length ? s : ['workshop']).forEach((p) => want.add(p)); }
  for (const p of PLACES) if (!cache.out?.[p]) want.add(p); // (never measured: measured now)
  why = `${moved.length} file(s) that run changed since ${cache.commit.slice(0, 7)}${moved.length ? `: ${moved.slice(0, 6).join(', ')}${moved.length > 6 ? ', ...' : ''}` : ''}`;
}
console.log(`perf: measuring ${want.size ? [...want].join(', ') : 'nothing'} (${why})`);
if (process.argv.includes('--plan')) process.exit(0); // (what would be measured, and why: nothing run)
if (!want.size) { console.log('perf: OK (nothing the game runs changed since the last run; npm run perf -- --full to measure anyway)'); process.exit(0); }

// hard budgets (docs/ARCHITECTURE.md, "Budgets"): a sixth-generation console's frame, roughly
const BUDGET = { calls: 450, tris: 1_000_000, programs: 228, heapMB: 600, heapBuiltMB: 320 }; // (programs 216 -> 228, 2026-10-29, Petra on the program census of ff73ee8 against cba0d4f (216 -> 228, name by name): the duel's show, Calissa's (duel-cutin x2, duel-stamp x2, duel-slime for duel-clay), the numerals worn x2 (one material, two programs), the bracelet's wear x2, the class arts' looks, the palm die's sprite, the Pneuka Jar's body and one unnamed; none of this round's own (the pair specials, the Touchstone, the shoal's silhouette add none); all warmed, 19 compiled late as before. The doubled cut-in, stamp and numerals are Calissa's to fold, which would give 3 back) // (programs 212 -> 216, 2026-10-27, Petra on the program census at cba0d4f (216 in all): the programs made only by files new since 6dab822 are the open sea's looks, Calissa's: the mounts' slick, rings (three patched basics and a shader) and flash sprite, the drift bottle, the wind on the water, the akhlut's two, the gun ports; all warmed, 19 compiled late as before; the three ring basics are Calissa's to fold if they can be one; the ricochet preview's own LineDashed program gone) // (programs 202 -> 212, 2026-10-25, Petra on Calissa's reasons (docs/handoffs/petra/2026-10-25-from-calissa-perf.md): the aberrant's look on four bodies, the Pneuka Jar's look, the palm die, the dust devil, the Dunes' mirage, the footprint flourishes, the weather's impacts and lens drops, each its own chain; folding them is a uniform-mode ubershader, which the well measured at +127% draw on every pixel; measured on 6dab822: draw -35 to -42% against fe20e89, late compiles 20 (was 21), boot 69.7 s (was 100.6)) // (programs 200 -> 202, 2026-10-24, Petra: the round's merges since a0a7697 (184 files), +4 in every place, all warmed at boot, 21 compiled after as before; by name against a0a7697, one MeshStandardMaterial and two MeshBasicMaterial variants, two ShaderMaterials, the caster lightning now warmed on the route (the heat haze and the ostracon sparkle off it); an A/B of the two commits, one tree at a time on one host: draw +7 to +8%, tick +6 to +8%, boot the same; perf's +30 to 66% that day the host's, v264's own commit measured 46% slower than at its baseline) // (heapMB 500 -> 600 and heapBuiltMB 320 new, 2026-10-21, the owner's ruling through Dovina: the dev server's heap holds every module's source and grows with the code; what a player's page holds is the built game's, measured here since over the same route (vite preview of dist/, gc'd), about 270 MB when last read by hand) // (programs 196 -> 200, 2026-10-19, Petra: board v11's looks, the duel's view and the domains' clash, the aberrant wipe (a screen volume), the Soul Brush's desk; +4 in all four places (178 -> 182, the garden 195 -> 199), all warmed at boot, 17 compiled after as before (the garden's own); timings 5 to 20% under v226's) // (heapMB 485 -> 500, 2026-10-19, the owner's word, with the Spirit Garden built on its first entry instead of at boot: world/garden/realm.js build()) (programs 192 -> 196, heapMB 445 -> 485, 2026-10-18, Petra: the overlay's pieces (Calissa's tube, Sight, placard, tags, the Shrine gate's cradles, OVERLAY.md 15), cut to 3 programs of their own and the gate's 1, all warmed before play, 0 compiled after; the dev heap 480, the built game 312.5 -> 325 MB over the same route (vite preview, gc'd, b059d84 -> c77baa2, two runs each). Calls stay 450: the 12 over in the workshop are to be cut) (programs 191 -> 192, 2026-10-13, Petra: the bracelet batched into one body program (Calissa's), for 14 to 30 draw calls fewer a place) (heapMB 435 -> 445, 2026-10-13, Petra: the dev heap 436 with Dovina's SPINE and god powers (53 files, +2,400 lines of source); the built game measured 270 MB, gc'd) (programs 189 -> 191, 2026-10-13, Petra: the bracelet's glazes, charms, flash and aura (Calissa's vfx/bracelet*.js, the owner's BRACELET.md), warmed at boot) (programs 192 -> 189, 2026-10-13, Calissa's three folds: the rave's cones into the chests' beam, the map's lines into its fills, the Dunemaw's pool and maw one) (programs 184 -> 192, heapMB 415 -> 435, 2026-10-13, Petra: v176-v177's looks for the ten heavy shells and the Lantern Wisp, all warmed at boot (0 compiled after), 192 in all four places; the dev heap 428 with that round's source, the god hand's matter +1; measured at f7dbda4 and 2ed3be2) // (programs 177 -> 184, 2026-10-12, Petra: the caster shells' looks warmed at boot so none compiles in play (Calissa's vfx/shelllooks/warmup.js: late compiles 12 -> 1); measured 179 at the workshop's boot, 184 with five shells' looks alive; headless, not perf) // (programs 164 -> 177, 2026-10-12, Petra on the owner's word through Calissa, "the budget can be expanded": the caster shaders S1 to S10, vfx/caster/, 13 programs, all warmed, 0 compiled late) // (heap 395 -> 415, 2026-10-12, the owner: the paint map's kept copy, docs/plans/PAINT.md) // (programs 164 -> 165 at v138, Petra: the stain's program, every slick's (vfx/slicks.js), warmed at boot again; it was compiled in play at the first spill, a hitch the count did not see. Back to 164 at v139: Calissa's v137 folds, 163 measured, 0 compiled late) // (tris 350k -> 1M, 2026-10-12, Petra on the owner's word: the GPU idled at 88k on an RTX 3060 Ti; calls kept at 450, ~26 µs each on Firefox's CPU)
// // (heapMB 375 -> 395 at v137, Petra: the dev heap 369 -> 386 with the round's source (Calissa's 19 commits, the telegraphs, the lend panel, the save's shelves); the dev server's, not a player's)
// // (programs: each raise is a commit with its reason; docs/ARCHITECTURE.md)
// (heapMB is the DEV server's heap, which holds every module's source text and source map: it grows with the code, not only with what a
// player's page holds. v117: 345 here, 228 in the built game (vite preview, gc'd), up 5 from 223 before that round's merges; raised
// 340 -> 350 for that, Petra. v121: 359 here, 231 built (two boots, gc'd), +3 since v117; the rest the round's new modules' source
// (the rail's spline, the mycelium's world and sounds, the garden's looks): raised 350 -> 365, Petra.
// v122: Calissa's rail looks (the storm warp, the Umbral, the shots' rail-mark, the telegraph, the Itano ribbons) +5 programs (160 -> 165
// in the Dunes, the well and the garden) and +7 MB dev heap (built 232 to 238, +1 to +7): programs 164 -> 166, heapMB 365 -> 375, Petra;
// Calissa asked which two fold back. She folded five (161/163 at v123): programs back to 164. The built figure is the one to watch: see the casebook, 2026-10-08. programs 160 -> 164, v117: the
// ostracon's body and its sparkle (Calissa's black-figure sherd, vfx/ostracon.js), warmed at boot so neither is a hitch in play.)
// how far a number may move from the baseline before the gate asks why (counts are exact; times are a software renderer's, so looser)
const TOL = { calls: 0.08, tris: 0.08, programs: 0.06, geos: 0.1, tex: 0.1, heapMB: 0.12, tick: 0.25, tickP95: 0.35, draw: 0.25, bootS: 0.3 }; // (tickP95: the 95th of 60 frames, a hitch's measure, looser than the median; tickMax is shown, never gated: one frame is one GC)

const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5180, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
// (the calendar held at a calm game noon on Anagami: the hour and the weather are part of the picture, so every run measures the same one;
// CLOCK=now measures whatever the wall clock gives, CLOCK=<ms> another moment)
const CLOCK = process.env.CLOCK === 'now' ? null : process.env.CLOCK || 1791160275000;
// (the session's chance pinned as well: unseeded, the crossing's foes in frame at the measured bar differed by run, and its calls with
// them, 50 recorded against 65 and 66 read of the same code, one frame's draws identical by name; SEED=<n> measures another)
const SEED = process.env.SEED || 1;
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] }); // (gc before the heap is read: without it the reading is whatever garbage is lying about, ±10 MB a run)
let out = null, errs = [], built = null, stale = false;
const fails0 = [];
try {
  const GRAPHICS = process.env.GRAPHICS || 'high'; // (a fixed graphics tier: under 'auto' a software GL reads as Minimum, and the baseline is High's: render/graphics.js)
  const boot = async (at) => { // (a page opened on `at` in manual mode, booted, the title's overlay away)
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', (e) => errs.push(e.message));
    await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
    const t0 = Date.now();
    await page.goto(`${at}?graphics=${GRAPHICS}&seed=${SEED}${CLOCK ? `&clock=${CLOCK}` : ''}`, { waitUntil: 'commit' });
    for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    const bootS = (Date.now() - t0) / 1000;
    await page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
    return { page, bootS };
  };
  // (the route, run in the page: `full` false stops at the heap after the three places, which is all the built game is asked for)
  const measure = ({ full, want, draws = [] }) => {
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
    // (a draw is timed up to a 1-pixel readPixels: without the sync the timer read the GPU's queue, a cheap frame or a blocked one by
    // chance, not the frame; CASEBOOK rule 236, measured by Calissa 2026-10-18)
    const gl = R.getContext(), px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    // (a place not wanted is walked through and not drawn; the built game's is drawn 3 times, for its heap; a measured one draws 10 warm
    // frames of 40 and 10 timed of 60 ticks, every sixth: SwiftShader's draw is the run's cost, 1 to 2 real s a frame)
    const place = (key) => {
      G.game.areas?.settle(); // (every area not here let go now: a route walked without draws passes in real milliseconds, so a GRACE of real seconds never ran out and a place was measured with the last one's dressing still built)
      if (!full) { for (let i = 0; i < 40; i++) { G.tick(1 / 60); if (i % 13 === 0) G.draw(); } return null; }
      if (!want.includes(key)) { for (let i = 0; i < 40; i++) G.tick(1 / 60); return null; }
      for (let i = 0; i < 40; i++) { G.tick(1 / 60); if (i % 4 === 0) G.draw(); }
      sync();
      const tk = [], dr = [];
      let fc = 0, ft = 0;
      for (let i = 0; i < 60; i++) {
        let t = performance.now(); G.tick(1 / 60); tk.push(performance.now() - t);
        if (i % 6) continue;
        calls = 0; tris = 0; t = performance.now(); G.draw(); sync(); dr.push(performance.now() - t); fc = calls; ft = tris;
      }
      const st = tk.slice().sort((x, y) => x - y); // (the frame's worst as well as its middle: a hitch is a frame, Unreal's stat unitgraph, the benchmarks' 1% low)
      let byName = null;
      if (draws.includes(key)) { // (one more frame, its draws named: the object (or its parent) and the material)
        const rbd = R.renderBufferDirect, n = new Map(); byName = {};
        R.renderBufferDirect = function (cam, scn, geo, mat, obj, grp) { const k = `${obj.name || obj.parent?.name || obj.type}|${mat.name || mat.type}`; n.set(k, (n.get(k) || 0) + 1); return rbd.call(this, cam, scn, geo, mat, obj, grp); };
        G.draw(); R.renderBufferDirect = rbd;
        for (const [k, v] of [...n].sort((a, b) => b[1] - a[1])) byName[k] = v;
      }
      return { byName, tick: +med(tk).toFixed(2), tickP95: +st[Math.floor(st.length * 0.95)].toFixed(2), tickMax: +st[st.length - 1].toFixed(2), draw: +med(dr).toFixed(1), calls: fc, tris: ft, programs: R.info.programs?.length || 0, geos: R.info.memory.geometries, tex: R.info.memory.textures, loose: loose() };
    };
    const workshop = place('workshop');
    G.course.toDunes(); for (let i = 0; i < 60; i++) G.tick(1 / 60);
    const dunes = place('dunes');
    // the Great Dunemaw's bottom floor, standing in a hall when it has one (docs/plans/DUNEMAW.md's budget is for a hall: 60 draws, 120k triangles)
    const W = G.game.well; W.enter(); W.goTo(3); for (let i = 0; i < 30; i++) G.tick(1 / 60);
    const hall = W.cur.cells.find((c) => c.hall != null);
    if (hall) G.course.teleport(new G.THREE.Vector3(hall.x, hall.y + 2, hall.z), 0, { keepPool: true });
    for (let i = 0; i < 30 || (i < 600 && G.game.spawnLook?.runs?.length); i++) G.tick(1 / 60); // (the floor's creatures risen first: their crust's 15 draws were caught mid-rise or not by the tick count, the hall measured +17 calls on one run and not the next: vfx/spawnlook.js, measured by name 2026-10-27)
    const well = place('well');
    if (window.gc) { gc(); gc(); }
    const heapMB = Math.round((performance.memory?.usedJSHeapSize || 0) / 1e6); // (before the garden: the same three places the baseline measured)
    if (!full) return { heapMB };
    // the Spirit Garden, standing at the gate on the Dantian (Calissa's survey item 31: its planetoids, water, rain and plants)
    const Gm = G.game, Rm = Gm.realm;
    if (Rm) { Rm.enter(Gm.shrines?.get?.(Gm.shrines.last) || null); for (let i = 0; i < 200; i++) G.tick(1 / 60); Rm.setName?.('Siva Lon'); Gm.indexMenu?.close?.(); for (let i = 0; i < 30; i++) G.tick(1 / 60); }
    const garden = Rm?.active ? place('garden') : null;
    if (window.gc) { gc(); gc(); } // (the live heap, not the live heap plus this run's garbage)
    const heapGardenMB = Math.round((performance.memory?.usedJSHeapSize || 0) / 1e6);
    // a crossing: the showcase crossing's chase leg on the galleon, six bars in (the heaviest hull and the roster's chase foes, Calissa's
    // ship refit and rail foe bodies; DEBUG, which manual mode is). Last, so the heaps above stay the places the baseline measured
    const E = Gm.emocean;
    if (Rm?.active) { Rm.leave(); for (let i = 0; i < 120; i++) G.tick(1 / 60); }
    if (E?.sailShowcase?.('anagami', [])) {
      for (let i = 0; i < 240 && !E.stage.active; i++) G.tick(1 / 60);
      E.wound = () => {}; // (nothing it meets ends the run while it is measured)
      const L = E.trip?.layout?.legs?.[1];
      if (L) { E.t = (L.at + 6) * 1.5; for (let i = 0; i < 120; i++) G.tick(1 / 60); }
    }
    const crossing = E?.stage?.active ? place('crossing') ?? 'walked' : null;
    // the spectacle (RAIL-FLOW.md 10.4: measured before any cut): a swarm of 48 in frame and every other foe of the leg downed at once
    // into its voxels (Calissa's batch), the leg's own shots in flight
    let spectacle = null;
    if (crossing) {
      E.waves.spawn({ role: 'swarm', formation: 'river', count: 48, cls: 0 }, 0);
      for (let i = 0; i < 90; i++) G.tick(1 / 60);
      for (const f of [...E.waves.foes]) if (f.alive && f.form && f.form !== 'swarm') E.waves.strike(f, 1e6, { cause: 'shot' });
      spectacle = place('spectacle');
    }
    return { workshop, dunes, well, garden, crossing: crossing === 'walked' ? null : crossing, spectacle, heapMB, heapGardenMB, lateProgs: (R.info.programs?.length || 0) - bootProgs, lateNames: (R.info.programs || []).filter((q) => !bootSet.has(q)).map((q) => q.name || q.type || '?') };
  };
  let t = Date.now();
  const dev = await boot(url);
  stage.boot = (Date.now() - t) / 1000; t = Date.now();
  out = await dev.page.evaluate(measure, { full: true, want: [...want], draws: drawsArg });
  for (const p of drawsArg) if (out[p]?.byName) { const f = path.join(ROOT, 'node_modules', '.cache', `perf-draws-${p}.json`); fs.writeFileSync(f, JSON.stringify(out[p].byName, null, 1)); console.log(`perf: ${p}'s draws by name written to ${f}`); }
  for (const p of PLACES) if (out[p]) delete out[p].byName;
  stage.route = (Date.now() - t) / 1000;
  out.bootS = +dev.bootS.toFixed(1);
  await dev.page.close();
  // the built game's heap: dist/ (npm run build, which the gate runs first) served by vite preview, over the same three places, gc'd.
  // What a player's page holds; the dev heap above also holds every module's source text and source map
  const DIST = path.join(ROOT, 'dist', 'index.html');
  const carryBuilt = () => { if (cache?.out?.heapBuiltMB != null) { out.heapBuiltMB = cache.out.heapBuiltMB; out.carriedBuilt = true; } out.distAt = cache?.distAt; };
  if (!builtWanted) carryBuilt(); // (read at publish, or when asked: else the last reading, carried)
  else if (!fs.existsSync(DIST)) fails0.push('the built game: no dist/ (npm run build first)');
  else {
    const newest = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((m, e) => Math.max(m, e.isDirectory() ? newest(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).mtimeMs), 0);
    const distAt = fs.statSync(DIST).mtimeMs;
    if (!record && cache?.distAt === distAt && cache.out?.heapBuiltMB != null) carryBuilt(); // (the same dist/ as the last reading)
    else {
    if (newest(path.join(ROOT, 'src')) > distAt) stale = true;
    t = Date.now();
    built = await preview({ root: ROOT, logLevel: 'error', preview: { host: '127.0.0.1', port: 4180, strictPort: false } });
    const B = await boot(built.resolvedUrls.local[0]);
    out.heapBuiltMB = (await B.page.evaluate(measure, { full: false, want: [] })).heapMB;
    await B.page.close();
    stage.built = (Date.now() - t) / 1000;
    out.distAt = distAt;
    }
  }
} finally {
  await browser.close();
  await server.close();
  await built?.close();
}

// ---- carry what was not measured from the last run, and keep this one for the next
const carried = [];
for (const p of PLACES) if (!out[p] && !want.has(p) && cache?.out?.[p]) { out[p] = cache.out[p]; carried.push(p); }
if (carried.length) { out.lateProgs = cache.out.lateProgs; out.lateNames = cache.out.lateNames; } // (a place not drawn compiled nothing: the count is a whole run's)
// (the heaps are read after places drawn: one walked through undrawn holds less, so they are carried unless their places were all drawn)
if (['workshop', 'dunes', 'well'].some((p) => !want.has(p)) && cache?.out?.heapMB != null) { out.heapMB = cache.out.heapMB; carried.push('all'); }
if (!want.has('garden') && cache?.out?.heapGardenMB != null) out.heapGardenMB = cache.out.heapGardenMB;
if (!errs.length) { fs.mkdirSync(path.dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify({ commit: head, dirty, distAt: out.distAt, out })); }

// ---- compare
let base = null;
try { base = JSON.parse(fs.readFileSync(BASE, 'utf8')); } catch { /* none yet */ }
const fails = [...fails0], rows = [];
const cmp = (label, key, now, was, tol, budget) => {
  const d = was ? (now - was) / was : 0;
  const over = budget != null && now > budget;
  const moved = was != null && tol != null && d > tol;
  if (over) fails.push(`${label} ${key} ${now} is over the budget (${budget})`);
  if (moved) fails.push(`${label} ${key} ${now} is ${(d * 100).toFixed(0)}% above the baseline (${was})`);
  rows.push(`  ${(label + ' ' + key).padEnd(18)} ${String(now).padStart(9)}   ${was == null ? '' : `was ${String(was).padStart(8)}  ${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%`}${over || moved ? '   <-- ' : ''}${(carried.includes(label) && key !== 'bootS') || (label === 'garden' && key === 'heapMB' && !want.has('garden')) || (label === 'built' && out.carriedBuilt) ? '   (carried)' : ''}`);
};
const WELL_BUDGET = { calls: 96, tris: 400000 }; // (calls 88 -> 96, 2026-10-27, Petra: the hall reads 92 to 93 at the baseline's own commit 07ebaa5 today, the same 112 draws by name as at cba0d4f; the recorded 76 not reproduced: CASEBOOK-CASES 2026-10-27) // (tris 150k -> 400k, 2026-10-12, with the main budget: a hall's calls are the limit, not its triangles) // (raised 120k -> 150k at v137, Petra: the owner's 25 rooms on the bottom floor (was about 10) are all in view from a central hall, the walls drawn twice with their outline; the sand cut 32 -> 24 samples a room and the sets merged a quadrant at a time, 170k -> 140k measured.)
// (a floor of the Great Dunemaw, standing in a hall: docs/plans/DUNEMAW.md. Measured 2026-10-06: 67 calls, 56,412 tris, the walls merged per set and the sand one mesh a floor; the budget is that with 20% to spare. Raised 80 to 88 on 2026-10-07: 79 to 85 measured, of which the Courier's belt is about 30 in every zone (the Veritome's rest bake 10, the Sondelass's 6, the Soul Brush's 6 at rest and 11 awake, the psygun's 2); rest bakes merged by material are the cut)
for (const p of PLACES) {
  const n = out[p], b = base?.[p] || {}; if (!n) { fails.push(`${p}: not measured (the scene did not open)`); continue; }
  for (const k of ['tick', 'tickP95', 'tickMax', 'draw', 'calls', 'tris', 'programs', 'geos', 'tex']) if (n[k] != null) cmp(p, k, n[k], b[k], TOL[k], p === 'well' ? WELL_BUDGET[k] ?? BUDGET[k] : BUDGET[k]);
}
cmp('all', 'heapMB', out.heapMB, base?.heapMB, TOL.heapMB, BUDGET.heapMB);
cmp('garden', 'heapMB', out.heapGardenMB, base?.heapGardenMB, TOL.heapMB, null); // (the heap with the garden built too: watched, not budgeted yet)
if (out.heapBuiltMB != null) cmp('built', 'heapMB', out.heapBuiltMB, base?.heapBuiltMB, TOL.heapMB, BUDGET.heapBuiltMB); // (the built game's, the three places: a player's page)
cmp('all', 'bootS', out.bootS, base?.bootS, TOL.bootS, null);
console.log(`perf (${url}; SwiftShader: times are relative)${base ? `, against the baseline of ${base.when} (${base.build})` : ', no baseline yet'}:`);
console.log(rows.join('\n'));
if (stale) console.log('  the built game measured is older than src/: npm run build, then perf again, for its heap to be today\'s');
// (not gated, but read at every review: programs compiled in play, and the big things no zone hides)
console.log(`  programs compiled after the warm-up: ${out.lateProgs}${base?.lateProgs != null ? ` (was ${base.lateProgs})` : ''}${out.lateProgs > (base?.lateProgs ?? out.lateProgs) ? '   <-- each is a hitch the first time it is drawn' : ''}${out.lateNames?.length ? ` (${out.lateNames.join(', ')})` : ''}`);
for (const p of ['workshop', 'dunes', 'well', 'garden', 'crossing', 'spectacle']) if (out[p]?.loose.length) console.log(`  drawn in every zone, from the ${p}: ${out[p].loose.join(', ')}`);
if (errs.length) { console.log(`page errors: ${errs.slice(0, 3).join(' | ')}`); fails.push('the page threw'); }
if (record) {
  const build = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { return '?'; } })();
  const { lateNames, distAt, carriedBuilt, ...keep } = out; fs.writeFileSync(BASE, JSON.stringify({ when: new Date().toISOString().slice(0, 16), build, ...keep, workshop: { ...keep.workshop, loose: undefined }, dunes: { ...keep.dunes, loose: undefined }, well: { ...keep.well, loose: undefined }, garden: keep.garden && { ...keep.garden, loose: undefined }, crossing: keep.crossing && { ...keep.crossing, loose: undefined }, spectacle: keep.spectacle && { ...keep.spectacle, loose: undefined } }, null, 1) + '\n');
  console.log('baseline recorded');
}
console.log(fails.length ? `\nperf: OVER\n  ${fails.join('\n  ')}` : '\nperf: OK');
console.log(`  time: ${Object.entries(stage).map(([k, v]) => `${k} ${v.toFixed(0)} s`).join(', ')}, all ${((Date.now() - t00) / 1000).toFixed(0)} s${carried.length ? `; carried from the last run: ${carried.filter((p) => p !== 'all').join(', ')}` : ''}`);
process.exit(fails.length && !record ? 1 : 0);
