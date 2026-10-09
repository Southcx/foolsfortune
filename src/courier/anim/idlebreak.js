// ---------------------------------------------------------------------------------------
// IDLE BREAKS: what the Courier does standing still with nothing in their hands. They stand in one of the suite's standing idles
// (IDLES: a table of them by their look, the one played marked `default`; the owner's R14, v133: a calm one, hands on the hips, where
// the old Loco_IdleMasc braced the knees and bobbed the head with every breath). After a still spell (IDLE.waits, 7 to 12 s, in turn)
// one of the suite's idle breaks plays over the idle: Loco_IdleLookAround, Loco_IdleStretch, Loco_IdleShiftTap, chosen in turn,
// crossfaded in and out. Anything ends it at once (a short fade): a step, a jump, a crouch, a tool drawn, a tech, a fight. While
// game.combat says they are fighting with nothing drawn, the idle itself is Loco_IdleAlert (fists up, the weight back) instead of the
// plain one; a tool drawn keeps its own stance (stances.js), which is what names it across a room.
//
// Prior art: the idle breaks of Uncharted and The Last of Us (a fidget after some still seconds, on no timer the player can see),
// Super Mario 64's look-around, and Monster Hunter's combat idle against its town idle; the chosen idle stance of a character creator
// (Black Desert's and Monster Hunter World's idle pose pick: one table of stances, one picked, crossfaded on a change).
//
//   const idles = new IdleBreaks(ch)
//   idles.idle(dt, s, still, out) -> out   the idle layer: the plain or alert idle, a break over it; still: the idle's share of the gait
//   idles.playing                           the break playing, or null
//   idles.choose(key) -> bool               stand in another of IDLES (crossfaded over IDLE.swap s); idles.stand: the key standing in
//   idleClip(key = IDLES.default)           the clip a key of IDLES plays (for anything else that stands the Courier idle)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The Courier's standing idles: every standing idle of the suite, by its look; `default` is the one they stand in (one name: a chooser
 *  at the kiln, later, sets it, or idles.choose). Measured in game over 10 real seconds (R14, v133): the chest's speed, its sway; the left
 *  hand's speed, mean and fastest; the loop. All are in core.bin (named here), so a choice needs no fetch. */
export const IDLES = {
  default: 'akimbo',
  clips: {
    akimbo: 'Loco_IdleRelaxedMasc', // (hands on the hips, the weight on one leg, a slow breath: chest 1.7 cm/s; left hand 4.9, at most 10.5; 3.0 s)
    hipCocked: 'Loco_IdleRelaxedFem', // (the left hand on the hip, the right hanging, a hip thrown out: chest 1.6; the right hand flicks at 24 cm/s; 3.0 s)
    handsBehind: 'Loco_IdleC', // (hands clasped behind the back, feet together: the stillest, chest 1.2, but a quick hand move once a loop, 15 to 23 cm/s, where the worn tools hang; 4.0 s)
    armsDown: 'Loco_IdleFem', // (arms at the sides, feet together; the head bobs 10 cm with each breath: chest 3.9; 2.5 s)
    braced: 'Loco_IdleMasc', // (feet wide, knees bent, fists out; the head bobs 10 cm, the left hand flicks at 50 cm/s: chest 3.6; 2.5 s. The default to v133)
    weightShift: 'Loco_IdleD', // (the weight hip to hip, 10 cm; the right hand thrown out once a loop at 2 m/s; 5.0 s)
    restless: 'Loco_IdleE', // (the arms working in front, never still: chest 17 cm/s, hands to 1.2 m/s; 4.0 s)
  },
};
/** The clip a key of IDLES plays. */
export const idleClip = (key = IDLES.default) => IDLES.clips[key] || IDLES.clips[IDLES.default];

/** The waits before each break, in turn (s of stillness; no clock the player can learn), the breaks in turn, their fades (s). */
export const IDLE = {
  waits: [9, 7, 12, 8, 11, 10],
  breaks: ['Loco_IdleLookAround', 'Loco_IdleStretch', 'Loco_IdleShiftTap'],
  fadeIn: 0.5, fadeOut: 0.6, cut: 0.15,
  alert: 'Loco_IdleAlert', alertRate: 3, // (1/s: in and out of the fighting stance)
  swap: 0.4, // (s: one standing idle to another, when one is chosen)
};

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export class IdleBreaks {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.stillT = 0; this.n = 0; this.brk = null; this.bt = 0; this.bw = 0; this.cutW = 0;
    this.alertW = 0; this.p = this.C.pose();
    this.stand = IDLES.default; this.was = null; this.swapW = 0;
  }

  get playing() { return this.brk; }

  /** The clip they stand in (the pack's old `idle` if the suite's is missing: a pack without it still stands). */
  get clip() { const c = idleClip(this.stand); return this.C.clips[c] ? c : 'idle'; }

  /** Stand in another of IDLES, crossfaded from the one before. False for a key the table or the pack lacks. */
  choose(key) {
    const c = IDLES.clips[key];
    if (!c || !this.C.clips[c]) return false;
    if (key !== this.stand) { this.was = this.clip; this.swapW = 1; this.stand = key; }
    return true;
  }

  /** Nothing is asking anything of the body: still, footed, empty-handed, no tech, no fight. */
  quiet(s, still, fighting) {
    const tk = s.techs, g = tk?.game;
    if (!tk || still < 0.98 || !s.grounded || fighting) return false;
    if ((s.slide || 0) > 0.01 || (s.crouch || 0) > 0.05 || (s.mantle || 0) > 0.01 || (s.dash || 0) > 0.01 || (s.upper || 0) > 0.01 || (s.wall || 0)) return false;
    // (a passive tech's hold counts too: a crate carried, a kick of the unarmed V; measured, the breaks had played under a carried crate)
    if (tk.active || tk.override > 0.05 || tk.list?.some((t) => t.passive && t.engaged)) return false;
    return !g?.belt?.others(null);
  }

  idle(dt, s, still, out) {
    const C = this.C, ch = this.ch;
    C.sample(this.clip, ch.time, out);
    if (this.swapW > 0.001) { this.swapW = Math.max(0, this.swapW - dt / IDLE.swap); C.blend(out, C.sample(this.was, ch.time, this.p), smooth(0, 1, this.swapW)); } // (the idle before, fading)
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
