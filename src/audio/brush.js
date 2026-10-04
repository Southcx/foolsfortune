// A sound bank of the one mixer (audio/sfx.js): the Soul Brush (tools/soulbrush/soulbrush.js, brush/).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class BrushSounds {
  /** A heavy swing: a low whoomp of air and the wet hiss of the hair. */
  brushSwing(k = 1) {
    if (!this.ok() || !this.allow('bswing', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.2);
    this.noise(t, 0.28 * k, { type: 'bandpass', f0: 380, f1: 1500, q: 0.8, gain: 0.55, attack: 0.04, dest: d });
    this.noise(t + 0.05, 0.2, { type: 'highpass', f0: 3500, f1: 6000, gain: 0.12, attack: 0.03, dest: d });
  }

  /** The head lands: a thick, padded thud (a wet brush, not a blade). */
  brushHit(k = 1) {
    if (!this.ok() || !this.allow('bhit', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.8, 0.4);
    this.tone(t, 0.18, { f0: 150 + 30 * k, f1: 55, gain: 0.8, dest: d });
    this.noise(t, 0.12, { f0: 1800, f1: 300, gain: 0.6, dest: d });
    this.noise(t + 0.02, 0.2, { type: 'bandpass', f0: 900, f1: 500, q: 2, gain: 0.25, dest: d }); // (the splat)
  }

  brushSlam(power = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.9, 0.7);
    this.tone(t, 0.5, { f0: 90, f1: 32, gain: 0.9 * Math.min(1.3, power), dest: d });
    this.noise(t, 0.35, { f0: 1400, f1: 120, gain: 0.8, dest: d });
    this.noise(t + 0.04, 0.4, { type: 'bandpass', f0: 700, f1: 260, q: 1.5, gain: 0.35, dest: d });
  }

  /** Held up: the hair gathering (a rising breath). */
  brushCharge() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.4);
    this.noise(t, 0.9, { type: 'bandpass', f0: 300, f1: 1400, q: 3, gain: 0.3, attack: 0.3, dest: d });
  }

  /** The paper opens: a soft paper rustle and a low bell. */
  brushIn() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.8);
    this.noise(t, 0.35, { type: 'bandpass', f0: 2500, f1: 1200, q: 0.8, gain: 0.25, attack: 0.05, dest: d });
    this.tone(t, 1.6, { f0: 174, f1: 172, type: 'triangle', gain: 0.25, dest: d });
    this.tone(t, 1.2, { f0: 523, f1: 520, type: 'sine', gain: 0.08, dest: d });
  }

  brushOut() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.6);
    this.noise(t, 0.25, { type: 'bandpass', f0: 1200, f1: 2600, q: 0.8, gain: 0.2, attack: 0.03, dest: d });
  }

  /** Ink meets paper (or slip meets ground): a short soft dab. */
  inkDab(v = 1) {
    if (!this.ok() || !this.allow('dab', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.35 * v, 0.2);
    this.noise(t, 0.07, { type: 'bandpass', f0: 900 + Math.random() * 500, f1: 500, q: 1.2, gain: 0.5, dest: d });
  }

  /** A drawing that means nothing runs off the paper. */
  inkRun() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.5);
    this.noise(t, 0.5, { type: 'lowpass', f0: 1600, f1: 200, gain: 0.3, attack: 0.02, dest: d });
    this.tone(t, 0.4, { f0: 220, f1: 150, type: 'triangle', gain: 0.08, dest: d });
  }

  /** A drawing takes: a struck bell, pitched by what it is. */
  glyphTake(id = 'still') {
    if (!this.ok()) return;
    const P = { still: 880, bounce: 932, mend: 659, ember: 523, gale: 784, bolt: 988, light: 1047, heavy: 440, solace: 698, wash: 587 };
    const f = P[id] || 660, t = this.ctx.currentTime, d = this.out(0.6, 1);
    this.tone(t, 1.3, { f0: f, f1: f * 0.998, type: 'sine', gain: 0.3, dest: d });
    this.tone(t, 0.9, { f0: f * 2.01, f1: f * 2, type: 'triangle', gain: 0.07, dest: d });
  }

  brushMend() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 1);
    [523, 659, 784, 1047].forEach((f, i) => this.tone(t + i * 0.07, 0.8, { f0: f, f1: f, type: 'sine', gain: 0.15, dest: d }));
  }

  /** A lit fuse. */
  fuse() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.noise(t, 1.1, { type: 'highpass', f0: 5000, f1: 3000, gain: 0.25, attack: 0.05, dest: d });
  }

  gale() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.8, 0.6);
    this.noise(t, 1.2, { type: 'bandpass', f0: 300, f1: 1600, q: 0.6, gain: 0.7, attack: 0.15, dest: d });
    this.noise(t + 0.2, 0.9, { type: 'bandpass', f0: 1800, f1: 600, q: 1.5, gain: 0.2, attack: 0.1, dest: d });
  }

  /** A lightning strike: the crack, then the roll. */
  thunder(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.max(0.25, 1 - dist / 60), 0.9);
    this.noise(t, 0.12, { type: 'highpass', f0: 3000, f1: 1500, gain: 0.9, dest: d });
    this.noise(t + 0.05, 1.8, { type: 'lowpass', f0: 600, f1: 60, gain: 0.8, attack: 0.08, dest: d });
    this.tone(t, 0.8, { f0: 70, f1: 30, gain: 0.5, dest: d });
  }

  rise() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.5);
    this.noise(t, 0.45, { type: 'bandpass', f0: 300, f1: 2400, q: 1, gain: 0.5, attack: 0.02, dest: d });
  }

  solace() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 1);
    [587, 740, 880, 740, 988].forEach((f, i) => this.tone(t + i * 0.1, 0.5, { f0: f, f1: f, type: 'triangle', gain: 0.12, dest: d }));
  }
}
