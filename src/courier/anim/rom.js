// ---------------------------------------------------------------------------------------
// RANGE OF MOTION. A final pass that keeps every limited joint inside what a body can do, whatever
// put it there (a clip, IK, a procedural layer, a tech's pose): a finger does not bend backwards,
// a knee does not hyperextend, a wrist does not fold over the forearm.
//
// Prior art, and what was taken from it:
//  - Swing-twist decomposition (Dobrowolski, "Swing-twist decomposition in Clifford algebra";
//    Unity Final IK's RotationLimit, Unreal Control Rig's constraint nodes, Blender's IK limits,
//    the three.js `CCDIKSolver` `rotationMin/Max`): split a joint's rotation from rest into a twist
//    about a hinge axis and the swing left over, clamp the twist to [min, max], cap the swing to a
//    cone. That is what is done here, per bone, in the bone's own local frame.
//  - The rig (Rigify-style, as exported from Blender) keeps its hinge axis on the bone's local X
//    for the elbow, wrist and every finger joint, so one table serves both hands and the Courier.
//
// Use:
//   const rom = new JointLimits();
//   rom.add(bone, restQuaternion, { hinge: [1, 0, 0], min: 0, max: 2.6, cone: 0.3 });
//   rom.addRig(bones, restOf, RIGIFY);       // every bone the table names, both sides
//   const hand = godhandLimits(bones, restOf);   // a rig's own table by full bone names (rigLimits: GODHAND_ROM, PNEUKA_JAR_ROM)
//   rom.apply();                             // after posing, before drawing
// `rom.clamped` counts how many joints had to be pulled back in the last apply (for the stress test).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LEARNED } from './romdata.js';

const _d = new THREE.Quaternion(), _t = new THREE.Quaternion(), _s = new THREE.Quaternion(), _h = new THREE.Vector3(), _v = new THREE.Vector3();
const ID = new THREE.Quaternion();

export class JointLimits {
  constructor() { this.list = []; this.clamped = 0; this.enabled = true; }

  /** hinge: local axis, flexion is positive rotation about it. min / max in radians; cone caps everything that is not flexion. */
  add(bone, rest, { hinge = [1, 0, 0], min = 0, max = 2, cone = 0.3 } = {}) {
    if (!bone) return;
    this.list.push({ bone, rest: rest.clone(), hinge: new THREE.Vector3(...hinge).normalize(), min, max, cone });
  }

  /** Every joint in a spec ({ name: {hinge, min, max, cone} }, `name` is the bone name without its side), on both sides. */
  addRig(bones, restOf, spec, sides = ['L', 'R']) {
    for (const [name, lim] of Object.entries(spec)) {
      for (const side of sides) {
        const b = bones[name.replace('*', side)] || bones[`${name}${side}`];
        if (b) this.add(b, restOf(b), lim);
      }
    }
  }

  apply() {
    this.clamped = 0;
    if (!this.enabled) return;
    for (const j of this.list) if (this.limit(j)) this.clamped++;
  }

  limit(j) {
    const q = j.bone.quaternion;
    _d.copy(j.rest).invert().multiply(q);
    if (_d.w < 0) { _d.x = -_d.x; _d.y = -_d.y; _d.z = -_d.z; _d.w = -_d.w; }
    const h = j.hinge;
    // twist: the part of the rotation about the hinge
    const p = _d.x * h.x + _d.y * h.y + _d.z * h.z;
    _t.set(h.x * p, h.y * p, h.z * p, _d.w);
    const tl = Math.hypot(_t.x, _t.y, _t.z, _t.w);
    if (tl < 1e-9) _t.copy(ID); else _t.set(_t.x / tl, _t.y / tl, _t.z / tl, _t.w / tl);
    let ang = 2 * Math.atan2(_t.x * h.x + _t.y * h.y + _t.z * h.z, _t.w);
    // swing: what is left
    _s.copy(_d).multiply(_t.clone().invert());
    if (_s.w < 0) { _s.x = -_s.x; _s.y = -_s.y; _s.z = -_s.z; _s.w = -_s.w; }
    const sa = 2 * Math.atan2(Math.hypot(_s.x, _s.y, _s.z), _s.w);
    let hit = false;
    const a2 = Math.min(j.max, Math.max(j.min, ang));
    if (a2 !== ang) { hit = true; ang = a2; }
    if (sa > j.cone) {
      hit = true;
      const sl = Math.hypot(_s.x, _s.y, _s.z);
      _v.set(_s.x / sl, _s.y / sl, _s.z / sl);
      _s.setFromAxisAngle(_v, j.cone);
    }
    if (!hit) return false;
    _t.setFromAxisAngle(h, ang);
    q.copy(j.rest).multiply(_s).multiply(_t);
    return true;
  }
}

// The Courier's rig: flexion limits in radians. `*` stands for the side letter.
// Finger flexion is positive about each bone's own hinge (learned from the game's clips: romdata.js; the god hand has its own table,
// GODHAND_ROM below); the thumb bends about its own axis. Only fingers are here: see the note below.
export const RIGIFY = {
  // (No entries for the forearm, shin or hand. They were here, and clamped what IK and the authored clips legitimately do:
  // the hinge measured for them is not the axis a solved limb bends about, so the clamp bent knees outward on jumps and slides
  // and broke the ladder. Knees and elbows are held by explicit per-state poles instead: see poles.js.)
  'f_index01*': { hinge: [1, 0, 0], min: -0.35, max: 1.6, cone: 0.45 },
  'f_index02*': { hinge: [1, 0, 0], min: -0.05, max: 2.0, cone: 0.25 },
  'f_index03*': { hinge: [1, 0, 0], min: -0.05, max: 1.55, cone: 0.25 },
  'f_middle01*': { hinge: [1, 0, 0], min: -0.35, max: 1.6, cone: 0.4 },
  'f_middle02*': { hinge: [1, 0, 0], min: -0.05, max: 2.0, cone: 0.25 },
  'f_middle03*': { hinge: [1, 0, 0], min: -0.05, max: 1.55, cone: 0.25 },
  'f_ring01*': { hinge: [1, 0, 0], min: -0.35, max: 1.6, cone: 0.4 },
  'f_ring02*': { hinge: [1, 0, 0], min: -0.05, max: 2.0, cone: 0.25 },
  'f_ring03*': { hinge: [1, 0, 0], min: -0.05, max: 1.55, cone: 0.25 },
  'f_pinky01*': { hinge: [1, 0, 0], min: -0.35, max: 1.6, cone: 0.5 },
  'f_pinky02*': { hinge: [1, 0, 0], min: -0.05, max: 2.0, cone: 0.25 },
  'f_pinky03*': { hinge: [1, 0, 0], min: -0.05, max: 1.55, cone: 0.25 },
  'thumb01*': { hinge: [0.22, -0.18, -0.96], min: -0.35, max: 1.1, cone: 0.8 },
  'thumb02*': { hinge: [0.22, -0.18, -0.96], min: -0.1, max: 1.2, cone: 0.35 },
  'thumb03*': { hinge: [0.22, -0.18, -0.96], min: -0.15, max: 1.7, cone: 0.3 },
};

// The clapperjar's (clappers.js): generous, a ball of clay with a lid and two stubs, but the lid does not fold back into the body and
// the arms do not turn inside out, whatever the idle acts and the clip ask (the bone frames are Blender's: the lid hinges about X).
export const CLAPPER_ROM = {
  head: { hinge: [1, 0, 0], min: -1.25, max: 0.35, cone: 1.45 },
  upper_armL: { hinge: [0, 0, 1], min: -2.5, max: 2.5, cone: 1.4 },
  upper_armR: { hinge: [0, 0, 1], min: -2.5, max: 2.5, cone: 1.4 },
  forearmL: { hinge: [0, 0, 1], min: -1.6, max: 1.6, cone: 0.9 },
  forearmR: { hinge: [0, 0, 1], min: -1.6, max: 1.6, cone: 0.9 },
};

// The god hand's (godhand/godhandclips.js): its own rig (18 bones, the fingers hang off `handR`, the pinky off `palmR`), so its own
// table, learned from its 32 clips by scripts/learn_rom.mjs's method (per joint: the axis it mostly turns about, the range turned, the
// swing off it; each widened by 0.05 rad). Every frame of every clip passes unclamped (0 of 1,506); a pose pushed past them is pulled
// back. The middle and tip joints are pure hinges (cone 0.05); the thumb's base swings most.
export const GODHAND_ROM = {
  f_index01R: { hinge: [-0.177, 0.115, 0.977], min: -0.36, max: 1.71, cone: 0.45 },
  f_index02R: { hinge: [-0.014, 0.062, 0.998], min: -0.14, max: 1.97, cone: 0.05 },
  f_index03R: { hinge: [0.475, 0.047, 0.879], min: -0.22, max: 1.53, cone: 0.05 },
  f_middle01R: { hinge: [-0.21, 0, 0.978], min: -0.36, max: 1.71, cone: 0.26 },
  f_middle02R: { hinge: [0.037, -0.041, 0.998], min: -0.14, max: 1.97, cone: 0.05 },
  f_middle03R: { hinge: [0.247, -0.012, 0.969], min: -0.22, max: 1.53, cone: 0.05 },
  f_ring01R: { hinge: [-0.08, -0.099, 0.992], min: -0.36, max: 1.71, cone: 0.3 },
  f_ring02R: { hinge: [0.137, -0.009, 0.991], min: -0.14, max: 1.97, cone: 0.05 },
  f_ring03R: { hinge: [0.514, 0.044, 0.857], min: -0.22, max: 1.53, cone: 0.05 },
  f_pinky01R: { hinge: [0.079, -0.205, 0.976], min: -0.39, max: 1.7, cone: 0.56 },
  f_pinky02R: { hinge: [0.224, -0.11, 0.968], min: -0.14, max: 1.97, cone: 0.05 },
  f_pinky03R: { hinge: [0.911, 0.029, 0.411], min: -0.22, max: 1.53, cone: 0.05 },
  thumb01R: { hinge: [-0.807, 0.011, 0.59], min: -0.2, max: 0.75, cone: 0.65 },
  thumb02R: { hinge: [-0.523, -0.085, 0.848], min: -0.22, max: 0.75, cone: 0.05 },
  thumb03R: { hinge: [-0.581, -0.095, 0.809], min: -0.29, max: 0.84, cone: 0.05 },
};

// The Pneuka Jar's (godhand/pneukajarclips.js): five bones in a chain, root > base > belly > chest > lid, every rest rotation the
// identity, each hinged about X (the lid's hinge is at its back: it opens negative). Measured over its 17 clips (jar.md): the lid from
// -1.309 (spit) to +0.140 (summon), the chest -0.244 to +0.454 with a swing of 0.698 (dismiss), the belly -0.140 to +0.244; each widened.
// The lid never folds back into the chest, the chest never turns over. `root` and `base` only move and scale.
export const PNEUKA_JAR_ROM = {
  lid: { hinge: [1, 0, 0], min: -1.4, max: 0.25, cone: 0.15 },
  chest: { hinge: [1, 0, 0], min: -0.35, max: 0.6, cone: 0.8 },
  belly: { hinge: [1, 0, 0], min: -0.25, max: 0.35, cone: 0.3 },
};

/** A rig's limits from a table keyed by its bones' full names (GODHAND_ROM, PNEUKA_JAR_ROM): `restOf(bone)` its rest quaternion. */
export function rigLimits(bones, restOf, spec) {
  const rom = new JointLimits();
  for (const [name, lim] of Object.entries(spec)) if (bones[name]) rom.add(bones[name], restOf(bones[name]), lim);
  return rom;
}
export const godhandLimits = (bones, restOf) => rigLimits(bones, restOf, GODHAND_ROM);
export const pneukaJarLimits = (bones, restOf) => rigLimits(bones, restOf, PNEUKA_JAR_ROM);

/**
 * The Courier's limits: the human envelope above (RIGIFY), with each finger and thumb joint's real hinge and
 * observed range taken from the game's own clips (romdata.js, from scripts/learn_rom.mjs) where it is narrower.
 */
export function courierLimits(bones, restOf) {
  const rom = new JointLimits();
  for (const [key, spec] of Object.entries(RIGIFY)) {
    for (const side of ['L', 'R']) {
      const name = key.replace('*', side), bone = bones[name];
      if (!bone) continue;
      const l = LEARNED[name];
      if (!l) { rom.add(bone, restOf(bone), spec); continue; }
      rom.add(bone, restOf(bone), {
        hinge: l.hinge,
        min: Math.max(spec.min, l.min),
        max: Math.max(Math.max(spec.min, l.min) + 0.4, Math.min(spec.max, l.max)),
        cone: Math.max(0.25, Math.min(spec.cone, l.cone)),
      });
    }
  }
  return rom;
}
