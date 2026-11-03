// ---------------------------------------------------------------------------------------
// SPIRIT COOKING HEARD (Dovina's rules, progress/cooking/; Petra's hearth and window, world/garden/hearth.js, kitchen.js; SPIRIT-COOKING.md;
// GAPS G233). Each move is heard as its real technique when it is done (MOVE, keyed by the move's id: a dough's slap and fold, the oven,
// the knock, the pasta's roll, the boil, the sear's sizzle ...), told again by how it went: a hit lands a step up the scale, a ruined
// move its own sour version (a tear, a burn, a split). A dish served rings its grade (GRADE: dubious a sad slide .. TRUE the whole chord);
// a recipe learned is the item-get's cousin; a serving eaten is a bite and the feeling's note going down.
//   A MOVE      (cook.move { move, hit, ruined }) its technique's sound, then a note: a step up for a hit, a flat one for a miss
//   THE POKE    (cook.proof) a floured finger in the dough, and the dent springing back
//   SERVED      (cook.serve { grade }) a plate set down and the grade's chime
//   LEARNED     (cook.learn) a recipe card's flourish
//   EATEN       (cook.eat { feeling }) a bite, a swallow, and a soft note rising
//   DUBIOUS     (cook.dubious) the plate set down too hard and a sorry slide down
//
// Prior art: Cooking Mama's per-step stings and "just like Mama", Breath of the Wild's dubious food jingle, Ratatouille's kitchen foley,
// Overcooked's sizzle and chop under the music.
//
//   sfx.cookMove(move, hit, ruined) .cookPoke() .cookServe(grade) .cookLearn() .cookEat(feeling) .cookDubious()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** Each move's technique heard (MOVES' ids, progress/cooking/moves.js), and its ruin. */
const MOVE = {
  knead:    { done: (s, t, d) => { for (let i = 0; i < 3; i++) { s.noise(t + i * 0.18, 0.06, { type: 'lowpass', f0: 700, gain: 0.45, dest: d }); s.tone(t + i * 0.18, 0.1, { f0: 120, f1: 80, gain: 0.25, dest: d }); } }, ruin: 'tear' }, // (slap, fold, push)
  proof:    { done: (s, t, d) => s.noise(t, 0.8, { type: 'lowpass', f0: 500, gain: 0.15, attack: 0.3, dest: d }), ruin: 'sag' },                   // (a cloth lifted)
  bake:     { done: (s, t, d) => { s.noise(t, 0.2, { type: 'lowpass', f0: 900, gain: 0.3, dest: d }); [0.35, 0.55].forEach((x) => s.tone(t + x, 0.12, { f0: 180, f1: 150, type: 'triangle', gain: 0.35, dest: d })); }, ruin: 'burn' }, // (the oven door; the hollow knock)
  roll:     { done: (s, t, d) => s.noise(t, 0.7, { type: 'bandpass', f0: 400, f1: 300, q: 2, gain: 0.25, attack: 0.1, dest: d }), ruin: 'tear' },       // (a pin over the sheet)
  laminate: { done: (s, t, d) => { s.noise(t, 0.4, { type: 'bandpass', f0: 500, q: 2, gain: 0.2, dest: d }); s.noise(t + 0.45, 0.08, { type: 'lowpass', f0: 600, gain: 0.3, dest: d }); }, ruin: 'tear' }, // (folded and pressed)
  cut:      { done: (s, t, d) => { for (let i = 0; i < 5; i++) s.noise(t + i * 0.1, 0.03, { type: 'bandpass', f0: 3000, q: 3, gain: 0.35, dest: d }); }, ruin: 'tear' }, // (the knife on the board)
  pull:     { done: (s, t, d) => s.noise(t, 0.6, { type: 'bandpass', f0: 800, f1: 1600, q: 3, gain: 0.15, attack: 0.2, dest: d }), ruin: 'tear' },    // (the dough drawn thin)
  boil:     { done: (s, t, d) => { for (let i = 0; i < 12; i++) s.tone(t + Math.random() * 0.8, 0.05, { f0: 300 + Math.random() * 500, f1: 900, gain: 0.05, dest: d }); }, ruin: 'over' }, // (the pot's bubbles)
  sear:     { done: (s, t, d) => s.noise(t, 1, { type: 'highpass', f0: 2500, f1: 4000, gain: 0.3, attack: 0.02, dest: d }), ruin: 'burn' },               // (the sizzle)
  bleed:    { done: (s, t, d) => s.noise(t, 0.4, { type: 'bandpass', f0: 1200, q: 4, gain: 0.12, dest: d }), ruin: 'sag' },                             // (a clean cut, the line drawn)
  emulsion: { done: (s, t, d) => { for (let i = 0; i < 8; i++) s.noise(t + i * 0.07, 0.04, { type: 'bandpass', f0: 2200, q: 4, gain: 0.25, dest: d }); }, ruin: 'split' }, // (the whisk)
};
/** What a ruined move sounds like after its technique. */
const RUIN = {
  tear:  (s, t, d) => s.noise(t, 0.15, { type: 'bandpass', f0: 1500, f1: 600, q: 3, gain: 0.3, dest: d }),
  sag:   (s, t, d) => s.tone(t, 0.6, { f0: 200, f1: 100, type: 'triangle', gain: 0.12, dest: d }),
  burn:  (s, t, d) => s.noise(t, 0.8, { type: 'highpass', f0: 1800, gain: 0.25, dest: d }),
  over:  (s, t, d) => s.noise(t, 0.5, { type: 'highpass', f0: 3000, gain: 0.3, dest: d }),
  split: (s, t, d) => s.tone(t, 0.4, { f0: 300, f1: 220, type: 'triangle', gain: 0.12, dest: d }),
};
/** Each grade's chime (GRADES' ids, progress/cooking/dishes.js): its notes above the hearth's root. */
const GRADE = { dubious: [5, 3, 0], fair: [0, 4], good: [0, 4, 7], great: [0, 4, 7, 12], perfect: [0, 4, 7, 12, 16], true: [0, 4, 7, 12, 16, 19, 24] };
const ROOT = 67; // (G: the clay's key)
/** Each moment's level against the parry's clang (set by ear in the probe). */
const LEVEL = { knead: 0.7, proof: 2, bake: 0.6, roll: 2.2, laminate: 2.2, cut: 1.6, pull: 2.2, boil: 1.5, sear: 0.65, bleed: 2, emulsion: 1.7,
  poke: 1.9, serve: 2.5, learn: 2.1, eat: 1.35, dubious: 5 };

export class CookingSounds {
  cookOut(key, gain, verb) { const d = this.ctx.createGain(); d.gain.value = LEVEL[key] ?? 1; d.connect(this.out(gain, verb)); setTimeout(() => d.disconnect(), 6000); return d; }

  cookMove(move = 'knead', hit = false, ruined = false) {
    const M = MOVE[move]; if (!M || !this.ok() || !this.allow('cookMove', 3)) return;
    const t = this.ctx.currentTime, d = this.cookOut(move, 0.3, 0.3);
    M.done(this, t, d);
    if (ruined) { RUIN[M.ruin]?.(this, t + 0.6, d); return; }
    this.tone(t + 0.6, 0.35, { f0: hz(ROOT + (hit ? 12 : 11)), type: 'triangle', gain: 0.1, dest: d }); // (a hit lands a step up; a miss a little short)
  }
  cookPoke() {
    if (!this.ok() || !this.allow('cookPoke', 2)) return;
    const t = this.ctx.currentTime, d = this.cookOut('poke', 0.25, 0.25);
    this.noise(t, 0.06, { type: 'lowpass', f0: 500, gain: 0.35, dest: d }); this.tone(t + 0.15, 0.4, { f0: 140, f1: 180, type: 'triangle', gain: 0.15, dest: d }); // (the dent springing back)
  }
  cookServe(grade = 'good') {
    const G = GRADE[grade] ?? GRADE.good; if (!this.ok() || !this.allow('cookServe', 1)) return;
    const t = this.ctx.currentTime, d = this.cookOut('serve', 0.3, 0.5);
    this.noise(t, 0.05, { type: 'bandpass', f0: 2500, q: 2, gain: 0.3, dest: d }); this.tone(t, 0.3, { f0: 1800, gain: 0.04, dest: d }); // (the plate set down)
    G.forEach((n, i) => this.tone(t + 0.12 + i * 0.08, i === G.length - 1 ? 0.9 : 0.3, { f0: hz(ROOT + n + 12), type: 'triangle', gain: 0.1, dest: d }));
  }
  cookLearn() {
    if (!this.ok() || !this.allow('cookLearn', 1)) return;
    const t = this.ctx.currentTime, d = this.cookOut('learn', 0.3, 0.5);
    this.noise(t, 0.2, { type: 'bandpass', f0: 3000, q: 1, gain: 0.15, dest: d }); [0, 7, 12, 16].forEach((n, i) => this.tone(t + 0.1 + i * 0.07, 0.5, { f0: hz(ROOT + 12 + n), gain: 0.08, dest: d })); // (a card turned; a flourish)
  }
  cookEat() {
    if (!this.ok() || !this.allow('cookEat', 2)) return;
    const t = this.ctx.currentTime, d = this.cookOut('eat', 0.25, 0.3);
    this.noise(t, 0.05, { type: 'bandpass', f0: 1500, q: 2, gain: 0.35, dest: d }); this.tone(t + 0.25, 0.15, { f0: 220, f1: 150, gain: 0.2, dest: d }); // (a bite, a swallow)
    this.tone(t + 0.4, 0.8, { f0: hz(ROOT + 12), f1: hz(ROOT + 19), gain: 0.06, dest: d }); // (warmth rising)
  }
  cookDubious() {
    if (!this.ok() || !this.allow('cookDubious', 1)) return;
    const t = this.ctx.currentTime, d = this.cookOut('dubious', 0.3, 0.4);
    this.noise(t, 0.08, { type: 'lowpass', f0: 1200, gain: 0.4, dest: d }); this.tone(t + 0.15, 0.9, { f0: hz(ROOT + 5), f1: hz(ROOT - 2), type: 'sawtooth', gain: 0.03, dest: d }); // (down hard; a sorry slide)
  }
}
