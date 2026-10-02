// A sound bank of the one mixer (audio.js): the Courier's body: steps, landings, dashes and the movement techs (blink, slam, roll, swim, climb, carry...).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class MoveSounds {
  /** The surfer's hiss and hum: wind over sand and the emitter. Returns { set(speedFrac, boost, air), stop() }. */
  surfLoop() {
    if (!this.ok()) return null;
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0;
    src.connect(bp).connect(ng).connect(this.master);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 90;
    const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 500;
    const og = ctx.createGain(); og.gain.value = 0;
    o.connect(of).connect(og).connect(this.master);
    src.start(); o.start();
    return {
      set(k, boost = 0, air = 0) {
        const t = ctx.currentTime;
        bp.frequency.setTargetAtTime(500 + k * 2600 + boost * 900, t, 0.08);
        ng.gain.setTargetAtTime((0.04 + k * 0.32) * (air ? 0.55 : 1), t, 0.08);
        o.frequency.setTargetAtTime(80 + k * 90 + boost * 90, t, 0.08);
        og.gain.setTargetAtTime(0.05 + boost * 0.12, t, 0.08);
      },
      stop() { const t = ctx.currentTime; ng.gain.setTargetAtTime(0, t, 0.05); og.gain.setTargetAtTime(0, t, 0.05); src.stop(t + 0.3); o.stop(t + 0.3); },
    };
  }

  slide() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.2);
    this.noise(t, 0.55, { type: 'bandpass', f0: 1400, f1: 500, q: 0.8, gain: 0.7, attack: 0.02, dest: d });
  }

  dash() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.4);
    this.noise(t, 0.3, { type: 'bandpass', f0: 600, f1: 3000, q: 1, gain: 0.8, attack: 0.01, dest: d });
    this.tone(t, 0.2, { f0: 220, f1: 660, type: 'sine', gain: 0.3, dest: d });
  }

  airJump() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.noise(t, 0.18, { type: 'bandpass', f0: 500, f1: 1800, q: 1.2, gain: 0.7, attack: 0.005, dest: d });
    this.tone(t, 0.12, { f0: 180, f1: 360, type: 'sine', gain: 0.3, dest: d });
  }

  wallTouch() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.2);
    this.noise(t, 0.06, { f0: 1200, f1: 300, gain: 0.7, dest: d });
  }

  mantle() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.2);
    this.noise(t, 0.08, { f0: 900, f1: 250, gain: 0.8, dest: d });
    this.noise(t + 0.16, 0.1, { f0: 700, f1: 200, gain: 0.6, dest: d });
  }

  footstep(dist = 0) {
    if (!this.ok() || !this.allow('step', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.08, 0.1);
    this.noise(t, 0.07, { f0: 700, f1: 200, gain: 0.8, dest: d });
  }

  blink() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.55, 0.5);
    this.tone(t, 0.16, { f0: 1800, f1: 240, type: 'sine', gain: 0.35, dest: d });
    this.tone(t + 0.02, 0.12, { f0: 2400, f1: 600, type: 'triangle', gain: 0.18, dest: d });
    this.noise(t, 0.18, { type: 'highpass', f0: 5000, f1: 1500, gain: 0.35, attack: 0.004, dest: d });
  }

  blinkArrive() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.6);
    this.tone(t, 0.1, { f0: 300, f1: 1200, type: 'sine', gain: 0.25, dest: d });
  }

  slamStart() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.noise(t, 0.25, { type: 'bandpass', f0: 2500, f1: 400, q: 1.1, gain: 0.8, attack: 0.01, dest: d });
  }

  slam(power = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.9, 0.7);
    this.tone(t, 0.45, { f0: 110, f1: 32, type: 'sine', gain: 1.1 * power, dest: d });
    this.noise(t, 0.4, { f0: 1600, f1: 90, gain: 1.2, attack: 0.002, dest: d });
    this.noise(t + 0.05, 0.6, { type: 'bandpass', f0: 400, f1: 120, q: 0.6, gain: 0.5, attack: 0.05, dest: d });
  }

  roll() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.2);
    this.noise(t, 0.35, { type: 'bandpass', f0: 700, f1: 250, q: 0.9, gain: 0.7, attack: 0.03, dest: d });
    this.tone(t + 0.02, 0.12, { f0: 140, f1: 70, gain: 0.4, dest: d });
  }

  rung() {
    if (!this.ok() || !this.allow('rung', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0.2);
    this.tone(t, 0.06, { f0: 420 + Math.random() * 60, f1: 300, type: 'triangle', gain: 0.5, dest: d });
    this.noise(t, 0.04, { f0: 1500, f1: 600, gain: 0.3, dest: d });
  }

  stroke() {
    if (!this.ok() || !this.allow('stroke', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.4);
    this.noise(t, 0.3, { type: 'bandpass', f0: 500, f1: 1400, q: 0.7, gain: 0.6, attack: 0.05, dest: d });
  }

  splash(power = 1) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(1, 0.4 + power * 0.3), 0.6);
    this.noise(t, 0.6, { f0: 2400, f1: 200, gain: 1, attack: 0.01, dest: d });
    for (let i = 0; i < 5; i++) this.tone(t + 0.08 + Math.random() * 0.3, 0.06, { f0: 500 + Math.random() * 500, f1: 1400, type: 'sine', gain: 0.12, dest: d });
  }

  slipDive() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.4);
    this.noise(t, 0.3, { f0: 700, f1: 160, gain: 0.9, attack: 0.01, dest: d });
    this.tone(t, 0.18, { f0: 520, f1: 130, type: 'sine', gain: 0.35, dest: d });
  }

  slipSurface() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.4);
    this.noise(t, 0.25, { f0: 400, f1: 1600, gain: 0.8, attack: 0.02, dest: d });
    this.tone(t, 0.15, { f0: 160, f1: 620, type: 'sine', gain: 0.35, dest: d });
  }

  slipSwim() {
    if (!this.ok() || !this.allow('slipSwim', 5)) return;
    const t = this.ctx.currentTime, d = this.out(0.12, 0.2);
    this.noise(t, 0.2, { type: 'bandpass', f0: 300, f1: 700, q: 1.4, gain: 0.8, attack: 0.04, dest: d });
  }

  climbStep() {
    if (!this.ok() || !this.allow('climbStep', 9)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.15);
    this.noise(t, 0.05, { f0: 1100, f1: 300, gain: 0.8, dest: d });
  }

  // a leg swung through the air
  whoosh() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.2);
    this.noise(t, 0.22, { type: 'bandpass', f0: 500, f1: 2200, q: 0.8, gain: 0.7, attack: 0.05, dest: d });
  }

  // a timed deflection: a bright metallic clang over a thud
  parry() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.7, 0.5);
    this.tone(t, 0.5, { f0: 1320, f1: 1290, type: 'triangle', gain: 0.4, dest: d });
    this.tone(t, 0.35, { f0: 1980, f1: 1960, type: 'sine', gain: 0.25, dest: d });
    this.tone(t, 0.18, { f0: 150, f1: 60, gain: 0.7, dest: d });
    this.noise(t, 0.08, { f0: 4000, f1: 1500, gain: 0.7, dest: d });
  }

  // hefting something heavy up over your head
  hoist() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.25);
    this.tone(t, 0.3, { f0: 90, f1: 150, type: 'triangle', gain: 0.5, dest: d });
    this.noise(t + 0.1, 0.25, { type: 'bandpass', f0: 300, f1: 800, q: 0.9, gain: 0.5, attack: 0.08, dest: d });
  }

  land(v) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.4, v * 0.04), 0.2);
    this.noise(t, 0.12, { f0: 900, f1: 120, gain: 1, dest: d });
    this.tone(t, 0.1, { f0: 120, f1: 60, gain: 0.5, dest: d });
  }
}
