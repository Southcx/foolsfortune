// ---------------------------------------------------------------------------------------
// THE BOOK: what the Veritome knows, kept in one place. It is not a bank and holds no cards (the owner's ruling of 2026-10-23: the
// Veritome is observation and reprogramming only; a card earned is bound in the collection, progress/collection.js, and a thing kept for
// good goes in the Pneuka Box's storage at a Shrine, pneuka/box.js). It keeps:
//
//  - the memory (memory.js): the plates not yet appraised;
//  - the Compendium: the best photograph of each kind of thing;
//  - the map pins: where photographs were taken;
//  - the bestiary's facts (bestiary.js).
//
// It is kept in the browser under its own adopted key (core/save.js ADOPTED, wiped with the player scope on a new build): the plates'
// pictures run to hundreds of KB, and the save writes each scope as one record, so in a section they would be written whole on every
// player-scope flush. The ledger is told everything through events (tracking.js), so achievements stay predicates over the ledger.
//
//   book.memory  book.bestiary  book.photos[kind]  book.pins  book.save()
// ---------------------------------------------------------------------------------------
import { VeritomeMemory } from './memory.js';
import { Bestiary } from './bestiary.js';

const KEY = 'foolsfortune.veritome.v2';

export class Book {
  constructor(game) {
    this.game = game;
    this.photos = {};  // the Compendium: subject kind -> { score, stars, thumb, at }
    this.pins = [];    // where photographs were taken: { x, y, z, yaw, kind, stars }
    this.plates = [];  // the memory's plates (memory.js)
    this.facts = {};   // the bestiary's known facts (bestiary.js)
    this.keep = game?.save?.keyed?.(KEY, 'player') || null; // (its plates' pictures are too big for the player's record: its own key, through the save)
    this.load();
    this.memory = new VeritomeMemory(this.plates);
    this.bestiary = new Bestiary(this.facts);
  }

  // ---------------------------------------------------------------- kept in the browser
  save() {
    const plates = this.plates.slice(-40);
    const s = { photos: this.photos, pins: this.pins.slice(-60), plates, facts: this.facts };
    if (!this.keep || this.keep.put(JSON.stringify(s), { quiet: true })) return;
    this.keep.put(JSON.stringify({ ...s, plates: plates.map((p) => ({ ...p, thumb: null })) })); // (storage full: everything but the memory's pictures; refused again, said once by the save)
  }
  load() {
    const s = this.keep?.json();
    if (s) Object.assign(this, { photos: s.photos || {}, pins: s.pins || [], plates: s.plates || [], facts: s.facts || {} });
  }
}
