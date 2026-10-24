// ---------------------------------------------------------------------------------------
// THE RACEWAY'S BUILT THINGS, HEARD (a sound bank of the one mixer, audio/sfx.js): the traps (world/raceway/traps.js, the rules
// progress/traps.js; docs/plans/TRACK-EDITOR.md 4, 6), the haunt (world/raceway/haunt.js), the track editor (world/raceway/editor.js), the
// garage and the skiff's paint (progress/skiffparts.js, progress/skiffpaint.js), and the Raceway's moments that were still silent
// (rivals.js, escape.js, raceway.js, features.js, siphons.js, cups.js, citytrial.js). Dovina's and Petra's events, through audio/cues.js.
// Pitched things in E, the Raceway cue's key, moved to the music's key when it plays (the grid's root).
//   A TRAP'S TELL   trap.tell { kind, i }: each kind its own warning, so the ear knows which is coming before the eye finds it, as long
//                   as its tell (TRAPS[kind].cycle.tell), then the act itself where the tell ends (the act has no event of its own):
//                     pillars   stone grinding up under the sand, then the slam of the row standing
//                     pendulum  the arm's rope creaking at its end, then the stone's whoosh across
//                     gust      the fan spinning up (its blades ticking faster), then the blast
//                     sinkhole  sand trickling faster and faster, then the floor dropping away (a hollow fall)
//                     gusher    gurgles climbing a pipe under a pressure hiss, then the spurt of crude
//                     portal    a two-voice shimmer winding up, then the eye opening (a bright hum)
//                     turret    the Lantern Wisp's breath drawn in and its flame flickering up, then the cast
//                   Heard from the camera: loud near, gone past 120 m (a track's twelve traps never pile up)
//   A FIRE          trap.fire { by }: a trap possessed and fired: yours (the haunt) a lever's thunk and a spectral glide up; a sibling's
//                   (a haunted race) the glide only, a haunter's breath, before the tell
//   A HIT           trap.hit { kind, target, by }: the trap's own blow over the board's (skiff.hull and the bail sound already): a pillar's
//                   stone thud, the pendulum's bonk, the gust's whump, the sand's collapse, the slick's splat, the flame's burst; a rival
//                   wrecked by your trap (the haunt's score) a bright little tally tick on top
//   THE TURRET      trap.parry: the flame sent home (a ting and a reversed whoosh); trap.stun: it reaches the lamp (glass cracking, the
//                   Wisp's whimper falling, a fizzle)
//   A WARP          trap.warp { back, target }: on (lit: a shortcut) a shimmer sweeping up; back (red: a send-back) the sweep falling, a
//                   sour tone under it; a rival's quieter
//   THE HAUNT       haunt.start: a spectral chord rising (you take hold of the traps); haunt.end { held }: held, the chord resolving
//                   up; broken through, falling away in the minor
//   THE EDITOR      a drafting table's: editor.open paper unrolled and two pencil taps; editor.save a stamp pressed on paper;
//                   track.validate (a real moment) a stopwatch's click and a run up E's triad to a bell chord, on the music's grid;
//                   track.share a slip folded and a whistle up; track.load paper unrolled and pinned
//   THE GARAGE      skiff.part { slot }: a part fitted by its kind (sail a cloth snap, keel a clamp and thunk, hull a hollow knock, mast
//                   the sections telescoping, fin a slide-in and a ting); skiff.tune { value }: a slider's notch, a ratchet click,
//                   very quiet, the stock notch a brighter detent; skiff.setup { how }: kept, two clicks and a latch; worn, the
//                   parts rattling in and a small chord
//   THE PAINT       skiff.paint { kind, price }: dye a wet brush, pattern a stencil's daubs, seal a stamp, trail and ribbon a shimmering
//                   whoosh, pennant and length cloth flapping; a price paid, a cube's clink after
//   THE RACE        race.nemesis { beaten }: the grudge settled (a fifth rising, a clean clap) or a rival marking you (two low notes a
//                   semitone apart, one clap far off), after the finish's own sounds; race.escape.near: a heartbeat's double thump
//                   and the sand hissing behind (the chase's layer is the cue's: music/raceway.js); race.rival.finish: a rival over
//                   the line far off, two claps and a short horn; race.respawn: the board set down (a puff of sand, a glassy tick),
//                   kept silent under race.back's own rewind; raceway.pit: sand pouring down the cone, the antlion's jaws clacking
//                   twice, a gulp; skiff.siphon { took }: the arch drinking the pool, a vortex's rising whirl as long as it took
//   CUPS, TRIAL     cup.start { cup }: a drum roll and a call up the fourth (the Sibling Cup's five voices); cup.end: called off,
//                   two notes falling muted; citytrial.end { why }: finished, the stadium's gong after the finish; called off, a horn
//                   falling
// Prior art: Trackmania's editor (the click of a piece snapped, the validate run's moment), Mario Kart's item sounds (each item its own
// tell: the blue shell's whine before it lands), Fall Guys' and Ultimate Chicken Horse's traps (the piston's grind, the fan's spin-up),
// Crawl's possession (a ghost's breath as it takes a trap), Forza's and Gran Turismo's garage (a notch per slider step), Splatoon's
// paint, Burnout's rival sting, the drafting table's paper, pencil and stamp, the classic synthesis (noise for sand and wind, glides
// for whooshes).
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.riser`, `this.allow`: audio/core.js;
// `this.onSixteenth`: audio/rail.js).
//
//   sfx.trapTell(kind, metres) .trapFire(kind, by, metres) .trapHit(kind, target, by, metres) .trapParry() .trapStun(metres)
//   .trapWarp(back, target) .hauntStart(grid) .hauntEnd(held, grid) .editorOpen() .editorSave() .trackValidate(grid) .trackShare()
//   .trackLoad() .skiffPartFit(slot) .skiffTuneNotch(value) .skiffSetupKeep(how) .skiffPaintDye(kind, price) .raceNemesis(beaten, grid)
//   .escapeNear() .raceRivalFinish() .raceRespawnSet() .racewayPitSnap() .skiffSiphonDrink(took) .cupStart(cup, grid) .cupEnd()
//   .cityTrialEnd(why)
// ---------------------------------------------------------------------------------------
import { TRAPS } from '../progress/traps.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** How loud a thing `m` metres from the camera is heard (null: no place known, near enough). */
const nearOf = (m) => (m == null || !isFinite(m) ? 0.8 : Math.pow(Math.max(0, Math.min(1, 1 - (m - 10) / 110)), 1.5));
/** Semitones from E to the music's key, the short way (-6..5): as audio/rail.js railKey. */
const keyOf = (grid) => (grid?.root != null ? ((((grid.root - 64) % 12) + 18) % 12) - 6 : 0);
/** The next sixteenth of the music's grid, or now. */
const onGrid = (S, grid) => (grid?.spb && S.onSixteenth ? S.onSixteenth(grid) : S.ctx.currentTime);
const tellOf = (kind) => Math.max(0.5, Math.min(1.2, TRAPS[kind]?.cycle?.tell ?? 0.8));

export class RacewayBuildSounds {
  // ---------------------------------------------------------------- the traps
  /** A trap's tell (`kind`), `metres` from the camera: its warning as long as its tell, then its act where the tell ends. */
  trapTell(kind = 'pillars', metres = null) {
    const k = nearOf(metres); if (k < 0.04 || !this.ok() || !this.allow(`trapTell.${kind}`, 3) || !this.allow('trapTell', 8)) return;
    const t = this.ctx.currentTime, L = tellOf(kind), d = this.out(0.34 * k, 0.4), at = t + L;
    if (kind === 'pillars') {
      this.noise(t, L, { type: 'bandpass', f0: 120, f1: 520, q: 1.6, gain: 0.5, attack: L * 0.8, dest: d }); // (stone grinding up under the sand)
      this.riser(t, L, { f0: 45, f1: 80, type: 'triangle', gain: 0.25, dest: d });
      this.tone(at, 0.35, { f0: 110, f1: 45, gain: 0.6, dest: d }); this.noise(at, 0.25, { type: 'lowpass', f0: 2400, f1: 300, gain: 0.45, dest: d }); // (the row standing)
    } else if (kind === 'pendulum') {
      for (let i = 0; i < 3; i++) this.tone(t + i * L * 0.22, 0.14, { f0: 300 + i * 25, f1: 240 + i * 30, type: 'sawtooth', gain: 0.05, dest: d }); // (the rope creaking at the arm's end)
      this.noise(t + L * 0.5, L * 0.5, { type: 'bandpass', f0: 300, f1: 900, q: 1.2, gain: 0.18, attack: L * 0.45, dest: d });
      this.noise(at, 0.6, { type: 'bandpass', f0: 1200, f1: 280, q: 1.4, gain: 0.45, attack: 0.18, dest: d }); this.tone(at + 0.1, 0.5, { f0: 70, f1: 55, gain: 0.3, dest: d }); // (the stone's whoosh across)
    } else if (kind === 'gust') {
      for (let i = 0, s = 0; s < L; i++) { this.noise(t + s, 0.015, { type: 'bandpass', f0: 700 + i * 40, q: 4, gain: 0.2, dest: d }); s += Math.max(0.035, 0.16 * Math.pow(0.8, i)); } // (the blades ticking faster)
      this.riser(t, L, { f0: 60, f1: 220, type: 'sawtooth', gain: 0.05, q: 1, dest: d });
      this.noise(at, 1.1, { type: 'bandpass', f0: 600, f1: 1400, q: 0.6, gain: 0.55, attack: 0.06, dest: d }); this.noise(at, 0.4, { type: 'lowpass', f0: 500, f1: 150, gain: 0.4, dest: d }); // (the blast)
    } else if (kind === 'sinkhole') {
      for (let i = 0, s = 0; s < L; i++) { this.noise(t + s, 0.01, { type: 'highpass', f0: 4000 + Math.random() * 3000, gain: 0.12 + 0.2 * (s / L), dest: d }); s += Math.max(0.018, 0.12 * Math.pow(0.84, i)); } // (sand trickling faster)
      this.noise(at, 0.8, { type: 'lowpass', f0: 900, f1: 120, gain: 0.55, dest: d }); this.tone(at, 0.6, { f0: 140, f1: 38, gain: 0.45, dest: d }); // (the floor dropping away)
    } else if (kind === 'gusher') {
      for (let i = 0; i < 7; i++) this.tone(t + (i / 7) * L, 0.07, { f0: 90 + i * 22 + Math.random() * 20, f1: 180 + i * 35, gain: 0.18, dest: d }); // (gurgles climbing the pipe)
      this.noise(t, L, { type: 'highpass', f0: 2500, f1: 5000, gain: 0.12, attack: L * 0.9, dest: d }); // (the pressure's hiss)
      this.noise(at, 0.7, { type: 'bandpass', f0: 500, f1: 220, q: 1.4, gain: 0.5, dest: d }); this.tone(at, 0.3, { f0: 160, f1: 70, gain: 0.35, dest: d }); // (the spurt of crude)
    } else if (kind === 'portal') {
      [0, 0.7].forEach((det) => this.riser(t, L, { f0: hz(52 + det), f1: hz(64 + det), type: 'triangle', gain: 0.07, dest: d })); // (two voices winding up, a beat between them)
      this.noise(t, L, { type: 'bandpass', f0: 1500, f1: 4500, q: 3, gain: 0.1, attack: L * 0.7, dest: d });
      [64, 71, 76].forEach((m, i) => this.tone(at + i * 0.02, 0.9, { f0: hz(m), gain: 0.07, dest: d })); this.tone(at, 0.6, { f0: hz(40), f1: hz(40) * 1.02, gain: 0.25, dest: d }); // (the eye open: a bright hum)
    } else { // (the Wisp turret)
      this.noise(t, L, { type: 'bandpass', f0: 600, f1: 2200, q: 1, gain: 0.3, attack: L * 0.85, dest: d }); // (the Wisp's breath drawn in)
      for (let i = 0; i < 6; i++) this.tone(t + L * (0.3 + i * 0.11), 0.06, { f0: 500 + i * 120 + Math.random() * 90, f1: 700 + i * 140, type: 'triangle', gain: 0.06, dest: d }); // (the flame flickering up)
      this.noise(at, 0.35, { type: 'bandpass', f0: 2500, f1: 700, q: 1.3, gain: 0.45, dest: d }); this.tone(at, 0.2, { f0: 420, f1: 180, type: 'triangle', gain: 0.18, dest: d }); // (the cast)
    }
  }
  /** A possessed trap fired: by 'courier' (yours, the haunt) or a sibling's bot, `metres` from the camera. */
  trapFire(kind = 'pillars', by = 'courier', metres = null) {
    const mine = by === 'courier', k = mine ? 1 : nearOf(metres); if (k < 0.04 || !this.ok() || !this.allow('trapFire', 8)) return;
    const t = this.ctx.currentTime, d = this.out((mine ? 0.3 : 0.22) * k, 0.6, mine);
    if (mine) { this.noise(t, 0.02, { type: 'bandpass', f0: 1800, q: 3, gain: 0.35, dest: d }); this.tone(t, 0.09, { f0: 160, f1: 90, type: 'triangle', gain: 0.35, dest: d }); } // (a lever's thunk)
    this.riser(t, 0.35, { f0: hz(59), f1: hz(71), type: 'sine', gain: 0.08, dest: d }); this.riser(t, 0.35, { f0: hz(59.3), f1: hz(71.4), type: 'sine', gain: 0.06, dest: d }); // (a spectral glide up: the haunter's breath)
    this.noise(t, 0.4, { type: 'bandpass', f0: 900, f1: 2600, q: 2, gain: 0.08, attack: 0.25, dest: d });
  }
  /** A trap's blow landed on `target` ('courier' | 'rival'), over the board's own sounds; a rival wrecked by yours, a tally tick. */
  trapHit(kind = 'pillars', target = 'courier', by = 'environment', metres = null) {
    if (kind === 'portal') return; // (a warp is heard as trap.warp)
    const you = target === 'courier', k = you ? 1 : nearOf(metres), score = !you && by === 'courier';
    if ((k < 0.04 && !score) || !this.ok() || !this.allow(`trapHit.${target}`, 6)) return;
    const t = this.ctx.currentTime, d = this.out((you ? 0.4 : 0.26) * Math.max(k, score ? 0.4 : 0), 0.35);
    if (kind === 'pillars') { this.tone(t, 0.22, { f0: 95, f1: 50, gain: 0.55, dest: d }); this.noise(t, 0.08, { type: 'bandpass', f0: 1400, q: 1.2, gain: 0.35, dest: d }); }
    else if (kind === 'pendulum') { this.tone(t, 0.3, { f0: 180, f1: 70, type: 'triangle', gain: 0.5, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 1800, gain: 0.35, dest: d }); } // (the stone's bonk)
    else if (kind === 'gust') { this.noise(t, 0.35, { type: 'lowpass', f0: 900, f1: 200, gain: 0.45, dest: d }); this.tone(t, 0.2, { f0: 80, f1: 50, gain: 0.3, dest: d }); } // (a whump of air)
    else if (kind === 'sinkhole') { this.noise(t, 0.6, { type: 'lowpass', f0: 1600, f1: 200, gain: 0.45, dest: d }); for (let i = 0; i < 4; i++) this.noise(t + 0.05 + i * 0.06, 0.03, { type: 'bandpass', f0: 600 + i * 150, q: 2, gain: 0.2, dest: d }); } // (the sand's collapse)
    else if (kind === 'gusher') { this.noise(t, 0.18, { type: 'bandpass', f0: 650, f1: 300, q: 1.5, gain: 0.45, dest: d }); this.tone(t, 0.14, { f0: 240, f1: 110, gain: 0.25, dest: d }); } // (the slick's splat)
    else { this.noise(t, 0.3, { type: 'bandpass', f0: 3000, f1: 800, q: 1, gain: 0.45, dest: d }); this.tone(t, 0.16, { f0: 130, f1: 70, gain: 0.4, dest: d }); } // (the flame's burst)
    if (score) { const u = this.out(0.22, 0.25, true); this.tone(t + 0.08, 0.12, { f0: hz(83), type: 'triangle', gain: 0.4, dest: u }); this.tone(t + 0.14, 0.18, { f0: hz(88), type: 'triangle', gain: 0.35, dest: u }); } // (a wreck to your tally)
  }
  /** The turret's flame sent home by the parry. */
  trapParry() {
    if (!this.ok() || !this.allow('trapParry', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.36, 0.4);
    this.tone(t, 0.25, { f0: hz(88), type: 'triangle', gain: 0.35, dest: d }); this.tone(t, 0.18, { f0: hz(95), gain: 0.15, dest: d }); // (the ting)
    this.riser(t + 0.03, 0.3, { f0: 300, f1: 1600, type: 'sawtooth', gain: 0.03, q: 1, dest: d }); this.noise(t + 0.03, 0.35, { type: 'bandpass', f0: 700, f1: 3000, q: 1, gain: 0.25, attack: 0.25, dest: d }); // (the reversed whoosh)
  }
  /** The flame home in its lamp: the turret stunned. */
  trapStun(metres = null) {
    const k = Math.max(0.35, nearOf(metres)); if (!this.ok() || !this.allow('trapStun', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.36 * k, 0.45);
    for (let i = 0; i < 4; i++) this.noise(t + i * 0.025, 0.03, { type: 'highpass', f0: 3500 + i * 600, gain: 0.35, dest: d }); // (the lamp's glass cracking)
    this.tone(t + 0.08, 0.7, { f0: 900, f1: 380, type: 'triangle', gain: 0.1, dest: d }); this.tone(t + 0.1, 0.7, { f0: 960, f1: 400, gain: 0.05, dest: d }); // (the Wisp's whimper falling)
    this.noise(t + 0.15, 0.6, { type: 'highpass', f0: 2500, f1: 1200, gain: 0.12, dest: d }); // (the fizzle)
  }
  /** Through a portal: on (lit, a shortcut) or `back` (red, a send-back); `target` 'courier' | 'rival'. */
  trapWarp(back = false, target = 'courier') {
    const you = target === 'courier'; if (!this.ok() || !this.allow(`trapWarp.${target}`, 3)) return;
    const t = this.ctx.currentTime, d = this.out(you ? 0.4 : 0.15, 0.6), [a, b] = back ? [hz(79), hz(55)] : [hz(55), hz(79)];
    this.riser(t, 0.4, { f0: a, f1: b, type: 'triangle', gain: 0.12, dest: d }); this.noise(t, 0.5, { type: 'bandpass', f0: back ? 4000 : 800, f1: back ? 600 : 4500, q: 2, gain: 0.25, attack: 0.3, dest: d });
    if (back) this.tone(t + 0.1, 0.6, { f0: hz(46), f1: hz(45), type: 'sawtooth', gain: 0.05, dest: d }); // (a sour tone under the send-back)
    else [64, 68, 71].forEach((m, i) => this.tone(t + 0.35 + i * 0.03, 0.4, { f0: hz(m + 12), gain: 0.05, dest: d })); // (out of the other eye)
  }

  // ---------------------------------------------------------------- the haunt
  /** The haunt begun: you take hold of the traps. */
  hauntStart(grid = null) {
    if (!this.ok() || !this.allow('hauntStart', 1)) return;
    const t = onGrid(this, grid), r = 52 + keyOf(grid), d = this.out(0.3, 0.7, true);
    [0, 3, 7, 11].forEach((s, i) => this.riser(t + i * 0.08, 1.1, { f0: hz(r + s - 0.3), f1: hz(r + s + 12), type: 'triangle', gain: 0.06, dest: d })); // (a spectral chord rising, minor with its seventh)
    this.noise(t, 1.2, { type: 'bandpass', f0: 500, f1: 3000, q: 2, gain: 0.1, attack: 0.9, dest: d });
  }
  /** The haunt over: `held` (no rival inside par) resolving up, else falling away. */
  hauntEnd(held = false, grid = null) {
    if (!this.ok() || !this.allow('hauntEnd', 1)) return;
    const t = onGrid(this, grid) + 0.15, r = 64 + keyOf(grid), d = this.out(0.32, 0.6, true);
    if (held) { [[0, 3, 6], [0, 4, 7]].forEach((ch, j) => ch.forEach((s) => this.tone(t + j * 0.35, j ? 1.6 : 0.4, { f0: hz(r + s), type: 'triangle', gain: 0.08, dest: d }))); this.tone(t + 0.35, 1.4, { f0: hz(r + 12), gain: 0.06, dest: d }); } // (the diminished's lean, then home)
    else [7, 3, 0, -5].forEach((s, i) => this.tone(t + i * 0.18, 0.5, { f0: hz(r + s), f1: hz(r + s - 0.4), type: 'triangle', gain: 0.08, dest: d })); // (falling away in the minor)
  }

  // ---------------------------------------------------------------- the track editor (a drafting table's)
  editorOpen() {
    if (!this.ok() || !this.allow('editorOpen', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.2, true);
    this.noise(t, 0.4, { type: 'bandpass', f0: 1200, f1: 3500, q: 0.8, gain: 0.25, attack: 0.15, dest: d }); // (paper unrolled)
    [0.45, 0.56].forEach((s) => this.noise(t + s, 0.012, { type: 'bandpass', f0: 3200, q: 4, gain: 0.35, dest: d })); // (two pencil taps)
  }
  editorSave() {
    if (!this.ok() || !this.allow('editorSave', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.2, true);
    this.tone(t, 0.1, { f0: 150, f1: 80, type: 'triangle', gain: 0.4, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 1500, gain: 0.3, dest: d }); // (a stamp pressed on paper)
    this.noise(t + 0.08, 0.12, { type: 'bandpass', f0: 2500, q: 1, gain: 0.1, dest: d });
  }
  /** A validate run's line crossed: the author time set. A moment. */
  trackValidate(grid = null) {
    if (!this.ok() || !this.allow('trackValidate', 1)) return;
    const now = this.ctx.currentTime, d = this.out(0.36, 0.6, true), r = 64 + keyOf(grid);
    this.noise(now, 0.012, { type: 'bandpass', f0: 4200, q: 6, gain: 0.45, dest: d }); this.tone(now, 0.04, { f0: 2400, type: 'square', gain: 0.04, dest: d }); // (the stopwatch's click)
    const t = Math.max(now + 0.12, onGrid(this, grid));
    [0, 4, 7, 12].forEach((s, i) => this.tone(t + i * 0.08, 0.3, { f0: hz(r + s), type: 'triangle', gain: 0.1, dest: d })); // (a run up the triad)
    const at = t + 0.36; [0, 4, 7, 11, 16].forEach((s) => { this.tone(at, 2.2, { f0: hz(r + 12 + s), gain: 0.05, dest: d }); this.tone(at, 0.6, { f0: hz(r + 12 + s) * 2.76, gain: 0.012, dest: d }); }); // (the bell chord)
    this.tone(at, 0.4, { f0: hz(r - 12), f1: hz(r - 12) * 0.99, type: 'triangle', gain: 0.2, dest: d });
  }
  trackShare() {
    if (!this.ok() || !this.allow('trackShare', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.3, true);
    this.noise(t, 0.08, { type: 'bandpass', f0: 2000, f1: 3500, q: 1, gain: 0.25, dest: d }); this.noise(t + 0.1, 0.06, { type: 'bandpass', f0: 2600, f1: 1800, q: 1, gain: 0.2, dest: d }); // (a slip folded)
    this.tone(t + 0.18, 0.22, { f0: hz(83), f1: hz(90), gain: 0.12, dest: d }); // (a whistle up: it goes)
  }
  trackLoad() {
    if (!this.ok() || !this.allow('trackLoad', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.2, true);
    this.noise(t, 0.35, { type: 'bandpass', f0: 1200, f1: 3200, q: 0.8, gain: 0.22, attack: 0.12, dest: d }); // (paper unrolled)
    [0.38, 0.46].forEach((s, i) => { this.noise(t + s, 0.01, { type: 'bandpass', f0: 3800, q: 5, gain: 0.3, dest: d }); this.tone(t + s, 0.06, { f0: hz(76 + i * 7), type: 'triangle', gain: 0.1, dest: d }); }); // (pinned)
  }

  // ---------------------------------------------------------------- the garage and the paint
  /** A part fitted to its `slot` (sail, keel, hull, mast, fin). */
  skiffPartFit(slot = 'sail') {
    if (!this.ok() || !this.allow('skiffPartFit', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.2, true);
    if (slot === 'sail') { this.noise(t, 0.09, { type: 'bandpass', f0: 1100, f1: 2200, q: 1, gain: 0.35, dest: d }); this.noise(t + 0.1, 0.05, { type: 'bandpass', f0: 1600, q: 1.5, gain: 0.25, dest: d }); } // (a cloth snap)
    else if (slot === 'keel') { this.noise(t, 0.02, { type: 'bandpass', f0: 2600, q: 4, gain: 0.3, dest: d }); this.tone(t + 0.06, 0.14, { f0: 170, f1: 95, type: 'triangle', gain: 0.4, dest: d }); } // (a clamp, a thunk)
    else if (slot === 'hull') { this.tone(t, 0.18, { f0: 240, f1: 200, type: 'triangle', gain: 0.35, dest: d }); this.tone(t + 0.09, 0.15, { f0: 250, f1: 205, type: 'triangle', gain: 0.25, dest: d }); } // (a hollow knock)
    else if (slot === 'mast') { for (let i = 0; i < 4; i++) this.noise(t + i * 0.045, 0.015, { type: 'bandpass', f0: 1800 + i * 300, q: 5, gain: 0.25, dest: d }); this.tone(t + 0.2, 0.08, { f0: 700, type: 'triangle', gain: 0.15, dest: d }); } // (the sections telescoping)
    else { this.noise(t, 0.08, { type: 'bandpass', f0: 900, f1: 2400, q: 2, gain: 0.25, dest: d }); this.tone(t + 0.09, 0.3, { f0: hz(88), type: 'triangle', gain: 0.12, dest: d }); } // (a fin: slid in, a ting)
  }
  /** A tune sheet slider moved a notch to `value` (-3 .. 3; 0 stock). Very quiet. */
  skiffTuneNotch(value = 0) {
    if (!this.ok() || !this.allow('skiffTuneNotch', 14)) return;
    const t = this.ctx.currentTime, d = this.out(0.12, 0, true), v = Math.max(-3, Math.min(3, value | 0));
    this.noise(t, 0.008, { type: 'bandpass', f0: 2600 + v * 260, q: 6, gain: 0.4, dest: d }); // (the ratchet's click)
    if (v === 0) this.tone(t, 0.05, { f0: hz(88), type: 'triangle', gain: 0.15, dest: d }); // (the stock notch's detent)
  }
  /** A setup kept (`how` 'save') or worn ('wear'). */
  skiffSetupKeep(how = 'save') {
    if (!this.ok() || !this.allow('skiffSetupKeep', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.2, true);
    if (how === 'wear') { for (let i = 0; i < 5; i++) this.noise(t + i * 0.04 + Math.random() * 0.01, 0.014, { type: 'bandpass', f0: 1500 + Math.random() * 1500, q: 4, gain: 0.22, dest: d }); [64, 68, 71].forEach((m) => this.tone(t + 0.24, 0.35, { f0: hz(m + 12), type: 'triangle', gain: 0.05, dest: d })); } // (the parts rattling in, a small chord)
    else { [0, 0.06].forEach((s) => this.noise(t + s, 0.01, { type: 'bandpass', f0: 3000, q: 5, gain: 0.3, dest: d })); this.tone(t + 0.14, 0.08, { f0: 520, f1: 380, type: 'triangle', gain: 0.25, dest: d }); } // (two clicks and a latch)
  }
  /** The skiff's paint changed: `kind` (dye, pattern, seal, trail, ribbon, pennant, length), a `price` paid in cubes. */
  skiffPaintDye(kind = 'dye', price = 0) {
    if (!this.ok() || !this.allow('skiffPaintDye', 4)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.25, true);
    if (kind === 'dye') this.noise(t, 0.3, { type: 'bandpass', f0: 700, f1: 1800, q: 1.2, gain: 0.3, attack: 0.08, dest: d }); // (a wet brush)
    else if (kind === 'pattern') for (let i = 0; i < 3; i++) this.noise(t + i * 0.07, 0.04, { type: 'lowpass', f0: 1200, gain: 0.3, dest: d }); // (a stencil's daubs)
    else if (kind === 'seal') { this.tone(t, 0.1, { f0: 140, f1: 80, type: 'triangle', gain: 0.4, dest: d }); this.noise(t, 0.04, { type: 'lowpass', f0: 1400, gain: 0.25, dest: d }); } // (a stamp)
    else if (kind === 'trail' || kind === 'ribbon') { this.noise(t, 0.4, { type: 'bandpass', f0: 1500, f1: 5000, q: 2, gain: 0.2, attack: 0.15, dest: d }); this.tone(t + 0.1, 0.3, { f0: hz(83), gain: 0.06, dest: d }); } // (a shimmering whoosh)
    else for (let i = 0; i < 3; i++) this.noise(t + i * 0.06, 0.05, { type: 'bandpass', f0: 900 + i * 200, q: 1.2, gain: 0.25, dest: d }); // (cloth flapping: the pennant)
    if (price > 0) this.tone(t + 0.3, 0.15, { f0: hz(95), type: 'triangle', gain: 0.12, dest: d }); // (a cube's clink)
  }

  // ---------------------------------------------------------------- the race's still moments
  /** After a race: the nemesis `beaten` (the grudge settled), or a rival marking you. Laid after the finish's own sounds. */
  raceNemesis(beaten = false, grid = null) {
    if (!this.ok() || !this.allow('raceNemesis', 1)) return;
    const t = Math.max(this.ctx.currentTime + 1.1, onGrid(this, grid)), r = 64 + keyOf(grid), d = this.out(0.3, 0.45);
    if (beaten) { this.tone(t, 0.3, { f0: hz(r), type: 'triangle', gain: 0.12, dest: d }); this.tone(t + 0.12, 0.7, { f0: hz(r + 7), type: 'triangle', gain: 0.12, dest: d }); this.noise(t + 0.12, 0.03, { type: 'bandpass', f0: 1800, q: 2, gain: 0.4, dest: d }); } // (a fifth rising, a clean clap)
    else { [0, 1].forEach((s, i) => this.tone(t + i * 0.32, 0.45, { f0: hz(r - 24 + s), type: 'sawtooth', gain: 0.05, dest: d })); this.noise(t + 0.75, 0.03, { type: 'bandpass', f0: 1500, q: 2, gain: 0.15, dest: this.out(0.2, 0.9) }); } // (two notes a semitone apart; one clap far off)
  }
  /** The escape's maw close behind (its chase layer is the cue's). */
  escapeNear() {
    if (!this.ok() || !this.allow('escapeNear', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.4, 0.3);
    [0, 0.18].forEach((s, i) => this.tone(t + s, 0.16, { f0: i ? 60 : 72, f1: 40, gain: 0.55, dest: d })); // (a heartbeat's double thump)
    this.noise(t, 0.9, { type: 'bandpass', f0: 400, f1: 1600, q: 0.8, gain: 0.25, attack: 0.5, dest: d }); // (the sand hissing behind)
  }
  /** A rival over the line, far off. */
  raceRivalFinish() {
    if (!this.ok() || !this.allow('raceRivalFinish', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.8);
    [0, 0.1].forEach((s) => this.noise(t + s, 0.025, { type: 'bandpass', f0: 1500, q: 2, gain: 0.4, dest: d })); // (two claps)
    this.tone(t + 0.22, 0.3, { f0: hz(59), f1: hz(58.6), type: 'square', gain: 0.04, dest: d }); // (a short horn)
  }
  /** The board set down on the line; silent if race.back rewound it just now (its own sound is the set back). */
  raceRespawnSet() {
    if (!this.ok()) return;
    setTimeout(() => {
      const back = this.limits.get('raceBack'); if (back !== undefined && performance.now() - back < 200) return;
      if (!this.ok() || !this.allow('raceRespawnSet', 2)) return;
      const t = this.ctx.currentTime, d = this.out(0.22, 0.25);
      this.noise(t, 0.2, { type: 'lowpass', f0: 1400, f1: 300, gain: 0.35, dest: d }); this.tone(t, 0.08, { f0: 120, f1: 70, gain: 0.3, dest: d }); // (a puff of sand)
      this.tone(t + 0.04, 0.12, { f0: hz(88), type: 'triangle', gain: 0.08, dest: d }); // (a glassy tick)
    }, 40);
  }
  /** The antlion takes the board: sand down the cone, its jaws, a gulp. */
  racewayPitSnap() {
    if (!this.ok() || !this.allow('racewayPitSnap', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.42, 0.35);
    this.noise(t, 0.7, { type: 'bandpass', f0: 2400, f1: 500, q: 0.8, gain: 0.35, dest: d }); // (sand pouring down the cone)
    [0.12, 0.26].forEach((s) => { this.noise(t + s, 0.02, { type: 'bandpass', f0: 2200, q: 3, gain: 0.5, dest: d }); this.tone(t + s, 0.05, { f0: 420, f1: 260, type: 'triangle', gain: 0.2, dest: d }); }); // (the jaws clacking twice)
    this.tone(t + 0.4, 0.35, { f0: 160, f1: 55, gain: 0.45, dest: d }); // (a gulp)
  }
  /** A siphon's arch drinking the pool: `took` its Lachryma (0: nothing to drink). */
  skiffSiphonDrink(took = 0) {
    if (!this.ok() || !this.allow('skiffSiphonDrink', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.4), len = took > 0 ? Math.max(0.4, Math.min(1.4, 0.3 + took / 60)) : 0.25;
    if (took <= 0) { this.noise(t, len, { type: 'bandpass', f0: 600, f1: 1400, q: 3, gain: 0.15, dest: d }); return; } // (a dry suck)
    this.riser(t, len, { f0: 180, f1: 900, type: 'triangle', gain: 0.1, dest: d }); this.riser(t, len, { f0: 185, f1: 940, type: 'sine', gain: 0.07, dest: d }); // (the vortex's rising whirl)
    this.noise(t, len, { type: 'bandpass', f0: 500, f1: 2500, q: 4, gain: 0.25, attack: len * 0.6, dest: d });
    this.tone(t + len, 0.15, { f0: 300, f1: 120, gain: 0.2, dest: d }); // (the last of it gone up)
  }

  // ---------------------------------------------------------------- cups and the City Trial
  /** A cup begun (`cup` 'clay' | 'sibling'). */
  cupStart(cup = 'clay', grid = null) {
    if (!this.ok() || !this.allow('cupStart', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.5, true), r = 64 + keyOf(grid);
    for (let i = 0; i < 10; i++) this.tone(t + i * 0.035, 0.08, { f0: 95, f1: 75, gain: 0.12 + i * 0.02, dest: d }); // (a drum roll)
    const at = t + 0.4, call = cup === 'sibling' ? [0, 5, 9, 12, 17] : [0, 5, 12];
    call.forEach((s, i) => this.tone(at + i * 0.11, 0.45 + (i === call.length - 1 ? 0.5 : 0), { f0: hz(r - 5 + s), type: 'triangle', gain: 0.1, dest: d })); // (a call up the fourth; the Sibling Cup's five voices)
  }
  /** A cup called off. */
  cupEnd() {
    if (!this.ok() || !this.allow('cupEnd', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.3, true);
    [71, 64].forEach((m, i) => this.tone(t + i * 0.2, 0.3, { f0: hz(m), f1: hz(m - 0.5), type: 'triangle', gain: 0.1, dest: d })); // (two notes falling, muted)
  }
  /** The City Trial over: `why` 'finish' (the stadium's gong, after the finish's own sounds) or called off (a horn falling). */
  cityTrialEnd(why = 'left') {
    if (!this.ok() || !this.allow('cityTrialEnd', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.7);
    if (why === 'finish') { const at = t + 0.9; [1, 2.76, 5.4].forEach((m, i) => this.tone(at, 2.4 - i * 0.6, { f0: 98 * m, f1: 96 * m, gain: 0.18 / (i + 1), dest: d })); this.noise(at, 0.06, { type: 'lowpass', f0: 1200, gain: 0.25, dest: d }); }
    else this.tone(t, 0.8, { f0: hz(64), f1: hz(57), type: 'square', gain: 0.04, dest: d }); // (a horn falling)
  }
}
