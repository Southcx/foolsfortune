// ---------------------------------------------------------------------------------------
// THE SHIP KIT'S MESHER: every static part of a ship of the Vessoul's (the sloop, frigate, tanker, destroyer and galleon: vfx/sloop.js,
// vfx/shipclasses.js) written into ONE vertex-coloured geometry, so a hull and everything bolted to it is one draw (and one outline).
// Each vertex carries its colour and a CODE in the colour's alpha, read by the hull's material (shipkit/hullmaterial.js):
//   0      plain paint              0.1  a panelled plate (the panel lines are drawn on it)
//   0.2 .. 0.6  lit in its own colour (an engine's ring, a port, a lamp: 0.2 dark .. 0.6 full)
//   0.6 .. 1    lit in the ship's feeling (the core, the keel line: 0.6 dark .. 1 full; the look's `feeling`)
// Faceted where it is a plate (a face normal per triangle: the sixth generation's low-poly), smooth where it is turned (a pod, a spar);
// every triangle is turned to face away from the part's own middle, so a part is never drawn inside out.
// Prior art: a modeller's box-and-loft workflow (a hull lofted through stations, as a shipwright's lines plan), the PS2's one-mesh,
// vertex-coloured props, and render/merge.js's rule (static parts are one draw a material) taken to its end: one material, one draw.
//
//   const M = new Mesher()   M.tri(a, b, c, col, code, ref?)   M.quad(a, b, c, d, col, code, ref?)   M.box(c, s, col, code, opts)
//   M.cyl(a, b, r0, r1, n, col, code, { caps, smooth })   M.gem(c, r, up, down, n, col, code)   M.loft(spec)   M.xf(matrix, fn)
//   M.geometry() -> BufferGeometry (position, normal, color: 4)   M.count (triangles so far)   loftAt(spec, z) deckAt(spec, z) deckHalf(spec, z) sideAt(spec, z, y) (a station's numbers, the deck's height and half-width, the side's half-width)
//   (points are [x, y, z] arrays or Vector3s; `col` a hex or a THREE.Color)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _r = new THREE.Vector3();
const _col = new THREE.Color(), _nm = new THREE.Matrix3();
const v3 = (p, out) => (Array.isArray(p) ? out.set(p[0], p[1], p[2]) : out.copy(p));

export class Mesher {
  constructor() { this.p = []; this.nrm = []; this.c = []; this.m = null; }
  get count() { return this.p.length / 9; }

  /** Everything written inside `fn` is moved by `matrix` first (a part placed, turned or raked). Nested calls compose. */
  xf(matrix, fn) {
    const was = this.m; this.m = was ? was.clone().multiply(matrix) : matrix.clone();
    try { fn(this); } finally { this.m = was; }
    return this;
  }

  /** A triangle. Turned to face away from `ref` (a point inside the part) when one is given; normals per vertex if given (smooth). */
  tri(a, b, c, col, code = 0, ref = null, na = null, nb = null, nc = null) {
    v3(a, _a); v3(b, _b); v3(c, _c);
    if (this.m) { _a.applyMatrix4(this.m); _b.applyMatrix4(this.m); _c.applyMatrix4(this.m); }
    _n.subVectors(_b, _a).cross(_d.subVectors(_c, _a));
    if (_n.lengthSq() < 1e-14) return this; // (a sliver: nothing to draw)
    _n.normalize();
    if (ref) { v3(ref, _r); if (this.m) _r.applyMatrix4(this.m); if (_n.dot(_d.copy(_a).add(_b).add(_c).multiplyScalar(1 / 3).sub(_r)) < 0) { const t = _b.clone(); _b.copy(_c); _c.copy(t); _n.negate(); const tn = nb; nb = nc; nc = tn; } }
    this.p.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _c.x, _c.y, _c.z);
    if (na) {
      if (this.m) _nm.getNormalMatrix(this.m);
      for (const q of [na, nb, nc]) { v3(q, _d); if (this.m) _d.applyMatrix3(_nm); _d.normalize(); if (_d.dot(_n) < 0 && ref) _d.negate(); this.nrm.push(_d.x, _d.y, _d.z); }
    } else for (let i = 0; i < 3; i++) this.nrm.push(_n.x, _n.y, _n.z);
    _col.set(col); for (let i = 0; i < 3; i++) this.c.push(_col.r, _col.g, _col.b, code);
    return this;
  }
  quad(a, b, c, d, col, code = 0, ref = null) { return this.tri(a, b, c, col, code, ref).tri(a, c, d, col, code, ref); }
  /** A convex polygon as a fan. */
  poly(pts, col, code = 0, ref = null) { for (let i = 1; i < pts.length - 1; i++) this.tri(pts[0], pts[i], pts[i + 1], col, code, ref); return this; }

  /** A box about `c` of size `s`, its top face scaled by `top` ([kx, kz]) and shifted by `shift` ([dx, dz]): a wedge, a deckhouse, a
   *  tapered block. `cols`: a colour, or { top, side, bottom, front, back }. */
  box(c, s, col, code = 0, { top = [1, 1], shift = [0, 0], cols = null } = {}) {
    const [x, y, z] = c, [w, h, d] = s.map((k) => k / 2), K = cols || {};
    const B = [[-w, -h, -d], [w, -h, -d], [w, -h, d], [-w, -h, d]].map(([a, b, e]) => [x + a, y + b, z + e]);
    const T = [[-w, h, -d], [w, h, -d], [w, h, d], [-w, h, d]].map(([a, b, e]) => [x + a * top[0] + shift[0], y + b, z + e * top[1] + shift[1]]);
    const ref = [x + shift[0] / 2, y, z + shift[1] / 2];
    this.quad(T[0], T[1], T[2], T[3], K.top ?? col, code, ref);
    if (K.bottom !== null) this.quad(B[0], B[1], B[2], B[3], K.bottom ?? col, code, ref);
    this.quad(B[3], B[2], T[2], T[3], K.front ?? K.side ?? col, code, ref); // (+z)
    this.quad(B[0], B[1], T[1], T[0], K.back ?? K.side ?? col, code, ref);
    this.quad(B[1], B[2], T[2], T[1], K.side ?? col, code, ref);
    this.quad(B[0], B[3], T[3], T[0], K.side ?? col, code, ref);
    return this;
  }

  /** A turned part from `a` to `b` (a spar, a pod, a funnel): `n` sides, radii r0 at a and r1 at b; smooth-shaded unless `smooth` false. */
  cyl(a, b, r0, r1, n, col, code = 0, { caps = true, smooth = true, capCol = null, capCode = null, phase = 0 } = {}) {
    const A = v3(a, new THREE.Vector3()), Bv = v3(b, new THREE.Vector3()), ax = Bv.clone().sub(A), len = ax.length(); if (len < 1e-6) return this;
    ax.divideScalar(len);
    const u = Math.abs(ax.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0), e1 = u.clone().cross(ax).normalize(), e2 = ax.clone().cross(e1);
    const ring = (C, r, i) => { const t = phase + (i / n) * Math.PI * 2; return C.clone().addScaledVector(e1, Math.cos(t) * r).addScaledVector(e2, Math.sin(t) * r); };
    const nAt = (i) => { const t = phase + (i / n) * Math.PI * 2; return e1.clone().multiplyScalar(Math.cos(t)).addScaledVector(e2, Math.sin(t)).addScaledVector(ax, (r0 - r1) / len); };
    const mid = A.clone().add(Bv).multiplyScalar(0.5);
    for (let i = 0; i < n; i++) {
      const p0 = ring(A, r0, i), p1 = ring(A, r0, i + 1), q1 = ring(Bv, r1, i + 1), q0 = ring(Bv, r1, i);
      if (smooth) { const n0 = nAt(i), n1 = nAt(i + 1); this.tri(p0, p1, q1, col, code, mid, n0, n1, n1); this.tri(p0, q1, q0, col, code, mid, n0, n1, n0); }
      else this.quad(p0, p1, q1, q0, col, code, mid);
      if (caps && r0 > 1e-4) this.tri(A, p1, p0, capCol ?? col, capCode ?? code, mid);
      if (caps && r1 > 1e-4) this.tri(Bv, q0, q1, capCol ?? col, capCode ?? code, mid);
    }
    return this;
  }

  /** A faceted crystal: a bipyramid of `n` sides about `c`, `up` above and `down` below its girdle (Lachrymite, a lamp, a bulb). */
  gem(c, r, up, down, n, col, code = 0, { axis = null, twist = 0 } = {}) {
    const C = v3(c, new THREE.Vector3()), ax = axis ? v3(axis, new THREE.Vector3()).normalize() : new THREE.Vector3(0, 1, 0);
    const u = Math.abs(ax.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0), e1 = u.clone().cross(ax).normalize(), e2 = ax.clone().cross(e1);
    const T = C.clone().addScaledVector(ax, up), D = C.clone().addScaledVector(ax, -down);
    for (let i = 0; i < n; i++) {
      const t0 = twist + (i / n) * Math.PI * 2, t1 = twist + ((i + 1) / n) * Math.PI * 2;
      const p0 = C.clone().addScaledVector(e1, Math.cos(t0) * r).addScaledVector(e2, Math.sin(t0) * r), p1 = C.clone().addScaledVector(e1, Math.cos(t1) * r).addScaledVector(e2, Math.sin(t1) * r);
      this.tri(p0, p1, T, col, code, C); if (down > 0) this.tri(p0, p1, D, col, code, C);
    }
    return this;
  }

  /** A hull lofted through its stations (a lines plan). `spec`: { stations: [[z, half-beam, draft, sheer, rake?], ...] stern to bow,
   *  shape: [[fx, fy], ...] the half-section keel to deck edge (fx a share of the half-beam; fy -1 the keel .. 0 the waterline .. 1 the
   *  deck edge), strip(i, z) -> [colour, code] for the strip between shape points i and i+1, deck: [colour, code], camber (m),
   *  smoothZ (normals smooth along the length, hard at the chines), transom: [colour, code] }. Rake: at a station, how far forward the
   *  deck edge stands of the keel (a raked stem). */
  loft(spec) {
    const { stations: S, shape, strip, deck, camber = 0.04, smoothZ = true, transom = null } = spec;
    const P = (j, i, side = 1) => { const [z, hb, dr, sh, rake = 0] = S[j], [fx, fy] = shape[i]; return [side * fx * hb, fy < 0 ? fy * dr : fy * sh, z + rake * (fy + 1) / 2]; };
    const nS = S.length, nP = shape.length;
    for (const side of [1, -1]) for (let i = 0; i < nP - 1; i++) {
      const [col, code] = strip(i);
      const fn = [], refs = [];
      for (let j = 0; j < nS - 1; j++) { // (each panel's face normal, turned away from the section's middle: outward)
        const a = new THREE.Vector3(...P(j, i, side)), b = new THREE.Vector3(...P(j + 1, i, side)), c = new THREE.Vector3(...P(j + 1, i + 1, side));
        const ref = new THREE.Vector3(0, (P(j, 0)[1] + P(j, nP - 1)[1]) * 0.5, (a.z + c.z) / 2); refs.push(ref);
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
        if (n.dot(a.clone().add(b).add(c).divideScalar(3).sub(ref)) < 0) n.negate(); fn.push(n);
      }
      for (let j = 0; j < nS - 1; j++) {
        const a = P(j, i, side), b = P(j + 1, i, side), c = P(j + 1, i + 1, side), d = P(j, i + 1, side), ref = refs[j];
        if (smoothZ) {
          const nA = fn[Math.max(0, j - 1)].clone().add(fn[j]).normalize(), nB = fn[Math.min(nS - 2, j + 1)].clone().add(fn[j]).normalize();
          this.tri(a, b, c, col, code, ref, nA, nB, nB); this.tri(a, c, d, col, code, ref, nA, nB, nA);
        } else this.quad(a, b, c, d, col, code, ref);
      }
    }
    // the deck: edge to edge, a little camber
    const [dc, dk] = deck;
    for (let j = 0; j < nS - 1; j++) {
      const a = P(j, nP - 1, 1), b = P(j + 1, nP - 1, 1), c = P(j + 1, nP - 1, -1), d = P(j, nP - 1, -1);
      const ma = [0, a[1] + camber, a[2]], mb = [0, b[1] + camber, b[2]], below = [0, -10, (a[2] + b[2]) / 2];
      this.quad(a, b, mb, ma, dc, dk, below).quad(ma, mb, c, d, dc, dk, below);
    }
    // the transom (the stern's face) and the stem's cap if the bow is not closed
    for (const [j, dir] of [[0, -1], [nS - 1, 1]]) {
      if (S[j][1] < 0.03 && j === nS - 1) continue;
      const ring = []; for (let i = 0; i < nP; i++) ring.push(P(j, i, 1)); for (let i = nP - 1; i >= 0; i--) ring.push(P(j, i, -1));
      const z = S[j][0], out = [0, (P(j, 0)[1] + P(j, nP - 1)[1]) / 2, z - dir * 5];
      const [tc, tk] = transom || strip(nP - 2);
      const top = [0, P(j, nP - 1)[1] + camber, P(j, nP - 1)[2]];
      for (let i = 0; i < ring.length - 1; i++) this.tri([0, P(j, 0)[1], z], ring[i], ring[i + 1], tc, tk, out);
      this.tri(ring[nP - 1], top, ring[nP], tc, tk, out);
    }
    return this;
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

/** A station's numbers between two given (z: the ship's frame): [half-beam, draft, sheer], lerped. */
export function loftAt(spec, z) {
  const S = spec.stations; if (z <= S[0][0]) return S[0].slice(1, 4);
  for (let j = 0; j < S.length - 1; j++) if (z <= S[j + 1][0]) { const k = (z - S[j][0]) / (S[j + 1][0] - S[j][0]); return [1, 2, 3].map((i) => S[j][i] + (S[j + 1][i] - S[j][i]) * k); }
  return S[S.length - 1].slice(1, 4);
}
/** The deck's height at z on the centreline (the deck edge's sheer plus the camber). */
export const deckAt = (spec, z) => loftAt(spec, z)[2] * spec.shape[spec.shape.length - 1][1] + (spec.camber ?? 0.04);
/** The deck's half-width at z (the deck edge's x). */
export const deckHalf = (spec, z) => loftAt(spec, z)[0] * spec.shape[spec.shape.length - 1][0];
/** The hull's side at (z, y): its half-width there (the lofted section walked to that height), or 0 off it. */
export function sideAt(spec, z, y) {
  const [hb, dr, sh] = loftAt(spec, z), fy = y < 0 ? y / Math.max(1e-6, dr) : y / Math.max(1e-6, sh), S = spec.shape;
  if (fy < S[0][1] || fy > S[S.length - 1][1]) return 0;
  for (let i = 0; i < S.length - 1; i++) if (fy <= S[i + 1][1]) { const k = (fy - S[i][1]) / Math.max(1e-6, S[i + 1][1] - S[i][1]); return hb * (S[i][0] + (S[i + 1][0] - S[i][0]) * k); }
  return hb * S[S.length - 1][0];
}
