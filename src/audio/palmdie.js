// ---------------------------------------------------------------------------------------
// THE PALM DIE'S SOUNDS (the god hand's palm die: game.palmDie, progress/dice.js, Dovina's): the pool's overflow, past the Lockheart,
// condensed into cubes in a die held in the hand, which grows d4 to d20 on what it has condensed.
//   A CONDENSE   frequent while you overflow, so it stays under everything: a drop of Lachryma gone hard, a tiny glassy tick and the
//                faint click of a cube against the die's faces, pitched by the die (a d4 low and blunt, a d20 high and fine)
//   THE GROW     rare, a moment: the die's faces clicking outward one by one (as many as it gains, at most a dozen), then the new die's
//                chord rung on a bell, its root a step up the run for each size it has reached
// Prior art: dice in the hand (Baldur's Gate 3's roll, a d20 in the palm), the "coin get" tick kept under the mix (Mario's coins at a
// low gain when many come), Balatro's rising pitch as a thing grows.
//
//   sfx.palmCondense(n, sides) .palmGrow(from, to)
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SIZE = { 4: 0, 6: 1, 8: 2, 10: 3, 12: 4, 20: 5 };
const RUN = [0, 2, 4, 7, 9, 12]; // (a step up the pentatonic for each die reached, d4 .. d20)

export class PalmDieSounds {
  /** `n` cubes condensed in the palm die of `sides` faces. */
  palmCondense(n = 1, sides = 4) {
    if (!this.ok() || !this.allow('palmCondense', 3)) return;
    const t = this.ctx.currentTime, d = this.out(0.1, 0.3), m = 79 + RUN[SIZE[sides] ?? 0];
    this.tone(t, 0.09, { f0: hz(m + 12), f1: hz(m), gain: 0.12, dest: d }); // (the drop gone hard)
    for (let i = 0; i < Math.min(3, n); i++) this.noise(t + 0.03 + i * 0.035, 0.008, { type: 'bandpass', f0: 3000 + (SIZE[sides] ?? 0) * 400, q: 5, gain: 0.14, dest: d }); // (a cube on the faces)
  }
  /** The palm die grown from `from` faces to `to`. */
  palmGrow(from = 4, to = 6) {
    if (!this.ok() || !this.allow('palmGrow', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.3, 0.6, true), k = SIZE[to] ?? 1, clicks = Math.min(12, Math.max(2, to - from));
    for (let i = 0; i < clicks; i++) this.noise(t + i * 0.04, 0.012, { type: 'bandpass', f0: 1800 + i * 180, q: 4, gain: 0.22, dest: d }); // (the faces clicking outward)
    const at = t + clicks * 0.04 + 0.05, root = 64 + RUN[k];
    [0, 4, 7, 12].forEach((s, i) => { this.tone(at + i * 0.06, 1.6, { f0: hz(root + s), gain: 0.09, dest: d }); this.tone(at + i * 0.06, 0.5, { f0: hz(root + s) * 2.76, gain: 0.02, dest: d }); });
    this.tone(at, 0.25, { f0: hz(root - 24), f1: hz(root - 26), type: 'triangle', gain: 0.25, dest: d }); // (its new weight in the hand)
  }
}
