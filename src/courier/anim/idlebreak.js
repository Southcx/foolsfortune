// ---------------------------------------------------------------------------------------
// IDLE BREAKS: what the Courier does standing still with nothing in their hands. After a still spell (IDLE.waits, 7 to 12 s, in turn)
// one of the suite's idle breaks plays over the idle: Loco_IdleLookAround, Loco_IdleStretch, Loco_IdleShiftTap, chosen in turn,
// crossfaded in and out. Anything ends it at once (a short fade): a step, a jump, a crouch, a tool drawn, a tech, a fight. While
// game.combat says they are fighting with nothing drawn, the idle itself is Loco_IdleAlert (fists up, the weight back) instead of the
// plain one; a tool drawn keeps its own stance (stances.js), which is what names it across a room.
//
// Prior art: the idle breaks of Uncharted and The Last of Us (a fidget after some still seconds, on no timer the player can see),
// Super Mario 64's look-around, and Monster Hunter's combat idle against its town idle.
//
//   const idles = new IdleBreaks(ch)
//   idles.idle(dt, s, still, out) -> out   the idle layer: the plain or alert idle, a break over it; still: the idle's share of the gait
//   idles.playing                           the break playing, or null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The waits before each break, in turn (s of stillness; no clock the player can learn), the breaks in turn, their fades (s). */
export const IDLE = {
  waits: [9, 7, 12, 8, 11, 10],
  breaks: ['Loco_IdleLookAround', 'Loco_IdleStretch', 'Loco_IdleShiftTap'],
  fadeIn: 0.5, fadeOut: 0.6, cut: 0.15,
  alert: 'Loco_IdleAlert', alertRate: 3, // (1/s: in and out of the fighting stance)
};

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class IdleBreaks {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.stillT = 0; this.n = 0; this.brk = null; this.bt = 0; this.bw = 0; this.cutW = 0;
    this.alertW = 0; this.p = this.C.pose();
  }

  get playing() { return this.brk; }

  /** Nothing is asking anything of the body: still, footed, empty-handed, no tech, no fight. */
  quiet(s, still, fighting) {
    const tk = s.techs, g = tk?.game;
    if (!tk || still < 0.98 || !s.grounded || fighting) return false;
    if ((s.slide || 0) > 0.01 || (s.crouch || 0) > 0.05 || (s.mantle || 0) > 0.01 || (s.dash || 0) > 0.01 || (s.upper || 0) > 0.01 || (s.wall || 0)) return false;
    if (tk.active || tk.override > 0.05) return false;
    return !g?.belt?.others(null);
  }

  idle(dt, s, still, out) {
    const C = this.C, ch = this.ch;
    C.sample('idle', ch.time, out);
    const g = s.techs?.game, armed = !!g?.belt?.others(null), fighting = !!g?.combat?.engaged;
    // the fighting stance, empty-handed
    this.alertW = THREE.MathUtils.damp(this.alertW, fighting && !armed && s.grounded ? 1 : 0, IDLE.alertRate, dt);
    if (this.alertW > 0.001) C.blend(out, C.sample(IDLE.alert, ch.time, this.p), this.alertW);
    // a break, after a still spell
    if (this.quiet(s, still, fighting)) this.stillT += dt;
    else {
      this.stillT = 0;
      if (this.brk) { this.cutW = this.bw; this.brk = null; } // (ended at once: faded over IDLE.cut)
    }
    if (!this.brk && this.stillT > IDLE.waits[this.n % IDLE.waits.length]) {
      this.brk = IDLE.breaks[this.n % IDLE.breaks.length]; this.bt = 0; this.n++;
    }
    if (this.brk) {
      const c = C.clips[this.brk];
      this.bt += dt;
      if (!c || this.bt >= c.dur) { this.brk = null; this.stillT = 0; this.bw = 0; } // (played out: the stillness counts again from here)
      else {
        this.bw = smooth(0, IDLE.fadeIn, this.bt) * (1 - smooth(c.dur - IDLE.fadeOut, c.dur, this.bt));
        C.blend(out, C.sample(this.brk, this.bt, this.p, false), this.bw);
        this.bcut = this.brk; this.bcutT = this.bt;
      }
    } else if (this.cutW > 0.001) {
      // (the break that was ended, fading out where it stopped)
      this.cutW = Math.max(0, this.cutW - dt / IDLE.cut);
      if (this.bcut) C.blend(out, C.sample(this.bcut, this.bcutT, this.p, false), this.cutW);
    }
    return out;
  }
}
