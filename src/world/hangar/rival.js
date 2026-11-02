// ---------------------------------------------------------------------------------------
// A RIVAL FRAME'S BODY, A PLACEHOLDER (docs/plans/MECHS.md 9.4, 9.3; Calissa dresses it: three frames with their tells drawn on their
// bodies): the frame a bout in the ring is boxed against, in boxes, one colour scheme a rival (the sparring frame a dull green-grey,
// the heavy frame dark red, the champion frame black and gold). It is posed, never simulated: the ring's runtime (ringbout.js) reads
// the bout (progress/mechs/ring.js) and says what it does each frame:
//   its idle guard (the bout's `guard`: 'low' the fists over the body, 'both' a full cover, a boxer's bounce under it);
//   its tells as the kernel's `ring.tell { move, tell }` says, over the move's windup (`u` 0..1): shoulder (a twitch of that shoulder),
//     cock (the arm drawn back), crouch (dropping low), hops (three hops back), blink (its eye glowing white and blinking), beckon (arms
//     wide, a beckoning wave);
//   the strike lunging forward (`lunge` 0..1, the move's own arm), open (slumped, guard down), a flinch where a punch landed, down (on
//     its back on the mat, `down` 0..1, rising as it eases back);
//   its joints (joints.js): an arm or forearm hidden past a snapped joint; the neck snapped, the head pops up on its coil and bobs
//     (Rock 'Em Sock 'Em's knockout).
//
// Prior art: Punch-Out!! (every move shown first on the body: Glass Joe's beckon, Bald Bull's three hops, Mike Tyson's blink), Rock 'Em
// Sock 'Em Robots (the head popped up on its spring), Real Steel's boxers, the mech's own placeholder body (world/hangar/mech.js).
//
//   RIVAL_LOOK[id] = { body, plate, joint, trim, eye, scale }   STRIKE[move] = { sh, el, z }
//   const F = new RivalFrame(game)   F.build(rivalId, into)   F.group   F.id
//   F.pose({ pos, yaw, guard, move, tell, side, u, lunge, open, taunt, flinch, high, down, joints, popT, time })
//   F.partAt(joint, out) (a joint's world point)   F.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { past } from '../../progress/mechs/joints.js';

/** Each rival's colours (a placeholder scheme) and its size against the clay frame. */
export const RIVAL_LOOK = {
  sparring: { body: 0x7a8470, plate: 0x5a6252, joint: 0x34382f, trim: 0xa8b098, eye: 0xb8ffb0, scale: 1 },
  heavy: { body: 0x6a1e18, plate: 0x4a1410, joint: 0x2a0c0a, trim: 0x9a4a32, eye: 0xffb070, scale: 1.15 },
  champion: { body: 0x1c1a18, plate: 0x0c0c0c, joint: 0x2a2620, trim: 0xd9a441, eye: 0xffe8a0, scale: 1.05 },
};
/** The body's sizes (m), the clay frame's (mech.js MECH_BODY): the hip's height, the torso, the head's cube, an arm's width and its
 *  two lengths (upper arm and forearm), the fist, the coil's full stretch when the head pops. */
const BODY = { hip: 6, torso: { w: 6, h: 5, d: 4 }, head: 2.4, arm: 1.6, upper: 2.9, fore: 2.6, fist: 1.9, coil: 4.2 };
/** A strike's arm (radians): the shoulder's raise (negative forward), the elbow's bend, the swing across (z, toward the middle). */
export const STRIKE = {
  jab: { sh: -1.58, el: -0.05, z: 0.1 }, flurry: { sh: -1.55, el: -0.1, z: 0.12 },
  hook: { sh: -1.45, el: -0.9, z: 0.75 }, uppercut: { sh: -2.5, el: -1.1, z: 0.2 },
  charge: { sh: -1.6, el: -0.2, z: 0.05 }, dynamite: { sh: -2.6, el: -0.9, z: 0.25 },
};
const GUARD = { low: { sh: -0.55, el: -1.25, z: 0.3 }, both: { sh: -0.85, el: -2.0, z: 0.32 }, high: { sh: -0.85, el: -2.0, z: 0.32 } };
const LUNGE = { charge: 6, dynamite: 3.2, uppercut: 2.6 }; // (m forward at a strike's peak; 2 m otherwise)
const ARM_OF = { shoulderL: 'L', elbowL: 'L', shoulderR: 'R', elbowR: 'R' };

export class RivalFrame {
  constructor(game) { this.game = game; this.group = new THREE.Group(); this.group.name = 'ring.rival'; this.geos = []; this.mats = null; this.id = null; }

  box(w, h, d, mat, x, y, z, into) {
    const g = new THREE.BoxGeometry(w, h, d); this.geos.push(g);
    const m = new THREE.Mesh(g, this.mats[mat]); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; into.add(m); return m;
  }
  pivot(x, y, z, into) { const p = new THREE.Group(); p.position.set(x, y, z); into.add(p); return p; }

  /** The rival's body built (again, when the rival changes) into a parent group. */
  build(id, into) {
    if (into && this.group.parent !== into) into.add(this.group);
    if (this.id === id && this.root) return;
    this.clear(); this.id = id;
    const L = RIVAL_LOOK[id] || RIVAL_LOOK.sparring, B = BODY, T = B.torso;
    this.mats = Object.fromEntries(['body', 'plate', 'joint', 'trim', 'eye'].map((k) => [k, new THREE.MeshStandardMaterial({ color: L[k], roughness: 0.8, metalness: k === 'trim' ? 0.5 : 0.1, flatShading: true })]));
    this.mats.eye.emissive = new THREE.Color(L.eye); this.mats.eye.emissiveIntensity = 1.2; this.eyeColor = new THREE.Color(L.eye);
    this.mats.trim.emissive = new THREE.Color(L.trim); this.mats.trim.emissiveIntensity = id === 'champion' ? 0.3 : 0;
    this.mats.coil = new THREE.MeshStandardMaterial({ color: 0xc8c8c0, roughness: 0.4, metalness: 0.7 });
    const root = this.root = new THREE.Group(); root.scale.setScalar(L.scale); this.group.add(root);
    // the legs: two pivots at the hip, a thigh, a shin and a foot each
    this.legs = [];
    for (const s of [-1, 1]) {
      const p = this.pivot(s * 1.6, B.hip, 0, root);
      this.box(1.8, B.hip * 0.55, 2, 'plate', 0, -B.hip * 0.275, 0, p);
      this.box(1.55, B.hip * 0.5, 1.7, 'body', 0, -B.hip * 0.75, 0.15, p);
      this.box(2, 0.5, 2.8, 'joint', 0, -B.hip + 0.25, 0.3, p);
      this.legs.push(p);
    }
    // the torso on the hip: its box, the shoulder plate, a chest trim; the neck's pivot and the head on it; the arms at the shoulders
    const torso = this.torso = this.pivot(0, B.hip, 0, root);
    this.box(3.2, 1, 2.8, 'joint', 0, 0.2, 0, torso);
    this.box(T.w, T.h, T.d, 'body', 0, T.h / 2, 0, torso);
    this.box(T.w + 0.4, 1.2, T.d + 0.3, 'plate', 0, T.h - 0.6, 0, torso);
    this.box(2.4, 1.4, 0.3, 'trim', 0, T.h * 0.55, T.d / 2 + 0.1, torso);
    if (id === 'champion') { this.box(T.w + 0.5, 0.5, T.d + 0.4, 'trim', 0, 0.9, 0, torso); } // (the champion's belt, gold)
    const neck = this.neck = this.pivot(0, T.h, 0, torso);
    const head = this.head = this.pivot(0, 0, 0, neck);
    this.box(B.head, B.head, B.head, 'plate', 0, B.head / 2, 0, head);
    this.eye = this.box(1.6, 0.4, 0.2, 'eye', 0, B.head * 0.6, B.head / 2 + 0.05, head);
    if (id === 'heavy') this.box(B.head + 0.4, 0.5, B.head * 0.6, 'joint', 0, B.head + 0.2, 0, head); // (the heavy frame's brow)
    const cg = new THREE.CylinderGeometry(0.45, 0.45, 1, 10); this.geos.push(cg);
    this.coil = new THREE.Mesh(cg, this.mats.coil); this.coil.visible = false; neck.add(this.coil);
    this.arms = {};
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const sh = this.pivot(s * (T.w / 2 + B.arm / 2 + 0.1), T.h - 0.6, 0, torso);
      this.box(B.arm + 0.3, 1.2, B.arm + 0.3, 'plate', 0, 0, 0, sh); // (the pauldron)
      this.box(B.arm, B.upper, B.arm, 'body', 0, -B.upper / 2, 0, sh);
      const el = this.pivot(0, -B.upper, 0, sh);
      this.box(B.arm * 0.9, B.fore, B.arm * 0.9, 'plate', 0, -B.fore / 2, 0, el);
      this.box(B.fist, B.fist, B.fist, 'joint', 0, -B.fore - B.fist / 2 + 0.3, 0, el);
      if (id === 'champion') this.box(B.fist + 0.1, 0.35, B.fist + 0.1, 'trim', 0, -B.fore + 0.35, 0, el); // (gold cuffs)
      this.arms[side] = { sh, el, s };
    }
  }

  /** The frame posed from the bout (ringbout.js says each): where it stands and faces; its guard; the move it is making (`move`,
   *  `tell`, `side` its arm, `u` the windup's fill 0..1); a strike's lunge 0..1; open (slumped); taunting (the beckon held); a flinch
   *  0..1 (`high` the head's); down 0..1 (on its back); its joints; real s since its neck snapped (`popT`, null: whole); a clock. */
  pose({ pos, yaw = 0, guard = 'both', move = null, tell = null, side = 'R', u = 0, lunge = 0, open = 0, taunt = false, flinch = 0, high = false, down = 0, joints = null, popT = null, time = 0 }) {
    if (!this.root) return;
    const G = this.group, B = BODY, gd = GUARD[guard] || GUARD.both, bounce = Math.sin(time * 5.5);
    const blink = tell === 'blink' && u > 0;
    let fwd = 0, lift = 0, drop = 0, lean = open * 0.4, twist = 0, back = 0;
    const arm = { L: { ...gd }, R: { ...gd } };
    // the tells, over the windup
    if (move && u > 0) {
      const A = arm[side];
      if (tell === 'shoulder') { const tw = u < 0.6 ? Math.abs(Math.sin(u * Math.PI * 7)) : 0; this.arms[side].sh.position.y = B.torso.h - 0.6 + 0.55 * tw; twist = (side === 'L' ? 1 : -1) * 0.18 * u; A.sh += 0.35 * u; }
      else if (tell === 'cock') { A.sh = gd.sh + (0.95 - gd.sh) * u; A.el = -1.9; twist = (side === 'L' ? 1 : -1) * 0.35 * u; }
      else if (tell === 'crouch') { drop = 1.8 * u; lean = 0.25 * u; A.sh = -0.15; A.el = -1.4; }
      else if (tell === 'hops') { back = 4.5 * u; lift = 1.6 * Math.abs(Math.sin(u * Math.PI * 3)); }
      else if (tell === 'beckon') { for (const k of ['L', 'R']) { arm[k].sh = -0.5; arm[k].el = -1.3 + 0.55 * Math.sin(time * 9); arm[k].z = -1.15; } lean = -0.12; }
    }
    if (taunt && !(move && u > 0)) { for (const k of ['L', 'R']) { arm[k].sh = -0.5; arm[k].el = -1.3 + 0.55 * Math.sin(time * 9); arm[k].z = -1.15; } }
    // the strike: its arm thrown along its move's line, the body lunging after it
    if (lunge > 0 && move) {
      const S = STRIKE[move] || STRIKE.jab, A = arm[side];
      A.sh += (S.sh - A.sh) * lunge; A.el += (S.el - A.el) * lunge; A.z += (S.z - A.z) * lunge;
      fwd = (LUNGE[move] ?? 2) * lunge; twist = (side === 'L' ? -1 : 1) * 0.3 * lunge; back = 0;
      if (move === 'charge') { for (const k of ['L', 'R']) { arm[k].sh += (S.sh - arm[k].sh) * lunge; arm[k].el = 0; } }
    }
    // open: the guard dropped, slumped forward
    if (open > 0) for (const k of ['L', 'R']) { arm[k].sh += (-0.05 - arm[k].sh) * open; arm[k].el += (-0.3 - arm[k].el) * open; arm[k].z += (0.05 - arm[k].z) * open; }
    // set it
    G.position.copy(pos); G.rotation.set(0, yaw, 0);
    const R = this.root; R.position.set(0, lift, fwd - back);
    R.position.y += down * 1.2 - drop * 0.6; R.rotation.set(-down * Math.PI * 0.5, 0, 0);
    this.legs.forEach((p, i) => { p.rotation.x = (i ? 1 : -1) * 0.12 * bounce * (1 - down) - drop * 0.35; p.rotation.z = (i ? -1 : 1) * drop * 0.12; });
    const T = this.torso; T.position.y = B.hip - drop * 1.0 + 0.12 * bounce * (1 - down - open);
    T.rotation.set(lean + flinch * (high ? -0.1 : 0.45) + open * 0.25 * Math.sin(time * 2.2), twist, open * 0.12 * Math.sin(time * 1.7));
    for (const k of ['L', 'R']) {
      const A = this.arms[k], a = arm[k];
      if (!(move && u > 0 && tell === 'shoulder' && k === side)) A.sh.position.y = B.torso.h - 0.6;
      A.sh.rotation.set(a.sh - down * 0.3, 0, A.s * -a.z);
      A.el.rotation.set(a.el, 0, 0);
    }
    // the head: snapped back by a flinch to it, down when open; its eye's glow (white and blinking on the blink's tell)
    this.neck.rotation.set(-flinch * (high ? 0.6 : 0.1) + open * 0.35, 0, 0);
    if (blink) { this.mats.eye.emissive.setRGB(1, 1, 1); this.mats.eye.emissiveIntensity = 3.2; this.eye.scale.y = Math.floor(u * 9) % 3 === 1 ? 0.12 : 1; }
    else { this.mats.eye.emissive.copy(this.eyeColor); this.mats.eye.emissiveIntensity = 1.2 * (1 - 0.6 * open); this.eye.scale.y = 1; }
    // the joints: a limb past a snapped joint hidden; the neck snapped, the head up on its coil, bobbing
    const J = joints;
    for (const k of ['L', 'R']) { const A = this.arms[k]; A.sh.visible = !(J && past(J, `shoulder${k}`)); A.el.visible = !(J && past(J, `elbow${k}`)); }
    if (popT != null) {
      const ext = B.coil * (1 - Math.exp(-popT * 9)) + 0.7 * Math.exp(-popT * 1.6) * Math.sin(popT * 13);
      this.head.position.y = Math.max(0.2, ext); this.head.rotation.set(0.3 * Math.sin(popT * 7) * Math.exp(-popT), 0, 0.25 * Math.sin(popT * 5.3) * Math.exp(-popT * 0.8));
      this.coil.visible = true; this.coil.scale.set(1, Math.max(0.2, ext), 1); this.coil.position.y = Math.max(0.2, ext) / 2;
    } else { this.head.position.y = 0; this.head.rotation.set(0, 0, 0); this.coil.visible = false; }
    G.updateMatrixWorld(true);
  }

  /** A joint's world point (where a limb comes off, where a spark would be). */
  partAt(joint, out) {
    if (!this.root) return this.group.getWorldPosition(out);
    const side = ARM_OF[joint];
    if (side) return (joint.startsWith('elbow') ? this.arms[side].el : this.arms[side].sh).getWorldPosition(out);
    if (joint === 'neck') return this.neck.getWorldPosition(out);
    return this.torso.getWorldPosition(out);
  }

  clear() {
    if (this.root) { this.group.remove(this.root); this.root = null; }
    for (const g of this.geos) g.dispose(); this.geos = [];
    if (this.mats) for (const m of Object.values(this.mats)) m.dispose(); this.mats = null; this.id = null;
  }
  dispose() { this.clear(); this.group.parent?.remove(this.group); }
}
