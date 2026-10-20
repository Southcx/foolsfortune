// ---------------------------------------------------------------------------------------
// THE SHIP KIT'S PARTS: the fittings every class bolts onto its lofted hull (shipkit/hullkit.js), written into the ship's one static
// mesh: the gold rail along the deck edge (the one nod left to the old kintsugi), an engine pod with its nozzle ring and pylon (returns
// the glow disc the look lights: shipkit/shiplook.js `engines`), a fin cut from a side-view outline (a keel blade, a Delphinus wing, a
// raked stem), a row of lit ports along the side, and the dark slot a mast stows into.
// Prior art: Outlaw Star's rear engine pods, Skies of Arcadia's fins and keel blades, a frigate's gun-port row, a submarine's sail slot;
// the model-kit sprue: a few parts, many ships.
//
//   rail(M, hull, { z0, z1, n, r, col, dy, inset })   pod(M, { x, y, z0, z1, r0, r1, body, band, nozzle, pylon }) -> { at, r }
//   fin(M, { x, t, pts: [[z, y], ...], col, code, edge, edgeCode })   ports(M, hull, { zs, y, w, h, col, code })   slot(M, { x, y, z, w, d })
//   wing(M, { y, t, pts: [[x, z], ...], col, dihedral, edge })   stripe(M, hull, { z0, z1, y, h, col, code })
// ---------------------------------------------------------------------------------------
import { deckAt, deckHalf, sideAt } from './hullkit.js';

/** A rail along both deck edges from z0 to z1 (a gold line on the gunwale). */
export function rail(M, hull, { z0, z1, n = 18, r = 0.025, col = 0xf2c14e, code = 0, dy = 0.03, inset = 0.02 }) {
  for (const s of [1, -1]) for (let i = 0; i < n; i++) {
    const za = z0 + ((z1 - z0) * i) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n;
    const a = [s * (deckHalf(hull, za) - inset), deckAt(hull, za) - (hull.camber ?? 0.04) + dy, za], b = [s * (deckHalf(hull, zb) - inset), deckAt(hull, zb) - (hull.camber ?? 0.04) + dy, zb];
    M.cyl(a, b, r, r, 4, col, code, { caps: false, smooth: false });
  }
}

/** An engine pod from z0 (aft) to z1 (fore) at (x, y): a turned body, two bands, a lit nozzle ring at its aft end, a pylon to `pylon`
 *  ([x, y] on the hull). Returns the glow disc for the look. */
export function pod(M, { x, y, z0, z1, r0, r1, sides = 8, body, band, nozzle = 0xcfe8ff, pylon = null, pylonCol = null, square = false }) {
  if (square) M.box([x, y, (z0 + z1) / 2], [r0 * 2, r0 * 1.7, z1 - z0], body, 0.1, { top: [0.86, 0.94] });
  else M.cyl([x, y, z0], [x, y, z1], r0, r1, sides, body, 0.1, { phase: Math.PI / sides });
  M.cyl([x, y, z1], [x, y, z1 + (z1 - z0) * 0.18], square ? r0 * 0.7 : r1, 0.02, sides, body, 0); // (its nose)
  for (const k of [0.22, 0.6]) { const z = z0 + (z1 - z0) * k, rr = (square ? r0 * 1.04 : r0 + (r1 - r0) * k) * 1.06; M.cyl([x, y, z - 0.05], [x, y, z + 0.05], rr, rr, sides, band, 0, { phase: Math.PI / sides }); }
  const rn = (square ? r0 * 0.78 : r0 * 0.86);
  M.cyl([x, y, z0 + 0.01], [x, y, z0 - 0.08], r0 * 0.98, rn, sides, nozzle, 0.5, { caps: false, phase: Math.PI / sides }); // (the nozzle's lit ring)
  if (pylon) M.box([(x + pylon[0]) / 2, (y + pylon[1]) / 2, (z0 + z1) / 2 + (z1 - z0) * 0.05], [Math.abs(x - pylon[0]) + 0.05, Math.max(0.08, Math.abs(y - pylon[1]) + 0.08), (z1 - z0) * 0.55], pylonCol ?? body, 0, { top: [1, 0.7] });
  return { at: [x, y, z0 - 0.08], r: rn * 0.96 };
}

/** A fin cut from its side-view outline (z, y points, convex or not: fanned from its first), `t` thick across x, at x. Its last edge
 *  (from the final point back to the first) may be lit (`edge`, `edgeCode`): a keel line in the ship's feeling. */
export function fin(M, { x = 0, t = 0.08, pts, col, code = 0.1, edge = null, edgeCode = 0.9 }) {
  const h = t / 2, c = pts.reduce((a, [z, y]) => [a[0] + z / pts.length, a[1] + y / pts.length], [0, 0]), ref = [x, c[1], c[0]];
  for (const s of [1, -1]) for (let i = 1; i < pts.length - 1; i++) M.tri([x + s * h, pts[0][1], pts[0][0]], [x + s * h, pts[i][1], pts[i][0]], [x + s * h, pts[i + 1][1], pts[i + 1][0]], col, code, [x - s * 5, c[1], c[0]]);
  for (let i = 0; i < pts.length; i++) {
    const [za, ya] = pts[i], [zb, yb] = pts[(i + 1) % pts.length], lit = edge != null && i === pts.length - 1;
    M.quad([x + h, ya, za], [x + h, yb, zb], [x - h, yb, zb], [x - h, ya, za], lit ? edge : col, lit ? edgeCode : 0, ref);
  }
}

/** A row of lit ports along both sides at height y (each a little panel standing proud of the hull's side). */
export function ports(M, hull, { zs, y, w = 0.16, h = 0.06, col, code = 0.45, frame = null }) {
  for (const z of zs) for (const s of [1, -1]) {
    const x = s * (sideAt(hull, z, y) + 0.006);
    if (frame != null) M.quad([x, y - h, z - w * 0.7], [x, y - h, z + w * 0.7], [x, y + h * 1.6, z + w * 0.7], [x, y + h * 1.6, z - w * 0.7], frame, 0, [x - s, y, z]);
    const xi = x + s * 0.004;
    M.quad([xi, y - h / 2, z - w / 2], [xi, y - h / 2, z + w / 2], [xi, y + h / 2, z + w / 2], [xi, y + h / 2, z - w / 2], col, code, [xi - s, y, z]);
  }
}

/** The dark slot in the deck a mast stows into (its hatch closes over it: shipkit/rig.js). */
export function slot(M, { x = 0, y, z, w, d, col = 0x0c0f16, lip = 0x3a4150 }) {
  M.quad([x - w / 2, y + 0.006, z - d / 2], [x + w / 2, y + 0.006, z - d / 2], [x + w / 2, y + 0.006, z + d / 2], [x - w / 2, y + 0.006, z + d / 2], col, 0, [x, y - 1, z]);
  for (const s of [1, -1]) M.box([x, y + 0.012, z + s * (d / 2 + 0.02)], [w + 0.08, 0.02, 0.04], lip, 0);
}

/** A wing cut from its plan outline ([x, z] points, x outboard: fanned from its first), `t` thick, at height y, on both sides; its
 *  tips raised by `dihedral` (m a metre out). A Delphinus fin, a sponson's plate. */
export function wing(M, { y, t = 0.05, pts, col, code = 0.1, dihedral = 0.12, edge = null, edgeCode = 0.5 }) {
  for (const s of [1, -1]) {
    const P = pts.map(([x, z]) => [s * x, y + Math.abs(x - pts[0][0]) * dihedral, z]), c = P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length, a[2] + p[2] / P.length], [0, 0, 0]);
    for (const h of [t / 2, -t / 2]) for (let i = 1; i < P.length - 1; i++) M.tri([P[0][0], P[0][1] + h, P[0][2]], [P[i][0], P[i][1] + h, P[i][2]], [P[i + 1][0], P[i + 1][1] + h, P[i + 1][2]], col, code, [c[0], c[1] - Math.sign(h) * 5, c[2]]);
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], lit = edge != null && i === 1; M.quad([a[0], a[1] + t / 2, a[2]], [b[0], b[1] + t / 2, b[2]], [b[0], b[1] - t / 2, b[2]], [a[0], a[1] - t / 2, a[2]], lit ? edge : col, lit ? edgeCode : 0, c); }
  }
}

/** A painted stripe along both sides at height y, `h` tall, from z0 to z1 (a boot-top, a warning band): little panels on the side. */
export function stripe(M, hull, { z0, z1, y, h = 0.06, n = 24, col, code = 0 }) {
  for (const s of [1, -1]) for (let i = 0; i < n; i++) {
    const za = z0 + ((z1 - z0) * i) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n;
    const xa = s * (sideAt(hull, za, y) + 0.008), xb = s * (sideAt(hull, zb, y) + 0.008);
    if (!xa || !xb) continue;
    M.quad([xa, y - h / 2, za], [xb, y - h / 2, zb], [xb, y + h / 2, zb], [xa, y + h / 2, za], col, code, [0, y, (za + zb) / 2]);
  }
}
