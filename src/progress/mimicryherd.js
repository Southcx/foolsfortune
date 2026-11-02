// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES' HERD (docs/plans/MIMICRY.md section 7, GAPS G141): Possession's puzzle, a creature family rather than matter. A
// flock of clapperjars stands on the patch and a pen is drawn on the ground; the System walks them in with Herd, then puts them back,
// and you walk them in again. The score is the share of the flock inside the pen's polygon, a body just outside its line counting part.
// What it teaches without saying so (DESIGN.md 22): Herd takes the nearest few within its reach (the toolkit's four), so a flock in two
// knots asks for two drags, and one drag from between them takes only four of six.
//
// Pure: positions only (patch-local metres, x east, z south, the patch's middle at 0, 0), so the check (scripts/mimicry.mjs) plays the
// System's drags headless, and the runtime (world/mimicry/mimicry.js, Petra's) hands it the bodies' places as they stand.
//
// Prior art: Pikmin's whistle and Lemmings' exit (a group walked to a spot, judged by how many arrive); sheepdog trials' pen (a drawn
// enclosure the whole flock must be inside, a straggler costing points); the ray-casting point-in-polygon test (Shimrat, 1962).
//
//   HERD = { r, n, spread, soft }   flockOf(P) -> [[x, z]]   penOf(P) -> [[x, z]] (the pen's corners, in order)
//   herdSpots(bodies, step, tool?) -> [[x, z]] (the bodies after one drag: the nearest `n` within `r` of `from`, walked to `to`)
//   layHerd(bodies, steps, tool?) -> [[x, z]]   inPen(p, pen) -> bool   edgeDist(p, pen) -> m   herdMatchOf(bodies, pen) -> 0..1
// ---------------------------------------------------------------------------------------

/** `r`, `n`: Herd's reach and how many it takes at the toolkit's numbers (progress/godpowers.js RAMP.herd at level open: 6 m, 4), the
 *  same as MIMIC_TOOL.herd. `spread`: metres between the spots a herd sets them down at (godhand/powers/will.js: `sqrt(i) * 0.9`).
 *  `soft`: metres outside the pen's line over which a body still counts part (a clapperjar's shoulder over the line is not a miss: the
 *  layers' softening, a stroke half a metre off, given to bodies). */
export const HERD = { r: 6, n: 4, spread: 0.9, soft: 0.75 };

/** A puzzle's flock, body by body: each knot `{ at, n, spread }` laid on a sunflower (Vogel's spiral, so the bodies are evenly spaced
 *  with no chance drawn: the same flock for everyone). */
export function flockOf(P) {
  const out = [], golden = Math.PI * (3 - Math.sqrt(5));
  for (const g of P?.flock || []) for (let i = 0; i < g.n; i++) {
    const rr = (g.spread ?? 1.2) * Math.sqrt((i + 0.5) / g.n), a = i * golden;
    out.push([g.at[0] + Math.cos(a) * rr, g.at[1] + Math.sin(a) * rr]);
  }
  return out;
}
/** The pen as a polygon: its corners `pen.points`, or a regular one of `sides` at `at` with corner radius `r` (a hexagon drawn on the
 *  ground reads as a pen and holds a round flock). */
export function penOf(P) {
  const pen = P?.pen; if (!pen) return [];
  if (pen.points) return pen.points.map((p) => [p[0], p[1]]);
  const n = pen.sides || 6, out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (pen.turn || 0); out.push([pen.at[0] + Math.cos(a) * pen.r, pen.at[1] + Math.sin(a) * pen.r]); }
  return out;
}

/** One Herd drag, as the hand's (godhand/powers/will.js WILL.herd): the nearest `n` bodies within `r` of `from`, each set down round
 *  `to` on the spiral (the first at `to`, then `spread` x sqrt(i) out, a turn of the circle shared among them). Returns a copy. */
export function herdSpots(bodies, step, tool = HERD) {
  const out = bodies.map((p) => [p[0], p[1]]), f = step.from, t = step.to;
  const near = out.map((p, i) => ({ i, d: Math.hypot(p[0] - f[0], p[1] - f[1]) })).filter((o) => o.d <= tool.r).sort((a, b) => a.d - b.d).slice(0, Math.round(tool.n));
  near.forEach((o, i) => { const a = (i / Math.max(1, near.length)) * Math.PI * 2, rr = Math.sqrt(i) * HERD.spread; out[o.i] = [t[0] + Math.cos(a) * rr, t[1] + Math.sin(a) * rr]; });
  return out;
}
export function layHerd(bodies, steps, tool = HERD) { let b = bodies; for (const s of steps) if (s.op === 'herd') b = herdSpots(b, s, tool); return b; }

/** Inside the polygon (ray casting: a ray east from the point crosses its edges an odd number of times). */
export function inPen(p, pen) {
  let inside = false;
  for (let i = 0, j = pen.length - 1; i < pen.length; j = i++) {
    const [xi, zi] = pen[i], [xj, zj] = pen[j];
    if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
/** The distance from a point to the pen's line (its nearest edge). */
export function edgeDist(p, pen) {
  let best = Infinity;
  for (let i = 0, j = pen.length - 1; i < pen.length; j = i++) {
    const [ax, az] = pen[j], [bx, bz] = pen[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / L2));
    best = Math.min(best, Math.hypot(p[0] - (ax + dx * t), p[1] - (az + dz * t)));
  }
  return best;
}
/** How much of the flock is penned, 0 .. 1: a body inside counts 1, one outside counts 1 - d / soft within `soft` of the line, then 0.
 *  Six bodies: five in scores 0.83 (solved, MIMIC.solve 0.68), all six 1 (clean, MIMIC.clean 0.85), four in 0.67 (not solved). */
export function herdMatchOf(bodies, pen) {
  if (!bodies?.length || pen.length < 3) return 0;
  let got = 0;
  for (const p of bodies) got += inPen(p, pen) ? 1 : Math.max(0, 1 - edgeDist(p, pen) / HERD.soft);
  return got / bodies.length;
}
