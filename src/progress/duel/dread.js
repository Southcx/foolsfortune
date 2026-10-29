// ---------------------------------------------------------------------------------------
// DREAD'S RULES ON A PUZZLE DUEL'S BOARD (docs/plans/PUZZLE-DUELS.md sections 6 and 14): the family a Figment of Dread brings, first worn
// by the aberrant Lantern Wisp. Two rules:
//   FOG      a side's half is hidden from the other side except within the light of its body (its lantern); the engine keeps the whole
//            board, and `visibleTo` says what a side may be shown. The forecast is still drawn (Divination sees intent, not ground).
//   EMBERS   junk a Dread side sends lands as embers: they cannot be broken, pinched or held while they burn down, and after their
//            count of the receiver's own turns they cool into gems. Dread is the wait.
//
// Prior art: Super Puzzle Fighter II Turbo's counter gems (garbage with a countdown that turns to ordinary gems); the fog of war of
// Advance Wars and Into the Breach's smoke; the will-o'-the-wisp of the fens, a light that shows you only what it wants you to see.
//
//   visibleTo(state, viewer, x, y) -> bool   emberKind(state, sender) -> 'ember' | 'junk'   tickEmbers(state, side) -> events
//   fogShows(state, viewer, x, y) -> 'all' | 'shape' (a fogged cell shows that a piece is there, never its colour: PUZZLE-DUELS.md 20)
//   rs.fog = { side, light }   rs.embers = { from, count }   (clue fog was cut 2026-10-29: never drawn, and nothing of yours acts on the foe's half: PUZZLE-DUELS.md 26.5)
// ---------------------------------------------------------------------------------------
import { KINDS, paletteOf } from './board.js';
import { lightOf } from './secrets.js';

/** May a side be shown this cell? Its own half always; the fogged side's half only within `light` cells of that side's body, or all of it
 *  while the viewer has read it (the Veritome's READ, couriertools.js). */
export function visibleTo(s, viewer, x, y) {
  const F = s.rs.fog, b = s.board; if (!F || b.sideOf(x) !== F.side || viewer === F.side || s.sides[viewer]?.read > 0) return true; // (read: the Veritome's READ)
  const at = s.sides[F.side].at; if (!at) return false;
  return Math.abs(x - at[0]) + Math.abs(y - at[1]) <= lightOf(s); // (the lantern's light now: the Wisp's secret dims it, secrets.js)
}

/** How a cell is shown to a side: 'all' within sight, else 'shape': the fog hides a gem's colour and kind, never that the cell holds a
 *  piece (South's phone redo, 2026-10-27: a blank half read as nothing at phone size; Tetris 99's and Puyo's opponents' stacks show
 *  their height). The view draws a 'shape' cell as a plain stone of the fog. */
export const fogShows = (s, viewer, x, y) => (visibleTo(s, viewer, x, y) ? 'all' : 'shape');

/** What a side's junk lands as: embers if the ruleset says this side sends them. */
export const emberKind = (s, sender) => (s.rs.embers && s.rs.embers.from === sender ? 'ember' : 'junk');

/** The end of a side's own turn: each ember on its half burns down a turn; one at zero cools into a gem of a random colour. */
export function tickEmbers(s, side) {
  const b = s.board, events = []; if (!s.rs.embers) return events;
  b.each((p, x, y) => {
    if (p.kind !== 'ember' || !b.mine(side, x)) return;
    p.count = (p.count ?? s.rs.embers.count) - 1;
    if (p.count > 0) return;
    Object.assign(p, { kind: 'gem', tags: KINDS.gem, colour: s.r.pick(paletteOf(s.rs)) });
    events.push({ type: 'ember.cool', side, id: p.id, at: [x, y], colour: p.colour });
  });
  return events;
}
