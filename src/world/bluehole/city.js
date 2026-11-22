// ---------------------------------------------------------------------------------------
// THE SUNKEN CITY (plain name; South, 2026-11-22: "expand the cenote to be more mazelike and like your concepting of a sunken city"):
// the blue hole's bell floored over at CITY.y by a stone plaza, and on it a drowned town laid out as a maze: a square grid of blocks cut
// by a recursive backtracker (every street reaches every other by one way only, so it is a maze and never a dead plaza), its walls stood
// as ruined houses (a wall's top broken down by chance, a doorway's arch left standing), a column at every crossing, the cells outside
// the bell's round wall dropped; at its heart a stepped temple with a lit Lachrymite idol on its top. Seeded once, the same for everyone.
// The plan is data; the room collides it (world/bluehole/bluehole.js) and the look draws it (vfx/bluehole/city.js).
//
// Prior art: Deep Dive Dubai's sunken city (South's reference: a drowned town at the pool's floor), Thonis-Heracleion's harbour streets,
// Abzu's ruins, the recursive backtracker (Jamis Buck, "Mazes for Programmers": long winding corridors, few branches).
//
//   CITY (where and how big)   cityPlan() -> { walls: [{ x, z, w, d, h, y, arch }], columns: [{ x, z, h }], streets: [{ x, z }], temple: [{ x, z, w, d, h, y }], idol: { x, y, z } }
// ---------------------------------------------------------------------------------------
import { wallAt } from './shaft.js';

/** The plaza's height (local m, the water at 0), the grid (n cells a side, `cell` m each), the walls' height and thickness, the seed. */
export const CITY = { y: -48, n: 10, cell: 3.6, wall: 3.6, thick: 0.55, seed: 20261122, inset: 1.2, plaza: 21 };

let plan = null;
export function cityPlan() {
  if (plan) return plan;
  const C = CITY, n = C.n, h0 = ((n - 1) / 2) * C.cell;
  let s = C.seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const at = (i) => i * C.cell - h0;
  // which cells stand inside the bell's wall at the plaza's height (with room to walk past the walls)
  const inside = (i, j) => { const x = at(i), z = at(j), th = Math.atan2(z, x); return Math.hypot(x, z) + C.cell * 0.75 < wallAt(th, C.y + 2) - C.inset; };
  const open = []; for (let i = 0; i < n; i++) { open.push([]); for (let j = 0; j < n; j++) open[i].push(inside(i, j)); }
  // the temple's 2 x 2 block at the heart, taken out of the maze and walked round
  const m0 = n / 2 - 1, temple = new Set([`${m0},${m0}`, `${m0 + 1},${m0}`, `${m0},${m0 + 1}`, `${m0 + 1},${m0 + 1}`]);
  // the backtracker: passages[i][j] = set of directions open from that cell
  const pass = new Map(), key = (i, j) => `${i},${j}`, D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const usable = (i, j) => i >= 0 && j >= 0 && i < n && j < n && open[i][j];
  let start = null;
  for (let i = 0; i < n && !start; i++) for (let j = 0; j < n && !start; j++) if (usable(i, j) && !temple.has(key(i, j))) start = [i, j];
  const seen = new Set([key(...start)]), stack = [start];
  const link = (a, b) => { const ka = key(...a), kb = key(...b); (pass.get(ka) || pass.set(ka, new Set()).get(ka)).add(kb); (pass.get(kb) || pass.set(kb, new Set()).get(kb)).add(ka); };
  while (stack.length) {
    const [i, j] = stack[stack.length - 1], next = D.map(([dx, dz]) => [i + dx, j + dz]).filter(([a, b]) => usable(a, b) && !seen.has(key(a, b)) && !temple.has(key(a, b)));
    if (!next.length) { stack.pop(); continue; }
    const nb = next[Math.floor(rnd() * next.length)]; link([i, j], nb); seen.add(key(...nb)); stack.push(nb);
  }
  // a few extra openings so the maze has loops (a ruin, walls fallen through: about one in eight)
  for (const k of seen) { const [i, j] = k.split(',').map(Number); if (rnd() < 0.12) { const [dx, dz] = D[Math.floor(rnd() * 4)]; if (seen.has(key(i + dx, j + dz))) link([i, j], [i + dx, j + dz]); } }
  // every cell's temple-facing sides open, so the temple is reached
  for (const t of temple) { const [i, j] = t.split(',').map(Number); for (const [dx, dz] of D) if (seen.has(key(i + dx, j + dz))) link([i, j], [i + dx, j + dz]); }
  // the walls: on each edge between two cells where no passage runs, and on the edge of a used cell facing nothing
  const walls = [], half = C.cell / 2, used = (i, j) => seen.has(key(i, j)) || temple.has(key(i, j));
  const wall = (x, z, alongX) => {
    const broke = rnd(), h = C.wall * (broke < 0.25 ? 0.35 + rnd() * 0.3 : 0.85 + rnd() * 0.15);
    walls.push({ x, z, w: alongX ? C.cell + C.thick : C.thick, d: alongX ? C.thick : C.cell + C.thick, h, y: C.y, arch: broke > 0.85 });
  };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!used(i, j)) continue;
    const x = at(i), z = at(j), P = pass.get(key(i, j)) || new Set();
    // east and south edges (each shared edge once); west and north only at the city's edge
    if (!(used(i + 1, j) && (P.has(key(i + 1, j)) || (temple.has(key(i, j)) && temple.has(key(i + 1, j)))))) wall(x + half, z, false);
    if (!(used(i, j + 1) && (P.has(key(i, j + 1)) || (temple.has(key(i, j)) && temple.has(key(i, j + 1)))))) wall(x, z + half, true);
    if (!used(i - 1, j)) wall(x - half, z, false);
    if (!used(i, j - 1)) wall(x, z - half, true);
  }
  // take out the walls inside the temple's block (it is one hall)
  const tx = (at(m0) + at(m0 + 1)) / 2, tz = tx;
  for (let k = walls.length - 1; k >= 0; k--) if (Math.abs(walls[k].x - tx) < C.cell * 0.9 && Math.abs(walls[k].z - tz) < C.cell * 0.9) walls.splice(k, 1);
  // a column at every crossing that a wall reaches
  const columns = [], cs = new Set();
  for (const w of walls) for (const s2 of [-1, 1]) {
    const cx = w.w > w.d ? w.x + s2 * C.cell / 2 : w.x, cz = w.w > w.d ? w.z : w.z + s2 * C.cell / 2, k = `${Math.round(cx * 10)},${Math.round(cz * 10)}`;
    if (!cs.has(k)) { cs.add(k); columns.push({ x: cx, z: cz, h: C.wall * (0.6 + rnd() * 0.65) }); }
  }
  // the temple: three steps up from the plaza, the idol on top
  const tw = C.cell * 2 - 0.8, templeSteps = [0, 1, 2].map((k) => ({ x: tx, z: tz, w: tw - k * 1.8, d: tw - k * 1.8, h: 1.1, y: C.y + k * 1.1 }));
  const streets = []; for (const k of seen) { const [i, j] = k.split(',').map(Number); streets.push({ x: at(i), z: at(j) }); }
  plan = { walls, columns, streets, temple: templeSteps, idol: { x: tx, y: C.y + 3.3 + 0.9, z: tz } };
  return plan;
}
