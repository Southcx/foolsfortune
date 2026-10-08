// ---------------------------------------------------------------------------------------
// THE PASSAGE: the sea chart laid between two islands at the pier, the path drafted through it, Divination's portents of each waypoint,
// and the rutter a passage sailed to its end gives (docs/plans/PASSAGE.md; the ride itself: docs/plans/RAIL-OVERHAUL.md). Data and pure
// functions: the pier draws it (Petra's), the crossing sails it, the ledger counts it.
//
// THE SEA CHART is laid Slay the Spire's way (the map generator as the community has documented it: a grid, a few lanes walked from the
// first column to the last, each step to one of the three nearest in the next column, merging allowed and crossing never; then a
// BUDGETED POOL of waypoint types shuffled over the live waypoints under local rules: a type never follows itself, siblings unlike, a
// minimum column), so a sea is balanced by construction and reads as a graph at a glance. It is a pure function of the route and the
// game day (the same day lays the same sea: an arcade stage is learnable), and of the Leviathan's deck draw (its guarantee is kept).
// THE PORTENTS are what Divination shows of a waypoint: a confidence that falls with depth (FTL's scanners, the weather's forecast that
// knows less further out), shown as a COUNTED SHORTLIST of candidates (Hades' doors; quantile dotplots: counts beat percentages), never
// a number, and always true (Into the Breach: shown information is true; the hurricane cone: no crisp edge where sight ends).
// THE RUTTER is the passage's map, sellable and stale by the game day (Sunless Sea's charts and port reports; the Cogitomap's twin).
//
//   PASSAGE (the pool and its rules)   seaChart({ from, to, day, danger, distance, casks, leviathan, bounty }) -> chart
//   lanes(chart) -> [[waypoint id, ...]]   next(chart, id) -> [ids]   classOf(type) -> 'threat' | 'boss' | 'haven'
//   sight(reckoning, widen, lead) -> 0..   confidence(depth, sight, level) -> 0..1   tierOf(c, depth) -> 'exact' | 'two' | 'three' | 'class' | 'star'
//   portent(chart, waypoint, depth, sight, level) -> { tier, candidates, cls, confidence }   rutterWorth({ minutes, rank, read, daysOld }) -> cubes
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

/** The waypoint types: a share of the live waypoints by the route's danger d (-1 calm .. +2 wild), and their rules. Shares that do not
 *  fill the sea are the shoal's (the common leg, as the monster is Slay the Spire's). `boss` legs are placed before the pool. */
export const PASSAGE = {
  types: {
    shoal:     { cls: 'threat', share: (d) => 0.30 - 0.05 * d },
    wreckers:  { cls: 'threat', share: (d, casks) => Math.min(0.30, 0.10 + 0.05 * d + 0.03 * casks), minCol: 1, noRepeat: true },
    eyewall:   { cls: 'threat', share: (d) => 0.12 + 0.04 * d, noRepeat: true },
    graveyard: { cls: 'threat', share: () => 0.12 },
    calm:      { cls: 'haven',  share: (d) => 0.10 - 0.03 * d, noRepeat: true, notLast: true },
    encounter: { cls: 'haven',  share: (d) => 0.10 - 0.01 * d, noRepeat: true, notLast: true }, // (a calm with a cinematic event: progress/rail/encounters.js)
    maelstrom: { cls: 'boss',   one: true, minCol: 2 },
    bounty:    { cls: 'boss',   one: true, minCol: 1 },
    leviathan: { cls: 'boss',   one: true, lastCols: 2 },
  },
  /** Lanes walked from the first column (Slay the Spire walks six over a 7-wide grid; ours is narrower). */
  lanes: 4,
  /** Columns from the hop: 2 + distance / 3, one more on a wild route (danger 1 or more), 3 to 6 (the Margarite run 3; Anagami to
   *  Entropolis 4; King to Queen 6). Rows: 4, or 5 from five columns on. */
  columns: (distance, danger) => Math.max(3, Math.min(6, 2 + Math.round(distance / 3) + (danger >= 1 ? 1 : 0))),
  rows: (columns) => (columns >= 5 ? 5 : 4),
  /** A waypoint's strength (a Figment class, 0 Guppy .. 4 Leviathan): the route's danger, half a step wilder a column out (LEG.deeper),
   *  and the Wreckers a step stronger for every four casks aboard (risk scales with what you carry). */
  strength: (danger, col, type, casks = 0) => Math.max(0, Math.min(4, Math.round(1 + danger + 0.5 * col + (type === 'wreckers' ? casks / 4 : 0)))),
};

export const classOf = (type) => PASSAGE.types[type]?.cls || 'threat';

/** A seeded generator from a string (FNV-1a with murmur3's finaliser, then mulberry32), so a sea is the same for everyone that day. */
function rngOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, n) => Math.min(n - 1, Math.floor(r() * n));
const idOf = (col, row) => `${col}:${row}`;

/** Lay the sea chart for a hop. `day` is the game day (calendar `today()`); `leviathan` whether the deck was drawn at the pier;
 *  `bounty` whether Letty has posted one on this route. Returns { route, day, columns, rows, waypoints: { id: { id, col, row, type,
 *  strength } }, edges: [[from, to]], first: [ids], last: [ids] }. */
export function seaChart({ from, to, day = 0, danger = 0, distance = 4, casks = 0, leviathan = false, bounty = false }) {
  const route = [from, to].sort().join('-'), r = rngOf(`sea:${route}:${from}>${to}:${Math.floor(day)}:${leviathan ? 1 : 0}`);
  const C = PASSAGE.columns(distance, danger), R = PASSAGE.rows(C);
  // ---- the lanes: walked column to column, to one of the three nearest rows, never crossing an edge already laid
  const edges = new Set(), used = new Set();
  let firstStart = -1;
  for (let i = 0; i < PASSAGE.lanes; i++) {
    let row = pick(r, R);
    if (i === 1) for (let k = 0; k < 8 && row === firstStart; k++) row = pick(r, R); // (the second lane starts elsewhere)
    if (i === 0) firstStart = row;
    used.add(idOf(0, row));
    for (let col = 0; col < C - 1; col++) {
      let nr = Math.max(0, Math.min(R - 1, row + pick(r, 3) - 1));
      // (a diagonal crosses an edge already laid the other way between the same two rows: go straight instead)
      if (nr === row + 1 && edges.has(`${idOf(col, row + 1)}>${idOf(col + 1, row)}`)) nr = row;
      if (nr === row - 1 && edges.has(`${idOf(col, row - 1)}>${idOf(col + 1, row)}`)) nr = row;
      edges.add(`${idOf(col, row)}>${idOf(col + 1, nr)}`); used.add(idOf(col + 1, nr)); row = nr;
    }
  }
  const waypoints = {};
  for (const id of used) { const [col, row] = id.split(':').map(Number); waypoints[id] = { id, col, row, type: null, strength: 0 }; }
  const E = [...edges].map((e) => e.split('>')), parents = {}, children = {};
  for (const [a, b] of E) { (children[a] ||= []).push(b); (parents[b] ||= []).push(a); }
  const ids = Object.keys(waypoints).sort((a, b) => waypoints[a].col - waypoints[b].col || waypoints[a].row - waypoints[b].row);
  // ---- the rules (Slay the Spire's local rules) for a type at a waypoint
  const T = PASSAGE.types;
  const legal = (id, type) => {
    const w = waypoints[id], t = T[type];
    if (t.minCol != null && w.col < t.minCol) return false;
    if (t.lastCols != null && w.col < C - t.lastCols) return false;
    if (t.notLast && w.col === C - 1) return false;
    if (t.noRepeat && (parents[id] || []).some((p) => waypoints[p].type === type)) return false;
    if (t.noRepeat && (children[id] || []).some((c) => waypoints[c].type === type)) return false;
    if (type !== 'shoal') for (const p of parents[id] || []) if ((children[p] || []).some((s) => s !== id && waypoints[s].type === type)) return false; // (siblings unlike)
    return true;
  };
  const place = (type, pool) => {
    const opts = pool.filter((id) => !waypoints[id].type && legal(id, type));
    if (!opts.length) return false;
    waypoints[opts[pick(r, opts.length)]].type = type; return true;
  };
  // ---- the bosses first (their placement is fixed by rule), then the anchor calm in the middle column, then the pool
  if (leviathan) place('leviathan', ids);
  if (bounty) place('bounty', ids);
  if (C >= 4) place('maelstrom', ids);
  const mid = Math.floor((C - 1) / 2);
  if (!place('encounter', ids.filter((id) => waypoints[id].col === mid))) place('calm', ids.filter((id) => waypoints[id].col === mid));
  const free = ids.filter((id) => !waypoints[id].type), N = free.length, bag = [];
  for (const [type, t] of Object.entries(T)) if (t.share) for (let k = 0; k < Math.round(N * Math.max(0, t.share(danger, casks))); k++) bag.push(type);
  for (let i = bag.length - 1; i > 0; i--) { const j = pick(r, i + 1); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  for (const id of free) {
    const k = bag.findIndex((type) => legal(id, type));
    waypoints[id].type = k >= 0 ? bag.splice(k, 1)[0] : 'shoal'; // (no legal type left in the bag: the common leg)
  }
  for (const w of Object.values(waypoints)) w.strength = PASSAGE.strength(danger, w.col, w.type, casks);
  return { route, from, to, day: Math.floor(day), columns: C, rows: R, waypoints, edges: E,
    first: ids.filter((id) => waypoints[id].col === 0), last: ids.filter((id) => waypoints[id].col === C - 1) };
}

/** The ways on from a waypoint (or, given null, the first column). */
export const next = (chart, id) => (id == null ? chart.first : chart.edges.filter(([a]) => a === id).map(([, b]) => b));

/** Every lane through the sea chart, first column to last (for the tests, and the pier's drafting). */
export function lanes(chart) {
  const out = [], walk = (id, path) => { const n = next(chart, id); if (!n.length) out.push(path); else for (const b of n) walk(b, [...path, b]); };
  for (const s of chart.first) walk(s, [s]);
  return out;
}

// ---- the portents (Divination)

/** How far you see: the reckoning (0..1, the day's best: voyage.reckoning), Divination's widening (x1 .. x1.5:
 *  `divination.reckon`), and the weather of the island you leave (stageWx(...).lead: the pall x0.6, wonder x1.25). */
export const sight = (reckoning = 0, widen = 1, lead = 1) => (0.35 + 0.65 * Math.max(0, Math.min(1, reckoning))) * widen * lead;
/** A waypoint's confidence at a depth (1 the next waypoint: always exact), falling by 0.62 a column at Divination 1, 0.70 at 99. */
export const confidence = (depth, s, level = 1) => (depth <= 1 ? 1 : Math.max(0, Math.min(1, s * Math.pow(0.62 + 0.08 * (Math.max(1, level) / 99), depth - 1))));
/** What a confidence shows: the leg exactly, two candidates, three, its silhouette class, or a dim star. */
export const tierOf = (c, depth = 2) => (depth <= 1 || c >= 0.85 ? 'exact' : c >= 0.6 ? 'two' : c >= 0.35 ? 'three' : c >= 0.15 ? 'class' : 'star');

/** The portent of a waypoint at a depth: its tier, its candidates (the true type always among them, decoys drawn by the day's dice from
 *  the other types as the pool weighs them, the order shuffled so the first is not the truth), its class, its confidence. */
export function portent(chart, w, depth, s, level = 1) {
  const c = confidence(depth, s, level), tier = tierOf(c, depth), cls = classOf(w.type);
  const n = tier === 'exact' ? 1 : tier === 'two' ? 2 : tier === 'three' ? 3 : 0;
  if (!n) return { tier, candidates: [], cls: tier === 'class' ? cls : null, confidence: +c.toFixed(3) };
  const r = rngOf(`portent:${chart.route}:${chart.day}:${w.id}`), others = Object.keys(PASSAGE.types).filter((t) => t !== w.type && PASSAGE.types[t].share);
  const out = [w.type];
  while (out.length < n && others.length) out.push(others.splice(pick(r, others.length), 1)[0]);
  for (let i = out.length - 1; i > 0; i--) { const j = pick(r, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return { tier, candidates: out, cls, confidence: +c.toFixed(3) };
}

// ---- the rutter

/** What a rutter is worth: `ECON.passage.share` of what its sailed minutes would earn at the aim, by its rank (S 1.5 .. D 0.6) and how much of it
 *  was read before sailing, halved a game day after (the sea chart reseeds daily: yesterday's rutter is a curiosity). */
export function rutterWorth({ minutes = 5, rank = 'B', read = 0, daysOld = 0 } = {}) {
  const P = ECON.passage, f = P.rank[rank] ?? 1;
  return Math.round(ECON.perMinute * minutes * P.share * f * (0.5 + 0.5 * Math.max(0, Math.min(1, read))) * Math.pow(P.stale, Math.max(0, daysOld)));
}
