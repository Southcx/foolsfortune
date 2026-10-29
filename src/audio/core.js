// THE MIXER: the audio context and its buses, and the few primitives every sound is built from (a filtered burst of noise, a
// gliding tone, a riser), a rate limiter, and the master's slow-time low-pass. The sounds themselves are in the banks beside this
// file, mixed onto the Sfx by audio/sfx.js.
// Two buses: `main` (the volume, the glue, the slow-time low-pass, out) and `master`, the sound effects' bus into it, which a scene can
// lower under the music (`duckEffects`: a trailer, a cinematic). The music and the System's voice go to `main`, so they never duck.
//   sfx.main (the music's, the interface's and the voices' way out)   sfx.master (the world's effects')   sfx.out(gain, verb, ui)   sfx.verbSendMain   sfx.duckEffects(to = 0.35, fade = 0.4) / sfx.duckEffects(1) to restore   sfx.setFog(k)   sfx.setUnder(on)
import { T } from '../core/config.js';

const GESTURES = ['pointerdown', 'touchend', 'keydown']; // (what may wake a context the browser holds until a gesture)

/** A phone's mixer (MOBILE.md 6.5): the render rate (Hz), a reverb's longest impulse (s), and the sounds begun in a window (ms) it allows. */
/** A phone or a tablet, by what the browser says (render/graphics.js's platform test, read here so the mixer needs no renderer), or
 *  ?phoneaudio=1 to hear the phone's mixer on a desk. */
function isPhone() {
  try { const n = navigator; return /[?&]phoneaudio=1/.test(location.search) || n.userAgentData?.mobile === true || /android|iphone|ipad|ipod|\bmobile\b/i.test(n.userAgent || '') || (n.platform === 'MacIntel' && (n.maxTouchPoints || 0) > 1); } catch { return false; }
}

export const PHONE = { rate: 32000, verb: 1.2, burst: 10, window: 250, hit: 90 }; // (hit: real ms between two of a blow's sounds, hitOk)

/** A one-shot's nodes let go once its source has ended (CASEBOOK 325): the source, its filter and its envelope
 *  disconnected, so the graph holds only what still sounds. Nothing else was ever connected to them. */
const letGo = (src, ...rest) => { src.onended = () => { src.disconnect(); for (const n of rest) n.disconnect(); }; };

export class Sfx {
  constructor() {
    this.ctx = null;
    this.limits = new Map();
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // a phone (sfx.phone, set from the graphics' machine at boot: main.js) renders at a lower rate with a roomier buffer: every node's work
    // falls with the rate, and the device's own speaker ends near 16 kHz (docs/plans/MOBILE.md 6.5; measured: about 56 sources live at once)
    this.phone ??= isPhone();
    try { this.ctx = this.phone ? new AC({ latencyHint: 'balanced', sampleRate: PHONE.rate }) : new AC(); } catch { this.ctx = new AC(); }
    this.main = this.ctx.createGain();
    this.main.gain.value = T.audio.volume;
    this.master = this.ctx.createGain(); // (the sound effects' bus, through the fog's low-pass: the pall muffles the world, not the music)
    this.top = Math.min(22000, this.ctx.sampleRate / 2); // (the open filters' frequency, kept under the render rate's half: a phone's 32 kHz)
    this.fogLp = this.ctx.createBiquadFilter(); this.fogLp.type = 'lowpass'; this.fogLp.frequency.value = this.top; this.fogLp.Q.value = 0.5;
    this.underLp = this.ctx.createBiquadFilter(); this.underLp.type = 'lowpass'; this.underLp.frequency.value = this.top; this.underLp.Q.value = 0.6; // (the rail's Umbral form: setUnder)
    this.master.connect(this.fogLp).connect(this.underLp).connect(this.main);
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    // (the master bus runs through a low-pass that closes as time slows: see core/time.js)
    this.slowLp = this.ctx.createBiquadFilter(); this.slowLp.type = 'lowpass'; this.slowLp.frequency.value = this.top; this.slowLp.Q.value = 0.5;
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
    // the held loops (the skiff's run, its grind, wet sand, a shell's field): one bus, silenced while a menu is over the game
    this.loopBus = this.ctx.createGain(); this.loopBus.connect(this.master);
    this.recover();
  }

  /** The context kept alive on a phone (docs/plans/MOBILE.md 6.5): a hidden tab suspends it (its timers are throttled and nothing it
   *  schedules would land in time) and a visible one resumes it; an iOS interruption (a call, Siri: state 'interrupted', or 'suspended'
   *  with nobody asking) is resumed when it ends, and if the browser wants a gesture first, on the next touch, click or key. The
   *  schedulers' clock is the context's, so a suspended stretch is simply skipped: nothing piles up. */
  recover() {
    if (typeof document === 'undefined' || this._recover) return;
    const c = this.ctx, R = this._recover = { hidden: false, armed: false };
    const resume = () => { if (!R.hidden && c.state !== 'running' && c.state !== 'closed') c.resume().catch(() => {}).then(() => { if (c.state !== 'running') arm(); }); };
    const onGesture = () => { R.armed = false; for (const k of GESTURES) window.removeEventListener(k, onGesture, true); resume(); };
    const arm = () => { if (R.armed) return; R.armed = true; for (const k of GESTURES) window.addEventListener(k, onGesture, true); };
    document.addEventListener('visibilitychange', () => {
      R.hidden = document.hidden;
      if (R.hidden) { if (c.state === 'running') c.suspend().catch(() => {}); } else resume();
    });
    window.addEventListener('pageshow', () => { R.hidden = document.hidden; resume(); });
    c.addEventListener?.('statechange', () => { if (!R.hidden && c.state !== 'running') setTimeout(resume, 250); });
  }

  /** A menu is over the game (the ambience asks, audio/ambience.js menusUp): every held loop falls silent until it is gone. A loop that is
   *  only set while play steps would otherwise hold its last level under the pause menu. */
  quietLoops(on) {
    if (!this.loopBus || !!on === !!this._loopsQuiet) return; this._loopsQuiet = !!on;
    this.loopBus.gain.setTargetAtTime(on ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  /** Time has slowed to `s` (1 = normal): muffle the world in proportion. */
  setSlow(s) {
    if (!this.slowLp) return;
    const f = this.top * Math.pow(Math.max(0.03, Math.min(1, s)), 1.25);
    if (Math.abs(f - (this._slowF ?? this.top)) < 40) return;
    this._slowF = f;
    this.slowLp.frequency.setTargetAtTime(Math.max(300, f), this.ctx.currentTime, 0.05);
  }

  setVolume(v) { if (this.main) this.main.gain.value = v; }
  /** The fog (k 0..1): the world's sounds muffled under it (audio/ambience.js, the pall), the music and the voice untouched. */
  setFog(k = 0) { if (this.fogLp) this.fogLp.frequency.setTargetAtTime(this.top * Math.pow(900 / this.top, Math.max(0, Math.min(1, k))), this.ctx.currentTime, 0.8); }
  /** Under the crude (the rail's Umbral form): the world's effects muffled, as the music is (Arranger.setUnder); the interface untouched. */
  setUnder(on) { if (this.underLp) this.underLp.frequency.setTargetAtTime(on ? 900 : this.top, this.ctx.currentTime, on ? 0.12 : 0.2); }
  /** The sound effects lowered to `to` (1 restores) over `fade` seconds, under the music and the voice (a trailer, a cinematic). */
  duckEffects(to = 0.35, fade = 0.4) { if (this.master) this.master.gain.setTargetAtTime(Math.max(0.0001, to), this.ctx.currentTime, fade / 3); }

  makeNoise(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /** A reverb's impulse, made once a length and kept (every cue's convolver shares it); a phone's no longer than PHONE.verb s. */
  impulse(sec, decay) {
    if (this.phone) sec = Math.min(sec, PHONE.verb);
    const key = `${sec}:${decay}`, kept = (this.impulses ||= new Map()).get(key);
    if (kept && kept.sampleRate === this.ctx.sampleRate) return kept;
    const len = Math.round(this.ctx.sampleRate * sec);
    const b = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    this.impulses.set(key, b);
    return b;
  }

  // rate limiter so 200 shards landing at once don't melt the mixer
  allow(key, perSec) {
    const now = performance.now();
    if (this.limitTag) key = this.limitTag + key; // (a sound made elsewhere keeps its own limits: audio/positional.js)
    const last = this.limits.get(key); // (never played is not "played at time zero": the first one always sounds)
    if (last !== undefined && now - last < 1000 / perSec) return false;
    this.limits.set(key, now);
    return true;
  }

  /** A sound's way out: the effects bus (the world's: ducked and fogged), or with `ui` straight to main (the interface: never fogged). */
  out(gain, verb = 0.5, ui = false) {
    if (this.phone) (this.starts ||= []).push(performance.now()); // (a sound begun: the phone's budget, ok())
    this.begun = (this.begun || 0) + 1; // (counted for the audio's health: audio/health.js)
    const g = this.ctx.createGain();
    g.gain.value = gain;
    g.connect(ui ? this.main : this.route || this.master); // (`route`: a sound made somewhere else, panned and rolled off: audio/positional.js)
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
    src.connect(flt).connect(env).connect(dest); letGo(src, flt, env);
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
    o.connect(env).connect(dest); letGo(o, env);
    o.start(t); o.stop(t + dur + 0.02);
  }

  /** The mixer can sound now: the context running, and on a phone not more than PHONE.burst sounds begun in the last PHONE.window ms (a
   *  burst past it is dropped, the first ones kept: the phone's audio thread never falls behind). */
  ok() {
    if (!this.ctx || this.ctx.state !== 'running') return false;
    if (!this.phone || !this.starts) return true;
    const now = performance.now(), S = this.starts; while (S.length && now - S[0] > PHONE.window) S.shift();
    return S.length < PHONE.burst;
  }

  /** A blow's sound may sound (a hit, its damage, its stun's tick): on a desk always; on a phone one of them each PHONE.hit real ms, so a
   *  gun landing eight times a real second (the fight at the helm, world/opensea/seafight.js) is heard as a hail, not as three stacked
   *  sounds a hit, and the phone's audio thread keeps up (the owner, 2026-10-26: "audio processing breaks down after ... the ship's gun
   *  starts firing"). */
  hitOk() {
    if (!this.phone) return true;
    const now = performance.now(); if (now - (this._hitAt ?? -1e9) < PHONE.hit) return false;
    this._hitAt = now; return true;
  }

  /** A gliding tone that swells as it climbs (a riser): `tone` only decays, and a build-up has to grow. */
  riser(t, dur, { f0 = 100, f1 = 800, type = 'sawtooth', gain = 0.2, q = 0, dest }) {
    const o = this.ctx.createOscillator(), env = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(gain, t + dur * 0.92); env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.03);
    let n = o;
    if (q > 0) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = q; f.frequency.setValueAtTime(f0 * 2, t); f.frequency.exponentialRampToValueAtTime(f1 * 5, t + dur); o.connect(f); n = f; }
    n.connect(env).connect(dest); letGo(o, ...(n === o ? [] : [n]), env);
    o.start(t); o.stop(t + dur + 0.06);
  }
}
