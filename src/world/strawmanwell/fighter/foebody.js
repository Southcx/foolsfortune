// ---------------------------------------------------------------------------------------
// A STRAW FIGHTER (docs/plans/FIGHTER.md 5): one of the Arena's foes, Strawman's dummy (vfx/strawman.js, the Brawl's small doll: its
// look is Calissa's to dress) given the same fighter kernel as the Courier (fighter/kernel.js) and a fighter's mind (fighter/foemind.js).
//   the body     a fighter on the lane's plane, moved by its own plain physics against the stage's own shapes (the Arena hands them
//                over: the main stage's box, the thin platforms dropped through on S): the walk and run, the jumps, the air's drift,
//                gravity to the build's terminal speed or its fast fall, Melee's original numbers (the Courier's original build,
//                movementprofiles.js FIGHTER_BASE and config.js's movement) so a straw fighter is the Courier's equal
//   a creature   tagged hurtable and straw, registered with the creatures (dummy.js's contract, `training`: counted only by the
//                Well's own events); a blow from outside the kit (a shell, a sibling) comes in through `hurt` as a kit hit of its power
//   the look     Strawman's own moves (vfx/strawmanmoves.js) held at their key poses (moves.js FOE_POSES: the lead-in, the strike, the
//                follow-through on the move's own frames), its guard for the shield, a spin for the tumble, flat for a knockdown,
//                frozen and shaken through hitlag, hidden when knocked out
//
// Prior art: the Brawl's straw dummies (world/strawmanwell/dummy.js: the doll, the creature's contract, the tag); Melee's CPU fighters
// (the same character code as a player's, a controller of their own); a plane body against axis boxes (every 2D platformer's).
//
//   const S = new StrawFighter(kit, i, { stage, into })   S.F (the fighter)   S.mind   S.think() -> I   S.move(I)   S.look(dt)   S.show(on)
//   S.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEFAULTS } from '../../../core/config.js';
import { tag } from '../../../core/tags.js';
import { FIGHTER_BASE } from '../../../progress/movementprofiles.js';
import { FRAME } from '../../../progress/platformfighter.js';
import { StrawmanModel } from '../../../vfx/strawman.js';
import { Fighter } from './kernel.js';
import { gravity } from './fighterstate.js';
import { FOE_POSES, FOE_POSE_OF, KIT } from './moves.js';
import { FoeMind } from './foemind.js';

/** The doll's scale (dummy.js's) and its body: 1.35 m tall, a 0.4 m capsule. */
export const STRAW = { scale: 0.55, h: 1.35, r: 0.4 };
let NEXT = 1;

/** The original build's numbers (the Courier's original: config.js DEFAULTS.movement and FIGHTER_BASE): a straw fighter is the
 *  Courier's equal, whichever build the Courier wears. */
export function strawStats() {
  const M = DEFAULTS.movement, Fi = FIGHTER_BASE;
  return { weight: Fi.weight, terminal: Fi.terminal, fastFall: Fi.fastFall, jumpsquat: Fi.jumpsquat, shortHop: Fi.shortHop, airSpeed: Fi.airSpeed,
    airJumps: M.airJumps, gravity: M.gravity, jumpVelocity: M.jumpVelocity, walkSpeed: M.walkSpeed, sprintSpeed: M.sprintSpeed,
    airAccel: M.airAccel, groundAccel: M.groundAccel, groundDecel: M.groundDecel, airJumpMult: M.airJumpMult };
}

export class StrawFighter {
  constructor(kit, i, { stage, into }) {
    this.kit = kit; this.game = kit.game; this.i = i; this.stage = stage; this.into = into;
    this.F = new Fighter({ id: `straw${i + 1}`, team: 1, who: 'foe', stats: strawStats(), h: STRAW.h, r: STRAW.r, env: kit.env });
    this.F.size = STRAW.h;
    const m = this.model = new StrawmanModel(); m.group.scale.setScalar(STRAW.scale); into.add(m.group);
    this.mind = new FoeMind(this, kit);
    this.dropT = 0; this.poseId = null; this.poseF = 0;
    // the creature (dummy.js's contract): hurtable, straw, a training body
    const F = this.F, self = this;
    this.c = {
      type: 'creature', kind: 'dummy', name: 'straw fighter', training: true, id: `fighter${NEXT++}`, model: m, alive: true, radius: STRAW.r, height: STRAW.h,
      pos: new THREE.Vector3(), vel: new THREE.Vector3(), hp: 999, maxHp: 999, poise: 1e9, stunFor: 0, rel: new Map(), fighter: F,
      center: (out) => out.set(F.x, F.y + STRAW.h * 0.55, stage.z), head: () => new THREE.Vector3(F.x, F.y + STRAW.h + 0.25, stage.z),
      hurt: (p, dir, power, cause, by, from) => self.hurt(p, dir, power, cause, by, from),
      knock: () => {}, cancel: () => {}, vanish: () => {},
    };
    tag(this.c, 'hurtable', 'creature', 'straw');
    this.game.creatures?.add(this.c);
  }

  /** A blow from outside the kit (the kit's own come through `from.fighter`, already dealt): a hit of its power (a shot's 1 is 4%). */
  hurt(p, dir, power, cause, by, from) {
    if (from?.fighter) return true;
    const A = by === 'courier' ? this.kit.courier : null;
    this.kit.outside(this.F, A, { move: cause || 'outside', damage: Math.max(1, Math.round(power * 4)), angle: 361, base: 20, growth: 80 });
    return true;
  }

  think() { return this.mind.intent(); }

  /** This frame's motion, as the fighter said (fighter/kernel.js `mo`), against the stage's own shapes. */
  move(I) {
    const F = this.F, mo = F.mo, S = F.stats, wasG = F.grounded;
    if (mo.mode === 'hold') return;
    if (mo.mode === 'place') { F.grounded = !!mo.grounded; return; }
    if (mo.mode === 'free') {
      if (F.grounded) {
        const want = F.crouch ? 0 : I.x * (mo.run ? S.sprintSpeed : S.walkSpeed), acc = (Math.abs(want) > 0.01 ? S.groundAccel : S.groundDecel) * FRAME;
        F.vx += Math.max(-acc, Math.min(acc, want - F.vx)); F.vy = 0;
        if (I.downP && this.onThin() && F.st === 'idle') { this.dropT = 12; F.grounded = false; F.vy = -1; F.leftGround(); }
      } else {
        if (mo.jump === 'air') { F.vy = S.jumpVelocity * S.airJumpMult; F.vx = I.x * S.walkSpeed * S.airSpeed; }
        const want = I.x * S.walkSpeed * S.airSpeed, acc = S.airAccel * FRAME;
        if (Math.abs(F.vx) <= S.walkSpeed * S.airSpeed + 0.01 || Math.sign(want) !== Math.sign(F.vx)) F.vx += Math.max(-acc, Math.min(acc, want - F.vx));
        if (mo.kick) { F.vx = mo.kick.vx; F.vy = mo.kick.vy; } else gravity(F);
      }
    }
    const vx = mo.mode === 'vel' ? mo.vx ?? F.vx : F.vx, vy = mo.mode === 'vel' ? mo.vy ?? F.vy : F.vy;
    this.collide(vx, vy, mo.takeoff || !!mo.kick);
    if (F.grounded && !wasG) F.landed();
    else if (!F.grounded && wasG && !mo.takeoff && !mo.kick) F.leftGround();
  }

  /** The thin platform under the feet, if any. */
  onThin() { const F = this.F; return this.stage.thins.find((T) => F.x >= T.x0 && F.x <= T.x1 && Math.abs(F.y - T.y) < 0.03) || null; }

  /** Moved by (vx, vy) for a frame against the stage's box and its thin platforms (a thin one only from above, and not while dropping). */
  collide(vx, vy, rising) {
    const F = this.F, St = this.stage, r = F.r, h = F.h;
    this.dropT = Math.max(0, this.dropT - 1);
    let nx = F.x + vx * FRAME, ny = F.y + vy * FRAME, ground = false;
    for (const B of St.solids) { // (the stage's sides: a wall)
      if (ny < B.top - 0.05 && ny + h > B.bottom) {
        if (F.x <= B.x0 - r + 0.001 && nx > B.x0 - r) nx = B.x0 - r;
        if (F.x >= B.x1 + r - 0.001 && nx < B.x1 + r) nx = B.x1 + r;
      }
      if (vy > 0 && F.y + h <= B.bottom + 0.001 && ny + h > B.bottom && nx > B.x0 - r && nx < B.x1 + r) { ny = B.bottom - h; F.vy = 0; } // (its underside)
    }
    const tops = St.solids.map((B) => ({ x0: B.x0, x1: B.x1, y: B.top })).concat(this.dropT > 0 ? [] : St.thins);
    if (!rising || vy <= 0) for (const T of tops) {
      if (nx < T.x0 - 0.05 || nx > T.x1 + 0.05) continue;
      if (vy <= 0 && F.y >= T.y - 0.03 && ny <= T.y + 0.001) { ny = T.y; ground = true; }
    }
    F.x = nx; F.y = ny; F.grounded = ground;
    if (ground && F.vy < 0) F.vy = 0;
  }

  /** Each render frame: the doll placed and posed (its key poses, its guard, its spin), its shake through hitlag. */
  look(dt) {
    const F = this.F, m = this.model, z = this.stage.z;
    const out = !F.live; m.group.visible = !out;
    this.c.alive = !out && F.st !== 'respawn'; this.c.pos.set(F.x, F.y, z);
    if (out) return;
    const k = F.hl > 0 && F.launch ? F.hl / Math.max(1, F.hlFull) : 0, s = (F.hl & 1 ? 1 : -1) * k;
    const sx = F.grounded ? KIT.shake[0] * s : 0, sy = F.grounded ? 0 : KIT.shake[1] * s;
    m.group.position.set(F.x + sx, F.y + sy, z);
    m.yawTo = F.face > 0 ? Math.PI / 2 : -Math.PI / 2;
    m.setMode(F.shielding ? 'guard' : 'still');
    // the move's key poses, on the move's own frames (Strawman's moves have no skeleton: their clock is driven to the pose's moment)
    const id = F.st === 'attack' || F.st === 'throw' ? F.m : F.st === 'grab' ? 'grab' : F.st === 'pummel' ? 'pummel' : F.st === 'getup' && F.getup === 'attack' ? 'getupAttack' : F.st === 'ledgeup' && F.upKind === 'attack' ? 'ledgeAttack' : null;
    const P = id ? FOE_POSES[FOE_POSE_OF[id]] : null;
    if (P) {
      const f = F.st === 'attack' ? F.mf : F.f;
      if (this.poseId !== id || f < this.poseF || !m.mv) { m.play(P.move); this.poseId = id; } // (a new move: Strawman's own from its start)
      this.poseF = f;
      if (m.mv) m.mv.t = this.keyTime(F, P) - (F.hl > 0 ? 0 : dt); // (its clock set to the key pose this frame wants)
    } else if (m.playing) { m.breakOff(); this.poseId = null; }
    // the body's attitude for the held states
    const tumble = F.st === 'hitstun' && F.tumble || F.st === 'air' && F.tumble || F.st === 'broken';
    m.group.rotation.z = tumble ? m.group.rotation.z + (F.hl > 0 ? 0 : dt * 11) * -Math.sign(F.kvx || F.vx || 1) : F.st === 'down' ? F.face * 1.45 : F.st === 'ledge' ? F.face * 0.35 : F.st === 'dizzy' ? Math.sin(F.f * 0.2) * 0.3 : 0;
    if (F.st === 'down') m.group.position.y += 0.25;
    m.group.scale.setScalar(STRAW.scale * (F.st === 'spotdodge' || F.st === 'jumpsquat' || F.st === 'land' ? 0.9 : 1));
    m.update(F.hl > 0 ? 0 : dt);
  }
  /** Where Strawman's move stands this frame: the lead-in before the strike, the strike held through the active frames, the follow-through after. */
  keyTime(F, P) {
    const f = F.st === 'attack' ? F.mf : F.f, m = F.move, a0 = m?.active?.[0] ?? 7, a1 = m?.active?.[1] ?? 8;
    return f < a0 ? P.at - 0.25 : f <= a1 ? P.at : P.at + 0.25;
  }
  show(on) { this.model.group.visible = on; }
  dispose() {
    this.game.creatures?.remove(this.c);
    this.model.dispose?.(); this.model.group.parent?.remove(this.model.group);
  }
}
