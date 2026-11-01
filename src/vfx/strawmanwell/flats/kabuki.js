// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE KABUKI STAGE: a stage's backdrop as a kabuki play at its loudest (South, 2026-11-01: "lots of
// japanese theatre references and motifs"; a theme for flats/build.js). Where the Noh stage (flats/noh.js) is spare, this is the
// spectacle:
//   the drop       a painted backdrop of a great wave curling over a red Fuji under a sunset, Prussian blue and foam claws (the
//                  kakiwari's painted scenery, in Hokusai's manner), framed at the top by a border of hanging cherry blossom
//                  (tsurieda) and the three-striped curtain (joshiki-maku) drawn aside at each end
//   the castle     far off, a painted castle keep on its stone base among cut-out cherry trees in bloom
//   the lanterns   nearer, red paper lanterns (chochin) on stands, each with a crest in white, and a noren hung between posts
//   the waves      nearest, the wave boards (nami-ita): cut-out rows of breaking waves the stagehands hold for a sea scene,
//                  propped on their blocks across the stage's foot
//
// Prior art: the joshiki-maku's three stripes (black, persimmon and green: the Kabuki-za's; kyoto.travel, "Kabuki theater"), the
// tsurieda cherry border and kakiwari flats of any kabuki set, the nami-ita wave boards; Hokusai's Great Wave (c. 1831) and Red Fuji;
// Okami (Clover, 2006: its sumi-e and woodblock world); the house's flats' kit.
//
//   KABUKI (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, scatter, css, shade, cutOut, poly, disc, dabs, vwash, INK } from './kit.js';
import { rect } from './brush.js';

/** The curtain's three stripes, left to right as it hangs: black, persimmon, green. */
export const JOSHIKI = [0x1a1a1a, 0xa8502a, 0x2f5e4a];
const PRUSSIAN = 0x1f3a68, FOAM = 0xf4efe2, SAKURA = 0xf2b8c4, SAKURA_DEEP = 0xd8788c, LACQUER = 0xb3202a;

/** The painted drop: a sunset sky, a red Fuji, the great wave's curl and its foam claws, washes of the woodblock's flat colour. */
function drop(g, P) {
  const { w, h, R } = P;
  vwash(g, -2, 0, w + 4, h, [[0, 0xf2c890], [0.35, 0xf0a878], [0.7, 0x9ab8c8], [1, 0x5a7aa8]]);
  // Fuji, red, its snow, far off in the middle of each 40 m
  for (let cx = 20; cx < w + 40; cx += 40) {
    const p = new Path2D(); poly(p, [[cx - 9, 2], [cx - 1.2, 8.6], [cx + 1.2, 8.6], [cx + 9, 2]]);
    g.fillStyle = css(0xb8483a); g.fill(p);
    const s = new Path2D(); poly(s, [[cx - 2.6, 7.2], [cx - 1.2, 8.6], [cx + 1.2, 8.6], [cx + 2.6, 7.2], [cx + 1.6, 7.5], [cx + 0.6, 7.0], [cx - 0.4, 7.6], [cx - 1.6, 7.0]]);
    g.fillStyle = css(FOAM); g.fill(s);
  }
  // the great wave's curls, rising from the left of each 40 m, their bodies Prussian blue, combed with lighter lines, foam claws at the lip
  for (let cx = 6; cx < w + 40; cx += 40) {
    const body = new Path2D(); body.moveTo(cx - 6, 0); body.bezierCurveTo(cx - 6, 6, cx + 2, 11, cx + 8, 10); body.bezierCurveTo(cx + 11, 9.6, cx + 12, 8, cx + 10, 7.2);
    body.bezierCurveTo(cx + 8, 8.4, cx + 5, 7.6, cx + 5, 5.2); body.bezierCurveTo(cx + 5, 3, cx + 9, 1.4, cx + 14, 0); body.closePath();
    g.fillStyle = css(PRUSSIAN); g.fill(body);
    g.save(); g.clip(body); g.strokeStyle = css(0x5a7ab8, 0.7); g.lineWidth = 0.08;
    for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(cx - 5 + k * 0.6, 0); g.bezierCurveTo(cx - 4 + k * 0.6, 5, cx + 2 + k * 0.4, 9.4 - k * 0.2, cx + 8 - k * 0.1, 9.6 - k * 0.3); g.stroke(); }
    g.restore();
    g.fillStyle = css(FOAM);
    for (let k = 0; k < 9; k++) { const a = k / 9, x = cx + 4 + a * 7, y = 10 - a * a * 3.2; for (let c = 0; c < 3; c++) { g.beginPath(); g.arc(x + c * 0.22, y - c * 0.1, 0.22 - c * 0.05, 0, Math.PI * 2); g.fill(); } }
    dabs(g, R, { x: cx + 2, y: 8, w: 10, h: 4, n: 26, r: [0.06, 0.14], cols: [FOAM], alpha: [0.7, 1] });
  }
  // the hanging cherry border along the top, a curtain drawn aside at each 40 m's ends
  const top = Math.min(h - 0.5, 16);
  for (let x = -2; x < w + 2; x += 0.5) { const d = 0.6 + R() * 1.8; g.fillStyle = css(0x6a3a2a, 0.6); g.fillRect(x, top - d, 0.03, d); dabs(g, R, { x: x - 0.3, y: top - d - 0.4, w: 0.6, h: d + 0.4, n: 8, r: [0.1, 0.22], cols: [SAKURA, SAKURA_DEEP, 0xfbe8ec], alpha: [0.7, 0.95], squash: 0.9 }); }
  g.fillStyle = css(LACQUER); g.fillRect(-2, top, w + 4, 0.5);
}

/** The curtain drawn aside: its three stripes gathered in folds, tied back. */
const CURTAIN = { w: 4.2, h: 15, paint(g, P) {
  const p = new Path2D(); poly(p, [[0, 0], [0, 15], [4.2, 15], [3.2, 9], [1.8, 6.5], [2.6, 0]]);
  cutOut(g, p, (g) => {
    const sw = 4.2 / 3; JOSHIKI.forEach((c, i) => { g.fillStyle = css(c); g.fillRect(i * sw, 0, sw, 15); });
    g.fillStyle = css(INK, 0.25); for (let x = 0.4; x < 4.2; x += 0.7) g.fillRect(x, 0, 0.1, 15);
    g.fillStyle = css(0xd8b84a); g.fillRect(0, 6.2, 3.0, 0.22);
  }, { px: P.px, kw: 1.6 });
} };

/** A cherry tree in bloom: a dark trunk and limbs, a cloud of blossom cut out round them. */
const SAKURA_TREE = { w: 7, h: 7.5, paint(g, P) {
  const R = P.R, p = new Path2D(); poly(p, [[3.2, 0], [3.8, 0], [4.0, 3.0], [5.6, 4.6], [5.4, 4.9], [3.8, 3.8], [3.2, 4.4], [1.6, 5.0], [1.5, 4.7], [3.1, 3.6]]);
  const crown = new Path2D(); for (const [x, y, r] of [[1.6, 5.2, 1.6], [3.5, 6.0, 1.9], [5.4, 5.0, 1.5], [2.6, 4.2, 1.2], [4.6, 4.0, 1.2]]) disc(crown, x, y, r, r * 0.8);
  cutOut(g, p, (g) => { g.fillStyle = css(0x3a2420); g.fillRect(0, 0, 7, 7.5); }, { px: P.px, kw: 1.3, lift: 2 });
  cutOut(g, crown, (g) => { g.fillStyle = css(SAKURA); g.fillRect(0, 2, 7, 6); dabs(g, R, { x: 0, y: 2.6, w: 7, h: 5, n: 160, r: [0.1, 0.3], cols: [SAKURA_DEEP, 0xfbe8ec, 0xffffff], alpha: [0.4, 0.9], squash: 0.85 }); }, { px: P.px, kw: 1.3, lift: 2 });
} };

/** A painted castle keep on its sloping stone base, its roofs layered, gold fish at the ridge. */
const CASTLE = { w: 9, h: 9.5, paint(g, P) {
  const p = new Path2D(); poly(p, [[0.4, 0], [8.6, 0], [7.6, 2.6], [1.4, 2.6]]);
  const tiers = [[1.6, 7.4, 2.6, 4.4], [2.4, 6.6, 4.4, 6.0], [3.1, 5.9, 6.0, 7.4], [3.6, 5.4, 7.4, 8.6]];
  for (const [a, b, y0, y1] of tiers) { rect(p, a, y0, b - a, y1 - y0 - 0.5); poly(p, [[a - 0.8, y1 - 0.6], [b + 0.8, y1 - 0.6], [b - 0.2, y1], [a + 0.2, y1]]); }
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x8a8478); g.fillRect(0, 0, 9, 2.6); for (let y = 0.3; y < 2.6; y += 0.42) for (let x = (y * 3) % 0.8; x < 9; x += 0.8) { g.fillStyle = css(0x6a645a); g.fillRect(x, y, 0.75, 0.05); }
    for (const [a, b, y0, y1] of tiers) {
      g.fillStyle = css(0xf4efe2); g.fillRect(a, y0, b - a, y1 - y0 - 0.5);
      g.fillStyle = css(INK, 0.8); for (let x = a + 0.4; x < b - 0.2; x += 0.7) g.fillRect(x, y0 + 0.5, 0.25, 0.4);
      g.fillStyle = css(0x2a3a3a); g.fillRect(a - 0.8, y1 - 0.6, b - a + 1.6, 0.6);
    }
    g.fillStyle = css(0xd8b84a); for (const x of [3.4, 5.6]) { g.beginPath(); g.ellipse(x, 8.8, 0.18, 0.32, 0, 0, Math.PI * 2); g.fill(); }
  }, { px: P.px, kw: 1.4 });
} };

/** A red paper lantern on its stand, its ribs, a crest in white (a ring of three commas). */
const LANTERN = { w: 1.4, h: 3.8, paint(g, P) {
  const p = new Path2D(); rect(p, 0.64, 0, 0.12, 2.4); rect(p, 0.25, 0, 0.9, 0.12); disc(p, 0.7, 3.0, 0.55, 0.72); rect(p, 0.35, 2.22, 0.7, 0.14); rect(p, 0.35, 3.66, 0.7, 0.14);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x2a1a14); g.fillRect(0, 0, 1.4, 2.4);
    const gr = g.createRadialGradient(0.6, 3.1, 0.05, 0.7, 3.0, 0.75); gr.addColorStop(0, css(0xff9a5a)); gr.addColorStop(0.6, css(LACQUER)); gr.addColorStop(1, css(0x6a1014)); g.fillStyle = gr; g.fillRect(0, 2.3, 1.4, 1.5);
    g.strokeStyle = css(INK, 0.4); g.lineWidth = 0.03; for (let y = 2.45; y < 3.65; y += 0.14) { g.beginPath(); g.ellipse(0.7, y, 0.55 * Math.sqrt(Math.max(0, 1 - ((y - 3.0) / 0.72) ** 2)), 0.03, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = css(FOAM); g.beginPath(); g.arc(0.7, 3.0, 0.24, 0, Math.PI * 2); g.fill(); g.fillStyle = css(LACQUER);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; g.beginPath(); g.arc(0.7 + Math.cos(a) * 0.09, 3.0 + Math.sin(a) * 0.09, 0.07, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = css(0x1a1a1a); g.fillRect(0.35, 2.22, 0.7, 0.14); g.fillRect(0.35, 3.66, 0.7, 0.14);
  }, { px: P.px, kw: 1.3, lift: 2 });
} };

/** A noren hung on a rail between two posts: indigo cloth in three slits, a white wave crest on it. */
const NOREN = { w: 3.6, h: 3.6, paint(g, P) {
  const p = new Path2D(); rect(p, 0.1, 0, 0.14, 3.6); rect(p, 3.36, 0, 0.14, 3.6); rect(p, 0.1, 3.3, 3.4, 0.14);
  for (let i = 0; i < 3; i++) rect(p, 0.35 + i * 1.0, 1.7, 0.92, 1.6);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x3a2a20); g.fillRect(0, 0, 3.6, 3.6); g.fillStyle = css(0x22305a); g.fillRect(0.35, 1.7, 2.92, 1.6);
    g.strokeStyle = css(FOAM, 0.9); g.lineWidth = 0.07; for (const r of [0.5, 0.35, 0.2]) { g.beginPath(); g.arc(1.8, 2.2, r, Math.PI, 0, true); g.stroke(); }
  }, { px: P.px, kw: 1.3, lift: 2 });
} };

/** A wave board: a cut-out row of breaking waves on its block, blue with white crests. */
const WAVE_BOARD = { w: 5.2, h: 1.6, paint(g, P) {
  const p = new Path2D(); p.moveTo(0, 0);
  for (let x = 0; x <= 5.2; x += 1.3) { p.lineTo(x, 0.9); p.quadraticCurveTo(x + 0.4, 1.7, x + 0.95, 1.3); p.quadraticCurveTo(x + 0.6, 1.05, x + 1.3, 0.9); }
  p.lineTo(5.2, 0); p.closePath();
  cutOut(g, p, (g) => {
    vwash(g, 0, 0, 5.2, 1.6, [[0, 0x14284a], [0.6, PRUSSIAN], [1, 0x5a7ab8]]);
    g.strokeStyle = css(0x8aa8d8, 0.7); g.lineWidth = 0.05; for (let y = 0.2; y < 0.9; y += 0.18) { g.beginPath(); for (let x = 0; x <= 5.2; x += 0.65) g.quadraticCurveTo(x + 0.16, y + 0.1, x + 0.32, y); g.stroke(); }
    g.fillStyle = css(FOAM); for (let x = 0; x < 5.2; x += 1.3) for (let c = 0; c < 4; c++) { g.beginPath(); g.arc(x + 0.7 + c * 0.13, 1.3 + Math.sin(c) * 0.08, 0.1, 0, Math.PI * 2); g.fill(); }
  }, { px: P.px, kw: 1.4, lift: 3 });
} };

export const KABUKI = {
  air: 0x5a3a3a,
  layers: [
    { id: 'sky', ...LAYER.sky, body: { px: 200, paint: drop }, sprites: { curtain: CURTAIN },
      place: ({ ext, R }) => { const out = []; scatter(R, ext.x0, ext.x1, 40, 0.5, (x, i) => out.push({ s: 'curtain', x, y: 0, flip: i % 2 === 1 })); return out; } },
    { id: 'far', ...LAYER.far, hazeA: 0.18, sprites: { castle: CASTLE, tree: SAKURA_TREE },
      place: ({ lane, ext, R }) => { const out = [{ s: 'castle', x: lane.len / 2 + 4, y: 0 }]; scatter(R, ext.x0, ext.x1, 8, 2.5, (x) => { if (Math.abs(x - lane.len / 2 - 4) > 6) out.push({ s: 'tree', x, y: 0, flip: R() < 0.5 }); }); return out; } },
    { id: 'mid', ...LAYER.mid, hazeA: 0.1, sprites: { lantern: LANTERN, noren: NOREN },
      place: ({ ext, R }) => { const out = []; scatter(R, ext.x0, ext.x1, 5, 1.2, (x, i) => out.push({ s: i % 4 === 2 ? 'noren' : 'lantern', x, y: 0, back: true })); return out; } },
    { id: 'near', ...LAYER.near, light: [[1.1, 0.95, 0.88], [0.9, 0.86, 0.86]], sprites: { wave: WAVE_BOARD },
      place: ({ ext }) => { const out = []; for (let x = ext.x0, i = 0; x < ext.x1; x += 4.6, i++) out.push({ s: 'wave', x, y: (i % 2) * 0.25, flip: i % 2 === 1 }); return out; } },
  ],
};
