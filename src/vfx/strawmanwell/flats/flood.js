// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE FLOOD: the toy theatre's sea behind The Flood (a theme for flats/build.js). A storm sky, slate
// going to violet, dark clouds hung across it and a bolt of lightning cut from gold card; far off, a lighthouse on its rock, its lamp
// lit and its beam painted out over a swell; nearer, four rows of cut-out waves (curling crests capped with foam, the hollows hatched)
// standing in their grooves one behind another and rocking, each row slid and lifted on its own beat, as a stagehand's crank rocks
// them in a paper theatre.
//
// Prior art: Pollock's and Webb's sea rows (the long wave strips slid in the stage's grooves and rocked by hand), the Victorian stage's
// sea cloth and wave machine; Hokusai's curling crests; Hercules (PS1, 1997: painted parallax).
//
//   FLOOD (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, skyBody, cloud, scatter, css, shade, cutOut, poly, dabs, hatch, vwash } from './kit.js';

const SEA = [[0x5ab0b0, 0x2f7f7a, 0x14464a], [0x6abcb8, 0x3a8a86, 0x1a5254], [0x4aa2a8, 0x26706e, 0x10383e], [0x78c4bc, 0x3f948c, 0x1e5a58]];

/** A row of curling waves: `n` crests a tile (it repeats), each a slow back rising to a crest that curls forward over its hollow,
 *  capped with foam; the body banded and its hollows hatched. */
function waves({ id, w, h, n, base, amp, cols }) {
  const L = w / n, crest = (t) => (t < 0.72 ? Math.pow(t / 0.72, 1.6) : 1 - (t - 0.72) / 0.28 * 0.9);
  const profile = (x) => { const t = (((x % L) + L) % L) / L; return base + amp * crest(t); };
  return { id, w, h, flip: false, profile, paint(g, P) {
    const p = new Path2D();
    p.moveTo(-L, -1); p.lineTo(w + L, -1);
    for (let k = n; k >= -1; k--) {
      const x0 = k * L, top = base + amp;
      p.lineTo(x0 + L, base + amp * 0.1);
      p.bezierCurveTo(x0 + L * 0.86, base + amp * 0.35, x0 + L * 0.82, top - amp * 0.2, x0 + L * 0.84, top - amp * 0.32);
      p.bezierCurveTo(x0 + L * 0.9, top - amp * 0.45, x0 + L * 0.98, top - amp * 0.2, x0 + L * 0.92, top + amp * 0.05);
      p.bezierCurveTo(x0 + L * 0.85, top + amp * 0.2, x0 + L * 0.74, top + amp * 0.12, x0 + L * 0.68, top - amp * 0.05);
      p.bezierCurveTo(x0 + L * 0.45, top - amp * 0.45, x0 + L * 0.2, base + amp * 0.12, x0, base + amp * 0.1);
    }
    p.closePath();
    cutOut(g, p, (g) => {
      vwash(g, -1, 0, w + 2, h, [[0, cols[2]], [0.55, cols[1]], [1, cols[0]]]);
      for (let k = -1; k <= n; k++) {
        const x0 = k * L, top = base + amp;
        g.strokeStyle = css(shade(cols[0], 0.25), 0.55); g.lineWidth = P.px * 3;
        for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(x0 + L * 0.05, base * (1 - j * 0.22) + amp * 0.05); g.quadraticCurveTo(x0 + L * 0.5, base * (1 - j * 0.22) + amp * 0.45 * (1 - j * 0.2), x0 + L * 0.78, base * (1 - j * 0.22) + amp * 0.5); g.stroke(); }
        hatch(g, x0 + L * 0.62, top - amp * 0.6, x0 + L * 0.9, top, { gap: Math.max(P.px * 5, L * 0.03), angle: 1.1, lw: P.px * 2.2, a: 0.3 });
        const f = new Path2D(); f.moveTo(x0 + L * 0.62, top - amp * 0.08); f.bezierCurveTo(x0 + L * 0.72, top + amp * 0.16, x0 + L * 0.86, top + amp * 0.22, x0 + L * 0.93, top + amp * 0.02);
        f.bezierCurveTo(x0 + L * 0.96, top - amp * 0.12, x0 + L * 0.9, top - amp * 0.2, x0 + L * 0.86, top - amp * 0.1); f.bezierCurveTo(x0 + L * 0.82, top + amp * 0.02, x0 + L * 0.72, top - amp * 0.02, x0 + L * 0.62, top - amp * 0.08);
        g.fillStyle = css(0xf4efe2); g.fill(f);
        g.fillStyle = css(0xffffff, 0.8); for (let s = 0; s < 4; s++) { g.beginPath(); g.arc(x0 + L * (0.55 + s * 0.07), top - amp * (0.08 + s * 0.04), Math.max(P.px * 2.5, amp * 0.035), 0, Math.PI * 2); g.fill(); }
      }
      dabs(g, P.R, { x: -1, y: 0, w: w + 2, h, n: Math.round(w * h * 2), r: [0.1, 0.35], cols: [cols[0], cols[2]], alpha: [0.08, 0.2], squash: 0.4, tilt: 0 });
    }, { px: P.px, edge: 0xe8f4f0 });
  } };
}

/** The lighthouse on its rock: banded white and red, its lantern lit, a gallery round it, its beam painted out to one side. */
const lighthouse = { w: 9, h: 13, paint(g, P) {
  const rock = poly(new Path2D(), [[0.2, 0], [1.2, 2.2], [2.6, 3], [6.4, 3.1], [7.6, 2], [8.6, 0]]);
  cutOut(g, rock, (g) => { vwash(g, 0, 0, 9, 3.2, [[0, 0x2a2c34], [1, 0x6a6a72]]); dabs(g, P.R, { x: 0, y: 0, w: 9, h: 3.2, n: 60, r: [0.15, 0.45], cols: [0x8a8a92, 0x1a1c22], alpha: [0.2, 0.4] }); hatch(g, 4.5, 0, 9, 3.2, { gap: 0.15, angle: 1.0, lw: P.px * 2, a: 0.3 }); }, { px: P.px });
  const beam = poly(new Path2D(), [[4.6, 11.1], [8.9, 12.7], [8.9, 9.4], [4.6, 10.5]]);
  cutOut(g, beam, (g) => { const gr = g.createLinearGradient(4.6, 0, 9, 0); gr.addColorStop(0, css(0xfff6d0)); gr.addColorStop(1, css(0xe8d090)); g.fillStyle = gr; g.fillRect(4.5, 9.3, 4.6, 3.5); hatch(g, 4.6, 9.4, 9, 12.7, { gap: 0.2, angle: 0.25, lw: P.px * 2, col: 0xc8a050, a: 0.3 }); }, { px: P.px, lift: 2 });
  const p = new Path2D(); poly(p, [[3.6, 2.9], [3.95, 9.8], [5.05, 9.8], [5.4, 2.9]]); poly(p, [[3.5, 9.8], [3.5, 10.1], [5.5, 10.1], [5.5, 9.8]]); poly(p, [[3.85, 10.1], [3.85, 11.5], [5.15, 11.5], [5.15, 10.1]]); poly(p, [[3.7, 11.5], [4.5, 12.6], [5.3, 11.5]]);
  cutOut(g, p, (g) => {
    for (let y = 2.9, k = 0; y < 9.8; y += 1.15, k++) { g.fillStyle = css(k % 2 ? 0xc8404a : 0xf4efe2); g.fillRect(3.4, y, 2.2, 1.15); }
    hatch(g, 4.8, 2.9, 5.6, 9.8, { gap: 0.12, angle: 1.3, lw: P.px * 2, a: 0.3 });
    g.fillStyle = css(0x2a2c34); g.fillRect(3.4, 9.8, 2.2, 0.3); g.fillRect(3.4, 11.5, 2.2, 1.2);
    const gl = g.createRadialGradient(4.5, 10.8, 0.05, 4.5, 10.8, 0.75); gl.addColorStop(0, css(0xffffff)); gl.addColorStop(0.5, css(0xffe08a)); gl.addColorStop(1, css(0xe0a040)); g.fillStyle = gl; g.fillRect(3.85, 10.1, 1.3, 1.4);
    g.fillStyle = css(0x7a1424); g.fill(poly(new Path2D(), [[3.7, 11.5], [4.5, 12.6], [5.3, 11.5]]));
  }, { px: P.px });
} };
/** A bolt of lightning cut from gold card. */
const bolt = { w: 2.6, h: 8, paint(g, P) {
  const p = poly(new Path2D(), [[1.6, 8], [0.4, 4.4], [1.2, 4.5], [0.3, 0], [2.2, 4.9], [1.4, 4.8], [2.4, 8]]);
  cutOut(g, p, (g) => { vwash(g, 0, 0, 2.6, 8, [[0, 0xe2b04a], [1, 0xfff0b0]]); hatch(g, 1.2, 0, 2.6, 8, { gap: 0.12, angle: 1.2, lw: P.px * 2, col: 0xb07a22, a: 0.4 }); }, { px: P.px, lift: 3 });
} };
/** A rock standing out of the far swell. */
const rocks = { w: 5, h: 2.6, paint(g, P) {
  const p = new Path2D(); poly(p, [[0, 0], [0.6, 1.6], [1.4, 2.2], [2.2, 1.4], [3.0, 2.5], [4.2, 1.5], [5, 0]]);
  cutOut(g, p, (g) => { vwash(g, 0, 0, 5, 2.6, [[0, 0x24262e], [1, 0x5a5c66]]); hatch(g, 2.5, 0, 5, 2.6, { gap: 0.13, angle: 1, lw: P.px * 2, a: 0.3 }); }, { px: P.px });
} };

/** How each row of the sea rocks: slid (m) and lifted (m) on its own beat (rad per real s), each a step out of phase with the next. */
const ROCK = [{ x: 0.35, y: 0.06, w: 0.7, ph: 0 }, { x: -0.45, y: 0.08, w: 0.85, ph: 1.3 }, { x: 0.5, y: 0.07, w: 0.95, ph: 2.4 }, { x: -0.55, y: 0.09, w: 1.1, ph: 3.7 }];

export const FLOOD = {
  air: 0x8a96a8,
  layers: [
    { id: 'sky', ...LAYER.sky,
      body: { px: 240, paint: skyBody({ stops: [[0, 0xb0b4b0], [0.22, 0x7a8490], [0.55, 0x4a4e6e], [1, 0x22223a]], glow: { x: 0.3, y: 0.35, r: 20, c: 0xfff0c0, a: 0.25 },
        banks: [{ y: [0.3, 0.6], cols: [0x3a3e52, 0x5a6070], n: 4, r: [3, 9], squash: 0.3 }, { y: [0.6, 0.95], cols: [0x2a2c40, 0x4a4c62], n: 3, r: [3, 8], squash: 0.3 }] }) },
      sprites: { s1: cloud(15, 4.8, [0x9a9cac, 0x5e6072, 0x34364a]), s2: cloud(11, 3.8, [0x8a8c9c, 0x54566a, 0x2c2e40]), bolt },
      place: ({ lane, ext, R }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 16, 5, (x, i) => out.push({ s: i % 2 ? 's1' : 's2', x, y: 9 + R() * 6, flip: R() < 0.5 }));
        out.push({ s: 'bolt', x: lane.len * 0.72, y: 4.5 });
        return out;
      } },
    { id: 'far', ...LAYER.far, hazeA: 0.3, strips: [waves({ id: 'swell', w: 40, h: 3.4, n: 10, base: 1.7, amp: 0.9, cols: SEA[0] })], sprites: { lighthouse, rocks },
      place: ({ lane, ext, R }) => {
        const out = [{ s: 'lighthouse', x: lane.len * 0.3, y: -0.4, back: true }];
        scatter(R, ext.x0, ext.x1, 15, 5, (x) => { if (Math.abs(x - lane.len * 0.3) > 8) out.push({ s: 'rocks', x, y: 0.4, back: true, scale: 0.6 + R() * 0.6 }); });
        return out;
      } },
    { id: 'mid', ...LAYER.mid, strips: [waves({ id: 'waveA', w: 36, h: 4.5, n: 6, base: 2.3, amp: 1.5, cols: SEA[1] }), waves({ id: 'waveB', w: 32, h: 4, n: 5, base: 1.9, amp: 1.4, cols: SEA[2] })],
      rows: [{ strip: 'waveA', D: 7.8, anim: ROCK[0] }, { strip: 'waveB', D: 5.6, anim: ROCK[1] }] },
    { id: 'near', ...LAYER.near, strips: [waves({ id: 'waveC', w: 30, h: 3.7, n: 4, base: 1.5, amp: 1.5, cols: SEA[3] }), waves({ id: 'waveD', w: 28, h: 3.5, n: 4, base: 1.2, amp: 1.5, cols: SEA[1] })],
      rows: [{ strip: 'waveC', D: 4.2, anim: ROCK[2] }, { strip: 'waveD', D: 2.8, anim: ROCK[3] }] },
  ],
};
