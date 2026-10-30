// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES: the god hand taught by copying (South, 2026-10-30: "taking an object, warping it IAW the godhand power suite, then
// making the player recreate the steps applied like a mimicry game"; docs/plans/MIMICRY.md). A patch of the island's matter, 12 m
// square, is laid out; the System works it with the god hand's powers, step by step, and the ground left is the target, held over the
// patch as a ghost. The patch is put back, and you make the target again with the same powers. The puzzle's own powers are lent inside
// its patch while it is open (a power you have not learned is the puzzle's tool, never yours to keep), and a clean copy of a power's
// puzzle is its third way to be learned (progress/skills.js POWER_FEATS: the count way, the feat way, the mimic way).
//
// What it teaches without saying so (DESIGN.md 22): matter is moved, never made (a perfect copy takes nothing from nowhere), and order
// matters (carve then flood is not flood then carve). The modes climb as a puzzle game's do: MIMIC shows every step; MATCH shows only
// the before and the after, so the steps are yours to read (Divination's: perceiving the hidden); UNDO starts from the after and asks
// for the before (the steps' inverses).
//
// Pure: the steps run on a MatterField (godhand/matter.js) of the puzzle's own, so the target is the System's real result under the same
// physics the hand works, and scripts/mimicry.mjs plays every puzzle's demonstration back to check it solves itself.
//
// Prior art: Islands of Insight (Lunarch, 2024: its Matchbox, two objects made alike; puzzles laid in the world as enclaves that teach a
// mechanic each); Puzzle Pirates (Three Rings, 2003: the duty puzzles' fixed toolkits and their ratings, Incredible to Poor); Simon
// (Milton Bradley, 1978: the sequence shown, then repeated); golf's par; Picross's before-and-after; From Dust's matter (the field itself).
//
//   MIMIC = { half, cell, soft, settle, solve, clean, replay, made }   MIMIC_PUZZLES[id] = { label, line, mode, tier, powers, setup, steps, par }
//   MIMIC_TOOL[power] = { key: value }   (the puzzle's fixed toolkit: the hand's level-1 numbers while it is open, so a copy is fair at any level)
//   MIMIC_OPS[op] -> its power        powersOf(steps) -> [power]        domainsOf(powers) -> [domain]
//   newPatch() -> MatterField          lay(F, steps, at)                 snap(F, at) -> { firm, loose, w, tint }
//   framesOf(id | puzzle, base?) -> { start, target, steps, mode }   framesOn(field, puzzle, at) (the same on the island's own field)   cloneField(F)              (what the runtime lays and shows)
//   matchOf(now, target, start) -> 0..1                                  gradeOf({ match, strokes, par, made, allow }) -> { solved, stars }
//   dayPuzzle(day) -> puzzle (seeded, the same for everyone)             mimicOpen(id, L) -> bool (the ladder: one opens the next)
//   MIMIC_SITES [{ id, area, r, bearing, rungs, day? }]   siteAt(site, oasis) -> { x, z, out }   siteOf(puzzle id) -> site
// ---------------------------------------------------------------------------------------
import { MatterField, FEELINGS } from '../godhand/matter.js';
import { GOD_POWERS } from './godpowers.js';

/** The patch's numbers. `half`: half the patch's side in metres (12 m square, a garden bed's work, inside the island field's 72 m).
 *  `cell`: the island field's own (godhand/matter.js MATTER.cell), so the target is cell for cell what the hand can make. `soft`: cells a box
 *  pass reaches when the layers are softened before they are compared (a stroke half a metre off still matches). `settle`: real seconds the target is stepped after the
 *  last step (the slump and the water come to rest, as the player's will). `solve`: the match that solves it; `clean`: the match a
 *  two-star copy needs; three stars also want the strokes at par and nothing made from nowhere (`made`, m³). `replay`: real seconds a
 *  shown step holds before the next. `taper`: metres over which a bed thins to nothing at the patch's edge (1.6 m over 2: under clay's angle of repose). `pay`: minutes of play a puzzle's first solve pays by its tier (cubes at the stone; ECONOMY.md: a
 *  rung is a few minutes' thought), the game day's once a game day. `weights`: what a layer's difference counts (water half: it runs and dries while you work). */
export const MIMIC = { half: 6, cell: 0.5, pad: 4, soft: 3, settle: 4, dt: 1 / 30, solve: 0.68, clean: 0.85, made: 0.5, enough: 0.8, taper: 2, pay: { 1: 2, 2: 3, 3: 4, day: 3 }, replay: 1.6, weights: { firm: 1, loose: 1, w: 0.5, tint: 0.5 }, floor: 1.5 };

/** The puzzle's toolkit (Puzzle Pirates' duty puzzles: one set of tools for everyone): while a puzzle is open its powers read these in
 *  place of their ramp's (progress/godpowers.js rampOf asks `game.mimicry.tool`), the hand's own numbers at level 1, so a copy made at
 *  Alteration 80 is the same puzzle as at 1. The steps below are written to them. */
export const MIMIC_TOOL = { shape: { r: 1.6, made: 0.5 }, carve: { w: 1.4, depth: 1.2, len: 18 }, scoop: { carry: 20 }, fold: { side: 4 }, stamp: { side: 4 }, slab: { side: 4 }, transmute: { r: 2.5 } };
const CARVE = { w: 1.4, depth: 1.2 };

/** Each step's op and the power it is (`GOD_POWERS`): the powers a puzzle lends are its steps' own. */
export const MIMIC_OPS = { raise: 'shape', smooth: 'shape', carve: 'carve', pour: 'scoop', move: 'scoop', transmute: 'transmute', fold: 'fold', stamp: 'stamp', slab: 'slab' };
export const powersOf = (steps) => [...new Set(steps.map((s) => MIMIC_OPS[s.op]).filter(Boolean))];
export const domainsOf = (powers) => [...new Set(powers.map((p) => GOD_POWERS[p]?.domain).filter(Boolean))];

// The puzzles, a ladder a domain (Islands of Insight's enclaves: each teaches one mechanic, then mixes them). Coordinates are metres
// from the patch's middle (x east, z south), heights metres over the authored ground. `setup` lays the start (a bed to work); `steps`
// are the System's, and `par` their count unless said. Placeholder labels and lines, Espada's to word.
const BED = { op: 'bed', firm: 1.6 }; // (a bed deeper than a channel: Carve cuts 1.2 at the toolkit's numbers)
export const MIMIC_PUZZLES = {
  // Alteration (Shape, Carve, Transmute): the first rung of all, open from the start
  mound: { label: 'One Mound', line: 'Raise the ground where it rose.', mode: 'mimic', tier: 1, setup: [BED], steps: [{ op: 'raise', at: [0, 0], r: 1.6, dh: 1 }] },
  hollow: { label: 'A Hollow', line: 'Lower the ground where it fell.', mode: 'mimic', tier: 1, setup: [BED], steps: [{ op: 'raise', at: [0, 0], r: 1.6, dh: -0.8 }] },
  twins: { label: 'Two Mounds', line: 'Two raised, a pace apart.', mode: 'mimic', tier: 1, setup: [BED], steps: [{ op: 'raise', at: [-3, 0], r: 1.6, dh: 0.9 }, { op: 'raise', at: [3, 0], r: 1.6, dh: 0.9 }] },
  ditch: { label: 'The Ditch', line: 'A channel cut end to end.', mode: 'mimic', tier: 1, setup: [BED], steps: [{ op: 'carve', a: [-5, 0], b: [5, 0], ...CARVE }] },
  level: { label: 'Level It', line: 'A mound smoothed flat again.', mode: 'mimic', tier: 2, setup: [BED, { op: 'raise', at: [0, 0], r: 1.6, dh: 1 }], steps: [{ op: 'smooth', a: [-2.5, 0], b: [2.5, 0], r: 2.2, y: 1.6 }] },
  claybed: { label: 'Sand to Clay', line: 'One patch of sand turned to clay.', mode: 'mimic', tier: 2, setup: [{ op: 'bed', firm: 0.4, loose: 0.6 }], steps: [{ op: 'transmute', at: [0, 0], r: 2.5 }] },
  // Psychokinesis (Scoop and Pour, Lift Ground)
  heap: { label: 'Move the Heap', line: 'The heap carried across.', mode: 'mimic', tier: 1, setup: [{ op: 'bed', firm: 0.4 }, { op: 'pour', at: [-3, -3], r: 1.6, vol: 6, kind: 'loose' }], steps: [{ op: 'move', from: [-3, -3], to: [3, 3], r: 1.6, vol: 6 }] },
  fill: { label: 'Fill the Hollow', line: 'The pool carried into the hollow.', mode: 'mimic', tier: 2, setup: [BED, { op: 'raise', at: [2, 0], r: 1.6, dh: -0.8 }, { op: 'pour', at: [-4, 3], r: 1.2, vol: 2.5, kind: 'water' }], steps: [{ op: 'move', from: [-4, 3], to: [2, 0], r: 1.2, vol: 2.5 }] },
  slab: { label: 'The Slab', line: 'A square of ground lifted and set down.', mode: 'mimic', tier: 3, setup: [{ op: 'bed', firm: 0.6 }, { op: 'raise', at: [-3, 0], r: 1.6, dh: 1 }], steps: [{ op: 'slab', from: [-3, 0], to: [3, 0], side: 4 }] },
  // Ouranurgy (Swap)
  swap: { label: 'Swap', line: 'Two patches trade places.', mode: 'mimic', tier: 3, setup: [{ op: 'bed', firm: 0.6 }, { op: 'raise', at: [-3, 0], r: 1.6, dh: 1.2 }, { op: 'carve', a: [2, -2], b: [4, 2], ...CARVE }], steps: [{ op: 'fold', a: [-3, 0], b: [3, 0], side: 4 }] },
  // Spellscription (Copy Terrain)
  copy: { label: 'Copy', line: 'One patch pressed down twice.', mode: 'mimic', tier: 3, setup: [BED, { op: 'carve', a: [-4, -1], b: [-2, 1], ...CARVE }, { op: 'carve', a: [-4, 1], b: [-2, -1], ...CARVE }], steps: [{ op: 'stamp', a: [-3, 0], b: [3, 0], side: 4 }] },
  // the mix: order matters, and MATCH and UNDO (the steps not shown)
  order: { label: 'Order of Things', line: 'A channel, and water standing in it.', mode: 'match', tier: 2, setup: [BED, { op: 'pour', at: [-4, 4], r: 1.2, vol: 2, kind: 'water' }], steps: [{ op: 'carve', a: [-4, 0], b: [4, 0], ...CARVE }, { op: 'move', from: [-4, 4], to: [0, 0], r: 1.2, vol: 2 }] },
  moat: { label: 'The Moat', line: 'A mound inside a ditch.', mode: 'match', tier: 3, setup: [BED], steps: [{ op: 'raise', at: [0, 0], r: 1.6, dh: 1 }, { op: 'carve', a: [-3.5, -3.5], b: [3.5, -3.5], ...CARVE }, { op: 'carve', a: [3.5, -3.5], b: [3.5, 3.5], ...CARVE }] },
  unmade: { label: 'Unmade', line: 'Put the ground back as it was.', mode: 'undo', tier: 2, setup: [BED], steps: [{ op: 'raise', at: [-3, 2], r: 1.6, dh: 1 }, { op: 'raise', at: [3, -2], r: 1.6, dh: -0.8 }] },
};
for (const [id, P] of Object.entries(MIMIC_PUZZLES)) { P.id = id; P.powers = powersOf(P.steps); P.domains = domainsOf(P.powers); P.par ??= P.steps.length; }
/** The ladder's order (the first rung open; each solved opens the next of its domain's line, and the mix opens with the first rungs). */
export const MIMIC_LADDER = ['mound', 'hollow', 'twins', 'ditch', 'heap', 'level', 'fill', 'claybed', 'order', 'unmade', 'slab', 'swap', 'copy', 'moat'];
/** Open: the first rung, or the one before it on the ladder solved; in DEBUG, the lend panel's `mimicry` row opens them all. */
export const mimicOpen = (id, L, g = null) => {
  if (g?.lend?.has?.('mimicry')) return true;
  const i = MIMIC_LADDER.indexOf(id);
  if (i < 0) return id === 'day';
  return i === 0 || (L?.get?.(`god.mimic.solved.${MIMIC_LADDER[i - 1]}`) || 0) > 0;
};

/** The puzzle stones, one an area of the Dunes (docs/plans/AREAS.md: each area its things), placed in the Dunes' own frame (areas.js:
 *  r metres from the oasis, its bearing atan2(z, x) in degrees); each sets its own rungs, the lowest open one first. Alteration's first
 *  steps in the Gnomon flats (and the game day's puzzle once they are done), the moving of things by the shore, the mix on the crystal
 *  ridges, Swap and Copy in the ruins (old forms copied and moved: the ruins are what Kaolin Anagami keeps of others). The patch lies
 *  9 m beyond its stone, away from the oasis. */
export const MIMIC_SITES = [
  { id: 'flats', area: 'flats', r: 200, bearing: 150, rungs: ['mound', 'hollow', 'twins', 'ditch', 'level', 'unmade'], day: true },
  { id: 'shore', area: 'shore', r: 200, bearing: 10, rungs: ['heap', 'fill', 'slab'] },
  { id: 'ridges', area: 'ridges', r: 220, bearing: -60, rungs: ['claybed', 'order', 'moat'] },
  { id: 'ruins', area: 'ruins', r: 250, bearing: 80, rungs: ['swap', 'copy'] },
];
/** A site's place in the world: the Dunes' oasis `D` ({ x, z }) and its polar offset; `out` the unit way away from the oasis. */
export function siteAt(site, D) { const b = (site.bearing * Math.PI) / 180, out = { x: Math.cos(b), z: Math.sin(b) }; return { x: D.x + out.x * site.r, z: D.z + out.z * site.r, out }; }
/** The stone that sets a puzzle (for a refusal's "begin at ..."). */
export const siteOf = (id) => MIMIC_SITES.find((s) => s.rungs.includes(id)) || null;

// ---- the field
/** A patch's own MatterField: the patch and a pad round it (a raise takes from the ring outside its radius), on the authored ground
 *  `base(x, z)` gives (metres over the patch's middle, x and z from it; flat when none): the world's slope, so the target slumps as the
 *  real ground's copy will (the Dunes are not flat: measured, a flat target scored a perfect copy on the flats' slope 0.64). */
export function newPatch(base = null) {
  const n = Math.round((MIMIC.half * 2) / MIMIC.cell) + MIMIC.pad * 2, F = new MatterField({ n, cell: MIMIC.cell, ox: 0, oz: 0 });
  F.sampleBase(base ? (x, z) => base(x, z) : () => 0);
  F.kept.fill(1e9); // (never mended: the real patch is kept while its puzzle is open)
  return F;
}
const W = (at, p) => [at.x + p[0], at.z + p[1]];
/** Run steps on a field, the patch's middle at `at` ({ x, z, y }: y its authored ground's height, for a level's `to`). */
export function lay(F, steps, at = { x: 0, z: 0, y: 0 }) {
  let made = 0;
  for (const s of steps) {
    const p = s.at && W(at, s.at);
    if (s.op === 'bed') { const m = Math.round((MIMIC.half * 2) / F.cell), edge = MIMIC.taper / F.cell; eachCell(F, at, (k, i, j) => { const t = Math.min(1, (Math.min(i, j, m - 1 - i, m - 1 - j) + 0.5) / edge); F.firm[k] += (s.firm || 0) * t; F.loose[k] += (s.loose || 0) * t; }); F.grow?.(0, F.n - 1, 0, F.n - 1); F.version++; } // (its edge tapered to rest, so it never slumps out of the patch)
    else if (s.op === 'raise') made += F.raise(p[0], p[1], s.r, s.dh)?.made || 0;
    else if (s.op === 'smooth') { const a = W(at, s.a), b = W(at, s.b), n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5)); for (let i = 0; i <= n; i++) made += F.smooth(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, s.r, (at.y || 0) + s.y, 1)?.made || 0; } // (a stroke, as the hand levels)
    else if (s.op === 'carve') { const a = W(at, s.a), b = W(at, s.b); F.carve(a[0], a[1], b[0], b[1], s.w, s.depth); }
    else if (s.op === 'pour') F.pour(p[0], p[1], s.r, s.vol, { kind: s.kind || 'loose', feeling: s.feeling || null });
    else if (s.op === 'move') { const a = W(at, s.from), b = W(at, s.to), got = F.take(a[0], a[1], s.r, s.vol); for (const kind of ['firm', 'loose', 'water']) if (got[kind] > 0) F.pour(b[0], b[1], s.r, got[kind], { kind, feeling: kind === 'water' ? got.feeling : null }); }
    else if (s.op === 'transmute') F.transmute(p[0], p[1], s.r, s.feeling ? { feeling: s.feeling } : { swap: true });
    else if (s.op === 'fold' || s.op === 'stamp') { const a = W(at, s.a), b = W(at, s.b); made += F.patch(a[0], a[1], b[0], b[1], s.side / 2, { copy: s.op === 'stamp' })?.made || 0; }
    else if (s.op === 'slab') { const a = W(at, s.from), b = W(at, s.to), got = F.take(a[0], a[1], s.side / 2, s.side * s.side * 20); for (const kind of ['firm', 'loose', 'water']) if (got[kind] > 0) F.pour(b[0], b[1], s.side / 2, got[kind], { kind, feeling: kind === 'water' ? got.feeling : null }); }
  }
  return { made };
}
/** Step the field until it rests (the slump and the water), as the player's ground will have by the time it is judged. */
export function settle(F, sec = MIMIC.settle) { for (let t = 0; t < sec; t += MIMIC.dt) F.step(MIMIC.dt); }
/** Each cell of the patch (its index in the field), the patch's middle at `at`. */
export function eachCell(F, at, fn) {
  const c = F.cell, i0 = Math.round((at.x - MIMIC.half - F.ox) / c), j0 = Math.round((at.z - MIMIC.half - F.oz) / c), m = Math.round((MIMIC.half * 2) / c);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { const ii = i0 + i, jj = j0 + j; if (ii >= 0 && jj >= 0 && ii < F.n && jj < F.n) fn(jj * F.n + ii, i, j); }
}
/** The patch's layers now, cell by cell (a copy): firm, loose, Lachryma's depth, and its leading feeling's index (-1 none). */
export function snap(F, at = { x: 0, z: 0 }) {
  const m = Math.round((MIMIC.half * 2) / F.cell), N = m * m, out = { m, firm: new Float32Array(N), loose: new Float32Array(N), w: new Float32Array(N), tint: new Int8Array(N).fill(-1) };
  eachCell(F, at, (k, i, j) => {
    const o = j * m + i; out.firm[o] = F.firm[k]; out.loose[o] = F.loose[k]; out.w[o] = F.w[k];
    if (F.w[k] > 0.02) { let best = -1, bv = 0.2; for (let f = 0; f < FEELINGS.length; f++) { const v = F.mix[k * FEELINGS.length + f]; if (v > bv) { bv = v; best = f; } } out.tint[o] = best; }
  });
  return out;
}
/** Write a snapshot back over the patch (the runtime puts the start back after the demonstration). */
export function restore(F, at, S) {
  eachCell(F, at, (k, i, j) => { const o = j * S.m + i; F.firm[k] = S.firm[o]; F.loose[k] = S.loose[o]; F.w[k] = S.w[o]; });
  F.grow?.(0, F.n - 1, 0, F.n - 1); F.version++; F.wversion++;
}

/** A copy of a field to work a puzzle on aside (its arrays copied, its pulls and timers dropped): the frames made on the island's own
 *  grid and slope, cell for cell what the hand's copy will be judged on (a patch of its own sits off the island's cells by a fraction of
 *  one, and a perfect copy read 0.83 so: measured, the flats' stone). */
export function cloneField(F) {
  const C = Object.create(Object.getPrototypeOf(F));
  for (const [k, v] of Object.entries(F)) C[k] = ArrayBuffer.isView(v) ? v.slice() : Array.isArray(v) ? [] : v;
  C.timeCells = null; C.bb = F.bb ? [...F.bb] : null;
  return C;
}
/** A puzzle's frames on a field (the island's, in the world): `at` its middle; its start and target as the System makes them there. */
export function framesOn(F, P, at) {
  if (typeof P === 'string') P = MIMIC_PUZZLES[P] || null;
  if (!P) return null;
  const C = cloneField(F);
  eachCell(C, at, (k) => { C.firm[k] = 0; C.loose[k] = 0; C.w[k] = 0; C.kept[k] = 1e9; }); // (the patch cleared to its authored ground first, and kept from the mending, as the real one is while open)
  lay(C, P.setup, at); settle(C);
  const before = snap(C, at);
  const { made } = lay(C, P.steps, at); settle(C);
  const after = snap(C, at);
  return P.mode === 'undo' ? { start: after, target: before, steps: P.steps, mode: P.mode, made } : { start: before, target: after, steps: P.steps, mode: P.mode, made };
}

/** A puzzle's frames: its start and its target as the System made them (UNDO turns them about). */
export function framesOf(P, base = null) {
  if (typeof P === 'string') P = MIMIC_PUZZLES[P] || null;
  if (!P) return null;
  const F = newPatch(base);
  lay(F, P.setup); settle(F);
  const before = snap(F);
  const { made } = lay(F, P.steps); settle(F);
  const after = snap(F);
  return P.mode === 'undo' ? { start: after, target: before, steps: P.steps, mode: P.mode, made } : { start: before, target: after, steps: P.steps, mode: P.mode, made };
}

/** A layer softened over about a metre (two box passes of `soft` cells: a Gaussian's cheap stand-in), so a stroke half a metre off
 *  still lies over its target's ground instead of beside it. */
function soften(a, m) {
  const R = MIMIC.soft, tmp = new Float32Array(a.length), out = new Float32Array(a);
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { let s = 0, n = 0; for (let d = -R; d <= R; d++) { const ii = i + d; if (ii >= 0 && ii < m) { s += out[j * m + ii]; n++; } } tmp[j * m + i] = s / n; }
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { let s = 0, n = 0; for (let d = -R; d <= R; d++) { const jj = j + d; if (jj >= 0 && jj < m) { s += tmp[jj * m + i]; n++; } } out[j * m + i] = s / n; }
  }
  return out;
}
const softOf = (S) => (S._soft ||= { firm: soften(S.firm, S.m), loose: soften(S.loose, S.m), w: soften(S.w, S.m) });

/** How near `now` is to `target`, 0 .. 1: the Dice coefficient of the two changes (start to target, start to now) over the softened
 *  layers: 1 - |now - target| / (|target - start| + |now - start|). Doing nothing is 0, the target is 1, a copy 15% short about 0.92,
 *  and ground churned at random scores nothing however much it moved. A Lachryma of the wrong feeling counts half. `floor`: the least
 *  change a puzzle is judged against (m³), so a tiny one is never solved by luck. Times how much of the asked change was made, up to
 *  `enough` of it (a 15% short copy is whole; one mound of two is not). */
export function matchOf(now, target, start) {
  const m = target.m, Wt = MIMIC.weights, N = softOf(now), T = softOf(target), S0 = softOf(start);
  let diff = 0, change = 0, asked = 0, moved = 0;
  for (let o = 0; o < m * m; o++) {
    asked += Math.abs(T.firm[o] - S0.firm[o]) + Math.abs(T.loose[o] - S0.loose[o]) + 0.5 * Math.abs(T.w[o] - S0.w[o]);
    moved += Math.abs(N.firm[o] - S0.firm[o]) + Math.abs(N.loose[o] - S0.loose[o]) + 0.5 * Math.abs(N.w[o] - S0.w[o]);
    diff += Wt.firm * Math.abs(N.firm[o] - T.firm[o]) + Wt.loose * Math.abs(N.loose[o] - T.loose[o]) + Wt.w * Math.abs(N.w[o] - T.w[o]);
    change += Wt.firm * Math.abs(T.firm[o] - S0.firm[o]) + Wt.loose * Math.abs(T.loose[o] - S0.loose[o]) + Wt.w * Math.abs(T.w[o] - S0.w[o])
      + Wt.firm * Math.abs(N.firm[o] - S0.firm[o]) + Wt.loose * Math.abs(N.loose[o] - S0.loose[o]) + Wt.w * Math.abs(N.w[o] - S0.w[o]);
    if (target.tint[o] >= 0 && now.w[o] > 0.02 && now.tint[o] !== target.tint[o]) diff += Wt.tint * Math.min(now.w[o], target.w[o]);
  }
  const a = MIMIC.cell * MIMIC.cell, dice = Math.max(0, Math.min(1, 1 - (diff * a) / Math.max(MIMIC.floor, change * a)));
  return dice * Math.min(1, moved / Math.max(1e-6, MIMIC.enough * asked)); // (enough done: half the steps of two are half the ground moved)
}
/** Solved at `solve`; a star for solving, one for a clean copy, one for doing it in par strokes and taking nothing from nowhere. */
export function gradeOf({ match, strokes = 0, par = 1, made = 0, allow = 0 }) {
  const solved = match >= MIMIC.solve, clean = match >= MIMIC.clean, tight = strokes <= par && made <= allow + MIMIC.made; // (allow: what the System's own steps made: a copy press makes its matter)
  return { solved, clean, stars: solved ? 1 + (clean ? 1 : 0) + (clean && tight ? 1 : 0) : 0, match: +match.toFixed(3) };
}

// ---- the game day's puzzle: seeded, the same for everyone (the game day's race's way), its powers the open ones' rungs
const rngOf = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; s ^= s >>> 12; return (s >>> 0) / 4294967296; }; };
/** A puzzle for a game day: three steps from the first rungs' ops (Shape, Carve, Scoop), MATCH on odd game days, MIMIC on even. */
export function dayPuzzle(day) {
  const r = rngOf(Math.imul(day + 101, 0x9e3779b1)), at = () => [Math.round((r() * 8 - 4) * 2) / 2, Math.round((r() * 8 - 4) * 2) / 2], steps = [];
  for (let n = 0; n < 3; n++) {
    const pick = r();
    if (pick < 0.45) steps.push({ op: 'raise', at: at(), r: 1.6, dh: r() < 0.6 ? 0.9 : -0.7 });
    else if (pick < 0.8) { const a = at(), b = at(); if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 3) steps.push({ op: 'carve', a, b, ...CARVE }); else steps.push({ op: 'raise', at: a, r: 1.6, dh: 0.9 }); }
    else steps.push({ op: 'move', from: [-5, -5], to: at(), r: 1.6, vol: 4 });
  }
  const setup = steps.some((s) => s.op === 'move') ? [BED, { op: 'pour', at: [-5, -5], r: 1.6, vol: 5, kind: 'loose' }] : [BED];
  const P = { id: 'day', label: "The Game Day's Puzzle", line: 'Made new each game day.', mode: day % 2 ? 'match' : 'mimic', tier: 2, setup, steps, day };
  P.powers = powersOf(steps); P.domains = domainsOf(P.powers); P.par = steps.length;
  return P;
}
