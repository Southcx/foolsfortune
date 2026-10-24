// ---------------------------------------------------------------------------------------
// ROPE: a rope that is really a rope. A chain of point masses (Verlet integration, distance constraints, gravity, damping) pinned
// at both ends: it hangs in a curve when there is more of it than the distance between its ends, is straight when there is not (laid
// on the line between them: the chain alone stretches under its own weight), and moves when the ends do. Drawn as a thin tube (a
// pentagon in section: it is a low-poly game). On top of the simulation a HELIX can be laid: the rope leaves the Sondelass coiled and uncoils as it flies, the coils opening out and straightening as it goes
// taut, the way a rope pays out of a harpoon gun.
//
// SLACK IS THE ONLY CURVE (docs/plans/ANGLING.md 2, the owner's bug): told its slack (the spare length beyond the span, m), a rope with
// none is drawn as the straight segment it is and not simulated at all; it is a chain only while there is real slack, eased between by
// `straightness = smoothstep(slack, ROPE.slackFull, 0)`, so a line drawing taut snaps straight. And the chain is held to its length: a
// few-pass Verlet chain stretches under its own weight (a 36-link line with 2 mm spare on 12 m hung 1.46 m low), so its belly is capped
// at the sag its spare length can make (a shallow curve's sag s from its spare length e: e = 8 s^2 / 3 d).
//
// Prior art: Jakobsen's "Advanced Character Physics" rope (the Verlet chain every game rope descends from), Worms' ninja rope and Just
// Cause's tether for how a grapple rope reads (a taut line with a little sag), and the harpoon-gun cartoons for the corkscrew.
//
//   const r = new Rope(scene, { n: 28, radius: 0.014, color: 0xf3e6d2 })
//   r.update(dt, a, b, { slack (m; or length), taut: 0..1, helix: 0..1, glow: colour|null })
//   r.trace(other, u0, u1, { cam, px, lift })   (a thinner tube laid along a stretch of another rope: the fishing line's core)
//   r.hide()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** slackFull: the spare length (m) from which a rope is all chain; under it, eased to the straight. */
export const ROPE = { slackFull: 0.3 };
const _e = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _ax = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3();

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
    // (a twist in the strands: bands that spiral along it, fixed to the rope, so it reads as rope and not as a beam)
    const col = new Float32Array(nv * 3);
    for (let i = 0; i < n; i++) for (let k = 0; k < sides; k++) { const v = ((i * 0.5 + (k / sides) * 2) % 2) < 1 ? 1 : 0.66; const o = (i * sides + k) * 3; col[o] = col[o + 1] = col[o + 2] = v; }
    this.geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, vertexColors: true });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
    this.mesh.visible = false;
    scene.add(this.mesh);
    // a wider, additive shell for the glow of a loaded line
    this.posG = new Float32Array(nv * 3);
    this.geoG = new THREE.BufferGeometry();
    this.geoG.setAttribute('position', new THREE.BufferAttribute(this.posG, 3).setUsage(THREE.DynamicDrawUsage));
    this.geoG.setIndex(idx);
    this.glow = new THREE.Mesh(this.geoG, new THREE.MeshBasicMaterial({ color: glowColor ?? 0xffb27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }));
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
   * opts: { slack (m beyond the span: 0 is straight), or length (the rope's; default the span), gravity, damp, iter,
   *         helix (0..1: the uncoiling), coils, taut (0..1, only for the glow), glow (colour) }
   */
  update(dt, a, b, opts = {}) {
    if (!this.ready) this.reset(a, b);
    const n = this.n, X = this.x, PX = this.px;
    const dist = a.distanceTo(b);
    const length = Math.max(opts.length ?? dist + (opts.slack ?? 0), dist * 0.999);
    const slack = Math.max(0, opts.slack ?? length - dist);
    const straight = 1 - THREE.MathUtils.smoothstep(slack, 0, ROPE.slackFull);
    if (straight > 0.999) { // (no slack: the straight segment it is, and nothing simulated; its motion spent)
      for (let i = 0; i < n; i++) { X[i].lerpVectors(a, b, i / (n - 1)); PX[i].copy(X[i]); }
      this.drawPoints(dt, a, b, length, opts);
      return;
    }
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
    // (held to its length: the chain's belly no deeper than the sag its spare length makes, the excess taken off its offsets from the
    //  chord and its motion with them: casebook rule NEW:slack-only-curve)
    const sagOf = Math.sqrt(slack * dist * 0.375);
    _ax.subVectors(b, a).multiplyScalar(1 / (dist || 1));
    let belly = 0;
    for (let i = 1; i < n - 1; i++) { _p.subVectors(X[i], a); belly = Math.max(belly, _p.addScaledVector(_ax, -_p.dot(_ax)).length()); }
    const k = belly > sagOf * 1.02 ? sagOf / belly : 1;
    if (k < 0.999) for (let i = 1; i < n - 1; i++) {
      const x = X[i], p = PX[i], vx = (x.x - p.x) * k, vy = (x.y - p.y) * k, vz = (x.z - p.z) * k;
      _u.copy(a).addScaledVector(_ax, _p.subVectors(x, a).dot(_ax)); // (its foot on the chord)
      x.lerp(_u, 1 - k);
      p.set(x.x - vx, x.y - vy, x.z - vz);
    }
    this.drawPoints(dt, a, b, length, opts, straight);
  }

  /** The drawn points (the simulation, plus the helix of an uncoiling rope) built into the tube, and the glow. */
  drawPoints(dt, a, b, length, opts, straight = 1) {
    const n = this.n, X = this.x;
    const helix = opts.helix ?? 0;
    this.phase += dt * 20;
    _ax.subVectors(b, a); const len = _ax.length() || 1; _ax.multiplyScalar(1 / len);
    _u.set(0, 1, 0).addScaledVector(_ax, -_ax.y); if (_u.lengthSq() < 1e-4) _u.set(1, 0, 0).addScaledVector(_ax, -_ax.x);
    _u.normalize(); _w.crossVectors(_ax, _u);
    const coils = opts.coils ?? Math.max(2, length / 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = this.draw[i].copy(X[i]);
      if (straight > 0.001) p.lerp(_p.copy(a).addScaledVector(_ax, _e.subVectors(X[i], a).dot(_ax)), straight); // (eased to the straight: drawn, not simulated)
      if (helix > 0.001) {
        const env = Math.sin(Math.PI * t) ** 0.8 * helix * (opts.helixR ?? 0.32);
        const ph = t * coils * Math.PI * 2 - this.phase;
        p.addScaledVector(_u, Math.cos(ph) * env).addScaledVector(_w, Math.sin(ph) * env);
      }
    }
    // (a rope is the same width on the screen wherever it is: its radius grows with the distance from the camera when one is given)
    this.cam = opts.cam || null; this.pxScale = opts.px ?? 0; this.rMin = opts.rMin ?? this.radius; this.rMax = opts.rMax ?? this.radius * 6;
    const r = opts.radius ?? this.radius;
    this.build(this.pos, this.geo, r);
    this.mesh.visible = true;
    if (opts.glow != null && (opts.taut ?? 0) > 0.05) {
      this.build(this.posG, this.geoG, r * this.glowRadius);
      this.glow.material.color.set(opts.glow); this.glow.material.opacity = 0.5 * Math.min(1, opts.taut); this.glow.visible = true;
    } else this.glow.visible = false;
  }

  /** This rope's tube laid along another's drawn points from u0 to u1 (0 its a end, 1 its b), lifted toward the camera by `lift` (m a
   *  metre of distance: over the other's tube, so a thread inside a sheath is seen), `px` its radius a metre of distance. */
  trace(src, u0, u1, { cam, px, lift = 0 }) {
    const n = this.n, m = src.n - 1;
    for (let i = 0; i < n; i++) {
      const f = (u0 + (u1 - u0) * i / (n - 1)) * m, j = Math.min(m - 1, Math.max(0, Math.floor(f)));
      const p = this.draw[i].lerpVectors(src.draw[j], src.draw[j + 1], THREE.MathUtils.clamp(f - j, 0, 1));
      if (cam && lift) p.addScaledVector(_t.subVectors(cam, p), lift);
    }
    this.cam = cam || null; this.pxScale = px; this.rMin = 0; this.rMax = 1;
    this.build(this.pos, this.geo, this.radius);
    this.mesh.visible = true;
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
      const rr = (this.cam ? THREE.MathUtils.clamp(this.cam.distanceTo(P[i]) * this.pxScale, this.rMin, this.rMax) * (r / this.radius) : r) * (i === 0 || i === n - 1 ? 0.8 : 1);
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
