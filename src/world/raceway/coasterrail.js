// ---------------------------------------------------------------------------------------
// COASTER RAILS (docs/plans/SKIFF-RACING.md section 10; the owner, 2026-10-14: "loop-de-loops and rollercoaster-like grind rail sections"):
// a grind rail laid in three dimensions from a few points, as a roller coaster's track is: the points joined by a centripetal Catmull-Rom
// (drops, camelback hills, banked turns), and two pieces spliced in where the path asks: a LOOP (a vertical circle in the plane of travel,
// its exit stepped aside so it clears its entry, as a real coaster's loop does) and a HELIX (a spiral round a tower, descending, banked
// in). Each point carries the rail's up (the way the board stands on it: tilted into a bank, toward a loop's middle) and a push (m/s^2 a
// conduit gives along it: a loop is driven, so a board that made it in makes it round). Pure numbers: the game (world/raceway/
// railsrings.js) and the map tool (scripts/raceway/map.mjs) lay the same rail.
//
// Prior art: roller coaster design (Schwarzkopf's and Arrow's loops; a helix as the classic finale; banking a turn so the rider's
// weight stays in the seat), Sonic Adventure 2's City Escape and Sonic Riders' rails, Hot Wheels' loops, SSX Tricky's rails; Yuksel et
// al., centripetal Catmull-Rom (2011).
//
//   coasterPath(def) -> { pts: [[x, y, z]], ups: [[x, y, z]], push: [m/s^2], towers: [{ x, z, top, r }] (a helix's tower) }   def.path: [[x, z, y] | { loop: r, shift?, push? } |
//   { helix: { r, turns, drop, side? } }], in the park's frame (y over the layer's floor), every `STEP` metres
// ---------------------------------------------------------------------------------------

const STEP = 1.5;
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
const sub = (a, b) => a.map((c, i) => c - b[i]), add = (a, b) => a.map((c, i) => c + b[i]), mul = (a, k) => a.map((c) => c * k);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A centripetal Catmull-Rom through 3D points (open: the ends doubled), every STEP metres. */
function spline(P) {
  if (P.length < 2) return P.slice();
  const Q = [P[0], ...P, P[P.length - 1]], out = [];
  for (let i = 1; i < Q.length - 2; i++) {
    const [P0, P1, P2, P3] = [Q[i - 1], Q[i], Q[i + 1], Q[i + 2]], tj = (a, b) => Math.pow(Math.hypot(...sub(b, a)), 0.5) || 1e-3;
    const t0 = 0, t1 = t0 + tj(P0, P1), t2 = t1 + tj(P1, P2), t3 = t2 + tj(P2, P3), k = Math.max(2, Math.ceil(Math.hypot(...sub(P2, P1)) / STEP));
    for (let j = 0; j < k; j++) {
      const t = t1 + (t2 - t1) * (j / k), o = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const A1 = ((t1 - t) * P0[c] + (t - t0) * P1[c]) / (t1 - t0), A2 = ((t2 - t) * P1[c] + (t - t1) * P2[c]) / (t2 - t1), A3 = ((t3 - t) * P2[c] + (t - t2) * P3[c]) / (t3 - t2);
        const B1 = ((t2 - t) * A1 + (t - t0) * A2) / (t2 - t0), B2 = ((t3 - t) * A2 + (t - t1) * A3) / (t3 - t1);
        o[c] = ((t2 - t) * B1 + (t - t1) * B2) / (t2 - t1);
      }
      out.push(o);
    }
  }
  out.push(Q[Q.length - 2].slice());
  return out;
}

/** The rail laid: runs of spline between the loops and helices, each spliced in at the end of the run before it, facing its way. */
export function coasterPath(def) {
  const pts = [], ups = [], push = [], towers = [], BANK = def.bank ?? 0.9; // (how far a turn's curvature tilts the up into it)
  let run = [];
  // a run of spline from the last point laid through the points since (banked by its turns)
  const lay = () => {
    if (run.length < 2) return;
    const S = spline(run), start = pts.length, from = start ? 1 : 0;
    for (let i = from; i < S.length; i++) { pts.push(S[i]); ups.push([0, 1, 0]); push.push(0); }
    // banking: the up tilted toward the inside of each turn, by the turn's sharpness
    for (let i = Math.max(1, start); i < pts.length - 1; i++) {
      const a = norm(sub(pts[i], pts[i - 1])), b = norm(sub(pts[i + 1], pts[i])), turn = a[0] * b[2] - a[2] * b[0];
      const side = norm([-a[2], 0, a[0]]), k = Math.max(-0.6, Math.min(0.6, (turn / STEP) * BANK * 30));
      ups[i] = norm(add([0, 1, 0], mul(side, k))); // (side is the right; a left turn has turn < 0: tilted left, into it)
    }
    run = [pts[pts.length - 1]];
  };
  const last = () => pts[pts.length - 1], dirNow = () => norm(sub(pts[pts.length - 1], pts[pts.length - 2]));
  for (const p of def.path) {
    if (Array.isArray(p)) { run.push([p[0], p[2], p[1]]); continue; } // ([x, z, y] in the data, [x, y, z] laid)
    lay(); if (pts.length < 2) continue;
    const d = dirNow(), fh = norm([d[0], 0, d[2]]), side = norm(cross(fh, [0, 1, 0])), o = last();
    if (p.loop) { // a vertical circle: forward, up, over, down, and out stepped aside by `shift`
      const r = p.loop, sh = p.shift ?? 3, c = add(o, [0, r, 0]), n = Math.ceil((Math.PI * 2 * r) / STEP);
      for (let k = 1; k <= n; k++) {
        const f = (k / n) * Math.PI * 2, q = add(add(c, add(mul(fh, r * Math.sin(f)), [0, -r * Math.cos(f), 0])), mul(side, sh * (k / n)));
        pts.push(q); ups.push(norm(sub(add(c, mul(side, sh * (k / n))), q))); push.push(p.push ?? 16);
      }
    } else if (p.helix) { // a spiral round a tower beside the path, descending `drop` over `turns`, banked in
      const H = p.helix, s = H.side ?? 1, c = add(o, mul(side, H.r * s)); towers.push({ x: c[0], z: c[2], top: o[1] + 4, r: H.r * 0.45 }); const a0 = Math.atan2(o[2] - c[2], o[0] - c[0]), n = Math.ceil((Math.PI * 2 * H.r * H.turns) / STEP);
      for (let k = 1; k <= n; k++) {
        const a = a0 - s * (k / n) * Math.PI * 2 * H.turns, q = [c[0] + Math.cos(a) * H.r, o[1] - H.drop * (k / n), c[2] + Math.sin(a) * H.r];
        pts.push(q); ups.push(norm(add([0, 1, 0], mul(norm(sub([c[0], q[1], c[2]], q)), 0.55)))); push.push(H.push ?? 0);
      }
    }
    run = [last()];
  }
  lay();
  return { pts, ups, push, towers };
}
