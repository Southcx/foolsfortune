// A sound bank of the one mixer (audio.js): the slip jelly (jelly/slipjelly.js) and its slip: wet, rubbery, a little musical (it is a mind jelly).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class JellySounds {
  jellySquelch(dist = 5, k = 1) {
    if (!this.ok() || !this.allow('jsq', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.5 * k / (0.5 + dist * 0.1), 0.25), f = 260 + Math.random() * 80;
    this.tone(t, 0.16, { f0: f * 1.6, f1: f * 0.7, type: 'sine', gain: 0.55, dest: d });
    this.noise(t, 0.12, { type: 'bandpass', f0: 900, f1: 300, q: 3, gain: 0.45, dest: d });
  }

  jellyWind(dist = 5, dur = 0.8) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35 / (0.5 + dist * 0.1), 0.3);
    // (a swell, not a strike: the jelly drawing itself in before it springs)
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(420, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(g).connect(d); o.start(t); o.stop(t + dur + 0.1);
  }

  jellyLand(dist = 5) {
    if (!this.ok() || !this.allow('jland', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.1), 0.35);
    this.tone(t, 0.22, { f0: 180, f1: 60, type: 'sine', gain: 0.8, dest: d });
    this.noise(t, 0.2, { type: 'lowpass', f0: 1200, f1: 200, gain: 0.5, dest: d });
  }

  jellyPop(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7 / (0.5 + dist * 0.1), 0.6);
    this.tone(t, 0.08, { f0: 900, f1: 1800, type: 'sine', gain: 0.6, dest: d });
    this.noise(t + 0.02, 0.4, { type: 'bandpass', f0: 1400, f1: 250, q: 1.5, gain: 0.7, dest: d });
    [523, 659, 784].forEach((f, i) => this.tone(t + 0.06 + i * 0.05, 0.25, { f0: f * 1.5, f1: f * 1.5, type: 'sine', gain: 0.12, dest: d })); // (a little chime: it was a mind)
  }

  /** A rainstick turned over: a rush of fine sand, and through it a cascade of tiny beads, thick at first and thinning out (a slip
   *  jelly's body coming apart; a zandatsu's pieces coming undone). `len` stretches it. */
  rainstick(dist = 5, len = 1) {
    if (!this.ok() || !this.allow('rainstick', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.1), 0.6), dur = 1.5 * len;
    this.noise(t, dur, { type: 'bandpass', f0: 2400, f1: 5600, q: 0.8, gain: 0.2, attack: 0.22, dest: d }); // (the rush)
    for (let i = 0; i < 46; i++) {
      const u = Math.pow(Math.random(), 1.7), f = 2600 + Math.random() * 5400; // (more early: the cascade thins)
      this.noise(t + 0.04 + u * dur, 0.012 + Math.random() * 0.02, { type: 'bandpass', f0: f, f1: f * 0.88, q: 7, gain: (0.18 + 0.2 * Math.random()) * (1 - u * 0.75), dest: d });
    }
  }

  gulp(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4 / (0.5 + dist * 0.1), 0.2);
    this.tone(t, 0.12, { f0: 500, f1: 200, type: 'sine', gain: 0.6, dest: d });
  }

  geyser() {
    if (!this.ok() || !this.allow('geyser', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.6);
    this.noise(t, 0.8, { f0: 400, f1: 4000, gain: 0.8, attack: 0.05, dest: d });
    this.tone(t, 0.6, { f0: 100, f1: 400, gain: 0.5, dest: d });
  }
}
