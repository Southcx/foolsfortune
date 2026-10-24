// ---------------------------------------------------------------------------------------
// A BATCH OF SOUNDS FOR EVENTS THAT WERE SILENT: your seal and the cradles, the parry's window, the World shells, three of the psygun's
// variant plays, Charybdis, and four of the crossing's moments. Each is heard through audio/cues.js off the event its feature emits.
//   YOUR SEAL (world/cradles.js, docs/plans/HANKO.md)
//     THE STAMP    seal.set: a hanko pressed into a clay receptacle so the thing runs as you. A firm wooden chop on clay (a dull knock,
//                  the wood's click, the clay giving), then a warm bell ring, its root by the seal's outline (round, square, oval,
//                  gourd), brighter for a relief carving than an intaglio; the first imprint in a cradle rings longer, with a fifth.
//                  An engine wakes after it (a low hum swelling); a body lands with a thud of its weight
//     THE CARVE    seal.carve: your seal cut at the title, once ever. A chisel's strokes, two a syllable of its name, then the ring
//     THE LIFT     seal.unset: the Pneuka Jar lifting out of the cradle, a soft suck and pop (after a threshold's stamp, held back a
//                  beat so the ring is heard first)
//   THE PARRY'S WINDOW  parry.window (vfx/parrymark.js): a creature's blow opening its window. A tiny crisp glint high up, gone in
//                  40 ms: it says "now" and nothing else; a shot's a step higher than a blow's. Quiet and limited, it never nags
//   THE WORLD SHELLS (tools/psygun/worlddraw.js, progress/combat/worldshells.js; CASTER-SHELLS.md 7)
//     THE DRAW     shell.draw: the place's Lachryma pulled into the aim point from 12 m round. A liquid shimmer rushing inward (a
//                  narrowing sweep, droplets falling in faster and faster) that lands on a small chord in the drawn feeling; its
//                  length, its droplets and its weight all follow the power drawn (`k`, the drawn ÷ the need)
//     A SPRING     shell.spring: a pool of liquid Lachryma welling up where a Rift was: bubbles rising out of a low swell, a bloop
//     A FIND       shell.found: a World shell found in a blot, a tier V thing: an earthy shimmer and a gold run up the pentatonic
//   THE PSYGUN'S VARIANT PLAYS (tools/psygun/variantplay.js; the shot itself is weapon.js's gunshot, a shell's the cylinder's)
//     A FLARE      psygun.flare: the Bombardier's plain shot landing as a flare. A pop, a short magnesium hiss with crackle, and a
//                  glassy ping for each thing it revealed (at most four). Quieter with distance
//     BOTH BARRELS psygun.barrels: the Pepperbox's every ring chamber at once. Under the shells' own shots: the chambers' rattle, one
//                  huge body of a boom, and the smoke's hiss after
//     THE PENTACLE psygun.pentacle: five notes of the pentatonic rung in a star's order (the five damage types), the burst, and the
//                  five as the circle closing; a thud under it when it struck something
//   CHARYBDIS (world/emocean/charybdis.js; the boss line in the music is music/legs.js's, its fall's sting rail.js's railBossFall)
//     ITS RISE     the maw out of the maelstrom: the sea heaving apart, a whale's call swelling, its second voice the feeling's interval
//     ITS DIVE     its first dive: a great breath in, the plunge, and the whirl swallowing down
//     DRIVEN       alive at the release: its call far off and falling under, the whirl closing
//     FELLED       after the fall's sting: its moan falling apart into two voices, the maelstrom stilling, a calm on the sea
//   THE CROSSING (all on the music's next sixteenth and in its key: rail.js onSixteenth, railKey)
//     A MINE       rail.mine (world/emocean/foemechanics.js): a crack, a body, its ring of shots flung out as a spray of ticks, a ping
//     THE HOLD     rail.hold (world/emocean/bosshold.js): the peak lengthened a phrase while its boss stands: a double drum and a low
//                  brass swell; enraged, a semitone clash beating in it. Only a lengthening sounds (a cut is the fall's)
//     A BITE       rail.bite (world/emocean/shoal.js): a glint's nip, a step higher for each bite toward a hit; the fifth, a cluster
//     THE SCATTER  rail.scatter: the bait ball breaking, a flutter of small bodies fleeing and a whoosh falling away
// Prior art: the Japanese hanko on paper and the potter's chop on clay (a knock, then nothing: the ring is the game's), the temple bell's
// partials (1, 2, 2.76, 5.4); Sekiro's and Street Fighter III's parry cues (a short high glint, never a fanfare); Okami's brush and
// Final Fantasy XI's Geomancy for the draw (the world gathered in); the flare pistol's pop and hiss; the double-barrel's both at once;
// the pentagram drawn point by point; whalesong and Homer's Charybdis; Rez's every sound on the beat; Star Fox 64's mines; the bait
// ball broken by a predator (Blue Planet).
//
//   sfx.sealStamp(kind, first, outline, carving) .sealCarve(name, outline, carving) .sealLift(why)   sfx.parryWindowTick(kind)
//   sfx.worldShellDraw(k, feeling) .worldSpring() .worldShellFound()   sfx.flareBurn(n, dist) .barrelsVolley(n) .pentacleStar(n, dist)
//   sfx.charybdisRise(feel, grid) .charybdisDive(feel, grid) .charybdisDriven(feel, grid) .charybdisFelled(feel, grid)
//   sfx.railMineBurst(grid) .railBossHold(bars, enraged, grid) .shoalBite(bites, grid) .shoalScatter(grid)
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.riser`, `this.allow`: audio/core.js;
// `this.onSixteenth`, `this.railKey`: audio/rail.js).
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const OUTLINE = { round: 0, square: -2, oval: 3, gourd: 5 }; // (semitones on the ring's root: each outline its own bell)
const LEAP = { mirth: 4, wonder: 5, desire: 7, grief: 3, dread: 1, fury: 6, gall: 8 }; // (each feeling's interval, as audio/spirits.js hears it)
const BELL = [1, 2, 2.76, 5.4]; // (a bell's partials)
const PENTA = [76, 79, 81, 83, 86]; // (E minor pentatonic from E5: the five damage types)
const STAR = [0, 2, 4, 1, 3]; // (a pentagram drawn: every other point)

/** A warm bell: `m` its root (MIDI), `len` real s, `bright` 0..1 the upper partials' share. */
function bell(s, t, m, len, gain, bright, d) {
  BELL.forEach((p, i) => s.tone(t, len / (1 + i * 0.6), { f0: hz(m) * p, gain: gain * (i === 0 ? 1 : (0.35 + bright * 0.5) / (i + 1)), dest: d }));
}

export class SealSounds {
  // ------------------------------------------------------------ your seal
  /** The stamp (seal.set): the chop, the clay, the ring; `kind` threshold, engine or body; `first` the cradle's first imprint. */
  sealStamp(kind = 'threshold', first = false, outline = 'round', carving = 'relief') {
    if (!this.ok() || !this.allow('sealStamp', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.45);
    this.noise(t, 0.07, { type: 'lowpass', f0: 900, f1: 200, gain: 0.6, dest: d }); // (the wooden chop)
    this.noise(t, 0.015, { type: 'bandpass', f0: 2400, q: 3, gain: 0.25, dest: d }); // (the wood's click)
    this.tone(t, 0.12, { f0: 140, f1: 70, gain: 0.5, dest: d });
    this.noise(t + 0.01, 0.12, { type: 'bandpass', f0: 600, f1: 300, q: 2, gain: 0.15, dest: d }); // (the clay giving)
    const m = 62 + (OUTLINE[outline] ?? 0), bright = carving === 'intaglio' ? 0.2 : 0.7, len = first ? 2.6 : 1.8;
    bell(this, t + 0.06, m, len, 0.12, bright, d); // (the warm ring)
    if (first) this.tone(t + 0.12, len * 0.8, { f0: hz(m + 7), gain: 0.04, dest: d }); // (a first imprint: a fifth over it)
    if (kind === 'engine') this.riser(t + 0.2, 1.2, { f0: 55, f1: 58, type: 'sine', gain: 0.06, dest: d }); // (the machine waking)
    else if (kind === 'body') this.tone(t + 0.04, 0.3, { f0: 80, f1: 40, gain: 0.4, dest: d }); // (a body's weight settling)
  }
  /** Your seal carved at the title (seal.carve): two chisel strokes a syllable of `name`, then the ring. */
  sealCarve(name = '', outline = 'round', carving = 'relief') {
    if (!this.ok() || !this.allow('sealCarve', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.4, true);
    const syl = clamp((String(name).match(/[aeiouy]+/gi) || []).length, 2, 3);
    let x = 0;
    for (let i = 0; i < syl * 2; i++, x += i % 2 ? 0.11 : 0.2) {
      this.noise(t + x, 0.004, { type: 'highpass', f0: 5000, gain: 0.2, dest: d }); // (the edge biting)
      this.noise(t + x, 0.09, { type: 'bandpass', f0: 3200 - (i % 2) * 500, f1: 1800, q: 4, gain: 0.22, dest: d }); // (the stroke)
    }
    bell(this, t + x + 0.1, 62 + (OUTLINE[outline] ?? 0), 1.6, 0.08, carving === 'intaglio' ? 0.2 : 0.7, d);
  }
  /** The Pneuka Jar lifting out of the cradle (seal.unset); `why` 'stamped' (a threshold's) waits a beat for the ring. */
  sealLift(why = 'f') {
    if (!this.ok() || !this.allow('sealLift', 3)) return;
    const late = why === 'stamped', t = this.ctx.currentTime + (late ? 0.3 : 0), d = this.out(late ? 0.2 : 0.3, 0.3);
    this.noise(t, 0.1, { type: 'lowpass', f0: 1200, f1: 400, gain: 0.12, dest: d }); // (the suck)
    this.tone(t + 0.05, 0.08, { f0: 300, f1: 520, gain: 0.15, dest: d }); // (the pop)
  }

  // ------------------------------------------------------------ the parry's window
  /** A blow's parry window opening (parry.window): a crisp high glint; `kind` 'shot' a step higher. */
  parryWindowTick(kind = 'blow') {
    if (!this.ok() || !this.allow('parryWindowTick', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.16, 0.15), f = kind === 'shot' ? 3951 : 3520;
    this.tone(t, 0.045, { f0: f, f1: f * 1.02, gain: 0.5, dest: d });
    this.tone(t, 0.03, { f0: f * 1.5, type: 'triangle', gain: 0.1, dest: d });
    this.noise(t, 0.006, { type: 'highpass', f0: 7000, gain: 0.2, dest: d });
  }

  // ------------------------------------------------------------ the World shells
  /** The place's Lachryma drawn into the aim point (shell.draw): `k` 0..1 the power drawn, `feeling` what was drawn (or null). */
  worldShellDraw(k = 0.5, feeling = null) {
    if (!this.ok() || !this.allow('worldShellDraw', 2)) return;
    const size = clamp(k, 0.15, 1), t = this.ctx.currentTime, dur = 0.5 + 0.5 * size, d = this.out(0.22 + 0.18 * size, 0.5);
    this.noise(t, dur, { type: 'bandpass', f0: 6000, f1: 900, q: 1.6, gain: 0.35, attack: dur * 0.85, dest: d }); // (the rush inward)
    const n = Math.round(6 + 10 * size);
    for (let i = 0; i < n; i++) { // (droplets falling in, faster and faster)
      const u = 1 - Math.pow(1 - i / n, 2), f = 2600 - 1600 * (i / n) + Math.random() * 500;
      this.tone(t + u * dur, 0.05, { f0: f, f1: f * 0.7, gain: 0.05 + 0.05 * (i / n), dest: d });
    }
    const at = t + dur, m = 76, leap = LEAP[feeling] ?? 7;
    [0, 7, leap + 12].forEach((s, i) => this.tone(at + i * 0.02, 0.6 + 0.6 * size, { f0: hz(m + s), gain: 0.06 / (i + 1), dest: d })); // (gathered: its feeling's chord)
    this.tone(at, 0.15, { f0: 200, f1: 90, gain: 0.25 * size, dest: d }); // (its weight in the shell)
  }
  /** A pool of liquid Lachryma welling up where a Rift was (shell.spring). */
  worldSpring() {
    if (!this.ok() || !this.allow('worldSpring', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.5);
    this.noise(t, 1.4, { type: 'lowpass', f0: 200, f1: 900, gain: 0.3, attack: 1, dest: d }); // (the swell)
    for (let i = 0; i < 12; i++) { const at = t + 0.1 + i * 0.1 + Math.random() * 0.05, f = 200 + i * 35 + Math.random() * 120; this.tone(at, 0.07, { f0: f, f1: f * 1.8, gain: 0.08, dest: d }); } // (bubbles rising)
    this.tone(t + 1.35, 0.2, { f0: 180, f1: 420, gain: 0.2, dest: d }); // (the bloop as it brims)
  }
  /** A World shell found (shell.found): an earthy shimmer and a gold run. */
  worldShellFound() {
    if (!this.ok() || !this.allow('worldShellFound', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6);
    this.noise(t, 0.6, { type: 'bandpass', f0: 300, f1: 1200, q: 1.5, gain: 0.2, attack: 0.2, dest: d }); // (out of the blot)
    [64, 71, 76, 80, 83].forEach((m, i) => this.tone(t + 0.15 + i * 0.07, 0.9, { f0: hz(m), type: i === 4 ? 'triangle' : 'sine', gain: 0.07, dest: d }));
    [88, 95].forEach((m) => this.tone(t + 0.55, 1.4, { f0: hz(m), gain: 0.025, dest: d })); // (the gold)
  }

  // ------------------------------------------------------------ the psygun's variant plays
  /** The Bombardier's flare lit where its shot landed (psygun.flare): `n` things revealed, `dist` metres from the camera. */
  flareBurn(n = 0, dist = 8) {
    if (!this.ok() || !this.allow('flareBurn', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.4 / (0.6 + dist * 0.08), 0.5);
    this.noise(t, 0.05, { type: 'highpass', f0: 2500, gain: 0.5, dest: d }); // (the pop)
    this.tone(t, 0.06, { f0: 900, f1: 300, gain: 0.2, dest: d });
    this.noise(t + 0.03, 1.2, { type: 'bandpass', f0: 3000, f1: 2200, q: 0.8, gain: 0.12, attack: 0.05, dest: d }); // (the burn's hiss)
    for (let i = 0; i < 6; i++) this.noise(t + 0.1 + Math.random() * 0.9, 0.01, { type: 'bandpass', f0: 2000 + Math.random() * 3000, q: 5, gain: 0.15, dest: d }); // (crackle)
    for (let i = 0; i < Math.min(4, n); i++) this.tone(t + 0.18 + i * 0.07, 0.3, { f0: hz(83 + i * 2), gain: 0.04, dest: d }); // (each thing it reveals)
  }
  /** The Pepperbox's both barrels (psygun.barrels): `n` chambers gone at once, under their own shots. */
  barrelsVolley(n = 6) {
    if (!this.ok() || !this.allow('barrelsVolley', 1)) return;
    const t = this.ctx.currentTime, w = clamp(n / 6, 0.5, 1.2), d = this.out(0.45 * w, 0.5);
    for (let i = 0; i < Math.min(7, n); i++) this.noise(t + i * 0.012, 0.01, { type: 'bandpass', f0: 3000 + i * 200, q: 4, gain: 0.2, dest: d }); // (the chambers' rattle)
    this.tone(t + 0.02, 0.5, { f0: 80, f1: 35, gain: 0.6, dest: d }); // (the one body)
    this.noise(t + 0.02, 0.4, { type: 'lowpass', f0: 3000, f1: 300, gain: 0.5, dest: d });
    this.noise(t + 0.25, 1, { type: 'highpass', f0: 2500, f1: 1200, gain: 0.06, attack: 0.15, dest: d }); // (the smoke)
  }
  /** The Pentagun's pentacle (psygun.pentacle): `n` creatures struck, `dist` metres from the camera. */
  pentacleStar(n = 0, dist = 8) {
    if (!this.ok() || !this.allow('pentacleStar', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.35 / (0.6 + dist * 0.06), 0.55);
    STAR.forEach((p, i) => this.tone(t + i * 0.045, 0.35, { f0: hz(PENTA[p]), type: 'triangle', gain: 0.1, dest: d })); // (the star drawn)
    const at = t + 0.25;
    this.noise(at, 0.3, { type: 'lowpass', f0: 2500, f1: 300, gain: 0.45, dest: d }); // (the burst)
    PENTA.forEach((m, i) => this.tone(at + 0.03, 1.2, { f0: hz(m), gain: 0.035, dest: d })); // (the circle closing)
    if (n > 0) this.tone(at, 0.25, { f0: 120, f1: 50, gain: 0.4, dest: d }); // (something struck)
  }

  // ------------------------------------------------------------ Charybdis
  /** Charybdis rising out of the maelstrom (charybdis.rise): `feel` the waypoint's feeling, its call's interval. */
  charybdisRise(feel = null, grid = null) {
    if (!this.ok() || !this.allow('charybdisRise', 0.5)) return;
    const t = this.onSixteenth(grid), key = this.railKey(grid), d = this.out(0.45, 0.6), leap = LEAP[feel] ?? 7;
    this.noise(t, 2, { type: 'lowpass', f0: 300, f1: 2500, gain: 0.45, attack: 0.6, dest: d }); // (the sea heaving apart)
    this.riser(t, 1.4, { f0: hz(28 + key), f1: hz(40 + key), type: 'sawtooth', gain: 0.08, q: 3, dest: d }); // (the call swelling)
    this.tone(t + 1.4, 1.6, { f0: hz(40 + key), f1: hz(36 + key), type: 'sawtooth', gain: 0.05, dest: d });
    this.tone(t + 1.4, 1.6, { f0: hz(40 + key + leap), f1: hz(36 + key + leap), type: 'triangle', gain: 0.05, dest: d }); // (its feeling's voice)
    this.tone(t + 0.6, 1.6, { f0: 45, f1: 30, gain: 0.45, dest: d });
  }
  /** Charybdis's first dive (charybdis.dive): a breath in, the plunge, the whirl swallowing. */
  charybdisDive(feel = null, grid = null) {
    if (!this.ok() || !this.allow('charybdisDive', 0.5)) return;
    const t = this.onSixteenth(grid), key = this.railKey(grid), d = this.out(0.45, 0.6);
    this.noise(t, 0.7, { type: 'bandpass', f0: 1800, f1: 400, q: 1, gain: 0.25, attack: 0.5, dest: d }); // (the breath)
    this.noise(t + 0.7, 1.2, { type: 'lowpass', f0: 2500, f1: 200, gain: 0.5, dest: d }); // (the plunge)
    this.tone(t + 0.7, 1.4, { f0: 70, f1: 28, gain: 0.5, dest: d });
    this.noise(t + 0.9, 1.8, { type: 'bandpass', f0: 900, f1: 150, q: 4, gain: 0.25, attack: 0.3, dest: d }); // (the whirl swallowing)
    this.tone(t + 0.8, 1.2, { f0: hz(40 + key + (LEAP[feel] ?? 7)), f1: hz(31 + key), type: 'triangle', gain: 0.03, dest: d });
  }
  /** Charybdis alive at the release, going down (charybdis.driven): its call far off, the whirl closing. */
  charybdisDriven(feel = null, grid = null) {
    if (!this.ok() || !this.allow('charybdisDriven', 0.5)) return;
    const t = this.onSixteenth(grid), key = this.railKey(grid), d = this.out(0.35, 0.8);
    this.tone(t, 2.5, { f0: hz(40 + key), f1: hz(33 + key), type: 'sawtooth', gain: 0.04, dest: d });
    this.tone(t, 2.5, { f0: hz(40 + key + (LEAP[feel] ?? 7)), f1: hz(33 + key + (LEAP[feel] ?? 7)), type: 'triangle', gain: 0.03, dest: d });
    this.noise(t + 0.3, 2, { type: 'lowpass', f0: 900, f1: 150, gain: 0.3, dest: d }); // (the whirl closing over it)
  }
  /** Charybdis felled (charybdis.felled): after the fall's sting (railBossFall, about a real second), its moan and the sea stilling. */
  charybdisFelled(feel = null, grid = null) {
    if (!this.ok() || !this.allow('charybdisFelled', 0.5)) return;
    const t = this.ctx.currentTime + 1.05, key = this.railKey(grid), d = this.out(0.4, 0.7), leap = LEAP[feel] ?? 7;
    this.tone(t, 3, { f0: hz(43 + key), f1: hz(31 + key), type: 'sawtooth', gain: 0.045, dest: d }); // (its moan, falling apart)
    this.tone(t, 3, { f0: hz(43 + key) * 1.012, f1: hz(29 + key), type: 'sawtooth', gain: 0.035, dest: d });
    this.noise(t + 0.2, 2.5, { type: 'bandpass', f0: 800, f1: 120, q: 2, gain: 0.3, dest: d }); // (the maelstrom stilling)
    [0, 7, leap + 12].forEach((s, i) => this.tone(t + 2 + i * 0.08, 2, { f0: hz(76 + key + s), gain: 0.025, dest: d })); // (the sea laid flat)
  }

  // ------------------------------------------------------------ the crossing
  /** A mine going off (rail.mine): a crack and a body, its ring of shots flung out, on the next sixteenth. */
  railMineBurst(grid = null) {
    if (!this.ok() || !this.allow('railMineBurst', 8)) return;
    const t = this.onSixteenth(grid), key = this.railKey(grid), d = this.out(0.28, 0.35);
    this.noise(t, 0.03, { type: 'highpass', f0: 4000, gain: 0.6, dest: d }); // (the crack)
    this.tone(t, 0.25, { f0: 160, f1: 50, gain: 0.45, dest: d });
    for (let i = 0; i < 8; i++) this.noise(t + 0.02 + i * 0.012, 0.01, { type: 'bandpass', f0: 2200 + i * 200, q: 5, gain: 0.18, dest: d }); // (the ring of shots)
    this.tone(t, 0.18, { f0: hz(83 + key), gain: 0.12, dest: d });
  }
  /** The boss hold (rail.hold): the peak lengthened by `bars` while its boss stands; `enraged` a clash in it. A cut (bars <= 0) is silent. */
  railBossHold(bars = 8, enraged = false, grid = null) {
    if (!(bars > 0) || !this.ok() || !this.allow('railBossHold', 0.5)) return;
    const t = this.onSixteenth(grid), key = this.railKey(grid), d = this.out(0.3, 0.55), step = grid?.spb ? grid.spb / 4 : 0.12;
    [0, step].forEach((x, i) => { this.tone(t + x, 0.3, { f0: 90 - i * 10, f1: 45, gain: 0.45, dest: d }); this.noise(t + x, 0.06, { type: 'lowpass', f0: 600, gain: 0.3, dest: d }); }); // (the double drum)
    const root = hz(40 + key), q = enraged ? 5 : 2;
    this.riser(t, 1.6, { f0: root, f1: root * 1.01, type: 'sawtooth', gain: 0.06, q, dest: d }); // (the brass swell)
    this.riser(t, 1.6, { f0: root * 1.5, f1: root * 1.515, type: 'sawtooth', gain: 0.04, q, dest: d });
    if (enraged) this.riser(t, 1.6, { f0: root * 1.0595, f1: root * 1.07, type: 'sawtooth', gain: 0.04, q, dest: d }); // (the semitone beating)
  }
  /** A glint's bite (rail.bite): `bites` toward a hit (0 the fifth: the hit itself, a cluster). */
  shoalBite(bites = 1, grid = null) {
    if (!this.ok() || !this.allow('shoalBite', 10)) return;
    const t = this.onSixteenth(grid), key = this.railKey(grid), d = this.out(0.16, 0.25), hit = bites === 0;
    for (let i = 0; i < (hit ? 3 : 1); i++) {
      const at = t + i * 0.03, f = hz(76 + key + (hit ? 10 : bites * 2));
      this.noise(at, 0.02, { type: 'bandpass', f0: 1800, q: 5, gain: 0.3, dest: d }); // (the snap)
      this.tone(at, 0.04, { f0: f, f1: f * 0.5, gain: 0.25, dest: d });
    }
  }
  /** The bait ball scattered (rail.scatter): small bodies fleeing, a whoosh falling away. */
  shoalScatter(grid = null) {
    if (!this.ok() || !this.allow('shoalScatter', 1)) return;
    const t = this.onSixteenth(grid), d = this.out(0.25, 0.4);
    this.noise(t, 0.5, { type: 'highpass', f0: 5000, f1: 1500, gain: 0.25, dest: d }); // (the whoosh)
    for (let i = 0; i < 14; i++) { const at = t + Math.random() * 0.6, f = 600 + Math.random() * 1400; this.tone(at, 0.05, { f0: f, f1: f * (Math.random() < 0.5 ? 0.6 : 1.6), gain: 0.06, dest: d }); } // (the flutter)
  }
}
