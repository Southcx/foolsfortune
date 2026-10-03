// MESHFLOW (a sketchbook, not the source): the effect meshes' SOURCE is Blender (source_assets/vfx/effects.blend, exported by
// tools/export_vfx.py). This drives TakayuStudio's Mesh Create headless to rough out new shapes quickly; its bakes go to
// source_assets/meshflow/baked/ and are brought into the .blend with `python3 -I tools/export_vfx.py --import <glb>`.
//
// The effect meshes, made in TakayuStudio's Mesh Create (https://gameanimation.info/mesh-create/, a free browser tool for
// effect meshes: ribbons, slashes, rings, helices, flares, with deformers, UV scrolling and painted vertex alpha), kept in the repo as
// Mesh Create's own project files so that anyone can open one in the tool, change it by hand, save it, and bake it again.
//
//   source_assets/meshflow/<name>.meshflow     the project (Mesh Create's format: "Open" in the tool reads it, "Save" writes it)
//   source_assets/meshflow/tex/<name>.png      the texture it was authored with (made here, by the recipe; embedded in the project)
//   src/assets/vfx/<name>.glb                  the bake: Mesh Create's own GLB export (UV transform baked, vertex colour and alpha,
//                                              the texture, and the motion / blend / flipbook in the mesh's extras), what the game loads
//
//   node tools/meshflow.mjs                    bake every project to its GLB (headless Chromium drives the tool's own exporter)
//   node tools/meshflow.mjs --only a,b         bake some
//   node tools/meshflow.mjs --author [--force] [--only a]   write the starting projects from RECIPES below (never over an existing
//                                              project unless --force: once a project exists, the project is the source, not the recipe)
//
// The tool runs in the page; its app is `window.MeshCreate.app` (applyPreset, addModifier, set, loadProject, projectPayload,
// export). Nothing is sent anywhere: the tool works on the device (its own note), and the files come back as downloads.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'source_assets/meshflow'), TEX = path.join(SRC, 'tex'), OUT = path.join(SRC, 'baked'); // (not the game's: Blender is the source)
const URL_ = 'https://gameanimation.info/mesh-create/';
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const only = (() => { const i = args.indexOf('--only'); return i >= 0 ? args[i + 1].split(',') : null; })();

// ---------------------------------------------------------------------------------------
// RECIPES: how each effect mesh starts. `preset` is one of the tool's shapes (ribbon slash helix wave ring arc disc torus cylinder
// cone funnel sphere hemisphere capsule plane box cross spike leaf vortex crown twinhelix coil knot); `params` its shape's numbers;
// `mods` deformers in order ([type, params]: twist bend taper wave swirl noise spherify mirror array); `set` any other state path
// (uv.*, motion.*, material.*); `tex` a texture drawn here (a function of a 2D canvas context and its size, run in the page).
// ---------------------------------------------------------------------------------------
const RECIPES = {
  // the circle that opens on the ground under a chest as it charges: a flat band of runes between two rules, turning
  chest_circle: {
    preset: 'ring', params: { radius: 1.25, width: 0.32, segU: 96, segV: 2 },
    set: { 'motion.speedU': 0.06, 'motion.speedV': 0, 'uv.tileU': 6, 'uv.tileV': 1, 'material.blend': 'additive', 'material.fadeV': 0.15 },
    tex: 'runes',
  },
  // the helix of Lachryma that rises round the chest and the curio on the reveal: two ribbons wound together, flowing up
  chest_helix: {
    preset: 'twinhelix', params: { radius: 0.7, height: 2.6, turns: 2, width: 0.26, segU: 128, segV: 4 },
    mods: [['taper', { axis: 'y', amount: -0.45 }]],
    set: { 'motion.speedU': 0, 'motion.speedV': -0.9, 'uv.tileV': 3, 'material.blend': 'additive', 'material.fadeV': 0.25, 'material.fadeU': 0.2 },
    tex: 'streak',
  },
  // the shockwave of the burst: a low flared band thrown outward along the ground
  chest_shock: {
    preset: 'funnel', params: { radius: 0.4, topRadius: 1.0, height: 0.35, segU: 64, segV: 4 },
    set: { 'motion.speedU': 0, 'motion.speedV': 0.6, 'material.blend': 'additive', 'material.fadeV': 0.45 },
    tex: 'band',
  },
  // THE LOCKHEART'S OPENING (lockheart/ultimate.js, the effects in vfx/library.js 'ult.*')
  // the pillar of Lachryma that stands up out of the open coffin to the sky: an open cylinder, streaks flowing up it
  ult_pillar: {
    preset: 'cylinder', params: { radius: 0.85, height: 9, segU: 32, segV: 6 },
    set: { 'motion.speedU': 0.05, 'motion.speedV': -1.4, 'uv.tileU': 3, 'uv.tileV': 2, 'material.blend': 'additive', 'material.fadeV': 0.35 },
    tex: 'streak',
  },
  // a crown of flame round the coffin's mouth: the tool's jagged-edged ring, licking upward
  ult_crown: {
    preset: 'crown', params: { radius: 0.75, height: 1.2, count: 9, inner: 0.4, segU: 96, segV: 8 },
    set: { 'motion.speedU': 0.15, 'motion.speedV': -1.1, 'uv.tileU': 3, 'material.blend': 'additive', 'material.fadeV': 0.2 },
    tex: 'flame',
  },
  // the whirl on the ground under the circle: arms spiralling in to the Courier
  ult_vortex: {
    preset: 'vortex', params: { radius: 4.2, width: 0.9, turns: 2.2, inner: 0.1, segU: 160, segV: 4 },
    set: { 'motion.speedU': 0, 'motion.speedV': 0.9, 'uv.tileV': 4, 'material.blend': 'additive', 'material.fadeU': 0.3 },
    tex: 'streak',
  },
  // the great helix wound round the pillar: two ribbons, tall
  ult_helix: {
    preset: 'twinhelix', params: { radius: 1.5, height: 8, turns: 3.5, width: 0.42, segU: 192, segV: 4 },
    mods: [['taper', { axis: 'y', amount: 0.35 }]],
    set: { 'motion.speedU': 0, 'motion.speedV': -1.2, 'uv.tileV': 6, 'material.blend': 'additive', 'material.fadeV': 0.2, 'material.fadeU': 0.25 },
    tex: 'streak',
  },
  // the dome of light that goes up from the landing: a hemisphere, banded, rising
  ult_dome: {
    preset: 'hemisphere', params: { radius: 1, segU: 48, segV: 16 },
    set: { 'motion.speedU': 0, 'motion.speedV': 0.8, 'uv.tileU': 1, 'uv.tileV': 2, 'material.blend': 'additive', 'material.fadeV': 0.5 },
    tex: 'band',
  },
};

// the textures, drawn in the page (no canvas in Node), greyscale with alpha: the game tints them
const TEXTURES = {
  runes: (g, N) => {
    g.clearRect(0, 0, N, N);
    const W = N, H = N;
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
    // two rules
    g.lineWidth = H * 0.035; for (const y of [0.12, 0.88]) { g.beginPath(); g.moveTo(0, y * H); g.lineTo(W, y * H); g.stroke(); }
    g.lineWidth = H * 0.012; for (const y of [0.2, 0.8]) { g.beginPath(); g.moveTo(0, y * H); g.lineTo(W, y * H); g.stroke(); }
    // runes between them: each made of a stem and two or three strokes, from a seeded random (tiles across U)
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const n = 4, cw = W / n;
    g.lineWidth = H * 0.03;
    for (let i = 0; i < n; i++) {
      const x0 = i * cw + cw * 0.5, y0 = H * 0.3, y1 = H * 0.7, hw = cw * 0.22;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1);
      for (let k = 0; k < 2 + Math.floor(r() * 2); k++) {
        const ya = y0 + (y1 - y0) * r(), yb = y0 + (y1 - y0) * r(), sd = r() < 0.5 ? -1 : 1;
        g.moveTo(x0, ya); g.lineTo(x0 + sd * hw, yb);
      }
      g.stroke();
      g.beginPath(); g.arc(x0 + cw * 0.5, H * 0.5, H * 0.035, 0, Math.PI * 2); g.fill(); // (a bead between runes)
    }
  },
  streak: (g, N) => {
    g.clearRect(0, 0, N, N);
    // soft streaks along V of different lengths and weights: a ribbon of light that flows
    let s = 3; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i++) {
      const x = r() * N, w = N * (0.04 + r() * 0.1), y = r() * N, h = N * (0.2 + r() * 0.5);
      const gr = g.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, `rgba(255,255,255,${0.4 + r() * 0.6})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      for (const dy of [-N, 0, N]) g.fillRect(x - w / 2, y + dy, w, h); // (tiles in V)
    }
  },
  flame: (g, N) => {
    g.clearRect(0, 0, N, N);
    // tongues of flame: tall soft shapes rising from the bottom (V = 0), tiling across U
    let s = 5; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 18; i++) {
      const x = r() * N, w = N * (0.05 + r() * 0.08), h = N * (0.4 + r() * 0.55);
      const gr = g.createLinearGradient(0, N, 0, N - h);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      for (const dx of [-N, 0, N]) { g.beginPath(); g.moveTo(x + dx - w, N); g.quadraticCurveTo(x + dx - w * 0.6, N - h * 0.6, x + dx, N - h); g.quadraticCurveTo(x + dx + w * 0.6, N - h * 0.6, x + dx + w, N); g.fill(); }
    }
  },
  band: (g, N) => {
    g.clearRect(0, 0, N, N);
    // bright at the leading edge (V = 1), thinning back, with a few breaks across U
    const gr = g.createLinearGradient(0, 0, 0, N);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.95, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0.6)');
    g.fillStyle = gr; g.fillRect(0, 0, N, N);
    g.globalCompositeOperation = 'destination-out';
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 7; i++) { const x = r() * N; g.fillRect(x, 0, N * (0.01 + r() * 0.03), N); }
    g.globalCompositeOperation = 'source-over';
  },
};

// ---------------------------------------------------------------------------------------
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true })).newPage();
await page.goto(URL_, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForFunction(() => window.MeshCreate?.app?.state, null, { timeout: 60000 });
const version = await page.evaluate(() => window.MeshCreate.app.projectPayload().app);
console.log(version);
fs.mkdirSync(SRC, { recursive: true }); fs.mkdirSync(TEX, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

if (flag('--author')) {
  for (const [name, R] of Object.entries(RECIPES)) {
    if (only && !only.includes(name)) continue;
    const file = path.join(SRC, `${name}.meshflow`);
    if (fs.existsSync(file) && !flag('--force')) { console.log(`keep ${name} (exists: its project is the source)`); continue; }
    const out = await page.evaluate(async ({ name, R, tex }) => {
      const A = window.MeshCreate.app;
      A.applyPreset(R.preset);
      for (const [k, v] of Object.entries(R.params || {})) A.set(`source.params.${k}`, v);
      A.state.modifiers = [];
      for (const [type, params] of R.mods || []) { A.addModifier(type); Object.assign(A.state.modifiers[A.state.modifiers.length - 1].params, params); }
      for (const [k, v] of Object.entries(R.set || {})) A.set(k, v);
      let png = null;
      if (tex) {
        const N = 512, c = document.createElement('canvas'); c.width = c.height = N;
        (new Function('return ' + tex)())(c.getContext('2d'), N);
        png = c.toDataURL('image/png');
        A.state.texture = { kind: 'custom', name: `${name}.png`, data: png, width: N, height: N };
        await A.loadTexture();
      }
      A.state.name = name; A.rebuild(); A.refreshMaterial?.();
      return { project: A.projectPayload(), png };
    }, { name, R, tex: R.tex ? TEXTURES[R.tex].toString() : null });
    fs.writeFileSync(file, JSON.stringify(out.project, null, 1));
    if (out.png) fs.writeFileSync(path.join(TEX, `${name}.png`), Buffer.from(out.png.split(',')[1], 'base64'));
    console.log(`authored ${name}`);
  }
}

// bake every project through the tool's own GLB export
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith('.meshflow'))) {
  const name = f.replace(/\.meshflow$/, '');
  if (only && !only.includes(name)) continue;
  const project = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
  await page.evaluate(async (p) => { await window.MeshCreate.app.loadProject(p); }, project);
  const dl = page.waitForEvent('download', { timeout: 60000 });
  await page.evaluate(() => window.MeshCreate.app.export('glb'));
  const d = await dl;
  await d.saveAs(path.join(OUT, `${name}.glb`));
  const st = await page.evaluate(() => window.MeshCreate.app.stats?.() ?? null);
  console.log(`baked ${name}.glb`, st ? JSON.stringify(st) : '');
}
await browser.close();
