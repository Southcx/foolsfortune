// ---------------------------------------------------------------------------------------
// FLEEING A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md section 15; the owner, 2026-10-19: "rolling like a saving throw to let you escape",
// a failed one gentle at 3 AP): a d20 against 15, its odds earned on the board and shown before you roll. The Line held past the middle
// helps and the Line lost hurts; a broken foe is easier to slip (its stun depth); every failed try this duel adds to the next (pity);
// Luck sways it a little, never more than 2. A natural 20 always gets away, a natural 1 never does. Away, you are whole: no shatter, no
// reward; the Figment keeps its aberrance and drifts off. A failed roll costs 3 points and the duel goes on.
//
// Prior art: Dungeons & Dragons' saving throw (a d20 against a difficulty class, modifiers from the fiction, the natural 20 and 1);
// Pokémon's Run (a failed one gives the foe its turn, and each try in a battle raises the odds of the next); the gacha law the
// Lockheart's published break chances follow: the odds are a number you can read before you commit.
//
//   FLEE   fleeOdds(state, side) -> { need, bonus, chance, mods }   FLEE_ACTION (the action: cost 3, any form, the sides that may)
// ---------------------------------------------------------------------------------------
export const FLEE = {
  dc: 15,          // what a d20 plus its modifiers must reach
  cost: 3,         // points a failed roll costs (the owner: gentle)
  perColumn: 1,    // a modifier a column of the Line held past the middle (or lost)
  perDepth: 3,     // a modifier a stun depth the foe is broken
  perFail: 3,      // a modifier each failed try this duel (pity)
  luckMax: 2,      // Luck's sway at most, either way
};

/** The odds of a flee now, as the overlay shows them: the roll needed on the d20, the bonus and its parts, and the chance (a natural 20
 *  always, a natural 1 never). */
export function fleeOdds(s, side) {
  const S = s.sides[side], F = s.sides[1 - side], b = s.board;
  const held = side === 0 ? b.line - b.w / 2 : b.w / 2 - b.line;
  const mods = {
    line: Math.round(held * FLEE.perColumn),
    break: (F.depth || 0) * FLEE.perDepth,
    pity: (S.fleeFails || 0) * FLEE.perFail,
    luck: Math.max(-FLEE.luckMax, Math.min(FLEE.luckMax, Math.round(s.luck?.[side] ?? 0))),
  };
  const bonus = mods.line + mods.break + mods.pity + mods.luck, need = Math.max(2, Math.min(20, FLEE.dc - bonus));
  return { need, bonus, mods, chance: (21 - need) / 20 };
}

/** The flee itself: only a side that may (`flee`, the Courier's by default), with 3 points left. */
export const FLEE_ACTION = { form: null, cost: FLEE.cost,
  legal: (s, side) => !!s.sides[side].flee,
  apply: (s, side) => {
    const S = s.sides[side], odds = fleeOdds(s, side), roll = 1 + s.r.int(20);
    const ok = roll === 20 || (roll !== 1 && roll + odds.bonus >= FLEE.dc);
    const ev = { type: 'flee', side, roll, bonus: odds.bonus, need: odds.need, mods: odds.mods, ok };
    if (!ok) { S.fleeFails = (S.fleeFails || 0) + 1; return [ev]; }
    s.fled = side; s.winner = -1; // (no winner: the duel ends with both whole; a view reads `fled`)
    return [ev, { type: 'duel.fled', side, winner: -1 }];
  } };
