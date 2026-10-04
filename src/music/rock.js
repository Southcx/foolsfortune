// ---------------------------------------------------------------------------------------
// THE ROCK RIG: the band's hard-rock instruments, mixed onto the Band (music/band.js) as the wider band is (music/world.js), so a score
// asks for them by name. Made for the overture (music/overture.js): a JRPG opening played by a hair-metal band.
//
//   CHUG      the rhythm guitar: a power chord (root, fifth, octave) through high gain and a 4x12 cabinet, double-tracked (two takes,
//             hard left and right, a few cents and a few milliseconds apart: the wall); `mute` is the palm on the strings (a dark,
//             short "chug"), open it rings
//   SHRED     the lead: high gain and long sustain, a wide vibrato arriving late, bends (`bend`), a slide in (`from`), a pinch harmonic
//             (`pinch`: the squeal two octaves and a fifth up, there and gone), a dive (`dive`: the bar pushed down at the end)
//   PICK      the bass guitar, played with a pick: a saw and a square through a closing low-pass, the pick's click, a sub under it
//   BIGKICK   a rock kick: a beater's click, a punch falling fast, a body; it pumps the bus like the kick
//   BIGSNARE  the eighties' gated snare: the stick and the shell, then a burst of dense room cut off dead (Phil Collins's "In the Air
//             Tonight", Hugh Padgham's gate)
//   TOM       a tom: a skin's pitch falling, a little stick noise; `pitch` sets the drum (rack high, floor low)
//   GANG      the gang shout: five voices on "hey!" (the formants of the vowel), a breath of "h" before it
//
// Prior art: the Marshall stack's sound as modelled (a hard-clipping gain stage, a mid hump, a cabinet's roll-off above 5 kHz), the
// double-tracked rhythm guitars of every eighties metal record, Eddie Van Halen's and Tak Matsumoto's leads (the wide vibrato, the
// pinch harmonic, the whammy dive), the gated-reverb snare, and the stadium "hey!" (Def Leppard, B'z).
//
//   import { RockBand } from './rock.js'   (band.js mixes it in: B.chug(t, dur, midi, vel, { mute }) ... B.bigsnare(t, vel))
// ---------------------------------------------------------------------------------------
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class RockBand {
  /** The high-gain curve (made once a band): hard, near-square clipping. */
  gain() {
    if (this.metal) return this.metal;
    const curve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) { const x = (i / 2047) * 2 - 1; curve[i] = Math.tanh(x * 9) / Math.tanh(9); }
    return (this.metal = curve);
  }
  /** An amp and its cabinet, into `dest`: input gain, the clipper, the mid hump, the cabinet's roll-off. Returns the input. */
  amp(dest, { drive = 3, low = 90, high = 5200, mid = 1400 } = {}) {
    const c = this.ctx, pre = c.createGain(); pre.gain.value = drive;
    const tight = this.filt('highpass', 120, 0.7); // (a tube screamer's tightening: no flub in the clipper)
    const sh = c.createWaveShaper(); sh.curve = this.gain(); sh.oversample = '2x';
    const hump = c.createBiquadFilter(); hump.type = 'peaking'; hump.frequency.value = mid; hump.gain.value = 5; hump.Q.value = 0.7;
    const cab = this.filt('lowpass', high, 0.8), cab2 = this.filt('lowpass', high * 1.3, 0.5), hp = this.filt('highpass', low, 0.7), hp2 = this.filt('highpass', low, 0.7);
    pre.connect(tight).connect(sh).connect(hump).connect(cab).connect(cab2).connect(hp).connect(hp2).connect(dest); // (two high-passes: the clipper's difference tone, an octave under the root, kept out)
    return pre;
  }

  chug(t, dur, m, v = 0.5, { mute = false, fifth = true, pan = 0.75 } = {}) {
    const c = this.ctx, notes = [m, ...(fifth ? [m + 7, m + 12] : [])];
    const len = mute ? Math.min(dur, 0.16) : dur, rel = mute ? 0.06 : 0.25;
    for (const [side, cents, late] of [[-1, -4, 0], [1, 5, 0.007]]) {
      const s = t + late, g = c.createGain(), end = this.env(g, s, 0.004, v, len, rel);
      const o = this.out(this.bus.dry, mute ? 0.05 : 0.042, { verb: mute ? 0.05 : 0.18, pan: side * pan });
      const tone = this.filt('lowpass', mute ? 650 : 3200, mute ? 1.1 : 0.6); // (the palm on the strings)
      g.connect(tone).connect(this.amp(o, { drive: mute ? 5 : 3.5, low: 100 })); // (the bass guitar has the floor)
      for (const n of notes) for (const [type, a] of [['sawtooth', 0.6], ['square', 0.25]]) {
        const og = c.createGain(); og.gain.value = a / notes.length; og.connect(g);
        this.osc(type, hz(n) * Math.pow(2, cents / 1200), s, end, og);
      }
    }
  }

  shred(t, dur, m, v = 0.5, { bend = 0, bendAt = 0.3, from = 0, vib = 0.03, pinch = false, dive = 0, pan = 0.12, verb = 0.45, echo = 0.32 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.005, v, dur, 0.22);
    const o = this.out(this.bus.dry, 0.06, { verb, echo, pan });
    g.connect(this.amp(o, { drive: 4, high: 6000, mid: 1600, low: 180 }));
    for (const [type, a, d] of [['sawtooth', 0.7, 1], ['square', 0.3, 1.003], ['sawtooth', 0.15, 2.002]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, f * d * Math.pow(2, from / 12), t, end, og);
      if (from) x.frequency.exponentialRampToValueAtTime(f * d, t + Math.min(0.12, dur * 0.4));
      if (bend) { x.frequency.setValueAtTime(f * d, t + dur * bendAt); x.frequency.exponentialRampToValueAtTime(f * d * Math.pow(2, bend / 12), t + dur * bendAt + 0.14); }
      if (dive) { x.frequency.setValueAtTime(f * d * Math.pow(2, bend / 12), t + dur * 0.7); x.frequency.exponentialRampToValueAtTime(f * d * Math.pow(2, (bend - dive) / 12), t + dur + 0.2); }
      this.vib(x, t, f * d, vib, 6.2, Math.min(0.3, dur * 0.45), end);
    }
    if (pinch) { // (the squeal: the thumb catches the string at a node)
      const pg = c.createGain(); pg.gain.setValueAtTime(v * 0.5, t); pg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.7, dur)); pg.connect(g);
      const x = this.osc('sine', f * 6, t, t + 0.75, pg); this.vib(x, t, f * 6, vib, 6.2, 0.05, t + 0.75);
    }
  }

  pick(t, dur, m, v = 0.5, { pan = 0 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.004, v, dur * 0.9, 0.08);
    const o = this.out(this.bus.pump, 0.065, { pan }), floor = this.filt('highpass', 38, 0.7); floor.connect(o); // (the drive saturates: the level is set here, not by the velocity)
    const lp = this.filt('lowpass', 1600, 1.2); lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.25);
    const sh = c.createWaveShaper(); sh.curve = this.drive;
    g.connect(lp).connect(sh).connect(floor);
    this.osc('sawtooth', f, t, end, g); this.osc('square', f * 1.002, t, end, g);
    const sg = c.createGain(); this.env(sg, t, 0.006, v * 0.3, Math.min(dur * 0.9, 0.18), 0.06); sg.connect(o); this.osc('sine', f, t, end, sg); // (the sub: the note's thump, not a drone)
    const kg = c.createGain(); kg.gain.setValueAtTime(v * 0.3, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.015); kg.connect(o);
    const kb = this.filt('bandpass', 2500, 2); this.noise(t, t + 0.02, kb); kb.connect(kg); // (the pick)
  }

  bigkick(t, v = 1) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.6);
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38); g.connect(o);
    const x = this.osc('sine', 160, t, t + 0.4, g); x.frequency.exponentialRampToValueAtTime(52, t + 0.06); x.frequency.exponentialRampToValueAtTime(44, t + 0.3);
    const k = c.createGain(); k.gain.setValueAtTime(v * 0.5, t); k.gain.exponentialRampToValueAtTime(0.0001, t + 0.008); k.connect(o);
    const kb = this.filt('bandpass', 3200, 1.5); this.noise(t, t + 0.01, kb); kb.connect(k); // (the beater)
    this.bus.kicked?.(t);
  }
  bigsnare(t, v = 0.8) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.5, { verb: 0.15 });
    const tg = c.createGain(); tg.gain.setValueAtTime(v * 0.8, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); tg.connect(o);
    const x = this.osc('triangle', 210, t, t + 0.14, tg); x.frequency.exponentialRampToValueAtTime(160, t + 0.1);
    const ng = c.createGain(); ng.gain.setValueAtTime(v, t); ng.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.05); ng.connect(o);
    ng.gain.setValueAtTime(v * 0.3, t + 0.22); ng.gain.linearRampToValueAtTime(0.0001, t + 0.24); // (the gate shuts)
    const bp = this.filt('bandpass', 1900, 0.6); this.noise(t, t + 0.26, bp); bp.connect(ng);
    const hg = c.createGain(); hg.gain.setValueAtTime(v * 0.4, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); hg.connect(o);
    const hp = this.filt('highpass', 5000); this.noise(t, t + 0.1, hp); hp.connect(hg); // (the wires)
  }
  tom(t, v = 0.7, { pitch = 120 } = {}) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.42, { verb: 0.3, pan: Math.max(-0.5, Math.min(0.5, (pitch - 110) / 120)) });
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); g.connect(o);
    const x = this.osc('sine', pitch * 1.6, t, t + 0.5, g); x.frequency.exponentialRampToValueAtTime(pitch, t + 0.05); x.frequency.exponentialRampToValueAtTime(pitch * 0.85, t + 0.45);
    const ng = c.createGain(); ng.gain.setValueAtTime(v * 0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); ng.connect(o);
    const bp = this.filt('bandpass', pitch * 8, 1); this.noise(t, t + 0.06, bp); bp.connect(ng);
  }
  gang(t, v = 0.5) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.32, { verb: 0.45 });
    const F = [[530, 6, 1], [1840, 9, 0.6], [2480, 12, 0.3]]; // ("e", as in "hey")
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    for (const [fc, q, a] of F) { const bp = this.filt('bandpass', fc, q), bg = c.createGain(); bg.gain.value = a; g.connect(bp).connect(bg).connect(o); }
    for (let k = 0; k < 5; k++) { // (five throats, none quite together)
      const f = 150 + k * 28 + Math.random() * 12, s = t + Math.random() * 0.02, p = c.createStereoPanner(); p.pan.value = (k - 2) * 0.3; p.connect(g);
      const x = this.osc('sawtooth', f * 1.12, s, t + 0.32, p); x.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.28);
    }
    const hg = c.createGain(); hg.gain.setValueAtTime(v * 0.5, t - 0.03); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); hg.connect(o);
    const hb = this.filt('bandpass', 1800, 0.8); this.noise(t - 0.03, t + 0.05, hb); hb.connect(hg); // (the "h")
  }
}
