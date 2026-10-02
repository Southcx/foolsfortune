// A sound bank of the one mixer (audio.js): the rod and its line (angling/): the cast, the reel, a bite, a catch, the one that got away, the sounding.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class AnglingSounds {
  /** A rod cast: the whip of the line and a lure's quiet plink where it lands. */
  cast(power = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.3);
    this.noise(t, 0.3, { type: 'bandpass', f0: 900, f1: 5200, q: 1.2, gain: 0.7, attack: 0.03, dest: d });
    this.tone(t, 0.25, { f0: 400 + 300 * power, f1: 1600, type: 'sine', gain: 0.07, dest: d });
  }

  plink(note = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.9), f = 660 * Math.pow(2, note / 12);
    this.tone(t, 0.9, { f0: f, f1: f * 0.995, type: 'sine', gain: 0.22, dest: d });
    this.tone(t + 0.02, 0.6, { f0: f * 2.01, f1: f * 2, type: 'sine', gain: 0.08, dest: d });
  }

  /** The click of the reel (rate follows the crank). */
  reelTick(k = 1) {
    if (!this.ok() || !this.allow('reel', 9 + 10 * k)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.05);
    this.noise(t, 0.025, { type: 'highpass', f0: 3000, f1: 2500, gain: 0.7, dest: d });
    this.tone(t, 0.03, { f0: 1500 + 500 * k, f1: 1200, type: 'square', gain: 0.05, dest: d });
  }

  /** Line paying out under load. */
  lineOut(k = 1) {
    if (!this.ok() || !this.allow('lineout', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.1);
    this.noise(t, 0.09, { type: 'bandpass', f0: 2500 + 1500 * k, f1: 3200, q: 3, gain: 0.5, dest: d });
  }

  /** A nibble, a tug: the note says how hard. */
  bite(kind = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.7);
    const f = [523, 392, 294][Math.min(2, kind)];
    this.tone(t, 0.6, { f0: f, f1: f * 0.99, type: 'triangle', gain: 0.24, dest: d });
    this.tone(t + 0.07, 0.6, { f0: f * 1.5, f1: f * 1.5, type: 'sine', gain: 0.12, dest: d });
    if (kind > 0) this.tone(t, 0.16, { f0: 120, f1: 50, gain: 0.5, dest: d });
  }

  nibble() {
    if (!this.ok() || !this.allow('nibble', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.6);
    this.tone(t, 0.12, { f0: 1500, f1: 1200, type: 'sine', gain: 0.09, dest: d });
  }

  /** Line tension: a creaking pitch that climbs (called while the line is loaded). */
  strain(k = 0.5) {
    if (!this.ok() || !this.allow('strain', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.12 + 0.2 * k, 0.05);
    this.tone(t, 0.14, { f0: 220 + 900 * k, f1: 240 + 940 * k, type: 'sawtooth', gain: 0.05, dest: d });
  }

  lineSnap() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.4);
    this.noise(t, 0.12, { type: 'highpass', f0: 6000, f1: 3000, gain: 0.9, dest: d });
    this.tone(t, 0.3, { f0: 2600, f1: 500, type: 'sawtooth', gain: 0.1, dest: d });
  }

  hookSet() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.4);
    this.tone(t, 0.1, { f0: 180, f1: 70, gain: 0.7, dest: d });
    this.noise(t, 0.1, { type: 'bandpass', f0: 2500, f1: 800, q: 1.4, gain: 0.7, dest: d });
    this.tone(t + 0.05, 0.3, { f0: 880, f1: 880, type: 'triangle', gain: 0.16, dest: d });
  }

  /** A catch: a rising figure, longer for something worth writing down. */
  catchSong(rare = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.55, 0.7);
    const notes = [392, 494, 587, 784, 988, 1175];
    const n = 3 + Math.min(3, rare);
    for (let i = 0; i < n; i++) this.tone(t + i * 0.1, 0.6, { f0: notes[i], f1: notes[i], type: i % 2 ? 'sine' : 'triangle', gain: 0.18, dest: d });
  }

  /** The one that got away. */
  escape() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.6);
    this.tone(t, 0.6, { f0: 440, f1: 180, type: 'triangle', gain: 0.2, dest: d });
    this.noise(t, 0.25, { type: 'lowpass', f0: 1500, f1: 300, gain: 0.5, dest: d });
  }

  /** Something very large moves under the water. */
  leviathan() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.9, 0.9);
    this.tone(t, 2.4, { f0: 42, f1: 34, type: 'sine', gain: 0.9, dest: d });
    this.tone(t + 0.3, 2, { f0: 63, f1: 50, type: 'triangle', gain: 0.25, dest: d });
    this.noise(t, 2, { type: 'lowpass', f0: 300, f1: 80, gain: 0.5, attack: 0.6, dest: d });
  }

  /** A sounding: the lure's mind, pinged into the water. */
  sounding() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 1);
    this.tone(t, 1.4, { f0: 196, f1: 1170, type: 'sine', gain: 0.3, dest: d });
    this.tone(t + 0.25, 1.4, { f0: 294, f1: 1760, type: 'triangle', gain: 0.1, dest: d });
  }
}
