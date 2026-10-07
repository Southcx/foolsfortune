// A sound bank of the one mixer (audio/sfx.js): the Spirit Garden's own (docs/plans/SPIRIT-GARDEN.md): the spirits' voices and the
// hand's clay.
//   SPIRITVOICE  a spirit's voice, Chao-like: a small throat (a buzz high up, through two formants scaled for a body the size of a cat),
//                a syllable or two whose tune says the mood:
//                  happy   "cha-o!": up, then a hop up again          sad    a long fall, the vowel closing
//                  eat     three quick "nom"s, low and round           hurt   a yelp straight up, cut short
//                  call    two notes, the second higher (hello?)       cheer  a little arpeggio up (a form reached)
//                  effort  a grunt and a squeak (a drill)              sleep  a breath of a hum, slow
//                its feeling (an aspect) bends the leap: mirth a major third, wonder a fourth, desire a fifth, grief a minor third, dread a
//                half step (the Tear); `pitch` scales the throat (a big spirit lower, a hatchling higher)
//   SCULPT       the hand's clay (garden.sculpt): press (a wet squelch and a soft thud), pull (a rubbery stretch rising), smooth (a damp
//                swish), carve (a scrape, grit in it)
// Heard through audio/cues.js on spirit.feed, .drill, .mature, .merge, .release, .visit, .pet, .flick and garden.sculpt; the garden's
// spirits may also call `sfx.spiritVoice(mood, { feeling, pitch, dist })` for their idle chatter.
// Prior art: the Chao of Sonic Adventure (a voice of a few syllables, all feeling, no words), Animalese and the Banjo-Kazooie gibberish
// (pitch contour as meaning), and potters' wheels and wet clay (Foley: a hand in a bucket of slip).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const LEAP = { mirth: 4, wonder: 5, desire: 7, grief: 3, dread: 1 }; // (semitones: each feeling's interval)
const VOWEL = { a: [900, 1500], o: [600, 1000], u: [380, 900], i: [400, 2400], e: [650, 2000] }; // (two formants, an adult's; scaled up for a small throat)

export class SpiritSounds {
  /** One syllable: a buzz gliding f0 to f1 through a vowel's formants (scaled `size` up), into `dest`. */
  syllable(t, dur, f0, f1, vowel, gain, dest, { size = 1.5, vib = 0.02 } = {}) {
    const c = this.ctx, g = c.createGain(), o = c.createOscillator();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur * 0.9);
    const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 7; lg.gain.value = f0 * vib; l.connect(lg).connect(o.frequency); // (a little tremble)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.015); g.gain.setValueAtTime(gain * 0.8, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [k, f] of (VOWEL[vowel] || VOWEL.a).entries()) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * size; bp.Q.value = 6; const bg = c.createGain(); bg.gain.value = k ? 0.6 : 1; o.connect(bp).connect(bg).connect(g); }
    g.connect(dest); o.start(t); o.stop(t + dur + 0.05); l.start(t); l.stop(t + dur + 0.05);
  }
  spiritVoice(mood = 'happy', { feeling = 'mirth', pitch = 1, dist = 3 } = {}) {
    if (!this.ok() || !this.allow(`spiritVoice.${mood}`, 3)) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.5, 0.9 / (0.6 + dist * 0.12)), 0.35), f = 520 * pitch, up = Math.pow(2, (LEAP[feeling] ?? 4) / 12);
    const S = (at, dur, f0, f1, v, gain = 0.5) => this.syllable(t + at, dur, f0, f1, v, gain, d);
    if (mood === 'happy') { S(0, 0.13, f, f * up, 'a'); S(0.15, 0.2, f * up, f * up * up, 'o'); }
    else if (mood === 'sad') S(0, 0.55, f * up, f * 0.7, 'u', 0.4);
    else if (mood === 'eat') for (let k = 0; k < 3; k++) S(k * 0.12, 0.09, f * 0.8, f * 0.75, 'o', 0.35);
    else if (mood === 'hurt') S(0, 0.12, f, f * 2.2, 'i', 0.55);
    else if (mood === 'call') { S(0, 0.16, f, f, 'a'); S(0.22, 0.24, f * up, f * up * 1.02, 'o'); }
    else if (mood === 'cheer') [1, up, up * up, 2].forEach((r, k) => S(k * 0.09, k === 3 ? 0.3 : 0.1, f * r, f * r * (k === 3 ? 1.05 : 1), k === 3 ? 'o' : 'a'));
    else if (mood === 'effort') { S(0, 0.1, f * 0.6, f * 0.55, 'u', 0.4); S(0.13, 0.08, f * 1.4, f * 1.8, 'i', 0.35); }
    else if (mood === 'sleep') { S(0, 0.7, f * 0.7, f * 0.65, 'u', 0.18); this.noise(t, 0.6, { type: 'bandpass', f0: 1200, q: 1.5, gain: 0.05, attack: 0.25, dest: d }); }
  }
  sculpt(how = 'press', dist = 2) {
    if (!this.ok() || !this.allow(`sculpt.${how}`, 6)) return;
    const t = this.ctx.currentTime, d = this.out(Math.min(0.5, 0.8 / (0.6 + dist * 0.15)), 0.25);
    if (how === 'pull') { this.noise(t, 0.35, { type: 'bandpass', f0: 500, f1: 1400, q: 5, gain: 0.5, attack: 0.05, dest: d }); this.tone(t, 0.3, { f0: 180, f1: 320, type: 'triangle', gain: 0.18, dest: d }); }
    else if (how === 'smooth') this.noise(t, 0.4, { type: 'lowpass', f0: 1800, f1: 900, q: 0.8, gain: 0.35, attack: 0.12, dest: d });
    else if (how === 'carve') { this.noise(t, 0.28, { type: 'bandpass', f0: 2600, f1: 1800, q: 3, gain: 0.45, dest: d }); for (let k = 0; k < 5; k++) this.noise(t + k * 0.05, 0.02, { type: 'highpass', f0: 4000, gain: 0.25, dest: d }); }
    else { this.noise(t, 0.18, { type: 'lowpass', f0: 1100, f1: 300, q: 2, gain: 0.6, dest: d }); this.tone(t, 0.14, { f0: 120, f1: 70, gain: 0.35, dest: d }); } // (press: the squelch and the thud)
  }
}
