// ---------------------------------------------------------------------------------------
// THE MECH'S BODY, A PLACEHOLDER (docs/plans/MECHS.md 4.1, 8): the frame drawn from its parts in boxes and cylinders, plain materials,
// so play can be judged before Calissa dresses it (a haniwa warrior at 14 m, glazed plates, the cradle in its chest with a screw
// thread and a gold collar). It is posed, never simulated: the controller (mechpilot.js) says where it stands and what it does.
//   the legs by type: a biped's two and a reverse joint's two swung as pendulums on the stride; a tetrapod's four; a tank's treads
//   the core with the cradle on its chest (lit while sealed), the head, two arms swung by their blows, each arm's weapon in its hand
//   by what the part does (a gun's barrel, a blade, a brush, a bell, a flail's coffin, the bare fist), the back unit, and the barrier
// Prior art: Giant Clank's and Armored Core's silhouettes (a heavy torso on a hip, the arms' weapons as the hands), Evangelion's entry
// plug in the spine (here the chest), the god hand's Jar sealed in a cradle (world/cradles.js).
//
//   MECH_BODY   hipOf(stats)   seatOf(stats) (m above the feet)   heightOf(stats)
//   const B = new MechBody(game)   B.build(stats)   B.group (in the scene)   B.pose({ pos, yaw, gait, walk, kneel, armL, armR, sealed, barrier })
//   B.seat(out) (the cradle, world)   B.back(out) (where the cable plugs)   B.hand(side, out)   B.dispose()
//   B.pose({ ..., lean, joints, holding })   B.limbs(J, holding) (what the joints left: joints.js past)   B.partAt(part, out)
//   B.arms[side] { pivot, hand, weapon, held (where a prop sits: props.js) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { past } from '../../progress/mechs/joints.js';

/** The placeholder's sizes (m): the torso, the head's cube, an arm, a leg's width, a tank's treads (its hip), the seat above the hip
 *  (the cradle in the chest), and the frame's footprint (what blocks and giants are kept out of). */
export const MECH_BODY = { torso: { w: 6, h: 5, d: 4 }, head: 2.4, arm: { w: 1.6, h: 5.5 }, leg: 1.8, treadH: 3, chest: 3, radius: 4.5 };
const C = { clay: 0xb0704a, plate: 0x7c4430, joint: 0x4a2a1e, gold: 0xd9a441, steel: 0x8a9298, cradle: 0x2a3440, glow: 0x9fe4ff, barrier: 0xffe39a };

export const hipOf = (stats) => (stats.leg > 0 ? stats.leg : MECH_BODY.treadH);
export const seatOf = (stats) => hipOf(stats) + MECH_BODY.chest;
export const heightOf = (stats) => hipOf(stats) + MECH_BODY.torso.h + MECH_BODY.head;

export class MechBody {
  constructor(game) {
    this.game = game;
    this.group = new THREE.Group(); this.group.name = 'mech';
    this.mats = Object.fromEntries(Object.entries(C).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: k === 'steel' || k === 'gold' ? 0.5 : 0, flatShading: true })]));
    this.mats.glow.emissive = new THREE.Color(C.glow); this.mats.glow.emissiveIntensity = 0;
    this.mats.gold.emissive = new THREE.Color(C.gold); this.mats.gold.emissiveIntensity = 0.25;
    Object.assign(this.mats.barrier, { transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, emissive: new THREE.Color(C.barrier), emissiveIntensity: 0.6 });
    this.geos = [];
  }

  box(w, h, d, mat, x = 0, y = 0, z = 0, into = this.body) {
    const g = new THREE.BoxGeometry(w, h, d); this.geos.push(g);
    const m = new THREE.Mesh(g, this.mats[mat]); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; into.add(m); return m;
  }
  cyl(r, len, mat, into, { x = 0, y = 0, z = 0, axis = 'z', r2 = r, seg = 12 } = {}) {
    const g = new THREE.CylinderGeometry(r2, r, len, seg); this.geos.push(g);
    const m = new THREE.Mesh(g, this.mats[mat]); m.position.set(x, y, z); if (axis === 'z') m.rotation.x = Math.PI / 2; m.castShadow = true; into.add(m); return m;
  }
  pivot(x, y, z, into = this.body) { const p = new THREE.Group(); p.position.set(x, y, z); into.add(p); return p; }

  /** The frame's parts laid out again (on assembling, and when it is built). */
  build(stats) {
    this.clear();
    const B = MECH_BODY, T = B.torso, hip = hipOf(stats), type = stats.legType, P = stats.parts;
    this.stats = stats; this.hip = hip;
    this.body = new THREE.Group(); this.group.add(this.body);
    this.legs = []; this.legSide = []; this.treads = {};
    if (type === 'tank') {
      for (const s of [-1, 1]) this.treads[s > 0 ? 'L' : 'R'] = this.box(B.leg, B.treadH, 7.5, 'joint', s * 2.6, B.treadH / 2, 0); // (+x the frame's left: it faces +z)
      this.box(4, 1.2, 4, 'plate', 0, B.treadH - 0.2, 0);
    } else {
      const spots = type === 'tetra' ? [[-2.4, 1.8], [2.4, 1.8], [-2.4, -1.8], [2.4, -1.8]] : [[-1.6, 0], [1.6, 0]];
      for (const [x, z] of spots) {
        const p = this.pivot(x, hip, z);
        this.box(B.leg, hip * 0.55, 2, 'plate', 0, -hip * 0.275, 0, p); // (the thigh)
        this.box(B.leg * 0.85, hip * 0.5, 1.7, 'clay', 0, -hip * 0.75, type === 'reverse' ? -0.7 : 0.15, p); // (the shin: a reverse joint's set back)
        this.box(B.leg * 1.1, 0.5, 2.8, 'joint', 0, -hip + 0.25, 0.3, p); // (the foot)
        this.legs.push(p); this.legSide.push(x > 0 ? 'L' : 'R');
      }
    }
    this.box(T.w, T.h, T.d, 'clay', 0, hip + T.h / 2, 0);
    this.box(T.w + 0.4, 1.2, T.d + 0.3, 'plate', 0, hip + T.h - 0.6, 0); // (the shoulder plate)
    this.box(3.2, 1, 2.8, 'joint', 0, hip + 0.2, 0); // (the hip)
    // the cradle on the chest: its well, its gold collar (the Jar sits in it while sealed)
    this.cradle = this.cyl(0.95, 0.5, 'cradle', this.body, { x: 0, y: hip + B.chest, z: T.d / 2 + 0.15 });
    this.collar = this.cyl(1.2, 0.3, 'gold', this.body, { x: 0, y: hip + B.chest, z: T.d / 2 + 0.05, seg: 16 });
    this.light = this.cyl(0.7, 0.55, 'glow', this.body, { x: 0, y: hip + B.chest, z: T.d / 2 + 0.12 });
    this.headG = this.pivot(0, hip + T.h, 0); // (the head on its neck: hidden when the neck snaps, joints.js)
    this.box(B.head, B.head, B.head, 'plate', 0, B.head / 2, 0, this.headG);
    this.box(1.6, 0.35, 0.2, 'glow', 0, B.head * 0.6, B.head / 2 + 0.05, this.headG); // (the eye slit)
    this.arms = {};
    for (const [side, s] of [['L', 1], ['R', -1]]) {
      const p = this.pivot(s * (T.w / 2 + B.arm.w / 2 + 0.1), hip + T.h - 0.6, 0);
      this.box(B.arm.w, B.arm.h, B.arm.w, 'plate', 0, -B.arm.h / 2, 0, p);
      const hand = this.pivot(0, -B.arm.h, 0, p), held = this.pivot(0, -0.6, 0, hand); // (held: where a prop sits in the hand, props.js)
      const weapon = this.weapon(P[side === 'L' ? 'weaponL' : 'weaponR'], this.pivot(0, 0, 0, hand));
      this.arms[side] = { pivot: p, hand, weapon, held };
    }
    this.backUnit = P.back ? this.box(4, 3.2, 1.6, 'steel', 0, hip + T.h - 1.4, -T.d / 2 - 0.8) : null;
    this.backAt = this.pivot(0, hip + 1.2, -T.d / 2 - 0.3);
    const r = heightOf(stats) * 0.62;
    const sg = new THREE.SphereGeometry(r, 18, 12); this.geos.push(sg);
    this.barrier = new THREE.Mesh(sg, this.mats.barrier); this.barrier.position.y = hip + T.h / 2; this.barrier.visible = false; this.body.add(this.barrier);
  }

  /** An arm weapon in its hand, shaped by what the part does (no tool is named: the part's own numbers say it). */
  weapon(P, hand) {
    if (!P || !P.mass) { this.box(2.2, 2.2, 2.2, 'joint', 0, -0.6, 0.2, hand); return hand; } // (the bare fist)
    if (P.charge) { this.cyl(0.45, 6.5, 'steel', hand, { y: -0.6, z: 2.6 }); this.box(1.2, 1.6, 2.4, 'joint', 0, -0.6, 0, hand); return hand; } // (the big gun)
    this.box(0.5, 0.8, 8, 'steel', 0, -0.6, 3.6, hand); return hand; // (the great blade)
  }

  /** What the joints have left on the frame (joints.js past): a shoulder snapped hides the arm, an elbow its hand and weapon, a hip its
   *  leg (a tread its side), the neck the head, the back mount the back unit; a prop held in a hand hides that hand's weapon. */
  limbs(J, holding = null) {
    if (!this.body) return;
    const gone = (id) => !!J && past(J, id);
    for (const s of ['L', 'R']) { const A = this.arms[s]; if (!A) continue; A.pivot.visible = !gone(`shoulder${s}`); A.hand.visible = !gone(`elbow${s}`); A.weapon.visible = holding !== s; }
    this.legs.forEach((p, i) => { p.visible = !gone(`hip${this.legSide[i]}`); });
    for (const s of ['L', 'R']) if (this.treads[s]) this.treads[s].visible = !gone(`hip${s}`);
    this.headG.visible = !gone('neck');
    if (this.backUnit) this.backUnit.visible = !gone('backMount');
  }
  /** Where a part stands in the world (a limb's prop is thrown off from there): armL / armR (the shoulder), forearmL / forearmR (the
   *  hand), legL / legR (the hip), head, back. */
  partAt(part, out) {
    const side = part.slice(-1), A = this.arms?.[side];
    if (part.startsWith('arm') && A) return A.pivot.getWorldPosition(out);
    if (part.startsWith('forearm') && A) return A.hand.getWorldPosition(out);
    if (part.startsWith('leg')) { const i = this.legSide?.indexOf(side) ?? -1; if (i >= 0) return this.legs[i].getWorldPosition(out); if (this.treads?.[side]) return this.treads[side].getWorldPosition(out); }
    if (part === 'head' && this.headG) return this.headG.getWorldPosition(out);
    if (part === 'back') return this.back(out);
    return this.group.getWorldPosition(out);
  }

  /** The frame posed: where it stands and faces, its stride (`gait` in steps, `walk` 0..1 the swing), a kneel 0..1, each arm's blow
   *  0..1, the cradle lit while sealed, the barrier 0..1. */
  pose({ pos, yaw = 0, gait = 0, walk = 0, kneel = 0, armL = 0, armR = 0, sealed = false, barrier = 0, lean = 0, joints = null, holding = null }) {
    if (!this.body) return;
    this.limbs(joints, holding);
    const G = this.group; G.position.copy(pos); G.rotation.set(0, yaw, 0);
    const sw = 0.38 * walk * Math.sin(Math.PI * gait);
    this.legs.forEach((p, i) => { p.rotation.x = (i % 2 ? sw : -sw) * (i >= 2 ? -1 : 1) - kneel * (i % 2 ? 1.1 : 0.3); });
    this.body.position.y = -kneel * this.hip * 0.42 - Math.abs(sw) * 0.25;
    this.body.rotation.x = kneel * 0.18; this.body.rotation.z = lean; // (lean: a leg gone, the frame kneels to that side)
    for (const [s, k] of [['L', armL], ['R', armR]]) { const A = this.arms[s]; if (A) A.pivot.rotation.x = -1.5 * k + (s === 'L' ? sw : -sw) * 0.5 - kneel * 0.4; }
    this.mats.glow.emissiveIntensity = sealed ? 1.6 : 0.15;
    this.barrier.visible = barrier > 0.01; this.mats.barrier.opacity = 0.08 + 0.2 * barrier;
    G.updateMatrixWorld(true);
  }

  seat(out) { return this.cradle.getWorldPosition(out); }
  back(out) { return this.backAt.getWorldPosition(out); }
  hand(side, out) { return this.arms[side]?.hand.getWorldPosition(out) ?? this.group.getWorldPosition(out); }

  clear() {
    if (this.body) { this.group.remove(this.body); this.body = null; }
    for (const g of this.geos) g.dispose(); this.geos = [];
  }
  dispose() { this.clear(); this.group.parent?.remove(this.group); for (const m of Object.values(this.mats)) m.dispose(); }
}
