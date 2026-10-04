// A sound bank of the one mixer (audio/sfx.js): the Veritome (tools/veritome/veritome.js, veritome/): the lens, the shutter, the cards.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class VeritomeSounds {
  /** The lens comes up: a brass click and a short wind. */
  lensUp() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.2);
    this.noise(t, 0.04, { type: 'highpass', f0: 4000, f1: 2500, gain: 0.5, dest: d });
    this.tone(t + 0.03, 0.15, { f0: 1800, f1: 2400, type: 'triangle', gain: 0.08, dest: d });
  }

  /** The shutter: a mechanical clack, the curtain, and the wind-on. */
  shutter() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.8, 0.3);
    this.noise(t, 0.03, { type: 'bandpass', f0: 3000, f1: 2000, q: 1.5, gain: 0.9, dest: d });
    this.noise(t + 0.05, 0.03, { type: 'bandpass', f0: 2200, f1: 1500, q: 1.5, gain: 0.7, dest: d });
    this.noise(t + 0.12, 0.25, { type: 'bandpass', f0: 600, f1: 1500, q: 3, gain: 0.25, attack: 0.02, dest: d });
  }

  /** A card bound into the Book (a page filled rings higher). */
  cardGet(page = false) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 1);
    const f = page ? [659, 880, 1319] : [784, 988];
    f.forEach((x, i) => this.tone(t + i * 0.09, 0.9, { f0: x, f1: x, type: 'sine', gain: 0.16, dest: d }));
  }

  /** A card out of the Book, or a page turned. */
  cardDraw() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.4);
    this.noise(t, 0.18, { type: 'bandpass', f0: 2600, f1: 4200, q: 0.9, gain: 0.35, attack: 0.02, dest: d });
  }

  /** The darkroom: the plates come up out of the developer, one soft note each, climbing. */
  develop(n = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 1);
    this.noise(t, 0.5, { type: 'lowpass', f0: 900, f1: 400, gain: 0.18, attack: 0.08, dest: d });
    [523, 659, 784, 1047].slice(0, Math.min(4, 1 + Math.floor(n / 6))).forEach((f, i) => this.tone(t + 0.15 + i * 0.11, 1.1, { f0: f, f1: f, type: 'sine', gain: 0.12, dest: d }));
  }

  /** A fresh roll threaded and wound on: the advance lever's ratchet (six quick clicks) and the back snapping shut. */
  filmWind() {
    if (!this.ok() || !this.allow('filmWind', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.2);
    for (let i = 0; i < 6; i++) this.noise(t + i * 0.045, 0.012, { type: 'bandpass', f0: 3400 + i * 120, q: 10, gain: 0.7, dest: d });
    this.tone(t + 0.36, 0.06, { f0: 420, f1: 260, type: 'triangle', gain: 0.3, dest: d });
    this.noise(t + 0.36, 0.03, { type: 'bandpass', f0: 2000, q: 3, gain: 0.5, dest: d });
  }
}
