// ---------------------------------------------------------------------------------------
// THE RATINGS: the word that pops over the rhythm mode's line on every judged press (the owner's, 2026-10-07: "words for saying how
// well you're doing in the minigame"), drawn by the maker (source_assets/UI_rhythmwords-Sheet.png, the pixel kit's 'words': eight
// rows of 64 px, worst to best). The owner asked for these words, so they stand beside the log's rule as the minigame's own interface:
// they live on the highway, go when the song ends, and the log still says the run's score.
//
//   THE LADDER   Miss! (a miss), OK... (a good), Nice! and Great! (a great, late or early by more than 67 ms or less), Excellent,
//                Awesome and Perfect (a perfect: inside 45, 30 and 15 ms), and Wow on every 25th note of a combo struck great or
//                better. Without the press's timing (`off`), a grade gives its plainest word (good OK..., great Great!, perfect Perfect).
//   THE INKS     the pixel kit's palettes, rising with the word: grey for the misses and the OKs, clay for Nice and Great, a mind's
//                indigo for Excellent and Awesome, gold for Perfect and Wow (gold is won: docs/LOOK.md)
//   THE POP      the newest word replaces the last: it lands one whole step larger for 60 ms, settles, rises 10 px and fades by 0.6 s.
//                Every step is a whole-number scale of the 1x art (ui/pixel.js), never resampled.
//
// Prior art: DDR's and StepMania's judgement words over the receptors (Marvelous, Perfect, Great), Bemani's combo celebrations, and
// PaRappa the Rapper's "U Rappin'" ladder (the word as the crowd's voice, from Awful to Cool).
//
//   const R = new Ratings()   R.attach(parentEl?)   R.call(grade, { off, combo })   R.update(dt)   R.detach()   rate(grade, off, combo)
// ---------------------------------------------------------------------------------------
import { px } from './pixel.js';

export const RATINGS = ['Miss!', 'OK...', 'Nice!', 'Great!', 'Excellent', 'Awesome', 'Perfect', 'Wow']; // (the sheet's rows, worst to best)
const INK = ['grey', 'grey', 'clay', 'clay', 'mind', 'mind', 'gold', 'gold'];
const ROW = 64, POP = 0.06, LIFE = 0.6, K = 0.75; // (a row's height in art pixels; the pop and the life, real seconds; the art's share of the kit's scale: 2x on a 1080-line screen)

/** A judged press -> the row of its word. */
export function rate(grade, off = null, combo = 0) {
  if (grade === 'miss') return 0;
  if ((grade === 'great' || grade === 'perfect') && combo > 0 && combo % 25 === 0) return 7;
  if (grade === 'good') return 1;
  const a = off == null ? null : Math.abs(off);
  if (grade === 'great') return a != null && a > 0.0675 ? 2 : 3;
  return a == null || a <= 0.015 ? 6 : a <= 0.03 ? 5 : 4;
}

export class Ratings {
  constructor() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, { position: 'fixed', left: '50%', bottom: 'calc(8% + 96px)', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 6, opacity: 0 });
    this.cv = null; this.t = LIFE; this.row = -1; this.big = false; this.cache = new Map();
  }
  attach(parent = document.body) { parent.appendChild(this.el); }
  detach() { this.el.remove(); this.t = LIFE; }

  /** The word for a judged press. */
  call(grade, { off = null, combo = 0 } = {}) {
    const row = rate(grade, off, combo), art = this.word(row);
    const s = px.scale(), base = Math.max(1, Math.round(s * K)), k = (base + 1) / s; // (landing one whole step large)
    if (!this.cv) { this.cv = px.show(art, { k }); this.el.appendChild(this.cv); }
    this.cv.__k = k; px.swap(this.cv, art); px.paint(this.cv);
    this.row = row; this.t = 0; this.big = true; this.el.style.opacity = 1; this.el.style.transform = 'translateX(-50%)';
  }

  update(dt) {
    if (this.t >= LIFE) return;
    this.t += dt;
    if (this.big && this.t >= POP) { this.big = false; this.cv.__k = Math.max(1, Math.round(px.scale() * K)) / px.scale(); px.paint(this.cv); }
    const k = Math.min(1, this.t / LIFE);
    this.el.style.transform = `translate(-50%, ${-Math.round(10 * k)}px)`;
    this.el.style.opacity = this.t < 0.35 ? 1 : Math.max(0, 1 - (this.t - 0.35) / (LIFE - 0.35));
  }

  // one row of the sheet in its ink, cropped to its letters (1x)
  word(row) {
    const key = `${row}`; if (this.cache.has(key)) return this.cache.get(key);
    const sheet = px.art('words', INK[row]), g = sheet.getContext('2d'), y0 = row * ROW;
    const h = Math.min(ROW, sheet.height - y0), c = document.createElement('canvas');
    if (h <= 0) { c.width = c.height = 1; return c; }
    const a = g.getImageData(0, y0, sheet.width, h).data;
    let l = sheet.width, r = -1, t = h, b = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < sheet.width; x++) if (a[(y * sheet.width + x) * 4 + 3]) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
    if (r < 0) { c.width = c.height = 1; return c; }
    c.width = r - l + 1; c.height = b - t + 1;
    c.getContext('2d').drawImage(sheet, l, y0 + t, c.width, c.height, 0, 0, c.width, c.height);
    this.cache.set(key, c);
    return c;
  }
}
