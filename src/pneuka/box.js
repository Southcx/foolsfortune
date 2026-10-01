// ---------------------------------------------------------------------------------------
// THE PNEUKA BOX: the Courier's innate storage, the space she carries with her (P). It is the transitory place: what is picked up,
// found in a chest or taken out of the Veritome comes here first; what is worn is worn from here; and what is to be kept for good is
// stored from here into the Veritome, which is the bank (long-term, stacked, by card: veritome/book.js).
//
//  - TWENTY-EIGHT SLOTS, one thing to a slot (OSRS's inventory: a full box is a reason to go home). A thing that will not fit falls at
//    her feet (ground.js) and is picked up again with F.
//  - EQUIPMENT: the LURE on the Sondelass' line (one of the six made lures she always has, or a curio from the box: tying a curio on
//    takes it out of its slot, and untying puts it back), and the tool belt, which is shown here but changed by drawing tools.
//  - THE BANK: while the Veritome is held open (J), the box and the Book are open together: a thing in the box is STORED (it becomes
//    its card in its page, up to the card's limit) and a card with an item form is TAKEN OUT (it becomes the thing, in the box).
//
// Prior art: Old School RuneScape's inventory (twenty-eight slots, a left click does the obvious thing, a right click lists the rest,
// Examine writes to the chat, Drop puts it on the ground, the bank is somewhere else and holds stacks), its equipment screen (worn
// things in their places beside the inventory), and Greed Island's Book for what the bank is.
//
//   const box = new PneukaBox(game)   box.add(id, from) -> slot | -1 (fell)   box.take(slot)   box.swap(a, b)   box.drop(slot)
//   box.store(slot) / box.storeAll() / box.withdraw(cardId) (the Veritome open)   box.tieOn(slot) / box.tieMade(id) / box.untie()
//   box.count(id)  box.held(id) (everywhere: box, line, Book, ground)  box.free  box.lure (the lure id on the line)  box.bankOpen
// ---------------------------------------------------------------------------------------
import { itemOf } from './items.js';
import { CARD } from '../veritome/cards.js';
import { LURES } from '../angling/lures.js';
import { sfx } from '../audio.js';

export const SLOTS = 28;
const KEY = 'foolsfortune.pneuka.v1';

export class PneukaBox {
  constructor(game) {
    this.game = game;
    this.slots = new Array(SLOTS).fill(null); // { id }
    this.lure = 'bob';
    this.load();
  }
  get book() { return this.game.veritome?.book || null; }
  /** The Book is open with the box while the Veritome is held open. */
  get bankOpen() { return !!this.game.veritome?.held; }
  get free() { return this.slots.filter((s) => !s).length; }
  get used() { return SLOTS - this.free; }
  count(id) { return this.slots.filter((s) => s?.id === id).length; }
  /** Every copy of a thing the Courier has: in the box, on the line, in the Book, on the ground. */
  held(id) { return this.count(id) + (this.lure === id ? 1 : 0) + (this.book?.count(id) || 0) + (this.game.ground?.count(id) || 0); }
  emit(k, e) { this.game.events?.emit(k, e); }

  /** A thing into the box (the first free slot). If there is no room it falls at her feet. */
  add(id, from = 'pickup') {
    if (!itemOf(id)) return -1;
    const i = this.slots.findIndex((s) => !s);
    if (i < 0) {
      const P = this.game.player;
      this.game.ground?.drop(id, P.pos.clone().setY(P.pos.y + 0.05), { from });
      this.emit('item.full', { item: id, from });
      return -1;
    }
    this.slots[i] = { id };
    this.save();
    this.emit('item.get', { item: id, from, slot: i, used: this.used });
    return i;
  }
  take(slot) { const s = this.slots[slot]; this.slots[slot] = null; this.save(); return s?.id || null; }
  swap(a, b) { if (a === b) return; [this.slots[a], this.slots[b]] = [this.slots[b], this.slots[a]]; this.save(); }

  /** Drop: on the ground at her feet. */
  drop(slot) {
    const id = this.take(slot);
    if (!id) return false;
    const P = this.game.player;
    this.game.ground?.drop(id, P.pos.clone().setY(P.pos.y + 0.05), { from: 'drop' });
    this.emit('item.drop', { item: id });
    return true;
  }
  examine(id) { if (itemOf(id)) this.emit('item.examine', { item: id }); }

  // ---------------------------------------------------------------- the bank (the Veritome, open)
  /** Store a thing in the Veritome: it becomes its card. Refused if the Book is shut or the card is at its limit. */
  store(slot) {
    const s = this.slots[slot], B = this.book;
    if (!s || !B) return false;
    if (!this.bankOpen) { this.refuse('Draw the Veritome (J) to store things in it.', 'bankshut'); return false; }
    const card = itemOf(s.id)?.card;
    if (!card || !CARD[card]) { this.refuse('That has no page in the Veritome.', 'nopage'); return false; }
    if (!B.canTake(card)) { this.refuse(`The Veritome can hold no more of the ${itemOf(s.id).name}.`, `full.${card}`); return false; }
    this.slots[slot] = null;
    B.give(card, 'store');
    this.save();
    sfx.cardDraw?.();
    this.emit('item.store', { item: s.id });
    return true;
  }
  storeAll() { let n = 0; for (let i = 0; i < SLOTS; i++) if (this.slots[i] && this.store(i)) n++; return n; }
  /** Take a card out of the Veritome as the thing itself, into the box. */
  withdraw(card) {
    const B = this.book, A = CARD[card];
    if (!B || !A || A.form !== 'item' || !B.has(card)) return false;
    if (!this.bankOpen) { this.refuse('Draw the Veritome (J) to take things out of it.', 'bankshut'); return false; }
    if (!this.free) { this.refuse('Your Pneuka Box is full.', 'boxfull'); return false; }
    B.take(card);
    const i = this.slots.findIndex((s) => !s);
    this.slots[i] = { id: card };
    this.save();
    sfx.cardDraw?.();
    this.emit('item.withdraw', { item: card, slot: i });
    return true;
  }

  // ---------------------------------------------------------------- the line
  /** Tie a curio from the box onto the line (what was tied on goes back into its slot). */
  tieOn(slot) {
    const s = this.slots[slot];
    if (!s || !itemOf(s.id)?.lure) return false;
    const prev = this.lure;
    this.slots[slot] = itemOf(prev) ? { id: prev } : null;
    this.lure = s.id;
    this.save();
    this.emit('lure.tie', { lure: s.id, curio: true });
    return true;
  }
  /** Tie on one of the made lures (a curio on the line goes back into the box, if there is room). */
  tieMade(id) {
    if (!LURES.some((l) => l.id === id) || this.lure === id) return false;
    if (itemOf(this.lure)) {
      if (!this.free) { this.refuse('There is no room in your Pneuka Box for what is on the line.', 'boxfull'); return false; }
      this.slots[this.slots.findIndex((s) => !s)] = { id: this.lure };
    }
    this.lure = id;
    this.save();
    this.emit('lure.tie', { lure: id, curio: false });
    return true;
  }
  untie() { return itemOf(this.lure) ? this.tieMade('bob') : false; }
  /** Tie on whatever has this id (a made lure, or a curio in the box): what the angler's 9 / 0 call. */
  tie(id) { if (LURES.some((l) => l.id === id)) return this.tieMade(id); const i = this.slots.findIndex((s) => s?.id === id); return i >= 0 ? this.tieOn(i) : false; }

  refuse(text, key) { this.game.log?.say('warn', text, { key: `pk.${key}`, throttle: 2 }); sfx.fizzle?.(); }

  // ---------------------------------------------------------------- kept in the browser
  save() {
    try { localStorage.setItem(KEY, JSON.stringify({ slots: this.slots, lure: this.lure })); } catch { /* unavailable: it still works this session */ }
  }
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!s) return;
      this.slots = Array.from({ length: SLOTS }, (_, i) => (s.slots?.[i]?.id && itemOf(s.slots[i].id) ? { id: s.slots[i].id } : null));
      this.lure = s.lure || 'bob';
    } catch { /* nothing kept */ }
  }
  /** Things the Book used to hold as things (gained curios, loose cards: before the box) come into the box, once. */
  migrate(book) {
    const owed = [];
    for (const [id, n] of Object.entries(book.legacyItems || {})) for (let k = 0; k < n; k++) owed.push(id);
    for (const L of book.legacyLoose || []) owed.push(L.id);
    if (!owed.length) return;
    for (const id of owed) if (itemOf(id)) this.add(id, 'migrate');
    book.legacyItems = null; book.legacyLoose = null; book.save();
  }
  erase() { this.slots.fill(null); this.lure = 'bob'; this.save(); }
}
