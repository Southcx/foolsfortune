// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE STOCK PIECES: what more than one stage's backdrop paints (vfx/strawmanwell/flats/<theme>.js), each
// a painter in metres for the lane builder's regions (flats/build.js: P = { w, h, px, R, pal, tile, ... }) or a sprite as { w, h, paint }:
// the sky drop's body (a wash from the horizon up, soft cloud banks brushed across it), a hung cloud, the painted sun, a ground row of
// hills to any profile, a haystack, a cypress, a sewing button, a gear's outline; the layer presets (how deep, how dense, how lit), and
// a scatter for placing along a lane. One look for them all: the cut-out's keyline and card edge (flats/brush.js), washes and dabs.
//
// Prior art: Pollock's stock scenes (the same cloud borders and ground rows printed for many plays), the PS1's reused tile sets.
//
//   LAYER.sky / far / mid / near (D, k, light, haze)   skyBody({ stops, banks, glow })   cloud(w, h, cols)   sun(r, cols)   hills({ w, h, base,
//   terms, cols, flip, detail })   haystack(w, h)   cypress(w, h, col)   button(g, x, y, r, col, holes, px)   gearPath(p, x, y, r, n, t, hole)
//   scatter(R, x0, x1, gap, jitter, fn)   spokes(p, x, y, r0, r1, n)
// ---------------------------------------------------------------------------------------
import { css, mix, shade, cutOut, periodic, band, disc, poly, dabs, strokes, hatch, vwash, INK } from './brush.js';

/** The four depths (m behind the plane), texel densities (per m), footlight lift (vertex colour at the foot and at lightH) and haze. */
export const LAYER = {
  sky: { D: 18, k: 15, light: [[1.0, 1.0, 1.0], [0.94, 0.96, 1.03]], lightH: 20 },
  far: { D: 10.5, k: 20, hazeA: 0.3, light: [[1.04, 1.0, 0.96], [0.96, 0.97, 1.0]], lightH: 14 },
  mid: { D: 6, k: 25, hazeA: 0.12, light: [[1.12, 1.04, 0.93], [0.98, 0.96, 0.95]], lightH: 9 },
  near: { D: 3, k: 30, light: [[1.22, 1.08, 0.9], [1.0, 0.96, 0.92]], lightH: 5 },
};

/** fn(x, i) every `gap` m (give or take `jitter`) from x0 to x1. */
export function scatter(R, x0, x1, gap, jitter, fn) { let i = 0; for (let x = x0 + R() * gap; x < x1; x += gap + (R() * 2 - 1) * jitter) fn(x, i++); }

/** The sky drop's body: a wash from the horizon (t 0) up (t 1), banks of soft cloud brushed across it, a glow low on one side. */
export function skyBody({ stops, banks = [], glow = null }) {
  return (g, P) => {
    const { w, h, R } = P;
    vwash(g, -2, 0, w + 4, h, stops.map(([t, c]) => [t, c]));
    if (glow) { const gr = g.createRadialGradient(glow.x * w, glow.y * h, 0, glow.x * w, glow.y * h, glow.r); gr.addColorStop(0, css(glow.c, glow.a)); gr.addColorStop(1, css(glow.c, 0)); g.fillStyle = gr; g.fillRect(-2, 0, w + 4, h); }
    for (const B of banks) {
      const n = Math.round((w / 10) * (B.n ?? 4));
      dabs(g, R, { x: -4, y: B.y[0] * h, w: w + 8, h: (B.y[1] - B.y[0]) * h, n, r: B.r ?? [2.5, 7], squash: B.squash ?? 0.3, tilt: 0, cols: B.cols, alpha: B.a ?? [0.08, 0.22] });
    }
  };
}

/** A cloud cut-out (hung from the flies): a scalloped top, a flatter belly, lit on top and shaded under. */
export function cloud(w, h, cols = [0xfbf3e0, 0xd8c8b4, 0xb8a8a0]) {
  return { w, h, paint(g, P) {
    const R = P.R, p = new Path2D(), n = Math.max(3, Math.round(w / (h * 0.6)));
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, r = h * (0.24 + 0.16 * Math.sin(t * Math.PI) + R() * 0.06); disc(p, w * (0.1 + 0.8 * t), h * 0.3 + r * 0.5, Math.min(r, w * 0.1 + 0.8 * w * Math.min(t, 1 - t))); }
    disc(p, w * 0.5, h * 0.3, w * 0.44, h * 0.22);
    cutOut(g, p, (g) => {
      vwash(g, 0, 0, w, h, [[0, cols[2]], [0.45, cols[1]], [1, cols[0]]]);
      dabs(g, R, { x: 0, y: h * 0.35, w, h: h * 0.6, n: Math.round(w * 6), r: [h * 0.06, h * 0.16], cols: [cols[0], 0xffffff], alpha: [0.15, 0.4] });
      dabs(g, R, { x: 0, y: 0, w, h: h * 0.3, n: Math.round(w * 3), r: [h * 0.05, h * 0.12], cols: [cols[2]], alpha: [0.1, 0.25] });
    }, { px: P.px });
  } };
}

/** The painted sun: a disc in a ring of wavy rays, a warm heart. */
export function sun(r, cols = [0xffe7a0, 0xf2b84a, 0xd9822e], rays = 16) {
  const s = r * 2.6;
  return { w: s, h: s, paint(g, P) {
    const c = s / 2, R = P.R, ring = new Path2D();
    for (let i = 0; i <= rays * 2; i++) { const a = (i / (rays * 2)) * Math.PI * 2, rr = i % 2 ? r * 1.08 : r * 1.28; if (i) ring.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); else ring.moveTo(c + rr, c); }
    ring.closePath();
    cutOut(g, ring, (g) => { g.fillStyle = css(cols[1]); g.fillRect(0, 0, s, s); hatch(g, 0, 0, s, s, { gap: r * 0.08, angle: 1.2, lw: P.px * 2.4, col: cols[2], a: 0.35 }); }, { px: P.px });
    const d = disc(new Path2D(), c, c, r);
    cutOut(g, d, (g) => {
      const gr = g.createRadialGradient(c - r * 0.2, c + r * 0.25, r * 0.1, c, c, r); gr.addColorStop(0, css(0xfff8dc)); gr.addColorStop(0.55, css(cols[0])); gr.addColorStop(1, css(cols[1]));
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      dabs(g, R, { x: c - r, y: c - r, w: r * 2, h: r * 2, n: 60, r: [r * 0.05, r * 0.14], cols: [0xfff4c8, cols[1]], alpha: [0.1, 0.3] });
    }, { px: P.px, lift: 3 });
  } };
}

/** A ground row of hills to a profile that repeats every w m: its face washed from the crest down, dabbed, its own detail over it. */
export function hills({ id, w, h, base, terms, cols, flip = true, detail = null, edge }) {
  const profile = periodic(w, base, terms);
  return { id, w, h, flip, profile, paint(g, P) {
    const path = band(profile, -1, w + 1, Math.max(0.12, w / 400));
    cutOut(g, path, (g) => {
      vwash(g, -1, 0, w + 2, h, [[0, cols[2]], [0.6, cols[1]], [1, cols[0]]]);
      dabs(g, P.R, { x: -1, y: 0, w: w + 2, h, n: Math.round(w * h * 1.2), r: [0.25, 0.9], cols, alpha: [0.08, 0.22], squash: 0.45, tilt: 0 });
      detail?.(g, P, profile);
      g.save(); g.lineWidth = P.px * 6; g.strokeStyle = css(shade(cols[0], 0.35), 0.55);
      g.beginPath(); g.moveTo(-1, profile(-1) - P.px * 5); for (let x = -0.7; x <= w + 1; x += 0.3) g.lineTo(x, profile(x) - P.px * 5); g.stroke(); g.restore();
    }, { px: P.px, edge });
  } };
}

/** A haystack: a stack's dome on a broader skirt, straw stroked down it, a twine band, its shaded side. */
export function haystack(w, h, pal) {
  return { w, h, paint(g, P) {
    const R = P.R, p = new Path2D();
    p.moveTo(w * 0.04, 0); p.bezierCurveTo(w * 0.02, h * 0.5, w * 0.2, h * 0.98, w * 0.5, h * 0.98); p.bezierCurveTo(w * 0.8, h * 0.98, w * 0.98, h * 0.5, w * 0.96, 0); p.closePath();
    cutOut(g, p, (g) => {
      vwash(g, 0, 0, w, h, [[0, shade(pal.mustard, -0.25)], [0.5, pal.mustard], [1, shade(pal.mustard, 0.3)]]);
      strokes(g, R, { x: 0, y: -0.2, w, h: h * 1.05, n: Math.round(w * h * 26), len: [0.3, 0.8], lw: P.px * 2.2, cols: [0xf0d070, 0xc89030, 0xa87020, 0xffe9a0], alpha: [0.4, 0.85], lean: 0.35 });
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, css(0x000000, 0)); gr.addColorStop(0.6, css(0x000000, 0)); gr.addColorStop(1, css(0x3a1a08, 0.35)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = css(pal.walnut, 0.85); g.lineWidth = P.px * 4; g.beginPath(); g.moveTo(0, h * 0.42); g.quadraticCurveTo(w * 0.5, h * 0.36, w, h * 0.44); g.stroke();
    }, { px: P.px });
  } };
}

/** A cypress (the hills' flame of a tree), its shade on one side. */
export function cypress(w, h, col = 0x3f5a34) {
  return { w, h, paint(g, P) {
    const p = new Path2D(); p.moveTo(w * 0.42, 0); p.bezierCurveTo(-w * 0.1, h * 0.35, w * 0.25, h * 0.8, w * 0.5, h); p.bezierCurveTo(w * 0.78, h * 0.8, w * 1.1, h * 0.35, w * 0.58, 0); p.closePath();
    cutOut(g, p, (g) => {
      vwash(g, 0, 0, w, h, [[0, shade(col, -0.3)], [1, shade(col, 0.15)]]);
      dabs(g, P.R, { x: 0, y: 0, w, h, n: Math.round(h * 30), r: [w * 0.06, w * 0.16], cols: [shade(col, 0.25), shade(col, -0.35), 0x6a7a3a], alpha: [0.2, 0.45] });
      hatch(g, w * 0.55, 0, w, h, { gap: w * 0.09, angle: 1.1, lw: P.px * 2, a: 0.2 });
    }, { px: P.px });
  } };
}

/** A sewing button, its rim raised and its holes punched through to the dark (`holes` 2 or 4). */
export function button(g, x, y, r, col, holes = 4, px = 0.03) {
  const d = disc(new Path2D(), x, y, r);
  cutOut(g, d, (g) => {
    const gr = g.createRadialGradient(x - r * 0.35, y + r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, css(shade(col, 0.35))); gr.addColorStop(1, css(shade(col, -0.15)));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.lineWidth = Math.max(px * 3, r * 0.12); g.strokeStyle = css(shade(col, -0.3), 0.7); g.beginPath(); g.arc(x, y, r * 0.72, 0, Math.PI * 2); g.stroke();
    g.fillStyle = css(INK, 0.9);
    const hr = Math.max(px * 2.5, r * 0.12), o = r * 0.26;
    const at = holes === 2 ? [[-o, 0], [o, 0]] : [[-o, -o], [o, -o], [-o, o], [o, o]];
    for (const [dx, dy] of at) { g.beginPath(); g.arc(x + dx, y + dy, hr, 0, Math.PI * 2); g.fill(); }
  }, { px, kw: 2, lift: 3 });
}

/** A gear's outline (n teeth of depth t round radius r) with its bore, added to a path (even-odd: fill with 'evenodd'). */
export function gearPath(p, x, y, r, n, t, hole = 0.3) {
  const steps = n * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2, rr = (i % 4 === 1 || i % 4 === 2) ? r + t : r;
    if (i) p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else p.moveTo(x + rr, y);
  }
  p.closePath();
  if (hole > 0) { p.moveTo(x + r * hole, y); p.arc(x, y, r * hole, 0, Math.PI * 2, true); }
  return p;
}

/** Spokes cut from a gear's web: n windows between hub (r0) and rim (r1), wound against the gear so they read as holes. */
export function spokes(p, x, y, r0, r1, n) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.18, a1 = ((i + 1) / n) * Math.PI * 2 - 0.18;
    p.moveTo(x + Math.cos(a0) * r0, y + Math.sin(a0) * r0); p.arc(x, y, r0, a0, a1); p.arc(x, y, r1, a1, a0, true); p.closePath();
  }
  return p;
}

export { css, mix, shade, cutOut, disc, poly, dabs, strokes, hatch, vwash, INK };
