// A sound bank of the one mixer (audio.js): the psygun and the guns: shots, reloads, the charge, lock-on and the seekers, casings, hits, explosions.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class WeaponSounds {
  gunshot() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.9, 0.9);
    this.noise(t, 0.05, { type: 'highpass', f0: 3000, f1: 1200, gain: 0.9, dest: d }); // crack
    this.noise(t, 0.32, { f0: 5000, f1: 180, gain: 1.0, dest: d }); // body
    this.tone(t, 0.22, { f0: 140, f1: 38, gain: 1.1, dest: d }); // thump
    this.tone(t + 0.004, 0.08, { f0: 900, f1: 300, type: 'triangle', gain: 0.15, dest: d }); // mech
  }

  dryFire() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.1);
    this.noise(t, 0.03, { type: 'bandpass', f0: 3500, q: 4, gain: 0.8, dest: d });
  }

  reloadOut() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.15);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1800, q: 3, gain: 0.9, dest: d });
    this.tone(t, 0.05, { f0: 600, f1: 350, type: 'square', gain: 0.08, dest: d });
  }

  reloadIn() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.45, 0.15);
    this.noise(t, 0.06, { type: 'bandpass', f0: 1200, q: 2, gain: 1, dest: d });
    this.noise(t + 0.16, 0.08, { type: 'bandpass', f0: 2600, q: 3, gain: 0.9, dest: d });
    this.tone(t + 0.16, 0.06, { f0: 420, f1: 260, type: 'square', gain: 0.07, dest: d });
  }

  // rising whine while the psygun charges; returns a handle with set(level)/stop()
  chargeLoop() {
    if (!this.ok()) return null;
    const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
    o.type = 'sawtooth'; o2.type = 'sine';
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
    const g = this.ctx.createGain(); g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g).connect(this.master);
    o.start(); o2.start();
    const ctx = this.ctx;
    return {
      set(level) {
        const t = ctx.currentTime;
        o.frequency.setTargetAtTime(90 + level * 260, t, 0.03);
        o2.frequency.setTargetAtTime(400 + level * 900 + (level >= 1 ? Math.sin(t * 40) * 40 : 0), t, 0.03);
        f.frequency.setTargetAtTime(500 + level * 2500, t, 0.03);
        g.gain.setTargetAtTime(0.03 + level * 0.12, t, 0.03);
      },
      stop() { const t = ctx.currentTime; g.gain.setTargetAtTime(0, t, 0.02); o.stop(t + 0.1); o2.stop(t + 0.1); },
    };
  }

  chargedShot(power = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(1.1, 1.0);
    this.noise(t, 0.6, { f0: 6000, f1: 120, gain: 1, dest: d });
    this.tone(t, 0.55, { f0: 180, f1: 30, gain: 1.3 * power, dest: d });
    this.tone(t, 0.3, { f0: 2400, f1: 200, type: 'sawtooth', gain: 0.18, dest: d });
  }

  fizzle() {
    if (!this.ok() || !this.allow('fizzle', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.1);
    this.noise(t, 0.12, { type: 'bandpass', f0: 4000, f1: 1500, q: 3, gain: 0.8, dest: d });
    this.tone(t, 0.1, { f0: 300, f1: 120, type: 'sawtooth', gain: 0.08, dest: d });
  }

  // holster: leather-and-click out, click-and-slide in
  draw() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.15);
    this.noise(t, 0.12, { type: 'bandpass', f0: 900, f1: 2200, q: 1.5, gain: 0.5, attack: 0.02, dest: d });
    this.tone(t + 0.1, 0.04, { f0: 2600, f1: 2300, type: 'square', gain: 0.08, dest: d });
  }

  holster() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.15);
    this.noise(t, 0.16, { type: 'bandpass', f0: 1800, f1: 700, q: 1.5, gain: 0.45, attack: 0.02, dest: d });
    this.tone(t + 0.14, 0.04, { f0: 1900, f1: 1700, type: 'square', gain: 0.07, dest: d });
  }

  // ricochet: a bright zing that climbs with each bounce
  ricochet(n = 1, dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5 / (0.5 + dist * 0.06), 0.6);
    const f = 1400 * Math.pow(2, Math.min(n, 8) / 6);
    this.tone(t, 0.22, { f0: f * 1.6, f1: f * 0.7, type: 'sawtooth', gain: 0.14, dest: d });
    this.tone(t, 0.3, { f0: f, f1: f * 0.55, type: 'sine', gain: 0.35, dest: d });
    this.noise(t, 0.05, { type: 'highpass', f0: 5000, gain: 0.5, dest: d });
  }

  // lock-on: soft blip while painting, a two-note chirp per lock (rising)
  lockTick() {
    if (!this.ok() || !this.allow('lockTick', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0);
    this.tone(t, 0.04, { f0: 1100, f1: 1300, type: 'square', gain: 0.08, dest: d });
  }

  lockOn(n = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.2);
    const f = 880 * Math.pow(2, (n - 1) / 12 * 2);
    this.tone(t, 0.05, { f0: f, f1: f, type: 'square', gain: 0.12, dest: d });
    this.tone(t + 0.055, 0.08, { f0: f * 1.5, f1: f * 1.5, type: 'square', gain: 0.12, dest: d });
  }

  seekers(n = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.5);
    for (let i = 0; i < n; i++) {
      const k = t + i * 0.06;
      this.noise(k, 0.25, { type: 'bandpass', f0: 900, f1: 3500, q: 1.5, gain: 0.5, attack: 0.02, dest: d });
      this.tone(k, 0.2, { f0: 300, f1: 700, type: 'triangle', gain: 0.15, dest: d });
    }
  }

  seekerPop(dist = 5) {
    if (!this.ok() || !this.allow('seekerPop', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.08), 0.6);
    this.noise(t, 0.3, { f0: 3000, f1: 200, gain: 0.8, dest: d });
    this.tone(t, 0.18, { f0: 160, f1: 50, gain: 0.7, dest: d });
  }

  casing(dist = 1) {
    if (!this.ok() || !this.allow('casing', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.18 / (0.6 + dist * 0.2), 0.3);
    const f = 4200 + Math.random() * 1500;
    this.tone(t, 0.09, { f0: f, f1: f * 0.98, type: 'sine', gain: 0.5, dest: d });
    this.tone(t + 0.07, 0.06, { f0: f * 1.1, f1: f, type: 'sine', gain: 0.25, dest: d });
  }

  impact(dist = 5) {
    if (!this.ok() || !this.allow('impact', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.5 / (0.6 + dist * 0.08), 0.5);
    this.noise(t, 0.09, { f0: 1600, f1: 300, gain: 0.8, dest: d });
    this.tone(t, 0.07, { f0: 220, f1: 90, gain: 0.3, dest: d });
  }

  hitmarker() {
    if (!this.ok() || !this.allow('hitmarker', 30)) return;
    const t = this.ctx.currentTime, d = this.out(0.12, 0);
    this.tone(t, 0.05, { f0: 1800, f1: 1700, type: 'triangle', gain: 0.6, dest: d });
  }

  explosion(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(1.2, 2.5 / (1 + dist * 0.15)), 1.0);
    this.noise(t, 1.1, { f0: 2400, f1: 60, gain: 1, dest: d });
    this.tone(t, 0.7, { f0: 90, f1: 28, gain: 1.2, dest: d });
    this.noise(t, 0.08, { type: 'highpass', f0: 2500, f1: 800, gain: 0.7, dest: d });
  }
}
