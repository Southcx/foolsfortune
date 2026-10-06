// ---------------------------------------------------------------------------------------
// THE MODERN RIG: the instruments of the owner's ear (docs/OST.md section 6: the air on top, the drums, the bass that slides, the
// clean guitar that never sits still), mixed onto the Band (music/band.js) as the wider band and the rock rig are, so a score asks
// for them by name. Made to be laid over the cues that exist as layers and texture, not to rescore them (the owner, 2026-10-06).
//
//   TICK      a crisp closed hat: noise high up and two of the 808's metal squares, short; the trap hat's ratchets are written as ticks
//   OHAT      the open hat: the same, ringing a quarter of a second
//   SNAP      a finger snap: a bright click and a short burst, laid on a clap
//   EIGHT     the 808: a sine with a knock at its start, soft-clipped so a small speaker hears its harmonics; `from` slides into the
//             note from that many semitones away over `glide` seconds (the bass that bends: *Waterfalls*'s swoops, *Linoleum*'s dive)
//   SHIMMER   the air: the chord two and three octaves up, sparkling (a fast tremolo, a little out of step), with a breath of noise
//             above 8 kHz, swelling in; the energy above 2 kHz the cues lacked
//   TWINKLE   the clean tapped guitar: a bright pluck through a low-pass that closes fast, two takes a few cents apart and spread,
//             the pick's click, a dotted echo (math rock's and the Midwest's: Strawberry Girls, Ichika Nito, Yvette Young)
//   REVERSE   a reversed cymbal: noise swelling into the downbeat and cut dead on it (the breath before the drop)
//
// Prior art: the TR-808 (its hat's six detuned squares through a band-pass, its bass drum's long sine), the trap hat roll, future
// bass's shimmer and reversed swells (Porter Robinson, ILLENIUM), and the clean tapping of math rock.
//
//   import { ModernBand } from './modern.js'   (band.js mixes it in: B.tick(t, vel) ... B.eight(t, dur, midi, vel, { from, glide }))
// ---------------------------------------------------------------------------------------
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class ModernBand {
  /** A hat's body: noise high up and two of the 808's metal squares, into `g`. */
  hatBody(t, end, g) {
    const hp = this.filt('highpass', 7000, 0.7), bp = this.filt('bandpass', 10500, 0.9);
    this.noise(t, end, hp, 1.6); hp.connect(bp).connect(g);
    const mg = this.ctx.createGain(); mg.gain.value = 0.12; const mh = this.filt('highpass', 6000, 0.7); mg.connect(mh).connect(g);
    for (const f of [540, 800]) this.osc('square', f * 7.3, t, end, mg);
  }
  tick(t, v = 0.3, { pan = 0.3 } = {}) {
    const g = this.ctx.createGain(), o = this.out(this.bus.dry, 0.9, { pan });
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035); g.connect(o);
    this.hatBody(t, t + 0.04, g);
  }
  ohat(t, v = 0.3, { pan = -0.3 } = {}) {
    const g = this.ctx.createGain(), o = this.out(this.bus.dry, 0.6, { pan, verb: 0.15 });
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26); g.connect(o);
    this.hatBody(t, t + 0.27, g);
  }
  snap(t, v = 0.4) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.3, { verb: 0.3, pan: -0.1 }), g = c.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); g.connect(o);
    const bp = this.filt('bandpass', 2600, 2.5); this.noise(t, t + 0.06, bp); bp.connect(g);
    const k = c.createGain(); k.gain.setValueAtTime(v * 0.5, t); k.gain.exponentialRampToValueAtTime(0.0001, t + 0.008); k.connect(o);
    this.osc('triangle', 3200, t, t + 0.01, k);
  }

  eight(t, dur, m, v = 0.5, { from = 0, glide = 0.12 } = {}) {
    const c = this.ctx, f = hz(m), g = c.createGain(), end = this.env(g, t, 0.003, v, dur * 0.9, 0.12);
    const o = this.out(this.bus.pump, 0.12), sh = c.createWaveShaper(); sh.curve = this.drive; // (the clip's harmonics: heard on a laptop)
    const floor = this.filt('highpass', 32, 0.7); g.connect(sh).connect(floor).connect(o);
    const x = this.osc('sine', from ? f * Math.pow(2, from / 12) : f * 3, t, end, g);
    x.frequency.exponentialRampToValueAtTime(f, t + (from ? glide : 0.025)); // (a slide in, or the knock)
  }

  shimmer(t, dur, notes, v = 0.2) {
    const c = this.ctx, g = c.createGain(), end = this.env(g, t, Math.min(1.2, dur * 0.4), v, dur, 0.8);
    const o = this.out(this.bus.dry, 0.2, { verb: 0.6, echo: 0.2 }), hp = this.filt('highpass', 2200, 0.7); g.connect(hp).connect(o);
    const trem = c.createGain(); trem.gain.value = 0.6; trem.connect(g);
    const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 7 + Math.random() * 4; lg.gain.value = 0.4; l.connect(lg).connect(trem.gain); l.start(t); l.stop(end + 0.05);
    for (const [k, m] of notes.entries()) { this.osc('sine', hz(m + 24) * (1 + k * 0.0007), t, end, trem); this.osc('triangle', hz(m + 36) * 1.002, t, end, trem); }
    const ng = c.createGain(); ng.gain.value = 0.25; ng.connect(g); const nb = this.filt('bandpass', 9500, 0.8); this.noise(t, end, nb, 1.2); nb.connect(ng); // (the air itself)
  }

  twinkle(t, dur, m, v = 0.4, { pan = -0.45 } = {}) {
    const c = this.ctx, f = hz(m), d = Math.min(dur, 1.4) + 0.3;
    for (const [cents, side, late] of [[-4, 1, 0], [4, 0.55, 0.006]]) {
      const s = t + late, g = c.createGain(), o = this.out(this.bus.dry, 0.16, { pan: pan * side, verb: 0.3, echo: 0.28 });
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(v, s + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      const lp = this.filt('lowpass', 6500, 0.8); lp.frequency.setValueAtTime(6500, s); lp.frequency.exponentialRampToValueAtTime(1500, s + 0.3); g.connect(lp).connect(o);
      const fd = f * Math.pow(2, cents / 1200);
      for (const [type, r, a] of [['triangle', 1, 1], ['sine', 2.001, 0.35], ['sawtooth', 1, 0.12]]) { const og = c.createGain(); og.gain.value = a; og.connect(g); this.osc(type, fd * r, s, s + d, og); }
    }
    const k = c.createGain(); k.gain.setValueAtTime(v * 0.25, t); k.gain.exponentialRampToValueAtTime(0.0001, t + 0.012); k.connect(this.out(this.bus.dry, 0.1, { pan }));
    const kb = this.filt('bandpass', 3500, 1.5); this.noise(t, t + 0.02, kb); kb.connect(k); // (the pick)
  }

  reverse(t, dur, v = 0.3) {
    const c = this.ctx, o = this.out(this.bus.dry, 0.3, { verb: 0.15 }), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur - 0.01); g.gain.setValueAtTime(0, t + dur); g.connect(o); // (cut dead on the downbeat)
    const hp = this.filt('highpass', 900, 0.7); hp.frequency.setValueAtTime(900, t); hp.frequency.exponentialRampToValueAtTime(5000, t + dur);
    this.noise(t, t + dur + 0.02, hp, 0.9); hp.connect(g);
  }
}
