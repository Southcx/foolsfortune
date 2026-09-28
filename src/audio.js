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
    this.master.connect(comp).connect(this.ctx.destination);
    // cheap room reverb
    this.verb = this.ctx.createConvolver();
    this.verb.buffer = this.impulse(1.4, 3.2);
    this.verbSend = this.ctx.createGain();
    this.verbSend.gain.value = 0.22;
    this.verbSend.connect(this.verb).connect(this.master);
    this.noiseBuf = this.makeNoise(2);
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

  clap(dist = 5) {
    if (!this.ok() || !this.allow('clap', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.6 / (0.5 + dist * 0.1), 0.3);
    this.noise(t, 0.035, { type: 'bandpass', f0: 1800 + Math.random() * 600, q: 2.5, gain: 1, dest: d });
    this.tone(t, 0.04, { f0: 700, f1: 500, type: 'triangle', gain: 0.3, dest: d });
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

  land(v) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.4, v * 0.04), 0.2);
    this.noise(t, 0.12, { f0: 900, f1: 120, gain: 1, dest: d });
    this.tone(t, 0.1, { f0: 120, f1: 60, gain: 0.5, dest: d });
  }
}

export const sfx = new Sfx();
