// ---------------------------------------------------------------------------------------
// MYGGDRASIL'S KIT: the one accumulator every part of its look is built into, and the shapes they are built from. A part is painted
// vertex by vertex (no texture: Ghibli's soft gradients are the vertices' own), and everything static ends in ONE geometry drawn by ONE
// program (./material.js), so the whole tree is a draw (and its shadow another).
//
//   A VERTEX    its position and normal, and what the painter says of it as it is laid: its colour (linear, kept at 16 bits so the dark
//               roots never band), its glow (a colour and an amount: the gills, the polyps, the mouth), and four effects (how far the
//               tincture leans it, its polyps' speckle, how far light passes through it, its roughness)
//   THE INK     the painter writes INK before each vertex (`ink(...)`, or INK's arrays by hand): a part's painter is a function of where
//               along and round the part the vertex is (u, v), where it is (p) and how it faces (n)
//   THE SHAPES  tube (a Catmull-Rom path swept round, gnarled, its ends sunk, rounded or open), sheet (a grid of any surface, its normals
//               from its neighbours, wrapped round or not), strut (a flattened four-sided bar, a sea fan's rib), addGeo (a three.js
//               geometry placed and painted)
//
// Prior art: the strains' bed parts (vfx/garden/strains.js: one merged mesh of painted vertices), Ghibli background painting's soft
// value gradients (Kazuo Oga's forests, laid in the vertices instead of the brush), and parallel-transport frames for swept tubes
// (three.js's computeFrenetFrames, Bishop 1975).
//
//   const K = new TreeKit()   ink(colour, glow, glowAmount, fx)   tube(K, points, { r, radial, segs, paint, tip })
//   sheet(K, nu, nv, posFn, { wrap, paint })   strut(K, a, b, ra, rb, flatNormal, paint)   addGeo(K, geometry, matrix, paint)
//   K.geometry() -> BufferGeometry (position, normal, color, aGlow, aFx, index)   lin(hex) -> [r, g, b] linear   mixLin(out, a, b, k)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** What the next vertex is painted: colour (linear rgb), glow (linear rgb, amount), effects (tincture lean, polyps, light through, rough). */
export const INK = { c: [1, 1, 1], g: [0, 0, 0, 0], f: [0, 0, 0, 0.85] };
const _col = new THREE.Color();
/** A palette colour (sRGB hex) as linear rgb, as the vertices are mixed. */
export function lin(hex) { _col.setHex(hex); return [_col.r, _col.g, _col.b]; }
/** a .. b by k into out (linear rgb). */
export function mixLin(out, a, b, k) { const t = k < 0 ? 0 : k > 1 ? 1 : k; out[0] = a[0] + (b[0] - a[0]) * t; out[1] = a[1] + (b[1] - a[1]) * t; out[2] = a[2] + (b[2] - a[2]) * t; return out; }
/** Write the ink: a colour (linear rgb, scaled by `shade`), a glow colour and amount, and the effects. */
export function ink(c, shade = 1, g = null, ga = 0, tint = 0, polyp = 0, through = 0, rough = 0.85) {
  INK.c[0] = c[0] * shade; INK.c[1] = c[1] * shade; INK.c[2] = c[2] * shade;
  if (g) { INK.g[0] = g[0]; INK.g[1] = g[1]; INK.g[2] = g[2]; } INK.g[3] = ga;
  INK.f[0] = tint; INK.f[1] = polyp; INK.f[2] = through; INK.f[3] = rough;
}

export class TreeKit {
  constructor() { this.P = []; this.N = []; this.C = []; this.G = []; this.F = []; this.I = []; }
  get n() { return this.P.length / 3; }
  /** A vertex at p (x, y, z) facing n, painted with INK; its index. */
  vtx(px, py, pz, nx, ny, nz) {
    const i = this.P.length / 3, l = Math.hypot(nx, ny, nz) || 1;
    this.P.push(px, py, pz); this.N.push(nx / l, ny / l, nz / l);
    this.C.push(INK.c[0], INK.c[1], INK.c[2]); this.G.push(INK.g[0], INK.g[1], INK.g[2], INK.g[3]); this.F.push(INK.f[0], INK.f[1], INK.f[2], INK.f[3]);
    return i;
  }
  tri(a, b, c) { this.I.push(a, b, c); }
  /** Everything laid, as one geometry: positions and normals in full, the colour at 16 bits, the glow and effects at 8. */
  geometry() {
    const n = this.n, g = new THREE.BufferGeometry(), q16 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 65535), q8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
    const C = new Uint16Array(n * 3), G = new Uint8Array(n * 4), F = new Uint8Array(n * 4);
    for (let i = 0; i < n * 3; i++) C[i] = q16(this.C[i]);
    for (let i = 0; i < n * 4; i++) { G[i] = q8(this.G[i]); F[i] = q8(this.F[i]); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3, true)); g.setAttribute('aGlow', new THREE.BufferAttribute(G, 4, true)); g.setAttribute('aFx', new THREE.BufferAttribute(F, 4, true));
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
}

const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Vector3();

/** A tube along points (a centripetal Catmull-Rom through them): `r(u)` its radius (m) at u (0 the first point .. 1 the last), `radial`
 *  sides, `segs` rings; `lump` the gnarl (knots along it and ridges round it that spiral like a root's fibres), `seed` its own; `tip`
 *  'round' closes the far end in a dome, otherwise it is left open (sunk in the ground or in what it grows from); `paint(u, v, p, n)`.
 *  Returns the curve (for a caller that hangs things on it). */
export function tube(K, pts, { r, radial = 8, segs = 16, paint, tip = null, lump = 0.12, seed = 0, twist = 0.05 }) {
  const C = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), L = C.getLength(), F = C.computeFrenetFrames(segs, false), base = K.n, R = typeof r === 'function' ? r : () => r;
  let rEnd = 0;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs; C.getPointAt(u, _p); const s = u * L, rr0 = R(u) * (1 + lump * 0.7 * Math.sin(s * 0.55 + seed) * Math.sin(s * 0.23 + seed * 1.7));
    if (i === segs) rEnd = rr0;
    for (let j = 0; j < radial; j++) {
      const v = j / radial, a = v * Math.PI * 2 + s * twist, ca = Math.cos(a), sa = Math.sin(a);
      _n.copy(F.normals[i]).multiplyScalar(ca).addScaledVector(F.binormals[i], sa);
      const rr = rr0 * (1 + lump * (0.55 * Math.sin(a * 3 + s * 0.4 + seed) + 0.3 * Math.sin(a * 5 - s * 0.7 + seed * 2.3)));
      _q.copy(_p).addScaledVector(_n, rr);
      paint?.(u, v, _q, _n);
      K.vtx(_q.x, _q.y, _q.z, _n.x, _n.y, _n.z);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = base + i * radial + j, b = base + i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    K.tri(a, b, c); K.tri(b, d, c);
  }
  if (tip === 'round') {
    const T = F.tangents[segs], last = base + segs * radial, end = C.getPointAt(1, new THREE.Vector3()), rings = 3;
    let prev = last;
    for (let k = 1; k <= rings; k++) {
      const ang = (k / (rings + 1)) * Math.PI / 2, rr = rEnd * Math.cos(ang), off = rEnd * Math.sin(ang) * 0.9, first = K.n;
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2 + L * twist, ca = Math.cos(a), sa = Math.sin(a);
        _n.copy(F.normals[segs]).multiplyScalar(ca).addScaledVector(F.binormals[segs], sa);
        _q.copy(end).addScaledVector(_n, rr).addScaledVector(T, off); _t.copy(_n).multiplyScalar(Math.cos(ang)).addScaledVector(T, Math.sin(ang));
        paint?.(1, j / radial, _q, _t); K.vtx(_q.x, _q.y, _q.z, _t.x, _t.y, _t.z);
      }
      for (let j = 0; j < radial; j++) { const a = prev + j, b = prev + ((j + 1) % radial), c = first + j, d = first + ((j + 1) % radial); K.tri(a, b, c); K.tri(b, d, c); }
      prev = first;
    }
    _q.copy(end).addScaledVector(T, rEnd * 0.9); paint?.(1, 0, _q, T); const pole = K.vtx(_q.x, _q.y, _q.z, T.x, T.y, T.z);
    for (let j = 0; j < radial; j++) K.tri(prev + j, prev + ((j + 1) % radial), pole);
  }
  return C;
}

/** A sheet: a grid of nu x nv points from `pos(i, j, out)` (i along 0..nu-1, j across 0..nv-1; `wrap` joins the last j to the first), its
 *  normals from its neighbours (`flip` turns them and the faces over); `paint(u, v, p, n)`. Returns its first vertex. */
export function sheet(K, nu, nv, pos, { wrap = false, paint, flip = false } = {}) {
  const P = new Float32Array(nu * nv * 3);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { pos(i, j, _p); P.set([_p.x, _p.y, _p.z], (i * nv + j) * 3); }
  const N = gridNormals(P, nu, nv, wrap, flip), base = K.n;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const o = (i * nv + j) * 3; _p.set(P[o], P[o + 1], P[o + 2]); _n.set(N[o], N[o + 1], N[o + 2]);
    paint?.(i / (nu - 1), j / (wrap ? nv : nv - 1), _p, _n); K.vtx(_p.x, _p.y, _p.z, _n.x, _n.y, _n.z);
  }
  gridFaces(K, base, nu, nv, wrap, flip);
  return base;
}
/** The faces of a grid laid at `base` (nu x nv, wrapped or not). */
export function gridFaces(K, base, nu, nv, wrap, flip = false) {
  const cols = wrap ? nv : nv - 1;
  for (let i = 0; i < nu - 1; i++) for (let j = 0; j < cols; j++) {
    const a = base + i * nv + j, b = base + i * nv + ((j + 1) % nv), c = a + nv, d = b + nv;
    if (flip) { K.tri(a, b, c); K.tri(b, d, c); } else { K.tri(a, c, b); K.tri(b, c, d); }
  }
}
/** A grid's smooth normals from its points (Float32Array nu x nv x 3): each the cross of its neighbours along and across. */
export function gridNormals(P, nu, nv, wrap, flip = false) {
  const N = new Float32Array(P.length), g = (i, j, out) => { const o = (i * nv + j) * 3; return out.set(P[o], P[o + 1], P[o + 2]); };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(nu - 1, i + 1);
    const j0 = wrap ? (j - 1 + nv) % nv : Math.max(0, j - 1), j1 = wrap ? (j + 1) % nv : Math.min(nv - 1, j + 1);
    g(i1, j, _a).sub(g(i0, j, _b)); g(i, j1, _t).sub(g(i, j0, _q));
    _n.crossVectors(_a, _t); if (flip) _n.negate();
    if (_n.lengthSq() < 1e-12) _n.set(0, 1, 0);
    _n.normalize(); N.set([_n.x, _n.y, _n.z], (i * nv + j) * 3);
  }
  return N;
}

/** A flattened four-sided bar from a to b (radius ra at a, rb at b, thinner across `flat` by half): a sea fan's rib or link. */
export function strut(K, a, b, ra, rb, flat, paint) {
  _t.copy(b).sub(a); const len = _t.length(); if (len < 1e-4) return; _t.divideScalar(len);
  _a.copy(flat).addScaledVector(_t, -flat.dot(_t)).normalize(); _b.crossVectors(_t, _a).normalize();
  const base = K.n, corners = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  for (const [end, r] of [[a, ra], [b, rb]]) for (const [x, y] of corners) {
    _n.copy(_a).multiplyScalar(x * 0.5).addScaledVector(_b, y); _q.copy(end).addScaledVector(_a, x * r * 0.5).addScaledVector(_b, y * r);
    paint?.(end === a ? 0 : 1, 0, _q, _n); K.vtx(_q.x, _q.y, _q.z, _n.x, _n.y, _n.z);
  }
  for (let j = 0; j < 4; j++) { const p = base + j, q = base + ((j + 1) % 4); K.tri(p, q, p + 4); K.tri(q, q + 4, p + 4); }
}

const _m3 = new THREE.Matrix3();
/** A three.js geometry placed by matrix M and painted vertex by vertex (u, v from its uv when it has one). */
export function addGeo(K, geo, M, paint) {
  const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, base = K.n; _m3.getNormalMatrix(M);
  for (let i = 0; i < P.count; i++) {
    _p.fromBufferAttribute(P, i).applyMatrix4(M); _n.fromBufferAttribute(N, i).applyMatrix3(_m3).normalize();
    paint?.(U ? U.getX(i) : 0, U ? U.getY(i) : 0, _p, _n); K.vtx(_p.x, _p.y, _p.z, _n.x, _n.y, _n.z);
  }
  const I = geo.index; if (I) for (let i = 0; i < I.count; i += 3) K.tri(base + I.getX(i), base + I.getX(i + 1), base + I.getX(i + 2));
  else for (let i = 0; i < P.count; i += 3) K.tri(base + i, base + i + 1, base + i + 2);
}
