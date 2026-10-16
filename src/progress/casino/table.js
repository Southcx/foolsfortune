// ---------------------------------------------------------------------------------------
// THE TABLE ENGINE (docs/plans/CASINO.md section 2; the owner, 2026-10-15: "a robust environment within Fool's Fortune to test" the tarot
// and dice games): one engine, every game a RULES MODULE plugged into it. A game is pure data and functions, no three.js: a seeded state,
// the decisions it is waiting on (whose, and the legal moves), how a move changes it, and when it is over. So the same module is played
// at a table in Raku's bazaar, by bots headless, and by the simulator (scripts/casino.mjs) ten thousand times to measure its odds.
//
// A decision is always someone's: `pending` is a queue of { seat, kind, moves }, so a choice that is not the turn's holder's (a player
// whose discard was stolen choosing what their Major Arcana does) waits its turn like any other. Hidden information is the module's
// `view(state, seat)`: a bot and a player see only that.
//
// Prior art: boardgame.io's moves-and-phases (a game as pure reducers over a state), OpenSpiel's legal-actions interface for game AI,
// the house's own economy simulator (scripts/economy.mjs: measure before believing).
//
//   rngOf(seed) -> () => [0,1)   die(r, sides)   shuffle(r, a)   DIE_STEPS   SEAT_COLOURS   SUIT_COLOURS   play(game, { seats, bots, seed, opts, steps }) -> { result,
//   state, moves }   A game: { id, seats: [min, max], setup({ seats, r, opts }), pending(state) -> { seat, kind, moves } | null,
//   apply(state, move, r) -> events, result(state) -> null | { ... }, view(state, seat) }
// ---------------------------------------------------------------------------------------

/** A seeded stream (mulberry32: small, fast, good enough for dice and shuffles). */
export function rngOf(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** One roll of a die of `sides`. */
export const die = (r, sides) => 1 + Math.floor(r() * sides);
/** Fisher-Yates, in place. */
export function shuffle(r, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/** The standard set's dice in order, the steps a die is upgraded or downgraded along. */
export const DIE_STEPS = [4, 6, 8, 10, 12, 20];
export const stepDie = (sides, by) => DIE_STEPS[Math.max(0, Math.min(DIE_STEPS.length - 1, DIE_STEPS.indexOf(sides) + by))];
/** The seats' colours (the owner, 2026-10-15: the board-game convention, Red, Yellow, Green, Blue, Purple, Pink, Black, White), each with a
 *  shape of its own so a colour is never the only cue (the colour-blind, and the suits' colours, which share four of these: CASINO-CLARITY.md
 *  3). Seat 0 is always you. A colour sits on a seat's rim, tokens and plate, never on a card's face (that is the suit's). */
export const SEAT_COLOURS = [
  { id: 'red', label: 'Red', hex: '#e5484d', shape: 'circle' }, { id: 'yellow', label: 'Yellow', hex: '#f5c542', shape: 'triangle' },
  { id: 'green', label: 'Green', hex: '#3fb950', shape: 'square' }, { id: 'blue', label: 'Blue', hex: '#3b82f6', shape: 'diamond' },
  { id: 'purple', label: 'Purple', hex: '#a371f7', shape: 'star' }, { id: 'pink', label: 'Pink', hex: '#f472b6', shape: 'heart' },
  { id: 'black', label: 'Black', hex: '#2b2b33', shape: 'hexagon' }, { id: 'white', label: 'White', hex: '#f2f2f2', shape: 'ring' },
];
/** The suits' colours (the owner, 2026-10-15: Wands red, Cups blue, Swords green, Pentacles yellow), in SUITS' order (cups, swords,
 *  pentacles, wands), with the playing-card suit each stands for. */
export const SUIT_COLOURS = [{ suit: 'cups', hex: '#3b82f6', pip: '♥' }, { suit: 'swords', hex: '#3fb950', pip: '♠' }, { suit: 'pentacles', hex: '#f5c542', pip: '♦' }, { suit: 'wands', hex: '#e5484d', pip: '♣' }];
/** A standard set of polyhedral dice: d4, d6, d8, two d10, d12, d20 (the owner's "full set of standard DnD dice"). */
export const DND_SET = [4, 6, 8, 10, 10, 12, 20];

/** Every subset of `values` (by index) whose sum is exactly `target`: [[i, ...]]. Up to 16 values. */
export function subsetsSumming(values, target) {
  const out = [], n = values.length;
  for (let m = 1; m < 1 << n; m++) { let s = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) s += values[i]; if (s === target) { const ix = []; for (let i = 0; i < n; i++) if (m & (1 << i)) ix.push(i); out.push(ix); } }
  return out;
}

/** A game played out: each pending decision answered by its seat's bot, until it is over (or `steps` run out). */
export function play(game, { seats = 2, bots, seed = 1, opts = {}, steps = 20000 } = {}) {
  const r = rngOf(seed), state = game.setup({ seats, r, opts });
  let n = 0;
  for (; n < steps; n++) {
    if (game.result(state)) break;
    const p = game.pending(state); if (!p) break;
    const bot = bots[p.seat] || bots[0], move = p.moves.length === 1 ? p.moves[0] : bot(game.view(state, p.seat), p, r);
    game.apply(state, move, r);
  }
  return { result: game.result(state), state, moves: n };
}
