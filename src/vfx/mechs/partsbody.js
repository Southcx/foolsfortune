// ---------------------------------------------------------------------------------------
// A MECH'S PARTS BODY (plain name; docs/plans/MECHS.md 8.2; South, 2026-11-02: "Given that the limbs will be destructible, you could
// focus your attention on building modular body parts? Do sort of a Medabots part swapping thing?"): a mech drawn from its assembly,
// part by part, each slot's look out of the part library (vfx/mechs/parts/: heads, cores, arms, legs, weapons, backs), all of one
// family (porcelain plates over the interstitial core, deep grooves, gold balls seated in ivory cups, trim on the pauldrons and bands),
// so any part fits
// any socket and each reads at a glance. A drop-in for the runtime's placeholder (world/hangar/mech.js MechBody): the same build, pose,
// seat, back, hand and dispose, and the same seat height a leg type (the cradle's floor 3 m over the hip, the hip at the legs' own
// height), its footprint inside MECH_BODY.radius.
//   THE JOINTS   a tree of named Object3Ds (`joints`): Dovina's nine (neck, shoulderL/R, elbowL/R, waist, hipL/R, backMount; her
//                joints.js) and the inner ones (pelvis, chest, head, wristL/R, handL/R, gripL/R, the legs' knees, ankles, toes, legs)
//   A SWAP       equip(slot, id) takes down only that slot's meshes and builds the new part's in place (an arm part its shoulders and
//                forearms, a weapon its grip and the hand that holds it)
//   A JOINT'S    setJoint(id, 'fractured'): the joint's ball crazed with lit gold cracks, the limb sagging a little, a spark now and
//   STATE        then; 'snapped': the limb past it (its subtree) let go into the scene in world space, a burst at the socket, and handed
//                back { group, joint, slots } for the runtime to fly as a prop; 'whole' puts it back. mend() makes every joint whole,
//                a kintsugi line of gold left on each mended ball
//   THE CRADLE   in the back between the shoulder blades (vfx/mechs/parts/cores.js CRADLE, the Jar's own size): `cradle` { frame (at
//                the well's floor, +Y out along its axis), depth, turns, pitch, collar, tines, bore }; seat(out) is the frame's world
//                point. The mount's animation is the runtime's (no seal or turn here); sealed lights the eyes and the well's floor
//   THE FORM     `form` 'hero' | 'doll' | 'drossel' (kit.js FORMS: the doll Haydee's hourglass android, drossel Fireball's corseted
//                duchess in her crinoline), read on build; setForm rebuilds. A feminine form builds every slot from its own library
//                (parts/femcores.js, femlegs.js, femlimbs.js, femheads.js): every part id, every leg type, its own shape, a pear
//                (the hero's complement: a narrow top, the weight in the hips and thighs)
//   THE HELM     a feminine form has no head: a helm floats over its collar (vfx/mechs/helms.js wearHelm), the form's own (FORMS
//                `helm`) while none is chosen; a helm chosen (the hangar's game.mechHelm) is worn again whenever the frame or its
//                head is rebuilt, a default one taken off when the form no longer has one
//   THE CHEST    a feminine form's two chest plates (femcores.js `bust`, on joints bustL/R off the chest) each on a damped spring
//   PLATES       (BUST_SPRING; South, 2026-11-02: "give it physics for comedic effect"), driven by the frame's own motion: the stride's
//                bob, a fall stopped (a landing, a stomp), a kneel, and jiggle(v) (a hit's flinch, the mount's thump: the runtime's
//                to call; a fractured joint calls it); underdamped, a beat of overshoot and settle
//   A PAULDRON   setPauldron(id) (vfx/mechs/parts/pauldrons.js PAULDRONS) swaps only the two pauldrons, hung on their own joints off the
//                chest at the shoulders (pauldronL/R), riding a part of the arm's swing; 'default' the arms part's own
//   THE BACK     setCape(id) (vfx/mechs/capes.js CAPES: the drums' ring, the flame halo, Fujin's wind bag, the heavenly sash, the
//   PIECE        knight's cape) worn at the shoulders and back clear of the cradle, laid out again whenever the frame is rebuilt or a
//                part swapped; its cloth stepped in pose() with the chest plates' springs (the same frame time)
//   THE RUNTIME  (world/hangar/mech.js's contract) arms[side] { pivot, hand, weapon, held (where a carried prop is parented) };
//                partAt(part, out); pose({ ..., joints, holding, lean }) shows Dovina's joint states (progress/mechs/joints.js) by
//                showJoints: fractured crazed and sagging, snapped HIDDEN with all past it (joints.js past; the runtime throws its own
//                prop), mended once all are whole; `holding` hides that hand's weapon, `lean` tilts the body to a side
// The programs are shared by every part, one each: mats.porcelain (the plates: the Courier's body glaze), mats.core (the
// interstitial: the Courier's skin), mats.trim (pauldrons and bands: the trim glaze), all plain MeshStandardMaterials so a runtime may
// chain its finish onto them; mats.gold, mats.labradorite (small gems only), mats.glow. A mech is a few draws a segment.
// Prior art: Medabots (Medaparts on a tinpet: head, arms, legs swapped, the Medal its soul, here the Pneuka Jar); Armored Core's
// assembly; the Zoids' modular kits; Gundam's real-robot panel lines; the ball-jointed doll; Toribash's dismemberment and Rock 'Em
// Sock 'Em Robots for the snap; kintsugi for the mend; secondary motion as a damped spring (the animator's follow-through and
// overlap, Thomas and Johnston's The Illusion of Life, 1981; the jiggle bones of fighting games' armour) for the chest plates.
//
//   const B = new MechPartsBody(game, { form?, pauldron?, cape? })   B.build(stats) (progress/mechs/frame.js assemble)   B.group   B.joints   B.mats   B.height
//   B.pose({ pos, yaw, gait, walk, kneel, armL, armR, sealed, barrier, lean, joints, holding, dt? })   B.jiggle(v)   BUST_SPRING   B.seat(out)   B.back(out)   B.hand(side, out)
//   B.arms[side]   B.partAt(part, out)   B.showJoints(J, holding)   B.limbs (the same)   B.setForm(form)   B.setPauldron(id)   B.setCape(id)   B.form   B.pauldron   B.capeId   B.cape
//   B.equip(slot, id)   B.setJoint(id, state) -> { group, joint, slots } | null   B.mend()   B.state { [joint]: state }   B.dispose()
//   LIMB (what each joint takes off with it)   installMechLooks(game) -> game.makeMechBody(stats? | sel?, { form, pauldron }?) (a MechPartsBody, built if given)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PARTS } from '../../progress/mechs/parts.js';
import { assemble } from '../../progress/mechs/frame.js';
import { past } from '../../progress/mechs/joints.js';
import { MECH_LOOK as L, seg, bake, mechMaterials, crackNet, formOf } from './parts/kit.js';
import { headLookOf } from './parts/heads.js';
import { coreLook, CRADLE, cradle, cradleParts } from './parts/cores.js';
import { PAULDRONS } from './parts/pauldrons.js';
import { armLookOf, gripAt } from './parts/arms.js';
import { LEG_LOOKS } from './parts/legs.js';
import { FEM_LEGS } from './parts/femlegs.js';
import { WEAPON_LOOKS } from './parts/weapons.js';
import { BOOSTER_LOOKS, GENERATOR_LOOKS, BACK_LOOKS } from './parts/backs.js';
import { wearHelm, HELMS } from './helms.js';
import { wearCape, CAPES } from './capes.js';

const PI = Math.PI, SIDES = [[1, 'L'], [-1, 'R']];
/** What each joint takes off with it when it snaps (Dovina's joints.js `limb`, as slots). The waist never snaps. */
export const LIMB = { neck: ['head'], shoulderL: ['arms', 'weaponL'], shoulderR: ['arms', 'weaponR'], elbowL: ['weaponL'], elbowR: ['weaponR'],
  waist: [], hipL: ['legs'], hipR: ['legs'], backMount: ['back'] };
/** How a fractured joint sags (radians added to its pose; x by side on z). */
const SAG = { neck: [0.12, 0, 0.16], shoulderL: [0.12, 0, 0.1], shoulderR: [0.12, 0, 0.1], elbowL: [0.22, 0, 0], elbowR: [0.22, 0, 0],
  waist: [0.08, 0, 0.05], hipL: [0, 0, 0.05], hipR: [0, 0, 0.05], backMount: [-0.18, 0, 0] };
/** The hip's height a leg part (world/hangar/mech.js hipOf: its leg, or 3 m for treads). */
const hipFor = (P) => (P?.leg > 0 ? P.leg : 3);
/** The chest plates' spring (m and s): its stiffness (s^-2) and damping (s^-1; underdamped, so it overshoots), how far a plate may
 *  travel from its rest, how much of the frame's vertical acceleration it feels, the cap on that acceleration (a teleport is not a
 *  landing), the right plate's stiffness against the left's (out of step, for the gag), and its tilt a metre of travel (rad). */
export const BUST_SPRING = { stiffness: 140, damping: 3.6, travel: 0.34, gain: 1.0, maxAcc: 200, skew: 1.09, tilt: 0.9 };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _on = new THREE.Color(L.film), _off = new THREE.Color(L.hollow);

export class MechPartsBody {
  constructor(game = null, { form = 'hero', pauldron = 'default', cape = null } = {}) {
    this.game = game;
    this.group = new THREE.Group(); this.group.name = 'mech';
    this.mats = mechMaterials();
    Object.assign(this.mats, { porcelain: this.mats.p, gold: this.mats.g, labradorite: this.mats.l, glow: this.mats.e });
    this.form = form; this.pauldron = pauldron; this.capeId = CAPES[cape] ? cape : null; this.arms = {}; this.hurt = new Set();
    this.joints = {}; this.owned = {}; this.balls = []; this.state = {}; this.snapped = {}; this.legJoints = [];
    this.sealK = 0; this.travel = 0; this.sparkAt = 0;
    this.bounce = { L: { x: 0, v: 0 }, R: { x: 0, v: 0 } }; this.lastY = null; this.lastVy = 0; this.lastT = null;
  }

  // ------------------------------------------------------------------ the frame
  J(name, parent, at = [0, 0, 0], rot = [0, 0, 0]) {
    const j = new THREE.Group(); j.name = `mech.${name}`; j.position.set(...at); j.rotation.set(...rot);
    j.userData.rest = j.rotation.clone(); parent.add(j); this.joints[name] = j; return j;
  }
  put(joint, slot, build) { const S = seg(this.F); build(S); return bake(joint, S, this.mats, (this.owned[slot] ||= [])); }
  ballAt(slot, id, obj, r, at = [0, 0, 0]) { this.balls.push({ slot, id, obj, r, at }); }
  rest(j, rot) { j.rotation.set(...rot); j.userData.rest = j.rotation.clone(); }

  /** The frame's parts laid out from its assembly (`stats` from assemble, or a selection). */
  build(stats) {
    this.clear();
    if (stats?.form) this.form = stats.form;
    this.F = formOf(this.form); this.form = this.F.id;
    this.stats = stats?.parts ? stats : assemble(stats || {});
    this.sel = { ...this.stats.sel };
    for (const id of Object.keys(LIMB)) this.state[id] = 'whole';
    this.body = new THREE.Group(); this.body.name = 'mech.body'; this.group.add(this.body);
    const J = this.J.bind(this), j = this.joints;
    J('pelvis', this.body); J('waist', j.pelvis, [0, L.waist, 0]); J('chest', j.waist, [0, L.chestBase, 0]);
    J('neck', j.chest); J('head', j.neck);
    J('backMount', j.chest); J('booster', j.chest); J('generator', j.chest); J('plug', j.chest);
    J('cradle', j.chest);
    for (const [, k] of SIDES) {
      J(`shoulder${k}`, j.chest); J(`pauldron${k}`, j.chest); J(`bust${k}`, j.chest); J(`elbow${k}`, j[`shoulder${k}`]); J(`wrist${k}`, j[`elbow${k}`]); J(`hand${k}`, j[`wrist${k}`]); J(`grip${k}`, j[`wrist${k}`]);
      const held = new THREE.Group(); held.name = `mech.held${k}`; j[`wrist${k}`].add(held);
      this.arms[k] = { pivot: j[`shoulder${k}`], hand: j[`hand${k}`], weapon: j[`grip${k}`], held };
    }
    // the cradle, the same in every core: its boss, thread and floor's glow, and its own meshes
    this.rest(j.cradle, [-CRADLE.tilt, 0, 0]);
    this.put(j.cradle, 'cradle', cradle);
    const C = cradleParts(this.mats); j.cradle.add(C.collar, C.bore, ...C.tines);
    this.cradle = { frame: j.cradle, depth: CRADLE.depth, turns: CRADLE.turns, pitch: CRADLE.pitch, r: CRADLE.r, collar: C.collar, tines: C.tines, bore: C.bore };
    for (const slot of ['legs', 'core', 'head', 'arms', 'pauldron', 'weaponL', 'weaponR', 'booster', 'generator', 'back']) this.buildSlot(slot);
    this.layoutArms();
    this.group.updateMatrixWorld(true);
    this.height = +new THREE.Box3().setFromObject(this.body).max.y.toFixed(2);
    const sg = new THREE.SphereGeometry(this.height * 0.62, 24, 16);
    this.barrierMat = new THREE.MeshBasicMaterial({ name: 'mech-barrier', color: 0xffe39a, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
    this.barrier = new THREE.Mesh(sg, this.barrierMat); this.barrier.position.y = this.hip + 2.5; this.barrier.visible = false; this.body.add(this.barrier);
    if (this.capeId) this.wearCape();
  }
  /** The back piece worn again on the frame as it now stands (capes.js; laid out by the frame's shoulders, back, Jar and hips). */
  wearCape() { return this.capeId ? wearCape(this, this.capeId, this.game?.scene || null) : wearCape(this, null); }
  /** A back piece put on ('renko' | 'kohai' | 'kazebukuro' | 'tenne' | 'knight'; null or 'none' takes it off). */
  setCape(id) { this.capeId = CAPES[id] ? id : null; if (this.body) this.wearCape(); return this; }

  /** One slot's part built from `this.sel` (its old meshes taken down first). */
  buildSlot(slot) {
    this.takeDown(slot);
    const j = this.joints, id = this.sel[slot], P = PARTS[id];
    if (slot === 'legs') {
      for (const lj of this.legJoints) { lj.removeFromParent(); delete this.joints[lj.name.slice(5)]; } this.legJoints = [];
      this.hip = hipFor(P); j.pelvis.position.y = this.hip;
      const ctx = { H: this.hip, F: this.F, pelvis: j.pelvis, mats: this.mats, owned: (this.owned.legs ||= []),
        joint: (name, parent, at, rot) => { const lj = this.J(name, parent, at, rot); this.legJoints.push(lj); return lj; },
        put: (joint, build) => this.put(joint, 'legs', build), ballAt: (jid, obj, r, at) => this.ballAt('legs', jid, obj, r, at) };
      const LEGS = this.F.fem ? FEM_LEGS : LEG_LOOKS;
      this.legs = (LEGS[id] || LEGS.clayLegs)(ctx);
    } else if (slot === 'core') {
      const C = coreLook(id, this.F), M = C.mounts; this.core = C;
      this.put(j.waist, 'core', (S) => C.waist(S)); this.put(j.chest, 'core', (S) => C.chest(S));
      if (C.spine) { this.ballAt('core', 'waist', j.waist, C.spine.r, [0, C.spine.lo, 0]); this.ballAt('core', 'waist', j.waist, C.spine.rt, [0, C.spine.hi, 0]); }
      else this.ballAt('core', 'waist', j.waist, 0.5 * this.F.joint);
      for (const [s, k] of SIDES) j[`pauldron${k}`].position.set(s * M.shoulder[0], M.shoulder[1], 0);
      j.neck.position.set(0, M.neck[0], M.neck[1]);
      for (const [s, k] of SIDES) j[`shoulder${k}`].position.set(s * M.shoulder[0], M.shoulder[1], 0);
      j.backMount.position.set(0, M.back[0], M.back[1]); j.generator.position.set(0, M.gen[0], M.gen[1]);
      j.booster.position.set(0, M.boost[0], M.boost[1]); j.plug.position.set(0, M.plug[0], M.plug[1]);
      j.cradle.position.set(0, CRADLE.at[0], M.cradleZ ?? CRADLE.at[1]);
      for (const [s, k] of SIDES) { // (a feminine core's chest plates, each on its own joint for the spring)
        const b = j[`bust${k}`]; if (!C.bust) continue;
        b.position.set(...C.bust.at(s)); b.userData.home = b.position.clone(); this.rest(b, C.bust.rot(s));
        this.put(b, 'core', (S) => C.bust.build(S, s));
      }
      if (this.sel.arms) this.layoutArms();
    } else if (slot === 'head') {
      const H = headLookOf(id, this.F);
      this.put(j.neck, 'head', (S) => H.neckSeg(S)); this.put(j.head, 'head', (S) => H.build(S));
      this.rest(j.neck, [0.05, 0, 0]); j.head.position.set(0, H.neck, 0); this.rest(j.head, [0.04, 0, 0]);
      this.ballAt('head', 'neck', j.neck, H.ball * this.F.joint);
      this.dressHead();
    } else if (slot === 'arms') {
      const A = armLookOf(id, this.F); this.armLook = A;
      for (const [s, k] of SIDES) {
        this.put(j[`shoulder${k}`], 'arms', (S) => A.shoulder(S, s)); this.put(j[`elbow${k}`], 'arms', (S) => A.foreArm(S, s));
        this.ballAt('arms', `shoulder${k}`, j[`shoulder${k}`], A.ball * this.F.joint); this.ballAt('arms', `elbow${k}`, j[`elbow${k}`], A.elbow * this.F.joint);
        this.buildHand(k);
      }
      this.layoutArms();
      if (this.owned.pauldron) this.buildSlot('pauldron');
    } else if (slot === 'pauldron') {
      const A = this.armLook, P = PAULDRONS[this.pauldron], fn = P === 'none' ? null : P || ((S, s) => A?.pauldron(S, s));
      for (const [s, k] of SIDES) { j[`pauldron${k}`].scale.setScalar(this.F.pauldron); if (fn) this.put(j[`pauldron${k}`], 'pauldron', (S) => fn(S, s)); }
      this.owned.pauldron ||= [];
    } else if (slot === 'weaponL' || slot === 'weaponR') {
      const k = slot.slice(-1), s = k === 'L' ? 1 : -1, W = WEAPON_LOOKS[id];
      if (W) this.put(j[`grip${k}`], slot, (S) => W.build(S, s));
      if (this.armLook) this.buildHand(k);
    } else if (slot === 'booster') {
      const B = BOOSTER_LOOKS[id]; if (B) this.put(j.booster, slot, (S) => B(S, this.core?.mounts.boost[2] ?? 0.85));
    } else if (slot === 'generator') {
      const G = GENERATOR_LOOKS[id]; if (G) this.put(j.generator, slot, (S) => G(S));
    } else if (slot === 'back') {
      const B = BACK_LOOKS[id];
      if (B) { this.put(j.backMount, slot, (S) => { S.g.ball(0.28, { c: L.gold }, 20, 14); S.p.cyl(0.42, 0.46, 0.2, { at: [0, 0, 0.12], rot: [PI / 2, 0, 0], c: L.ivory }, 20); B(S); }); this.ballAt(slot, 'backMount', j.backMount, 0.28); }
    }
    this.reapply(slot);
  }
  /** The helm over the head: one chosen is worn again over the rebuilt head; a feminine form with none chosen wears its own (FORMS
   *  `helm`), never a bare head; a default helm comes off when the form no longer has one. */
  dressHead() {
    const worn = this.helm, chosen = worn && worn !== this.defaultHelm ? worn.id : null, id = chosen || (this.F?.fem ? this.F.helm : null);
    if (!id || !HELMS[id]) { if (worn) wearHelm(this, null); this.defaultHelm = null; return; }
    const h = wearHelm(this, id, this.game?.scene || null); this.defaultHelm = chosen ? null : h;
  }
  /** A kick to the chest plates' springs (m/s, up positive): a hit's flinch, the mount's thump, a stomp the runtime knows of. */
  jiggle(v = 1.5) { for (const k of ['L', 'R']) this.bounce[k].v += v * (k === 'R' ? 0.92 : 1); }
  buildHand(k) {
    const s = k === 'L' ? 1 : -1, slot = `hand${k}`, W = WEAPON_LOOKS[this.sel[`weapon${k}`]];
    this.takeDown(slot);
    this.put(this.joints[`hand${k}`], slot, (S) => this.armLook.hand(S, s, W ? W.grip : 'open'));
  }
  /** The arms' joints laid along their lengths, and their hang: a frame whose hands would reach the ground (a low hip) carries them
   *  forward and bent, so they hang clear. */
  layoutArms() {
    const A = this.armLook, M = this.core?.mounts, j = this.joints; if (!A || !M) return;
    const shoulderY = this.hip + L.waist + L.chestBase + M.shoulder[1], reach = A.upper + A.fore + A.wrist * 0.6 + A.palm + 0.9;
    const over = Math.max(0, reach - (shoulderY - 1.0));
    const tw = new THREE.Euler(0, 0, 0), q = new THREE.Vector3();
    for (const [s, k] of SIDES) {
      this.rest(j[`shoulder${k}`], [-0.08 - Math.min(0.9, over * 0.35), 0, s * (A.splay ?? 0.1)]); this.rest(j[`pauldron${k}`], [-0.03 - Math.min(0.9, over * 0.35) * 0.35, 0, s * (0.04 - (A.slope ?? 0))]); // (slope: a shoulder line falling to the cap)
      j[`elbow${k}`].position.set(0, -A.upper, 0); this.rest(j[`elbow${k}`], [-0.2 - Math.min(0.8, over * 0.3), 0, -s * (A.bend ?? (A.splay ? A.splay * 0.6 : 0.04))]);
      j[`wrist${k}`].position.set(0, -A.fore, 0); this.rest(j[`wrist${k}`], [0, 0, 0]);
      const twist = s * (-PI / 2 + 0.45); this.rest(j[`hand${k}`], [0, twist, 0]);
      tw.set(0, twist, 0); q.set(...gripAt(A)).applyEuler(tw); j[`grip${k}`].position.copy(q); this.rest(j[`grip${k}`], [0, 0, 0]); this.arms[k]?.held.position.copy(q);
    }
  }

  takeDown(slot) {
    for (const m of this.owned[slot] || []) { m.removeFromParent(); m.geometry?.dispose(); }
    this.owned[slot] = []; this.balls = this.balls.filter((b) => b.slot !== slot);
  }
  /** A slot rebuilt keeps its joints' state (a fractured shoulder's new arm comes crazed). */
  reapply(slot) { for (const b of this.balls) if (b.slot === slot && this.state[b.id] === 'fractured') this.craze(b, 'crack'); }
  craze(b, kind) {
    const m = new THREE.Mesh(crackNet(b.r, b.id.length * 7 + b.r * 31 + (kind === 'mend' ? 3 : 0), kind === 'mend' ? L.gold : 0xffffff, kind === 'mend' ? 0.025 : 0.03).done(), kind === 'mend' ? this.mats.g : this.mats.crack);
    m.position.set(...b.at); m.name = `mech.${b.id}.${kind}`; m.userData.mark = kind; b.obj.add(m); this.owned[b.slot].push(m);
  }
  unmark(id, kind) {
    for (const b of this.balls) if (b.id === id) for (const m of [...b.obj.children]) if (m.userData.mark === kind) { m.removeFromParent(); m.geometry.dispose(); this.owned[b.slot] = this.owned[b.slot].filter((x) => x !== m); }
  }

  /** One slot's part swapped in place (a snapped limb carrying it is put back first). */
  equip(slot, id) {
    for (const [jid, slots] of Object.entries(LIMB)) if (this.state[jid] === 'snapped' && slots.includes(slot)) this.setJoint(jid, 'whole');
    this.sel[slot] = id; this.buildSlot(slot);
    if (slot === 'legs') { this.barrier.position.y = this.hip + 2.5; this.group.updateMatrixWorld(true); }
    if (this.capeId) this.wearCape(); // (the back piece laid out again on the new part)
    return this;
  }

  /** A joint's state shown: 'whole' | 'fractured' | 'snapped' (the waist only fractures). Snapped, returns the limb let go. */
  setJoint(id, state) {
    const from = this.state[id], obj = this.joints[id]; if (!obj || from === undefined || from === state) return null;
    if (id === 'waist' && state === 'snapped') state = 'fractured';
    if (from === 'snapped' && !this.snapped[id]) obj.visible = true;
    else if (from === 'snapped') { const R = this.snapped[id]; R.parent.add(obj); obj.position.copy(R.pos); obj.quaternion.copy(R.quat); obj.scale.copy(R.scale); delete this.snapped[id]; }
    if (from === 'fractured') this.unmark(id, 'crack');
    this.state[id] = state;
    if (state === 'fractured') { for (const b of this.balls) if (b.id === id) this.craze(b, 'crack'); this.jiggle(-2.2); }
    if (state !== 'snapped') return null;
    this.group.updateMatrixWorld(true);
    this.snapped[id] = { parent: obj.parent, pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.clone() };
    const at = obj.getWorldPosition(new THREE.Vector3());
    (this.group.parent || this.group).attach(obj);
    try { this.game?.vfx?.play('hit.blunt.clay.kill', { pos: at, scale: 3 }); } catch { /* (headless: no effects) */ }
    return { group: obj, joint: id, slots: LIMB[id] };
  }
  /** Every joint whole again; each one that was not wears a kintsugi line of gold on its ball. */
  mend() {
    for (const id of Object.keys(LIMB)) if (this.state[id] !== 'whole') { this.setJoint(id, 'whole'); this.unmark(id, 'mend'); for (const b of this.balls) if (b.id === id) this.craze(b, 'mend'); }
  }

  /** The frame rebuilt in another form ('hero' | 'doll' | 'drossel'), its parts, pauldron and fractured joints kept. */
  setForm(form) {
    const F = formOf(form); if (F.id === this.form && this.body) return this;
    this.form = F.id; if (this.body) this.rebuild(); return this;
  }
  /** Both pauldrons swapped in place (PAULDRONS: 'default', 'none', 'osode', 'zaku', 'wing', 'spaulder', 'disc', 'horn'). */
  setPauldron(id) { this.pauldron = PAULDRONS[id] !== undefined ? id : 'default'; if (this.body) { this.buildSlot('pauldron'); if (this.capeId) this.wearCape(); } return this; }
  rebuild() {
    const keep = { ...this.state }, J = this.shownJ, holding = this.holding;
    this.build(assemble(this.sel));
    for (const [id, st] of Object.entries(keep)) if (st === 'fractured') this.setJoint(id, 'fractured');
    if (J) this.showJoints(J, holding);
  }

  /** Dovina's joint states shown on the body (progress/mechs/joints.js { [id]: { strain, state } }), never detaching: a fractured
   *  joint crazed and sagging, a snapped one hidden with everything past it (joints.js past: a shoulder takes its elbow), every
   *  joint once hurt mended with gold when all are whole again; `holding` ('L' | 'R') hides that hand's weapon. */
  showJoints(J, holding = null) {
    if (!this.body) return;
    this.shownJ = J; this.holding = holding;
    let whole = true;
    for (const id of Object.keys(LIMB)) {
      if (this.snapped[id]) continue; // (detached by setJoint: the caller's)
      const want = J?.[id]?.state || 'whole', cur = this.state[id], obj = this.joints[id];
      if (want !== 'whole') { whole = false; this.hurt.add(id); }
      if (cur === 'fractured' && want !== 'fractured') this.unmark(id, 'crack');
      if (want === 'fractured' && cur !== 'fractured') { this.unmark(id, 'mend'); for (const b of this.balls) if (b.id === id) this.craze(b, 'crack'); }
      this.state[id] = id === 'waist' && want === 'snapped' ? 'fractured' : want;
      if (obj && id !== 'waist') obj.visible = !(J && past(J, id));
    }
    if (whole && this.hurt.size) { for (const id of this.hurt) { this.unmark(id, 'mend'); for (const b of this.balls) if (b.id === id) this.craze(b, 'mend'); } this.hurt.clear(); }
    for (const [, k] of SIDES) this.joints[`grip${k}`].visible = holding !== k;
  }
  limbs(J, holding) { this.showJoints(J, holding); }
  /** Where a part stands in the world (the runtime throws a limb's prop from there): armL / armR (the shoulder), forearmL / forearmR
   *  (the hand), legL / legR (the hip), head, back. */
  partAt(part, out) {
    const j = this.joints, side = part.slice(-1);
    const o = part.startsWith('forearm') ? j[`hand${side}`] : part.startsWith('arm') ? j[`shoulder${side}`] : part.startsWith('leg') ? j[`hip${side}`] : part === 'head' ? j.head : null;
    if (part === 'back') return this.back(out);
    return (o || this.group).getWorldPosition(out);
  }

  // ------------------------------------------------------------------ the pose
  /** The frame posed: where it stands and faces, its stride (`gait` in steps, `walk` 0..1), a kneel 0..1, each arm's blow 0..1, the
   *  eyes and the well lit while sealed, the barrier 0..1. A snapped limb is left as the runtime flies it. */
  pose({ pos, yaw = 0, gait = 0, walk = 0, kneel = 0, armL = 0, armR = 0, sealed = false, barrier = 0, lean = 0, joints, holding, dt }) {
    if (!this.body) return;
    if (joints !== undefined || holding !== undefined) this.showJoints(joints ?? this.shownJ, holding === undefined ? this.holding : holding);
    const G = this.group, j = this.joints;
    if (pos) { if (this.lastPos) this.travel += (pos.x - this.lastPos.x) * Math.sin(yaw) + (pos.z - this.lastPos.z) * Math.cos(yaw); (this.lastPos ||= new THREE.Vector3()).copy(pos); G.position.copy(pos); }
    G.rotation.set(0, yaw, 0);
    const held = new Map(); // (a snapped limb's joints keep what the runtime gave them)
    for (const id of Object.keys(this.snapped)) j[id].traverse((o) => { if (o.userData.rest) held.set(o, o.quaternion.clone()); });
    for (const o of Object.values(j)) o.rotation.copy(o.userData.rest);
    this.legs?.pose({ gait, walk, kneel, travel: this.travel });
    const sw = Math.sin(PI * gait) * walk;
    this.body.position.y = -(this.legs?.drop(kneel) ?? 0) - Math.abs(sw) * (this.stats.legType === 'tank' ? 0 : 0.2);
    j.waist.rotation.x += kneel * 0.22; this.body.rotation.z = lean; // (lean: a leg gone, the frame kneels to that side)
    const W = { L: WEAPON_LOOKS[this.sel.weaponL], R: WEAPON_LOOKS[this.sel.weaponR] };
    for (const [s, k] of SIDES) {
      const a = k === 'L' ? armL : armR, swing = (s > 0 ? sw : -sw) * 0.18;
      j[`shoulder${k}`].rotation.x += -1.35 * a + swing - kneel * 0.4;
      j[`elbow${k}`].rotation.x += -0.3 * a;
      j[`wrist${k}`].rotation.x += (W[k]?.level ?? 0) * 1.65 * a;
      j[`pauldron${k}`].rotation.x += (-1.35 * a + swing - kneel * 0.4) * 0.4;
    }
    for (const [id, st] of Object.entries(this.state)) if (st === 'fractured') { const o = j[id], d = SAG[id], sd = id.endsWith('R') ? -1 : 1; o.rotation.x += d[0]; o.rotation.z += d[2] * sd; }
    for (const [o, q] of held) o.quaternion.copy(q);
    const now0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const step = dt !== undefined ? dt : this.lastT === null ? 0 : now0 - this.lastT; // (one frame's real time, for the springs and the cloth)
    this.lastT = now0;
    this.bust(step);
    // sealed: the eyes and the well's floor lit, eased
    this.sealK += ((sealed ? 1 : 0) - this.sealK) * 0.12;
    this.mats.e.color.copy(_off).lerp(_on, this.sealK);
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    this.mats.crack.color.setRGB(1, 0.62 + 0.25 * Math.sin(now * 5.3), 0.3);
    this.barrier.visible = barrier > 0.01; this.barrierMat.opacity = 0.08 + 0.2 * barrier;
    G.updateMatrixWorld(true);
    this.cape?.update(Math.min(Math.max(step, 0), 1));
    if (now > this.sparkAt) {
      const hurt = Object.keys(this.state).filter((id) => this.state[id] === 'fractured');
      this.sparkAt = now + 1.6 + Math.random() * 2.4;
      if (hurt.length) { const id = hurt[(Math.random() * hurt.length) | 0]; try { this.game?.vfx?.play('hit.shot.metal', { pos: j[id].getWorldPosition(_v), scale: 1.4 }); } catch { /* (headless) */ } }
    }
  }

  /** The chest plates sprung: each lags the frame's vertical acceleration (x'' = -k x - c x' - gain a), clamped to its travel. */
  bust(dt) {
    const j = this.joints, K = BUST_SPRING; if (!j.bustL?.userData.home) return;
    dt = Math.min(Math.max(dt || 0, 0), 1 / 20);
    const y = this.group.position.y + this.body.position.y;
    if (this.lastY === null || dt <= 0) { this.lastY = y; this.lastVy = 0; } else {
      const vy = (y - this.lastY) / dt, acc = Math.max(-K.maxAcc, Math.min(K.maxAcc, (vy - this.lastVy) / dt));
      this.lastY = y; this.lastVy = vy;
      for (const k of ['L', 'R']) {
        const B = this.bounce[k], w = K.stiffness * (k === 'R' ? K.skew : 1), h = dt / 2;
        for (let i = 0; i < 2; i++) { B.v += (-w * B.x - K.damping * B.v - K.gain * acc) * h; B.x += B.v * h; }
        if (Math.abs(B.x) > K.travel) { B.x = Math.sign(B.x) * K.travel; B.v *= -0.4; }
      }
    }
    for (const k of ['L', 'R']) { const b = j[`bust${k}`], x = this.bounce[k].x; b.position.copy(b.userData.home); b.position.y += x; b.rotation.x -= x * K.tilt; }
  }
  seat(out) { return this.cradle.frame.getWorldPosition(out); }
  back(out) { return this.joints.plug.getWorldPosition(out); }
  hand(side, out) {
    const gone = this.snapped[`shoulder${side}`] || this.snapped[`elbow${side}`];
    if (gone) return gone.parent.localToWorld(out.copy(gone.pos));
    return this.joints[`grip${side}`]?.getWorldPosition(out) ?? this.group.getWorldPosition(out);
  }

  clear() {
    for (const [id, R] of Object.entries(this.snapped)) { const o = this.joints[id]; o?.removeFromParent(); R.parent.add(o); }
    this.snapped = {};
    for (const slot of Object.keys(this.owned)) this.takeDown(slot);
    if (this.cradle) { this.cradle.collar.geometry.dispose(); this.cradle.bore.geometry.dispose(); for (const t of this.cradle.tines) t.geometry.dispose(); this.cradle = null; }
    if (this.barrier) { this.barrier.geometry.dispose(); this.barrierMat.dispose(); this.barrier = null; }
    this.cape?.dispose(); this.cape = null;
    if (this.body) { this.group.remove(this.body); this.body = null; }
    this.joints = {}; this.legJoints = []; this.balls = []; this.lastPos = null; this.arms = {}; this.hurt.clear();
  }
  dispose() { this.helm?.dispose(); this.helm = null; this.clear(); this.group.removeFromParent(); for (const m of new Set(Object.values(this.mats))) m.dispose(); }
}

/** The hangar asks here for a mech's body: a parts body, built from its assembly when one is given (frame.js stats, or a selection). */
export function installMechLooks(game) {
  game.makeMechBody = (stats = null, opts = {}) => { const b = new MechPartsBody(game, opts); if (stats) b.build(stats); return b; };
  return game.makeMechBody;
}
