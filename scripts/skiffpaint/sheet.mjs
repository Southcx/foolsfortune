// ---------------------------------------------------------------------------------------
// THE HULL PAINTINGS' AND SKIFF SETS' SHEET (Calissa's record, one look): the Solar Skiff's board drawn alone, headless, in the owner's
// hull painting and each of the six hull paintings (vfx/skiffhulls.js), then in each skiff set (vfx/skiffsets.js) where its pieces
// exist, from a three-quarter view and the side; the tiles saved for scripts/skiffpaint/sheet.py to lay out. The game is not booted:
// the board's own modules on a bare page of the dev server (a stand-in game: a renderer, a bus, Dovina's SkiffPaint with every choice
// open and free), so the sheet is the board and nothing else.
//   npx vite --port PORT &   URL=http://localhost:PORT/ node scripts/skiffpaint/sheet.mjs <out dir>
// Prior art: scripts/sweeps/harness.mjs (the browser launched the same way).
// ---------------------------------------------------------------------------------------
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = process.env.URL || 'http://127.0.0.1:5173/', out = path.resolve(process.argv[2] || 'skiffsheet');
fs.mkdirSync(out, { recursive: true });
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
await page.goto(`${url}src/vfx/skiffhulls.js`); // (the dev server's origin, no game booted)
await page.setContent('<html><body style="margin:0;background:#000"><canvas id="c" width="900" height="640"></canvas></body></html>');
const setup = await page.evaluate(async (base) => {
  // (three as the board's modules have it: the dev server's optimised dep, with its version query, so there is one THREE)
  const src = await (await fetch(`${base}src/courier/skiff/boat.js`)).text();
  const three = await import(src.match(/from\s+["']([^"']*\/three\.js[^"']*)["']/)[1]);
  const { Skiff } = await import(`${base}src/courier/skiff/boat.js`);
  const H = await import(`${base}src/vfx/skiffhulls.js`);
  const SETS = await import(`${base}src/vfx/skiffsets.js`);
  const { SkiffPaint } = await import(`${base}src/progress/skiffpaint.js`);
  const canvas = document.getElementById('c');
  const renderer = new three.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = three.SRGBColorSpace; renderer.toneMapping = three.ACESFilmicToneMapping;
  const scene = new three.Scene(); scene.background = new three.Color(0xd9cdb6);
  scene.add(new three.HemisphereLight(0xfff4e0, 0x8a7a64, 1.6));
  const sun = new three.DirectionalLight(0xfff0d8, 2.2); sun.position.set(4, 6, 3); scene.add(sun);
  const cam = new three.PerspectiveCamera(30, 900 / 640, 0.1, 100);
  const subs = {}; const events = { on: (k, f) => ((subs[k] ||= []).push(f), () => {}), emit: (k, e) => (subs[k] || []).forEach((f) => f(e)) };
  const game = { renderer, scene, camera: cam, events, log: { say() {} }, ledger: null };
  game.skiffPaint = new SkiffPaint(game);
  game.skiffPaint.open = () => true; game.skiffPaint.priceOf = () => 0; // (the sheet only: every choice open and free)
  const skiff = new Skiff(scene); await skiff.load(game); skiff.visible = true;
  const pose = () => { skiff.set({ sail: 1, side: 1, fill: 0.85, boom: 0.55, glow: 0, t: 2, speed: 0 }); skiff.posePhase('Skiff_RideIdle', 0.6); skiff.placePennant({ x: 1, y: 0.3 }, 0.7, 2); skiff.group.updateMatrixWorld(true); };
  window.__sheet = {
    async view(kind, id, yaw = 2.3, el = 0.25, dist = 14) {
      let r = null;
      if (kind === 'hull') skiff.setHullPainting(id === 'own' ? null : await H.hullPainting(id, skiff.hullTex));
      else {
        r = SETS.applySkiffSet(game, id); const set = SETS.setOf(id);
        skiff.paintLook.preview = { kind: 'hull', id: set.slots.hull[0] }; skiff.paintLook.apply(); // (the hull as the race board previews it: no kind yet)
        await H.hullPainting(set.slots.hull[0], skiff.hullTex); await new Promise((ok) => setTimeout(ok, 0)); r.worn.unshift(`hull:${set.slots.hull[0]}`);
      }
      pose();
      cam.position.set(Math.sin(yaw) * Math.cos(el) * dist, 1.6 + Math.sin(el) * dist, Math.cos(yaw) * Math.cos(el) * dist);
      cam.lookAt(0, 1.5, 0); cam.updateMatrixWorld();
      renderer.render(scene, cam);
      return r;
    },
  };
  return { hulls: H.HULL_IDS, sets: SETS.SKIFF_SETS.map((s) => s.id) };
}, url);
console.log(setup);
const canvas = await page.$('#c');
const log = [];
for (const id of setup.hulls) {
  for (const [v, yaw] of [['q', 2.3], ['s', 1.5708]]) {
    await page.evaluate(([id, yaw]) => window.__sheet.view('hull', id, yaw), [id, yaw]);
    await canvas.screenshot({ path: path.join(out, `hull_${id}_${v}.png`) });
  }
}
for (const id of setup.sets) {
  const r = await page.evaluate((id) => window.__sheet.view('set', id, 2.3), id);
  log.push(r); await canvas.screenshot({ path: path.join(out, `set_${id}.png`) });
  console.log(id, JSON.stringify(r));
}
fs.writeFileSync(path.join(out, 'sets.json'), JSON.stringify(log, null, 1));
console.log('errors', errors.slice(0, 5));
await browser.close();
