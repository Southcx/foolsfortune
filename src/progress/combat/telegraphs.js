// ---------------------------------------------------------------------------------------
// TELEGRAPHS: what Divination shows of a creature's windup (docs/plans/TELEGRAPHS.md; the owner, 2026-10-09). The body's animation is
// always the tell; a telegraph is a mark Divination adds over it, saying more as the domain rises: where (the edge), when (the fill to
// the edge, landing on the strike frame), what kind (the damage type's colour and the status glyph), how to answer (the answer glyph).
// Perception (Soul Alchemy) sets how early it shows; Divination how much. Data and pure functions; the marks are Calissa's.
//
// Prior art: FFXIV's AoE vocabulary and head markers, WildStar's fill-to-edge telegraphs, WoW 11.1's crisp-edged swirlies, Monster
// Hunter's animation-only tells, the accessibility guidelines (never colour alone). Seeing telegraphs as a skill levelled is ours.
//
//   TELEGRAPH.steps   stepsAt(level) -> [step ids]   SHAPES[shape] = { answer, ground }   ANSWERS   markOf(windup, level, lent?) -> mark | null
// ---------------------------------------------------------------------------------------

/** The fidelity ladder: the Divination level each step shows from (first numbers: the domain curve puts 2 in minutes, 8 within the
 *  first hour, 20 at about 2.5 real hours of Divination's play, 35 at about 9). */
export const TELEGRAPH = {
  steps: [{ id: 'where', at: 2 }, { id: 'when', at: 8 }, { id: 'kind', at: 20 }, { id: 'answer', at: 35 }],
  max: 6, // (telegraphs drawn at once; one cast's overlapping areas merge into one edge)
};
/** The answers a mark can carry (Calissa's glyphs, TELEGRAPHS.md section 4). */
export const ANSWERS = ['out', 'in', 'sidestep', 'behind', 'lookAway', 'guard', 'parry', 'bait', 'killFirst', 'highGround'];
/** Each shape: the answer it wears unless the cast says otherwise, and whether it is drawn on the ground. */
export const SHAPES = {
  circle: { answer: 'out', ground: true }, ring: { answer: 'in', ground: true }, 'out-in': { answer: 'out', ground: true },
  cone: { answer: 'behind', ground: true }, line: { answer: 'sidestep', ground: true }, lunge: { answer: 'sidestep', ground: true },
  baited: { answer: 'out', ground: true }, left: { answer: 'out', ground: true }, tracked: { answer: 'out', ground: true },
  floor: { answer: 'highGround', ground: true }, gaze: { answer: 'lookAway', ground: false }, raidwide: { answer: 'guard', ground: false },
  adds: { answer: 'killFirst', ground: false }, split: { answer: 'killFirst', ground: false },
};

/** The steps a Divination level shows (`lent`: the lend panel's telegraphs row, DEBUG: every step). */
export const stepsAt = (level = 1, lent = false) => TELEGRAPH.steps.filter((s) => lent || level >= s.at).map((s) => s.id);

/** What to draw for a windup at a Divination level: null at step 0 (the body alone). `windup`: { area: { shape, ... }, type, status,
 *  answer, eta }. Each field is present only from its step: the mark never says more than the level has earned. */
export function markOf(windup, level = 1, lent = false) {
  const steps = stepsAt(level, lent), shape = windup?.area?.shape;
  if (!steps.length || !shape) return null;
  const S = SHAPES[shape] || { answer: 'out', ground: true };
  return {
    shape, area: windup.area, ground: S.ground, edge: true,
    fill: steps.includes('when') ? windup.eta ?? null : null,
    type: steps.includes('kind') ? windup.type ?? null : null,
    status: steps.includes('kind') ? windup.status ?? null : null,
    answer: steps.includes('answer') ? windup.answer ?? S.answer : null,
  };
}
