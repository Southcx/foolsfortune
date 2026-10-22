// ---------------------------------------------------------------------------------------
// AN ISLET'S LOOK, ITS KIT: how an islet's look is put together (vfx/opensea/isletlooks.js; the islets: progress/opensea/islets.js,
// Dovina's). A look is primitives baked into ONE geometry, each vertex carrying what the one shared islet program reads:
//   color  its albedo, from the palette below (wet dark stone, pale sand, sun-bleached driftwood, a little gold)
//   glow   how much of its albedo it gives off as light (0 for nearly everything; a Lachrymite crystal, a gold glint)
// and beside it the colliders its tall things need (a pillar, a tower, a column, an arch's legs), in the look's own frame (the islet's
// centre on its walkable top, +Y up), for isletlooks.js to lay into Rapier.
// The mound is the islet's body: a flat top exactly the collider's disc (so the Courier never floats over it or sinks into it) and a
// skirt that slopes from its rim down under the water.
//
// Prior art: the rail foes' kit (vfx/railfoes/kit.js: primitives baked to one geometry, their colour in the vertex), the sixth
// generation's vertex-coloured low poly (Wind Waker's islets: a mound, a tree, one thing on it), and value noise (Perlin's lattice,
// smoothed, the cheapest that does not shimmer) for the mottling and the lumps.
//
//   const k = new IsletKit()   k.add(geo, { c, glow, p, r, s })   k.lump(r, rng, { c, p, s, rough })   k.mound({ ... })
//   k.collider({ cyl: [halfH, r] | ball: r | box: [hx, hy, hz], at: [x, y, z], yaw })   k.build() -> { geo, colliders, tris }
//   noise2(x, z) -> 0..1   twoSided(geo) -> geo (a frond, a net: the faces doubled, flipped)   PAL (the palette)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/** The palette (sRGB hex): wet dark stone, pale sand, sun-bleached driftwood, Anagami's clay, a little gold. */
export const PAL = {
  basalt: 0x3c3a38, basaltL: 0x55514b, basaltW: 0x262524, weed: 0x46542a, weedD: 0x323c1e, deep: 0x1c1b1b,
  sand: 0xe8dcb8, sandL: 0xf2e8cc, sandW: 0xc4b28c, sandD: 0x9a8868, coral: 0xe6c8b4, coralP: 0xd89a88,
  strata: [0x5a4e44, 0x9a8a74, 0x4a423c, 0x7e6c58], guano: 0xece8de,
  clay: 0xb57c58, clayL: 0xc8926a, clayD: 0x8a5a40, clayW: 0x5e3e2e,
  stone: 0x8a847a, stoneD: 0x5c5852, turf: 0x6a7448, turfD: 0x55603a,
  white: 0xd8d2c4, red: 0x8a4a3a, rust: 0x6a3a24, iron: 0x2e2c2c, glass: 0x1a2226, verd: 0x3e5048,
  drift: 0xcfc6b2, driftD: 0x9e9482, wood: 0x6a4428, woodD: 0x4a2e1a, rope: 0x9a8a6a,
  gold: 0xd4a53c, goldL: 0xf0cc6a, crystal: 0x9fe8f0, crystalD: 0x58b8d0, nest: 0x2a2030, nestL: 0x3e2e40, mote: 0xb070d0,
  shallows: 0x40d0c0, shallowsP: 0x9fe0d0,
};

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();

/** Value noise on a lattice, smoothed: 0..1, its features about a unit apart. */
const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function noise2(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}

/** The faces doubled and flipped, so a thin sheet shows from both sides on the one single-sided program. */
export function twoSided(geo) {
  const G = geo.index ? geo.toNonIndexed() : geo;
  const P = G.attributes.position.array, N = G.attributes.normal.array, n = P.length / 9;
  const p2 = new Float32Array(P.length * 2), n2 = new Float32Array(N.length * 2);
  p2.set(P); n2.set(N);
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const src = t * 9 + [0, 2, 1][k] * 3, dst = P.length + t * 9 + k * 3;
    for (let a = 0; a < 3; a++) { p2[dst + a] = P[src + a]; n2[dst + a] = -N[src + a]; }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(p2, 3)); out.setAttribute('normal', new THREE.BufferAttribute(n2, 3));
  return out;
}

export class IsletKit {
  constructor() { this.items = []; this.colliders = []; }

  /** One primitive: c a hex or (x, y, z, ny) -> hex in the look's frame, glow 0..1 (or a function the same way), p/r/s its place,
   *  rotation (radians, XYZ, or a fourth entry naming the order: [PI / 2, yaw, 0, 'YXZ'] lays a cylinder down along a bearing) and scale (a number or [x, y, z]). */
  add(geo, { c = PAL.stone, glow = 0, p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
    let G = geo.index ? geo.toNonIndexed() : geo.clone();
    if (G !== geo) geo.dispose();
    for (const k of Object.keys(G.attributes)) if (k !== 'position' && k !== 'normal') G.deleteAttribute(k);
    if (!G.attributes.normal) G.computeVertexNormals();
    _s.set(...(Array.isArray(s) ? s : [s, s, s]));
    G.applyMatrix4(_m.compose(_v.set(...p), _q.setFromEuler(_e.set(r[0], r[1], r[2], r[3] || 'XYZ')), _s));
    const n = G.attributes.position.count, P = G.attributes.position.array, N = G.attributes.normal.array;
    const col = new Float32Array(n * 3), gl = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], ny = N[i * 3 + 1];
      _c.setHex(typeof c === 'function' ? c(x, y, z, ny) : c); col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
      gl[i] = typeof glow === 'function' ? glow(x, y, z, ny) : glow;
    }
    G.setAttribute('color', new THREE.BufferAttribute(col, 3));
    G.setAttribute('glow', new THREE.BufferAttribute(gl, 1));
    this.items.push(G);
    return this;
  }

  /** A boulder: an icosahedron welded, pushed in and out by noise, smooth-shaded (chunky, soft). `rough` how lumpy (0..0.5). */
  lump(r, rng, { c = PAL.basalt, glow = 0, p = [0, 0, 0], s = 1, rough = 0.28, detail = 1, rot = null } = {}) {
    let g = new THREE.IcosahedronGeometry(r, detail); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
    const P = g.attributes.position.array, o = rng() * 100;
    for (let i = 0; i < P.length; i += 3) {
      _v.set(P[i], P[i + 1], P[i + 2]);
      const k = 1 + rough * (noise2(_v.x / r * 1.3 + o, _v.z / r * 1.3 + _v.y / r * 0.9 - o) * 2 - 1);
      _v.multiplyScalar(k); P[i] = _v.x; P[i + 1] = _v.y; P[i + 2] = _v.z;
    }
    g.computeVertexNormals();
    return this.add(g, { c, glow, p, s, r: rot || [rng() * 6.28, rng() * 6.28, rng() * 6.28] });
  }

  /** The islet's body: a flat top of radius `r` at y 0 (the collider's disc, `topRings` rings), then a skirt to radius `R` (± `edge`
   *  of noise round it) falling `drop` m by `profile(t)` (0 at the rim, 1 at the foot). `colour(x, y, z, t, ny)`: t -1 on the top, 0..1 down
   *  the skirt. `wobble` m of noise on the skirt's height (a rock's crags; 0 for sand). Smooth across the rim. */
  mound({ r, R, drop, seg = 36, topRings = 4, skirtRings = 5, edge = 0.1, wobble = 0, profile = (t) => t ** 1.4, colour, seed = 0 }) {
    const pos = [], meta = [], idx = [];
    pos.push(0, 0, 0); meta.push(-1);
    for (let k = 1; k <= topRings; k++) for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2, rr = (r * k) / topRings; pos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr); meta.push(-1);
    }
    for (let k = 1; k <= skirtRings; k++) for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2, t = k / skirtRings, e = 1 + edge * (noise2(Math.cos(a) * 2.2 + seed, Math.sin(a) * 2.2 - seed) * 2 - 1);
      const rr = r + (R * e - r) * t, y = -drop * profile(t) + wobble * (noise2(Math.cos(a) * 3 * (1 + t) + seed * 3, Math.sin(a) * 3 + t * 2) - 0.5) * Math.sin(Math.PI * Math.min(1, t * 1.3));
      pos.push(Math.cos(a) * rr, Math.min(-0.02 * t, y), Math.sin(a) * rr); meta.push(t);
    }
    for (let j = 0; j < seg; j++) idx.push(0, 1 + ((j + 1) % seg), 1 + j);
    const rings = topRings + skirtRings;
    for (let k = 1; k < rings; k++) for (let j = 0; j < seg; j++) {
      const a = 1 + (k - 1) * seg + j, b = 1 + (k - 1) * seg + ((j + 1) % seg), c = a + seg, d = b + seg;
      idx.push(a, b, d, a, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // (the top's normals straight up: its rim's are bent by the skirt's slope, which shades the walkable disc's edge soft as a shoulder)
    const N = g.attributes.normal.array;
    for (let i = 0; i < meta.length; i++) if (meta[i] < 0 && Math.hypot(pos[i * 3], pos[i * 3 + 2]) < r * 0.99) { N[i * 3] = 0; N[i * 3 + 1] = 1; N[i * 3 + 2] = 0; }
    const at = new Map(); for (let i = 0; i < meta.length; i++) at.set(`${pos[i * 3].toFixed(3)},${pos[i * 3 + 2].toFixed(3)}`, meta[i]);
    return this.add(g, { c: (x, y, z, ny) => colour(x, y, z, at.get(`${x.toFixed(3)},${z.toFixed(3)}`) ?? 0, ny) });
  }

  /** A fixed collider for a tall thing, in the look's frame: a cylinder [half height, radius], a ball radius, or a box's half sizes. */
  collider(spec) { this.colliders.push(spec); return this; }

  build() {
    const geo = mergeGeometries(this.items);
    for (const g of this.items) g.dispose();
    geo.computeBoundingSphere();
    return { geo, colliders: this.colliders, tris: geo.attributes.position.count / 3 };
  }
}
