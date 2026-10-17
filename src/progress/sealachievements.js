// ---------------------------------------------------------------------------------------
// THE SEAL BOOK'S ACHIEVEMENTS (docs/plans/HANKO.md section 5): predicates over the ledger (feedback/tracking/seals.js keeps it), in the
// EXPLORATION category's "The Seal Book" sub. A count way (pages) and a feat way (a body driven unbroken). The cradles stand in the
// world as each division places them; the goals here count what exists then, so they grow with it.
//
// Prior art: the goshuinchō's filled pages, Breath of the Wild's shrine count, the house's own achievements.js (its helpers passed in).
//
//   sealAchievements({ C, H, F })   (achievements.js calls it inside buildAchievements)   SEAL_KINDS   sealBookPages(L) -> pages
// ---------------------------------------------------------------------------------------
export const SEAL_KINDS = ['threshold', 'engine', 'body'];
/** How many pages the Seal Book has: the cradles whose seal you have received (the ledger's `seal.book.<cradle>` firsts). */
export const sealBookPages = (L) => L.firstCount?.('seal.book.') ?? 0;

export function sealAchievements({ C, F }) {
  C('sb1', 'explore', 'The Seal Book', 1, 'count', 'First Imprint', 'Set your seal in a cradle.', 'seal.set', 1);
  F('sb2', 'explore', 'The Seal Book', 2, 'collect', 'Pilgrim', 'Fill 10 pages of your Seal Book.', sealBookPages, 10);
  F('sb3', 'explore', 'The Seal Book', 2, 'collect', 'Every Kind', 'Seal a threshold, an engine and a body.', (L) => SEAL_KINDS.filter((k) => L.get(`seal.kind.${k}`) > 0).length, 3);
  C('sb4', 'explore', 'The Seal Book', 3, 'endure', 'Long Haul', 'Seal into cradles 200 times.', 'seal.set', 200);
}
