// A sound bank of the one mixer (audio/sfx.js): things in the world: shattered, struck, pushed, lifted and mended; the clapperjars' claps and taps; the gong, the barrier;
// a Well's pools taking the Courier down a floor or back up to the mouth (world/well/dunemaw.js, through audio/cues.js).
// Prior art for the pools: going under in liquid (the high end closing over you, the gulp, bubbles streaming up past), and the
// surfacing that undoes it (the muffle opening, a splash and the first breath): every dive in Ecco and Sonic, played as a door.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
export class WorldSounds {
  shatter(size = 1, dist = 5, kind = 'clay') {
    if (!this.ok() || !this.allow('shatter', 18)) return;
    const t = this.ctx.currentTime;
    const d = this.out(Math.min(1, 0.9 / (0.4 + dist * 0.08)), 0.6);
    if (kind === 'glass') {
      // porcelain: bright, ringing, many tiny chimes
      this.noise(t, 0.06, { type: 'highpass', f0: 5000, f1: 3000, gain: 0.7, dest: d });
      for (let i = 0; i < 16; i++) {
        const tt = t + Math.random() * 0.22;
        const f = 2600 + Math.random() * 5200;
        this.tone(tt, 0.08 + Math.random() * 0.25, { f0: f, f1: f * 0.995, type: 'sine', gain: 0.18, dest: d });
      }
      return;
    }
    const stone = kind === 'stone';
    const low = (stone ? 110 : 180) / Math.sqrt(size);
    this.tone(t, stone ? 0.22 : 0.12, { f0: low * 1.6, f1: low, type: 'triangle', gain: stone ? 0.9 : 0.5, dest: d });
    this.noise(t, stone ? 0.25 : 0.12, { f0: stone ? 1800 : 3000, f1: 250, gain: stone ? 1 : 0.8, dest: d });
    const n = (stone ? 12 : 7) + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const tt = t + Math.random() * (stone ? 0.3 : 0.14) * Math.sqrt(size);
      const f = (stone ? 900 + Math.random() * 2400 : 2200 + Math.random() * 4200) / Math.sqrt(size);
      this.noise(tt, 0.03 + Math.random() * 0.06, { type: 'bandpass', f0: f, q: 5 + Math.random() * 8, gain: 0.7, dest: d });
    }
  }

  thunk(size = 1, dist = 5) {
    if (!this.ok() || !this.allow('thunk', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.08), 0.5);
    this.tone(t, 0.18, { f0: 160 / Math.sqrt(size), f1: 90 / Math.sqrt(size), type: 'triangle', gain: 0.8, dest: d });
    this.noise(t, 0.06, { type: 'bandpass', f0: 900, q: 2, gain: 0.5, dest: d });
  }

  clink(speed = 2, dist = 5, kind = 'clay') {
    if (!this.ok() || !this.allow('clink', 24)) return;
    const t = this.ctx.currentTime;
    const g = Math.min(0.35, speed * 0.05) / (0.5 + dist * 0.1);
    const d = this.out(g, 0.4);
    if (kind === 'glass') { const f = 4000 + Math.random() * 4000; this.tone(t, 0.12, { f0: f, f1: f, gain: 0.5, dest: d }); return; }
    const f = (kind === 'stone' ? 1200 : 2500) + Math.random() * 3500;
    this.noise(t, 0.04, { type: 'bandpass', f0: f, q: 12, gain: 1, dest: d });
  }

  ropeSnap(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5 / (0.5 + dist * 0.1), 0.3);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1400, f1: 500, q: 3, gain: 1, dest: d });
    this.tone(t, 0.12, { f0: 320, f1: 120, type: 'sawtooth', gain: 0.12, dest: d });
  }

  squeak(dist = 5) {
    if (!this.ok() || !this.allow('squeak', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.35 / (0.5 + dist * 0.1), 0.3);
    const f = 900 + Math.random() * 500;
    this.tone(t, 0.07, { f0: f, f1: f * 1.8, type: 'square', gain: 0.12, dest: d });
    this.tone(t + 0.08, 0.09, { f0: f * 1.5, f1: f * 0.9, type: 'square', gain: 0.1, dest: d });
  }

  pop(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4 / (0.5 + dist * 0.1), 0.3);
    this.tone(t, 0.12, { f0: 300, f1: 900, type: 'sine', gain: 0.5, dest: d });
  }

  thump() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.9, 0.7);
    this.tone(t, 0.25, { f0: 120, f1: 45, gain: 1.1, dest: d });
    this.noise(t, 0.18, { f0: 1800, f1: 150, gain: 0.8, dest: d });
  }

  clonk(dist = 5) {
    if (!this.ok() || !this.allow('clonk', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.5 / (0.5 + dist * 0.1), 0.3);
    this.tone(t, 0.08, { f0: 420, f1: 300, type: 'triangle', gain: 0.6, dest: d });
  }

  slice() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.8, 0.6);
    this.noise(t, 0.25, { type: 'highpass', f0: 7000, f1: 2500, gain: 0.9, attack: 0.01, dest: d });
    this.tone(t, 0.3, { f0: 3000, f1: 900, type: 'sawtooth', gain: 0.08, dest: d });
    this.tone(t, 0.18, { f0: 140, f1: 60, gain: 0.8, dest: d });
  }

  push() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(1, 0.8);
    this.noise(t, 0.5, { f0: 300, f1: 2500, gain: 1, attack: 0.04, dest: d });
    this.tone(t, 0.4, { f0: 60, f1: 140, gain: 1, dest: d });
  }

  wellLoop() {
    if (!this.ok()) return null;
    const o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
    o.type = 'sawtooth'; lfo.frequency.value = 7; lg.gain.value = 20;
    lfo.connect(lg).connect(o.frequency);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    const g = this.ctx.createGain(); g.gain.value = 0;
    o.connect(f).connect(g).connect(this.master);
    g.connect(this.verbSend);
    o.start(); lfo.start();
    const ctx = this.ctx;
    return {
      set(k) { const t = ctx.currentTime; o.frequency.setTargetAtTime(40 + k * 90, t, 0.05); f.frequency.setTargetAtTime(300 + k * 900, t, 0.05); g.gain.setTargetAtTime(0.25, t, 0.05); },
      stop() { const t = ctx.currentTime; g.gain.setTargetAtTime(0, t, 0.02); o.stop(t + 0.1); lfo.stop(t + 0.1); },
    };
  }

  /** A sail going up: a quick rush of cloth. */
  sail() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.noise(t, 0.35, { type: 'bandpass', f0: 500, f1: 2200, q: 1, gain: 0.6, attack: 0.03, dest: d });
  }

  mark() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6, 0.6);
    for (const [k, f] of [[0, 1320], [0.05, 1760], [0.1, 2640]]) this.tone(t + k, 0.25, { f0: f, f1: f, type: 'triangle', gain: 0.25, dest: d });
    this.noise(t, 0.15, { type: 'bandpass', f0: 5000, q: 2, gain: 0.5, dest: d });
  }

  sizzle(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.4 / (0.5 + dist * 0.08), 0.3);
    this.noise(t + 0.1, 1.6, { type: 'highpass', f0: 5000, f1: 3000, gain: 0.5, attack: 0.2, dest: d });
  }

  boing(speed = 2, dist = 5) {
    if (!this.ok() || !this.allow('boing', 16)) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.3, speed * 0.05) / (0.5 + dist * 0.1), 0.2);
    const f = 380 + Math.random() * 160;
    this.tone(t, 0.14, { f0: f, f1: f * 1.9, type: 'sine', gain: 0.6, dest: d });
  }

  absorb(combo = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.3);
    const f = 660 * Math.pow(2, Math.min(12, combo) / 12);
    this.tone(t, 0.08, { f0: f, f1: f * 1.5, type: 'sine', gain: 0.5, dest: d });
    this.tone(t + 0.05, 0.12, { f0: f * 2, f1: f * 2, type: 'sine', gain: 0.25, dest: d });
  }

  creak(stage = 1, dist = 5) {
    if (!this.ok() || !this.allow('creak', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.5 / (0.5 + dist * 0.1), 0.4);
    const f = 260 - stage * 40;
    this.tone(t, 0.18 + stage * 0.06, { f0: f * 1.4, f1: f, type: 'sawtooth', gain: 0.08, dest: d });
    this.noise(t, 0.12, { type: 'bandpass', f0: 2600, f1: 1200, q: 4, gain: 0.5, dest: d });
  }

  // kintsugi: a clapper's little hammer taps, and a bright chime when the pot's whole again
  tap(dist = 5) {
    if (!this.ok() || !this.allow('tap', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.3 / (0.5 + dist * 0.1), 0.3);
    this.tone(t, 0.05, { f0: 1500 + Math.random() * 400, f1: 1200, type: 'triangle', gain: 0.3, dest: d });
  }

  mended(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.08), 0.8);
    for (const [k, f] of [[0, 1047], [0.08, 1319], [0.16, 1568], [0.24, 2093]]) this.tone(t + k, 0.5, { f0: f, f1: f, type: 'sine', gain: 0.22, dest: d });
  }

  /** The trial's gong, struck: a bronze bloom with a long shimmering tail. */
  gong() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.9);
    for (const [f, g] of [[98, 0.6], [147, 0.35], [233, 0.22], [311, 0.14], [467, 0.08]]) this.tone(t, 2.6, { f0: f * 1.02, f1: f, type: 'sine', gain: g, dest: d });
    this.noise(t, 0.12, { type: 'bandpass', f0: 1800, q: 1.5, gain: 0.4, dest: d });
  }

  /** Bumping the dunes' invisible barrier: a soft glassy bloom (a low swell and a high shimmer). */
  barrier(power = 1) {
    if (!this.ok() || !this.allow('barrier', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.22 + 0.2 * Math.min(1, power), 0.8);
    this.tone(t, 0.45, { f0: 240, f1: 150, type: 'sine', gain: 0.6, dest: d });
    this.tone(t, 0.3, { f0: 1480, f1: 1320, type: 'sine', gain: 0.12, dest: d });
    this.noise(t, 0.35, { type: 'bandpass', f0: 3800, f1: 2400, q: 6, gain: 0.35, attack: 0.02, dest: d });
  }

  splosh(dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.8 / (0.5 + dist * 0.08), 0.5);
    this.noise(t, 0.5, { f0: 900, f1: 180, gain: 1, attack: 0.02, dest: d });
    for (let i = 0; i < 6; i++) this.tone(t + 0.05 + Math.random() * 0.4, 0.08, { f0: 300 + Math.random() * 300, f1: 900, type: 'sine', gain: 0.2, dest: d });
  }

  clap(dist = 5) {
    if (!this.ok() || !this.allow('clap', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.1), 0.3);
    this.noise(t, 0.035, { type: 'bandpass', f0: 1800 + Math.random() * 600, q: 2.5, gain: 1, dest: d });
    this.tone(t, 0.04, { f0: 700, f1: 500, type: 'triangle', gain: 0.3, dest: d });
  }

  /** A Well's pool taking the Courier down to `floor` (1..3): the high end closes over them, a deep gulp, bubbles stream up past;
   *  each floor deeper is a little lower and longer. */
  poolDown(floor = 1) {
    if (!this.ok() || !this.allow('poolDown', 2)) return;
    const t = this.ctx.currentTime, k = Math.max(1, Math.min(3, floor)), low = Math.pow(0.85, k - 1), d = this.out(0.34, 0.6);
    this.noise(t, 1.1 + 0.2 * k, { type: 'lowpass', f0: 3200, f1: 180 * low, q: 2, gain: 0.55, attack: 0.05, dest: d }); // (the surface closing over)
    this.tone(t + 0.08, 0.45, { f0: 170 * low, f1: 55 * low, gain: 0.5, dest: d }); // (the gulp)
    for (let i = 0; i < 7; i++) { const tt = t + 0.25 + i * 0.11 + Math.random() * 0.05, f = (500 + Math.random() * 400) * low; this.tone(tt, 0.08, { f0: f, f1: f * 1.9, gain: 0.12, dest: d }); }
    this.tone(t + 0.3, 1.2 + 0.2 * k, { f0: 62 * low, f1: 50 * low, gain: 0.18, dest: d }); // (the pressure)
  }
  /** A Well's pool bringing the Courier back up to the mouth: the muffle opening as they rise, bubbles, a splash and the air. */
  poolUp() {
    if (!this.ok() || !this.allow('poolUp', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.6);
    this.noise(t, 1.0, { type: 'lowpass', f0: 200, f1: 5000, q: 2, gain: 0.5, attack: 0.7, dest: d }); // (rising: the muffle opening)
    for (let i = 0; i < 6; i++) { const tt = t + 0.1 + i * 0.12, f = 400 + i * 90; this.tone(tt, 0.08, { f0: f, f1: f * 2, gain: 0.1, dest: d }); }
    this.noise(t + 0.95, 0.35, { type: 'bandpass', f0: 2600, f1: 1200, q: 0.8, gain: 0.6, dest: d }); // (the splash)
    this.noise(t + 1.05, 0.6, { type: 'highpass', f0: 3000, f1: 6000, gain: 0.08, attack: 0.1, dest: d }); // (the air)
  }
}
