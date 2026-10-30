// ---------------------------------------------------------------------------------------
// A MIMICRY PUZZLE HEARD (Dovina's docs/plans/MIMICRY.md; Petra's world/mimicry/mimicry.js): the System working a patch of the island's
// matter with the god hand's powers while you watch, then your turn to make it again.
//   OPEN        (mimic.open) a puzzle stone woken: a low stone hum and the System's two-note chime
//   A STEP      (mimic.step { i }) each step of the System's demonstration: a soft plucked note climbing the scale, a step each
//   YOUR TURN   (mimic.turn) the demonstration over: a turning chime, the same two notes answered upward
//   SOLVED      (mimic.solve { stars }) one to three stars: a rising arpeggio a star long, the third ending on a bell
//   LEFT        (mimic.leave) the patch let go: the hum falling away
//
// Prior art: Simon (the shown sequence, then yours), Zelda's song lessons (the teacher plays, you answer), a Mario Kart medal's
// one, two or three chimes.
//
//   sfx.mimicOpen() .mimicStep(i) .mimicTurn() .mimicSolve(stars) .mimicLeave()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // (the System's steps: a pentatonic climb)

export class MimicrySounds {
  mimicOpen() {
    if (!this.ok() || !this.allow('mimicOpen', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.6);
    this.tone(t, 1.8, { f0: 82.4, type: 'triangle', gain: 0.12, dest: d }); // (the stone woken)
    [76, 83].forEach((m, i) => this.tone(t + 0.3 + i * 0.15, 0.7, { f0: hz(m), gain: 0.06, dest: d })); // (the System's chime)
  }
  mimicStep(i = 0) {
    if (!this.ok() || !this.allow('mimicStep', 6)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.4);
    this.tone(t, 0.35, { f0: hz(64 + SCALE[i % SCALE.length]), type: 'triangle', gain: 0.07, dest: d });
  }
  mimicTurn() {
    if (!this.ok() || !this.allow('mimicTurn', 1)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.5);
    [76, 83, 88].forEach((m, i) => this.tone(t + i * 0.1, 0.6, { f0: hz(m), gain: 0.06, dest: d })); // (your turn: answered upward)
  }
  mimicSolve(stars = 1) {
    if (!this.ok() || !this.allow('mimicSolve', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.35, 0.7), n = Math.max(1, Math.min(3, stars));
    for (let s = 0; s < n; s++) [0, 4, 7].forEach((st, k) => this.tone(t + s * 0.3 + k * 0.06, 0.6, { f0: hz(72 + s * 5 + st), type: 'triangle', gain: 0.06, dest: d })); // (a chime a star)
    if (n === 3) this.godBell?.(t + 0.95, 2.5, hz(84), 0.1, d);
  }
  mimicLeave() {
    if (!this.ok() || !this.allow('mimicLeave', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(0.2, 0.5);
    this.tone(t, 1.0, { f0: 110, f1: 70, type: 'triangle', gain: 0.1, dest: d }); // (the hum falling away)
  }
}
