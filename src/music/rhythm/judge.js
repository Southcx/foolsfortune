// ---------------------------------------------------------------------------------------
// THE JUDGE: how near a press came to its note, and what the run is worth. Pure (no audio, no DOM), so a script can check it.
// A press takes the nearest unjudged note in its lane inside the widest window; a note the line has passed by more than that is
// missed. Four grades, each worth a share of a note: PERFECT within 45 ms, GREAT 90, GOOD 135, MISS. The accuracy is the share of the
// whole chart earned (0..1); the combo is the run of notes without a miss, and the best of it is kept.
//
// Prior art: StepMania's timing windows (its "J4": Marvelous 22.5, Perfect 45, Great 90, Good 135 ms) and its percentage score,
// DDR's and Guitar Hero's combo; osu!'s rule that a press takes the earliest note it can reach in its column.
//
//   const J = new Judge(chart.notes)   J.press(lane, t) -> { note, grade, off } | null   J.sweep(t) -> [missed notes]
//   J.accuracy  J.combo  J.best  J.counts { perfect, great, good, miss }  J.done
// ---------------------------------------------------------------------------------------
export const WINDOWS = [['perfect', 0.045, 1], ['great', 0.09, 0.75], ['good', 0.135, 0.4]];
const WIDEST = WINDOWS[WINDOWS.length - 1][1];

export class Judge {
  constructor(notes) {
    this.notes = notes.map((n) => ({ ...n, grade: null }));
    this.byLane = Array.from({ length: 10 }, () => []);
    for (const n of this.notes) this.byLane[n.lane].push(n);
    this.next = new Array(10).fill(0); // (per lane: the first note not yet judged)
    this.earned = 0; this.combo = 0; this.best = 0; this.judged = 0;
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
  }
  get accuracy() { return this.notes.length ? this.earned / this.notes.length : 0; }
  get done() { return this.judged >= this.notes.length; }

  /** A press in a lane at time t (the chart's clock): the note it took and its grade, or null (a stray press: no note near). */
  press(lane, t) {
    const L = this.byLane[lane]; if (!L) return null;
    for (let k = this.next[lane]; k < L.length; k++) {
      const n = L[k];
      if (n.grade) continue;
      const off = t - n.t;
      if (off > WIDEST) continue; // (long gone: the sweep will call it)
      if (off < -WIDEST) return null; // (the nearest is still too far off)
      const [grade, , w] = WINDOWS.find(([, win]) => Math.abs(off) <= win);
      this.mark(n, grade, w);
      return { note: n, grade, off };
    }
    return null;
  }
  /** The notes the line has passed by more than the widest window: missed. */
  sweep(t) {
    const out = [];
    for (let lane = 0; lane < 10; lane++) {
      const L = this.byLane[lane];
      while (this.next[lane] < L.length) {
        const n = L[this.next[lane]];
        if (n.grade) { this.next[lane]++; continue; }
        if (t - n.t <= WIDEST) break;
        this.mark(n, 'miss', 0); out.push(n); this.next[lane]++;
      }
    }
    return out;
  }
  mark(n, grade, w) {
    n.grade = grade; this.counts[grade]++; this.judged++; this.earned += w;
    if (grade === 'miss') this.combo = 0; else this.best = Math.max(this.best, ++this.combo);
  }
}
