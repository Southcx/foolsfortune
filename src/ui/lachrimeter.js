// ---------------------------------------------------------------------------------------
// THE LACHRIMETER: the Courier's Lachryma, as a tube of it. The maker's end piece (a clamp round the mouth of a glass pipe, 32 x 32,
// greyscale: ui/pixel.js) at the left, the pipe drawn on from its last column of pixels, the same end piece turned round at the right;
// the liquid Lachryma inside, near-black with the oil-film sheen it has in the Well and on the cubes (a band of slick colour along its
// top), seen through the pipe's window. What is reserved for a charge sits after it, paler. When Lachryma comes in, a bead flashes at the
// liquid's leading edge (the maker's bead-flash sheet, seven frames). All drawn at 1x into one small canvas and scaled by a whole number.
//
// A CAPPED POOL (Dovina's handoff of 2026-10-15; progress/poolcaps.js, "base change bad, modifiers good"): the tube is drawn to the
// pool's max without its caps (`capOf(pool).full`), and the last of it that a cap holds off is shown at the right end in the look of
// what holds it, each source in `by[]` its own stretch: the vessel's cracks as crazed glass gone dull, the clay's cracks running through
// it, no Lachryma in it (any other source: dull glass, hatched). As a stretch closes the cracks spread in from the end toward the liquid;
// as it opens (a region mended) its cracks run gold and go (kintsugi), a step at a time. No words, no numbers.
//
// Prior art: the tube gauges of the JRPG and the action RPG (Kingdom Hearts' MP bar, Okami's ink pots, Dark Cloud's thirst meter: a
// liquid you can see the level of), and pixel art's rule that a gauge is the drawing with its fill showing through; for the cap,
// Monster Hunter's red health and Dark Souls' hollowed bar (the lost part of a gauge kept in view, a different look), and kintsugi's
// gold joins for the mending (the house's own: a sibling's shatter).
//
//   const m = new Lachrimeter(px, { width: 220 })   el.appendChild(m.el)   m.set(available, reserved, max)   m.bead()   m.update(dt)
//   watchPoolCaps(game)   (main.js, once: the gauges then ask capOf(game.lachryma) for the uncapped max and its held stretches)
// ---------------------------------------------------------------------------------------
import { capOf } from '../progress/poolcaps.js';

const WIN = { y0: 11, y1: 17, x0: 15 }; // (the pipe's window, in the end piece's pixels: where the liquid shows through)
// the oil film along the liquid's top (the cubes' run of colours: violet, teal, gold, magenta), and its body
const FILM = ['#4d1a8a', '#2a6fa0', '#0b8c9c', '#3aa077', '#c99a2e', '#c2426f', '#7a2c9a'];
const BODY = ['#120a1c', '#0b0611', '#07040b', '#0b0611', '#160c22'];
const RES = ['#6b4a88', '#56396f', '#4a3061', '#56396f', '#6b4a88'];
// a held stretch: the cracks' (crazed glass gone dull, the clay's cracks in it, its edges the clay's red, a kintsugi gold as it mends)
// and any other source's (dull glass, hatched); the crack's tip as it spreads, white
const HELD = {
  cracks: { glass: ['#4a4044', '#3a3236', '#332c30', '#3a3236', '#433a3e', '#4a4044'], craze: '#8a7e82', crack: '#140906', edge: '#8c4a33' },
  other: { glass: ['#3c3a44', '#302e38', '#2a2832', '#302e38', '#3c3a44', '#3c3a44'], craze: '#6e6a7a', crack: '#1a1820', edge: '#4a4656' },
};
const GOLD = ['#fff6d0', '#f2cc5a', '#c9962c', '#7f5816']; // (the mend's steps, bright to gone: PAL.gold's)
const MOMENT = { close: 0.5, open: 0.8 }; // (real seconds a stretch takes to close (the cracks spread in) and to open (the gold goes))
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

let WATCH = null;
/** Lets every Lachrimeter ask the Courier's pool for its caps (progress/poolcaps.js capOf). */
export function watchPoolCaps(game) { WATCH = game; }

/** A stretch's crack: the pixels (u from its right end, row) its clay crack runs through, a random walk with a branch every so often,
 *  stable as the stretch grows (seeded by the source and the column). */
function crackRows(seed, u) {
  let y = Math.floor(hash(seed, 0) * 6); const out = [];
  for (let i = 0; i <= u; i++) { const h = hash(seed, i + 1); if (h < 0.3) y--; else if (h > 0.7) y++; y = Math.max(0, Math.min(5, y)); }
  out.push(y);
  if (hash(seed + 9, Math.floor(u / 7)) > 0.55 && u % 7 < 3) out.push(Math.max(0, Math.min(5, y + (hash(seed + 5, Math.floor(u / 7)) > 0.5 ? u % 7 + 1 : -(u % 7) - 1)))); // (a branch off it)
  return out;
}

export class Lachrimeter {
  constructor(px, { width = 220, k = 1 } = {}) {
    this.px = px;
    this.W = Math.max(96, width);
    this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = 32;
    this.el = px.show(this.c, { k });
    this.el.classList.add('lachrimeter');
    this.v = -1; this.r = -1; this.beadT = -1; this.dirty = true;
    this.held = []; this.heldKey = ''; this.moments = new Map(); this.first = true;
  }

  set(avail, reserved, max) {
    const W = this.W, span = W - 2 * WIN.x0;
    const C = WATCH?.lachryma ? capOf(WATCH.lachryma) : null, full = C?.held > 0 ? C.full : max; // (the tube is the uncapped max)
    const v = Math.round((Math.max(0, avail) / full) * span), r = Math.round((Math.max(0, reserved) / full) * span);
    if (v !== this.v || r !== this.r) { this.v = v; this.r = r; this.dirty = true; }
    this.setHeld(C, full, span);
  }
  /** The held stretches, from the right end in, a source each; a change starts its moment (not on the gauge's first reading). */
  setHeld(C, full, span) {
    const by = C?.held > 0 ? C.by.filter((b) => b.held > 0) : [], sum = by.reduce((a, b) => a + b.held, 0), total = by.length ? Math.round((C.held / full) * span) : 0;
    let left = total; const held = by.map((b, i) => { const n = i === by.length - 1 ? left : Math.min(left, Math.round((b.held / sum) * total)); left -= n; return { source: b.source, px: n }; });
    const key = held.map((h) => `${h.source}:${h.px}`).join(',');
    if (key === this.heldKey) { this.first = false; return; }
    const was = new Map(this.held.map((h) => [h.source, h.px]));
    for (const h of held) { const p = was.get(h.source) ?? 0; if (!this.first && p !== h.px) this.moments.set(h.source, { from: p, to: h.px, t: 0 }); was.delete(h.source); }
    for (const [src, p] of was) if (!this.first && p > 0) { held.push({ source: src, px: 0 }); this.moments.set(src, { from: p, to: 0, t: 0 }); } // (a source gone: its stretch still opens)
    this.held = held; this.heldKey = key; this.first = false; this.dirty = true;
  }
  /** A bead flashes at the liquid's edge (Lachryma came in). */
  bead() { this.beadT = 0; this.dirty = true; }

  update(dt) {
    if (this.beadT >= 0) { this.beadT += dt; if (this.beadT > 7 / 14) this.beadT = -1; this.dirty = true; }
    for (const [src, m] of this.moments) { m.t += dt; this.dirty = true; if (m.t > (m.to > m.from ? MOMENT.close : MOMENT.open)) { this.moments.delete(src); if (!m.to) this.held = this.held.filter((h) => h.source !== src || h.px > 0); } }
    if (!this.dirty) return;
    this.dirty = false;
    this.draw();
    this.px.paint(this.el);
  }

  draw() {
    const px = this.px, W = this.W, g = this.c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, 32);
    const end = px.art('endpiece', 'clay');
    // the liquid first (the drawing goes over it: the liquid shows only through the window)
    const x0 = WIN.x0, rows = WIN.y1 - WIN.y0;
    for (let i = 0; i < this.v; i++) {
      const x = x0 + i;
      g.fillStyle = FILM[Math.floor((x / 9) % FILM.length)]; g.fillRect(x, WIN.y0, 1, 1); // (the film along its top)
      for (let y = 1; y < rows; y++) { g.fillStyle = BODY[(y - 1) % BODY.length]; g.fillRect(x, WIN.y0 + y, 1, 1); }
    }
    if (this.v > 0) { g.fillStyle = '#d2c3f4'; g.fillRect(x0 + this.v - 1, WIN.y0 + 1, 1, rows - 2); } // (the meniscus: its leading edge catches the light)
    for (let i = 0; i < this.r; i++) for (let y = 0; y < rows; y++) { g.fillStyle = (i + y) % 3 ? RES[y % RES.length] : '#8c6aa8'; g.fillRect(x0 + this.v + i, WIN.y0 + y, 1, 1); }
    this.drawHeld(g, x0, rows);
    // the pipe: the end piece, its last column drawn on to the other end, and the end piece turned round
    const mid = end.width - 1;
    for (let x = end.width; x < W - end.width; x++) g.drawImage(end, mid, 0, 1, 32, x, 0, 1, 32);
    g.drawImage(end, 0, 0);
    g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(end, 0, 0); g.restore();
    // and the bead, flashing at the edge
    if (this.beadT >= 0) {
      const f = px.frames('bead', 'mind'), i = Math.min(f.length - 1, Math.floor(this.beadT * 14));
      g.drawImage(f[i], Math.max(x0, x0 + this.v - 8), WIN.y0 + (rows - 16) / 2);
    }
  }

  /** The held stretches at the tube's right end, each in its source's look, and their moments (closing: the cracks spreading in toward
   *  the liquid, a white tip at the front; opening: the cracks gold, dimming a step at a time, the glass gone). */
  drawHeld(g, x0, rows) {
    const span = this.W - 2 * WIN.x0; let right = x0 + span; // (the first source at the far end, the next inside it)
    for (const h of this.held) {
      const L = HELD[h.source] || HELD.other, m = this.moments.get(h.source), seed = h.source.length * 17 + h.source.charCodeAt(0);
      const width = m ? Math.max(m.from, m.to) : h.px;
      for (let u = 0; u < width; u++) {
        const x = right - 1 - u; if (x < x0) break;
        let mode = 'held';
        if (m && m.to > m.from && u >= m.from) { const front = m.from + (m.t / MOMENT.close) * (m.to - m.from); if (u > front) continue; if (u > front - 1) mode = 'tip'; }
        if (m && m.to < m.from && u >= m.to) mode = 'gold';
        const crack = crackRows(seed, u), gold = mode === 'gold' ? GOLD[Math.min(GOLD.length - 1, Math.floor((m.t / MOMENT.open) * GOLD.length))] : null;
        for (let y = 0; y < rows; y++) {
          let c;
          if (mode === 'gold') { if (!crack.includes(y)) continue; c = gold; } // (only the join, gold, over the empty pipe)
          else if (mode === 'tip' && crack.includes(y)) c = '#fff6ec';
          else if (crack.includes(y)) c = L.crack;
          else if (crack.includes(y - 1) || crack.includes(y + 1)) c = hash(seed + 3, u * 7 + y) > 0.5 ? L.edge : L.glass[y % L.glass.length];
          else if ((u + y * 2) % 5 === 0 && hash(seed + 1, u * 11 + y) > 0.35) c = L.craze; // (the crazing: a fine net)
          else c = L.glass[y % L.glass.length];
          g.fillStyle = c; g.fillRect(x, WIN.y0 + y, 1, 1);
        }
      }
      if (h.px > 0 && (!m || m.to >= m.from)) { const x = right - h.px; if (x >= x0) { g.fillStyle = L.crack; g.fillRect(x, WIN.y0, 1, rows); } } // (the stretch's seam toward the liquid)
      right -= h.px;
    }
  }
}
