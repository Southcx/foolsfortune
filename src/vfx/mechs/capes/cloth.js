// ---------------------------------------------------------------------------------------
// A BACK PIECE'S CLOTH (plain name; the cloth of a mech's back piece, vfx/mechs/capes.js): a small verlet cloth on the CPU, one grid of
// particles laid out at rest in the chest's frame, some pinned to it (a shoulder, a yoke, a knot), the rest swung by the frame's own
// motion (the pins follow the chest's world transform each frame: the stride's bob, a turn, a landing), gravity, a lift and a wind of
// its own, a pull back toward its rest shape (a stiffened sash, a wind bag held open), and pushed out of a few spheres (the back, the
// Jar in its cradle, the pear's hips, a hip piece, the thighs) so nothing is clipped through. One geometry, rewritten each frame;
// drawn in the parts body's programs (vertex coloured), so the mount's glazing paints it.
// The grid is `cols` across by `rows` along; `wrap` closes it into a tube (each row a ring: Fujin's wind bag). Its outer face's quads
// are drawn in the program `part(c, r)` names (0 the first of `mats`: a band of gold along a sash's edge, a stripe of the body glaze
// round a bag). With `thick` (m) it is a cloth with weight: the outer face, a lining `thick` behind it in `mats[1]` (the body glaze
// under the trim), and an edge joining the two all round in `mats[2]` (a gilt hem), the foot's edge `hem` times as thick (a rolled
// hem). The constraints are relaxed forward and back in turn, so a cloth at rest hangs square, never drifting to one side.
// Prior art: Jakobsen's "Advanced Character Physics" (2001: position verlet, constraints relaxed in turn, collision by projection);
// Müller et al.'s position-based dynamics (2007: the shape pull as a goal-position constraint, as in shape matching; symmetric
// Gauss-Seidel sweeps against the one-sided drift); the helms' plumes (vfx/mechs/helms.js: the same verlet, chained to a bone's rest);
// VRM's spring bones' sphere colliders; a lined cloak's turned and rolled hem.
//
//   new Cloth({ cols, rows, rest: [[x, y, z], ...] (chest frame, row by row), pins: [index, ...], wrap?, shape?, lift?, wind?, bend?,
//               colour(c, r) -> hex, part?(c, r) -> index, thick?, hem?, mats | mat })   C.attach(parent)   C.step(dt, chestMatrix, spheres)
//   C.mesh   C.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CAPE_CLOTH } from './knobs.js';

const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _w = new THREE.Vector3(), _inv = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class Cloth {
  constructor({ cols, rows, rest, pins = [], wrap = false, shape = 0, lift = 0, wind = 0, bend = 0.15, damping = CAPE_CLOTH.damping, colour = () => 0xffffff,
    part = () => 0, thick = 0, hem = 1, lining = 0xffffff, edge = 0xffffff, mat, mats }) {
    Object.assign(this, { cols, rows, wrap, shape, lift, wind, bend, damping, thick, hem });
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
    this.C = C; this.id = id; this.cmax = cmax;
    // the edge all round a sheet (a tube has none): the perimeter's particles in order, each with its inward neighbour
    const ring = [];
    if (thick > 0 && !wrap) {
      for (let c = 0; c < cols; c++) ring.push([id(c, 0), id(c, 1)]);
      for (let r = 1; r < rows; r++) ring.push([id(cols - 1, r), id(cols - 2, r)]);
      for (let c = cols - 2; c >= 0; c--) ring.push([id(c, rows - 1), id(c, rows - 2)]);
      for (let r = rows - 2; r >= 1; r--) ring.push([id(0, r), id(1, r)]);
    }
    this.ring = ring; this.N = this.rest.map(() => new THREE.Vector3()); this.side = 1;
    if (thick > 0) { // (which way the outer face looks at rest: away from the frame's back, -Z in the chest's frame)
      this.normals(this.rest); this.side = this.N[id((cols / 2) | 0, (rows / 2) | 0)].z <= 0 ? 1 : -1;
    }
    const out = this.side > 0 ? (a, b, d, e) => [a, d, b, b, d, e] : (a, b, d, e) => [a, b, d, b, e, d];
    // the mesh: the outer face (grouped by part), a lining and the edge when thick; vertex coloured
    const nv = thick > 0 ? n * 2 + ring.length * 2 : n, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), cc = new THREE.Color();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cc.set(colour(c, r)).toArray(col, (r * cols + c) * 3);
    const groups = new Map();
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cmax; c++) {
      const a = id(c, r), b = id(c + 1, r), d = id(c, r + 1), e = id(c + 1, r + 1), g = part(c, r) | 0;
      if (!groups.has(g)) groups.set(g, []); groups.get(g).push(...out(a, b, d, e));
    }
    const idx = [], geo = new THREE.BufferGeometry();
    for (const [g, list] of [...groups].sort((x, y) => x[0] - y[0])) { geo.addGroup(idx.length, list.length, g); idx.push(...list); }
    if (thick > 0) {
      cc.set(lining); for (let i = 0; i < n; i++) cc.toArray(col, (n + i) * 3);
      const lin = []; for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cmax; c++) { const a = n + id(c, r), b = n + id(c + 1, r), d = n + id(c, r + 1), e = n + id(c + 1, r + 1); lin.push(...out(a, d, b, e)); }
      geo.addGroup(idx.length, lin.length, 1); idx.push(...lin);
      cc.set(edge); const base = 2 * n, m = ring.length, rim = [];
      for (let k = 0; k < m * 2; k++) cc.toArray(col, (base + k) * 3);
      for (let k = 0; k < m; k++) { const o0 = base + k * 2, o1 = base + ((k + 1) % m) * 2; rim.push(o0, o1, o0 + 1, o1, o1 + 1, o0 + 1); }
      geo.addGroup(idx.length, rim.length, 2); idx.push(...rim);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
    const list = mats || [mat, mat, mat];
    this.mesh = new THREE.Mesh(geo, list); this.mesh.name = 'mech-cape-cloth'; this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.matrixAutoUpdate = false; this.primed = false; this.t = 0;
  }
  attach(parent) { parent.add(this.mesh); return this; }
  /** One frame: the pins carried from where the chest was to where it is over the substeps, the free particles integrated, the
   *  constraints relaxed (forward, then back), the spheres ([{ c: Vector3 world, r }]) pushed out of; then the mesh rewritten. */
  step(dt, M, spheres = []) {
    const K = CAPE_CLOTH, n = this.p.length;
    if (!this.primed || dt > K.reprime) {
      for (let i = 0; i < n; i++) { this.p[i].copy(this.rest[i]).applyMatrix4(M); this.q[i].copy(this.p[i]); this.prevPin[i].copy(this.p[i]); }
      this.primed = true; dt = 0;
    }
    dt = Math.min(dt, K.maxDt); this.t += dt;
    const steps = Math.max(1, Math.ceil(dt / K.substep)), h = dt / steps, h2 = h * h;
    _w.set(0, 0, -1).transformDirection(M); // (the chest's back: the wind blows that way, off the frame's own front)
    const gust = 0.65 + 0.35 * Math.sin(this.t * 1.7) * Math.sin(this.t * 0.63 + 1.1);
    const ax = _w.x * this.wind * gust, ay = -K.gravity + this.lift + _w.y * this.wind * gust, az = _w.z * this.wind * gust;
    const curPin = this._cur ||= this.rest.map(() => new THREE.Vector3());
    for (const i of this.pins) curPin[i].copy(this.rest[i]).applyMatrix4(M);
    const C = this.C, nc = C.length;
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
        const back = it & 1; // (forward, then back: a one-way sweep pulls the cloth to its first side)
        for (let q = 0; q < nc; q++) {
          const [a, b, Lr, k] = C[back ? nc - 1 - q : q];
          const wa = this.w[a], wb = this.w[b], ws = wa + wb; if (!ws) continue;
          const A = this.p[a], B = this.p[b]; _d.subVectors(B, A); const len = _d.length() || 1e-6, f = ((len - Lr) / len) * k / ws;
          if (wa) A.addScaledVector(_d, f * wa); if (wb) B.addScaledVector(_d, -f * wb);
        }
        for (const S of spheres) {
          const rr = S.r + K.margin + this.thick, r2 = rr * rr;
          for (let i = 0; i < n; i++) { if (!this.w[i]) continue; const P = this.p[i]; _d.subVectors(P, S.c); const d2 = _d.lengthSq(); if (d2 < r2 && d2 > 1e-9) P.copy(S.c).addScaledVector(_d, rr / Math.sqrt(d2)); }
        }
      }
    }
    for (const i of this.pins) this.prevPin[i].copy(curPin[i]);
    this.write();
  }
  /** Each particle's normal from its grid neighbours (of `p`: the particles in the world, or the rest in the chest's frame). */
  normals(p = this.p) {
    const { cols, rows, id, N, wrap } = this;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cl = wrap ? c - 1 : Math.max(0, c - 1), cr = wrap ? c + 1 : Math.min(cols - 1, c + 1), ru = Math.max(0, r - 1), rd = Math.min(rows - 1, r + 1);
      _a.subVectors(p[id(cr, r)], p[id(cl, r)]); _b.subVectors(p[id(c, rd)], p[id(c, ru)]);
      N[id(c, r)].crossVectors(_b, _a).normalize();
    }
  }
  /** The mesh rewritten in its parent's frame: the outer face, and when thick the lining behind it and the edge between. */
  write() {
    const par = this.mesh.parent; _inv.copy(par ? par.matrixWorld : _inv.identity()).invert();
    const nrm = new THREE.Matrix3().setFromMatrix4(_inv), n = this.p.length, G = this.mesh.geometry, A = G.attributes.position, B = G.attributes.normal;
    this.normals();
    const sd = this.side;
    for (let i = 0; i < n; i++) {
      _t.copy(this.p[i]).applyMatrix4(_inv).toArray(A.array, i * 3);
      _d.copy(this.N[i]).multiplyScalar(sd).applyMatrix3(nrm).normalize().toArray(B.array, i * 3);
    }
    if (this.thick > 0) {
      const rows = this.rows, th = (i) => this.thick * (Math.floor(i / this.cols) === rows - 1 ? this.hem : 1);
      for (let i = 0; i < n; i++) {
        _t.copy(this.p[i]).addScaledVector(this.N[i], -sd * th(i)).applyMatrix4(_inv).toArray(A.array, (n + i) * 3);
        _d.copy(this.N[i]).multiplyScalar(-sd).applyMatrix3(nrm).normalize().toArray(B.array, (n + i) * 3);
      }
      const base = 2 * n;
      this.ring.forEach(([i, inn], k) => {
        _d.subVectors(this.p[i], this.p[inn]).applyMatrix3(nrm).normalize();
        _t.copy(this.p[i]).applyMatrix4(_inv).toArray(A.array, (base + k * 2) * 3);
        _t.copy(this.p[i]).addScaledVector(this.N[i], -sd * th(i)).applyMatrix4(_inv).toArray(A.array, (base + k * 2 + 1) * 3);
        _d.toArray(B.array, (base + k * 2) * 3); _d.toArray(B.array, (base + k * 2 + 1) * 3);
      });
    }
    A.needsUpdate = true; B.needsUpdate = true; G.computeBoundingSphere();
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); }
}
