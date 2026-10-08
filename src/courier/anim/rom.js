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

// The Courier's rig (and the god hand's): flexion limits in radians. `*` stands for the side letter.
// Finger flexion is positive about each bone's own hinge (learned from the game's clips: romdata.js; the god hand reads its own
// off its rest pose); the thumb bends about its own axis. Only fingers are here: see the note below.
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

// The Solar Skiff's (courier/skiff/boat.js): the joints its code poses over its clips (the boom to leeward, the pennant to the wind and its
// ripple) and the doors the mast rises through. Learned from its own clips (solarskiff.glb: the twist about each hinge and the swing left
// over, over every frame of the 15) and widened to what the code asks: the boom swings 1.3 rad either way, the pennant turns right round
// its masthead and each link ripples 0.6 rad and droops 0.12; the recall folds the boom 1.57 and the pennant links 1.19, the summon swings
// the doors 1.83 open (the bone frames are Blender's: the boom and the pennant turn about their local Z, the boat's up).
export const SKIFF_ROM = {
  boom: { hinge: [0, 0, 1], min: -1.65, max: 1.45, cone: 1.65 },
  pennant_root: { hinge: [0, 0, 1], min: -Math.PI, max: Math.PI, cone: 0.1 },
  pennant_1: { hinge: [0, 0, 1], min: -0.7, max: 1.3, cone: 0.25 },
  pennant_2: { hinge: [0, 0, 1], min: -0.7, max: 1.3, cone: 0.25 },
  pennant_3: { hinge: [0, 0, 1], min: -0.7, max: 1.3, cone: 0.25 },
  pennant_4: { hinge: [0, 0, 1], min: -0.7, max: 1.3, cone: 0.25 },
  pennant_5: { hinge: [0, 0, 1], min: -0.7, max: 1.3, cone: 0.25 },
  doorL: { hinge: [0, -1, 0], min: -0.7, max: 1.95, cone: 0.1 },
  doorR: { hinge: [0, 1, 0], min: -0.7, max: 1.95, cone: 0.1 },
};

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
