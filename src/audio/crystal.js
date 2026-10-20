// A sound bank of the one mixer (audio/sfx.js): the crystals of Lachryma, tuned by ear (world/dunes/crystaltuning.js, world/dunes/crystals.js).
// The ear does the work here, so the notes must be true: a clear fundamental at the note asked, the glass's partials above it, and
// the beating made the honest way (two tones `beat` Hz apart, as two strings a little out of tune waver).
// THE SINGING STONE (the open sea's echo puzzle, Dovina's world/opensea/puzzlepieces.js): `stoneSing(midi)` sings a phrase's note in
// stone and wind, a ringing rock (a lithophone) with breath over its mouth: the fundamental strong and true so the Crucibelle's bell can
// match it by ear, an octave and a soft twelfth over it, the strike short and the breath long.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
//
// Prior art: a guitarist tuning by beats; struck glass (bright, long) and stone (fewer partials, duller, sooner gone);
// Skyward Sword's dowsing and the Zelda ocarina (a note that tells you where you are); Breath of the Wild's ore strike and shrine chime.
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class CrystalSounds {
  /** The reference: the sweet spot's own note, the formation ringing in sympathy with the fork struck into it (the fork itself is
   *  struck at this note too, while it rings: tools.js fork). */
  crystalRef(midi, secs = 6) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.8, 0.6), f = hz(midi); // (R40: louder, the music ducked under it: crystals.js)
    this.refPitch = { midi, until: t + secs };
    for (const [r, a, len] of [[1, 0.34, 4.5], [1.0015, 0.12, 4], [2, 0.08, 2.5], [2.32, 0.05, 1.5], [4.25, 0.02, 0.8]]) {
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      g.connect(d); const o = c.createOscillator(); o.frequency.value = f * r; o.connect(g); o.start(t); o.stop(t + len + 0.05);
    }
  }

  /** A pick's strike: the tick of the pick, then the note. `beat` Hz of wavering (0 pure .. 8 fast) tells how far round from the spot;
   *  a dense (stony) formation rings shorter and duller than a fragile (glassy) one; the last strike breaks it. */
  crystalStrike(midi, beat = 0, { dense = false, last = false } = {}) {
    if (!this.ok() || !this.allow('crystalStrike', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.75, 0.5), f = hz(midi), len = dense ? 1.1 : 1.8;
    this.noise(t, 0.015, { type: 'bandpass', f0: dense ? 2600 : 4200, q: 4, gain: 0.6, dest: d }); // (the pick)
    if (dense) this.tone(t, 0.09, { f0: 220, f1: 140, type: 'triangle', gain: 0.25, dest: d }); // (stone's knock)
    // (the partials kept nearly harmonic and the fundamental strong: the note has to be heard true, higher or lower; a free bar's 2.32
    //  and 4.25 made the pitch ambiguous, so the glass is left in the brightness and the decay)
    const parts = dense ? [[1, 0.3, 1], [2, 0.08, 0.5], [2.9, 0.04, 0.25]] : [[1, 0.3, 1], [2, 0.08, 0.6], [3.01, 0.04, 0.35], [5.97, 0.015, 0.2]];
    for (const [r, a, k] of parts) {
      this.tone(t, len * k, { f0: f * r, f1: f * r * 0.9995, gain: a, dest: d });
      if (beat > 0.05) this.tone(t, len * k, { f0: (f + beat) * r, f1: (f + beat) * r * 0.9995, gain: a * 0.95, dest: d }); // (the beating)
    }
    if (last) { // (it gives: a crack running through it, and pieces)
      this.noise(t + 0.05, 0.22, { type: 'bandpass', f0: 3800, f1: 1400, q: 2, gain: 0.5, dest: d });
      for (let i = 0; i < 6; i++) this.noise(t + 0.08 + Math.random() * 0.25, 0.03, { type: 'bandpass', f0: 3000 + Math.random() * 4000, q: 8, gain: 0.35, dest: d });
    }
  }

  /** The sweet spot: a big consonant bloom on the note (the note, its fifth, its octave, its tenth), and a sparkle up its pentatonic. */
  crystalSweet(midi) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, d = this.out(0.6, 0.8);
    [[0, 0.24], [7, 0.16], [12, 0.14], [16, 0.1], [24, 0.05]].forEach(([st, a], i) => {
      const f = hz(midi + st), g = c.createGain(); g.gain.setValueAtTime(0.0001, t + i * 0.03); g.gain.exponentialRampToValueAtTime(a, t + 0.12 + i * 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2); g.connect(d);
      for (const det of [0.998, 1.002]) { const o = c.createOscillator(); o.frequency.value = f * det; o.connect(g); o.start(t); o.stop(t + 3.3); }
    });
    [0, 2, 4, 7, 9, 12, 14, 16].forEach((st, i) => this.tone(t + 0.25 + i * 0.07, 0.5, { f0: hz(midi + 24 + st), f1: hz(midi + 24 + st), gain: 0.06, dest: d }));
    this.tone(t, 0.6, { f0: 70, f1: 50, gain: 0.25, dest: d }); // (the formation letting go, felt more than heard)
  }
  /** A singing stone's note (midi, as the Crucibelle's voice is asked: it sounds an octave up, where the bell does). */
  stoneSing(midi = 63, v = 0.5) {
    if (!this.ok() || !this.allow('stoneSing', 12)) return;
    const t = this.ctx.currentTime + 0.005, f = hz(midi + 12), d = this.out(0.5 * v + 0.1, 0.6);
    this.noise(t, 0.03, { type: 'bandpass', f0: f * 4, q: 3, gain: 0.25, dest: d }); // (the strike)
    this.tone(t, 1.3, { f0: f, gain: 0.32, dest: d }); this.tone(t, 0.7, { f0: f * 2, gain: 0.07, dest: d }); this.tone(t, 0.4, { f0: f * 3, gain: 0.025, dest: d });
    this.noise(t + 0.02, 1.1, { type: 'bandpass', f0: f, q: 18, gain: 0.5, attack: 0.25, dest: d }); // (the wind across it, at its pitch)
  }
  /** A phrase answered (sea.echo): the stone sings a rising triad back, the last note held with the wind. */
  stoneAnswered(root = 63) {
    if (!this.ok() || !this.allow('stoneAnswered', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.7);
    [0, 4, 7, 12].forEach((x, k) => { const f = hz(root + 12 + x), at = t + k * 0.14; this.tone(at, k === 3 ? 2 : 0.9, { f0: f, gain: 0.22, dest: d }); this.tone(at, 0.5, { f0: f * 2, gain: 0.05, dest: d }); });
    this.noise(t + 0.42, 1.8, { type: 'bandpass', f0: hz(root + 24), q: 18, gain: 0.5, attack: 0.3, dest: d });
  }
}
