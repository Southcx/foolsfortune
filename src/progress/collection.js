// ---------------------------------------------------------------------------------------
// THE COLLECTION: the cards bound, kept in the Codex (docs/plans/SPREADS.md 6; the owner's ruling of 2026-10-23: the Veritome is
// observation and reprogramming only, its card storage moved out). The 22 Major Arcana and the creature cards, each bound once: a
// plate appraised still earns its card (tools/veritome/darkroom.js), and a second photograph of a sitting already bound condenses into
// cubes by its rank (ECON.condense), as a spare did. The Fool is you, bound from the start. Curios are things now, in the Pneuka Box
// and its storage (pneuka/box.js), never cards.
//
// The Major Arcana bound are what a spread lays (progress/spreads.js); the Codex's THE ARCANA shelf shows them (feedback/codex/arcana.js),
// and the bestiary its creatures' cards. The ledger hears each bind and condense (`card.get`, `card.condense`: tracking.js).
//
// Prior art: Greed Island's Book, its limits dropped to one (a card is a thing known, not a stack); Pokémon's Pokédex (seen once, known
// for good); Persona's Compendium (the arcana kept, a second one paid out).
//
//   game.collection = new Collection(game)   .has(id)   .bind(id, from) -> true (bound now) | false (already: condensed)
//   .filled  .filledIn(section)  .majors -> the Major Arcana bound (ids without 'arcana.')   save section `collection` (scope player)
// ---------------------------------------------------------------------------------------
import { CARDS, CARD, WORTH } from '../tools/veritome/cards.js';
import { sfx } from '../audio/sfx.js';

/** Bound from the start: the Fool is you (SPREADS.md 3). */
export const BOUND_AT_START = ['arcana.fool'];

export class Collection {
  constructor(game) {
    this.game = game;
    this.bound = new Set(BOUND_AT_START);
    game.save?.section('collection', {
      scope: 'player', version: 1,
      dump: () => ({ bound: [...this.bound] }),
      load: (d) => { this.bound = new Set([...BOUND_AT_START, ...(d?.bound || []).filter((id) => CARD[id])]); },
      reset: () => { this.bound = new Set(BOUND_AT_START); },
    });
  }
  has(id) { return this.bound.has(id); }
  get filled() { return CARDS.filter((c) => this.bound.has(c.id)).length; }
  filledIn(section) { return CARDS.filter((c) => c.section === section && this.bound.has(c.id)).length; }
  get majors() { return [...this.bound].filter((id) => id.startsWith('arcana.')).map((id) => id.slice(7)); }

  /** A card earned (a plate appraised): bound if it is new, else condensed into cubes by its rank. */
  bind(id, from = 'darkroom') {
    const A = CARD[id], g = this.game;
    if (!A) return false;
    if (this.bound.has(id)) {
      const cubes = Math.round((WORTH[A.rank] || 10) * (g.laidSpread?.worthK ?? 1)); // (Pentacles' tally: progress/laidspread.js)
      g.cubes?.earn(cubes, 'condense');
      g.events?.emit('card.condense', { card: id, cubes, by: 'courier' });
      return false;
    }
    this.bound.add(id);
    g.save?.dirty('collection');
    g.events?.emit('card.get', { card: id, rank: A.rank, section: A.section, from, by: 'courier' });
    sfx.cardGet?.(true);
    return true;
  }
}
