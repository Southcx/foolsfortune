// Stress-test the movement: random human-shaped input from teleports all over the workshop,
// with invariants checked every step (tools/stress.page.js). Exits non-zero on any violation.
//
//   npm i --no-save playwright          (once; the runner is not part of the shipped game)
//   npm run dev &                        (or: URL=http://host:port/ )
//   node tools/stress.mjs [--seed 1] [--runs 24] [--ticks 900] [--pairs] [--only "on lift0,cp M1"]
//
// --pairs runs every pair of techs alone (the rest switched off): the interference matrix.
import { chromium } from 'playwright';
import fs from 'fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => {
  if (x.startsWith('--')) a.push([x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return a;
}, []));
const seed = +args.seed || 1, runs = +args.runs || 24, ticks = +args.ticks || 900;
const only = args.only ? JSON.stringify(String(args.only).split(',').map((x) => x.trim())) : 'null'; // e.g. --only "on lift0,on shuttle,cp M1"
const url = process.env.URL || 'http://127.0.0.1:5173/';
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text().slice(0, 300)); });
await page.addInitScript(() => { Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
await page.goto(url, { waitUntil: 'commit' });
for (let i = 0; i < 90; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
await page.evaluate(`document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; __game.manual = true;`);
await page.addScriptTag({ content: fs.readFileSync(new URL('./stress.page.js', import.meta.url), 'utf8') });

const t0 = Date.now();
let bad = 0;
if (args.pairs) {
  const res = await page.evaluate(`__stress.pairs({ seed: ${seed}, runs: ${Math.max(2, Math.floor(runs / 8))}, ticks: ${ticks} })`);
  for (const r of res) {
    const n = Object.values(r.violations).reduce((a, b) => a + b, 0);
    bad += n;
    console.log(`${n ? 'FAIL' : 'ok  '} ${r.techs.padEnd(24)} ${r.ticks} ticks${n ? '  ' + JSON.stringify(r.violations) : ''}`);
  }
} else {
  const res = await page.evaluate(`__stress.run({ seed: ${seed}, runs: ${runs}, ticks: ${ticks}, only: ${only}, trace: ${args.trace ?? -1} })`);
  bad = Object.values(res.counts).reduce((a, b) => a + b, 0);
  console.log(`${res.runs} runs, ${res.ticks} ticks, seed ${seed}: ${bad} violation${bad === 1 ? '' : 's'}`);
  console.log(`controller clips caught and corrected: ${res.clips}`);
  console.log('techs started:', JSON.stringify(res.techs));
  console.log('events:', JSON.stringify(res.events));
  if (bad) { console.log(JSON.stringify(res.counts)); for (const v of res.violations.slice(0, 15)) console.log(' ', JSON.stringify(v)); }
  if (res.trace) for (const t of res.trace) console.log('trace', JSON.stringify(t));
  if (res.notes.length) console.log('notes (no progress in 6 s):', JSON.stringify(res.notes.slice(0, 5)));
}
if (errors.length) { console.log('page errors:', [...new Set(errors)].slice(0, 8)); bad += errors.length; }
console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s)`);
await browser.close();
process.exit(bad ? 1 : 0);
