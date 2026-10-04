// ---------------------------------------------------------------------------------------
// GESTURES: what a drawing on the canvas of the Soul Brush is. Strokes go in (screen points, one array per stroke, in the order they
// were drawn); a name comes out (or null), with what the technique needs to know about where and how it was drawn.
//
// The matcher is PENNY PINCHER (Taranta and LaViola, "Penny Pincher: a blazing fast, highly accurate $-family recognizer", Graphics
// Interface 2015): the drawing is resampled to a few evenly spaced points, each step between them becomes a unit vector, and a
// template's score is the mean of the dot products of its vectors with the drawing's. No rotation search, no scaling, no point
// matching: one pass of dot products per template, so a few hundred templates cost less than drawing a frame. It is not rotation or
// direction invariant, which is what a sigil wants (a stroke across is not a stroke down); the ways a hand actually draws each shape
// (either direction, a few slants, the usual starting points, one stroke or two in either order) are generated as templates here.
// Strokes are joined end to start in the order drawn (the pen's travel between them is part of the path), as the paper does.
//
// A few shapes are answered by plain geometry first, because it is cheaper still and more forgiving than any template:
//  - the BOMB (Okami's Cherry Bomb): two strokes, a closed loop and a stroke from inside it to outside;
//  - a SPIRAL (Okami's Galestorm): more than about a turn and a quarter of winding, with a radius that changes along the way;
//  - a CLOSED LOOP: one turn that comes back to where it began. No sharp corners: a CIRCLE; one or two: the HEART (point and notch).
//
//   recognize(strokes) -> { name, score, sigil, center, box, size, dir, start, end, points, strokes, poly? } | null   (screen px, y down)
//   names: 'line' | 'circle' | 'spiral' | 'bomb' | 'vee' | 'caret' | 'bolt' | 'heart'     sigils: '—' '|' 'V' '^' 'ϟ' (or null)
// ---------------------------------------------------------------------------------------
const N = 24; // points a drawing is resampled to (N - 1 vectors)

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pathLen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]); return l; };
function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
/** n points evenly spaced along a path by arc length. */
function resample(s, n) {
  const L = pathLen(s);
  if (L < 1e-3) return Array.from({ length: n }, () => ({ x: s[0].x, y: s[0].y }));
  const step = L / (n - 1), out = [{ x: s[0].x, y: s[0].y }];
  let D = 0;
  for (let i = 1; i < s.length && out.length < n; i++) {
    let a = s[i - 1];
    const b = s[i];
    let d = dist(a, b);
    while (D + d >= step && out.length < n) { const t = (step - D) / d; const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }; out.push(q); a = q; d = dist(a, b); D = 0; }
    D += d;
  }
  while (out.length < n) out.push({ x: s[s.length - 1].x, y: s[s.length - 1].y });
  return out;
}
/** A stroke as a hand meant it: resampled and lightly smoothed (the features below are measured on this). */
function tidy(s, n = 40) {
  const r = resample(s, n);
  return r.map((p, i) => (i === 0 || i === r.length - 1 ? p : { x: (r[i - 1].x + p.x * 2 + r[i + 1].x) / 4, y: (r[i - 1].y + p.y * 2 + r[i + 1].y) / 4 }));
}
/** Penny Pincher's form of a path: the unit vectors between N evenly spaced points. */
function vectors(path) {
  const r = resample(path, N), v = new Float32Array((N - 1) * 2);
  for (let i = 1; i < N; i++) { const dx = r[i].x - r[i - 1].x, dy = r[i].y - r[i - 1].y, l = Math.hypot(dx, dy) || 1; v[(i - 1) * 2] = dx / l; v[(i - 1) * 2 + 1] = dy / l; }
  return v;
}
const score = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 2) s += a[i] * b[i] + a[i + 1] * b[i + 1]; return s / (N - 1); };

/** Total signed turning of a (tidied) stroke, in turns (a circle is ~1, a spiral more). A cusp (a turn back on itself) is not winding. */
function winding(pts) {
  let a = 0, prev = null;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
    if (Math.hypot(dx, dy) < 1e-3) continue;
    const ang = Math.atan2(dy, dx);
    if (prev !== null) { let da = ang - prev; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; if (Math.abs(da) < 2.2) a += da; }
    prev = ang;
  }
  return a / (2 * Math.PI);
}
/** Sharp corners (more than ~70 degrees over a few samples), counting the meeting of the two ends of a closed stroke as one. */
function corners(s) {
  const t = tidy(s, 48), n = t.length, k = 3, ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const turn = (a, b, c) => { let d = ang(b, c) - ang(a, b); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
  let count = 0, run = false;
  for (let i = k; i < n - k; i++) { const sharp = turn(t[i - k], t[i], t[i + k]) > 1.2; if (sharp && !run) count++; run = sharp; }
  // the join: cut an overshoot at the point that comes nearest the start again, then see if the ends meet at an angle
  let j = n - 1, jd = Infinity;
  for (let i = Math.floor(n * 0.7); i < n; i++) { const d = dist(t[i], t[0]); if (d < jd) { jd = d; j = i; } }
  const joint = turn(t[j - k], t[j], t[k]) > 1.2 && turn(t[j - k], t[0], t[k]) > 1.2;
  return count + (joint ? 1 : 0);
}
/** A closed loop: about one turn (or a little more), and it comes back to where it began. */
function closedLoop(s) {
  const t = tidy(s), b = bbox(t), sz = Math.max(b.w, b.h), n = t.length, w = Math.abs(winding(t));
  if (sz < 12 || w < 0.72 || w > 1.5 || Math.min(b.w, b.h) < sz * 0.3) return false;
  let gap = Infinity;
  for (let i = 0; i < n * 0.4; i++) gap = Math.min(gap, dist(t[i], t[n - 1]));
  for (let j = Math.floor(n * 0.6); j < n; j++) gap = Math.min(gap, dist(t[0], t[j]));
  return gap < sz * 0.32;
}
/** Is a point inside a polygon (a closed stroke)? */
export function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

// ---- the templates: each shape the ways it is drawn -----------------------------------------
const P = (...xy) => { const s = []; for (let i = 0; i < xy.length; i += 2) s.push({ x: xy[i], y: xy[i + 1] }); return s; };
const rot = (s, a, cx = 0.5, cy = 0.5) => s.map((p) => ({ x: cx + (p.x - cx) * Math.cos(a) - (p.y - cy) * Math.sin(a), y: cy + (p.x - cx) * Math.sin(a) + (p.y - cy) * Math.cos(a) }));
const scaleXY = (s, sx, sy) => s.map((p) => ({ x: 0.5 + (p.x - 0.5) * sx, y: 0.5 + (p.y - 0.5) * sy }));
const mirror = (s) => s.map((p) => ({ x: 1 - p.x, y: p.y }));
const rev = (s) => s.slice().reverse();
const join = (...strokes) => strokes.flat();
const arc = (a0, a1, n = 40, r = 0.5) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) }; });
const heartCurve = (from, to) => Array.from({ length: 41 }, (_, i) => { const t = from + ((to - from) * i) / 40; return { x: 0.5 + (16 * Math.sin(t) ** 3) / 34, y: 0.5 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 34 }; });

function buildTemplates() {
  const T = [];
  const add = (name, path) => T.push({ name, v: vectors(path) });
  const both = (name, s) => { add(name, s); add(name, rev(s)); };
  for (const a of [-0.14, 0, 0.14]) { both('hline', rot(P(0, 0.5, 1, 0.5), a)); both('vline', rot(P(0.5, 0, 0.5, 1), a)); }
  for (const a of [Math.PI / 4, -Math.PI / 4]) for (const d of [-0.12, 0, 0.12]) both('dline', rot(P(0, 0.5, 1, 0.5), a + d)); // (a slant: a line, but no sigil)
  // DECOYS: shapes that are none of these, so that what only looks a little like a circle (a triangle, a cross) is not taken for one
  for (let k = 0; k < 3; k++) for (const s0 of [P(0.5, 0, 1, 0.9, 0, 0.9, 0.5, 0), P(0, 0, 1, 0, 1, 1, 0, 1, 0, 0)]) { const s1 = rot(s0, (k / 3) * Math.PI * 2); both('-', s1); }
  for (const s0 of [join(P(0, 0.5, 1, 0.5), P(0.5, 0, 0.5, 1)), join(P(0.5, 0, 0.5, 1), P(0, 0.5, 1, 0.5)), join(P(0, 0, 1, 1), P(1, 0, 0, 1)), join(P(1, 0, 0, 1), P(0, 0, 1, 1))]) both('-', s0);
  for (const a of [-0.25, 0, 0.25]) {
    for (const w of [1, 0.7]) { both('caret', rot(scaleXY(P(0, 1, 0.5, 0, 1, 1), w, 1), a)); both('vee', rot(scaleXY(P(0, 0, 0.5, 1, 1, 0), w, 1), a)); }
    // two strokes, in either order (the pen's travel between them is part of the path)
    add('vee', rot(join(P(0, 0, 0.5, 1), P(1, 0, 0.5, 1)), a)); add('vee', rot(join(P(1, 0, 0.5, 1), P(0, 0, 0.5, 1)), a));
    add('caret', rot(join(P(0, 1, 0.5, 0), P(1, 1, 0.5, 0)), a)); add('caret', rot(join(P(1, 1, 0.5, 0), P(0, 1, 0.5, 0)), a));
  }
  // the lightning bolt, the way Magic Cat Academy and every comic draws it, and the plain zigzag a hand makes in a hurry
  const bolts = [P(0.65, 0, 0.3, 0.5, 0.7, 0.5, 0.35, 1), P(0.7, 0, 0.25, 0.55, 0.75, 0.45, 0.3, 1), P(0.75, 0, 0.3, 0.45, 0.7, 0.55, 0.25, 1),
    P(0.6, 0, 0.4, 0.5, 0.6, 0.5, 0.4, 1), P(1, 0, 0, 0.4, 1, 0.6, 0, 1), P(0.8, 0, 0.2, 0.45, 0.8, 0.55, 0.3, 1),
    P(0, 0, 1, 0, 0, 1, 1, 1), P(0, 0, 1, 0.33, 0, 0.66, 1, 1), P(0.3, 0, 0.7, 0.33, 0.3, 0.66, 0.7, 1)];
  for (const b of bolts) for (const a of [-0.25, 0, 0.25]) for (const s of [b, mirror(b)]) for (const sx of [1, 0.6]) both('bolt', rot(scaleXY(s, sx, 1), a));
  // closed shapes, from wherever the hand starts, either way round
  for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2; add('circle', arc(a0, a0 + Math.PI * 2.08)); add('circle', arc(a0, a0 - Math.PI * 2.08)); }
  for (const [a, b] of [[0, Math.PI * 2], [Math.PI, Math.PI * 3]]) { add('heart', heartCurve(a, b)); add('heart', heartCurve(b, a)); }
  add('heart', join(heartCurve(0, Math.PI), heartCurve(Math.PI * 2, Math.PI))); add('heart', join(heartCurve(Math.PI * 2, Math.PI), heartCurve(0, Math.PI)));
  add('heart', join(heartCurve(Math.PI, 0), heartCurve(Math.PI, Math.PI * 2)));
  // spirals: in or out, either way round, a turn and a half to three
  for (const turns of [1.6, 2.2, 3]) for (const dirn of [1, -1]) for (let k = 0; k < 4; k++) {
    const a0 = (k / 4) * Math.PI * 2, s = Array.from({ length: 61 }, (_, i) => { const u = i / 60, a = a0 + dirn * u * turns * Math.PI * 2, r = 0.5 - 0.42 * u; return { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) }; });
    add('spiral', s); add('spiral', rev(s));
  }
  return T;
}
const TEMPLATES = buildTemplates();

// ---- recognize ----------------------------------------------------------------------------
const SIGIL = { hline: '—', vline: '|', vee: 'V', caret: '^', bolt: 'ϟ' };
const ACCEPT = 0.72, MARGIN = 0.02;

export function recognize(strokes) {
  strokes = strokes.filter((s) => s.length >= 2);
  if (!strokes.length) return null;
  const all = strokes.flat();
  const box = bbox(all), size = Math.max(box.w, box.h);
  let total = 0; for (const s of strokes) total += pathLen(s);
  if (total < 24 || size < 14) return null;
  const first = strokes[0], last = strokes[strokes.length - 1];
  const info = { box, size, center: { x: box.cx, y: box.cy }, start: { ...first[0] }, end: { ...last[last.length - 1] }, points: all, strokes };

  // the bomb: a closed loop, and a fairly straight stroke from inside it to outside (either order)
  if (strokes.length === 2) {
    for (const [loop, fuse] of [[strokes[0], strokes[1]], [strokes[1], strokes[0]]]) {
      if (!closedLoop(loop)) continue;
      const lb = bbox(loop), a = fuse[0], b = fuse[fuse.length - 1];
      const straight = dist(a, b) / (pathLen(tidy(fuse)) || 1) > 0.7;
      const ins = (p) => inside(p, loop) || dist(p, { x: lb.cx, y: lb.cy }) < Math.max(lb.w, lb.h) * 0.35;
      if (straight && ins(a) !== ins(b)) {
        const c = { x: lb.cx, y: lb.cy }, o = ins(a) ? b : a;
        return { ...info, name: 'bomb', score: 1, sigil: null, center: c, radius: Math.max(lb.w, lb.h) / 2, dir: { x: o.x - c.x, y: o.y - c.y } };
      }
    }
  }
  const path = strokes.length === 1 ? strokes[0] : join(...strokes);
  // geometry first, for the shapes it reads better than any template
  if (strokes.length === 1) {
    const s = strokes[0], t = tidy(s), w = winding(t);
    const b = bbox(t), c = { x: b.cx, y: b.cy }, n = t.length;
    const r0 = (dist(t[0], c) + dist(t[1], c)) / 2, r1 = (dist(t[n - 1], c) + dist(t[n - 2], c)) / 2;
    const spiralish = Math.abs(w) >= 1.25 && Math.abs(r0 - r1) > Math.max(b.w, b.h) * 0.18;
    if ((spiralish || Math.abs(w) >= 1.6) && corners(s) < 2) {
      const a = t[Math.max(0, n - 5)], z = t[n - 1];
      return { ...info, name: 'spiral', score: 1, sigil: null, turns: w, dir: { x: z.x - a.x, y: z.y - a.y } };
    }
    if (closedLoop(s)) {
      const k = corners(s);
      if (k === 0) return { ...info, name: 'circle', score: 1, sigil: null, radius: size / 2, poly: s };
      if (k <= 2) return { ...info, name: 'heart', score: 1, sigil: null };
    }
  }
  // Penny Pincher over the templates: the best, if it is good enough and clear of the best of any other shape
  const v = vectors(path), bestOf = new Map();
  for (const T of TEMPLATES) { const sc = score(v, T.v); if (sc > (bestOf.get(T.name) ?? -Infinity)) bestOf.set(T.name, sc); }
  const ranked = [...bestOf].sort((a, b) => b[1] - a[1]);
  const [name, bs] = ranked[0], second = ranked[1]?.[1] ?? -1;
  if (bs < ACCEPT || bs - second < MARGIN || name === '-') return null;
  if (name === 'hline' || name === 'vline' || name === 'dline') {
    const a = all[0], z = path[path.length - 1], ang = Math.atan2(z.y - a.y, z.x - a.x);
    return { ...info, name: 'line', score: bs, sigil: SIGIL[name] || null, angle: ang, dir: { x: Math.cos(ang), y: Math.sin(ang) } };
  }
  if (name === 'circle') return { ...info, name, score: bs, sigil: null, radius: size / 2, poly: path };
  if (name === 'spiral') { const t = tidy(path), n = t.length; return { ...info, name, score: bs, sigil: null, dir: { x: t[n - 1].x - t[n - 5].x, y: t[n - 1].y - t[n - 5].y } }; }
  return { ...info, name, score: bs, sigil: SIGIL[name] || null };
}

/** Pictograms of the shapes, for the reference scroll at the canvas's edge: [name, strokes (unit box, y down)]. */
export const PICTOGRAMS = [
  ['hline', [P(0.1, 0.5, 0.9, 0.5)]],
  ['vline', [P(0.5, 0.1, 0.5, 0.9)]],
  ['circle', [arc(0, Math.PI * 2, 24, 0.4)]],
  ['bomb', [arc(0, Math.PI * 2, 24, 0.3).map((p) => ({ x: p.x - 0.08, y: p.y - 0.08 })), P(0.45, 0.45, 0.95, 0.95)]],
  ['spiral', [Array.from({ length: 50 }, (_, i) => { const t = (i / 49) * Math.PI * 4.2, r = 0.44 - (i / 49) * 0.36; return { x: 0.5 + r * Math.cos(t), y: 0.5 + r * Math.sin(t) }; })]],
  ['bolt', [P(0.62, 0.05, 0.3, 0.5, 0.68, 0.5, 0.36, 0.95)]],
  ['caret', [P(0.1, 0.85, 0.5, 0.15, 0.9, 0.85)]],
  ['vee', [P(0.1, 0.15, 0.5, 0.85, 0.9, 0.15)]],
  ['heart', [heartCurve(0, Math.PI * 2).map((p) => ({ x: 0.5 + (p.x - 0.5) * 0.9, y: 0.46 + (p.y - 0.5) * 0.9 }))]],
];
