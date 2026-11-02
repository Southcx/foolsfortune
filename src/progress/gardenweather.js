// ---------------------------------------------------------------------------------------
// GALL AND FURY IN THE SPIRIT GARDEN (docs/plans/GALL-AND-FURY.md 8; GAPS G111). The garden stays five phases: Gall and Fury come in only
// as weather and water, and they spoil what they touch. The garden's rain is your draught falling as hard as your mental state is liquid
// (realm.js rainOf; world/garden/waterworks.js), and its water keeps a share a feeling (world/garden/water.js, seven channels), so these
// rules read only what is already there. Modifiers with a source you can see (base change bad, modifiers good): the rain on the screen and
// the water's colour on the ground are the source, and nothing here changes how a plant, a stroke or the water works at rest.
//   GALL sours: a plant in water led by Gall wilts a stage a game hour as on dead ground (plants.js's own rule for ash and slate, so the
//     rate is the garden's drought rate, never a new one) and grows no stage while soured; washed by fair water poured over it, or mopped.
//     Gall cancels with nothing (its opposite, Desire, is Fury's), so it lingers: its share fades at a third of the others' rate.
//   FURY bakes: while Fury rain falls at `stiffAt` or harder, the hand's matter strokes (Scoop, Pour, Shape, Carve, Sculpt) on that
//     planetoid are `stiff` as strong (clay baked hard); moss under it for `scorch` game hours turns to ash (the moss ground's fire phase
//     made literal, From Dust's lava over grass).
//
// Prior art: Viva Pinata's sours (a garden spoiled by what you let in, cleaned, never ruined), From Dust (fire over land), Harvest Moon and
// Stardew's crops lost to a storm or a drought (a stage lost, never the bed), and Splatoon's ink that only its own colour washes.
//
//   SPOIL = { gall: { leads, linger }, fury: { stiffAt, stiff, scorch } }
//   souredBy(mix) -> bool (a cell's water led by Gall)   strokeK(aspect, rain) -> 1 | SPOIL.fury.stiff   fadeK(feeling) -> x the water's fade
//   scorchStep(hours, aspect, rain, dtHours) -> { hours, scorch: bool } (a moss cell's Fury clock; scorch true once at the threshold)
// ---------------------------------------------------------------------------------------

/** The numbers, each with its reason.
 *  gall.leads: a share of the cell's water at which Gall leads it (the water's own `feelingAt` picks the largest share; 0.4 of seven is
 *    the plurality a cell holds after one pour into fair water, so one careless pour sours and a second, fair one washes it).
 *  gall.linger: its fade against the others' (GALL-AND-FURY.md 8: "a third of the others' rate").
 *  fury.stiffAt: the rain's strength from which clay bakes (rainOf is 0.5 Fluid, 0.9 Prismatic: a Fluid mind's Fury rain bakes, a calm
 *    one's drizzle does not).
 *  fury.stiff: a stroke's strength under it (GALL-AND-FURY.md 8: "strokes half as strong").
 *  fury.scorch: game hours of Fury rain on moss before it turns to ash (two: about five real minutes, long enough to see it coming and
 *    stop drinking Fury). */
export const SPOIL = {
  gall: { leads: 0.4, linger: 1 / 3 },
  fury: { stiffAt: 0.5, stiff: 0.5, scorch: 2 },
};

/** A cell's water soured: `mix` its shares a feeling ({ gall: 0.6, wonder: 0.2, ... } or an array in DISPLAY_ORDER with `order`). */
export function souredBy(mix, order = null) {
  const m = Array.isArray(mix) ? Object.fromEntries((order || []).map((f, i) => [f, mix[i] || 0])) : mix || {};
  const sum = Object.values(m).reduce((a, b) => a + b, 0); if (sum <= 0) return false;
  const g = (m.gall || 0) / sum;
  return g >= SPOIL.gall.leads && Object.entries(m).every(([f, v]) => f === 'gall' || v <= (m.gall || 0));
}

/** A matter stroke's strength on a planetoid under rain of `aspect` at `rain` (0..1). */
export const strokeK = (aspect, rain = 0) => (aspect === 'fury' && rain >= SPOIL.fury.stiffAt ? SPOIL.fury.stiff : 1);

/** The water's fade a feeling, as a multiple of the garden's own (Gall lingers). */
export const fadeK = (feeling) => (feeling === 'gall' ? SPOIL.gall.linger : 1);

/** A moss cell's Fury clock: `hours` of Fury rain so far, `dtHours` game hours passing under rain of `aspect` at `rain`. The clock runs
 *  only under Fury rain at `stiffAt` or harder, and is let go (back to 0) the moment it stops: a scorch is a storm sat through, not a sum. */
export function scorchStep(hours = 0, aspect = null, rain = 0, dtHours = 0) {
  if (aspect !== 'fury' || rain < SPOIL.fury.stiffAt) return { hours: 0, scorch: false };
  const h = hours + dtHours;
  return { hours: h, scorch: hours < SPOIL.fury.scorch && h >= SPOIL.fury.scorch };
}
