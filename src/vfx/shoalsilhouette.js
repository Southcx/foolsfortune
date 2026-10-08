// ---------------------------------------------------------------------------------------
// THE SHOAL'S SILHOUETTE (the shoal leg's peak: docs/plans/RAIL-OVERHAUL.md section 6, "the school forms a leviathan-shaped silhouette for
// the peak and must be broken by shooting its eye"; docs/GLOSSARY.md: the shoal's silhouette). At the peak the school draws itself up into
// one giant body, and the one place it can be broken is its eye. This module is the shape and the eye's look; Petra's boids steer the
// glints onto the shape (vfx/shoal.js draws them) and decide when the eye breaks.
//
//   THE SHAPES   `silhouetteTargets(n, shape)`: n points for n glints to make for, in the shape's own frame (metres; +Z its head, Y up,
//                X its thickness: the profile faces +X and -X). 'leviathan': a Leviathan's profile (the class's great body: a blunt
//                brow, a gaping maw, a swept dorsal and pectoral, a forked tail), its points on the OUTLINE (two in five: the edge
//                is what reads), round the EYE (a ring of them, so the socket shows), and filling the body evenly (a Halton sequence,
//                each point as thick as the body is there and no thicker than its distance to the edge). 'ball': a bait ball
//                (a Fibonacci shell and some inside it). 'ring': a torus round Y.
//   THE SWIM     `silhouetteSwim(S, t, out)`: the targets with a slow wave down the body (the head steady, the tail beating), so the
//                giant swims while it is made of fish; `silhouetteEyeAt(S, t, out)` where the eye is on it then
//   FACING       `facing(centre, camPos, out)`: the turn that shows the profile to the camera (its +X side), the head level
//   THE EYE      `new SilhouetteEye({ radius })`: a labradorite lens (vfx/railgeometry.js's lens, the Mind's one program), its slit
//                pupil watching you, lids that open, cracks that glow as it is hurt, and a burn when it is locked (gold-white from
//                the pupil out, throbbing slowly: a ramp, never a flash); a wire ring round it in labradorite that turns gold when
//                locked; and `shatter()`: the lens bursts into shards and is gone (the school scattering is the boids')
//
// Prior art: Child of Eden's Archives (a school of lights that becomes a whale, and the one spot that breaks it), the sardine run's
// "shark" formed by a school, Reynolds' arrival steering (a member slowing onto its target), the Halton sequence for even, stable
// coverage (J. H. Halton, 1960), the Fibonacci sphere (González, 2010), and Sauron's and the Cyclops's single eye.
//
//   const S = silhouetteTargets(600, 'leviathan', { length: 48 })   S.points (Float32Array n*3)   S.kind (0 fill, 1 outline, 2 eye rim)
//   S.eye (Vector3 | null)   S.eyeRadius   silhouetteSwim(S, t, out)   silhouetteEyeAt(S, t, out)   facing(centre, camPos, outQuat)
//   const E = new SilhouetteEye({ radius })   E.group   E.set({ open 0..1, locked 0..1, crack 0..1 })   E.shatter()   E.update(dt)   E.dispose()
//   (E.broken: true once shattered; E.group's position is the eye's, set by the owner from silhouetteEyeAt through its frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindGeoMaterial, mindGeoMesh } from './railgeometry.js';

/** A Leviathan's profile, a body length of 1 (z -0.5 the tail .. 0.5 the snout, y up): snout, brow, dorsal, tail, belly, pectoral,
 *  jaw, and the maw open back into the head. A closed polygon. */
const LEVIATHAN = [
  [0.5, 0.015], [0.48, 0.05], [0.42, 0.09], [0.34, 0.12], [0.25, 0.13], [0.17, 0.14], [0.1, 0.155],
  [-0.02, 0.27], [-0.04, 0.15], [-0.13, 0.125], [-0.22, 0.095], [-0.31, 0.065], [-0.37, 0.045],
  [-0.41, 0.05], [-0.46, 0.12], [-0.53, 0.205], [-0.5, 0.11], [-0.47, 0.02], [-0.5, -0.06], [-0.535, -0.155], [-0.46, -0.08], [-0.41, -0.035],
  [-0.32, -0.05], [-0.22, -0.08], [-0.12, -0.1], [-0.01, -0.11], [-0.07, -0.24], [0.1, -0.125],
  [0.18, -0.12], [0.28, -0.115], [0.38, -0.1], [0.46, -0.085], [0.48, -0.07], [0.4, -0.04], [0.33, -0.012], [0.42, 0.0],
];
const EYE = { z: 0.36, y: 0.062, r: 0.03 };

const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
function inside(poly, z, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [zi, yi] = poly[i], [zj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && z < ((zj - zi) * (y - yi)) / (yj - yi) + zi) c = !c;
  }
  return c;
}
function edgeDist(poly, z, y) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, k = THREE.MathUtils.clamp(((z - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    d = Math.min(d, Math.hypot(z - ax - dx * k, y - ay - dy * k));
  }
  return d;
}
/** Points evenly spaced along a closed polygon by arc length. */
function alongOutline(poly, n) {
  const seg = poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]); }), total = seg.reduce((a, b) => a + b, 0), out = [];
  for (let k = 0; k < n; k++) {
    let s = ((k + 0.5) / n) * total, i = 0;
    while (s > seg[i]) { s -= seg[i]; i++; }
    const p = poly[i], q = poly[(i + 1) % poly.length], f = s / seg[i];
    out.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]);
  }
  return out;
}

/** n points for the school to make for, in the shape's frame (metres). See the header. */
export function silhouetteTargets(n, shape = 'leviathan', { length = 48, radius = 6, depth = 1 } = {}) {
  const points = new Float32Array(n * 3), kind = new Uint8Array(n);
  const put = (i, x, y, z, k) => { points[i * 3] = x; points[i * 3 + 1] = y; points[i * 3 + 2] = z; kind[i] = k; };
  if (shape === 'ball') {
    const shell = Math.round(n * 0.8);
    for (let i = 0; i < n; i++) {
      const sh = i < shell, m = sh ? shell : n - shell, k = sh ? i : i - shell, y = 1 - (2 * (k + 0.5)) / m, r = Math.sqrt(1 - y * y), a = k * 2.39996;
      const R = radius * (sh ? 1 : 0.45 + 0.4 * halton(k + 1, 2));
      put(i, Math.cos(a) * r * R, y * R, Math.sin(a) * r * R, sh ? 1 : 0);
    }
    return { shape, n, points, kind, eye: null, eyeRadius: 0, length: radius * 2 };
  }
  if (shape === 'ring') {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = halton(i + 1, 3) * Math.PI * 2, t = radius * 0.15 * Math.sqrt(halton(i + 1, 2));
      put(i, Math.cos(a) * (radius + Math.cos(b) * t), Math.sin(b) * t, Math.sin(a) * (radius + Math.cos(b) * t), 1);
    }
    return { shape, n, points, kind, eye: null, eyeRadius: 0, length: radius * 2 };
  }
  // the Leviathan: the outline, the eye's rim, the fill
  const nOut = Math.round(n * 0.4), nEye = Math.min(Math.round(n * 0.04), 40), nFill = n - nOut - nEye, L = length;
  let i = 0;
  for (const [z, y] of alongOutline(LEVIATHAN, nOut)) put(i++, 0, y * L, z * L, 1);
  for (let k = 0; k < nEye; k++) { const a = (k / nEye) * Math.PI * 2; put(i++, 0, (EYE.y + Math.sin(a) * EYE.r * 1.6) * L, (EYE.z + Math.cos(a) * EYE.r * 1.6) * L, 2); }
  const th = (z) => 0.07 * depth * Math.pow(Math.sin(Math.PI * THREE.MathUtils.clamp((z + 0.42) / 0.94, 0, 1)), 0.7); // (thickest at the chest, a blade at the tail)
  for (let h = 1; i < n && h < n * 40; h++) {
    const z = -0.54 + halton(h, 2) * 1.05, y = -0.25 + halton(h, 3) * 0.53;
    if (!inside(LEVIATHAN, z, y) || Math.hypot(z - EYE.z, y - EYE.y) < EYE.r * 1.9) continue;
    const x = (halton(h, 5) * 2 - 1) * Math.min(th(z), edgeDist(LEVIATHAN, z, y) * 0.8);
    put(i++, x * L, y * L, z * L, 0);
  }
  for (; i < n; i++) put(i, 0, 0, 0, 0); // (never reached at the counts a school has; kept so every glint has somewhere to go)
  return { shape, n, points, kind, eye: new THREE.Vector3(0, EYE.y * L, EYE.z * L), eyeRadius: EYE.r * L, length: L, fill: nFill };
}

/** The body's wave on the targets at time t (real seconds): the head steady, the tail beating, a slow heave. Into `out` (made if absent). */
export function silhouetteSwim(S, t, out = new Float32Array(S.n * 3), { amp = 0.035, speed = 1.1 } = {}) {
  const P = S.points, L = S.length;
  for (let i = 0; i < S.n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], u = z / L;
    const env = S.shape === 'leviathan' ? 0.2 + 0.8 * THREE.MathUtils.smoothstep(0.3 - u, 0, 0.8) : 0.3;
    out[i * 3] = x; out[i * 3 + 1] = y + L * (amp * env * Math.sin(Math.PI * 2 * u * 1.1 - t * speed * 2) + 0.01 * Math.sin(t * 0.5)); out[i * 3 + 2] = z;
  }
  return out;
}
/** Where the eye is at time t, by the same wave (shape frame). */
export function silhouetteEyeAt(S, t, out = new THREE.Vector3(), { amp = 0.035, speed = 1.1 } = {}) {
  if (!S.eye) return null;
  const L = S.length, u = S.eye.z / L, env = 0.2 + 0.8 * THREE.MathUtils.smoothstep(0.3 - u, 0, 0.8);
  return out.set(S.eye.x, S.eye.y + L * (amp * env * Math.sin(Math.PI * 2 * u * 1.1 - t * speed * 2) + 0.01 * Math.sin(t * 0.5)), S.eye.z);
}
const _x = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0), _z = new THREE.Vector3(), _mb = new THREE.Matrix4(), _qs = new THREE.Quaternion(), _ss = new THREE.Vector3();
/** The turn that shows the shape's profile (+X) to the camera from `centre`, its head level. */
export function facing(centre, camPos, out = new THREE.Quaternion()) {
  _x.subVectors(camPos, centre).setY(0); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize();
  _z.crossVectors(_x, _y).normalize();
  return out.setFromRotationMatrix(_mb.makeBasis(_x, _y, _z));
}

// ---------------------------------------------------------------- the eye
export class SilhouetteEye {
  constructor({ radius = 1.6 } = {}) {
    this.group = new THREE.Group(); this.group.name = 'silhouette-eye'; this.group.userData.zoneFree = true;
    this.mat = mindGeoMaterial('lens', { bright: 1, warped: false }); // (the eye is shot at: the storm never bends it, vfx/railgeometry.js)
    this.lens = mindGeoMesh(new THREE.SphereGeometry(1, 28, 18), this.mat, 1); this.lens.count = 1; this.lens.setMatrixAt(0, new THREE.Matrix4());
    this.lens.scale.setScalar(radius); this.group.add(this.lens);
    // the ring round it: labradorite wire, gold when locked, always turned to the eye that looks at it
    this.ringMat = mindGeoMaterial('wire', { grid: [16, 4], bright: 1.2, warped: false });
    this.ring = mindGeoMesh(new THREE.TorusGeometry(radius * 1.45, radius * 0.05, 4, 48), this.ringMat, 1); this.ring.count = 1; this.ring.setMatrixAt(0, new THREE.Matrix4()); this.group.add(this.ring);
    const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _r = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1);
    this.ring.onBeforeRender = (r, s, cam) => { // (turned to the camera in the group's frame, and turning slowly in its own plane)
      this.group.getWorldQuaternion(_p).invert(); cam.getWorldQuaternion(_q);
      this.ring.quaternion.copy(_p).multiply(_q).multiply(_r.setFromAxisAngle(Z, this.t * 0.3)); this.ring.updateMatrixWorld();
    };
    // the shards it bursts into (the same family's wire, additive)
    this.shardMat = mindGeoMaterial('wire', { grid: [1, 1], bright: 1.4, line: 2, warped: false });
    this.shards = mindGeoMesh(new THREE.TetrahedronGeometry(radius * 0.35), this.shardMat, 14); this.group.add(this.shards);
    this.sv = Array.from({ length: 14 }, () => new THREE.Vector3().randomDirection().multiplyScalar(6 + Math.random() * 8));
    this.radius = radius; this.reset();
  }

  /** Whole again, shut, unlocked (a new silhouette's eye). */
  reset() {
    this.k = { open: 0, locked: 0, crack: 0 }; this.to = { open: 1, locked: 0, crack: 0 }; this.t = 0; this.broken = false; this.bt = -1;
    this.lens.visible = this.ring.visible = true; this.lens.scale.setScalar(this.radius); this.shards.count = 0;
  }

  /** open (the lids, 0 shut), locked (a lock-on on it: it burns), crack (0..1: how hurt it is). Eased, never stepped. */
  set({ open, locked, crack } = {}) { if (open != null) this.to.open = open; if (locked != null) this.to.locked = locked; if (crack != null) this.to.crack = crack; }
  /** Broken: the lens bursts into shards and is gone. */
  shatter() { if (!this.broken) { this.broken = true; this.bt = 0; this.to.crack = 1; this.to.locked = 1; } }

  update(dt = 1 / 60) {
    this.t += dt;
    for (const k of ['open', 'locked', 'crack']) this.k[k] += (this.to[k] - this.k[k]) * (1 - Math.exp(-(k === 'open' ? 2.5 : 5) * dt));
    const U = this.mat.uniforms; U.uOpen.value = this.k.open; U.uBurn.value = this.k.locked; U.uCrack.value = this.k.crack;
    this.ring.userData.lit[0] = this.k.locked; this.ring.geometry.attributes.aLit.needsUpdate = true;
    if (this.bt >= 0) { // (the burst: the lens swells a hair and is gone in a fifth of a second; the shards fly and shrink over a second)
      this.bt += dt; const b = this.bt;
      this.lens.visible = b < 0.2; this.lens.scale.setScalar(this.lens.scale.x * (b < 0.2 ? 1 + dt * 0.8 : 1));
      this.ring.visible = b < 0.35; this.shards.count = b < 1.2 ? 14 : 0;
      const s = Math.max(0, 1 - b / 1.2);
      for (let i = 0; i < 14; i++) this.shards.setMatrixAt(i, _mb.compose(_x.copy(this.sv[i]).multiplyScalar(b * (1 - b * 0.3)), _qs.setFromAxisAngle(_z.copy(this.sv[i]).normalize(), b * 6 + i), _ss.set(s, s, s)));
      this.shards.instanceMatrix.needsUpdate = true; this.shards.userData.lit.fill(1); this.shards.geometry.attributes.aLit.needsUpdate = true;
    }
  }

  dispose() { this.group.parent?.remove(this.group); this.group.traverse((o) => o.geometry?.dispose()); for (const m of [this.mat, this.ringMat, this.shardMat]) m.dispose(); }
}
