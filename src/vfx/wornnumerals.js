// ---------------------------------------------------------------------------------------
// THE NUMERALS WORN: a neuralese numeral fitted into a box on a thing's own canvas (South's ruling via Espada, 2026-10-29; LORE.md,
// "The numerals"; docs/handoffs/calissa/2026-10-29-from-espada-numerals-on-things.md). Things wear neuralese numerals; wherever a player
// acts on the number, its Arabic readout is said beside it by the thing's own UI (this module draws only the numeral).
//
// Two hands, one fitting: the running hand (ui/runninghand.js: each digit hung on its pin from the bus) and the Comb
// (vfx/sealface.js drawCombNumber: a doubled hex cell a digit, for a count etched or stamped). Each is measured with ctx null, then
// centred in the box and scaled to fit it (numeralAt in vfx/bazaarfaces.js, the dice's, was the first and now calls this).
// `even: true` (the default) scales every number by the tallest digit (9 hangs lowest), so a ring or a row of them shares one size and
// one bus line; `even: false` fits each number's own ink (a die face, alone in its cell).
//
// Prior art: the clock face that wears Roman numerals over a time everyone reads; mahjong's character suit (learned at the table).
//
//   numeralFit(ctx, n, { x, y, w, h, ink, lw, even, max }) -> { k, width, height }   the running hand centred on (x, y) in w x h;
//     k the hand's scale (max caps it, 3.2), lw a stroke width (k * 0.75, never under 1.1)
//   combFit(ctx, n, { x, y, w, h, ink }) -> { size, width, height }   the Comb centred on (x, y) in w x h
//   ctx null measures only.
//   numeralDecals(items, { hand, ink, back, cell, aspect, name }) -> THREE.Mesh   numbers on things in the world (a post, a gate's
//     pillar, a floor), one draw however many: every quad merged, its numbers in one baked atlas (a cell a number, drawn once).
//     items: [{ n, pos, normal, up?, size }] (pos the quad's middle, normal the way it faces, up where its bus points: world Y when
//     not given; size its height in metres, its width size x aspect); hand 'running' (default) or 'comb'; ink the numeral's colour;
//     back a plate's colour under it (none: the numeral alone, cut out). The mesh's userData.dispose() lets its geometry and atlas go
//     (a holder's own traverse that disposes geometry and material takes the atlas with the material).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { runningHand } from '../ui/runninghand.js';
import { drawCombNumber } from './sealface.js';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';

const measure = (n) => runningHand(null, [{ num: n }], { scale: 1 });
let TALL = 0;
/** The tallest a digit hangs below the bus, and where the ink starts above it (every digit 0 .. 9). */
function tall() {
  if (!TALL) for (let d = 0; d <= 9; d++) { const m = measure(d); TALL = Math.max(TALL, m.y1); }
  return TALL;
}

export function numeralFit(ctx, n, { x = 0, y = 0, w = 32, h = 32, ink = '#e8b84a', lw, even = true, max = 3.2 } = {}) {
  const m = measure(n), mw = Math.max(1, m.x1 - m.x0);
  const y0 = m.y0, y1 = even ? tall() : m.y1, mh = Math.max(1, y1 - y0), k = Math.min(w / mw, h / mh, max);
  if (ctx) runningHand(ctx, [{ num: n }], { x: x - (m.x0 + mw / 2) * k, y: y - (y0 + mh / 2) * k, scale: k, ink, lw: lw ?? Math.max(1.1, k * 0.75) });
  return { k, width: mw * k, height: mh * k };
}

export function combFit(ctx, n, { x = 0, y = 0, w = 32, h = 32, ink = '#e8b84a' } = {}) {
  const one = drawCombNumber(null, n, { size: 1 }), size = Math.min(w / one.width, h / one.height);
  const W = one.width * size, H = one.height * size;
  // (drawCombNumber's x, y is the first cell's centre: half a cell in from the left, half a hex's height down from the top)
  if (ctx) drawCombNumber(ctx, n, { x: x - W / 2 + size / 2, y: y - H / 2 + size * Math.sqrt(3) / 4, size, ink });
  return { size, width: W, height: H };
}

const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _n = new THREE.Vector3();
export function numeralDecals(items, { hand = 'running', ink = '#e8b84a', back = null, cell = 96, aspect = 1.4, name = 'numerals' } = {}) {
  const ns = [...new Set(items.map((it) => it.n))], cols = Math.ceil(Math.sqrt(ns.length)), rows = Math.ceil(ns.length / cols);
  const cw = Math.round(cell * aspect), ch = cell, W = cols * cw, H = rows * ch, at = new Map(ns.map((n, i) => [n, i]));
  const map = bakedCanvasTexture((g) => {
    g.clearRect(0, 0, W, H);
    ns.forEach((n, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      if (back) { g.fillStyle = back; g.fillRect(x + ch * 0.04, y + ch * 0.04, cw - ch * 0.08, ch * 0.92); }
      const o = { x: x + cw / 2, y: y + ch / 2, w: cw * 0.8, h: ch * 0.72, ink };
      if (hand === 'comb') combFit(g, n, o); else numeralFit(g, n, { ...o, lw: ch * 0.07, max: 99 });
    });
  }, W, H);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const pos = new Float32Array(items.length * 12), uv = new Float32Array(items.length * 8), idx = [];
  items.forEach((it, k) => {
    _n.copy(it.normal).normalize(); _u.copy(it.up || THREE.Object3D.DEFAULT_UP); _u.addScaledVector(_n, -_u.dot(_n));
    if (_u.lengthSq() < 1e-8) _u.set(0, 0, -1).addScaledVector(_n, _n.z); // (a floor's with no up given: its bus toward -z)
    _u.normalize();
    _r.crossVectors(_u, _n); const hh = it.size / 2, hw = (it.size * aspect) / 2, i = at.get(it.n), c = i % cols, r = Math.floor(i / cols);
    const u0 = c / cols, u1 = (c + 1) / cols, v1 = 1 - r / rows, v0 = 1 - (r + 1) / rows;
    [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]].forEach(([a, b, U, V], j) => {
      pos.set([it.pos.x + _r.x * a * hw + _u.x * b * hh, it.pos.y + _r.y * a * hw + _u.y * b * hh, it.pos.z + _r.z * a * hw + _u.z * b * hh], k * 12 + j * 3);
      uv.set([U, V], k * 8 + j * 2);
    });
    idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.computeBoundingSphere();
  const mat = new THREE.MeshBasicMaterial({ name: `${name}-numerals`, map, transparent: true, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); // (one pass: a flat decal has no back to order, and a double-sided transparent material is two programs otherwise: the casebook's rule 93)
  const mesh = new THREE.Mesh(geo, mat); mesh.name = name; mesh.renderOrder = 2;
  mat.addEventListener('dispose', () => map.dispose()); // (the atlas goes with its material, however its holder lets go of it)
  mesh.userData.dispose = () => { geo.dispose(); mat.dispose(); };
  return mesh;
}
