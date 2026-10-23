// ---------------------------------------------------------------------------------------
// THE WINDOW'S HAND ON THE LAID SPREAD (docs/plans/SPREADS.md 5): what the Pneuka Box's window may do to the spread laid on its
// underside. The state is Petra's (`game.laidSpread`, progress/laidspread.js: the spread, the cards laid, the cells lit, the tallies, the
// save, the events); the rules are progress/spreads.js. This keeps no state of its own. It adds the two things the window answers for:
// which spreads are open (the gate: OPEN_AT, the count way, SPREADS.md 5.5; DEBUG's lend opens all) and the refusal where a tool swap is
// refused (toolpairs.js swapRefusal: a fight, a duel, at sea, mid-race, at a table), said in the log at the point of use.
//
// Prior art: Hades' Mirror of Night (chosen between runs, never inside one), Monster Hunter's loadouts (set at camp).
//
//   const R = new Reading(game)   R.spread  R.laid  R.flipped   R.bound() -> Set   R.pair() -> card | null   R.opened() -> [spreadId]
//   R.hand() -> [card]   R.cells()  R.sums()  R.counted()   R.setSpread(id)  R.lay(position, card)  R.reverse(position)  R.take(position)
//   R.flip(under?)   R.suitAt(position)   (each act -> bool; a refusal is said)
// ---------------------------------------------------------------------------------------
import { OPEN_AT, SPREAD_ORDER, suitOf } from '../progress/spreads.js';
import { swapRefusal } from '../progress/toolpairs.js';

export { OPEN_AT };

export class Reading {
  constructor(game) { this.game = game; }
  get L() { return this.game.laidSpread; }
  get spread() { return this.L?.spread ?? 'one'; }
  get laid() { return this.L?.laid ?? {}; }
  get flipped() { return !!this.L?.under; }

  /** The Majors bound (the collection's), the Fool always among them. */
  bound() { return new Set(['fool', ...(this.L?.majors ?? this.game.collection?.majors ?? [])]); } // (Petra's .majors: every one under the lend)
  pair() { return this.L?.pairCard ?? null; }
  /** The spreads open: by the count of Majors bound (the Fool not counted), or lent (DEBUG). The feat ways come with their achievements. */
  opened() {
    const n = this.bound().size - 1, lent = this.game.lend?.has('spreads');
    return SPREAD_ORDER.filter((id) => lent || n >= OPEN_AT[id]);
  }
  hand() { return this.L?.hand ?? []; }
  cells() { return this.L?.cells ?? []; }
  sums() { return this.L?.sums ?? { wands: 0, cups: 0, swords: 0, pentacles: 0 }; }
  counted() { return this.L?.counted ?? []; }
  suitAt(position) { const c = this.laid[position]; return c ? suitOf(c.card, c.reversed) : null; }

  refused() {
    const why = swapRefusal(this.game);
    if (why) this.game.log?.say('warn', why.replace('change tools', 'lay a spread'), { key: 'spread.refused', throttle: 2 });
    return !!why;
  }
  setSpread(id) { return !!this.L && id !== this.spread && this.opened().includes(id) && !this.refused() && this.L.choose(id); }
  lay(position, card) { return !!this.L && !this.refused() && this.L.lay(position, card, false); }
  reverse(position) { return !!this.L && !this.refused() && this.L.reverse(position); }
  take(position) { return !!this.L && !this.refused() && this.L.pick(position); }
  flip(under) { return !!this.L?.flip(under); }
}
