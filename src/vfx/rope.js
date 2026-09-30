// ---------------------------------------------------------------------------------------
// ROPE: a rope that is really a rope. A chain of point masses (Verlet integration, distance constraints, gravity, damping) pinned
// at both ends: it hangs in a curve when there is more of it than the distance between its ends, pulls straight when there is not,
// and moves when the ends do. Drawn as a thin tube (a pentagon in section: it is a low-poly game). On top of the simulation a
// HELIX can be laid: the rope leaves the Sondelass coiled and uncoils as it flies, the coils opening out and straightening as it goes
// taut, the way a rope pays out of a harpoon gun.
//
// Prior art: Jakobsen's "Advanced Character Physics" rope (the Verlet chain every game rope descends from), Worms' ninja rope and Just
// Cause's tether for how a grapple rope reads (a taut line with a little sag), and the harpoon-gun cartoons for the corkscrew.
//
//   const r = new Rope(scene, { n: 28, radius: 0.014, color: 0xf3e6d2 })
//   r.update(dt, a, b, { length, taut: 0..1, helix: 0..1, glow: colour|null })
//   r.hide()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Vector3(), _ax = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3();

export class Rope {
  constructor(scene, { n = 28, sides = 5, radius = 0.014, color = 0xf3e6d2, glowColor = null } = {}) {
    this.n = n; this.sides = sides; this.radius = radius;
    this.x = Array.from({ length: n }, () => new THREE.Vector3());
    this.px = Array.from({ length: n }, () => new THREE.Vector3());
    this.draw = Array.from({ length: n }, () => new THREE.Vector3());
    this.ready = false;
    this.phase = 0;
    const nv = n * sides;
    this.pos = new Float32Array(nv * 3);
    const idx = [];
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
      const a = i * sides + k, b = i * sides + (k + 1) % sides, c = (i + 1) * sides + k, d = (i + 1) * sides + (k + 1) % sides;
      idx.push(a, c, b, b, c, d);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setIndex(idx);
    this.mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
    this.mesh.visible = false;
    scene.add(this.mesh);
    // a wider, additive shell for the glow of a loaded line
    this.posG = new Float32Array(nv * 3);
    this.geoG = new THREE.BufferGeometry();
    this.geoG.setAttribute('position', new THREE.BufferAttribute(this.posG, 3).setUsage(THREE.DynamicDrawUsage));
    this.geoG.setIndex(idx);
    this.glow = new THREE.Mesh(this.geoG, new THREE.MeshBasicMaterial({ color: glowColor ?? 0xffb27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.glow.frustumCulled = false; this.glow.renderOrder = 6; this.glow.visible = false;
    this.glow.scale.setScalar(1);
    scene.add(this.glow);
    this.glowRadius = 3.2;
  }

  get visible() { return this.mesh.visible; }
  hide() { this.mesh.visible = false; this.glow.visible = false; this.ready = false; }
  setColor(c) { this.mat.color.set(c); }

  /** Lay the rope straight between a and b (a fresh start: no old motion). */
  reset(a, b) {
    for (let i = 0; i < this.n; i++) { const t = i / (this.n - 1); this.x[i].lerpVectors(a, b, t); this.px[i].copy(this.x[i]); }
    this.ready = true;
  }

  /**
   * opts: { length (rope length; default the distance between the ends), gravity, damp, iter,
   *         helix (0..1: the uncoiling), coils, taut (0..1, only for the glow), glow (colour) }
   */
  update(dt, a, b, opts = {}) {
    if (!this.ready) this.reset(a, b);
    const n = this.n, X = this.x, PX = this.px;
    const dist = a.distanceTo(b);
    const length = Math.max(opts.length ?? dist, dist * 0.999);
    const rest = length / (n - 1);
    const g = opts.gravity ?? 9, damp = opts.damp ?? 0.985, iters = opts.iter ?? 6;
    const h = Math.min(dt, 1 / 30);
    // integrate
    for (let i = 1; i < n - 1; i++) {
      const x = X[i], p = PX[i];
      const vx = (x.x - p.x) * damp, vy = (x.y - p.y) * damp, vz = (x.z - p.z) * damp;
      p.copy(x);
      x.x += vx; x.y += vy - g * h * h; x.z += vz;
    }
    X[0].copy(a); X[n - 1].copy(b);
    PX[0].copy(a); PX[n - 1].copy(b);
    // constraints: neighbours keep their distance (a rope does not stretch, it may go slack), the ends stay pinned
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n - 1; i++) {
        const A = X[i], B = X[i + 1];
        _t.subVectors(B, A);
        const d = _t.length() || 1e-6;
        const diff = (d - rest) / d;
        if (diff <= 0 && opts.slack !== false && d < rest) { /* slack is allowed: only pull when stretched */ }
        const wA = i === 0 ? 0 : 0.5, wB = i + 1 === n - 1 ? 0 : 0.5;
        const tot = wA + wB || 1;
        if (diff > 0) { // stretched: pull together
          A.addScaledVector(_t, diff * wA / tot); B.addScaledVector(_t, -diff * wB / tot);
        } else if (diff < 0 && opts.rigid) { // (a rigid rod: also push apart)
          A.addScaledVector(_t, diff * wA / tot); B.addScaledVector(_t, -diff * wB / tot);
        }
      }
      X[0].copy(a); X[n - 1].copy(b);
    }
    // the drawn points: the simulation, plus the helix of an uncoiling rope
    const helix = opts.helix ?? 0;
    this.phase += dt * 20;
    _ax.subVectors(b, a); const len = _ax.length() || 1; _ax.multiplyScalar(1 / len);
    _u.set(0, 1, 0).addScaledVector(_ax, -_ax.y); if (_u.lengthSq() < 1e-4) _u.set(1, 0, 0).addScaledVector(_ax, -_ax.x);
    _u.normalize(); _w.crossVectors(_ax, _u);
    const coils = opts.coils ?? Math.max(2, length / 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = this.draw[i].copy(X[i]);
      if (helix > 0.001) {
        const env = Math.sin(Math.PI * t) ** 0.8 * helix * (opts.helixR ?? 0.32);
        const ph = t * coils * Math.PI * 2 - this.phase;
        p.addScaledVector(_u, Math.cos(ph) * env).addScaledVector(_w, Math.sin(ph) * env);
      }
    }
    const r = opts.radius ?? this.radius;
    this.build(this.pos, this.geo, r);
    this.mesh.visible = true;
    if (opts.glow != null && (opts.taut ?? 0) > 0.05) {
      this.build(this.posG, this.geoG, r * this.glowRadius);
      this.glow.material.color.set(opts.glow); this.glow.material.opacity = 0.5 * Math.min(1, opts.taut); this.glow.visible = true;
    } else this.glow.visible = false;
  }

  /** Points -> a tube of `sides` sides (parallel transport for the frame: no twisting). */
  build(pos, geo, r) {
    const n = this.n, P = this.draw, sides = this.sides;
    _n.set(0, 1, 0);
    for (let i = 0; i < n; i++) {
      _t.subVectors(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]);
      if (_t.lengthSq() < 1e-10) _t.set(0, 0, 1);
      _t.normalize();
      if (i === 0) { _n.set(0, 1, 0); if (Math.abs(_t.y) > 0.95) _n.set(1, 0, 0); }
      _n.addScaledVector(_t, -_n.dot(_t)).normalize();
      _b.crossVectors(_t, _n);
      const rr = r * (i === 0 || i === n - 1 ? 0.8 : 1);
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * Math.PI * 2, c = Math.cos(a) * rr, s = Math.sin(a) * rr;
        const o = (i * sides + k) * 3;
        pos[o] = P[i].x + _n.x * c + _b.x * s; pos[o + 1] = P[i].y + _n.y * c + _b.y * s; pos[o + 2] = P[i].z + _n.z * c + _b.z * s;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  }
}
