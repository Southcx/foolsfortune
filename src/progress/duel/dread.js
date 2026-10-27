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
//   rs.fog = { side, light }   rs.embers = { from, count }   clues(state, viewer, familiarity?) -> { rows, cols, colours } | null (clue fog)
// ---------------------------------------------------------------------------------------
import { COLOURS, KINDS } from './board.js';

/** May a side be shown this cell? Its own half always; the fogged side's half only within `light` cells of that side's body, or all of it
 *  while the viewer has read it (the Veritome's READ, couriertools.js). */
export function visibleTo(s, viewer, x, y) {
  const F = s.rs.fog, b = s.board; if (!F || b.sideOf(x) !== F.side || viewer === F.side || s.sides[viewer]?.read > 0) return true; // (read: the Veritome's READ)
  const at = s.sides[F.side].at; if (!at) return false;
  return Math.abs(x - at[0]) + Math.abs(y - at[1]) <= (F.light ?? 3);
}

/** What a side's junk lands as: embers if the ruleset says this side sends them. */
export const emberKind = (s, sender) => (s.rs.embers && s.rs.embers.from === sender ? 'ember' : 'junk');

/** The end of a side's own turn: each ember on its half burns down a turn; one at zero cools into a gem of a random colour. */
export function tickEmbers(s, side) {
  const b = s.board, events = []; if (!s.rs.embers) return events;
  b.each((p, x, y) => {
    if (p.kind !== 'ember' || !b.mine(side, x)) return;
    p.count = (p.count ?? s.rs.embers.count) - 1;
    if (p.count > 0) return;
    Object.assign(p, { kind: 'gem', tags: KINDS.gem, colour: COLOURS[s.r.int(Math.min(COLOURS.length, s.rs.colours))] });
    events.push({ type: 'ember.cool', side, id: p.id, at: [x, y], colour: p.colour });
  });
  return events;
}

/** Clue fog (PUZZLE-DUELS.md 19.3; Hexcells' and Picross's margins): what a side may know of a fogged half without seeing it: for each
 *  row and each column of that half, how many hidden cells hold a piece, and the hidden gems' tally by colour. The fog stays; it becomes
 *  a thing to read. `familiarity` (0..4, familiarity.js) adds detail: from 2 the rows' and columns' counts split gems from junk. */
export function clues(s, viewer, familiarity = 0) {
  const F = s.rs.fog, b = s.board; if (!F || F.side === viewer || s.sides[viewer]?.read > 0) return null;
  const rows = [], cols = {}, colours = {};
  for (let y = 0; y < b.h; y++) {
    const r = { gems: 0, other: 0 };
    for (let x = 0; x < b.w; x++) {
      if (b.sideOf(x) !== F.side || visibleTo(s, viewer, x, y)) continue;
      const p = b.at(x, y); cols[x] ||= { gems: 0, other: 0 }; if (!p) continue;
      const gem = p.kind === 'gem'; r[gem ? 'gems' : 'other']++; cols[x][gem ? 'gems' : 'other']++;
      if (gem) colours[p.colour] = (colours[p.colour] || 0) + 1;
    }
    rows.push(r);
  }
  const fold = (c) => (familiarity >= 2 ? c : { pieces: c.gems + c.other });
  return { rows: rows.map(fold), cols: Object.fromEntries(Object.entries(cols).map(([x, c]) => [x, fold(c)])), colours };
}
