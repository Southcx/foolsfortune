// ---------------------------------------------------------------------------------------
// THE FIRST DUEL AS A LESSON (docs/plans/PUZZLE-DUELS.md 18.3; the owner, 2026-10-27: "implement the updated mechanics as outlined"):
// until you have won a puzzle duel, the aberrant spends its first turn idle, so you clear and chain once before it acts, and the verbs
// are asked for one at a time, each step done by doing it, never by reading it (DESIGN.md 22: the mechanic is the lesson). Nothing is
// locked: every verb works from the first turn; the step only says which to try next. A step is a predicate over what an action did.
//
// Prior art: Ikaruga's prologue (the first stage the lesson, no text), Puyo Puyo's practice (the foe holds while you chain), Into the
// Breach's tutorial island (one verb a turn, the threat paused), Portal's test chambers (each room one idea, done to pass).
//
//   LESSON.steps[i] = { id, did(events, action, side) }   lessonDue(ledger) -> bool   lessonOf(on) -> state.lesson | null
//   lessonAct(s, side, a, events) -> events   lessonTurn(s, side) -> events (the foe's idle turn)
//   events: lesson.step { side, step, id, next } (a step done, `next` the one asked now, null when done), lesson.done { side },
//           lesson.idle { side } (the foe's turn passed: it watches)
// ---------------------------------------------------------------------------------------

const HAND = new Set(['swap', 'drag', 'rotate', 'drop']);
const TOOLS = new Set(['shoot', 'grab', 'drill', 'paint', 'tune', 'delay', 'hold', 'send', 'read']);
const mine = (ev, side, type) => ev.some((e) => e.type === type && e.side === side);

export const LESSON = {
  idle: 1, // the foe's turns passed idle at the start (the owner's 2:1 complaint: the first turn is yours alone)
  steps: [
    { id: 'move',   did: (ev, a) => HAND.has(a.kind) },                                  // the god hand moves a gem (swap, drag, rotate, drop)
    { id: 'clear',  did: (ev, a, side) => mine(ev, side, 'chain') },                     // a clear of yours: 3 in a line or 4 touching
    { id: 'form',   did: (ev, a) => a.kind === 'form' && a.to === 'courier' },            // the Courier on the board (free)
    { id: 'run',    did: (ev, a) => a.kind === 'run' },                                  // a run, over orbs to drink them
    { id: 'tool',   did: (ev, a) => TOOLS.has(a.kind) },                                  // a tool's move: one that bends the clearing
    { id: 'chain',  did: (ev, a, side) => ev.some((e) => e.type === 'chain' && e.side === side && e.step >= 2) }, // a chain: what falls clears again, junk doubled
  ],
  // the one-gesture duel's (PUZZLE-DUELS.md 22): drag, clear, chain, fire a skill once one is charged; `ask` Espada's words, 2026-10-27
  dragSteps: [
    { id: 'drag',   ask: 'Drag a gem: every gem it passes trades places with it.', did: (ev, a) => a.kind === 'drag' },                                   // a gem dragged: everything it passes swaps
    { id: 'clear',  ask: 'Line up 3 of one colour, or 4 touching, to clear them.', did: (ev, a, side) => mine(ev, side, 'chain') }, // a clear: 3 in a line or 4 touching
    { id: 'chain',  ask: 'Clear so the gems that fall clear again: that is a chain.', did: (ev, a, side) => ev.some((e) => e.type === 'chain' && e.side === side && e.step >= 2) },
    { id: 'skill',  ask: 'A skill is full: fire it from its tile beside the board.', did: (ev, a) => a.kind === 'skill' },                                 // a charged skill fired
  ],
  // the PvE duel's (PUZZLE-DUELS.md 24): the same three, then a power cast before the drag (duel/powers.js); its `ask` a placeholder, Espada's to word
  pveSteps: null,
};
LESSON.pveSteps = [...LESSON.dragSteps.slice(0, 3), { id: 'power', ask: 'Cast a power from its tile beside the board, then drag.', did: (ev, a) => a.kind === 'power' }];
export const stepsOf = (s) => (s.style === 'classic' ? LESSON.steps : s.style === 'pve' ? LESSON.pveSteps : LESSON.dragSteps); // (the classic duel's forms and walk; the PvE duel's powers; the one-gesture duel's skills)

/** Is the lesson due? Until the first puzzle duel won or the lesson finished once (the ledger's `duel.won`, `duel.lesson`: tracking/duel.js).
 *  A practice duel (Strawman's) runs it too when due, and finishing it there counts: the lesson is what you know, not a record. */
export const lessonDue = (L) => !(L?.get?.('duel.won') > 0 || L?.get?.('duel.lesson') > 0);

/** The lesson's state for a new duel, or null. */
export const lessonOf = (on) => (on ? { step: 0, idle: LESSON.idle } : null);

/** After an action of the side learning (side 0): the step done, if it was, and the next asked. Done out of order counts too (a
 *  person who chains before running has learned the chain). */
export function lessonAct(s, side, a, events) {
  const L = s.lesson, steps = stepsOf(s), out = []; if (!L || side !== 0 || L.step >= steps.length) return out;
  const st = steps[L.step];
  if (!st.did(events, a, side)) return out;
  L.step++;
  const next = steps[L.step]?.id ?? null;
  out.push({ type: 'lesson.step', side, step: L.step - 1, id: st.id, next });
  if (!next) out.push({ type: 'lesson.done', side });
  return out;
}

/** The start of a side's turn: the foe's first turns pass idle while the lesson holds them (its drip still falls). */
export function lessonTurn(s, side) {
  const L = s.lesson; if (!L || side !== 1 || !(L.idle > 0)) return [];
  L.idle--; s.apLeft = 0;
  return [{ type: 'lesson.idle', side }];
}
