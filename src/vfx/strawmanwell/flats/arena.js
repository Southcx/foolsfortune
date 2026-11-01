// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE ARENA: the platform fighter's stage as a rehearsal (South, 2026-11-01: "go wild on theatre
// rehearsal themes"; a theme for flats/build.js). The show is not up yet: the work lights are on and the backdrop is half painted.
//   the hall    the theatre's own back wall, bare: dark brick in its courses, the fly gallery's rail along the top, tall arched
//               windows of frosted glass with the night outside (cool against the stage's amber), pools of work light on the brick
//   the flat    far off, the backdrop being painted for the show, stood in its frame: the scene squared up in chalk (the scenic
//               painter's grid), its charcoal cartoon drawn over the whole of it (a sunrise over a floating island with three ledges:
//               the stage the fight is rehearsed on, as the show will dress it), the left of it already in colour and the right still
//               raw canvas, a drip or two run down, a ladder against it and pots of paint at its foot
//   the clutter nearer, the stuff of a rehearsal: a costume rail of gowns and jackets, flats stacked against the wall with their backs
//               to us (bracing, stencilled marks), a stepladder with its paint pots and brushes, the piano under a dust sheet
//   the house   nearest, the rehearsal's own seats: a row of folding chairs, the director's chair and the music stands
//
// Prior art: the scenic painter's paint frame and the squared-up cartoon (the paint shop of every theatre, the "paint frame" and the
// boomerang), the rehearsal room and the ghost light's stage (the house's own work lights), Pollock's flats seen from behind (the wings'
// theme, flats/wings.js), Noises Off (the set as seen at rehearsal); the house's flats' kit and brush (flats/kit.js, flats/brush.js).
//
//   ARENA (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, scatter, css, shade, cutOut, poly, dabs, hatch, vwash, INK } from './kit.js';
import { rect } from './brush.js';

const BRICK = 0x5a2e22, MORTAR = 0x3a1e18, CANVAS = 0xe8dcc0, CHALK = 0xf4efe2, TIMBER = 0x9a7048;
const SHOW = [0xf6c87a, 0xe88a5a, 0x9cc4d8, 0x6a8ab8, 0x8aa070]; // (the colours the show's backdrop is being painted in: a sunrise over sea)

/** The hall's back wall: brick courses, the fly gallery's rail, pools of work light. */
function hallWall(g, P) {
  const { w, h, R } = P;
  vwash(g, -2, 0, w + 4, h, [[0, 0x3a1c16], [0.35, 0x4a2418], [0.75, 0x2c1612], [1, 0x160b0a]]);
  for (let y = 0, row = 0; y < h; y += 0.7, row++) {
    g.fillStyle = css(MORTAR, 0.55); g.fillRect(-2, y, w + 4, 0.07);
    for (let x = (row % 2) * 0.75 - 2; x < w + 2; x += 1.5) {
      g.fillStyle = css(shade(BRICK, (R() - 0.5) * 0.25), 0.55); g.fillRect(x + 0.04, y + 0.08, 1.42, 0.58);
      g.fillStyle = css(MORTAR, 0.5); g.fillRect(x, y, 0.07, 0.7);
    }
  }
  for (const gx of [0.18, 0.5, 0.82]) { const gr = g.createRadialGradient(gx * w, 4, 0, gx * w, 4, 9); gr.addColorStop(0, css(0xffd6a0, 0.26)); gr.addColorStop(1, css(0xffd6a0, 0)); g.fillStyle = gr; g.fillRect(gx * w - 10, -2, 20, 16); }
  const top = Math.min(h - 1, 17); g.fillStyle = css(0x120806); g.fillRect(-2, top, w + 4, 0.5); g.fillStyle = css(0x2a1810); g.fillRect(-2, top - 1.6, w + 4, 0.12);
  for (let x = 0; x < w; x += 1.2) { g.fillStyle = css(0x2a1810); g.fillRect(x, top - 1.6, 0.08, 1.6); }
}

/** A tall arched window of frosted glass with the night outside, in a timber frame of small panes. */
const WINDOW = { w: 3.2, h: 6.4, paint(g) {
  const p = new Path2D(); poly(p, [[0.2, 0.2], [0.2, 4.6], [3.0, 4.6], [3.0, 0.2]]); p.moveTo(0.2, 4.6); p.arc(1.6, 4.6, 1.4, Math.PI, 0, true);
  cutOut(g, p, (g) => {
    vwash(g, 0, 0, 3.2, 6.4, [[0, 0x2a3a5a], [0.6, 0x4a6a8a], [1, 0x9cb8d0]]);
    const moon = g.createRadialGradient(2.2, 5.0, 0, 2.2, 5.0, 1.2); moon.addColorStop(0, css(0xeaf2ff, 0.7)); moon.addColorStop(1, css(0xeaf2ff, 0)); g.fillStyle = moon; g.fillRect(0, 3.5, 3.2, 3);
    g.fillStyle = css(0x2a1a12); for (const x of [1.1, 2.1]) g.fillRect(x - 0.04, 0, 0.08, 6.2); for (let y = 0.2; y < 6; y += 0.9) g.fillRect(0, y, 3.2, 0.08);
  }, { kw: 1.6 });
} };

/** The backdrop on its paint frame: squared up in chalk, its cartoon in charcoal over all of it, the left already in colour. */
const CARTOON = { w: 34, h: 15, paint(g, P) {
  const R = P.R, W = 34, H = 15, x0 = 0.6, y0 = 1.0, x1 = W - 0.6, y1 = H - 0.6, cw = x1 - x0, ch = y1 - y0;
  const p = new Path2D(); rect(p, 0, 0.4, W, H - 0.4);
  cutOut(g, p, (g) => {
    g.fillStyle = css(TIMBER); g.fillRect(0, 0, W, H);
    g.fillStyle = css(CANVAS); g.fillRect(x0, y0, cw, ch);
    // the painted part: the left half washed in the show's colours, its edge ragged where the painter stopped
    g.save(); const edge = new Path2D(); edge.moveTo(x0, y0); for (let y = y0; y <= y1; y += 0.6) edge.lineTo(x0 + cw * 0.46 + (R() - 0.5) * 2.4, y); edge.lineTo(x0, y1); edge.closePath(); g.clip(edge);
    vwash(g, x0, y0, cw, y1, [[0, 0x6a8ab8], [0.32, 0x9cc4d8], [0.55, 0xf6c87a], [0.7, 0xe88a5a], [1, 0x7a5aa0]]);
    const sunG = g.createRadialGradient(x0 + cw * 0.3, y0 + ch * 0.55, 0, x0 + cw * 0.3, y0 + ch * 0.55, 3.2); sunG.addColorStop(0, css(0xfff0c0)); sunG.addColorStop(1, css(0xf6c87a, 0)); g.fillStyle = sunG; g.fillRect(x0, y0, cw, ch);
    dabs(g, R, { x: x0, y: y0 + ch * 0.62, w: cw * 0.5, h: ch * 0.25, n: 40, r: [0.5, 1.6], cols: [0xfbe8d0, 0xf0b0a0], alpha: [0.25, 0.55], squash: 0.25, tilt: 0 });
    g.restore();
    // drips run down from the painted edge
    for (let i = 0; i < 7; i++) { const x = x0 + cw * (0.2 + R() * 0.28), y = y0 + ch * (0.2 + R() * 0.6), len = 0.6 + R() * 1.6; g.fillStyle = css(SHOW[i % SHOW.length], 0.8); g.fillRect(x, y - len, 0.08, len); }
    // the chalk grid the painter squared it up by, over all of it
    g.strokeStyle = css(CHALK, 0.55); g.lineWidth = 0.04;
    for (let x = x0; x <= x1 + 0.01; x += cw / 12) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
    for (let y = y0; y <= y1 + 0.01; y += ch / 5) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    // the cartoon in charcoal: the horizon, the sun's disc and rays, the floating island and its three ledges, a few clouds
    g.strokeStyle = css(INK, 0.75); g.lineWidth = 0.07; g.lineCap = 'round';
    const line = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x0 + x * cw + (R() - 0.5) * 0.04, y0 + y * ch) : g.moveTo(x0 + x * cw, y0 + y * ch))); g.stroke(); };
    line([[0, 0.3], [1, 0.3]]);
    g.beginPath(); g.arc(x0 + cw * 0.3, y0 + ch * 0.55, 2.2, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI, r0 = 2.6, r1 = 3.6 + (i % 2) * 0.6; line([[0.3 + (Math.cos(a) * r0) / cw, 0.55 + (Math.sin(a) * r0) / ch], [0.3 + (Math.cos(a) * r1) / cw, 0.55 + (Math.sin(a) * r1) / ch]]); }
    line([[0.42, 0.42], [0.88, 0.42], [0.82, 0.3], [0.74, 0.16], [0.66, 0.1], [0.58, 0.16], [0.5, 0.3], [0.42, 0.42]]);
    for (const [a, b, y] of [[0.48, 0.58, 0.58], [0.72, 0.82, 0.58], [0.6, 0.7, 0.74]]) line([[a, y], [b, y], [b - 0.01, y - 0.03], [a + 0.01, y - 0.03], [a, y]]);
    for (const [cx, cy] of [[0.12, 0.82], [0.62, 0.88], [0.9, 0.76]]) { g.beginPath(); for (let k = 0; k < 4; k++) g.arc(x0 + (cx + k * 0.02) * cw, y0 + cy * ch, 0.6, Math.PI, 0, true); g.stroke(); }
    hatch(g, x0 + cw * 0.5, y0 + ch * 0.12, x0 + cw * 0.86, y0 + ch * 0.4, { gap: 0.35, col: INK, a: 0.22, lw: 0.04 });
    // the frame's timber, its bolts
    g.fillStyle = css(shade(TIMBER, -0.25)); for (const x of [0, W - 0.6]) g.fillRect(x, 0, 0.6, H); g.fillRect(0, 0.4, W, 0.6); g.fillRect(0, H - 0.6, W, 0.6);
  });
} };

/** A ladder leaned on the flat. */
const LADDER = { w: 2.4, h: 10, paint(g) {
  const p = new Path2D(); poly(p, [[0.1, 0], [1.6, 10], [2.2, 10], [0.7, 0]]);
  cutOut(g, p, (g) => {
    g.strokeStyle = css(0xc89a5c); g.lineWidth = 0.14;
    for (const dx of [0.2, 0.62]) { g.beginPath(); g.moveTo(0.2 + dx, 0); g.lineTo(1.7 + dx, 10); g.stroke(); }
    for (let t = 0.06; t < 1; t += 0.09) { const x = 0.4 + t * 1.5, y = t * 10; g.beginPath(); g.moveTo(x - 0.05, y); g.lineTo(x + 0.47, y); g.stroke(); }
  }, { kw: 1.4 });
} };

/** Pots of the show's paint and a bucket of brushes. */
const POTS = { w: 3.6, h: 1.4, paint(g) {
  const p = new Path2D(); [0.1, 0.9, 1.7, 2.5].forEach((x, i) => rect(p, x, 0, 0.7 + (i === 3 ? 0.3 : 0), 0.7 + (i % 2) * 0.25));
  cutOut(g, p, (g) => {
    [0.1, 0.9, 1.7, 2.5].forEach((x, i) => {
      const w = 0.7 + (i === 3 ? 0.3 : 0), h = 0.7 + (i % 2) * 0.25;
      g.fillStyle = css(0xb8c0c8); g.fillRect(x, 0, w, h); g.fillStyle = css(SHOW[i]); g.fillRect(x, h - 0.12, w, 0.12); g.fillRect(x + w * 0.4, h * 0.4, 0.12, h * 0.6);
    });
    g.strokeStyle = css(0xc89a5c); g.lineWidth = 0.06; for (const a of [-0.3, 0, 0.35]) { g.beginPath(); g.moveTo(3.0, 0.9); g.lineTo(3.0 + Math.sin(a) * 0.5, 1.35); g.stroke(); }
  }, { kw: 1.4 });
} };

/** The costume rail: gowns and jackets on hangers. */
const RAIL = { w: 5.2, h: 3.6, paint(g, P) {
  const R = P.R, cols = [0x7a1424, 0x2f7f7a, 0xd6a32a, 0x5a6ab0, 0xc8606a, 0x8aa070, 0xe9dcc0];
  const p = new Path2D(); rect(p, 0.1, 3.0, 5.0, 0.1); for (const x of [0.2, 4.9]) rect(p, x - 0.05, 0, 0.1, 3.1);
  const clothes = []; for (let x = 0.5; x < 4.8; x += 0.42 + R() * 0.2) clothes.push({ x, w: 0.5 + R() * 0.3, h: 1.6 + R() * 1.0, c: cols[(R() * cols.length) | 0], gown: R() < 0.5 });
  for (const c of clothes) poly(p, c.gown ? [[c.x, 3.0], [c.x - c.w * 0.4, 3.0 - c.h * 0.4], [c.x - c.w, 3.0 - c.h], [c.x + c.w, 3.0 - c.h], [c.x + c.w * 0.4, 3.0 - c.h * 0.4]] : [[c.x - c.w * 0.6, 2.95], [c.x - c.w * 0.6, 3.0 - c.h * 0.7], [c.x + c.w * 0.6, 3.0 - c.h * 0.7], [c.x + c.w * 0.6, 2.95]]);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x3a3a40); g.fillRect(0, 0, 5.2, 3.6);
    for (const c of clothes) {
      g.fillStyle = css(c.c); const q = new Path2D(); poly(q, c.gown ? [[c.x, 3.0], [c.x - c.w * 0.4, 3.0 - c.h * 0.4], [c.x - c.w, 3.0 - c.h], [c.x + c.w, 3.0 - c.h], [c.x + c.w * 0.4, 3.0 - c.h * 0.4]] : [[c.x - c.w * 0.6, 2.95], [c.x - c.w * 0.6, 3.0 - c.h * 0.7], [c.x + c.w * 0.6, 3.0 - c.h * 0.7], [c.x + c.w * 0.6, 2.95]]); g.fill(q);
      g.fillStyle = css(shade(c.c, -0.3), 0.6); g.fillRect(c.x - 0.03, 3.0 - c.h * 0.7, 0.06, c.h * 0.6);
    }
  }, { kw: 1.6 });
} };

/** Flats stacked against the wall, their backs to us: raw canvas, toggle rails and corner blocks, a stencilled mark. */
const STACK = { w: 6.4, h: 7.2, paint(g, P) {
  const R = P.R, p = new Path2D(); for (let i = 0; i < 3; i++) poly(p, [[i * 0.5, 0], [i * 0.5 + 0.6, 7.2 - i * 0.6], [i * 0.5 + 4.8, 7.2 - i * 0.6], [i * 0.5 + 4.2, 0]]);
  cutOut(g, p, (g) => {
    for (let i = 2; i >= 0; i--) {
      const q = new Path2D(); poly(q, [[i * 0.5, 0], [i * 0.5 + 0.6, 7.2 - i * 0.6], [i * 0.5 + 4.8, 7.2 - i * 0.6], [i * 0.5 + 4.2, 0]]);
      g.fillStyle = css(shade(CANVAS, -0.15 - i * 0.08)); g.fill(q);
      g.strokeStyle = css(TIMBER); g.lineWidth = 0.18; g.stroke(q);
      g.beginPath(); g.moveTo(i * 0.5 + 0.3, 3.4 - i * 0.3); g.lineTo(i * 0.5 + 4.5, 3.4 - i * 0.3); g.stroke();
      g.beginPath(); g.moveTo(i * 0.5 + 0.3, 0.3); g.lineTo(i * 0.5 + 2.6, 3.3 - i * 0.3); g.stroke();
    }
    g.fillStyle = css(INK, 0.6); for (let k = 0; k < 3; k++) { g.fillRect(2.0 + k * 0.5, 5.2, 0.32, 0.5 + (R() < 0.5 ? 0.2 : 0)); }
  }, { kw: 1.6 });
} };

/** The piano under its dust sheet. */
const PIANO = { w: 4.4, h: 3.0, paint(g) {
  const p = new Path2D(); p.moveTo(0.1, 0); p.lineTo(0.2, 2.2); p.quadraticCurveTo(0.6, 2.9, 2.2, 2.85); p.quadraticCurveTo(4.0, 2.8, 4.2, 2.0); p.lineTo(4.3, 0); p.closePath();
  cutOut(g, p, (g) => {
    vwash(g, 0, 0, 4.4, 3, [[0, 0xb8b0a0], [1, 0xe9e1d0]]);
    g.strokeStyle = css(0x8a8070, 0.5); g.lineWidth = 0.05; for (const x of [0.8, 1.6, 2.4, 3.3]) { g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 0.3, 1.4, x - 0.1, 2.7); g.stroke(); }
  }, { kw: 1.6 });
} };

/** A folding chair, the director's canvas chair, a music stand (the house of the rehearsal). */
const CHAIR = { w: 1.2, h: 2.0, paint(g) {
  const p = new Path2D(); rect(p, 0.1, 1.0, 1.0, 0.1); rect(p, 0.15, 1.1, 0.9, 0.8); poly(p, [[0.1, 0], [0.2, 0], [1.0, 1.0], [0.9, 1.0]]); poly(p, [[1.0, 0], [1.1, 0], [0.3, 1.0], [0.2, 1.0]]);
  cutOut(g, p, (g) => { g.fillStyle = css(0x3a3a44); g.fillRect(0, 0, 1.2, 2); g.fillStyle = css(0x5a5a68); g.fillRect(0.2, 1.2, 0.8, 0.6); }, { kw: 1.4 });
} };
const DIRECTOR = { w: 1.8, h: 2.6, paint(g) {
  const p = new Path2D(); rect(p, 0.15, 0, 0.12, 2.5); rect(p, 1.53, 0, 0.12, 2.5); rect(p, 0.15, 1.7, 1.5, 0.7); rect(p, 0.15, 1.0, 1.5, 0.14); poly(p, [[0.15, 0], [0.27, 0], [1.65, 1.0], [1.53, 1.0]]);
  cutOut(g, p, (g) => { g.fillStyle = css(TIMBER); g.fillRect(0, 0, 1.8, 2.6); g.fillStyle = css(0x7a1424); g.fillRect(0.2, 1.72, 1.4, 0.66); g.fillStyle = css(0xd6a32a); g.fillRect(0.6, 1.95, 0.6, 0.2); }, { kw: 1.4 });
} };
const STAND = { w: 0.9, h: 2.2, paint(g) {
  const p = new Path2D(); rect(p, 0.42, 0, 0.06, 1.6); poly(p, [[0.0, 1.55], [0.9, 1.55], [0.82, 2.15], [0.08, 2.15]]); poly(p, [[0.1, 0], [0.45, 0.3], [0.8, 0], [0.45, 0.1]]);
  cutOut(g, p, (g) => { g.fillStyle = css(0x24242a); g.fillRect(0, 0, 0.9, 2.2); g.fillStyle = css(CANVAS); g.fillRect(0.14, 1.62, 0.62, 0.48); g.fillStyle = css(INK, 0.4); for (let y = 1.7; y < 2.05; y += 0.08) g.fillRect(0.2, y, 0.5, 0.02); }, { kw: 1.2 });
} };

/** A sprite drawn k times its painting's size (its painting kept in its own metres). */
const shrink = (sp, k) => ({ w: sp.w * k, h: sp.h * k, paint(g, P) { g.save(); g.scale(k, k); sp.paint(g, { ...P, w: sp.w, h: sp.h }); g.restore(); } });

export const ARENA = {
  air: 0x5a3828,
  layers: [
    { id: 'sky', ...LAYER.sky, body: { px: 200, paint: hallWall }, sprites: { win: WINDOW },
      place: ({ ext, R }) => { const out = []; scatter(R, ext.x0, ext.x1, 13, 1, (x) => out.push({ s: 'win', x, y: 8.5 })); return out; } },
    { id: 'far', ...LAYER.far, hazeA: 0.2, sprites: { flat: CARTOON, ladder: LADDER, pots: POTS },
      place: ({ lane }) => [{ s: 'flat', x: lane.len / 2, y: 0.2 }, { s: 'ladder', x: lane.len / 2 + 6, y: 0 }, { s: 'pots', x: lane.len / 2 + 9.5, y: 0 }, { s: 'pots', x: lane.len / 2 - 12, y: 0, flip: true }] },
    { id: 'mid', ...LAYER.mid, hazeA: 0.12, sprites: { rail: RAIL, stack: shrink(STACK, 0.72), piano: PIANO, ladder: LADDER },
      place: ({ ext, R }) => {
        const out = [], kinds = ['rail', 'stack', 'piano', 'rail', 'stack'];
        scatter(R, ext.x0, ext.x1, 11, 2.5, (x, i) => out.push({ s: kinds[i % kinds.length], x, y: 0, flip: R() < 0.5, back: true }));
        return out;
      } },
    { id: 'near', ...LAYER.near, light: [[0.8, 0.72, 0.66], [0.6, 0.55, 0.55]], sprites: { chair: shrink(CHAIR, 0.48), director: shrink(DIRECTOR, 0.5), stand: shrink(STAND, 0.62) },
      place: ({ lane, ext, R }) => {
        const out = [{ s: 'director', x: lane.len / 2 + 2.2, y: 0 }, { s: 'stand', x: lane.len / 2 - 0.6, y: 0 }];
        scatter(R, ext.x0, ext.x1, 1.4, 0.3, (x, i) => { if (Math.abs(x - lane.len / 2) > 3.6 && i % 7 !== 3) out.push({ s: i % 9 === 5 ? 'stand' : 'chair', x, y: 0, flip: R() < 0.3 }); });
        return out;
      } },
  ],
};
