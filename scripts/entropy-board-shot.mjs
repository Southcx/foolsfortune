// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' BOARD VIEW, SHOT: the board view (src/vfx/entropy/boardview.js) headless, seated at the Entropy room's stone for a
// practice game, on the desk (1280 x 720) and the phone (an iPhone XR held landscape, 896 x 414 at 2x, its renderer stubbed to "Apple GPU"
// so it boots the phone's tier). Version 2 (ENTROPY-TACTICS.md 8): the hand rigged with an ace, a court card and a 5 and a tile set to 20,
// then shots of the start, a hover tip on a lit tile, the ace's 1 or 11 as plates, the tile turned at 21, the carve's plates, the bomb's
// phase with the die thrown, the token advanced over a turn, and the result after many moves (yours the coach's suggestion). One look, never a
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
    const shot = (name) => page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`), timeout: 180000 });
    // helpers in the page: a piece's place on the screen, a move by the coach's label, a phase
    await page.evaluate(() => {
      const g = __game.game, s = g.entropyRoom.session, B = () => g.entropyLook.board, V3 = __game.THREE.Vector3;
      window.__at = (id) => {
        if (id.startsWith('c:')) { const e = B().cards.get(+id.slice(2)); if (!e) return null; const v = e.mesh.getWorldPosition(new V3()); return { x: v.x, y: -v.y }; }
        let v; if (id.startsWith('t:')) { const [x, z] = id.slice(2).split('.').map(Number); v = g.entropyLook.tiles.top(x, z); } else v = B().bomb.core.getWorldPosition(new V3());
        v.project(g.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
      };
      window.__phase = () => (window.__mine() ? s.S.phase : 'wait');
      window.__move = (re) => { const c = s.coach(), m = c?.moves?.find((x) => re.test(x.label)); if (!m) return null; s.move(m.move); return m.label; };
      // a hand for the look: an ace, a court card and a number swapped in from the deck, and a tile next to yours set to 20 so the ace makes 21
      window.__rig = () => {
        const S = s.S, H = S.hand[0], D = S.deck[0], P = S.pending[0], want = [(c) => c >> 2 === 0, (c) => c >> 2 >= 11 && (c & 3) === 2, (c) => (c >> 2) + 1 === 5];
        want.forEach((ok, i) => { const j = D.findIndex(ok); if (j < 0 || i >= H.length) return; const old = H[i]; H[i] = D[j]; D[j] = old; const m = P?.moves?.find((x) => x.card === old); if (m) m.card = H[i]; });
        S.tiles[5 * 7 + 2].s = 20; return H.slice();
      };
    });
    for (let i = 0; i < 80 && (await page.evaluate(() => window.__phase())) !== 'play'; i++) await step(10);
    report[Z.id].hand = await page.evaluate(() => window.__rig());
    await step(20);
    await shot('start');
    if (Z.id === 'desk') {
      // a number card onto a tile: the 5, hovered over a lit tile (the tip)
      report[Z.id].five = await page.evaluate(() => window.__move(/Play the 5 /));
      await step(8);
      const t5 = await page.evaluate(() => window.__at('t:3.5')); await page.mouse.move(t5.x, t5.y); await step(10);
      await shot('hover');
      await page.mouse.click(t5.x, t5.y); await step(6); await page.mouse.move(5, 5);
      // the ace: its 1 or 11 offered as plates on the tile set to 20
      report[Z.id].ace = await page.evaluate(() => window.__move(/Play the Ace/));
      await step(8);
      const t2 = await page.evaluate(() => window.__at('t:2.5')); await page.mouse.click(t2.x, t2.y); await step(8);
      await shot('ace');
      report[Z.id].turned = await page.evaluate(() => window.__move(/as 1: 21/));
      await step(12);
      await shot('turned');
      // the court card as a token on your back rank
      report[Z.id].court = await page.evaluate(() => window.__move(/as a token/));
      await step(6); report[Z.id].placed = await page.evaluate(() => window.__move(/Token at/)); await step(20);
      report[Z.id].done = await page.evaluate(() => window.__move(/Done playing/)); await step(10);
      // the carve: a card clicked, its keep, feed and discard as plates
      const card = await page.evaluate(() => { const c = __game.game.entropyRoom.session.S.hand[0][0]; return c == null ? null : window.__at(`c:${c}`); });
      if (card) { await page.mouse.click(card.x, card.y); await step(6); }
      await shot('carve');
      await page.mouse.move(5, 5);
      for (let i = 0; i < 8 && (await page.evaluate(() => window.__phase())) === 'carve'; i++) { await page.evaluate(() => window.__move(/^Keep|^Feed/)); await step(4); }
      await step(36);
      report[Z.id].bomb = await page.evaluate(() => { const S = __game.game.entropyRoom.session.S; return { phase: S.phase, roll: S.ctx?.roll, counter: S.counter }; });
      await shot('bomb');
      await page.evaluate(() => window.__move(/Push the bomb|Count it down/)); await step(30);
      // over their turn to yours: the token advanced
      for (let i = 0; i < 80 && (await page.evaluate(() => window.__phase())) === 'wait'; i++) await step(10);
      await step(20);
      report[Z.id].advanced = await page.evaluate(() => __game.game.entropyRoom.session.S.tokens.map((t) => ({ owner: t.owner, suit: t.suit, rank: t.rank, x: t.x, z: t.z })));
      await shot('advanced');
      // many moves, to the end
      for (let i = 0; i < 1500; i++) {
        const st = await page.evaluate(() => { const s = __game.game.entropyRoom.session; if (s.done) return 'done'; if (window.__mine()) { window.__playOne(); return 'mine'; } return 'wait'; });
        if (st === 'done') break;
        await step(st === 'mine' ? 2 : 12);
      }
      await step(40);
      report[Z.id].end = await page.evaluate(() => { const s = __game.game.entropyRoom.session; return { done: s.done, result: s.T.game.result(s.S), tokens: s.S.tokens.length, log: s.S.log.length }; });
      await shot('result');
      report[Z.id].leave = await page.evaluate(() => { const g = __game.game, s = g.entropyRoom.session; s.close(); window.__step(4); return { on: g.entropyLook.board.on, etb: !!document.getElementById('etb'), cls: document.getElementById('indexmenu')?.className, fov: g.camera.fov }; });
    } else {
      await page.evaluate(() => window.__move(/Play the 5 /)); await step(12);
      await shot('place');
    }
    await ctx.close();
  }
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
