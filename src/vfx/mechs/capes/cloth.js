// ---------------------------------------------------------------------------------------
// A BACK PIECE'S CLOTH (plain name; the cloth of a mech's back piece, vfx/mechs/capes.js): a small verlet cloth on the CPU, one grid of
// particles laid out at rest in the chest's frame, some pinned to it (a shoulder, a yoke, a knot), the rest swung by the frame's own
// motion (the pins follow the chest's world transform each frame: the stride's bob, a turn, a landing), gravity, a lift and a wind of
// its own, a pull back toward its rest shape (a stiffened sash, a wind bag held open), and pushed out of a few spheres (the back, the
// Jar in its cradle, the pear's hips, the thighs) so nothing is clipped through. One geometry, rewritten each frame, its normals made
// again; drawn in the parts body's trim program (vertex coloured), so the mount's glazing paints it.
// The grid is `cols` across by `rows` along; `wrap` closes it into a tube (each row a ring: Fujin's wind bag).
// Prior art: Jakobsen's "Advanced Character Physics" (2001: position verlet, constraints relaxed in turn, collision by projection);
// Müller et al.'s position-based dynamics (2007: the shape pull as a goal-position constraint, as in shape matching); the helms'
// plumes (vfx/mechs/helms.js: the same verlet, chained to a bone's rest); VRM's spring bones' sphere colliders.
//
//   new Cloth({ cols, rows, rest: [[x, y, z], ...] (chest frame, row by row), pins: [index, ...], wrap?, shape?, lift?, wind?, bend?,
//               colour(c, r) -> hex, mat })   C.attach(parent)   C.step(dt, chestMatrix, spheres)   C.mesh   C.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CAPE_CLOTH } from './knobs.js';

const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _w = new THREE.Vector3(), _inv = new THREE.Matrix4();

export class Cloth {
  constructor({ cols, rows, rest, pins = [], wrap = false, shape = 0, lift = 0, wind = 0, bend = 0.15, damping = CAPE_CLOTH.damping, colour = () => 0xffffff, mat }) {
    Object.assign(this, { cols, rows, wrap, shape, lift, wind, bend, damping });
    const n = cols * rows;
    this.rest = rest.map((p) => new THREE.Vector3(...p));
    this.p = this.rest.map((v) => v.clone()); this.q = this.rest.map((v) => v.clone()); this.prevPin = this.rest.map((v) => v.clone());
    this.w = new Float32Array(n).fill(1); for (const i of pins) this.w[i] = 0;
    this.pins = pins;
    // the constraints: [a, b, rest length, stiffness]
    const C = [], id = (c, r) => r * cols + (wrap ? ((c % cols) + cols) % cols : c);
    const add = (a, b, k) => C.push([a, b, this.rest[a].distanceTo(this.rest[b]), k]);
    const cmax = wrap ? cols : cols - 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (c < cmax) add(id(c, r), id(c + 1, r), 1);
      if (r < rows - 1) add(id(c, r), id(c, r + 1), 1);
      if (r < rows - 1 && c < cmax) { add(id(c, r), id(c + 1, r + 1), 0.5); add(id(c + 1, r), id(c, r + 1), 0.5); }
      if (bend > 0 && r < rows - 2) add(id(c, r), id(c, r + 2), bend);
      if (bend > 0 && c < cmax - 1) add(id(c, r), id(c + 2, r), bend);
    }
    this.C = C;
    // the mesh: a sheet (or a tube) of quads, vertex coloured
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = [], cc = new THREE.Color();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cc.set(colour(c, r)).toArray(col, (r * cols + c) * 3);
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cmax; c++) { const a = id(c, r), b = id(c + 1, r), d = id(c, r + 1), e = id(c + 1, r + 1); idx.push(a, d, b, b, d, e); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.name = 'mech-cape-cloth'; this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.matrixAutoUpdate = false; this.primed = false; this.t = 0;
  }
  attach(parent) { parent.add(this.mesh); return this; }
  /** One frame: the pins carried from where the chest was to where it is over the substeps, the free particles integrated, the
   *  constraints relaxed, the spheres ([{ c: Vector3 world, r }]) pushed out of; then the mesh rewritten in its parent's frame. */
  step(dt, M, spheres = []) {
    const K = CAPE_CLOTH, n = this.p.length;
    if (!this.primed || dt > K.reprime) { for (let i = 0; i < n; i++) { this.p[i].copy(this.rest[i]).applyMatrix4(M); this.q[i].copy(this.p[i]); this.prevPin[i].copy(this.p[i]); } this.primed = true; dt = 0; }
    dt = Math.min(dt, K.maxDt); this.t += dt;
    const steps = Math.max(1, Math.ceil(dt / K.substep)), h = dt / steps, h2 = h * h;
    _w.set(0, 0, -1).transformDirection(M); // (the chest's back: the wind blows that way, off the frame's own front)
    const gust = 0.65 + 0.35 * Math.sin(this.t * 1.7) * Math.sin(this.t * 0.63 + 1.1);
    const ax = _w.x * this.wind * gust, ay = -K.gravity + this.lift + _w.y * this.wind * gust, az = _w.z * this.wind * gust;
    const curPin = this._cur ||= this.rest.map(() => new THREE.Vector3());
    for (const i of this.pins) curPin[i].copy(this.rest[i]).applyMatrix4(M);
    for (let s = 1; s <= steps && dt > 0; s++) {
      const u = s / steps;
      for (const i of this.pins) this.p[i].lerpVectors(this.prevPin[i], curPin[i], u);
      for (let i = 0; i < n; i++) {
        if (!this.w[i]) continue;
        const P = this.p[i], Q = this.q[i];
        _d.subVectors(P, Q).multiplyScalar(1 - this.damping); Q.copy(P);
        P.add(_d); P.x += ax * h2; P.y += ay * h2; P.z += az * h2;
        if (this.shape) P.lerp(_t.copy(this.rest[i]).applyMatrix4(M), this.shape);
      }
      for (let it = 0; it < K.iterations; it++) {
        for (const [a, b, L, k] of this.C) {
          const wa = this.w[a], wb = this.w[b], ws = wa + wb; if (!ws) continue;
          const A = this.p[a], B = this.p[b]; _d.subVectors(B, A); const len = _d.length() || 1e-6, f = ((len - L) / len) * k / ws;
          if (wa) A.addScaledVector(_d, f * wa); if (wb) B.addScaledVector(_d, -f * wb);
        }
        for (const S of spheres) {
          const rr = S.r + K.margin, r2 = rr * rr;
          for (let i = 0; i < n; i++) { if (!this.w[i]) continue; const P = this.p[i]; _d.subVectors(P, S.c); const d2 = _d.lengthSq(); if (d2 < r2 && d2 > 1e-9) P.copy(S.c).addScaledVector(_d, rr / Math.sqrt(d2)); }
        }
      }
    }
    for (const i of this.pins) this.prevPin[i].copy(curPin[i]);
    // the mesh, in its parent's frame
    const par = this.mesh.parent; _inv.copy(par ? par.matrixWorld : _inv.identity()).invert();
    const A = this.mesh.geometry.attributes.position;
    for (let i = 0; i < n; i++) _t.copy(this.p[i]).applyMatrix4(_inv).toArray(A.array, i * 3);
    A.needsUpdate = true; this.mesh.geometry.computeVertexNormals(); this.mesh.geometry.computeBoundingSphere();
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); }
}
