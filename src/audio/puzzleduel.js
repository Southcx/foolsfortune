// A sound bank of the one mixer (audio/sfx.js): a puzzle duel (docs/plans/PUZZLE-DUELS.md, its engine progress/duel/, Dovina's): the
// settle's events heard one by one as the view plays them (duel.js returns them in order; the view calls `duelEvent(e)` with each as it
// animates it, so the sound keeps the view's pace). Side 0 sounds left of centre and bright; side 1 (the aberrant) right and darker.
//   CHAIN   'chain' { side, step }: a note a step up the pentatonic (C, E, G, A, C...), the chord thickening as it climbs (a fifth from
//           step 3, the octave and a shimmer from 5); the foe's a square wave an octave down
//   LINE    'line' { line } (the boundary slid a column toward whoever took the garbage): a stone block dragged a beat, a thud, panned to
//           where the line now stands
//   CLEAR   'clear' { colour }: a glassy pop, its pitch by the gem's colour; a settle's many come as one shimmer (throttled)
//   and the rest: fall (a soft patter), break (junk cracking: clay), blast (a bomb), pinch (junk turned to a gem: a clay crack resolving
//   up into glass), land (garbage arriving: a heavy fall, by count), offset (incoming garbage cancelled: two tones meeting and cancelling),
//   send (garbage thrown: a whoosh), and the duel's end (duel.line, duel.full, duel.cap)
// No view or room yet (PUZZLE-DUELS.md 8): nothing calls these until one exists.
// Prior art: Puyo Puyo's chain voices (each step a higher call: the step is heard before it is counted), Tetris Effect's notes on the
// key, Puzzle Fighter's gem shatter and counter-gem thud, Meteos's launch.
// Every method runs on the Sfx itself (`this.ctx`, `this.out`, `this.noise`, `this.tone`, `this.allow`: audio/core.js).
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PENTA = [0, 4, 7, 9];
const chainNote = (step) => 72 + PENTA[(step - 1) % 4] + 12 * Math.floor((step - 1) / 4); // (C5 E5 G5 A5 C6 ...)
const COLOUR_NOTE = { red: 79, orange: 81, yellow: 84, green: 86, blue: 88, purple: 91, white: 93 };
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
      case 'chain': return this.duelChain(e.step, e.side);
      case 'line': return this.duelLine(e.line, e.w);
      case 'clear': return this.duelClear(e.colour);
      case 'fall': return this.duelFall();
      case 'break': return this.duelBreak();
      case 'blast': return this.duelBlast();
      case 'pinch': return this.duelPinch(e.colour);
      case 'land': return this.duelLand(e.n, e.side);
      case 'offset': return this.duelOffset(e.n, e.side);
      case 'send': return this.duelSend(e.n, e.side);
      case 'duel.line': case 'duel.full': case 'duel.cap': return this.duelEnd(e.winner);
      default: return null;
    }
  }
  /** A chain's step: a note higher each, fuller as it climbs. */
  duelChain(step = 1, side = 0) {
    if (!this.ok() || !this.allow('duelChain', 12)) return;
    const n = Math.max(1, step | 0), foe = side === 1, t = this.ctx.currentTime, d = this.duelOut(0.32 + 0.03 * Math.min(6, n), 0.35 + 0.05 * Math.min(6, n), sidePan(side));
    const m = chainNote(n) - (foe ? 12 : 0), type = foe ? 'square' : 'triangle', g = foe ? 0.05 : 0.11;
    this.tone(t, 0.3, { f0: hz(m - 0.5), f1: hz(m), type, gain: g, dest: d }); // (a little scoop up into the note)
    if (n >= 3) this.tone(t + 0.02, 0.3, { f0: hz(m + 7), type, gain: g * 0.5, dest: d });
    if (n >= 5) { this.tone(t + 0.04, 0.45, { f0: hz(m + 12), gain: g * 0.4, dest: d }); for (let k = 0; k < 4; k++) this.tone(t + 0.05 + k * 0.03, 0.2, { f0: hz(m + 24 + PENTA[k]), gain: 0.012, dest: d }); }
  }
  /** The line pushed a column: a stone dragged and set down, panned to where it now stands (of w columns). */
  duelLine(line = 10, w = 20) {
    if (!this.ok() || !this.allow('duelLine', 4)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.4, 0.3, Math.max(-0.8, Math.min(0.8, (line / Math.max(1, w)) * 2 - 1)));
    this.noise(t, 0.22, { type: 'bandpass', f0: 350, f1: 220, q: 1.5, gain: 0.3, attack: 0.04, dest: d });
    this.tone(t + 0.22, 0.25, { f0: 90, f1: 50, gain: 0.45, dest: d }); this.noise(t + 0.22, 0.06, { type: 'lowpass', f0: 900, gain: 0.25, dest: d });
  }
  /** A gem cleared: a glassy pop at its colour's note. */
  duelClear(colour) {
    if (!this.ok() || !this.allow('duelClear', 14)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.22, 0.3), m = COLOUR_NOTE[colour] ?? 84;
    this.noise(t, 0.02, { type: 'bandpass', f0: 5000, q: 2, gain: 0.15, dest: d });
    [1, 2.76].forEach((r, j) => this.tone(t, 0.18, { f0: hz(m) * r, gain: j ? 0.01 : 0.04, dest: d }));
  }
  duelFall() {
    if (!this.ok() || !this.allow('duelFall', 10)) return;
    const t = this.ctx.currentTime, d = this.duelOut(0.15, 0.1);
    this.noise(t, 0.03, { type: 'bandpass', f0: 1100 + Math.random() * 600, q: 3, gain: 0.12, dest: d });
  }
  /** Junk broken: dry clay cracking. */
  duelBreak() {
    if (!this.ok() || !this.allow('duelBreak', 10)) return;
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
    const t = this.ctx.currentTime, d = this.duelOut(0.28, 0.3), m = COLOUR_NOTE[colour] ?? 84;
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
}
