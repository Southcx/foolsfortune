// ---------------------------------------------------------------------------------------
// WHAT THE LIVELIHOODS PAY: the pay of the livelihoods still to be built, as pure functions over the economy table (econ/table.js), so
// each is simulated (scripts/economy.mjs) before anyone builds it, and the game and the simulator read the same rule (docs/ECONOMY.md,
// "The livelihoods": pay by the quality of play, not the time spent). Nothing here moves a cube: the building systems call these and
// pay through game.cubes.
//
// Prior art: Rhythm Heaven's and DDR's grades (the score is the pay), OSRS Slayer (assignments by class, points for a streak), Stardew
// Valley's quality stars (a better-made thing sells for more), Animal Crossing's busker (an audience tires of one song).
//
//   buskPay(minutes, accuracy, repeats) -> cubes      commissionPay(cls, streak) -> cubes      potPay(accuracy, prestige) -> cubes
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

const M = (n) => Math.round(n * ECON.perMinute);
const q01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

/** A song of `minutes` played at `accuracy` (0..1), the `repeats`th time this hour at this stage (0 the first). */
export function buskPay(minutes, accuracy, repeats = 0) {
  const B = ECON.busk, w = B.floor + (B.ceil - B.floor) * Math.pow(q01(accuracy), B.power);
  return M(minutes * w * Math.pow(B.tire, Math.max(0, repeats)));
}

/** A commission on a Figment of class `cls` (0 Guppy .. 4 Leviathan), the `streak`th in a row (1 the first). */
export function commissionPay(cls, streak = 1) {
  const C = ECON.commission, base = M(C.minutes[Math.max(0, Math.min(4, cls))]);
  return streak > 0 && streak % C.streakEvery === 0 ? base * C.streakMult : base;
}

/** A thrown pot whose shape matched at `accuracy` (0..1), glazed at `prestige` (looks: earthenware .. court). */
export function potPay(accuracy, prestige = 'earthenware') {
  const P = ECON.pot, w = P.floor + (P.ceil - P.floor) * Math.pow(q01(accuracy), P.power);
  return M(P.minutes * w + (P.glaze[prestige] || 0));
}
