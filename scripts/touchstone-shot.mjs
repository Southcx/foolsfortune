// ---------------------------------------------------------------------------------------
// THE TOUCHSTONE, SHOT: the Touchstone's look (src/vfx/touchstonelook.js) over Petra's room, headless, on the phone (an iPhone XR held
// landscape, 896 x 414 at 2x, its WebGL renderer stubbed to "Apple GPU" so it boots the phone's tier, touch) and the desk (1920 x 1080).
// Each goes to the Touchstone the Index's way, is shot on arrival, standing at the colour plinth, and with the colour trial running
// (its three tiles up), and the same trial with the look off (her placeholders back) for the comparison. It measures: the programs
// compiled on the way in and which materials draw with them; the room's light (the zone, the lamps lent, the hemisphere, ambient and
// sun, the exposure and the tone mapping, the fog); the frame's mean and the pixels of the stone's middle and of its right tile, look on
// and off (a tile must read the same; the left one is behind the Courier's head from her trial's place). One look, never a tune-and-rerun loop (CLAUDE.md, Subagents).
//
// Prior art: scripts/arrivalprobe.mjs (the phone's boot, the manual frame), scripts/mapdress-shot.mjs (shots saved for a look).
//
//   node scripts/touchstone-shot.mjs [out dir]      (default: the OS temp dir; prints the measures as JSON)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, devices } from 'playwright';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'touchstone-')));
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 5196, strictPort: false } });
await server.listen();
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'; // (the installed one, as scripts/mapdress-shot.mjs asks)
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const SIZES = [{ id: 'phone', ctx: { ...devices['iPhone XR landscape'] }, apple: true }, { id: 'desk', ctx: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }, apple: false }];
const report = {}, errs = [];
try {
  for (const S of SIZES) {
    const ctx = await browser.newContext(S.ctx), page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`${S.id}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`${S.id} console: ${m.text().slice(0, 200)}`); });
    await page.addInitScript((apple) => {
      Object.defineProperty(window, '__game', { configurable: true, set(v) { v.manual = true; this.__g = v; }, get() { return this.__g; } });
      if (apple) for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) { const gp = P.getParameter; P.getParameter = function (k) { return k === 0x9246 ? 'Apple GPU' : k === 0x9245 ? 'Apple Inc.' : gp.call(this, k); }; }
    }, S.apple);
    await page.goto(`${server.resolvedUrls.local[0]}?clock=1791160275000`, { waitUntil: 'commit' });
    for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 1000)); if (await page.evaluate('!!window.__ready').catch(() => false)) break; }
    // the way in: the basement first, then the Index's room, the seam stepped until it lifts
    const r = (report[S.id] = await page.evaluate(async () => {
      const G = __game, g = G.game, R = G.renderer, THREE = G.THREE;
      const ov = document.getElementById('overlay'); if (ov) ov.style.display = 'none';
      const step = async (n) => { for (let i = 0; i < n; i++) { G.tick(1 / 30); if (!g.seam?.covering) G.draw(); if (i % 10 === 9) await new Promise((q) => setTimeout(q, 0)); } };
      await step(20); g.course.goRoom('lab'); await step(20);
      const before = new Set(R.info.programs.map((p) => p.cacheKey));
      g.course.goRoom('touchstone');
      let f = 0; do { G.tick(1 / 30); if (!g.seam?.covering) G.draw(); f++; await new Promise((q) => setTimeout(q, 0)); } while (g.seam?.busy && f < 900);
      await step(45);
      const fresh = R.info.programs.filter((p) => !before.has(p.cacheKey)), users = new Map(fresh.map((p) => [p, new Set()]));
      g.scene.traverse((o) => { for (const m of [].concat(o.material || [])) { const p = R.properties.get(m)?.currentProgram; if (users.has(p)) users.get(p).add(m.name || m.type); } });
      const lights = []; g.scene.traverse((o) => { if (o.isHemisphereLight || o.isAmbientLight || o.isDirectionalLight) lights.push(`${o.type} ${o.intensity.toFixed(2)}`); });
      const V = new THREE.Vector3(), lent = g.lights.slots.filter((s) => s.proxy).map((s) => ({ at: s.proxy.getWorldPosition(V).toArray().map((v) => +v.toFixed(1)), i: +s.l.intensity.toFixed(2), d: s.l.distance }));
      return {
        zone: g.zones?.current, tier: g.graphics?.tier, built: { room: !!g.touchstone?.built, look: !!g.touchstoneLook?.built }, frames: f,
        programs: { total: R.info.programs.length, compiledOnTheWayIn: fresh.map((p) => ({ name: p.name, by: [...users.get(p)].slice(0, 6) })) },
        light: { lights, lent, lamps: g.lights.stats(), exposure: R.toneMappingExposure, toneMapping: R.toneMapping, fog: g.scene.fog && { hex: g.scene.fog.color.getHexString(), density: g.scene.fog.density }, canvas: [R.domElement.width, R.domElement.height] },
        meshes: g.touchstoneLook?.meshes?.length, hidden: g.touchstone?.room?.children.filter((m) => m.isMesh && !m.visible).length,
      };
    }));
    // what a frame shows, look on and off: the frame's mean (Rec. 709 luma, 0..255), the stone's middle under the tiles, a tile's middle
    const measure = (tag) => page.evaluate((tag) => {
      const G = __game, g = G.game, R = G.renderer, THREE = G.THREE, Tc = g.touchstone, B = { x: 3000, y: 200, z: -3000 }, S = { z: -6.5, t: 0.5, y: 2.1 };
      G.draw();
      const c = R.domElement, w = c.width, h = c.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x2 = cv.getContext('2d'); x2.drawImage(c, 0, 0);
      const d = x2.getImageData(0, 0, w, h).data, lum = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      let sum = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 7) { sum += lum(i); n++; }
      const at = (x, y, z) => { const p = new THREE.Vector3(B.x + x, B.y + y, B.z + z).project(g.camera), px = Math.round(((p.x + 1) / 2) * w), py = Math.round(((1 - p.y) / 2) * h); const s = [0, 0, 0]; let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((py + dy) * w + px + dx) * 4; if (i < 0 || i >= d.length) continue; s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; k++; } return { px: [px, py], rgb: s.map((v) => Math.round(v / Math.max(1, k))) }; };
      const zf = S.z + S.t / 2 + 0.03;
      return { tag, mean: +(sum / n).toFixed(1), stoneUnderTiles: at(0, 1.45, zf), stoneRight: at(1.7, 2.1, zf), tile2: at(1.15, 2.1, zf), // (the right of the stone: from her trial's place the Courier's head covers its left)
        run: Tc?.run ? { id: Tc.run.id, phase: Tc.run.phase } : null, chevron: g.interact?.cur?.ref ?? null };
    }, tag);
    const shot = async (name) => { await page.screenshot({ path: path.join(out, `${S.id}-${name}.png`) }); };
    const look = (on) => page.evaluate((on) => { const g = __game.game, L2 = g.touchstoneLook; if (!L2?.group) return; L2.group.visible = on; if (on) L2.hidePlaceholders(g.touchstone.room); else for (const m of g.touchstone.room.children) if (m.isMesh) m.visible = true; }, on);
    r.measures = [];
    r.measures.push(await measure('arrival, look on')); await shot('1-arrival');
    await look(false); r.measures.push(await measure('arrival, look off')); await look(true);
    await page.evaluate(async () => { const G = __game, g = G.game; g.course.teleport(new G.THREE.Vector3(3000, 200.05, -3000 - 1.6 + 1.3), Math.PI); for (let i = 0; i < 40; i++) G.tick(1 / 30); G.draw(); });
    r.measures.push(await measure('at the colour plinth')); await shot('2-at-plinth');
    await page.evaluate(async () => { const G = __game, g = G.game; g.touchstone.begin('colour'); for (let i = 0; i < 75; i++) { G.tick(1 / 30); if (i % 10 === 9) await new Promise((q) => setTimeout(q, 0)); } G.draw(); });
    r.measures.push(await measure('colour trial, look on')); await shot('3-colour-trial');
    await look(false); r.measures.push(await measure('colour trial, look off')); await shot('4-colour-trial-placeholders'); await look(true); await measure('restored');
    await ctx.close();
  }
} finally {
  await browser.close(); await server.close();
}
console.log(JSON.stringify(report, null, 1));
console.log(`shots: ${out}`);
if (errs.length) { console.log(`page errors (${errs.length}):\n  ${[...new Set(errs)].slice(0, 12).join('\n  ')}`); process.exitCode = 1; }
