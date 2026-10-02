// A sound bank of the one mixer (audio.js): the Dreamvane, the Crucibelle, the Lockheart (tools/).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class ToolSounds {
  /** A crystal struck or rising: a glassy chime, a fifth above itself, long. */
  chime(v = 1) {
    if (!this.ok() || !this.allow('chime', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.35 * v, 0.9), f = 1320 + Math.random() * 80;
    this.tone(t, 1.6, { f0: f, f1: f * 0.998, gain: 0.3, dest: d });
    this.tone(t + 0.01, 1.1, { f0: f * 1.5, f1: f * 1.497, gain: 0.12, dest: d });
    this.tone(t, 0.5, { f0: f * 2.76, f1: f * 2.75, gain: 0.06, dest: d });
  }

  /** The tuning fork: a pure A that beats very slightly against its own octave, and lasts. */
  fork(v = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3 * v, 0.7);
    this.tone(t, 3.2, { f0: 440, f1: 440, gain: 0.32, dest: d });
    this.tone(t, 2.4, { f0: 441.5, f1: 441.5, gain: 0.14, dest: d });
    this.tone(t, 0.08, { f0: 2600, f1: 1800, type: 'triangle', gain: 0.1, dest: d });
  }

  /** The dowsing tick: faster and higher the nearer the vane is to what it is after (Skyward Sword). */
  dowse(k = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.18 + 0.12 * k, 0.2), f = 520 + 520 * k;
    this.tone(t, 0.09, { f0: f, f1: f * 0.98, type: 'triangle', gain: 0.4, dest: d });
  }

  /** The Lockheart drinking: a wet draw of air, rising with how much it takes. */
  hoover(k = 1) {
    if (!this.ok() || !this.allow('hoover', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.22 * k, 0.4);
    this.noise(t, 0.16, { type: 'bandpass', f0: 500 + 900 * k, f1: 1400 + 900 * k, q: 3, gain: 0.7, dest: d });
  }

  /** The roulette's tick past a pin (lower as it slows). */
  wheelTick(k = 1) {
    if (!this.ok() || !this.allow('wheel', 30)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.2);
    this.tone(t, 0.05, { f0: 1800 * (0.6 + 0.4 * k), f1: 1200, type: 'square', gain: 0.12, dest: d });
  }

  /** A lid on a coffin of brass, a key turned in it. */
  coffin(open = true) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.6);
    this.noise(t, 0.05, { type: 'bandpass', f0: 3200, q: 8, gain: 0.8, dest: d });
    this.tone(t + 0.04, 0.35, { f0: open ? 300 : 500, f1: open ? 520 : 260, type: 'triangle', gain: 0.25, dest: d });
  }
}
