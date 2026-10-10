// ---------------------------------------------------------------------------------------
// IDLE BREAKS: what the Courier does standing still with nothing in their hands. They stand in one of their standing idles (IDLES: a
// table of them by their look, the one played marked `default`; the owner's R21, v137: standing straight with the least sway, so
// `upright`, baked at load from the suite's straightest body and its arms-down arms: IDLES.baked). After a still spell (IDLE.waits, 7
// to 12 s, in turn) one of the suite's idle breaks plays over the idle: Loco_IdleLookAround, Loco_IdleStretch, Loco_IdleShiftTap, chosen
// in turn, crossfaded in and out. Anything ends it at once (a short fade): a step, a jump, a crouch, a tool drawn, a tech, a fight. While
// game.combat says they are fighting with nothing drawn, the idle itself is Loco_IdleAlert (fists up, the weight back) instead of the
// plain one; a tool drawn keeps its own stance (stances.js), which is what names it across a room.
//
// THE IDLE UNDER A LAYER. A tool's stance, the gun's aim, a carried crate and the kick's blows are laid over the upper body only
// (character.js MASK_UPPER, the hips not moved): the hips, the legs and the lower spine stay the idle's. Every one of them was made over
// the pack's `idle` (Loco_IdleMasc, the stances' base), so while one is on the idle under it is that one (IDLE.under, crossfaded over
// IDLE.swap and held IDLE.underHold s after): the chosen idle's weight on one leg never tilts a stance (v137: the akimbo idle's hips,
// rolled 8 degrees and 10.6 cm to one side, leaned every tool's stance 9 to 11 degrees; casebook rule 173).
//
// Prior art: the idle breaks of Uncharted and The Last of Us (a fidget after some still seconds, on no timer the player can see),
// Super Mario 64's look-around, and Monster Hunter's combat idle against its town idle (and its weapon drawn: a stance of its own over
// the ready legs, never the town idle's); the chosen idle stance of a character creator (Black Desert's and Monster Hunter World's idle
// pose pick: one table of stances, one picked, crossfaded on a change); Unity's Loop Pose for the baked one's seam (stances.js).
//
//   const idles = new IdleBreaks(ch)
//   idles.idle(dt, s, still, out) -> out   the idle layer: the plain or alert idle, a break over it; still: the idle's share of the gait
//   idles.playing                           the break playing, or null
//   idles.choose(key) -> bool               stand in another of IDLES (crossfaded over IDLE.swap): the one call a chooser makes (the
//                                           kiln's, Petra's: docs/handoffs/petra/2026-10-10-from-calissa-idle-choice.md); idles.stand:
//                                           the key standing in (what the save keeps)
//   idleClip(key = IDLES.default)           the clip a key of IDLES plays (for anything else that stands the Courier idle)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bakeClip } from './stances.js';

const ARMS = '^(upper_arm|forearm|hand|f_|thumb)';
/** The Courier's standing idles: the suite's seven, by their look, and one baked from them; `default` is the one they stand in (one name:
 *  the kiln's chooser sets another, by idles.choose). Measured in game over 10 real seconds, every tool off (v137): the spine's lean to
 *  their left (hips to neck, degrees), the pelvis's roll and the hips' shift off the feet; the chest's speed; the head's sway; the hands'
 *  speed, mean and fastest; the loop. All but the baked one are in core.bin (named here), so a choice needs no fetch. */
export const IDLES = {
  default: 'upright',
  clips: {
    upright: 'idle:upright', // (the default: straight and still, arms at the sides, feet together: lean 0.2, roll 0, shift 0; chest 1.1 cm/s; head 5.8 cm; hands 2.8 and 4.0 cm/s, at most 12; 4.0 s)
    akimbo: 'Loco_IdleRelaxedMasc', // (hands on the hips, the weight on one leg: lean 11.3, roll 8, shift 10.6 cm; chest 1.7; head 6.0; left hand 4.9, at most 10.5; 3.0 s. The default v133 to v137)
    hipCocked: 'Loco_IdleRelaxedFem', // (the left hand on the hip, the right hanging, a hip thrown out: lean -13.6, roll 9.6, shift 9 cm; chest 1.6; the right hand flicks at 24 cm/s; 3.0 s)
    handsBehind: 'Loco_IdleC', // (hands clasped behind the back, feet together: the straightest and stillest body, lean 0.1, roll 0, chest 1.1; but the hands sit on the tools worn at the back and pop at the loop's end, 23 cm/s; 4.0 s)
    armsDown: 'Loco_IdleFem', // (arms at the sides, feet together: lean 4.4, roll 9, shift 8.8 cm; the head bobs 10 cm with each breath, chest 3.9; 2.5 s)
    braced: 'Loco_IdleMasc', // (feet wide, knees bent, fists out: lean 0, roll 0; the head bobs 10 cm, the left hand flicks at 50 cm/s: chest 3.6; 2.5 s. The default to v133, and IDLE.under)
    weightShift: 'Loco_IdleD', // (the weight hip to hip, 10 cm, the lean swinging 7.6 either way; the right hand thrown out once a loop at 2 m/s; 5.0 s)
    restless: 'Loco_IdleE', // (the arms working in front, never still: chest 17 cm/s, hands to 1.2 m/s; 4.0 s)
  },
  /** The idles baked at load (stances.js bakeClip), by their clip names. UPRIGHT: Loco_IdleC's body (the straightest and stillest of the
   *  seven) with Loco_IdleFem's arms hung at the sides, stretched to its loop and their swing halved; its last two frames pop to meet the
   *  first (10.5 degrees at the right shoulder, 1.2 to 1.7 along the spine and head, where its other steps are 0.3), so they are dropped
   *  and the loop closed. `mirror`: those bones taken from the pose mirrored (Character.mirrorPose): Loco_IdleFem's right elbow is bent
   *  30 degrees out and 26 back off its hinge in every frame (hinges.js), its left is clean, so the right arm is the left's mirror. */
  baked: {
    'idle:upright': { base: 'Loco_IdleC', closeLoop: 2, overlay: [['Loco_IdleFem', ARMS]], exaggerate: [0.5, ARMS], mirror: `${ARMS}.*R$` },
  },
  /** What a chooser shows (the kiln's), as docs/plans/CLARITY.md asks of a table: `name` the label, `does` one line, verb first; each a
   *  placeholder for Espada (the player's words are hers). */
  labels: {
    upright: { name: 'Upright', does: 'Stand tall and still, arms at your sides.' },
    akimbo: { name: 'Akimbo', does: 'Stand hands on hips, weight on one leg.' },
    hipCocked: { name: 'Hip Cocked', does: 'Cock a hip, one hand resting on it.' },
    handsBehind: { name: 'At Ease', does: 'Stand at ease, hands clasped behind you.' },
    armsDown: { name: 'Loose', does: 'Stand loose, arms down, breathing deep.' },
    braced: { name: 'Braced', does: 'Brace wide, knees bent, fists ready.' },
    weightShift: { name: 'Shifting', does: 'Rock your weight from hip to hip.' },
    restless: { name: 'Restless', does: 'Fidget, hands never quite settling.' },
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
  swap: 0.4, // (s: one standing idle to another, when one is chosen; the chosen idle to IDLE.under and back)
  under: 'idle', underHold: 1.0, // (the idle under an upper-body layer: the stances' base; held this many s after the layer ends, so a run of blows is not a shuffle of the feet)
};

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

/** The bones a pattern names, in every frame of clip c, taken from that frame mirrored (the other side's, reflected: ch.mirrorPose). */
function mirrorBones(ch, c, pattern) {
  const C = ch.clips, nb = C.nb, re = new RegExp(pattern), a = C.pose(), b = C.pose();
  for (let f = 0; f < c.n; f++) {
    a.q.set(c.q.subarray(f * nb * 4, (f + 1) * nb * 4)); a.p.set(c.p.subarray(f * 3, f * 3 + 3));
    ch.mirrorPose(a, b);
    for (let i = 0; i < nb; i++) if (re.test(C.bones[i])) c.q.set(b.q.subarray(i * 4, i * 4 + 4), (f * nb + i) * 4);
  }
}

export class IdleBreaks {
  constructor(ch) {
    this.ch = ch; this.C = ch.clips;
    this.stillT = 0; this.n = 0; this.brk = null; this.bt = 0; this.bw = 0; this.cutW = 0;
    this.alertW = 0; this.p = this.C.pose();
    this.stand = IDLES.default; this.was = null; this.swapW = 0; this.underW = 0; this.layerT = 9;
    for (const [name, S] of Object.entries(IDLES.baked)) {
      if (this.C.clips[name]) continue;
      const c = bakeClip(this.C, S);
      if (!c) continue;
      this.C.clips[name] = { ...c, name };
      if (S.mirror) mirrorBones(ch, this.C.clips[name], S.mirror);
    }
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
    const g = s.techs?.game, armed = !!g?.belt?.others(null), fighting = !!g?.combat?.engaged;
    C.sample(this.clip, ch.time, out);
    if (this.swapW > 0.001) { this.swapW = Math.max(0, this.swapW - dt / IDLE.swap); C.blend(out, C.sample(this.was, ch.time, this.p), smooth(0, 1, this.swapW)); } // (the idle before, fading)
    // the idle under an upper-body layer: a tool or the gun in the hands, the aim, a passive tech's pose (a crate carried, a blow of the kick)
    this.layerT = armed || (s.upper || 0) > 0.01 || s.techs?.list?.some((t) => t.passive && t.engaged) ? 0 : this.layerT + dt;
    this.underW = THREE.MathUtils.clamp(this.underW + (this.layerT < IDLE.underHold ? dt : -dt) / IDLE.swap, 0, 1);
    if (this.underW > 0.001 && this.clip !== IDLE.under && C.clips[IDLE.under]) C.blend(out, C.sample(IDLE.under, ch.time, this.p), smooth(0, 1, this.underW));
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
