// ---------------------------------------------------------------------------------------
// WHAT THE LIVELIHOODS PAY: the pay of the livelihoods still to be built, as pure functions over the economy table (econ/table.js), so
// each is simulated (scripts/economy.mjs) before anyone builds it, and the game and the simulator read the same rule (docs/ECONOMY.md,
// "The livelihoods": pay by the quality of play, not the time spent). Nothing here moves a cube: the building systems call these and
// pay through game.cubes.
//
// Prior art: Rhythm Heaven's and DDR's grades (the score is the pay), Animal Crossing's busker (an audience tires of one song).
//
//   buskPay(minutes, accuracy, repeats) -> cubes   (commissions and throwing pots for pay were cut by the owner, 2026-10-09)
//   bountyPay(cls) -> cubes (a named stray, mostly out of Entropolis, paid by the King's marque, less Letty's cut)
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

const M = (n) => Math.round(n * ECON.perMinute);
const q01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

/** A song of `minutes` played at `accuracy` (0..1), the `repeats`th time this hour at this stage (0 the first). */
export function buskPay(minutes, accuracy, repeats = 0) {
  const B = ECON.busk, w = B.floor + (B.ceil - B.floor) * Math.pow(q01(accuracy), B.power);
  return M(minutes * w * Math.pow(B.tire, Math.max(0, repeats)));
}

/** A hunt's base worth for class `cls` (0 Guppy .. 4 Leviathan): ECON.hunt's minutes of play. */
const huntWorth = (cls) => M(ECON.hunt.minutes[Math.max(0, Math.min(4, cls))]);

/** A bounty on a named stray of class `cls` (0 Guppy .. 4 Leviathan): a hunt's worth times ECON.bounty.mult, less Letty's cut. */
export const bountyPay = (cls) => Math.round(huntWorth(cls) * ECON.bounty.mult * (1 - ECON.bounty.cut));
