// ---------------------------------------------------------------------------------------
// A LEARNED SKILL (docs/plans/ABERRANTS.md 8; South, 2026-10-29: "The secret is a faster way to win, maybe we can evaluate drop tables of
// Soul Alchemy materials, cosmetic drop? Learning special abilities? ... I'm all for learning abilities from enemies"): an aberrant's own
// skill turned to your hand, one an aberrant, cast in the PvE duel as a power (powers.js, the rows with `learned`), paid from the pool
// and resting as the seven do. Learned the way every Art is (DESIGN.md 22: arts only by achievement, a count way and a feat way): the
// feat, its secret found once (the faster way to win, and the reason to read the aberrant); the count, enough duels won against it
// the plain way (the Line: grind closes the gap). A predicate over the ledger (never a flag): `duel.secret.<id>` and `duel.won.<kind>`
// (feedback/tracking/duel.js). Practice counts nothing in the ledger, so practice teaches nothing.
//
// Prior art: Final Fantasy's Blue Magic (FFV, FFXI and FFXIV's blue mage: a monster's move learned by meeting it), Mega Man's Weapon Get
// (a boss's weapon yours once it falls), Kirby's copy abilities, Monster Hunter's crafted gear (a monster's way carried away from it).
//
//   LEARNED[power] = { from (the creature's kind), secret (its secret's id), wins (the count way), hint }
//   learnedOf(L) -> [power ids learned]   (newDuel's `learned`: world/duel/duelsession.js, Petra's)
//   isLearned(power, L) -> bool
// ---------------------------------------------------------------------------------------

export const LEARNED = {
  // the Lantern Wisp's Kindle: its secret snuffed once, or 5 Wisps beaten at the Line
  kindle: { from: 'wisp', secret: 'snuff', wins: 5, hint: 'Learned from the aberrant Lantern Wisp.' },
};

const got = (L, k) => L?.get?.(k) || 0;

/** Has the Courier learned this aberrant's skill: its secret found (the feat), or enough of it beaten at the Line (the count). */
export const isLearned = (power, L) => { const R = LEARNED[power]; return !!R && (got(L, `duel.secret.${R.secret}`) >= 1 || got(L, `duel.won.${R.from}`) >= R.wins); };

/** Every learned skill now (a duel's `learned`). */
export const learnedOf = (L) => Object.keys(LEARNED).filter((id) => isLearned(id, L));
