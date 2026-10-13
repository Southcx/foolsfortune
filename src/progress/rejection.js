// ---------------------------------------------------------------------------------------
// REJECTION, AS NUMBERS (docs/plans/GODHAND.md section 10; GLOSSARY "rejection"): an Island of Ego's immune response to the god hand.
// What the hand does to the island (matter moved, miracles, epics, creatures thrown) raises its heat; past each threshold the island
// rises a step and answers with stronger Figments, spawned at the edge of the view and coming for your Pneuka Jar. Heat ebbs when the
// hand is quiet; resting at a Shrine clears it, and beating the fifth step's answer clears it too. Data and a pure model: the runtime
// is godhand/rejection.js.
//
// Prior art: GTA's wanted level (stars from a running heat, each star a stronger response, cooling off out of sight); Black & White's
// belief pressure from a rival's land; Left 4 Dead's AI director (spawns paced by a stress value, never on top of the player).
//
//   REJECTION = { steps, rise, ebb, quiet, every, cap }   heatOf(e) -> heat an event adds   stepOf(heat, step) -> 0..5 (with hysteresis)
// ---------------------------------------------------------------------------------------

/** `steps`: the heat each step begins at (a step falls back when heat drops below `fall` of its start). `rise`: heat an act adds:
 *  `moved` a cubic metre of matter shaped (made matter counts double: the island feels a thing that was not there), a miracle, an
 *  epic, a creature thrown. `ebb` heat a real second once the hand has been `quiet` real seconds. `every` real seconds between
 *  answers; `cap` the most of the island's answer alive at once. `answer[step]`: what it sends (jellies of a class, wisps). */
export const REJECTION = {
  steps: [25, 60, 110, 170, 240],
  fall: 0.7,
  rise: { moved: 0.5, made: 1, miracle: 8, epic: 60, throw: 2 },
  ebb: 2,
  quiet: 12,
  every: 20,
  cap: 8,
  answer: [
    null,
    { jelly: 2, cls: 0 },
    { jelly: 3, cls: 0, wisp: 1 },
    { jelly: 2, cls: 1, wisp: 2 },
    { jelly: 1, cls: 2, wisp: 2 },
    { jelly: 1, cls: 2, size: 2.2, wisp: 3, boss: true },
  ],
  emo: 0.8, // (the island's answer arrives agitated: EmO in the optimal band pays most, so it is worth fighting)
  stash: [0, 4, 6, 10, 20, 60], // (cubes each answer carries, by step: the fight pays, as a bounty does)
};

/** Heat an event adds (GODHAND.md 10): the hand's own acts only. */
export function heatOf(name, e) {
  const R = REJECTION.rise;
  if (!e || e.by !== 'courier') return 0;
  if (name === 'god.miracle') return R.miracle;
  if (name === 'god.epic') return R.epic;
  if (name === 'god.throw') return R.throw;
  return (e.moved || 0) * R.moved + (e.made || 0) * R.made;
}

/** The step for a heat, given the step now (a step falls only below `fall` of its own start, so it does not flicker). */
export function stepOf(heat, step = 0) {
  const S = REJECTION.steps;
  let up = 0; while (up < S.length && heat >= S[up]) up++;
  if (up >= step) return up;
  return heat >= S[step - 1] * REJECTION.fall ? step : Math.max(up, step - 1);
}
