// THE MIXER: the audio context and its buses, and the few primitives every sound is built from (a filtered burst of noise, a
// gliding tone, a riser), a rate limiter, and the master's slow-time low-pass. The sounds themselves are in the banks beside this
// file, mixed onto the Sfx by audio/sfx.js.
// Two buses: `main` (the volume, the glue, the slow-time low-pass, out) and `master`, the sound effects' bus into it, which a scene can
// lower under the music (`duckEffects`: a trailer, a cinematic). The music and the System's voice go to `main`, so they never duck.
//   sfx.main (the music's, the interface's and the voices' way out)   sfx.master (the world's effects')   sfx.out(gain, verb, ui)   sfx.verbSendMain   sfx.duckEffects(to = 0.35, fade = 0.4) / sfx.duckEffects(1) to restore   sfx.setFog(k)
import { T } from '../core/config.js';

export class Sfx {
  constructor() {
    this.ctx = null;
    this.limits = new Map();
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.main = this.ctx.createGain();
    this.main.gain.value = T.audio.volume;
    this.master = this.ctx.createGain(); // (the sound effects' bus, through the fog's low-pass: the pall muffles the world, not the music)
    this.fogLp = this.ctx.createBiquadFilter(); this.fogLp.type = 'lowpass'; this.fogLp.frequency.value = 22000; this.fogLp.Q.value = 0.5;
    this.master.connect(this.fogLp).connect(this.main);
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    // (the master bus runs through a low-pass that closes as time slows: see core/time.js)
    this.slowLp = this.ctx.createBiquadFilter(); this.slowLp.type = 'lowpass'; this.slowLp.frequency.value = 22000; this.slowLp.Q.value = 0.5;
    this.main.connect(comp).connect(this.slowLp).connect(this.ctx.destination);
    // cheap room reverb
    this.verb = this.ctx.createConvolver();
    this.verb.buffer = this.impulse(1.4, 3.2);
    this.verbSend = this.ctx.createGain();
    this.verbSend.gain.value = 0.22;
    this.verbSend.connect(this.verb).connect(this.master);
    // (the interface's and the voices' own room, into main: the fog never muffles a menu click or a word)
    this.verbMain = this.ctx.createConvolver(); this.verbMain.buffer = this.verb.buffer;
    this.verbSendMain = this.ctx.createGain(); this.verbSendMain.gain.value = 0.22; this.verbSendMain.connect(this.verbMain).connect(this.main);
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

  setVolume(v) { if (this.main) this.main.gain.value = v; }
  /** The fog (k 0..1): the world's sounds muffled under it (audio/ambience.js, the pall), the music and the voice untouched. */
  setFog(k = 0) { if (this.fogLp) this.fogLp.frequency.setTargetAtTime(22000 * Math.pow(900 / 22000, Math.max(0, Math.min(1, k))), this.ctx.currentTime, 0.8); }
  /** The sound effects lowered to `to` (1 restores) over `fade` seconds, under the music and the voice (a trailer, a cinematic). */
  duckEffects(to = 0.35, fade = 0.4) { if (this.master) this.master.gain.setTargetAtTime(Math.max(0.0001, to), this.ctx.currentTime, fade / 3); }

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
    const last = this.limits.get(key); // (never played is not "played at time zero": the first one always sounds)
    if (last !== undefined && now - last < 1000 / perSec) return false;
    this.limits.set(key, now);
    return true;
  }

  /** A sound's way out: the effects bus (the world's: ducked and fogged), or with `ui` straight to main (the interface: never fogged). */
  out(gain, verb = 0.5, ui = false) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    g.connect(ui ? this.main : this.master);
    if (verb > 0) {
      const s = this.ctx.createGain();
      s.gain.value = verb;
      g.connect(s).connect(ui ? this.verbSendMain : this.verbSend);
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
}
