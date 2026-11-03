// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S PROPS (plain names; South, 2026-11-03: "super fancy"): what hangs off the adobe buildings' cells, drawn as one
// instanced mesh a kind for the whole city: vigas poking through under the roofs, canales spouting off the parapets, the toron
// bristling from Djenné's faces, ladders leaning from roof to roof, ristras by the doors, ollas and tinajas, bells in the belfries,
// flags, crosses, finials (an ostrich egg, a gilded ball), cloth awnings over the bazaar's arches and kilims hung on a wall. Each is
// keyed to the cell it hangs from (a blueprint's `props`, vfx/mechs/city/blueprintkit.js) and hidden when that cell is gone.
// Prior art: the house's instance pools (render/propbatch.js's way: one draw a kind, a matrix an instance, hidden by a zero scale), the
// pueblo's and the Sahel's own furniture (Taos's vigas and ladders, Djenné's toron and ostrich eggs, Santa Fe's canales and ristras).
//
//   PROP_KINDS   PROP_LOOK   propGeometry(kind) -> BufferGeometry (unit, +z out of its face, +y up)   propMatrix(p, out) (its pose on its cell)
//   propColour(p) -> hex
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FACE_DIR } from '../../../progress/mechs/adobe/blueprintkit.js';

/** Each kind's colours (a pick by the prop's `c`) and how it stands. */
export const PROP_LOOK = {
  viga: { colour: [0x6b4a2e, 0x5a3c24, 0x7a5636] },
  canale: { colour: [0x6e5034, 0x5e4430] },
  toron: { colour: [0x8a7458, 0x7a664e] },
  ladder: { colour: [0x9a7b52, 0x86683f] },
  ristra: { colour: [0xb3261e, 0x9c1d18] },
  pot: { colour: [0xb5653a, 0x2a6f8f, 0x3f8f6a, 0xd9c9a3, 0x8c3b2a] },
  jar: { colour: [0xb86a40, 0xc9a77c, 0x7e4a30, 0x3f7f8f] },
  bell: { colour: [0x9a7a3a, 0x7d6a4a] },
  flag: { colour: [0xc23b22, 0x1f5fa8, 0x2e8b57, 0xe0b23a, 0xf2ecdc] },
  cross: { colour: [0x3a2c22] },
  finial: { colour: [0xd4a640, 0xf4efe4] },
  awning: { colour: [0xc0392b, 0x1f6fa8, 0xd9a52b, 0x2e8b57, 0x7a3e9d] },
  rug: { colour: [0xa8322a, 0x2f4f8f, 0xc98a2b, 0x5a7a3a] },
};
export const PROP_KINDS = Object.keys(PROP_LOOK);

const lathe = (pts, seg = 10) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const paint = (g, hex) => { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
const plain = (g) => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k); return g; };
const join = (parts) => { const g = mergeGeometries(parts.map((p) => plain(p.attributes.color ? p : paint(p, 0xffffff)))); g.computeBoundingSphere(); return g; };

/** A kind's unit geometry: in its cell's face frame (z out of the face, y up, its origin on the face at the cell's middle), white
 *  vertex colours (stripes and shades) the instance's colour multiplies. */
export function propGeometry(kind) {
  if (kind === 'viga') { const g = new THREE.CylinderGeometry(0.16, 0.18, 1, 7); g.rotateX(Math.PI / 2); g.translate(0, 0.3, 0.45); return join([g]); }
  if (kind === 'toron') { const g = new THREE.CylinderGeometry(0.05, 0.08, 1, 5); g.rotateX(Math.PI / 2 - 0.12); g.translate(0, 0, 0.42); return join([g]); }
  if (kind === 'canale') {
    const base = new THREE.BoxGeometry(0.42, 0.06, 1.4), a = new THREE.BoxGeometry(0.06, 0.22, 1.4), b = a.clone();
    a.translate(-0.18, 0.1, 0); b.translate(0.18, 0.1, 0); const g = join([base, a, b]); g.rotateX(0.14); g.translate(0, -0.35, 0.6); return g;
  }
  if (kind === 'ladder') { // (unit height: scaled by its length; leaned in propMatrix)
    const parts = []; for (const x of [-0.32, 0.32]) { const r = new THREE.BoxGeometry(0.12, 1.12, 0.12); r.translate(x, 0.56, 0); parts.push(r); }
    for (let k = 1; k < 9; k++) { const r = new THREE.CylinderGeometry(0.035, 0.035, 0.64, 4); r.rotateZ(Math.PI / 2); r.translate(0, k / 9.5, 0); parts.push(r); }
    return join(parts);
  }
  if (kind === 'ristra') {
    const parts = []; for (let k = 0; k < 9; k++) { const s = new THREE.SphereGeometry(0.11 - k * 0.006, 5, 4); s.scale(1, 1.5, 1); s.translate(((k * 37) % 5 - 2) * 0.03, -0.15 - k * 0.12, 0.14); parts.push(paint(s, k % 3 ? 0xffffff : 0xd8c8c0)); }
    const cord = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 3); cord.translate(0, -0.05, 0.14); parts.push(paint(cord, 0x705030));
    return join(parts);
  }
  if (kind === 'pot') { const g = lathe([[0.01, 0], [0.22, 0.03], [0.34, 0.28], [0.3, 0.48], [0.16, 0.6], [0.17, 0.68], [0.12, 0.68]]); return join([g]); }
  if (kind === 'jar') { const g = lathe([[0.01, 0], [0.18, 0.04], [0.44, 0.55], [0.38, 0.95], [0.2, 1.1], [0.23, 1.2], [0.17, 1.2]]); return join([g]); }
  if (kind === 'bell') { const g = lathe([[0.02, 0.5], [0.12, 0.48], [0.18, 0.3], [0.26, 0.08], [0.34, 0], [0.3, 0.02]], 12); g.translate(0, -0.5, 0); const y = new THREE.BoxGeometry(0.7, 0.08, 0.08); y.translate(0, 0.04, 0); return join([g, paint(y, 0x5a4a3a)]); }
  if (kind === 'flag') {
    const pole = new THREE.CylinderGeometry(0.05, 0.06, 3.2, 5); pole.translate(0, 1.6, 0);
    const cloth = new THREE.PlaneGeometry(1.4, 0.9, 4, 2); cloth.translate(0.72, 2.7, 0); const p = cloth.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 3.2) * 0.1);
    cloth.computeVertexNormals();
    return join([paint(pole, 0x4a3a2a), cloth, (() => { const c = cloth.clone(); c.rotateY(Math.PI); c.translate(1.44, 0, 0); return c; })()]);
  }
  if (kind === 'cross') { const a = new THREE.BoxGeometry(0.16, 1.7, 0.16), b = new THREE.BoxGeometry(0.9, 0.16, 0.16); a.translate(0, 0.85, 0); b.translate(0, 1.2, 0); return join([a, b]); }
  if (kind === 'finial') { const s = new THREE.SphereGeometry(0.3, 10, 8); s.scale(1, 1.3, 1); s.translate(0, 0.62, 0); const st = new THREE.CylinderGeometry(0.06, 0.1, 0.3, 6); st.translate(0, 0.15, 0); return join([s, paint(st, 0xd4a640)]); }
  if (kind === 'awning' || kind === 'rug') { // (unit width: scaled by its length; stripes in the vertex colours)
    const W = 12, g = new THREE.PlaneGeometry(1, kind === 'rug' ? 1.6 : 1.5, W, 1), p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const s = Math.floor((p.getX(i) + 0.5) * W - 1e-4), k = kind === 'rug' ? (Math.floor((p.getY(i) + 0.8) * 5) % 2 ? 0.75 : 1) : s % 2 ? 0.95 : 1; const v = kind === 'awning' && s % 2 ? [1, 0.93, 0.82] : [k, k, k]; c.set(v, i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    if (kind === 'awning') { g.rotateX(-Math.PI / 2 + 0.42); g.translate(0, 0.2, 0.7); } else g.translate(0, -0.3, 0.04);
    const gg = plain(g); gg.computeBoundingSphere(); return gg;
  }
  return join([new THREE.BoxGeometry(0.3, 0.3, 0.3)]);
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const hash = (a, b, c) => { let h = Math.imul(a * 73856093 ^ b * 19349663 ^ c * 83492791, 2654435761); h ^= h >>> 13; return ((h >>> 0) % 10007) / 10007; };

/** A prop's pose in its building's frame (a cell's middle at its index + 0.5 - w / 2, y + 0.5, z + 0.5 - d / 2): on its face, turned out
 *  of it; on top of the cell for a face 'up'. */
export function propMatrix(p, b, out) {
  const cx = p.x + 0.5 - b.w / 2, cy = p.y + 0.5, cz = p.z + 0.5 - b.d / 2, f = FACE_DIR[p.f] || FACE_DIR[1], up = p.f === 4;
  const yaw = up ? hash(p.x, p.y, p.z) * Math.PI * 2 : Math.atan2(f[0], f[2]), j = hash(p.z, p.x, p.y);
  let sx = 1, sy = 1, sz = 1, pitch = 0;
  _p.set(cx + f[0] * 0.5, cy + f[1] * 0.5, cz + f[2] * 0.5);
  if (up) { _p.x += (j - 0.5) * 0.3; _p.z += (hash(p.y, p.z, p.x) - 0.5) * 0.3; }
  if (p.kind === 'ladder') { const L = p.len || 5; sy = L; pitch = -0.28; _p.y = cy - 0.5; _p.x += f[0] * (L * 0.28 + 0.1); _p.z += f[2] * (L * 0.28 + 0.1); }
  if (p.kind === 'bell') { _p.set(cx, cy - 0.55, cz); }
  if (p.kind === 'awning' || p.kind === 'rug') sx = p.len || 2;
  if (p.kind === 'pot' || p.kind === 'jar') { const s = (p.s || 1) * (0.85 + j * 0.35); sx = sy = sz = s; }
  if (p.kind === 'viga' || p.kind === 'toron') sz = 0.85 + j * 0.4;
  _e.set(pitch, yaw, 0, 'YXZ'); _q.setFromEuler(_e); _s.set(sx, sy, sz);
  return out.compose(_p, _q, _s);
}

/** A prop's colour: its kind's, picked by its `c` (or by its cell). */
export function propColour(p) { const L = PROP_LOOK[p.kind]?.colour || [0xffffff]; return L[((p.c ?? Math.floor(hash(p.x, p.y, p.z) * 7)) % L.length + L.length) % L.length]; }
