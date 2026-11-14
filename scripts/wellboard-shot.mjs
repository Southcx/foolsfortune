// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD, SHOT: the board's draft page (src/world/well/board/) headless, on the desk (1280 x 720) and the phone (896 x 414
// at 2x, touch), driven through the session's own moves: the first turn with a die picked (its reach ringed), a floor waiting, a
// fork, and the run's end played out by the bot. Prints what each shot's decision was and any page error.
//
// Prior art: scripts/entropy-shot.mjs (the boot, the manual frame).
//
//   node scripts/wellboard-shot.mjs [out dir] [seed]
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
const errs = [], said = {};
try {
  for (const Z of SIZES) {
    const ctx = await browser.newContext(Z.ctx), page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`${Z.id}: ${e.message}`));
    await page.addInitScript(() => { window.__noPrime = true; Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } }); });
    await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000&firstdraws=0`, { waitUntil: 'commit' });
    for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    const step = (js) => page.evaluate(([js, seed]) => {
      const G = __game, g = G.game, B = g.wellBoard; const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      const r = (0, eval)(`(function (g, B, seed) { ${js} })`)(g, B, seed); G.tick(1 / 30); G.draw();
      const P = B.pending(); return { did: r, kind: P?.kind, at: B.readout()?.at, done: B.done, last: B.last };
    }, [js, seed]);
    const shot = async (name) => { await page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`) }); };
    said[`${Z.id}.open`] = await step('B.open({ seed }); B.hover = 8; B.render();'); await shot('1-pick');
    // play by rule until a floor waits, then until a fork, shooting each once
    const until = (kind) => step(`for (let i = 0; i < 200 && !B.done; i++) { const P = B.pending(); if (P.kind === '${kind}') return i; const m = P.kind === 'throw' ? P.moves.find((x) => x.id === 'throw') : P.kind === 'floor' ? { id: 'clear' } : P.moves[0]; B.take(m); } return -1;`);
    said[`${Z.id}.floor`] = await until('floor'); await shot('2-floor');
    said[`${Z.id}.fork`] = await until('fork'); await shot('3-fork');
    said[`${Z.id}.end`] = await until('none'); await shot('4-end');
    await ctx.close();
  }
} finally { await browser.close(); await server.close(); }
console.log(JSON.stringify({ out, said, errs }, null, 1));
