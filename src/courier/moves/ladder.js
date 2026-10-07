// Ladders: walk (or jump) into one and you're on it. W / S climb (Shift faster), C slides down,
// Space kicks off backwards, and climbing past the top steps off onto whatever's up there.
// The body plays the authored `ladderUp` cycle (authored.js): two rungs of climbing per cycle,
// hands and feet a half-cycle apart, driven by the height climbed rather than by time, so the
// limbs in stance stay on their rungs and going down is the same cycle in reverse. Stopped, the
// body settles onto the nearest height where all four limbs hold a rung. The gun stays out at a
// walk (the right arm aims it, one-handed; the left keeps climbing).
import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { LADDER } from '../anim/authored.js';

const TAU = 0.05; // the phases where all four limbs hold: 0.05 and 0.55 of a cycle

export class Ladder extends Tech {
  constructor(mgr) {
    super(mgr, 'ladder');
    this.overrides = 1;
    this.blendIn = 14;
    this.rushing = false; // (fast climbs and slides take both hands; the gun goes away, and comes back)
    this.cool = 0;
    this.slideW = 0;
    this.vy = 0;
  }

  get ladders() { return this.game.ladders; }
  get handsBusy() { return this.rushing; }
  get oneHand() { return true; } // (a hand on the rungs: only the gun comes out, tools/belt.js mayDraw)
  /** How the aim layer behaves here: only the gun arm aims, and the torso hardly turns from the ladder. */
  get aim() { return { arm: 'R', turn: 0.3 }; }

  tick(dt) { this.cool -= dt; }

  canStart() {
    const P = this.P;
    if (this.cool > 0 || !this.ladders || P.mantle) return false;
    const l = this.ladders.near(P.pos);
    if (!l) return false;
    // pressing into it (on the ground), or touching it in the air
    const wish = P.wishDir();
    const into = -(wish.x * l.n.x + wish.z * l.n.z);
    if (into < 0.5 && (P.grounded || into < 0)) return false;
    this.l = l;
    return true;
  }

  /** The body height at which the climb cycle is at phase 0 (a left-hand rung grip). */
  yAlign() { return this.l.y0 + this.cfg.rung - LADDER.handTop; }

  phase(y) { const c = 2 * this.cfg.rung; return ((((y - this.yAlign()) / c) % 1) + 1) % 1; }

  start() {
    const P = this.P;
    for (const t of this.game.belt?.tools || []) if (t.id !== 'psygun' && t.wants) t.stow(); // (a hand on the rungs: only the gun arm is free, so the other tools go away, SWEEPS group 8)
    P.endCore();
    P.setShape('stand');
    P.vel.set(0, 0, 0);
    this.snap = 0;
    this.vy = 0;
    this.slideW = 0;
    this.moving = 0;
    sfx.rung();
  }

  update(dt) {
    const P = this.P, c = this.cfg, l = this.l, inp = P.input, M = T.movement;
    // kick off, back the way you came (a little toward where you look)
    if (P.latch('Space')) {
      const look = P.lookDir();
      const out = l.n.clone().multiplyScalar(c.kickOut).addScaledVector(new THREE.Vector3(look.x, 0, look.z), 1.5);
      P.vel.set(out.x, c.kickUp, out.z);
      P.grounded = false;
      this.cool = 0.4;
      this.rushing = false;
      sfx.airJump();
      return false;
    }
    const iz = (inp.isDown('KeyW') ? 1 : 0) - (inp.isDown('KeyS') ? 1 : 0);
    const fast = inp.isDown('ShiftLeft') || inp.isDown('ShiftRight');
    let vy = iz * (fast ? c.fast : c.speed);
    const sliding = inp.isDown('KeyC');
    if (sliding) vy = -c.slide;
    this.rushing = sliding || (iz !== 0 && fast);
    if (iz === 0 && !sliding) {
      // settle onto the nearest height where every limb holds a rung
      const p = c.rung, y = P.pos.y - this.yAlign();
      const rest = (Math.round((y - TAU * 2 * p) / p)) * p + TAU * 2 * p;
      vy = THREE.MathUtils.clamp((rest - y) * 9, -1.2, 1.2);
    }
    this.vy = THREE.MathUtils.damp(this.vy, vy, sliding ? 5 : 14, dt);
    // hold the ladder line
    const want = new THREE.Vector3(l.x, 0, l.z).addScaledVector(l.n, LADDER.standoff);
    // set down away from it (a rescue, a teleport): a ladder out of reach is not held, never hauled back to at speed
    if (Math.hypot(want.x - P.pos.x, want.z - P.pos.z) > 1.5) { this.cool = 0.2; this.rushing = false; return false; }
    this.snap = Math.min(1, this.snap + dt * 8);
    P.vel.set((want.x - P.pos.x) * 12 * this.snap, this.vy, (want.z - P.pos.z) * 12 * this.snap);
    P.move(dt);
    P.bodyYaw = Math.atan2(-l.n.x, -l.n.z);
    this.sliding = sliding;
    // off the top: step over onto the platform
    if (iz > 0 && P.pos.y > l.y1 - 1.05) {
      const to = new THREE.Vector3(l.x, l.y1 + 0.02, l.z).addScaledVector(l.n, -0.55);
      if (P.fits(to, true)) {
        P.mantle = { from: P.pos.clone(), to, t: 0, dur: M.mantleTime * 1.1, exit: 1.5, edge: new THREE.Vector3(l.x, l.y1, l.z), right: new THREE.Vector3(l.n.z, 0, -l.n.x) };
        P.bodyYaw = Math.atan2(-l.n.x, -l.n.z);
        this.rushing = false;
        sfx.mantle();
        return false;
      }
    }
    // off the bottom
    if (iz < 0 && P.grounded) { this.cool = 0.3; this.rushing = false; return false; }
    if (this.vy < 0 && P.grounded && sliding) { this.cool = 0.3; this.rushing = false; return false; }
    return true;
  }

  end() { this.rushing = false; this.sliding = false; }

  faceYaw() { return Math.atan2(-this.l.n.x, -this.l.n.z); }

  // ---- animation: the authored cycle, by height climbed ----
  animate(ch, base, dt) {
    const C = ch.clips, P = this.P;
    const up = C.clips.ladderUp;
    const ph = this.phase(P.renderPos.y);
    this.slideW = THREE.MathUtils.damp(this.slideW, this.active && this.sliding ? 1 : 0, 10, dt);
    const pose = C.sample('ladderUp', ph * up.dur, ch.P.tmp, true);
    if (this.slideW > 0.001) C.blend(pose, C.sample('ladderSlide', ch.time, ch.P.tmp2), this.slideW);
    C.blend(base, pose, this.w);
  }

  label() { return 'LADDER'; }
}
