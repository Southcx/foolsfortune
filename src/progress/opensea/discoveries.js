// ---------------------------------------------------------------------------------------
// DISCOVERIES ON THE OPEN SEA (docs/plans/OPEN-SEA.md section 4): a thing found off the lanes (an islet, a monument under the surface, a
// wreck, a phenomenon at its hour, a seep of crude) is the Courier's to report at a dock, once, for a fee by its tier. Found and not
// reported, it waits in the log of the voyage; its fee halves every `halfLife` game days unreported (the news goes stale, as a rutter
// does), so a voyage ends at a dock. Charting a square is free; the fee is for what was in it.
//
// Prior art: Skies of Arcadia's Discoveries (sold to the Sailors' Guild, worth more the stranger the find); Sunless Sea's port reports
// (a sight sold at the Admiralty, worth less told late); The Legend of Zelda: The Wind Waker (every square has its secret).
//
//   noticed(feature, { phase, weather }) -> bool   (a phenomenon only at its hour or in its weather; the rest always, once in its square)
//   discoveryFee(tier, gameDaysLate = 0) -> cubes   seaTotal(grid) -> cubes (the whole sea's fees, reported at once)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

const D = ECON.openSea.discovery;

/** Whether a feature can be seen now: a phenomenon keeps its hour or its weather; everything else is there to be found. */
export function noticed(feature, { phase = 'day', weather = null } = {}) {
  const w = feature.when;
  if (!w) return true;
  return (w.phase && w.phase === phase) || (w.weather && w.weather === weather);
}

/** What a dock pays for a find of `tier`, reported `gameDaysLate` game days after it was found. */
export const discoveryFee = (tier, gameDaysLate = 0) =>
  Math.round((D[tier] ?? D.common) * ECON.perMinute * Math.pow(0.5, Math.max(0, gameDaysLate) / D.halfLife));

/** The whole sea's fees, every find reported fresh: the open sea's bounded faucet (the plan's three hours of the aim). */
export const seaTotal = (grid) => grid.squares.reduce((n, s) => n + s.features.reduce((m, f) => m + discoveryFee(f.tier), 0), 0);
