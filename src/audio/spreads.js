// ---------------------------------------------------------------------------------------
// THE SPREADS' SOUNDS (docs/plans/SPREADS.md, Dovina's plan; the board is the Pneuka Box's underside): the Box turned over, a Major
// laid face up or reversed, a cell lighting in its suit's element, a cell cracked dark where contrary suits meet, a spread complete.
//   THE FLIP      the whole board turned over: a wooden case's heft, its lid's air, the latch, a card-table's felt as it lands
//   A CARD LAID   a card's snap on the cloth; reversed, the same card spun on its corner first (a riffle's whirr) and laid a step lower
//   A CELL LIT    one voice a suit (the Golden Dawn's elements, as the plan sets them): Wands fire (a flare's crackle under a warm
//                 brass note), Cups water (a drop into glass), Swords air (a breath through a reed, a blade's ring), Pentacles earth (a
//                 knock on fired clay); a wild card (a planet) a bell. Each rises a step of the scale as the tally climbs, so a row of
//                 lit cells is heard as a run
//   A CRACK       two contrary suits on one cell (fire and water, air and earth): their two voices sounded together a tritone apart, then
//                 a dry crack and silence where the cell went dark
//   COMPLETE      the Outcome lit: the Answer (music/motifs.js) on bells, the four elements' voices under it
// Prior art: Resident Evil 4's attaché case (the case's own handling sounds), Inscryption (cards laid on a table, each with a weight),
// Balatro's rising pitch as a hand scores, the elemental dignities (Golden Dawn) as the plan names them.
//
//   sfx.spreadFlip(under) .spreadLay(reversed) .spreadLight(suit, step) .spreadDim(suit) .spreadCrack(suit) .spreadDone()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const STEP = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // (E major pentatonic up two octaves: a tally's run)
const ROOT = { wands: 64, cups: 67, swords: 71, pentacles: 59, wild: 76 }; // (each suit's own register: fire mid, water a third up, air bright, earth low)

export class SpreadSounds {
  /** The board turned over (`under`: to the underside; false: back to the cells). */
  spreadFlip(under = true) {
    if (!this.ok() || !this.allow('spreadFlip', 2)) return;
    const t = this.ctx.currentTime, d = this.out(0.34, 0.3);
    this.noise(t, 0.35, { type: 'bandpass', f0: under ? 600 : 1400, f1: under ? 1400 : 600, q: 0.8, gain: 0.3, attack: 0.08, dest: d }); // (the air it moves)
    this.tone(t + 0.32, 0.14, { f0: 140, f1: 80, gain: 0.45, dest: d }); this.noise(t + 0.32, 0.06, { type: 'lowpass', f0: 900, gain: 0.35, dest: d }); // (the case set down)
    this.noise(t + 0.4, 0.02, { type: 'bandpass', f0: 3200, q: 4, gain: 0.3, dest: d }); // (the latch)
  }
  /** A Major laid on a position; reversed, spun on its corner first. */
  spreadLay(reversed = false) {
    if (!this.ok() || !this.allow('spreadLay', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.25), at = t + (reversed ? 0.16 : 0);
    if (reversed) for (let i = 0; i < 6; i++) this.noise(t + i * 0.022, 0.012, { type: 'bandpass', f0: 2200 + i * 150, q: 3, gain: 0.18, dest: d }); // (the spin)
    this.noise(at, 0.03, { type: 'highpass', f0: 2500, gain: 0.45, dest: d }); this.tone(at, 0.07, { f0: reversed ? 180 : 240, f1: 120, gain: 0.25, dest: d }); // (the snap on the cloth)
  }
  /** A cell lit in its suit's element, `step` up the run (the tally so far). */
  spreadLight(suit = 'wands', step = 0) {
    if (!this.ok() || !this.allow('spreadLight', 16)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.45), m = (ROOT[suit] ?? ROOT.wild) + STEP[Math.max(0, Math.min(STEP.length - 1, step))], f = hz(m);
    if (suit === 'wands') { this.noise(t, 0.18, { type: 'bandpass', f0: 1800, f1: 3500, q: 1, gain: 0.2, attack: 0.02, dest: d }); for (let i = 0; i < 3; i++) this.noise(t + 0.03 + Math.random() * 0.12, 0.008, { type: 'highpass', f0: 4000, gain: 0.25, dest: d }); this.tone(t, 0.45, { f0: f, type: 'sawtooth', gain: 0.04, dest: d }); this.tone(t, 0.45, { f0: f * 1.003, type: 'square', gain: 0.02, dest: d }); }
    else if (suit === 'cups') { this.tone(t, 0.12, { f0: f * 2, f1: f, gain: 0.18, dest: d }); this.tone(t + 0.05, 0.9, { f0: f, gain: 0.12, dest: d }); this.tone(t + 0.05, 0.5, { f0: f * 2.32, gain: 0.03, dest: d }); } // (a drop into glass)
    else if (suit === 'swords') { this.noise(t, 0.3, { type: 'bandpass', f0: f * 4, q: 12, gain: 0.25, attack: 0.04, dest: d }); this.tone(t + 0.04, 0.7, { f0: f * 2, gain: 0.07, dest: d }); }
    else if (suit === 'pentacles') { this.tone(t, 0.25, { f0: f, f1: f * 0.98, type: 'triangle', gain: 0.3, dest: d }); this.noise(t, 0.02, { type: 'bandpass', f0: 1500, q: 2, gain: 0.3, dest: d }); } // (a knock on fired clay)
    else { this.tone(t, 1.2, { f0: f, gain: 0.12, dest: d }); this.tone(t, 0.5, { f0: f * 2.76, gain: 0.03, dest: d }); } // (a planet's bell)
  }
  /** A cell's light gone out (a footprint lifted): its suit's note, falling and soft. */
  spreadDim(suit = 'wands') {
    if (!this.ok() || !this.allow('spreadDim', 8)) return;
    const t = this.ctx.currentTime, d = this.out(0.14, 0.4), f = hz(ROOT[suit] ?? ROOT.wild);
    this.tone(t, 0.4, { f0: f, f1: f * 0.89, type: 'triangle', gain: 0.12, dest: d });
  }
  /** Two contrary suits on one cell: their voices a tritone apart, then a dry crack and the cell dark. */
  spreadCrack(a = 'wands') {
    if (!this.ok() || !this.allow('spreadCrack', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.28, 0.35), f = hz(ROOT[a] ?? 64);
    this.tone(t, 0.25, { f0: f, type: 'triangle', gain: 0.12, dest: d }); this.tone(t, 0.25, { f0: f * Math.SQRT2, type: 'triangle', gain: 0.12, dest: d }); // (the tritone: the two at odds)
    this.noise(t + 0.22, 0.03, { type: 'highpass', f0: 3000, gain: 0.5, dest: d }); for (let i = 1; i < 4; i++) this.noise(t + 0.22 + i * 0.02, 0.012, { type: 'bandpass', f0: 2000 + i * 600, q: 3, gain: 0.25 / i, dest: d });
    this.tone(t + 0.22, 0.12, { f0: 110, f1: 60, gain: 0.25, dest: d });
  }
  /** A spread complete (the Outcome lit): the Answer on bells, the four elements under it. */
  spreadDone() {
    if (!this.ok() || !this.allow('spreadDone', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.32, 0.6, true);
    [67, 69, 71, 74, 76].forEach((m, i) => { this.tone(t + i * 0.1, 1.4, { f0: hz(m + 12), gain: 0.11, dest: d }); this.tone(t + i * 0.1, 0.5, { f0: hz(m + 12) * 2.76, gain: 0.02, dest: d }); });
    ['pentacles', 'cups', 'swords', 'wands'].forEach((s, i) => this.tone(t + 0.55 + i * 0.05, 1.6, { f0: hz(ROOT[s]), type: 'triangle', gain: 0.05, dest: d }));
    this.noise(t + 0.5, 1.2, { type: 'highpass', f0: 7000, gain: 0.06, attack: 0.2, dest: d });
  }

  /** The court your two strongest suits make, changed (`to`, an id like 'queen.wands' or 'arcana.emperor'): a flourish up the run in the
   *  new court's suit, a Major's in bells. */
  spreadCourt(to = '') {
    if (!this.ok() || !this.allow('spreadCourt', 2) || !to) return;
    const [rank, suit] = String(to).split('.'), S = ROOT[suit] ? suit : 'wild', up = { page: 0, knight: 1, queen: 2, king: 3 }[rank] ?? 2;
    [0, 2, 4].forEach((k, i) => setTimeout(() => this.spreadLight(S, k + up), i * 90));
    const t = this.ctx.currentTime, d = this.out(0.22, 0.6, true); this.tone(t + 0.3, 1.4, { f0: hz((ROOT[S] ?? 76) + 12 + STEP[up]), gain: 0.08, dest: d });
  }
  /** The game day's card, the first time the Box is turned over in a game day: a slow bell and a breath over it. */
  spreadDayCard() {
    if (!this.ok() || !this.allow('spreadDayCard', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.26, 0.7, true);
    this.tone(t + 0.4, 2.6, { f0: hz(76), gain: 0.1, dest: d }); this.tone(t + 0.4, 1.2, { f0: hz(76) * 2.76, gain: 0.02, dest: d });
    this.noise(t, 1.2, { type: 'bandpass', f0: 600, f1: 1800, q: 0.7, gain: 0.08, attack: 0.5, dest: d });
  }
}
