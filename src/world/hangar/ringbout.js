// ---------------------------------------------------------------------------------------
// A BOUT IN THE BOXING RING (docs/plans/MECHS.md 9.4; South, 2026-11-02: "how about we spice things up with some of the mechanics from Punch-Out!!
// Since ostensibly you're testing against another giant robot opponent"): the runtime of the proving ground's boxing ring. The rules are the
// pure kernel's (progress/mechs/ring.js: newBout, boutStep); this builds the ring, feeds the kernel what was pressed each frame, says
// every one of its events on the bus, poses both frames from it and holds Punch-Out's camera.
//   the ring: a raised square mat at PROVING.at + PROVING.ring (layout.js; { x: 90, z: 130, half: 18 } until it is there), four corner
//     posts, three ropes a side, the gate a gap in the west ropes; merged static boxes with their colliders (the Courier's), and the mech
//     kept out of its square while it walks (as the pilot keeps it out of the blocks);
//   while piloting, F within reach of the gate starts a bout against the offered rival: the next open one of CIRCUIT not yet beaten,
//     else the last beaten (rivalOpen over the ledger; every rival open in the DEBUG save); R there offers the next open one;
//   in the bout the pilot defers to it (mechpilot.js's update asks `take(dt)` first): no walking; A / D tapped dodge, S tapped ducks
//     and held blocks, LMB / RMB punch left / right (W held: to the head), Space the star punch, any punch key while down a mash; X
//     unseals and loses the bout, as does the Jar unsealed by anything else or the area left (`bout.over { winner: 'foe', how: 'ko',
//     forfeit: true }`); over, a beat of 2 real s, then the mech is handed back to the pilot outside the gate, its joints kept (a
//     snapped joint stays snapped: shared with the frame's own, MechState.joints, where it has them; else kept here until the frame is
//     mended at the gantry);
//   the camera: behind and a little above your mech's shoulder, looking square at the rival 12 m off; a short shake on a hit;
//   the readout: both stamina bars, your hearts, your stars as three pips, the round and its clock, the count while someone is down
//     (`mk-bout`, `mk-bt-*` for Calissa's dress); no narration (the log is tracking's: feedback/tracking/mechs.js).
//
// Prior art: Punch-Out!! (NES 1987, Wii 2009: the camera over your shoulder, dodge, duck and block, the tells, hearts, stars and the
// count), Rock 'Em Sock 'Em Robots (the head popped up on its spring), Real Steel's ring at a robot's scale; the house's rooms built
// with the stage kit (world/strawmanwell/stagekit.js) and the free helm's way of holding a body from a cradle (mechpilot.js).
//
//   const R = new RingBout(hangar)   R.build()   R.teardown()   R.take(dt) -> bool (the pilot's: true while the ring holds the mech)
//   R.tick(dt) (the hangar's frame)   R.start(rivalId) -> bool   R.forfeit()   R.active   R.B (the bout)   R.offered (a rival id)
//   R.choices() -> [rival ids open]   R.centre(out)   RING_AT   RING_LOOK   ringOf()
//   game.hangar.bout (the hangar's)   events: bout.enter { rival, label, by }; every kernel event (bout.tell, .strike, .punch, .star,
//   .hearts, .down, .count, .up, .joint, .round, .over) with { rival, label, by: 'courier' }; mech.joint { who: 'mech' | 'rival', joint,
//   from, to, label, by } ('courier' on the rival's, 'creature' on yours); a forfeit's bout.over carries `forfeit: true`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { StageKit } from '../strawmanwell/stagekit.js';
import { label as sign } from '../basement/basement.js';
import { stream } from '../../core/rng.js';
import { newBout, boutStep, RIVALS, CIRCUIT, rivalOpen, PUNCH, STAR, COUNT, RING } from '../../progress/mechs/ring.js';
import { newJoints, headOff, armOK } from '../../progress/mechs/joints.js';
import { outputK } from '../../progress/mechs/rules.js';
import { crackSum } from '../../progress/combat/vessel.js';
import { PROVING } from './layout.js';
import { MECH_BODY, heightOf } from './mech.js';
import { RivalFrame } from './rival.js';

/** The ring's place in the proving ground (local m from PROVING.at) until layout.js has PROVING.ring. */
export const RING_AT = { x: 90, z: 130, half: 18 };
export const ringOf = () => ({ ...RING_AT, ...(PROVING.ring || {}) });
/** The ring's numbers (placeholders for feel, South's to judge): the mat's height, the corner posts', the ropes' heights and thickness,
 *  the gate's width in the west ropes, the gap between the two frames, F's reach to the gate (m, the mech's middle to the gate's
 *  point outside it), the beat held after the bout (real s), Punch-Out's camera (behind, up and to the side as shares of your mech's
 *  height, metres to the side, where it looks on the rival), the shake (real s, m). */
export const RING_LOOK = {
  mat: 1.5, post: 12, ropes: [4.5, 7.5, 10.5], rope: 0.45, gate: 12, gap: 12, reach: 18, out: 9, hold: 2,
  cam: { back: 0.75, up: 1.5, side: 3.4, look: 0.62, ease: 12 }, shake: { t: 0.28, m: 0.7 },
};
const C = { mat: 0x3c5a7a, apron: 0x5a4a3e, edge: 0xe8e0d0, post: 0xb03a2e, postB: 0x3a5ab0, rope: 0xece4d4, gate: 0xd9a441 };
const PART = { shoulderL: 'armL', shoulderR: 'armR', elbowL: 'forearmL', elbowR: 'forearmR', hipL: 'legL', hipR: 'legR', backMount: 'back' };
const RNG = stream('world/hangar/bout');
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _l = new THREE.Vector3(), _p = new THREE.Vector3();

export class RingBout {
  constructor(hangar) {
    this.hangar = hangar; this.game = hangar.game; this.built = false; this.active = false; this.B = null;
    this.rival = new RivalFrame(this.game); this.readout = new RingReadout(this);
    this.offered = null; this.near = false; this.endT = 0; this.shake = 0; this.clock = 0; this.joints = null; this.vesselSeen = null;
    this.anim = null;
  }

  // ------------------------------------------------------------------ the ring's place
  centre(out) { const A = PROVING.at, Rg = ringOf(); return out.set(A.x + Rg.x, A.y + RING_LOOK.mat, A.z + Rg.z); }
  corner(out) { return this.centre(out).add(_c.set(-RING_LOOK.gap / 2, 0, 0)); }
  rivalSpot(out) { return this.centre(out).add(_c.set(RING_LOOK.gap / 2, 0, 0)); }
  /** The gate's point outside the west ropes, where F is in reach and the mech is handed back. */
  gate(out) { const A = PROVING.at, Rg = ringOf(); return out.set(A.x + Rg.x - Rg.half - RING_LOOK.out, A.y, A.z + Rg.z); }

  build() {
    if (this.built || !this.hangar.field?.group) return;
    const g = this.game, Rg = ringOf(), L = RING_LOOK, h = Rg.half, cx = PROVING.at.x + Rg.x, cz = PROVING.at.z + Rg.z, y = PROVING.at.y;
    const room = this.group = new THREE.Group(); room.name = 'boxingRing'; this.hangar.field.group.add(room);
    const K = this.kit = new StageKit(g, room), box = (p, s, c, o) => K.box(p, s, c, o);
    box([cx, y + L.mat / 2 - 0.1, cz], [2 * h + 1.6, L.mat - 0.2, 2 * h + 1.6], C.apron); // (the apron under the canvas)
    box([cx, y + L.mat - 0.05, cz], [2 * h, 0.1, 2 * h], C.mat, { outline: false }); // (the canvas)
    for (const s of [-1, 1]) { box([cx + s * (h + 0.5), y + L.mat - 0.05, cz], [0.6, 0.12, 2 * h + 1.6], C.edge, { collide: false }); box([cx, y + L.mat - 0.05, cz + s * (h + 0.5)], [2 * h + 1.6, 0.12, 0.6], C.edge, { collide: false }); }
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    corners.forEach(([sx, sz], i) => box([cx + sx * h, y + L.mat + L.post / 2, cz + sz * h], [1, L.post, 1], i % 2 ? C.postB : C.post));
    // the ropes: three a side; the west side's broken by the gate
    const gw = L.gate / 2, seg = h - gw;
    for (const ry of L.ropes) {
      const yy = y + L.mat + ry, t = L.rope;
      box([cx, yy, cz - h], [2 * h, t, t], C.rope); box([cx, yy, cz + h], [2 * h, t, t], C.rope); box([cx + h, yy, cz], [t, t, 2 * h], C.rope);
      for (const s of [-1, 1]) box([cx - h, yy, cz + s * (gw + seg / 2)], [t, t, seg], C.rope);
    }
    for (const s of [-1, 1]) box([cx - h, y + L.mat + L.post * 0.45, cz + s * gw], [0.7, L.post * 0.9, 0.7], C.gate); // (the gate's two posts)
    box([cx - h - 3, y + 0.35, cz], [6, 0.7, L.gate], C.apron); // (the step up to the gate)
    sign(room, 'THE BOXING RING', [cx - h - 6, y, cz + gw + 4], { width: 8, sub: 'F to box a rival frame', rotY: -Math.PI / 2 });
    K.finish();
    this.built = true;
    this.offered = this.next();
    this.rival.build(this.offered, room); this.idleRival(0);
  }

  teardown() {
    if (!this.built) return;
    if (this.active) this.forfeit();
    this.readout.hide(); this.rival.dispose(); this.kit?.dispose(); this.group?.parent?.remove(this.group);
    this.group = null; this.kit = null; this.built = false;
  }

  // ------------------------------------------------------------------ the offer
  /** The rivals open to you (CIRCUIT's ladder over the ledger; all in the DEBUG save). */
  choices() { const g = this.game; return CIRCUIT.filter((id) => g.mode === 'debug' || rivalOpen(id, g.ledger)); }
  /** The next: the first open rival not yet beaten, else the last one beaten. */
  next() {
    const L = this.game.ledger, open = this.choices(), won = (id) => (L?.get?.(`mech.bout.won.${id}`) || 0) >= 1;
    return open.find((id) => !won(id)) ?? open.filter(won).pop() ?? CIRCUIT[0];
  }
  atGate(p) { const q = this.gate(_a); return Math.hypot(p.x - q.x, p.z - q.z) < RING_LOOK.reach && Math.abs(p.y - q.y) < 4; }

  /** The pilot's frame asks first (mechpilot.js update): true while the ring holds the mech (a bout, or the F that starts one). */
  take(dt) {
    const M = this.hangar.pilot; if (!this.built || M.mode !== 'pilot') return false;
    if (this.active) { this.update(dt); return true; }
    this.near = M.berserk <= 0 && this.atGate(M.pos); if (!this.near) return false;
    const K = this.keys();
    if (K.pressed('KeyR')) { const ch = this.choices(), i = ch.indexOf(this.offered); this.offered = ch[(i + 1) % ch.length] ?? this.offered; }
    if (!K.pressed('KeyF')) return false;
    this.start(this.offered);
    if (!this.active) this.pilotFrame(dt); // (refused: the F is the ring's, not the cable's; the pilot's frame drawn as it was)
    return true;
  }
  pilotFrame(dt) { const M = this.hangar.pilot, c = this.hangar.cradle; M.pose(); M.seatJar(c); M.holdCourier(c); M.camera(dt); }

  /** A bout begun against a rival: the mech set in its corner, the rival in its own, the pilot deferring. */
  start(id) {
    const g = this.game, M = this.hangar.pilot, R = RIVALS[id];
    if (this.active || !this.built || !R || M.mode !== 'pilot' || g.cradles?.sealed !== this.hangar.cradle) return false;
    const J = this.myJoints();
    if (headOff(J) || (!armOK(J, 'L') && !armOK(J, 'R'))) { g.log?.say('warn', 'Your mech has nothing left to box with. Mend it at the gantry.', { key: 'bout.refuse', throttle: 3 }); return false; }
    const S = M.stats;
    this.B = newBout(id, { punchK: PUNCH.k * (S.punch || 1) * outputK(M.sync), armour: S.armour, seed: (Math.floor(RNG() * 4294967296) >>> 0) || 1, joints: J });
    this.active = true; this.endT = 0; this.shake = 0; this.offered = id;
    this.anim = { arm: { L: 0.5, R: 0.5 }, kneel: 0, lean: 0, side: 0, flinch: 0, down: 0, lunge: 0, lungeMove: null, lungeSide: 'R', foeFlinch: 0, foeHigh: false, foeDown: 0, foeOpen: 0, popMe: null, popFoe: null };
    M.vel.set(0, 0, 0); M.vy = 0; M.assault = false; M.boostT = 0; M.shiftT = -1; M.grounded = true; M.pressing = false;
    this.corner(M.pos); M.yaw = Math.PI / 2; M.camYaw = M.yaw;
    this.rival.build(id, this.group);
    g.events?.emit('bout.enter', { rival: id, label: R.label, by: 'courier' });
    return true;
  }
  /** Your frame's joints: the frame's own where MechState keeps them, else the ring's, mended when the frame is (its cracks all mended). */
  myJoints() {
    const st = this.hangar.state; if (st.joints) return st.joints;
    if (st.vessel !== this.vesselSeen) { if (this.vesselSeen && crackSum(st.vessel) === 0) this.joints = null; this.vesselSeen = st.vessel; }
    return (this.joints ||= newJoints());
  }

  keys() {
    const g = this.game, I = g.input, live = I?.enabled && !g.log?.typing;
    return { down: (k) => !!live && I.rawDown(k), pressed: (k) => !!live && I.rawPressed(k) };
  }
  /** What was pressed this frame, as the kernel's `press`. */
  press() {
    const K = this.keys(), down = this.B.me.state === 'down';
    const punch = K.pressed('Mouse0') ? 'L' : K.pressed('Mouse2') ? 'R' : null, star = K.pressed('Space');
    return { punch: down ? null : punch, high: K.down('KeyW'), dodge: K.pressed('KeyA') ? 'L' : K.pressed('KeyD') ? 'R' : null,
      duck: K.pressed('KeyS'), block: K.down('KeyS') && !K.pressed('KeyS'), star: down ? false : star, mash: down && (!!punch || star), unseal: K.pressed('KeyX') };
  }

  // ------------------------------------------------------------------ the bout's frame
  /** One frame of the bout (from the pilot's update, while sealed): the kernel stepped, its events said, both frames posed, the camera. */
  update(dt) {
    const g = this.game, B = this.B, M = this.hangar.pilot, c = this.hangar.cradle, real = g.rawDt ?? dt;
    this.clock += real;
    if (!B.over) {
      const p = this.press();
      if (p.unseal) { g.cradles?.unseal('x', 'courier'); return; } // (the hangar's tick sees the Jar out and loses the bout)
      for (const e of boutStep(B, dt, p)) this.say(e);
    } else if ((this.endT += real) >= RING_LOOK.hold) { this.handBack(); return; }
    this.animate(dt);
    M.seatJar(c); M.holdCourier(c);
    this.camera(real);
  }

  /** A kernel event said on the bus with the rival and `by`; a joint's also as `mech.joint`; the bodies' reactions started. */
  say(e) {
    const g = this.game, B = this.B, R = B.R, A = this.anim, { type, ...o } = e, base = { rival: B.id, label: R.label, by: 'courier' };
    g.events?.emit(type, { ...o, ...base });
    if (type === 'bout.strike') { A.lunge = 1; A.lungeMove = o.move; A.lungeSide = R.moves[o.move]?.side || 'R'; if (!o.answered) { A.flinch = 1; this.shake = RING_LOOK.shake.t; } else if (o.answered === 'block') this.shake = RING_LOOK.shake.t * 0.4; }
    else if (type === 'bout.punch') { if (o.landed) { A.foeFlinch = 1; A.foeHigh = !!o.high; this.shake = Math.max(this.shake, RING_LOOK.shake.t * (o.star ? 1.4 : 0.5)); } }
    else if (type === 'bout.joint') {
      const who = o.who === 'me' ? 'mech' : 'rival';
      g.events?.emit('mech.joint', { who, joint: o.joint, from: o.from, to: o.to, label: who === 'rival' ? R.label : 'mech', by: who === 'rival' ? 'courier' : 'creature' });
      if (o.to === 'snapped') {
        if (o.joint === 'neck') { if (who === 'rival') A.popFoe = 0; else A.popMe = 0; this.shake = RING_LOOK.shake.t * 1.6; }
        else if (PART[o.joint]) {
          const at = who === 'rival' ? this.rival.partAt(o.joint, new THREE.Vector3()) : this.myPartAt(o.joint, new THREE.Vector3());
          this.hangar.props?.spawnLimb?.({ from: who, part: PART[o.joint], at, label: who === 'rival' ? R.label : 'mech' });
        }
      }
    }
  }

  /** The bout over (its beat held): the mech handed back to the pilot outside the gate, facing away, its joints kept. */
  handBack() {
    const g = this.game, M = this.hangar.pilot, B = this.B;
    this.release();
    const st = this.hangar.state;
    if (st.joints && B && st.joints !== B.me.joints) for (const k in B.me.joints) st.joints[k] = { ...B.me.joints[k] };
    st.dirty?.();
    const sealed = g.cradles?.sealed === this.hangar.cradle;
    if (sealed && M.mode === 'pilot') M.toField(this.gate(new THREE.Vector3()), -Math.PI / 2);
    else if (M.mech) { this.gate(M.pos); M.yaw = -Math.PI / 2; M.pose(); } // (unsealed: it is parked outside the gate, kneeling)
    this.idleRival(0);
  }
  /** The bout lost by leaving it (the Jar unsealed, the area left): said as the kernel would, then handed back. */
  forfeit() {
    const g = this.game, B = this.B; if (!this.active || !B) return;
    if (!B.over) {
      B.over = { winner: 'foe', how: 'ko', rounds: B.round, perfect: false };
      g.events?.emit('bout.over', { ...B.over, forfeit: true, rival: B.id, label: B.R.label, by: 'courier' });
    }
    this.handBack();
  }
  /** What the bout changed on your mech's body put back; the ring lets go of the pilot. */
  release() {
    this.active = false; this.near = false;
    const body = this.hangar.pilot.mech;
    if (body?.headG) { body.headG.position.y = body.hip + MECH_BODY.torso.h; body.headG.rotation.set(0, 0, 0); } // (the body's own pose hides it again past a snapped neck)
    if (this.coil) { this.coil.parent?.remove(this.coil); this.coil.geometry.dispose(); this.coil.material.dispose(); this.coil = null; }
    if (body?.body) body.body.rotation.z = 0;
  }

  /** The hangar's frame: the bout lost if the Jar came out of it, the mech kept out of the ring, the rival idle in its corner, the readout. */
  tick(dt) {
    if (!this.built) { this.readout.hide(); return; }
    const g = this.game, M = this.hangar.pilot, sealed = g.cradles?.sealed === this.hangar.cradle, real = g.rawDt ?? dt;
    if (this.active && !sealed) this.forfeit();
    if (!this.active) {
      this.clock += real;
      if (M.mode === 'pilot' || M.mode === 'parked') this.keepOut(M.pos);
      if (!this.near || !sealed) this.offered = this.choices().includes(this.offered) ? this.offered : this.next();
      if (this.rival.id !== this.offered) this.rival.build(this.offered, this.group);
      this.idleRival(this.clock);
      if (!sealed || M.mode !== 'pilot') this.near = false;
    }
    this.readout.update(real, sealed && M.mode === 'pilot' && (this.active || this.near));
  }
  /** The mech's footprint kept out of the ring's square (the shortest way out), unless it stands over the posts' tops. */
  keepOut(p) {
    const A = PROVING.at, Rg = ringOf(), m = Rg.half + 1 + MECH_BODY.radius, cx = A.x + Rg.x, cz = A.z + Rg.z, dx = p.x - cx, dz = p.z - cz;
    if (Math.abs(dx) >= m || Math.abs(dz) >= m || p.y > A.y + RING_LOOK.mat + RING_LOOK.post) return;
    if (m - Math.abs(dx) < m - Math.abs(dz)) p.x = cx + Math.sign(dx || -1) * m; else p.z = cz + Math.sign(dz || 1) * m;
  }
  idleRival(time) { if (this.rival.root) this.rival.pose({ pos: this.rivalSpot(_p), yaw: -Math.PI / 2, guard: RIVALS[this.rival.id]?.guard || 'both', time }); }

  // ------------------------------------------------------------------ the bodies
  /** Both frames posed from the bout: yours by your state (a dodge's lean and step, the duck's kneel, the block's arms up, a punch's
   *  swing, down on a knee, the head on its coil once the neck snaps), the rival's by its move, its tell and its windup. */
  animate(dt) {
    const B = this.B, A = this.anim, me = B.me, F = B.foe, M = this.hangar.pilot, body = M.mech, real = this.game.rawDt ?? dt;
    const ease = (cur, to, rate) => cur + (to - cur) * Math.min(1, dt * rate);
    // yours
    const env = (left, whole) => Math.sin(Math.PI * Math.max(0, Math.min(1, 1 - left / whole)));
    let armL = 0.55, armR = 0.55, kneel = 0, side = 0, lean = 0;
    if (me.state === 'block') { armL = armR = 1.05; kneel = 0.12; }
    if (me.state === 'dodge') { const k = env(me.t, RING.dodge); side = (me.dodgeSide === 'L' ? 1 : -1) * 3.2 * k; lean = (me.dodgeSide === 'L' ? -1 : 1) * 0.28 * k; }
    if (me.state === 'duck') kneel = 0.6 * env(me.t, RING.duck);
    if (me.state === 'punch') {
      const at = me.starring ? STAR.windup : PUNCH.land, whole = me.starring ? STAR.windup + PUNCH.time : PUNCH.time;
      const k = me.starring ? (me.t < at ? -0.5 * (me.t / at) : 1.25 * (1 - (me.t - at) / (whole - at))) : me.t < at ? me.t / at : 1 - (me.t - at) / (whole - at);
      const sw = 0.55 + (Math.max(-0.5, k) * (me.punchHigh ? 0.75 : 0.5)); if (me.punchSide === 'L') armL = sw; else armR = sw;
    }
    if (me.state === 'down') { kneel = 1; armL = armR = 0.1; }
    A.arm.L = ease(A.arm.L, armL, 22); A.arm.R = ease(A.arm.R, armR, 22); A.kneel = ease(A.kneel, kneel, me.state === 'down' ? 4 : 14);
    A.side = ease(A.side, side, 18); A.lean = ease(A.lean, lean, 18); A.flinch = Math.max(0, A.flinch - real / 0.3);
    const pos = this.corner(_a); _b.set(Math.cos(M.yaw), 0, -Math.sin(M.yaw)); pos.addScaledVector(_b, A.side); // (_b: the mech's left)
    pos.addScaledVector(_c.set(Math.sin(M.yaw), 0, Math.cos(M.yaw)), -1.2 * A.flinch);
    if (body?.body) {
      body.pose({ pos, yaw: M.yaw, gait: 0, walk: 0, kneel: A.kneel, armL: A.arm.L, armR: A.arm.R, sealed: true, barrier: 0, lean: A.lean, joints: me.joints });
      body.body.rotation.x += A.flinch * -0.18 + (me.state === 'down' ? 0.25 : 0);
      this.popHead(body);
      body.group.updateMatrixWorld(true);
    }
    // the rival's
    const m = F.move && B.R.moves[F.move];
    A.lunge = Math.max(0, A.lunge - real / 0.32); A.foeFlinch = Math.max(0, A.foeFlinch - real / 0.28);
    A.foeOpen = ease(A.foeOpen, F.phase === 'open' ? 1 : 0, 10); A.foeDown = ease(A.foeDown, F.state === 'down' ? 1 : 0, F.state === 'down' ? 5 : 2.5);
    if (A.popFoe != null) A.popFoe += real; if (A.popMe != null) A.popMe += real;
    const u = m && F.phase === 'windup' ? Math.min(1, F.t / m.windup) : 0, lunge = Math.min(1, A.lunge * 1.5); // (the strike lands at once: held out a beat, then drawn back)
    this.rival.pose({ pos: this.rivalSpot(_p), yaw: -Math.PI / 2, guard: B.R.guard, move: A.lunge > 0 ? A.lungeMove : F.move, tell: m?.tell || null, side: A.lunge > 0 ? A.lungeSide : m?.side || 'R',
      u, lunge, open: A.foeOpen, taunt: !!F.taunting, flinch: A.foeFlinch, high: A.foeHigh, down: A.foeDown, joints: F.joints, popT: A.popFoe, time: this.clock });
  }
  /** Your frame's head popped up on a coil once its neck snaps in the bout (Rock 'Em Sock 'Em's); the limbs past a snapped joint are
   *  hidden by the body itself (mech.js limbs, from the `joints` handed to its pose). Put back on release. */
  popHead(body) {
    const H = body.headG; if (this.anim.popMe == null || !H) return;
    const t = this.anim.popMe, len = Math.max(0.2, 4.2 * (1 - Math.exp(-t * 9)) + 0.7 * Math.exp(-t * 1.6) * Math.sin(t * 13)), base = body.hip + MECH_BODY.torso.h;
    H.visible = true; H.position.y = base + len; H.rotation.set(0.3 * Math.sin(t * 7) * Math.exp(-t), 0, 0.25 * Math.sin(t * 5.3) * Math.exp(-t * 0.8));
    if (!this.coil) { this.coil = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1, 10), new THREE.MeshStandardMaterial({ color: 0xc8c8c0, roughness: 0.4, metalness: 0.7 })); body.body.add(this.coil); }
    this.coil.position.set(0, base + len / 2, 0); this.coil.scale.set(1, len, 1);
  }
  myPartAt(joint, out) { const body = this.hangar.pilot.mech; return body?.partAt ? body.partAt(PART[joint] || 'head', out) : body?.group.getWorldPosition(out) ?? out; }

  /** Punch-Out's camera: behind and a little above your mech's shoulder, square on the rival; a short shake on a hit. */
  camera(real) {
    const g = this.game, M = this.hangar.pilot, h = heightOf(M.stats), Cm = RING_LOOK.cam, me = this.corner(_a), rv = this.rivalSpot(_b);
    const d = _c.subVectors(rv, me).setY(0).normalize(), right = _l.set(-d.z, 0, d.x);
    const pos = new THREE.Vector3().copy(me).addScaledVector(d, -h * Cm.back).addScaledVector(right, Cm.side); pos.y += h * Cm.up;
    if (this.shake > 0) { const k = (this.shake / RING_LOOK.shake.t) * RING_LOOK.shake.m, t = this.clock; pos.x += Math.sin(t * 61) * k; pos.y += Math.sin(t * 47 + 1) * k; pos.z += Math.sin(t * 73 + 2) * k; this.shake = Math.max(0, this.shake - real); }
    const look = new THREE.Vector3().copy(rv); look.y += h * Cm.look;
    g.cinema?.shot('mech', { pos, look, bars: 0, ease: Cm.ease });
  }
}

// ---------------------------------------------------------------------------------------
// The ring's readout: the System's plain HUD panel (readout.js's style), top middle, while a bout runs or the gate is in reach.
// ---------------------------------------------------------------------------------------
const CSS = `
.mk-bout{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:3;min-width:340px;padding:8px 12px;background:rgba(20,12,8,.72);border:1px solid #c8925e;border-radius:6px;
  color:#f2e2c8;font:12px/1.5 ui-monospace,monospace;pointer-events:none;white-space:pre}
.mk-bout .mk-bt-row{display:flex;justify-content:space-between;gap:14px}
.mk-bout .mk-bt-bar{display:inline-block;width:120px;height:8px;border:1px solid #c8925e;vertical-align:middle;background:rgba(0,0,0,.35)}
.mk-bout .mk-bt-bar i{display:block;height:100%;background:#9fe4ff}
.mk-bout .mk-bt-foe i{background:#ff8a6a}
.mk-bout .mk-bt-low{color:#ff8a6a}.mk-bout .mk-bt-ok{color:#9fe4ff}.mk-bout .mk-bt-gold{color:#ffd36a}
`;
const pct = (v, m) => Math.max(0, Math.min(100, (100 * v) / Math.max(1, m)));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const HOW = { ko: 'KO', tko: 'TKO', head: 'HEAD OFF', arms: 'ARMS OFF', decision: 'DECISION' };

export class RingReadout {
  constructor(ring) { this.ring = ring; this.el = null; this.t = 0; }
  ensure() {
    if (this.el) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.className = 'mk-bout'; this.el.style.display = 'none'; document.body.appendChild(this.el);
  }
  hide() { if (this.el) this.el.style.display = 'none'; }
  update(dt, shown) {
    if (!shown) { this.hide(); return; }
    this.ensure(); this.el.style.display = '';
    if ((this.t -= dt) > 0) return; this.t = 0.08;
    const Rg = this.ring, B = Rg.B;
    if (!Rg.active || !B) {
      const id = Rg.offered, R = RIVALS[id], n = Rg.choices().length;
      this.el.innerHTML = [`THE BOXING RING`, `F  BOX: ${(R?.label || 'rival frame').toUpperCase()}`, n > 1 ? `R  NEXT RIVAL  (${n} open)` : ''].filter(Boolean).join('\n');
      return;
    }
    const me = B.me, F = B.foe, bar = (v, m, foe) => `<span class="mk-bt-bar${foe ? ' mk-bt-foe' : ''}"><i style="width:${pct(v, m).toFixed(1)}%"></i></span>`;
    const stars = Array.from({ length: STAR.max }, (_, i) => (i < me.stars ? '<span class="mk-bt-gold">●</span>' : '○')).join(' ');
    const lines = [
      `<div class="mk-bt-row"><span>${B.R.label.toUpperCase()}</span><span>ROUND ${B.round}  ${clock(Math.max(0, RING.round - B.t))}</span></div>`,
      `<div class="mk-bt-row"><span>YOU   ${bar(me.stamina, me.max)}</span><span>RIVAL ${bar(F.stamina, F.max, true)}</span></div>`,
      `<div class="mk-bt-row"><span>HEARTS <span class="${me.winded ? 'mk-bt-low' : 'mk-bt-ok'}">${me.hearts}</span>${me.winded ? '  WINDED' : ''}</span><span>STARS ${stars}</span></div>`,
    ];
    const down = me.state === 'down' ? me : F.state === 'down' ? F : null;
    if (down && !B.over) lines.push(`<div class="mk-bt-row"><span class="mk-bt-low">${down === me ? 'YOU ARE DOWN' : 'RIVAL DOWN'}</span><span>COUNT ${Math.min(COUNT.out, down.count || 0)}</span></div>`);
    if (B.over) lines.push(`<div class="mk-bt-row"><span class="${B.over.winner === 'me' ? 'mk-bt-gold' : 'mk-bt-low'}">${B.over.winner === 'me' ? 'WIN' : 'LOSS'}</span><span>${HOW[B.over.how] || ''}</span></div>`);
    this.el.innerHTML = lines.join('');
  }
}
