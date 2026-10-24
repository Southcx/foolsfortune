// ---------------------------------------------------------------------------------------
// THE SPIRIT GARDEN'S SMALL MOMENTS (docs/plans/GARDEN-COZY.md, Wanda's): the sounds of the garden's life that were silent until now,
// beside audio/garden.js (its bed and its tending), audio/spirits.js (the spirits' voices) and audio/mycelium.js (the beds at work).
// Every musical one sits in the garden cue's key (`st.grid.root`, `st.scale`: gardenState, audio/garden.js) and most land on its next
// sixteenth, so the garden's chores and visits are the tune's notes; a feeling's own sound is in its mode (music/mood.js MODES).
//   THE SPIRITS' LIVES (progress/spiritlife.js, world/garden/raising.js, creatures/spirits.js)
//     a wish        a spirit asks for one thing: its call, then two bell notes up to the scale's second, left hanging (a question)
//     wish met      its happy voice, and the bell's question answered: up the triad to the octave
//     a gift        a parcel on the doorstep: a paper thump, a ribbon's ting (Animal Crossing's present)
//     a letter      the mailbox: its flap's clack and two notes falling a fourth (after a wish met it waits a beat behind it)
//     the letters   read: a sheet unfolded a letter, at most three
//     asking home   a matured spirit asks to go: its call, and a sixth held open under a slow swell
//     THE FAREWELL  the one tender moment: a music box climbing the Answer in the spirit's own feeling's mode, the Tear (a half step
//                   falling onto the octave), its voice saying goodbye in two falling syllables, and a long bell left ringing
//     summoned      a spirit out of the smoke (a soft puff, a small call); one chosen to walk with you (a call and a step up)
//     a spar        begun: a wooden bell struck twice; done: struck once and the round's three notes up
//   DECOR (progress/decor.js): set down (a wooden thump and its note), moved (a slide and a lighter knock), picked up (a lift, a
//     pocket's pat), bought (the shed's door bell, a cube's clink), got another way (a ribbon's ting; a first one a sparkle over it),
//     refused (a dull half step down)
//   HARMONY (progress/harmony.js): pruned (two snips of shears and a twig's fall), a thorn grown (a creak of wood stretching), tended
//     (a breath of a shimmer a sixteenth behind the act), a planetoid's harmony crossing a band (up: a bright chime, into bloom a
//     flower's sparkle too; down: a dull muted knock, into briar with the tritone under it)
//   THE PRESS AT THE ATHANOR (world/garden/press.js, progress/alchemy.js): the lid lifted and the bath's glass shimmering up, the lid set
//     down; a lump dropped into the mouth (a plop a step up the scale for each waiting), lumps taken back (soft clacks); the bead's step
//     on the colour wheel (a tiny glass tick, its pitch the hue's place round the scale, rate-limited); a refusal (a muted glass clunk);
//     an attribute's seasoning full (a warm kiln bell and its chord)
//   THE MYCELIUM (progress/sporebeds.js, progress/myggdrasil.js, world/garden/mycelium.js): a bed laid (soil and a frame's knock), a
//     strain sown (a dusty puff and its chord in its feeling's mode), things set in a bed (a rustle and a low note as it starts work),
//     taken back (the rustle backwards), a strain learned (four notes up its mode), the crown picked (a soft pop a fruit, down the
//     scale into the Box), Myggdrasil given (a deep bell and the world mushroom's chord rising)
//   THE GARDEN AT LARGE: a cascade begun between two planetoids (a trickle swelling, a drop), a planetoid set in the ring (a whoosh
//     down, a low bell, the ring's chord), the morning's lines (a dawn's soft chord rising, a beat after coming in)
// Prior art: Animal Crossing: New Horizons (the mailbox, a present's ribbon, furniture set down with a thump and a note, Nook's door
// bell), Stardew Valley's small chimes for a friend's heart and the shears, Ooblets' soft cartoon foley, Spiritfarer's Everdoor (a
// spirit seen off with a song), Rez (the act on the beat, in the key), and Unpacking's tactile set-downs.
//
//   sfx.spiritWish(st, feeling) .spiritWishDone(st, feeling) .spiritGift(st) .spiritLetter(st, about) .spiritLetters(n)
//   sfx.spiritFarewellAsk(st, feeling) .spiritFarewell(st, feeling) .spiritSummon(from) .spiritOut(st, feeling)
//   sfx.spiritSparStart() .spiritSpar(st)
//   sfx.decorPlace(st) .decorMove() .decorRemove() .decorBuy(st) .decorGet(st, first) .decorRefuse()
//   sfx.gardenPrune(left) .gardenThornGrow() .gardenTend(st) .gardenHarmony(st, band, was)
//   sfx.pressOpen(st) .pressClose() .pressLoad(st, count) .pressUnload(count) .pressStep(st, hue) .pressRefuse() .alchemySeasoned(st)
//   sfx.sporeBedNew() .sporeInoculate(st, strain) .sporeSet(st, strain) .sporeBack() .sporeLearn(st, strain) .myggPick(st, n) .myggGiven(st)
//   sfx.gardenCascade() .gardenPlanetoidSet(st) .gardenDigest(st)
//   (`st`: gardenState(game), audio/garden.js; null outside the Inner Realm, then the notes fall in E's major pentatonic, unquantised)
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
// ---------------------------------------------------------------------------------------
import { MODES } from '../music/mood.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SCALE = [0, 2, 4, 7, 9]; // (the garden cue's scale when it gives none)
const BAND = { briar: 0, between: 1, bloom: 2 }; // (harmony.js bandOf: the order a crossing goes up or down)

export class GardenLifeSounds {
  // ---- the shared hands ----
  /** Degree `k` (any integer) of the garden's scale, or of `feeling`'s mode, `oct` octaves over the cue's root (E when none). */
  lifeNote(st, k, oct = 1, feeling = null) {
    const s = (feeling && MODES[feeling]) || st?.scale || SCALE, n = ((k % s.length) + s.length) % s.length;
    return (st?.grid?.root ?? 64) + 12 * (oct - 1 + Math.floor(k / s.length)) + s[n];
  }
  /** When a musical moment lands: the cue's next sixteenth (Rez), or now. */
  lifeAt(st) { return this.onSixteenth && st?.grid ? this.onSixteenth(st.grid) : this.ctx.currentTime; }
  lifeStep(st) { return (st?.grid?.spb ?? 0.65) / 4; }
  /** A small bell: the note, its octave faint, and the bell's inharmonic partial quick. */
  lifeBell(t, m, v, d, dur = 1.2) {
    this.tone(t, dur, { f0: hz(m), gain: v, dest: d }); this.tone(t, dur * 0.5, { f0: hz(m) * 2, gain: v * 0.2, dest: d });
    this.tone(t, 0.25, { f0: hz(m) * 2.76, gain: v * 0.12, dest: d });
  }
  /** A music box's tine: bright, short, a click in its attack. */
  lifeTine(t, m, v, d) {
    this.tone(t, 0.9, { f0: hz(m), type: 'triangle', gain: v, dest: d }); this.tone(t, 0.3, { f0: hz(m) * 3, gain: v * 0.12, dest: d });
    this.noise(t, 0.01, { type: 'highpass', f0: 6000, gain: v * 0.5, dest: d });
  }
  /** Paper: a sheet's crinkle (a few bright bursts) over its soft body. */
  lifePaper(t, v, d, n = 4) {
    this.noise(t, 0.22, { type: 'bandpass', f0: 3200, f1: 2200, q: 0.9, gain: v * 0.6, attack: 0.03, dest: d });
    for (let i = 0; i < n; i++) this.noise(t + 0.02 + Math.random() * 0.18, 0.02, { type: 'highpass', f0: 4500, gain: v * 0.5, dest: d });
  }
  /** A spirit's syllable, when the spirits' bank is mixed on (audio/spirits.js). */
  lifeSay(t, dur, f0, f1, vowel, gain, d) { if (this.syllable) this.syllable(t, dur, f0, f1, vowel, gain, d); }

  // ---- the spirits' lives ----
  /** A spirit asks for one thing: its call, then the bell's question (the root, then the second, left hanging). */
  spiritWish(st, feeling = 'mirth') {
    if (!this.ok() || !this.allow('spiritWish', 0.5)) return;
    this.spiritVoice?.('call', { feeling, dist: 2 });
    const t = this.lifeAt(st) + 0.4, s = this.lifeStep(st), d = this.out(0.16, 0.5);
    this.lifeBell(t, this.lifeNote(st, 0, 3), 0.3, d); this.lifeBell(t + s * 2, this.lifeNote(st, 1, 3), 0.28, d, 1.6);
  }
  /** A wish met: the happy voice and the question answered, up the triad to the octave. */
  spiritWishDone(st, feeling = 'mirth') {
    if (!this.ok() || !this.allow('spiritWishDone', 1)) return;
    this.spiritVoice?.('happy', { feeling, dist: 2 });
    const t = this.lifeAt(st) + 0.3, s = this.lifeStep(st), d = this.out(0.18, 0.55, true);
    [0, 2, 4, 5].forEach((k, i) => this.lifeBell(t + i * s, this.lifeNote(st, k, 3), i === 3 ? 0.32 : 0.24, d, i === 3 ? 1.6 : 0.8));
    this.noise(t + s * 3, 0.9, { type: 'highpass', f0: 7000, gain: 0.05, attack: 0.15, dest: d }); // (a sparkle over the last)
  }
  /** A gift on the doorstep: a parcel's paper thump, its ribbon's ting. */
  spiritGift(st) {
    if (!this.ok() || !this.allow('spiritGift', 1)) return;
    const t = this.lifeAt(st), d = this.out(0.2, 0.4);
    this.tone(t, 0.12, { f0: 150, f1: 90, gain: 0.35, dest: d }); this.lifePaper(t, 0.4, d, 3);
    this.lifeBell(t + this.lifeStep(st) * 2, this.lifeNote(st, 4, 3), 0.25, d, 0.9);
  }
  /** A letter in the mailbox: the flap's clack and two notes falling a fourth (a thanks waits a beat behind the wish met). */
  spiritLetter(st, about = 'postcard') {
    if (!this.ok() || !this.allow('spiritLetter', 1)) return;
    const t = this.ctx.currentTime + (about === 'thanks' ? 1.4 : 0), d = this.out(0.16, 0.4);
    this.noise(t, 0.04, { type: 'bandpass', f0: 1600, q: 2, gain: 0.4, dest: d }); this.tone(t, 0.06, { f0: 420, f1: 300, type: 'triangle', gain: 0.2, dest: d }); // (the flap)
    this.lifeBell(t + 0.12, this.lifeNote(st, 3, 3), 0.22, d, 0.7); this.lifeBell(t + 0.3, this.lifeNote(st, 1, 3), 0.22, d, 1);
  }
  /** The mailbox read: a sheet unfolded a letter (at most three). */
  spiritLetters(n = 1) {
    if (!this.ok() || !this.allow('spiritLetters', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.25, true);
    for (let i = 0; i < Math.max(1, Math.min(3, n)); i++) this.lifePaper(t + i * 0.28, 0.4, d, 5);
  }
  /** A matured spirit asks to go home: its call, and a sixth held open under a slow swell. */
  spiritFarewellAsk(st, feeling = 'wonder') {
    if (!this.ok() || !this.allow('spiritFarewellAsk', 0.3)) return;
    this.spiritVoice?.('call', { feeling, dist: 2 });
    const t = this.lifeAt(st) + 0.5, d = this.out(0.14, 0.7, true), a = this.lifeNote(st, 0, 2, feeling), b = this.lifeNote(st, 4, 2, feeling);
    this.riser(t, 1.4, { f0: hz(a), f1: hz(a), type: 'sine', gain: 0.25, dest: d }); this.riser(t + 0.5, 1.6, { f0: hz(b), f1: hz(b), type: 'sine', gain: 0.2, dest: d });
    this.tone(t + 2.1, 1.5, { f0: hz(b), gain: 0.2, dest: d });
  }
  /** THE FAREWELL: a music box climbs the Answer in the spirit's own mode, the Tear falls onto the octave, its voice says goodbye in two
   *  falling syllables, and a bell is left ringing. About five real seconds; the one tender moment of the garden. */
  spiritFarewell(st, feeling = 'wonder') {
    if (!this.ok() || !this.allow('spiritFarewell', 0.2)) return;
    const t0 = this.lifeAt(st), b = Math.max(0.45, Math.min(0.8, st?.grid?.spb ?? 0.6)), d = this.out(0.26, 0.8, true), f = MODES[feeling] ? feeling : 'wonder';
    const top = this.lifeNote(st, 5, 3, f); // (the octave the climb reaches)
    // the climb: four eighths up the mode, then its fifth degree held
    [[0, 0], [1, 0.5], [2, 1], [3, 1.5], [4, 2]].forEach(([k, at]) => this.lifeTine(t0 + at * b, this.lifeNote(st, k, 3, f), 0.32, d));
    // the Tear: a half step above the octave, falling onto it (music/motifs.js TEAR)
    this.lifeTine(t0 + 3 * b, top + 1, 0.3, d); this.lifeTine(t0 + 4 * b, top, 0.34, d);
    // under it, the mode's root and fifth swelling and fading as a pad
    for (const m of [this.lifeNote(st, 0, 1, f), this.lifeNote(st, 3, 1, f)]) this.riser(t0, 3 * b, { f0: hz(m), f1: hz(m), type: 'sine', gain: 0.12, dest: d });
    this.tone(t0 + 3 * b, 3 * b, { f0: hz(this.lifeNote(st, 0, 1, f)), gain: 0.12, dest: d });
    // goodbye, in its small throat: two syllables falling (the octave to the fifth), then the bell on the root two octaves up
    const v = hz(top), w = hz(this.lifeNote(st, 3, 3, f));
    this.lifeSay(t0 + 5 * b, 0.32, v, v * 0.98, 'a', 0.16, d); this.lifeSay(t0 + 5.6 * b, 0.6, w, w * 0.94, 'u', 0.13, d);
    this.lifeBell(t0 + 6.5 * b, this.lifeNote(st, 0, 4, f), 0.22, d, 3.2);
  }
  /** A spirit out of the smoke: a soft puff and a small call. `from` 'garden' (one walking the world with you) is quieter. */
  spiritSummon(from = 'crucibelle') {
    if (!this.ok() || !this.allow('spiritSummon', 2)) return;
    const t = this.ctx.currentTime, d = this.out(from === 'garden' ? 0.1 : 0.16, 0.45);
    this.noise(t, 0.5, { type: 'bandpass', f0: 600, f1: 1800, q: 0.8, gain: 0.35, attack: 0.12, dest: d });
    this.lifeSay(t + 0.25, 0.14, 620, 760, 'o', 0.3, d);
  }
  /** A spirit chosen to walk the world with you: a call and a step up (come along). */
  spiritOut(st, feeling = 'mirth') {
    if (!this.ok() || !this.allow('spiritOut', 1)) return;
    this.spiritVoice?.('call', { feeling, dist: 1.5 });
    const t = this.lifeAt(st) + 0.3, s = this.lifeStep(st), d = this.out(0.16, 0.4);
    this.lifeTine(t, this.lifeNote(st, 2, 2), 0.25, d); this.lifeTine(t + s, this.lifeNote(st, 4, 2), 0.25, d);
  }
  /** A wooden bell struck (a sparring bell, soft). */
  lifeWoodBell(t, d, v = 0.3) { this.tone(t, 0.5, { f0: 880, f1: 870, type: 'triangle', gain: v, dest: d }); this.tone(t, 0.18, { f0: 2430, gain: v * 0.3, dest: d }); this.noise(t, 0.02, { type: 'bandpass', f0: 2000, q: 3, gain: v, dest: d }); }
  spiritSparStart() { if (!this.ok() || !this.allow('spiritSparStart', 1)) return; const t = this.ctx.currentTime, d = this.out(0.18, 0.4); this.lifeWoodBell(t, d); this.lifeWoodBell(t + 0.22, d); }
  /** A spar done: the bell once, and the round's three notes up. */
  spiritSpar(st) {
    if (!this.ok() || !this.allow('spiritSpar', 1)) return;
    const t = this.lifeAt(st), s = this.lifeStep(st), d = this.out(0.18, 0.45);
    this.lifeWoodBell(t, d); [0, 2, 4].forEach((k, i) => this.lifeTine(t + (i + 2) * s, this.lifeNote(st, k, 2), 0.22, d));
  }

  // ---- decor ----
  /** A piece set down: a wooden thump and its note (the next up the scale each placing, Animal Crossing's). */
  decorPlace(st) {
    if (!this.ok() || !this.allow('decorPlace', 4)) return;
    const t = this.lifeAt(st), d = this.out(0.2, 0.35);
    this.tone(t, 0.14, { f0: 170, f1: 85, gain: 0.4, dest: d }); this.noise(t, 0.06, { type: 'lowpass', f0: 1400, gain: 0.25, dest: d });
    this.lifeTine(t + this.lifeStep(st), this.lifeNote(st, (this._decorK = ((this._decorK ?? -1) + 1) % 5), 2), 0.16, d);
  }
  decorMove() { if (!this.ok() || !this.allow('decorMove', 4)) return; const t = this.ctx.currentTime, d = this.out(0.14, 0.25); this.noise(t, 0.12, { type: 'bandpass', f0: 900, f1: 600, q: 1.5, gain: 0.3, attack: 0.03, dest: d }); this.tone(t + 0.1, 0.08, { f0: 220, f1: 140, gain: 0.3, dest: d }); }
  /** A piece picked up: a lift (a breath up) and a pocket's pat. */
  decorRemove() { if (!this.ok() || !this.allow('decorRemove', 4)) return; const t = this.ctx.currentTime, d = this.out(0.14, 0.25); this.noise(t, 0.14, { type: 'bandpass', f0: 500, f1: 1500, q: 1.2, gain: 0.25, attack: 0.05, dest: d }); this.tone(t + 0.14, 0.06, { f0: 260, f1: 200, type: 'triangle', gain: 0.25, dest: d }); }
  /** Bought at the shed: its door bell (two notes), a cube's clink. */
  decorBuy(st) {
    if (!this.ok() || !this.allow('decorBuy', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.45, true);
    this.lifeBell(t, this.lifeNote(st, 4, 3), 0.22, d, 0.6); this.lifeBell(t + 0.09, this.lifeNote(st, 2, 3), 0.22, d, 0.9);
    this.noise(t + 0.22, 0.02, { type: 'bandpass', f0: 5200, q: 6, gain: 0.3, dest: d }); this.tone(t + 0.22, 0.12, { f0: 3100, gain: 0.08, dest: d });
  }
  /** A piece got another way (a visitor's, a lotus's recipe, briar fruit): a ribbon's ting; a first one a sparkle over it. */
  decorGet(st, first = false) {
    if (!this.ok() || !this.allow('decorGet', 2)) return;
    const t = this.lifeAt(st), d = this.out(0.16, 0.45);
    this.lifeBell(t, this.lifeNote(st, 2, 3), 0.22, d, 0.8);
    if (first) { this.lifeBell(t + this.lifeStep(st), this.lifeNote(st, 4, 3), 0.2, d, 1); this.noise(t, 0.8, { type: 'highpass', f0: 7500, gain: 0.05, attack: 0.1, dest: d }); }
  }
  /** Refused (no cubes, locked, none in storage): a dull half step down, soft. */
  decorRefuse() { if (!this.ok() || !this.allow('decorRefuse', 2)) return; const t = this.ctx.currentTime, d = this.out(0.12, 0.2, true); this.tone(t, 0.12, { f0: 330, type: 'triangle', gain: 0.3, dest: d }); this.tone(t + 0.13, 0.2, { f0: 311, type: 'triangle', gain: 0.28, dest: d }); }

  // ---- harmony ----
  /** A thorn pruned by the hand: two snips of shears, a twig falling (fewer `left`, a little brighter). */
  gardenPrune(left = 0) {
    if (!this.ok() || !this.allow('gardenPrune', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.18, 0.3), up = Math.max(0, 6 - left) * 120;
    for (const at of [0, 0.11]) { this.noise(t + at, 0.03, { type: 'bandpass', f0: 4200 + up, q: 4, gain: 0.45, dest: d }); this.tone(t + at, 0.05, { f0: 2900 + up, f1: 2600, gain: 0.08, dest: d }); }
    this.noise(t + 0.2, 0.25, { type: 'bandpass', f0: 1800, f1: 900, q: 1.2, gain: 0.15, attack: 0.02, dest: d }); // (the twig's fall into the grass)
  }
  /** A thorn grown at its cause: a creak of green wood stretching (a slow buzz bending), low and quiet. */
  gardenThornGrow() {
    if (!this.ok() || !this.allow('gardenThornGrow', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.1, 0.35);
    this.tone(t, 0.6, { f0: 70, f1: 95, type: 'sawtooth', gain: 0.12, dest: d }); this.noise(t, 0.5, { type: 'bandpass', f0: 700, f1: 1100, q: 6, gain: 0.25, attack: 0.15, dest: d });
  }
  /** A planetoid tended (once a kind a game day): a breath of a shimmer, a sixteenth behind the act's own sound. */
  gardenTend(st) {
    if (!this.ok() || !this.allow('gardenTend', 2)) return;
    const t = this.lifeAt(st) + this.lifeStep(st) * 2, d = this.out(0.08, 0.6);
    this.tone(t, 0.7, { f0: hz(this.lifeNote(st, 4, 4)), gain: 0.3, dest: d }); this.tone(t + 0.05, 0.6, { f0: hz(this.lifeNote(st, 2, 4)), gain: 0.2, dest: d });
  }
  /** A planetoid's harmony across a band: up, a bright chime (into bloom, a flower's sparkle with it); down, a dull muted knock (into
   *  briar, the tritone under it). */
  gardenHarmony(st, band = 'between', was = 'between') {
    if (!this.ok() || !this.allow('gardenHarmony', 1)) return;
    const up = (BAND[band] ?? 1) > (BAND[was] ?? 1), t = this.lifeAt(st), s = this.lifeStep(st);
    if (up) {
      const d = this.out(0.16, 0.6); [0, 2, 4].forEach((k, i) => this.lifeBell(t + i * s, this.lifeNote(st, k + (band === 'bloom' ? 2 : 0), 3), 0.22, d, 1.1));
      if (band === 'bloom') this.noise(t + s * 2, 1.2, { type: 'highpass', f0: 6500, gain: 0.06, attack: 0.3, dest: d });
    } else {
      const d = this.out(0.14, 0.3), m = this.lifeNote(st, 0, 1);
      this.tone(t, 0.3, { f0: hz(m), type: 'triangle', gain: 0.35, dest: d }); this.noise(t, 0.08, { type: 'lowpass', f0: 500, gain: 0.3, dest: d });
      if (band === 'briar') this.tone(t + s, 0.5, { f0: hz(m - 6), type: 'triangle', gain: 0.22, dest: d });
    }
  }

  // ---- the press at the Athanor ----
  /** The press's view opened: the lid lifted, the bath's glass shimmering up. */
  pressOpen(st) {
    if (!this.ok() || !this.allow('pressOpen', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.55, true);
    this.tone(t, 0.1, { f0: 200, f1: 260, type: 'triangle', gain: 0.25, dest: d }); // (the lid)
    [0, 1, 2, 4].forEach((k, i) => this.tone(t + 0.12 + i * 0.05, 0.9, { f0: hz(this.lifeNote(st, k, 4)), gain: 0.08, dest: d }));
  }
  pressClose() { if (!this.ok() || !this.allow('pressClose', 1)) return; const t = this.ctx.currentTime, d = this.out(0.14, 0.4, true); this.noise(t, 0.2, { type: 'bandpass', f0: 2000, f1: 700, q: 1, gain: 0.15, dest: d }); this.tone(t + 0.16, 0.12, { f0: 190, f1: 120, type: 'triangle', gain: 0.3, dest: d }); }
  /** A lump dropped into the mouth: a plop into the bath, a step up the scale for each lump waiting. */
  pressLoad(st, count = 1) {
    if (!this.ok() || !this.allow('pressLoad', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.4), m = this.lifeNote(st, Math.max(0, count - 1), 2);
    this.tone(t, 0.12, { f0: hz(m) * 0.6, f1: hz(m), gain: 0.35, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 900, gain: 0.2, dest: d });
  }
  /** Lumps taken back to the ring: a soft clack a lump (at most three). */
  pressUnload(count = 1) {
    if (!this.ok() || !this.allow('pressUnload', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.12, 0.25);
    for (let i = 0; i < Math.max(1, Math.min(3, count)); i++) this.noise(t + i * 0.06, 0.03, { type: 'bandpass', f0: 1500 - i * 150, q: 3, gain: 0.35, dest: d });
  }
  /** The soul bead's step on the colour wheel: a tiny glass tick, its pitch the hue's place round the scale (frequent: quiet, limited). */
  pressStep(st, hue = 0) {
    if (!this.ok() || !this.allow('pressStep', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.05, 0.3), k = Math.round((((hue % 360) + 360) % 360) / 72);
    this.tone(t, 0.06, { f0: hz(this.lifeNote(st, k, 4)), gain: 0.4, dest: d }); this.noise(t, 0.008, { type: 'highpass', f0: 7000, gain: 0.25, dest: d });
  }
  pressRefuse() { if (!this.ok() || !this.allow('pressRefuse', 2)) return; const t = this.ctx.currentTime, d = this.out(0.12, 0.25); this.tone(t, 0.14, { f0: 520, f1: 470, type: 'triangle', gain: 0.25, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 700, gain: 0.3, dest: d }); }
  /** An attribute's seasoning full: a warm kiln bell and its chord, slow. */
  alchemySeasoned(st) {
    if (!this.ok() || !this.allow('alchemySeasoned', 0.5)) return;
    const t = this.lifeAt(st), s = this.lifeStep(st), d = this.out(0.18, 0.6, true);
    this.lifeBell(t, this.lifeNote(st, 0, 2), 0.3, d, 2.2); [2, 4].forEach((k, i) => this.lifeBell(t + (i + 1) * s * 2, this.lifeNote(st, k, 2), 0.2, d, 1.8));
  }

  // ---- the mycelium ----
  sporeBedNew() { if (!this.ok() || !this.allow('sporeBedNew', 1)) return; const t = this.ctx.currentTime, d = this.out(0.18, 0.35); this.noise(t, 0.12, { type: 'lowpass', f0: 700, gain: 0.35, dest: d }); [0.1, 0.22].forEach((at) => this.tone(t + at, 0.08, { f0: 300, f1: 220, type: 'triangle', gain: 0.3, dest: d })); }
  /** A strain sown in a bed: a dusty puff, and its chord in its feeling's mode. */
  sporeInoculate(st, strain = 'grief') {
    if (!this.ok() || !this.allow('sporeInoculate', 1)) return;
    const t = this.lifeAt(st), d = this.out(0.16, 0.5);
    this.noise(t, 0.4, { type: 'bandpass', f0: 2500, f1: 1200, q: 0.7, gain: 0.2, attack: 0.08, dest: d });
    [0, 2, 4].forEach((k, i) => this.lifeTine(t + 0.1 + i * 0.05, this.lifeNote(st, k, 2, strain), 0.14, d));
  }
  /** Things set in a bed: a rustle, and a low note as it starts its work. */
  sporeSet(st, strain = 'grief') {
    if (!this.ok() || !this.allow('sporeSet', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.4);
    this.noise(t, 0.25, { type: 'bandpass', f0: 1400, f1: 800, q: 1, gain: 0.3, attack: 0.04, dest: d });
    this.riser(t + 0.15, 0.5, { f0: hz(this.lifeNote(st, 0, 1, strain)), f1: hz(this.lifeNote(st, 0, 1, strain)), type: 'sine', gain: 0.2, dest: d });
  }
  sporeBack() { if (!this.ok() || !this.allow('sporeBack', 2)) return; const t = this.ctx.currentTime, d = this.out(0.12, 0.3); this.noise(t, 0.25, { type: 'bandpass', f0: 800, f1: 1500, q: 1, gain: 0.28, attack: 0.15, dest: d }); }
  /** A strain learned: four notes up its feeling's mode. */
  sporeLearn(st, strain = 'grief') {
    if (!this.ok() || !this.allow('sporeLearn', 0.5)) return;
    const t = this.lifeAt(st), s = this.lifeStep(st), d = this.out(0.18, 0.55, true);
    [0, 1, 2, 4].forEach((k, i) => this.lifeBell(t + i * s, this.lifeNote(st, k, 3, strain), 0.22, d, i === 3 ? 1.6 : 0.8));
  }
  /** Myggdrasil's crown picked: a soft pop a fruit (at most eight), down the scale into the Box. */
  myggPick(st, n = 1) {
    if (!this.ok() || !this.allow('myggPick', 1)) return;
    const t = this.lifeAt(st), s = this.lifeStep(st), d = this.out(0.16, 0.4), m = Math.max(1, Math.min(8, n));
    for (let i = 0; i < m; i++) { this.noise(t + i * s, 0.03, { type: 'bandpass', f0: 1100, q: 4, gain: 0.3, dest: d }); this.lifeTine(t + i * s, this.lifeNote(st, 7 - i, 2), 0.13, d); }
  }
  /** Myggdrasil given (its planetoid made): a deep bell and the world mushroom's chord rising slowly. */
  myggGiven(st) {
    if (!this.ok() || !this.allow('myggGiven', 0.1)) return;
    const t = this.lifeAt(st), d = this.out(0.22, 0.8, true);
    this.lifeBell(t, this.lifeNote(st, 0, 0), 0.4, d, 3.5);
    [0, 3, 5, 7].forEach((k, i) => this.riser(t + 0.3 + i * 0.35, 1.4, { f0: hz(this.lifeNote(st, k, 1)), f1: hz(this.lifeNote(st, k, 1)), type: 'sine', gain: 0.12, dest: d }));
  }

  // ---- the garden at large ----
  /** A cascade begun between two planetoids: a trickle swelling, then a drop. */
  gardenCascade() {
    if (!this.ok() || !this.allow('gardenCascade', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.12, 0.5);
    this.noise(t, 1.6, { type: 'bandpass', f0: 1200, f1: 2200, q: 0.8, gain: 0.25, attack: 0.8, dest: d });
    this.tone(t + 1.2, 0.1, { f0: 900, f1: 1700, gain: 0.15, dest: d });
  }
  /** A planetoid set in the ring: a whoosh down, a low bell, the ring's chord. */
  gardenPlanetoidSet(st) {
    if (!this.ok() || !this.allow('gardenPlanetoidSet', 0.5)) return;
    const t = this.lifeAt(st), s = this.lifeStep(st), d = this.out(0.22, 0.7, true);
    this.noise(t, 0.6, { type: 'bandpass', f0: 2400, f1: 400, q: 0.8, gain: 0.22, attack: 0.1, dest: d });
    this.lifeBell(t + 0.5, this.lifeNote(st, 0, 1), 0.35, d, 2.4); [0, 2, 4].forEach((k, i) => this.lifeBell(t + 0.5 + (i + 1) * s * 2, this.lifeNote(st, k, 3), 0.15, d, 1.4));
  }
  /** The morning's lines (the first visit of a game day): a dawn's soft chord rising, a beat after coming in. */
  gardenDigest(st) {
    if (!this.ok() || !this.allow('gardenDigest', 0.1)) return;
    const t = this.ctx.currentTime + 1.6, d = this.out(0.14, 0.7, true);
    [0, 2, 4, 6].forEach((k, i) => this.riser(t + i * 0.25, 1.2, { f0: hz(this.lifeNote(st, k, 2)), f1: hz(this.lifeNote(st, k, 2)), type: 'sine', gain: 0.1, dest: d }));
    this.lifeBell(t + 1.3, this.lifeNote(st, 4, 3), 0.18, d, 1.8);
  }
}
