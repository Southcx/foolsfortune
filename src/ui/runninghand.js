// ---------------------------------------------------------------------------------------
// THE RUNNING HAND: neuralese drawn in its reading script (docs/plans/OVERLAY.md 10.5b, 10.5c, 10.5e; Espada's orthography in
// docs/LORE.md, "The neuralese script"). Final: the owner, 2026-10-18, "Don't change a thing about it, it's perfect." This is round six's
// generator (Calissa's mock, overlay/r6-script) ported line for line: never refire it without the owner asking.
//
// What is drawn: each syllable a block (a consonant letter, its vowel marks round it: i above, u below, e before, o after, a unwritten
// over a carrier when there is no consonant), the letters joined along the bus, the line every letter hangs from. A phrase (a head and
// its modifiers, written with hyphens) never breaks the bus; a modifier hangs on a lower bus half a row below, joined to its head by a
// lead from the head's end; a gap with a terminal bar each side is a break between phrases; a sentence closes on the six-spoke star.
// Colours by role (the body, the lead, the pad, a fricative's or liquid's mark, the voiced pad, the coda's bar, the vowels, the bus,
// the star), or one ink for all.
//
// Prior art: Devanagari's shirorekha and the Thai and Tamil abugidas (the hanging headline that joins a word's letters, taken whole as
// the bus); the printed circuit's trace, terminal and via (a word break is a broken trace with its two terminations; a voiced pad a
// filled via); Hangul's featural letters (place and manner drawn); Toki Pona's head-first phrases (via Espada's NEURALESE.md).
//
// A number (Espada's numerals, NEURALESE.md 2b; numeralOf): each digit hung from the bus on its own short pin, its spoken sum read
// down it: a bar (PENTA) nearest the bus, then a pair (DUO: two dots joined by a trace) for each two, then a lone dot (UNA); zero (VOYD)
// an open ring wider than any pad and hung by no stem, so a digit is never read as a letter. A number alone has its own bus; as a
// modifier ({ num, mod: true }) it hangs on its head's lower bus. Added 2026-10-29 (South asked for numbers); the letters are untouched.
//
//   runningHand(ctx, words, { x, y, scale, ink, lw, joined, end, glow, blur }) -> { width, height, x0, y0, x1, y1, lw, words }
//     words: [{ cells, mod? } | { num, mod? }]   cells from cellsOf (npc/neuralesespelling.js); num: a whole number; mod: a modifier of the head before it
//     x, y: where the bus begins (its left end, its height) in ctx's units; scale: units a hand unit (1.8 reads at 14 px)
//     ink: a colour or gradient for every stroke, or { role: colour } over the hand's own colours (COL); lw: stroke width (scale * 0.8)
//     joined: true (default) lays the bus, its terminals and leads; false the letters alone. end: the star closes the line.
//     ctx null: measures only. The bounds are the strokes' centrelines (add lw / 2 for the ink's edge); words: each word's x0, x1, row.
// ---------------------------------------------------------------------------------------
import { numeralOf } from '../npc/neuralesespelling.js';

const D2R = Math.PI / 180;
// the ruled language -> the hand's letters (place, manner, voiced): m, n, l, r are voiced, so their pads are filled. A cell's letter
// carries its whole consonant record (cellsOf spreads the spelling's table into it), so the hand's table is filled as letters are met.
const HAND_CONS = {};
function learn(k) {
  const key = k.c.toUpperCase(); if (HAND_CONS[key]) return key;
  const pl = k.place === 'lips' ? 'L' : k.place === 'back' ? 'B' : 'T';
  const m = k.manner === 'stop' ? 'stop' : k.manner === 'nasal' ? 'nasal' : k.manner === 'liquid' ? (k.mark === 'in' ? 'l' : 'r') : (k.mark === 'tick' ? 'fric' : k.mark === 'ticks' ? 'sh' : 'th');
  HAND_CONS[key] = { pl, m, v: k.voiced ? 1 : 0 }; return key;
}
const toSyl = (cell) => ({ on: cell.onset.map(learn), v: cell.vowels.map((v) => v.toUpperCase()), co: cell.coda ? [learn(cell.coda)] : [], text: cell.text });

// ---- the letters (round five's generator, Espada's rules: running-hand.md)
const PR = 1.25, LW = 7;
const pt = (a, r, c) => [c.x + r * Math.cos(a * D2R), c.y + r * Math.sin(a * D2R)];
function arc(a0, a1, r, c) { const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 7)), o = []; for (let i = 0; i <= n; i++) o.push(pt(a0 + (a1 - a0) * i / n, r, c)); return o; }
function stemOf(m, sx, yTop, yBot, d, path) {
  const mid = (yTop + yBot) / 2, notch = (y) => [[sx, y + 1.3], [sx + d * 1.1, y + 0.4], [sx + d * 1.1, y - 0.4], [sx, y - 1.3]];
  const pts = [[sx, yBot]], marks = [];
  if (m === 'fric') { const n = notch(mid); pts.push(...n); marks.push(n); }
  if (m === 'sh') { const a = notch(mid + 1.6), b = notch(mid - 1.6); pts.push(...a, ...b); marks.push(a, b); }
  pts.push([sx, yTop]); path(pts); marks.forEach((n) => path(n, 'mark'));
  if (m === 'th') path([[sx - 1.6, mid + 1.6], [sx + 1.6, mid - 1.6]], 'mark');
  return mid;
}
function letter(c, coda) {
  const C = HAND_CONS[c], P = [], m = C.m;
  const path = (pts, role = 'body') => P.push({ t: 'path', pts, role, ph: c });
  let px, py, bottom;
  if (C.pl === 'L' || C.pl === 'B') {
    const L = C.pl === 'L', sx = L ? 1.5 : 5.5, tx = L ? 5.5 : 1.5, d = L ? -1 : 1; px = sx; py = 12; bottom = py + PR;
    path([[3.5, 0], [3.5, 1.5]], 'lead');
    path([[tx, 6.2], ...(L ? arc(360, 180, 2, { x: 3.5, y: 3.5 }) : arc(180, 360, 2, { x: 3.5, y: 3.5 }))]);
    stemOf(m, sx, 3.5, py - PR, d, path);
    if (m === 'nasal') path([[L ? 2.95 : 4.05, 4.9], [L ? 2.95 : 4.05, py + 0.2]], 'mark');
  } else {
    px = 3.5; py = 1.9; path([[3.5, 0], [3.5, py - PR]], 'lead');
    if (m === 'l') { path([[3.5, py + PR], [0.9, py + PR + 2.6], ...arc(180, 0, 2.6, { x: 3.5, y: py + PR + 2.6 })], 'mark'); bottom = py + PR + 5.2; }
    else if (m === 'r') { path([[3.5, py + PR], [3.5, 5.2]], 'body'); path([[0.9, 10], ...arc(180, 360, 2.6, { x: 3.5, y: 7.8 }), [6.1, 10]], 'mark'); bottom = 10; }
    else {
      stemOf(m, 3.5, py + PR, 10.5, -1, path); path(arc(180, 0, 1.2, { x: 4.7, y: 10.5 })); bottom = 11.7;
      if (m === 'nasal') path([[2.05, 3.9], [2.05, 10.5]], 'mark');
    }
  }
  P.push(C.v ? { t: 'dot', x: px, y: py, r: PR, role: 'voice', ph: c, pad: 1 } : { t: 'ring', x: px, y: py, r: PR, role: 'pad', ph: c, pad: 1 });
  if (coda) path([[px - PR - 0.9, py], [px + PR + 0.9, py]], 'coda');
  return { w: LW, prims: P, bottom, pad: [px, py] };
}
function tf(prims, dx, dy, sc) {
  return prims.map((p) => {
    const q = { ...p };
    if (p.pts) q.pts = p.pts.map(([x, y]) => [dx + x * sc, dy + y * sc]);
    else { q.x = dx + p.x * sc; q.y = dy + p.y * sc; if (p.r) q.r = p.r * sc; if (p.s) q.s = p.s * sc; }
    return q;
  });
}
const V = (o) => ({ role: 'vowel', ...o });
const SQ = 1.15;
const VM = {
  I: (x) => [V({ t: 'path', pts: [[x, 0], [x, -1.4], [x - 1.3, -2.7]] }), V({ t: 'pad', x: x - 1.7, y: -3.1, s: SQ })],
  A: (x) => [V({ t: 'path', pts: [[x, 0], [x, -2.4]] }), V({ t: 'pad', x, y: -3.1, s: SQ })],
  U: (x, y) => [V({ t: 'path', pts: [[x - 1.4, y], [x + 0.3, y], [x + 1.4, y + 1.1]] }), V({ t: 'pad', x: x + 1.8, y: y + 1.5, s: SQ })],
  E: (x) => [V({ t: 'path', pts: [[x + 1, 0], [x + 1, 6.4], [x, 7.4]] }), V({ t: 'pad', x: x - 0.4, y: 7.8, s: SQ })],
  O: (x) => [V({ t: 'path', pts: [[x + 0.9, 0], [x + 0.9, 6.4], [x + 1.9, 7.4]] }), V({ t: 'pad', x: x + 2.3, y: 7.8, s: SQ })],
};
function block(syl) {
  const P = [], has = (v) => syl.v.includes(v), push = (a) => P.push(...a); let x = 0, bottom = 6, xc;
  if (has('E')) { push(VM.E(x + 0.5)); x += 3; }
  if (!syl.on.length) {
    xc = x + 2.2; push([{ t: 'path', pts: [[xc, 0], [xc, 3.6]], role: 'lead' }, { t: 'path', pts: [[xc, 3.6], [xc + 1.5, 5.1], [xc, 6.6], [xc - 1.5, 5.1], [xc, 3.6]], role: 'body' }]);
    bottom = 6.6; x += 4.4;
  } else {
    const L = letter(syl.on[0]); push(tf(L.prims, x, 0, 1)); xc = x + 3.5; bottom = L.bottom;
    if (syl.on[1]) {
      const k = 0.55, sx = x + (LW - LW * k) / 2, sy = bottom + 1.1, S = letter(syl.on[1]); P.push({ t: 'path', pts: [[sx - 0.2, sy], [sx + LW * k + 0.2, sy]], role: 'rail' });
      push(tf(S.prims, sx, sy, k)); bottom = sy + S.bottom * k;
    }
    x += LW;
  }
  const di = syl.v.length > 1;
  if (has('A') && di) push(VM.A(xc + 1.3));
  if (has('I')) push(VM.I(di && has('A') ? xc - 0.3 : xc));
  if (has('U')) push(VM.U(xc, bottom + 1.2));
  if (has('O')) { push(VM.O(x)); x += 3.4; }
  for (const c of syl.co) { x += 0.6; push(tf(letter(c, 1).prims, x, 0, 1)); x += LW; }
  return { w: x, prims: P, bottom };
}
// a word's glyphs with no bus of its own (the line lays the bus)
function glyphWord(cells) {
  const P = []; let x = 0;
  for (const cell of cells) { const b = block(toSyl(cell)); P.push(...tf(b.prims, x, 0, 1)); x += b.w + 1.1; }
  return { prims: P, w: x - 1.1 };
}
// a number's digits, each on its pin from the bus (x from 0, the bus at y 0)
const DW = 5;
function glyphNumber(n) {
  const P = [], body = (pts) => P.push({ t: 'path', pts, role: 'body' }), dot = (x, y, r = 0.45) => P.push({ t: 'dot', x, y, r, role: 'voice' });
  numeralOf(n).forEach((d, i) => {
    const cx = i * (DW + 1.1) + DW / 2; let y = 2.6;
    if (d.zero) { P.push({ t: 'path', pts: [[cx, 0], [cx, 1.6]], role: 'lead' }, { t: 'ring', x: cx, y: 3.8, r: 2.2, role: 'body' }); return; } // (VOYD: wider than a pad, touching its pin)
    P.push({ t: 'path', pts: [[cx, 0], [cx, d.bar ? y : y + 0.9]], role: 'lead' });
    if (d.bar) { body([[cx - DW / 2, y], [cx + DW / 2, y]]); y += 2.3; } else y += 0.9; // (PENTA: the bar across the pin's foot)
    for (let k = 0; k < d.pairs; k++) { body([[cx - 1.7, y], [cx + 1.7, y]]); dot(cx - 1.7, y); dot(cx + 1.7, y); y += 2.3; } // (DUO: two dots joined)
    if (d.dot) dot(cx, y, 0.6); // (UNA)
  });
  return { prims: P, w: numeralOf(n).length * (DW + 1.1) - 1.1 };
}
const glyphOf = (w) => (w.num != null ? glyphNumber(w.num) : glyphWord(w.cells));
const tick = (x, y) => ({ t: 'path', pts: [[x, y - 0.9], [x, y + 0.9]], role: 'rail' });
const ROW2 = 12; // a modifier hangs on a lower bus, half a row below (as in the Comb)

/* the line: phrases (head, then its modifiers) on the bus; the bus unbroken through a phrase, broken between phrases (a terminal
   bar each side), the line closed by the star hung from its own stub when `end` */
function layout(words, end) {
  const phrases = [];
  for (const w of words) { if (!w?.cells?.length && w?.num == null) continue; if (w.mod && phrases.length) phrases[phrases.length - 1].push(w); else phrases.push([w]); }
  const P = [], out = []; let x = 1;
  phrases.forEach((ph, pi) => {
    const H = glyphOf(ph[0]); P.push(...tf(H.prims, x, 0, 1)); const hEnd = x + H.w;
    P.push({ t: 'path', pts: [[x - 1, 0], [hEnd + (ph.length > 1 ? 0 : 0.2), 0]], role: 'rail' }, tick(x - 1, 0));
    out.push({ x0: x, x1: hEnd, row: 0, index: words.indexOf(ph[0]) });
    let stop = x + H.w;
    if (ph.length > 1) {
      const lx = hEnd; P.push({ t: 'path', pts: [[lx, 0], [lx, ROW2 - 2.4], [lx + 2.4, ROW2]], role: 'rail' });
      let mx = Math.max(lx + 3.4, x + 0.8), last = mx;
      for (const m of ph.slice(1)) { const G = glyphOf(m); P.push(...tf(G.prims, mx, ROW2, 1)); out.push({ x0: mx, x1: mx + G.w, row: 1, index: words.indexOf(m) }); last = mx + G.w; mx += G.w + 1.6; }
      P.push({ t: 'path', pts: [[lx + 2.4, ROW2], [last + 0.2, ROW2]], role: 'rail' }, tick(last + 0.2, ROW2)); stop = Math.max(stop, mx - 1.6);
    } else P.push(tick(hEnd + 0.2, 0));
    if (end && pi === phrases.length - 1) {
      const sx = stop + 3.6, sy = 5;
      P.push({ t: 'path', pts: [[sx - 1.8, 0], [sx + 1.8, 0]], role: 'rail' }, tick(sx - 1.8, 0), tick(sx + 1.8, 0), { t: 'path', pts: [[sx, 0], [sx, sy - 3.3]], role: 'rail' }, { t: 'ring', x: sx, y: sy, r: 3.3, role: 'star' });
      for (let k = 0; k < 6; k++) { const a = (k * 60 - 90) * D2R; P.push({ t: 'path', pts: [[sx + Math.cos(a) * 1.1, sy + Math.sin(a) * 1.1], [sx + Math.cos(a) * 3.3, sy + Math.sin(a) * 3.3]], role: 'star' }); }
      x = sx + 3.3;
    } else x = stop + 4.6;
  });
  return { prims: P, words: out, w: x };
}
function bounds(P) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9; const e = (x, y, r = 0) => { a = Math.min(a, x - r); b = Math.min(b, y - r); c = Math.max(c, x + r); d = Math.max(d, y + r); };
  for (const p of P) { if (p.pts) p.pts.forEach((q) => e(q[0], q[1])); else e(p.x, p.y, p.r || p.s || 0); }
  return P.length ? { x0: a, y0: b, x1: c, y1: d } : { x0: 0, y0: 0, x1: 0, y1: 0 };
}
export const COL = { body: '#d9cff5', lead: '#d9cff5', pad: '#d9cff5', mark: '#5fe0c8', voice: '#6fd0ff', coda: '#ff7a5c', vowel: '#f2c94c', rail: '#9a86e0', star: '#f2c94c' };
function draw(ctx, P, ox, oy, s, o = {}) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const lw = o.lw ?? Math.max(1, s * 0.8);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 8; }
  for (const p of P) {
    const col = o.mono || (o.col && o.col[p.role]) || COL[p.role]; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
    if (p.t === 'path') { ctx.beginPath(); p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x * s, oy + y * s) : ctx.moveTo(ox + x * s, oy + y * s))); ctx.stroke(); }
    else if (p.t === 'ring') { ctx.beginPath(); ctx.arc(ox + p.x * s, oy + p.y * s, Math.max(0.6, p.r * s), 0, 7); ctx.stroke(); }
    else if (p.t === 'dot') { ctx.beginPath(); ctx.arc(ox + p.x * s, oy + p.y * s, Math.max(0.7, p.r * s + lw / 2), 0, 7); ctx.fill(); }
    else if (p.t === 'pad') { const h = Math.max(0.75, p.s * s / 2); ctx.fillRect(ox + p.x * s - h, oy + p.y * s - h, h * 2, h * 2); }
  }
  ctx.restore();
}

export function runningHand(ctx, words, opts = {}) {
  const { x = 0, y = 0, scale: s = 1.8, joined = true, end = false } = opts;
  const L = layout(words || [], end), prims = joined ? L.prims : L.prims.filter((p) => p.role !== 'rail');
  const lw = opts.lw ?? Math.max(1, s * 0.8);
  if (ctx) {
    const ink = opts.ink, o = { lw, glow: opts.glow, blur: opts.blur };
    if (ink && typeof ink === 'object' && !(typeof CanvasGradient !== 'undefined' && ink instanceof CanvasGradient) && !(typeof CanvasPattern !== 'undefined' && ink instanceof CanvasPattern)) o.col = ink;
    else if (ink) o.mono = ink;
    draw(ctx, prims, x, y, s, o);
  }
  const b = bounds(prims);
  return { width: (b.x1 - b.x0) * s, height: (b.y1 - b.y0) * s, x0: x + b.x0 * s, y0: y + b.y0 * s, x1: x + b.x1 * s, y1: y + b.y1 * s, lw,
    words: L.words.map((w) => ({ index: w.index, row: w.row, x0: x + w.x0 * s, x1: x + w.x1 * s, y: y + (w.row ? ROW2 * s : 0) })) };
}
