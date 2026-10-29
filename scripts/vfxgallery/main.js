// ---------------------------------------------------------------------------------------
// THE VFX GALLERY'S STAGE, its page (scripts/vfxgallery/index.html; driven by scripts/vfxgallery.mjs). The game's effects played on a
// stage of their own, not in the game: its renderer as the game sets it (ACES, the exposure, the 480 lines on the short side scaled up
// bilinearly as render/present.js does), the PS2 glow and the grade (render/glow.js, standalone: it needs only the renderer and T), and
// a Vfx (vfx/vfx.js) on the workbench's shim of the game (workbench/workbench.js), its budgets off so an effect is judged whole.
// Deterministic: Math.random is a seeded stream reseeded for each effect by its name, and performance.now is the stepped clock (the
// patterns' shared clock, vfx/labradorite.js mindTick, reads it), so a frame is the same every run.
//
// Prior art: the workbench's EFFECTS stage (the same shim and stage), the map dress's harness (scripts/mapdress-harness.html), and the
// contact sheet of a film's dailies (frames of one take in a row, labelled).
//
//   window.__gallery = { ready, names(match), begin({ rows, cols, title }), shoot({ name, row, times, ctx, dir, mid }) -> { held, single,
//     ms }, sheet() -> a PNG data URL, programs() -> the compiled programs' names }   query: w, h (CSS px), dpr, lines (0 native), tier (high | low | minimum), body (side | center | none)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '/src/core/config.js';
import { GRAPHICS_TIERS } from '/src/render/graphics.js';
import { Glow } from '/src/render/glow.js';
import { Vfx } from '/src/vfx/vfx.js';
import { LIBRARY } from '/src/vfx/library.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1280), H = +(q.get('h') || 720), DPR = +(q.get('dpr') || 1), LINES = +(q.get('lines') ?? 480), TIER = GRAPHICS_TIERS[q.get('tier')] || GRAPHICS_TIERS.high;
T.visual.msaa = TIER.msaa; T.visual.textureScale = TIER.textureScale; if (!TIER.glow) T.visual.glow = 0; // (the tier's knobs that change an effect's look)
let seed = 1;
Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let simT = 1000;
performance.now = () => simT * 1000;
const seedOf = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 2147483646) + 1; };

// ---- the stage
const canvas = document.createElement('canvas'); document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = T.visual.exposure;
const ratio = LINES ? Math.min(DPR, LINES / Math.min(W, H)) : DPR; // (the game's: its lines on the short side, render/present.js)
renderer.setPixelRatio(ratio); renderer.setSize(W, H);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ea3b8);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 300);
camera.position.set(0, 1.45, 6.5); camera.lookAt(0, 1, 0);
scene.add(new THREE.HemisphereLight(0xe2ebf4, 0x4a3a30, 1.5));
const sun = new THREE.DirectionalLight(0xfff0dc, 2.4); sun.position.set(4, 9, 5); scene.add(sun);
{
  const c = Object.assign(document.createElement('canvas'), { width: 512, height: 512 }), x = c.getContext('2d');
  x.fillStyle = '#4b433d'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(255,236,214,.13)'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(0, 1.5); x.lineTo(512, 1.5); x.moveTo(1.5, 0); x.lineTo(1.5, 512); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 60); t.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
}
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.32, 6, 16), new THREE.MeshStandardMaterial({ color: 0x8c8784, roughness: 0.8 }));
body.position.set(q.get('body') === 'center' ? 0 : -2.2, 0.9, 0); body.visible = q.get('body') !== 'none'; scene.add(body);
const post = new Glow(renderer);
const shim = { scene, camera, player: { shake: 0, pos: new THREE.Vector3() }, events: null, glyphs: null, time: null, post, rawDt: 1 / 60 };
const vfx = new Vfx(shim);
for (const B of Object.values(vfx.budget)) B.v = B.cap = B.rate = 1e9; // (an effect is judged here whole: the budgets are the fight's)

// ---- the frames
const OW = Math.round(W * DPR), OH = Math.round(H * DPR); // (the output: the device's full resolution)
const full = Object.assign(document.createElement('canvas'), { width: OW, height: OH }), fx = full.getContext('2d');
let sheet = null, sx = null, cell = null;
const PAD = 10, LABEL = 22, HEAD = 34;
/** The frame drawn now, scaled up to (w, h) at (x, y) on a 2D context as the browser scales the game's (bilinear), the screen's flash over it. */
function blit(g, x, y, w, h) {
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
  g.drawImage(renderer.domElement, x, y, w, h);
  if (vfx.flashK > 0.001) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = Math.min(0.85, vfx.flashK); g.fillStyle = vfx.flashEl.style.background || '#fff'; g.fillRect(x, y, w, h); g.restore(); }
}
function reset() {
  for (const h of vfx.live) for (const s of h.layers) s.mesh?.dispose();
  vfx.live.length = 0;
  for (const P of [vfx.add, vfx.alpha]) P.update(1e4); // (every particle's life past)
  for (const Lt of vfx.lights) { Lt.t = Lt.dur = 0; Lt.l.intensity = 0; }
  vfx.flashK = 0; vfx.smearT = 0; post.accum.amt = 0;
}

window.__gallery = {
  ready: true,
  names(match) {
    const re = /^\/.*\/$/.test(match) ? new RegExp(match.slice(1, -1)) : null;
    return Object.keys(LIBRARY).filter((n) => match.split(',').some((m) => (re ? re.test(n) : n.includes(m.trim())))).sort();
  },
  begin({ rows, cols, title }) {
    const cw = Math.min(480, Math.floor(1920 / cols)), chh = Math.round(cw * OH / OW);
    cell = { cw, ch: chh };
    sheet = Object.assign(document.createElement('canvas'), { width: PAD + cols * (cw + PAD), height: HEAD + rows * (chh + PAD) + PAD });
    sx = sheet.getContext('2d'); sx.fillStyle = '#16100e'; sx.fillRect(0, 0, sheet.width, sheet.height);
    sx.fillStyle = '#efe2d0'; sx.font = '600 15px ui-monospace, Menlo, Consolas, monospace'; sx.fillText(title, PAD, 22);
  },
  shoot({ name, row, times, ctx = {}, dir = [1, 0, 0], mid = 0 }) {
    const t0 = Date.now();
    reset(); seed = seedOf(name); simT = 1000;
    const h = vfx.play(name, { pos: new THREE.Vector3(0, 0, 0), dir: new THREE.Vector3(...dir), normal: new THREE.Vector3(0, 1, 0), floor: 0, ...ctx });
    const held = !!h.layers?.some((s) => s.L.dur === Infinity);
    let t = 0, single = null;
    times.forEach((at, i) => {
      while (t < at - 1e-6) { const st = Math.min(1 / 60, at - t); simT += st; t += st; shim.rawDt = st; vfx.update(st); }
      post.render(scene, camera);
      const x = PAD + i * (cell.cw + PAD), y = HEAD + row * (cell.ch + PAD);
      blit(sx, x, y, cell.cw, cell.ch);
      sx.fillStyle = 'rgba(10,6,5,.72)'; sx.fillRect(x, y, cell.cw, LABEL);
      sx.fillStyle = '#f3e6d4'; sx.font = '600 13px ui-monospace, Menlo, Consolas, monospace';
      sx.fillText(`${name}  ${at.toFixed(2)} s${held ? '  (held)' : ''}`, x + 6, y + 15);
      if (i === mid) { blit(fx, 0, 0, OW, OH); single = full.toDataURL('image/png'); }
    });
    h.stop?.(); // (a held one stopped at the last column's time)
    return { held, single, ms: Date.now() - t0, layers: h.layers?.length ?? 0 };
  },
  sheet() { return sheet.toDataURL('image/png'); },
  programs() { return renderer.info.programs.map((p) => p.name); }, // (the programs the stage has compiled: the shape layers' are one, 'vfx-shape')
};
