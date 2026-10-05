// ---------------------------------------------------------------------------------------
// THE EMOCEAN'S CHART AND ITS STAGES: where a hop goes, what it costs, and what comes at the ship on the way (docs/plans/SLICE.md, E4).
// Data and pure functions; the pier, the ship and the rail are Petra's (Calissa dresses them, Wanda scores the stage's cue).
//
// THE NODE MAP. The Islands of Ego sit on the Law-Chaos line (ECON.islands[id].law, -2 .. +2), and a hop's distance is how far apart
// they sit on it (`perLaw` units a step), so crossing from the King's island to the Queen's costs the most fuel. A node can be locked
// (the slice locks Entropolis: SLICE.md). Fuel is `fuel(distance)` (islands.js) times the ship's `burn`. The stage runs
// the length of its cue for every ship (the music is the clock: Wanda's Crude Sea is 100 bars of 1.5 s); `slow` is the simulator's haul time.
//
// A STAGE is one rail of about two minutes, authored once and paced to its cue (Wanda's), whose waves are keyed to the stage's
// fraction (0 .. 1), not to seconds, so the rail can be stretched to the music. The waves are written by ROLE (a school that swims in
// a formation, a darter that cuts across the lanes, a heavy that sits ahead and soaks blows), and the route fills each role with a
// Figment class from its DANGER: the mean of its ends' places on the line (toward Law calmer, toward Chaos worse, as the islands' Wells
// are: ECON.islands), plus a quarter of the line it crosses (a long crossing goes further from any shore). So one authored stage serves every route: the Margarite run is Guppies and Barracudas with a Marlin at the end, an Entropolis run
// Barracudas and Marlins with a Whale. The day's seed shifts which lane each wave comes from (the same route plays a little differently each day),
// never the order or the counts (learnable, as an arcade stage is).
//
// WHAT IT BEARS. A stage is failed when the ship has taken `bears` hits (not "shield": that is the Courier's Lachryma pool); failing loses `ECON.emocean.lose` of the cargo, and crude
// may spill (`spillChance`). A stage pays no cubes: the Emocean is the travel layer, a drain (fuel) and a risk (cargo), and its reward is
// the price at the other end (DESIGN.md, section 11). How cleanly it was sailed is Ouranurgy EXP (domains.js) and the ledger's records.
//
// THE RECKONING (the owner, R57: "Divination is a critical skill for charting the course between Islands of Ego"). A route's
// reckoning is how much of its crossing the Courier has divined, 0 .. 1: it grows by surveying the sea from the pier before sailing (a
// Divination act whose quality is how well it was dowsed) and by reading the waves while sailing. It buys KNOWLEDGE, never numbers:
// each wave's lane is marked ahead of it (a glyph pop on the rail, `lead` seconds early, up to two bars at full reckoning), so the skill
// is reading the sea, and the gun and the dodge are still the player's. The lanes drift with the day, so a reckoning is of a day, as a
// Cogitomap is; the ledger keeps the best for the achievements. And a reckoning is the way to a node: a locked node opens for good once
// a route to it from an open node has been reckoned to `open` at the pier (after the slice: Entropolis is found by divining the way
// there, so the Chaos end of the line is reached through Divination).
//
// Prior art: Star Fox 64 (two-minute rail stages with an authored wave order, a hit count and a medal for a clean run, a breather before
// the last push, a route map whose harder paths pay off), Rez (waves keyed to the music's bars, so the stage and its cue are one thing),
// Panzer Dragoon (lanes around the rail, threats from the sides), the shoot-'em-up's wave table (role, formation, entry), FTL's
// sector map (nodes, fuel per jump, danger by where you are) and its long-range scanners (knowing what waits at a beacon), Sunless Sea
// (the zee charted by sailing it; a port found, not given), and dead reckoning (a course known by working it out).
//
//   NODES[id] = { id, law, locked }      hop(from, to, ship, open?) -> { distance, fuel, seconds, danger } | null   (open(id): a node found)
//   STAGE = { seconds, bears, waves: [{ at, role, count, formation, lane }] }      ROLE_CLASS[role](danger) -> class 0..4
//   stagePlan(from, to, day) -> [{ at, role, cls, count, formation, lane }]      stageQuality({ hits, bears, downed, spawned }) -> 0..1
//   RECKON = { lead, open }      routeId(a, b) -> 'a-b'      reckonLead(reckoning) -> seconds      opensNode(reckoning) -> bool
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';
import { fuel } from './islands.js';

/** The Figment classes (docs/ECONOMY.md, commissions), small to great. */
export const CLASSES = ['Guppy', 'Barracuda', 'Marlin', 'Whale', 'Leviathan'];

/** The node map: one node an island, where it sits on the line, and whether it can be reached yet (the slice: Entropolis waits). */
export const NODES = Object.fromEntries(Object.entries(ECON.islands).map(([id, isl]) => [id, { id, name: isl.name, law: isl.law, locked: id === 'entra' }]));

/** Distance a step of the line (so Anagami to Margarite is 4, a crude run's distance in the simulator; King to Queen is 8). */
export const CHART = { perLaw: 2 };

/** A hop from one node to another in a ship: its distance, fuel (cubes), how long the stage runs, and its danger (-1.5 calm .. +2 wild).
 *  Null when either end is unknown or locked, or the ends are the same. */
export function hop(from, to, ship = 'sloop', open = (id) => !NODES[id].locked) {
  const a = NODES[from], b = NODES[to];
  if (!a || !b || a === b || !open(from) || !open(to)) return null;
  const distance = Math.abs(a.law - b.law) * CHART.perLaw, S = ECON.ships[ship] || {};
  return { distance, fuel: Math.round(fuel(distance) * (S.burn ?? S.slow ?? 1)), seconds: STAGE.seconds, danger: (a.law + b.law) / 2 + Math.abs(a.law - b.law) / 4 };
}

/** The stage, authored once. `at` is the fraction of the stage a wave enters; `lane` -1 left, 0 ahead, 1 right (null: the day picks).
 *  Its shape is Star Fox's: a calm opening to learn the ship, schools that teach the gun, darters that teach the dodge, a breather, a
 *  mixed push, and a heavy at the end. 150 s, the length of its cue: every `at` falls on a bar line
 *  of Wanda's Crude Sea (src/music/emocean.js: 100 bars of 1.5 s; the breather is bars 50 to 62, Margarite in sight from bar 96). */
export const STAGE = {
  seconds: 150,
  bears: 6,
  waves: [
    { at: 0.08, role: 'school', count: 5, formation: 'line',   lane: 0 },     // the first shots: a line straight ahead
    { at: 0.16, role: 'school', count: 6, formation: 'vee',    lane: null },
    { at: 0.26, role: 'school', count: 8, formation: 'pincer', lane: 0 },     // from both sides at once
    { at: 0.36, role: 'darter', count: 2, formation: 'dash',   lane: null },  // the first thing to dodge, not shoot
    { at: 0.44, role: 'darter', count: 3, formation: 'dash',   lane: null },
    // 0.50 .. 0.62: a breather (the crude sea and the sky: Calissa's to fill)
    { at: 0.62, role: 'school', count: 6, formation: 'ring',   lane: 0 },
    { at: 0.68, role: 'darter', count: 2, formation: 'dash',   lane: null },
    { at: 0.74, role: 'school', count: 8, formation: 'vee',    lane: null },
    { at: 0.84, role: 'heavy',  count: 1, formation: 'hold',   lane: 0 },     // sits ahead and soaks blows: the stage's last test
    { at: 0.86, role: 'school', count: 4, formation: 'line',   lane: null },  // its escort
  ],
};

/** Which class fills each role at a danger (-2 .. +2): a school is the small fry, a darter one class up, a heavy two. */
const base = (danger) => Math.max(0, Math.round(danger / 2 + 0.5));   // Margarite run (-0.5): 0; King to Queen (+1) and Anagami-Entropolis (+1.5): 1
export const ROLE_CLASS = {
  school: (d) => Math.min(4, base(d)),
  darter: (d) => Math.min(4, base(d) + 1),
  heavy:  (d) => Math.min(4, base(d) + 2),
};

/** A small hash (FNV-1a) to a 0..1 float, so the day's lanes are the same for everyone that day. */
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;   // murmur3's finaliser: FNV alone barely moves on a last character
  return (h >>> 0) / 4294967296;
}

/** The stage as it plays on a route on a day: every wave with its class and lane. Null for a hop that cannot be made. */
export function stagePlan(from, to, day = 0) {
  const h = hop(from, to);
  if (!h) return null;
  const route = [from, to].sort().join('-');
  return STAGE.waves.map((w, i) => ({
    at: w.at, role: w.role, cls: ROLE_CLASS[w.role](h.danger), count: w.count, formation: w.formation,
    lane: w.lane ?? (Math.floor(hash01(`stage:${route}:${Math.floor(day)}:${i}`) * 3) - 1),
  }));
}

/** How cleanly a stage was sailed (Ouranurgy's quality): half of what it could bear left unspent, half the share of what came at the ship that was downed.
 *  A clean, thorough run is 1; scraping through with nothing shot is about 0. */
export function stageQuality({ hits = 0, bears = STAGE.bears, downed = 0, spawned = 1 }) {
  const kept = 1 - Math.min(1, hits / Math.max(1, bears)), shot = Math.min(1, downed / Math.max(1, spawned));
  return 0.5 * kept + 0.5 * shot;
}

/** THE RECKONING: how far ahead a wave's lane is marked at full reckoning (seconds: two bars of the cue), and the reckoning at the pier
 *  that opens a locked node for good. */
export const RECKON = { lead: 3, open: 0.6 };
/** A route's name, the same both ways (the ledger's records are `emocean.reckon.<route>`, percent). */
export const routeId = (a, b) => [a, b].sort().join('-');
/** Seconds of warning a wave gets at a reckoning of 0 .. 1 (none uncharted). */
export const reckonLead = (r, widen = 1) => RECKON.lead * widen * Math.max(0, Math.min(1, r)); // (widen: game.psyche.widen('divination.reckon'))
/** Whether a reckoning made at the pier is enough to open the node at the route's far end. */
export const opensNode = (r) => r >= RECKON.open;
