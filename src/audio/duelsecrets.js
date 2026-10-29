// ---------------------------------------------------------------------------------------
// AN ABERRANT'S OWN SOUNDS IN ITS DUEL (docs/plans/ABERRANTS.md, the Elite format: every aberrant sounds like itself): what its secret
// sounds like as it goes, heard only as the thing's own sound, never a cue that names the secret. A bank of the one mixer (audio/sfx.js).
// The first is the aberrant Lantern Wisp's lantern (ABERRANTS.md 3, secrets.js `snuff`):
//   THE GUTTER      secret.step { k, n }: the flame drawn down by the Dread you cleared: a soft gulp of air into the lantern and a glass
//                   ring that is its light, falling and thinning as k rises; past half it sputters (crackles that skip, the ring choking)
//   HALF SPENT      secret.half: the big gutter (the log's "The lantern gutters."): the flame nearly out, a choke, a breath, caught again
//   KINDLE          foe.skill 'kindle' (its cast, after the cut-in's sting, duelcasts.js STAB): a match struck, the flame catching with a
//                   rush, each Dread gem burnt to an ember a pop and a falling note
//   THE SNUFF       duel.secret { id: 'snuff' }: the light going out: a pinch of the wick (a short hiss falling), the glass ring drawn down
//                   into nothing, a beat of silence (the frame held in the dark), then one cold harmonic and the fen's low air. Against the
//                   Line's death (duelEnd, puzzleduel.js: the arpeggio climbing), this one ends with no fanfare: you put it out
// Prior art: Hollow Knight's lantern and Grimm's flame (a light as a voice), Dark Souls' bonfire kindling, the foley of a candle snuffer;
// the will-o'-the-wisp as Ghibli scores it (a flute off the beat leading you astray: music/duel.js's fen colour).
//
//   sfx.duelLantern(k, n)   sfx.duelLanternHalf()   sfx.duelKindle(n)   sfx.duelSnuff()
// ---------------------------------------------------------------------------------------
import { duelRoot } from './puzzleduel.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const LANTERN_PAN = 0.4; // (the foe's side, a little in from the edge: its lantern rides on its body)

export class DuelSecretSounds {
  /** The lantern drawn down by k (0..1, the share of its fuel taken), n the Dread gems cleared this time. */
  duelLantern(k = 0, n = 1) {
    if (!this.ok() || !this.allow('duelLantern', 3)) return;
    const t = this.ctx.currentTime + 0.05, d = this.duelOut(0.55, 0.5, LANTERN_PAN), r = duelRoot(this) + 7, lit = Math.max(0, 1 - k);
    this.noise(t, 0.28, { type: 'lowpass', f0: 900, f1: 260, gain: 0.22, attack: 0.03, dest: d }); // (air gulped into the lantern)
    const f = hz(r + 12 - Math.round(k * 7)); // (its light's ring, a fifth lower by the time it is spent)
    [1, 2.76, 5.4].forEach((q, j) => this.tone(t + 0.06, 0.6 + lit * 0.8, { f0: f * q, f1: f * q * (1 - 0.03 * k), gain: [0.05, 0.016, 0.006][j] * (0.4 + lit * 0.6), dest: d }));
    const pops = Math.min(6, Math.max(1, n | 0)) + (k >= 0.5 ? 2 : 0); // (past half it sputters: more pops, skipping)
    for (let i = 0; i < pops; i++) {
      const at = t + 0.08 + i * (0.05 + (k >= 0.5 && i % 2 ? 0.07 : 0)) + Math.random() * 0.02;
      this.noise(at, 0.012, { type: 'bandpass', f0: 2600 + Math.random() * 2400, q: 3, gain: 0.12 + 0.08 * k, dest: d });
    }
  }
  /** Half spent: the flame almost out, a choke and a breath, then caught again (smaller). */
  duelLanternHalf() {
    if (!this.ok() || !this.allow('duelLanternHalf', 0.5)) return;
    const t = this.ctx.currentTime + 0.35, d = this.duelOut(0.6, 0.6, LANTERN_PAN), f = hz(duelRoot(this) + 12);
    this.noise(t, 0.5, { type: 'bandpass', f0: 1400, f1: 300, q: 0.8, gain: 0.28, attack: 0.05, dest: d }); // (the gust that nearly takes it)
    this.tone(t, 0.45, { f0: f, f1: f * 0.7, gain: 0.05, dest: d }); // (its ring choked down)
    for (let i = 0; i < 5; i++) this.noise(t + 0.5 + i * 0.09 + i * i * 0.015, 0.012, { type: 'bandpass', f0: 3200, q: 3, gain: 0.14, dest: d }); // (sputtering)
    this.noise(t + 1.0, 0.4, { type: 'lowpass', f0: 500, f1: 900, gain: 0.16, attack: 0.15, dest: d }); // (caught: a soft breath back up)
    this.tone(t + 1.05, 1.2, { f0: f * 0.75, gain: 0.03, dest: d });
  }
  /** Kindle: a match struck, the flame catching, each of your Dread gems burnt to an ember (a pop and a falling note). */
  duelKindle(n = 3) {
    if (!this.ok() || !this.allow('duelKindle', 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.6, 0.45, 0.2), r = duelRoot(this);
    this.noise(t, 0.09, { type: 'bandpass', f0: 3500, f1: 1800, q: 1.5, gain: 0.4, dest: d }); // (the strike)
    this.noise(t + 0.08, 0.6, { type: 'lowpass', f0: 300, f1: 2400, gain: 0.3, attack: 0.25, dest: d }); // (the flame catching: a rush)
    this.tone(t + 0.1, 0.5, { f0: 60, f1: 95, type: 'sawtooth', gain: 0.03, dest: d });
    const p = this.ctx.createStereoPanner(); p.pan.value = -0.4; p.connect(d); // (the embers on your half)
    for (let i = 0; i < Math.min(5, Math.max(1, n | 0)); i++) {
      const at = t + 0.45 + i * 0.12;
      this.noise(at, 0.03, { type: 'bandpass', f0: 1800, q: 2, gain: 0.3, dest: p });
      this.tone(at, 0.35, { f0: hz(r + 19), f1: hz(r + 7), type: 'triangle', gain: 0.05, dest: p }); // (Dread's note burnt down an octave)
    }
    setTimeout(() => p.disconnect(), 2500);
  }
  /** The snuff: the light going out, then the dark held a beat, then one cold harmonic. No fanfare: you put it out. */
  duelSnuff() {
    if (!this.ok() || !this.allow('duelSnuff', 0.2)) return;
    const t = this.ctx.currentTime + 0.05, d = this.duelOut(0.5, 0.8, LANTERN_PAN * 0.5), r = duelRoot(this), f = hz(r + 7);
    this.noise(t, 0.22, { type: 'bandpass', f0: 5000, f1: 900, q: 1, gain: 0.3, dest: d }); // (the wick pinched)
    [1, 2.76].forEach((q, j) => this.tone(t, 1.1, { f0: f * q, f1: f * q * 0.5, gain: [0.06, 0.02][j], dest: d })); // (its ring drawn down into the lantern)
    this.noise(t + 0.15, 0.9, { type: 'lowpass', f0: 700, f1: 120, gain: 0.2, attack: 0.05, dest: d }); // (the flame sucked in)
    const cold = t + 2.0; // (a beat of silence first: the frame held in the dark)
    this.tone(cold, 3.2, { f0: hz(r + 24), gain: 0.035, dest: d }); this.tone(cold, 3.2, { f0: hz(r + 31), gain: 0.012, dest: d }); // (one cold harmonic and its fifth)
    this.tone(cold, 3.5, { f0: hz(r - 24), gain: 0.06, dest: d });
    this.noise(cold, 3.5, { type: 'lowpass', f0: 380, gain: 0.07, attack: 1, dest: d }); // (the fen's night air, with nothing lit)
  }
}
