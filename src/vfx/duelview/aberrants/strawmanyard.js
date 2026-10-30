// ---------------------------------------------------------------------------------------
// STRAWMAN'S YARD (plain name; South, 2026-10-30: "Strawman and its domain need to be given more love as far as embracing its
// identity"): the set Strawman's practice duel stands in, beside its elite (aberrants/strawman.js), built the frame dress's and the side
// dress's way (framedress.js, sidedress.js: they call these).
//   ITS POST       the tsuitate's foe-side member wrapped in burlap as Pip would bind it: two sleeves of sacking round the clay (cut
//                  away down the front where the EmO column runs, torn open where the kintsugi seam crosses, so neither readout is
//                  covered), dark cross-stitches up the slit's edges, two stitched patches, straw poking out of every cut edge, a stuffed
//                  burlap target bolted to its outer side (the kiln's red on cream, as its belly's), and a card tag on a string hung
//                  from the top boss, swaying (the elite turns it: `TAG`)
//   ITS YARD       the sparring yard at harvest stood round it in the duel's instance, behind and beyond its end: a stack of square
//                  bales and a round one (its roll facing you), an archery target on its easel with two arrows in it, three of Pip's
//                  other dummies on their posts at the back, bunting strung between two poles over its head (the flags swinging), Pip's
//                  sewing kit at giant scale (two thread spools, one fallen with its thread run out to a needle stuck in the ground, a
//                  tomato pincushion with five pins), and straw blowing across on two sheets
// The textures (made once): the burlap's weave, the target's painted face, straw for the wind and the aura's whirl, and a heptagram
// sewn in running stitch for the aura's ground ring (auras.js asks the elite).
// Programs: the clay's with vertex colours (instanced too, as junk's), Strawman's own sack (the house's standard with a map), the
// kit's basic with a map (fxkit.js): nothing new.
// Prior art: the scarecrow's sacking and twine (Wind Waker's and Ocarina of Time's scarecrows, the Wizard of Oz's), a carnival
// target booth and a village fete's bunting, a sewing basket's tomato pincushion and wooden spools blown up to the size of a toy
// (Toy Story's and The Borrowers' scale), Pip's own stitching on the doll (vfx/strawman.js: its seams, its target, its colours).
//
//   strawmanPost(dress, L)   (framedress.js: L the frame's numbers)   strawmanYard(dress, at, out, back)   (sidedress.js)
//   burlapMaterial()   targetMaterial()   strawTexture()   stitchRingTexture()   TAG (the tag's name)   STRAW_YARD (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { duelMaterials } from '../pieces.js';

/** tufts: straws a tuft; flags: the bunting's; sway: the flags' swing (rad) and rate (/s); planes: the blowing straw's two sheets
 *  (behind its spot, m) and their speed (repeats/s). */
export const STRAW_YARD = { tufts: 5, flags: 15, sway: 0.28, swayRate: 2.6, planes: [[1.3, 0.09], [2.9, 0.05]] };
export const TAG = 'strawman-tag';
/** Strawman's colours (vfx/strawman.js C): its burlap, seams, sleeves, the kiln's red and cream, straw; and the yard's. */
const C = { burlap: 0xcdb48c, sack: 0xb39a72, seam: 0x4a3322, sleeve: 0x3a2f3a, red: 0xb8402e, cream: 0xf3e6c8, straw: 0xe0c070, strawDk: 0xb8913f,
  wood: 0x6b4a2e, woodDk: 0x3b2a1e, twine: 0x6e5a3a, steel: 0xc8ccd4, ochre: 0xd9a441, sage: 0x7d9a6a, lapis: 0x3d5aa8, leaf: 0x4d7a3a };
const UP = new THREE.Vector3(0, 1, 0);
const _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _a = new THREE.Vector3();
const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** A geometry painted one colour (the clay's vertex colours), non-indexed so it merges. */
function paint(g, hex) { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, c = new Float32Array(n * 3); _c.set(hex); for (let i = 0; i < n; i++) c.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
/** A part placed: turned, scaled, moved. */
function put(g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) { _e.set(rx, ry, rz); _q.setFromEuler(_e); return g.applyMatrix4(_m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz))); }
/** A thin box from a to b (a straw, a thread, a pin, a leg). */
function rod(a, b, w, hex) { const d = _a.subVectors(b, a), L = d.length(), g = new THREE.BoxGeometry(w, L, w); g.applyQuaternion(_q.setFromUnitVectors(UP, d.normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return paint(g, hex); }
const merge = (parts) => { if (!parts.length) return null; const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p))); g.computeVertexNormals(); return g; };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** UVs laid by the face's own plane, a tile every `tile` m (a box of sacking reads its weave at one size on every face). */
function planarUV(g, tile) {
  const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), nz = Math.abs(N.getZ(i)), x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const [u, v] = nz >= nx && nz >= ny ? [x, y] : nx >= ny ? [z, y] : [x, z]; uv[i * 2] = u / tile; uv[i * 2 + 1] = v / tile; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}

// ---- the textures, made once
const cache = new Map();
function canvasTex(key, w, h, draw, { repeat = true, srgb = true } = {}) {
  if (cache.has(key)) return cache.get(key); if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  cache.set(key, t); return t;
}
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
/** The weave, tiling on 4 px: dark warp, pale weft, a few slubs (thick threads). */
function weave(x, w, h, base = C.burlap) {
  x.fillStyle = hex(base); x.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 4) { x.fillStyle = `rgba(80,55,30,${0.13 + 0.06 * Math.sin(i * 1.7)})`; x.fillRect(i, 0, 1.4, h); }
  for (let i = 0; i < h; i += 4) { x.fillStyle = `rgba(255,240,210,${0.1 + 0.05 * Math.sin(i * 2.3)})`; x.fillRect(0, i, w, 1.4); }
  for (let i = 0; i < 18; i++) { const sx = Math.floor(hsh(i, 1) * w / 4) * 4, sy = hsh(i, 2) * h, len = 10 + 24 * hsh(i, 3); x.fillStyle = `rgba(70,48,26,${0.18 + 0.12 * hsh(i, 4)})`; x.fillRect(sx, sy, 2, len); x.fillRect(sx, sy - h, 2, len); }
}
export function burlapTexture() { return canvasTex('burlap', 128, 128, (x, w, h) => weave(x, w, h)); }
/** The stuffed target's face: the burlap, the kiln's red on cream painted on it in rings, a ring of dark cross-stitch round its rim. */
export function targetTexture() {
  return canvasTex('target', 256, 256, (x, w) => {
    weave(x, w, w); const m = w / 2;
    for (const [r, col] of [[118, C.red], [94, C.cream], [70, C.red], [46, C.cream], [22, C.red]]) { x.fillStyle = hex(col); x.globalAlpha = 0.9; x.beginPath(); for (let a = 0; a <= 64; a++) { const t = (a / 64) * Math.PI * 2, rr = r + 1.5 * Math.sin(t * 5 + r); x[a ? 'lineTo' : 'moveTo'](m + Math.cos(t) * rr, m + Math.sin(t) * rr); } x.fill(); }
    x.globalAlpha = 0.22; for (let i = 0; i < w; i += 4) { x.fillStyle = '#503720'; x.fillRect(i, 0, 1.2, w); } x.globalAlpha = 1; // (the weave showing through the paint)
    x.strokeStyle = hex(C.seam); x.lineWidth = 3.5; x.lineCap = 'round';
    for (let i = 0; i < 28; i++) { const t = (i / 28) * Math.PI * 2, cx = m + Math.cos(t) * 122, cy = m + Math.sin(t) * 122, s = 5; x.beginPath(); x.moveTo(cx - s, cy - s); x.lineTo(cx + s, cy + s); x.moveTo(cx + s, cy - s); x.lineTo(cx - s, cy + s); x.stroke(); }
  }, { repeat: false });
}
/** Straw for the wind and the whirl: stalks at a slant, in the straw's golds, each drawn twice across the wrap so it tiles. */
export function strawTexture() {
  return canvasTex('straw', 256, 128, (x, w, h) => {
    const cols = ['#e8c96c', '#d9b04f', '#c99a3a', '#f2dc94'];
    for (let i = 0; i < 64; i++) { const px = hsh(i, 1) * w, py = 8 + hsh(i, 2) * (h - 16), len = 12 + 22 * hsh(i, 3), a = (hsh(i, 4) - 0.5) * 0.9, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
      x.strokeStyle = cols[i % 4]; x.lineWidth = 1.8 + 1.4 * hsh(i, 5); x.lineCap = 'round';
      for (const o of [-w, 0, w]) { x.beginPath(); x.moveTo(px + o - dx, py - dy); x.lineTo(px + o + dx, py + dy); x.stroke(); } }
  });
}
/** The aura's ground ring sewn: two circles and the heptagram in running stitch, an X cross-stitched at each of its seven points (white:
 *  the aura tints it its side's). */
export function stitchRingTexture() {
  return canvasTex('stitchring', 256, 256, (x, w) => {
    x.translate(w / 2, w / 2); x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 4.5; x.setLineDash([9, 7]);
    for (const r of [118, 100]) { x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); }
    x.lineWidth = 3.5; x.beginPath(); for (let i = 0; i <= 7; i++) { const a = ((i * 3) / 7) * Math.PI * 2 - Math.PI / 2; x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 96, Math.sin(a) * 96); } x.stroke();
    x.setLineDash([]); x.lineWidth = 4;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 - Math.PI / 2, cx = Math.cos(a) * 109, cy = Math.sin(a) * 109, s = 7; x.beginPath(); x.moveTo(cx - s, cy - s); x.lineTo(cx + s, cy + s); x.moveTo(cx + s, cy - s); x.lineTo(cx - s, cy + s); x.stroke(); }
  }, { repeat: false });
}
/** Strawman's own sack material (vfx/strawman.js `std` with a map: its program), the burlap's weave; and the target's face. Kept: shared by every duel. */
let BURLAP = null, TARGET = null;
export function burlapMaterial() { return (BURLAP ||= Object.assign(new THREE.MeshStandardMaterial({ name: 'strawman', color: 0xffffff, roughness: 0.85, map: burlapTexture() }), { userData: { keep: true } })); }
export function targetMaterial() { return (TARGET ||= Object.assign(new THREE.MeshStandardMaterial({ name: 'strawman', color: 0xffffff, roughness: 0.85, map: targetTexture() }), { userData: { keep: true } })); }

/** A cross-stitch: two thin bars crossed, flat on a face (+z), `s` its size. */
function xStitch(x, y, z, s, hexC, rz = 0) { return [put(paint(new THREE.BoxGeometry(s * 1.4, s * 0.22, 0.004), hexC), x, y, z, 0, 0, rz + Math.PI / 4), put(paint(new THREE.BoxGeometry(s * 1.4, s * 0.22, 0.004), hexC), x, y, z, 0, 0, rz - Math.PI / 4)]; }
/** A tuft of straw splayed out of a seam at `p`, mostly along `dir`. */
function tuft(parts, p, dir, n, len, seed) {
  for (let i = 0; i < n; i++) { const a = (hsh(seed, i) - 0.5) * 1.6, b = (hsh(seed, i + 9) - 0.5) * 1.2, d = dir.clone().applyAxisAngle(UP, a).add(V3(0, b * 0.6, 0)).normalize();
    parts.push(rod(p, p.clone().addScaledVector(d, len * (0.6 + 0.6 * hsh(seed, i + 3))), 0.006, i % 3 ? C.straw : C.strawDk)); }
}

/** Its post (framedress.js): the burlap sleeves, their stitched slit and patches, straw out of the cut edges, the stuffed target, the tag. */
export function strawmanPost(dress, L) {
  const M = duelMaterials(), B = burlapMaterial(), x0 = -L.x, b = L.b, front = L.lip + 0.012, backZ = -L.depth - 0.012, slit = 0.026, xi = x0 - b / 2 - 0.004, xo = x0 + b / 2 + 0.012;
  const cloth = [], thread = [];
  const sleeve = (y0, y1) => { const h = y1 - y0, ym = (y0 + y1) / 2, zt = front - backZ;
    for (const [xa, xb] of [[xi, x0 - slit], [x0 + slit, xo]]) cloth.push(put(new THREE.BoxGeometry(xb - xa, h, 0.012), (xa + xb) / 2, ym, front - 0.006)); // (the front, either side of the slit)
    cloth.push(put(new THREE.BoxGeometry(0.012, h, zt), xo - 0.006, ym, (front + backZ) / 2), put(new THREE.BoxGeometry(xo - xi, h, 0.012), (xi + xo) / 2, ym, backZ + 0.006)); // (the outer side and the back)
    for (let y = y0 + 0.035; y < y1 - 0.02; y += 0.055) for (const s of [-1, 1]) thread.push(...xStitch(x0 + s * (slit + 0.008), y, front + 0.002, 0.012, C.seam)); // (the slit's edges cross-stitched)
  };
  const lo = [L.base - b * 0.55, L.base + L.H * 0.5], hi = [L.base + L.H * 0.79, L.base + L.H + b * 0.7];
  sleeve(...lo); sleeve(...hi);
  for (const g of cloth) planarUV(g, 0.16);
  dress.add(merge(cloth), B);
  // the patches: a darker sacking square and a cream one, each stitched round in the other's thread
  for (const [y, w, hh, col, th] of [[L.base + L.H * 0.18, 0.042, 0.06, 0x8a6a44, C.cream], [L.base + L.H + b * 0.2, 0.04, 0.05, C.cream, C.seam]]) {
    const px = x0 + slit + (xo - x0 - slit) / 2; thread.push(put(paint(new THREE.BoxGeometry(w, hh, 0.003), col), px, y, front + 0.002));
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]]) thread.push(...xStitch(px + dx * w * 0.42, y + dy * hh * 0.42, front + 0.0045, 0.008, th)); }
  // straw out of the sleeves' cut edges (and out of the torn gap between them)
  const straw = [];
  for (const [y, s] of [[lo[1], 1], [hi[0], -1], [lo[0], -1], [hi[1], 1]]) for (let i = 0; i < STRAW_YARD.tufts; i++) {
    const u = i / (STRAW_YARD.tufts - 1), p = u < 0.5 ? V3(xi + (x0 - slit - xi) * u * 2, y, front) : V3(xo, y, front - (front - backZ) * (u - 0.5) * 2);
    tuft(straw, p, V3(u < 0.5 ? 0 : 1, s * 1.3, u < 0.5 ? 0.6 : 0).normalize(), 4, 0.07, i + y * 31); }
  // the stuffed target, bolted to its outer side and facing you; straw round its rim
  const tr = 0.12, tx = xo + 0.07, ty = L.base + L.H * 0.3, tz = front + 0.02, boss = new THREE.CylinderGeometry(tr, tr * 1.04, 0.05, 28, 1); boss.rotateX(Math.PI / 2); boss.translate(tx, ty, tz);
  const tm = new THREE.Mesh(boss, [B, targetMaterial(), B]); tm.castShadow = true; tm.renderOrder = 1; dress.group.add(tm); // (the cylinder's groups: its side, the cap toward you, the cap behind)
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.3, d = V3(Math.cos(a), Math.sin(a), 0); tuft(straw, V3(tx, ty, tz).addScaledVector(d, tr * 0.98), d, 3, 0.05, 40 + i); }
  thread.push(rod(V3(xo - 0.004, ty, tz - 0.02), V3(tx - tr * 0.6, ty, tz - 0.02), 0.014, C.woodDk)); // (its bolt into the post)
  dress.add(merge([...thread, ...straw]), M.clayVc);
  // the tag on its string from the top boss: pivoted at the string's top so the elite can swing it
  const tag = [rod(V3(0, 0, 0), V3(0.012, -0.13, 0), 0.0035, C.twine), put(paint(new THREE.BoxGeometry(0.06, 0.04, 0.003), C.cream), 0.014, -0.15, 0, 0, 0, 0.12),
    put(paint(new THREE.TorusGeometry(0.0055, 0.0015, 4, 10), C.wood), 0.012, -0.133, 0.002), put(paint(new THREE.CircleGeometry(0.009, 10), C.red), 0.017, -0.155, 0.0021),
    put(paint(new THREE.CircleGeometry(0.009, 10), C.red), 0.017, -0.155, -0.0021, 0, Math.PI, 0)]; // (a red dot stamped on it, both faces: no words)
  const T = dress.add(merge(tag), M.clayVc); if (T) { T.name = TAG; T.position.set(xo + 0.005, L.base + L.H + b * 0.5, L.lip + 0.02); }
}

/** Its yard (sidedress.js): the set pieces round Strawman's spot, built in its own frame (x out beyond it, y up, z toward you) and
 *  stood there; one merged mesh of the clay's, the flags instanced, the straw's two sheets scrolled. */
export function strawmanYard(dress, at, out, back) {
  const M = duelMaterials(), parts = [], toward = back.clone().negate(), to = new THREE.Matrix4().makeBasis(out, UP, toward).setPosition(at);
  // the bales: a stack of three square ones, two twine bands each, straw at their ends; a round one rolled to face you
  for (const [bx, by] of [[1.25, 0.23], [2.3, 0.23], [1.78, 0.69]]) { const z = -1.6;
    parts.push(put(paint(new THREE.BoxGeometry(1.0, 0.46, 0.56, 3, 2, 2), hsh(bx, by) < 0.5 ? C.straw : 0xd2b062), bx, by, z));
    for (const k of [-0.24, 0.24]) parts.push(put(paint(new THREE.BoxGeometry(0.025, 0.47, 0.57), C.twine), bx + k, by, z));
    for (const s of [-1, 1]) tuft(parts, V3(bx + s * 0.5, by + 0.1, z + 0.28), V3(s, 0.3, 0.4).normalize(), 5, 0.14, bx * 10 + s); }
  const rb = new THREE.CylinderGeometry(0.55, 0.55, 1.05, 18, 1); rb.rotateX(Math.PI / 2); parts.push(put(paint(rb, 0xd8b862), 3.3, 0.55, -0.85));
  for (const r of [0.14, 0.27, 0.4, 0.5]) parts.push(put(paint(new THREE.TorusGeometry(r, 0.018, 4, 22), C.strawDk), 3.3, 0.55, -0.85 + 0.53)); // (its roll, seen end on)
  // the archery target on its easel, tilted back, two arrows in it
  const T = new THREE.Matrix4().compose(V3(2.7, 1.2, -2.7), _q.setFromEuler(_e.set(-0.2, -0.25, 0)), V3(1, 1, 1)), tgt = [];
  [[0.5, C.red], [0.4, C.cream], [0.3, C.red], [0.2, C.cream], [0.1, C.red]].forEach(([r, col], i) => { const g = new THREE.CylinderGeometry(r, r, 0.16 + i * 0.012, 28, 1); g.rotateX(Math.PI / 2); tgt.push(paint(g, col)); });
  tgt.push(put(paint(new THREE.TorusGeometry(0.5, 0.03, 5, 28), C.strawDk), 0, 0, 0.08));
  for (const [ax, ay, rx, ry] of [[0.12, 0.08, 0.1, 0.35], [-0.22, -0.15, -0.2, -0.3]]) { const shaft = put(paint(new THREE.CylinderGeometry(0.008, 0.008, 0.7, 5), C.wood), ax, ay, 0.4, Math.PI / 2 + rx, 0, ry);
    tgt.push(shaft); for (const k of [0, 1, 2]) tgt.push(put(paint(new THREE.BoxGeometry(0.004, 0.09, 0.05), k ? C.cream : C.red), ax + Math.sin(ry) * 0.33, ay - Math.sin(rx) * 0.33, 0.72, 0, k * 2.1, 0)); }
  for (const g of tgt) parts.push(g.applyMatrix4(T));
  for (const [lx, lz] of [[-0.42, 0.15], [0.42, 0.15], [0, -0.55]]) parts.push(rod(V3(2.7 + lx, 0, -2.7 + lz), V3(2.7 + lx * 0.2, 1.55, -2.72 + lz * 0.15), 0.05, C.wood)); // (the easel's three legs)
  // three of Pip's other dummies on their posts at the back: a post, a crossbar with its sleeves, a sack, a head with its X eyes
  for (const [dx, dz, h, hat] of [[1.0, -3.9, 2.0, true], [2.4, -4.5, 1.8, false], [3.8, -3.4, 2.1, true]]) {
    parts.push(rod(V3(dx, 0, dz), V3(dx, h, dz), 0.07, C.woodDk), put(paint(new THREE.BoxGeometry(1.1, 0.05, 0.05), C.woodDk), dx, h - 0.42, dz));
    for (const s of [-1, 1]) parts.push(put(paint(new THREE.CylinderGeometry(0.09, 0.12, 0.42, 7, 1), C.sleeve), dx + s * 0.32, h - 0.42, dz, 0, 0, s * Math.PI / 2));
    parts.push(put(paint(new THREE.SphereGeometry(0.3, 9, 7), C.sack), dx, h - 0.72, dz, 0, 0, 0, 1, 1.35, 0.85), put(paint(new THREE.SphereGeometry(0.17, 9, 7), C.burlap), dx, h - 0.16, dz + 0.02));
    for (const ex of [-0.06, 0.06]) parts.push(...xStitch(dx + ex, h - 0.13, dz + 0.185, 0.035, C.seam));
    if (hat) parts.push(put(paint(new THREE.BoxGeometry(0.2, 0.26, 0.16), 0x2c2731), dx, h + 0.1, dz - 0.04, 0, 0, 0.08));
    tuft(parts, V3(dx, h - 0.3, dz + 0.05), V3(0, -1, 0.4).normalize(), 4, 0.12, dx * 7); }
  // the bunting's poles and its string (the flags are instanced below)
  const p0 = V3(-0.3, 3.4, -2.6), p1 = V3(4.3, 3.3, -2.2), sag = 0.7, string = [];
  parts.push(rod(V3(p0.x, 0, p0.z), p0, 0.06, C.wood), rod(V3(p1.x, 0, p1.z), p1, 0.06, C.wood));
  const along = (u) => p0.clone().lerp(p1, u).setY(p0.y + (p1.y - p0.y) * u - sag * 4 * u * (1 - u));
  for (let i = 0; i < 24; i++) string.push(rod(along(i / 24), along((i + 1) / 24), 0.012, C.twine));
  parts.push(...string);
  // Pip's sewing kit: two spools (one fallen, its thread run out to a needle in the ground), a tomato pincushion with five pins
  const spool = (thr) => { const g = [paint(new THREE.CylinderGeometry(0.33, 0.33, 0.07, 16), C.wood).translate(0, 0.335, 0), paint(new THREE.CylinderGeometry(0.33, 0.33, 0.07, 16), C.wood).translate(0, -0.335, 0), paint(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16), thr)];
    for (let k = 0; k < 5; k++) g.push(paint(new THREE.TorusGeometry(0.252, 0.008, 3, 20), new THREE.Color(thr).multiplyScalar(0.8).getHex()).rotateX(Math.PI / 2).translate(0, -0.25 + k * 0.12, 0)); return g; };
  for (const g of spool(C.lapis)) parts.push(put(g, 1.15, 0.37, -0.25, 0, 0.4, 0));
  for (const g of spool(C.red)) parts.push(put(g, 1.7, 0.33, 0.55, Math.PI / 2, 0.9, 0));
  const needleAt = V3(0.95, 0, 1.15), thr = new THREE.CatmullRomCurve3([V3(1.55, 0.3, 0.75), V3(1.3, 0.02, 0.95), V3(0.9, 0.02, 1.05), V3(0.75, 0.05, 1.35), needleAt.clone().add(V3(0.08, 0.95, -0.03))]);
  parts.push(paint(new THREE.TubeGeometry(thr, 40, 0.012, 4, false), C.red)); // (the fallen spool's thread run out across the ground, up through the needle's eye)
  parts.push(put(paint(new THREE.ConeGeometry(0.03, 1.15, 6), C.steel), needleAt.x + 0.08, 0.5, needleAt.z - 0.03, 0, 0, 0.14 + Math.PI), put(paint(new THREE.TorusGeometry(0.035, 0.009, 4, 10), C.steel), needleAt.x + 0.155, 1.03, needleAt.z - 0.03, 0, 0, 0.14));
  const tom = new THREE.SphereGeometry(0.42, 16, 10), P = tom.attributes.position; // (the tomato: lobed by its eight seams, squashed)
  for (let i = 0; i < P.count; i++) { _p.fromBufferAttribute(P, i); const k = 1 - 0.07 * Math.pow(Math.abs(Math.cos(Math.atan2(_p.z, _p.x) * 4)), 0.5) * (1 - Math.abs(_p.y) / 0.42); P.setXYZ(i, _p.x * k, _p.y * 0.72, _p.z * k); }
  parts.push(put(paint(tom, C.red), 2.55, 0.3, -0.2));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; parts.push(put(paint(new THREE.ConeGeometry(0.045, 0.2, 3), C.leaf), 2.55 + Math.cos(a) * 0.08, 0.6, -0.2 + Math.sin(a) * 0.08, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2)); }
  [[0.25, 0.4, C.cream], [-0.5, 0.2, C.lapis], [1.2, 0.5, C.ochre], [2.3, 0.3, C.sage], [3.4, 0.45, C.cream]].forEach(([a, tilt, col]) => {
    const base = V3(2.55 + Math.cos(a) * 0.25, 0.46, -0.2 + Math.sin(a) * 0.25), top = base.clone().add(V3(Math.cos(a) * tilt, 0.7, Math.sin(a) * tilt));
    parts.push(rod(base, top, 0.016, C.steel), put(paint(new THREE.SphereGeometry(0.065, 8, 6), col), top.x, top.y, top.z)); });
  const geo = merge(parts); geo.applyMatrix4(to); const yard = dress.mesh(geo, M.clayVc); yard.castShadow = true;
  // the flags: instanced on the clay's program (junk's), each its colour, swinging on the string
  const N = STRAW_YARD.flags, flag = new THREE.BufferGeometry(); flag.setAttribute('position', new THREE.Float32BufferAttribute([-0.12, 0, 0, 0.12, 0, 0, 0, -0.26, 0, 0.12, 0, 0, -0.12, 0, 0, 0, -0.26, 0], 3)); flag.computeVertexNormals(); paint(flag, 0xffffff);
  const flags = new THREE.InstancedMesh(flag, M.clayVc, N); flags.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3); flags.frustumCulled = false; dress.group.add(flags);
  const cols = [C.red, C.cream, C.ochre, C.sage, C.lapis], pins = [];
  for (let i = 0; i < N; i++) { const u = (i + 0.5) / N, p = along(u).applyMatrix4(to), tan = along(Math.min(1, u + 0.01)).sub(along(Math.max(0, u - 0.01))).transformDirection(to); flags.setColorAt(i, _c.setHex(cols[i % cols.length]));
    const n = _a.crossVectors(tan, UP).normalize(), yv = new THREE.Vector3().crossVectors(n, tan); // (square to the string where it slopes)
    pins.push({ p, q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tan, yv, n)), seed: hsh(i, 5) * 6 }); }
  const ax = new THREE.Vector3(1, 0, 0), qs = new THREE.Quaternion(), one = V3(1, 1, 1);
  dress.ticks.push((dt, t) => { for (let i = 0; i < N; i++) { const F = pins[i]; qs.setFromAxisAngle(ax, Math.sin(t * STRAW_YARD.swayRate + F.seed) * STRAW_YARD.sway * (0.6 + 0.4 * Math.sin(t * 0.7 + F.seed))); _q.copy(F.q).multiply(qs); flags.setMatrixAt(i, _m.compose(F.p, _q, one)); } flags.instanceMatrix.needsUpdate = true; });
  // straw blowing across, two sheets behind its spot
  for (const [bz, su] of STRAW_YARD.planes) { const m = dress.fx(new THREE.PlaneGeometry(7.5, 2.6), strawTexture(), 0xffffff, { add: false, opacity: 0.85, repeat: [3.5, 1] }, su, 0, V3(2.2, 1.3, -bz).applyMatrix4(to));
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(out, UP, toward)); } // (blowing toward you: the offset climbing runs the straw down -u, toward the board)
}
