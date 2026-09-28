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

  shatter(size = 1, dist = 5) {
    if (!this.ok() || !this.allow('shatter', 18)) return;
    const t = this.ctx.currentTime;
    const d = this.out(Math.min(1, 0.9 / (0.4 + dist * 0.08)), 0.6);
    const low = 180 / Math.sqrt(size);
    this.tone(t, 0.12, { f0: low * 1.6, f1: low, type: 'triangle', gain: 0.5, dest: d });
    this.noise(t, 0.12, { f0: 3000, f1: 400, gain: 0.8, dest: d });
    const n = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const tt = t + Math.random() * 0.14 * Math.sqrt(size);
      const f = (2200 + Math.random() * 4200) / Math.sqrt(size);
      this.noise(tt, 0.03 + Math.random() * 0.05, { type: 'bandpass', f0: f, q: 6 + Math.random() * 8, gain: 0.7, dest: d });
    }
  }

  clink(speed = 2, dist = 5) {
    if (!this.ok() || !this.allow('clink', 24)) return;
    const t = this.ctx.currentTime;
    const g = Math.min(0.35, speed * 0.05) / (0.5 + dist * 0.1);
    const d = this.out(g, 0.4);
    const f = 2500 + Math.random() * 3500;
    this.noise(t, 0.04, { type: 'bandpass', f0: f, q: 12, gain: 1, dest: d });
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
