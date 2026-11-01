// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE NOH STAGE: a stage's backdrop as a Noh theatre (South, 2026-11-01: "lots of japanese theatre
// references and motifs ... like Noh theater"; a theme for flats/build.js). Calm and spare where kabuki (flats/kabuki.js) is loud:
//   the mirror board  the kagami-ita, the back wall of every Noh stage: pale hinoki planks with the old pine (oimatsu) painted across
//                     them, its trunk bent low and its needles in flat cloud-shaped pads, young bamboo at the side panel
//   the bridge        far off, the hashigakari: the covered bridge the actors come down, its rail and roof, the five-coloured curtain
//                     (agemaku) at its far end, and its three small pines before it
//   the stage         nearer, the stage's hinoki pillars under the line of its roof's eave, a Noh mask on a stand between two
//                     (ko-omote, the young woman, white; hannya, the jealous demon, horned)
//   the gravel        nearest, the white pebble border (shirasu) the stage stands in, a stepping stone and a young pine in a pot
//
// Prior art: the kagami-ita's oimatsu (every Noh stage's, the Kanze and Hosho stages'; ihcsacafe-en.ihcsa.or.jp, "Noh 1"), the
// hashigakari and its three pines (ichi-, ni-, san-no-matsu), the agemaku's five colours (green, yellow, red, white, purple: the five
// elements, one school's order); Kano-school pine painting (flat needle pads on a gold or wood ground); the house's flats' kit.
//
//   NOH (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, scatter, css, shade, cutOut, poly, disc, dabs, hatch, vwash, INK } from './kit.js';
import { rect } from './brush.js';

const HINOKI = 0xe2c596, GRAIN = 0xc9a46e, PINE = 0x2f5236, PINE_LIT = 0x5a7f4a, BARK = 0x4a3426, ROOF = 0x3e3a36;
const AGEMAKU = [0x2f6b4e, 0xe8c23a, 0xb3202a, 0xf4f1ea, 0x5b3a7a];

/** The mirror board: hinoki planks floor to beam, their grain, the pale wash of the hall's light on them. */
function mirrorBoard(g, P) {
  const { w, h, R } = P;
  vwash(g, -2, 0, w + 4, h, [[0, shade(HINOKI, -0.18)], [0.5, HINOKI], [1, shade(HINOKI, -0.3)]]);
  for (let x = -2; x < w + 2; x += 0.9) {
    g.fillStyle = css(GRAIN, 0.35); g.fillRect(x, 0, 0.04, h);
    for (let k = 0; k < 4; k++) { const y = R() * h, l = 1 + R() * 3; g.fillStyle = css(GRAIN, 0.12 + R() * 0.12); g.fillRect(x + 0.1 + R() * 0.6, y, 0.03, l); }
  }
  const top = Math.min(h - 1, 15.5); g.fillStyle = css(shade(HINOKI, -0.45)); g.fillRect(-2, top, w + 4, 0.45); g.fillRect(-2, 0, w + 4, 0.3);
}

/** A pine's pad of needles: a flat cloud of dark green, its top lit, combed with the needles' strokes. */
function pad(g, R, cx, cy, rw, rh) {
  const p = new Path2D(); p.moveTo(cx - rw, cy);
  for (let a = Math.PI; a >= 0; a -= Math.PI / 6) p.quadraticCurveTo(cx + Math.cos(a + 0.26) * rw * 1.05, cy + Math.sin(a + 0.26) * rh * 1.35, cx + Math.cos(a) * rw, cy + Math.sin(a) * rh);
  p.quadraticCurveTo(cx, cy - rh * 0.5, cx - rw, cy);
  g.fillStyle = css(PINE); g.fill(p);
  g.save(); g.clip(p);
  vwash(g, cx - rw, cy - rh, rw * 2, cy + rh, [[0, shade(PINE, -0.35)], [0.55, PINE], [1, PINE_LIT]]);
  g.strokeStyle = css(PINE_LIT, 0.55); g.lineWidth = 0.035;
  for (let x = cx - rw; x < cx + rw; x += 0.12) { const y = cy + (R() - 0.2) * rh; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.06, y + 0.35); g.stroke(); }
  g.restore();
  g.strokeStyle = css(INK, 0.55); g.lineWidth = 0.05; g.stroke(p);
}

/** The old pine across the mirror board: a bent trunk, its limbs reaching both ways, the needle pads in tiers. */
const OLD_PINE = { w: 22, h: 12, paint(g, P) {
  const R = P.R, p = new Path2D();
  // the trunk: rising from the left of middle, leaning, kinked, its limbs sweeping out flat
  poly(p, [[8.6, 0], [10.2, 0], [10.6, 2.6], [11.8, 4.8], [11.2, 6.6], [12.4, 8.2], [11.6, 8.6], [10.4, 7.0], [10.8, 5.0], [9.4, 3.0]]);
  poly(p, [[11.0, 6.0], [16.0, 7.2], [19.8, 7.0], [19.8, 7.5], [15.6, 7.9], [11.2, 6.9]]);
  poly(p, [[10.4, 4.2], [6.0, 5.4], [2.4, 5.0], [2.4, 5.5], [6.2, 6.1], [10.5, 5.0]]);
  poly(p, [[11.8, 8.2], [14.2, 10.0], [16.0, 10.3], [16.0, 10.7], [13.8, 10.6], [11.6, 8.8]]);
  cutOut(g, p, (g) => {
    g.fillStyle = css(BARK); g.fillRect(0, 0, 22, 12);
    hatch(g, 0, 0, 22, 12, { gap: 0.22, angle: 1.3, lw: 0.05, col: 0x2a1c14, a: 0.5 });
    dabs(g, R, { x: 0, y: 0, w: 22, h: 12, n: 120, r: [0.1, 0.3], cols: [0x6a4a34, 0x2a1c14], alpha: [0.2, 0.45] });
  }, { px: P.px, kw: 1.4, lift: 2 });
  for (const [cx, cy, rw, rh] of [[3.2, 5.6, 2.4, 0.9], [6.8, 6.4, 2.1, 0.8], [18.6, 7.6, 2.6, 1.0], [15.0, 8.4, 2.2, 0.8], [15.6, 10.9, 2.0, 0.8], [12.0, 9.2, 1.6, 0.7], [10.4, 7.4, 1.3, 0.55], [8.0, 4.6, 1.2, 0.5]]) pad(g, R, cx, cy, rw, rh);
} };

/** Young bamboo on the side panel: green culms, joints, a few leaves. */
const BAMBOO = { w: 3, h: 11, paint(g, P) {
  const R = P.R;
  for (const [x, h] of [[0.6, 10.2], [1.4, 8.6], [2.2, 9.4]]) {
    const p = new Path2D(); rect(p, x - 0.09, 0, 0.18, h);
    cutOut(g, p, (g) => { vwash(g, x - 0.1, 0, 0.2, h, [[0, 0x5a7a3a], [1, 0x8aa85a]]); for (let y = 0.9; y < h; y += 1.1 + R() * 0.3) { g.fillStyle = css(0x3a5226); g.fillRect(x - 0.1, y, 0.2, 0.05); } }, { px: P.px, kw: 1.2, lift: 1 });
    for (let k = 0; k < 4; k++) { const y = h * (0.45 + R() * 0.5), s = R() < 0.5 ? -1 : 1, q = new Path2D(); poly(q, [[x, y], [x + s * 0.9, y - 0.25], [x + s * 0.8, y - 0.05]]); g.fillStyle = css(0x4f7f3a); g.fill(q); }
  }
} };

/** The bridge: its rail and posts, its roof over it, the five-coloured curtain at its end, seen from the side. */
const BRIDGE = { w: 18, h: 5.4, paint(g, P) {
  const p = new Path2D(); rect(p, 0, 0, 18, 1.1); poly(p, [[-0.2, 3.8], [18.2, 4.6], [18.2, 5.3], [-0.2, 4.5]]); rect(p, 15.6, 1.0, 2.2, 3.2);
  for (let x = 0.3; x < 15.4; x += 2.5) rect(p, x, 1.0, 0.16, 3.0);
  cutOut(g, p, (g) => {
    g.fillStyle = css(HINOKI); g.fillRect(0, 0, 18, 1.1); g.fillStyle = css(shade(HINOKI, -0.3)); g.fillRect(0, 0.9, 18, 0.12); g.fillRect(0, 0.45, 18, 0.06);
    g.fillStyle = css(ROOF); g.fillRect(-1, 3.7, 20, 2); g.fillStyle = css(shade(ROOF, 0.3)); for (let x = 0; x < 18; x += 0.3) g.fillRect(x, 3.8 + x * 0.045, 0.08, 0.6);
    g.fillStyle = css(shade(HINOKI, -0.2)); for (let x = 0.3; x < 15.4; x += 2.5) g.fillRect(x, 1.0, 0.16, 3.0);
    AGEMAKU.forEach((c, i) => { g.fillStyle = css(c); g.fillRect(15.6, 1.0 + (4 - i) * 0.64, 2.2, 0.64); }); // (striped across, bottom to top)
    g.strokeStyle = css(INK, 0.3); g.lineWidth = 0.03; for (let x = 15.8; x < 17.8; x += 0.3) { g.beginPath(); g.moveTo(x, 1.0); g.lineTo(x + 0.05, 4.2); g.stroke(); }
  }, { px: P.px, kw: 1.4 });
} };

/** One of the bridge's three small pines: a young pine in the gravel, its pads small. */
const SMALL_PINE = { w: 2.4, h: 2.6, paint(g, P) {
  const p = new Path2D(); poly(p, [[1.1, 0], [1.3, 0], [1.4, 1.2], [1.2, 1.8], [1.0, 1.2]]);
  cutOut(g, p, (g) => { g.fillStyle = css(BARK); g.fillRect(0, 0, 2.4, 2.6); }, { px: P.px, kw: 1.2, lift: 1 });
  for (const [cx, cy, rw, rh] of [[1.2, 1.4, 1.0, 0.36], [0.8, 1.9, 0.6, 0.26], [1.5, 2.2, 0.6, 0.25]]) pad(g, P.R, cx, cy, rw, rh);
} };

/** A stage pillar of hinoki under the roof's eave (its bracket and a length of the eave on top). */
const PILLAR = { w: 3.2, h: 9.2, paint(g, P) {
  const p = new Path2D(); rect(p, 1.3, 0, 0.6, 8.2); poly(p, [[0, 8.2], [3.2, 8.2], [3.2, 9.2], [0, 9.0]]); rect(p, 1.0, 7.8, 1.2, 0.4);
  cutOut(g, p, (g) => {
    vwash(g, 1.3, 0, 0.6, 8.2, [[0, shade(HINOKI, -0.25)], [1, HINOKI]]); g.fillStyle = css(shade(HINOKI, 0.12)); g.fillRect(1.36, 0, 0.12, 8.2);
    g.fillStyle = css(shade(HINOKI, -0.35)); g.fillRect(1.0, 7.8, 1.2, 0.4); g.fillStyle = css(ROOF); g.fillRect(0, 8.2, 3.2, 1.1);
    g.fillStyle = css(shade(ROOF, 0.35)); for (let x = 0.1; x < 3.2; x += 0.32) g.fillRect(x, 8.3, 0.1, 0.5);
  }, { px: P.px, kw: 1.5 });
} };

/** A Noh mask on its stand: the young woman (white, her brows painted high) or the demon (horned, gilded eyes). */
function mask(kind) {
  return { w: 1.4, h: 2.8, paint(g, P) {
    const p = new Path2D(); rect(p, 0.64, 0, 0.12, 1.6); rect(p, 0.3, 0, 0.8, 0.12); disc(p, 0.7, 2.0, 0.42, 0.56);
    if (kind === 'hannya') { poly(p, [[0.36, 2.35], [0.12, 2.8], [0.42, 2.5]]); poly(p, [[1.04, 2.35], [1.28, 2.8], [0.98, 2.5]]); }
    cutOut(g, p, (g) => {
      g.fillStyle = css(0x3a2a20); g.fillRect(0, 0, 1.4, 1.6);
      const face = kind === 'hannya' ? 0xe8d8a0 : 0xf6efe2; g.fillStyle = css(face); g.beginPath(); g.ellipse(0.7, 2.0, 0.42, 0.56, 0, 0, Math.PI * 2); g.fill();
      if (kind === 'hannya') { g.fillStyle = css(0xd8b84a); g.fillRect(0.12, 2.35, 1.16, 0.45); g.fillStyle = css(0xe8d8a0); g.beginPath(); g.ellipse(0.7, 2.0, 0.42, 0.56, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = css(INK); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(0.7 + s * 0.17, 2.12, 0.07, kind === 'hannya' ? 0.06 : 0.03, 0, 0, Math.PI * 2); g.fill(); }
      if (kind === 'hannya') { g.fillStyle = css(0xd8b84a); for (const s of [-1, 1]) { g.beginPath(); g.arc(0.7 + s * 0.17, 2.12, 0.03, 0, Math.PI * 2); g.fill(); } g.fillStyle = css(0x7a1424); g.fillRect(0.46, 1.62, 0.48, 0.12); g.fillStyle = css(0xf6efe2); for (let x = 0.5; x < 0.92; x += 0.08) g.fillRect(x, 1.66, 0.04, 0.06); }
      else { g.fillStyle = css(INK, 0.6); for (const s of [-1, 1]) g.fillRect(0.7 + s * 0.17 - 0.06, 2.38, 0.12, 0.04); g.fillStyle = css(0xb8202a); g.fillRect(0.64, 1.72, 0.12, 0.05); }
    }, { px: P.px, kw: 1.3, lift: 2 });
  } };
}

/** A sprite drawn smaller: its painter run in a scaled frame. */
const shrink = (sp, k) => ({ w: sp.w * k, h: sp.h * k, paint(g, P) { g.save(); g.scale(k, k); sp.paint(g, { ...P, w: sp.w, h: sp.h, px: P.px / k }); g.restore(); } });

/** The white gravel border: rounded pebbles in a low band, a few dark ones. */
const GRAVEL = { w: 6, h: 0.7, paint(g, P) {
  const R = P.R, p = new Path2D(); poly(p, [[0, 0], [0, 0.45], [1.5, 0.55], [3, 0.5], [4.5, 0.58], [6, 0.46], [6, 0]]);
  cutOut(g, p, (g) => { g.fillStyle = css(0xe6e2d8); g.fillRect(0, 0, 6, 0.7); dabs(g, R, { x: 0, y: 0, w: 6, h: 0.6, n: 140, r: [0.04, 0.09], cols: [0xf6f4ee, 0xb8b4aa, 0xd0ccc2, 0x8a8680], alpha: [0.5, 0.95], squash: 0.75 }); }, { px: P.px, kw: 1.1, lift: 1 });
} };

/** A young pine in a glazed pot, set on the gravel. */
const POTTED_PINE = { w: 1.8, h: 2.2, paint(g, P) {
  const p = new Path2D(); poly(p, [[0.4, 0], [1.4, 0], [1.55, 0.6], [0.25, 0.6]]);
  cutOut(g, p, (g) => { g.fillStyle = css(0x2a4a6a); g.fillRect(0, 0, 1.8, 0.6); g.fillStyle = css(0xe8e0cc, 0.5); g.fillRect(0.3, 0.35, 1.2, 0.06); }, { px: P.px, kw: 1.2, lift: 1 });
  const q = new Path2D(); poly(q, [[0.85, 0.6], [0.98, 0.6], [1.05, 1.3], [0.9, 1.6], [0.8, 1.3]]); cutOut(g, q, (g) => { g.fillStyle = css(BARK); g.fillRect(0, 0, 2, 2); }, { px: P.px, kw: 1, lift: 0 });
  for (const [cx, cy, rw, rh] of [[0.9, 1.35, 0.7, 0.26], [1.1, 1.8, 0.48, 0.2]]) pad(g, P.R, cx, cy, rw, rh);
} };

export const NOH = {
  air: 0x7a6248,
  layers: [
    { id: 'sky', ...LAYER.sky, body: { px: 200, paint: mirrorBoard }, sprites: { bamboo: BAMBOO },
      place: ({ ext, R }) => { const out = []; scatter(R, ext.x0, ext.x1, 26, 3, (x) => out.push({ s: 'bamboo', x, y: 0.3 })); return out; } },
    { id: 'far', ...LAYER.far, hazeA: 0.16, sprites: { pine: OLD_PINE, bridge: BRIDGE, small: SMALL_PINE },
      place: ({ lane, ext, R }) => {
        // the old pine every 46 m from the stage's middle (the mirror board's one picture, met wherever you stand), the bridge between
        const out = [], c = lane.len / 2;
        for (let x = c - Math.ceil((c - ext.x0) / 46) * 46; x < ext.x1 + 23; x += 46) {
          out.push({ s: 'pine', x, y: 0.2 }); out.push({ s: 'bridge', x: x + 23, y: 0 }); [-6, -1, 4].forEach((d) => out.push({ s: 'small', x: x + 23 + d, y: 0 }));
        }
        return out;
      } },
    { id: 'mid', ...LAYER.mid, hazeA: 0.1, sprites: { pillar: PILLAR, ko: shrink(mask('ko'), 0.6), hannya: shrink(mask('hannya'), 0.6) },
      place: ({ ext, R }) => { const out = []; scatter(R, ext.x0, ext.x1, 9, 1.2, (x, i) => { out.push({ s: 'pillar', x, y: 0, back: true }); if (i % 3 === 1) out.push({ s: i % 2 ? 'hannya' : 'ko', x: x + 4.5, y: 0 }); }); return out; } },
    { id: 'near', ...LAYER.near, light: [[0.95, 0.9, 0.84], [0.82, 0.8, 0.78]], sprites: { gravel: GRAVEL, pot: POTTED_PINE },
      place: ({ ext, R }) => { const out = []; for (let x = ext.x0; x < ext.x1; x += 5.6) out.push({ s: 'gravel', x, y: 0 }); scatter(R, ext.x0, ext.x1, 14, 3, (x) => out.push({ s: 'pot', x, y: 0.3 })); return out; } },
  ],
};
