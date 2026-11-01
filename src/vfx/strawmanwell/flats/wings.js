// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S PAINTED FLATS, THE WINGS: backstage behind the hub (a theme for flats/build.js). Farthest, the sewing basket's own
// wicker wall, dim, a few work lamps hung on their ropes pooling warm light on it; then racks of flats stacked on edge, seen from
// behind; then single flats turned round (raw canvas on a timber frame, toggle bars and a diagonal brace, stencilled marks: a
// registration cross, an arrow, a star, a button) and fly ropes come down with their sandbags; nearest, a pin rail
// with rope tied off and coiled, a costume trunk, a stepladder. Dim and warm: backstage is lit by what spills from the stage.
//
// Prior art: the back of any theatre's scene dock (flats racked on edge, stencilled with their show and their place), the pin rail of
// a hemp house; Pollock's sheet of "the stage from behind"; a wicker sewing basket's weave.
//
//   WINGS (a theme: { air, layers })
// ---------------------------------------------------------------------------------------
import { LAYER, scatter, css, shade, cutOut, disc, poly, dabs, strokes, hatch, vwash, INK } from './kit.js';

const CANVAS = [0xe2d3b0, 0xcdb88e, 0xa8916a], TIMBER = 0xb88a52;
const dim = (Ly, k) => ({ ...Ly, light: Ly.light.map((c) => c.map((v) => v * k)) });

/** The wicker wall (stretched over the drop): strands woven over and under, darker toward the floor's far end and the flies. */
function wicker(g, P) {
  const { w, h, R } = P;
  vwash(g, -2, 0, w + 4, h, [[0, 0x2e1a10], [0.4, 0x4a2c18], [1, 0x24140c]]);
  // (each row one weaver strand passing over and under the stakes: a single stroke a row, its light along its top)
  const cw = 1.3, ch = 0.75;
  for (let row = 0, y = ch / 2; y < h + ch; row++, y += ch) {
    const ph = (row % 2) * Math.PI, wave = (x) => y + Math.sin((x / cw) * Math.PI + ph) * ch * 0.16;
    g.lineCap = 'round'; g.lineWidth = ch * 0.78; g.strokeStyle = css(shade(row % 2 ? 0x7a5230 : 0x8a6038, (R() - 0.5) * 0.16));
    g.beginPath(); g.moveTo(-2, wave(-2)); for (let x = -1.8; x < w + 2; x += 0.2) g.lineTo(x, wave(x)); g.stroke();
    g.lineWidth = ch * 0.14; g.strokeStyle = css(0xd8a868, 0.28);
    g.beginPath(); g.moveTo(-2, wave(-2) + ch * 0.2); for (let x = -1.8; x < w + 2; x += 0.2) g.lineTo(x, wave(x) + ch * 0.2); g.stroke();
  }
  g.fillStyle = css(0x1a0c06, 0.45); for (let x = -2; x < w + 2; x += cw) g.fillRect(x - 0.06, 0, 0.14, h);
  for (const gx of [0.18, 0.5, 0.82]) {
    const gr = g.createRadialGradient(gx * w, h * 0.42, 0, gx * w, h * 0.42, 16); gr.addColorStop(0, css(0xffc070, 0.45)); gr.addColorStop(1, css(0xffc070, 0));
    g.fillStyle = gr; g.fillRect(-2, 0, w + 4, h);
  }
  vwash(g, -2, 0, w + 4, h * 0.25, [[0, 0x140a06, 0.6], [1, 0x140a06, 0]]);
}
/** A work lamp hung on its rope: an enamel shade, its bulb lit. */
const lamp = { w: 1.6, h: 11, paint(g, P) {
  const p = new Path2D(); poly(p, [[0.72, 1.2], [0.72, 11.4], [0.88, 11.4], [0.88, 1.2]]); poly(p, [[0.05, 0.5], [0.45, 1.3], [1.15, 1.3], [1.55, 0.5]]); disc(p, 0.8, 0.45, 0.28);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0xa88660); g.fillRect(0.72, 1.2, 0.16, 10.2); strokes(g, P.R, { x: 0.72, y: 1.3, w: 0.16, h: 10, n: 30, len: [0.15, 0.3], lw: P.px * 2, cols: [0x6b4a2a], lean: 0.8 });
    vwash(g, 0, 0.5, 1.6, 1.3, [[0, 0x1f3a36], [1, 0x2f7f7a]]); g.fillStyle = css(0xfff0c0); g.beginPath(); g.arc(0.8, 0.45, 0.28, 0, Math.PI * 2); g.fill();
  }, { px: P.px, lift: 2 });
} };
/** A flat seen from behind: the canvas taut on its stiles and rails, toggle bars, a diagonal brace, its marks stencilled. */
function flatBack(w, h, mark) {
  return { w, h, paint(g, P) {
    const R = P.R, p = poly(new Path2D(), [[0, 0], [0, h], [w, h], [w, 0]]);
    cutOut(g, p, (g) => {
      vwash(g, 0, 0, w, h, [[0, CANVAS[2]], [0.5, CANVAS[1]], [1, CANVAS[0]]]);
      dabs(g, R, { x: 0, y: 0, w, h, n: Math.round(w * h * 4), r: [0.15, 0.5], cols: [CANVAS[0], CANVAS[2], 0xb8945e], alpha: [0.08, 0.2] });
      hatch(g, 0, 0, w, h, { gap: 0.06, angle: 0, lw: P.px * 2, col: 0x8a7050, a: 0.12 });
      const wood = (x0, y0, x1, y1, t = 0.22) => { const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * t / 2, ny = Math.cos(a) * t / 2, q = poly(new Path2D(), [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]);
        g.fillStyle = css(TIMBER); g.fill(q); g.strokeStyle = css(INK, 0.8); g.lineWidth = P.px * 3; g.stroke(q); };
      wood(0.12, 0, 0.12, h); wood(w - 0.12, 0, w - 0.12, h); wood(0, 0.12, w, 0.12); wood(0, h - 0.12, w, h - 0.12);
      for (const t of [0.34, 0.67]) wood(0, h * t, w, h * t, 0.18);
      wood(0.2, h * 0.36, w - 0.2, h * 0.66, 0.16);
      for (const [x, y] of [[0.12, 0.12], [w - 0.12, 0.12], [0.12, h - 0.12], [w - 0.12, h - 0.12]]) { g.fillStyle = css(0xd8a944); g.beginPath(); g.moveTo(x - 0.35, y); g.lineTo(x, y + 0.35 * Math.sign(h / 2 - y)); g.lineTo(x + 0.35 * Math.sign(w / 2 - x), y); g.fill(); }
      stencil(g, w * 0.5, h * 0.82, 0.55, mark, P.px);
      stencil(g, w * 0.3, h * 0.17, 0.3, (mark + 1) % 4, P.px);
    }, { px: P.px });
  } };
}
/** A stencilled mark (no words): 0 a registration cross, 1 an arrow, 2 a star, 3 a button. */
function stencil(g, x, y, r, kind, px) {
  g.save(); g.fillStyle = css(0x7a1424, 0.75); g.strokeStyle = css(0x7a1424, 0.75); g.lineWidth = Math.max(px * 3, r * 0.16); g.lineCap = 'butt';
  if (kind === 0) {
    g.beginPath();
    for (let k = 0; k < 4; k++) { const a0 = (k * Math.PI) / 2 + 0.22, a1 = ((k + 1) * Math.PI) / 2 - 0.22; g.moveTo(x + Math.cos(a0) * r * 0.7, y + Math.sin(a0) * r * 0.7); g.arc(x, y, r * 0.7, a0, a1); }
    g.stroke();
    g.fillRect(x - r, y - r * 0.06, r * 0.7, r * 0.12); g.fillRect(x + r * 0.3, y - r * 0.06, r * 0.7, r * 0.12); g.fillRect(x - r * 0.06, y - r, r * 0.12, r * 0.7); g.fillRect(x - r * 0.06, y + r * 0.3, r * 0.12, r * 0.7);
  } else if (kind === 1) g.fill(poly(new Path2D(), [[x - r, y - r * 0.2], [x + r * 0.2, y - r * 0.2], [x + r * 0.2, y - r * 0.55], [x + r, y], [x + r * 0.2, y + r * 0.55], [x + r * 0.2, y + r * 0.2], [x - r, y + r * 0.2]]));
  else if (kind === 2) { const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? r * 0.42 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } g.fill(poly(new Path2D(), pts)); }
  else {
    g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.fill();
    g.fillStyle = css(CANVAS[1]); for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(x + dx * r * 0.24, y + dy * r * 0.24, Math.max(px * 2.5, r * 0.11), 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}
/** A fly rope come down from the grid with a sandbag tied off on it. */
const rope = { w: 1.4, h: 14, paint(g, P) {
  const p = new Path2D(); poly(p, [[0.62, 1.2], [0.62, 14.4], [0.78, 14.4], [0.78, 1.2]]); poly(p, [[0.2, 0], [0.12, 0.9], [0.45, 1.35], [0.95, 1.35], [1.28, 0.9], [1.2, 0]]);
  cutOut(g, p, (g) => {
    g.fillStyle = css(0xb89868); g.fillRect(0.6, 1.2, 0.2, 13.2); strokes(g, P.R, { x: 0.62, y: 1.2, w: 0.16, h: 13, n: 60, len: [0.15, 0.3], lw: P.px * 2, cols: [0x6b4a2a, 0xe0c898], lean: 0.8 });
    vwash(g, 0, 0, 1.4, 1.4, [[0, 0x5e4426], [1, 0x9a7a4e]]); hatch(g, 0, 0, 1.4, 1.4, { gap: 0.08, angle: 0.8, lw: P.px * 2, a: 0.25 }); g.fillStyle = css(0x3a2414); g.fillRect(0.4, 1.0, 0.6, 0.1);
  }, { px: P.px, lift: 3 });
} };
/** Racks of flats on edge, seen from behind: tall panels leaning a little, battens across them (a strip that repeats). */
const RACKS = { id: 'racks', w: 40, h: 12, flip: true, profile: (x) => 8.5 + 1.6 * Math.sin((x / 40) * Math.PI * 6) + 0.6 * Math.sin((x / 40) * Math.PI * 14), paint(g, P) {
  const R = P.R, p = new Path2D(), panels = [];
  for (let x = -1; x < 41; x += 2.3) { const top = RACKS.profile(x + 1.1), lean = (R() - 0.5) * 0.5; panels.push([x, top, lean]); poly(p, [[x, -1], [x + lean, top], [x + 2.3 + lean, top], [x + 2.3, -1]]); }
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 42, 12, [[0, 0x5e4a36], [1, 0x8a7458]]);
    for (const [x, top, lean] of panels) {
      g.fillStyle = css(shade(0x9a8462, (R() - 0.5) * 0.3)); g.fill(poly(new Path2D(), [[x + 0.1, 0], [x + lean + 0.1, top - 0.1], [x + 2.2 + lean, top - 0.1], [x + 2.2, 0]]));
      g.strokeStyle = css(0x4a3220, 0.8); g.lineWidth = P.px * 4; g.beginPath(); for (const t of [0.3, 0.65]) { g.moveTo(x + lean * t, top * t); g.lineTo(x + 2.3 + lean * t, top * t); } g.stroke();
      g.strokeStyle = css(INK, 0.6); g.lineWidth = P.px * 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + lean, top); g.stroke();
    }
    dabs(g, R, { x: -1, y: 0, w: 42, h: 12, n: 200, r: [0.3, 0.9], cols: [0x3a2618, 0xa88a60], alpha: [0.06, 0.16] });
  }, { px: P.px });
} };
/** The pin rail: a rail on its brackets, belaying pins, rope tied off on them and coiled below (a strip that repeats). */
const PINRAIL = { id: 'pinrail', w: 30, h: 2.2, flip: false, profile: () => 1.6, paint(g, P) {
  const R = P.R, p = new Path2D(); poly(p, [[-1, 1.25], [31, 1.25], [31, 1.55], [-1, 1.55]]);
  for (let x = 0.5; x < 30; x += 1.5) poly(p, [[x - 0.06, 1.0], [x - 0.06, 2.0], [x, 2.08], [x + 0.06, 2.0], [x + 0.06, 1.0]]);
  for (let x = 2; x < 30; x += 6) poly(p, [[x - 0.12, -1], [x - 0.12, 1.3], [x + 0.12, 1.3], [x + 0.12, -1]]);
  for (let x = 0.5; x < 30; x += 3) { disc(p, x + 0.1, 0.75, 0.32, 0.42); }
  cutOut(g, p, (g) => {
    vwash(g, -1, 0, 32, 2.2, [[0, 0x4a2c18], [0.6, 0x7a5230], [1, 0xc89a5c]]);
    for (let x = 0.5; x < 30; x += 3) { g.strokeStyle = css(0xe0c898, 0.8); g.lineWidth = P.px * 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + 0.1, 0.75, 0.32 - k * 0.06, 0.42 - k * 0.06, 0, 0, Math.PI * 2); g.stroke(); } }
    strokes(g, R, { x: -1, y: 1.25, w: 32, h: 0.3, n: 80, len: [0.4, 1.2], lw: P.px * 2, cols: [0x3a2214, 0xd8a868], alpha: [0.2, 0.4], lean: 1.55, bend: 0.01 });
  }, { px: P.px });
} };
/** A costume trunk: brass corners and a hasp, its lid strapped. */
const trunk = { w: 2.6, h: 1.7, paint(g, P) {
  const p = poly(new Path2D(), [[0, 0], [0, 1.3], [0.3, 1.7], [2.3, 1.7], [2.6, 1.3], [2.6, 0]]);
  cutOut(g, p, (g) => {
    vwash(g, 0, 0, 2.6, 1.7, [[0, 0x3e0a14], [1, 0x7a1424]]); dabs(g, P.R, { x: 0, y: 0, w: 2.6, h: 1.7, n: 40, r: [0.1, 0.3], cols: [0x9a2a34, 0x2a0610], alpha: [0.15, 0.35] });
    g.fillStyle = css(0x6b4226); g.fillRect(0, 1.2, 2.6, 0.12); for (const x of [0.6, 2.0]) g.fillRect(x - 0.08, 0, 0.16, 1.7);
    g.fillStyle = css(0xd8a944); for (const [x, y] of [[0, 0], [2.4, 0], [0, 1.1], [2.4, 1.1]]) g.fillRect(x, y, 0.2, 0.2); g.fillRect(1.2, 1.05, 0.2, 0.3);
  }, { px: P.px });
} };
/** A stepladder, open. */
const ladder = { w: 1.8, h: 3.6, paint(g, P) {
  const p = new Path2D(); poly(p, [[0.1, 0], [0.8, 3.6], [1.0, 3.6], [0.3, 0]]); poly(p, [[1.5, 0], [0.9, 3.5], [1.05, 3.5], [1.7, 0]]);
  for (let y = 0.6; y < 3.3; y += 0.7) { const t = y / 3.6; poly(p, [[0.2 + 0.7 * t, y], [1.6 - 0.6 * t, y], [1.6 - 0.6 * t, y + 0.12], [0.2 + 0.7 * t, y + 0.12]]); }
  cutOut(g, p, (g) => { vwash(g, 0, 0, 1.8, 3.6, [[0, 0x8a6038], [1, 0xc89a5c]]); strokes(g, P.R, { x: 0, y: 0, w: 1.8, h: 3.6, n: 40, len: [0.3, 0.8], lw: P.px * 2, cols: [0x6b4226], alpha: [0.2, 0.4], lean: 0.2 }); }, { px: P.px });
} };

export const WINGS = {
  air: 0x5a4030,
  layers: [
    { id: 'sky', ...dim(LAYER.sky, 0.9), body: { px: 250, paint: wicker }, sprites: { lamp },
      place: ({ lane }) => [0.12, 0.42, 0.72, 1.0].map((t, i) => ({ s: 'lamp', x: lane.len * t - 4, y: 8 + (i % 2) * 1.2 })) },
    { id: 'far', ...dim(LAYER.far, 0.85), hazeA: 0.38, strips: [RACKS] },
    { id: 'mid', ...dim(LAYER.mid, 0.95), hazeA: 0.1, sprites: { fa: flatBack(4.6, 8.2, 0), fb: flatBack(3.6, 7.2, 1), fc: flatBack(5.2, 8.8, 2), fd: flatBack(4, 7.6, 3), rope },
      place: ({ ext, R }) => {
        const out = [];
        scatter(R, ext.x0, ext.x1, 6.5, 1.5, (x, i) => {
          out.push({ s: ['fa', 'fb', 'fc', 'fd'][i % 4], x, y: -0.1, flip: R() < 0.3 });
          if (i % 2) out.push({ s: 'rope', x: x + 3.2, y: 0.4 + R() * 2.5 });
        });
        return out;
      } },
    { id: 'near', ...LAYER.near, strips: [PINRAIL], sprites: { trunk, ladder },
      place: ({ lane }) => [{ s: 'trunk', x: 4.4, y: -0.05 }, { s: 'ladder', x: lane.len * 0.58, y: -0.05, back: true }, { s: 'trunk', x: lane.len - 3, y: -0.05, flip: true }] },
  ],
};
