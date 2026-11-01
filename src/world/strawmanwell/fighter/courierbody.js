// ---------------------------------------------------------------------------------------
// THE COURIER AS A FIGHTER (docs/plans/FIGHTER.md 2, 4): the fighter kernel (fighter/kernel.js) laid over the Courier's own body in the
// Arena, a modifier on the core movement and never a change to it (CLAUDE.md, the gold standard). Each fixed step, through the frame's
// hooks (wellframe.js `pre`, `post` and the claim's `step`):
//   the keys      the controls table read from the true keys (fighter/keys.js): the stick from A, D, W and S, Space, LMB, E, RMB, Shift
//                 and R, their fresh presses, a side tapped twice for a dash
//   the kernel    stepped once; where it says 'free' the core movement runs as ever (the walk and run, the air's drift, the double
//                 jump), with the kit's own few knobs set on the instance first: no core jump the kit did not ask for (every ground jump
//                 is the kit's jumpsquat), no coyote time, no slide, no wall run, the run held (Shift, as the core reads it) while the kit
//                 dashes, the facing the kit's; after the core's step the fall held to the build's terminal or its fast fall
//   owned         anything else (hitlag, the shield, a dodge, a grounded move, a launch, the ledge, the grab): the core does not run
//                 that step; the kit sets the velocity and the controller moves the body (`player.move`), or holds it, or sets it
//                 where it hangs
//   back          the body's place and ground read back into the kernel, its landing and its leaving the ground told
//
// Prior art: the frame's own modifiers (wellframe.js: the step wrapped on the instance, the input's Proxy), the techs' contract (an
// owner of the step at a time, the core's state handed back as it was: courier/moves/techs.js); Melee's action-state physics over its
// characters' common movement (the decomp's ftCommon_ApplyPhysics).
//
//   const B = new CourierBody(kit)   B.intent() -> I   B.pre(dt)   B.step(dt) -> true (owned)   B.post(dt)   B.run   B.stats()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../../core/config.js';
import { FIGHTER_BASE } from '../../../progress/movementprofiles.js';

const HOLD_ST = new Set(['hitstun', 'broken']); // (their fall is the kit's own: the launch's speed is not the core's to clamp)

export class CourierBody {
  constructor(kit) { this.kit = kit; this.game = kit.game; this.run = false; this.wasG = true; }
  get P() { return this.game.player; }

  /** The Courier's numbers as a fighter: the build worn (movementprofiles.js: its fighter half; its move half is already T.movement). */
  stats() {
    const M = T.movement, Fi = this.game.movementProfiles?.fighter ?? FIGHTER_BASE;
    return { weight: Fi.weight, terminal: Fi.terminal, fastFall: Fi.fastFall, jumpsquat: Fi.jumpsquat, shortHop: Fi.shortHop, airSpeed: Fi.airSpeed,
      airJumps: M.airJumps, gravity: M.gravity, jumpVelocity: M.jumpVelocity, walkSpeed: M.walkSpeed, sprintSpeed: M.sprintSpeed,
      airAccel: M.airAccel, groundAccel: M.groundAccel, groundDecel: M.groundDecel, airJumpMult: M.airJumpMult };
  }

  /** The controls table from the true keys (FIGHTER.md 2). */
  intent() {
    const K = this.kit.keys, d = (c) => K.down(c), f = (c) => K.fresh(c);
    const x = (d('KeyD') ? 1 : 0) - (d('KeyA') ? 1 : 0), y = (d('KeyW') ? 1 : 0) - (d('KeyS') ? 1 : 0);
    const fA = f('KeyA'), fD = f('KeyD'), fW = f('KeyW'), fS = f('KeyS');
    const I = {
      x, y, jump: d('Space'), jumpP: f('Space'), atkP: f('Mouse0'), smashP: f('KeyE'), smashH: d('KeyE'), specP: f('Mouse2'),
      shieldH: d('ShiftLeft') || d('ShiftRight'), shieldP: f('ShiftLeft') || f('ShiftRight'), grabP: f('KeyR'), downP: fS,
      tapX: fD ? 1 : fA ? -1 : 0, dirP: fA || fD || fW || fS ? [x, y] : null,
    };
    I.mash = !!(I.dirP || I.jumpP || I.atkP || I.specP || I.smashP || I.shieldP);
    return I;
  }

  /** Before the step: the kernel stepped, and the core's knobs set for what it said. */
  pre() {
    const P = this.P, F = this.kit.courier, W = this.kit.well.frame; if (!F) return;
    F.x = P.pos.x; F.y = P.pos.y; F.h = P.height; F.grounded = P.grounded; F.crouch = !!P.crouching;
    if (F.mo.mode === 'free') F.airJumps = P.airJumps;
    this.wasG = P.grounded;
    const I = this.intent(); F.step(I);
    const mo = F.mo;
    // the facing is the kit's (the frame's turn is off while it claims the step)
    W.face = F.face; P.yaw = F.face > 0 ? Math.PI / 2 : -Math.PI / 2;
    // the core's knobs: every jump the kit's, no coyote time, no slide, no wall run; the run held while the kit dashes
    P.jumpBuf = 0; P.landT = 0; P.slideBuf = 0; P.wallCd = Math.max(P.wallCd, 0.2);
    if (!P.grounded) P.coyote = 0;
    P.jumpHeldLast = mo.mode === 'free' && mo.jump === 'air' ? false : true;
    if (mo.jump === 'air') F.fastfall = false;
    this.run = mo.mode === 'free' && !!mo.run;
    if (P.sliding || P.wallrun || P.dashT > 0) P.endCore?.();
    if (mo.kick) { P.vel.x = mo.kick.vx; P.vel.y = mo.kick.vy; P.grounded = false; }
    if (mo.mode !== 'free' && P.techs?.active) P.techs.stop();
  }

  /** The claim's step: true when the kit moved the body itself and the core does not run. */
  step(dt) {
    const P = this.P, F = this.kit.courier, mo = F?.mo; if (!mo || mo.mode === 'free') return false;
    P.prevPos.copy(P.pos);
    for (const k in P.latches) P.latches[k] -= dt;
    P.airT = P.grounded ? 0 : P.airT + dt;
    if (mo.mode === 'hold') { P.vel.set(0, 0, 0); return true; }
    if (mo.mode === 'place') {
      P.pos.set(F.x, F.y, P.pos.z); P.vel.set(0, 0, 0); P.grounded = !!mo.grounded;
      P.body.setNextKinematicTranslation({ x: P.pos.x, y: P.pos.y, z: P.pos.z }); return true;
    }
    P.vel.set(mo.vx ?? F.vx, mo.vy ?? F.vy, 0);
    if (mo.takeoff) P.grounded = false;
    P.move(dt);
    return true;
  }

  /** After the step (the core's or the kit's): the place read back, the fall held, the landing told. */
  post() {
    const P = this.P, F = this.kit.courier; if (!F) return;
    const mo = F.mo, free = mo.mode === 'free';
    if (free && !P.grounded && !HOLD_ST.has(F.st)) { // (the build's terminal speed, or its fast fall: the core has neither)
      if (P.vel.y > 0.5) F.fastfall = false;
      if (F.fastfall) P.vel.y = -F.stats.fastFall; else P.vel.y = Math.max(P.vel.y, -F.stats.terminal);
    }
    F.x = P.pos.x; F.y = P.pos.y; F.h = P.height;
    if (free) { F.vx = P.vel.x; F.vy = P.vel.y; F.airJumps = P.airJumps; }
    if (!free) P.airJumps = F.airJumps; // (a double jump the kit made, carried by a launch: courier/player.js keeps the count)
    if (mo.mode === 'place') { F.grounded = !!mo.grounded; return; }
    if (mo.mode === 'hold') return;
    if (P.grounded && !this.wasG) F.landed();
    else if (!P.grounded && this.wasG && !mo.takeoff && !mo.kick) F.leftGround();
    F.grounded = P.grounded;
    if (F.grounded && F.st === 'idle') F.airJumps = T.movement.airJumps;
  }

  /** Set down (the match's start, a respawn): standing where the kit says, still. */
  setDown(x, y) {
    const P = this.P; P.moveTo(new THREE.Vector3(x, y, P.pos.z), new THREE.Vector3());
    P.grounded = false; P.standUp?.(); this.wasG = false;
  }
}
