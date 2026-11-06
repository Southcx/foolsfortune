// ---------------------------------------------------------------------------------------
// THE WAVE POOL, SHOT: the wave pool's look (src/vfx/waves/) headless, at the Raceway park, on the desk (1280 x 720) and the phone (an
// iPhone XR held landscape, 896 x 414 at 2x, its renderer stubbed to "Apple GPU" so it boots the phone's tier). The pool's clock is set
// to a pass with its break point mid-pool, and the camera set by hand: the wave from the beach, the whitewater close, the break point, the barrel from inside (the screen's
// vignette from the camera's own barrel test), the lip from its back. It measures what the look adds to a frame (draw calls and
// triangles, renderer.info with the look shown and hidden) and the programs it compiled. One look, never a tune-and-rerun loop
// (CLAUDE.md, Subagents).
//
// Prior art: scripts/touchstone-shot.mjs (the phone's boot, the manual frame, shots saved for a look).
//
//   node scripts/wavepool-shot.mjs [out dir]      (default: the OS temp dir; prints the measures as JSON)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'wavepool-')));
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5197, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const SIZES = [{ id: 'desk', ctx: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, apple: false }, { id: 'phone', ctx: { ...devices['iPhone XR landscape'] }, apple: true }];
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
    await page.goto(`${server.resolvedUrls.local[0]}?seed=1&clock=1791160275000${Z.apple ? '&firstdraws=0' : ''}`, { waitUntil: 'commit' }); // (the phone's first-draw budget off: a manual frame or two would draw it near empty, render/firstdraws.js)
    for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    report[Z.id] = await page.evaluate(async () => {
      const G = __game, g = G.game, R = G.renderer;
      const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      const before = new Set(R.info.programs.map((p) => p.cacheKey));
      g.course.goRoom('raceway');
      let f = 0; do { G.tick(1 / 30); if (!g.seam?.covering) G.draw(); f++; if (f % 5 === 0) await new Promise((q) => setTimeout(q, 0)); } while ((g.seam?.busy || !g.raceway?.built) && f < 1500);
      for (let i = 0; i < 20; i++) G.tick(1 / 30);
      const W = g.wavePoolLook; if (g.raceway?.surf) g.raceway.surf.t = 22.7; else W.t = 22.7;
      for (let i = 0; i < 4; i++) G.tick(1 / 30);
      const fresh = R.info.programs.filter((p) => !before.has(p.cacheKey)).map((p) => p.name).filter((n) => /wave/.test(n));
      return { frames: f, built: !!W?.parts, tier: g.graphics?.tier, mobile: !!g.graphics?.machine?.mobile, lean: W?.parts?.lean, programs: fresh,
        tris: W?.parts ? { near: W.parts.water.near.geometry.index.count / 3, far: W.parts.water.far.geometry.index.count / 3, lip: W.parts.lip.mesh.geometry.index.count / 3, basin: W.parts.basin.static.geometry.attributes.position.count / 3, car: W.parts.basin.car.geometry.attributes.position.count / 3 } : null };
    });
    // the camera by hand, the look's update run again so its screen reads that camera, then a frame; its cost with it shown and hidden
    const view = (name) => page.evaluate((name) => {
      const G = __game, g = G.game, THREE = G.THREE, W = g.wavePoolLook, S = W.S, t = W.t, st = S.state(t), P = S.POOL, ax = S.axes, RW = { x: 6000, y: -420, z: 0 };
      G.tick(1 / 30);
      const at = (s, d, y) => { const u = st.ub + s * st.tu + d * st.nu, v = P.vb + s * st.tv + d * st.nv, du = u - P.L / 2, dv = v - P.W / 2; return new THREE.Vector3(RW.x + P.x + du * ax.ux + dv * ax.vx, RW.y + y, RW.z + P.z + du * ax.uz + dv * ax.vz); };
      const f0 = S.frameAt(at(-12, 0, 0).x - RW.x, at(-12, 0, 0).z - RW.z, t), H = f0?.H ?? 6, F = f0?.F ?? 7;
      const C = { beach: [at(-8, 92, P.y + 7), at(-4, 6, P.y + 0.6 * H)], tube: [at(-13, 0.5 * F, P.y + 0.42 * H), at(6, 0.48 * F, P.y + 0.42 * H)], back: [at(-20, -26, P.y + 9), at(-6, 2, P.y + 4)], side: [at(30, 22, P.y + 5), at(-6, 3, P.y + 4)], white: [at(-58, 34, P.y + 6), at(-72, 2, P.y + 3)], break: [at(4, 52, P.y + 7), at(2, 4, P.y + 0.55 * H)] }[name];
      const cam = g.camera; cam.position.copy(C[0]); cam.lookAt(C[1]); cam.updateMatrixWorld();
      if (name === 'tube') { cam.fov = 82; cam.updateProjectionMatrix(); }
      W.update(0.25); W.update(0.25); W.update(0.25); // (the screen eased in for this camera)
      const info = R => { R.info.autoReset = false; R.info.reset(); G.draw(); const o = { calls: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true; return o; };
      const on = info(G.renderer); W.group.visible = false; const offK = W.screen.cover; W.screen.cover = 0; const off = info(G.renderer); W.group.visible = true; W.screen.cover = offK; G.draw();
      return { name, H: +H.toFixed(2), F: +F.toFixed(2), cover: +W.screen.cover.toFixed(2), k: +W.screen.k.toFixed(2), on, off, added: { calls: on.calls - off.calls, tris: on.tris - off.tris } };
    }, name);
    report[Z.id].views = [];
    for (const name of Z.id === 'desk' ? ['beach', 'tube', 'back', 'side', 'white', 'break'] : ['beach', 'tube', 'white']) {
      report[Z.id].views.push(await view(name));
      await page.screenshot({ path: path.join(out, `${Z.id}-${name}.png`) });
    }
    await ctx.close();
  }
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
