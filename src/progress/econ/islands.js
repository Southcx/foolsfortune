// ---------------------------------------------------------------------------------------
// THE LAYERS' ECONOMY: what a Well pays by its depth, what a Cogitomap of it is worth as the Well drifts, what each island wants (and
// how its want drifts and gluts), and what a hop across the Emocean costs and risks, as pure functions over the economy table, for the
// vertical slice (docs/plans/SYSTEMS.md, E1 to E5) and the simulator. One Courier, one purse: every layer pays in the same cubes.
//
// Prior art: Etrian Odyssey's floors (deeper is richer), Sid Meier's Pirates! and EVE's regional markets (prices that differ by port and
// drift, so hauling pays), Elite's trade runs (buy low, carry, sell high, under risk), FTL's fuel (travel spends what fighting earns), and
// radioactive decay for the drifting map (a half-life, so a map's worth falls smoothly and never quite to nothing).
//
//   wellPay(floors, foes) -> cubes      cogitomapWorth(runPay, charted) -> cubes (it keeps its worth)
//   demand(island, kind, day, sold) -> multiplier      purserPrice(worth, island, day, sold) -> cubes      haulProfit({ buy, sell, units, worth, distance, failed }) -> cubes
//   fuel(distance) -> cubes      spillChance(grade, units, hull) -> 0..1      crudeRun({ ship, grade, buy, sell, distance, failed }) -> cubes
//   wellSeed(wellId, day) -> uint32 (the Well as it is that day: a Cogitomap carries it)      wellYield(fill) -> 0..1      drawWell(fill, runs, hours) -> fill      islandRun(island, skill) -> { pay, minutes, risk }
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

const M = (n) => Math.round(n * ECON.perMinute);

/** A run down `floors` floors of a Well, beating `foes` FOEs on the way. */
export function wellPay(floors, foes = 0) {
  const W = ECON.well;
  let v = 0;
  for (let f = 0; f < floors; f++) v += W.perFloor * Math.pow(W.deeper, f);
  return M(v + foes * W.foe * W.perFloor * Math.pow(W.deeper, Math.max(0, floors - 1)));
}

/** A Cogitomap of a run paying `runPay`, charting `charted` (0..1) of the Well, `ageH` hours of play after it was charted. */
export const cogitomapWorth = (runPay, charted = 1) => Math.round(runPay * ECON.cogitomap.share * Math.max(0, Math.min(1, charted)));

/** What a purser on `island` pays for a Cogitomap worth `worth` (cogitomapWorth) on `day`, after `sold` maps sold there. */
export const purserPrice = (worth, island, day = 0, sold = 0) => Math.round(worth * demand(island, 'cogitomap', day, sold));

/** A string's own small hash, so an island's and a kind's phase and period are fixed and need no table of their own. */
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

/** What `island` pays for `kind` on `day` (days of play), as a multiplier of its worth, after `sold` units glutted it. */
export function demand(island, kind, day = 0, sold = 0) {
  const I = ECON.island, k = hash(`${island}:${kind}`), period = I.periodDays[0] + k * (I.periodDays[1] - I.periodDays[0]);
  let wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * (day / period + k));
  // (crude: the island's own place in the band, the wave a narrow swing about it: Entropolis sells it cheap, Margarite buys it dear)
  // (Cogitomaps likewise: Margarite buys them dear)
  const centre = ECON.crude.grades[kind] ? ECON.islands[island]?.crude : kind === 'cogitomap' ? ECON.islands[island]?.maps : undefined;
  if (centre !== undefined) wave = Math.max(0, Math.min(1, centre + (wave - 0.5) * 0.4));
  return Math.max(I.lo * 0.5, I.lo + (I.hi - I.lo) * wave - sold * (ECON.crude.grades[kind] ? ECON.crude.glut : I.glut));
}

/** The fuel for a hop of `distance` units across the Emocean. */
export const fuel = (distance) => M(ECON.emocean.fuelMin * distance);

/** Hauling `units` of a thing worth `worth` cubes, bought where it is wanted at `buy` and sold where it is wanted at `sell` (demand
 *  multipliers), `distance` away, with `failed` stages failed on the way (each loses a share of the cargo). */
export function haulProfit({ buy, sell, units, worth, distance, failed = 0 }) {
  const kept = units * Math.pow(1 - ECON.emocean.lose, failed);
  let got = 0;
  for (let i = 0; i < Math.round(kept); i++) got += worth * Math.max(0, sell - i * ECON.island.glut);
  return Math.round(got - units * worth * buy - fuel(distance));
}

/** The chance a failed stage spills crude of `grade`, `units` aboard (cubes never spill). */
export const spillChance = (grade, units, hull = 1) => Math.min(1, ECON.crude.spill * (ECON.crude.grades[grade]?.volatility ?? 1) * Math.sqrt(units / 10) * hull);

/** A crude run: a ship's hold of `grade` bought at `buy` and sold at `sell` (demand multipliers), `distance` away, `failed` stages
 *  failed on the way (each may spill the whole hold, by spillChance). The expected profit, fuel paid. */
export function crudeRun({ ship = 'tanker', grade = 'grief', buy = 0.8, sell = 1.3, distance = 4, failed = 0 }) {
  const S = ECON.ships[ship], G = ECON.crude.grades[grade];
  if (!S?.carries.includes('crude') || !G) return 0;
  const units = S.hold, worth = M(G.worth), keep = Math.pow(1 - spillChance(grade, units, S.hull ?? 1), failed);
  let got = 0;
  for (let i = 0; i < units; i++) got += worth * Math.max(0, sell - i * ECON.crude.glut);
  return Math.round(got * keep - units * worth * buy - fuel(distance) * (S.fill ?? S.slow));
}

/** What a Well yields at its `fill` (0..1). */
export const wellYield = (fill) => Math.max(ECON.wellFill.floor, Math.max(0, Math.min(1, fill)));
/** A Well's fill after `runs` runs and `hours` of rest. */
export const drawWell = (fill, runs = 0, hours = 0) => Math.max(0, Math.min(1, fill - runs * ECON.wellFill.perRun + hours * ECON.wellFill.refillPerH));

/** A Well run on `island` (ECON.islands) by a diver of `skill` (0 poor .. 1 masterful): what it pays when it is finished, how long it
 *  takes (five minutes a floor, a weaker diver turning back sooner), and the chance it ends early with nothing (a floor's risk, halved
 *  by skill, compounded over the floors run). The expected pay is pay x (1 - risk). */
export function islandRun(island, skill = 0.5) {
  const I = ECON.islands[island], W = ECON.well;
  const floors = Math.max(1, Math.round(I.floors * (0.6 + 0.4 * skill))), perFloorRisk = I.risk * (1.5 - skill);
  let v = 0;
  for (let f = 0; f < floors; f++) v += W.perFloor * Math.pow(I.deeper, f);
  v += (skill > 0.6 ? I.foes : 0) * W.foe * W.perFloor * Math.pow(I.deeper, floors - 1);
  return { pay: M(v), minutes: floors * 5, risk: 1 - Math.pow(1 - perFloorRisk, floors) };
}

/** The seed of a Well on a given day of play: a Well is a distortion that drifts, so it is a new layout each day, and a Cogitomap that
 *  carries `{ well, day }` is a ticket back to this one (docs/plans/SLICE.md). */
export const wellSeed = (wellId, day = 0) => Math.floor(hash(`well:${wellId}:${Math.floor(day)}`) * 4294967296) >>> 0;
