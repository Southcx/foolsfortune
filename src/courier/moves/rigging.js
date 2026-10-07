// ---------------------------------------------------------------------------
// The rigging: things to hold on to and things to walk on that the level is strung with.
//
//   bars     overhead pipes and cables (hang from them: Hang; a slanted cable is a zipline)
//   poles    upright poles and ropes (climb, slide, spin round: Pole); ropes sway with your weight
//   grates   thin openwork panels on walls and ceilings, solid to the physics (climb them in
//            any direction, walls and overhangs both: Grate)
//   beams    balance beams: narrow, and walked (Balance)
//
// Everything is registered here so the techs can ask "is there something to grab within
// reach of this point"; the level builds the geometry through these calls.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { PALETTE } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';


const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class Rigging {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.bars = [];
    this.poles = [];
    this.grates = new Set(); // collider handles of grate panels
    this.grateList = [];
    this.beams = new Map(); // collider handle -> beam
    this.mats = new Map();
    this.time = 0;
  }

  mat(color) {
    if (!this.mats.has(color)) this.mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1, flatShading: true }));
    return this.mats.get(color);
  }

  // ---- bars and cables ----
  /** An overhead bar from a to b (any two points; a slanted one with `zip` is a zipline: ride it down from a to b). */
  addBar(a, b, { r = 0.055, zip = false, color = zip ? PALETTE.pale : PALETTE.wood } = {}) {
    a = new THREE.Vector3(...a); b = new THREE.Vector3(...b);
    const len = a.distanceTo(b), dir = b.clone().sub(a).normalize();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(zip ? 0.02 : r, zip ? 0.02 : r, len, 8), this.mat(color));
    m.position.copy(a).addScaledVector(dir, len / 2);
    m.quaternion.setFromUnitVectors(UP, dir);
    m.castShadow = true;
    if (!zip) addOutline(m);
    this.scene.add(m);
    const bar = { a, b, len, dir, zip, mesh: m };
    this.bars.push(bar);
    return bar;
  }

  /** The bar within reach of a hand at p: { bar, along, s } (s = distance along it) or null. */
  barNear(p, reach = 0.45) {
    let best = null, bd = 1e9;
    for (const bar of this.bars) {
      const s = THREE.MathUtils.clamp(_a.subVectors(p, bar.a).dot(bar.dir), 0, bar.len);
      _b.copy(bar.a).addScaledVector(bar.dir, s);
      const dy = p.y - _b.y, h = Math.hypot(p.x - _b.x, p.z - _b.z);
      if (h > reach || dy < -0.6 || dy > 0.25) continue;
      const d = h + Math.abs(dy);
      if (d < bd) { bd = d; best = { bar, along: bar.dir.clone(), s }; }
    }
    return best;
  }

  // ---- poles and ropes ----
  /** A pole from y0 (bottom) to y1 (top) at (x, z); a rope hangs from y1 and sways. */
  addPole({ x, z, y0, y1, r = 0.08, rope = false, color = rope ? PALETTE.cream : PALETTE.wood }) {
    const h = y1 - y0;
    const g = new THREE.Group();
    g.position.set(x, y1, z);
    const rr = rope ? 0.045 : r;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, h, rope ? 6 : 10), this.mat(color));
    m.position.y = -h / 2;
    m.castShadow = true;
    addOutline(m);
    g.add(m);
    if (rope) {
      for (let y = 0.5; y < h - 0.3; y += 0.55) {
        const k = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 5), this.mat(PALETTE.dark));
        k.position.y = -y;
        g.add(k);
      }
    }
    this.scene.add(g);
    const pole = { x, z, y0, y1, r: rr, rope, group: g, th: new THREE.Vector2(), thv: new THREE.Vector2(), load: 0 };
    this.poles.push(pole);
    return pole;
  }

  /** Where a pole's axis is at height y (a rope has swung off its hanging line). */
  axisAt(pole, y, out = new THREE.Vector3()) {
    const d = pole.y1 - y;
    return out.set(pole.x + pole.th.x * d, y, pole.z + pole.th.y * d);
  }

  /** A pole within a chest-high reach of p (feet), or null. */
  poleNear(p, reach = 0.5) {
    let best = null, bd = 1e9;
    for (const pole of this.poles) {
      const chest = p.y + 1.3;
      if (chest < pole.y0 - 0.2 || chest > pole.y1 + 0.1) continue;
      this.axisAt(pole, chest, _a);
      const h = Math.hypot(p.x - _a.x, p.z - _a.z) - pole.r;
      if (h > reach) continue;
      if (h < bd) { bd = h; best = pole; }
    }
    return best;
  }

  /** Push a rope (a kick off it, someone's weight): sway along `dir` (horizontal). */
  pushRope(pole, dir, amount) {
    if (!pole.rope) return;
    pole.thv.x += dir.x * amount; pole.thv.y += dir.z * amount;
  }

  update(dt) {
    this.time += dt;
    for (const p of this.poles) {
      if (!p.rope) continue;
      // a damped pendulum per axis (a longer rope swings slower)
      const w2 = 9.81 / Math.max(2, p.y1 - p.y0) * 0.9;
      for (const k of ['x', 'y']) {
        p.thv[k] += (-w2 * p.th[k] - 0.55 * p.thv[k]) * dt;
        p.th[k] += p.thv[k] * dt;
      }
      p.th.clampLength(0, 0.6);
      p.group.rotation.set(-p.th.y, 0, p.th.x); // (the bottom of the rope swings toward +x with z-rotation, +z with -x-rotation)
    }
  }

  // ---- grates ----
  /**
   * A grate panel: centre c, outward normal n (a wall's horizontal one, or (0,-1,0) for an
   * overhang), w x h in its plane. Solid to the physics (a thin slab), openwork to the eye.
   */
  addGrate(L, { c, n, w, h, thick = 0.14, color = PALETTE.mid, cell = 0.36 }) {
    n = new THREE.Vector3(...n).normalize();
    let u, v;
    if (Math.abs(n.y) > 0.9) { u = new THREE.Vector3(1, 0, 0); v = new THREE.Vector3().crossVectors(n, u).normalize(); }
    else { v = new THREE.Vector3(0, 1, 0); u = new THREE.Vector3().crossVectors(v, n).normalize(); }
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, n));
    const centre = new THREE.Vector3(...c);
    const cd = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, thick / 2).setTranslation(centre.x, centre.y, centre.z).setRotation(q)
      .setCollisionGroups(GROUPS.static).setFriction(0.9);
    const col = this.physics.world.createCollider(cd, L.fixedBody);
    this.grates.add(col.handle);
    // the openwork: a frame and a lattice of thin bars
    const part = (ox, oy, sx, sy, sz = 0.07) => {
      const g = new THREE.BoxGeometry(sx, sy, sz);
      g.applyMatrix4(new THREE.Matrix4().compose(centre.clone().addScaledVector(u, ox).addScaledVector(v, oy), q, new THREE.Vector3(1, 1, 1)));
      L.addGeo(g, color, true, false);
    };
    const f = 0.11;
    part(0, h / 2 - f / 2, w, f, 0.1); part(0, -h / 2 + f / 2, w, f, 0.1);
    part(-w / 2 + f / 2, 0, f, h, 0.1); part(w / 2 - f / 2, 0, f, h, 0.1);
    for (let x = -w / 2 + cell; x < w / 2 - f; x += cell) part(x, 0, 0.05, h - f, 0.06);
    for (let y = -h / 2 + cell; y < h / 2 - f; y += cell) part(0, y, w - f, 0.05, 0.06);
    const grate = { c: centre, n, u, v, w, h, col };
    this.grateList.push(grate);
    return grate;
  }

  isGrate(collider) { return this.grates.has(collider.handle); }

  // ---- balance beams ----
  /** A horizontal beam from a to b (same height), `width` wide. */
  addBeam(L, a, b, { width = 0.3, thick = 0.16, color = PALETTE.wood } = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B), dir = B.clone().sub(A).setY(0).normalize();
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const top = A.y;
    const col = L.box([mid.x, top - thick / 2, mid.z], [width, thick, len], color, { rotY: Math.atan2(dir.x, dir.z) });
    const beam = { a: A, b: B, len, dir, width, top, col };
    this.beams.set(col.handle, beam);
    return beam;
  }
}
