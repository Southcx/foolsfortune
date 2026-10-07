// ---------------------------------------------------------------------------------------
// THE DUNEMAW'S ROOMS: designed rooms (prefabs) that chain. Each is drawn once, in its own frame, for one SHAPE of doorways (a dead end, a
// way through, a corner, a T, a crossing) and turned to fit the cell it is put in, so a dozen designs fill any floor the plan draws. They
// chain because every one keeps the same SOCKET: a LANE from each doorway to the room's middle (nothing within 2.2 m of its line;
// wellsand.js lays it flat) and the middle itself (2.5 m round) are clear, so whatever stands in one room, the way from any doorway to
// any other is a walk, and any design can stand next to any other. Pieces off the lanes may be climbed (a step under 0.4 m is walked, a ledge from
// 0.45 to 1.9 m is mantled: core/config.js), and every dead end holds something (a dais, a find): a dead end without a reward is a
// tax on the player's time.
//
// The floor is paced, not dealt: along the guaranteed path the rooms alternate a way through (a processional, the narrows), a place to
// fight (a cloister, a crossing, a hypostyle hall) and a place to breathe (a gallery up a mezzanine, a shrine), never the same design
// twice running; the room before the way down is a PYLON gate, two towers that say "the end is through here" before it is seen.
//
// Prior art: Spelunky's room templates by their exits (Derek Yu, "Spelunky", Boss Fight Books 2016: a room is chosen to fit the openings
// the path needs); Dead Cells' hand-built rooms chained on a concept graph (Motion Twin, Sébastien Bénard's 2017 write-up: designed
// rooms, procedural order); the tension and release of Hades' chambers and of Zelda's dungeon rooms; and the architecture the kit is
// drawn from: the processional axis and the pylon gate of an Egyptian temple, the hypostyle hall (Karnak), the cloister, the
// amphitheatre's tiers, the shrine at the end of a nave.
//
//   PREFABS                                  id -> { shapes | hall, beat, pieces, flat?, spots? }  (a room's frame: x east, z south,
//                                            metres from its middle; the frame's doorways: s for a dead end, s+n through, s+e a
//                                            corner, s+e+w a T, all four a crossing)
//   shapeOf(doors) -> { shape, turn }        a cell's doorways as a shape and the quarter turns from its frame
//   chooseRooms(layout, R)                   gives each cell its `tpl` (a prefab id) and `turn`, paced along the path
//   roomPieces(cell, doors) -> { pieces, flat, spots }   the cell's pieces turned into the plan's frame (a hall's from its own doorways)
//   checkPrefab(id) -> [problems]            every piece off the lanes and the middle, in every shape it is drawn for (the test's)
//
//   a piece: { kind: 'pillar'|'block'|'step', x, z, w, d, h }  (a box standing on the room's floor; its foot in the sand)
//   flat: [{ x, z, r }]  where the sand must lie low (a dais, a stair foot)     spots: [{ x, z, kind: 'lair'|'find'|'perch' }]
// ---------------------------------------------------------------------------------------
import { CELL } from './welllayout.js';

const H = CELL / 2;                    // (9 m: a room's half, wall to middle)
const LANE = 2.2, MIDDLE = 2.5; // (metres: a piece keeps this far from a lane's line (the lane is 1.6 m flat to a side), and from the middle)
export const TALL = 99;                 // (a piece to the ceiling: cut to the room's height when built)

// ---- the designs, each in its frame -------------------------------------------------------
const P = (x, z, w = 1.2, h = TALL) => ({ kind: 'pillar', x, z, w, d: w, h });
const B = (x, z, w, d, h) => ({ kind: 'block', x, z, w, d, h });
const S = (x, z, w, d, h) => ({ kind: 'step', x, z, w, d, h });
const mirrorX = (list) => list.flatMap((p) => (Math.abs(p.x) < 0.01 ? [p] : [p, { ...p, x: -p.x }]));

export const PREFABS = {
  // the way through: the processional, a nave of three pillars a side, the lane its aisle
  processional: { shapes: ['through'], beat: 'through', pieces: mirrorX([P(3.8, -5), P(3.8, 0), P(3.8, 5)]),
    spots: [{ x: 6.5, z: 0, kind: 'lair' }] },
  // the narrows: two low walls along the lane, a mantle high, with ground to ambush from behind them
  narrows: { shapes: ['through'], beat: 'through', pieces: mirrorX([B(3.6, 0, 0.8, 10, 1.2)]),
    spots: [{ x: 6, z: -3, kind: 'lair' }, { x: -6, z: 3, kind: 'perch' }] },
  // stepping stones: blocks rising across the room, one mantle each, to a perch by the far wall
  stones: { shapes: ['through', 'corner', 'dead'], beat: 'through', pieces: [S(-4.5, 4.5, 2, 2, 0.5), B(-5.5, 1, 2, 2, 1.1), B(-6, -3, 2.2, 2.2, 1.8), B(-5, -6.8, 2.4, 2.4, 2.6)],
    spots: [{ x: -5, z: -6.8, kind: 'perch' }] },
  // the cloister: a pillar in each quarter and a bench along two walls; ground to circle a foe on
  cloister: { shapes: ['tee', 'cross', 'corner'], beat: 'fight', pieces: [P(4.5, 4.5, 1.3), P(-4.5, 4.5, 1.3), P(4.5, -4.5, 1.3), P(-4.5, -4.5, 1.3), B(-7.6, -6.5, 1.2, 4, 0.5), B(6.5, -7.6, 4, 1.2, 0.5)],
    spots: [{ x: -6, z: -6, kind: 'lair' }] },
  // the crossing: four corner blocks, a mantle high, round an open square: the lanes are its streets
  crossing: { shapes: ['cross', 'tee'], beat: 'fight', pieces: [B(5.6, 5.6, 4.2, 4.2, 1.4), B(-5.6, 5.6, 4.2, 4.2, 1.4), B(5.6, -5.6, 4.2, 4.2, 1.4), B(-5.6, -5.6, 4.2, 4.2, 1.4)],
    spots: [{ x: 5.6, z: -5.6, kind: 'perch' }, { x: -5.6, z: 5.6, kind: 'lair' }] },
  // the gallery: a mezzanine along the back wall, reached by a step and a mantle, looking down on the room
  gallery: { shapes: ['dead', 'corner'], beat: 'breathe', pieces: [B(-2.5, -6.75, 11, 3.5, 2.4), S(-6.5, -3.9, 2.4, 2.2, 1.2)],
    flat: [{ x: -6.5, z: -3.9, r: 2 }], spots: [{ x: -2.5, z: -6.8, kind: 'perch' }, { x: 2, z: -6.8, kind: 'find' }] },
  // the shrine: a dais at the end of a short nave, a plinth on it, two pillars before it: what a dead end keeps
  shrine: { shapes: ['dead'], beat: 'breathe', pieces: [S(0, -5.5, 5, 4, 0.35), B(0, -6.3, 1.4, 1.4, 1.3), P(3.6, -2.8, 1), P(-3.6, -2.8, 1)],
    flat: [{ x: 0, z: -5.5, r: 3.4 }], spots: [{ x: 0, z: -4.4, kind: 'find' }] },
  // the pylon gate: two towers either side of the lane, before the way down
  pylon: { shapes: ['through'], beat: 'gate', pieces: mirrorX([B(4.2, -1, 3.2, 4.4, TALL), B(6.6, 4.5, 1.6, 1.6, 2.2)]),
    spots: [{ x: 6.6, z: 4.5, kind: 'perch' }] },
  // the start and the end: bare round their pools, a buttress at each corner
  vestibule: { shapes: ['dead', 'through', 'corner', 'tee', 'cross'], beat: 'rest', pieces: [P(7.6, 7.6, 1.6), P(-7.6, 7.6, 1.6), P(7.6, -7.6, 1.6), P(-7.6, -7.6, 1.6)] },
  // ---- halls (2 by 2 cells, 36 m), in the hall's own frame. A hall's doorways can fall at eight places (two a side, 9 m from its middle
  // line), and their lanes radiate to its middle: the pieces stand between the lanes, on the diagonals and the axes, so few are lost
  // (a piece in a lane where a hall does have a doorway is left out)
  // the hypostyle (Karnak): two rings of tall pillars, one on the axes and one on the diagonals, a forest to fight in
  hypostyle: { hall: true, beat: 'fight', pieces: [[0, 10], [10, 0], [0, -10], [-10, 0], [7.5, 7.5], [-7.5, 7.5], [7.5, -7.5], [-7.5, -7.5],
    [0, 16], [16, 0], [0, -16], [-16, 0], [14, 14], [-14, 14], [14, -14], [-14, -14]].map(([x, z]) => P(x, z, 1.6)),
    spots: [{ x: 11, z: 11, kind: 'lair' }, { x: -11, z: -11, kind: 'lair' }] },
  // the amphitheatre: a stand of two tiers on each axis and in each corner, round a low stage in the middle (walked onto)
  amphitheatre: { hall: true, beat: 'fight', pieces: [
    ...[[1, 0], [-1, 0], [0, 1], [0, -1]].flatMap(([ax, az]) => [B(ax * 14.9, az * 14.9, ax ? 5 : 6, ax ? 6 : 5, 0.6), B(ax * 16.2, az * 16.2, ax ? 2.4 : 6, ax ? 6 : 2.4, 1.2)]),
    ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].flatMap(([ax, az]) => [B(ax * 15, az * 15, 5, 5, 0.6), B(ax * 16.2, az * 16.2, 2.6, 2.6, 1.2)]),
    S(0, 0, 6, 6, 0.3)],
    flat: [{ x: 0, z: 0, r: 4.5 }], spots: [{ x: 16.2, z: 0, kind: 'perch' }, { x: -15, z: -15, kind: 'lair' }] },
  // the ruin: pillars broken to stumps on the diagonals, two fallen across the axes, a find under the tallest
  ruin: { hall: true, beat: 'breathe', pieces: [P(-7.5, -7.5, 1.6, 4.5), P(7.5, -7.5, 1.6), P(-7.5, 7.5, 1.6, 1.3), P(7.5, 7.5, 1.6, 2.4), P(14, -14, 1.6, 3),
    B(0, 13, 7, 1.4, 1.1), B(13, 0, 1.4, 7, 1.1), B(-14, 14, 2.4, 2.4, 0.5)],
    spots: [{ x: -9, z: -9, kind: 'find' }, { x: 7.5, z: 7.5, kind: 'perch' }] },
};

// ---- shapes and turns ----------------------------------------------------------------------
const ORDER = ['s', 'w', 'n', 'e'];                 // (a quarter turn clockwise seen from above takes each to the next)
const turnSide = (s, k) => ORDER[(ORDER.indexOf(s) + k) % 4];
const FRAME = { dead: ['s'], through: ['s', 'n'], corner: ['s', 'e'], tee: ['s', 'e', 'w'], cross: ['s', 'e', 'w', 'n'] };
const same = (a, b) => a.length === b.length && a.every((s) => b.includes(s));

/** A cell's doorways as a shape, and how many quarter turns take its frame's doorways onto them. */
export function shapeOf(doors) {
  const list = [...doors];
  for (const [shape, frame] of Object.entries(FRAME)) for (let k = 0; k < 4; k++) if (same(frame.map((s) => turnSide(s, k)), list)) return { shape, turn: k };
  return { shape: 'cross', turn: 0 };
}
/** A point of the frame turned k quarters (s -> w -> n -> e: x east, z south). */
const turnXZ = (x, z, k) => { for (let i = 0; i < k; i++) [x, z] = [-z, x]; return [x, z]; };
const turnPiece = (p, k) => { const [x, z] = turnXZ(p.x, p.z, k); return { ...p, x, z, w: k % 2 ? p.d : p.w, d: k % 2 ? p.w : p.d }; };

// ---- the socket: lanes, the middle, the mouths --------------------------------------------
const DOOR_AT = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
/** How far a box (x, z, w, d) stays from the segment from a to the middle (its nearest point), roughly: the corner-to-line distance. */
function clearOf(p, ax, az) {
  const L = ax * ax + az * az, t = Math.max(0, Math.min(1, (p.x * ax + p.z * az) / L)), cx = ax * t, cz = az * t;
  const dx = Math.max(0, Math.abs(cx - p.x) - p.w / 2), dz = Math.max(0, Math.abs(cz - p.z) - p.d / 2);
  return Math.hypot(dx, dz);
}
/** Does a piece stand in the socket (the middle, or a lane from one of the doorways at `doors`: [x, z] from the middle)? */
function inSocket(p, doors) {
  if (p.kind === 'step' && p.h < 0.4) return false; // (walked over)
  if (Math.max(0, Math.abs(p.x) - p.w / 2) ** 2 + Math.max(0, Math.abs(p.z) - p.d / 2) ** 2 < MIDDLE * MIDDLE) return true;
  for (const [ax, az] of doors) if (clearOf(p, ax, az) < LANE) return true;
  return false;
}

/** The problems with a design: a piece in the socket in a shape it is drawn for (a hall: with a doorway at every one of its eight places). */
export function checkPrefab(id) {
  const F = PREFABS[id], out = [];
  if (F.hall) {
    const doors = [[9, -18], [-9, -18], [9, 18], [-9, 18], [-18, 9], [-18, -9], [18, 9], [18, -9]];
    F.pieces.forEach((p, i) => { if (inSocket(p, doors)) out.push(`${id}: piece ${i} (${p.kind} at ${p.x}, ${p.z}) in a lane of the hall`); });
    return out;
  }
  for (const shape of F.shapes) {
    const doors = FRAME[shape].map((s) => DOOR_AT[s].map((v) => v * H));
    F.pieces.forEach((p, i) => { if (inSocket(p, doors)) out.push(`${id}: piece ${i} (${p.kind} at ${p.x}, ${p.z}) in the socket of a ${shape}`); });
  }
  return out;
}

// ---- choosing: paced along the path ---------------------------------------------------------
const BEATS = ['through', 'fight', 'breathe'];
/** Gives each cell its design (`tpl`) and `turn`. Halls take a hall design; slopes stay bare; the start and the end a vestibule. */
export function chooseRooms(layout, R) {
  const fits = (id, shape) => !PREFABS[id].hall && PREFABS[id].shapes.includes(shape);
  const ofBeat = (beat, shape) => Object.keys(PREFABS).filter((id) => PREFABS[id].beat === beat && fits(id, shape));
  let prev = null, b = R.int(BEATS.length);
  const before = layout.path[layout.path.length - 2];
  for (const cell of layout.path) {
    const { shape, turn } = shapeOf(cell.doors);
    cell.turn = turn;
    if (cell.slope || cell.hall != null) { prev = null; continue; }
    if (cell === layout.start || cell === layout.exit) { cell.tpl = 'vestibule'; prev = cell.tpl; continue; }
    if (cell === before && fits('pylon', shape)) { cell.tpl = 'pylon'; prev = cell.tpl; continue; }
    let pick = null;
    for (let i = 0; i < BEATS.length && !pick; i++) { // (this beat, else the next: a shape some beat has no design for)
      const list = ofBeat(BEATS[(b + i) % BEATS.length], shape).filter((id) => id !== prev);
      if (list.length) pick = R.pick(list);
    }
    cell.tpl = pick || 'vestibule'; prev = cell.tpl; b = (b + 1) % BEATS.length;
  }
  for (const cell of layout.cells) {
    if (layout.path.includes(cell)) continue;
    const { shape, turn } = shapeOf(cell.doors); cell.turn = turn;
    if (cell.slope || cell.hall != null) continue;
    const list = shape === 'dead' ? ['shrine', 'gallery', 'stones'] : Object.keys(PREFABS).filter((id) => fits(id, shape) && PREFABS[id].beat !== 'gate' && PREFABS[id].beat !== 'rest');
    cell.tpl = R.pick(list.filter((id) => fits(id, shape))) || 'vestibule';
  }
  const hallIds = Object.keys(PREFABS).filter((id) => PREFABS[id].hall);
  layout.halls.forEach((h) => { h.tpl = R.pick(hallIds); });
}

/** A cell's pieces, flats and spots in the plan's frame (metres from the cell's middle, or from a hall's middle for a hall: `doors`
 *  then lists the hall's doorways as points from its middle, and any piece in their lanes is left out). */
export function roomPieces(design, turn = 0, doors = null) {
  const F = PREFABS[design];
  if (!F) return { pieces: [], flat: [], spots: [] };
  const k = F.hall ? 0 : turn;
  let pieces = F.pieces.map((p) => turnPiece(p, k));
  if (doors) pieces = pieces.filter((p) => !inSocket(p, doors));
  const pt = (o) => { const [x, z] = turnXZ(o.x, o.z, k); return { ...o, x, z }; };
  return { pieces, flat: (F.flat || []).map(pt), spots: (F.spots || []).map(pt) };
}
