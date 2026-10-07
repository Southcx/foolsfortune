// ---------------------------------------------------------------------------------------
// HELD CLIPS: a held tool's own short clips over its stance (a note's gesture, the Flash, the coffin opened, the busking body's jam), and
// the one crossfade every change of what plays goes through (a move of a string into the next, a gesture cut off by a toll). Built once for
// the bell, the coffin and the book (the Crucibelle, the Lockheart, the Veritome, and the busking body at a busker's mat); the combo
// engine (tools/moveset.js) plays the strings, this plays what is not a blow.
//
//   GESTURES  one clip at a time, played once (or looped) from `from` to `to`, faded in and out against the stance; a new one replaces
//             the old (the crossfade below hides the cut). A GESTURE is a held tool's own clip that is not a blow (docs/GLOSSARY.md)
//   CROSSFADE the pose shown last frame held, and faded into the new one over a tenth of a second: a change of clip never pops, whatever
//             frame it was cut at (inertialization, cheaply: the old pose frozen rather than carried on)
//   STANDLEGS the clip's own legs (its weight, its crouch) while they stand still, the run's while they move
//
// Prior art: Unreal's Animation Montage slots (a clip played once over a slot, its blend in and out), inertialization as Gears of War
// shipped it (David Bollo, GDC 2018: the transition hidden by easing the last pose out, not by playing two clips), and the stand-still
// legs of tools/moveset.js (`legs`), which this generalises to any clip.
//
//   const S = new Gestures(C)   S.play(clip, { from, to, rate, loop, hold, fadeIn, fadeOut })   S.stop(fade)   S.update(dt)   S.sample(out) -> w
//   (hold: a clip played once that stays on its last frame until it is replaced or stopped)
//   S.clip   S.t   S.playing   S.fresh (true the frame after a play: cut the crossfade)
//   const X = new Crossfade(C)   X.cut(dur)   X.apply(out, dt)   X.reset()          (call apply every frame the layer is shown)
//   standLegs(ch, P, base, pose, w, st, dt)   (st: a little object of its own, kept by the caller, for the legs' weight)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export class Gestures {
  constructor(C) { this.C = C; this.e = null; this.fresh = false; }
  get playing() { return !!this.e && !this.e.end; }
  get clip() { return this.e?.clip ?? null; }
  get t() { return this.e?.t ?? 0; }
  /** Play `clip` (false if there is no such clip). */
  play(clip, { from = 0, to = null, rate = 1, loop = false, hold = false, fadeIn = 0.08, fadeOut = 0.2 } = {}) {
    const c = this.C.clips[clip];
    if (!c) return false;
    this.e = { clip, t: from, to: to ?? c.dur, rate, loop, hold, fadeIn, fadeOut, env: this.e ? 1 : 0, end: false }; // (from another gesture: the crossfade carries it)
    this.fresh = true;
    return true;
  }
  stop(fade = 0.15) { const e = this.e; if (e && !e.end) { e.end = true; e.fadeOut = Math.min(e.fadeOut, fade); } }
  update(dt) {
    const e = this.e; if (!e) return;
    e.t += dt * e.rate;
    if (e.hold) e.t = Math.min(e.t, e.to);
    else if (!e.loop && e.t >= e.to - e.fadeOut * e.rate) e.end = true;
    e.env = e.end ? e.env - dt / Math.max(1e-3, e.fadeOut) : Math.min(1, e.env + dt / Math.max(1e-3, e.fadeIn));
    if (e.end && e.env <= 0) this.e = null;
  }
  /** The gesture's pose into `out`; its weight over the stance (0: nothing plays). */
  sample(out) {
    const e = this.e; if (!e) return 0;
    this.C.sample(e.clip, e.loop ? e.t : Math.min(e.t, e.to), out, e.loop);
    return sm(e.env);
  }
}

export class Crossfade {
  constructor(C, dur = 0.1) { this.C = C; this.dur = dur; this.d = dur; this.held = C.pose(); this.last = C.pose(); this.x = 1; this.has = false; }
  /** What plays has changed: the last pose shown is held and eased out over `dur`. */
  cut(dur = this.dur) { if (!this.has) return; this.held.copy(this.last); this.x = 0; this.d = Math.max(1e-3, dur); }
  /** Once a frame, on the finished layer: eased from the held pose, and kept as the last shown. */
  apply(out, dt) {
    if (this.x < 1) { this.x = Math.min(1, this.x + dt / this.d); this.C.blend(out, this.held, 1 - sm(this.x)); }
    this.last.copy(out); this.has = true;
    return out;
  }
  /** The layer was not shown (the tool put away): nothing to fade from next time. */
  reset() { this.has = false; this.x = 1; }
}

let LOWER = null;
/** The legs of `pose` (its crouch, its weight, the hips' height) over the base while they stand still, the run's legs while they move. */
export function standLegs(ch, P, base, pose, w, st, dt = 1 / 60) {
  const want = pose && P.grounded ? 1 - THREE.MathUtils.smoothstep(Math.hypot(P.vel.x, P.vel.z), 0.3, 1.6) : 0;
  st.legW = THREE.MathUtils.damp(st.legW || 0, want, want > (st.legW || 0) ? 12 : 8, dt);
  if (st.legW < 0.01 || !pose) return;
  const C = ch.clips;
  if (!LOWER || LOWER.length !== C.nb) LOWER = Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
  C.blend(base, pose, st.legW * w, LOWER, 1);
}
