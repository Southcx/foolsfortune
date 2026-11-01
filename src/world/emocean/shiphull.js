// ---------------------------------------------------------------------------------------
// THE SHIP'S HULL ON THE RAIL AS CRACKS (SUBSTRATE.md F1, South's ruling 2026-11-01: one rule for any shelled body, the ships among them).
// A crossing's run keeps its hull as a vessel state of the ship's class (progress/combat/vessel.js FORMS: bow, stern, port, starboard,
// mast, helm), every hit laid on it through `blowOn`; `run.hits` stays the readout every reader knew (the rail readout's pips, the
// results' tally, the trip's carried hull, the mends), now read off the cracks and written back as cracks. A hit's crack is the form's,
// scaled by the class's own bears over the bears this run has (Resilience's widening), so a pounding spread round the hull breaks it at
// exactly `bears` as before, and blows kept on one region (`region`) or a blow's `shatter` break it sooner.
// Prior art: the vessel's rule itself (Dovina's); Star Fox 64's hull, which the readout still counts in.
//
//   hullCracks(run, ship, bears)   run.hits (get: hits borne; set: cracks laid or mended to it)   run.hullCracks.state (the vessel state)
//   run.hullCracks.strike(n, { region, shatter }) -> { region, broke, shatter }   (n hits, each a blow; shattered: the hull is gone)
// ---------------------------------------------------------------------------------------
import { FORMS, newVessel, blowOn, mend, crackSum } from '../../progress/combat/vessel.js';
import { SHIPS } from '../../progress/rail/ships.js';

/** The least cracked region (the first on a tie): where a hit with no place of its own lands, so a pounding spreads round the hull. */
const leastOf = (v) => Object.keys(v.crack).reduce((a, b) => (v.crack[b] < v.crack[a] ? b : a));

export function hullCracks(run, ship, bears) {
  const form = FORMS[ship] ? ship : 'sloop', n0 = Math.max(1, bears | 0);
  const k = (SHIPS[form]?.bears ?? n0) / n0, per = FORMS[form].crack * k; // (a hit's crack: Resilience's extra bears make each one less)
  let v = newVessel(form);
  const hitsOf = () => Math.min(n0, Math.round(crackSum(v) / per));
  const strike = (n = 1, { region = null, shatter = 0 } = {}) => {
    let out = { region: null, broke: false, shatter: false };
    for (let i = 0; i < n; i++) {
      const r = region && region in v.crack ? region : leastOf(v), b = blowOn(v, { region: r, k, shatter });
      v = b.state; out = { region: r, broke: out.broke || b.broke, shatter: out.shatter || b.shatter };
    }
    return out;
  };
  Object.defineProperty(run, 'hits', {
    enumerable: true, configurable: true, get: hitsOf,
    set: (n) => { const now = hitsOf(), want = Math.max(0, Math.min(n0, Math.round(n || 0))); if (want < now) v = mend(v, (now - want) * per); else if (want > now) strike(want - now); },
  });
  run.hullCracks = { get state() { return v; }, strike, form };
  return run.hullCracks;
}
