// ---------------------------------------------------------------------------------------
// THE DECK: how every chance that hands over an item is drawn (docs/ECONOMY.md, rule 5: "a 1-in-N drop comes within N tries"). A
// 1-in-N item is one winning card shuffled into a deck of N, drawn without putting back: it is certain by the Nth draw and comes, on
// average, at the (N+1)/2th. The deck's whole state is one number, how many cards have been drawn since the last hit (a ledger counter,
// so it survives a reload as the Tithe's pity does): the next draw hits with 1 / (N - drawn). And which of a set comes out is a deck
// too: each thing of the set before any of them twice.
//
// Prior art: the shuffle bag (Tetris's 7-bag randomiser: every piece once in seven), Dota 2's pseudo-random distribution (chance that
// rises with every miss), the gacha's hard pity, and Old School RuneScape's "dry streak", which this makes impossible. Chosen over a
// hard pity (plain odds, then a certainty at N: mean 63 tries for a 1-in-100) because it is fair from the first draw, and because this
// is a game of cards.
//
//   deckChance(n, drawn) -> 0..1      deckHit(n, drawn, r?) -> bool      nextOfDeck(pool, has, r?) -> one of pool
//   deckMean(n) -> (n + 1) / 2        (a deck of n <= 1 always hits)
//   deckDraw(ledger, key, n, r?) -> bool   one draw from the deck named `key`, its state kept in the ledger (counters only go up, so the
//                                         draws are a counter, `<key>.draws`, and the last hit a record of where it fell, `<key>.hit`)
// ---------------------------------------------------------------------------------------
import { stream } from '../../core/rng.js';
const simRand = stream('progress/econ/deck'); // (the default draw when a caller passes none: core/rng.js, the same twice)

/** The chance the next draw from a deck of n hits, `drawn` cards after its last hit. */
export const deckChance = (n, drawn = 0) => (n <= 1 ? 1 : 1 / Math.max(1, n - Math.max(0, drawn)));

/** Draw: true when this is the winning card. The caller resets its counter on a hit and adds one on a miss. */
export const deckHit = (n, drawn = 0, r = simRand()) => r < deckChance(n, drawn);

/** The mean number of draws to a hit. */
export const deckMean = (n) => (Math.max(1, n) + 1) / 2;

/** Which of a set: one not yet had, evenly; once every one is had, any of them (a duplicate). `has(item) -> bool`. */
export function nextOfDeck(pool, has, r = simRand()) {
  if (!pool.length) return null;
  const fresh = pool.filter((x) => !has(x));
  const from = fresh.length ? fresh : pool;
  return from[Math.min(from.length - 1, Math.floor(r * from.length))];
}

/** One draw from a deck whose state lives in the ledger (stats.js), as the Tithe's pity does: `<key>.draws` counts every draw and the
 *  record `<key>.hit` holds the draw on which it last hit, so the cards drawn since are the difference. */
export function deckDraw(L, key, n, r = simRand()) {
  const draws = L.get(`${key}.draws`), drawn = draws - (L.best(`${key}.hit`) || 0);
  const hit = deckHit(n, drawn, r);
  L.inc(`${key}.draws`);
  if (hit) L.hi(`${key}.hit`, draws + 1);
  return hit;
}
