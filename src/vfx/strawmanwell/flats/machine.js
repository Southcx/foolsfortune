// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE MACHINE: the inside of a sewing machine behind The Machine (a theme for flats/build.js). A
// clockwork sky (deep teal, brass orbits ringed across it, stars, a great brass gear turning for its sun); far off, the machine's
// japanned cast-iron frame with gold scrollwork and lit portholes, its hand wheel turning; nearer, brass and steel gears turning
// against each other, bobbins and a spool on its spindle, over a bed of cams and bolts; in front, the throat plate's edge with its
// feed dogs' teeth, bobbins lying by it. Four pieces turn (the sky's gear, the hand wheel, two gears), each a mesh of its own.
//
// Prior art: the Singer 15 and 66 (black japanned iron and gold decals, the hand wheel, the bobbin and its case, the feed dogs);
// Hercules (PS1, 1997: painted parallax); Clockwork Knight's and Rayman Origins' clockwork stages; an orrery's brass rings.
//
//   MACHINE (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, scatter, gearPath, spokes, css, shade, cutOut, disc, poly, dabs, strokes, hatch, vwash } from './kit.js';

const BRASS = [0xf2cf7a, 0xd8a944, 0x8a6020], STEEL = [0xe4ecf0, 0xb8c0c8, 0x5a646e], IRON = 0x1c1e26;

/** The clockwork sky (stretched over the drop): deep teal to night, brass orbits ringed across it, stars pricked through. */
function clockSky(g, P) {
  const { w, h, R } = P;
  vwash(g, -2, 0, w + 4, h, [[0, 0x3a6670], [0.35, 0x24465a], [1, 0x101a2c]]);
  g.strokeStyle = css(0xd8a944, 0.55); g.lineWidth = 0.32;
  for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(w * (0.15 + 0.7 * R()), h * (0.45 + 0.4 * R()), 8 + R() * 22, 2 + R() * 5, (R() - 0.5) * 0.3, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = css(0xfff4d0, 0.85);
  for (let i = 0; i < w * 1.5; i++) { g.beginPath(); g.arc(R() * w, h * (0.3 + 0.7 * R()), 0.22 + R() * 0.12, 0, Math.PI * 2); g.fill(); }
  dabs(g, R, { x: -2, y: 0, w: w + 4, h: h * 0.4, n: Math.round(w / 2), r: [2, 6], squash: 0.25, tilt: 0, cols: [0x5a8a8a, 0x2f7f7a], alpha: [0.08, 0.18] });
}

/** A gear cut-out of radius r with n teeth, spoked, in brass or steel (`cols` light, mid, dark). */
function gear(r, n, cols, nspokes = 5) {
  const t = r * 0.16, s = (r + t) * 2 + 0.2;
  return { w: s, h: s, paint(g, P) {
    const c = s / 2, p = gearPath(new Path2D(), c, c, r, n, t, 0.16); if (nspokes) spokes(p, c, c, r * 0.32, r * 0.74, nspokes);
    cutOut(g, p, (g) => {
      const gr = g.createRadialGradient(c - r * 0.3, c + r * 0.3, r * 0.1, c, c, r + t); gr.addColorStop(0, css(cols[0])); gr.addColorStop(0.6, css(cols[1])); gr.addColorStop(1, css(cols[2]));
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
      g.strokeStyle = css(cols[2], 0.7); g.lineWidth = P.px * 3; for (const k of [0.8, 0.3]) { g.beginPath(); g.arc(c, c, r * k, 0, Math.PI * 2); g.stroke(); }
      dabs(g, P.R, { x: 0, y: 0, w: s, h: s, n: 50, r: [r * 0.04, r * 0.12], cols: [cols[0], 0xffffff], alpha: [0.1, 0.3] });
    }, { px: P.px, lift: 3 });
  } };
}
/** The hand wheel: a rim, five curved spokes, a hub with its clutch knob. */
const handwheel = { w: 8.8, h: 8.8, paint(g, P) {
  const c = 4.4, r = 4.2, p = new Path2D(); disc(p, c, c, r); p.moveTo(c + r * 0.8, c); p.arc(c, c, r * 0.8, 0, Math.PI * 2, true);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; poly(p, [[c + Math.cos(a - 0.12) * 0.7, c + Math.sin(a - 0.12) * 0.7], [c + Math.cos(a - 0.05) * r * 0.82, c + Math.sin(a - 0.05) * r * 0.82], [c + Math.cos(a + 0.09) * r * 0.82, c + Math.sin(a + 0.09) * r * 0.82], [c + Math.cos(a + 0.2) * 0.7, c + Math.sin(a + 0.2) * 0.7]]); }
  disc(p, c, c, 1.0);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0x2a2c34); g.fillRect(0, 0, 8.8, 8.8);
    g.strokeStyle = css(0xe2b04a, 0.9); g.lineWidth = P.px * 4; g.beginPath(); g.arc(c, c, r * 0.9, 0, Math.PI * 2); g.stroke();
    g.fillStyle = css(0xb8c0c8); g.beginPath(); g.arc(c, c, 0.55, 0, Math.PI * 2); g.fill();
    hatch(g, c, 0, 8.8, 8.8, { gap: 0.18, angle: 1.0, lw: P.px * 2, col: 0x000000, a: 0.3 });
  }, { px: P.px });
} };
/** A bobbin: two steel cheeks and the thread between them. */
function bobbin(w, h, col) {
  return { w, h, paint(g, P) {
    const p = new Path2D(); disc(p, w / 2, h * 0.5, w * 0.48, h * 0.48);
    cutOut(g, p, (g) => {
      const gr = g.createRadialGradient(w * 0.4, h * 0.6, 0, w / 2, h / 2, w * 0.5); gr.addColorStop(0, css(STEEL[0])); gr.addColorStop(1, css(STEEL[2])); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = css(col); g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.36, h * 0.36, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = css(shade(col, -0.35), 0.6); g.lineWidth = P.px * 2.4; for (let k = 0.12; k < 0.36; k += 0.05) { g.beginPath(); g.ellipse(w / 2, h / 2, w * k, h * k, 0, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = css(STEEL[2]); g.beginPath(); g.arc(w / 2, h / 2, w * 0.08, 0, Math.PI * 2); g.fill();
    }, { px: P.px, lift: 3 });
  } };
}
/** A spool of thread on its spindle pin. */
const spindle = { w: 2.2, h: 4.4, paint(g, P) {
  const p = new Path2D(); poly(p, [[1.0, 0], [1.0, 4.4], [1.2, 4.4], [1.2, 0]]); poly(p, [[0.1, 0.6], [0.1, 0.85], [2.1, 0.85], [2.1, 0.6]]); poly(p, [[0.3, 0.85], [0.3, 3.0], [1.9, 3.0], [1.9, 0.85]]); poly(p, [[0.1, 3.0], [0.1, 3.25], [2.1, 3.25], [2.1, 3.0]]);
  cutOut(g, p, (g) => {
    g.fillStyle = css(STEEL[1]); g.fillRect(0, 0, 2.2, 4.4);
    vwash(g, 0.3, 0.85, 1.6, 3.0, [[0, 0x7a1424], [1, 0xc8606a]]); g.strokeStyle = css(0x4a0a14, 0.5); g.lineWidth = P.px * 2.2; for (let y = 0.95; y < 3; y += 0.09) { g.beginPath(); g.moveTo(0.3, y); g.lineTo(1.9, y + 0.03); g.stroke(); }
    for (const y of [0.6, 3.0]) vwash(g, 0.1, y, 2, 0.25, [[0, 0x9a6a3e], [1, 0xd8aa6a]]);
  }, { px: P.px });
} };

/** The cast-iron frame: a japanned wall of arches and pillars, gold scrolls on it, portholes glowing (a strip that repeats). */
const FRAME = { id: 'frame', w: 44, h: 13.6, flip: false, profile: (x) => 9.4 + (Math.abs(((x / 11) % 1) - 0.5) < 0.18 ? 2.6 : 0), paint(g, P) {
  const p = new Path2D(); poly(p, [[-1, -1], [-1, 9.4], [45, 9.4], [45, -1]]);
  for (let x = -5.5; x < 48; x += 11) { poly(p, [[x + 3.5, 9], [x + 3.5, 11.6], [x + 7.5, 11.6], [x + 7.5, 9]]); disc(p, x + 5.5, 12.1, 1.3, 0.9); }
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 46, 13.6, [[0, 0x0e1016], [0.6, IRON], [1, 0x343844]]);
    for (let x = -5.5; x < 48; x += 11) {
      const cx = x + 5.5; g.fillStyle = css(0x3a2614); g.beginPath(); g.arc(cx, 5.4, 1.5, 0, Math.PI * 2); g.fill();
      const gl = g.createRadialGradient(cx, 5.4, 0.1, cx, 5.4, 1.4); gl.addColorStop(0, css(0xffe0a0)); gl.addColorStop(1, css(0xd88a3a)); g.fillStyle = gl; g.beginPath(); g.arc(cx, 5.4, 1.25, 0, Math.PI * 2); g.fill();
      g.strokeStyle = css(BRASS[1]); g.lineWidth = P.px * 6; g.beginPath(); g.arc(cx, 5.4, 1.4, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = css(0xe2b04a, 0.85); g.lineWidth = P.px * 3.5;
      for (const sx of [-1, 1]) { g.beginPath(); for (let t = 0; t < 4 * Math.PI; t += 0.2) { const rr = 0.15 + t * 0.09, px = cx + sx * (3 + Math.cos(t) * rr), py = 8 + Math.sin(t) * rr; if (t === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); }
      g.beginPath(); g.moveTo(cx - 4.2, 8); g.quadraticCurveTo(cx, 9.2, cx + 4.2, 8); g.stroke();
      g.fillStyle = css(0xb8c0c8, 0.8); for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + 0.6, 1 + k * 1.3, 0.12, 0, Math.PI * 2); g.fill(); }
    }
    hatch(g, -1, 0, 45, 3, { gap: 0.2, angle: 0.5, lw: P.px * 2, col: 0x000000, a: 0.25 });
  }, { px: P.px, edge: 0x9aa0a8 });
} };
/** The bed of works: a cast plate, bolts along it, cams standing on a shaft (a strip that repeats). */
const WORKS = { id: 'works', w: 40, h: 5.2, flip: false, profile: () => 3.1, paint(g, P) {
  const p = new Path2D(); poly(p, [[-1, -1], [-1, 2.6], [41, 2.6], [41, -1]]);
  for (let x = 0; x < 40; x += 5) disc(p, x + 2.5, 3.2, 1.0, 1.25);
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 42, 5.2, [[0, 0x2a2c34], [1, 0x5a5e6a]]);
    for (let x = 0; x < 40; x += 5) { const gr = g.createRadialGradient(x + 2.2, 3.6, 0.1, x + 2.5, 3.2, 1.3); gr.addColorStop(0, css(BRASS[0])); gr.addColorStop(1, css(BRASS[2])); g.fillStyle = gr; g.beginPath(); g.ellipse(x + 2.5, 3.2, 1.0, 1.25, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = css(0x2a1a12); g.beginPath(); g.arc(x + 2.5, 3.0, 0.2, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = css(STEEL[1]); g.fillRect(-1, 2.85, 42, 0.32);
    for (let x = 0.6; x < 40; x += 1.25) { g.fillStyle = css(STEEL[0]); g.beginPath(); g.arc(x, 1.6, 0.17, 0, Math.PI * 2); g.fill(); g.fillStyle = css(0x1a1a1a); g.fillRect(x - 0.12, 1.57, 0.24, 0.07); }
    dabs(g, P.R, { x: -1, y: 0, w: 42, h: 2.6, n: 140, r: [0.15, 0.4], cols: [0x8a8e9a, 0x1a1c22], alpha: [0.08, 0.2] });
  }, { px: P.px, edge: 0xb8c0c8 });
} };
/** The throat plate's edge: polished steel, its slots, the feed dogs' teeth standing up through it (a strip that repeats). */
const PLATE = { id: 'plate', w: 30, h: 2.6, flip: false, profile: () => 1.5, paint(g, P) {
  const p = new Path2D(); poly(p, [[-1, -1], [-1, 1.4], [31, 1.4], [31, -1]]);
  for (let x = 2; x < 30; x += 10) for (let k = 0; k < 6; k++) poly(p, [[x + k * 0.5, 1.35], [x + k * 0.5 + 0.12, 1.95], [x + k * 0.5 + 0.38, 1.35]]);
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 32, 2.6, [[0, STEEL[2]], [0.55, STEEL[1]], [0.6, STEEL[0]], [1, STEEL[1]]]);
    for (let x = 1; x < 30; x += 5) { g.fillStyle = css(0x1a1c22); g.fillRect(x, 0.5, 2.2, 0.28); g.fillStyle = css(STEEL[0], 0.8); g.fillRect(x, 0.78, 2.2, 0.06); }
    for (let x = 4; x < 30; x += 7.5) { g.fillStyle = css(STEEL[0]); g.beginPath(); g.arc(x, 1.0, 0.2, 0, Math.PI * 2); g.fill(); g.fillStyle = css(0x2a2c34); g.fillRect(x - 0.15, 0.97, 0.3, 0.07); }
    strokes(g, P.R, { x: -1, y: 0, w: 32, h: 1.4, n: 70, len: [1, 3], lw: P.px * 2, cols: [0xffffff, 0x5a646e], alpha: [0.08, 0.2], lean: 1.55, bend: 0.01 });
  }, { px: P.px, edge: 0xe4ecf0 });
} };

export const MACHINE = {
  air: 0x7a8a96,
  layers: [
    { id: 'sky', ...LAYER.sky, body: { px: 250, paint: clockSky }, sprites: { big: gear(3.6, 14, BRASS, 6), small: gear(1.7, 9, BRASS, 4) },
      place: ({ lane, ext, R }) => {
        const x = lane.len * 0.62, out = [{ s: 'big', x, y: 6, spin: 0.08 }];
        scatter(R, ext.x0, ext.x1, 26, 8, (sx) => { if (Math.abs(sx - x) > 9) out.push({ s: 'small', x: sx, y: 8 + R() * 6, scale: 0.8 + R() * 0.6, turn: R() * 3 }); });
        return out;
      } },
    { id: 'far', ...LAYER.far, hazeA: 0.24, strips: [FRAME], sprites: { wheel: handwheel },
      place: ({ lane }) => [{ s: 'wheel', x: lane.len * 0.3, y: 4.2, spin: 0.22, dz: 0.1 }] },
    { id: 'mid', ...LAYER.mid, strips: [WORKS], sprites: { g1: gear(2.5, 16, BRASS, 5), g2: gear(1.5, 10, STEEL, 4), g3: gear(1.9, 12, STEEL, 5), bob: bobbin(2, 2, 0x2f7f7a), spin: spindle },
      place: ({ lane, ext, R }) => {
        // (two gears in mesh: the small one up and to the right at the sum of their pitch radii, turning the other way, 16 teeth to 10)
        const a = lane.len * 0.55, c1 = 3.4 + 3.0, d = 4.3, b = 0.35, out = [{ s: 'g1', x: a, y: 3.4, spin: 0.25 }, { s: 'g2', x: a + d * Math.cos(b), y: c1 + d * Math.sin(b) - 1.84, spin: -0.25 * 1.6, turn: 0.15 }];
        scatter(R, ext.x0, ext.x1, 12, 3, (x, i) => { if (Math.abs(x - a) > 6) out.push(i % 3 === 0 ? { s: 'g3', x, y: 2.6 + R(), turn: R() * 3 } : i % 3 === 1 ? { s: 'spin', x, y: 2.4 } : { s: 'bob', x, y: 2.7, scale: 0.8 + R() * 0.3 }); });
        return out;
      } },
    { id: 'near', ...LAYER.near, strips: [PLATE], sprites: { bob: bobbin(1.5, 1.5, 0xd6a32a), bob2: bobbin(1.3, 1.3, 0xc8606a) },
      place: ({ ext, R }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 13, 4, (x, i) => out.push({ s: i % 2 ? 'bob' : 'bob2', x, y: 1.2, back: true }));
        return out;
      } },
  ],
};
