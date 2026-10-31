// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE BRAWL: a painted arena behind The Brawl (a theme for flats/build.js). A sunset sky, the sun low
// and red behind the arena, streaks of cloud across it; far off, the arena's wall in two tiers of arches with pennants along its
// cornice; nearer, its stands packed with a crowd too far to tell apart, banners on poles in velvet and gold before them; in front,
// the front row of the crowd: straw dummies cut out of card (Strawman's troupe come to watch), sack heads and button eyes, arms up,
// pennants waved.
//
// Prior art: Super Smash Bros. Brawl's Subspace Emissary (its stages' painted backdrops, the arena under a sunset), Hercules (PS1, 1997:
// the arena of its later stages, its painted parallax); the Colosseum's tiers of arches; Pollock's crowd ground rows.
//
//   BRAWL (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, skyBody, cloud, sun, scatter, css, shade, cutOut, disc, poly, dabs, hatch, vwash } from './kit.js';

const CLOTH = [0x7a1424, 0x2f7f7a, 0xd6a32a, 0x5a6ab0, 0xc8606a, 0x8aa070, 0xb8945e, 0x6b4226];

/** The arena wall: two tiers of arches between pilasters, a cornice with pennants along it (12 bays a tile: it repeats). */
const ARCADE = { id: 'arcade', w: 36, h: 13.4, flip: false, profile: () => 10.6, paint(g, P) {
  const p = new Path2D(); poly(p, [[-1, -1], [-1, 10.6], [37, 10.6], [37, -1]]);
  for (let x = 0; x < 36; x += 1.5) poly(p, [[x + 0.15, 10.5], [x + 0.75, 12.6], [x + 1.35, 10.5]]);
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 38, 13.4, [[0, 0xa8865a], [0.7, 0xd8bc8c], [1, 0xc89a5c]]);
    for (let x = 0; x < 36; x += 1.5) { g.fillStyle = css(CLOTH[(x / 1.5) % 4 | 0]); g.fill(poly(new Path2D(), [[x + 0.15, 10.5], [x + 0.75, 12.6], [x + 1.35, 10.5]])); }
    for (const [y0, y1] of [[0.6, 5.2], [6.2, 9.3]]) {
      for (let x = 0; x < 36; x += 3) {
        const a = new Path2D(), cx = x + 1.5, r = 0.95; a.moveTo(cx - r, y0); a.lineTo(cx - r, y1 - r); a.arc(cx, y1 - r, r, Math.PI, 0, true); a.lineTo(cx + r, y0); a.closePath();
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, css(0xd07a5a)); gr.addColorStop(0.5, css(0x6a2a4a)); gr.addColorStop(1, css(0x2a1430)); g.fillStyle = gr; g.fill(a);
        g.strokeStyle = css(0x4a2a1a, 0.8); g.lineWidth = P.px * 4; g.stroke(a);
        g.fillStyle = css(0xe8d0a4, 0.6); g.fillRect(x - 0.2, y0, 0.4, y1 - y0);
      }
      g.fillStyle = css(0x8a6a44); g.fillRect(-1, y1 + 0.05, 38, 0.45); g.fillStyle = css(0xf0dcb0, 0.7); g.fillRect(-1, y1 + 0.42, 38, 0.1);
    }
    dabs(g, P.R, { x: -1, y: 0, w: 38, h: 10.6, n: 420, r: [0.15, 0.5], cols: [0xf0dcb0, 0x8a6a44, 0xb8946a], alpha: [0.08, 0.2] });
    hatch(g, -1, 0, 37, 0.6, { gap: 0.12, angle: 0.4, lw: P.px * 2, a: 0.2 });
  }, { px: P.px });
} };

/** The stands: a bank of tiers packed with a crowd too far off to tell one from another (a strip that repeats). */
const STANDS = { id: 'stands', w: 40, h: 6.6, flip: true, profile: () => 5.6, paint(g, P) {
  const R = P.R, p = new Path2D(); poly(p, [[-1, -1], [-1, 5.4], [41, 5.4], [41, -1]]);
  for (let x = -0.6; x < 41; x += 0.55) disc(p, x + (R() - 0.5) * 0.1, 5.55 + R() * 0.1, 0.24);
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 42, 6.6, [[0, 0x3a1a28], [1, 0x7a4a4a]]);
    for (let row = 0, y = 0.45; y < 5.8; row++, y += 0.55) {
      g.fillStyle = css(0x2a1420, 0.6); g.fillRect(-1, y - 0.3, 42, 0.08);
      for (let x = -0.6 + (row % 2) * 0.27; x < 41; x += 0.55) { g.fillStyle = css(CLOTH[(R() * CLOTH.length) | 0], 0.9); g.beginPath(); g.ellipse(x, y - 0.14, 0.24, 0.16, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = css(0xd8b888); g.beginPath(); g.arc(x, y + 0.08, 0.15, 0, Math.PI * 2); g.fill(); }
    }
    g.fillStyle = css(0x7a1424); g.fillRect(-1, 0, 42, 0.5); g.fillStyle = css(0xe2b04a); g.fillRect(-1, 0.42, 42, 0.12);
  }, { px: P.px });
} };

/** A banner on its pole: swallowtailed velvet trimmed in gold, an emblem of a ring and a star (no words). */
function banner(w, h, cloth) {
  return { w, h, paint(g, P) {
    const p = new Path2D(), bx = 0.35, bw = w - 0.6, by = h - 4.6;
    poly(p, [[0.12, 0], [0.12, h - 0.2], [0.3, h], [0.48, h - 0.2], [0.48, 0]]);
    poly(p, [[bx, h - 0.5], [bx + bw, h - 0.5], [bx + bw, by], [bx + bw / 2, by + 0.8], [bx, by]]);
    cutOut(g, p, (g) => {
      g.fillStyle = css(0x6b4226); g.fillRect(0, 0, 0.6, h); g.fillStyle = css(0xe2b04a); g.fillRect(0, h - 0.4, 0.6, 0.4);
      vwash(g, bx, by, bw, h - 0.5, [[0, shade(cloth, -0.35)], [1, shade(cloth, 0.12)]]);
      g.strokeStyle = css(0xe2b04a); g.lineWidth = P.px * 5; g.stroke(poly(new Path2D(), [[bx + 0.15, h - 0.65], [bx + bw - 0.15, h - 0.65], [bx + bw - 0.15, by + 0.2], [bx + bw / 2, by + 0.95], [bx + 0.15, by + 0.2]]));
      const cx = bx + bw / 2, cy = by + 2.5; g.lineWidth = P.px * 6; g.beginPath(); g.arc(cx, cy, 0.62, 0, Math.PI * 2); g.stroke();
      const st = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.17 : 0.42; st.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } g.fillStyle = css(0xe2b04a); g.fill(poly(new Path2D(), st));
      for (let x = bx; x < bx + bw; x += 0.25) { g.fillStyle = css(0xe2b04a); g.fillRect(x, h - 0.55, 0.12, 0.1); }
      hatch(g, bx + bw * 0.6, by, bx + bw, h, { gap: 0.12, angle: 1.4, lw: P.px * 2, a: 0.22 });
    }, { px: P.px });
  } };
}

/** The front row: straw dummies cut from card, burlap sack heads with button eyes, coats of every colour, arms up, pennants waved. */
const CROWD = { id: 'crowd', w: 30, h: 3.4, flip: true, profile: () => 1.9, paint(g, P) {
  const R = P.R, folk = [];
  for (let x = 0.2; x < 30; x += 0.95 + R() * 0.3) folk.push({ x, h: 1.35 + R() * 0.35, r: 0.36 + R() * 0.08, c: CLOTH[(R() * CLOTH.length) | 0], arm: R(), flag: CLOTH[(R() * CLOTH.length) | 0] });
  for (const f of folk) {
    if (f.arm < 0.45) {
      const ax = f.x + (f.arm < 0.22 ? -0.42 : 0.42), top = f.h + 0.9, a = poly(new Path2D(), [[ax - 0.09, f.h - 0.4], [ax - 0.09, top], [ax + 0.09, top], [ax + 0.09, f.h - 0.4]]);
      if (f.arm < 0.2) poly(a, [[ax + 0.05, top], [ax + 0.05, top + 0.55], [ax + 0.6, top + 0.3]]);
      cutOut(g, a, (g) => { g.fillStyle = css(shade(f.c, -0.1)); g.fillRect(ax - 0.3, f.h - 0.5, 0.6, 1.6); g.fillStyle = css(f.flag); g.fill(poly(new Path2D(), [[ax + 0.05, top], [ax + 0.05, top + 0.55], [ax + 0.6, top + 0.3]])); }, { px: P.px, kw: 1.8, lift: 3 });
    }
  }
  const body = new Path2D(); poly(body, [[-1, -1], [-1, 0.7], [31, 0.7], [31, -1]]);
  for (const f of folk) { const s = new Path2D(); s.moveTo(f.x + 0.48, 0); s.lineTo(f.x + 0.46, f.h - 0.55); s.quadraticCurveTo(f.x, f.h - 0.2, f.x - 0.46, f.h - 0.55); s.lineTo(f.x - 0.48, 0); s.closePath(); body.addPath(s); disc(body, f.x, f.h + 0.1, f.r, f.r * 1.08); }
  cutOut(g, body, (g) => {
    vwash(g, -1, 0, 32, 3.8, [[0, 0x2a1418], [1, 0x6a3a3a]]);
    for (const f of folk) {
      g.fillStyle = css(shade(f.c, -0.22)); g.fill(poly(new Path2D(), [[f.x - 0.48, 0], [f.x - 0.46, f.h - 0.55], [f.x, f.h - 0.3], [f.x + 0.46, f.h - 0.55], [f.x + 0.48, 0]]));
      g.fillStyle = css(0xc8a46a); g.beginPath(); g.ellipse(f.x, f.h + 0.1, f.r, f.r * 1.08, 0, 0, Math.PI * 2); g.fill();
      hatch(g, f.x - f.r, f.h - f.r, f.x + f.r, f.h + f.r * 1.2, { gap: 0.07, angle: 0.8, lw: P.px * 2, col: 0x8a6a3a, a: 0.25 });
      g.fillStyle = css(0x2a1a12); for (const dx of [-0.13, 0.13]) { g.beginPath(); g.arc(f.x + dx, f.h + 0.16, 0.075, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = css(0xe9c467, 0.9); g.lineWidth = P.px * 2.4; g.beginPath(); g.moveTo(f.x - f.r * 0.8, f.h - f.r * 0.55); g.lineTo(f.x + f.r * 0.8, f.h - f.r * 0.55); g.stroke();
    }
    g.fillStyle = css(0x7a1424); g.fillRect(-1, 0, 32, 0.55); g.fillStyle = css(0xe2b04a); g.fillRect(-1, 0.5, 32, 0.12);
  }, { px: P.px });
} };

export const BRAWL = {
  air: 0xc8a0a8,
  layers: [
    { id: 'sky', ...LAYER.sky,
      body: { px: 240, paint: skyBody({ stops: [[0, 0xffc878], [0.16, 0xf6a070], [0.42, 0xd06a7e], [0.72, 0x7a4282], [1, 0x2e1c4e]], glow: { x: 0.5, y: 0.2, r: 34, c: 0xffd890, a: 0.55 },
        banks: [{ y: [0.3, 0.55], cols: [0xffc0a0, 0xe08a8a], n: 3, r: [4, 10], squash: 0.12 }, { y: [0.6, 0.8], cols: [0xa06aa0, 0x8a5a9a], n: 2, r: [4, 9], squash: 0.12 }] }) },
      sprites: { sun: sun(4.2, [0xfff0c0, 0xf28a4a, 0xc0442e], 20), s1: cloud(18, 2.6, [0xf8c4a8, 0xd07a86, 0x7a4a7a]), s2: cloud(13, 2.2, [0xf0b0a0, 0xc06a80, 0x6a3a6a]) },
      place: ({ lane, ext, R }) => {
        const out = [{ s: 'sun', x: lane.len / 2, y: 1.2 }];
        scatter(R, ext.x0, ext.x1, 22, 7, (x, i) => out.push({ s: i % 2 ? 's1' : 's2', x, y: 8 + R() * 6, flip: R() < 0.5 }));
        return out;
      } },
    { id: 'far', ...LAYER.far, hazeA: 0.26, strips: [ARCADE] },
    { id: 'mid', ...LAYER.mid, hazeA: 0.34, strips: [STANDS], sprites: { b1: banner(3, 10, 0x7a1424), b2: banner(3, 9, 0x2f7f7a), b3: banner(3, 9.5, 0x5a6ab0) },
      place: ({ ext, R }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 9, 1.5, (x, i) => out.push({ s: ['b1', 'b2', 'b3'][i % 3], x, y: 2.2 + R() * 0.6, back: true, flip: i % 2 === 1 }));
        return out;
      } },
    // (the front row well down from the footlights' lift and the stands hazed back: a crowd near silhouette, so the dummies fought in
    // front of it and their percents stand out; measured against the combined look, where the first shade down still read as busy)
    { id: 'near', ...LAYER.near, light: [[0.56, 0.5, 0.5], [0.44, 0.4, 0.43]], strips: [CROWD] },
  ],
};
