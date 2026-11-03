// ---------------------------------------------------------------------------------------
// PLATES ON THE BEAT IN THE WORLD (G312; the rule: progress/platebeat.js): the Raceway asks here when the board is on a sun plate
// (raceway.js plateAt), and this grades the crossing ONCE, on the frame it begins, by the heard beat of the cue (game.music.clock()), and
// holds that grade while the board stays on the plate. The sun plate's power is multiplied by it; the plate's own event carries the bigger
// power, and skiff.plate.beat { plate, grade, off, by } says the crossing was on the beat (Calissa's pulse on the plate, Wanda's tick).
//
//   raceway.platebeat = new PlateBeat(game)   .mult(P) -> number (the plate's grade multiplier, 1 if not graded)   .leave()
// ---------------------------------------------------------------------------------------
import { beatGrade } from '../../progress/platebeat.js';

export class PlateBeat {
  constructor(game) { this.game = game; this.cur = null; this.k = 1; }
  /** The multiplier for plate P under the board now: graded on entry, the same until the board leaves it. */
  mult(P) {
    if (P === this.cur) return this.k;
    this.cur = P; this.k = 1;
    if (P.vein || P.lane) return 1;
    const G = beatGrade(this.game.music?.clock?.());
    this.k = G.mult;
    if (G.grade !== 'off') this.game.events?.emit('skiff.plate.beat', { plate: P.index, grade: G.grade, off: G.off, by: 'courier' });
    return this.k;
  }
  leave() { this.cur = null; }
}
