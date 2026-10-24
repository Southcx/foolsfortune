// ---------------------------------------------------------------------------------------
// THE SOLAR SKIFF'S TUNE (docs/plans/SKIFF-TUNING.md 2; the owner, 2026-10-22: "Beam.NG or Forza precision", ruled with every plan of it):
// the tune sheet's five sliders, each one trade with two ends named in feel, stock in the middle; what they multiply (the same keys as the
// parts, so the board reads one more source through `BoardRules.mult`); the Performance Index (PI); the record classes (STOCK, OPEN); and
// what opens each slider. All at 0 is the board exactly as it came (the design laws: a modifier switched off restores the base).
//
// Each step moves its keys by `step` x the key's size, so a slider's end is at most 12% on its biggest key (the owner's ruling: +-12%).
// The sizes are balanced on the reference lap (`scripts/skifftune.mjs`, the ruler): no corner of the sheet beats stock by more than
// about 3 PI there, though a tune beats stock by more on its own kind of track (that is what tuning is for).
//
// Prior art: F-Zero GX's machine balance (one slider, two named ends, stock in the middle); Forza's tuning (the feel said in words, the
// Performance Index, the class records); Gran Turismo's setting sheet (named setups); Trackmania's stock car (a time that is skill alone:
// the STOCK class); sailing's own trim (a flat sail points high, a full one drives; mast rake for the helm; ballast; rocker).
//
//   TUNE = { step, range, sliders }   tuneMult(sheet, key) -> number   STOCK_SHEET   isStock(chosen, sheet) -> bool   classOf(...) -> 'stock' | 'open'
//   sliderOpen(id, partsOpen) -> bool   piOf(time, stock) -> PI   SETUPS (how many)
// ---------------------------------------------------------------------------------------

/** The sheet. `moves`: each key's size a step (+ toward the plus end); `slot`: the part slot whose first part opens it (2.7). The keys are
 *  BoardRules.mult's: top, accel, grip, coast, turn, carveRate, hover, follow, wobble, mass. */
export const TUNE = {
  step: 0.04, range: 3,
  sliders: {
    trim: { label: 'Sail trim', minus: 'Drives hard off the line', plus: 'Faster at the top', slot: 'sail', moves: { top: 0.25, accel: -1 } },
    fin: { label: 'Grip', minus: 'Holds the sand, slow to slide', plus: 'Slides early, turns tight', slot: 'keel', moves: { grip: -1, carveRate: 1, turn: 0.35 } },
    rake: { label: 'Mast lean', minus: 'Steady at speed', plus: 'Sharp turn-in, twitchy', slot: 'keel', moves: { turn: 0.5, wobble: -1 } },
    ballast: { label: 'Weight', minus: 'Light: quick, kicked about', plus: 'Heavy: carries speed, hits hard', slot: 'hull', moves: { mass: 1, accel: -0.5, coast: -0.75 } },
    ride: { label: 'Ride height', minus: 'Low: planted, stiff landings', plus: 'High: soaks landings, floats in the air', slot: 'hull', moves: { hover: 1, follow: -1 } },
  },
};
export const STOCK_SHEET = Object.freeze(Object.fromEntries(Object.keys(TUNE.sliders).map((id) => [id, 0])));
/** When the board counts as sliding: a slip angle (rad) past this, times the grip it has now (the GARAGE's telemetry and the slip arc). */
export const SLIDE = { slip: 0.15 };
export const SETUPS = 3; // (named setups kept, each the parts and the sheet, one pinnable to a track: 2.6)

const clampStep = (v) => Math.max(-TUNE.range, Math.min(TUNE.range, Math.round(+v || 0)));
/** A sheet made safe: each slider a whole step within the range, the missing ones at 0. */
export const cleanSheet = (sheet) => Object.fromEntries(Object.keys(TUNE.sliders).map((id) => [id, clampStep(sheet?.[id])]));

/** The sheet's multiplier for one of the board's numbers (1 where no slider moves it, or every slider is at 0). */
export function tuneMult(sheet, key) {
  let k = 1;
  for (const [id, S] of Object.entries(TUNE.sliders)) { const v = clampStep(sheet?.[id]), size = S.moves[key]; if (v && size) k *= 1 + TUNE.step * size * v; }
  return k;
}

/** The STOCK class: the standard parts and the sheet at 0 (Trackmania's: a time is skill alone). Anything else is OPEN. */
export const isStock = (chosen, sheet) => Object.values(chosen || {}).every((id) => String(id).endsWith('.standard')) && Object.values(cleanSheet(sheet)).every((v) => v === 0);
export const recordClass = (chosen, sheet) => (isStock(chosen, sheet) ? 'stock' : 'open');

/** A slider opens with its part slot: the first part of that slot opened (an achievement) opens it (SKIFF-TUNING.md 2.7). */
export const sliderOpen = (id, slotOpen) => !!slotOpen?.(TUNE.sliders[id]?.slot);

/** The Performance Index: 100 for stock, the reference lap's time against stock's (PI = 100 x stock / this). */
export const piOf = (time, stock) => (time > 0 && stock > 0 ? Math.round((100 * stock) / time * 10) / 10 : 100);
