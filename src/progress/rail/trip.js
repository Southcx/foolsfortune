// ---------------------------------------------------------------------------------------
// THE TRIP'S PRESSURES: what makes drafting a passage a decision (docs/plans/PASSAGE.md section 14; the owner, 2026-10-08: "do all
// five", "keep a keen eye out for synergies"). Pure functions over the sea chart (econ/passage.js) and the ships (ships.js); the voyage
// keeps the state, the pier and the rail call these.
//
//   1. THE HULL CARRIES: hits taken on one leg stay until a haven mends them (Slay the Spire's HP across a run; FTL's hull). A calm is a
//      choice, Slay the Spire's campfire: MEND (half the hull back) or RECKON (the portents ahead read again, a quarter sharper). An
//      encounter mends LEG.mend and then offers its own choice. No free mend before a boss: the portent shows the boss, so the haven
//      before it is yours to route through (the old "mended before a boss leg" is withdrawn: it made the route meaningless).
//   2. FUEL IS THE TRIP'S BUDGET (FTL's fuel, Sunless Sea's): a ship's TANK is filled at the pier in measures; each waypoint burns its
//      type's measure times the ship's BURN, a diagonal step a little more. Short of the next waypoint's burn, the ship is ADRIFT: the
//      current carries it to a waypoint ahead (no choice; straight on most likely), burning nothing, its legs capped at a C, until a
//      haven sells fuel (the Purser's buoy at a calm, the Bourse). Every sea chart has a lane a full tank sails, filling at its calms
//      (checked); a sixth of a sloop's lanes are out of a full tank's reach even with the buoys, so a wild lane is a fuel plan as well as a fight.
//   3. THE DAY'S BEST: the sea chart is the same for everyone on a route that game day (econ/passage.js), so it is a daily challenge
//      for free (Spelunky's daily, Slay the Spire's daily climb): the best score on it is kept per route and game day, a rutter carries
//      its maker's score and run, and the Glass races only a run of THIS sea chart (yours today, or the rutter's).
//   4. THE FEELING ON THE CHART: a waypoint's feeling sets the damage type its foes carry (TYPE_OF) and how its shots fall between the
//      forms (bright feelings throw astral shots, dark ones umbral): read before you commit. The draught a leg leaves (the feeling you
//      absorbed) TRUMPS or is trumped by the next waypoint's foes (combat/types.js TRUMPS): a lane can be drafted so each draught trumps the next. Crude
//      crosses a waypoint of its opposite feeling unsteadily (spills x1.5) and its own calmly (x0.75).
//   5. THE STORM MARK (econ/passage.js STORM): a class stronger, thicker patterns, never unavoidable; cleared, its leg's score and the
//      rutter's worth x1.25.
//
//   TRIP   burnOf(chart, fromId, toId, ship) -> measures   laneBurn(chart, path, ship)   sailable(chart, path, ship, fuel?) -> bool
//   cheapestLane(chart, ship) -> { path, burn }
//   start(ship, fuel?) -> state   arrive(state, chart, id, { hits, cleared }) -> state   havenChoices(state, w, ship) -> [ids]
//   choose(state, id, ship) -> state   drift(chart, id, rng) -> id   adrift(state, chart, id, ship) -> bool   formSkew(feel) -> astral share
//   draughtTrump(prevFeel, feel) -> 'trumps' | 'trumped' | null   spillAt(grade, feel) -> x   boardKey(chart)   better(best, chart, score) -> bool
// ---------------------------------------------------------------------------------------
import { SHIPS } from './ships.js';
import { LEG } from '../econ/emocean.js';
import { STORM, next, lanes, classOf } from '../econ/passage.js';
import { TYPE_OF, OPPOSITE } from '../weather.js';
import { TRUMPS } from '../combat/types.js';

export const TRIP = {
  /** A waypoint's burn in measures by its type (a storm or a chase burns more, a calm drifts), and a diagonal step's extra. */
  burn: { shoal: 1, wreckers: 1.25, eyewall: 1.5, graveyard: 1, calm: 0.5, encounter: 0.75, maelstrom: 1.5, bounty: 1.25, leviathan: 1.5 },
  diagonal: 1.15,
  /** A storm burns a quarter more again. */
  storm: 1.25,
  /** The campfire: a calm mends this share of the hull, or reckons the waypoints ahead a quarter sharper. */
  calmMend: 0.5, reckon: 0.25,
  /** Adrift: a straight step is this much likelier than a diagonal; a leg sailed adrift tops out at this rank. */
  driftStraight: 2, driftRank: 'C',
  /** How the shots of a waypoint fall between the forms: the astral share by feeling (fair: half and half). */
  astral: { wonder: 0.75, mirth: 0.65, desire: 0.5, grief: 0.35, dread: 0.25 },
  /** Crude at a waypoint of its own feeling and of its opposite. */
  spill: { same: 0.75, opposite: 1.5 },
};

/** The measures a ship burns sailing from one waypoint to the next (null: from the pier into the first column). */
export function burnOf(chart, fromId, toId, ship = 'sloop') {
  const w = chart.waypoints[toId], a = fromId && chart.waypoints[fromId];
  const diag = a && a.row !== w.row ? TRIP.diagonal : 1;
  return (TRIP.burn[w.type] ?? 1) * (w.storm ? TRIP.storm : 1) * diag * (SHIPS[ship]?.burn ?? 1);
}
export const laneBurn = (chart, path, ship) => path.reduce((sum, id, i) => sum + burnOf(chart, i ? path[i - 1] : null, id, ship), 0);
/** Whether a ship sails a lane on what it carries: the burn between the pier and a calm (where the buoy fills the tank), and between
 *  calms, never more than a full tank. */
export function sailable(chart, path, ship = 'sloop', fuel = SHIPS[ship].tank) {
  let left = fuel;
  for (let i = 0; i < path.length; i++) {
    left -= burnOf(chart, i ? path[i - 1] : null, path[i], ship);
    if (left < -1e-9) return false;
    if (chart.waypoints[path[i]].type === 'calm') left = SHIPS[ship].tank;
  }
  return true;
}
/** The lane a ship sails on the least fuel. */
export function cheapestLane(chart, ship = 'sloop') {
  let best = null;
  for (const path of lanes(chart)) { const burn = laneBurn(chart, path, ship); if (!best || burn < best.burn) best = { path, burn }; }
  return best;
}

/** A trip begun: the hull whole, the tank as filled at the pier (full by default). */
export const start = (ship = 'sloop', fuel = null) => ({ ship, hull: SHIPS[ship].bears, fuel: fuel ?? SHIPS[ship].tank, at: null, feel: null, sharp: 0, adrift: false, storms: 0, path: [] });

/** Arriving at a waypoint and sailing it: its burn is paid (none when adrift), its hits stay on the hull, a haven mends, a storm cleared
 *  counts; the draught it leaves is its feeling (what you absorbed there). */
export function arrive(state, chart, id, { hits = 0, cleared = true } = {}) {
  const w = chart.waypoints[id], s = { ...state, path: [...state.path, id] };
  if (!s.adrift) s.fuel = Math.max(0, s.fuel - burnOf(chart, s.at, id, s.ship));
  s.at = id; s.hull = Math.max(0, s.hull - hits); s.feel = w.feel ?? s.feel;
  if (w.type === 'encounter') s.hull = Math.min(SHIPS[s.ship].bears, s.hull + LEG.mend);
  if (w.storm && cleared) s.storms++;
  return s;
}

/** What a haven offers (the encounter's own choice is encounters.js's): a calm's campfire, and fuel where a buoy is. */
export function havenChoices(state, w, ship = state.ship) {
  if (w.type === 'calm') return ['mend', 'reckon', ...(state.fuel < SHIPS[ship].tank ? ['fuel'] : [])];
  return [];
}
/** A calm's choice taken (fuel is bought besides, not instead: the buoy is a shop, the campfire a choice). */
export function choose(state, id, ship = state.ship) {
  const S = SHIPS[ship], s = { ...state };
  if (id === 'mend') s.hull = Math.min(S.bears, s.hull + Math.ceil(S.bears * TRIP.calmMend));
  if (id === 'reckon') s.sharp += TRIP.reckon;
  if (id === 'fuel') { s.fuel = S.tank; s.adrift = false; }
  return s;
}

/** Whether the ship can no longer pay for any way on (the current takes it). */
export const adrift = (state, chart, id = state.at) => next(chart, id).every((n) => burnOf(chart, id, n, state.ship) > state.fuel + 1e-9);
/** Where the current carries a ship adrift: a way on, straight likelier than a diagonal. */
export function drift(chart, id, rng) {
  const n = next(chart, id), a = id && chart.waypoints[id];
  const w = n.map((b) => (!a || chart.waypoints[b].row === a.row ? TRIP.driftStraight : 1));
  let x = rng() * w.reduce((p, q) => p + q, 0);
  for (let i = 0; i < n.length; i++) { x -= w[i]; if (x <= 0) return n[i]; }
  return n[n.length - 1];
}

/** The share of a waypoint's shots that are astral (the rest umbral): a ship that cannot dive dodges the umbral ones. */
export const formSkew = (feel) => TRIP.astral[feel] ?? 0.5;
/** The draught of the last waypoint against the next one's foes: your draught's damage type trumps theirs, theirs trumps yours, or neither. */
export function draughtTrump(prev, feel) {
  if (!prev || !feel) return null;
  const a = TYPE_OF[prev], b = TYPE_OF[feel];
  return TRUMPS[a] === b ? 'trumps' : TRUMPS[b] === a ? 'trumped' : null;
}
/** A cask's spill chance at a waypoint, by its grade against the waypoint's feeling. */
export const spillAt = (grade, feel) => (!feel ? 1 : feel === grade ? TRIP.spill.same : OPPOSITE[grade] === feel ? TRIP.spill.opposite : 1);

/** The day's best: one record a route, replaced when the game day turns or a score beats it. */
export const boardKey = (chart) => `${chart.route}:${chart.day}`;
export const better = (best, chart, score) => !best || best.key !== boardKey(chart) || score > best.score;
/** A leg's score, a storm cleared counted up. */
export const legScore = (score, w) => Math.round(score * (w?.storm ? STORM.pays : 1));
/** Whether a waypoint is a haven (where the hull mends and fuel is sold). */
export const isHaven = (w) => classOf(w.type) === 'haven';
