// ---------------------------------------------------------------------------------------
// ENTROPY TACTICS' BOARD VIEW, SHOT: the board view (src/vfx/entropy/boardview.js) headless, seated at the Entropy room's stone for a
// practice game, on the desk (1280 x 720) and the phone (an iPhone XR held landscape, 896 x 414 at 2x, its renderer stubbed to "Apple GPU"
// so it boots the phone's tier). Version 2.1 (ENTROPY-TACTICS.md 8.12), you as the Tower (`/arcana tower`): tokens of all four suits and
// both owners set into the state (a headless probe), the hand rigged with the 5 of wands (attuned: 4, 5 or 6), the bank at 4; then shots of
// the start (the Tower in the corner), the 5 of wands dropped on a tile (its values as plates), the Lightning striking, a meeting played
// (the winner's health ticking down), and the phone's start. The pointer moved by real mouse events on the canvas. One look, never a
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
    page.on('pageerror', (e) => errs.push(`${Z.id}: ${e.message} ${e.stack?.split('\n').slice(0, 3).join(' | ')}`));
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) errs.push(`${Z.id}: navigated ${f.url()}`); });
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
      const R = g.entropyRoom; R.update(0); g.chat?.run?.('/arcana tower'); R.sit(); const s = R.session; s.play(true); // (you as the Tower: /arcana, 8.12)
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
        let v; if (id.startsWith('t:')) { const [x, z] = id.slice(2).split('.').map(Number); v = g.entropyLook.tiles.top(x, z); } else if (id === 'die:0') v = B().dice[0].pos.clone(); else v = B().bomb.core.getWorldPosition(new V3());
        v.project(g.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
      };
      window.__phase = () => (window.__mine() ? s.S.phase : 'wait');
      window.__move = (re) => { const c = s.coach(), m = c?.moves?.find((x) => re.test(x.label)); if (!m) return null; s.move(m.move); return m.label; };
      // the look's probe: an ace, a court card (wands), a 5 and a 9 swapped in from the deck; tiles beside yours at 14 and 20; tokens of every suit
      window.__rig = () => {
        const S = s.S, H = S.hand[0], D = S.deck[0], P = S.pending[0], want = [(c) => c === 19, (c) => c >> 2 >= 11 && (c & 3) === 3, (c) => (c >> 2) + 1 === 5 && (c & 3) !== 3, (c) => (c >> 2) + 1 === 9]; // (the 5 of wands first: the Tower's suit, attuned)
        want.forEach((ok, i) => { const j = D.findIndex(ok); if (j < 0 || i >= H.length) return; const old = H[i]; H[i] = D[j]; D[j] = old; for (const m of P?.moves || []) { if (m.card === old) m.card = H[i]; if (m.feed === old) m.feed = H[i]; } });
        S.tiles[5 * 7 + 2].s = 20; S.tiles[5 * 7 + 3].s = 14;
        const tok = (owner, suit, rank, x, z, hp) => S.tokens.push({ id: S.nextTok++, owner, card: (10 + rank) * 4 + suit, suit, rank, speed: rank, x, z, hp: hp ?? rank * 3, max: rank * 3 });
        tok(0, 0, 1, 0, 4); tok(0, 1, 2, 5, 3, 4); tok(0, 2, 3, 6, 5); tok(1, 3, 4, 4, 2, 7); tok(1, 1, 1, 1, 1); tok(1, 2, 2, 2, 2); tok(1, 0, 3, 5, 2);
        S.bank[0] = 4; const c0 = H[0]; s.move({ card: c0 }); s.move({ back: true }); // (the play step laid again: the Lightning now affordable, the rigged cards' moves fresh)
        return H.slice();
      };
    });
    for (let i = 0; i < 80 && (await page.evaluate(() => window.__phase())) !== 'play'; i++) await step(10);
    report[Z.id].hand = await page.evaluate(() => window.__rig());
    await step(30);
    await shot('start');
    const card = (re) => page.evaluate((src) => { const s = __game.game.entropyRoom.session, re = new RegExp(src); const c = s.S.hand[0].find((x) => re.test(String(x >> 2))); return c == null ? null : { c, at: window.__at(`c:${c}`) }; }, re.source);
    const glide = async (to, n = 6) => { for (let i = 1; i <= n; i++) { const p = await page.evaluate(() => window.__mouse || { x: 0, y: 0 }); await page.mouse.move(p.x + ((to.x - p.x) * i) / n, p.y + ((to.y - p.y) * i) / n); await page.evaluate((q) => { window.__mouse = q; }, { x: p.x + ((to.x - p.x) * i) / n, y: p.y + ((to.y - p.y) * i) / n }); await step(2); } };
    const grab = async (re) => { const k = await card(re); if (!k) return null; await page.mouse.move(k.at.x, k.at.y); await page.evaluate((q) => { window.__mouse = q; }, k.at); await step(2); await page.mouse.down(); await glide({ x: k.at.x, y: k.at.y - 60 }, 3); return k.c; };
    const over = async (id) => { const t = await page.evaluate((i) => (i === 'die:0' ? __game.game.entropyLook.board.corners.dieScreen() : window.__at(i)), id); await glide(t, 8); await step(14); return t; };
    if (Z.id === 'desk') {
      report[Z.id].cls = await page.evaluate(() => __game.game.entropyRoom.session.S.cls);
      // an attuned card: the 5 of wands dropped on the 14, its 4, 5 and 6 as plates
      report[Z.id].attuned = await grab(/^4$/);
      await over('t:3.5'); await page.mouse.up(); await page.mouse.move(640, 8); await step(8);
      report[Z.id].plates = await page.evaluate(() => [...document.querySelectorAll('#etb .pick .pl')].map((e) => e.textContent));
      await shot('attuned-plates');
      await page.evaluate(() => { const b = document.querySelectorAll('#etb .pick .pl'); b[b.length - 1]?.click(); }); await step(16);
      // the Tower's Lightning: every token but its own wands hit for 3
      report[Z.id].lightning = await page.evaluate(() => window.__move(/Lightning/)); await step(4); await shot('lightning');
      await step(30);
      // a meeting: your sword walks into their cup; the winner pays the loser's power
      report[Z.id].meet = await page.evaluate(async () => {
        const g = __game.game, S = g.entropyRoom.session.S, T = await import('/src/progress/casino/entropy/tokens.js'), Rr = await import('/src/progress/casino/entropy/rules.js');
        const before = S.tokens.map((t) => [t.id, t.owner, t.suit, t.hp]); T.advanceTokens(S, 0, Math.random, { R: Rr.ENTROPY_RULES, lose: Rr.lose, hurt: Rr.hurt, moveBomb: Rr.moveBomb });
        return { before, after: S.tokens.map((t) => [t.id, t.owner, t.suit, t.hp]), log: S.log.slice(-6) };
      });
      await step(7); await shot('meeting');
    }
    await ctx.close();
  }
} catch (e) { console.log('FAILED', e.message.split('\n').slice(0, 8).join(' | '), '\n', [...new Set(errs)].slice(0, 12).join('\n  ')); process.exitCode = 1; } finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
