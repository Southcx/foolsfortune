// ---------------------------------------------------------------------------------------
// THE VFX GALLERY: the library's effects shot headless on a stage of their own (scripts/vfxgallery/: a renderer, a ground, a 1.8 m
// capsule, a sky, the game's glow and grade, a Vfx on the workbench's shim), never the whole game, laid on one contact sheet: a row an
// effect that matches, a column a time of its life (stepped from its play by a fixed 1/60 s, its chance seeded by its name: the same
// frames every run), each cell labelled; and each effect's frame at the middle time at the device's full resolution beside it. A held
// effect is stopped at the last column's time. One look, never a tune-and-rerun loop (CLAUDE.md, Subagents); what a player will see is
// still checked in the game at the device's resolution (CLAUDE.md, Scope).
//
//   node scripts/vfxgallery.mjs --match kit.demo [--size 1920x1080 | --phone] [--times 0.08,0.25,0.5,0.9]
//        [--ctx '{"feeling":"fury","domain":"psychokinesis","suit":"wands"}'] [--out <dir>] [--lines 480 | 0] [--tier high|low|minimum]
//        [--dir 1,0,0] [--body side|center|none]
//   --match   substrings (comma between), or /a regex/, against the library's names
//   --phone   896 x 414 CSS px at 2x (1792 x 828), the low tier (South's phone held on its side)
//   --lines   the game's 480 lines on the short side, scaled up (default), or 0 for the device's own
//   --out     where the sheet and the frames go (default: the system's temp dir, vfxgallery/); the sheet's path is printed
//   --ctx '{"at":[0,0.9,0]}'   where it plays (an aura at a body's middle, with --body center); each line prints the draws it adds
// Prior art: the workbench's EFFECTS stage (workbench/workbench.js), the map dress's shot (scripts/mapdress-shot.mjs), a film's dailies.
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2), opt = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (!a.startsWith('--')) continue; const k = a.slice(2), v = argv[i + 1]; if (v === undefined || v.startsWith('--')) opt[k] = true; else { opt[k] = v; i++; } }
const match = opt.match || 'kit.demo';
const phone = !!opt.phone;
const [w, h] = phone ? [896, 414] : String(opt.size || '1920x1080').split('x').map(Number), dpr = phone ? 2 : 1;
const times = String(opt.times || '0.08,0.25,0.5,0.9').split(',').map(Number).filter((x) => x >= 0).sort((a, b) => a - b);
const ctx = JSON.parse(opt.ctx || '{"feeling":"fury","domain":"psychokinesis","suit":"wands"}');
const out = path.resolve(opt.out || path.join(os.tmpdir(), 'vfxgallery'));
const lines = opt.lines === undefined ? 480 : +opt.lines, tier = opt.tier || (phone ? 'low' : 'high');
const dir = String(opt.dir || '1,0,0').split(',').map(Number), body = opt.body || 'side';
const slug = (s) => s.replace(/[^a-z0-9.]+/gi, '_').replace(/^_|_$/g, '').slice(0, 60) || 'all';
const OW = w * dpr, OH = h * dpr;

const t0 = Date.now();
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5230, strictPort: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];
try {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  page.on('pageerror', (e) => errs.push(`page: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
  await page.goto(`${url}scripts/vfxgallery/index.html?w=${w}&h=${h}&dpr=${dpr}&lines=${lines}&tier=${tier}&body=${body}`);
  await page.waitForFunction(() => window.__gallery?.ready, null, { timeout: 180000 });
  const names = await page.evaluate((m) => window.__gallery.names(m), match);
  if (!names.length) throw new Error(`no effect in the library matches "${match}"`);
  if (names.length > 60) console.warn(`${names.length} effects match: only the first 60 are shot`);
  const shot = names.slice(0, 60), mid = Math.floor(times.length / 2);
  const title = `vfxgallery · ${match} · ${OW}x${OH}${lines ? ` · ${lines} lines` : ' · native'} · ${tier} · ctx ${JSON.stringify(ctx)} · t = ${times.join(', ')} s`;
  await page.evaluate((a) => window.__gallery.begin(a), { rows: shot.length, cols: times.length, title });
  for (const [row, name] of shot.entries()) {
    const r = await page.evaluate((a) => window.__gallery.shoot(a), { name, row, times, ctx, dir, mid });
    const f = path.join(out, `${slug(name)}@${times[mid]}s-${OW}x${OH}.png`);
    if (r.single) fs.writeFileSync(f, Buffer.from(r.single.split(',')[1], 'base64'));
    console.log(`  ${name.padEnd(36)} ${String(r.layers).padStart(2)} layers${r.held ? ', held' : ''}  +${r.calls} draws  ${r.ms} ms  -> ${f}`);
  }
  const sheet = await page.evaluate(() => window.__gallery.sheet());
  const sf = path.join(out, `sheet-${slug(match)}-${OW}x${OH}.png`);
  fs.writeFileSync(sf, Buffer.from(sheet.split(',')[1], 'base64'));
  const progs = await page.evaluate(() => window.__gallery.programs());
  console.log(`\ncontact sheet: ${sf}  (${shot.length} effects x ${times.length} times, ${((Date.now() - t0) / 1000).toFixed(1)} s; ${progs.length} programs on the stage, ${progs.filter((n) => /vfx-shape/.test(n)).length} of them the shape layers')`);
} finally {
  await browser.close(); await server.close();
}
if (errs.length) { console.error(`\n${errs.length} page error(s):\n${[...new Set(errs)].slice(0, 20).join('\n')}`); process.exitCode = 1; }
