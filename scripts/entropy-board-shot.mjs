// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' BOARD VIEW, SHOT: the board view (src/vfx/entropy/boardview.js) headless, seated at the Entropy room's stone for a
// practice game, on the desk (1280 x 720) and the phone (an iPhone XR held landscape, 896 x 414 at 2x, its renderer stubbed to "Apple GPU"
// so it boots the phone's tier). Shots: the start of your turn with the hand, a hover tip on a lit tile, the bomb's phase with the die
// thrown, and the result's plate after many moves (yours the coach's first or suggested choice, the bot's its own). One look, never a
// tune-and-rerun loop (CLAUDE.md, Subagents).
//
// Prior art: scripts/wavepool-shot.mjs (the phone's boot, the manual frame, shots saved for a look).
//
//   node scripts/entropy-board-shot.mjs [out dir]      (default: the OS temp dir; prints what it saw as JSON)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'entropy-board-')));
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5199, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const SIZES = [{ id: 'desk', ctx: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, apple: false, q: '' }, { id: 'phone', ctx: { ...devices['iPhone XR landscape'] }, apple: true, q: '&firstdraws=0' }];
const report = {}, errs = [];
try {
  for (const Z of SIZES) {
    const ctx = await browser.newContext(Z.ctx), page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`${Z.id}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`${Z.id} console: ${m.text().slice(0, 300)}`); });
    await page.addInitScript((apple) => {
      window.__noPrime = true;
      Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
      if (apple) for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) { const gp = P.getParameter; P.getParameter = function (k) { return k === 0x9246 ? 'Apple GPU' : k === 0x9245 ? 'Apple Inc.' : gp.call(this, k); }; }
    }, Z.apple);
    await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000${Z.q}`, { waitUntil: 'commit' });
    for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    report[Z.id] = await page.evaluate(async () => {
      const G = __game, g = G.game;
      const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      g.course.goRoom('entropy');
      let f = 0; do { G.tick(1 / 30); if (!g.seam?.covering) G.draw(); f++; if (f % 5 === 0) await new Promise((q) => setTimeout(q, 0)); } while ((g.seam?.busy || !g.entropyRoom?.built) && f < 1500);
      for (let i = 0; i < 20; i++) G.tick(1 / 30);
      const R = g.entropyRoom; R.sit(); const s = R.session; s.play(true);
      // the frame as main.js would run it while the seat's page holds the game
      window.__step = (n = 1) => { for (let i = 0; i < n; i++) G.tick(1 / 30); G.draw(); }; // (the seat's page is modal: the frame runs the room's tickModal itself, boot/frame.js)
      window.__mine = () => { const P = s.T.game.pending(s.S); return !!P && P.seat === 0 && !s.done; };
      window.__playOne = (prefer) => { const c = s.coach(); if (!c?.moves?.length) return null; const m = (prefer && c.moves.find(prefer)) || c.moves.find((x) => x.best) || c.moves[0]; s.move(m.move); return m.label; };
      for (let i = 0; i < 90; i++) window.__step();
      return { frames: f, built: R.built, where: s.where, phase: s.S?.phase, on: g.entropyLook?.board?.on, tier: g.graphics?.tier, mobile: !!g.graphics?.machine?.mobile };
    });
    const step = (n) => page.evaluate((n) => window.__step(n), n);
    // until it is your play phase
    for (let i = 0; i < 60 && !(await page.evaluate(() => window.__mine() && __game.game.entropyRoom.session.S.phase === 'play')); i++) await step(10);
    await step(20);
    await page.screenshot({ path: path.join(out, `${Z.id}-start.png`), timeout: 180000 });
    if (Z.id === 'desk') {
      // play the hand into a summon if it can (its place phase lights tiles), then hover a lit tile
      const did = await page.evaluate(() => window.__playOne((m) => /Summon/.test(m.label)) || null);
      await step(20);
      const at = await page.evaluate(() => {
        const g = __game.game, B = g.entropyLook.board, id = [...B.lit.keys()].find((k) => k.startsWith('t:')) || 'bomb';
        const v = id === 'bomb' ? B.bomb.core.getWorldPosition(new (__game.THREE.Vector3)()).project(g.camera) : (() => { const [x, z] = id.slice(2).split('.').map(Number); return g.entropyLook.tiles.top(x, z).project(g.camera); })();
        return { id, x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
      });
      report[Z.id].hover = { did, at };
      if (at) { await page.mouse.move(at.x, at.y); await step(12); }
      await page.screenshot({ path: path.join(out, `${Z.id}-hover.png`), timeout: 180000 });
      await page.mouse.move(5, 5);
      // on to your bomb phase
      for (let i = 0; i < 40; i++) {
        const ph = await page.evaluate(() => { const s = __game.game.entropyRoom.session; return window.__mine() ? s.S.phase : 'wait'; });
        if (ph === 'bomb') break;
        if (ph === 'wait') await step(10); else { await page.evaluate(() => window.__playOne((m) => /End actions|Keep|Place/.test(m.label))); await step(4); }
      }
      await step(24);
      report[Z.id].bomb = await page.evaluate(() => { const S = __game.game.entropyRoom.session.S; return { phase: S.phase, roll: S.ctx?.roll, counter: S.counter }; });
      await page.screenshot({ path: path.join(out, `${Z.id}-bomb.png`), timeout: 180000 });
      // many moves, to the end
      for (let i = 0; i < 900; i++) {
        const st = await page.evaluate(() => { const s = __game.game.entropyRoom.session; if (s.done) return 'done'; if (window.__mine()) { window.__playOne(); return 'mine'; } return 'wait'; });
        if (st === 'done') break;
        await step(st === 'mine' ? 2 : 12);
      }
      await step(30);
      report[Z.id].end = await page.evaluate(() => { const s = __game.game.entropyRoom.session; return { done: s.done, result: s.T.game.result(s.S), tokens: s.S.tokens.length, log: s.S.log.length }; });
      await page.screenshot({ path: path.join(out, `${Z.id}-result.png`), timeout: 180000 });
      // stand up: the camera handed back and the page put away
      report[Z.id].leave = await page.evaluate(() => { const g = __game.game, s = g.entropyRoom.session; s.close(); window.__step(4); return { on: g.entropyLook.board.on, etb: !!document.getElementById('etb'), cls: document.getElementById('indexmenu')?.className, fov: g.camera.fov }; });
    }
    await ctx.close();
  }
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
