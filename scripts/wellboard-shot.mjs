// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, SHOT: the board's draft page (src/world/well/board/) headless, on the desk (1280 x 720) and the phone (896 x 414
// at 2x, touch), driven through the session's own moves on the view's fixed clock: the first turn with a die picked (its reach ringed), the die in
// the air, the Jar mid-walk, landed, the second floor, and the run's end. Prints what each shot's decision was and any page error.
//
// Prior art: scripts/entropy-shot.mjs (the boot, the manual frame).
//
//   node scripts/wellboard-shot.mjs [out dir] [seed] [quick]   (quick: no run to the end, the phone's first four only)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'wellboard-'))), seed = +(process.argv[3] || 7);
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5198, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) && fs.statSync(exe).isFile() ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const SIZES = [{ id: 'desk', ctx: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 } }, { id: 'phone', ctx: { ...devices['iPhone XR landscape'] } }];
const errs = [], said = {}, quick = process.argv[4] === 'quick';
try {
  for (const Z of SIZES) {
    const ctx = await browser.newContext(Z.ctx), page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`${Z.id}: ${e.message}`));
    await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
    await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000&firstdraws=0`, { waitUntil: 'commit' });
    for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    // one step: a little of the session's own API, then the view's beats played out on a fixed clock (`frames`: only so many, for a shot mid-beat)
    const step = (js, frames = 0) => page.evaluate(async ([js, seed, frames]) => {
      const G = __game, g = G.game, B = g.wellBoard; const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      const r = (0, eval)(`(function (g, B, seed) { ${js} })`)(g, B, seed); B.view.fixedDt = 1 / 30;
      for (let i = 0; i < (frames || 600); i++) { G.draw(); if (!frames && !B.view.busy && i > 20) break; if (i % 20 === 0) await new Promise((q) => setTimeout(q, 0)); }
      const P = B.pending(); return { did: r, kind: P?.kind, at: B.readout()?.at?.id, busy: B.view.busy, active: B.view.active, owner: !!B.view.jar?.userData?.owner, done: B.done };
    }, [js, seed, frames]);
    const shot = async (name) => { await page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`) }); };
    const PLAY = `const P = B.pending(); const m = P.kind === 'throw' ? P.moves.find((x) => x.id === 'throw') : P.kind === 'floor' ? { id: 'clear' } : P.moves[0]; B.take(m);`;
    said[`${Z.id}.open`] = await step('B.open({ seed }); B.hover = 8; B.render();'); await shot('1-pick');
    said[`${Z.id}.throw`] = await step("B.take({ id: 'throw', sides: 8 });", 16); await shot('2-throw');
    said[`${Z.id}.walk`] = await step('', 34); await shot('3-walk');
    said[`${Z.id}.landed`] = await step(''); await shot('4-landed');
    if (quick && Z.id === 'phone') { await ctx.close(); continue; }
    for (let i = 0; i < 60; i++) { const s = await step(`if (B.done) return 'done'; ${PLAY}`); said[`${Z.id}.last`] = s; if (s.at?.startsWith('1.') || s.done) break; }
    await step('B.hover = 12; B.render();'); await shot('5-floor2');
    if (!quick) { for (let i = 0; i < 200; i++) { const s = await step(`if (B.done) return 'done'; ${PLAY}`); said[`${Z.id}.end`] = s; if (s.done) break; } await shot('6-end'); }
    await ctx.close();
  }
} finally { await browser.close(); await server.close(); }
console.log(JSON.stringify({ out, said, errs }, null, 1));
