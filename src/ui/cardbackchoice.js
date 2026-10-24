// ---------------------------------------------------------------------------------------
// A CARD BACK'S CHOICE (plain name): which back each deck wears. Two decks, the house deck (Raku's tables) and the Arcana (the collection's
// Major Arcana face down: the reading table, the reading view, the tables' Major Arcana), each its own back by default (the lapis chip, the
// plum eye: vfx/cardbacks.js) or any of the twelve of the set (vfx/cardbackset.js: the four suits', the four islands', the four seasons').
// The store itself is the vfx module's (the atlas and the pieces read it with no `game`); this is the player's side of it: the options
// with their lines, what is open, the save (a settings section: a preference, kept across builds and both modes) and the chat command.
// What opens a back is Dovina's (OPEN_WHEN below, empty until her rows land: docs/handoffs/dovina/2026-10-24-from-calissa-card-backs.md);
// until then every back is open in the DEBUG save only, and a deck's own back is always open.
//
//   game.cardBacks = new CardBackChoice(game)   .house / .arcana (the id worn)   .options(deck) -> [{ id, label, line, group, open, worn }]
//   .set(deck, id) -> { ok, reason? }   .isOpen(id)      /cardback <house|arcana> <id>  (/cardback alone lists them)
//   event cardback.set { deck, id, by: 'courier' }   (feedback/tracking/cardbacks.js says it)
//
// Prior art: Hearthstone's and Gwent's card back pickers (one per player, earned or seasonal), the Windows card games' deck choice.
// ---------------------------------------------------------------------------------------
import { BACK_SET, BACK_DECKS, BACK_DEFAULT, chosenBack, chooseBack, backCellOf } from '../vfx/cardbackset.js';

/** What opens a back, by id: `(game) => bool` (Dovina's to fill: a predicate over the ledger or the achievements). */
export const OPEN_WHEN = {};
const DECK_WORD = { house: 'the house deck', arcana: 'the Major Arcana' };

export class CardBackChoice {
  constructor(game) {
    this.game = game;
    game.save?.section('cardBacks', {
      scope: 'settings', version: 1, dump: () => ({ house: this.house, arcana: this.arcana }),
      load: (d) => { for (const deck of BACK_DECKS) if (d && backCellOf(d[deck]) != null) chooseBack(deck, d[deck]); this.enforce(); },
      reset: () => { for (const deck of BACK_DECKS) chooseBack(deck, BACK_DEFAULT[deck]); },
    });
    game.chat?.add('cardback', {
      help: 'the back each deck wears: /cardback lists them; /cardback house nacre, /cardback arcana winter (own puts the deck\'s own back)',
      run: (args) => this.command(args),
    });
  }
  get house() { return chosenBack('house'); }
  get arcana() { return chosenBack('arcana'); }
  /** Open to wear: a deck's own back, anything in the DEBUG save, or what Dovina's rule opens. */
  isOpen(id) {
    if (id === 'house' || id === 'arcana') return true;
    return this.game.mode === 'debug' || OPEN_WHEN[id]?.(this.game) === true;
  }
  /** A back no longer open (the DEBUG save's pick, kept in the settings, met in STORY) put back to the deck's own. */
  enforce() { for (const deck of BACK_DECKS) if (!this.isOpen(chosenBack(deck))) chooseBack(deck, BACK_DEFAULT[deck]); }
  /** A deck's choices, its own first: { id, label, line, group, open, worn }. */
  options(deck) {
    this.enforce();
    const own = deck === 'arcana' ? { id: 'arcana', label: 'Arcana', line: 'Plum velvet and the eye.' } : { id: 'house', label: 'House', line: 'A lapis ground, a gold chip.' };
    return [{ ...own, group: 'own' }, ...BACK_SET].map((b) => ({ id: b.id, label: b.label, line: b.line, group: b.group, open: this.isOpen(b.id), worn: chosenBack(deck) === b.id }));
  }
  /** A deck wears `id` (`own` for its own back); refused for a deck or a back that is none, or one not open. */
  set(deck, id) {
    if (id === 'own') id = BACK_DEFAULT[deck];
    if (!BACK_DECKS.includes(deck)) return { ok: false, reason: 'There is no such deck (house or arcana).' };
    if (backCellOf(id) == null) return { ok: false, reason: 'There is no such card back.' };
    if (!this.isOpen(id)) return { ok: false, reason: 'That card back is not open to you yet.' };
    if (chooseBack(deck, id)) { this.game.save?.dirty('cardBacks'); this.game.events?.emit('cardback.set', { deck, id, by: 'courier' }); }
    return { ok: true };
  }
  command(args) {
    const g = this.game, [deck, id] = (args || []).map((a) => String(a).toLowerCase());
    if (!deck) { g.log?.say('system', `Card backs: ${DECK_WORD.house} wears ${this.house}, ${DECK_WORD.arcana} wears ${this.arcana}. Set: ${BACK_SET.filter((b) => this.isOpen(b.id)).map((b) => b.id).join(', ') || 'none open yet'}.`, { key: 'cardback.list', throttle: 1 }); return; }
    const r = this.set(deck, id || '');
    if (!r.ok) g.log?.say('warn', `${r.reason} (/cardback <house|arcana> <back>)`, { key: 'cardback.refuse', throttle: 1 });
  }
}
