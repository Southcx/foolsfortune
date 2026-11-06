// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S BANKS AND THE WATERLINE RIPPLE, SHOT: the ground the wave pool sits in (park.js's banks, vfx/waves/basin.js's deck)
// and the waterline ripple (vfx/watercontact.js) headless at the Raceway park, on the desk (1280 x 720) and the phone (an iPhone XR held
// landscape, 896 x 414 at 2x, its renderer stubbed to "Apple GPU" so it boots the phone's tier, its first-draw budget off). The pool's
// clock held in a lull (no wave in the way), the camera set by hand: the pool from the beach end as you walk up to it, from each long
// side, from above at an angle; then the Solar Skiff idle on the water, the Solar Skiff under way (its speed set each frame) for the
// wake, and the Courier swimming. Every number is read from POOL (surf/wavepool.js), never copied. One look, never a tune-and-rerun loop
// (CLAUDE.md, Subagents).
//
// Prior art: scripts/wavepool-shot.mjs (the boot, the manual frame), scripts/surfplay.mjs (the board set on the pool).
//
//   node scripts/wavepool-banks-shot.mjs [out dir]      (default: the OS temp dir)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'wavepool-banks-')));
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5198, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const SIZES = [{ id: 'desk', ctx: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, apple: false }, { id: 'phone', ctx: { ...devices['iPhone XR landscape'] }, apple: true }];
const errs = [], report = {};
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
    await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000${Z.apple ? '&firstdraws=0' : ''}`, { waitUntil: 'commit' });
    for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    report[Z.id] = await page.evaluate(async () => {
      const G = __game, g = G.game;
      const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      window.__keys = new Set(); g.input.isDown = (c) => __keys.has(c);
      g.places.travel('wavepool');
      let f = 0; do { G.tick(1 / 30); if (!g.seam?.covering) G.draw(); f++; if (f % 5 === 0) await new Promise((q) => setTimeout(q, 0)); } while ((g.seam?.busy || !g.raceway?.built) && f < 1500);
      for (let i = 0; i < 20; i++) G.tick(1 / 30);
      const sk = g.player.techs.get('skiff'); sk.skiff?.load?.(g); for (let i = 0; i < 200 && !sk.skiff?.ready; i++) await new Promise((q) => setTimeout(q, 100));
      return { frames: f, built: !!g.raceway?.built, tier: g.graphics?.tier };
    });
    // the pool's frame (u along, v across from the beach) to the world, and a lull of the pool's clock (no pass running)
    const lull = `const G = __game, g = G.game, THREE = G.THREE, R = g.raceway, S = R.surf, W = S.S, P = W.POOL, ax = W.axes, RW = { x: 6000, y: -420, z: 0 };
      const at = (u, v, y) => { const du = u - P.L / 2, dv = v - P.W / 2, x = RW.x + P.x + du * ax.ux + dv * ax.vx, z = RW.z + P.z + du * ax.uz + dv * ax.vz; return new THREE.Vector3(x, y == null ? R.heightAt(x, z) : RW.y + y, z); };
      const pt = (P.L + 2 * W.WAVE.margin) / W.WAVE.c; S.t = pt + W.WAVE.lull * 0.5; if (g.wavePoolLook) g.wavePoolLook.t = S.t;`;
    const shoot = async (name, body) => {
      const r = await page.evaluate(`(async () => { ${lull} ${body} G.draw(); G.draw(); return true; })()`).catch((e) => `ERR ${e.message}`);
      if (r !== true) errs.push(`${Z.id} ${name}: ${r}`);
      await page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`) });
    };
    // a camera set by hand after the frame's own (the world's tick moves nothing it set)
    const cam = (a, b, fov = 60) => `G.tick(1 / 30); const c = g.camera; c.position.copy(${a}); c.lookAt(${b}); c.fov = ${fov}; c.updateProjectionMatrix(); c.updateMatrixWorld();`;
    // the views of the ground: the Courier set where a player stands, the camera behind and above them
    const stand = (u, v, yaw) => `{ const p = at(${u}, ${v}); g.course.teleport(new THREE.Vector3(p.x, p.y + 0.05, p.z), ${yaw}); for (let i = 0; i < 10; i++) G.tick(1 / 30); }`;
    await shoot('beach-walkup', `${stand('P.L / 2', '-P.beach - 34', 0)} ${cam('at(P.L / 2, -P.beach - 42, null).add(new THREE.Vector3(0, 3.2, 0))', 'at(P.L / 2, P.W * 0.5, P.y)')}`);
    await shoot('side-beach', `${stand('P.L * 0.15', '-P.beach - 26', 0.9)} ${cam('at(-30, -P.beach - 40, null).add(new THREE.Vector3(0, 6, 0))', 'at(P.L * 0.45, P.W * 0.3, P.y)')}`);
    await shoot('side-deep', `${stand('P.L * 0.5', 'P.W + 12', Math.PI)} ${cam('at(P.L * 0.62, P.W + 34, null).add(new THREE.Vector3(0, 5, 0))', 'at(P.L * 0.35, P.W * 0.4, P.y)')}`);
    await shoot('end-west', `${stand('-14', 'P.W * 0.5', Math.PI / 2)} ${cam('at(-40, P.W * 0.62, null).add(new THREE.Vector3(0, 4.5, 0))', 'at(P.L * 0.3, P.W * 0.35, P.y)')}`);
    await shoot('above', `${cam('at(-P.L * 0.08, -P.beach - P.W * 0.7, P.y + P.W * 0.85)', 'at(P.L * 0.4, P.W * 0.5, P.y)', 60)}`);
    // the Solar Skiff on the water: idle, then under way along the pool (its speed set each frame), the camera high behind it
    const board = (speed) => `const p0 = at(P.L * 0.3, P.W * 0.72, P.y); const P2 = g.player, sk = P2.techs.get('skiff'), hx = ax.ux, hz = ax.uz, hd = Math.atan2(hx, hz);
      g.course.teleport(new THREE.Vector3(p0.x, R.rideHeight(p0.x, p0.z) + 0.7, p0.z), hd);
      for (let i = 0; i < 120 && !sk.active; i++) { sk.mount(); G.tick(1 / 60); }
      for (let i = 0; i < 45; i++) { sk.heading = hd; sk.v.set(hx * ${speed}, 0, hz * ${speed}); P2.vel.x = hx * ${speed}; P2.vel.z = hz * ${speed}; sk.rideT = 5; G.tick(1 / 30); }
      const b = sk.skiff.group.position, back = new THREE.Vector3(-hx, 0, -hz), wc = g.waterContact?.skiff;
      window.__sk = { active: sk.active, phase: sk.phase, onWater: sk.onWater, air: sk.air, sp: +Math.hypot(sk.v.x, sk.v.z).toFixed(2), wc: wc?.visible, k: +(wc?.userData.k ?? 0).toFixed(2), dy: +(b.y - (R.rideHeight(b.x, b.z))).toFixed(2) };`;
    await shoot('skiff-idle', `${board(0)} ${cam('b.clone().addScaledVector(back, 5.5).add(new THREE.Vector3(1.5, 3.2, 0))', 'b.clone().addScaledVector(back, -0.5)')}`);
    await shoot('skiff-moving', `${board(12)} ${cam('b.clone().addScaledVector(back, -3).add(new THREE.Vector3(2.5, 9, 0))', 'b.clone().addScaledVector(back, 5)')}`);
    report[Z.id].skiff = await page.evaluate('window.__sk').catch(() => null);
    await shoot('skiff-moving-side', `${board(12)} ${cam('b.clone().add(new THREE.Vector3(0, 6, 9))', 'b.clone().addScaledVector(back, 4)')}`);
    // the Courier swimming: off the board into the deep water, W held, the camera above and behind
    await shoot('swim', `const P2 = g.player, sk = P2.techs.get('skiff'); if (sk.active) sk.dismount?.(); const p0 = at(P.L * 0.6, P.W * 0.7, P.y + 0.2);
      g.course.teleport(new THREE.Vector3(p0.x, p0.y - 0.6, p0.z), Math.atan2(ax.ux, ax.uz)); __keys.add('KeyW');
      for (let i = 0; i < 70; i++) G.tick(1 / 30); __keys.clear();
      window.__swim = { tech: P2.techs.active?.id ?? null, sp: +Math.hypot(P2.vel.x, P2.vel.z).toFixed(2), wc: g.waterContact?.courier?.visible };
      const b = P2.pos, back = new THREE.Vector3(-P2.vel.x, 0, -P2.vel.z).normalize();
      ${cam('b.clone().addScaledVector(back, 4.5).add(new THREE.Vector3(1, 3.4, 0))', 'b.clone().addScaledVector(back, -1)')}`);
    report[Z.id].swim = await page.evaluate('window.__swim').catch(() => null);
    report[Z.id].contact = await page.evaluate('({ courier: __game.game.waterContact?.courier?.visible, skiff: __game.game.waterContact?.skiff?.visible })').catch(() => null);
    await ctx.close();
  }
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
