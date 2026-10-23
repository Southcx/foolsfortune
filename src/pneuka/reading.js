// ---------------------------------------------------------------------------------------
// THE READING: the spread laid on the Pneuka Box's underside, kept and changed (docs/plans/SPREADS.md 5, 7). The rules are
// progress/spreads.js (what a card lights, what a cell is worth); this is the state that rules read: which spread is laid, which Major
// sits in each of its positions and how (upright or reversed), and when it was laid (the Past fades and the Future grows from then). It
// reads the world for the positions' rules (a fight, company, the pool, the game day's goals), lays and takes up cards at your word,
// refuses where a tool swap is refused (the same rule: toolpairs.js swapRefusal), and says what it did on the bus. The window draws it
// (pneuka/ui.js, pneuka/underside.js), the reading view shows it (Calissa's vfx/readingview.js, in Petra's scene), the tallies' hooks
// read `sums()` (Petra's).
//
// Where a Major is bound is moving (SPREADS.md 6: the Veritome's book to the Codex's collection, Petra's): `bound()` asks the collection
// first and the book's pages after, so it reads the right one on either side of the move.
//
// Prior art: Hades' Mirror of Night (one screen, chosen between runs, its effects read in the run); Monster Hunter's item loadouts
// (set at camp, carried out); the spreads' own books (a card's place is half its meaning).
//
//   const R = new Reading(game)   game.reading   R.spread  R.laid  R.flipped
//   R.bound() -> Set   R.hand() -> [card]   R.opened() -> [spreadId]   R.pair() -> card | null   R.ctx() -> the rules' context
//   R.cells() -> 56 (the face's)   R.items() -> 56   R.sums() -> { suit: points }   R.counted() -> [{ i, suit, w }]
//   R.setSpread(id)  R.lay(position, card)  R.reverse(position)  R.take(position)  -> bool (a refusal is said: the log)   R.flip(under)
// ---------------------------------------------------------------------------------------
import { SPREADS, SUITS, light, tally, suitOf } from '../progress/spreads.js';
import { ARCANA } from '../tools/veritome/arcana.js';
import { PAIRS, pairOf, swapRefusal } from '../progress/toolpairs.js';
import { itemOf } from './items.js';
import { now, DAY_MS } from '../core/calendar.js';

/** How many Majors bound open each spread, the count way (SPREADS.md 5.5; the feat ways come with their achievements). */
export const OPEN_AT = { one: 0, three: 3, horseshoe: 7, celtic: 12 };
const ORDER = ['one', 'three', 'horseshoe', 'celtic'];
const MAJOR_IDS = ARCANA.map((A) => A.id); // (in the tarot's order, 0 the Fool to XXI the World)
const fresh = () => ({ spread: 'one', laid: {}, at: 0 });

export class Reading {
  constructor(game) {
    this.game = game;
    Object.assign(this, fresh());
    this.flipped = false;
    this.changed = false; // (since the last flip: the log speaks once, on the flip back)
    game.save?.section('spread', {
      scope: 'player', version: 1,
      dump: () => ({ spread: this.spread, laid: this.laid, at: this.at }),
      load: (d) => { Object.assign(this, fresh(), d || {}); if (!SPREADS[this.spread]) this.spread = 'one'; },
      reset: () => Object.assign(this, fresh()),
    });
  }

  /** The Majors bound: the Codex's collection when it is there, else the Veritome's pages (either side of SPREADS.md 6's move). The
   *  Fool is you, bound from the start. DEBUG's lend opens every one. */
  bound() {
    const g = this.game, out = new Set(['fool']);
    const lent = g.lend?.has('spreads');
    for (const id of MAJOR_IDS) {
      const card = `arcana.${id}`;
      if (lent || g.collection?.has?.(card) || g.veritome?.book?.seen?.[card] || g.veritome?.book?.has?.(card)) out.add(id);
    }
    return out;
  }
  /** Your pair's card: the Major the main and the sub make (toolpairs.js PAIRS, I to XXI). */
  pair() { const b = this.game.belt, p = b && pairOf(b.main, b.sub); return p ? MAJOR_IDS[p.n] ?? null : null; }
  /** The spreads opened: by the count of Majors bound (the Fool not counted), or lent. */
  opened() {
    const n = this.bound().size - 1, lent = this.game.lend?.has('spreads');
    return ORDER.filter((id) => lent || n >= OPEN_AT[id]);
  }
  /** The bound Majors not laid in this spread, nor your pair's card (it lies in the Present), nor the Fool (the significator). */
  hand() {
    const used = new Set(Object.values(this.laid).map((L) => L.card)), pair = this.pair();
    return MAJOR_IDS.filter((id) => this.bound().has(id) && id !== 'fool' && id !== pair && !used.has(id));
  }

  /** What the positions' rules read (POSITION_RULES): the game days since laid, a fight, company, the pool, the goals done. */
  ctx() {
    const g = this.game, goals = g.goals?.list?.() || [];
    return {
      since: this.at ? Math.max(0, (now() - this.at) / DAY_MS) : 0,
      fight: !!g.combat?.engaged,
      company: (g.party?.list?.length || 0) + (g.guests?.list?.length || 0) > 0,
      pool: g.lachryma?.fraction ?? 1,
      goals: goals.length ? goals.filter((x) => x.done).length / goals.length : 0,
      pair: this.pair(),
      bound: this.bound(),
    };
  }
  cells() { return light(this.spread, this.laid, this.ctx()); }
  /** The Box's 56 things in the face's order, each as its item (for its suit), or null. */
  items() { return (this.game.pneuka?.slots || []).map((s) => (s ? itemOf(s.id) || null : null)); }
  sums() { return tally(this.cells(), this.items()).sums; }
  counted() { return tally(this.cells(), this.items()).counted; }

  // ---------------------------------------------------------------- acts (refused where a tool swap is)
  refused() {
    const why = swapRefusal(this.game);
    if (why) this.game.log?.say('warn', why.replace('change tools', 'lay a spread'), { key: 'spread.refused', throttle: 2 });
    return !!why;
  }
  setSpread(id) {
    if (!SPREADS[id] || id === this.spread || !this.opened().includes(id) || this.refused()) return false;
    const before = this.sums();
    this.spread = id; this.laid = {}; this.at = now();
    this.after(before, { spread: id });
    return true;
  }
  lay(position, card) {
    const P = SPREADS[this.spread]?.positions.find((p) => p.id === position);
    if (!P || P.pair || P.fixed || !this.hand().includes(card) || this.refused()) return false;
    const before = this.sums();
    this.laid = { ...this.laid, [position]: { card, reversed: false } };
    this.at = now();
    this.game.events?.emit('spread.lay', { card, position, reversed: false, spread: this.spread, by: 'courier' });
    this.after(before);
    return true;
  }
  reverse(position) {
    const L = this.laid[position];
    if (!L || this.refused()) return false;
    const before = this.sums();
    this.laid = { ...this.laid, [position]: { ...L, reversed: !L.reversed } };
    this.game.events?.emit('spread.lay', { card: L.card, position, reversed: !L.reversed, spread: this.spread, by: 'courier' });
    this.after(before);
    return true;
  }
  take(position) {
    if (!this.laid[position] || this.refused()) return false;
    const before = this.sums(), rest = { ...this.laid };
    delete rest[position];
    this.laid = rest;
    this.after(before);
    return true;
  }
  /** After an act: the save marked, and the tallies that moved said on the bus, each with the board's state (Petra's catch: only on
   *  what you do; a tally drifting with the clock is read when used, never announced). */
  after(before) {
    this.changed = true;
    this.game.save?.dirty?.('spread');
    const cells = this.cells(), sums = tally(cells, this.items()).sums, dark = cells.filter((c) => c.dark).length;
    for (const suit of SUITS) if (Math.abs(sums[suit] - before[suit]) > 1e-6)
      this.game.events?.emit('spread.tally', { suit, from: before[suit], to: sums[suit], spread: this.spread, sums, dark, by: 'courier' });
    if (dark > 0) this.game.events?.emit('spread.crack', { suit: SUITS.find((s) => cells.some((c) => c.dark && c[s] > 0)) || 'wands', by: 'courier' });
    const S = SPREADS[this.spread], all = S.positions.every((p) => p.pair || p.fixed || this.laid[p.id]);
    if (all && S.positions.some((p) => p.rule === 'outcome')) this.game.events?.emit('spread.complete', { spread: this.spread, sums, by: 'courier' });
  }
  /** The flip: the underside shown (under) or the face again. Turning back after a change says the tallies once (tracking/spreads.js). */
  flip(under = !this.flipped) {
    if (under === this.flipped) return;
    this.flipped = under;
    this.game.events?.emit('spread.flip', { under, spread: this.spread, sums: this.sums(), changed: !under && this.changed, by: 'courier' });
    if (!under) this.changed = false;
  }
  /** The card's suit as laid, for the view (`suit` of each laid place). */
  suitAt(position) { const L = this.laid[position]; return L ? suitOf(L.card, L.reversed) : null; }
}

/** The pair cards' numbers (for the window's labels): PAIRS by card id. */
export const PAIR_OF_CARD = Object.fromEntries(PAIRS.map((p) => [MAJOR_IDS[p.n], p]));
