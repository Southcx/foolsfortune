import { T } from './config.js';

// All sounds are synthesized with WebAudio so the demo has zero audio assets.
// Swap any of these for samples later; the call sites stay the same.
class Sfx {
  constructor() {
    this.ctx = null;
    this.limits = new Map();
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = T.audio.volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    // (the master bus runs through a low-pass that closes as time slows: see timescale.js)
    this.slowLp = this.ctx.createBiquadFilter(); this.slowLp.type = 'lowpass'; this.slowLp.frequency.value = 22000; this.slowLp.Q.value = 0.5;
    this.master.connect(comp).connect(this.slowLp).connect(this.ctx.destination);
    // cheap room reverb
    this.verb = this.ctx.createConvolver();
    this.verb.buffer = this.impulse(1.4, 3.2);
    this.verbSend = this.ctx.createGain();
    this.verbSend.gain.value = 0.22;
    this.verbSend.connect(this.verb).connect(this.master);
    this.noiseBuf = this.makeNoise(2);
  }

  /** Time has slowed to `s` (1 = normal): muffle the world in proportion. */
  setSlow(s) {
    if (!this.slowLp) return;
    const f = 22000 * Math.pow(Math.max(0.03, Math.min(1, s)), 1.25);
    if (Math.abs(f - (this._slowF ?? 22000)) < 40) return;
    this._slowF = f;
    this.slowLp.frequency.setTargetAtTime(Math.max(300, f), this.ctx.currentTime, 0.05);
  }

  setVolume(v) { if (this.master) this.master.gain.value = v; }

  makeNoise(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  impulse(sec, decay) {
    const len = this.ctx.sampleRate * sec;
    const b = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  // rate limiter so 200 shards landing at once don't melt the mixer
  allow(key, perSec) {
    const now = performance.now();
    const last = this.limits.get(key) || 0;
    if (now - last < 1000 / perSec) return false;
    this.limits.set(key, now);
    return true;
  }

  out(gain, verb = 0.5) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    g.connect(this.master);
    if (verb > 0) {
      const s = this.ctx.createGain();
      s.gain.value = verb;
      g.connect(s).connect(this.verbSend);
    }
    return g;
  }

  noise(t, dur, { type = 'lowpass', f0 = 2000, f1 = f0, q = 0.7, gain = 1, attack = 0.001, dest }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const flt = this.ctx.createBiquadFilter();
    flt.type = type; flt.Q.value = q;
    flt.frequency.setValueAtTime(f0, t);
    flt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(env).connect(dest);
    src.start(t, Math.random() * Math.max(0, 1.9 - dur), dur + 0.05);
  }

  tone(t, dur, { f0 = 200, f1 = f0, type = 'sine', gain = 1, dest }) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env).connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  ok() { return !!this.ctx && this.ctx.state === 'running'; }

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

  click() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0);
    this.tone(t, 0.03, { f0: 2200, f1: 1800, type: 'square', gain: 0.1, dest: d });
  }

  // the menus' four sounds (ui/theme.js), after the JRPG's: a dry tick as the glove moves, a bright two-note confirm, a falling
  // back, and a soft unfolding as a window opens. Short (the confirm is under 50 ms to its peak) and quiet: they are heard a lot.
  menuMove() {
    if (!this.ok() || !this.allow('menuMove', 30)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.05);
    this.tone(t, 0.035, { f0: 1760, f1: 1700, type: 'triangle', gain: 0.35, dest: d });
  }
  menuOk() {
    if (!this.ok() || !this.allow('menuOk', 20)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.15);
    this.tone(t, 0.05, { f0: 1319, type: 'triangle', gain: 0.4, dest: d });
    this.tone(t + 0.045, 0.09, { f0: 1976, type: 'triangle', gain: 0.35, dest: d });
  }
  menuBack() {
    if (!this.ok() || !this.allow('menuBack', 10)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.1);
    this.tone(t, 0.05, { f0: 1175, type: 'triangle', gain: 0.35, dest: d });
    this.tone(t + 0.045, 0.08, { f0: 784, type: 'triangle', gain: 0.3, dest: d });
  }
  menuOpen() {
    if (!this.ok() || !this.allow('menuOpen', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.35);
    this.noise(t, 0.12, { type: 'bandpass', f0: 900, f1: 3200, q: 1.2, gain: 0.5, attack: 0.03, dest: d });
    this.tone(t + 0.02, 0.16, { f0: 988, f1: 1480, type: 'sine', gain: 0.25, dest: d });
  }

  fizzle() {
    if (!this.ok() || !this.allow('fizzle', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.1);
    this.noise(t, 0.12, { type: 'bandpass', f0: 4000, f1: 1500, q: 3, gain: 0.8, dest: d });
    this.tone(t, 0.1, { f0: 300, f1: 120, type: 'sawtooth', gain: 0.08, dest: d });
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
  hoist() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.noise(t, 0.35, { type: 'bandpass', f0: 500, f1: 2200, q: 1, gain: 0.6, attack: 0.03, dest: d });
  }

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

  airJump() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.3);
    this.noise(t, 0.18, { type: 'bandpass', f0: 500, f1: 1800, q: 1.2, gain: 0.7, attack: 0.005, dest: d });
    this.tone(t, 0.12, { f0: 180, f1: 360, type: 'sine', gain: 0.3, dest: d });
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

  // ---- the slip jelly (jelly/slipjelly.js): wet, rubbery, a little musical (it is a mind jelly)
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

  footstep(dist = 0) {
    if (!this.ok() || !this.allow('step', 12)) return;
    const t = this.ctx.currentTime, d = this.out(0.08, 0.1);
    this.noise(t, 0.07, { f0: 700, f1: 200, gain: 0.8, dest: d });
  }

  // ---- movement techs ----
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

  // the System: a little two-note chime, a bright one over a low one
  systemUnlock() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const d = this.out(0.5, 0.35);
    this.tone(t, 0.5, { f0: 392, f1: 392, type: 'triangle', gain: 0.22, dest: d });
    this.tone(t + 0.12, 0.7, { f0: 587, f1: 587, type: 'triangle', gain: 0.22, dest: d });
    this.tone(t + 0.26, 0.9, { f0: 784, f1: 784, type: 'sine', gain: 0.2, dest: d });
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

  // ---- caster shells and the god hand ----
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

  // ---- the Sondelass: a cutlass, a grapnel, a rod and its line ----
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
  // ---------------------------------------------------------------- treasure
  /** A gliding tone that swells as it climbs (a riser): `tone` only decays, and a build-up has to grow. */
  riser(t, dur, { f0 = 100, f1 = 800, type = 'sawtooth', gain = 0.2, q = 0, dest }) {
    const o = this.ctx.createOscillator(), env = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(gain, t + dur * 0.92); env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.03);
    let n = o;
    if (q > 0) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = q; f.frequency.setValueAtTime(f0 * 2, t); f.frequency.exponentialRampToValueAtTime(f1 * 5, t + dur); o.connect(f); n = f; }
    n.connect(env).connect(dest);
    o.start(t); o.stop(t + dur + 0.06);
  }
  /** A cube taken: a glassy tick that climbs a pentatonic scale with each one taken in a row (Mario's coins, Zelda's rupees). */
  cubeGet(combo = 0) {
    if (!this.ok() || !this.allow('cubeGet', 40)) return;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const semis = combo < scale.length ? scale[combo] : 24 + Math.min(12, combo - scale.length + 1);
    const f = 784 * Math.pow(2, semis / 12);
    const t = this.ctx.currentTime, d = this.out(0.14, 0.5);
    this.tone(t, 0.16, { f0: f, f1: f, type: 'sine', gain: 0.5, dest: d });
    this.tone(t, 0.08, { f0: f * 2.02, f1: f * 2, type: 'sine', gain: 0.16, dest: d });
    this.noise(t, 0.012, { type: 'highpass', f0: 6500, gain: 0.2, dest: d });
  }
  /** A cube on stone: a small hard glass click. */
  cubeClack(speed = 2, dist = 5) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.3, 0.05 + speed * 0.03) / (0.5 + dist * 0.12), 0.35);
    const f = 2400 + Math.random() * 2400;
    this.tone(t, 0.05, { f0: f, f1: f * 0.9, type: 'square', gain: 0.1, dest: d });
    this.noise(t, 0.03, { type: 'bandpass', f0: f * 0.8, q: 6, gain: 0.8, dest: d });
  }
  /** A cube leaving the chest: a pop that climbs as the fountain runs (k 0..1). */
  cubePop(k = 0) {
    if (!this.ok() || !this.allow('cubePop', 34)) return;
    const t = this.ctx.currentTime, d = this.out(0.13, 0.4), f = 520 * Math.pow(2, k * 2.2);
    this.tone(t, 0.07, { f0: f * 1.3, f1: f, type: 'triangle', gain: 0.6, dest: d });
    this.noise(t, 0.02, { type: 'bandpass', f0: 3000, q: 3, gain: 0.3, dest: d });
  }
  /** The chest gathers itself: a wooden knock that tightens (k 0..1). */
  chestKnock(k = 0) {
    if (!this.ok() || !this.allow('knock', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.4);
    this.tone(t, 0.12, { f0: 150 + 120 * k, f1: 70 + 40 * k, gain: 0.8, dest: d });
    this.noise(t, 0.05, { type: 'bandpass', f0: 700 + 600 * k, q: 2, gain: 0.5, dest: d });
  }
  /** The build-up: a riser sized to the tier it is building toward. */
  chestCharge(dur = 1.2, tier = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.5);
    this.riser(t, dur, { f0: 80, f1: 260 + tier * 220, type: 'sawtooth', gain: 0.08 + tier * 0.02, q: 2, dest: d });
    this.riser(t, dur, { f0: 220, f1: 880 + tier * 440, type: 'sine', gain: 0.1, dest: d });
    this.noise(t, dur, { type: 'bandpass', f0: 500, f1: 5000 + tier * 1500, q: 1.2, gain: 0.25, attack: dur * 0.9, dest: d });
  }
  /** One step of the colour roulette: a bell on the colour it landed on (i: which colour, 0..4). */
  chestTick(i = 0) {
    if (!this.ok() || !this.allow('roulette', 9)) return;
    const f = [262, 330, 392, 523, 784][Math.max(0, Math.min(4, i))];
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.tone(t, 0.32, { f0: f, f1: f, type: 'sine', gain: 0.4, dest: d });
    this.tone(t, 0.18, { f0: f * 2.76, f1: f * 2.76, type: 'sine', gain: 0.1, dest: d });
    this.tone(t, 0.05, { f0: 900, f1: 300, gain: 0.35, dest: d });
  }
  /** The lid goes, sized to its tier. */
  chestBurst(tier = 0) {
    if (!this.ok()) return;
    tier = Math.max(0, Math.min(4, Math.round(tier)));
    const t = this.ctx.currentTime, d = this.out(0.6 + 0.1 * tier, 0.9);
    this.noise(t, 0.3 + 0.1 * tier, { type: 'highpass', f0: 5000, f1: 600, gain: 0.9, dest: d });
    this.tone(t, 0.3, { f0: 130, f1: 38, gain: 1.1, dest: d });
    this.noise(t, 0.06, { type: 'bandpass', f0: 900, q: 1.4, gain: 0.7, dest: d }); // (the wood)
    const rows = [[1], [1, 1.5], [1, 1.25, 1.5, 2], [1, 1.19, 1.5, 1.78, 2, 2.38], [1, 1.25, 1.5, 1.88, 2, 2.5, 3, 3.76]][tier];
    rows.forEach((r, i) => {
      this.tone(t + 0.02 + i * 0.03, 0.9 + 0.35 * tier, { f0: 392 * r, f1: 392 * r, type: i % 2 ? 'sine' : 'triangle', gain: 0.16, dest: d });
      if (tier >= 3) this.tone(t + 0.02 + i * 0.03, 1.4, { f0: 392 * r * 1.006, f1: 392 * r * 1.006, type: 'sawtooth', gain: 0.02, dest: d });
    });
    const n = 3 + tier * 4;
    for (let i = 0; i < n; i++) this.tone(t + 0.05 + Math.random() * 0.6, 0.2, { f0: 1600 + Math.random() * 3600, f1: 1500 + Math.random() * 3000, type: 'sine', gain: 0.07, dest: d });
  }
  /** What comes out of the chest, held up: a bell figure that climbs, longer for the higher tiers. */
  curioReveal(tier = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.9);
    const notes = [523, 659, 784, 988, 1175, 1318, 1568];
    const n = 3 + tier;
    for (let i = 0; i < n; i++) {
      this.tone(t + i * 0.09, 0.9, { f0: notes[i], f1: notes[i], type: 'sine', gain: 0.2, dest: d });
      this.tone(t + i * 0.09, 0.4, { f0: notes[i] * 2.76, f1: notes[i] * 2.76, type: 'sine', gain: 0.05, dest: d });
    }
    if (tier >= 3) this.tone(t + n * 0.09, 2.2, { f0: 261, f1: 261, type: 'triangle', gain: 0.12, dest: d });
  }
  /** Cubes into the Tithe: a coin in a slot, and something deep taking note. */
  tithe() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 0.6);
    for (let i = 0; i < 4; i++) this.tone(t + i * 0.05, 0.1, { f0: 2600 - i * 200, f1: 2000 - i * 200, type: 'square', gain: 0.05, dest: d });
    this.noise(t, 0.05, { type: 'bandpass', f0: 3500, q: 6, gain: 0.5, dest: d });
    this.tone(t + 0.24, 0.5, { f0: 92, f1: 55, gain: 0.7, dest: d });
  }
  /** A chest that lands hard. */
  chestLand(size = 1) {
    if (!this.ok()) return;
    size = Math.max(0.3, size);
    const t = this.ctx.currentTime, d = this.out(0.7, 0.5);
    this.tone(t, 0.25, { f0: 110 / Math.sqrt(size), f1: 40, gain: 1, dest: d });
    this.noise(t, 0.1, { type: 'lowpass', f0: 1500, f1: 200, gain: 0.7, dest: d });
    this.noise(t + 0.02, 0.05, { type: 'bandpass', f0: 2600, q: 5, gain: 0.3, dest: d });
  }
  /**
   * The prismatic chest's music: four on the floor at 124 bpm, an offbeat bass, claps, hats and a square-wave arpeggio, the bass and
   * arpeggio ducked on every kick. Scheduled a little ahead of the clock (the usual WebAudio metronome), from a two-bar figure that
   * repeats. Returns { stop(fade), t0, spb, phase() } so that the lights can keep the beat, or null when there is no audio.
   */
  raveLoop(bpm = 124) {
    if (!this.ok()) return null;
    const ctx = this.ctx, spb = 60 / bpm, s16 = spb / 4;
    const bus = ctx.createGain(); bus.gain.value = 0.0001; bus.connect(this.master);
    bus.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.2);
    const send = ctx.createGain(); send.gain.value = 0.25; bus.connect(send).connect(this.verbSend);
    const duck = ctx.createGain(); duck.connect(bus);
    const NOTE = (n) => 55 * Math.pow(2, n / 12);
    const bassLine = [0, 0, 3, 0, 5, 0, 3, -2]; // (A, A, C, A, D, A, C, G: per offbeat eighth)
    const arpNotes = [12, 15, 19, 24, 19, 15, 12, 7];
    const t0 = ctx.currentTime + 0.06;
    let next = t0, step = 0, alive = true;
    const kick = (t) => {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(1, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(e).connect(bus); o.start(t); o.stop(t + 0.3);
      duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(0.18, t); duck.gain.linearRampToValueAtTime(1, t + s16 * 3.2);
    };
    const clap = (t) => { for (let i = 0; i < 3; i++) this.noise(t + i * 0.011, 0.09, { type: 'bandpass', f0: 1500, q: 1.3, gain: 0.5, dest: bus }); };
    const hat = (t, open) => this.noise(t, open ? 0.16 : 0.035, { type: 'highpass', f0: 8500, f1: 7000, gain: open ? 0.22 : 0.16, dest: bus });
    const bass = (t, n) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), e = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = NOTE(n); f.type = 'lowpass'; f.Q.value = 5;
      f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(140, t + s16 * 1.8);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.5, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + s16 * 1.9);
      o.connect(f).connect(e).connect(duck); o.start(t); o.stop(t + s16 * 2);
    };
    const arp = (t, n, k) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), e = ctx.createGain();
      o.type = 'square'; o.frequency.value = NOTE(n); f.type = 'lowpass'; f.Q.value = 3; f.frequency.value = 900 + 2600 * k;
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.09, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + s16 * 0.9);
      o.connect(f).connect(e).connect(duck); o.start(t); o.stop(t + s16);
    };
    const run = () => {
      while (alive && next < ctx.currentTime + 0.25) {
        const s = step % 16, bar = Math.floor(step / 16);
        if (s % 4 === 0) kick(next);
        if (s === 4 || s === 12) clap(next);
        if (s % 4 === 2) bass(next, bassLine[(bar * 4 + (s >> 2)) % bassLine.length]);
        if (s % 2 === 1) hat(next, s % 4 === 3 && s !== 15);
        if (bar >= 1 && s % 2 === 0) arp(next, arpNotes[(s >> 1) % arpNotes.length], Math.min(1, (step - 16) / 48));
        next += s16; step++;
      }
    };
    run();
    const id = setInterval(run, 25);
    return {
      t0, spb,
      /** the beat, and how far into it (audio time: a light that keeps this keeps the kick) */
      phase: () => (ctx.currentTime - t0) / spb,
      stop: (fade = 0.35) => {
        alive = false; clearInterval(id);
        bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 3);
        setTimeout(() => { try { bus.disconnect(); send.disconnect(); duck.disconnect(); } catch { /* already gone */ } }, fade * 1000 + 400);
      },
    };
  }
  /** A sounding: the lure's mind, pinged into the water. */
  sounding() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(0.5, 1);
    this.tone(t, 1.4, { f0: 196, f1: 1170, type: 'sine', gain: 0.3, dest: d });
    this.tone(t + 0.25, 1.4, { f0: 294, f1: 1760, type: 'triangle', gain: 0.1, dest: d });
  }

  // ---- the Soul Brush (src/moves/soulbrush.js, src/brush/) ----
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

  // ---- the Veritome (src/moves/veritome.js, src/veritome/) ----
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
}

export const sfx = new Sfx();
