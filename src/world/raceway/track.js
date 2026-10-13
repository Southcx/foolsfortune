// ---------------------------------------------------------------------------------------
// THE RACEWAY'S TRACK, AS DATA (docs/plans/SKIFF-RACING.md section 5): the circuit the Solar Skiff is raced round, and the one height
// function the Raceway's sand, its physics height field and the board's hover all read. A closed line through control points (each a
// place, the track's height there, its half-width, and the course wind's angle off the track); the line is a centripetal Catmull-Rom,
// sampled every 2 m; height and width run between the points on a monotone cubic (Fritsch-Carlson: no overshoot, so a lip stays a lip
// and a cliff stays a cliff); the banking comes from the line's own bend. The sand is the Dunes' kind of noise, and the track's corridor
// is cut through it: the running surface, a berm each side, then a blend back to the sea. Features hang on the line by a control point
// and metres on from it: gates, kickers, whoops, sun plates, geysers, the glide lip, the columns of the slalom.
// Pure numbers, no three.js: a Node script can lay the track and ask it questions.
//
// Prior art: the spline track of every racer since F-Zero (a centre line with a width and a bank: Wipeout's and MK8's track splines);
// the "corridor carved into a height field" of Motorstorm's and SSX's open courses; the Dunes' own noise (world/dunes/dunes.js
// localHeight); Fritsch and Carlson, "Monotone Piecewise Cubic Interpolation" (1980); Yuksel et al., centripetal Catmull-Rom (2011).
//
//   RW (the place's origin)   CONTROL [[x, z, y, halfWidth, wind]]   FEATURES   const T = track()   T.length   T.heightAt(lx, lz)
//   T.nearest(lx, lz, hintS?) -> { s, lat, d, i }   T.frame(s) -> { x, y, z, fx, fz, w, wind }   T.sOf(cp, metres)   T.gates [s]
// ---------------------------------------------------------------------------------------

/** Where the Raceway lies: at the Dunes' layer, far east of them (render/zonemap.js 'raceway'); its field and its far ring. */
export const RW = { x: 5200, y: -420, z: 0, half: 560, step: 2.5, outer: 900, edge: 500 };

// The circuit, one lap about 2.7 km, laid counter-clockwise from the start straight (local metres: x east, z north; y the track's height
// over the layer's floor; w its half-width; wind the course wind's angle off the track, 0 dead behind, 1.4 nearly across).
export const CONTROL = [
  [-220, -330, 22, 13, 0], [-60, -340, 22, 13, 0], [110, -330, 22, 12, 0], // 0-2 the start straight
  [250, -280, 23, 12, 0.5], [330, -170, 24, 12, 0.5], //                        3-4 turn one, a long banked sweeper
  [355, -50, 24, 11, 0], [350, 70, 25, 11, 0], //                               5-6 the whoops
  [310, 180, 26, 12, 0.3], [230, 270, 28, 12, 0.3], //                          7-8 the ruin slalom
  [110, 320, 36, 11, 1.2], [-10, 300, 46, 10, 1.2], [-60, 230, 56, 10, 1.0], // 9-11 the climb, the wind across
  [40, 180, 68, 10, 1.0], [140, 150, 80, 10, 1.2], [170, 70, 90, 11, 0.6], //   12-14 switchbacks up to the mesa
  [90, 30, 98, 12, 0], [-40, 40, 100, 13, 0], [-170, 60, 100, 13, 0], //        15-17 the mesa top
  [-232, 66, 100, 14, 0], [-238, 67, 74, 14, 0], //                             18-19 THE LIP, and the foot of the sandfall's face (26 m)
  [-292, 75, 40, 15, 0], [-352, 80, 26, 15, 0], //                              20-21 the landing hill, the runout
  [-420, 20, 24, 11, 0], [-440, -90, 23, 11, 0.2], //                           22-23 the canyon run
  [-400, -190, 22, 12, 1.4], [-330, -260, 22, 12, 1.4], //                      24-25 the gale, across
  [-300, -320, 22, 13, 0.4], //                                                 26 the last turn
];

/** What hangs on the line: each at control point `cp` and `at` metres on from it (negative: before it). */
export const FEATURES = {
  start: { cp: 0, at: 30 }, // (the line: the grid is 20 m behind it)
  gates: [[1, 40], [4, 0], [7, 0], [10, 0], [14, 0], [17, 0], [21, 0], [24, 0]], // (eight, in order; the line is the ninth)
  whoops: { from: [5, 0], to: [6, 0], h: 2.2, wave: 22 }, // (crests across the track: metres high, metres apart)
  kickers: [[2, -40], [16, 0], [17, 10], [21, 30]].map(([cp, at]) => ({ cp, at, h: 2.4, len: 9 })), // (a ramp up h over len, then the lip)
  plates: [[3, -20, 0], [12, -10, -3], [13, 30, 2], [15, 10, 0], [16, 40, 4], [24, 0, 0], [26, 0, -2]].map(([cp, at, lat]) => ({ cp, at, lat, len: 7, w: 2.6 })),
  geysers: [[22, 0, 2], [23, -30, -3]].map(([cp, at, lat]) => ({ cp, at, lat })),
  glideLip: { cp: 18, from: -4, to: 70 }, // (in the air over this stretch the wings open by themselves: MK8's glider ramp)
  slalom: { from: [7, -20], to: [8, 10], every: 22, lat: 5 }, // (ruin columns in the line, alternating sides)
  canyon: { from: [21, 20], to: [23, 0], berm: 7 }, // (high berms: the canyon's walls)
};
const BERM = { w: 6, h: 1.4, blend: 46 }; // (the berm's width and height, the blend back to the sea, metres)
const BANK = { k: 24, max: 0.42, smooth: 15 }; // (tan of the bank = k x the bend (1/m), capped; the bend smoothed over metres)
const STEP = 2; // (metres between samples of the line)

// ---- the Dunes' kind of sand (world/dunes/dunes.js localHeight, its noise kept here so the track needs nothing of three.js)
const hash = (x, z) => { let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  const u = smooth(fx), v = smooth(fz); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, oct = 3) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); a *= 0.5; f *= 2.03; } return s; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function duneProfile(f) { const c = 0.74; if (f < c) { const t = f / c; return Math.pow(t, 1.25) * (0.92 + 0.08 * t); } return 1 - smooth(Math.min(1, ((f - c) / (1 - c)) * 1.05)); }
const WIND_AT = 0.55;
/** The open sand round the track (local metres): the Dunes' long crests, a little calmer, rising far out into high dunes that close the view. */
export function sandAt(x, z) {
  const wx = Math.cos(WIND_AT), wz = Math.sin(WIND_AT);
  const px = x + (fbm(x * 0.004 + 61, z * 0.004, 3) - 0.43) * 130, pz = z + (fbm(x * 0.004, z * 0.004 + 87, 3) - 0.43) * 130;
  const s = (px * wx + pz * wz) / 112 + (fbm(px * 0.006 + 53, pz * 0.006 + 9, 3) - 0.43) * 3.4;
  const amp = 5 + 11 * fbm(px * 0.0032 + 55, pz * 0.0032 - 2, 2);
  let h = duneProfile(s - Math.floor(s)) * amp + (fbm(px * 0.0022 + 50, pz * 0.0022 + 7, 3) - 0.43) * 18 + 16;
  const far = sstep(RW.edge + 40, RW.outer, Math.hypot(x, z)); h += far * far * 110;
  return h;
}

/** Fritsch-Carlson slopes for a monotone cubic through (xs, ys). */
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = Math.min(1, Math.max(0, (x - xs[i]) / h)), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

/** Lay the track: the line sampled, its heights, widths, banks and winds, the features placed, the grid that finds the line fast. */
export function track() {
  const C = CONTROL, n = C.length;
  // ---- the line: centripetal Catmull-Rom through the points, closed
  const pts = [];
  const cpAt = []; // (each control point's index among the dense points)
  for (let i = 0; i < n; i++) {
    const P0 = C[(i + n - 1) % n], P1 = C[i], P2 = C[(i + 1) % n], P3 = C[(i + 2) % n];
    const tj = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-3;
    const t0 = 0, t1 = t0 + tj(P0, P1), t2 = t1 + tj(P1, P2), t3 = t2 + tj(P2, P3);
    const seg = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]), k = Math.max(2, Math.ceil(seg / 0.5));
    cpAt.push(pts.length);
    for (let j = 0; j < k; j++) {
      const t = t1 + (t2 - t1) * (j / k), out = [0, 0];
      for (let c = 0; c < 2; c++) {
        const A1 = ((t1 - t) * P0[c] + (t - t0) * P1[c]) / (t1 - t0), A2 = ((t2 - t) * P1[c] + (t - t1) * P2[c]) / (t2 - t1), A3 = ((t3 - t) * P2[c] + (t - t2) * P3[c]) / (t3 - t2);
        const B1 = ((t2 - t) * A1 + (t - t0) * A2) / (t2 - t0), B2 = ((t3 - t) * A2 + (t - t1) * A3) / (t3 - t1);
        out[c] = ((t2 - t) * B1 + (t - t1) * B2) / (t2 - t1);
      }
      pts.push(out);
    }
  }
  // ---- resample at STEP metres along its length
  const cum = [0]; for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[pts.length], N = Math.round(L / STEP), ds = L / N;
  const X = new Float32Array(N), Z = new Float32Array(N), FX = new Float32Array(N), FZ = new Float32Array(N);
  let j = 0;
  for (let i = 0; i < N; i++) {
    const s = i * ds; while (j < pts.length - 1 && cum[j + 1] < s) j++;
    const a = pts[j], b = pts[(j + 1) % pts.length], u = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    X[i] = a[0] + (b[0] - a[0]) * u; Z[i] = a[1] + (b[1] - a[1]) * u;
  }
  for (let i = 0; i < N; i++) { const a = (i + N - 1) % N, b = (i + 1) % N, dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1; FX[i] = dx / l; FZ[i] = dz / l; }
  const cpS = cpAt.map((k) => cum[k]);
  // ---- heights, widths and winds by s on monotone cubics (closed: the first point again at L)
  const xs = [...cpS, L], mono = (col) => monotone(xs, [...C.map((c) => c[col]), C[0][col]]);
  const yOf = mono(2), wOf = mono(3), windOf = mono(4);
  const sOf = (cp, at = 0) => ((cpS[((cp % n) + n) % n] + at) % L + L) % L;
  const Y = new Float32Array(N), W = new Float32Array(N), WIND = new Float32Array(N), BK = new Float32Array(N), BH = new Float32Array(N).fill(BERM.h);
  for (let i = 0; i < N; i++) { const s = i * ds; Y[i] = yOf(s); W[i] = wOf(s); WIND[i] = windOf(s); }
  // the features that shape the ground: whoops, kickers, the canyon's high berms
  const F = FEATURES, idx = (s) => ((Math.round(s / ds) % N) + N) % N, span = (a, b) => { const s0 = sOf(...a), s1 = sOf(...b); return [s0, s1 >= s0 ? s1 : s1 + L]; };
  { const [s0, s1] = span(F.whoops.from, F.whoops.to); for (let s = s0; s < s1; s += ds) { const u = s - s0, e = sstep(0, 20, u) * sstep(0, 20, s1 - s); Y[idx(s)] += F.whoops.h * e * (1 - Math.cos((2 * Math.PI * u) / F.whoops.wave)) / 2; } }
  for (const K of F.kickers) { const s0 = sOf(K.cp, K.at); for (let u = 0; u < K.len + 3; u += ds) Y[idx(s0 + u)] += u <= K.len ? K.h * Math.pow(u / K.len, 1.6) : K.h * (1 - (u - K.len) / 3) * 0.2; }
  { const [s0, s1] = span(F.canyon.from, F.canyon.to); for (let s = s0; s < s1; s += ds) BH[idx(s)] = BERM.h + (F.canyon.berm - BERM.h) * sstep(0, 30, s - s0) * sstep(0, 30, s1 - s); }
  // the bank: tan = k x the bend toward the right, smoothed; the outside of a turn stands higher
  const bend = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = (i + N - 1) % N, b = (i + 1) % N, dfx = (FX[b] - FX[a]) / (2 * ds), dfz = (FZ[b] - FZ[a]) / (2 * ds); bend[i] = dfx * -FZ[i] + dfz * FX[i]; } // (the turn toward the right: d(fwd)/ds . right, right = (-fz, fx))
  const r = Math.round(BANK.smooth / ds);
  for (let i = 0; i < N; i++) { let s = 0; for (let k = -r; k <= r; k++) s += bend[(i + k + N) % N]; BK[i] = Math.max(-BANK.max, Math.min(BANK.max, (s / (2 * r + 1)) * BANK.k)); }
  // ---- the grid: which samples lie in each 16 m cell (to find the line from any point without a search of all of it)
  const CELL = 16, G = new Map(), key = (cx, cz) => cx * 100003 + cz;
  for (let i = 0; i < N; i++) { const k = key(Math.floor(X[i] / CELL), Math.floor(Z[i] / CELL)); let a = G.get(k); if (!a) G.set(k, (a = [])); a.push(i); }
  const reach = Math.max(...C.map((c) => c[3])) + BERM.w + BERM.blend + 4, rc = Math.ceil(reach / CELL);

  /** The line's nearest point to (x, z): its s, the signed distance to its right (lat), the distance, the sample. Searched near `hintS`
   *  (within 80 m of it) when given, so a lap's progress never jumps to a switchback's other leg. */
  function nearest(x, z, hintS = null, cells = rc) {
    let best = null;
    const test = (i) => {
      const i2 = (i + 1) % N, ax = X[i], az = Z[i], bx = X[i2] - ax, bz = Z[i2] - az, l2 = bx * bx + bz * bz;
      const u = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / l2)), px = ax + bx * u, pz = az + bz * u, d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) best = { i, u, d, s: (i + u) * ds, lat: (x - px) * -FZ[i] + (z - pz) * FX[i] };
    };
    if (hintS != null) { const c = Math.round(hintS / ds), w = Math.round(80 / ds); for (let k = -w; k <= w; k++) test((c + k + N) % N); return best; }
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let a = -cells; a <= cells; a++) for (let b = -cells; b <= cells; b++) { const L2 = G.get(key(cx + a, cz + b)); if (L2) for (const i of L2) test(i); }
    return best;
  }
  /** The corridor's ground at a sample, `lat` metres to its right (its surface, its berm, and the berm's top beyond). */
  const corridor = (i, u, lat) => {
    const i2 = (i + 1) % N, lerp = (A) => A[i] + (A[i2] - A[i]) * u;
    const y = lerp(Y), w = lerp(W), bk = lerp(BK), bh = lerp(BH), a = Math.abs(lat), edge = y - bk * Math.sign(lat) * Math.min(a, w);
    const cy = a <= w ? y - bk * lat : edge + bh * sstep(0, BERM.w, a - w);
    return { cy, alpha: 1 - sstep(w + BERM.w, w + BERM.w + BERM.blend, a) };
  };
  // each cell's candidates: every sample whose segment can come within reach of a point in it (built once: the field asks 200,000 times)
  const NEAR = new Map(), half = CELL * 0.71;
  for (let i = 0; i < N; i++) { const cx = Math.floor(X[i] / CELL), cz = Math.floor(Z[i] / CELL); for (let a = -rc; a <= rc; a++) for (let b = -rc; b <= rc; b++) {
    const mx = (cx + a + 0.5) * CELL, mz = (cz + b + 0.5) * CELL; if (Math.hypot(mx - X[i], mz - Z[i]) > reach + half + ds) continue;
    const k = key(cx + a, cz + b); let l = NEAR.get(k); if (!l) NEAR.set(k, (l = [])); l.push(i); } }
  const apart = (s1, s2) => Math.abs(((s1 - s2 + L * 1.5) % L) - L / 2), R2 = reach * reach;
  let pu = 0; // (the last projection's u)
  const d2Of = (i, x, z) => {
    const i2 = (i + 1) % N, ax = X[i], az = Z[i], bx = X[i2] - ax, bz = Z[i2] - az;
    pu = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz))); const ex = x - ax - bx * pu, ez = z - az - bz * pu; return ex * ex + ez * ez;
  };
  const latOf = (i, u, x, z) => { const i2 = (i + 1) % N; return (x - X[i] - (X[i2] - X[i]) * u) * -FZ[i] + (z - Z[i] - (Z[i2] - Z[i]) * u) * FX[i]; };
  /** The ground (local metres over the layer's floor) at local x, z: the sand, and the nearest two legs of the corridor (points of the
   *  line more than 100 m apart along it), each pulling the ground to its own surface by its weight (all of it inside its berm). */
  function heightAt(x, z) {
    const base = sandAt(x, z), list = NEAR.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
    if (!list) return base;
    let ai = -1, au = 0, ad = R2, bi = -1, bu = 0, bd = R2;
    for (let k = 0; k < list.length; k++) { const i = list[k], d = d2Of(i, x, z); if (d < ad) { ad = d; ai = i; au = pu; } }
    if (ai < 0) return base;
    const as = (ai + au) * ds;
    for (let k = 0; k < list.length; k++) { const i = list[k], d = d2Of(i, x, z); if (d < bd && apart((i + pu) * ds, as) > 100) { bd = d; bi = i; bu = pu; } }
    let sum = base, wt = 1;
    const pull = (i, u) => { const { cy, alpha } = corridor(i, u, latOf(i, u, x, z)); if (alpha <= 0) return; const k = alpha >= 0.999 ? 1e6 : alpha / (1 - alpha); sum += cy * k; wt += k; };
    pull(ai, au); if (bi >= 0) pull(bi, bu);
    return sum / wt;
  }
  /** The line at s: where it is, which way it runs, its half-width and the wind's angle off it. */
  function frame(s) {
    const t = (((s % L) + L) % L) / ds, i = Math.floor(t) % N, i2 = (i + 1) % N, u = t - Math.floor(t), lerp = (A) => A[i] + (A[i2] - A[i]) * u;
    return { x: lerp(X), z: lerp(Z), y: lerp(Y), fx: FX[i], fz: FZ[i], w: lerp(W), wind: lerp(WIND), bank: lerp(BK) };
  }
  const gates = F.gates.map(([cp, at]) => sOf(cp, at));
  return { length: L, ds, N, X, Z, Y, W, BK, FX, FZ, cpS, sOf, nearest, heightAt, frame, gates, line: sOf(F.start.cp, F.start.at), reach };
}
