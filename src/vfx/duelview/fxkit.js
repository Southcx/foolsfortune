// ---------------------------------------------------------------------------------------
// THE DUEL'S EFFECT KIT (plain names; South, 2026-10-29: "simple textures, radial cylinders with scrolling UVs and alpha blending ...
// the classic cheap retro look ... power up auras ... scrolling neuralese for spell chanting"): what the duel's show draws its retro
// layers from (auras.js, sidedress.js, cutin.js): a handful of small canvas textures made once, a scrolling material over them, and
// THE SIDES' COLOURS, the one table that says who is who on screen.
//   THE SIDES      you blue, the aberrant red (South, the same day: "player blue-coded while enemies are red coded"), each a glaze the
//                  clay world already fires so neither shouts over the Lachryma's prismatic film: yours lapis (a cobalt glaze) lit
//                  with the film's cyan, the aberrant's cinnabar (a red lacquer) lit with ember; its own feeling rides inside the red
//   THE TEXTURES   streaks (a power-up aura's rising rays), rings (a rune circle on the ground), sand (a sandfall's grains), ember
//                  (sparks), crackle (the clay's craze), and a chant (a line of neuralese in the running hand, ui/runninghand.js)
//   THE MATERIAL   `scrollMat`: the house's basic program with a map, additive or alpha, double-sided, its UV offset scrolled each frame by
//                  whoever owns it (`scroll(mat, dt, su, sv)`): nothing new compiles
// Prior art: Pokemon Stadium's move effects (textures on cylinders and discs scrolled and blended, N64, 1999; StadiumBattleFX's
// catalogue of them); the Diablo III aura talk's scrolling noise through a mask; Dragon Ball Budokai's power-up aura; Fire Emblem's
// blue player phase and red enemy phase.
//
//   SIDE (the colours)   sideHex(side, which)   tex(kind)   chantTexture(words)   scrollMat(texture, hex, { add, opacity })   scroll(mat, dt, su, sv)
//   worldIn(group, root) (a group laid out in world space but kept under the view's root: the duel's instance draws what is the duel's)
//   compileOverlay(S, obj) (one overlay mesh compiled as the overlay scene draws it: its lights, no clipping plane)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { runningHand } from '../../ui/runninghand.js';
import { cellsOf } from '../../npc/neuralesespelling.js';

/** Who is who: base (the band, the aura), hi (its light), deep (its shade), rim (the keyline). 0 you, 1 the aberrant. */
export const SIDE = [
  { base: 0x2f6fd6, hi: 0x9ee6ff, deep: 0x0e1c40, rim: 0x6fb8ff },
  { base: 0xc8352a, hi: 0xffa060, deep: 0x30080a, rim: 0xff5a40 },
];
export const sideHex = (side, which = 'base') => SIDE[side ? 1 : 0][which];

const cache = new Map();
function canvas(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  return t;
}
const rnd = (s) => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };

/** One of the kit's textures, made once (white on clear: the material tints it). */
export function tex(kind) {
  if (cache.has(kind)) return cache.get(kind);
  let t = null;
  if (kind === 'streaks') t = canvas(128, 128, (x, w, h) => { // (rays rising: a power-up aura's)
    for (let i = 0; i < 26; i++) { const cx = rnd(i) * w, bw = 2 + rnd(i + 9) * 7, y0 = rnd(i + 3) * h, len = h * (0.3 + 0.6 * rnd(i + 5)); const g = x.createLinearGradient(0, y0, 0, y0 + len);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.5 + 0.5 * rnd(i + 7)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g;
      for (const o of [0, -h]) x.fillRect(cx - bw / 2, y0 + o, bw, len); } });
  else if (kind === 'ring') t = canvas(256, 256, (x, w) => { // (a rune circle: rings, ticks and spokes)
    x.translate(w / 2, w / 2); x.strokeStyle = '#fff'; x.lineWidth = 4; for (const r of [120, 104, 64]) { x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); }
    x.lineWidth = 3; for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, r0 = i % 3 ? 106 : 92; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * 118, Math.sin(a) * 118); x.stroke(); }
    x.beginPath(); for (let i = 0; i <= 7; i++) { const a = (i * 3 / 7) * Math.PI * 2 - Math.PI / 2; x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 100, Math.sin(a) * 100); } x.stroke(); }); // (a heptagram: the seven domains)
  else if (kind === 'sand') t = canvas(64, 256, (x, w, h) => { // (a sandfall: streams of grains, lighter at their heart)
    for (let i = 0; i < 900; i++) { const px = w * (0.5 + 0.42 * (rnd(i) - 0.5) * 2 * Math.abs(rnd(i + 1) - 0.5) * 2), py = rnd(i + 2) * h, a = 0.25 + 0.75 * rnd(i + 3);
      x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(px, py, 1 + rnd(i + 4) * 1.5, 2 + rnd(i + 5) * 6); } });
  else if (kind === 'ember') t = canvas(64, 64, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  else if (kind === 'crackle') t = canvas(256, 256, (x, w) => { // (the clay's craze: a net of cracks, kintsugi's when tinted gold)
    x.strokeStyle = '#fff'; x.lineCap = 'round';
    for (let i = 0; i < 40; i++) { let px = rnd(i) * w, py = rnd(i + 40) * w; x.lineWidth = 1 + rnd(i + 80) * 2.5; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 6; k++) { px += (rnd(i * 7 + k) - 0.5) * 70; py += (rnd(i * 11 + k) - 0.5) * 70; x.lineTo(px, py); } x.stroke(); } });
  cache.set(kind, t); return t;
}

/** A line of neuralese in the running hand, tiled along its width (a chant band): the words joined and closed on the star. */
export function chantTexture(words = ['MIRA', 'HILA', 'POTHA', 'FURA', 'FELA', 'MOR', 'PAVA']) {
  const key = 'chant:' + words.join(' '); if (cache.has(key)) return cache.get(key);
  const W = words.map((w) => ({ cells: cellsOf(w.toLowerCase()) }));
  const m = runningHand(null, W, { scale: 3, end: true });
  const t = canvas(Math.max(256, Math.ceil(m.width + 60)), 64, (x, w) => { runningHand(x, W, { x: 24, y: 28, scale: 3, ink: '#ffffff', end: true }); });
  cache.set(key, t); return t;
}

/** The kit's material: the house's basic program with a map, blended, its own copy of the texture so its offset is its own. */
export function scrollMat(texture, hex = 0xffffff, { add = true, opacity = 1, repeat = [1, 1] } = {}) {
  const map = texture ? texture.clone() : null; if (map) { map.needsUpdate = true; map.repeat.set(repeat[0], repeat[1]); }
  return new THREE.MeshBasicMaterial({ name: 'duel-fx', map, color: hex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false, fog: false });
}
export function scroll(mat, dt, su = 0, sv = 0) { const m = mat.map; if (!m) return; m.offset.x = (m.offset.x + su * dt) % 1; m.offset.y = (m.offset.y + sv * dt) % 1; }

/** A group whose children are placed in the world, hung under `root` (the view's, which the duel's instance keeps: render/duelinstance.js)
 *  with root's transform undone, so it is drawn with the duel and goes with it. */
export function worldIn(group, root) {
  if (!root) return; if (group.parent !== root) root.add(group);
  root.updateMatrixWorld(true); group.matrixAutoUpdate = false; group.matrix.copy(root.matrixWorld).invert(); group.matrixWorldNeedsUpdate = true;
}

const BARE = new THREE.Scene();
/** One overlay mesh compiled as the overlay scene draws it: its lights (`S.scene`), the canvas bound and NO clipping plane. three's
 *  compile() keeps the clipping state of the last render() (the world's, which always carries the god hand's plane, godhand.js), so an
 *  empty render with no plane is drawn first: else the compile builds a one-plane program and the first draw a second (the census's twin). */
export function compileOverlay(S, obj) {
  const r = S.r, was = r.getRenderTarget(), clip = r.clippingPlanes, auto = r.autoClear;
  try { r.setRenderTarget(null); r.clippingPlanes = []; r.autoClear = false; r.render(BARE, S.camera); r.compile(obj, S.camera, S.scene); } catch { /* (a headless page without a context: drawn on first use) */ }
  r.clippingPlanes = clip; r.autoClear = auto; r.setRenderTarget(was);
}
