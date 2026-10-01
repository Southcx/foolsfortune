// ---------------------------------------------------------------------------------------
// THE BOOK: the Veritome's binder, and so the Courier's BANK: where things are kept for good, as cards. Its rules are Greed Island's
// (Hunter x Hunter), made formal:
//
//  - Every card has a DESIGNATED PAGE (cards.js). The first copy fills it; spare copies go into the FREE SLOTS (twenty, shared).
//    A card's LIMIT is the most copies the Book may hold, so a page is a stack with a ceiling.
//  - Things come and go through the PNEUKA BOX (pneuka/box.js), the Courier's own carried storage: a thing in the box is STORED
//    (it becomes its card here), and a card with an item form is TAKEN OUT (it becomes the thing, in the box). Both only while the
//    Veritome is held open. Cards with no item form (the Arcana, the creatures) come straight from the darkroom and stay cards.
//  - CONDENSE turns a spare copy into Lachryma cubes by its rank (the shop buying a card).
//
// The Book also keeps the rest of what the Veritome knows, so it is saved in one place: the film (film.js), the Compendium (the best
// photograph of each kind of thing), the map pins (where photographs were taken), and the bestiary's facts (bestiary.js).
// It is kept in the browser beside the map; the ledger is told everything through events (tracking.js), so achievements stay
// predicates over the ledger.
//
//   book.count(id) has(id) spares(id) freeUsed canTake(id) known(id)    book.give(id, from) -> bool    book.take(id) -> bool
//   book.condense(id) -> cubes    book.filled / CARDS.length
// ---------------------------------------------------------------------------------------
import { CARDS, CARD, FREE_SLOTS, WORTH } from './cards.js';
import { CURIOS } from '../treasure.js';
import { Film } from './film.js';
import { Bestiary } from './bestiary.js';
import { sfx } from '../audio.js';

const KEY = 'foolsfortune.veritome.v2', OLD = 'foolsfortune.veritome.v1';
export { FREE_SLOTS };

export class Book {
  constructor(game) {
    this.game = game;
    this.cards = {};   // card id -> copies in the Book (its page, then spares)
    this.seen = {};    // card id -> true once it has ever been bound (its page shows its face from then on)
    this.legacyItems = null; this.legacyLoose = null; // (things the first Book held as things: the Pneuka Box takes them, once)
    this.photos = {};  // the Compendium: subject kind -> { score, stars, thumb, at }
    this.pins = [];    // where photographs were taken: { x, y, z, yaw, kind, stars }
    this.plates = [];  // the film's plates (film.js)
    this.facts = {};   // the bestiary's known facts (bestiary.js)
    this.migrated = {};
    this.load();
    this.film = new Film(this.plates);
    this.bestiary = new Bestiary(this.facts);
  }

  // ---------------------------------------------------------------- what the Book holds
  count(id) { return this.cards[id] || 0; }
  has(id) { return this.count(id) > 0; }
  spares(id) { return Math.max(0, this.count(id) - 1); }
  known(id) { return !!this.seen[id]; }
  get freeUsed() { let n = 0; for (const id in this.cards) n += this.spares(id); return n; }
  get filled() { let n = 0; for (const c of CARDS) if (this.has(c.id)) n++; return n; }
  filledIn(section) { return CARDS.filter((c) => c.section === section && this.has(c.id)).length; }
  /** Would another copy fit? (under its limit, and in a free slot if its page is taken) */
  canTake(id) { const A = CARD[id], n = this.count(id); return !!A && n < A.limit && (n === 0 || this.freeUsed < FREE_SLOTS); }

  /** A copy into the Book. False if it drifts away (the limit, or the free slots, are full). */
  give(id, from = 'photo') {
    const A = CARD[id];
    if (!A) return false;
    if (!this.canTake(id)) { this.game.events?.emit('card.drift', { card: id, from }); return false; }
    const n = this.count(id);
    this.cards[id] = n + 1;
    const first = !this.seen[id];
    this.seen[id] = true;
    this.save();
    this.game.events?.emit('card.get', { card: id, page: n === 0, first, rank: A.rank, section: A.section, from });
    sfx.cardGet?.(n === 0);
    return true;
  }

  /** Take a copy out (it becomes the thing itself, in the Pneuka Box: pneuka/box.js does the rest). */
  take(id) {
    if (!this.has(id)) return false;
    this.cards[id]--;
    if (!this.cards[id]) delete this.cards[id];
    this.save();
    return true;
  }

  /** Condense a spare copy into cubes (by its rank). */
  condense(id) {
    const A = CARD[id];
    if (!A || this.spares(id) < 1) return 0;
    this.cards[id]--;
    const worth = WORTH[A.rank] || 10;
    this.game.cubes?.earn(worth, 'condense');
    this.save();
    this.game.events?.emit('card.condense', { card: id, cubes: worth });
    return worth;
  }

  tick() { if (!this.migrated.curio && this.game.ledger) this.migrateCurios(); }

  /** Curios found before the Book kept them (the ledger counted them) are bound onto their pages, once. */
  migrateCurios() {
    const Lg = this.game.ledger;
    for (const c of CURIOS) {
      const id = `curio.${c.id}`;
      if (Lg.get(`curio.${c.id}`) > 0 && !this.seen[id] && !this.game.pneuka?.held(id)) { this.cards[id] = 1; this.seen[id] = true; }
    }
    this.migrated.curio = true;
    this.save();
  }

  // ---------------------------------------------------------------- kept in the browser
  save() {
    const plates = this.plates.slice(-40);
    const s = { cards: this.cards, seen: this.seen, items: this.legacyItems, loose: this.legacyLoose, photos: this.photos, pins: this.pins.slice(-60), plates, facts: this.facts, migrated: this.migrated };
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {
      // (storage full: keep everything but the pictures on the film)
      try { localStorage.setItem(KEY, JSON.stringify({ ...s, plates: plates.map((p) => ({ ...p, thumb: null })) })); } catch { /* unavailable: the Book still works this session */ }
    }
  }
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) {
        Object.assign(this, { cards: s.cards || {}, seen: s.seen || {}, legacyItems: s.items || null, legacyLoose: s.loose?.length ? s.loose : null, photos: s.photos || {}, pins: s.pins || [], plates: s.plates || [], facts: s.facts || {}, migrated: s.migrated || {} });
        return;
      }
      // the first Book (the Arcana only, kept under their bare names): its cards and photographs carry over
      const o = JSON.parse(localStorage.getItem(OLD) || 'null');
      if (o) {
        for (const [k, n] of Object.entries(o.cards || {})) if (CARD[`arcana.${k}`] && n > 0) { this.cards[`arcana.${k}`] = Math.min(n, CARD[`arcana.${k}`].limit); this.seen[`arcana.${k}`] = true; }
        this.photos = o.photos || {}; this.pins = o.pins || [];
      }
    } catch { /* nothing kept */ }
  }
  erase() {
    for (const k of ['cards', 'seen', 'photos', 'facts', 'migrated']) for (const id in this[k]) delete this[k][id];
    this.legacyItems = null; this.legacyLoose = null; this.pins.length = 0; this.plates.length = 0;
    this.save();
  }
}
