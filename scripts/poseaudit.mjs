// ---------------------------------------------------------------------------------------
// THE POSE AUDIT: the Courier's poses measured headless, in the real game (every layer, stance, IK pass, the hinge repair and rom.js as
// they run), for what CLAUDE.md forbids (Animation; Feel): a held tool through the body, a limb through the body, a joint past what a body
// does. Calissa's (the owner, 2026-10-11: "Clipping with other equipped tools is undesireable, but acceptable. Clipping with the body or
// breaking joints is not"). Re-runnable: the manifest of states (scripts/poseaudit.states.js) grows as moves are added, and the audit is
// run again over them.
//
//   npm run dev &   (or any server of this tree)
//   node scripts/poseaudit.mjs --url http://localhost:5173/ --set <sondelass|tools|locomotion|emotes|selftest|all> --out <dir>
//        [--only id,prefix*,...] [--every 2] [--seed 1] [--no-draw] [--list] [--fresh 60 (a new page every so many states)]
//   --set selftest   the measures against faults made on purpose (a cutlass turned into the chest, an arm swung through it, known joint
//                    turns): run it first after changing the measures; each prints PASS or FAIL
//   --only           states by id, or by prefix with a trailing * (`cutlass.*`, `emote.d*`); --every 2 measures every 2nd frame (half the
//                    time; a one-frame pop can be missed); --no-draw skips the sheets (the measures only, a third of the time)
//
// Writes into <dir>: <state>.json (the worst of each measure and its frame, the frames past each limit, the joints' ranges), <state>.jpg
// (a dirty state's worst frames, front and their right, every other tool off, the offence in red), overview.jpg (one tile a dirty state),
// summary.json, and calib.json (the proxies and the axes the rest pose gave). Prints one line a state. Exits 0 (a measure, not a gate).
// What is measured and how: scripts/poseaudit.page.js; the stepping and the sheets: scripts/poseaudit.run.js.
//
// Prior art: Unreal's Animation Insights and Pose Watch (the pose recorded per frame, scrubbed back to the worst), Unity's Animation
// Rigging debug draw and the ragdoll wizard's capsule per bone, the sweeps' harness (scripts/sweeps/harness.mjs: the page opened in manual
// mode with the clock pinned, CASEBOOK rule 3) and Calissa's melee rigs (the plans and the contact sheets this was lifted from).
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const args = Object.fromEntries(argv.reduce((a, x, i) => { if (x.startsWith('--')) a.push([x.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true]); return a; }, []));
const HERE = path.dirname(new URL(import.meta.url).pathname);
const URL0 = String(args.url || process.env.URL || 'http://127.0.0.1:5173/');
const SET = String(args.set || 'all'), EVERY = +(args.every || 1), SEED = +(args.seed || 1), DRAW = !args['no-draw'];
const OUT = path.resolve(String(args.out || path.join(process.cwd(), 'poseaudit-out')));
const ONLY = typeof args.only === 'string' ? args.only.split(',').map((s) => s.trim()).filter(Boolean) : null;
fs.mkdirSync(OUT, { recursive: true });

// every emote of courier/emotes.js (its EMOTES table's keys), so a new one is audited without a line in the manifest
const EMOTE_SRC = fs.readFileSync(path.join(HERE, '..', 'src', 'courier', 'emotes.js'), 'utf8');
const EMOTE_IDS = [...(EMOTE_SRC.split('export const EMOTES = {')[1] || '').split(/\n\};/)[0].matchAll(/^ {2}([a-z0-9_]+):\s*\{/gm)].map((m) => m[1]);

const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const launch = () => chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let browser = await launch();
const errors = [];

/** The game opened afresh (after a crash: in a new browser, three tries; a page that dies loading is most often the machine short of memory). */
async function reopen(page) {
  await page?.close().catch(() => {}); await browser.close().catch(() => {});
  for (let k = 0; ; k++) {
    try { browser = await launch(); return await openPage(); } catch (e) { await browser.close().catch(() => {}); if (k >= 2) throw e; console.log(`  (the page would not open: ${String(e.message).split('\n')[0]}; again)`); }
  }
}
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  await page.goto(`${URL0}?seed=${SEED}&clock=${process.env.CLOCK || 1791160275000}`, { waitUntil: 'commit' }); // (a game noon: CASEBOOK rule 3)
  let ready = false;
  for (let i = 0; i < 180 && !ready; i++) { await new Promise((r) => setTimeout(r, 1000)); ready = await page.evaluate('!!window.__ready').catch(() => false); }
  if (!ready) throw new Error(`the game did not load at ${URL0} in 180 real seconds`);
  await page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; });
  await page.evaluate((ids) => { window.__paEmotes = ids; }, EMOTE_IDS);
  for (const f of ['poseaudit.page.js', 'poseaudit.run.js', 'poseaudit.states.js']) await page.addScriptTag({ path: path.join(HERE, f) });
  // (warmed: the clips decoded and the programs compiled before the first state, so its first frames are not the loader's)
  await page.evaluate(async () => { await __game.game.clipPack?.social; for (let i = 0; i < 90; i++) __game.tick(1 / 60); __game.draw(); });
  return page;
}

let page = await openPage();
const states = await page.evaluate(() => window.__paStates.map((s) => ({ id: s.id, set: s.set, label: s.label || '' })));
const pick = states.filter((s) => (SET === 'all' || SET.split(',').includes(s.set)) && (!ONLY || ONLY.some((o) => (o.endsWith('*') ? s.id.startsWith(o.slice(0, -1)) : s.id === o))));
if (args.list) { for (const s of pick) console.log(`${s.set.padEnd(11)} ${s.id.padEnd(34)} ${s.label}`); await browser.close(); process.exit(0); }
const calib = await page.evaluate(() => __pa.calib());
fs.writeFileSync(path.join(OUT, 'calib.json'), JSON.stringify(calib, null, 1));
console.log(`pose audit: ${pick.length} states (${SET}${ONLY ? `, only ${ONLY.join(',')}` : ''}), every ${EVERY} frame(s), into ${OUT}`);
console.log(`  proxies: ${calib.proxies.length} capsules; the rest pose: palm vs the elbow's hinge ${calib.axes.R.palmVsHinge}° (R), the elbow's hinge vs forearm X ${calib.axes.R.hingeFVsLocalX}°, the knee's vs shin X ${calib.axes.R.hingeSVsLocalX}°`);

const dataFile = (url, f) => fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
const summary = [], tiles = [], t0 = Date.now();
// (a fresh page every FRESH states, and a state whose page crashed run once more on a fresh one: SwiftShader's page has crashed after 150
//  or so states, its memory never all given back)
const FRESH = +(args.fresh || 60);
let since = 0;
const runOne = (id) => page.evaluate(({ id, every, draw }) => __paRun.run(window.__paStates.find((x) => x.id === id), { every, draw }), { id, every: EVERY, draw: DRAW });
for (const s of pick) {
  let out = null;
  if (since >= FRESH) { page = await reopen(page); since = 0; }
  for (let attempt = 0; attempt < 2 && !out; attempt++) {
    try { out = await runOne(s.id); since++; } catch (e) {
      const msg = String(e.message || e).split('\n')[0], crashed = /closed|crash|Target/i.test(msg);
      if (crashed) { page = await reopen(page); since = 0; }
      if (!crashed || attempt) { console.log(`ERROR ${s.id}: ${msg}`); summary.push({ state: s.id, set: s.set, verdict: 'error', error: msg }); break; }
    }
  }
  if (!out) continue;
  const r = out.result, file = s.id.replace(/[^a-z0-9_.-]+/gi, '_');
  fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(r, null, 1));
  if (out.sheet) dataFile(out.sheet, path.join(OUT, `${file}.jpg`));
  if (out.tile) tiles.push(out.tile);
  const tw = r.tool?.worst, lw = r.limb?.worst, jw = Object.entries(r.joints || {}).filter(([, j]) => j.over?.length).map(([n, j]) => `${n} ${j.worst}${j.worst > j.limit + calib.limits.jointSlack ? '' : '~'}`); // (~: within the slack)
  summary.push({ state: r.state, set: r.set, verdict: r.verdict, error: r.error, checks: r.checks, held: Object.keys(r.tool?.held || {}), toolCm: tw?.cm ?? null, toolPart: tw?.part ?? null, toolFrame: tw?.frame ?? null, limbCm: lw?.cm ?? null, limb: lw ? `${lw.limb}>${lw.part}` : null, limbFrame: lw?.frame ?? null, joints: jw, offences: r.offences, ms: r.ms });
  for (const k of r.checks || []) console.log(`  ${k.ok ? 'PASS' : 'FAIL'} ${r.state}: ${k.id}  ${JSON.stringify(k.what)}`);
  console.log(`${r.verdict.toUpperCase().padEnd(10)} ${r.state.padEnd(34)} tool ${tw ? `${String(tw.cm).padStart(5)} cm ${tw.part}@f${tw.frame}` : '     -'.padEnd(12)}  limb ${lw ? `${lw.cm} cm ${lw.limb}>${lw.part}@f${lw.frame}` : '-'}  joints ${jw.length ? jw.join(', ') : '-'}${r.error ? `  [${r.error}]` : ''}  (${r.measured} frames, ${(r.ms / 1000).toFixed(1)} s)`);
}
if (tiles.length) dataFile(await page.evaluate(({ t, title }) => __paRun.overview(t, title), { t: tiles, title: `The pose audit (${SET}): the worst frame of each of ${tiles.length} dirty states, front, every other tool off; the offence in red` }), path.join(OUT, 'overview.jpg'));
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ set: SET, every: EVERY, limits: calib.limits, states: summary, pageErrors: [...new Set(errors)].slice(0, 20) }, null, 1));
const n = (v) => summary.filter((x) => x.verdict === v).length;
console.log(`\n${summary.length} states: ${n('clean')} clean, ${n('marginal')} marginal (a joint just past its limit), ${n('dirty')} dirty, ${n('error')} errors, ${n('unmeasured')} unmeasured; ${((Date.now() - t0) / 1000).toFixed(0)} real seconds; page errors ${errors.length}. Out: ${OUT}`);
await browser.close();
process.exit(0);
