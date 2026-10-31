// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE RUN: harvest country behind The Run (a theme for flats/build.js). The sky drop a warm afternoon
// with a big painted sun and cut-out clouds hung across it; far off, hills in a patchwork of fields and hedgerows, cypresses, a windmill
// whose sails turn; nearer, a ridge of standing wheat with haystacks, stooks and a scarecrow (Strawman's country cousin, a sack for a
// head); in front, a ground row of straw with wheat ears, a post-and-rail fence, a great haystack. The wall-run flat is dressed as a
// wall of stacked bales, straw end out, its twine across them (the flat stays where it stands).
//
// Prior art: Hercules (PS1, 1997) and its first stage's warm hills; Pollock's pastoral back scenes; Van Gogh's wheat fields and haystacks
// (the stroke laid along the straw).
//
//   RUN (a theme: { air, layers, wallRun })
// ---------------------------------------------------------------------------------------
import { LAYER, skyBody, cloud, sun, hills, haystack, cypress, scatter, css, cutOut, disc, poly, dabs, strokes, hatch, vwash } from './kit.js';

const GOLD = [0xf0c860, 0xd9a336, 0xb07a22], STRAW = [0xf3d27a, 0xd8a840, 0xb98528, 0xffe9a8];

/** The windmill's tower: a tapered, whitewashed body on a stone foot, its cap, a door and a window (its sails turn on their own). */
const windmill = { w: 6, h: 11, paint(g, P) {
  const p = poly(new Path2D(), [[1.2, 0], [1.9, 8.4], [1.4, 8.4], [3, 10.6], [4.6, 8.4], [4.1, 8.4], [4.8, 0]]);
  cutOut(g, p, (g) => {
    vwash(g, 0, 0, 6, 11, [[0, 0xc9b49a], [0.75, 0xf2e6cc], [1, 0x9a4a32]]);
    g.fillStyle = css(0x8a3c2a); g.fillRect(0, 8.3, 6, 3);
    dabs(g, P.R, { x: 1, y: 0, w: 4, h: 8.3, n: 120, r: [0.08, 0.25], cols: [0xfff6e2, 0xb8a080], alpha: [0.15, 0.35] });
    hatch(g, 3.4, 0, 5, 8.4, { gap: 0.22, angle: 1.3, lw: P.px * 2.2, a: 0.22 });
    g.fillStyle = css(0x4a2c18); g.fillRect(2.6, 0, 0.8, 1.6); g.fillRect(2.75, 5.2, 0.5, 0.7);
  }, { px: P.px });
} };
/** Four lattice sails on a hub, cloth on two of them (a sprite that turns about its middle). */
const sails = { w: 10, h: 10, paint(g, P) {
  const c = 5, p = new Path2D();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    poly(p, [[c + nx * 0.12, c + ny * 0.12], [c + ca * 4.9 + nx * 0.12, c + sa * 4.9 + ny * 0.12], [c + ca * 4.9 + nx * 1.1, c + sa * 4.9 + ny * 1.1], [c + ca * 1.2 + nx * 1.1, c + sa * 1.2 + ny * 1.1], [c + ca * 1.2 - nx * 0.12, c + sa * 1.2 - ny * 0.12]]);
  }
  disc(p, c, c, 0.45);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0xe9dcc0); g.fillRect(0, 0, 10, 10);
    g.strokeStyle = css(0x6b4226); g.lineWidth = P.px * 4;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
      g.beginPath(); g.moveTo(c, c); g.lineTo(c + ca * 4.9, c + sa * 4.9); g.stroke();
      for (let r = 1.6; r < 4.9; r += 0.75) { g.beginPath(); g.moveTo(c + ca * r, c + sa * r); g.lineTo(c + ca * r + nx * 1.1, c + sa * r + ny * 1.1); g.stroke(); }
      if (i % 2) { g.fillStyle = css(0xc8b89a, 0.6); g.beginPath(); g.moveTo(c + ca * 1.2, c + sa * 1.2); g.lineTo(c + ca * 4.9, c + sa * 4.9); g.lineTo(c + ca * 4.9 + nx * 1.1, c + sa * 4.9 + ny * 1.1); g.lineTo(c + ca * 1.2 + nx * 1.1, c + sa * 1.2 + ny * 1.1); g.fill(); }
    }
    g.fillStyle = css(0x4a2c18); g.beginPath(); g.arc(c, c, 0.45, 0, Math.PI * 2); g.fill();
  }, { px: P.px, lift: 3 });
} };
/** A scarecrow: a sack head with stitched eyes and a straw hat, a burlap coat on a crossbar, straw at its cuffs. */
const scarecrow = { w: 3.2, h: 4.6, paint(g, P) {
  const p = new Path2D();
  poly(p, [[1.5, 0], [1.5, 2.8], [1.7, 2.8], [1.7, 0]]);
  poly(p, [[0.1, 2.75], [3.1, 2.9], [3.1, 3.2], [2.2, 3.25], [2.15, 1.6], [1.05, 1.6], [1.0, 3.25], [0.1, 3.1]]);
  disc(p, 1.6, 3.65, 0.5, 0.55);
  poly(p, [[0.85, 3.95], [2.35, 3.95], [1.95, 4.15], [1.75, 4.6], [1.45, 4.6], [1.25, 4.15]]);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x6b4226); g.fillRect(1.5, 0, 0.2, 2.8);
    vwash(g, 0, 1.6, 3.2, 3.3, [[0, 0x7d5e36], [1, 0xb8945e]]);
    hatch(g, 0, 1.6, 3.2, 3.3, { gap: 0.1, angle: 0.7, lw: P.px * 2, a: 0.25 });
    g.fillStyle = css(0xd9b98a); g.beginPath(); g.ellipse(1.6, 3.65, 0.5, 0.55, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = css(0x2a1a12, 0.9); g.lineWidth = P.px * 3;
    for (const x of [1.4, 1.8]) { g.beginPath(); g.moveTo(x - 0.08, 3.62); g.lineTo(x + 0.08, 3.78); g.moveTo(x - 0.08, 3.78); g.lineTo(x + 0.08, 3.62); g.stroke(); }
    g.beginPath(); g.moveTo(1.35, 3.38); g.quadraticCurveTo(1.6, 3.3, 1.85, 3.38); g.stroke();
    vwash(g, 0.8, 3.95, 1.6, 4.6, [[0, 0xc89030], [1, 0xf0d070]]);
    strokes(g, P.R, { x: 0, y: 2.6, w: 0.35, h: 0.6, n: 20, len: [0.2, 0.4], lw: P.px * 2.4, cols: STRAW, lean: 1.4 });
    strokes(g, P.R, { x: 2.85, y: 2.6, w: 0.35, h: 0.6, n: 20, len: [0.2, 0.4], lw: P.px * 2.4, cols: STRAW, lean: 1.4 });
  }, { px: P.px });
} };
/** A stook: sheaves leaned together, bound at the waist. */
const stook = { w: 1.6, h: 2.3, paint(g, P) {
  const p = poly(new Path2D(), [[0.05, 0], [0.6, 1.5], [0.35, 2.3], [0.8, 1.95], [1.25, 2.3], [1.0, 1.5], [1.55, 0]]);
  cutOut(g, p, (g) => { vwash(g, 0, 0, 1.6, 2.3, [[0, 0xb07a22], [1, 0xf0d070]]); strokes(g, P.R, { x: 0, y: 0, w: 1.6, h: 2.3, n: 140, len: [0.3, 0.7], lw: P.px * 2.2, cols: STRAW, lean: 0.25 }); g.fillStyle = css(0x6b4226); g.fillRect(0.4, 1.35, 0.8, 0.12); }, { px: P.px });
} };
/** A post-and-rail fence, weathered. */
const fence = { w: 5, h: 1.9, paint(g, P) {
  const p = new Path2D();
  for (const x of [0.3, 2.5, 4.7]) poly(p, [[x - 0.16, 0], [x - 0.16, 1.75], [x, 1.9], [x + 0.16, 1.75], [x + 0.16, 0]]);
  poly(p, [[0, 1.2], [5, 1.3], [5, 1.5], [0, 1.42]]); poly(p, [[0, 0.55], [5, 0.62], [5, 0.84], [0, 0.78]]);
  cutOut(g, p, (g) => { vwash(g, 0, 0, 5, 1.9, [[0, 0x6b4226], [1, 0xa87a4a]]); strokes(g, P.R, { x: 0, y: 0, w: 5, h: 1.9, n: 60, len: [0.3, 1], lw: P.px * 2, cols: [0x4a2c18, 0xc89a5c], alpha: [0.2, 0.45], lean: 1.5, bend: 0.02 }); }, { px: P.px });
} };

/** The far hills' patchwork: bands of field under each crest in harvest colours, hedgerows between them, dots of trees. */
function patchwork(g, P, prof) {
  const R = P.R, cols = [0xd9b45a, 0xa8b46a, 0xe6cf8e, 0x8f9c58, 0xc9a24a, 0xb7a878];
  for (let x = -1; x < P.w + 1; x += 2.5 + R() * 3) {
    const x1 = x + 3 + R() * 4;
    for (let j = 0, d = 0.5; j < 5; j++) {
      const d1 = d + 0.6 + R() * 0.9, pts = [];
      for (let u = x; u <= x1 + 0.01; u += 0.5) pts.push([u, prof(u) - d]);
      for (let u = x1; u >= x - 0.01; u -= 0.5) pts.push([u, prof(u) - d1]);
      g.fillStyle = css(cols[(R() * cols.length) | 0], 0.75); g.fill(poly(new Path2D(), pts));
      g.strokeStyle = css(0x4f5a2c, 0.55); g.lineWidth = P.px * 3; g.beginPath(); for (let u = x; u <= x1; u += 0.5) { if (u === x) g.moveTo(u, prof(u) - d1); else g.lineTo(u, prof(u) - d1); } g.stroke();
      d = d1;
    }
  }
  dabs(g, R, { x: -1, y: 0, w: P.w + 2, h: P.h * 0.7, n: 90, r: [0.15, 0.35], cols: [0x4a5a2a, 0x5f6a34], alpha: [0.5, 0.8], squash: 1 });
}
/** The wheat ridge: stalks stroked up from the furrows, ears catching the light along the crest. */
function wheat(g, P, prof) {
  const R = P.R;
  for (let y = 0.3; y < P.h; y += 0.55) { g.strokeStyle = css(0x8a5a1c, 0.25); g.lineWidth = P.px * 3; g.beginPath(); g.moveTo(-1, y); g.lineTo(P.w + 1, y + 0.1); g.stroke(); }
  strokes(g, R, { x: -1, y: 0, w: P.w + 2, h: P.h, n: Math.round(P.w * P.h * 9), len: [0.3, 0.7], lw: P.px * 2.6, cols: STRAW, alpha: [0.35, 0.75], lean: 0.18 });
  for (let x = -1; x < P.w + 1; x += 0.18) { const y = prof(x) - 0.15 - R() * 0.25; g.fillStyle = css(STRAW[(R() * 4) | 0], 0.85); g.beginPath(); g.ellipse(x, y, 0.07, 0.17, 0.2, 0, Math.PI * 2); g.fill(); }
}

/** The near ground row of straw: a wavy bank, wheat ears standing up out of it (cut-outs of their own). */
const STRAW_ROW = hills({ id: 'straw', w: 32, h: 3.4, base: 1.05, terms: [[3, 0.18, 0.4], [7, 0.1, 1.9], [13, 0.06, 0.2]], cols: [0xf0cf72, 0xcf9c34, 0x9a6a1c], detail(g, P) {
  strokes(g, P.R, { x: -1, y: -0.2, w: P.w + 2, h: 1.6, n: 1300, len: [0.2, 0.5], lw: P.px * 2.4, cols: STRAW, alpha: [0.4, 0.9], lean: 0.5 });
} });
const strawPaint = STRAW_ROW.paint;
STRAW_ROW.paint = (g, P) => {
  const R = P.R;
  for (let i = 0; i < 26; i++) {
    const at = R() * P.w, rise = 0.4 + R() * 0.8;
    P.tile(at, 0.6, (x) => {
    const top = STRAW_ROW.profile(x) + rise, p = poly(new Path2D(), [[x - 0.06, 0.5], [x - 0.06, top], [x - 0.16, top + 0.05], [x, top + 0.62], [x + 0.16, top + 0.05], [x + 0.06, top], [x + 0.06, 0.5]]);
    cutOut(g, p, (g) => { vwash(g, x - 0.2, 0.5, 0.4, top + 0.6, [[0, 0xb07a22], [1, 0xf6dc8a]]); g.strokeStyle = css(0x9a6a1c, 0.6); g.lineWidth = P.px * 2; for (let y = top + 0.1; y < top + 0.55; y += 0.12) { g.beginPath(); g.moveTo(x - 0.1, y); g.lineTo(x, y + 0.06); g.lineTo(x + 0.1, y); g.stroke(); } }, { px: P.px, kw: 1.8, lift: 3 });
    });
  }
  strawPaint(g, P);
};

export const RUN = {
  air: 0xe4d6bc,
  layers: [
    { id: 'sky', ...LAYER.sky,
      body: { px: 240, paint: skyBody({ stops: [[0, 0xf4d6a0], [0.12, 0xeedcbc], [0.3, 0xb6d2dc], [0.55, 0x86b2cc], [1, 0x5a94bc]], glow: { x: 0.68, y: 0.5, r: 30, c: 0xffe2a0, a: 0.55 },
        banks: [{ y: [0.42, 0.62], cols: [0xfff4e0, 0xf6e2c4], n: 3 }, { y: [0.7, 0.95], cols: [0xeef4f4, 0xd4e4ec], n: 2, a: [0.06, 0.16] }] }) },
      sprites: { sun: sun(3.1), c1: cloud(12, 4), c2: cloud(8, 3), c3: cloud(15, 4.6) },
      place: ({ lane, ext, R }) => {
        const out = [{ s: 'sun', x: lane.len * 0.68, y: 6.3 }];
        scatter(R, ext.x0, ext.x1, 24, 7, (x, i) => out.push({ s: ['c1', 'c2', 'c3'][i % 3], x, y: 8 + R() * 4.5, flip: R() < 0.5 }));
        return out;
      } },
    { id: 'far', ...LAYER.far,
      strips: [hills({ id: 'fields', w: 50, h: 9, base: 4.6, terms: [[1, 1.4, 0.3], [2, 0.9, 2.1], [5, 0.35, 0.8]], cols: [0xc8b46a, 0xa59a58, 0x7e7a44], detail: patchwork })],
      sprites: { mill: windmill, sails, cy: cypress(1.4, 5.2) },
      place: ({ lane, ext, R, stripY }) => {
        let mx = lane.len * 0.5;
        for (let x = lane.len * 0.5; x < lane.len * 0.64; x += 0.5) if (stripY(x) < stripY(mx)) mx = x;
        const k = 0.75, my = stripY(mx) - 1, out = [{ s: 'mill', x: mx, y: my, scale: k, back: true }, { s: 'sails', x: mx, y: my + (9.2 - 5) * k, scale: k, spin: 0.35, back: true }];
        scatter(R, ext.x0, ext.x1, 13, 6, (x) => { if (Math.abs(x - mx) > 5) out.push({ s: 'cy', x, y: stripY(x) - 0.9, scale: 0.7 + R() * 0.5, back: true }); });
        return out;
      } },
    { id: 'mid', ...LAYER.mid,
      strips: [hills({ id: 'wheat', w: 40, h: 5, base: 2.6, terms: [[1, 0.5, 1.2], [3, 0.35, 0.2], [6, 0.12, 2.5]], cols: GOLD, detail: wheat })],
      sprites: { stack: haystack(4.6, 3.8, { mustard: 0xd6a32a, walnut: 0x6b4226 }), stook, crow: scarecrow },
      place: ({ ext, R, stripY }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 15, 5, (x, i) => {
          const y = stripY(x) - 0.7;
          if (i % 4 === 2) out.push({ s: 'crow', x, y: y + 0.1, flip: R() < 0.5 });
          else out.push({ s: 'stack', x, y, scale: 0.8 + R() * 0.35, flip: R() < 0.5 });
          out.push({ s: 'stook', x: x + 3 + R() * 2, y: stripY(x + 4) - 0.5, scale: 0.8 + R() * 0.3 });
        });
        return out;
      } },
    { id: 'near', ...LAYER.near,
      strips: [STRAW_ROW],
      sprites: { stack: haystack(5.4, 4.3, { mustard: 0xd6a32a, walnut: 0x6b4226 }), fence },
      place: ({ ext, R }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 21, 6, (x, i) => out.push(i % 2 ? { s: 'fence', x, y: 0.1, back: true, flip: R() < 0.5 } : { s: 'stack', x, y: -0.1, back: true, scale: 0.85 + R() * 0.3 }));
        return out;
      } },
  ],
  /** The wall-run flat: bales stacked like brick, their straw ends out, twine round each. */
  wallRun(g, P) {
    const { w, h, R } = P, p = poly(new Path2D(), [[0, 0], [0, h], [w, h], [w, 0]]);
    cutOut(g, p, (g) => {
      vwash(g, 0, 0, w, h, [[0, 0xb98528], [1, 0xe9c467]]);
      const bh = h / 4;
      for (let row = 0; row < 4; row++) {
        const off = row % 2 ? -0.9 : 0;
        for (let x = off; x < w; x += 1.8) {
          const y = row * bh, bx = Math.max(0, x);
          g.fillStyle = css(row % 2 ? 0xdcb054 : 0xd2a446); g.fillRect(bx + 0.05, y + 0.05, Math.min(1.7, x + 1.8 - bx) - 0.1, bh - 0.1);
          strokes(g, R, { x: bx, y, w: 1.7, h: bh, n: 70, len: [0.15, 0.4], lw: P.px * 2.2, cols: STRAW, alpha: [0.45, 0.9], lean: 1.4, bend: 0.3 });
          g.fillStyle = css(0x6b4226, 0.9); for (const t of [0.35, 0.65]) g.fillRect(bx, y + bh * t - 0.04, Math.min(1.8, w - bx), 0.08);
          g.strokeStyle = css(0x5a3a1a, 0.6); g.lineWidth = P.px * 3; g.strokeRect(bx + 0.05, y + 0.05, 1.7, bh - 0.1);
        }
      }
      dabs(g, R, { x: 0, y: 0, w, h: h * 0.3, n: 80, r: [0.2, 0.5], cols: [0x6a4418], alpha: [0.08, 0.18] });
    }, { px: P.px, lift: 0 });
  },
};

