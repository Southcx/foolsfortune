// ---------------------------------------------------------------------------------------
// POT ROPES: what a hanging lantern or pot hangs on. A rope is a chain of small bodies on reduced-coordinate (multibody) joints, which
// stay perfectly stiff at any mass ratio, so there is no stretchy jitter; its links are contact-free sensors on a layer of their own
// (raycasts still hit them, so a rope can be shot; contacts on multibody links make NaNs in Rapier). Cut it and everything under it
// falls; it is kicked when the pot it carries is shot away, and its severed links are tidied up at the floor by Breakables.update.
// Every link of every rope is drawn in one draw (`ropeGeo` and `ropeMat`, the InstancePool Breakables.ropeDraw: render/propbatch.js).
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
// Prior art: reduced-coordinate articulated bodies (Featherstone's), which Rapier's multibody joints are.
//
//   POT_ROPES: buildRope(ent, anchorPos, topY)   cutRope(rope, index, point, dir)   kickRope(rope, dir, power)   removeRope(rope)
//   ropeGeo   ropeMat
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, groups } from '../../core/physics.js';
import { T, PALETTE } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';

export const ropeMat = new THREE.MeshStandardMaterial({ color: PALETTE.deep, roughness: 1 });
export const ropeGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 5, 1);

// rope links are contact-free sensors on their own layer
const ROPE_GROUPS = groups(16, 0);
const ROPE_SEGMENTS = 8;

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export const POT_ROPES = {
  // ---- ropes: a chain of small bodies on reduced-coordinate (multibody) joints,
  // which stay perfectly stiff at any mass ratio, so no stretchy jitter.
  buildRope(ent, anchorPos, topY) {
    const w = this.physics.world;
    const a = new THREE.Vector3(...anchorPos);
    const potTop = new THREE.Vector3(...ent.def.pos).add(new THREE.Vector3(0, topY, 0));
    const len = a.y - potTop.y;
    const segLen = len / ROPE_SEGMENTS;
    const anchor = w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(a.x, a.y, a.z));
    const rope = { ent, anchor, segs: [], joints: [], segLen, cut: false };
    let prev = anchor, prevAnchor = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < ROPE_SEGMENTS; i++) {
      const y = a.y - segLen * (i + 0.5);
      const body = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(a.x, y, a.z)
        .setLinearDamping(0.12).setAngularDamping(0.6).setCanSleep(true));
      // Sensor links: raycasts still hit them (so you can shoot the rope) but they
      // make no contacts; contacts on multibody links produce NaNs in Rapier.
      const col = w.createCollider(RAPIER.ColliderDesc.capsule(segLen * 0.4, 0.05).setSensor(true).setDensity(0)
        .setCollisionGroups(ROPE_GROUPS), body);
      body.setAdditionalMassProperties(0.12, { x: 0, y: 0, z: 0 }, { x: 0.002, y: 0.0004, z: 0.002 }, { x: 0, y: 0, z: 0, w: 1 }, true);
      const j = w.createMultibodyJoint(RAPIER.JointData.spherical(prevAnchor, { x: 0, y: segLen / 2, z: 0 }), prev, body, true);
      const mesh = new THREE.Mesh(ropeGeo, ropeMat);
      mesh.scale.set(1, segLen * 1.05, 1);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.ropeDraw.add(mesh);
      this.physics.markLink(body);
      const seg = { body, col, mesh, index: i };
      seg.sync = this.physics.addSynced(body, mesh);
      this.physics.register(col, { type: 'rope', rope, index: i });
      rope.segs.push(seg);
      rope.joints.push(j);
      prev = body;
      prevAnchor = { x: 0, y: -segLen / 2, z: 0 };
    }
    rope.joints.push(w.createMultibodyJoint(RAPIER.JointData.spherical(prevAnchor, { x: 0, y: topY, z: 0 }), prev, ent.body, true));
    this.physics.markLink(ent.body);
    ent.rope = rope;
    this.ropes.add(rope);
  },

  /** Cut the rope just below segment `index`; everything under it falls. */
  cutRope(rope, index, point, dir) {
    const j = rope.joints[index + 1];
    if (!j) return;
    try { this.physics.world.removeMultibodyJoint(j, true); } catch { /* already gone with the pot */ }
    rope.joints[index + 1] = null;
    rope.cut = true;
    const seg = rope.segs[index];
    if (!seg.gone) this.physics.kick(seg.body, _v.copy(dir).multiplyScalar(0.3));
    this.fx.impact(point, _v2.copy(dir).negate(), { color: PALETTE.pale, sparks: 3, dust: 2 });
    sfx.ropeSnap(this.game.listenerDistance(point));
    if (rope.ent.alive) rope.ent.body.wakeUp();
  },

  kickRope(rope, dir, power = 1) {
    const n = rope.segs.length;
    rope.segs.forEach((seg, i) => {
      if (seg.gone) return;
      const k = T.shatter.ropeKick * power * ((i + 1) / n) ** 1.5;
      this.physics.kick(seg.body, { x: dir.x * k, y: dir.y * k + k * 0.35, z: dir.z * k });
    });
  },

  removeRope(rope) {
    for (const s of rope.segs) {
      if (s.gone) continue;
      this.physics.removeSynced(s.sync);
      this.physics.removeBody(s.body);
      this.scene.remove(s.mesh);
    }
    this.physics.world.removeRigidBody(rope.anchor);
    this.ropes.delete(rope);
  },
};
