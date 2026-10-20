// ---------------------------------------------------------------------------------------
// THE RAIL FOES' KIT: how a rail foe's body is put together (vfx/railfoes.js; the roster in docs/plans/RAIL-MODULES.md section 6,
// Dovina's). A body is primitives baked into ONE geometry per piece, each vertex carrying what the one shared body program reads:
//   color  its albedo (linear), from the palette below (the Wreckers' iron, tar and rust; the Egregores' brine hide; the strays' glaze)
//   fx     four glow weights: x accent (the feeling's colour, always lit: a lantern, a bioluminescent spot), y tell (the feeling's colour,
//          lit by the tell's k: a muzzle, a lens, a lure, a vent), z weak (gold, lit only when revealed: the blocker's seam, the
//          gunship's open cradle), w ember (a dull red: the forged cradle's empty socket, a fireship's embers)
//   part   xyz the centre of the primitive's group (what flies apart on a death), w how much it flexes (a ray's wing, a fish's tail)
//   unit   x which of the body's units it belongs to (0 the body; a gunship's guns and core 1..3: hit and downed alone), y its slide (a
//          shutter's side: it slides open with the core)
// and beside it a HALO geometry: camera-facing quads at the muzzles and lanterns, drawn by the one additive program.
//
// Prior art: the bracelet's merged body (vfx/bracelet.js: one geometry, glow weights per vertex, one program), the vertex-coloured low
// poly of the sixth generation's ships (the Gummi ship blocks: primitives put together, their colour in the vertex), and a ship model's
// lofted hull (stations along the keel, a section at each).
//
//   const k = new FoeKit()   k.add(geo, { c, fx, flex, p, r, s, g })   k.halo([x,y,z], size, ch)   k.muzzle(name, [x,y,z])   k.weak([x,y,z])
//   k.build() -> { geo, halos, muzzles, weakAt, tris }   haloGeometry(halos) -> BufferGeometry
//   hull({ L, B, D, bow, stern, sheer, segs, ring }) -> BufferGeometry (+Z the bow)   slab(points2d, depth) -> BufferGeometry (in XY, centred on Z)
//   tube(points3d, r, segs?) -> BufferGeometry   PAL (the palette)   HALO_CH { tell, accent, weak, ember, link }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The palette: mid-dark bodies so the bright, feeling-coloured shots read against them (RAIL-FOES-ARCHETYPES.md 4.1, 5.2). */
export const PAL = {
  // the Wreckers: the player's ship types gone wrong (Espada's canon): dark iron and tar, rust and red
  tar: 0x24201d, iron: 0x3c3c44, ironL: 0x55555e, rust: 0x7a3a1e, rustL: 0x9c4a24, wood: 0x3e2c20, sail: 0x4a4038, sailD: 0x332c27,
  brass: 0x6a5a30, lens: 0xd8d0c0, socket: 0x120c0a,
  // the Egregores: unglazed, the Brine dress (wet grey-blue hide, a pale belly, barnacle and pearl)
  hide: 0x45586a, hideD: 0x2e3c48, belly: 0x9aa8b0, barn: 0xb4ae9c, pearl: 0xe8e4dc, mouth: 0x1a1418, tooth: 0xd8d2c0,
  // the strays: bright, glaze-like
  porc: 0xf0ebe0, porcD: 0xc8c0b0,
  // the carrier: Lachrymite in a clay-and-brass lantern
  crystal: 0xa8d8e8, clay: 0x8a5a3a, clayD: 0x5e3c28,
};
export const HALO_CH = { tell: 0, accent: 1, weak: 2, ember: 3, link: 4 };

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();
const lin = (hex) => _c.setHex(hex); // (THREE.Color takes sRGB hex to the working linear space)

export class FoeKit {
  constructor() { this.items = []; this.halos = []; this.muzzles = {}; this.weakAt = null; }

  /** One primitive: c a hex (or (x,y,z) -> hex, in the baked frame), fx [accent, tell, weak, ember], flex a weight (or (x,y,z) -> weight),
   *  p/r/s its place, rotation (radians, XYZ) and scale (a number or [x,y,z]), g its group (a group's primitives fly apart as one). */
  add(geo, { c = PAL.iron, fx = null, flex = 0, p = [0, 0, 0], r = [0, 0, 0], s = 1, g = null } = {}) {
    let G = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(G.attributes)) if (k !== 'position' && k !== 'normal') G.deleteAttribute(k);
    if (!G.attributes.normal) G.computeVertexNormals();
    _s.set(...(Array.isArray(s) ? s : [s, s, s]));
    _m.compose(_v.set(...p), _q.setFromEuler(_e.set(...r)), _s);
    G.applyMatrix4(_m);
    const n = G.attributes.position.count, P = G.attributes.position.array;
    const col = new Float32Array(n * 3), fxa = new Float32Array(n * 4), part = new Float32Array(n * 4), unit = new Float32Array(n * 2);
    const F = fx || [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      lin(typeof c === 'function' ? c(x, y, z) : c); col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
      const ff = typeof fx === 'function' ? fx(x, y, z) : F;
      fxa[i * 4] = ff[0]; fxa[i * 4 + 1] = ff[1]; fxa[i * 4 + 2] = ff[2]; fxa[i * 4 + 3] = ff[3];
      part[i * 4 + 3] = typeof flex === 'function' ? flex(x, y, z) : flex;
    }
    G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    G.setAttribute('fx', new THREE.BufferAttribute(fxa, 4));
    G.setAttribute('part', new THREE.BufferAttribute(part, 4));
    G.setAttribute('unit', new THREE.BufferAttribute(unit, 2));
    this.items.push({ geo: G, g: g ?? `#${this.items.length}` });
    return this;
  }
  /** A camera-facing glow at a point: size its half-width (m), ch one of HALO_CH. */
  halo(at, size, ch = HALO_CH.tell) { this.halos.push({ at, size, ch }); return this; }
  muzzle(name, at) { this.muzzles[name] = at; return this; }
  weak(at) { this.weakAt = at; return this; }

  build() {
    // each group's centre, written into its primitives' `part`
    const groups = new Map();
    for (const it of this.items) { const b = groups.get(it.g) || new THREE.Box3(); it.geo.computeBoundingBox(); b.union(it.geo.boundingBox); groups.set(it.g, b); }
    for (const it of this.items) {
      groups.get(it.g).getCenter(_v); const A = it.geo.attributes.part.array;
      for (let i = 0; i < A.length; i += 4) { A[i] = _v.x; A[i + 1] = _v.y; A[i + 2] = _v.z; }
    }
    const geo = mergeGeometries(this.items.map((i) => i.geo));
    for (const i of this.items) i.geo.dispose();
    geo.computeBoundingSphere();
    return { geo, halos: this.halos, muzzles: this.muzzles, weakAt: this.weakAt, tris: geo.attributes.position.count / 3 };
  }
}

/** The halos as quads: position the corner (-1..1 in xy), hc the centre and size, hk (mode 0 a billboard, channel, unit). */
export function haloGeometry(halos) {
  const n = halos.length * 6, pos = new Float32Array(n * 3), hc = new Float32Array(n * 4), hk = new Float32Array(n * 3);
  const C = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
  halos.forEach((h, j) => C.forEach(([x, y], k) => {
    const i = j * 6 + k; pos[i * 3] = x; pos[i * 3 + 1] = y;
    hc[i * 4] = h.at[0]; hc[i * 4 + 1] = h.at[1]; hc[i * 4 + 2] = h.at[2]; hc[i * 4 + 3] = h.size;
    hk[i * 3] = 0; hk[i * 3 + 1] = h.ch; hk[i * 3 + 2] = h.unit || 0;
  }));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('hc', new THREE.BufferAttribute(hc, 4)); g.setAttribute('hk', new THREE.BufferAttribute(hk, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4); // (its quads are moved in the shader: never culled by a box that cannot know)
  return g;
}

/** A lofted hull: stations from the stern (z -L/2) to the bow (z +L/2), each a U section closed by the deck; faceted. */
export function hull({ L = 2, B = 0.6, D = 0.35, bow = 0.35, stern = 0.55, sheer = 0.12, segs = 10, ring = 8, flare = 1 } = {}) {
  const rows = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, z = -L / 2 + t * L;
    let w = t > 1 - bow ? Math.sqrt(Math.max(0, (1 - t) / bow)) : 1;
    w *= stern + (1 - stern) * Math.min(1, t / 0.2 + 0.0001) ** 0.5;
    const hw = (B / 2) * w, d = D * (0.55 + 0.45 * Math.min(1, w * 1.4)), y0 = sheer * (2 * t - 1) ** 2;
    const row = [];
    for (let j = 0; j <= ring; j++) { const a = (j / ring) * Math.PI; row.push([hw * Math.cos(a) * (1 + 0.08 * flare * Math.sin(a)), y0 - d * Math.sin(a) ** 0.7, z]); }
    rows.push(row);
  }
  const P = [];
  const tri = (a, b, c) => P.push(...a, ...b, ...c);
  for (let i = 0; i < segs; i++) {
    const A = rows[i], Bn = rows[i + 1];
    for (let j = 0; j < ring; j++) { tri(A[j], Bn[j], Bn[j + 1]); tri(A[j], Bn[j + 1], A[j + 1]); }
    tri(A[ring], Bn[ring], Bn[0]); tri(A[ring], Bn[0], A[0]); // (the deck)
  }
  const S = rows[0], c0 = [0, S[0][1] - D * 0.4, S[0][2]];
  for (let j = 0; j < ring; j++) tri(c0, S[j], S[j + 1]); // (the transom, facing astern)
  tri(c0, S[ring], S[0]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
  return g;
}

/** A flat outline (points in XY) given thickness along Z, centred on it: a sail, a fin, a wing. */
export function slab(points, depth = 0.04) {
  const sh = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -depth / 2);
}

/** A tube through points (a stalk, a chain, a cable). */
export function tube(points, r = 0.03, segs = 10, radial = 5) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), segs, r, radial, false);
}
