// ---------------------------------------------------------------------------------------
// THE BAND: the main theme's instruments (music/fortune.js), each a few WebAudio nodes built for one note when it is played. Breath
// is life: the winds and the reed carry the tunes; the plucked strings and the drums hold the ground; the synths are the thin film
// of the digital laid over the physical (the supersaw, the sub, the growl), never the whole picture.
//
//   SHAKUHACHI  bamboo flute: a sine and a little of its octave, breath noise around the fundamental (strong in the attack: the
//               muraiki), a scoop up into the note (meri-kari), a late vibrato that grows, an optional bend
//   KOTO        plucked silk: a bright saw and triangle through a low-pass that closes as the string dies, a pick noise, a tiny
//               downward press at the tail (the left hand's oshi-de)
//   TAIKO       a skin: a falling sine, a body of low noise, a long room
//   HARMONICA   a free reed: saw and square through a nasal band-pass, the hand's tremolo, a bend up from below on blue notes
//   BRASS       two detuned saws through a filter that opens with the blow (the "blat"), a lip rise into the pitch
//   GUITAR      the electric lead: saw and square through a soft-clipping drive and a cabinet; bends, a wide wailing vibrato
//   SUPERSAW    five detuned saws a note, the chord held, through the drop's pump
//   SUB, GROWL  a sine under everything; a saw through a resonant low-pass swept by a tempo-locked LFO (the wobble)
//   KIT         kick, snare, clap, hats, a crash, a shaker; risers (noise swept up), a breath in, an impact
//   BELL        three inharmonic partials, struck
//
// Prior art: the physical-modelling intuitions of Karplus-Strong (a plucked string's brightness dies before its body does) and of
// Yamaha's VL1 for the winds (breath, scoop, vibrato as the note's life), the TR-808/909 kick and snare, the Roland JP-8000
// supersaw, and the "wobble" of dubstep (a filter swept in time); the shakuhachi's meri-kari and muraiki from Japanese practice.
//
//   const B = new Band(ctx, { dry, pump, verb, echo })      B.koto(t, dur, midi, vel)  ...  (dur in seconds)
// ---------------------------------------------------------------------------------------
export const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Band {
  constructor(ctx, bus, noise) {
    this.ctx = ctx; this.bus = bus; this.noiseBuf = noise;
    // a soft clipper for the guitar and the growl
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(x * 3.2) / Math.tanh(3.2); }
    this.drive = curve;
    this.nodes = [];
  }
  // ---- helpers
  out(dest, gain, { verb = 0, echo = 0, pan = 0 } = {}) {
    const c = this.ctx, g = c.createGain(); g.gain.value = gain;
    let o = g;
    if (pan) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); o = p; }
    o.connect(dest);
    if (verb) { const s = c.createGain(); s.gain.value = verb; o.connect(s).connect(this.bus.verb); }
    if (echo) { const s = c.createGain(); s.gain.value = echo; o.connect(s).connect(this.bus.echo); }
    return g;
  }
  env(g, t, a, peak, hold, rel) {
    const p = g.gain; p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(peak, t + a);
    if (hold > a) p.setValueAtTime(peak, t + hold); p.exponentialRampToValueAtTime(0.0001, t + Math.max(hold, a) + rel);
    return t + Math.max(hold, a) + rel;
  }
  osc(type, f, t, end, dest) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(end + 0.05); return o; }
  noise(t, end, dest, rate = 1) { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.playbackRate.value = rate; s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(end + 0.05); return s; }
  filt(type, f, q = 0.7) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  vib(o, t, f, depth, rate, delay = 0.3, end) {
    const c = this.ctx, l = c.createOscillator(), g = c.createGain(); l.frequency.value = rate;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(f * depth, t + delay + 0.4);
    l.connect(g).connect(o.frequency); l.start(t); l.stop(end + 0.05);
  }

  // ---- the winds and the reed
  shakuhachi(t, dur, m, v = 0.5, { bend = 0, scoop = 1, pan = -0.15 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.07, v, dur, 0.22);
    const o = this.out(this.bus.dry, 0.38, { verb: 0.55, echo: 0.18, pan });
    const lp = this.filt('lowpass', 3200); g.connect(lp).connect(o);
    for (const [r, a] of [[1, 1], [2, 0.12], [3, 0.05]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc('sine', f * r, t, end, og);
      if (scoop) { x.frequency.setValueAtTime(f * r * 0.94, t); x.frequency.exponentialRampToValueAtTime(f * r, t + 0.09); }
      if (bend) { x.frequency.setValueAtTime(f * r, t + dur * 0.55); x.frequency.exponentialRampToValueAtTime(f * r * Math.pow(2, bend / 12), t + dur * 0.9); }
      this.vib(x, t, f * r, 0.012, 5.2, Math.min(0.5, dur * 0.4), end);
    }
    // the breath: around the note, loud as it starts
    const bg = c.createGain(), bp = this.filt('bandpass', f * 1.5, 1.2); bg.connect(o);
    bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(v * 0.9, t + 0.03); bg.gain.exponentialRampToValueAtTime(v * 0.18, t + 0.2);
    bg.gain.setValueAtTime(v * 0.18, t + dur); bg.gain.exponentialRampToValueAtTime(0.0001, end);
    this.noise(t, end, bp); bp.connect(bg);
  }
  harmonica(t, dur, m, v = 0.5, { bend = 0, blue = false, pan = 0.2 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.03, v, dur, 0.12);
    const o = this.out(this.bus.dry, 0.16, { verb: 0.35, echo: 0.15, pan });
    const bp = this.filt('bandpass', 1300, 0.9), lp = this.filt('lowpass', 3600);
    g.connect(bp).connect(lp).connect(o);
    // the hand's tremolo
    const trem = c.createGain(); trem.gain.value = 1; const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6.2;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0.28, t + Math.min(0.6, dur * 0.6)); l.connect(lg).connect(trem.gain); l.start(t); l.stop(end + 0.05);
    trem.connect(g);
    for (const [type, a, d] of [['sawtooth', 0.6, 1], ['square', 0.4, 1.003]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(trem);
      const x = this.osc(type, f * d, t, end, og);
      if (blue) { x.frequency.setValueAtTime(f * d * 0.94, t); x.frequency.exponentialRampToValueAtTime(f * d, t + 0.14); }
      if (bend) { x.frequency.setValueAtTime(f * d, t + dur * 0.5); x.frequency.exponentialRampToValueAtTime(f * d * Math.pow(2, bend / 12), t + dur * 0.85); }
    }
    { const hp = this.filt('highpass', 3000), ng = c.createGain(); ng.gain.setValueAtTime(v * 0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); this.noise(t, t + 0.07, hp); hp.connect(ng).connect(o); } // (the breath at the reed)
  }
  brass(t, dur, m, v = 0.5, { stab = false, pan = 0 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, stab ? 0.012 : 0.09, v, stab ? Math.min(dur, 0.18) : dur, stab ? 0.14 : 0.3);
    const o = this.out(this.bus.pump, 0.11, { verb: 0.3, pan });
    const lp = this.filt('lowpass', 700, 1.4);
    lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(stab ? 4200 : 2600, t + (stab ? 0.03 : 0.12)); lp.frequency.exponentialRampToValueAtTime(stab ? 900 : 1500, t + (stab ? 0.25 : 0.6));
    g.connect(lp).connect(o);
    for (const d of [0.996, 1.004]) { const x = this.osc('sawtooth', f * d * 0.985, t, end, g); x.frequency.exponentialRampToValueAtTime(f * d, t + 0.05); }
  }

  // ---- strings and skins
  koto(t, dur, m, v = 0.5, { pan = 0.25, press = true } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = t + Math.min(2.2, dur + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, end);
    const o = this.out(this.bus.dry, 0.2, { verb: 0.4, echo: 0.08, pan });
    const lp = this.filt('lowpass', 5000, 2); lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + 0.45);
    g.connect(lp).connect(o);
    for (const [type, a] of [['sawtooth', 0.55], ['triangle', 0.6]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, f, t, end, og);
      if (press) { x.frequency.setValueAtTime(f, t + 0.35); x.frequency.linearRampToValueAtTime(f * 0.985, t + 0.7); }
    }
    const pk = c.createGain(); pk.gain.setValueAtTime(v * 0.7, t); pk.gain.exponentialRampToValueAtTime(0.0001, t + 0.02); pk.connect(o); // (the pick)
    const hp = this.filt('highpass', 2500); this.noise(t, t + 0.03, hp); hp.connect(pk);
  }
  taiko(t, v = 0.7, { size = 1, pan = 0 } = {}) {
    const c = this.ctx, g = c.createGain(), o = this.out(this.bus.dry, 0.5, { verb: 0.45, pan });
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9 * size); g.connect(o);
    const x = this.osc('sine', 95 / size, t, t + 1, g); x.frequency.exponentialRampToValueAtTime(42 / size, t + 0.3);
    const ng = c.createGain(); ng.gain.setValueAtTime(v * 0.6, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); ng.connect(o);
    const lp = this.filt('lowpass', 500); this.noise(t, t + 0.3, lp); lp.connect(ng);
  }

  // ---- the electric lead
  guitar(t, dur, m, v = 0.5, { bend = 0, bendAt = 0.25, from = 0, vib = 0.02, pan = 0.1 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.006, v, dur, 0.18);
    const o = this.out(this.bus.dry, 0.075, { verb: 0.4, echo: 0.3, pan });
    const pre = c.createGain(); pre.gain.value = 2.2;
    const sh = c.createWaveShaper(); sh.curve = this.drive; sh.oversample = '2x';
    const mid = c.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1100; mid.gain.value = 5; mid.Q.value = 0.8;
    const cab = this.filt('lowpass', 4200, 0.9), hp = this.filt('highpass', 110);
    g.connect(pre).connect(sh).connect(mid).connect(cab).connect(hp).connect(o);
    for (const [type, a, d] of [['sawtooth', 0.7, 1], ['square', 0.35, 1.002], ['sawtooth', 0.25, 2.001]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, f * d * Math.pow(2, from / 12), t, end, og);
      if (from) x.frequency.exponentialRampToValueAtTime(f * d, t + 0.12);
      if (bend) { x.frequency.setValueAtTime(f * d, t + dur * bendAt); x.frequency.exponentialRampToValueAtTime(f * d * Math.pow(2, bend / 12), t + dur * bendAt + 0.18); }
      this.vib(x, t, f * d, vib, 5.6, Math.min(0.35, dur * 0.4), end);
    }
  }

  // ---- the digital film
  supersaw(t, dur, notes, v = 0.3, { cutoff = 3200 } = {}) {
    const c = this.ctx, g = c.createGain(), end = this.env(g, t, 0.02, v, dur, 0.25);
    const o = this.out(this.bus.pump, 0.03, { verb: 0.25 });
    const lp = this.filt('lowpass', cutoff, 0.6); g.connect(lp).connect(o);
    for (const m of notes) for (const d of [-0.012, -0.005, 0, 0.006, 0.013]) {
      const p = c.createStereoPanner(); p.pan.value = d * 50; p.connect(g);
      this.osc('sawtooth', hz(m) * (1 + d), t, end, p);
    }
  }
  sub(t, dur, m, v = 0.6) {
    const c = this.ctx, g = c.createGain(), end = this.env(g, t, 0.01, v, dur, 0.08);
    const o = this.out(this.bus.pump, 0.5); g.connect(o);
    this.osc('sine', hz(m), t, end, g);
  }
  growl(t, dur, m, v = 0.4, { rate = 4 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.01, v, dur, 0.06);
    const o = this.out(this.bus.pump, 0.07);
    const lp = this.filt('lowpass', 600, 9), sh = c.createWaveShaper(); sh.curve = this.drive;
    const l = c.createOscillator(), lg = c.createGain(); l.type = 'sine'; l.frequency.value = rate; lg.gain.value = 1400;
    lp.frequency.setValueAtTime(1500, t); l.connect(lg).connect(lp.frequency); l.start(t); l.stop(end + 0.05);
    g.connect(lp).connect(sh).connect(o);
    for (const d of [0.995, 1.005]) this.osc('sawtooth', f * d, t, end, g);
    this.osc('square', f / 2, t, end, g);
  }
  pad(t, dur, notes, v = 0.2, { cutoff = 1400 } = {}) {
    const c = this.ctx, g = c.createGain(), end = this.env(g, t, Math.min(1.5, dur * 0.4), v, dur, 1.2);
    const o = this.out(this.bus.dry, 0.05, { verb: 0.7 });
    const lp = this.filt('lowpass', cutoff, 0.5); g.connect(lp).connect(o);
    for (const m of notes) for (const d of [0.997, 1.003]) this.osc('sawtooth', hz(m) * d, t, end, g);
  }
  bell(t, m, v = 0.5) {
    const c = this.ctx, f = hz(m), o = this.out(this.bus.dry, 0.25, { verb: 0.6, echo: 0.2 });
    for (const [r, a, d] of [[1, 1, 3], [2.76, 0.35, 1.6], [5.4, 0.15, 0.8], [0.5, 0.4, 3.5]]) {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      g.connect(o); this.osc('sine', f * r, t, t + d, g);
    }
  }

  // ---- the concert hall: piano, strings, flute, pizzicato, celesta, marimba (Hisaishi's and Uematsu's rooms)
  /** A piano: six partials a string, slightly stretched (a real string's stiffness), two strings a note beating gently, the high
   *  partials dying first, a felt hammer's knock; the damper falls when the note is let go. */
  piano(t, dur, m, v = 0.5, { pan = 0, pedal = 0 } = {}) {
    const c = this.ctx, f = hz(m), B = 0.00035, T = Math.min(6, 2.8 * Math.sqrt(262 / f)), off = t + dur + pedal;
    const o = this.out(this.bus.dry, 0.34, { verb: 0.45, pan: pan || Math.max(-0.5, Math.min(0.5, (m - 60) / 50)) });
    const lp = this.filt('lowpass', Math.min(12000, 1800 + v * 7000 + f * 2)); lp.connect(o);
    const end = off + 0.25;
    for (let n = 1; n <= 6; n++) {
      const fn = n * f * Math.sqrt(1 + B * n * n);
      if (fn > 14000) break;
      const a = Math.pow(n, -1.25) * (n === 1 ? 1 : 0.35 + v * 0.65), tau = T / (1 + (n - 1) * 0.7);
      for (const d of [1, 1.0007]) {
        const g = c.createGain(); g.connect(lp);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * v * 0.5, t + 0.003);
        g.gain.setTargetAtTime(0.0001, t + 0.003, tau); g.gain.setTargetAtTime(0.0001, off, 0.06);
        this.osc('sine', fn * d, t, end, g);
      }
    }
    const hg = c.createGain(); hg.gain.setValueAtTime(v * 0.25, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); hg.connect(o);
    const hl = this.filt('bandpass', Math.min(4000, f * 3), 1.5); this.noise(t, t + 0.04, hl); hl.connect(hg);
  }
  /** A string section: three bows a note (detuned saws), a soft attack, the vibrato arriving late, a gentle filter. */
  strings(t, dur, m, v = 0.4, { pan = 0, attack = 0.25, bright = 2600, spic = false } = {}) {
    const notes = Array.isArray(m) ? m : [m], c = this.ctx, g = c.createGain();
    const end = this.env(g, t, spic ? 0.015 : attack, v, spic ? Math.min(dur, 0.12) : dur, spic ? 0.12 : 0.45);
    const o = this.out(this.bus.dry, 0.05, { verb: 0.55, pan });
    const lp = this.filt('lowpass', bright, 0.5); g.connect(lp).connect(o);
    for (const n of notes) {
      const f = hz(n);
      for (const [d, p] of [[0.996, -0.3], [1, 0], [1.005, 0.3]]) {
        const pn = c.createStereoPanner(); pn.pan.value = p; pn.connect(g);
        const x = this.osc('sawtooth', f * d, t, end, pn);
        this.vib(x, t, f * d, 0.006, 5.3 + d, Math.min(0.4, dur * 0.3), end);
      }
    }
  }
  /** A concert flute: purer than the shakuhachi (a sine and a breath of its octave), a little breath, a singer's vibrato. */
  flute(t, dur, m, v = 0.5, { pan = -0.1 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.05, v, dur, 0.18);
    const o = this.out(this.bus.dry, 0.32, { verb: 0.5, echo: 0.12, pan }); g.connect(o);
    for (const [r, a] of [[1, 1], [2, 0.18], [3, 0.04]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc('sine', f * r, t, end, og);
      this.vib(x, t, f * r, 0.008, 5, Math.min(0.35, dur * 0.4), end);
    }
    const bg = c.createGain(), bp = this.filt('bandpass', f * 2, 2); bg.gain.setValueAtTime(v * 0.25, t); bg.gain.exponentialRampToValueAtTime(v * 0.05, t + 0.15);
    bg.gain.setValueAtTime(v * 0.05, t + dur); bg.gain.exponentialRampToValueAtTime(0.0001, end); this.noise(t, end, bp); bp.connect(bg).connect(o);
  }
  pizz(t, dur, m, v = 0.5, { pan = 0 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), o = this.out(this.bus.dry, 0.22, { verb: 0.35, pan });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    const lp = this.filt('lowpass', Math.min(5000, f * 5)); g.connect(lp).connect(o);
    this.osc('triangle', f, t, t + 0.4, g); this.osc('sine', f * 2, t, t + 0.2, g);
  }
  celesta(t, dur, m, v = 0.4) {
    const c = this.ctx, f = hz(m), o = this.out(this.bus.dry, 0.2, { verb: 0.55, echo: 0.2 });
    for (const [r, a, d] of [[1, 1, 1.4], [4, 0.25, 0.4], [10, 0.06, 0.15]]) {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      g.connect(o); this.osc('sine', f * r, t, t + d, g);
    }
  }
  marimba(t, dur, m, v = 0.5, { pan = 0 } = {}) {
    const c = this.ctx, f = hz(m), o = this.out(this.bus.dry, 0.26, { verb: 0.3, pan });
    for (const [r, a, d] of [[1, 1, 0.5], [3.93, 0.3, 0.12], [9.2, 0.08, 0.05]]) {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + d * Math.sqrt(440 / f));
      g.connect(o); this.osc('sine', f * r, t, t + d * Math.sqrt(440 / f) + 0.05, g);
    }
  }

  // ---- the kit
  kick(t, v = 1) {
    // (rounder and shorter than a club kick: it sits under the taiko and the strings, it does not lead)
    const c = this.ctx, g = c.createGain(), o = this.out(this.bus.dry, 0.48);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); g.connect(o);
    const x = this.osc('sine', 130, t, t + 0.32, g); x.frequency.exponentialRampToValueAtTime(48, t + 0.1);
    const k = c.createGain(); k.gain.setValueAtTime(v * 0.22, t); k.gain.exponentialRampToValueAtTime(0.0001, t + 0.012); k.connect(o);
    this.osc('square', 1800, t, t + 0.02, k);
    this.bus.kicked?.(t);
  }
  snare(t, v = 0.8, { tone = 190 } = {}) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.42, { verb: 0.25 });
    const ng = c.createGain(); ng.gain.setValueAtTime(v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); ng.connect(o);
    const bp = this.filt('bandpass', 2400, 0.7); this.noise(t, t + 0.22, bp); bp.connect(ng);
    const tg = c.createGain(); tg.gain.setValueAtTime(v * 0.7, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); tg.connect(o);
    const x = this.osc('triangle', tone, t, t + 0.12, tg); x.frequency.exponentialRampToValueAtTime(tone * 0.7, t + 0.1);
  }
  clap(t, v = 0.6) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.35, { verb: 0.35 });
    for (let i = 0; i < 3; i++) {
      const s = t + i * 0.011, g = c.createGain(); g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(0.0001, s + (i === 2 ? 0.16 : 0.02)); g.connect(o);
      const bp = this.filt('bandpass', 1300, 1.5); this.noise(s, s + 0.18, bp); bp.connect(g);
    }
  }
  hat(t, v = 0.3, open = false) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.16, { pan: 0.2 }), g = c.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.28 : 0.045)); g.connect(o);
    const hp = this.filt('highpass', 7500); this.noise(t, t + 0.3, hp, 1.4); hp.connect(g);
  }
  shaker(t, v = 0.2) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.1, { pan: -0.3 }), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); g.connect(o);
    const bp = this.filt('bandpass', 6000, 1.2); this.noise(t, t + 0.08, bp); bp.connect(g);
  }
  crash(t, v = 0.5) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.2, { verb: 0.4 }), g = c.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); g.connect(o);
    const hp = this.filt('highpass', 4500); this.noise(t, t + 2.5, hp, 0.9); hp.connect(g);
  }
  /** Noise swept up over `dur` seconds (the build's lift). */
  riser(t, dur, v = 0.3) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.25, { verb: 0.5 }), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05); g.connect(o);
    const bp = this.filt('bandpass', 300, 2.5); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur);
    this.noise(t, t + dur + 0.1, bp); bp.connect(g);
    const x = this.osc('sawtooth', 110, t, t + dur, this.filt('lowpass', 2000)); x.frequency.exponentialRampToValueAtTime(880, t + dur);
  }
  /** A breath drawn in before the drop: breath is life. */
  breath(t, dur, v = 0.4) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.4, { verb: 0.3 }), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(o);
    const bp = this.filt('bandpass', 900, 1.4); bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(2200, t + dur);
    this.noise(t, t + dur, bp, 0.8); bp.connect(g);
  }
  impact(t, v = 0.8) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.6, { verb: 0.6 }), g = c.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); g.connect(o);
    const x = this.osc('sine', 70, t, t + 1.6, g); x.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    this.crash(t, 0.5);
  }
}
