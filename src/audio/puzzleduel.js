// A sound bank of the one mixer (audio/sfx.js): a puzzle duel (docs/plans/PUZZLE-DUELS.md, its engine progress/duel/, Dovina's): the
// settle's events heard one by one as the view plays them (duel.js returns them in order; the view calls `duelEvent(e)` with each as it
// animates it, so the sound keeps the view's pace). Side 0 sounds left of centre and bright; side 1 (the aberrant) right and darker.
//   CHAIN   'chain' { side, step }: a note a step up the pentatonic (C, E, G, A, C...), the chord thickening as it climbs (a fifth from
//           step 3, the octave and a shimmer from 5); the foe's a square wave an octave down
//   LINE    'line' { line } (the boundary slid a column toward whoever took the garbage): a stone block dragged a beat, a thud, panned to
//           where the line now stands
//   CLEAR   'clear' { colour, side }: a glassy pop, its pitch the gem's feeling as a step of the duel's key (the cue's root), so clears
//           of different feelings chord; a limit a feeling and one for all; ducked under a chain step that lands with it (deeper the
//           higher the step), so the step is the line heard and a cascade is a climb, not a pile. 'chain' { weak } (a weak colour's hit) a brighter edge on its step
//   BEATS   'allclear' (the key's chord blooming up), 'refund' (an action point back: a coin's two notes), 'turn' (a woodblock, high
//           yours, low the foe's), 'ember.cool' (a hiss and a glassy note), 'hint' (the idle hint: a breath of the fifth, once in 10 s)
//   and the rest: fall (a soft patter), break (junk cracking: clay), blast (a bomb), pinch (junk turned to a gem: a clay crack resolving
//   up into glass), land (garbage arriving: a heavy fall, by count), offset (incoming garbage cancelled: two tones meeting and cancelling),
//   send (garbage thrown: a whoosh), and the duel's end (duel.line, duel.full, duel.cap)
// THE FIGHT UNDER THE PUZZLE (PUZZLE-DUELS.md 11):
//   BREAK   'duelBreak' { depth } (the Figment broken: by a critical push or its EmO full): the stun's own sting at that depth
//           (damage.js stunSting: the same three, the same rise) over a glaze shell bursting; 'duelBreak.end', it comes to: a shake and a lift
//   ORBS    'orb' a shower: glints falling; 'orb.drink' as the Courier runs them up: Sonic's ring, a step higher each one drunk in a
//           run (back to the bottom after a beat's quiet); 'orb.fade' a missed one: a soft falling breath
//   FINISHER  'duel.finisher' { depth }: the god hand's finish, the data drain: a suction swell, the foe's data chirping down into it, a
//           closing chord
//   TOOLS   the Courier's moves on the board, each its tool's own sound in small: run (quick steps), kick (a boot's thud), shot (the
//           psygun), grab (the Sondelass's grapnel: thrown, bitten, drawn), drill (the Dreamvane's pick), paint (the Soul Brush), delay
//           (the Crucibelle's toll), hold and hold.send (the Lockheart's coffin drawing in and flung)
//   FLEE    'flee' { roll, ok } (a saving throw to escape, flee.js): a d20 thrown, rattling, landing; then what it says: a 20 a crit's
//           bright run and a crown of bells, a 1 a dull clunk sagging down a tritone, a pass a light lift, a miss a soft drop;
//           'duel.fled' the escape: a rush away
//   FOE     the PvE duel's aberrant (PUZZLE-DUELS.md 23), from the right and below the key: 'foe.skill' { skill, n } (hurl a heave and
//           a throw crossing to you, petrify gems' notes falling into knocks, seal a chain and a bolt, sap a chord bent down, reclaim a tug
//           and a falling fifth); played at its cut-in's start: the sting first (audio/duelcasts.js), the skill's sound CUT_IN.gesture after the slam; 'foe.desperate' the limit break's sting; 'foe.stagger' a gong wobbling; a countdown's last tick ('foe.soon',
//           at the foe turn's end, one a turn whatever the count) a tick-tock and a low bell; 'line' { side } a column won (rising) or lost (falling)
//   SKILLS  the one-gesture duel's (PUZZLE-DUELS.md 22): 'skill' { tool } a swell diving into the board with the tool's voice on top;
//           'charge' { ready } a skill full: a chime up to the octave (the foe's lower, quieter); 'blast' { rows } Shot's rows swept from
//           the outer edge to the Line; 'vein' { colour } its note rippling down the octaves; 'recolour' Paint's stroke; 'tune' { colour }
//           the colour's bell struck, 'tune.end' damped; 'read' a page turned, two coins and the fog lifting
//   PULL    nearness opening a duel (PUZZLE-DUELS.md 16.3; world/duel/duelfoes.js `pull` 0..1, read each 50 ms): a held throb under the
//           Courier, a heartbeat quickening as the pull fills, and a pair of detuned tones closing in on each other a fifth higher (the
//           aberrant's data bug heard: two notes almost one); on the loop bus, so a menu hushes it. duel.slip lets it go with a falling
//           breath; duel.open (the pull full, the duel begun) snaps it shut on a caught-frame crack and a low boom
// The duel's view (vfx/duelview/beats.js, Calissa's) calls duelEvent with each event as it plays it.
// Prior art: Puyo Puyo's chain voices (each step a higher call: the step is heard before it is counted), Tetris Effect's notes on the
// key, Puzzle Fighter's gem shatter and counter-gem thud, Meteos's launch.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PENTA = [0, 4, 7, 9];
const chainNote = (step, root = 72) => root + PENTA[(step - 1) % 4] + 12 * Math.floor((step - 1) / 4); // (C5 E5 G5 A5 C6 ... from the duel's root)
// a gem's feeling as a step of the duel's key (major pentatonic over the cue's root), so clears of different feelings chord: the
// Lantern Wisp's four (wonder, mirth, desire, fury) a 6/9 chord; the rest above it. The board's colours are feelings (duel/board.js).
const FEELING_STEP = { wonder: 0, mirth: 4, desire: 7, fury: 9, gall: 14, grief: 16, dread: 19 };
/** The duel's root: the cue's own key when one plays (sfx.musicGrid, audio/cues.js hearEvents), else C5; kept within C5 .. B5. */
export function duelRoot(s) { const r = s.musicGrid?.()?.root; return r == null ? 72 : 72 + ((((r - 72) % 12) + 12) % 12); }
/** gesture: real s after a cut-in's slam the skill's own sound plays: when its cast begins, the cut-in over (Calissa's vfx/duelview/cutin.js CUT_IN: in 0.14, held 0.62, out 0.16, slam at 0.12). */
export const CUT_IN = { gesture: 0.8 };
const sidePan = (side) => (side === 1 ? 0.45 : side === 0 ? -0.45 : 0);

export class PuzzleDuelSounds {
  /** A bus panned to a side (or a pan of -1..1). */
  duelOut(gain, verb, pan = 0) {
    const d = this.out(gain, verb, true);
    if (!pan) return d;
    const p = this.ctx.createStereoPanner(); p.pan.value = pan; p.connect(d); return p;
  }
  /** One of the engine's events, as the view plays it. */
  duelEvent(e = {}) {
    switch (e.type) {
      case 'chain': return this.duelChain(e.step, e.side, !!e.weak);
      case 'line': return this.duelLine(e.line, e.w, e.side);
      case 'clear': return this.duelClear(e.colour, e.side);
      case 'allclear': return this.duelAllClear(e.side);
      case 'refund': return this.duelRefund(e.side);
      case 'turn': return this.duelTurn(e.side);
      case 'foe.skill': { const at = this.duelCutIn?.(e.skill) ?? 0; setTimeout(() => this.duelFoeSkill(e.skill, e.n), (at + CUT_IN.gesture) * 1000); return; } // (the view plays it at its cut-in's start: the sting, then the skill's own sound as its cast begins after the cut-in, audio/duelcasts.js)
      case 'foe.desperate': return this.duelCutIn?.('desperate'); // (the limit break's cut-in)
      case 'power': return this.duelPower?.(e.domain, e); // (a duel power cast: audio/duelcasts.js)
      case 'foe.soon': return this.duelFoeLastTick(); // (a foe skill on its last count, told in the foe's turn: it fires on its next)
      case 'foe.stagger': return this.duelFoeStagger();
      case 'ember.cool': return this.duelEmberCool();
      case 'hint': return this.duelHint();
      case 'fall': return this.duelFall();
      case 'break': return this.duelJunkBreak();
      case 'duelBreak': return this.duelFigmentBreak(e.depth);
      case 'duelBreak.end': return this.duelFigmentBreakEnd();
      case 'orb': return this.duelOrb();
      case 'orb.drink': return this.duelOrbDrink();
      case 'orb.fade': return this.duelOrbFade();
      case 'flee': return this.duelFlee(e.roll, e.ok);
      case 'duel.fled': return this.duelFled();
      case 'duel.finisher': return this.duelFinisher(e.depth);
      case 'run': case 'kick': case 'shot': case 'grab': case 'drill': case 'paint': case 'delay': case 'hold': case 'hold.send': return this.duelTool(e.type, e);
      case 'blast': return e.rows ? this.duelShotRows(e.side) : this.duelBlast();
      case 'skill': return this.duelSkill(e.tool, e.side);
      case 'charge': return e.ready ? this.duelReady(e.tool, e.side) : null;
      case 'vein': return this.duelVein(e.colour, e.side);
      case 'recolour': return this.duelRecolour(e.side);
      case 'tune': return this.duelTune(e.colour, e.side);
      case 'tune.end': return this.duelTuneEnd(e.side);
      case 'read': return this.duelRead(e.side);
      case 'pinch': return this.duelPinch(e.colour);
      case 'land': return this.duelLand(e.n, e.side);
      case 'offset': return this.duelOffset(e.n, e.side);
      case 'send': return this.duelSend(e.n, e.side);
      case 'duel.line': case 'duel.full': case 'duel.cap': return this.duelEnd(e.winner);
      default: return null;
    }
  }
  /** A chain's step: a note higher each, fuller as it climbs. */
  duelChain(step = 1, side = 0, weak = false) {
    if (!this.ok() || !this.allow('duelChain', 12)) return;
    const n = Math.max(1, step | 0), foe = side === 1, t = this.ctx.currentTime; this._duelStep = { t, n };
    const d = this.duelOut(0.32 + 0.045 * Math.min(8, n), 0.35 + 0.05 * Math.min(6, n), sidePan(side));
    const m = chainNote(n, duelRoot(this)) - (foe ? 12 : 0), type = foe ? 'square' : 'triangle', g = foe ? 0.05 : 0.11;
    if (weak && !foe) { this.tone(t, 0.22, { f0: hz(m + 12), type: 'sawtooth', gain: 0.025, dest: d }); this.noise(t, 0.05, { type: 'highpass', f0: 6000, gain: 0.12, dest: d }); } // (a weak colour's hit: a brighter edge)
    this.tone(t, 0.3, { f0: hz(m - 0.5), f1: hz(m), type, gain: g, dest: d }); // (a little scoop up into the note)
    if (n >= 3) this.tone(t + 0.02, 0.3, { f0: hz(m + 7), type, gain: g * 0.5, dest: d });
    if (n >= 5) { this.tone(t + 0.04, 0.45, { f0: hz(m + 12), gain: g * 0.4, dest: d }); for (let k = 0; k < 4; k++) this.tone(t + 0.05 + k * 0.03, 0.2, { f0: hz(m + 24 + PENTA[k]), gain: 0.012, dest: d }); }
  }
  /** The line pushed a column: a stone dragged and set down, panned to where it now stands (of w columns). */
  duelLine(line = 10, w = 20, side = null) {
    if (!this.ok() || !this.allow('duelLine', 4)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.4, 0.3, Math.max(-0.8, Math.min(0.8, (line / Math.max(1, w)) * 2 - 1)));
    this.noise(t, 0.22, { type: 'bandpass', f0: 350, f1: 220, q: 1.5, gain: 0.3, attack: 0.04, dest: d });
    this.tone(t + 0.22, 0.25, { f0: 90, f1: 50, gain: 0.45, dest: d }); this.noise(t + 0.22, 0.06, { type: 'lowpass', f0: 900, gain: 0.25, dest: d });
    if (side == null) return;
    const r = duelRoot(this); // (the battle of wills, PUZZLE-DUELS.md 23: `side` is whose push moved it)
    if (side === 0) [0, 7, 12].forEach((st, k) => this.tone(t + 0.24 + k * 0.07, 0.4, { f0: hz(r + st), type: 'triangle', gain: 0.06, dest: d })); // (a column won: the key's fifth and octave rising, bright)
    else [12, 8, 3].forEach((st, k) => this.tone(t + 0.24 + k * 0.1, 0.5, { f0: hz(r - 12 + st), type: 'square', gain: 0.03, dest: d })); // (a column lost: a minor fall, dark, low)
  }
  /** A gem cleared: a glassy pop at its colour's note. */
  duelClear(colour, side = 0) {
    if (!this.ok() || !this.allow(`duelClear.${colour}`, 10) || !this.allow('duelClearAll', 28)) return; // (a limit a feeling: three colours at once are a chord, not one pop; and all of them, so a board-wide cascade cannot pile)
    queueMicrotask(() => this.duelClearNow(colour, side)); // (after the phase's other events: its chain step comes after its clears, and the duck needs to know it)
  }
  duelClearNow(colour, side = 0) {
    const t = this.ctx.currentTime, st = this._duelStep, under = st && st.n >= 2 && t - st.t < 0.15 ? Math.max(0.3, 0.8 - 0.08 * st.n) : 1; // (the duck: a cascade's clears tucked under its step, more the higher it climbs; a plain match stays bright)
    const d = this.duelOut(0.22 * under, 0.3, sidePan(side) * 0.5), m = duelRoot(this) + 12 + (FEELING_STEP[colour] ?? 0) - (side === 1 ? 12 : 0);
    this.noise(t, 0.02, { type: 'bandpass', f0: 5000, q: 2, gain: 0.15, dest: d });
    [1, 2.76].forEach((r, j) => this.tone(t, 0.18, { f0: hz(m) * r, gain: j ? 0.01 : 0.04, dest: d }));
  }
  /** Your half cleared of gems (`allclear`): the key's chord blooming up in a run and held, bright. */
  duelAllClear(side = 0) {
    if (!this.ok() || !this.allow('duelAllClear', 1)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.36, 0.6, sidePan(side) * 0.4), r = duelRoot(this) - (side === 1 ? 12 : 0);
    [0, 4, 7, 12, 16, 19, 24].forEach((st, k) => this.tone(t + k * 0.05, 0.9 - k * 0.06, { f0: hz(r + st), type: 'triangle', gain: 0.07, dest: d }));
    this.tone(t + 0.35, 1.4, { f0: hz(r), gain: 0.06, dest: d }); this.tone(t + 0.35, 1.4, { f0: hz(r + 7), gain: 0.04, dest: d });
  }
  /** An action point given back for a big play: two quick notes up, a coin dropped in a slot. */
  duelRefund(side = 0) {
    if (!this.ok() || !this.allow('duelRefund', 3)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.26, 0.2, sidePan(side) * 0.5), r = duelRoot(this) + 12;
    this.tone(t, 0.08, { f0: hz(r + 7), type: 'square', gain: 0.04, dest: d }); this.tone(t + 0.07, 0.25, { f0: hz(r + 12), type: 'square', gain: 0.045, dest: d });
  }
  /** The turn passed: a soft woodblock, high for yours, low for the foe's. */
  duelTurn(side = 0) {
    if (!this.ok() || !this.allow('duelTurn', 3)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.2, 0.15, sidePan(side) * 0.6);
    this.tone(t, 0.05, { f0: side === 1 ? 420 : 760, f1: side === 1 ? 380 : 700, type: 'triangle', gain: 0.25, dest: d }); this.noise(t, 0.015, { type: 'bandpass', f0: side === 1 ? 900 : 1800, q: 4, gain: 0.1, dest: d });
  }
  /** A foe skill's countdown on its last tick: a clock's tick-tock and a low bell a tritone off the key, so the ear knows before the eye. */
  duelFoeLastTick() {
    if (!this.ok() || !this.allow('duelFoeLastTick', 1)) return;
    const t = this.ctx.currentTime + 0.12, d = this.duelOut(0.3, 0.4, 0.45), r = duelRoot(this) - 24;
    [0, 0.28].forEach((dt, k) => this.noise(t + dt, 0.02, { type: 'bandpass', f0: k ? 1700 : 2300, q: 8, gain: 0.35, dest: d }));
    [1, 2.4, 3.9].forEach((q, j) => this.tone(t + 0.56, 1.4, { f0: hz(r + 6) * q, gain: [0.09, 0.03, 0.015][j], dest: d }));
  }
  /** The aberrant's foe skills (PvE, PUZZLE-DUELS.md 23), from its side (right) and below the key: each its own gesture. */
  duelFoeSkill(skill = '', n = 1) {
    if (!this.ok() || !this.allow(`duelFoe.${skill}`, 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut({ hurl: 1, sap: 1, petrify: 0.65 }[skill] ?? 0.4, 0.45, 0.45), r = duelRoot(this) - 24; // (levelled by ear and meter: each within about 6 dB of the others)
    switch (skill) {
      case 'hurl': { // (a heave, then the throw crossing to your half, clay clattering in the air: what lands lands later)
        this.tone(t, 0.3, { f0: 70, f1: 110, type: 'sawtooth', gain: 0.06, dest: d });
        const c = this.ctx, p = c.createStereoPanner(); p.pan.setValueAtTime(0.6, t + 0.25); p.pan.linearRampToValueAtTime(-0.6, t + 0.75); p.connect(d);
        this.noise(t + 0.25, 0.5, { type: 'bandpass', f0: 500, f1: 2400, q: 0.8, gain: 0.3, attack: 0.1, dest: p });
        for (let k = 0; k < Math.min(6, Math.max(1, n | 0)); k++) this.noise(t + 0.35 + k * 0.06, 0.03, { type: 'bandpass', f0: 1400 + (k % 3) * 300, q: 3, gain: 0.18, dest: p });
        setTimeout(() => p.disconnect(), 1800); break; }
      case 'petrify': // (stone creeping over glass: each gem's note falling into a dull knock)
        this.noise(t, 0.6, { type: 'bandpass', f0: 2200, f1: 300, q: 1.2, gain: 0.18, attack: 0.05, dest: d });
        for (let k = 0; k < Math.min(5, Math.max(1, n | 0)); k++) { const at = t + 0.1 + k * 0.09; this.tone(at, 0.08, { f0: hz(r + 36 + PENTA[k % 4]), f1: hz(r + 24), gain: 0.04, dest: d }); this.tone(at + 0.07, 0.08, { f0: 180, f1: 110, type: 'triangle', gain: 0.18, dest: d }); }
        break;
      case 'seal': // (a heavy lock: a chain drawn across, the bolt shot home)
        for (let k = 0; k < 7; k++) this.noise(t + k * 0.035, 0.02, { type: 'bandpass', f0: 2800 + (k % 2) * 500, q: 6, gain: 0.16, dest: d });
        this.tone(t + 0.3, 0.2, { f0: 120, f1: 70, gain: 0.5, dest: d }); this.noise(t + 0.3, 0.05, { type: 'bandpass', f0: 1100, q: 2, gain: 0.35, dest: d });
        break;
      case 'sap': // (your skills drained: a bright chord bent down and out, a suck of air)
        [0, 7, 12].forEach((st) => this.tone(t, 0.9, { f0: hz(r + 36 + st), f1: hz(r + 24 + st), gain: 0.035, dest: d }));
        this.noise(t, 0.8, { type: 'bandpass', f0: 3000, f1: 400, q: 1, gain: 0.12, attack: 0.3, dest: d });
        break;
      case 'reclaim': // (the Line hauled back: a deep tug and a falling fifth)
        this.noise(t, 0.35, { type: 'lowpass', f0: 600, f1: 200, gain: 0.35, attack: 0.15, dest: d });
        this.tone(t + 0.1, 0.6, { f0: hz(r + 7), f1: hz(r), type: 'sawtooth', gain: 0.06, dest: d }); this.tone(t + 0.35, 0.4, { f0: 80, f1: 45, gain: 0.5, dest: d });
        break;
      default: this.tone(t, 0.4, { f0: hz(r + 6), f1: hz(r), type: 'square', gain: 0.05, dest: d });
    }
  }
  /** It reels from your big play (`foe.stagger`): a struck gong wobbling out of tune and back. */
  duelFoeStagger() {
    if (!this.ok() || !this.allow('duelFoeStagger', 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.5, 0.55, 0.45), r = duelRoot(this) - 12;
    this.tone(t, 0.9, { f0: hz(r), f1: hz(r) * 0.94, gain: 0.08, dest: d }); this.tone(t, 0.9, { f0: hz(r) * 1.5, f1: hz(r) * 1.42, gain: 0.04, dest: d });
    this.noise(t, 0.05, { type: 'lowpass', f0: 1500, gain: 0.3, dest: d });
  }
  /** An ember cooled into its gem: the coal's hiss, then a glassy note as it sets. */
  duelEmberCool() {
    if (!this.ok() || !this.allow('duelEmberCool', 4)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.22, 0.35);
    this.noise(t, 0.4, { type: 'highpass', f0: 3500, f1: 6000, gain: 0.08, attack: 0.02, dest: d });
    this.tone(t + 0.35, 0.5, { f0: hz(duelRoot(this) + 19), gain: 0.04, dest: d });
  }
  /** The idle hint glowing: a breath of the key's fifth, barely there, never insistent. */
  duelHint() {
    if (!this.ok() || !this.allow('duelHint', 0.1)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.12, 0.6);
    this.riser(t, 0.6, { f0: hz(duelRoot(this) + 7) * 0.99, f1: hz(duelRoot(this) + 7), type: 'sine', gain: 0.03, dest: d });
  }
  /** A skill fired (the one-gesture duel, PUZZLE-DUELS.md 22): the Courier diving into the board, a swell up into it, and on its
   *  top the worn tool's own voice in small (the psygun's crack, the dowser's ring, the brush's sweep, the grapnel's bite, the bell,
   *  the coffin's lid, the book's pages). The skill's own effect (a blast, a vein, a paint) follows as its own event. */
  duelSkill(tool = '', side = 0) {
    if (!this.ok() || !this.allow('duelSkill', 3)) return;
    const t = this.ctx.currentTime, foe = side === 1, d = this.duelOut(foe ? 0.26 : 0.4, 0.45, sidePan(side) * 0.5), r = duelRoot(this) - (foe ? 12 : 0), top = t + 0.22;
    this.riser(t, 0.22, { f0: hz(r - 12), f1: hz(r + 12), type: 'sawtooth', gain: 0.035, dest: d }); this.noise(t, 0.24, { type: 'bandpass', f0: 600, f1: 3200, q: 0.8, gain: 0.14, attack: 0.15, dest: d }); // (the dive: a swell up into the board)
    switch (tool) {
      case 'psygun': this.noise(top, 0.03, { type: 'highpass', f0: 3000, gain: 0.4, dest: d }); this.tone(top, 0.18, { f0: 170, f1: 50, gain: 0.4, dest: d }); break;
      case 'dreamvane': [0, 7, 12].forEach((st, k) => this.tone(top + k * 0.04, 0.7, { f0: hz(r + 12 + st), gain: 0.04, dest: d })); break; // (the fork struck: its ring)
      case 'soulbrush': this.noise(top, 0.3, { type: 'bandpass', f0: 600, f1: 1800, q: 1, gain: 0.22, attack: 0.04, dest: d }); break;
      case 'sondelass': this.noise(top, 0.12, { type: 'bandpass', f0: 1500, f1: 3800, q: 2, gain: 0.16, dest: d }); this.noise(top + 0.12, 0.015, { type: 'bandpass', f0: 4200, q: 8, gain: 0.5, dest: d }); break;
      case 'crucibelle': [1, 2.4, 3.9].forEach((q, j) => this.tone(top, 1.3, { f0: hz(r) * q, gain: [0.1, 0.035, 0.018][j], dest: d })); break;
      case 'lockheart': this.tone(top, 0.12, { f0: 130, f1: 70, gain: 0.4, dest: d }); this.noise(top, 0.05, { type: 'bandpass', f0: 2200, q: 4, gain: 0.3, dest: d }); break; // (the lid thrown open)
      case 'veritome': for (let k = 0; k < 4; k++) this.noise(top + k * 0.05, 0.05, { type: 'bandpass', f0: 2600 + k * 300, q: 1.5, gain: 0.12, dest: d }); break; // (pages riffled)
      default: this.tone(top, 0.3, { f0: hz(r + 12), type: 'triangle', gain: 0.08, dest: d });
    }
  }
  /** A skill full (`charge` ready): a chime in the key, two notes up to the octave, so the ear knows the button is live before the eye
   *  looks; the foe's an octave down and quieter (its skill is coming). */
  duelReady(tool = '', side = 0) {
    if (!this.ok() || !this.allow(`duelReady.${tool}`, 1)) return;
    const t = this.ctx.currentTime, foe = side === 1, d = this.duelOut(foe ? 0.14 : 0.26, 0.6, sidePan(side) * 0.6), r = duelRoot(this) + (foe ? 0 : 12);
    this.tone(t, 0.5, { f0: hz(r + 7), gain: 0.05, dest: d }); this.tone(t + 0.09, 0.9, { f0: hz(r + 12), gain: 0.06, dest: d }); this.tone(t + 0.09, 0.9, { f0: hz(r + 12) * 2.76, gain: 0.008, dest: d });
  }
  /** Shot's three rows cleared (`blast` with rows): a beam swept across the half, not a bomb: a bright sweep over a low punch. */
  duelShotRows(side = 0) {
    if (!this.ok() || !this.allow('duelShotRows', 3)) return;
    const c = this.ctx, t = c.currentTime, d = this.duelOut(0.4, 0.35), p = c.createStereoPanner();
    p.pan.setValueAtTime(side === 1 ? 0.7 : -0.7, t); p.pan.linearRampToValueAtTime(side === 1 ? 0.05 : -0.05, t + 0.3); p.connect(d); // (swept from the outer edge to the Line)
    this.noise(t, 0.32, { type: 'bandpass', f0: 1200, f1: 5000, q: 2, gain: 0.3, dest: p }); this.tone(t, 0.3, { f0: 120, f1: 45, gain: 0.45, dest: d });
    setTimeout(() => p.disconnect(), 1500);
  }
  /** Vein: every gem of one feeling found at once, the dowser's run: its note rippling down through the octaves it sits in. */
  duelVein(colour, side = 0) {
    if (!this.ok() || !this.allow('duelVein', 3)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.32, 0.6, sidePan(side) * 0.4), m = duelRoot(this) + 24 + (FEELING_STEP[colour] ?? 0) - (side === 1 ? 12 : 0);
    for (let k = 0; k < 6; k++) this.tone(t + k * 0.045, 0.4, { f0: hz(m - [0, 5, 12, 17, 24, 29][k]), type: 'triangle', gain: 0.05, dest: d });
    this.noise(t, 0.4, { type: 'highpass', f0: 5000, f1: 2500, gain: 0.05, attack: 0.03, dest: d });
  }
  /** Paint's 3 x 3 taking one colour: a wet stroke, then the cells settling in one note. */
  duelRecolour(side = 0) {
    if (!this.ok() || !this.allow('duelRecolour', 3)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.24, 0.35, sidePan(side) * 0.5);
    this.noise(t, 0.25, { type: 'bandpass', f0: 800, f1: 1600, q: 1, gain: 0.15, attack: 0.03, dest: d }); this.tone(t + 0.2, 0.4, { f0: hz(duelRoot(this) + 12), gain: 0.035, dest: d });
  }
  /** Tune: the colour's note struck as the bell's (it clears at 3 now); and when it ends, the bell damped. */
  duelTune(colour, side = 0) {
    if (!this.ok() || !this.allow('duelTune', 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.3, 0.7, sidePan(side) * 0.4), m = duelRoot(this) + (FEELING_STEP[colour] ?? 0) - (side === 1 ? 12 : 0);
    [1, 2, 3.01].forEach((q, j) => this.tone(t, 1.6, { f0: hz(m) * q, gain: [0.08, 0.03, 0.015][j], dest: d }));
  }
  duelTuneEnd(side = 0) {
    if (!this.ok() || !this.allow('duelTuneEnd', 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.18, 0.2, sidePan(side) * 0.4);
    this.tone(t, 0.12, { f0: hz(duelRoot(this)), f1: hz(duelRoot(this)) * 0.98, gain: 0.05, dest: d }); this.noise(t, 0.05, { type: 'lowpass', f0: 800, gain: 0.1, dest: d });
  }
  /** Read: two action points back (two coins, as a refund) under a page turned, the fog lifting in a soft rising air. */
  duelRead(side = 0) {
    if (!this.ok() || !this.allow('duelRead', 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.24, 0.5, sidePan(side) * 0.5), r = duelRoot(this) + 12;
    this.noise(t, 0.12, { type: 'bandpass', f0: 2400, f1: 1600, q: 1.2, gain: 0.12, dest: d }); this.noise(t + 0.05, 0.9, { type: 'highpass', f0: 1500, f1: 6000, gain: 0.04, attack: 0.3, dest: d });
    [7, 12, 7, 12].forEach((st, k) => this.tone(t + 0.15 + k * 0.07, k % 2 ? 0.22 : 0.08, { f0: hz(r + st), type: 'square', gain: 0.035, dest: d }));
  }
  duelFall() {
    if (!this.ok() || !this.allow('duelFall', 10)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.15, 0.1);
    this.noise(t, 0.03, { type: 'bandpass', f0: 1100 + Math.random() * 600, q: 3, gain: 0.12, dest: d });
  }
  /** Junk broken: dry clay cracking. */
  duelJunkBreak() {
    if (!this.ok() || !this.allow('duelJunkBreak', 10)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.28, 0.15);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1800, q: 1.2, gain: 0.35, dest: d }); this.tone(t, 0.06, { f0: 260, f1: 160, type: 'triangle', gain: 0.12, dest: d });
  }
  duelBlast() {
    if (!this.ok() || !this.allow('duelBlast', 6)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.4, 0.4);
    this.tone(t, 0.4, { f0: 110, f1: 40, gain: 0.5, dest: d }); this.noise(t, 0.35, { type: 'lowpass', f0: 2500, f1: 300, gain: 0.4, dest: d });
  }
  /** Junk pinched into a gem: the crack, resolving up into glass. */
  duelPinch(colour) {
    if (!this.ok() || !this.allow('duelPinch', 8)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.28, 0.3), m = duelRoot(this) + 12 + (FEELING_STEP[colour] ?? 0);
    this.noise(t, 0.04, { type: 'bandpass', f0: 1600, q: 1.2, gain: 0.25, dest: d });
    this.tone(t + 0.04, 0.25, { f0: hz(m - 5), f1: hz(m), gain: 0.05, dest: d });
  }
  /** Garbage landing on a side: a heavy fall, more for more. */
  duelLand(n = 1, side = 0) {
    if (!this.ok() || !this.allow('duelLand', 4)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.4, 0.2, sidePan(side)), k = Math.min(6, Math.max(1, Math.ceil(n / 2)));
    for (let i = 0; i < k; i++) { this.tone(t + i * 0.05, 0.12, { f0: 120 - i * 6, f1: 60, gain: 0.3, dest: d }); this.noise(t + i * 0.05, 0.05, { type: 'lowpass', f0: 800, gain: 0.2, dest: d }); }
  }
  /** Incoming garbage cancelled: two tones meeting, beating, gone. */
  duelOffset(n = 1, side = 0) {
    if (!this.ok() || !this.allow('duelOffset', 4)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.3, 0.35, sidePan(side));
    this.tone(t, 0.3, { f0: 660, f1: 880, gain: 0.06, dest: d }); this.tone(t, 0.3, { f0: 1100, f1: 886, gain: 0.06, dest: d });
  }
  /** Garbage thrown at the other side: a whoosh across. */
  duelSend(n = 1, side = 0) {
    if (!this.ok() || !this.allow('duelSend', 4)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.3, 0.2);
    this.noise(t, 0.25, { type: 'bandpass', f0: 800, f1: 2400 + 100 * Math.min(10, n), q: 1.5, gain: 0.15, dest: d });
  }
  /** The duel decided: winner 0 (side 0), 1 (the aberrant), -1 a draw. */
  duelEnd(winner = 0) {
    if (!this.ok() || !this.allow('duelEnd', 1)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.4, 0.5);
    const notes = winner === 0 ? [72, 76, 79, 84] : winner === 1 ? [72, 70, 67, 63] : [72, 72];
    notes.forEach((m, k) => this.tone(t + k * 0.1, 0.5, { f0: hz(m), type: 'triangle', gain: 0.08, dest: d }));
  }

  /** The Figment broken a depth deeper: the stun's sting (one ear for one thing) and its glaze shell bursting. */
  duelFigmentBreak(depth = 1) {
    if (!this.ok() || !this.allow('duelFigmentBreak', 3)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.32, 0.3, sidePan(1));
    for (let i = 0; i < 6; i++) this.tone(t + i * 0.012, 0.08, { f0: 2800 + Math.random() * 2400, gain: 0.03, dest: d });
    this.noise(t, 0.08, { type: 'highpass', f0: 3000, gain: 0.2, dest: d });
    this.stunSting?.(depth);
  }
  /** The break's end: the Figment comes to (a shake, a lift). */
  duelFigmentBreakEnd() {
    if (!this.ok() || !this.allow('duelFigmentBreakEnd', 3)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.25, 0.25, sidePan(1));
    this.noise(t, 0.15, { type: 'bandpass', f0: 600, q: 3, gain: 0.12, dest: d });
    this.tone(t + 0.1, 0.25, { f0: hz(55), f1: hz(62), type: 'square', gain: 0.03, dest: d });
  }
  duelOrb() {
    if (!this.ok() || !this.allow('duelOrb', 6)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.18, 0.5, sidePan(0));
    for (let i = 0; i < 6; i++) this.tone(t + i * 0.04 + Math.random() * 0.02, 0.2, { f0: hz(96 + PENTA[i % 4] - 12 * (i % 2)), gain: 0.02, dest: d });
  }
  /** An orb drunk: Sonic's ring, a step higher each in a run. */
  duelOrbDrink() {
    if (!this.ok() || !this.allow('duelOrbDrink', 20)) return;
    const now = this.ctx.currentTime, d = this.duelOut(0.28, 0.3, sidePan(0));
    const wall = performance.now(); // (a run is measured in real time: the audio clock can run ahead of it)
    this._orbRun = wall - (this._orbAt ?? -1e9) < 600 ? (this._orbRun || 0) + 1 : 0; this._orbAt = wall;
    const m = chainNote(1 + Math.min(11, this._orbRun), duelRoot(this)) + 12;
    this.tone(now, 0.08, { f0: hz(m), type: 'square', gain: 0.025, dest: d }); this.tone(now + 0.06, 0.25, { f0: hz(m + 4), type: 'square', gain: 0.025, dest: d });
  }
  duelOrbFade() {
    if (!this.ok() || !this.allow('duelOrbFade', 6)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.15, 0.4, sidePan(0));
    this.tone(t, 0.4, { f0: hz(88), f1: hz(76), gain: 0.02, dest: d }); this.noise(t, 0.3, { type: 'bandpass', f0: 3000, f1: 1200, q: 2, gain: 0.03, dest: d });
  }
  /** The finisher: the data drain, the deeper the stun the longer the pull. */
  duelFinisher(depth = 1) {
    if (!this.ok() || !this.allow('duelFinisher', 1)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.42, 0.6), k = Math.max(1, Math.min(3, depth | 0)), pull = 0.6 + 0.2 * k;
    this.noise(t, pull, { type: 'bandpass', f0: 4000, f1: 200, q: 1, gain: 0.2, attack: pull * 0.8, dest: d });
    for (let i = 0; i < 10; i++) this.tone(t + (i / 10) * pull, 0.05, { f0: hz(96 - i * 3), type: 'square', gain: 0.025, dest: d }); // (the foe's data chirping down)
    this.tone(t + pull, 1.4, { f0: 55, f1: 40, gain: 0.35, dest: d });
    [60, 67, 72, 76].forEach((m) => this.tone(t + pull + 0.05, 1.6, { f0: hz(m), type: 'triangle', gain: 0.05, dest: d }));
  }
  /** A Courier's tool on the board, its own sound in small. */
  duelTool(kind, e = {}) {
    if (!this.ok() || !this.allow(`duelTool.${kind}`, 8)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.3, 0.25, sidePan(e.side ?? 0));
    switch (kind) {
      case 'run': for (let i = 0; i < Math.min(4, (e.path?.length ?? 2) - 1); i++) this.noise(t + i * 0.07, 0.03, { type: 'bandpass', f0: 900, q: 2, gain: 0.15, dest: d }); break;
      case 'kick': this.tone(t, 0.1, { f0: 140, f1: 70, gain: 0.35, dest: d }); this.noise(t, 0.04, { type: 'lowpass', f0: 1200, gain: 0.25, dest: d }); break;
      case 'shot': this.noise(t, 0.03, { type: 'highpass', f0: 3000, gain: 0.35, dest: d }); this.tone(t, 0.12, { f0: 160, f1: 50, gain: 0.35, dest: d }); break;
      case 'grab': this.noise(t, 0.15, { type: 'bandpass', f0: 1500, f1: 3500, q: 2, gain: 0.15, dest: d }); this.noise(t + 0.15, 0.015, { type: 'bandpass', f0: 4000, q: 8, gain: 0.5, dest: d });
        this.tone(t + 0.18, 0.2, { f0: 400, f1: 700, type: 'sawtooth', gain: 0.03, dest: d }); break;
      case 'drill': this.tone(t, 0.06, { f0: 1800, f1: 1200, type: 'triangle', gain: 0.1, dest: d }); this.noise(t, 0.05, { type: 'bandpass', f0: 2500, q: 2, gain: 0.25, dest: d }); break;
      case 'paint': this.noise(t, 0.2, { type: 'bandpass', f0: 700, f1: 1400, q: 1, gain: 0.15, attack: 0.03, dest: d }); break;
      case 'delay': [1, 2.4, 3.9].forEach((r, j) => this.tone(t, 1.2, { f0: 196 * r, gain: [0.12, 0.04, 0.02][j], dest: d })); break;
      case 'hold': this.noise(t, 0.2, { type: 'bandpass', f0: 2500, f1: 600, q: 2, gain: 0.15, dest: d }); break;
      case 'hold.send': this.noise(t, 0.12, { type: 'bandpass', f0: 600, f1: 1800, q: 1.5, gain: 0.2, dest: d }); this.tone(t + 0.12, 0.2, { f0: 110, f1: 55, gain: 0.35, dest: d }); break;
      default: break;
    }
  }

  /** The saving throw: the d20 rolled (its face 1..20) and whether it got away. */
  duelFlee(roll = 10, ok = false) {
    if (!this.ok() || !this.allow('duelFlee', 2)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.35, 0.3, sidePan(0));
    let x = 0; for (let i = 0, gap = 0.05; i < 9; i++, x += gap, gap *= 1.12) this.noise(t + x, 0.015, { type: 'bandpass', f0: 2200 + Math.random() * 1600, q: 5, gain: 0.35 - i * 0.025, dest: d }); // (the rattle)
    const land = t + x + 0.04;
    this.noise(land, 0.03, { type: 'bandpass', f0: 1400, q: 3, gain: 0.5, dest: d }); this.tone(land, 0.08, { f0: 330, f1: 260, type: 'triangle', gain: 0.12, dest: d });
    const at = land + 0.12;
    if (roll === 20) { [72, 76, 79, 84, 88].forEach((m, k) => this.tone(at + k * 0.06, 0.6, { f0: hz(m), type: 'triangle', gain: 0.08, dest: d }));
      [1, 2.76, 5.4].forEach((r, j) => this.tone(at + 0.3, 1.4, { f0: hz(96) * r, gain: [0.05, 0.02, 0.01][j], dest: d })); }
    else if (roll === 1) { this.tone(at, 0.3, { f0: 110, f1: 70, gain: 0.35, dest: d }); [60, 54].forEach((m, k) => this.tone(at + 0.1 + k * 0.25, 0.5, { f0: hz(m), f1: hz(m - 1), type: 'sawtooth', gain: 0.04, dest: d })); }
    else if (ok) [72, 79].forEach((m, k) => this.tone(at + k * 0.08, 0.35, { f0: hz(m), type: 'triangle', gain: 0.07, dest: d }));
    else [67, 62].forEach((m, k) => this.tone(at + k * 0.12, 0.35, { f0: hz(m), type: 'triangle', gain: 0.05, dest: d }));
  }
  /** Away: the duel left behind in a rush. */
  duelFled() {
    if (!this.ok() || !this.allow('duelFled', 1)) return;
    const t = this.ctx.currentTime + 0.9, d = this.duelOut(0.3, 0.3); // (after the roll's verdict)
    this.noise(t, 0.5, { type: 'bandpass', f0: 600, f1: 3000, q: 1.2, gain: 0.18, attack: 0.15, dest: d });
  }

  /** The pull begun: a held throb read from `read()` (0..1) every 50 ms until it ends (duelPullEnd) or reads 0 for a beat. */
  duelPullStart(read = () => 0) {
    if (this._pull || !this.ok()) return;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0.0001; g.connect(this.loopBus || this.out(1, 0.2));
    const sub = c.createOscillator(); sub.frequency.value = 55; const subG = c.createGain(); subG.gain.value = 0; sub.connect(subG).connect(g);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.value = 330; bp.connect(g);
    const a = c.createOscillator(), b = c.createOscillator(); a.type = b.type = 'sawtooth'; const ab = c.createGain(); ab.gain.value = 0; a.connect(ab); b.connect(ab); ab.connect(bp);
    sub.start(); a.start(); b.start();
    const P = this._pull = { g, sub, a, b, ab, subG, bp, next: c.currentTime, zero: 0 };
    P.timer = setInterval(() => {
      const k = Math.max(0, Math.min(1, read() || 0)), t = c.currentTime;
      P.zero = k > 0 ? 0 : P.zero + 1; if (P.zero > 6) { this.duelPullEnd(false); return; }
      g.gain.setTargetAtTime(0.35, t, 0.1);
      const f = 220 * Math.pow(2, k * 7 / 12); // (a fifth up over the fill)
      a.frequency.setTargetAtTime(f, t, 0.08); b.frequency.setTargetAtTime(f * Math.pow(2, (60 - 55 * k) / 1200), t, 0.08); // (the two close in: 60 cents apart to 5)
      bp.frequency.setTargetAtTime(f * 1.5, t, 0.1); ab.gain.setTargetAtTime(0.02 + 0.08 * k, t, 0.1);
      if (P.next < t) P.next = t; // (the heartbeat: lub-dub, faster as the pull fills, 0.9 s to 0.35 s a beat)
      while (P.next < t + 0.12) { const at = P.next; [0, 0.13].forEach((x, j) => { subG.gain.setValueAtTime(0, at + x); subG.gain.linearRampToValueAtTime(j ? 0.18 + 0.2 * k : 0.25 + 0.25 * k, at + x + 0.015); subG.gain.setTargetAtTime(0, at + x + 0.02, 0.05); }); P.next += 0.9 - 0.55 * k; }
    }, 50);
  }
  /** The pull ended: slipped away (a falling breath), or full and the duel open (snapped shut; duelOpen says the rest). */
  duelPullEnd(opened = false) {
    const P = this._pull; if (!P) return; this._pull = null; clearInterval(P.timer);
    const c = this.ctx, t = c.currentTime;
    P.g.gain.cancelScheduledValues(t); P.g.gain.setValueAtTime(P.g.gain.value, t); P.g.gain.setTargetAtTime(0.0001, t, opened ? 0.02 : 0.25);
    if (!opened) { P.a.frequency.setTargetAtTime(P.a.frequency.value * 0.7, t, 0.3); P.b.frequency.setTargetAtTime(P.b.frequency.value * 0.68, t, 0.3);
      if (this.ok()) { const d = this.duelOut(0.2, 0.3); this.noise(t, 0.6, { type: 'bandpass', f0: 1400, f1: 400, q: 1, gain: 0.08, attack: 0.1, dest: d }); } }
    setTimeout(() => { for (const o of [P.sub, P.a, P.b]) try { o.stop(); } catch { /* gone */ } P.g.disconnect(); }, 1600);
  }
  /** The duel open: the frame caught (a glitched crack) and the board set down (a low boom). */
  duelOpen() {
    if (!this.ok() || !this.allow('duelOpen', 1)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.42, 0.45);
    for (let i = 0; i < 5; i++) this.tone(t + i * 0.025, 0.02, { f0: 3000 - i * 400, type: 'square', gain: 0.04, dest: d });
    this.noise(t + 0.12, 0.25, { type: 'highpass', f0: 2500, gain: 0.25, dest: d });
    this.tone(t + 0.12, 1.2, { f0: 80, f1: 38, gain: 0.45, dest: d });
  }
}
