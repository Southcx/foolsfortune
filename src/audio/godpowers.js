// ---------------------------------------------------------------------------------------
// THE GOD POWERS' SOUNDS (the god hand's sixteen powers, godhand/powers/*.js, and what goes round them: the hand's poses, the palm die
// thrown, the Dissonance Level, the island's answer, the catch, the bracelet; Petra's and Dovina's events, heard through audio/cues.js).
// Each power sounds like the thing it does to the island, never like a menu: a sound a domain's family, so the ear learns the domains.
//   PSYCHOKINESIS  GUST: air along the stroke, its edge whistling, sand hissing off it, a knock for each thing thrown. SLAB: stone torn up
//                  out of the ground (a grinding rise), and set down again (a settling thud, a breath of dust)
//   OURANURGY      PORTAL: a crude-rimmed eye opening (a wet, resonant swirl, a deep whoomp), a ping at each end a fifth apart, the link.
//                  A PASS: a quick whoosh through. HASTEN: a clock's ticks running faster; with Shift, STAY: a tone falling into a held
//                  still note (time stopping). FOLD: space drawn in, then two patches landing, one after the other
//   POSSESSION     MUSTER: the ground cracking and the workers hatching out of it, little pops and chirps. DONE: a load set down, two
//                  claps. HERD: a whistle (with a wobble) and soft feet. TAKE: a mind set aside, a low hum swelling under two notes
//   SPELLSCRIPTION WARD: a brush stroke round the circle, its bell when it closes, the wall's low hum. STAMP: a heavy press and a seal's
//                  clack; what it makes from nothing, a shimmer
//   MANIFESTATION  TOTEM: a pillar grinding up out of the ground, then the miracle it holds as a chord in its feeling. SET: a firing (the
//                  kiln's roar) and the fired ware ringing; set for good, a longer ring an octave down
//   ALTERATION     TRANSMUTE: sand's hiss turning into clay's wet squelch (and back); given a feeling, a bell on that feeling's note
//   DIVINATION     READ: a soft sonar ping and a tick for each creature read. STRATA: a scan cutting down through the layers. COURSE: a run
//                  of drops falling the way water would
//   THE HAND'S POSE  very quiet: a soft shift of skin and cloth, and one bell partial keyed to the mudra (none on a cast: the power speaks)
//   THE PALM DIE THROWN  a die tumbling in a palm (muffled clicks slowing), settling; a glint if it held, two if it held on its top face,
//                  a dull knock if it did not
//   THE DISSONANCE LEVEL  climbing: an uneasy tone, two voices beating against each other, a step higher and faster a level; falling, a
//                  calmer fifth coming down; at 0, a soft open chord (the island quiet again)
//   THE ISLAND'S ANSWER  the ground swelling and a low, detuned call from far off, heavier a level; BEATEN: the answer resolved, a chord
//                  climbing into the key
//   THE CATCH      GRAB: the Figment squirming in the fingers (over the hand's own grab); FREE: slipping loose, or snapping awake
//   THE BRACELET   SET: a charm clicking into its socket and ringing on its own note (out: a lower click); A CHARM BENDING A POWER: a
//                  tiny glint in the ring (every act, so it stays under everything)
// A repeat by TWIN or ECHO (`repeat`) sounds the power again at a little over half the level.
// Prior art: Black & White's miracles and Populous's powers (each power its own sound, the ground answering), From Dust's sand and
// water, Portal's portal open and the whoosh through it, Braid's and JoJo's time stopped (a falling tone frozen), Pikmin's whistle and
// its carriers, the singing bowl and the temple bell (the mudras), Baldur's Gate 3's dice in the hand, GTA's wanted level heard as
// rising tension, Plomp and Levelt's sensory dissonance (beating voices), the kiln's firing and fired ware's ring.
//
//   sfx.godGust(len, hit, moved, repeat) .godSlab(moved, set) .godPortal(len, repeat) .godPortalPass(what) .godHasten(stay, r, repeat)
//   .godFold(moved, side, repeat) .godMuster(n, repeat) .godMusterDone(moved) .godHerd(n, repeat) .godTake(kind) .godWard(r, repeat, grid)
//   .godStamp(made, side, repeat) .godTotem(feeling, repeat, grid) .godSetFast(chunks, forever, repeat) .godTransmute(feeling, r, repeat)
//   .godRead(n) .godStrata(len) .godCourse(steps) .handPoseShift(pose, why, grid) .palmRoll(face, sides, held)
//   .godDissonance(level) .godRejectionAnswer(level, n) .godRejectionBeaten(grid) .handCatchGrab(cls, need) .handCatchFree(why)
//   .braceletSet(charm) .braceletCharm(charm)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** Semitones from E to the music's key, the short way (-6..5). */
const keyOf = (grid) => (grid?.root != null ? ((((grid.root - 64) % 12) + 18) % 12) - 6 : 0);
/** The next sixteenth of the music (`grid`: game.music.grid()), or now when nothing plays. */
const next16 = (now, grid) => (grid?.spb ? grid.t0 + Math.ceil((now - grid.t0) / (grid.spb / 4) - 1e-6) * (grid.spb / 4) : now);
const rk = (repeat) => (repeat ? 0.55 : 1); // (a TWIN or ECHO repeat, a little over half the level)

/** The seven feelings' notes, most positive highest (E pentatonic round E4): a totem's chord, a transmute's bell. */
const FEEL = { wonder: 76, mirth: 74, desire: 71, fury: 69, gall: 67, grief: 64, dread: 62 };
/** The ten mudras' bell notes (progress/mudras.js): the seven domains' through the scale, the three moments apart (the palm high, the
 *  gift higher, the rest low). */
const MUDRA = { gyan: 71, shuni: 74, surya: 76, buddhi: 79, prana: 81, bhumisparsha: 64, karana: 69, abhaya: 83, varada: 88, dhyana: 59 };
/** The seven charms' notes (progress/bracelet.js CHARMS), in the ring's own bright register. */
const CHARM = { twin: 88, wide: 83, echo: 86, quiet: 79, thrift: 81, linger: 76, gentle: 84 };
const DIE = { 4: 0, 6: 1, 8: 2, 10: 3, 12: 4, 20: 5 };
const DIS = { level: 0 }; // (the Dissonance Level last heard: a step up or down sounds differently)

export class GodPowerSounds {
  /** A bell: a sine and its inharmonic partial (a struck bowl's 2.76), with an optional swell in. */
  godBell(t, dur, f, gain, dest) {
    this.tone(t, dur, { f0: f, gain, dest });
    this.tone(t, dur * 0.45, { f0: f * 2.76, gain: gain * 0.25, dest });
  }
  /** A tone with a vibrato (a whistle's wobble): `rate` Hz, `depth` in Hz. */
  godWobble(t, dur, { f0, f1 = f0, rate = 6, depth = 20, type = 'sine', gain = 0.2, dest }) {
    const c = this.ctx, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), env = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    lfo.frequency.value = rate; lg.gain.value = depth; lfo.connect(lg).connect(o.frequency);
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.06, dur * 0.3)); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env).connect(dest);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
  }

  // ---- PSYCHOKINESIS

  /** Wind along a stroke `len` m long; `hit` creatures thrown along it, `moved` m³ of the loose layer blown off. */
  godGust(len = 8, hit = 0, moved = 0, repeat = false) {
    if (!this.ok() || !this.allow('godGust', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.36 * rk(repeat), 0.4), dur = 0.55 + Math.min(1.1, len / 18);
    this.noise(t, dur, { type: 'bandpass', f0: 250, f1: 1600, q: 0.7, gain: 0.7, attack: dur * 0.35, dest: d }); // (the wind along the stroke)
    this.noise(t + 0.05, dur * 0.9, { type: 'highpass', f0: 2600, f1: 5200, gain: 0.14, attack: dur * 0.4, dest: d }); // (its edge whistling)
    if (moved > 0.05) this.noise(t + dur * 0.35, 0.5 + Math.min(1, moved / 4), { type: 'bandpass', f0: 5200, f1: 2800, q: 1.4, gain: 0.12 + Math.min(0.2, moved / 20), attack: 0.12, dest: d }); // (sand blown off, a hiss)
    for (let i = 0; i < Math.min(4, hit); i++) this.tone(t + dur * 0.3 + i * 0.07, 0.14, { f0: 150 - i * 10, f1: 70, type: 'triangle', gain: 0.35, dest: d }); // (a thing thrown along)
  }
  /** A slab of the island's matter torn up under the hand (`set` false), or set down elsewhere (`set` true); `moved` m³ in it. */
  godSlab(moved = 1, set = false) {
    if (!this.ok() || !this.allow('godSlab', 3)) return;
    const t = this.ctx.currentTime, w = Math.min(1, 0.4 + moved / 12), d = this.out(0.4 * (0.6 + 0.4 * w), 0.4);
    if (!set) {
      this.riser(t, 0.6, { f0: 38, f1: 80, type: 'triangle', gain: 0.4, dest: d }); // (the stone coming up)
      this.noise(t, 0.75, { type: 'bandpass', f0: 180, f1: 650, q: 2, gain: 0.5, attack: 0.4, dest: d }); // (its grind against the ground)
      for (let i = 0; i < 5; i++) this.noise(t + 0.2 + i * 0.09 + Math.random() * 0.04, 0.02, { type: 'bandpass', f0: 1800 + Math.random() * 1600, q: 4, gain: 0.18, dest: d }); // (grit falling off it)
    } else {
      this.tone(t, 0.38, { f0: 110, f1: 38, gain: 0.6, dest: d }); // (the settling thud)
      this.noise(t, 0.35, { type: 'lowpass', f0: 1300, f1: 160, gain: 0.45, dest: d });
      this.noise(t + 0.08, 0.6, { type: 'highpass', f0: 2500, f1: 1200, gain: 0.08, attack: 0.1, dest: d }); // (a breath of dust)
    }
  }

  // ---- OURANURGY

  /** A portal pair opened, its ends `len` m apart: a crude-rimmed eye at each, linked. */
  godPortal(len = 10, repeat = false) {
    if (!this.ok() || !this.allow('godPortal', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.38 * rk(repeat), 0.6), far = Math.min(0.45, 0.12 + len / 60);
    this.noise(t, 0.8, { type: 'bandpass', f0: 160, f1: 1400, q: 6, gain: 0.55, attack: 0.35, dest: d }); // (the crude swirling open, wet and resonant)
    this.tone(t + 0.25, 0.7, { f0: 95, f1: 38, gain: 0.5, dest: d }); // (the eye's whoomp)
    this.tone(t + 0.3, 0.9, { f0: hz(71), f1: hz(71) * 0.99, gain: 0.12, dest: d }); // (this end's ping)
    this.tone(t + 0.3 + far, 0.9, { f0: hz(78), f1: hz(78) * 0.99, gain: 0.1, dest: d }); // (the far end's, a fifth up: the link)
    this.godWobble(t + 0.35, 1.1, { f0: 220, f1: 210, rate: 5, depth: 6, type: 'triangle', gain: 0.05, dest: d }); // (the link humming)
  }
  /** Something through a portal: a creature's kind, 'courier' or 'thing'. */
  godPortalPass(what = 'thing') {
    if (!this.ok() || !this.allow('godPortalPass', 6)) return;
    const t = this.ctx.currentTime, big = what === 'courier' ? 1 : what === 'thing' ? 0.5 : 0.75, d = this.out(0.22 + 0.14 * big, 0.5);
    this.noise(t, 0.28, { type: 'bandpass', f0: 2600, f1: 380, q: 2, gain: 0.5, attack: 0.04, dest: d }); // (the whoosh through)
    this.tone(t, 0.18, { f0: 620, f1: 190, gain: 0.14, dest: d });
    this.tone(t + 0.12, 0.22, { f0: 180, f1: 520, gain: 0.1, dest: d }); // (and out of the other)
  }
  /** Matter's time run fast over a patch of radius `r`; with `stay`, stopped. */
  godHasten(stay = false, r = 4, repeat = false) {
    if (!this.ok() || !this.allow('godHasten', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.3 * rk(repeat), 0.5);
    if (!stay) {
      let at = t, gap = 0.13;
      for (let i = 0; i < 12; i++) { this.noise(at, 0.012, { type: 'highpass', f0: 4200 + i * 150, gain: 0.3, dest: d }); at += gap; gap *= 0.82; } // (the clock running faster)
      this.riser(t, at - t, { f0: 300, f1: 1200, type: 'sine', gain: 0.08, dest: d });
    } else {
      this.tone(t, 0.6, { f0: 900, f1: 180, type: 'triangle', gain: 0.25, dest: d }); // (time falling still)
      this.noise(t, 0.5, { type: 'lowpass', f0: 4000, f1: 300, gain: 0.25, dest: d });
      this.tone(t + 0.55, 1.6 + Math.min(1, r / 10), { f0: 180, gain: 0.14, dest: d }); // (held: nothing moves)
      this.tone(t + 0.55, 1.4, { f0: 270, gain: 0.05, dest: d });
    }
  }
  /** Two patches of `side` m traded, `moved` m³ of matter between them. */
  godFold(moved = 1, side = 6, repeat = false) {
    if (!this.ok() || !this.allow('godFold', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.34 * rk(repeat), 0.5);
    this.riser(t, 0.34, { f0: 160, f1: 900, type: 'sawtooth', gain: 0.07, q: 3, dest: d }); // (space drawn in)
    this.noise(t, 0.34, { type: 'bandpass', f0: 600, f1: 3000, q: 1, gain: 0.3, attack: 0.3, dest: d });
    for (const [k, at] of [[1, 0.37], [0.8, 0.47]]) { this.tone(t + at, 0.3, { f0: 120 * k, f1: 45, gain: 0.45, dest: d }); this.noise(t + at, 0.18, { type: 'lowpass', f0: 1200, f1: 200, gain: 0.3, dest: d }); } // (one patch landing, then the other)
    if (moved > 0.5) this.noise(t + 0.45, 0.5, { type: 'highpass', f0: 2600, f1: 1400, gain: 0.08, attack: 0.08, dest: d }); // (the matter settling)
  }

  // ---- POSSESSION

  /** `n` workers hatched out of the ground for a muster. */
  godMuster(n = 4, repeat = false) {
    if (!this.ok() || !this.allow('godMuster', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.32 * rk(repeat), 0.4);
    this.noise(t, 0.5, { type: 'lowpass', f0: 500, f1: 150, gain: 0.4, attack: 0.08, dest: d }); // (the ground cracking)
    for (let i = 0; i < Math.min(8, n); i++) {
      const at = t + 0.15 + i * 0.08 + Math.random() * 0.03, f = 520 + Math.random() * 380;
      this.noise(at, 0.05, { type: 'bandpass', f0: 2400, f1: 900, q: 1.2, gain: 0.35, dest: d }); // (a shell of clay cracking)
      this.tone(at + 0.04, 0.09, { f0: f, f1: f * 1.6, type: 'square', gain: 0.04, dest: d }); // (and a chirp)
    }
  }
  /** The muster's time up, `moved` m³ carried in all: a load set down, two claps. */
  godMusterDone(moved = 0) {
    if (!this.ok() || !this.allow('godMusterDone', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.4);
    this.tone(t, 0.25, { f0: 120, f1: 55, gain: 0.4, dest: d }); // (the last load down)
    if (moved > 0.2) this.noise(t, 0.3, { type: 'lowpass', f0: 1600, f1: 300, gain: 0.25, dest: d });
    for (const at of [0.2, 0.34]) this.noise(t + at, 0.03, { type: 'bandpass', f0: 1500, q: 1.3, gain: 0.5, dest: d }); // (two claps: done)
  }
  /** `n` creatures herded: a whistle and soft feet. */
  godHerd(n = 3, repeat = false) {
    if (!this.ok() || !this.allow('godHerd', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.26 * rk(repeat), 0.45);
    this.godWobble(t, 0.55, { f0: 880, f1: 1760, rate: 9, depth: 30, gain: 0.22, dest: d }); // (the whistle, with its wobble)
    this.godWobble(t, 0.55, { f0: 1320, f1: 2640, rate: 9, depth: 45, gain: 0.04, dest: d });
    for (let i = 0; i < Math.min(6, n); i++) this.noise(t + 0.3 + i * 0.07 + Math.random() * 0.03, 0.03, { type: 'lowpass', f0: 700, f1: 300, gain: 0.25, dest: d }); // (feet turning to go)
  }
  /** A creature of `kind` taken: its mind set aside, yours to play. */
  godTake(kind = '') {
    if (!this.ok() || !this.allow('godTake', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.riser(t, 0.45, { f0: 82, f1: 165, type: 'sine', gain: 0.35, dest: d }); // (the hum swelling: a mind set aside)
    this.tone(t + 0.45, 0.6, { f0: 165, f1: 160, gain: 0.25, dest: d });
    this.tone(t + 0.2, 0.4, { f0: hz(76), type: 'triangle', gain: 0.08, dest: d }); // (two notes: yours)
    this.tone(t + 0.42, 0.7, { f0: hz(73), type: 'triangle', gain: 0.08, dest: d });
    this.noise(t, 0.35, { type: 'bandpass', f0: 800, f1: 2400, q: 1, gain: 0.08, attack: 0.25, dest: d }); // (a breath)
  }

  // ---- SPELLSCRIPTION

  /** A ward of radius `r` written: the brush round the circle, its bell when it closes (on the music's grid), the wall's hum. */
  godWard(r = 4, repeat = false, grid = null) {
    if (!this.ok() || !this.allow('godWard', 3)) return;
    const now = this.ctx.currentTime, d = this.out(0.32 * rk(repeat), 0.6), sweep = 0.3 + Math.min(0.35, r / 30);
    this.noise(now, sweep, { type: 'bandpass', f0: 500, f1: 2600, q: 1.6, gain: 0.35, attack: sweep * 0.5, dest: d }); // (the brush going round)
    this.noise(now + sweep, sweep, { type: 'bandpass', f0: 2600, f1: 700, q: 1.6, gain: 0.3, attack: 0.02, dest: d }); // (and closing)
    const t = Math.max(now + sweep * 2, next16(now + sweep * 2, grid)), up = keyOf(grid);
    this.godBell(t, 1.8, hz(76 + up), 0.16, d); // (the circle closed)
    this.tone(t, 2.2, { f0: hz(40 + up), type: 'triangle', gain: 0.16, dest: d }); // (the wall standing)
  }
  /** A patch of `side` m stamped over another; `made` m³ of it made from nothing. */
  godStamp(made = 0, side = 6, repeat = false) {
    if (!this.ok() || !this.allow('godStamp', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.36 * rk(repeat), 0.45);
    this.tone(t, 0.32, { f0: 125, f1: 42, gain: 0.6, dest: d }); // (the press)
    this.noise(t, 0.22, { type: 'lowpass', f0: 900, f1: 180, gain: 0.45, dest: d });
    this.noise(t + 0.01, 0.03, { type: 'bandpass', f0: 2300, q: 3, gain: 0.35, dest: d }); // (the seal's clack)
    for (let i = 0; i < Math.min(6, Math.ceil(made * 2)); i++) this.tone(t + 0.12 + i * 0.05, 0.4, { f0: hz(84 + [0, 3, 5, 7, 10, 12][i]), gain: 0.03, dest: d }); // (made from nothing: a shimmer)
  }

  // ---- MANIFESTATION

  /** A totem raised, holding the last miracle's `feeling`: the pillar grinding up, then that feeling's chord (on the grid). */
  godTotem(feeling = 'wonder', repeat = false, grid = null) {
    if (!this.ok() || !this.allow('godTotem', 2)) return;
    const now = this.ctx.currentTime, d = this.out(0.34 * rk(repeat), 0.6);
    this.riser(now, 0.7, { f0: 45, f1: 95, type: 'triangle', gain: 0.35, dest: d }); // (the pillar rising)
    this.noise(now, 0.8, { type: 'bandpass', f0: 260, f1: 900, q: 2.5, gain: 0.4, attack: 0.5, dest: d }); // (stone on stone)
    this.tone(now + 0.75, 0.25, { f0: 90, f1: 45, gain: 0.4, dest: d }); // (stood)
    const t = Math.max(now + 0.8, next16(now + 0.8, grid)), m = (FEEL[feeling] ?? 76) + keyOf(grid), dark = m < 66;
    [0, 7, 12].forEach((s, i) => this.tone(t + i * 0.05, 2.4, { f0: hz(m + s - 12), type: dark ? 'triangle' : 'sine', gain: 0.07, dest: d })); // (the miracle it holds)
    this.godBell(t, 1.6, hz(m), 0.08, d);
  }
  /** `chunks` of a creation set (fired); `forever` at 99, for good. */
  godSetFast(chunks = 1, forever = false, repeat = false) {
    if (!this.ok() || !this.allow('godSetFast', 3)) return;
    const t = this.ctx.currentTime, d = this.out((0.3 + Math.min(0.1, chunks / 40)) * rk(repeat), 0.6);
    this.noise(t, 0.7, { type: 'lowpass', f0: 500, f1: 2200, gain: 0.4, attack: 0.3, dest: d }); // (the kiln's roar)
    this.tone(t, 0.6, { f0: 70, f1: 90, type: 'triangle', gain: 0.2, dest: d });
    const ring = forever ? 2.8 : 1.3;
    this.godBell(t + 0.65, ring, hz(86), 0.12, d); // (the fired ware ringing)
    if (forever) this.godBell(t + 0.7, ring, hz(74), 0.1, d); // (set for good: an octave down, longer)
  }

  // ---- ALTERATION

  /** The loose layer and the firm traded over a patch of radius `r`; given a `feeling`, the Lachryma there takes it instead. */
  godTransmute(feeling = null, r = 4, repeat = false) {
    if (!this.ok() || !this.allow('godTransmute', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.3 * rk(repeat), 0.5);
    if (!feeling) {
      this.noise(t, 0.4, { type: 'highpass', f0: 4200, f1: 2200, gain: 0.25, attack: 0.05, dest: d }); // (sand's hiss)
      this.noise(t + 0.25, 0.4, { type: 'lowpass', f0: 1000, f1: 200, gain: 0.35, attack: 0.08, dest: d }); // (turning into clay's squelch)
      this.tone(t + 0.25, 0.35, { f0: 190, f1: 85, gain: 0.25, dest: d });
      this.tone(t + 0.1, 0.5, { f0: hz(69), f1: hz(64), type: 'triangle', gain: 0.06, dest: d }); // (the turn)
    } else {
      this.noise(t, 0.4, { type: 'bandpass', f0: 600, f1: 2000, q: 3, gain: 0.25, attack: 0.2, dest: d }); // (the Lachryma stirring)
      this.godBell(t + 0.3, 1.4, hz(FEEL[feeling] ?? 76), 0.13, d); // (and taking the feeling's note)
    }
  }

  // ---- DIVINATION

  /** Read pressed: `n` creatures' intents shown. */
  godRead(n = 0) {
    if (!this.ok() || !this.allow('godRead', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.6);
    this.tone(t, 0.6, { f0: hz(81), f1: hz(80), gain: 0.18, dest: d }); // (the ping)
    for (let i = 0; i < Math.min(6, n); i++) this.tone(t + 0.15 + i * 0.06, 0.08, { f0: hz(88 + [0, 2, 4, 7, 9, 12][i]), type: 'triangle', gain: 0.06, dest: d }); // (one for each read)
  }
  /** A section `len` m long cut through the ground's layers. */
  godStrata(len = 8) {
    if (!this.ok() || !this.allow('godStrata', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.5), dur = 0.5 + Math.min(0.5, len / 40);
    this.noise(t, dur, { type: 'bandpass', f0: 3200, f1: 400, q: 4, gain: 0.3, attack: 0.05, dest: d }); // (the scan cutting down)
    for (let i = 0; i < 4; i++) this.tone(t + (i + 0.5) * dur / 4, 0.12, { f0: hz(79 - i * 5), type: 'triangle', gain: 0.07, dest: d }); // (a layer passed)
  }
  /** Course pressed: the run water would take, `steps` cells long. */
  godCourse(steps = 8) {
    if (!this.ok() || !this.allow('godCourse', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.6), n = Math.max(3, Math.min(8, Math.round(steps / 4)));
    for (let i = 0; i < n; i++) { const f = hz(86 - i * 2) * (0.98 + Math.random() * 0.04); this.tone(t + i * 0.07, 0.09, { f0: f * 0.7, f1: f, gain: 0.12, dest: d }); } // (drops falling the way it runs)
    this.noise(t, 0.6, { type: 'bandpass', f0: 1800, f1: 900, q: 2, gain: 0.05, attack: 0.1, dest: d }); // (a trickle)
  }

  // ---- WHAT GOES ROUND THE POWERS

  /** The hand's pose changed (`hand.pose`): very quiet, skin and cloth and one bell partial keyed to the mudra. None on a cast. */
  handPoseShift(pose = null, why = null, grid = null) {
    if (!this.ok() || !pose || !this.allow('handPoseShift', 5)) return;
    const t = this.ctx.currentTime, d = this.out(0.1, 0.5);
    this.noise(t, 0.12, { type: 'bandpass', f0: 1300, f1: 600, q: 0.8, gain: 0.12, attack: 0.03, dest: d }); // (skin and cloth)
    if (why === 'cast' || MUDRA[pose] == null) return; // (a cast: the power speaks)
    const at = next16(t + 0.03, grid), f = hz(MUDRA[pose] + keyOf(grid)), g = why === 'ready' ? 0.08 : 0.16;
    this.tone(at, 1.6, { f0: f * 2.76, gain: g * 0.5, dest: d }); // (one partial of a bell, high)
    this.tone(at, 1.2, { f0: f, gain: g * 0.3, dest: d });
  }
  /** The palm die thrown against the island's answer and settled on `face` of `sides`; `held` 0 none, 1 held, 2 held on its top face. */
  palmRoll(face = 1, sides = 4, held = 0) {
    if (!this.ok() || !this.allow('palmRoll', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.4), k = DIE[sides] ?? 0;
    let at = t, gap = 0.05;
    for (let i = 0; i < 7; i++) { this.noise(at, 0.012, { type: 'bandpass', f0: (1500 + k * 250) * (0.9 + Math.random() * 0.2), q: 3, gain: 0.3 - i * 0.025, dest: d }); at += gap; gap *= 1.25; } // (tumbling in the palm, muffled, slowing)
    this.tone(at, 0.1, { f0: 220 + k * 30, f1: 150, type: 'triangle', gain: 0.25, dest: d }); // (settled)
    if (held > 0) {
      this.tone(at + 0.08, 0.7, { f0: hz(88 + k), gain: 0.12, dest: d }); // (a glint: it held)
      if (held > 1) this.tone(at + 0.16, 0.9, { f0: hz(95 + k), gain: 0.1, dest: d }); // (its top face: a second)
    } else this.tone(at + 0.05, 0.4, { f0: hz(52), f1: hz(51), type: 'triangle', gain: 0.18, dest: d }); // (it did not: a dull knock)
  }
  /** The Dissonance Level now `level` (0..5): climbing, an uneasy beating tone a step up a level; falling, a calmer fifth down. */
  godDissonance(level = 0) {
    if (!this.ok()) return;
    const was = DIS.level; DIS.level = level;
    if (level === was || !this.allow('godDissonance', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.6);
    if (level > was) {
      const f = hz(50 + level * 2), beat = 1.5 + level * 1.4; // (a step higher, and its voices beating faster, a level)
      this.riser(t, 0.7, { f0: f * 0.97, f1: f, type: 'sawtooth', gain: 0.06, q: 1, dest: d }); // (the unease swelling)
      this.tone(t + 0.7, 1.4, { f0: f, f1: f * 0.99, type: 'triangle', gain: 0.18, dest: d });
      this.tone(t + 0.7, 1.4, { f0: f + beat, f1: f * 0.99 + beat, type: 'triangle', gain: 0.16, dest: d }); // (the second voice, beating)
      if (level >= 3) this.tone(t + 0.75, 1.2, { f0: f * Math.SQRT2, gain: 0.05 + 0.02 * (level - 3), dest: d }); // (a tritone over it, high up)
    } else if (level > 0) {
      const f = hz(50 + was * 2);
      this.tone(t, 1.2, { f0: f * 1.5, f1: f * 1.5, gain: 0.08, dest: d }); // (a calmer fifth, coming down)
      this.tone(t + 0.25, 1.6, { f0: f, gain: 0.1, dest: d });
    } else {
      [64, 71, 76, 80].forEach((m, i) => this.tone(t + i * 0.09, 2.2, { f0: hz(m - 12), gain: 0.06, dest: d })); // (the island quiet again: an open chord)
    }
  }
  /** The island's answer at Dissonance Level `level`, `n` of it about. */
  godRejectionAnswer(level = 1, n = 1) {
    if (!this.ok() || !this.allow('godRejectionAnswer', 1)) return;
    const t = this.ctx.currentTime, w = Math.min(1, level / 5), d = this.out(0.3 + 0.15 * w, 0.7);
    this.noise(t, 1.4, { type: 'lowpass', f0: 200, f1: 500, gain: 0.45, attack: 0.6, dest: d }); // (the ground swelling)
    this.tone(t, 1.6, { f0: 55, f1: 40, gain: 0.35, dest: d });
    [0, 0.6 + level * 0.5].forEach((dt) => this.tone(t + 0.3, 1.5 + w, { f0: hz(40 + level) + dt, f1: hz(39 + level) + dt, type: 'sawtooth', gain: 0.03 + 0.02 * w, dest: d })); // (a low call from far off, two voices out of tune)
  }
  /** The fifth level's answer put down: resolved, a chord climbing into the key. */
  godRejectionBeaten(grid = null) {
    if (!this.ok() || !this.allow('godRejectionBeaten', 1)) return;
    const now = this.ctx.currentTime, t = next16(now, grid), up = keyOf(grid), d = this.out(0.3, 0.7);
    this.tone(t, 0.5, { f0: hz(41 + up), f1: hz(40 + up), gain: 0.3, dest: d }); // (the ground let go)
    [52, 59, 64, 68, 71, 76].forEach((m, i) => this.tone(t + i * 0.07, 2.4 - i * 0.2, { f0: hz(m + up), gain: 0.08, dest: d })); // (climbing into the key)
    this.godBell(t + 0.45, 2, hz(83 + up), 0.07, d);
  }
  /** A stunned Figment of class `cls` grabbed by the hand: it squirms in the fingers (over the hand's own grab). */
  handCatchGrab(cls = 0, need = 1) {
    if (!this.ok() || !this.allow('handCatchGrab', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.4), f = 520 / (1 + cls * 0.25);
    for (let i = 0; i < 5; i++) { const s = t + 0.05 + i * 0.09, up = i % 2 ? 0.75 : 1.35; this.tone(s, 0.08, { f0: f, f1: f * up, type: 'triangle', gain: 0.12, dest: d }); } // (the squirm)
    this.noise(t, 0.4, { type: 'bandpass', f0: 900, f1: 500, q: 2, gain: 0.12, attack: 0.05, dest: d }); // (struggling against the fingers)
  }
  /** The caught Figment free: `why` 'woke' (its stun ran out: it snaps loose) or let go (it slips). */
  handCatchFree(why = 'dropped') {
    if (!this.ok() || !this.allow('handCatchFree', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.4);
    if (why === 'woke') {
      this.noise(t, 0.05, { type: 'bandpass', f0: 2200, f1: 4000, q: 1.5, gain: 0.5, dest: d }); // (the snap)
      this.tone(t, 0.18, { f0: 300, f1: 900, type: 'triangle', gain: 0.18, dest: d });
    } else {
      this.noise(t, 0.25, { type: 'bandpass', f0: 600, f1: 2400, q: 1.2, gain: 0.25, attack: 0.05, dest: d }); // (slipping out of the fingers)
      this.tone(t + 0.18, 0.12, { f0: 420, f1: 260, gain: 0.12, dest: d }); // (a soft pop)
    }
  }
  /** A charm set in a bracelet socket (`charm` its id), or the socket emptied (`charm` null). */
  braceletSet(charm = null) {
    if (!this.ok() || !this.allow('braceletSet', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.24, 0.4, true);
    if (!charm) { this.noise(t, 0.02, { type: 'bandpass', f0: 1800, q: 3, gain: 0.35, dest: d }); this.tone(t, 0.1, { f0: 520, f1: 380, type: 'triangle', gain: 0.12, dest: d }); return; } // (out: a lower click)
    this.noise(t, 0.015, { type: 'bandpass', f0: 3200, q: 4, gain: 0.45, dest: d }); // (into the socket)
    this.noise(t + 0.05, 0.012, { type: 'bandpass', f0: 4200, q: 4, gain: 0.3, dest: d });
    this.godBell(t + 0.06, 1.1, hz(CHARM[charm] ?? 83), 0.12, d); // (ringing on its own note)
  }
  /** A charm bending a power as it acts (`bracelet.charm`, every act): a tiny glint in the ring. */
  braceletCharm(charm = null) {
    if (!this.ok() || !this.allow('braceletCharm', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.1, 0.5);
    this.tone(t, 0.35, { f0: hz((CHARM[charm] ?? 83) + 12), gain: 0.12, dest: d }); // (the gold line's glint)
    this.tone(t + 0.04, 0.25, { f0: hz((CHARM[charm] ?? 83) + 19), gain: 0.04, dest: d });
  }
}
