// ---------------------------------------------------------------------------------------
// THE GIANTS (docs/plans/MECHS.md 5.3, 11.2; their numbers Dovina's, progress/mechs/giants.js GIANTS): the proving ground's giant, one
// standing at a time, taken by id: the straw giant, the training body (Pip's biggest try at Strawman stitched on a scaffold, 16 m), or
// the dune colossus (the Dunes' sand risen, 22 m, opened by deeds, called at the giant post). Placeholders of boxes for Calissa to
// dress (giantbodies.js). A hurtable creature (creatures/creatures.js's contract, so the lock-on and the windups' list see it), but what
// hurts it is its own:
//   its BARRIER (rules.js barrierStep): every blow stops on it while it holds; your mech's barrier pressed on it within reach (V held)
//     brings it down for BARRIER.down real s; the big gun's charged beam lands through it at BARRIER.pierce;
//   its STAGGER (rules.js staggerStep): every blow fills it; full, it staggers (blows x2, a heavy one a critical x3, its region broken);
//   its VESSEL (vessel.js FORMS.giant): a blow cracks the region struck; past the break line it is felled, slumps, drops, and stands again.
// It does nothing until it wakes (GIANTS[id].wakes: the straw giant once staggered; the colossus when the mech comes within `wakeAt` m),
// then walks at its speed toward the mech and uses its moves on their timers, each with a windup (listed through the creatures' windup
// machinery, never parried: it strikes the mech, not the Courier) and what lands by its kind (giantmoves.js: melee, ring, hurl, wave).
//
// Its JOINTS (joints.js, MECHS.md 9.3): every blow that lands strains the joints of the region struck; a snapped one takes its part off
// (hidden on the placeholder, thrown off as a limb prop), and its moves go with its arms (the swipe the right arm's, the slam both; the
// colossus's sweep, hurl and wave need an arm, its burrow none).
// Giant wrestling (giantgrapple.js) takes it into the air: `air` (drawn about a point), its mind and windups stopped, `stash`ed far off so
// nothing of the yard collides with it or strikes it; `putDown` gives it its feet again. A burrowing colossus is stashed the same way.
//
// Prior art: Ratchet & Clank's Giant Clank kaiju (a slow body with a few big, readable blows), Shadow of the Colossus (a giant's moves
// read from far off), Evangelion's AT Field (the barrier neutralised at close range), Armored Core 6's stagger, Strawman's family,
// Toribash (joints past a threshold, the limb left in play).
//
//   const S = new Giant(game, id = 'straw')   S.spawn(into, at, yaw)   S.remove()   S.update(dt, mech)   (mech: { pos, radius, pressing, hurt(region, k, by) } or null)
//   S.blow({ weapon, k, stagger, heavy, pierce, region, from? (the striker's place: a body blow from its side lands on that arm), by }) -> { blocked, pierced, staggered, felled, crit }   S.pos   S.awake
//   S.barrier { up, downT }   S.stagger { v, quietT, staggerT }   S.vessel   S.down (real s left down, 0 standing)   S.dispose()   GIANT_LOOK   DOWN_FOR
//   S.joints (joints.js newJoints: strained by every blow, a snapped one's part hidden and handed to S.onLimb(part, at, joint))   GIANT_PARTS   GIANT_JOINTS
//   S.G (the id's row)   S.radius   S.under (burrowed)   S.air (carried: { ctr, pitch })   S.carry(ctr, pitch)   S.putDown(x, y, z)   S.stash() S.unstash(at?)   S.armsK(move)
//   events: giant.wake { id }, giant.windup { id, move, by: 'creature' }, giant.stagger { id }, giant.down { id, weapon, leg }, mech.barrier { neutralised },
//   mech.joint { who: 'giant', joint, to, label, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { tag } from '../../core/tags.js';
import { GIANTS } from '../../progress/mechs/giants.js';
import { makeMats, buildBody } from './giantbodies.js';
import { GiantMoves } from './giantmoves.js';
import { BARRIER, barrierStep, staggerStep, blowMult } from '../../progress/mechs/rules.js';
import { newVessel, blowOn, crackSum, breakLine, REGION_BREAK } from '../../progress/combat/vessel.js';
import { newJoints, strainBlow, past, armOK, legsLeft } from '../../progress/mechs/joints.js';

/** What a snapped joint takes off the giant's placeholder (joints.js JOINTS[].limb, at the straw giant's parts): the part a limb prop is
 *  named by (props.js spawnLimb). The giant has no back unit: its back mount never strains (no blow lands on a `back` region). */
export const GIANT_PARTS = { neck: 'head', shoulderL: 'armL', shoulderR: 'armR', elbowL: 'forearmL', elbowR: 'forearmR', hipL: 'legL', hipR: 'legR' };
/** Joints on the straw giant (MECHS.md 9.3): a body blow from more than `side` rad off its front lands on the arm on that side (the
 *  arm raised to it: Toribash's, you strike what you strike); one arm gone, the slam comes down one-handed at `oneArm`; a leg gone, it
 *  walks at `oneLeg`. */
export const GIANT_JOINTS = { side: 0.7, oneArm: 0.6, oneLeg: 0.3 };

/** Real seconds a felled giant lies before it stands again (the training body's; a wild giant's is Dovina's). */
export const DOWN_FOR = 20;
/** The placeholder: its body's footprint (m, what the mech is kept out of), its turn (rad a real s), how near it stops short of its reach,
 *  and a blow of the Courier's own on foot as a share of a full blow (a giant at a mech's scale barely feels a psygun). */
export const GIANT_LOOK = { radius: 5, turn: 0.8, closeK: 0.75, onFoot: 0.05 };
/** How far a giant taken out of play is stashed (m east, and 500 m down): out of every distance test of the yard. */
const STASH = 4000;
/** The arms' poses through a windup: [right arm's x, left arm's x, right arm's z], each x the windup's progress. */
const ARMS = { swipe: [1.2, 0.3, 0.9], slam: [2.6, 2.6, 0], sweep: [0.4, 0.2, 1.4], hurl: [2.8, 0.5, 0], wave: [1.6, 1.6, 0], burrow: [2.4, 2.4, 0] };
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _rx = new THREE.Vector3(1, 0, 0);
let NEXT = 1;

export class Giant {
  constructor(game, id = 'straw') {
    this.game = game; this.G = GIANTS[id] || GIANTS.straw; this.pos = new THREE.Vector3(); this.yaw = 0; this.c = null; this.group = null;
    this.radius = GIANT_LOOK.radius; this.mats = makeMats(this.G.id); this.geos = [];
    this.moves = new GiantMoves(this); this.sink = 0; this.air = null; this.stashed = null; this.windup = null;
  }
  /** Burrowed: sunk out of sight in a burrow's windup (nothing hits it, nothing collides with it). */
  get under() { return this.sink >= 1 && this.windup?.kind === 'ring'; }
  /** Stashed far off, its true place kept (a burrowed or carried giant). */
  stash() { if (this.stashed) return; this.stashed = this.pos.clone(); this.pos.set(this.stashed.x + STASH, this.stashed.y - 500, this.stashed.z); }
  /** Back to `at` (or where it was stashed). */
  unstash(at = null) { const p = at || this.stashed; this.stashed = null; if (p) this.pos.set(p.x, p.y, p.z); }
  /** Carried by the mech's hands or thrown (giantgrapple.js): drawn lying about `ctr`, its pitch `pitch` rad, its mind stopped. */
  carry(ctr, pitch) { this.air ||= { ctr: new THREE.Vector3(), pitch: 0 }; this.air.ctr.copy(ctr); this.air.pitch = pitch; this.cancel(); this.stash(); }
  /** Set on its feet at (x, y, z), standing: its moves' timers started again. */
  putDown(x, y, z) {
    this.air = null; this.unstash(); this.pos.set(x, y, z); this.sink = 0; this.anim = 0;
    for (const id in this.G.moves) this.timers[id] = Math.max(this.timers[id] ?? 0, this.G.moves[id].every * 0.3);
  }

  /** Stood at `at` facing `yaw` in the group `into` (the proving ground's): its body built, a fresh creature registered. */
  spawn(into, at, yaw) {
    this.home = at.clone(); this.homeYaw = yaw; this.into = into;
    if (!this.group) this.buildBody();
    into.add(this.group);
    this.stand();
  }
  /** Standing again, whole: a new creature each time (the drops watch a creature once: world/drops/creaturedrops.js). */
  stand() {
    this.unregister();
    this.pos.copy(this.home); this.yaw = this.homeYaw;
    this.awake = false; this.down = 0; this.windup = null; this.timers = {}; this.anim = 0; this.lastWeapon = null;
    this.air = null; this.stashed = null; this.sink = 0; this.moves.clear();
    this.barrier = { up: this.G.barrier ? 1 : 0, downT: this.G.barrier ? 0 : Infinity };
    this.stagger = { v: 0, quietT: 0, staggerT: 0 };
    this.vessel = newVessel('giant'); this.joints = newJoints();
    const g = this.game, H = this.G.height, R = this.radius;
    const c = this.c = {
      type: 'creature', kind: 'giant', name: this.G.label, id: `giant.${NEXT++}`, giant: this.G.id, pos: this.pos, radius: R, height: H, alive: true,
      hp: 100, maxHp: 100, poise: 1e6, stunFor: 0, mindRest: 0,
      center: (out) => out.copy(this.pos).setY(this.pos.y + H * 0.55),
      head: () => new THREE.Vector3(this.pos.x, this.pos.y + H + 0.5, this.pos.z),
      hurt: (p, dir, power, cause, by) => { if (by === 'courier') this.blow({ weapon: 'courier', k: (power || 1) * GIANT_LOOK.onFoot, stagger: 0, region: 'body', by }); },
      knock: () => {}, cancel: () => this.cancel(),
    };
    tag(c, 'hurtable', 'creature', this.G.body === 'sand' ? 'sand' : 'straw');
    g.creatures?.add(c);
    this.pose(0);
  }
  unregister() { if (this.c) { this.cancel(); this.game.creatures?.remove(this.c); this.c = null; } }
  remove() { this.unregister(); this.moves.clear(); this.group?.parent?.remove(this.group); }
  dispose() { this.remove(); this.moves.dispose(); for (const g of this.geos) g.dispose(); for (const m of Object.values(this.mats)) m.dispose(); this.group = null; }

  buildBody() { buildBody(this); }

  get barrierHolds() { return this.barrier.downT <= 0; }
  /** A windup broken off (a stagger, an arm gone, a grab, a fall): the creatures' list told, a burrow's ring taken away. */
  cancel() { const W = this.windup; if (W && this.c) this.game.creatures?.unwind?.(this.c, 'cancel'); this.windup = null; if (W) this.moves.abort(W); }
  /** A windup run out: the creatures' list told, nothing else undone (what lands is giantmoves.js's). */
  done() { if (this.windup && this.c) this.game.creatures?.unwind?.(this.c, 'cancel'); this.windup = null; }
  emit(n, p) { this.game.events?.emit(n, { id: this.G.id, ...p }); }

  /** A blow from the mech: stopped by the barrier unless it pierces; else its crack and its stagger, by the rules. */
  blow({ weapon, k, stagger = 0, heavy = false, pierce = false, region = 'body', from = null, by = 'courier' }) {
    if (!this.c?.alive || this.down > 0 || this.under) return { blocked: true };
    const holds = this.barrierHolds;
    if (holds && !pierce) return { blocked: true, pierced: false, staggered: this.stagger.staggerT > 0 };
    if (region === 'body' && from) region = this.sideOf(from);
    const was = this.stagger.staggerT > 0, mult = blowMult(this.stagger, heavy) * (holds ? BARRIER.pierce : 1);
    const r = blowOn(this.vessel, { region, k: k * mult }, 'giant');
    let state = r.state;
    if (was && heavy) state = { form: state.form, crack: { ...state.crack, [region]: Math.max(state.crack[region], REGION_BREAK) } }; // (a critical: its region broken)
    this.vessel = state; this.lastWeapon = weapon; this.c.touched = true;
    this.strain(region, k * mult, by);
    this.c.hp = Math.max(0, Math.round(100 * (1 - crackSum(state) / breakLine('giant'))));
    const s = staggerStep(this.stagger, { dt: 0, add: holds ? stagger * BARRIER.pierce : stagger });
    this.stagger = s;
    if (s.staggered) { this.cancel(); this.emit('giant.stagger', { by }); if (!this.awake && this.G.wakes === 'staggered') this.wake(); }
    const felled = r.shatter || crackSum(state) >= breakLine('giant');
    if (felled) this.fell(by);
    return { blocked: false, pierced: holds, staggered: was, felled, crit: was && heavy };
  }
  /** A body blow from `from`: on the arm on that side when it comes from more than GIANT_JOINTS.side off its front, else the body.
   *  An arm already gone to the shoulder leaves the body to take it. */
  sideOf(from) {
    const a = Math.atan2(from.x - this.pos.x, from.z - this.pos.z), d = Math.atan2(Math.sin(a - this.yaw), Math.cos(a - this.yaw));
    if (Math.abs(d) < GIANT_JOINTS.side || Math.abs(d) > Math.PI - GIANT_JOINTS.side * 0.5) return 'body';
    const side = d > 0 ? 'L' : 'R'; // (yaw's positive turn is toward +x, the giant's left)
    return past(this.joints, `shoulder${side}`) ? 'body' : `arm${side}`;
  }
  /** A blow on a region strains its joints (joints.js strainBlow, Toribash's threshold); each joint that moved said, a snapped one's part
   *  hidden and thrown off as a limb (the hangar hands it to props.js: onLimb). */
  strain(region, k, by) {
    for (const ch of strainBlow(this.joints, region, k, 1)) {
      this.game.events?.emit('mech.joint', { who: 'giant', joint: ch.joint, to: ch.to, label: this.G.label, by });
      const part = GIANT_PARTS[ch.joint]; if (ch.to !== 'snapped' || !part) continue;
      if (/^shoulder/.test(ch.joint) || /^elbow/.test(ch.joint)) this.cancel(); // (its arm gone mid-swing: the windup stops)
      const at = this.partAt(part, new THREE.Vector3());
      this.onLimb?.(part, at, ch.joint);
    }
  }
  /** Where a part of the placeholder stands in the world (before it is hidden). */
  partAt(part, out) {
    const side = part.slice(-1), i = side === 'R' ? 0 : 1;
    this.group.updateMatrixWorld(true);
    if (part.startsWith('arm')) return this.arms[i].getWorldPosition(out).add(_v.set(0, -2, 0));
    if (part.startsWith('forearm')) return this.fore[i].getWorldPosition(out).add(_v.set(0, -3, 0));
    if (part.startsWith('leg')) return this.legs[side].getWorldPosition(out);
    if (part === 'head') return this.head.getWorldPosition(out).add(_v.set(0, 1.7, 0));
    return out.copy(this.pos);
  }

  wake() { this.awake = true; for (const id in this.G.moves) this.timers[id] = this.G.moves[id].every * 0.5; this.emit('giant.wake', { by: 'courier' }); }
  fell(by) {
    this.cancel(); this.down = DOWN_FOR; this.c.alive = false; this.c.hp = 0;
    this.emit('giant.down', { weapon: this.lastWeapon, leg: this.game.hangar?.state?.stats.legType ?? null, by });
  }

  update(dt, mech) {
    if (!this.c) return;
    this.moves.tick(dt, mech); // (a clod in flight, a fan fading, a slow held: whether the giant is up or down)
    if (this.down > 0) { this.down -= dt; this.anim = Math.min(1, this.anim + dt); this.pose(dt); if (this.down <= 0) this.stand(); return; }
    if (this.air) { this.pose(dt); return; } // (carried: no mind, no barrier, no stagger ticking; giantgrapple.js moves it)
    this.anim = Math.max(0, this.anim - dt * 2);
    if (this.sink > 0 && this.windup?.kind !== 'ring') this.sink = Math.max(0, this.sink - dt * 2); // (up out of its burrow in half a real s)
    const d = mech ? Math.hypot(mech.pos.x - this.pos.x, mech.pos.z - this.pos.z) : Infinity;
    // the barrier, pressed by the mech's within reach
    if (!this.awake && this.G.wakes === 'near' && mech && d <= this.G.wakeAt) this.wake(); // (the colossus hears the mech coming)
    const b = barrierStep(this.barrier, { dt, pressing: !!mech?.pressing, near: d <= BARRIER.reach });
    if (b.fell) this.game.events?.emit('mech.barrier', { neutralised: true, giant: this.G.id, by: 'courier' });
    if (b.rose) this.game.events?.emit('mech.barrier', { neutralised: false, giant: this.G.id, by: 'creature' });
    this.barrier = { up: b.up, downT: b.downT };
    this.stagger = staggerStep(this.stagger, { dt });
    if (this.awake && mech && this.stagger.staggerT <= 0) this.act(dt, mech, d);
    this.pose(dt);
  }

  /** Awake: turn to the mech, walk to it, and use each move on its timer, a windup then the blow if the mech is still in reach. */
  act(dt, mech, d) {
    const G = this.G, want = Math.atan2(mech.pos.x - this.pos.x, mech.pos.z - this.pos.z);
    const dy = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
    this.yaw += Math.sign(dy) * Math.min(Math.abs(dy), GIANT_LOOK.turn * dt);
    const gap = d - mech.radius - this.radius;
    const legs = legsLeft(this.joints), legK = legs === 2 ? 1 : legs === 1 ? GIANT_JOINTS.oneLeg : 0; // (a leg gone: it drags itself; none, it stays)
    if (!this.windup && gap > G.reach * GIANT_LOOK.closeK) { _v.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); this.pos.addScaledVector(_v, G.speed * legK * dt); }
    if (this.windup) {
      const W = this.windup; W.t -= dt; this.moves.during(W, dt, mech);
      if (W.t <= 0) { const M = G.moves[W.move]; this.done(); this.moves.land(W, M, mech, d); }
      return;
    }
    for (const id in G.moves) {
      const M = G.moves[id]; this.timers[id] -= dt;
      if (this.timers[id] > 0 || !this.moves.canStart(M, mech, d) || !this.armsK(id)) continue;
      this.timers[id] = M.every;
      const { W, spec } = this.moves.begin(id, M, mech); this.windup = W;
      this.game.creatures?.windup?.(this.c, spec);
      this.emit('giant.windup', { move: id, by: 'creature' });
      break;
    }
  }

  /** What its arms leave of a move (joints.js armOK): the swipe is its right arm's (none without it); the slam both arms', one-handed
   *  at GIANT_JOINTS.oneArm, none with neither. */
  armsK(move) {
    const L = armOK(this.joints, 'L'), R = armOK(this.joints, 'R');
    if (move === 'swipe') return R ? 1 : 0;
    if (move === 'slam') return L && R ? 1 : L || R ? GIANT_JOINTS.oneArm : 0;
    const kind = this.G.moves[move]?.kind; // (the colossus's: a blow, a clod and a cone need an arm; the burrow none)
    return kind === 'melee' || kind === 'hurl' || kind === 'wave' ? (L || R ? 1 : 0) : 1;
  }

  /** The placeholder posed: its arms raised through a windup (both for the slam), a stagger's lean, a felled slump; the barrier shown
   *  while it holds, thinning as it is pressed. */
  pose() {
    if (!this.group) return;
    const R = this.group, H = this.G.height;
    if (this.air) { // (carried or thrown: lying, turned about its middle `air.ctr`)
      _q.setFromAxisAngle(_up, this.yaw).multiply(_q2.setFromAxisAngle(_rx, this.air.pitch)); R.quaternion.copy(_q);
      R.position.copy(this.air.ctr).sub(_v.set(0, H / 2, 0).applyQuaternion(_q));
    } else { R.position.copy(this.pos); R.rotation.set(0, this.yaw, 0); }
    const W = this.windup, k = W ? 1 - W.t / W.of : 0, P = ARMS[W?.move === 'burrow' || W?.kind === 'ring' ? 'burrow' : W?.move] || [0, 0, 0];
    this.arms[0].rotation.x = -k * P[0]; this.arms[1].rotation.x = -k * P[1];
    this.arms[0].rotation.z = W ? k * P[2] : 0;
    this.body.rotation.x = this.anim * 1.25 + (this.stagger.staggerT > 0 ? 0.25 : 0);
    this.body.position.y = -this.anim * 4 - this.sink * (H + 2);
    const J = this.joints; if (J) { for (const [i, s] of [[0, 'R'], [1, 'L']]) { this.arms[i].visible = !past(J, `shoulder${s}`); this.fore[i].visible = !past(J, `elbow${s}`); this.legs[s].visible = !past(J, `hip${s}`); } this.head.visible = !past(J, 'neck'); }
    this.shell.visible = this.barrier.downT <= 0 && this.down <= 0 && !this.under; this.mats.barrier.opacity = 0.06 + 0.22 * this.barrier.up;
  }
}
