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
export const RW = { x: 6000, y: -420, z: 0, half: 1320, step: 2.5, outer: 1950, edge: 1270 }; // (half: a whole number of the terrain's 80 m chunks) // (a park of tracks, the owner 2026-10-14: "quadruple the size"; 2.6 km across, its round barrier clear of every line)

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
  kickers: [[2, -40, 2.4, 9], [4, 70, 2.4, 9], [6, 40, 3.2, 12], [16, 0, 2.4, 9], [17, 10, 2.4, 9], [21, 70, 2.4, 9], [26, 40, 2, 8]]
    .map(([cp, at, h, len]) => ({ cp, at, h, len })), // (a ramp up h over len, then the lip, the whole width; [21, 70] moved off the cavern's fork)
  // side ramps (SKIFF-RACING.md 9: the owner's "we need more ramps"): a kicker over part of the width only, one side of the line, so taking
  // it is a choice (SSX's side hits): [cp, at, lat (its middle, m right of the line), half its width, h, len]
  ramps: [[1, 90, 6, 4, 2.6, 10], [5, -40, -5, 4, 2.4, 9], [10, 30, 4, 3.5, 2.2, 8], [13, -40, -4, 3.5, 2.4, 9], [22, 50, -6, 3.5, 2.8, 10], [25, 40, -5, 4, 2.6, 10]]
    .map(([cp, at, lat, w, h, len]) => ({ cp, at, lat, w, h, len })),
  plates: [[3, -20, 0], [12, -10, -3], [13, 30, 2], [15, 10, 0], [16, 40, 4], [24, 0, 0], [26, 0, -2]].map(([cp, at, lat]) => ({ cp, at, lat, len: 7, w: 2.6 })),
  geysers: [[22, 0, 2], [23, -30, -3]].map(([cp, at, lat]) => ({ cp, at, lat })),
  glideLip: { cp: 18, from: -4, to: 70 }, // (in the air over this stretch the wings open by themselves: MK8's glider ramp)
  slalom: { from: [7, -20], to: [8, 10], every: 22, lat: 5 }, // (ruin columns in the line, alternating sides)
  canyon: { from: [21, 20], to: [23, 0], berm: 7 }, // (high berms: the canyon's walls)
  // grind rails (SKIFF-RACING.md 7 and 9: the skiff alone): from a point on the line to another, each [cp, at, lat], `lift` metres over the
  // ground at its ends, never under `clear` over the ground between (a ruin's lintel on its columns). `along`: it follows the line's own
  // curve between them (the owner, 2026-10-14: "racing is all about curves"), its lat eased from one end's to the other's, and `wave`
  // metres of a weave across it; else a chord. `line: 'cavern'`: on the cavern's branch, `from` and `to` in metres along it and lat.
  rails: [
    { from: [3, -50, -6], to: [4, 40, -6], lift: 1.6, along: true }, // (turn one's inside, round the sweep with it)
    { from: [5, 10, 0], to: [6, -10, 0], lift: 2.6, along: true }, //   (over the whoops: the smooth line)
    { from: [7, -10, 0], to: [8, 0, 0], lift: 1.6, along: true, wave: 1.8 }, // (down the slalom, weaving between its columns)
    { from: [14, -40, 3], to: [15, 30, 3], lift: 1.8, along: true }, // (round the last switchback's bend onto the mesa: the long one)
    { from: [22, -10, 0], to: [23, -45, 0], lift: 1.8, along: true }, // (the canyon's spine, the geysers beside it)
    { from: [24, 15, 4], to: [25, -15, 4], lift: 1.4, along: true }, // (the gale: a line out of the crosswind's push)
    { line: 'cavern', from: [62, 0], to: [150, 0], lift: 1.4 }, //       (the cavern's: down its middle, round its bend)
  ].map((r) => ({ ...r, clear: 0.9 })),
  // sun rings in the air (the Gnomon's rings, flown through: a push and a little Lachryma): [cp, at, lat, metres over the line]
  rings: [[1, 108, 6, 5], [2, -22, 0, 4], [6, 60, 0, 6], [16, 14, 0, 4.2], [17, 24, 0, 4.2], [18, 22, 0, 0], [18, 45, 0, 0], [18, 70, 0, 0], [21, 90, 0, 4]],
  ringGlide: 5, // (the drop's rings hang on a 5-to-1 glide from the lip, where the `0` heights are)
};
// THE CAVERN (working name, Espada's to rule; SKIFF-RACING.md 9): the alternate course, a branch off the line after the landing hill
// (`from`) that runs down into a gorge under a roof of stone, through the circuit's middle, and back up onto the line at the gale's end
// (`to`), past gate 8 (crossed for you: the race maps the branch onto the stretch of line it stands for). Its interior points [x, z, y,
// halfWidth]; metres it holds the line's height after the fork and before the merge; its walls (m to rise, the blend back to the sand);
// where the roof begins (m of wall); the course wind's share in it (a cave breathes: the air moves along it, weaker); its pads (the
// crystal veins: a push the sun does not feed, [metres along it, lat]) and kickers.
export const BRANCH = {
  id: 'cavern', from: [21, 25], to: [25, 0],
  // (deeper and wider since round 4: the owner, "it needs more ceiling clearance": the floor 6 to 8 m lower, the roof only where the walls
  // stand 11 m, the stalactites 10 m clear)
  ctrl: [[-350, 20, 20, 10], [-296, -36, -3, 11], [-286, -116, -8, 12], [-322, -196, 4, 10]], // (an S through the circuit's middle)
  hold: 30, wall: 3, blend: 24, roof: 11, wind: 0.45,
  pads: [[45, 0], [228, 2]].map(([at, lat]) => ({ at, lat, len: 7, w: 2.6 })),
  kickers: [{ at: 150, h: 2.6, len: 9 }], // (the jump over the pool)
  // inside it (cavern.js): THE POOL (water under the roof, skimmed: park.js lays it, `depth` under the floor), the crystal PILLARS to weave
  // (metres along, lat, radius: stone, collided), and THE SKYLIGHT FALL (sand pouring through a gap in the roof, at metres along)
  pools: [{ at: 162, len: 46, depth: 2.5 }],
  pillars: [[205, -3.5, 2], [232, 4, 2.2], [258, -2, 1.8], [270, 6, 1.6]],
  skyfall: { at: 186 },
};
/** The Sun Circuit, as the park lays it: where its local frame sits in the park's (metres), and turned (radians). */
export const SUN = { id: 'sun', name: 'the Sun Circuit', at: { x: -520, z: -440, rot: Math.PI } }; // (turned so its start straight faces the hub)
const BERM = { w: 6, h: 1.4, blend: 46, cutBlend: 24 }; // (a cut's walls rise over its `cut` metres to the sand, then blend in over cutBlend) // (the berm's width and height, the blend back to the sea, metres)
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

/** One centripetal Catmull-Rom segment from P1 to P2 (P0 and P3 its neighbours), its points every half metre pushed onto `out`. */
function catmull(P0, P1, P2, P3, out) {
  const tj = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-3;
  const t0 = 0, t1 = t0 + tj(P0, P1), t2 = t1 + tj(P1, P2), t3 = t2 + tj(P2, P3);
  const seg = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]), k = Math.max(2, Math.ceil(seg / 0.5));
  for (let j = 0; j < k; j++) {
    const t = t1 + (t2 - t1) * (j / k), o = [0, 0];
    for (let c = 0; c < 2; c++) {
      const A1 = ((t1 - t) * P0[c] + (t - t0) * P1[c]) / (t1 - t0), A2 = ((t2 - t) * P1[c] + (t - t1) * P2[c]) / (t2 - t1), A3 = ((t3 - t) * P2[c] + (t - t2) * P3[c]) / (t3 - t2);
      const B1 = ((t2 - t) * A1 + (t - t0) * A2) / (t2 - t0), B2 = ((t3 - t) * A2 + (t - t1) * A3) / (t3 - t1);
      o[c] = ((t2 - t) * B1 + (t - t1) * B2) / (t2 - t1);
    }
    out.push(o);
  }
}
/** Each 16 m cell's candidates: every sample of a line whose segment can come within `reach` of a point in it (built once: the field asks
 *  200,000 times). */
const CELL = 16, cellKey = (cx, cz) => cx * 100003 + cz;
function nearMap(X, Z, N, reach, closed = true) {
  const M = new Map(), rc = Math.ceil(reach / CELL), half = CELL * 0.71;
  for (let i = 0; i < N - (closed ? 0 : 1); i++) { const cx = Math.floor(X[i] / CELL), cz = Math.floor(Z[i] / CELL); for (let a = -rc; a <= rc; a++) for (let b = -rc; b <= rc; b++) {
    const mx = (cx + a + 0.5) * CELL, mz = (cz + b + 0.5) * CELL; if (Math.hypot(mx - X[i], mz - Z[i]) > reach + half + STEP) continue;
    const k = cellKey(cx + a, cz + b); let l = M.get(k); if (!l) M.set(k, (l = [])); l.push(i); } }
  return M;
}

/** Lay a track: the line sampled, its heights, widths, banks and winds, the features placed, the grid that finds the line fast. `def`:
 *  { id, at: { x, z, rot }, control: [[x, z, y, halfWidth, wind, cut?]], features, branch? } (the Sun Circuit's by default). A control
 *  point's `cut` (m) makes the line there a CUT: its walls rise steeply over that many metres to the sand beside it (a canyon), never a
 *  berm's gentle slope. */
export function track(def = { ...SUN, control: CONTROL, features: FEATURES, branch: BRANCH }, ground = sandAt) {
  const at = def.at || { x: 0, z: 0, rot: 0 }, cr = Math.cos(at.rot || 0), sr = Math.sin(at.rot || 0);
  const place = (x, z) => [at.x + x * cr - z * sr, at.z + x * sr + z * cr];
  const C = def.control.map((c) => [...place(c[0], c[1]), c[2], c[3], c[4] ?? 0, c[5] ?? 0]), n = C.length;
  const FEATURES = { kickers: [], ramps: [], plates: [], geysers: [], rails: [], rings: [], gates: [], ...def.features };
  FEATURES.glideLips ||= FEATURES.glideLip ? [FEATURES.glideLip] : []; FEATURES.sandfalls ||= FEATURES.glideLip ? [{ cp: FEATURES.glideLip.cp }] : []; FEATURES.coaster ||= [];
  const BRANCH = def.branch ? { ...def.branch, ctrl: def.branch.ctrl.map((c) => [...place(c[0], c[1]), c[2], c[3]]) } : null;
  // ---- the line: centripetal Catmull-Rom through the points, closed
  const pts = [];
  const cpAt = []; // (each control point's index among the dense points)
  for (let i = 0; i < n; i++) { cpAt.push(pts.length); catmull(C[(i + n - 1) % n], C[i], C[(i + 1) % n], C[(i + 2) % n], pts); }
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
  const yOf = mono(2), wOf = mono(3), windOf = mono(4), cutOf = mono(5);
  const sOf = (cp, at = 0) => ((cpS[((cp % n) + n) % n] + at) % L + L) % L;
  const Y = new Float32Array(N), W = new Float32Array(N), WIND = new Float32Array(N), BK = new Float32Array(N), BH = new Float32Array(N).fill(BERM.h), BMW = new Float32Array(N).fill(BERM.w), BMB = new Float32Array(N).fill(BERM.blend);
  for (let i = 0; i < N; i++) { const s = i * ds; Y[i] = yOf(s); W[i] = wOf(s); WIND[i] = windOf(s); }
  // the cuts: where a control point asks for one, the walls rise steeply to the sand beside the line (a canyon); eased in and out
  for (let i = 0; i < N; i++) { const c = cutOf(i * ds); if (c < 0.5) continue; const w = W[i] + c, l = ground(X[i] + FZ[i] * w, Z[i] - FX[i] * w), r = ground(X[i] - FZ[i] * w, Z[i] + FX[i] * w); BMW[i] = Math.max(2, c); BMB[i] = BERM.cutBlend; BH[i] = Math.max(BERM.h, Math.min(l, r) - Y[i] + 0.5); }
  // the features that shape the ground: whoops, kickers, the canyon's high berms
  const F = FEATURES, idx = (s) => ((Math.round(s / ds) % N) + N) % N, span = (a, b) => { const s0 = sOf(...a), s1 = sOf(...b); return [s0, s1 >= s0 ? s1 : s1 + L]; };
  if (F.whoops) { const [s0, s1] = span(F.whoops.from, F.whoops.to); for (let s = s0; s < s1; s += ds) { const u = s - s0, e = sstep(0, 20, u) * sstep(0, 20, s1 - s); Y[idx(s)] += F.whoops.h * e * (1 - Math.cos((2 * Math.PI * u) / F.whoops.wave)) / 2; } }
  for (const K of F.kickers) { const s0 = sOf(K.cp, K.at); for (let u = 0; u < K.len + 3; u += ds) Y[idx(s0 + u)] += u <= K.len ? K.h * Math.pow(u / K.len, 1.6) : K.h * (1 - (u - K.len) / 3) * 0.2; }
  // the bridges: a stretch of the line laid as a deck over whatever runs under it (the ground there is left to the sand and the other
  // tracks: a deck is built and collided in world/raceway/decks.js, and the board rides it: raceway.rideHeight)
  const DECK = new Uint8Array(N), decks = (F.bridges || []).map((Bd) => { const [s0, s1] = span(Bd.from, Bd.to); for (let s = s0; s <= s1; s += ds) DECK[idx(s)] = 1; return { s0, s1 }; });
  if (F.canyon) { const [s0, s1] = span(F.canyon.from, F.canyon.to); for (let s = s0; s < s1; s += ds) BH[idx(s)] = Math.max(BH[idx(s)], BERM.h + (F.canyon.berm - BERM.h) * sstep(0, 30, s - s0) * sstep(0, 30, s1 - s)); }
  // dips: the line pressed down under a flat water's surface over a stretch (a ford: the board skims it, water.js), eased in and out
  for (const D of F.fords || []) { const [s0, s1] = span(D.from, D.to); for (let s = s0; s < s1; s += ds) Y[idx(s)] -= D.depth * sstep(0, 12, s - s0) * sstep(0, 12, s1 - s); }
  // the bank: tan = k x the bend toward the right, smoothed; the outside of a turn stands higher
  const bend = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = (i + N - 1) % N, b = (i + 1) % N, dfx = (FX[b] - FX[a]) / (2 * ds), dfz = (FZ[b] - FZ[a]) / (2 * ds); bend[i] = dfx * -FZ[i] + dfz * FX[i]; } // (the turn toward the right: d(fwd)/ds . right, right = (-fz, fx))
  const r = Math.round(BANK.smooth / ds);
  for (let i = 0; i < N; i++) { let s = 0; for (let k = -r; k <= r; k++) s += bend[(i + k + N) % N]; BK[i] = Math.max(-BANK.max, Math.min(BANK.max, (s / (2 * r + 1)) * BANK.k)); }
  // the bowls: a stretch banked steeper than the bend asks, the outside a wall to lean on (the Nordschleife's Karussell), eased in and out
  for (const Bw of F.bowls || []) { const [s0, s1] = span(Bw.from, Bw.to); for (let s = s0; s < s1; s += ds) { const i = idx(s), k = sstep(0, 15, s - s0) * sstep(0, 15, s1 - s); BK[i] += (Math.sign(BK[i] || 1) * Bw.bank - BK[i]) * k; } }
  // the side ramps: each sample's ramps (a kicker over part of the width: corridor() adds it where the lat is inside it)
  const RAMPS = new Map();
  for (const K of F.ramps) { const s0 = sOf(K.cp, K.at); for (let u = 0; u < K.len + 3; u += ds) { const i = idx(s0 + u), h = u <= K.len ? K.h * Math.pow(u / K.len, 1.6) : K.h * (1 - (u - K.len) / 3) * 0.2; let l = RAMPS.get(i); if (!l) RAMPS.set(i, (l = [])); l.push({ lat: K.lat, w: K.w, h }); } }
  const rampAt = (i, lat) => { const l = RAMPS.get(i); if (!l) return 0; let h = 0; for (const K of l) h = Math.max(h, K.h * (1 - sstep(K.w, K.w + 2.5, Math.abs(lat - K.lat)))); return h; }; // (its sides bevelled over 2.5 m: a board clipping its edge is tipped, not walled)
  // ---- the grid: which samples lie in each 16 m cell (to find the line from any point without a search of all of it)
  const G = new Map(), key = cellKey;
  for (let i = 0; i < N; i++) { const k = key(Math.floor(X[i] / CELL), Math.floor(Z[i] / CELL)); let a = G.get(k); if (!a) G.set(k, (a = [])); a.push(i); }
  const reach = Math.max(...C.map((c) => c[3] + Math.max(BERM.w + BERM.blend, c[5] + BERM.cutBlend))) + 4, rc = Math.ceil(reach / CELL);

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
  /** The corridor's ground at a sample, `lat` metres to its right (its surface, its berm, and the berm's top beyond); `on`: on its running
   *  surface. */
  const corridor = (i, u, lat) => {
    const i2 = (i + 1) % N, lerp = (A) => A[i] + (A[i2] - A[i]) * u;
    const y = lerp(Y), w = lerp(W), bk = lerp(BK), bh = lerp(BH), bw = lerp(BMW), bb = lerp(BMB), a = Math.abs(lat), edge = y - bk * Math.sign(lat) * Math.min(a, w);
    const cy = a <= w ? y - bk * lat + rampAt(u < 0.5 ? i : i2, lat) : edge + bh * sstep(0, bw, a - w);
    return { cy, alpha: 1 - sstep(w + bw, w + bw + bb, a), on: a <= w };
  };
  const NEAR = nearMap(X, Z, N, reach);
  const apart = (s1, s2) => Math.abs(((s1 - s2 + L * 1.5) % L) - L / 2), R2 = reach * reach;
  let pu = 0; // (the last projection's u)
  const d2Of = (Xa, Za, n, i, x, z) => {
    const i2 = (i + 1) % n, ax = Xa[i], az = Za[i], bx = Xa[i2] - ax, bz = Za[i2] - az;
    pu = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz))); const ex = x - ax - bx * pu, ez = z - az - bz * pu; return ex * ex + ez * ez;
  };
  const latOf = (Xa, Za, FXa, FZa, n, i, u, x, z) => { const i2 = (i + 1) % n; return (x - Xa[i] - (Xa[i2] - Xa[i]) * u) * -FZa[i] + (z - Za[i] - (Za[i2] - Za[i]) * u) * FXa[i]; };

  // ---- THE CAVERN'S BRANCH (BRANCH): an open line from the fork to the merge, laid as the circuit's is, cut down into the sand as a gorge
  const branch = BRANCH ? layBranch() : null;
  function layBranch() {
  const B = BRANCH, bs0 = sOf(...B.from), bs1 = sOf(...B.to), bspan = ((bs1 - bs0) % L + L) % L, mainPt = (s) => { const f = frame(s); return [f.x, f.z]; };
  const BP = [mainPt(bs0 - 25), mainPt(bs0), ...B.ctrl.map((c) => [c[0], c[1]]), mainPt(bs1), mainPt(bs1 + 25)], bpts = [], bcp = [];
  for (let i = 1; i < BP.length - 2; i++) { bcp.push(bpts.length); catmull(BP[i - 1], BP[i], BP[i + 1], BP[i + 2], bpts); }
  bcp.push(bpts.length); bpts.push(BP[BP.length - 2]);
  const bcum = [0]; for (let i = 1; i < bpts.length; i++) bcum.push(bcum[i - 1] + Math.hypot(bpts[i][0] - bpts[i - 1][0], bpts[i][1] - bpts[i - 1][1]));
  const BL = bcum[bcum.length - 1], BN = Math.round(BL / STEP) + 1, bds = BL / (BN - 1);
  const BX = new Float32Array(BN), BZ = new Float32Array(BN), BFX = new Float32Array(BN), BFZ = new Float32Array(BN), BY = new Float32Array(BN), BW = new Float32Array(BN), BWH = new Float32Array(BN);
  { let j = 0; for (let i = 0; i < BN; i++) { const s = i * bds; while (j < bpts.length - 2 && bcum[j + 1] < s) j++; const a = bpts[j], b = bpts[j + 1], u = Math.min(1, (s - bcum[j]) / Math.max(1e-6, bcum[j + 1] - bcum[j])); BX[i] = a[0] + (b[0] - a[0]) * u; BZ[i] = a[1] + (b[1] - a[1]) * u; } }
  for (let i = 0; i < BN; i++) { const a = Math.max(0, i - 1), b = Math.min(BN - 1, i + 1), dx = BX[b] - BX[a], dz = BZ[b] - BZ[a], l = Math.hypot(dx, dz) || 1; BFX[i] = dx / l; BFZ[i] = dz / l; }
  { // heights and widths: the line's at both ends, held `hold` metres, then the interior's points on a monotone cubic
    const f0 = frame(bs0), f1 = frame(bs1), ks = bcp.map((k) => bcum[k]);
    const xs2 = [0, B.hold, ...ks.slice(1, -1), BL - B.hold, BL], ys2 = [f0.y, f0.y, ...B.ctrl.map((c) => c[2]), f1.y, f1.y], ws2 = [f0.w, f0.w, ...B.ctrl.map((c) => c[3]), f1.w, f1.w];
    const yB = monotone(xs2, ys2), wB = monotone(xs2, ws2);
    for (let i = 0; i < BN; i++) { BY[i] = yB(i * bds); BW[i] = wB(i * bds); }
    for (const K of B.kickers) for (let u = 0; u < K.len + 3; u += bds) { const i = Math.round((K.at + u) / bds); if (i < BN) BY[i] += u <= K.len ? K.h * Math.pow(u / K.len, 1.6) : K.h * (1 - (u - K.len) / 3) * 0.2; }
    // its walls rise to the sand beside it (a gorge: never under a berm's height), steep: the board runs between them
    for (let i = 0; i < BN; i++) { const w = BW[i] + B.wall, l = ground(BX[i] + BFZ[i] * w, BZ[i] - BFX[i] * w), r = ground(BX[i] - BFZ[i] * w, BZ[i] + BFX[i] * w); BWH[i] = Math.max(BERM.h, Math.min(l, r) - BY[i] + 0.5); }
  }
  const breach = Math.max(...BW) + B.wall + B.blend + 4, BNEAR = nearMap(BX, BZ, BN, breach, false), BR2 = breach * breach;
  const corridorB = (i, u, lat) => {
    const i2 = Math.min(BN - 1, i + 1), lerp = (A) => A[i] + (A[i2] - A[i]) * u, y = lerp(BY), w = lerp(BW), wh = lerp(BWH), a = Math.abs(lat);
    return { cy: a <= w ? y : y + wh * sstep(0, B.wall, a - w), alpha: 1 - sstep(w + B.wall, w + B.wall + B.blend, a), on: a <= w };
  };
  /** The branch's nearest point to (x, z): { sb (metres along it), lat, d, i }, or null past its reach. */
  function nearestB(x, z) {
    let best = null;
    for (let i = 0; i < BN - 1; i++) { const d2 = d2Of(BX, BZ, BN, i, x, z); if (!best || d2 < best.d2) best = { i, u: pu, d2 }; }
    if (!best) return null;
    const { i, u } = best; return { i, sb: (i + u) * bds, d: Math.sqrt(best.d2), lat: latOf(BX, BZ, BFX, BFZ, BN, i, u, x, z) };
  }
  /** The branch at metres `sb` along it, as frame() answers for the line; and the place on the line it stands for (the race's). */
  function frameB(sb) {
    const t = Math.max(0, Math.min(BN - 1.001, sb / bds)), i = Math.floor(t), u = t - i, lerp = (A) => A[i] + (A[i + 1] - A[i]) * u;
    return { x: lerp(BX), z: lerp(BZ), y: lerp(BY), fx: BFX[i], fz: BFZ[i], w: lerp(BW), wind: 0, bank: 0, wall: lerp(BWH) };
  }
  const mainOfB = (sb) => (bs0 + (Math.max(0, Math.min(BL, sb)) / BL) * bspan) % L;
  return { id: B.id, def: B, length: BL, ds: bds, N: BN, X: BX, Z: BZ, Y: BY, W: BW, wall: BWH, FX: BFX, FZ: BFZ, from: bs0, to: bs1, span: bspan, nearest: nearestB, frame: frameB, mainOf: mainOfB,
    pull(x, z) { const bl = BNEAR.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL))); if (!bl) return null; let bi = -1, bu = 0, bd = BR2;
      for (let k = 0; k < bl.length; k++) { const i = bl[k], d = d2Of(BX, BZ, BN, i, x, z); if (d < bd) { bd = d; bi = i; bu = pu; } }
      return bi < 0 ? null : corridorB(bi, bu, latOf(BX, BZ, BFX, BFZ, BN, bi, bu, x, z)); } };
  }

  /** What the line pulls the ground toward at local x, z, without the sand: the nearest two legs of the corridor (points of the line more
   *  than 100 m apart along it), each pulling to its own surface by its weight (all of it inside its berm), then the branch's gorge.
   *  { sum, wt } a weighted sum to add to the sand's (weight 1), and `on`: the running surface's height where the point is on one (a
   *  running surface wins over another's berm or wall; two running surfaces: their mean). null where it reaches nothing. */
  function pull(x, z) {
    const list = NEAR.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL)));
    let sum = 0, wt = 0, onY = null, any = false;
    if (list) {
      let ai = -1, au = 0, ad = R2, bi = -1, bu = 0, bd = R2;
      for (let k = 0; k < list.length; k++) { const i = list[k], d = d2Of(X, Z, N, i, x, z); if (d < ad) { ad = d; ai = i; au = pu; } }
      if (ai >= 0) {
        any = true; const as = (ai + au) * ds;
        for (let k = 0; k < list.length; k++) { const i = list[k], d = d2Of(X, Z, N, i, x, z); if (d < bd && apart((i + pu) * ds, as) > 100) { bd = d; bi = i; bu = pu; } }
        const one = (i, u, first) => { if (DECK[i]) return; const c = corridor(i, u, latOf(X, Z, FX, FZ, N, i, u, x, z)); if (first && c.on) onY = c.cy; if (c.alpha <= 0) return; const k = c.alpha >= 0.999 ? 1e6 : c.alpha / (1 - c.alpha); sum += c.cy * k; wt += k; };
        one(ai, au, true); if (bi >= 0) one(bi, bu, false);
      }
    }
    const c = branch?.pull(x, z);
    if (c) {
      any = true;
      if (c.on) return { sum: 0, wt: 0, on: onY == null ? c.cy : (onY + c.cy) / 2 };
      if (onY == null && c.alpha > 0) { const k = c.alpha >= 0.999 ? 1e6 : c.alpha / (1 - c.alpha); sum += c.cy * k; wt += k; }
    }
    return any ? { sum, wt, on: onY } : null;
  }
  /** The ground at local x, z with this track alone on the sand (the park's own heightAt nests every track: park.js). */
  function heightAt(x, z) { const P = pull(x, z); if (!P) return ground(x, z); if (P.on != null) return P.on; return (ground(x, z) + P.sum) / (1 + P.wt); }
  /** The line at s: where it is, which way it runs, its half-width and the wind's angle off it. */
  function frame(s) {
    const t = (((s % L) + L) % L) / ds, i = Math.floor(t) % N, i2 = (i + 1) % N, u = t - Math.floor(t), lerp = (A) => A[i] + (A[i2] - A[i]) * u;
    return { x: lerp(X), z: lerp(Z), y: lerp(Y), fx: FX[i], fz: FZ[i], w: lerp(W), wind: lerp(WIND), bank: lerp(BK) };
  }
  const gates = F.gates.map(([cp, at]) => sOf(cp, at));
  return { id: def.id, name: def.name, def, features: F, decks, length: L, ds, N, X, Z, Y, W, BK, FX, FZ, cpS, sOf, nearest, heightAt, pull, frame, gates, line: sOf(F.start.cp, F.start.at), reach, branch };
}
