// ---------------------------------------------------------------------------------------
// THE CITY'S FIRE'S LOOK, ITS NUMBERS (plain name; docs/plans/MECHS.md 9.1; the fire's rules Dovina's, progress/mechs/fire.js and its
// runtime world/hangar/cityfire.js): every count, size, colour and rate the toy city's fire is drawn with, one table, so a cut comes
// from a measurement here and never from the code (Petra's budget, docs/handoffs/calissa/2026-11-02-from-petra-fire-budget.md):
//   flames    a flame card's size by the fuel its cell has left, how many at once (`max`, a phone's `maxPhone`), how many a building
//   smoke     a smoke column's puffs a real second (a base and a share a burning cell, capped), their life, size, rise and colours
//   embers    drifting off a burning building (a share a burning cell), and the sparks thrown as a cell burns away
//   char      the shell tint over a cell by its state: SCORCHED soot, SOFT steel's dull red, WET's dark gloss, BURNING charring
//   lamps     the fire lamps (plain PointLights the light budget scores): two on High, one on Low, Minimum or a phone
//   phone     what a phone's knobs start at (a quarter of the desk's: `machine.mobile`), set from `/perfab` at the gate
// Data only: nothing here touches three.js (ARCHITECTURE.md principle 3).
// Prior art: Far Cry 2's fire spread (a cell's flame by its fuel, a smoke column a fire), Red Faction Guerrilla's and Battlefield's
// Levolution's held dust, the Godzilla films' miniature city fires (the flames at a model's scale, a big soft column over them).
//
//   FIRE_LOOK   FIRE_STATE   fuelK(mat, fuel) -> 0..1
// ---------------------------------------------------------------------------------------

/** Dovina's cell states (rec.b.fire.state), and the materials that burn (destruction.js MAT plus her paper and furnishing). */
export const FIRE_STATE = { none: 0, burning: 1, scorched: 2, soft: 3, wet: 4 };
export const FIRE_MAT = { glass: 1, timber: 2, brick: 3, stone: 4, steel: 5, paper: 6, furnishing: 7 };

export const FIRE_LOOK = {
  /** A flame card: crossed cards on a burning cell with air beside it, `minH` .. `maxH` m tall by the fuel left (fuelK), `width` m
   *  wide, set `out` m out of the cell on its open side; at most `max` in the city (a phone `maxPhone`), `perBuilding` a building
   *  (more burning cells than that take every so many). */
  flames: { max: 1600, maxPhone: 420, perBuilding: 300, minH: 1.4, maxH: 5, width: 2.1, out: 0.55 },
  /** The fuel a cell of a material holds when whole (the normaliser for fuelK; Dovina's numbers once her rules land). */
  fuelFull: { 2: 1, 5: 1, 6: 0.4, 7: 1.4 },
  /** The wind the flames lean and the smoke drifts with (m/s, world),. */
  wind: [2.4, 0, 0.9],
  /** A smoke column: puffs a real second (`base` + `perCell` x burning cells, at most `max`), from the burning cells' tops. */
  smoke: { base: 4, perCell: 0.12, max: 26, life: [6, 9], size: [3.2, 5], sizeEnd: [10, 16], rise: [3.5, 5.5], drift: 0.55,
    alpha: 0.46, light: 0x8a8076, dark: 0x1c1816, drag: 0.35 },
  /** Embers off a burning building (a real second: `perCell` x burning cells, at most `max`), and a cell burning away's sparks. */
  embers: { perCell: 0.35, max: 46, life: [1.6, 3], size: [0.12, 0.26], rise: [2, 5], colours: [0xffb04a, 0xff7a2a, 0xffe08a], sparks: 7, sparksMax: 60 },
  /** The shell over a cell by its state (a 1.03 m cube on a face that meets air): its colour, its glow (an ember's light in its cracks) and its roughness. */
  char: { max: 4096, maxPhone: 1500, size: 1.03,
    scorched: { colour: [0x15110f, 0x2a2420], rough: 0.95, glow: 0 },
    soft: { colour: [0x4c3a36, 0x5a4440], rough: 0.5, glow: 0.85 },
    wet: { k: 0.42, tint: 0x3a4658, rough: 0.12, glow: 0 },
    burning: { charcoal: 0x120d0b, rough: 0.9, glow: 0.35 },
    ember: 0xff4a12, softGlow: 0xc42a10 },
  /** The fire lamps: the biggest fires' (at most `high` on High; `low` on Low, Minimum or a phone), over the fire's middle. */
  lamps: { high: 2, low: 1, colour: 0xff7a30, intensity: 240, perCell: 1.6, most: 520, distance: 70, decay: 1.4, lift: 4, flicker: 0.22 },
  /** How often the burning set is read again (real s): at most every `rebuild` when told it changed, every `refresh` while one burns. */
  rebuild: 0.25, refresh: 1,
  /** A phone's knobs, a share of the desk's (flames, smoke, embers: Petra's quarter, set from `/perfab`). */
  phone: 0.25,
  /** A body ablaze or heated: the straw giant's flames (`straw` cards, m), the frame's heat (embers a real second at k 1), the colossus glazing (real s to turn, a shard every `crackEvery` s). */
  bodies: { straw: { cards: 16, minH: 1.6, maxH: 5.2, width: 2.6, char: 0x2a1a10, ember: 0xff5a1a },
    heat: { embers: 36, glow: 26, haze: 3 },
    vitrify: { turn: 1.6, rough: 0.08, metal: 0.18, tint: 0x6f7a52, crackEvery: 0.35 } },
  /** The flamer's cone of flame: `length` m along the nozzle, `cards` along it, from `r0` to `r1` m across. */
  flamer: { length: 20, cards: 12, r0: 0.6, r1: 5.5, nozzle: [-1.55, 2.45, 1.7], haze: 4 },
};

/** A cell's fuel as a share of what a whole cell of its material holds (the flame card's size). */
export const fuelK = (mat, fuel) => Math.max(0, Math.min(1, (fuel ?? 1) / (FIRE_LOOK.fuelFull[mat] || 1)));
