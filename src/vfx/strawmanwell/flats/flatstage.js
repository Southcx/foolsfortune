// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE FLAT STAGE: Final Destination's void read as a toy theatre's night (a theme for flats/build.js;
// the stage Dovina's, world/strawmanwell/stages/flatstage.js). Where the Arena's backdrop is the hall at rehearsal (flats/arena.js),
// the flat stage stands before the one drop the show has finished: the night sky, painted on cloth.
//   the drop      a backcloth of the deep night, sewn of widths (its seams and their stitches, the cloth's soft folds), washed from a
//                 violet glow at the horizon up to the proscenium's near-black; a milky way brushed across it, painted stars in their
//                 hundreds and a few big ones in gold leaf, four-pointed; and across its foot the gold horizon line, a gilt rule with
//                 its glow above it, the edge of the void (Final Destination's band of light under the stage)
//   the flies     farther in, cut-outs hung on threads from the flies: a gold-leaf crescent moon, a ringed planet, tin stars and a comet
//   the clouds    nearer, a ground row of night cloud along the horizon, deep blue with its lining gilt where the horizon lights it
//   the stars     nearest, low, tin stars on sticks propped in their blocks along the deck (what a stagehand would wave for twinkling)
//
// Prior art: Super Smash Bros. Melee's Final Destination (the flat stage over a void, its horizon of light and passing starfields);
// Pollock's toy theatre (the star cloth, cut-outs hung from the flies on threads, the ground row); the painted star cloth and the
// "moon box" of the Victorian stage; Méliès' Le Voyage dans la Lune (1902: the painted moon and stars hung on wires); the house's
// flats' kit and brush (flats/kit.js, flats/brush.js).
//
//   FLATSTAGE (a theme: { air, layers })   FLAT_NIGHT (its colours and the horizon's height)
// ---------------------------------------------------------------------------------------
import { LAYER, scatter, hills, css, shade, cutOut, poly, disc, dabs, vwash, INK } from './kit.js';
import { rect } from './brush.js';

/** The night's colours, the gold leaf's, and the horizon line's height on the drop (m above its foot). */
export const FLAT_NIGHT = {
  deep: 0x07061a, night: 0x161040, violet: 0x3a2266, glow: 0x7a4a9a, horizon: 3.2,
  gold: 0xe2b04a, goldHi: 0xfff0b0, goldLo: 0x9a6a1c, star: 0xfff6e0, tin: 0xc8ccd4, cloud: 0x1a1a48,
};
const N = FLAT_NIGHT;

/** A four-pointed star of radius r at (x, y): a thin cross, its waist pinched. */
function star4(g, x, y, r, col, a = 1) {
  const p = new Path2D(), w = r * 0.16;
  poly(p, [[x, y + r], [x + w, y + w], [x + r, y], [x + w, y - w], [x, y - r], [x - w, y - w], [x - r, y], [x - w, y + w]]);
  g.fillStyle = css(col, a); g.fill(p);
}

/** A five-pointed star's outline of outer radius r about (x, y), added to a path. */
function star5(p, x, y, r, inner = 0.45) {
  const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  return poly(p, pts);
}

/** The backcloth: the night washed up from the horizon, its widths' seams and folds, the milky way, the stars, the gold horizon line. */
function nightCloth(g, P) {
  const { w, h, R } = P, H = N.horizon;
  // below the line the void falls away dark; above it the violet glow rises into the deep night
  vwash(g, -2, 0, w + 4, H, [[0, N.deep], [0.7, shade(N.night, -0.2)], [1, N.violet]]);
  vwash(g, -2, H, w + 4, h - H, [[0, N.glow], [0.08, N.violet], [0.35, N.night], [1, N.deep]]);
  // the milky way, brushed in a long shallow band across the cloth, its dust and dark lanes
  for (let x = -4; x < w + 4; x += 30) {
    const y0 = H + 5 + R() * 3;
    dabs(g, R, { x, y: y0, w: 34, h: 3.4, n: 90, r: [0.8, 2.2], squash: 0.35, tilt: 0.12, cols: [0x6a5aa8, 0x8a7ac0, 0xa8a0d8], alpha: [0.04, 0.12] });
    dabs(g, R, { x, y: y0 + 0.8, w: 34, h: 1.6, n: 140, r: [0.06, 0.12], cols: [N.star, 0xd8d0ff], alpha: [0.3, 0.8] });
    dabs(g, R, { x, y: y0 + 1.1, w: 34, h: 0.8, n: 30, r: [0.3, 0.8], squash: 0.3, tilt: 0.12, cols: [N.deep], alpha: [0.1, 0.25] });
  }
  // the painted stars: a field of points, brighter fewer, and a few in gold leaf, four-pointed
  dabs(g, R, { x: -2, y: H + 0.4, w: w + 4, h: h - H, n: Math.round(w * (h - H) * 0.5), r: [0.05, 0.1], squash: 1, cols: [N.star, 0xd8e0ff, 0xffe0c0], alpha: [0.35, 0.9] });
  dabs(g, R, { x: -2, y: H + 1, w: w + 4, h: h - H, n: Math.round(w * 0.6), r: [0.1, 0.18], squash: 1, cols: [N.star], alpha: [0.8, 1] });
  for (let i = 0, n = Math.round(w / 6); i < n; i++) { const x = R() * w, y = H + 2 + R() * (h - H - 3), r = 0.18 + R() * 0.32; star4(g, x, y, r * 2.2, N.gold, 0.25); star4(g, x, y, r, N.goldHi, 0.95); }
  // the cloth: its widths' seams every 3 m (a darker line, the stitches beside it) and its folds (soft vertical shading)
  for (let x = 0; x < w + 2; x += 1.5) { const gr = g.createLinearGradient(x, 0, x + 1.5, 0); gr.addColorStop(0, css(0x000000, 0.0)); gr.addColorStop(0.5, css(0x000000, 0.14)); gr.addColorStop(1, css(0x000000, 0.0)); g.fillStyle = gr; g.fillRect(x, 0, 1.5, h); }
  for (let x = 1.5; x < w + 2; x += 3) {
    g.fillStyle = css(N.deep, 0.5); g.fillRect(x - 0.05, 0, 0.1, h);
    g.fillStyle = css(0x8a80c0, 0.16); for (let y = 0.2; y < h; y += 0.6) g.fillRect(x + 0.1, y, 0.08, 0.3);
  }
  // the gold horizon line: a glow above it, the gilt rule, a thinner rule under it, its leaf caught in highlights
  const gl = g.createLinearGradient(0, H, 0, H + 2.4); gl.addColorStop(0, css(N.gold, 0.4)); gl.addColorStop(1, css(N.gold, 0)); g.fillStyle = gl; g.fillRect(-2, H, w + 4, 2.4);
  const rule = g.createLinearGradient(0, H - 0.09, 0, H + 0.09); rule.addColorStop(0, css(N.goldLo)); rule.addColorStop(0.5, css(N.goldHi)); rule.addColorStop(1, css(N.goldLo));
  g.fillStyle = rule; g.fillRect(-2, H - 0.09, w + 4, 0.18);
  g.fillStyle = css(N.gold, 0.7); g.fillRect(-2, H - 0.36, w + 4, 0.04);
  dabs(g, R, { x: -2, y: H - 0.08, w: w + 4, h: 0.16, n: Math.round(w * 2), r: [0.03, 0.08], squash: 0.5, cols: [0xffffff, N.goldHi], alpha: [0.4, 0.9] });
  // the proscenium's deep night closing in at the top of the cloth
  const top = g.createLinearGradient(0, h - 4, 0, h); top.addColorStop(0, css(N.deep, 0)); top.addColorStop(1, css(N.deep, 0.85)); g.fillStyle = top; g.fillRect(-2, h - 4, w + 4, 4);
}

/** A thread from a hung cut-out's top up to the flies (y from `y0` to `y1`), and the tin ring it is tied to. */
function thread(g, x, y0, y1) { g.fillStyle = css(0xd8d0b8, 0.75); g.fillRect(x - 0.015, y0, 0.03, y1 - y0); g.strokeStyle = css(N.tin, 0.9); g.lineWidth = 0.03; g.beginPath(); g.arc(x, y0 + 0.06, 0.06, 0, Math.PI * 2); g.stroke(); }

/** The crescent moon in gold leaf, hung on its thread. */
const MOON = { w: 3.2, h: 9, paint(g, P) {
  const p = new Path2D(); p.arc(1.6, 1.6, 1.5, 0, Math.PI * 2); p.moveTo(2.5, 2.0); p.arc(2.05, 1.95, 1.2, 0, Math.PI * 2, true);
  cutOut(g, p, (g) => {
    const gr = g.createLinearGradient(0, 0, 3.2, 3.2); gr.addColorStop(0, css(N.goldLo)); gr.addColorStop(0.45, css(N.goldHi)); gr.addColorStop(1, css(N.gold)); g.fillStyle = gr; g.fillRect(0, 0, 3.2, 3.2);
    dabs(g, P.R, { x: 0, y: 0, w: 3.2, h: 3.2, n: 40, r: [0.05, 0.16], squash: 0.6, cols: [0xffffff, N.goldLo], alpha: [0.15, 0.45] });
  }, { px: P.px, kw: 1.6, lift: 3 });
  thread(g, 1.0, 2.9, 9);
} };

/** A ringed planet: its body banded in dusk colours, the ring a gilt ellipse across it, hung on its thread. */
const PLANET = { w: 3.6, h: 9, paint(g, P) {
  const body = disc(new Path2D(), 1.8, 1.8, 1.05), ring = new Path2D(); ring.ellipse(1.8, 1.8, 1.75, 0.38, -0.25, 0, Math.PI * 2); ring.ellipse(1.8, 1.8, 1.3, 0.22, -0.25, 0, Math.PI * 2, true);
  cutOut(g, body, (g) => {
    vwash(g, 0.7, 0.7, 2.2, 2.2, [[0, 0x6a3a5a], [0.4, 0xb86a5a], [0.7, 0xe0a070], [1, 0xf2d0a0]]);
    g.fillStyle = css(INK, 0.18); for (let y = 1.0; y < 2.8; y += 0.32) g.fillRect(0.6, y, 2.4, 0.08);
    const sh = g.createRadialGradient(1.4, 2.2, 0.2, 1.8, 1.8, 1.1); sh.addColorStop(0, css(0x000000, 0)); sh.addColorStop(1, css(0x000000, 0.4)); g.fillStyle = sh; g.fillRect(0.7, 0.7, 2.2, 2.2);
  }, { px: P.px, kw: 1.5, lift: 3 });
  cutOut(g, ring, (g) => { g.fillStyle = css(N.gold); g.fillRect(0, 0, 3.6, 3.6); g.fillStyle = css(N.goldHi, 0.8); g.fillRect(0, 1.75, 3.6, 0.06); }, { px: P.px, kw: 1.4, lift: 2 });
  thread(g, 1.8, 2.85, 9);
} };

/** A tin star (five points, a cut tin's shine), hung on its thread. */
const TIN_STAR = { w: 1.6, h: 7, paint(g, P) {
  const p = star5(new Path2D(), 0.8, 0.8, 0.75);
  cutOut(g, p, (g) => {
    const gr = g.createLinearGradient(0, 0, 1.6, 1.6); gr.addColorStop(0, css(shade(N.tin, -0.35))); gr.addColorStop(0.5, css(0xffffff)); gr.addColorStop(1, css(N.tin)); g.fillStyle = gr; g.fillRect(0, 0, 1.6, 1.6);
    g.strokeStyle = css(INK, 0.25); g.lineWidth = 0.03; for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i * 2 * Math.PI) / 5; g.beginPath(); g.moveTo(0.8, 0.8); g.lineTo(0.8 + Math.cos(a) * 0.7, 0.8 + Math.sin(a) * 0.7); g.stroke(); }
  }, { px: P.px, kw: 1.4, lift: 2 });
  thread(g, 0.8, 1.55, 7);
} };

/** A gold star, five points, hung on its thread (the tin star's twin in leaf). */
const GOLD_STAR = { w: 1.4, h: 6, paint(g, P) {
  const p = star5(new Path2D(), 0.7, 0.7, 0.65);
  cutOut(g, p, (g) => { const gr = g.createLinearGradient(0, 0, 1.4, 1.4); gr.addColorStop(0, css(N.goldLo)); gr.addColorStop(0.5, css(N.goldHi)); gr.addColorStop(1, css(N.gold)); g.fillStyle = gr; g.fillRect(0, 0, 1.4, 1.4); }, { px: P.px, kw: 1.4, lift: 2 });
  thread(g, 0.7, 1.35, 6);
} };

/** A comet: its gilt head and a long tail of brushed light, flown on two threads. */
const COMET = { w: 6, h: 6.5, paint(g, P) {
  const p = new Path2D(); p.moveTo(5.2, 1.0); p.bezierCurveTo(3.4, 1.9, 1.6, 1.6, 0, 2.0); p.bezierCurveTo(1.6, 1.1, 3.4, 0.6, 5.2, 0.6); p.closePath(); disc(p, 5.25, 0.8, 0.42);
  cutOut(g, p, (g) => {
    const gr = g.createLinearGradient(0, 0, 6, 0); gr.addColorStop(0, css(0x8a80c0, 0.2)); gr.addColorStop(0.6, css(0xd8d0ff, 0.8)); gr.addColorStop(1, css(N.goldHi)); g.fillStyle = gr; g.fillRect(0, 0, 6, 3);
    g.strokeStyle = css(0xffffff, 0.35); g.lineWidth = 0.04; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(5.0, 0.8 + (k - 2.5) * 0.06); g.quadraticCurveTo(3.0, 1.2 + k * 0.08, 0.4, 1.9 + (k - 2.5) * 0.04); g.stroke(); }
  }, { px: P.px, kw: 1.3, lift: 2 });
  thread(g, 5.25, 1.15, 6.5); thread(g, 2.2, 1.6, 6.5);
} };

/** The ground row of night cloud along the horizon: deep blue, its crest lined in gilt where the horizon catches it. */
const CLOUD_ROW = hills({ id: 'nightcloud', w: 36, h: 4.2, base: 2.1, terms: [[2, 0.5, 0.3], [5, 0.35, 1.7], [11, 0.18, 0.6]], cols: [0x2a2a68, 0x1e1e52, N.cloud], detail(g, P, profile) {
  g.save(); g.lineWidth = 0.09; g.strokeStyle = css(N.gold, 0.85); g.beginPath(); g.moveTo(-1, profile(-1) - 0.1); for (let x = -0.7; x <= P.w + 1; x += 0.25) g.lineTo(x, profile(x) - 0.1); g.stroke();
  g.lineWidth = 0.03; g.strokeStyle = css(N.goldHi, 0.7); g.stroke(); g.restore();
  dabs(g, P.R, { x: -1, y: 0, w: P.w + 2, h: 2.6, n: 120, r: [0.3, 0.9], squash: 0.4, tilt: 0, cols: [0x3a3a80, 0x10103a], alpha: [0.1, 0.25] });
} });

/** A tin star on a stick, propped in its block on the deck. */
const STICK_STAR = { w: 1.2, h: 2.2, paint(g, P) {
  const p = star5(new Path2D(), 0.6, 1.6, 0.52); rect(p, 0.56, 0.2, 0.08, 1.1); rect(p, 0.25, 0, 0.7, 0.24);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x6b4226); g.fillRect(0, 0, 1.2, 1.2);
    const gr = g.createLinearGradient(0, 1.1, 1.2, 2.2); gr.addColorStop(0, css(shade(N.tin, -0.3))); gr.addColorStop(0.5, css(0xffffff)); gr.addColorStop(1, css(N.tin)); g.fillStyle = gr; g.fillRect(0, 1.08, 1.2, 1.12);
  }, { px: P.px, kw: 1.3, lift: 2 });
} };

export const FLATSTAGE = {
  air: 0x1a1236,
  layers: [
    { id: 'sky', ...LAYER.sky, body: { px: 480, paint: nightCloth } }, // (the whole sheet: the stars want the texels)
    { id: 'far', ...LAYER.far, hazeA: 0.16, sprites: { moon: MOON, planet: PLANET, tin: TIN_STAR, gold: GOLD_STAR, comet: COMET },
      place: ({ lane, ext, R }) => {
        const mid = lane.len / 2, out = [{ s: 'moon', x: mid + 7, y: 9.5 }, { s: 'planet', x: mid - 9, y: 8.4 }, { s: 'comet', x: mid - 22, y: 11 }];
        scatter(R, ext.x0, ext.x1, 3.6, 1.2, (x, i) => { if (Math.abs(x - mid - 7) > 2.5 && Math.abs(x - mid + 9) > 2.6) out.push({ s: i % 3 ? 'tin' : 'gold', x, y: 9 + R() * 4.5, scale: 0.6 + R() * 0.5 }); });
        return out;
      } },
    { id: 'mid', ...LAYER.mid, hazeA: 0.1, strips: [CLOUD_ROW] },
    { id: 'near', ...LAYER.near, light: [[1.0, 0.92, 0.82], [0.7, 0.7, 0.82]], sprites: { star: STICK_STAR },
      place: ({ ext, R }) => { const out = []; scatter(R, ext.x0, ext.x1, 6.5, 1.5, (x) => out.push({ s: 'star', x, y: 0, scale: 0.55 + R() * 0.25, flip: R() < 0.5 })); return out; } },
  ],
};
