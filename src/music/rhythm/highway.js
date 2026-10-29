// ---------------------------------------------------------------------------------------
// THE HIGHWAY: the rhythm mode's lanes and their state, drawn by Calissa's look (vfx/rhythmhighway.js: the Clay dress, glazed beads,
// the gold rail, touch's pads). Ten lanes in two hands of five, each in its note's colour (the Crucibelle's DEGREE_COLOR: the same key is always the same colour); the upper five
// carry a white core. Notes fall to the line; a press lights its lane (the film for a perfect, its colour for a great, dim for a good),
// a miss darkens it. No numbers: the line glows brighter the longer the combo runs, and a thread along the top fills as the song goes.
// Each judged press is rated in the maker's words over the line (Miss! to Wow: ui/rating.js, the owner's ask, 2026-10-07).
//
// Prior art: StepMania's and Guitar Hero's note highway (notes scroll to a fixed judgement line), Beatmania's two hands of keys, and
// Guitar Hero's star power (the board itself glowing with the streak, instead of a number).
//
//   const H = new Highway(game)   H.show(chart)   H.draw(t, { flash, combo, progress })   H.hit(lane, grade, { off, combo })   H.hide()
// ---------------------------------------------------------------------------------------
import { Ratings } from '../../ui/rating.js';
import { HighwayLook } from '../../vfx/rhythmhighway.js';

export class Highway {
  constructor(game = null) { this.lit = new Float32Array(10); this.litGrade = new Array(10).fill(null); this.ratings = new Ratings(); this.combo = 0; this.look = new HighwayLook(this, game); }
  show(chart) { this.chart = chart; this.look.show(); this.ratings.attach(); this.combo = 0; }
  hide() { this.look.hide(); this.ratings.detach(); }
  /** A judged press (or a miss) lights its lane and is rated over the line (off: seconds late; combo: the run with this note). */
  hit(lane, grade, { off = null, combo = grade === 'miss' ? 0 : this.combo + 1 } = {}) { this.lit[lane] = 1; this.litGrade[lane] = grade; this.look.seen(lane, grade); this.ratings.call(grade, { off, combo }); }
  /** A frame: the look draws the state (the lit lanes fade there). */
  draw(t, { combo = 0, progress = 0, dt = 1 / 60 } = {}) { this.combo = combo; this.ratings.update(dt); this.look.draw(t, { combo, progress, dt }); }
}
