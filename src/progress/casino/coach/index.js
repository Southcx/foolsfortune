// ---------------------------------------------------------------------------------------
// THE COACH (docs/plans/CASINO-CLARITY.md section 4; the owner, 2026-10-15: "if a 9 year old couldn't figure it out how the games work within
// two minutes, it is too complex"): for any moment at any of Raku's tables, everything a seat needs to understand it, in plain words and
// numbers, so a view never has to know the rules to explain them. The table view (Calissa's, vfx/bazaartable.js) and the fallback page
// (world/bazaar/views.js) both draw from it. It reads the rules modules; it never changes a state.
//
//   coach(T, S, seat = 0) -> {
//     goal:  { text, you: { value, of?, label }, best?: { seat, value } }      the one-line aim, and how near you are (and the leader)
//     turn:  { seat, yours, say, kind }                                         whose turn, and what to do now, in one line
//     moves: [{ move, label, what, preview?, tone: 'good' | 'risk' | 'bad' | null, best, size: 'big' | 'small' }]   every legal choice
//     seats: [{ seat, name, colour, shape, you, turn, stats: [{ label, value, big? }], badge? }]                   each seat's key numbers
//     centre: [{ label, value, big? }]                                          the table's shared numbers (the pot, the target, a claim)
//     extra: {...}                                                              a game's own (Querent's groups in hand, the dice selection's odds)
//   }
//   A move's `move` is the very object the rules module takes (session.move(it)). `best` marks the house bot's choice: a hint, never
//   forced. `tone` says what a move risks, for its colour (good: helps you; risk: a gamble; bad: costs you).
//
// Prior art: Monster Train's preview of a turn before it is committed (Laura Michet, "Monster Train 2"), Slay the Spire's intents
// (each opponent's next act shown over it), the poker clients' action buttons with the amount printed on them, Hearthstone's lit playable
// cards, Mahjong Soul's call buttons that appear only when a call is possible.
//
//   coach(T, S, seat?)   hint(T, S, seat?) -> move | null   (the seats: coach/seats.js)
// ---------------------------------------------------------------------------------------
import { rngOf } from '../table.js';
import { querentCoach } from './querent.js';
import { zodiacCoach, horizonCoach } from './dice.js';
import { supernovaCoach } from './supernova.js';
import { nebulaCoach } from './nebula.js';

const COACHES = { querent: querentCoach, zodiac: zodiacCoach, eventhorizon: horizonCoach, supernova: supernovaCoach, nebula: nebulaCoach };

/** The house bot's choice for a seat's pending decision (a hint: the same bot the folk play with, at a middling style). */
export function hint(T, S, seat = 0) {
  const P = T.game.pending(S); if (!P || P.seat !== seat || P.moves.length < 2) return null;
  const pair = T.bots.find((b) => b) || null; if (!pair) return null;
  const [bot, style] = pair, r = rngOf(0x5eed + P.moves.length);
  try { return bot(T.game.view(S, seat), P, r, { ...style, bluff: 0, thief: 0.3 }); } catch { return null; }
}

/** Everything a view needs to explain this moment (header). */
export function coach(T, S, seat = 0) {
  const fn = COACHES[T.id]; if (!fn) return null;
  const R = T.game.result(S), P = R ? null : T.game.pending(S), mine = P && P.seat === seat ? P : null;
  const best = mine ? hint(T, S, seat) : null;
  const out = fn({ T, S, seat, P, mine, R, V: T.game.view(S, seat), best });
  out.turn ||= {}; out.turn.seat = P?.seat ?? null; out.turn.yours = !!mine; out.turn.kind = P?.kind ?? null;
  if (!mine && P && !out.turn.say) out.turn.say = `${T.names[P.seat]} is thinking…`;
  if (R && !out.turn.say) out.turn.say = 'The game is over.';
  const key = best ? JSON.stringify(best) : null; for (const m of out.moves || []) m.best = !!key && JSON.stringify(m.move) === key; // (a bot may hand back a copy of a move)
  return out;
}
