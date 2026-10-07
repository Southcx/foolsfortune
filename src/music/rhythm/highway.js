// ---------------------------------------------------------------------------------------
// THE HIGHWAY (a placeholder: its look is Calissa's to make): the rhythm mode's lanes, drawn on a canvas over the scene. Ten lanes in
// two hands of five, each in its note's colour (the Crucibelle's DEGREE_COLOR: the same key is always the same colour); the upper five
// carry a white core. Notes fall to the line; a press lights its lane (white for a perfect, its colour for a great, dim for a good),
// a miss darkens it. No numbers: the line glows brighter the longer the combo runs, and a thread along the top fills as the song goes.
// Each judged press is rated in the maker's words over the line (Miss! to Wow: ui/rating.js, the owner's ask, 2026-10-07).
//
// Prior art: StepMania's and Guitar Hero's note highway (notes scroll to a fixed judgement line), Beatmania's two hands of keys, and
// Guitar Hero's star power (the board itself glowing with the streak, instead of a number).
//
//   const H = new Highway()   H.show(chart)   H.draw(t, { flash, combo, progress })   H.hit(lane, grade, { off, combo })   H.hide()
// ---------------------------------------------------------------------------------------
import { DEGREE_COLOR } from '../../tools/crucibelle/songs.js';
import { Ratings } from '../../ui/rating.js';

const AHEAD = 1.6; // (seconds of notes above the line)
const W = 34, GAP = 22, H = 360; // (a lane's width, the gap between the hands, the highway's height: CSS pixels)
const hex = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

export class Highway {
  constructor() { this.canvas = null; this.lit = new Float32Array(10); this.litGrade = new Array(10).fill(null); this.ratings = new Ratings(); this.combo = 0; }
  show(chart) {
    this.chart = chart;
    if (!this.canvas) {
      const c = this.canvas = document.createElement('canvas');
      c.width = (W * 10 + GAP) * 2; c.height = H * 2;
      Object.assign(c.style, { position: 'fixed', left: '50%', bottom: '8%', transform: 'translateX(-50%)', width: `${W * 10 + GAP}px`, height: `${H}px`, pointerEvents: 'none', zIndex: 5 });
      this.g = c.getContext('2d'); this.g.scale(2, 2);
    }
    document.body.appendChild(this.canvas); this.ratings.attach(); this.combo = 0;
  }
  hide() { this.canvas?.remove(); this.ratings.detach(); }
  laneX(l) { return l * W + (l >= 5 ? GAP : 0); }
  /** A judged press (or a miss) lights its lane and is rated over the line (off: seconds late; combo: the run with this note). */
  hit(lane, grade, { off = null, combo = grade === 'miss' ? 0 : this.combo + 1 } = {}) { this.lit[lane] = 1; this.litGrade[lane] = grade; this.ratings.call(grade, { off, combo }); }

  draw(t, { combo = 0, progress = 0, dt = 1 / 60 } = {}) {
    const g = this.g; if (!g) return;
    this.combo = combo; this.ratings.update(dt);
    const line = H - 40, px = line / AHEAD;
    g.clearRect(0, 0, W * 10 + GAP, H);
    for (let l = 0; l < 10; l++) {
      const x = this.laneX(l), c = DEGREE_COLOR[l % 5], k = this.lit[l], gr = this.litGrade[l];
      g.fillStyle = 'rgba(20,10,30,0.55)'; g.fillRect(x + 1, 0, W - 2, H);
      if (k > 0) {
        g.fillStyle = gr === 'miss' ? `rgba(90,10,20,${0.6 * k})` : gr === 'perfect' ? `rgba(255,255,255,${0.5 * k})` : hex(c, (gr === 'good' ? 0.25 : 0.5) * k);
        g.fillRect(x + 1, 0, W - 2, H);
        this.lit[l] = Math.max(0, k - dt * 5);
      }
      // the key at the line
      g.fillStyle = hex(c, 0.9); g.fillRect(x + 4, line - 3, W - 8, 6);
      if (l >= 5) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x + W / 2 - 3, line - 1, 6, 2); }
    }
    // the line: brighter as the combo runs
    const glow = Math.min(1, combo / 50);
    g.fillStyle = `rgba(255,236,170,${0.25 + 0.6 * glow})`; g.fillRect(0, line - 1, W * 10 + GAP, 2);
    if (glow > 0.2) { g.fillStyle = `rgba(255,220,120,${0.15 * glow})`; g.fillRect(0, line - 8, W * 10 + GAP, 16); }
    // the notes
    for (const n of this.chart?.notes || []) {
      const dy = (n.t - t) * px; if (dy > line + 10) break;
      if (n.grade && n.grade !== 'miss') continue;
      const y = line - dy, x = this.laneX(n.lane), c = DEGREE_COLOR[n.lane % 5];
      if (y < -12 || y > H + 12) continue;
      const len = Math.min(n.d, 1.2) * px * 0.6;
      g.fillStyle = hex(c, n.grade === 'miss' ? 0.25 : 0.35); g.fillRect(x + W / 2 - 3, y - len, 6, len); // (the note's length, faint)
      g.fillStyle = hex(c, n.grade === 'miss' ? 0.35 : 1); g.fillRect(x + 3, y - 5, W - 6, 10);
      if (n.lane >= 5) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x + W / 2 - 4, y - 2, 8, 4); }
    }
    // the song so far: a thread along the top
    g.fillStyle = 'rgba(255,236,170,0.7)'; g.fillRect(0, 0, (W * 10 + GAP) * Math.min(1, progress), 2);
  }
}
