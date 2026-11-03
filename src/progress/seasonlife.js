// ---------------------------------------------------------------------------------------
// WHAT A SEASON DOES BEYOND ITS LOOK (docs/plans/GARDEN-COZY.md E2, GAPS.md G118): the plants spread by season, and some wild
// visitors come only in theirs. The look, the cue, the pieces and the material were built (seasons.js, gardenseason.js, gardenmood.js);
// this is the rest. A season is a modifier with a source you can see (the season is on the Sight, in the digest and in the sky): it
// changes how fast green grows and which Figments call, and it never kills a plant or a bed (Stardew Valley's season-end death is
// struck: an out-of-season bed rests). The runtime that spreads the green (world/garden/plants.js) and the one that lets visitors in
// (world/garden/awaken.js) are Petra's; the hooks are in docs/handoffs/petra/2026-11-03-from-dovina-garden-life.md.
//
// - PLANTS: a season sets how fast a cell steps a stage and how fast a full one seeds a neighbour (`PLANT_SEASON`: spring wakes, summer
//   holds, autumn drops seed but slows, winter rests). A ground has its own season (`GROUND_SEASON`: moss in spring, loam in autumn, silt
//   in winter) in which it keeps pace x`own`; winter's silt keeps a half pace where the other grounds rest.
// - VISITORS: `VISITOR_SEASONS[kind]` the seasons a kind comes in (a kind not listed comes in all four). A season out only holds the
//   visit; the count of visits a kind has kept stays (VISITORS settle after so many visits; a missed visit costs nothing).
//
// Prior art: Stardew Valley's crops by season (and its forage), Animal Crossing's seasonal critters and visitors that come only in their
// month, Harvest Moon's seasons that rest a field rather than kill it.
//
//   PLANT_SEASON[season] = { step, seed }   GROUND_SEASON[ground]   plantRate(season, ground) -> { step, seed }   rollOf(rate, r) -> whole steps
//   VISITOR_SEASONS[kind]   seasonOpen(kind, season) -> bool   visitorsIn(season, kinds) -> [kind]   (pure: scripts/garden-life.mjs)
// ---------------------------------------------------------------------------------------

/** How fast green grows by season (1 is the rule as it was). Nothing wilts for a season's sake: winter's 0 is a rest. */
export const PLANT_SEASON = {
  spring: { step: 1.5, seed: 1.5 }, summer: { step: 1, seed: 1 }, autumn: { step: 0.75, seed: 1.5 }, winter: { step: 0, seed: 0 },
};
/** The ground each green ground favours: its own season it keeps pace x`own`; a winter's silt keeps `rest` of summer's pace. */
export const GROUND_SEASON = { moss: 'spring', loam: 'autumn', silt: 'winter' };
export const OWN = { own: 1.25, rest: 0.5 };

/** The pace of a ground's green in a season: { step, seed } (0 for a ground that does not spread). */
export function plantRate(season, ground) {
  const P = PLANT_SEASON[season]; if (!P || !GROUND_SEASON[ground]) return { step: 0, seed: 0 };
  if (GROUND_SEASON[ground] === season && P.step === 0) return { step: OWN.rest, seed: OWN.rest }; // (its own season, where the others rest: silt in winter)
  if (GROUND_SEASON[ground] === season) return { step: +(Math.max(P.step, 1) * OWN.own).toFixed(3), seed: +(Math.max(P.seed, 1) * OWN.own).toFixed(3) };
  return { ...P };
}
/** Whole steps this game hour from a pace and a draw `r` (0..1): the whole part always, the fraction by the draw (a seeded draw: the same twice). */
export const rollOf = (rate, r = 0) => Math.floor(rate) + (r < rate - Math.floor(rate) ? 1 : 0);

/** The seasons a wild kind of visitor comes in (progress/realm.js VISITORS; a kind not listed comes in all four). */
export const VISITOR_SEASONS = {
  glint: ['spring', 'summer'],          // (they come with the thaw to deep water, and are gone by the first frost)
  clapperjar: ['summer', 'autumn'],     // (the merry ones come for the lanterns of the warm months)
  lobber: ['autumn', 'winter'],         // (the drill yard's hardest hours are the cold ones)
  wisp: ['autumn', 'winter'],           // (the long nights)
};
export const seasonOpen = (kind, season) => !VISITOR_SEASONS[kind] || VISITOR_SEASONS[kind].includes(season);
export const visitorsIn = (season, kinds = []) => kinds.filter((k) => seasonOpen(k, season));
