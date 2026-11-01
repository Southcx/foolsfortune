// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE STOMP: a spring meadow of the sewing basket behind The Stomp (a theme for flats/build.js). A
// bright sky, a painted sun and clouds; far off, pincushion hills (the tomato cushion's red, sewn in sections, pins standing in their
// crests with glass heads of every colour); nearer, a meadow of green felt with blanket stitch along its brow and two great
// pincushions sat in it, a strawberry hanging at one's side; in front, a meadow of button flowers on thread stems.
//
// Prior art: Hercules (PS1, 1997: its painted parallax); the tomato pincushion and its strawberry of emery (a Victorian sewing box's);
// Kirby's Epic Yarn's felt hills; Yoshi's Story's and Yoshi's Crafted World's papercraft meadows.
//
//   STOMP (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, skyBody, cloud, sun, hills, scatter, button, css, shade, cutOut, disc, poly, dabs, hatch, vwash } from './kit.js';

const HEADS = [0xc8606a, 0x2f7f7a, 0xd6a32a, 0xe9dcc0, 0x5a6ab0, 0x7a1424, 0x8aa070];

/** A pin standing up from y0 to a glass head at y1 (a cut-out of its own: drawn before the ground it stands in). */
function pin(g, x, y0, y1, r, col, px, lean = 0) {
  const p = new Path2D(), xt = x + lean; poly(p, [[x - 0.05, y0], [xt - 0.05, y1], [xt + 0.05, y1], [x + 0.05, y0]]); disc(p, xt, y1, r);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0xb8c0c8); g.fillRect(Math.min(x, xt) - 0.2, y0, Math.abs(lean) + 0.4, y1 - y0);
    const gr = g.createRadialGradient(xt - r * 0.35, y1 + r * 0.35, r * 0.05, xt, y1, r); gr.addColorStop(0, css(shade(col, 0.6))); gr.addColorStop(1, css(shade(col, -0.2)));
    g.fillStyle = gr; g.beginPath(); g.arc(xt, y1, r, 0, Math.PI * 2); g.fill();
  }, { px, kw: 1.8, lift: 3 });
}
/** Things standing up out of a strip, placed before it is painted: n of them, each (x, rand) -> fn, tiled across its ends. */
function standing(P, n, reach, fn) {
  const R = P.R;
  for (let i = 0; i < n; i++) { const at = R() * P.w, a = R(), b = R(), c = R(); P.tile(at, reach, (x) => fn(x, a, b, c, i)); }
}

/** The pincushion hills: tomato-red domes sewn in sections, pins in their crests. */
const CUSHIONS = hills({ id: 'cushions', w: 46, h: 10.5, base: 4.8, terms: [[2, 1.6, 0.2], [5, 0.7, 1.4], [9, 0.25, 0.6]], cols: [0xe07a74, 0xc8505a, 0x8a2a34], detail(g, P, prof) {
  g.strokeStyle = css(0x5a1820, 0.45); g.lineWidth = P.px * 3;
  for (let x = 0; x < P.w; x += 2.3) { g.beginPath(); g.moveTo(x, prof(x)); g.quadraticCurveTo(x + 0.8, prof(x) * 0.5, x + 0.3, -0.5); g.stroke(); }
  dabs(g, P.R, { x: -1, y: 0, w: P.w + 2, h: P.h, n: 260, r: [0.1, 0.3], cols: [0xf0a098, 0xffffff], alpha: [0.08, 0.2] });
} });
const cushionPaint = CUSHIONS.paint;
CUSHIONS.paint = (g, P) => {
  standing(P, 30, 0.5, (x, a, b, c) => { const y0 = CUSHIONS.profile(x) - 0.4; pin(g, x, y0, y0 + 0.9 + a * 0.9, 0.22 + b * 0.1, HEADS[(c * HEADS.length) | 0], P.px, (a - 0.5) * 0.5); });
  cushionPaint(g, P);
};

/** The felt meadow: green felt in rolls, blanket stitch along its brow. */
const FELT = hills({ id: 'felt', w: 38, h: 5.6, base: 2.6, terms: [[1, 0.6, 0.9], [3, 0.5, 2.4], [7, 0.15, 0.1]], cols: [0xa8bc78, 0x8aa070, 0x5a7444], detail(g, P, prof) {
  g.strokeStyle = css(0xe9dcc0, 0.9); g.lineWidth = P.px * 3;
  for (let x = -1; x < P.w + 1; x += 0.35) { const y = prof(x) - 0.12; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 0.32); g.moveTo(x, y - 0.02); g.lineTo(x + 0.35, prof(x + 0.35) - 0.14); g.stroke(); }
  hatch(g, -1, 0, P.w + 1, 1.4, { gap: 0.2, angle: 0.5, lw: P.px * 2, a: 0.14 });
} });

/** A tomato pincushion: sewn sections, a felt crown of leaves, pins in it; with a strawberry of emery hung at its side. */
function pincushion(w, h, berry) {
  return { w, h, paint(g, P) {
    const R = P.R, cx = berry ? w * 0.42 : w / 2, rw = (berry ? w * 0.42 : w * 0.48), rh = h * 0.36, cy = rh * 0.95;
    for (let i = 0; i < 7; i++) { const a = R(), b = R(), c = R(), x = cx + (i - 3) * rw * 0.22; pin(g, x, cy + rh * 0.5, cy + rh + h * (0.08 + a * 0.12), h * (0.03 + b * 0.012), HEADS[(c * HEADS.length) | 0], P.px, (i - 3) * 0.12); }
    const body = disc(new Path2D(), cx, cy, rw, rh);
    cutOut(g, body, (g) => {
      const gr = g.createRadialGradient(cx - rw * 0.3, cy + rh * 0.4, rw * 0.1, cx, cy, rw); gr.addColorStop(0, css(0xf08a80)); gr.addColorStop(0.6, css(0xc8505a)); gr.addColorStop(1, css(0x6a1a24));
      g.fillStyle = gr; g.fillRect(cx - rw, cy - rh, rw * 2, rh * 2);
      g.strokeStyle = css(0x4a1018, 0.55); g.lineWidth = P.px * 3.5;
      for (let k = -3; k <= 3; k++) { g.beginPath(); g.ellipse(cx, cy, Math.abs(k) * rw * 0.3 + 0.01, rh, 0, 0, Math.PI * 2); g.stroke(); }
      dabs(g, R, { x: cx - rw, y: cy - rh, w: rw * 2, h: rh * 2, n: 80, r: [0.08, 0.25], cols: [0xffb0a8, 0x8a2a34], alpha: [0.1, 0.25] });
    }, { px: P.px });
    const leaves = new Path2D(); for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.175); poly(leaves, [[cx, cy + rh * 0.92], [cx + Math.cos(a - 0.25) * rw * 0.25, cy + rh * 0.92 + Math.sin(a - 0.25) * rh * 0.2], [cx + Math.cos(a) * rw * 0.42, cy + rh * 0.92 + Math.sin(a) * rh * 0.32], [cx + Math.cos(a + 0.25) * rw * 0.25, cy + rh * 0.92 + Math.sin(a + 0.25) * rh * 0.2]]); }
    cutOut(g, leaves, (g) => { vwash(g, cx - rw, cy, rw * 2, rh * 1.5, [[0, 0x4a6a34], [1, 0x8aa070]]); }, { px: P.px, lift: 2 });
    if (berry) {
      const bx = w * 0.88, by = h * 0.18, s = Math.min(w * 0.1, 0.9), sp = new Path2D();
      sp.moveTo(bx, by - s * 1.2); sp.bezierCurveTo(bx + s * 1.1, by - s * 0.2, bx + s * 0.9, by + s * 0.9, bx, by + s * 0.8); sp.bezierCurveTo(bx - s * 0.9, by + s * 0.9, bx - s * 1.1, by - s * 0.2, bx, by - s * 1.2); sp.closePath();
      const tx = cx + rw * 0.9; poly(sp, [[bx - 0.05, by + s * 0.7], [tx - 0.05, cy], [tx + 0.05, cy], [bx + 0.05, by + s * 0.7]]);
      cutOut(g, sp, (g) => { g.fillStyle = css(0xd04a4a); g.fillRect(bx - s * 1.2, by - s * 1.3, s * 2.4, s * 2.4); g.fillStyle = css(0x2a6a3a); g.fillRect(Math.min(bx, tx) - 0.1, by + s * 0.6, Math.abs(bx - tx) + 0.2, cy); g.fillStyle = css(0xf6e2a0); for (let k = 0; k < 14; k++) { g.beginPath(); g.arc(bx + (R() - 0.5) * s * 1.2, by + (R() - 0.6) * s * 1.4, Math.max(P.px * 2, 0.04), 0, Math.PI * 2); g.fill(); } }, { px: P.px, lift: 2 });
    }
  } };
}

/** The button meadow: felt grass in blades, flowers of buttons on thread stems standing out of it. */
const MEADOW = hills({ id: 'meadow', w: 30, h: 4.1, base: 0.95, terms: [[5, 0.12, 0.2], [23, 0.09, 1.3], [41, 0.06, 0.7]], cols: [0x9ab878, 0x6e8c4c, 0x46602e], detail(g, P) {
  g.fillStyle = css(0x3e5628, 0.35); for (let x = -1; x < P.w + 1; x += 0.22) g.fill(poly(new Path2D(), [[x, 0], [x + 0.11, 0.7 + ((x * 7.3) % 0.4)], [x + 0.2, 0]]));
} });
const meadowPaint = MEADOW.paint;
MEADOW.paint = (g, P) => {
  standing(P, 22, 0.6, (x, a, b, c, i) => {
    const top = 1.4 + a * 1.6, r = 0.22 + b * 0.22, col = HEADS[(c * HEADS.length) | 0], stem = poly(new Path2D(), [[x - 0.05, 0.4], [x - 0.05, top], [x + 0.05, top], [x + 0.05, 0.4]]);
    poly(stem, [[x, top * 0.55], [x + 0.32, top * 0.55 + 0.25], [x + 0.36, top * 0.55 + 0.12], [x + 0.05, top * 0.5]]);
    cutOut(g, stem, (g) => { g.fillStyle = css(0x4a6a34); g.fillRect(x - 0.4, 0, 0.8, top); }, { px: P.px, kw: 1.8, lift: 2 });
    button(g, x, top + r * 0.7, r, col, i % 2 ? 2 : 4, P.px);
  });
  meadowPaint(g, P);
};

export const STOMP = {
  air: 0xd4dcd0,
  layers: [
    { id: 'sky', ...LAYER.sky,
      body: { px: 240, paint: skyBody({ stops: [[0, 0xfbe8c4], [0.25, 0xeef0dc], [0.55, 0xb0d6e2], [1, 0x6eaed0]], glow: { x: 0.3, y: 0.55, r: 22, c: 0xfff0b0, a: 0.4 },
        banks: [{ y: [0.4, 0.62], cols: [0xffffff, 0xf4f0e4], n: 3 }] }) },
      sprites: { sun: sun(2.6, [0xfff0b0, 0xf6c850, 0xe09a3a]), c1: cloud(9, 3.2), c2: cloud(12, 3.8), c3: cloud(7, 2.6) },
      place: ({ lane, ext, R }) => {
        const out = [{ s: 'sun', x: lane.len * 0.3, y: 7.6 }];
        scatter(R, ext.x0, ext.x1, 17, 5, (x, i) => out.push({ s: ['c1', 'c2', 'c3'][i % 3], x, y: 7.5 + R() * 4.5, flip: R() < 0.5 }));
        return out;
      } },
    { id: 'far', ...LAYER.far, strips: [CUSHIONS] },
    { id: 'mid', ...LAYER.mid, strips: [FELT], sprites: { big: pincushion(9.5, 6.6, true), small: pincushion(5.4, 3.9, false) },
      place: ({ ext, R, stripY }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 19, 5, (x, i) => out.push({ s: i % 2 ? 'small' : 'big', x, y: stripY(x) - (i % 2 ? 0.9 : 1.4), back: true, flip: R() < 0.5 }));
        return out;
      } },
    { id: 'near', ...LAYER.near, strips: [MEADOW] },
  ],
};
