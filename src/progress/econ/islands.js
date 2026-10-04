// ---------------------------------------------------------------------------------------
// THE LAYERS' ECONOMY: what a Well pays by its depth, what a Cogitomap of it is worth as the Well drifts, what each island wants (and
// how its want drifts and gluts), and what a hop across the Emocean costs and risks, as pure functions over the economy table, for the
// vertical slice (docs/plans/SYSTEMS.md, E1 to E5) and the simulator. One Courier, one purse: every layer pays in the same cubes.
//
// Prior art: Etrian Odyssey's floors (deeper is richer), Sid Meier's Pirates! and EVE's regional markets (prices that differ by port and
// drift, so hauling pays), Elite's trade runs (buy low, carry, sell high, under risk), FTL's fuel (travel spends what fighting earns), and
// radioactive decay for the drifting map (a half-life, so a map's worth falls smoothly and never quite to nothing).
//
//   wellPay(floors, foes) -> cubes      cogitomapWorth(runPay, charted, ageH) -> cubes
//   demand(island, kind, day, sold) -> multiplier      haulProfit({ buy, sell, units, worth, distance, failed }) -> cubes
//   fuel(distance) -> cubes
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
export const cogitomapWorth = (runPay, charted = 1, ageH = 0) => Math.round(runPay * ECON.cogitomap.share * Math.max(0, Math.min(1, charted)) * Math.pow(0.5, ageH / ECON.cogitomap.halfLifeH));

/** A string's own small hash, so an island's and a kind's phase and period are fixed and need no table of their own. */
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

/** What `island` pays for `kind` on `day` (days of play), as a multiplier of its worth, after `sold` units glutted it. */
export function demand(island, kind, day = 0, sold = 0) {
  const I = ECON.island, k = hash(`${island}:${kind}`), period = I.periodDays[0] + k * (I.periodDays[1] - I.periodDays[0]);
  const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * (day / period + k));
  return Math.max(I.lo * 0.5, I.lo + (I.hi - I.lo) * wave - sold * I.glut);
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
