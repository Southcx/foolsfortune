// ---------------------------------------------------------------------------------------
// THE ENTROPY ROOM, SHOT: the Entropy room's look (src/vfx/entropy/: the void, the oasis, the tiles, the tilt-shift) headless, on the desk
// (1280 x 720) and the phone (an iPhone XR held landscape, 896 x 414 at 2x, its renderer stubbed to "Apple GPU" so it boots the phone's
// tier, first draws unbudgeted). Shots: standing on the oasis looking at the board; seated, mid-cascade and after; a tile turned over
// mid-turn; the tilt-shift from the board's camera (world/entropy/entropyroom.js CAMERA); seated with the bomb's countdown at 30 and
// at 7; two Arcana's portraits stood before the camera at t and t + 1 real s, then one struck and low (portraits.js). It measures the draw calls with the look and the
// programs it compiled. One look, never a tune-and-rerun loop (CLAUDE.md, Subagents).
//
// Prior art: scripts/wavepool-shot.mjs (the phone's boot, the manual frame, the measures).
//
//   node scripts/entropy-shot.mjs [out dir]      (default: the OS temp dir; prints the measures as JSON)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'entropy-')));
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
      const G = __game, g = G.game, R = G.renderer;
      const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      const before = new Set(R.info.programs.map((p) => p.cacheKey));
      g.course.goRoom('entropy');
      let f = 0; do { G.tick(1 / 30); if (!g.seam?.covering) G.draw(); f++; if (f % 5 === 0) await new Promise((q) => setTimeout(q, 0)); } while ((g.seam?.busy || !g.entropyRoom?.built || !g.entropyLook?.attached) && f < 1500);
      for (let i = 0; i < 20; i++) G.tick(1 / 30);
      G.draw();
      const fresh = R.info.programs.filter((p) => !before.has(p.cacheKey)).map((p) => p.name).filter((n) => /entropy/.test(n));
      return { frames: f, built: !!g.entropyRoom?.built, attached: !!g.entropyLook?.attached, tier: g.graphics?.tier, mobile: !!g.graphics?.machine?.mobile, programs: fresh };
    });
    // the camera by hand (a pose in the room's local metres), a frame drawn and measured, then the shot
    const shot = async (name, pose, pre = '') => {
      const m = await page.evaluate(([pose, pre]) => {
        const G = __game, g = G.game, THREE = G.THREE, R = G.renderer, ER = g.entropyRoom, X = { x: -1500, y: 200, z: -3000 };
        if (pre) (0, eval)(pre);
        const cam = g.camera; if (pose) { cam.position.set(X.x + pose.p[0], X.y + pose.p[1], X.z + pose.p[2]); cam.rotation.set(pose.pitch, pose.yaw || 0, 0, 'YXZ');
        if (pose.fov) { cam.fov = pose.fov; } cam.updateProjectionMatrix(); cam.updateMatrixWorld(); } // (no pose: the board view's own camera)
        const im = document.getElementById('indexmenu'); if (im) im.style.visibility = 'hidden';
        for (let i = 0; i < 3; i++) G.draw(); // (the programs linked before the measured frame: a program still compiling is skipped)
        R.info.autoReset = false; R.info.reset(); G.draw(); const o = { calls: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true;
        return { name, ...o, seated: !!ER?.session?.open, shift: +(g.entropyLook?.shift?.k ?? 0).toFixed(2) };
      }, [pose, pre]);
      (report[Z.id].views ||= []).push({ ...m, name });
      await page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`) });
    };
    const tick = (n, dt = 1 / 30) => page.evaluate(([n, dt]) => { for (let i = 0; i < n; i++) __game.tick(dt); }, [n, dt]);
    const stand = { p: [2.6, 2.8, 6.2], pitch: -0.2, yaw: 0.12, fov: 70 }, seat = { p: [0, 9, -3 + 6.5], pitch: -0.95, fov: 34 };
    // the Arcana's portraits on their own: two cards stood before the camera (the Fool yours, the Hermit theirs), a frame at t and t + 1
    // real s so their motion shows, then the Hermit struck and low (its tear, its fray)
    const portraits = async (tag) => {
      await page.evaluate(async () => {
        const G = __game, g = G.game, P = await import('/src/vfx/entropy/portraits.js'), cam = g.camera;
        cam.position.set(-1500, 230, -3000); cam.rotation.set(0, 0, 0, 'YXZ'); cam.fov = 40; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
        const mk = (cls, seat, x) => { const a = new P.ArcanaPortrait(null, cls, seat); a.group.position.set(-1500 + x, 230, -3006); g.scene.add(a.group); return a; };
        window.__pt = [mk('fool', 0, -0.8), mk('hermit', 1, 0.8)]; window.__pt[1].set({ hp: 14, max: 20 });
        for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 50)); if (window.__pt.every((a) => a.U.uLoaded.value)) break; }
      });
      const at = async (name, t, pre = '') => {
        await page.evaluate(([t, pre]) => { if (pre) (0, eval)(pre); for (const a of window.__pt) a.tick(1 / 30, t); const G = __game; for (let i = 0; i < 3; i++) G.draw(); }, [t, pre]);
        await page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`) });
      };
      await at(`p-portraits-${tag}0`, 10); await at(`p-portraits-${tag}1`, 11);
      await at(`p-portraits-${tag}hit`, 12.1, 'window.__pt[1].set({ hp: 4, max: 20 }); window.__pt[1].hit(); for (const a of window.__pt) for (let i = 0; i < 60; i++) a.tick(1 / 30, 10 + i / 30); window.__pt[1].hit(); window.__pt[1].tick(0.12, 12);');
      await page.evaluate(() => { for (const a of window.__pt) a.dispose(); window.__pt = null; });
    };
    // the bomb's countdown: the board view's own once it carries one, else one stood on its root for the shot
    const countdown = (n, delta = 0) => page.evaluate(async ([n, delta]) => {
      const g = __game.game, B = g.entropyLook.board; let C = B.count || B.countdown;
      if (!C) { const { BombCountdown } = await import('/src/vfx/entropy/countdown.js'); C = window.__cd ||= new BombCountdown(g, g.entropyLook); if (!C.root) C.attach(B.root); }
      C.set(n, { max: 30, delta }); const p = new __game.THREE.Vector3(); B.bomb.group.getWorldPosition(p); C.place(p); C.tick(1, g.entropyLook.t); C.tick(1, g.entropyLook.t);
    }, [n, delta]);
    if (Z.id === 'desk') {
      await shot('a-standing', stand);
      await portraits('desk');
      await page.evaluate(() => { const g = __game.game; g.entropyRoom.sit(); g.entropyRoom.session.play(true); });
      await tick(14); await shot('b-cascade-mid', seat);
      await tick(40); await shot('b-cascade-after', seat);
      await page.evaluate(() => __game.game.entropyLook.tiles.flip(3, 4));
      await tick(11); await shot('c-flip-mid', { p: [3.5, 2.8, -6], pitch: -0.32, yaw: 0.45, fov: 50 });
      await tick(30);
      await page.evaluate(() => __game.game.entropyLook.shift.set(true));
      for (let i = 0; i < 10; i++) { await tick(3); await page.evaluate(() => __game.game.entropyLook.shift.set(true)); await new Promise((r) => setTimeout(r, 120)); }
      await shot('d-tiltshift', seat);
      await tick(30); await countdown(30); await shot('e-seated-countdown30', null);
      await countdown(7, 1); await tick(2); await countdown(7); await shot('e-seated-countdown7', null);
      await page.evaluate(() => { window.__cd?.detach(); window.__cd = null; });
    } else {
      await shot('a-standing', stand);
      await portraits('phone');
      await page.evaluate(() => { const g = __game.game; g.entropyRoom.sit(); g.entropyRoom.session.play(true); });
      await tick(60); await countdown(12); await shot('b-seated', null);
      await page.evaluate(() => { window.__cd?.detach(); window.__cd = null; });
    }
    await ctx.close();
  }
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
