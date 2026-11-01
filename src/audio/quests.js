// ---------------------------------------------------------------------------------------
// A QUEST HEARD (Dovina's progress/quests.js, progress/recap.js; South loved Tomba!'s event jingle): the two moments a quest has, and
// nothing between them (a step is the log's: a sound every step would cheapen the two).
//   BEGUN     (quest.start) a bright little splash of a second and a half: a marimba run up the major pentatonic, a hop to the fifth
//             and a two-chord "ta-da" with a glint on top, the music stepping back under it (audio/cues.js ducks it) (Tomba!'s "Event!")
//   DONE      (quest.done) the one big moment, about four real seconds: a triplet pickup into warm horns, I to IV to V7 to I under a
//             timpani roll, the top line climbing to the octave and held under a bell (RuneScape's quest complete)
//   RECAP     (recap.show, only when it opened by itself) a soft "previously on": a harp's sweep up into a suspended chord that settles
//
// Prior art: Tomba!'s event jingle, RuneScape's quest-complete fanfare, Zelda's secret chime (the short sting kept short), a TV serial's
// "previously on" sting.
//
//   sfx.questStart() .questDone(points) .questRecap()
// ---------------------------------------------------------------------------------------

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const KEY = 67; // (G: the house's quest key, bright)

export class QuestSounds {
  /** A soft mallet note: a sine and its fourth partial, struck. */
  questMallet(t, m, len, gain, d) { this.tone(t, len, { f0: hz(m), type: 'triangle', gain, dest: d }); this.tone(t, len * 0.4, { f0: hz(m) * 4, gain: gain * 0.15, dest: d }); }
  questStart() {
    if (!this.ok() || !this.allow('questStart', 0.5)) return;
    const t = this.ctx.currentTime, d = this.out(1.0, 0.5, true), r = KEY;
    [0, 2, 4, 7, 9, 12].forEach((st, i) => this.questMallet(t + i * 0.055, r + st, 0.25, 0.09, d)); // (the run up)
    this.questMallet(t + 0.4, r + 19, 0.2, 0.1, d); // (the hop to the fifth)
    for (const [dt, ch] of [[0.62, [0, 4, 7]], [0.86, [5, 9, 12]]]) for (const st of ch) this.tone(t + dt, dt > 0.8 ? 0.8 : 0.2, { f0: hz(r + 12 + st), type: 'square', gain: 0.022, dest: d }); // (ta-da)
    this.tone(t + 0.86, 0.9, { f0: hz(r + 36), gain: 0.03, dest: d }); this.noise(t + 0.86, 0.5, { type: 'highpass', f0: 7000, gain: 0.05, dest: d }); // (the glint)
  }
  questDone(points = 1) {
    if (!this.ok() || !this.allow('questDone', 0.3)) return;
    const t = this.ctx.currentTime, d = this.out(0.22, 0.8, true), r = KEY - 12;
    const horn = (at, st, len, g = 0.04) => { this.tone(at, len, { f0: hz(r + st), type: 'sawtooth', gain: g, dest: d }); this.tone(at, len, { f0: hz(r + st) * 1.003, type: 'triangle', gain: g * 0.8, dest: d }); };
    [0, 0.12, 0.24].forEach((dt) => horn(t + dt, 7, 0.1, 0.03)); // (the triplet pickup)
    const chords = [[0.4, [0, 4, 7, 12]], [1.0, [5, 9, 12, 17]], [1.6, [7, 11, 14, 17]], [2.2, [12, 16, 19, 24]]];
    chords.forEach(([dt, ch], i) => ch.forEach((st) => horn(t + dt, i === 3 ? 1.9 : 0.62, st, 0.026))); // (I, IV, V7, I)
    [[0.4, 24], [1.0, 26], [1.6, 28], [2.2, 31], [2.5, 36]].forEach(([dt, st]) => this.tone(t + dt, dt > 2.4 ? 1.6 : 0.55, { f0: hz(r + st), type: 'triangle', gain: 0.05, dest: d })); // (the top line, to the octave)
    for (let k = 0; k < 16; k++) this.tone(t + 1.6 + k * 0.04, 0.08, { f0: 72, f1: 60, gain: 0.08 + k * 0.006, dest: d }); // (the timpani roll)
    this.tone(t + 2.2, 1.2, { f0: 70, f1: 50, gain: 0.3, dest: d });
    this.godBell?.(t + 2.5, 2.5, hz(r + 36), 0.06 + Math.min(0.04, points * 0.005), d); // (the bell, a little bigger for a bigger quest)
  }
  questRecap() {
    if (!this.ok() || !this.allow('questRecap', 0.2)) return;
    const t = this.ctx.currentTime, d = this.out(0.25, 0.8, true), r = KEY - 12;
    [0, 2, 5, 7, 9, 12, 14].forEach((st, i) => this.tone(t + i * 0.05, 1.0, { f0: hz(r + 12 + st), type: 'triangle', gain: 0.03, dest: d })); // (the harp's sweep)
    [0, 5, 7].forEach((st) => this.tone(t + 0.4, 1.4, { f0: hz(r + st), gain: 0.04, dest: d })); // (sus4 ...)
    this.tone(t + 1.2, 1.4, { f0: hz(r + 4), gain: 0.04, dest: d }); // (... settling to the third)
  }
}
