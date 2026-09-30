// ---------------------------------------------------------------------------------------
// GESTURES: what a drawing on the canvas of the Soul Brush is. Strokes go in (screen points, one array per stroke, in the order they
// were drawn); a name comes out (or null), with what the technique needs to know about where and how it was drawn.
//
// Two layers, because the shapes are of two kinds:
//  - FEATURES for the shapes that are about geometry, not outline: a LINE (straight: its angle says which sigil it is), a CIRCLE
//    (one closed turn), a SPIRAL or LOOP (more than a turn and a half of winding: Okami's Galestorm, whose loop blows the way it was
//    drawn), and the BOMB (a closed loop and a stroke that runs from inside it to outside: Okami's Cherry Bomb, "an upside-down Q").
//  - THE $P POINT-CLOUD RECOGNIZER (Vatavu, Anthony and Wobbrock, "Gestures as Point Clouds", ICMI 2012) for the rest: the V, the
//    caret, the lightning bolt and the heart (Magic Cat Academy's sigils, Google's Halloween 2016 Doodle). $P treats a drawing as an
//    unordered cloud of points, so it does not care how many strokes it took, which way they went or in which order: a heart in one
//    stroke or two, a bolt drawn up or down, all match the same template. Clouds are resampled to 32 points, scaled to a unit box and
//    centred; the distance is the greedy weighted cloud match of the paper. Templates are made here from a few parametric points.
//
//   recognize(strokes) -> { name, dist, sigil, center, box, size, dir, angle, start, end, points } | null     (screen pixels, y down)
//   names: 'line' | 'circle' | 'spiral' | 'bomb' | 'vee' | 'caret' | 'bolt' | 'heart'     sigils: '—' '|' 'V' '^' 'ϟ' (or null)
// ---------------------------------------------------------------------------------------
const N = 32;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pathLen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]); return l; };
function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
/** A stroke as a hand meant it: evenly spaced by arc length (n points) and lightly smoothed, so a mouse's jitter and uneven sampling
 *  do not read as turning or as length. The features below are measured on this. */
function tidy(s, n = 40) {
  const L = pathLen(s);
  if (L < 1e-3) return s.slice();
  const step = L / (n - 1), out = [{ ...s[0] }];
  let D = 0;
  for (let i = 1; i < s.length && out.length < n; i++) {
    let a = s[i - 1];
    const b = s[i];
    let d = dist(a, b);
    while (D + d >= step && out.length < n) { const t = (step - D) / d; const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }; out.push(q); a = q; d = dist(a, b); D = 0; }
    D += d;
  }
  while (out.length < n) out.push({ ...s[s.length - 1] });
  return out.map((p, i) => (i === 0 || i === out.length - 1 ? p : { x: (out[i - 1].x + p.x * 2 + out[i + 1].x) / 4, y: (out[i - 1].y + p.y * 2 + out[i + 1].y) / 4 }));
}
/** Total signed turning of a (tidied) stroke, in turns (a circle is ~1, a spiral 2+). A cusp (a turn back on itself) is not winding. */
function winding(pts) {
  let a = 0, prev = null;
  for (let i = 1; i < pts.length; i++) {
    const d = { x: pts[i].x - pts[i - 1].x, y: pts[i].y - pts[i - 1].y };
    if (Math.hypot(d.x, d.y) < 1e-3) continue;
    const ang = Math.atan2(d.y, d.x);
    if (prev !== null) { let da = ang - prev; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; if (Math.abs(da) < 2.2) a += da; }
    prev = ang;
  }
  return a / (2 * Math.PI);
}
/** The corners of a stroke: where it turns sharply (more than ~70 degrees over a few samples), as a count, and whether the join of
 *  its two ends is one (for a closed stroke). A circle has none; a heart has two, its point and its notch; a triangle three. */
function corners(s) {
  const t = tidy(s, 48), n = t.length, k = 3, ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const turn = (a, b, c) => { let d = ang(b, c) - ang(a, b); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
  let count = 0, run = false;
  for (let i = k; i < n - k; i++) { const sharp = turn(t[i - k], t[i], t[i + k]) > 1.2; if (sharp && !run) count++; run = sharp; }
  // the join: cut an overshoot at the point that comes nearest the start again, then see if the ends meet at an angle
  let j = n - 1, jd = Infinity;
  for (let i = Math.floor(n * 0.7); i < n; i++) { const d = Math.hypot(t[i].x - t[0].x, t[i].y - t[0].y); if (d < jd) { jd = d; j = i; } }
  const join = turn(t[j - k], t[j], t[k]) > 1.2 && turn(t[j - k], t[0], t[k]) > 1.2;
  return { count: count + (join ? 1 : 0), join };
}
/** Strokes that meet end to end, as the one path they make (a circle drawn in two halves, a heart in its two sides), or null. */
function chain(strokes, tol) {
  let path = strokes[0].slice();
  const rest = strokes.slice(1);
  while (rest.length) {
    const a = path[0], b = path[path.length - 1];
    let k = -1, how = 0;
    for (let i = 0; i < rest.length && k < 0; i++) {
      const s = rest[i], s0 = s[0], s1 = s[s.length - 1];
      if (dist(b, s0) < tol) { k = i; how = 0; } else if (dist(b, s1) < tol) { k = i; how = 1; } else if (dist(a, s1) < tol) { k = i; how = 2; } else if (dist(a, s0) < tol) { k = i; how = 3; }
    }
    if (k < 0) return null;
    const s = rest.splice(k, 1)[0];
    path = how === 0 ? path.concat(s) : how === 1 ? path.concat(s.slice().reverse()) : how === 2 ? s.concat(path) : s.slice().reverse().concat(path);
  }
  return path;
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

// ---- $P -------------------------------------------------------------------------------
function resample(strokes, n = N) {
  const pts = [];
  for (let s = 0; s < strokes.length; s++) for (const p of strokes[s]) pts.push({ x: p.x, y: p.y, s });
  let total = 0; for (const st of strokes) total += pathLen(st);
  const step = total / (n - 1) || 1;
  const out = [{ ...pts[0] }];
  let D = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].s !== pts[i - 1].s) continue; // (no length between strokes)
    let a = pts[i - 1];
    const b = pts[i];
    let d = dist(a, b);
    while (D + d >= step && out.length < n) {
      const t = (step - D) / d;
      const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), s: b.s };
      out.push(q);
      a = q; d = dist(a, b); D = 0;
    }
    D += d;
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out;
}
function normalize(pts) {
  const b = bbox(pts), sz = Math.max(b.w, b.h) || 1;
  let cx = 0, cy = 0;
  const q = pts.map((p) => ({ x: (p.x - b.x0) / sz, y: (p.y - b.y0) / sz }));
  for (const p of q) { cx += p.x; cy += p.y; }
  cx /= q.length; cy /= q.length;
  return q.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}
function cloudDistance(pts, tmpl, start) {
  const n = pts.length, matched = new Uint8Array(n);
  let sum = 0, i = start;
  do {
    let min = Infinity, idx = -1;
    for (let j = 0; j < n; j++) if (!matched[j]) { const d = dist(pts[i], tmpl[j]); if (d < min) { min = d; idx = j; } }
    matched[idx] = 1;
    sum += (1 - ((i - start + n) % n) / n) * min;
    i = (i + 1) % n;
  } while (i !== start);
  return sum;
}
function greedyMatch(pts, tmpl) {
  const n = pts.length, step = Math.floor(Math.pow(n, 0.5));
  let min = Infinity;
  for (let i = 0; i < n; i += step) min = Math.min(min, cloudDistance(pts, tmpl, i), cloudDistance(tmpl, pts, i));
  return min;
}

// ---- the templates (screen coordinates: y down) -------------------------------------------
const poly = (...xy) => { const s = []; for (let i = 0; i < xy.length; i += 2) s.push({ x: xy[i], y: xy[i + 1] }); return s; };
const dense = (stroke, per = 12) => { const out = []; for (let i = 1; i < stroke.length; i++) for (let k = 0; k < per; k++) { const t = k / per; out.push({ x: stroke[i - 1].x + (stroke[i].x - stroke[i - 1].x) * t, y: stroke[i - 1].y + (stroke[i].y - stroke[i - 1].y) * t }); } out.push(stroke[stroke.length - 1]); return out; };
const heartCurve = (from, to) => { const s = []; for (let i = 0; i <= 40; i++) { const t = from + ((to - from) * i) / 40; s.push({ x: 16 * Math.sin(t) ** 3, y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) }); } return s; };
const TEMPLATES = [
  ['vee', [dense(poly(0, 0, 0.5, 1, 1, 0))]],
  ['vee', [dense(poly(0, 0, 0.5, 1)), dense(poly(0.5, 1, 1, 0))]],
  ['caret', [dense(poly(0, 1, 0.5, 0, 1, 1))]],
  ['bolt', [dense(poly(0.65, 0, 0.3, 0.5, 0.7, 0.5, 0.35, 1))]],
  ['bolt', [dense(poly(0.35, 0, 0.7, 0.5, 0.3, 0.5, 0.65, 1))]],
  ['bolt', [dense(poly(0, 0, 1, 0, 0, 1, 1, 1))]], // (a Z will do)
  ['bolt', [dense(poly(0, 0.1, 0.45, 0.55, 0.5, 0.35, 1, 0.9))]], // (a lightning flash drawn sideways)
  ['heart', [heartCurve(0, Math.PI * 2)]],
  ['heart', [heartCurve(0, Math.PI), heartCurve(Math.PI * 2, Math.PI)]],
].map(([name, strokes]) => ({ name, cloud: normalize(resample(strokes)) }));

// ---- recognize ----------------------------------------------------------------------------
const SIGIL = { vee: 'V', caret: '^', bolt: 'ϟ' };

export function recognize(strokes, { maxDist = 0.6 } = {}) {
  strokes = strokes.filter((s) => s.length >= 2);
  if (!strokes.length) return null;
  const all = strokes.flat();
  const box = bbox(all), size = Math.max(box.w, box.h);
  let total = 0; for (const s of strokes) total += pathLen(s);
  if (total < 24 || size < 14) return null;
  const first = strokes[0], last = strokes[strokes.length - 1];
  const info = { box, size, center: { x: box.cx, y: box.cy }, start: { ...first[0] }, end: { ...last[last.length - 1] }, points: all, strokes };
  // a closed loop: about one turn, and it comes back to where it began (an overshoot past the start is still closed)
  const closedLoop = (s) => {
    const t = tidy(s), b = bbox(t), sz = Math.max(b.w, b.h), n = t.length, w = Math.abs(winding(t));
    if (sz < 12 || w < 0.75 || w > 1.45 || Math.min(b.w, b.h) < sz * 0.35) return false;
    let gap = Infinity;
    for (let i = 0; i < n * 0.4; i++) gap = Math.min(gap, dist(t[i], t[n - 1]));
    for (let j = Math.floor(n * 0.6); j < n; j++) gap = Math.min(gap, dist(t[0], t[j]));
    return gap < sz * 0.3;
  };

  // the bomb: a closed loop, and a stroke from inside it to outside (either order)
  if (strokes.length === 2) {
    for (const [loop, fuse] of [[strokes[0], strokes[1]], [strokes[1], strokes[0]]]) {
      if (!closedLoop(loop)) continue;
      const lb = bbox(loop), a = fuse[0], b = fuse[fuse.length - 1];
      const straight = dist(a, b) / (pathLen(tidy(fuse)) || 1) > 0.75;
      const ins = (p) => inside(p, loop) || dist(p, { x: lb.cx, y: lb.cy }) < Math.max(lb.w, lb.h) * 0.35;
      if (straight && ins(a) !== ins(b)) {
        const c = { x: lb.cx, y: lb.cy }, o = ins(a) ? b : a;
        return { ...info, name: 'bomb', dist: 0, sigil: null, center: c, radius: Math.max(lb.w, lb.h) / 2, dir: { x: o.x - c.x, y: o.y - c.y } };
      }
    }
  }
  // strokes that join end to end are read as the one path they make (after the bomb, whose strokes must not join)
  const one = strokes.length === 1 ? strokes[0] : chain(strokes, size * 0.15);
  if (one) {
    const s = one, t = tidy(one), L = pathLen(t), chord = dist(t[0], t[t.length - 1]);
    // a line: straight, and long enough to mean it
    if (chord / L > 0.9 && chord > 30) {
      const ang = Math.atan2(s[s.length - 1].y - s[0].y, s[s.length - 1].x - s[0].x);
      const a = Math.abs(((ang % Math.PI) + Math.PI) % Math.PI); // (0 .. pi: a line has no way round)
      const sigil = a < 0.4 || a > Math.PI - 0.4 ? '—' : Math.abs(a - Math.PI / 2) < 0.4 ? '|' : null;
      return { ...info, name: 'line', dist: 0, sigil, angle: ang, dir: { x: Math.cos(ang), y: Math.sin(ang) } };
    }
    const w = winding(t);
    // a spiral or a loop: more than a turn and a half (the way it ends up going is the way the wind blows)
    if (Math.abs(w) >= 1.45 && corners(s).count < 2) {
      const n = t.length, a = t[Math.max(0, n - 5)], b = t[n - 1];
      return { ...info, name: 'spiral', dist: 0, sigil: null, turns: w, dir: { x: b.x - a.x, y: b.y - a.y } };
    }
    // one closed turn: a circle if it has no corners, the heart if it has its two (the point and the notch)
    if (closedLoop(s)) {
      const c = corners(s).count;
      if (c === 0) return { ...info, name: 'circle', dist: 0, sigil: null, radius: size / 2, poly: s };
      if (c <= 2) return { ...info, name: 'heart', dist: 0, sigil: null };
    }
  }
  // the rest: $P against the templates
  const cloud = normalize(resample(strokes));
  let best = null, bd = Infinity;
  for (const T of TEMPLATES) { const d = greedyMatch(cloud, T.cloud); if (d < bd) { bd = d; best = T.name; } }
  if (!best || bd > maxDist) return null;
  return { ...info, name: best, dist: bd, sigil: SIGIL[best] || null };
}

/** Pictograms of the shapes, for the reference scroll at the canvas's edge: [name, strokes (unit box, y down)]. */
export const PICTOGRAMS = [
  ['line', [poly(0.1, 0.5, 0.9, 0.5)]],
  ['circle', [Array.from({ length: 25 }, (_, i) => ({ x: 0.5 + 0.4 * Math.cos((i / 24) * Math.PI * 2), y: 0.5 + 0.4 * Math.sin((i / 24) * Math.PI * 2) }))]],
  ['bomb', [Array.from({ length: 25 }, (_, i) => ({ x: 0.42 + 0.3 * Math.cos((i / 24) * Math.PI * 2), y: 0.42 + 0.3 * Math.sin((i / 24) * Math.PI * 2) })), poly(0.45, 0.45, 0.95, 0.95)]],
  ['spiral', [Array.from({ length: 50 }, (_, i) => { const t = (i / 49) * Math.PI * 4.2, r = 0.44 - (i / 49) * 0.36; return { x: 0.5 + r * Math.cos(t), y: 0.5 + r * Math.sin(t) }; })]],
  ['bolt', [poly(0.62, 0.05, 0.3, 0.5, 0.68, 0.5, 0.36, 0.95)]],
  ['caret', [poly(0.1, 0.85, 0.5, 0.15, 0.9, 0.85)]],
  ['vee', [poly(0.1, 0.15, 0.5, 0.85, 0.9, 0.15)]],
  ['heart', [heartCurve(0, Math.PI * 2).map((p) => ({ x: 0.5 + p.x / 38, y: 0.46 + p.y / 38 }))]],
];
