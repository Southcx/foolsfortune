// ---------------------------------------------------------------------------------------
// HOW FAST A BED GROWS (docs/plans/SPIRIT-GARDEN.md section 7, items 6 and 11; GAPS.md G235): a bed on its own feeling's ground grows
// GROWTH.ground times as fast, watered with its own feeling GROWTH.water times (both: the product). These were constants read by
// nothing; this is the rule that reads them. It is a modifier with a source you can see (the ground the god hand painted, the water
// the Dantian's lake or a spring pours), never a change to the base: a bed on bare ground grows as it always did.
//
// The rule is pure; the herb terraces' beds are progress/garden.js (`surround`), the spore beds' progress/sporebeds.js (`surround`), and
// what the ground and the water at a plot are is the world's to say (world/garden/clay.js `groundOf`, waterworks `feelingAt`; the hook
// is in docs/handoffs/petra/2026-11-03-from-dovina-garden-life.md).
//
// Prior art: Stardew Valley's fertiliser and sprinklers (growth sped by what you put round a crop), Viva Pinata's soil that suits
// a plant, and From Dust's water that makes ground fertile.
//
//   growthK({ feeling, ground, water }) -> x1 .. x1.5625   (ground: GROUND's id; water: a feeling or null)
// ---------------------------------------------------------------------------------------
import { GROUND, GROWTH } from './realm.js';

/** The pace of a bed of `feeling` on `ground` (a GROUND id) and watered with `water` (a feeling): 1 unless one matches its own. */
export function growthK({ feeling = null, ground = null, water = null } = {}) {
  if (!feeling) return 1;
  return +((GROUND[ground]?.feeling === feeling ? GROWTH.ground : 1) * (water === feeling ? GROWTH.water : 1)).toFixed(4);
}
