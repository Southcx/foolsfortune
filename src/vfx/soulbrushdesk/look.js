// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S DESK: its look as data and its small helpers (part of vfx/soulbrushdesk.js). The seats in the range (the seven feelings
// in display order, then CLEAN: tools/soulbrush/radial.js PICKS), each feeling's colour (progress/weather.js COLOR), the paint motifs'
// silhouettes (one language for the seven, as the Sondelass's lure ring speaks it), the ink, the paper and the seal paste, the
// verdigris plate, a brush stroke stamped with its dry broken tail (kasure), and the seal chop in its two cuts. Everything in dots (a
// line of the 480-line present), as the mock (board v11, r11-soulbrush) draws it.
//
// Prior art: the mock's own helpers (r11-soulbrush.src.html: featPath, motif, stroke, chop, plateBox), ported; seal carving's two cuts,
// baiwen (intaglio, the mark cut away, white in red) and zhuwen (relief, the mark left standing, red on paper); kasure, the dry brush.
//
//   SEATS[i] -> { id, c }   NS   seatCol(i)   featPath(x, id, r)   motif(x, id, x0, y0, x1, y1, lw, t, seed)   stroke(x, P, len, w, p, col, seed)
//   polyP(pts) -> [P(s), len]   chop(x, src, cx, cy, s, a, pressAge)   plateBox(x, X, Y, w, h, t)   nameCol(id)   srcCol(src)   srcLine(src)
//   VERM SUMI PAPER INK FAIR, and the reliquary's shared helpers re-exported (C01 sm oB lerp KEY VERD J15 CZ film rgba mixH shade rng TAU D)
// ---------------------------------------------------------------------------------------
import { COLOR, DISPLAY_ORDER } from '../../progress/weather.js';
import { C01, sm, oB, lerp, KEY, VERD, J15, CZ, film, rgba, mixH, shade, rng, hexOf, TAU, D } from '../lockheartreliquary/look.js';
export { C01, sm, oB, lerp, KEY, VERD, J15, CZ, film, rgba, mixH, shade, rng, TAU, D };

export const VERM = '#c8402a', SUMI = '#0d0b0b', PAPER = '#efe4cc', INK = '#191310', FAIR = '#c9d2d8';
/** The range's seats, right to left: the seven in display order, then CLEAN (the trough). */
export const SEATS = [...DISPLAY_ORDER.map((id) => ({ id, c: hexOf(COLOR[id]) })), { id: 'clean', c: '#e8f6f8' }];
export const NS = SEATS.length;
export const seatCol = (i) => SEATS[Math.max(0, Math.min(NS - 1, Math.round(i)))].c;
export const mod = (a, n) => ((a % n) + n) % n;
/** A seat's name in its colour on the plate (Dread lifted to read on the verdigris). */
export const nameCol = (id) => (id === 'dread' ? '#7fae8a' : id === 'clean' ? '#e8f6f8' : shade(hexOf(COLOR[id] ?? 0xffffff), 0.2));
export const srcCol = (I) => (I.id ? nameCol(I.id) : FAIR);
/** The plate's third line: where the paint comes from (OVERLAY.md 19.1). */
export const srcLine = (I) => 'FROM ' + (I.w ? (I.id ? `${I.id.toUpperCase()} WEATHER` : 'FAIR WEATHER') : I.id.toUpperCase());

/** A feeling's paint motif as a silhouette, so a peak's inlay reads by shape alone: Wonder a frost star, Mirth three dots, Desire a
 *  ripple fan, Fury a crack bolt, Gall a curd, Grief a tear, Dread a crescent. */
export function featPath(x, id, r) {
  x.beginPath();
  if (id === 'wonder') { for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, q = i % 2 ? r * 0.42 : r * 1.12; i ? x.lineTo(Math.cos(a) * q, Math.sin(a) * q) : x.moveTo(Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); }
  else if (id === 'mirth') { for (const a of [-90, 30, 150]) { const cx = Math.cos(a * D) * r * 0.52, cy = Math.sin(a * D) * r * 0.52; x.moveTo(cx + r * 0.52, cy); x.arc(cx, cy, r * 0.52, 0, TAU); } }
  else if (id === 'desire') { const cy = r * 0.7; x.moveTo(0, cy); x.arc(0, cy, r * 1.6, -Math.PI / 2 - 0.8, -Math.PI / 2 + 0.8); x.closePath(); }
  else if (id === 'fury') { [[-0.2, -1.1], [0.62, -1.1], [0.18, -0.22], [0.68, -0.22], [-0.38, 1.12], [-0.06, 0.16], [-0.6, 0.16]].forEach(([u, v], i) => (i ? x.lineTo(u * r, v * r) : x.moveTo(u * r, v * r))); x.closePath(); }
  else if (id === 'gall') { const s = r * 0.84, c = r * 0.32; x.moveTo(-s + c, -s); x.arcTo(s, -s, s, s, c); x.arcTo(s, s, -s, s, c); x.arcTo(-s, s, -s, -s, c); x.arcTo(-s, -s, s, -s, c); x.closePath(); }
  else if (id === 'grief') { x.moveTo(0, -r * 1.15); x.bezierCurveTo(r * 0.25, -r * 0.6, r * 0.86, -r * 0.05, r * 0.86, r * 0.3); x.arc(0, r * 0.3, r * 0.86, 0, Math.PI); x.bezierCurveTo(-r * 0.86, -r * 0.05, -r * 0.25, -r * 0.6, 0, -r * 1.15); x.closePath(); }
  else if (id === 'dread') { x.arc(0, 0, r, 0.896, TAU - 0.896); x.arc(0.45 * r, 0, 0.8 * r, -1.35, 1.35, true); x.closePath(); }
  else x.arc(0, 0, r, 0, TAU);
}

/** The paint's motifs (vfx/paintmotifs.js), drawn small in the hairs; crude's an oil film, Clean's a few bubbles. */
export function motif(x, id, x0, y0, x1, y1, lw, t, seed) {
  const R = rng(seed || 7); x.save(); x.lineWidth = lw; x.lineCap = 'round';
  if (id === 'wonder') { x.strokeStyle = 'rgba(240,252,255,.7)'; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a); for (let d = -36; d <= 36; d += 3.4) { x.beginPath(); x.moveTo(-36 * c - s * d, -36 * s + c * d); x.lineTo(36 * c - s * d, 36 * s + c * d); x.stroke(); } } }
  else if (id === 'mirth') { x.fillStyle = 'rgba(255,248,210,.85)'; let row = 0; for (let y = y0; y <= y1; y += 2.4, row++) for (let X = x0 + (row % 2) * 1.3; X <= x1; X += 2.6) { x.beginPath(); x.arc(X, y, lw * 1.5, 0, TAU); x.fill(); } }
  else if (id === 'desire') { x.strokeStyle = 'rgba(255,214,190,.8)'; for (let y = y0; y <= y1; y += 2.3) { x.beginPath(); for (let X = x0; X <= x1; X += 0.8) x.lineTo(X, y + 0.6 * Math.sin(X * 0.9 + y)); x.stroke(); } }
  else if (id === 'fury') { for (let i = 0; i < 6; i++) { let px = lerp(x0, x1, R()), py = lerp(y0, y1, R()); x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (R() - 0.5) * 5; py += (R() - 0.5) * 5; x.lineTo(px, py); } x.strokeStyle = 'rgba(255,210,120,.95)'; x.stroke(); } }
  else if (id === 'gall') { for (let i = 0; i < 10; i++) { const r = 0.5 + R() * 1.3; x.beginPath(); x.arc(lerp(x0, x1, R()), lerp(y0, y1, R()), r, 0, TAU); x.fillStyle = 'rgba(30,8,44,.6)'; x.fill(); x.strokeStyle = 'rgba(225,205,255,.65)'; x.stroke(); } }
  else if (id === 'grief') { for (let i = 0; i < 16; i++) { const px = lerp(x0, x1, R()), py = lerp(y0, y1, R()), l = 1.5 + R() * 3; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 0.3, py + l); x.strokeStyle = R() < 0.5 ? 'rgba(224,236,255,.7)' : 'rgba(30,40,80,.5)'; x.stroke(); } }
  else if (id === 'dread') { x.strokeStyle = 'rgba(200,232,205,.65)'; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; for (let r = 1.5; r < 14; r += 2.2) { x.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.3) { const q = r + 0.8 * Math.sin(a * 3 + r + t * 0.4); x.lineTo(cx + Math.cos(a) * q * 1.4, cy + Math.sin(a) * q * 0.7); } x.stroke(); } }
  else if (id === 'clean') { x.strokeStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(lerp(x0, x1, R()), lerp(y0, y1, R()), 0.6 + R() * 1.1, 0, TAU); x.stroke(); } }
  else if (id === 'crude') { for (let i = 0; i < 5; i++) { x.beginPath(); for (let X = x0; X <= x1; X += 0.8) x.lineTo(X, lerp(y0, y1, (i + 0.5) / 5) + 0.8 * Math.sin(X * 0.5 + i * 1.7 + t * 0.8)); x.strokeStyle = film(i / 5 + t * 0.05, 0.7); x.stroke(); } }
  x.restore();
}

/** A polyline as a path by arc length: [P(s) -> [x, y], its length]. */
export function polyP(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const T = L[L.length - 1] || 1e-6;
  return [(s) => { const d = s * T; let i = 1; while (i < L.length - 1 && L[i] < d) i++; if (pts.length < 2) return pts[0]; const f = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; }, T];
}

/** A brush stroke along P up to `p` (0..1): stamped dabs, fat at the press, tapering, the last two fifths a dry broken tail (kasure). */
export function stroke(x, P, len, w, p, col, seed) {
  if (p <= 0) return;
  const n = Math.max(6, Math.ceil(len / 0.5)), R = rng(seed || 3);
  const W = (s) => w * (s < 0.08 ? 1.15 - s * 1.2 : s < 0.62 ? 1.05 - 0.25 * (s - 0.08) / 0.54 : 0.8 - 0.6 * (s - 0.62) / 0.38);
  for (let i = 0; i <= n; i++) {
    const s = i / n, r0 = R(), r1 = R(), r2 = R(); if (s > p) break;
    const a = P(s), b = P(Math.min(1, s + 0.01)), c0 = P(Math.max(0, s - 0.01)), tl = Math.hypot(b[0] - c0[0], b[1] - c0[1]) || 1, nx = -(b[1] - c0[1]) / tl, ny = (b[0] - c0[0]) / tl;
    const ww = W(s) * 0.5, dry = s > 0.6 ? (s - 0.6) / 0.4 : 0;
    x.fillStyle = col(s);
    if (!dry) { x.beginPath(); x.arc(a[0], a[1], ww, 0, TAU); x.fill(); continue; }
    const rs = [r0, r1, r2];
    for (let j = 0; j < 3; j++) { if (rs[j] < dry * (j === 1 ? 0.45 : 0.85)) continue; const o = (j - 1) * 0.6 * ww; x.beginPath(); x.arc(a[0] + nx * o, a[1] + ny * o, ww * 0.42, 0, TAU); x.fill(); }
  }
}

/** The source's seal chop (OVERLAY.md 19.1): intaglio for the Bottles' grade (white cut in red), relief for the weather (red on paper in
 *  a red frame; fair weather a single dot). `pressAge` >= 0: just pressed, 1.3 to 1 over 0.25 real s. */
export function chop(x, I, cx, cy, s, a, pressAge) {
  if (a <= 0.01 || !I) return;
  const sc = pressAge >= 0 && pressAge < 0.25 ? lerp(1.3, 1, oB(pressAge / 0.25, 1.2)) : 1;
  x.save(); x.globalAlpha *= a * (pressAge >= 0 ? C01(pressAge / 0.08) : 1); x.translate(cx, cy); x.scale(sc, sc); x.rotate(-0.04);
  const R = rng(61), rough = () => { x.beginPath(); x.moveTo(-s / 2, -s / 2); x.lineTo(s / 2 + (R() - 0.5) * 0.3, -s / 2); x.lineTo(s / 2, s / 2 + (R() - 0.5) * 0.3); x.lineTo(-s / 2, s / 2); x.closePath(); };
  if (!I.w) { rough(); x.fillStyle = VERM; x.fill(); if (I.id) { featPath(x, I.id, s * 0.3); x.fillStyle = PAPER; x.fill(); } }
  else { rough(); x.lineWidth = Math.max(0.7, s * 0.12); x.strokeStyle = VERM; x.stroke(); if (I.id) { featPath(x, I.id, s * 0.28); x.fillStyle = VERM; x.fill(); } else { x.beginPath(); x.arc(0, 0, s * 0.12, 0, TAU); x.fillStyle = VERM; x.fill(); } }
  x.restore();
}

function chamfer(x, X, Y, w, h, c) { x.beginPath(); x.moveTo(X + c, Y); x.lineTo(X + w, Y); x.lineTo(X + w, Y + h - c); x.lineTo(X + w - c, Y + h); x.lineTo(X, Y + h); x.lineTo(X, Y + c); x.closePath(); }
/** The verdigris plate (the house's: the reliquary's and the guard's), its rim in the film. */
export function plateBox(x, X, Y, w, h, t) {
  const c = 4; chamfer(x, X, Y, w, h, c); const g = x.createLinearGradient(0, Y, 0, Y + h); g.addColorStop(0, `rgb(${VERD.top})`); g.addColorStop(1, `rgb(${VERD.bot})`); x.fillStyle = g; x.fill();
  x.save(); x.clip(); const R = rng(9); for (let i = 0; i < (w * h) / 30; i++) { x.fillStyle = R() < 0.6 ? 'rgba(0,0,0,.22)' : 'rgba(226,243,230,.1)'; x.fillRect(X + ((R() * w) | 0), Y + ((R() * h) | 0), 1, 1); } x.restore();
  x.strokeStyle = 'rgba(111,165,150,.55)'; x.lineWidth = 1; chamfer(x, X + 2.5, Y + 2.5, w - 5, h - 5, c - 1); x.stroke();
  const lg = x.createLinearGradient(X, Y, X + w, Y + h); [0, 0.33, 0.66, 1].forEach((p, i) => lg.addColorStop(p, film(i / 4 + t * 0.05, 1))); x.strokeStyle = lg; chamfer(x, X + 0.5, Y + 0.5, w - 1, h - 1, c); x.stroke();
  x.fillStyle = 'rgba(226,243,230,.55)'; x.beginPath(); x.moveTo(X + w - c - 1, Y + 1); x.lineTo(X + w - 1, Y + 1); x.lineTo(X + w - 1, Y + c + 1); x.closePath(); x.fill();
}
