// ---------------------------------------------------------------------------------------
// THE LAID SPREAD: the one spread you have laid on the Pneuka Box's underside, kept, lit and told (docs/plans/SPREADS.md; the rules are
// Dovina's, progress/spreads.js, which keeps no state). It holds which spread is laid and a card in each position (reversed or not, and
// when, on the calendar's clock), puts your pair's card in the Present itself, lights the board (`light`) and counts the four tallies
// over what sits in the Box's cells (`tally`). Each tally is a modifier with the board as its source (the base never changes):
//   Wands      the tools' Lachryma costs          (the pool's costMult, every tag but the god hand's)
//   Cups       the pool's regen and the Bottles' feed (regenMult; tools/soulbrush/load.js reads cupsK)
//   Swords     the status your blows build          (creatures.build, the four a damage type builds)
//   Pentacles  worth when sold or condensed          (the shops' offer, the collection's condense, a route map sold)
//
// What it tells (the log speaks only on what you do, SPREADS.md; Wanda's sounds hang on all five, audio/cues.js):
//   spread.lay { spread, position, card (null: taken back), reversed }   spread.flip { under }   spread.tally { suit, from, to, lit,
//   counting, dark, spread, cap } (each suit that moved, after an act: a lay, a reverse, a card taken back, a spread chosen, the pair
//   changed, a thing moved in the Box)   spread.class { from, to } (the class read changed)   spread.crack { suit } (a cell gone
//   dark)   spread.complete { spread } (its Outcome lit)   all with `by`. A spread loaded from the save is recounted without a word.
// What moves by itself (the Past fading, Self with the pool, the Challenge in a fight, the party) changes the modifiers quietly and shows
// on the board and the window's tallies, never in the log.
//
// Prior art: a tarot reader's table (the spread laid once and read as the day goes); Diablo II's charms and Backpack Hero (power from
// where a thing sits, recounted when it moves); the Golden Dawn's Book T for the rules it hands to spreads.js.
//
//   game.laidSpread = new LaidSpread(game)   .spread  .laid  .under   .choose(id)  .lay(position, card, reversed?)  .pick(position)
//   .reverse(position)  .flip(under?)  .hand  .majors  .lent (DEBUG's spreads row: every Major to lay)
//   .update(rawDt)   .cells (the face's 56)  .sums  .counted  .effect(suit)  .cupsK  .swordsK  .worthK
//   .class (the class your suits read as, CLASSES.md)   save section `spread` (scope player)
// ---------------------------------------------------------------------------------------
import { SPREADS, SUITS, TALLY, CLASS, light, tally, effectOf, dayCard } from './spreads.js';
import { seasonOf } from './seasons.js';
import { ARCANA } from '../tools/veritome/arcana.js';
import { itemOf } from '../pneuka/items.js';
import { now, today, DAY_MS } from '../core/calendar.js';

const ZERO = () => ({ wands: 0, cups: 0, swords: 0, pentacles: 0 });
const STEP = 0.5; // (real s between quiet recounts: the strengths that move by themselves move slowly)

export class LaidSpread {
  constructor(game) {
    this.game = game;
    this.spread = 'one'; this.laid = {}; this.under = false;
    this.cells = light('one'); this.sums = ZERO(); this.counted = [];
    this.told = ZERO(); this.dark = new Set(); this.complete = false; this.class = null; this.toldClass = null;
    this.act = true; this.quiet = true; this.t = 0; this.sig = ''; this.pairWas = null; // (quiet: a spread loaded is recounted, not told)
    game.save?.section('spread', {
      scope: 'player', version: 1,
      dump: () => ({ spread: this.spread, laid: this.laid }),
      load: (d) => { this.spread = SPREADS[d?.spread] ? d.spread : 'one'; this.laid = {}; for (const [p, L] of Object.entries(d?.laid || {})) if (this.position(p) && L?.card) this.laid[p] = { card: L.card, reversed: !!L.reversed, at: +L.at || now() }; this.act = this.quiet = true; },
      reset: () => { this.spread = 'one'; this.laid = {}; this.act = this.quiet = true; },
    });
  }
  get positions() { return SPREADS[this.spread].positions; }
  position(id) { return SPREADS[this.spread].positions.find((p) => p.id === id) || null; }
  /** Your pair's card, laid in the Present by the belt itself (progress/toolpairs.js: the pair's number is its Major's). */
  get pairCard() { const p = this.game.belt?.pair; return p ? ARCANA[p.n]?.id ?? null : null; }
  /** DEBUG's lend row `spreads` (progress/lend.js): every Major yours to lay, bound or not; the collection itself is not touched. */
  get lent() { return !!this.game.lend?.has?.('spreads'); }
  /** The Major Arcana you may hold: bound in the collection (or every one, lent). */
  get majors() { return this.lent ? ARCANA.map((A) => A.id) : (this.game.collection?.majors || []); }
  /** The Major Arcana you may lay: yours (above), and not laid elsewhere. */
  get hand() { const laid = new Set(Object.values(this.laid).map((L) => L.card)); return this.majors.filter((c) => c !== 'fool' && c !== this.pairCard && !laid.has(c)); }
  emit(k, e) { this.game.events?.emit(k, { ...e, by: 'courier' }); }

  /** Lay a spread: the cards in the last one come back to the hand. */
  choose(id) {
    if (!SPREADS[id] || id === this.spread) return false;
    this.settle();
    this.spread = id; this.laid = {}; this.complete = false; this.changed();
    return true;
  }
  /** A bound Major into a position (out of any other it was in); refused for the Present (your pair's) and the Fool's place. */
  lay(position, card, reversed = false) {
    const P = this.position(position);
    if (!P || P.pair || P.fixed || !card || !this.majors.includes(card) || card === 'fool' || card === this.pairCard) return false;
    this.settle();
    for (const [k, L] of Object.entries(this.laid)) if (L.card === card) delete this.laid[k];
    this.laid[position] = { card, reversed: !!reversed, at: now() };
    this.emit('spread.lay', { spread: this.spread, position, card, reversed: !!reversed });
    this.changed();
    return true;
  }
  /** A laid card taken back to the hand. */
  pick(position) {
    if (!this.laid[position]) return false;
    this.settle();
    delete this.laid[position];
    this.emit('spread.lay', { spread: this.spread, position, card: null, reversed: false });
    this.changed();
    return true;
  }
  /** A laid card turned upside down, or back: its footprint turned half round and its suit its contrary (spreads.js). */
  reverse(position) {
    const L = this.laid[position]; if (!L) return false;
    this.settle();
    L.reversed = !L.reversed;
    this.emit('spread.lay', { spread: this.spread, position, card: L.card, reversed: L.reversed });
    this.changed();
    return true;
  }
  /** The Box turned over to its underside, or back (the window's FLIP, F; the reading view watches it). */
  flip(under = !this.under) {
    under = !!under; if (under === this.under) return false;
    this.under = under;
    this.emit('spread.flip', { under });
    return true;
  }
  changed() { this.act = true; this.game.save?.dirty('spread'); }

  /** What the positions' rules read (spreads.js POSITION_RULES): the game days since laid, the fight, the party, the pool, the goals. */
  ctx() {
    const g = this.game, t = now(), since = (id) => (this.laid[id] ? (t - this.laid[id].at) / DAY_MS : 0);
    const goals = g.goals?.list?.() || [];
    return {
      since: since('past') || since('future'), sinceOf: since, // (sinceOf: each position its own, once light() asks for it)
      fight: !!g.combat?.engaged, company: !!(g.party?.list?.length || g.guests?.list?.length),
      pool: g.lachryma?.fraction ?? 1, goals: goals.length ? goals.filter((x) => x.done).length / goals.length : 0,
      pair: this.pairCard, bound: new Set(this.majors),
      dayCard: dayCard(today()), // (the day's card doubles its strength where it is laid: SPREADS.md 11.2)
    };
  }

  /** Once a frame (main.js): recounted at once after an act, else every STEP real s. */
  update(raw = 1 / 60) {
    const box = this.game.pneuka; if (!box) return;
    const sig = box.slots.map((s) => s?.id || '').join('|');
    if (sig !== this.sig) { this.sig = sig; this.act = true; }
    if (this.pairCard !== this.pairWas) { this.pairWas = this.pairCard; this.act = true; }
    this.t += raw;
    if (!this.act && this.t < STEP) return;
    this.t = 0;
    const act = this.act; this.act = false;
    this.recount();
    if (this.quiet) { this.quiet = false; this.hush(); return; }
    if (act) this.tell();
  }
  recount() {
    const box = this.game.pneuka; if (!box) return;
    this.cells = light(this.spread, this.laid, this.ctx());
    const r = tally(this.cells, box.slots.map((s) => (s ? itemOf(s.id) : null)), { season: seasonOf().id }); // (the season's suit x1.25: 11.1)
    this.sums = r.sums; this.counted = r.counted; this.class = r.class; // (the class your suits read as: the Fool, a court, a zodiac Major or the World, CLASSES.md)
    this.apply();
  }
  /** Before an act: a spread loaded and not yet recounted is settled first, so the act alone is told. */
  settle() { if (this.quiet) { this.recount(); this.quiet = false; this.hush(); } }
  /** A spread loaded (or reset): what tell() compares against, set without a word. */
  hush() {
    for (const suit of SUITS) this.told[suit] = +this.sums[suit].toFixed(2);
    this.dark = new Set(); this.cells.forEach((c, i) => { if (c.dark) this.dark.add(i); });
    this.complete = this.isComplete(); this.toldClass = this.class?.id ?? null;
  }
  isComplete() {
    const out = this.positions.find((p) => p.rule === 'outcome');
    return !!out && this.positions.filter((p) => p.rule !== 'outcome').every((p) => p.fixed || (p.pair ? !!this.pairCard : !!this.laid[p.id])) && !!this.laid[out.id];
  }
  /** After an act: each suit that moved, the cells newly dark, the class changed, the Outcome newly lit. */
  tell() {
    const C = this.cells, lit = C.filter((c) => !c.dark && (c.wands || c.cups || c.swords || c.pentacles || c.wild)).length, dark = C.filter((c) => c.dark).length, counting = this.counted.length;
    for (const suit of SUITS) {
      const from = this.told[suit], to = +this.sums[suit].toFixed(2);
      if (Math.abs(to - from) > 0.01) this.emit('spread.tally', { suit, from, to, lit, counting, dark, spread: this.spread, cap: TALLY.cap + (this.class?.lifts === suit ? CLASS.lift : 0) });
      this.told[suit] = to;
    }
    const nowDark = new Set(); C.forEach((c, i) => { if (c.dark) nowDark.add(i); });
    for (const i of nowDark) if (!this.dark.has(i)) { const c = C[i]; this.emit('spread.crack', { suit: c.wands && c.cups ? 'wands' : 'swords', cell: i }); }
    this.dark = nowDark;
    const cls = this.class?.id ?? null;
    if (cls !== this.toldClass) { this.emit('spread.class', { from: this.toldClass, to: cls }); this.toldClass = cls; }
    const done = this.isComplete();
    if (done && !this.complete) this.emit('spread.complete', { spread: this.spread });
    this.complete = done;
  }

  // ---------------------------------------------------------------- the tallies as modifiers
  effect(suit) { return effectOf(suit, this.sums[suit] || 0); }
  get cupsK() { return 1 + this.effect('cups'); }
  get swordsK() { return 1 + this.effect('swords'); }
  get worthK() { return 1 + this.effect('pentacles'); }
  /** The pool's modifier (courier/lachryma.js): the tools' costs (Wands; the god hand's powers keep their price) and the regen (Cups). */
  apply() {
    const L = this.game.lachryma; if (!L?.addModifier) return;
    const w = 1 + this.effect('wands'), c = this.cupsK;
    if (w === 1 && c === 1) { L.removeModifier?.('spread'); return; }
    L.addModifier('spread', { costMult: { '*': w, god: 1 }, regenMult: c });
  }
}
