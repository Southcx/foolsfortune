// ---------------------------------------------------------------------------------------
// THE SEAL FACE: your seal drawn (docs/plans/HANKO.md 5; OVERLAY.md 10.5c): the Pneuka Jar's base as a chip die laid out like a
// Goetic seal. Your name in the Comb at its heart (a hex cell a syllable, from cellsOf: Espada's orthography), the Goetic ring round
// it, Manhattan traces from the cells' corners out to that ring, each ending in a ring-dot, the bond pads round the rim (their widths
// are your name's barcode), four fiducials, and the border in the seal's outline. One drawing behind every imprint, the Jar's carving
// and the seal picker: always right-reading (a carving mirrors it itself).
//
// The outline (round, square, oval, gourd: the four common hanko shapes) bends the border, the pads and the Goetic ring; the carving
// says whether the marks stand in ink (relief, shubun) or are cut out of a field of it (intaglio, hakubun). A name the orthography cannot
// spell is drawn in plain capitals in the Goetic ring instead, so a seal is never blank (`{ spelled: false }` says so).
//
// Prior art: round five's Jar seal face (Calissa's mock, overlay/r5-jar: the die, the pads, the traces, the Goetic ticks) and round six's
// gate (overlay/r6-gate: the same face burned into a cradle); the Comb's glyph generator (overlay/r4-comb-core: the cell, the edges by
// place, the strokes by manner, the vowel spokes) driven by the game's spelling; the hanko's maru-in, kaku-in, oval and hyōtan-in, and
// its shubun and hakubun; the Goetic seals' outer ring of marks; a chip die's bond pads, fiducials and routing.
//
//   drawSealFace(ctx, seal, { size, ink, lit }) -> { spelled, cells }
//     seal: { name, outline, carving } (world/cradles.js); null or a name '' draws the face with no name
//     size: px of the square it fills from ctx's origin (256)   ink: any canvas colour ('#6fa596')   lit: true glows (the burn's beat)
// ---------------------------------------------------------------------------------------
import { cellsOf } from '../npc/neuralesespelling.js';
import { FONT } from '../ui/theme.js';

// ---- the Comb (overlay/r4-comb-core.js, ported to cellsOf's cells): a cell's radius is N steps of the triangular sub-lattice
const S3 = Math.sqrt(3), ROW = S3 / 2, N = 8;
const ROT = { on: { L: -60, M: 0, B: 60 }, co: { L: -120, M: 180, B: 120 } }; // (the edge's turn from the onset's middle edge, degrees)
const SPOKE = { I: [-0.5, -ROW], U: [0.5, -ROW], E: [-1, 0], O: [1, 0] };
const hexV = (k) => [N * Math.cos(k * Math.PI / 3), N * Math.sin(k * Math.PI / 3)];
const rot = (p, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), n = Math.sin(a); return [p[0] * c - p[1] * n, p[0] * n + p[1] * c]; };
const fr = (u, d) => [u, -d * ROW];
/** A letter of cellsOf as the Comb's: its edge (place) and stroke (manner); the voice dot only on a voiced stop or fricative. */
function comb(k) {
  const pl = k.place === 'lips' ? 'L' : k.place === 'back' ? 'B' : 'M';
  const m = k.manner === 'stop' ? 'stop' : k.manner === 'nasal' ? 'nasal' : k.manner === 'liquid' ? (k.mark === 'in' ? 'l' : 'r') : k.mark === 'ticks' ? 'sh' : k.mark === 'cross' ? 'th' : 'fric';
  return { pl, m, v: k.voiced && (m === 'stop' || m === 'fric') };
}
// a manner's strokes in the top edge's frame: u along the edge, d rows in from the centre (the wall is row N)
function consShape(m, o, hl) {
  const L = [[[-hl, o], [hl, o]]];
  if (m === 'fric') return [...L, [[0, o], [0.5, o + 1]]];
  if (m === 'sh') return [...L, [[-1, o], [-1.5, o + 1]], [[1, o], [1.5, o + 1]]];
  if (m === 'th') return [...L, [[0.5, o + 1], [-0.5, o - 1]], [[-0.5, o + 1], [0.5, o - 1]]];
  if (m === 'nasal') return [...L, [[-hl + 0.5, o - 1], [hl - 0.5, o - 1]]];
  if (m === 'l') return [[[-hl, o], [-hl + 0.5, o - 1], [hl - 0.5, o - 1], [hl, o]]];
  if (m === 'r') return [[[-hl, o], [-hl + 0.5, o + 1], [hl - 0.5, o + 1], [hl, o]]];
  return L;
}
/** One cell's strokes (polylines) and dots, in cell units round its centre. */
function cellMarks(cell) {
  const polys = [], dots = [];
  const put = (k, slot, inner) => {
    const C = comb(k), th = ROT[slot][C.pl], o = inner ? 4 : 6, hl = inner ? 1 : 2;
    for (const pl of consShape(C.m, o, hl)) polys.push(pl.map(([u, d]) => rot(fr(u, d), th)));
    if (C.v) dots.push([...rot(fr(0, o - 2), th), 0.42]);
  };
  cell.onset.forEach((k, i) => put(k, 'on', i > 0));
  if (cell.coda) put(cell.coda, 'co', false);
  for (const v of cell.vowels.map((x) => x.toUpperCase())) {
    if (v === 'A') dots.push([0, 0, 0.55]);
    else { const d = SPOKE[v]; polys.push([[d[0], d[1]], [d[0] * 3, d[1] * 3]]); }
  }
  return { polys, dots };
}
/** The word on the honeycomb: cells zigzag by column (r4-comb-core's layout, one word, no breaks). */
function layOut(cells) {
  const items = cells.map((c, col) => ({ cell: c, x: col * 1.5 * N, y: (col % 2) * S3 * N / 2 }));
  const xs = items.map((i) => i.x), ys = items.map((i) => i.y);
  return { items, x0: Math.min(...xs) - N, x1: Math.max(...xs) + N, y0: Math.min(...ys) - S3 * N / 2, y1: Math.max(...ys) + S3 * N / 2 };
}

// ---- the outlines: each a star-shaped border round the face's centre (units of R, the face's radius), and the Goetic ring inside it
const ell = (a, b) => (t) => (a * b) / Math.hypot(b * Math.cos(t), a * Math.sin(t));
const squircle = (k, p) => (t) => k * Math.pow(Math.pow(Math.abs(Math.cos(t)), p) + Math.pow(Math.abs(Math.sin(t)), p), -1 / p);
/** The far edge of a union of circles along the ray at t from the origin (a gourd: its two lobes). */
const lobes = (cs) => (t) => {
  const dx = Math.cos(t), dy = Math.sin(t); let best = 0;
  for (const [cx, cy, r] of cs) { const b = dx * cx + dy * cy, d = b * b - (cx * cx + cy * cy - r * r); if (d >= 0) best = Math.max(best, b + Math.sqrt(d)); }
  return best;
};
const OUTLINES = {
  round: { f: () => 1, ring: { cx: 0, cy: 0, g: () => 0.68 } },
  oval: { f: ell(0.8, 1), ring: { cx: 0, cy: 0, g: (t) => 0.68 * ell(0.8, 1)(t) } },
  square: { f: squircle(0.9, 5), ring: { cx: 0, cy: 0, g: (t) => 0.7 * squircle(0.9, 5)(t) } },
  gourd: { f: lobes([[0, -0.5, 0.42], [0, 0.2, 0.74]]), pads: [0.8, 0.9], ring: { cx: 0, cy: 0.22, g: () => 0.46 }, crown: { cx: 0, cy: -0.5, r: 0.2 } },
};

function bitsOf(str, n) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } const o = []; let s = h >>> 0 || 1; for (let i = 0; i < n; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; o.push(((s >>> 0) % 1000) < 500); } return o; }

/** Your seal's face, drawn right-reading into the square [0, size] of ctx. */
export function drawSealFace(ctx, seal, { size = 256, ink = '#6fa596', lit = false } = {}) {
  const name = String(seal?.name || '').toUpperCase(), shape = OUTLINES[seal?.outline] || OUTLINES.round, intaglio = seal?.carving === 'intaglio';
  let cells = null;
  try { cells = name ? cellsOf(name) : []; } catch { cells = null; } // (a name the orthography cannot spell: its letters, plainly)
  if (!ctx) return { spelled: !!cells, cells };
  const S = size, R = S * 0.47;
  const P = (t, k, o = shape) => [Math.cos(t) * k * R * o.f(t), Math.sin(t) * k * R * o.f(t)];
  const ringPt = (t, k = 1) => { const r = shape.ring; return [r.cx * R + Math.cos(t) * k * R * r.g(t), r.cy * R + Math.sin(t) * k * R * r.g(t)]; };
  const outline = (k, fn = P) => { ctx.beginPath(); for (let i = 0; i <= 96; i++) { const p = fn(i / 96 * Math.PI * 2, k); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath(); };
  const marks = (col) => {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // the border
    ctx.lineWidth = S * 0.02; outline(0.93); ctx.stroke();
    // the bond pads round the rim (their widths: the name's barcode), skipping where a fiducial sits
    const bits = bitsOf(name || 'SEAL', 40), [p0, p1] = shape.pads || [0.75, 0.86];
    for (let i = 0; i < 40; i++) {
      if (i % 10 === 0) continue;
      const a = i / 40 * Math.PI * 2, w = bits[i] ? S * 0.026 : S * 0.011, f = shape.f(a);
      ctx.save(); ctx.rotate(a); ctx.fillRect(R * p0 * f, -w / 2, R * (p1 - p0) * f, w); ctx.restore();
    }
    // four fiducials, a cross in a square
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2, [fx, fy] = P(a, (p0 + p1) / 2), f = S * 0.02;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(a); ctx.lineWidth = S * 0.008; ctx.strokeRect(-f, -f, 2 * f, 2 * f);
      ctx.beginPath(); ctx.moveTo(-f * 1.5, 0); ctx.lineTo(f * 1.5, 0); ctx.moveTo(0, -f * 1.5); ctx.lineTo(0, f * 1.5); ctx.stroke(); ctx.restore();
    }
    // the Goetic ring, and its four ticks out towards the pads, each with a small ring
    ctx.lineWidth = S * 0.011; outline(1, ringPt); ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2, [ax, ay] = ringPt(a), out = (p0 - 0.01) * shape.f(a) * R, ox = Math.cos(a) * out, oy = Math.sin(a) * out;
      ctx.lineWidth = S * 0.008; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ox, oy); ctx.stroke();
      ctx.beginPath(); ctx.arc(ox - Math.cos(a) * S * 0.012, oy - Math.sin(a) * S * 0.012, S * 0.01, 0, 7); ctx.stroke();
    }
    if (shape.crown) { // (the gourd's upper lobe: a small Goetic ring and its cross)
      const c = shape.crown, cx = c.cx * R, cy = c.cy * R, r = c.r * R; ctx.lineWidth = S * 0.009;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.25, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy); ctx.lineTo(cx + r * 0.7, cy); ctx.moveTo(cx, cy - r * 0.7); ctx.lineTo(cx, cy + r * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + r); ctx.lineTo(...ringPt(-Math.PI / 2)); ctx.stroke();
    }
    if (cells && cells.length) comb_();
    else if (!cells) plain();
  };
  // the name in the Comb, fitted to the Goetic ring, and its traces out to it
  const comb_ = () => {
    const lay = layOut(cells), r = shape.ring, ax = R * r.g(0), ay = R * r.g(Math.PI / 2);
    const s = Math.min(ax * 1.3 / (lay.x1 - lay.x0), ay * 1.2 / (lay.y1 - lay.y0)), ox = r.cx * R - (lay.x0 + lay.x1) / 2 * s, oy = r.cy * R - (lay.y0 + lay.y1) / 2 * s;
    for (const it of lay.items) {
      const cx = ox + it.x * s, cy = oy + it.y * s;
      ctx.lineWidth = s * 0.95; ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const v = hexV(k); k ? ctx.lineTo(cx + v[0] * s, cy + v[1] * s) : ctx.moveTo(cx + v[0] * s, cy + v[1] * s); }
      ctx.stroke();
      const m = cellMarks(it.cell); ctx.lineWidth = s * 1.25;
      for (const pl of m.polys) { ctx.beginPath(); pl.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * s, cy + y * s) : ctx.moveTo(cx + x * s, cy + y * s))); ctx.stroke(); }
      for (const [x, y] of m.dots) { ctx.beginPath(); ctx.arc(cx + x * s, cy + y * s, s * 0.85, 0, 7); ctx.fill(); }
    }
    // Manhattan traces from the cells' outer corners to the Goetic ring, each ending in a ring-dot
    const inRing = (x, y) => { const dx = x - r.cx * R, dy = y - r.cy * R, t = Math.atan2(dy, dx); return Math.hypot(dx, dy) < R * r.g(t); };
    const hit = (x, y, dx, dy) => { let a = 0, b = S; while (inRing(x + dx * a, y + dy * a) && a < S) a += S * 0.01; b = a; a = Math.max(0, a - S * 0.01); for (let i = 0; i < 12; i++) { const m = (a + b) / 2; if (inRing(x + dx * m, y + dy * m)) a = m; else b = m; } return [x + dx * a, y + dy * a]; };
    const ringDot = (px, py) => { ctx.lineWidth = S * 0.008; ctx.beginPath(); ctx.arc(px, py, S * 0.016, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(px, py, S * 0.006, 0, 7); ctx.fill(); };
    const route = (pts) => { ctx.lineWidth = S * 0.009; ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.stroke(); ringDot(...pts[pts.length - 1]); };
    const hv = (it, k) => [ox + (it.x + hexV(k)[0]) * s, oy + (it.y + hexV(k)[1]) * s];
    const first = lay.items[0], last = lay.items[lay.items.length - 1];
    let p = hv(first, 3); route([p, hit(p[0], p[1], -1, 0)]);
    p = hv(last, 0); route([p, hit(p[0], p[1], 1, 0)]);
    for (const it of lay.items) {
      const up = hv(it, 4), dn = hv(it, 1), ux = up[0] - s * 2.5, uy = up[1] - s * 2.5, dx = dn[0] + s * 2.5, dy = dn[1] + s * 2.5;
      route([up, [up[0], uy], [ux, uy], hit(ux, uy, 0, -1)]);
      route([dn, [dn[0], dy], [dx, dy], hit(dx, dy, 0, 1)]);
    }
  };
  // a name the Comb cannot spell: its letters, plain capitals in the System's title face, in the Goetic ring
  const plain = () => {
    const r = shape.ring, w = R * r.g(0) * 1.5;
    ctx.font = `600 ${Math.round(S * 0.13)}px ${FONT.title}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const m = ctx.measureText(name).width, k = m > w ? w / m : 1;
    ctx.save(); ctx.translate(r.cx * R, r.cy * R); ctx.scale(k, k); ctx.fillText(name, 0, S * 0.005); ctx.restore();
  };

  ctx.save(); ctx.translate(S / 2, S / 2);
  if (intaglio) { // (hakubun: a field of ink inside the border, every mark cut out of it)
    const off = document.createElement('canvas'); off.width = off.height = S; const o = off.getContext('2d'), keep = ctx;
    o.translate(S / 2, S / 2); ctx = o; ctx.fillStyle = ink; outline(0.95); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; marks('#000'); ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = S * 0.02; ctx.strokeStyle = ink; outline(0.93); ctx.stroke();
    ctx = keep;
    if (lit) { ctx.save(); ctx.shadowColor = ink; ctx.shadowBlur = S * 0.04; ctx.drawImage(off, -S / 2, -S / 2); ctx.restore(); }
    ctx.drawImage(off, -S / 2, -S / 2);
  } else if (lit) { // (shubun, burning: the glow, the colour, then a hot core over it: round six's burn)
    ctx.save(); ctx.shadowColor = ink; ctx.shadowBlur = S * 0.035; marks(ink); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.85; marks(hot(ink)); ctx.restore();
  } else marks(ink);
  ctx.restore();
  return { spelled: !!cells, cells };
}

/** A colour lifted most of the way to white (the burn's core). */
function hot(ink) {
  const c = document.createElement('canvas').getContext('2d'); c.fillStyle = ink; const h = c.fillStyle; // (any CSS colour, as #rrggbb)
  if (!/^#[0-9a-f]{6}$/i.test(h)) return '#ffffff';
  const n = parseInt(h.slice(1), 16), mix = (v) => Math.round(v + (255 - v) * 0.7);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}
