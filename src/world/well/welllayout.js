// ---------------------------------------------------------------------------------------
// THE WELL'S PLAN: one floor of a Well as data, from a seed (pure: no three.js, so a Node script reads it as the game does). The grid is
// Spelunky's (Derek Yu, 2008): one guaranteed PATH from a room on the top row, sideways and down, until it drops out of the bottom row;
// rooms off it hang from it, and a loop is sometimes cut. Since the Dunemaw was made big (docs/plans/DUNEMAW.md, Calissa's numbers):
//   - 5 by 5 cells of 18 m (14 until R45: the owner found it cramped); HALLS of 2 by 2 cells (1 to 3 a floor, open to the dark overhead);
//   - TWO TIERS 6 m apart: the path crosses between them at least twice through SLOPE cells (a ramp of sand from one tier to the other,
//     straight through: 6 m over 18 m, 20 degrees at most with its ends rounded (wellsand.js), walked either way);
//   - the TWIST: the floor is swirled about its centre, each point turned by an angle that grows with its distance out, up to
//     4 x twist at the corners (0, 7, 14 a floor: the verse is square, the wall is bent). A swirl is continuous, so doorways still meet
//     and no room crosses another (turning each cell's frame rigidly about the centre, the spec's first idea, made rooms on floor 3
//     overlap by 10 m: Petra measured it);
//   - SANDFALLS on side links (never the path): 2 to 4 a floor, each with its own phase.
//
// Prior art: Spelunky's room grid, Persona 3's Tartarus (floors from a seed), Mystery Dungeon's templates; the swirl is the "twirl" filter
// of every paint program, applied to a floor plan (Psychonauts' bent streets, Antichamber's rooms that do not sit square).
//
//   layoutFloor(seed, floor) -> { floor, twist, cells: [{ c, r, role, tpl, doors: Set, level, slope?, hall? }], halls: [{ c, r }],
//                                 start, exit, path: [cell...], links: [{ a, b, side, path, sandfall?: { phase } }] }
//   swirl(twist, { back? }) -> (x, z) => { x, z, a }   (grid metres from the floor's centre -> swirled, and the angle there; back: undone)
//   GRID, CELL, WALL_H, TIER, DOOR, DOOR_H, TWIST
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';

export const GRID = 5, CELL = 18, WALL_H = 7, TIER = 6, DOOR = 5, DOOR_H = 5; // (DOOR_H: the hole in the wall, the arch's crown: wellkit.js)
/** Degrees a step of the grid is swirled, by floor (1, 2, 3): the corners turn four steps' worth. */
export const TWIST = [0, 7, 14];
export const SIDES = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
export const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
const key = (c, r) => `${c},${r}`;
const HALF = (GRID * CELL) / 2, RMAX = HALF * Math.SQRT2;

/** The floor's swirl: grid metres from its centre to where they stand, and the angle turned there (radians). `back: true` undoes it
 *  (exactly: the swirl turns a point about the centre and never moves it in or out, so its distance gives the angle back). */
export function swirl(twist, { back = false } = {}) {
  const amax = (twist * 4 * Math.PI) / 180, k = back ? -1 : 1;
  return (x, z) => {
    if (!amax) return { x, z, a: 0 };
    const a = amax * Math.min(1, Math.hypot(x, z) / RMAX), c = Math.cos(k * a), s = Math.sin(k * a);
    return { x: x * c - z * s, z: x * s + z * c, a };
  };
}

function attempt(R, floor) {
  const cells = new Map(), links = [];
  const add = (c, r, role = 'side') => { const k = key(c, r); if (!cells.has(k)) cells.set(k, { c, r, role, tpl: 'plain', doors: new Set(), level: 0 }); return cells.get(k); };
  const sideOf = (a, b) => Object.keys(SIDES).find((s) => a.c + SIDES[s][0] === b.c && a.r + SIDES[s][1] === b.r);
  const linked = (a, b) => a.doors.has(sideOf(a, b));
  const link = (a, b, path = false) => { const side = sideOf(a, b); a.doors.add(side); b.doors.add(OPP[side]); links.push({ a, b, side, path }); };
  // ---- the path: sideways along a row, down now and then (or at a wall), until it drops out of the bottom row
  let c = R.int(GRID), r = 0, dir = R.chance(0.5) ? 1 : -1;
  const path = [add(c, r, 'path')];
  for (let guard = 0; guard < 4 * GRID * GRID; guard++) {
    const wall = c + dir < 0 || c + dir >= GRID || cells.has(key(c + dir, r));
    if (wall || R.chance(0.3)) {
      if (r === GRID - 1) break;
      r++; dir = R.chance(0.5) ? 1 : -1;
    } else c += dir;
    const next = add(c, r, 'path'); link(path[path.length - 1], next, true); path.push(next);
  }
  // ---- the tiers: two slope cells on the path, straight through (in and out on opposite sides), at least one cell between them
  const through = [];
  for (let i = 1; i < path.length - 1; i++) {
    const inS = sideOf(path[i], path[i - 1]), outS = sideOf(path[i], path[i + 1]);
    if (OPP[inS] === outS) through.push(i);
  }
  if (through.length < 2) return null;
  let i1 = -1, i2 = -1;
  for (let k = 0; k < 12 && i2 < 0; k++) { const a = R.pick(through), b = R.pick(through); if (Math.abs(a - b) >= 2) { i1 = Math.min(a, b); i2 = Math.max(a, b); } }
  if (i2 < 0) return null;
  let level = 0;
  path.forEach((cell, i) => {
    if (i === i1 || i === i2) {
      const to = level === 0 ? -TIER : 0;
      cell.slope = { from: sideOf(cell, path[i - 1]), to: sideOf(cell, path[i + 1]), fromLevel: level, toLevel: to };
      cell.level = Math.min(level, to); level = to;
    } else cell.level = level;
  });
  const levelAt = (cell, side) => (cell.slope ? (side === cell.slope.from ? cell.slope.fromLevel : cell.slope.toLevel) : cell.level);
  // ---- side rooms off the path (twice over, so one can hang from another): never off a slope, at their neighbour's level
  for (let pass = 0; pass < 2; pass++) {
    for (let cc = 0; cc < GRID; cc++) for (let rr = 0; rr < GRID; rr++) {
      if (cells.has(key(cc, rr)) || !R.chance(0.34)) continue;
      const nbr = Object.values(SIDES).map(([dx, dz]) => cells.get(key(cc + dx, rr + dz))).filter((n) => n && !n.slope);
      if (!nbr.length) continue;
      const from = R.pick(nbr), cell = add(cc, rr); cell.level = from.level; link(from, cell);
    }
  }
  // ---- a loop now and then between two neighbours on the same tier
  if (R.chance(0.6)) {
    const list = [...cells.values()].filter((k) => !k.slope);
    for (let i = 0; i < 10; i++) {
      const a = R.pick(list), s = R.pick(Object.keys(SIDES)), b = cells.get(key(a.c + SIDES[s][0], a.r + SIDES[s][1]));
      if (b && !b.slope && b.level === a.level && !linked(a, b)) { link(a, b); break; }
    }
  }
  // ---- the halls: 2 by 2 blocks on one tier, no slope, no pool in them; a missing cell is added to complete one
  const start = path[0], exit = path[path.length - 1], halls = [];
  const want = 1 + R.int(3), blocks = [];
  for (let c0 = 0; c0 < GRID - 1; c0++) for (let r0 = 0; r0 < GRID - 1; r0++) blocks.push([c0, r0]);
  for (let i = blocks.length - 1; i > 0; i--) { const j = R.int(i + 1); [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; }
  const taken = new Set();
  for (const [c0, r0] of blocks) {
    if (halls.length >= want) break;
    const four = [[c0, r0], [c0 + 1, r0], [c0, r0 + 1], [c0 + 1, r0 + 1]], here = four.map(([x, z]) => cells.get(key(x, z)));
    const have = here.filter(Boolean);
    if (have.length < 2 || four.some(([x, z]) => taken.has(key(x, z)))) continue;
    const lv = have[0].level;
    if (have.some((k) => k.slope || k.level !== lv || k === start || k === exit || k.hall != null)) continue;
    const id = halls.length; halls.push({ c: c0, r: r0, level: lv });
    const members = four.map(([x, z]) => { const k = cells.get(key(x, z)) || add(x, z); k.level = lv; k.hall = id; taken.add(key(x, z)); return k; });
    for (const [a, b] of [[0, 1], [0, 2], [1, 3], [2, 3]]) if (!linked(members[a], members[b])) link(members[a], members[b]);
    // (an added cell must join the floor: the block is joined inside, and the block to the floor through the cells it had)
  }
  // ---- which side links fall (what stands in each room is chosen by its design: prefabs.js, wellkit.js)
  const sides = links.filter((l) => !l.path && !(l.a.hall != null && l.a.hall === l.b.hall)); // (never the path, never inside a hall)
  const rooms = cells.size - 3 * halls.length; // (a hall is one room of four cells)
  if (!halls.length || sides.length < 2 || rooms < 10 || rooms > 20) return null; // (a hall at least, two sandfalls, 10 to 20 rooms: drawn again)
  const falls = Math.min(sides.length, 2 + R.int(3));
  for (let i = sides.length - 1; i > 0; i--) { const j = R.int(i + 1); [sides[i], sides[j]] = [sides[j], sides[i]]; }
  sides.slice(0, falls).forEach((l) => { l.sandfall = { phase: R() }; });
  start.role = 'start'; exit.role = 'exit';
  return { floor, twist: TWIST[floor - 1] ?? TWIST[TWIST.length - 1], cells: [...cells.values()], halls, start, exit, path, links, levelAt, seed: 0 };
}

/** The floor's plan: the same seed, the same floor. A plan whose path has no two straight cells for the slopes is drawn again. */
export function layoutFloor(seed, floor) {
  for (let n = 0; n < 40; n++) {
    const R = seeded((seed ^ Math.imul(floor + 1, 0x9e3779b1) ^ Math.imul(n, 0x85ebca6b)) >>> 0);
    const L = attempt(R, floor);
    if (L) { L.seed = seed >>> 0; return L; }
  }
  throw new Error(`layoutFloor: no plan for seed ${seed}, floor ${floor}`);
}
