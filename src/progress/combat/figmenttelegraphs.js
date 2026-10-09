// ---------------------------------------------------------------------------------------
// FIGMENT ATTACK TELEGRAPHS: what Divination shows of a creature's windup on foot (docs/plans/FIGMENT-TELEGRAPHS.md; the owner, 2026-10-09:
// always so named, never the rail's telegraph mark, vfx/telegraph.js). The body's animation is
// always the tell; a telegraph is a mark Divination adds over it, saying more as the domain rises: where (the edge), when (the fill to
// the edge, landing on the strike frame), what kind (the damage type's colour and the status glyph), how to answer (the answer glyph).
// Perception (Soul Alchemy) sets how early it shows; Divination how much. Data and pure functions; the marks are Calissa's.
//
// Prior art: FFXIV's AoE vocabulary and head markers, WildStar's fill-to-edge telegraphs, WoW 11.1's crisp-edged swirlies, Monster
// Hunter's animation-only tells, the accessibility guidelines (never colour alone). Seeing telegraphs as a skill levelled is ours.
//
//   FIGMENT_TELEGRAPH.steps   figmentStepsAt(level) -> [step ids]   FIGMENT_SHAPES[shape] = { answer, ground }   FIGMENT_ANSWERS   figmentMarkOf(windup, level, lent?) -> mark | null
// ---------------------------------------------------------------------------------------

/** The fidelity ladder: the Divination level each step shows from (first numbers: the domain curve puts 2 in minutes, 8 within the
 *  first hour, 20 at about 2.5 real hours of Divination's play, 35 at about 9). */
export const FIGMENT_TELEGRAPH = {
  steps: [ // (labels and lines Espada's: the Codex's Divination page names them; `said` is the log's line when the step is reached)
    { id: 'where',  at: 2,  label: 'Area',   line: 'See where a blow lands.',          said: 'Figment telegraphs show the area now.' },
    { id: 'when',   at: 8,  label: 'Timing', line: 'See when a blow lands.',           said: 'Figment telegraphs show the timing now.' },
    { id: 'kind',   at: 20, label: 'Type',   line: 'See its damage type and status.',  said: 'Figment telegraphs show the damage type now.' },
    { id: 'answer', at: 35, label: 'Answer', line: 'See how to answer it.',            said: 'Figment telegraphs show the answer now.' },
  ],
  tells: { label: 'Tells', line: 'Read the body. No marks yet.' }, // (step 0: the body alone)
  max: 6, // (telegraphs drawn at once; one cast's overlapping areas merge into one edge)
};
/** The answers a mark can carry (Calissa's glyphs, FIGMENT-TELEGRAPHS.md section 4). */
export const FIGMENT_ANSWERS = ['out', 'in', 'sidestep', 'behind', 'lookAway', 'guard', 'parry', 'bait', 'killFirst', 'highGround'];
/** Each shape: the answer it wears unless the cast says otherwise, and whether it is drawn on the ground. */
export const FIGMENT_SHAPES = {
  circle: { answer: 'out', ground: true }, ring: { answer: 'in', ground: true }, 'out-in': { answer: 'out', ground: true },
  cone: { answer: 'behind', ground: true }, line: { answer: 'sidestep', ground: true }, lunge: { answer: 'sidestep', ground: true },
  baited: { answer: 'out', ground: true }, left: { answer: 'out', ground: true }, tracked: { answer: 'out', ground: true },
  floor: { answer: 'highGround', ground: true }, gaze: { answer: 'lookAway', ground: false }, raidwide: { answer: 'guard', ground: false },
  adds: { answer: 'killFirst', ground: false }, split: { answer: 'killFirst', ground: false },
};

/** The steps a Divination level shows (`lent`: the lend panel's figmentTelegraphs row, DEBUG: every step). */
export const figmentStepsAt = (level = 1, lent = false) => FIGMENT_TELEGRAPH.steps.filter((s) => lent || level >= s.at).map((s) => s.id);

/** What to draw for a windup at a Divination level: null at step 0 (the body alone). `windup`: { area: { shape, ... }, type, status,
 *  answer, eta }. Each field is present only from its step: the mark never says more than the level has earned. */
export function figmentMarkOf(windup, level = 1, lent = false) {
  const steps = figmentStepsAt(level, lent), shape = windup?.area?.shape;
  if (!steps.length || !shape) return null;
  const S = FIGMENT_SHAPES[shape] || { answer: 'out', ground: true };
  return {
    shape, area: windup.area, ground: S.ground, edge: true,
    fill: steps.includes('when') ? windup.eta ?? null : null,
    type: steps.includes('kind') ? windup.type ?? null : null,
    status: steps.includes('kind') ? windup.status ?? null : null,
    answer: steps.includes('answer') ? windup.answer ?? S.answer : null,
  };
}
