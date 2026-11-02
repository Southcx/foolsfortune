// ---------------------------------------------------------------------------------------
// THE STRAW GIANT (docs/plans/MECHS.md 5.3; its numbers Dovina's, progress/mechs/giants.js GIANTS.straw): the proving ground's training
// body, Pip's biggest try at Strawman stitched on a scaffold, 16 m, a placeholder of boxes (a sack body on poles) for Calissa to dress.
// A hurtable creature (creatures/creatures.js's contract, so the lock-on and the windups' list see it), but what hurts it is its own:
//   its BARRIER (rules.js barrierStep): every blow stops on it while it holds; your mech's barrier pressed on it within reach (V held)
//     brings it down for BARRIER.down real s; the big gun's charged beam lands through it at BARRIER.pierce;
//   its STAGGER (rules.js staggerStep): every blow fills it; full, it staggers (blows x2, a heavy one a critical x3, its region broken);
//   its VESSEL (vessel.js FORMS.giant): a blow cracks the region struck; past the break line it is felled, slumps, drops, and stands again.
// It does nothing until staggered once (GIANTS.straw.wakes), then walks at its speed toward the mech and uses its moves on their timers,
// each with a windup (listed through the creatures' windup machinery, never parried: it strikes the mech, not the Courier) and a reach.
//
// Its JOINTS (joints.js, MECHS.md 9.3): every blow that lands strains the joints of the region struck; a snapped one takes its part off
// (hidden on the placeholder, thrown off as a limb prop), and its moves go with its arms (the swipe the right arm's, the slam both).
//
// Prior art: Ratchet & Clank's Giant Clank kaiju (a slow body with a few big, readable blows), Shadow of the Colossus (a giant's moves
// read from far off), Evangelion's AT Field (the barrier neutralised at close range), Armored Core 6's stagger, Strawman's family,
// Toribash (joints past a threshold, the limb left in play).
//
//   const S = new StrawGiant(game)   S.spawn(into)   S.remove()   S.update(dt, mech)   (mech: { pos, radius, pressing, hurt(region, k) } or null)
//   S.blow({ weapon, k, stagger, heavy, pierce, region, from? (the striker's place: a body blow from its side lands on that arm), by }) -> { blocked, pierced, staggered, felled, crit }   S.slow(k, secs)   S.pos   S.awake
//   S.barrier { up, downT }   S.stagger { v, quietT, staggerT }   S.vessel   S.down (real s left down, 0 standing)   S.dispose()   GIANT_LOOK   DOWN_FOR
//   S.joints (joints.js newJoints: strained by every blow, a snapped one's part hidden and handed to S.onLimb(part, at, joint))   GIANT_PARTS   GIANT_JOINTS
//   events: giant.wake { id }, giant.windup { id, move }, giant.stagger { id }, giant.down { id, weapon, leg }, mech.barrier { neutralised },
//   mech.joint { who: 'giant', joint, to, label, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { tag } from '../../core/tags.js';
import { GIANTS } from '../../progress/mechs/giants.js';
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
const C = { sack: 0xc9a46a, straw: 0xe3c66a, wood: 0x6b4a2a, stitch: 0x5a2a1a, barrier: 0xffd36a };
const _v = new THREE.Vector3();
let NEXT = 1;

export class StrawGiant {
  constructor(game) {
    this.game = game; this.G = GIANTS.straw; this.pos = new THREE.Vector3(); this.yaw = 0; this.c = null; this.group = null;
    this.mats = Object.fromEntries(Object.entries(C).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true })]));
    Object.assign(this.mats.barrier, { transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, emissive: new THREE.Color(C.barrier), emissiveIntensity: 0.7 });
    this.geos = [];
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
    this.awake = false; this.down = 0; this.windup = null; this.timers = {}; this.slowT = 0; this.slowK = 1; this.anim = 0; this.lastWeapon = null;
    this.barrier = { up: this.G.barrier ? 1 : 0, downT: this.G.barrier ? 0 : Infinity };
    this.stagger = { v: 0, quietT: 0, staggerT: 0 };
    this.vessel = newVessel('giant'); this.joints = newJoints();
    const g = this.game, H = this.G.height, R = GIANT_LOOK.radius;
    const c = this.c = {
      type: 'creature', kind: 'giant', name: this.G.label, id: `giant.${NEXT++}`, giant: this.G.id, pos: this.pos, radius: R, height: H, alive: true,
      hp: 100, maxHp: 100, poise: 1e6, stunFor: 0, mindRest: 0,
      center: (out) => out.copy(this.pos).setY(this.pos.y + H * 0.55),
      head: () => new THREE.Vector3(this.pos.x, this.pos.y + H + 0.5, this.pos.z),
      hurt: (p, dir, power, cause, by) => { if (by === 'courier') this.blow({ weapon: 'courier', k: (power || 1) * GIANT_LOOK.onFoot, stagger: 0, region: 'body', by }); },
      knock: () => {}, cancel: () => this.cancel(),
    };
    tag(c, 'hurtable', 'creature', 'straw');
    g.creatures?.add(c);
    this.pose(0);
  }
  unregister() { if (this.c) { this.cancel(); this.game.creatures?.remove(this.c); this.c = null; } }
  remove() { this.unregister(); this.group?.parent?.remove(this.group); }
  dispose() { this.remove(); for (const g of this.geos) g.dispose(); for (const m of Object.values(this.mats)) m.dispose(); this.group = null; }

  buildBody() {
    const H = this.G.height, root = this.group = new THREE.Group(); root.name = 'giant.straw';
    const box = (w, h, d, m, x, y, z, into = this.body) => { const g = new THREE.BoxGeometry(w, h, d); this.geos.push(g); const o = new THREE.Mesh(g, this.mats[m]); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; into.add(o); return o; };
    this.body = new THREE.Group(); root.add(this.body);
    for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) box(0.5, H * 0.85, 0.5, 'wood', x, H * 0.425, z); // (the scaffold's poles)
    box(7.2, 0.4, 0.4, 'wood', 0, H * 0.3, 2.1); box(7.2, 0.4, 0.4, 'wood', 0, H * 0.3, -2.1);
    this.legs = {}; for (const s of [-1, 1]) this.legs[s > 0 ? 'L' : 'R'] = box(2.2, 5.2, 2.2, 'sack', s * 1.8, 2.6, 0); // (its sack legs; +x its left: it faces +z)
    box(7, 8, 5, 'sack', 0, 9, 0); // (the sack body)
    box(7.2, 0.3, 5.2, 'stitch', 0, 11, 0);
    this.head = new THREE.Group(); this.head.position.y = H - 3.4; this.body.add(this.head);
    box(4, 3.4, 3.6, 'straw', 0, 1.7, 0, this.head); // (its head, straw bursting)
    box(0.6, 0.6, 0.2, 'stitch', -0.9, 2, 1.85, this.head); box(0.6, 0.6, 0.2, 'stitch', 0.9, 2, 1.85, this.head); // (stitched eyes)
    this.arms = []; this.fore = [];
    for (const s of [-1, 1]) { // (arms[0] its right, arms[1] its left; each an upper arm and, past the elbow, a forearm and its straw fist)
      const p = new THREE.Group(); p.position.set(s * 4.4, 12.4, 0); this.body.add(p); box(1.8, 4, 1.8, 'sack', 0, -2, 0, p);
      const f = new THREE.Group(); f.position.y = -4; p.add(f); box(1.7, 4, 1.7, 'sack', 0, -2, 0, f); box(2.4, 2, 2.4, 'straw', 0, -4.4, 0, f);
      this.arms.push(p); this.fore.push(f);
    }
    const sg = new THREE.SphereGeometry(12, 20, 14); this.geos.push(sg);
    this.shell = new THREE.Mesh(sg, this.mats.barrier); this.shell.position.y = H * 0.5; root.add(this.shell); // (the quilted barrier, a plain shell for now)
  }

  get barrierHolds() { return this.barrier.downT <= 0; }
  slow(k, secs) { this.slowK = Math.min(this.slowK, k); this.slowT = Math.max(this.slowT, secs); }
  cancel() { if (this.windup && this.c) this.game.creatures?.unwind?.(this.c, 'cancel'); this.windup = null; }
  emit(n, p) { this.game.events?.emit(n, { id: this.G.id, ...p }); }

  /** A blow from the mech: stopped by the barrier unless it pierces; else its crack and its stagger, by the rules. */
  blow({ weapon, k, stagger = 0, heavy = false, pierce = false, region = 'body', from = null, by = 'courier' }) {
    if (!this.c?.alive || this.down > 0) return { blocked: true };
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
    if (this.down > 0) { this.down -= dt; this.anim = Math.min(1, this.anim + dt); this.pose(dt); if (this.down <= 0) this.stand(); return; }
    this.anim = Math.max(0, this.anim - dt * 2);
    const d = mech ? Math.hypot(mech.pos.x - this.pos.x, mech.pos.z - this.pos.z) : Infinity;
    // the barrier, pressed by the mech's within reach
    const b = barrierStep(this.barrier, { dt, pressing: !!mech?.pressing, near: d <= BARRIER.reach });
    if (b.fell) this.game.events?.emit('mech.barrier', { neutralised: true, giant: this.G.id, by: 'courier' });
    if (b.rose) this.game.events?.emit('mech.barrier', { neutralised: false, giant: this.G.id, by: 'creature' });
    this.barrier = { up: b.up, downT: b.downT };
    this.stagger = staggerStep(this.stagger, { dt });
    if (this.slowT > 0) { this.slowT -= dt; if (this.slowT <= 0) this.slowK = 1; }
    if (this.awake && mech && this.stagger.staggerT <= 0) this.act(dt, mech, d);
    this.pose(dt);
  }

  /** Awake: turn to the mech, walk to it, and use each move on its timer, a windup then the blow if the mech is still in reach. */
  act(dt, mech, d) {
    const G = this.G, want = Math.atan2(mech.pos.x - this.pos.x, mech.pos.z - this.pos.z);
    const dy = Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw));
    this.yaw += Math.sign(dy) * Math.min(Math.abs(dy), GIANT_LOOK.turn * dt);
    const gap = d - mech.radius - GIANT_LOOK.radius;
    const legs = legsLeft(this.joints), legK = legs === 2 ? 1 : legs === 1 ? GIANT_JOINTS.oneLeg : 0; // (a leg gone: it drags itself; none, it stays)
    if (!this.windup && gap > G.reach * GIANT_LOOK.closeK) { _v.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); this.pos.addScaledVector(_v, G.speed * this.slowK * legK * dt); }
    if (this.windup) {
      const W = this.windup; W.t -= dt;
      if (W.t <= 0) {
        const M = G.moves[W.move]; this.cancel();
        if (d - mech.radius <= M.reach + GIANT_LOOK.radius) mech.hurt(M.region, M.k * this.armsK(W.move), 'creature');
      }
      return;
    }
    for (const id in G.moves) {
      const M = G.moves[id]; this.timers[id] -= dt;
      if (this.timers[id] > 0 || d - mech.radius > M.reach + GIANT_LOOK.radius || !this.armsK(id)) continue;
      this.timers[id] = M.every; this.windup = { move: id, t: M.windup, of: M.windup };
      this.game.creatures?.windup?.(this.c, { at: this.pos, radius: M.reach + GIANT_LOOK.radius, eta: M.windup, kind: id, parry: false, read: false, type: 'impact', answer: M.answer });
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
    return 1;
  }

  /** The placeholder posed: its arms raised through a windup (both for the slam), a stagger's lean, a felled slump; the barrier shown
   *  while it holds, thinning as it is pressed. */
  pose() {
    if (!this.group) return;
    const R = this.group; R.position.copy(this.pos); R.rotation.set(0, this.yaw, 0);
    const W = this.windup, k = W ? 1 - W.t / W.of : 0, slam = W?.move === 'slam';
    this.arms[0].rotation.x = -k * (slam ? 2.6 : 1.2); this.arms[1].rotation.x = -k * (slam ? 2.6 : 0.3);
    this.arms[0].rotation.z = W && !slam ? k * 0.9 : 0;
    this.body.rotation.x = this.anim * 1.25 + (this.stagger.staggerT > 0 ? 0.25 : 0);
    this.body.position.y = -this.anim * 4;
    const J = this.joints; if (J) { for (const [i, s] of [[0, 'R'], [1, 'L']]) { this.arms[i].visible = !past(J, `shoulder${s}`); this.fore[i].visible = !past(J, `elbow${s}`); this.legs[s].visible = !past(J, `hip${s}`); } this.head.visible = !past(J, 'neck'); }
    this.shell.visible = this.barrier.downT <= 0 && this.down <= 0; this.mats.barrier.opacity = 0.06 + 0.22 * this.barrier.up;
  }
}

