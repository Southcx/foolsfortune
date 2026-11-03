// ---------------------------------------------------------------------------------------
// THE OPTIONAL RULES' HOOKS (docs/plans/PUZZLE-DUELS.md section 5; GAPS G184): where duel.js hands the rule modules their moments, so the
// kernel names none of them. A ruleset that sets none of their flags is untouched: no hook draws from the duel's stream, moves a piece
// or settles. The moments:
//   AT THE START      layFloors (ice, belts) and layViruses, once the sides are filled
//   A NEW GEM         specialGem (crash, rainbow) or magnetGem, in the gem the drip and the queue make
//   AFTER AN ACTION   iceSlide: the moved piece slides on; virusStep: a half cleared of viruses is cured
//   THE TURN'S END    the mover's own half: conveyors carry, magnets pull, junk corrodes, the sweep's bar crosses (its squares break
//                     in the settle that follows); the PvE duel's aberrant has none of it (its half is frozen)
//
// Prior art: Puzzle & Dragons' and Candy Crush's "special tiles" as board state advanced at the end of a move; Lumines' timeline.
//
//   startRules(state, clears)   gemRules(state, gem) -> gem   actionRules(state, side, action) -> events   afterSettle(state) -> events   turnRules(state, side, settle) -> events
// ---------------------------------------------------------------------------------------
import { layFloors, iceSlide, beltStep, magnetStep, magnetGem } from './movement.js';
import { layViruses, corrodeStep, virusStep } from './junkrules.js';
import { sweepSpan } from './clearrules.js';
import { specialGem } from './matchrules.js';

/** A new duel's board: floors laid, viruses sown (the fill is done). */
export function startRules(s, clears) { layFloors(s); layViruses(s, clears); }

/** A gem the drip or the queue makes, made special by the ruleset's chances. */
export function gemRules(s, colour, ordinary) { return magnetGem(s, specialGem(s, colour) || ordinary()); }

/** After a side's action (before its settle): a moved piece slides on ice. */
export const actionRules = (s, side, a) => iceSlide(s, side, a);

/** After a settle: viruses cured. */
export const afterSettle = (s) => virusStep(s);

/** The end of a side's own turn: the belts, the magnets, the rot and the sweep, then one settle for what they changed. */
export function turnRules(s, side, settle) {
  const rs = s.rs; if (!(rs.belts || rs.magnets || rs.corrode || rs.sweep) || (s.style === 'pve' && side === 1)) return [];
  const events = [...beltStep(s, side), ...magnetStep(s, side), ...corrodeStep(s, side)], span = sweepSpan(s, side);
  if (span) { s.board.sweepSpan = span; events.push({ type: 'sweep', side, x0: span.x0, x1: span.x1 }); }
  events.push(...settle(s).events); s.board.sweepSpan = null;
  return events;
}
