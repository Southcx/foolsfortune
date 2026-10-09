// ---------------------------------------------------------------------------------------
// THE RAGDOLL: the Courier's body let go to the physics for a moment, the in-between of a fall that has no clip (the owner's R8, v133:
// a bail off the Solar Skiff thrown into the sand, then the get-up). Eleven capsules on the rig's main bones (the hips, the chest, the
// head, each upper arm, forearm, thigh and shin), joined where the bones are (spherical joints), built from the pose of the frame it
// begins and thrown with the body's speed. Each frame it is written back onto the bones (`apply`, by a weight: 1 is all ragdoll, 0 the
// clip), the hips placed where the hip capsule lies; the rig's range of motion still has the last word (courier/anim/rom.js, CLAUDE.md:
// the knees never bend backward because the physics did). Its capsules touch the world only (the `swirl` group: the static and the
// props, never each other, never the Courier's controller), and a floor function keeps them on ground that has no collider.
//
// Prior art: the physics ragdoll of every death since Jurassic Park: Trespasser and Hitman: Codename 47 (Thomas Jakobsen's 2001 paper);
// the blend from ragdoll back to an animated get-up of Euphoria and of Uncharted's falls ("ragdoll to animation" by a pose fade); the
// capsule-per-bone layout of Unity's Ragdoll Wizard and Unreal's physics assets.
//
//   const R = new Ragdoll(game)   R.start(character, vel, { floor })   R.apply(character, w)   R.settled -> bool   R.hips -> Vector3   R.stop()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';

// [bone, the bone its capsule reaches toward (or a length along the bone), radius, its parent part's bone]
const PARTS = [
  ['spine', 'spine002', 0.12, null],
  ['spine002', 'spine005', 0.13, 'spine'],
  ['head', 0.22, 0.1, 'spine002'],
  ['upper_armL', 'forearmL', 0.05, 'spine002'], ['forearmL', 'handL', 0.045, 'upper_armL'],
  ['upper_armR', 'forearmR', 0.05, 'spine002'], ['forearmR', 'handR', 0.045, 'upper_armR'],
  ['thighL', 'shinL', 0.07, 'spine'], ['shinL', 'footL', 0.055, 'thighL'],
  ['thighR', 'shinR', 0.07, 'spine'], ['shinR', 'footR', 0.055, 'thighR'],
];
const _p = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _lq = new THREE.Quaternion();

export class Ragdoll {
  constructor(game) { this.game = game; this.parts = []; this.joints = []; this.active = false; this.t = 0; this.floor = null; }

  /** Let the body go: capsules where the bones are now, thrown at `vel` (m/s, a Vector3). `floor(x, z)` -> the ground's height, or null. */
  start(ch, vel, { floor = null, spin = 2 } = {}) {
    this.stop();
    const W = this.game.physics.world, B = ch.bones, by = {};
    ch.root.updateMatrixWorld(true);
    for (const [name, to, r, parent] of PARTS) {
      const b = B[name]; if (!b) continue;
      b.getWorldPosition(_p); b.getWorldQuaternion(_q);
      const len = typeof to === 'number' ? to : B[to] ? B[to].getWorldPosition(_c).distanceTo(_p) : 0.2;
      const body = W.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(_p.x, _p.y, _p.z).setRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w })
        .setLinvel(vel.x, vel.y, vel.z).setAngvel({ x: (Math.sin(this.parts.length * 1.7)) * spin, y: 0, z: Math.cos(this.parts.length * 2.3) * spin })
        .setLinearDamping(0.3).setAngularDamping(2.2).setCcdEnabled(true));
      // (the capsule lies along the bone: a rig's bones point along their own +y, Blender's convention)
      W.createCollider(RAPIER.ColliderDesc.capsule(Math.max(0.01, len / 2 - r), r).setTranslation(0, len / 2, 0).setDensity(900).setFriction(0.9).setCollisionGroups(GROUPS.swirl), body);
      const part = { name, bone: b, body, r, len, parent: parent ? by[parent] : null };
      by[name] = part; this.parts.push(part);
      if (part.parent) { // (joined at this bone's head: in the parent's frame where it is now, at the child's own origin)
        const pb = part.parent.body, pt = pb.translation(), pr = pb.rotation();
        _c.set(_p.x - pt.x, _p.y - pt.y, _p.z - pt.z).applyQuaternion(_pq.set(pr.x, pr.y, pr.z, pr.w).invert());
        this.joints.push(W.createImpulseJoint(RAPIER.JointData.spherical({ x: _c.x, y: _c.y, z: _c.z }, { x: 0, y: 0, z: 0 }), pb, body, true));
      }
    }
    this.floor = floor; this.active = this.parts.length > 0; this.t = 0;
    return this.active;
  }

  /** Once a fixed step: nothing sinks under ground that has no collider. */
  step(dt) {
    if (!this.active) return;
    this.t += dt;
    if (!this.floor) return;
    for (const p of this.parts) {
      const t = p.body.translation(), gy = this.floor(t.x, t.z);
      if (gy == null || t.y > gy + p.r) continue;
      p.body.setTranslation({ x: t.x, y: gy + p.r, z: t.z }, true);
      const v = p.body.linvel(); if (v.y < 0) p.body.setLinvel({ x: v.x * 0.6, y: 0, z: v.z * 0.6 }, true);
    }
  }

  /** Onto the bones, by `w` (1 the ragdoll's pose, 0 what the clip posed), parents first; the hips placed where they lie. */
  apply(ch, w = 1) {
    if (!this.active || w <= 0) return;
    for (const p of this.parts) {
      const b = p.bone, r = p.body.rotation();
      b.parent.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(_pq);
      _lq.copy(_pq).invert().multiply(_q.set(r.x, r.y, r.z, r.w));
      b.quaternion.slerp(_lq, w);
      if (!p.parent) { const t = p.body.translation(); _c.set(t.x, t.y, t.z); b.parent.worldToLocal(_c); b.position.lerp(_c, w); }
      b.updateMatrixWorld(true);
    }
  }

  /** Where the hips lie (world). */
  get hips() { const t = this.parts[0]?.body.translation(); return t ? new THREE.Vector3(t.x, t.y, t.z) : null; }
  /** At rest: every capsule all but still. */
  get settled() { return this.active && this.parts.every((p) => { const v = p.body.linvel(); return v.x * v.x + v.y * v.y + v.z * v.z < 0.25; }); }

  /** Its bodies and joints taken out of the world. */
  stop() {
    const W = this.game.physics?.world;
    if (W) { for (const j of this.joints) W.removeImpulseJoint(j, true); for (const p of this.parts) W.removeRigidBody(p.body); }
    this.parts = []; this.joints = []; this.active = false;
  }
}
