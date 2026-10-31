// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE CLIMB: a vertical world of the sewing basket behind The Climb (a theme for flats/build.js). A
// dusk sky with a great button hung for its sun; far off, cliffs of folded fabric (teal velvet draped from on high, its seams
// stitched in mustard); nearer, towers of stacked spools and thimbles rising out of a bank of calico; in front, a quilted hem with its
// running stitch, a thimble, a short stack of spools. The towers are taller than the camera's view from the floor and come into
// sight as you climb.
//
// Prior art: Hercules (PS1, 1997: its painted parallax); LittleBigPlanet's craft levels (things you own, stacked at a giant scale);
// Kirby's Epic Yarn (the world as cloth); Pollock's cliff wings.
//
//   CLIMB (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, skyBody, cloud, hills, scatter, button, css, shade, cutOut, poly, dabs, strokes, hatch, vwash, INK } from './kit.js';

const THREAD = [0xc8606a, 0x2f7f7a, 0xd6a32a, 0x7a1424, 0x8aa070, 0xe9dcc0];

/** A spool at its foot (x the middle, y the foot): two maple flanges, the thread wound between in its colour. */
export function spool(g, x, y, w, h, col, px) {
  const f = Math.max(0.12, h * 0.12), p = new Path2D();
  poly(p, [[x - w / 2, y], [x - w / 2, y + f], [x + w / 2, y + f], [x + w / 2, y]]);
  poly(p, [[x - w * 0.4, y + f], [x - w * 0.4, y + h - f], [x + w * 0.4, y + h - f], [x + w * 0.4, y + f]]);
  poly(p, [[x - w / 2, y + h - f], [x - w / 2, y + h], [x + w / 2, y + h], [x + w / 2, y + h - f]]);
  cutOut(g, p, (g) => {
    vwash(g, x - w / 2, y, w, h, [[0, shade(col, -0.25)], [1, shade(col, 0.2)]]);
    g.strokeStyle = css(shade(col, -0.35), 0.55); g.lineWidth = px * 2.2;
    for (let yy = y + f + 0.06; yy < y + h - f; yy += Math.max(px * 5, 0.09)) { g.beginPath(); g.moveTo(x - w * 0.4, yy); g.lineTo(x + w * 0.4, yy + 0.03); g.stroke(); }
    const sh = g.createLinearGradient(x - w * 0.4, 0, x + w * 0.4, 0); sh.addColorStop(0, css(0xffffff, 0.25)); sh.addColorStop(0.35, css(0xffffff, 0)); sh.addColorStop(1, css(0x000000, 0.35)); g.fillStyle = sh; g.fillRect(x - w / 2, y, w, h);
    for (const fy of [y, y + h - f]) { vwash(g, x - w / 2, fy, w, f, [[0, 0x9a6a3e], [1, 0xd8aa6a]]); g.fillStyle = css(INK, 0.5); g.fillRect(x - w / 2, fy, w, px * 2.5); }
  }, { px });
}
/** A thimble at its foot: a domed cap, dimpled, a rolled rim. */
export function thimble(g, x, y, w, h, metal, px) {
  const p = new Path2D(); p.moveTo(x - w / 2, y); p.lineTo(x - w * 0.42, y + h * 0.66); p.quadraticCurveTo(x, y + h * 1.18, x + w * 0.42, y + h * 0.66); p.lineTo(x + w / 2, y); p.closePath();
  cutOut(g, p, (g) => {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, css(shade(metal, 0.4))); gr.addColorStop(0.4, css(metal)); gr.addColorStop(1, css(shade(metal, -0.45))); g.fillStyle = gr; g.fillRect(x - w / 2, y, w, h * 1.2);
    g.fillStyle = css(INK, 0.35); const d = Math.max(px * 2.4, w * 0.05);
    for (let yy = y + h * 0.22; yy < y + h * 0.95; yy += d * 2.6) for (let xx = x - w * 0.45; xx < x + w * 0.45; xx += d * 2.6) { g.beginPath(); g.arc(xx + ((yy / (d * 2.6)) % 2) * d, yy, d * 0.55, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = css(shade(metal, -0.2)); g.fillRect(x - w / 2, y, w, h * 0.16); g.fillStyle = css(0xffffff, 0.35); g.fillRect(x - w / 2, y + h * 0.11, w, px * 3);
  }, { px });
}
/** A tower of spools and thimbles stacked from its foot to h, narrowing a little as it climbs (`seed` varies its order). */
function tower(w, h, seed) {
  return { w, h, paint(g, P) {
    const R = P.R; let y = 0, k = 0;
    for (;;) {
      const ww = w * (0.85 - 0.2 * (y / h)) * (0.85 + R() * 0.15), x = w / 2 + (R() - 0.5) * 0.2, cap = (k + seed) % 3 === 2, ph = cap ? ww * 0.8 : ww * (0.6 + R() * 0.3);
      if (y + ph * (cap ? 1.18 : 1) > h - 0.1) break;
      if (cap) { thimble(g, x, y, ww * 0.75, ph, k % 2 ? 0xb8c0c8 : 0xd8a944, P.px); y += ph * 0.95; }
      else { spool(g, x, y, ww, ph, THREAD[(k * 5 + seed) % THREAD.length], P.px); y += ph; }
      k++;
    }
  } };
}

/** The fabric cliffs: velvet draped from on high, its folds shaded round, a seam of running stitch here and there. */
function folds(cols, stitch) {
  return (g, P) => {
    const { w, h } = P;
    for (let x = -1; x < w + 1; x += 0.25) {
      const t = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 17) * Math.cos((x / w) * Math.PI * 2 * 5);
      g.fillStyle = css(t > 0.5 ? shade(cols[0], (t - 0.5) * 0.5) : shade(cols[0], -(0.5 - t) * 0.8)); g.fillRect(x, 0, 0.26, h);
    }
    dabs(g, P.R, { x: -1, y: 0, w: w + 2, h, n: Math.round(w * h * 0.6), r: [0.2, 0.7], cols, alpha: [0.06, 0.16], squash: 2.5, tilt: 0 });
    if (stitch) { g.save(); g.setLineDash([0.3, 0.22]); g.strokeStyle = css(stitch, 0.85); g.lineWidth = P.px * 3; for (let x = 3; x < w; x += w / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 0.3, h); g.stroke(); } g.restore(); }
  };
}

export const CLIMB = {
  air: 0xb8c4c4,
  layers: [
    { id: 'sky', ...LAYER.sky,
      body: { px: 240, paint: skyBody({ stops: [[0, 0xf6caa0], [0.28, 0xeccab6], [0.6, 0xa4c4cc], [1, 0x5e8ea4]], glow: { x: 0.62, y: 0.55, r: 26, c: 0xffd8a8, a: 0.4 },
        banks: [{ y: [0.35, 0.55], cols: [0xfff0e0, 0xf0d0c0], n: 3 }, { y: [0.62, 0.9], cols: [0xe8f0f0, 0xc8dce4], n: 2, a: [0.05, 0.14] }] }) },
      sprites: { sunb: { w: 7, h: 7, paint(g, P) { button(g, 3.5, 3.5, 3.1, 0xe2b04a, 4, P.px); } }, c1: cloud(10, 3.4), c2: cloud(14, 4.2) },
      place: ({ lane, ext, R }) => {
        const out = [{ s: 'sunb', x: lane.len * 0.62, y: 8.6 }];
        scatter(R, ext.x0, ext.x1, 20, 6, (x, i) => out.push({ s: i % 2 ? 'c1' : 'c2', x, y: 9 + R() * 9, flip: R() < 0.5 }));
        return out;
      } },
    { id: 'far', ...LAYER.far, hazeA: 0.32,
      strips: [hills({ id: 'cliffs', w: 44, h: 21, base: 13.5, terms: [[1, 3.2, 0.4], [3, 1.8, 1.7], [7, 0.8, 0.3], [13, 0.35, 2.2]], cols: [0x3f8a84, 0x2f7f7a, 0x1e5450], edge: 0xd8e8e0, detail: folds([0x2f7f7a, 0x4a9a90, 0x1e5450], 0xd6a32a) })] },
    { id: 'mid', ...LAYER.mid,
      strips: [hills({ id: 'calico', w: 48, h: 8, base: 4.4, terms: [[1, 1.1, 2.0], [2, 0.8, 0.5], [5, 0.3, 1.1]], cols: [0xe39a90, 0xc8606a, 0x8a3a44] })],
      sprites: { t1: tower(4.4, 15, 0), t2: tower(3.2, 10, 1), t3: tower(3.8, 13, 2) },
      place: ({ ext, R, stripY }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 11, 4, (x, i) => out.push({ s: ['t1', 't2', 't3'][i % 3], x, y: stripY(x) - 1.6, back: true, flip: R() < 0.5 }));
        return out;
      } },
    { id: 'near', ...LAYER.near,
      strips: [hills({ id: 'quilt', w: 30, h: 3.2, base: 1.7, terms: [[3, 0.25, 0.3], [10, 0.14, 1.2]], cols: [0xf0d68a, 0xd6a32a, 0x9a7020], detail(g, P, prof) {
        const quilt = [0xe9dcc0, 0xd6a32a, 0x8aa070, 0xc8606a];
        for (let i = 0, x = -1.25; x < P.w + 1; i++, x += 1.25) for (let j = 0, y = 0; y < 3; j++, y += 0.8) { g.fillStyle = css(quilt[(i + j * 3) % 4], 0.35); g.fillRect(x, y, 1.25, 0.8); }
        g.save(); g.setLineDash([0.18, 0.12]); g.strokeStyle = css(0x7a1424, 0.85); g.lineWidth = P.px * 3; g.beginPath(); g.moveTo(-1, prof(-1) - 0.22); for (let x = -0.8; x <= P.w + 1; x += 0.2) g.lineTo(x, prof(x) - 0.22); g.stroke(); g.restore();
        hatch(g, -1, 0, P.w + 1, 0.9, { gap: 0.16, angle: 0.6, lw: P.px * 2, a: 0.16 });
      } })],
      sprites: { th: { w: 1.7, h: 2.1, paint(g, P) { thimble(g, 0.85, 0, 1.6, 1.8, 0xb8c0c8, P.px); } }, sp: { w: 2.2, h: 3.6, paint(g, P) { spool(g, 1.1, 0, 2.1, 1.6, 0x2f7f7a, P.px); spool(g, 1.1, 1.6, 1.9, 1.9, 0xc8606a, P.px); } } },
      place: ({ ext, R }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 17, 5, (x, i) => out.push({ s: i % 2 ? 'th' : 'sp', x, y: -0.05, back: true }));
        return out;
      } },
  ],
};

