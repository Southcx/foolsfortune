// ---------------------------------------------------------------------------------------
// THE SOFT DOUGH (plain name; Spirit Cooking's 3D stage, South 2026-11-02: "Use softbody physics for the doughy material"): a ball of
// dough as a position-based soft body. Each vertex of a sphere is a particle; edges hold it locally (distance constraints); the whole is
// pulled back toward its rest shape (shape matching: the best rotation of the rest onto the particles, found by polar decomposition);
// and the rest shape itself creeps toward what you did to it (PLASTICITY), so a fold stays folded, a dent stays dented, a stretched sheet
// stays thin, as dough does. Its volume is kept (the rest is rescaled to its volume each step), so a push spreads it rather than losing it.
// What the dough is made of is three numbers a stage sets from the rules' value (gluten built, the proof's rise):
//   stiff    how hard it springs back (shape matching's pull a step, 0..1)
//   plastic  how fast it keeps a change (the rest's creep a real second)
//   smooth   how fast its lumps even out (a Laplacian pass on the rest a real second: gluten's satin)
// Its colliders are the board (a plane), a bowl (a sphere it is held inside), and spheres (the god hand's palm and fingertips) that push it
// out of them; `grab(at, r)` pins the particles within r of a point to it (a pinch), moved by `drag(to)`, let go by `drop()`.
// Each particle's stretch against its rest (`thin`, an attribute) lets a shader draw the windowpane's light through it.
//
// Prior art: Müller et al. 2005, "Meshless Deformations Based on Shape Matching" (its plasticity: the rest updated from the deformation);
// Müller et al. 2007, "Position Based Dynamics" (the step, the distance constraints, collisions as projections); Macklin and Müller's
// XPBD talks; Cooking Mama and Overcooked's dough as a toy you push.
//
//   const d = new SoftDough({ radius, detail, squash })   d.mesh (a Mesh: give it a material)   d.step(dt)   d.set({ stiff, plastic, smooth })
//   d.colliders = [{ c: Vector3, r }]   d.bowl = { c, r } | null   d.floor (y)   d.grab(at, r) -> n   d.drag(to)   d.drop()
//   d.impulse(fn(i, x) -> [vx, vy, vz] | null)   d.turn(rad)   d.scaleRest(k)   d.centre(out)   d.reset()   d.thinMax
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const _c = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Matrix3(), _r = new THREE.Matrix3(), _t = new THREE.Matrix3();
const R = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

/** The rotation of a 3x3 (row-major array `a`, nine numbers) by polar decomposition (Higham's iteration R <- (R + R^-T) / 2), into `out`. */
function polar(a, out) {
  _r.set(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
  if (Math.abs(_r.determinant()) < 1e-9) return out.identity();
  for (let k = 0; k < 10; k++) {
    _t.copy(_r).invert().transpose();
    const e = _r.elements, f = _t.elements; let d = 0;
    for (let i = 0; i < 9; i++) { const n = 0.5 * (e[i] + f[i]); d += Math.abs(n - e[i]); e[i] = n; }
    if (d < 1e-6) break;
  }
  return out.copy(_r);
}

export class SoftDough {
  constructor({ radius = 0.42, detail = 3, squash = 0.68, lumps = 0.12 } = {}) {
    let g = new THREE.IcosahedronGeometry(radius, detail); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
    const P = g.attributes.position, n = (this.n = P.count);
    this.x = new Float32Array(n * 3); this.p = new Float32Array(n * 3); this.v = new Float32Array(n * 3);
    this.q = new Float32Array(n * 3); this.q0 = new Float32Array(n * 3); // (the rest shape, about its centre; and the first one, to reset)
    for (let i = 0; i < n; i++) {
      const lump = 1 + lumps * (R(i) - 0.5) + lumps * 0.5 * Math.sin(i * 1.7); // (a shaggy ball: lumps the gluten evens out)
      const x = P.getX(i) * lump, y = P.getY(i) * lump * squash, z = P.getZ(i) * lump;
      this.q0[i * 3] = x; this.q0[i * 3 + 1] = y; this.q0[i * 3 + 2] = z;
    }
    // the edges (each once) and their rest lengths; each particle's neighbours, for smoothing
    const idx = g.index.array, seen = new Set(), E = [], nb = Array.from({ length: n }, () => []);
    for (let t = 0; t < idx.length; t += 3) for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) {
      const k = a < b ? a * n + b : b * n + a; if (seen.has(k)) continue; seen.add(k); E.push(a, b); nb[a].push(b); nb[b].push(a);
    }
    this.e = new Uint32Array(E); this.L = new Float32Array(E.length / 2); this.L0 = new Float32Array(E.length / 2); this.nb = nb;
    this.tri = idx;
    this.thin = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.x, 3));
    g.setAttribute('aThin', new THREE.BufferAttribute(this.thin, 1));
    g.setAttribute('aRest', new THREE.BufferAttribute(this.q0.slice(), 3)); // (each particle's own place in the first ball: flour and blisters stay on the dough, not the world)
    this.geo = g; this.mesh = new THREE.Mesh(g); this.mesh.castShadow = this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
    this.colliders = []; this.bowl = null; this.floor = 0; this.pins = null; this.pinTo = new THREE.Vector3(); this.pinFrom = new THREE.Vector3();
    this.stiff = 0.2; this.plastic = 1.5; this.smooth = 0; this.restScale = 1; this.thinMax = 0;
    this.at = new THREE.Vector3(); this.reset();
  }

  /** Back to the first shaggy ball, standing at `at` (its floor under it). */
  reset(at = this.at) {
    this.at.copy(at); const n = this.n;
    let minY = Infinity; for (let i = 0; i < n; i++) minY = Math.min(minY, this.q0[i * 3 + 1]);
    for (let i = 0; i < n * 3; i++) { this.q[i] = this.q0[i]; this.v[i] = 0; }
    for (let i = 0; i < n; i++) { this.x[i * 3] = at.x + this.q[i * 3]; this.x[i * 3 + 1] = at.y + this.q[i * 3 + 1] - minY + 0.002; this.x[i * 3 + 2] = at.z + this.q[i * 3 + 2]; }
    this.recentre(); this.restLengths(); this.V0 = this.restVolume(); this.restScale = 1; this.pins = null;
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals();
  }
  set(o) { Object.assign(this, o); return this; }

  /** The rest shape re-centred on its own centre (so the shape matching's centre is the particles'). */
  recentre() { const n = this.n; let x = 0, y = 0, z = 0; for (let i = 0; i < n; i++) { x += this.q[i * 3]; y += this.q[i * 3 + 1]; z += this.q[i * 3 + 2]; } x /= n; y /= n; z /= n; for (let i = 0; i < n; i++) { this.q[i * 3] -= x; this.q[i * 3 + 1] -= y; this.q[i * 3 + 2] -= z; } }
  restLengths() { const e = this.e, q = this.q; for (let k = 0; k < this.L.length; k++) { const a = e[k * 2] * 3, b = e[k * 2 + 1] * 3; this.L[k] = this.L0[k] = Math.hypot(q[a] - q[b], q[a + 1] - q[b + 1], q[a + 2] - q[b + 2]); } }
  /** A closed mesh's volume (the divergence theorem over its triangles), of the rest or of the particles. */
  volumeOf(arr) { const t = this.tri; let V = 0; for (let k = 0; k < t.length; k += 3) { const a = t[k] * 3, b = t[k + 1] * 3, c = t[k + 2] * 3; V += arr[a] * (arr[b + 1] * arr[c + 2] - arr[b + 2] * arr[c + 1]) - arr[a + 1] * (arr[b] * arr[c + 2] - arr[b + 2] * arr[c]) + arr[a + 2] * (arr[b] * arr[c + 1] - arr[b + 1] * arr[c]); } return Math.abs(V) / 6; }
  restVolume() { return this.volumeOf(this.q); }
  /** The centre of the particles, into `out`. */
  centre(out = new THREE.Vector3()) { const n = this.n; out.set(0, 0, 0); for (let i = 0; i < n; i++) { out.x += this.x[i * 3]; out.y += this.x[i * 3 + 1]; out.z += this.x[i * 3 + 2]; } return out.multiplyScalar(1 / n); }
  /** The rest grown or shrunk (a proof's rise, a collapse): its volume target times k³. */
  scaleRest(k) { this.restScale = k; }

  /** Pin the particles within r of `at` (a pinch); how many were caught. */
  grab(at, r) { const list = []; for (let i = 0; i < this.n; i++) if (Math.hypot(this.x[i * 3] - at.x, this.x[i * 3 + 1] - at.y, this.x[i * 3 + 2] - at.z) < r) list.push(i); if (!list.length) return 0; this.pins = { list, off: list.map((i) => [this.x[i * 3] - at.x, this.x[i * 3 + 1] - at.y, this.x[i * 3 + 2] - at.z]) }; this.pinTo.copy(at); return list.length; }
  drag(to) { this.pinTo.copy(to); }
  drop() { this.pins = null; }
  /** A kick to some particles: fn(i, [x, y, z]) returns a velocity to add or null. */
  impulse(fn) { const p = [0, 0, 0]; for (let i = 0; i < this.n; i++) { p[0] = this.x[i * 3]; p[1] = this.x[i * 3 + 1]; p[2] = this.x[i * 3 + 2]; const d = fn(i, p); if (d) { this.v[i * 3] += d[0]; this.v[i * 3 + 1] += d[1]; this.v[i * 3 + 2] += d[2]; } } }
  /** The whole turned about its centre's vertical by `a` (a quarter turn between folds), the rest with it. */
  turn(a) {
    const c = this.centre(_c), s = Math.sin(a), co = Math.cos(a), n = this.n;
    for (let i = 0; i < n; i++) { const x = this.x[i * 3] - c.x, z = this.x[i * 3 + 2] - c.z; this.x[i * 3] = c.x + x * co + z * s; this.x[i * 3 + 2] = c.z - x * s + z * co; const qx = this.q[i * 3], qz = this.q[i * 3 + 2]; this.q[i * 3] = qx * co + qz * s; this.q[i * 3 + 2] = -qx * s + qz * co; }
  }

  /** One step (real s), in two substeps. */
  step(dt) {
    dt = Math.min(dt, 1 / 30); const sub = 3, h = dt / sub;
    for (let s = 0; s < sub; s++) this.substep(h);
    this.creep(dt);
    // the stretch each particle wears (its edges against their rest), the windowpane's light
    const th = this.thin; th.fill(0); const cnt = new Uint8Array(this.n), e = this.e, x = this.x; let mx = 0;
    for (let k = 0; k < this.L.length; k++) { const a = e[k * 2], b = e[k * 2 + 1], d = Math.hypot(x[a * 3] - x[b * 3], x[a * 3 + 1] - x[b * 3 + 1], x[a * 3 + 2] - x[b * 3 + 2]) / (this.L0[k] * this.restScale || 1); th[a] += d; th[b] += d; cnt[a]++; cnt[b]++; }
    for (let i = 0; i < this.n; i++) { th[i] = Math.max(0, th[i] / (cnt[i] || 1) - 1); mx = Math.max(mx, th[i]); }
    this.thinMax = mx;
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aThin.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }

  substep(h) {
    const n = this.n, x = this.x, p = this.p, v = this.v, damp = Math.exp(-6 * h);
    for (let i = 0; i < n; i++) { const a = i * 3; v[a + 1] -= 9.81 * h; p[a] = x[a] + v[a] * h; p[a + 1] = x[a + 1] + v[a + 1] * h; p[a + 2] = x[a + 2] + v[a + 2] * h; }
    if (this.pins) { const P = this.pins; P.list.forEach((i, k) => { p[i * 3] = this.pinTo.x + P.off[k][0]; p[i * 3 + 1] = this.pinTo.y + P.off[k][1]; p[i * 3 + 2] = this.pinTo.z + P.off[k][2]; }); }
    // the edges: each held to its length (a few passes)
    const e = this.e, L = this.L;
    for (let it = 0; it < 2; it++) for (let k = 0; k < L.length; k++) {
      const a = e[k * 2] * 3, b = e[k * 2 + 1] * 3, dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2], d = Math.hypot(dx, dy, dz) || 1e-6;
      const c = (0.5 * (d - L[k] * this.restScale)) / d * 0.5; p[a] += dx * c; p[a + 1] += dy * c; p[a + 2] += dz * c; p[b] -= dx * c; p[b + 1] -= dy * c; p[b + 2] -= dz * c;
    }
    // the shape matching: the rest's best rotation onto the particles, and a pull toward it
    const cx = this.centreOf(p, _c), q = this.q, A = [0, 0, 0, 0, 0, 0, 0, 0, 0], sc = this.restScale;
    for (let i = 0; i < n; i++) { const a = i * 3, px = p[a] - cx.x, py = p[a + 1] - cx.y, pz = p[a + 2] - cx.z, qx = q[a] * sc, qy = q[a + 1] * sc, qz = q[a + 2] * sc; A[0] += px * qx; A[1] += px * qy; A[2] += px * qz; A[3] += py * qx; A[4] += py * qy; A[5] += py * qz; A[6] += pz * qx; A[7] += pz * qy; A[8] += pz * qz; }
    const Rm = polar(A, _m).elements, k = this.stiff; this.Rm = Rm; // (column-major in three: elements[col*3+row])
    for (let i = 0; i < n; i++) {
      if (this.pins?.list.includes(i)) continue;
      const a = i * 3, qx = q[a] * sc, qy = q[a + 1] * sc, qz = q[a + 2] * sc;
      const gx = Rm[0] * qx + Rm[3] * qy + Rm[6] * qz + cx.x, gy = Rm[1] * qx + Rm[4] * qy + Rm[7] * qz + cx.y, gz = Rm[2] * qx + Rm[5] * qy + Rm[8] * qz + cx.z;
      p[a] += (gx - p[a]) * k; p[a + 1] += (gy - p[a + 1]) * k; p[a + 2] += (gz - p[a + 2]) * k;
    }
    // the colliders: the hand's spheres push out, the bowl holds in, the board holds up (with friction)
    for (const C of this.colliders) { const r = C.r; for (let i = 0; i < n; i++) { const a = i * 3, dx = p[a] - C.c.x, dy = p[a + 1] - C.c.y, dz = p[a + 2] - C.c.z, d = Math.hypot(dx, dy, dz); if (d < r && d > 1e-6) { const s = r / d; p[a] = C.c.x + dx * s; p[a + 1] = C.c.y + dy * s; p[a + 2] = C.c.z + dz * s; } } }
    const B = this.bowl;
    if (B) for (let i = 0; i < n; i++) { const a = i * 3, dx = p[a] - B.c.x, dy = p[a + 1] - B.c.y, dz = p[a + 2] - B.c.z, d = Math.hypot(dx, dy, dz); if (dy < 0 && d > B.r) { const s = B.r / d; p[a] = B.c.x + dx * s; p[a + 1] = B.c.y + dy * s; p[a + 2] = B.c.z + dz * s; } }
    const fl = this.floor;
    for (let i = 0; i < n; i++) { const a = i * 3; if (p[a + 1] < fl) { p[a + 1] = fl; p[a] = x[a] + (p[a] - x[a]) * 0.35; p[a + 2] = x[a + 2] + (p[a + 2] - x[a + 2]) * 0.35; } }
    // the velocities from the move, damped
    for (let i = 0; i < n * 3; i++) { v[i] = ((p[i] - x[i]) / h) * damp; x[i] = p[i]; }
  }
  centreOf(arr, out) { const n = this.n; out.set(0, 0, 0); for (let i = 0; i < n; i++) { out.x += arr[i * 3]; out.y += arr[i * 3 + 1]; out.z += arr[i * 3 + 2]; } return out.multiplyScalar(1 / n); }

  /** The rest creeping toward what was done to it (plasticity), its lumps evened (smooth), its volume kept. */
  creep(dt) {
    const n = this.n, q = this.q, x = this.x, Rm = this.Rm; if (!Rm) return;
    const c = this.centreOf(x, _c), kp = 1 - Math.exp(-this.plastic * dt), ks = 1 - Math.exp(-this.smooth * dt), sc = this.restScale;
    if (kp > 0) for (let i = 0; i < n; i++) { // (q <- q + kp (Rᵀ (x - c) / s - q))
      const a = i * 3, dx = x[a] - c.x, dy = x[a + 1] - c.y, dz = x[a + 2] - c.z;
      const rx = (Rm[0] * dx + Rm[1] * dy + Rm[2] * dz) / sc, ry = (Rm[3] * dx + Rm[4] * dy + Rm[5] * dz) / sc, rz = (Rm[6] * dx + Rm[7] * dy + Rm[8] * dz) / sc;
      q[a] += (rx - q[a]) * kp; q[a + 1] += (ry - q[a + 1]) * kp; q[a + 2] += (rz - q[a + 2]) * kp;
    }
    if (ks > 0) { // (a Laplacian pass: each rest point toward its neighbours' mean)
      const tmp = this.tmp ||= new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const N = this.nb[i]; let sx = 0, sy = 0, sz = 0; for (const j of N) { sx += q[j * 3]; sy += q[j * 3 + 1]; sz += q[j * 3 + 2]; } const m = N.length || 1; tmp[i * 3] = q[i * 3] + (sx / m - q[i * 3]) * ks; tmp[i * 3 + 1] = q[i * 3 + 1] + (sy / m - q[i * 3 + 1]) * ks; tmp[i * 3 + 2] = q[i * 3 + 2] + (sz / m - q[i * 3 + 2]) * ks; }
      q.set(tmp);
    }
    if (kp > 0 || ks > 0) { // (the edges' rest lengths follow, the volume kept)
      this.recentre();
      const V = this.restVolume(), f = V > 1e-9 ? Math.cbrt(this.V0 / V) : 1; for (let i = 0; i < n * 3; i++) q[i] *= f;
      const e = this.e, L = this.L; for (let k = 0; k < L.length; k++) { const a = e[k * 2] * 3, b = e[k * 2 + 1] * 3; L[k] = Math.hypot(q[a] - q[b], q[a + 1] - q[b + 1], q[a + 2] - q[b + 2]); }
    }
  }
}
