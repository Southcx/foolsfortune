// ---------------------------------------------------------------------------------------
// TIME: one place that decides how fast the game runs, so that anything that wants the world to slow, stop or stretch asks here and
// nothing else touches `dt`. Blade mode (the Sondelass), a hit-stop on a heavy cut, a parry's held breath, the moment a chest
// opens, a hook set on a big fish: each is a request; the lowest scale wins, and the world eases into it and out of it.
//
// Prior art, and what was taken:
//  - Metal Gear Rising: Revengeance's Blade Mode and Bayonetta's Witch Time: the world slows to a crawl while the player's own
//    input does not, so time is scaled for the simulation and the player's blade is read in real seconds (`game.rawDt`).
//  - Hit-stop / hit-lag as fighting games and Devil May Cry do it: a few frames of nearly nothing on the moment of contact,
//    which is most of what makes a hit feel heavy. That is a `pulse`, short and sharp, and the way out is eased.
//  - The audio follows: a low-pass on the master bus closes as time slows (sfx.setSlow), the way it is done in every game that
//    slows time and is not embarrassed by the sound.
//
//   game.time.slow('blade', 0.06)          hold a slowdown (call each frame it should stay, or free() it)
//   game.time.free('blade')
//   game.time.pulse('hit', 0.04, 0.07)     scale 0.04 for 70 ms of real time, then eased back
//   game.time.scale                        the current scale;  game.rawDt is the frame in real seconds
// ---------------------------------------------------------------------------------------
import { sfx } from './audio.js';

export class TimeScale {
  constructor(game) {
    this.game = game;
    this.holds = new Map();
    this.pulses = [];
    this.scale = 1;
  }

  slow(id, scale, { rate = 0 } = {}) { this.holds.set(id, { scale, rate }); }
  free(id) { this.holds.delete(id); }
  has(id) { return this.holds.has(id); }

  pulse(id, scale, dur, { release = 0.16 } = {}) {
    const p = this.pulses.find((q) => q.id === id);
    if (p) { p.scale = Math.min(p.scale, scale); p.t = Math.max(p.t, 0); p.dur = Math.max(p.dur, dur); return; }
    this.pulses.push({ id, scale, t: 0, dur, release });
  }

  /** The multiplier for this frame's simulation time. `raw` is the frame in real seconds. */
  update(raw) {
    let target = 1;
    for (const h of this.holds.values()) target = Math.min(target, h.scale);
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.t += raw;
      if (p.t >= p.dur + p.release) { this.pulses.splice(i, 1); continue; }
      const s = p.t < p.dur ? p.scale : p.scale + (1 - p.scale) * ((p.t - p.dur) / p.release);
      target = Math.min(target, s);
    }
    // in fast (a hit lands: no eased approach), out slower
    const rate = target < this.scale ? 70 : 9;
    this.scale += (target - this.scale) * Math.min(1, rate * raw);
    if (Math.abs(this.scale - target) < 0.004) this.scale = target;
    sfx.setSlow?.(this.scale);
    return this.scale;
  }
}
