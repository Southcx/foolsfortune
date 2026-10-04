// ---------------------------------------------------------------------------------------
// THE MENTAL STATE: how open a creature is, right now, to being moved: STOIC, RESOLVED, BALANCED, FLUID, PRISMATIC (the owner's design
// document v0.1, section 8.6.3). It is the lore's solid and liquid as a number: a stoic mind is fired clay, a prismatic one is slip.
// It scales how readily a creature takes a status (and, later, how much a buff does for it). Steady blows push it toward Prismatic
// (overwhelmed); a status resisted, or time left alone, pushes it back toward Balanced or Stoic. Data and small pure functions: a
// creature carries `mind` (-2 .. +2) once Petra wires it (docs/plans/SYSTEMS.md, B2).
//
// Prior art: v0.1's five states; Persona's "Down" and Shin Megami Tensei's press turns (an opened target is easier to move); Sekiro's
// posture as a state that pressure builds and rest drains.
//
//   STATES[i] (-2 .. +2 -> 0 .. 4)   stateOf(mind) -> { id, name, take, buff }   pushed(mind, by) -> mind   settle(mind, dt) -> mind
// ---------------------------------------------------------------------------------------

export const STATES = [
  { id: 'stoic',     name: 'Stoic',     take: 0.35, buff: 0.6 },
  { id: 'resolved',  name: 'Resolved',  take: 0.7,  buff: 0.85 },
  { id: 'balanced',  name: 'Balanced',  take: 1,    buff: 1 },
  { id: 'fluid',     name: 'Fluid',     take: 1.4,  buff: 1.2 },
  { id: 'prismatic', name: 'Prismatic', take: 2,    buff: 1.5 },
];

/** How far a blow, a resisted status and a second of quiet move the state (one whole state is 1). */
export const MIND = { perBlow: 0.12, perResist: -0.35, settlePerSec: 0.05 };

const clamp = (v) => Math.max(-2, Math.min(2, v));
/** The state a mind value is in (rounded to the nearest), with its multipliers. */
export const stateOf = (mind = 0) => STATES[Math.round(clamp(mind)) + 2];
/** Moved by `by` (a blow: MIND.perBlow; a resisted status: MIND.perResist). */
export const pushed = (mind = 0, by = MIND.perBlow) => clamp(mind + by);
/** Left alone, a mind drifts back toward its own `rest` (Balanced unless the creature is by nature otherwise). */
export function settle(mind = 0, dt = 0, rest = 0) {
  const d = rest - mind, step = MIND.settlePerSec * dt;
  return Math.abs(d) <= step ? rest : mind + Math.sign(d) * step;
}
