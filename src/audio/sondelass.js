// A sound bank of the one mixer (audio.js): the Sondelass (sondelass/): the cutlass, blade mode and zandatsu, the grapnel and its line.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class SondelassSounds {
  /** Steel drawn from the back: a short rasp and a ring. */
  toolDraw() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.4);
    this.noise(t, 0.22, { type: 'bandpass', f0: 2500, f1: 6000, q: 2, gain: 0.5, attack: 0.04, dest: d });
    this.tone(t + 0.12, 0.5, { f0: 1760, f1: 1740, type: 'triangle', gain: 0.1, dest: d });
  }

  /** The telescoping sections sliding out or in (a run of small ratchet ticks). */
  telescope(out = true) {
    if (!this.ok() || !this.allow('scope', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.2);
    for (let i = 0; i < 4; i++) this.tone(t + i * 0.045, 0.05, { f0: out ? 900 + i * 220 : 1600 - i * 220, type: 'square', gain: 0.07, dest: d });
  }

  /** A cutlass stroke: air, then steel; heavy is lower and longer. */
  slash(heavy = false) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(heavy ? 0.7 : 0.5, 0.35);
    this.noise(t, heavy ? 0.32 : 0.2, { type: 'bandpass', f0: 700, f1: 3800, q: 0.9, gain: 0.8, attack: 0.05, dest: d });
    this.tone(t, heavy ? 0.3 : 0.18, { f0: heavy ? 180 : 320, f1: 90, type: 'sawtooth', gain: 0.1, dest: d });
  }

  /** The blade meeting something. */
  cutHit(k = 1) {
    if (!this.ok() || !this.allow('cuthit', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.5);
    this.tone(t, 0.3, { f0: 1100 + 200 * k, f1: 1000, type: 'triangle', gain: 0.3, dest: d });
    this.noise(t, 0.09, { f0: 5000, f1: 1400, gain: 0.7, dest: d });
    this.tone(t, 0.12, { f0: 200, f1: 70, gain: 0.6, dest: d });
  }

  /** The grapnel leaving the tip. */
  hookFire() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.55, 0.3);
    this.tone(t, 0.12, { f0: 220, f1: 1400, type: 'sawtooth', gain: 0.14, dest: d });
    this.noise(t, 0.16, { type: 'highpass', f0: 3000, f1: 8000, gain: 0.6, attack: 0.01, dest: d });
  }

  /** The grapnel biting into something: a thock and a ring of the chain. */
  hookLatch() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.4);
    this.tone(t, 0.14, { f0: 160, f1: 60, gain: 0.8, dest: d });
    this.tone(t, 0.4, { f0: 2400, f1: 2380, type: 'triangle', gain: 0.15, dest: d });
    this.noise(t, 0.06, { f0: 3500, f1: 1200, gain: 0.6, dest: d });
  }

  /** The line let go: a snap of slack and the grapnel's chain rattling home. */
  hookRelease() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.noise(t, 0.09, { type: 'bandpass', f0: 2600, f1: 900, q: 1.2, gain: 0.5, attack: 0.004, dest: d });
    this.tone(t + 0.02, 0.18, { f0: 900, f1: 260, type: 'triangle', gain: 0.1, dest: d });
  }

  /** The Stinger: a whip of air and a thin ring of steel, going out. */
  stinger() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.25);
    this.noise(t, 0.26, { type: 'bandpass', f0: 700, f1: 7000, q: 0.9, gain: 0.7, attack: 0.01, dest: d });
    this.tone(t, 0.22, { f0: 260, f1: 1900, type: 'sawtooth', gain: 0.12, dest: d });
    this.tone(t + 0.06, 0.5, { f0: 3100, f1: 3060, type: 'triangle', gain: 0.1, dest: d });
  }

  /** Blade mode: the world lets its breath out (a low swell and a thin ring). */
  bladeIn() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.8, 0.5);
    this.tone(t, 0.55, { f0: 110, f1: 38, gain: 0.7, dest: d });
    this.noise(t, 0.5, { type: 'lowpass', f0: 900, f1: 120, gain: 0.5, attack: 0.02, dest: d });
    this.tone(t + 0.02, 0.9, { f0: 2600, f1: 2580, type: 'triangle', gain: 0.08, dest: d });
  }

  /** ... and takes it back. */
  bladeOut() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.3);
    this.tone(t, 0.25, { f0: 60, f1: 260, gain: 0.5, dest: d });
    this.noise(t, 0.22, { type: 'highpass', f0: 800, f1: 4000, gain: 0.35, attack: 0.03, dest: d });
  }

  /** Zandatsu: a boom, three cuts of glass, and a chime that hangs. */
  zandatsu() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(1.0, 0.7);
    this.tone(t, 0.9, { f0: 62, f1: 30, gain: 0.9, dest: d });
    this.noise(t, 0.1, { type: 'bandpass', f0: 2400, f1: 900, q: 0.8, gain: 0.9, dest: d });
    for (let i = 0; i < 3; i++) this.noise(t + 0.07 * i, 0.09, { type: 'highpass', f0: 3000, f1: 8000, gain: 0.7, attack: 0.002, dest: d });
    [2093, 2637, 3136, 4186].forEach((f, i) => this.tone(t + 0.22 + i * 0.05, 1.3, { f0: f, f1: f * 0.998, type: 'triangle', gain: 0.1, dest: d }));
  }

  /** The blade coming up to guard: a short shing. */
  guardUp() {
    if (!this.ok() || !this.allow('guardUp', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.noise(t, 0.09, { type: 'highpass', f0: 4200, f1: 7000, gain: 0.5, attack: 0.004, dest: d });
    this.tone(t, 0.2, { f0: 1900, f1: 2100, type: 'triangle', gain: 0.07, dest: d });
  }

  /** Something turned aside on the blade. */
  guardBlock() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.3);
    this.tone(t, 0.14, { f0: 1300, f1: 880, type: 'square', gain: 0.1, dest: d });
    this.noise(t, 0.07, { type: 'bandpass', f0: 3200, f1: 2000, q: 1.5, gain: 0.7, attack: 0.002, dest: d });
    this.tone(t, 0.5, { f0: 2350, f1: 2320, type: 'triangle', gain: 0.09, dest: d });
  }

  /** Being drawn along the line (a rising whine, called each frame; rate limited). */
  zipWhine(v = 1) {
    if (!this.ok() || !this.allow('zip', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.1);
    this.tone(t, 0.1, { f0: 300 + 500 * v, f1: 340 + 520 * v, type: 'sawtooth', gain: 0.06, dest: d });
  }
}
