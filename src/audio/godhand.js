// A sound bank of the one mixer (audio.js): caster shells and the God Hand.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class GodHandSounds {
  /** One step of the groove: a kick on the beat, a hat between, a bass note that walks. */
  beat(n) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.55, 0.3);
    const step = n % 8;
    this.tone(t, 0.16, { f0: 150, f1: 42, gain: 0.9, dest: d });
    this.noise(t + 0.23, 0.05, { type: 'highpass', f0: 8000, f1: 6000, gain: 0.35, dest: d });
    const scale = [110, 110, 138.6, 110, 164.8, 138.6, 123.5, 146.8];
    this.tone(t, 0.24, { f0: scale[step], f1: scale[step], type: 'sawtooth', gain: 0.16, dest: d });
    if (step % 4 === 2) this.tone(t + 0.12, 0.3, { f0: scale[step] * 4, f1: scale[step] * 4, type: 'square', gain: 0.05, dest: d });
  }

  // a chain snapping tight
  anchor() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.5);
    this.noise(t, 0.12, { type: 'bandpass', f0: 4000, f1: 1500, q: 2, gain: 0.7, dest: d });
    this.tone(t, 0.35, { f0: 200, f1: 90, type: 'triangle', gain: 0.7, dest: d });
    this.tone(t + 0.02, 0.5, { f0: 1760, f1: 1700, type: 'sine', gain: 0.18, dest: d });
  }

  // a shell cracks and something chirps
  hatch() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.4);
    this.noise(t, 0.15, { type: 'bandpass', f0: 2500, f1: 900, q: 1, gain: 0.7, dest: d });
    this.tone(t + 0.12, 0.16, { f0: 500, f1: 900, type: 'square', gain: 0.14, dest: d });
    this.tone(t + 0.26, 0.2, { f0: 700, f1: 1300, type: 'square', gain: 0.14, dest: d });
  }

  // the world turns over: a rising shimmer (in) and its fall (out)
  godIn() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.7);
    this.tone(t, 1.0, { f0: 110, f1: 660, type: 'sine', gain: 0.5, dest: d });
    this.tone(t + 0.05, 1.1, { f0: 220, f1: 1320, type: 'triangle', gain: 0.22, dest: d });
    this.noise(t, 0.9, { type: 'bandpass', f0: 300, f1: 5000, q: 0.8, gain: 0.5, attack: 0.5, dest: d });
  }

  godOut() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.6);
    this.tone(t, 0.7, { f0: 880, f1: 110, type: 'sine', gain: 0.5, dest: d });
    this.thump();
  }

  // the hand closes on something
  grab() {
    if (!this.ok() || !this.allow('grab', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.tone(t, 0.09, { f0: 300, f1: 180, type: 'triangle', gain: 0.6, dest: d });
    this.noise(t, 0.08, { type: 'lowpass', f0: 1500, f1: 400, gain: 0.5, dest: d });
  }

  // let go: air moving
  toss(power = 1) {
    if (!this.ok() || !this.allow('toss', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.35 + 0.3 * power, 0.3);
    this.noise(t, 0.3, { type: 'bandpass', f0: 400, f1: 2400, q: 0.8, gain: 0.7, attack: 0.05, dest: d });
  }

  // the vessel takes a blow: a cracked bell
  vesselHit(size = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.6);
    this.tone(t, 0.6, { f0: 330, f1: 320, type: 'triangle', gain: 0.5, dest: d });
    this.tone(t, 0.5, { f0: 497, f1: 480, type: 'sine', gain: 0.3, dest: d });
    this.noise(t, 0.12, { type: 'highpass', f0: 3000, f1: 1500, gain: 0.5 * size, dest: d });
    this.thump();
  }

  // the vessel comes back together
  reforge() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.7);
    for (let i = 0; i < 4; i++) this.tone(t + i * 0.12, 0.8, { f0: 392 * [1, 1.25, 1.5, 2][i], f1: 392 * [1, 1.25, 1.5, 2][i], type: 'sine', gain: 0.22, dest: d });
  }

  // a psychic survey: a soft sonar sweep
  survey() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.8);
    this.tone(t, 0.9, { f0: 300, f1: 1400, type: 'sine', gain: 0.28, dest: d });
    this.tone(t + 0.18, 0.9, { f0: 450, f1: 2100, type: 'triangle', gain: 0.12, dest: d });
    this.noise(t, 0.8, { type: 'bandpass', f0: 500, f1: 4000, q: 1.2, gain: 0.25, attack: 0.3, dest: d });
  }
}
