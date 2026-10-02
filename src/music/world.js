// ---------------------------------------------------------------------------------------
// THE WIDER BAND: the instruments from the rest of the world, mixed onto the Band (music/band.js) the way the sound banks are mixed
// onto the Sfx, so a score asks for them by name like any other ({ i: 'sitar', ... }). The band's first players were the East's and the
// concert hall's; these are the West's, the islands', the subcontinent's and the sea's, for the fusion the game is scored in.
//
//   SITAR       a bright string through the jawari: the flat bridge the string grazes, which makes the sound buzz and its overtones
//               sweep downward as the note dies (a band-pass falling from high to low); sympathetic strings (the taraf) ringing
//               behind it; meend, the slow bend from one note into another
//   TANPURA     the drone: four long plucks of the same jawari string (Pa Sa Sa Sa), round and round, under everything
//   TABLA       the pair of drums: the dayan's ringing strokes (na, tin: a tuned skin with harmonic partials, which the black syahi
//               gives it) and the bayan's ge, a low boom whose pitch rises as the heel of the hand presses the skin; ka, a dry slap
//   STEELPAN    a hammered steel note: its fundamental, the octave and the twelfth tuned into the metal, a stick's tick; long notes
//               are rolled (struck again and again, fast)
//   CONCERTINA  free reeds in a box: two reeds a note tuned a little apart (the wet, "musette" beat), the bellows swelling
//   FIDDLE      one bow on one string: a saw through the violin body's resonances, the rosin's scratch, a player's vibrato
//   BODHRAN     the frame drum of the shanty: a deep, short boom, or a rim tap
//   MOOG        the fusion bass: a saw and a square through a resonant ladder low-pass that snaps open and closes (the Minimoog)
//   BUBBLE      a bubble rising: a damped sine whose pitch climbs as it goes
//   WHALE       a song in the deep: a slow glide from one note to another through a hollow resonance, long and far away
//   HARP        a plucked gut string: bright at the pluck, mellowing as it rings; `gliss` runs a scale up or down in a breath
//   VOICE       a wordless sung voice (a vocalise): a glottal buzz through three vowel formants, a glide into the note, a singer's
//               vibrato arriving late; the siren's
//   THEREMIN    a sine played in the air: no attack, a slide between notes, a wide quick vibrato; the witch's, and every flying saucer's
//
// Prior art: C. V. Raman on the jawari's buzz (1921); the tabla's harmonic overtones and the bayan's pressed glide (Raman, and every
// tabla primer); Rossing's acoustics of the Trinidad steelpan (the tuned octave and twelfth); the accordion's musette tuning; the
// violin's body modes (the Helmholtz bow-string, the A0 and B1 resonances); Moog's ladder filter; Klatt's formant synthesis and Debussy's wordless sirens (Nocturnes); Clara Rockmore's theremin and
// Herrmann's (The Day the Earth Stood Still); Minnaert and van den Doel on the
// sound of a bubble (a sine that rises as it decays); the humpback's song.
//
//   import { WorldBand } from './world.js'   (band.js mixes it in: B.sitar(t, dur, midi, vel, { meend, to }) ...)
// ---------------------------------------------------------------------------------------
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class WorldBand {
  /** The sitar: a pluck, the jawari's buzz sweeping down, the taraf behind; `to` (midi) with `meend` (0..1, when the bend starts). */
  sitar(t, dur, m, v = 0.5, { to = null, meend = 0.35, pan = 0.25, taraf = 0.5 } = {}) {
    const c = this.ctx, f = hz(m), d = Math.min(3.5, dur + 1.2), end = t + d;
    const o = this.out(this.bus.dry, 0.16, { verb: 0.45, echo: 0.12, pan });
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(v * 0.4, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, end);
    // the jawari: the buzz (an uneven clipper) and its overtone sweeping down from high to low
    const sh = c.createWaveShaper(), curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) { const x = (i / 511) * 2 - 1; curve[i] = x > 0 ? Math.tanh(x * 2.2) : Math.tanh(x * 5) * 0.75; }
    sh.curve = curve;
    const sweep = this.filt('bandpass', f * 9, 3.5); sweep.frequency.setValueAtTime(Math.min(9000, f * 11), t); sweep.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2.2), t + Math.min(1.6, d * 0.6));
    const body = this.filt('lowpass', Math.min(9000, f * 8), 0.7), mix = c.createGain(); mix.gain.value = 1;
    const dc = this.filt('highpass', Math.max(50, f * 0.7), 0.7); // (the uneven clipper leaves an offset and a rumble under the note: taken out)
    g.connect(sh); sh.connect(sweep).connect(mix); sh.connect(body).connect(mix); mix.connect(dc).connect(o);
    for (const [type, a, r] of [['sawtooth', 0.7, 1], ['square', 0.25, 1.003]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, f * r, t, end, og);
      if (to != null) { const tb = t + dur * meend; x.frequency.setValueAtTime(f * r, tb); x.frequency.exponentialRampToValueAtTime(hz(to) * r, tb + Math.max(0.12, dur * 0.4)); }
    }
    const pk = c.createGain(); pk.gain.setValueAtTime(v * 0.5, t); pk.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); pk.connect(o); // (the mizrab, the wire plectrum)
    const hp = this.filt('highpass', 3500); this.noise(t, t + 0.03, hp); hp.connect(pk);
    if (taraf) { // (the sympathetic strings: the note's octave and fifth, waking a little after it and ringing on)
      const tg = c.createGain(); tg.gain.setValueAtTime(0.0001, t); tg.gain.linearRampToValueAtTime(v * 0.05 * taraf, t + 0.25); tg.gain.exponentialRampToValueAtTime(0.0001, end + 1);
      tg.connect(o); for (const r of [2, 3]) this.osc('sine', f * r, t, end + 1, tg);
    }
  }
  /** The tanpura: the drone's four strings plucked in turn across `dur` (Pa Sa Sa Sa on `m`, the Sa). */
  tanpura(t, dur, m, v = 0.3, { pa = 7, pan = -0.2 } = {}) {
    const step = dur / 4;
    [m - 12 + pa, m, m, m - 12].forEach((n, i) => this.sitar(t + i * step, step * 1.6, n, v * (i === 3 ? 1.1 : 0.85), { pan: pan + (i - 1.5) * 0.1, taraf: 0 }));
  }
  /** The tabla: 'na' and 'tin' (the dayan, tuned to `m`), 'ge' (the bayan's pressed boom), 'dha' (both), 'ka' (a dry slap). */
  tabla(t, v = 0.5, { stroke = 'na', m = 62, pan = 0.15 } = {}) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.4, { verb: 0.25, pan });
    if (stroke === 'na' || stroke === 'tin' || stroke === 'dha') {
      const f = hz(m), ring = stroke === 'tin' ? 0.55 : 0.28;
      for (const [r, a] of [[1, 1], [2, 0.5], [3, 0.3], [4, 0.15], [5, 0.1]]) {
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * v * 0.5, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + ring / Math.sqrt(r)); g.connect(o); this.osc('sine', f * r, t, t + ring + 0.05, g);
      }
      const ng = c.createGain(); ng.gain.setValueAtTime(v * 0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.015); ng.connect(o);
      const bp = this.filt('bandpass', 3000, 1.2); this.noise(t, t + 0.02, bp); bp.connect(ng);
    }
    if (stroke === 'ge' || stroke === 'dha') {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.9, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); g.connect(o);
      const x = this.osc('sine', 82, t, t + 0.75, g); x.frequency.setValueAtTime(78, t); x.frequency.exponentialRampToValueAtTime(118, t + 0.35); // (the heel pressing in)
    }
    if (stroke === 'ka') {
      const g = c.createGain(); g.gain.setValueAtTime(v * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); g.connect(o);
      const bp = this.filt('bandpass', 900, 1.5); this.noise(t, t + 0.06, bp); bp.connect(g);
    }
  }
  /** A steel pan note: the fundamental, the octave and the twelfth, a stick's tick; a long note is rolled when `roll` is set. */
  steelpan(t, dur, m, v = 0.5, { roll = dur > 1.2, pan = 0.1 } = {}) {
    const c = this.ctx, f = hz(m), o = this.out(this.bus.dry, 0.3, { verb: 0.35, echo: 0.1, pan });
    const hits = roll ? Math.max(1, Math.floor(dur / 0.07)) : 1;
    for (let h = 0; h < hits; h++) {
      const th = t + h * 0.07, vv = v * (h ? 0.55 : 1), dd = roll && h < hits - 1 ? 0.25 : Math.min(1.6, 0.6 + dur);
      for (const [r, a, k] of [[1, 1, 1], [2, 0.45, 0.6], [3, 0.2, 0.4], [4.02, 0.06, 0.2]]) {
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, th); g.gain.exponentialRampToValueAtTime(a * vv, th + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, th + dd * k); g.connect(o);
        const x = this.osc('sine', f * r, th, th + dd * k + 0.05, g); x.frequency.setValueAtTime(f * r * 1.006, th); x.frequency.exponentialRampToValueAtTime(f * r, th + 0.05);
      }
      const tg = c.createGain(); tg.gain.setValueAtTime(vv * 0.25, th); tg.gain.exponentialRampToValueAtTime(0.0001, th + 0.012); tg.connect(o);
      const bp = this.filt('bandpass', 2400, 2); this.noise(th, th + 0.015, bp); bp.connect(tg);
    }
  }
  /** A concertina: free reeds, two a note a little apart (the wet beat), the bellows swelling in and easing out. `m` may be a chord. */
  concertina(t, dur, m, v = 0.4, { pan = -0.2 } = {}) {
    const c = this.ctx, notes = [].concat(m), g = c.createGain(), end = t + dur + 0.12;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.04); g.gain.setTargetAtTime(v * 0.85, t + 0.06, dur * 0.5);
    g.gain.setValueAtTime(v * 0.8, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, end);
    const o = this.out(this.bus.dry, 0.085 / Math.sqrt(notes.length), { verb: 0.3, pan });
    const nasal = this.filt('peaking', 1400, 1.2); nasal.gain.value = 6; const lp = this.filt('lowpass', 4200, 0.6);
    g.connect(nasal).connect(lp).connect(o);
    for (const n of notes) for (const [type, cents] of [['square', -7], ['sawtooth', 7]]) { const x = this.osc(type, hz(n), t, end, g); x.detune.value = cents; }
  }
  /** A fiddle: one bowed string through the violin's body, the rosin's scratch at the start, a vibrato that comes in. */
  fiddle(t, dur, m, v = 0.4, { from = 0, pan = 0.3, vib = 0.012 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.03, v, dur, 0.12);
    const o = this.out(this.bus.dry, 0.14, { verb: 0.35, pan });
    const b1 = this.filt('peaking', 290, 2), b2 = this.filt('peaking', 520, 2), b3 = this.filt('peaking', 2800, 1.5), lp = this.filt('lowpass', 6500, 0.6);
    b1.gain.value = 6; b2.gain.value = 5; b3.gain.value = 7;
    g.connect(b1).connect(b2).connect(b3).connect(lp).connect(o);
    const x = this.osc('sawtooth', f * Math.pow(2, from / 12), t, end, g);
    if (from) x.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    this.vib(x, t, f, vib, 6, Math.min(0.25, dur * 0.4), end);
    const sg = c.createGain(); sg.gain.setValueAtTime(v * 0.35, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); sg.connect(o);
    const bp = this.filt('bandpass', 3500, 1); this.noise(t, t + 0.07, bp); bp.connect(sg);
  }
  /** The bodhrán: a deep short boom, or (`rim`) a tap of the stick at the frame. */
  bodhran(t, v = 0.6, { rim = false, pan = -0.1 } = {}) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.45, { verb: 0.25, pan }), g = c.createGain();
    if (rim) {
      g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); g.connect(o);
      const bp = this.filt('bandpass', 1800, 2); this.noise(t, t + 0.07, bp); bp.connect(g); return;
    }
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); g.connect(o);
    const x = this.osc('sine', 125, t, t + 0.4, g); x.frequency.exponentialRampToValueAtTime(68, t + 0.18);
    const ng = c.createGain(); ng.gain.setValueAtTime(v * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); ng.connect(o);
    const lp = this.filt('lowpass', 900); this.noise(t, t + 0.1, lp); lp.connect(ng);
  }
  /** The Moog: a saw and a square through a resonant low-pass that snaps open with each note and closes behind it. */
  moog(t, dur, m, v = 0.5, { cutoff = 1800, res = 7, glide = 0 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.005, v, dur, 0.08);
    const o = this.out(this.bus.pump, 0.13);
    const lp = this.filt('lowpass', cutoff, res); lp.frequency.setValueAtTime(Math.min(8000, cutoff * 2.5), t); lp.frequency.exponentialRampToValueAtTime(Math.max(120, f * 1.5), t + 0.25);
    const sat = c.createWaveShaper(); sat.curve = this.drive;
    g.connect(sat).connect(lp).connect(o); // (the drive before the filter, so the ladder takes its edge off)
    for (const [type, a, r] of [['sawtooth', 0.6, 1], ['square', 0.4, 0.5]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, f * r * (glide ? Math.pow(2, glide / 12) : 1), t, end, og);
      if (glide) x.frequency.exponentialRampToValueAtTime(f * r, t + 0.08);
    }
  }
  /** A bubble rising: a damped sine that climbs (size: bigger is lower and longer). */
  bubble(t, v = 0.3, { size = 1, pan = 0 } = {}) {
    const c = this.ctx, f = 900 / size, d = 0.06 * size + 0.03, o = this.out(this.bus.dry, 0.25, { verb: 0.5, echo: 0.15, pan: pan || (Math.random() - 0.5) * 0.8 });
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d); g.connect(o);
    const x = this.osc('sine', f, t, t + d + 0.02, g); x.frequency.exponentialRampToValueAtTime(f * 1.9, t + d);
  }
  /** A whale's call: a glide from `m` to `to` through a hollow resonance, slow in and slow out, far away. */
  whale(t, dur, m, v = 0.3, { to = m, pan = 0 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, Math.min(0.8, dur * 0.3), v, dur * 0.7, dur * 0.3 + 0.5);
    const o = this.out(this.bus.dry, 0.35, { verb: 0.9, echo: 0.4, pan });
    const bp = this.filt('bandpass', f * 2.5, 2.5), lp = this.filt('lowpass', 2200, 0.5); g.connect(bp).connect(lp).connect(o);
    for (const [type, a] of [['triangle', 1], ['sawtooth', 0.25]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, f, t, end, og); x.frequency.setValueAtTime(f, t + dur * 0.2); x.frequency.exponentialRampToValueAtTime(hz(to), t + dur * 0.8);
      this.vib(x, t, f, 0.01, 3.2, dur * 0.3, end);
    }
    bp.frequency.setValueAtTime(f * 2.5, t); bp.frequency.exponentialRampToValueAtTime(hz(to) * 2.5, t + dur * 0.8);
  }
  /** A clean electric guitar through a phaser (four all-pass stages swept slowly): the psychedelic rhythm and lead. */
  phaseguitar(t, dur, m, v = 0.4, { pan = -0.25, rate = 0.4, bend = 0 } = {}) {
    const c = this.ctx, notes = [].concat(m), g = c.createGain(), end = t + Math.min(3, dur + 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(v * 0.45, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, end);
    const o = this.out(this.bus.dry, 0.18 / Math.sqrt(notes.length), { verb: 0.35, echo: 0.35, pan });
    const lp = this.filt('lowpass', 3800, 0.7), dry = c.createGain(), wet = c.createGain(); dry.gain.value = 0.6; wet.gain.value = 0.6;
    g.connect(lp); lp.connect(dry).connect(o);
    let node = lp; const lfo = c.createOscillator(); lfo.frequency.value = rate; lfo.start(t); lfo.stop(end + 0.05);
    for (const fc of [300, 700, 1300, 2200]) { const ap = this.filt('allpass', fc, 0.6), lg = c.createGain(); lg.gain.value = fc * 0.6; lfo.connect(lg).connect(ap.frequency); node.connect(ap); node = ap; }
    node.connect(wet).connect(o);
    for (const n of notes) for (const [type, a] of [['sawtooth', 0.5], ['triangle', 0.7]]) {
      const og = c.createGain(); og.gain.value = a; og.connect(g);
      const x = this.osc(type, hz(n), t, end, og);
      if (bend) { x.frequency.setValueAtTime(hz(n), t + dur * 0.3); x.frequency.exponentialRampToValueAtTime(hz(n + bend), t + dur * 0.3 + 0.15); }
    }
  }
  /** A harp: a plucked string, a pluck's brightness falling away, a long ring. */
  harp(t, dur, m, v = 0.4, { pan = 0 } = {}) {
    const c = this.ctx, f = hz(m), d = Math.min(4, 1.2 + dur), o = this.out(this.bus.dry, 0.22, { verb: 0.55, echo: 0.1, pan: pan || Math.max(-0.5, Math.min(0.5, (m - 64) / 40)) });
    const lp = this.filt('lowpass', Math.min(9000, f * 8), 0.6); lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 2), t + 0.6);
    lp.connect(o);
    for (const [type, r, a] of [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.12]]) {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * a, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + d / r);
      g.connect(lp); this.osc(type, f * r, t, t + d / r + 0.05, g);
    }
  }
  /** A wordless voice: a buzz through the vowel's formants (a, o, u, i), a glide from `from` semitones, vibrato that comes in late. */
  voice(t, dur, m, v = 0.35, { vowel = 'a', from = 0, glide = 0.25, pan = 0, vib = 0.016 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, Math.min(0.18, dur * 0.3), v, dur, 0.3);
    const o = this.out(this.bus.dry, 0.5, { verb: 0.6, echo: 0.25, pan });
    const F = { a: [850, 1200, 2900], o: [500, 850, 2800], u: [350, 750, 2700], i: [320, 2600, 3200] }[vowel] || [850, 1200, 2900];
    for (const [k, fc] of F.entries()) { const bp = this.filt('bandpass', fc, [6, 9, 12][k]), bg = c.createGain(); bg.gain.value = [1, 0.5, 0.25][k]; g.connect(bp).connect(bg).connect(o); }
    const x = this.osc('sawtooth', f * Math.pow(2, from / 12), t, end, g);
    if (from) x.frequency.exponentialRampToValueAtTime(f, t + glide);
    this.vib(x, t, f, vib, 5.4, Math.min(0.5, dur * 0.4), end);
    const bg = c.createGain(); this.env(bg, t, 0.08, v * 0.05, dur, 0.3); bg.connect(o); const bp = this.filt('bandpass', 3000, 1); this.noise(t, end, bp); bp.connect(bg); // (the breath)
  }
  /** A theremin: a sine with a little of its octave, sliding in from `from` semitones, a wide quick vibrato, no attack to speak of. */
  theremin(t, dur, m, v = 0.3, { from = 0, glide = 0.18, pan = 0.2, vib = 0.022 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.09, v, dur, 0.25);
    const o = this.out(this.bus.dry, 0.32, { verb: 0.5, echo: 0.3, pan });
    const h = c.createGain(); h.gain.value = 0.18; h.connect(g); g.connect(o);
    for (const [r, dest] of [[1, g], [2, h]]) {
      const x = this.osc('sine', f * r * Math.pow(2, from / 12), t, end, dest);
      if (from) x.frequency.exponentialRampToValueAtTime(f * r, t + glide);
      this.vib(x, t, f * r, vib, 6.2, 0.15, end);
    }
  }
}
