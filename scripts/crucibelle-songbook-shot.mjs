// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGBOOK, SHOT: the Crucibelle's own UI by the Lachrimeter (src/vfx/crucibellesongbook.js) headless at the desk's full
// resolution (1920 x 1080, deviceScaleFactor 1): the bell drawn, a few notes played and THE LULLABY half matched (5 4 3, the 3 a chord),
// some fever; then in the combat recital, strummed and the feedback held. Each shot whole and the panel cropped; the songbook's state
// and any page error printed as JSON. One look, never a tune-and-rerun loop (CLAUDE.md, Subagents).
//
// Prior art: scripts/entropy-shot.mjs and the sweeps' harness (the boot, the manual frame, the keys pressed through the input).
//
//   node scripts/crucibelle-songbook-shot.mjs [out dir]      (default: the OS temp dir)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'songbook-')));
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5231, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errs = [], report = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 300)}`); });
  await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
  await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000`, { waitUntil: 'commit' });
  for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
  await page.evaluate(async () => {
    document.getElementById('overlay').style.display = 'none'; __game.input.enabled = true; await document.fonts.ready;
    window.__k = (code, hold = 2) => { const I = __game.input; I.pressed.add(code); I.down.add(code); for (let i = 0; i < hold; i++) __game.tick(1 / 60); I.down.delete(code); __game.tick(1 / 60); };
    window.__t = (n) => { for (let i = 0; i < n; i++) __game.tick(1 / 60); };
    const g = __game.game; g.belt.equip('crucibelle', 'main', { quiet: true }); __t(6); __k('KeyX'); __t(120);
    g.lachryma.value = g.lachryma.max * 0.4;
  });
  const look = async (name) => {
    const st = await page.evaluate(() => { for (let i = 0; i < 20; i++) { __game.tick(1 / 60); __game.draw(); } const g = __game.game, B = g.crucibelleSongbook, C = g.player.techs.get('crucibelle'); return { state: B.state, read: B.read(), bells: { gameCrucibelleIsTheCouriers: g.crucibelle === g.player.techs.get('crucibelle'), feedbackOn: !!C?.recital?.play?.feedbackOn } }; });
    report[name] = st;
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    await page.screenshot({ path: path.join(out, `${name}-panel.png`), clip: { x: 1920 - 1000, y: 1080 - 420, width: 1000, height: 420 } });
  };
  // a few notes: 1 2 (no song), a pause, then 5 4 3 (the 3 a chord, RMB held): THE LULLABY half matched
  await page.evaluate(async () => {
    const I = __game.input, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    __k('Digit1'); await wait(500); __t(10); __k('Digit7'); await wait(3500); __t(10); // (a long pause: the bell begins its motif again)
    __k('Digit5'); await wait(450); __t(8); __k('Digit4'); await wait(450); __t(8);
    I.down.add('Mouse2'); __k('Digit3'); I.down.delete('Mouse2'); __t(3);
    __game.game.player.techs.get('crucibelle').fever = 0.55;
  });
  await look('songbook-lullaby-half');
  // the combat recital: Q, strums, then LMB held into the feedback
  await page.evaluate(async () => {
    const I = __game.input, wait = (ms) => new Promise((r) => setTimeout(r, ms)), g = __game.game;
    g.lachryma.value = g.lachryma.max; __k('KeyQ'); __t(40); // (the pool full: the feedback drinks it)
    for (let i = 0; i < 3; i++) { __k('Mouse0'); await wait(780); __t(6); }
    I.down.add('Mouse0'); I.pressed.add('Mouse0'); __t(80); // (held past the strum: the feedback)
    I.down.add('Mouse2'); __t(40); // (RMB on it: the whammy)
    g.player.techs.get('crucibelle').fever = 0.85;
  });
  await look('songbook-recital');
  await page.evaluate(() => { __game.input.down.delete('Mouse0'); __game.input.down.delete('Mouse2'); });
  await ctx.close();
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify({ out, errs, report }, null, 1));
