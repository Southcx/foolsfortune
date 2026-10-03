// ---------------------------------------------------------------------------------------
// THE PNEUKA BOX: the Courier's innate storage, the space they carry with them (P). It is the transitory place: what is picked up,
// found in a chest or taken out of the Veritome comes here first; what is worn is worn from here; and what is to be kept for good is
// stored from here into the Veritome, which is the bank (long-term, stacked, by card: veritome/book.js).
//
//  - TWENTY-EIGHT SLOTS, one thing to a slot (OSRS's inventory: a full box is a reason to go home), except what STACKS (keys and rolls
//    of film: up to its `stack`, 99, in one slot, OSRS's stackables). A thing that will not fit falls at their feet (ground.js) and is
//    picked up again with F.
//  - EQUIPMENT: the LURE on the Sondelass' line (one: a made lure or a curio from the box; tying one on takes it out of its slot, and
//    untying puts it back), and the TOOLS: worn in their places on their body (tools/belt.js), or carried here as things. A tool in the box
//    is WORN from here (into its place: what was there comes off into the box), and a worn one TAKEN OFF into it.
//  - FITTINGS, the same way for the tools after: the INSTRUMENT in the Crucibelle (one), the COFFIN on the Lockheart's chain (one: it
//    is the wheel), and the POSSIBILIKEYS on its ring (up to four, in order: used up when it is opened; keys stack in the box). FITTINGS says which.
//  - THE BANK: while the Veritome is held open (J), the box and the Book are open together: a thing in the box is STORED (it becomes
//    its card in its page, up to the card's limit) and a card with an item form is TAKEN OUT (it becomes the thing, in the box).
//
// Prior art: Old School RuneScape's inventory (twenty-eight slots, a left click does the obvious thing, a right click lists the rest,
// Examine writes to the chat, Drop puts it on the ground, the bank is somewhere else and holds stacks), its equipment screen (worn
// things in their places beside the inventory), and Greed Island's Book for what the bank is.
//
//   const box = new PneukaBox(game)   box.add(id, from) -> slot | -1 (fell)   box.take(slot)   box.swap(a, b)   box.drop(slot)
//   box.store(slot) / box.storeAll() / box.withdraw(cardId) (the Veritome open)   box.tieOn(slot) / box.untie() / box.tie(id)
//   box.wear(slot) / box.takeOff(tool)   box.seed() (the first time: the lures and the tools not worn)
//   box.fitOn(slot) / box.fitOff(socket, i) / box.fitted(socket) -> [ids] / box.useUp(socket, i)     box.feed(slot) (a shard to the Lockheart)
//   box.count(id)  box.held(id) (everywhere: box, line, Book, ground)  box.free  box.lure (the lure id on the line)  box.bankOpen
// ---------------------------------------------------------------------------------------
import { itemOf } from './items.js';
import { CARD } from '../veritome/cards.js';
import { LURES } from '../angling/lures.js';
import { sfx } from '../audio.js';

export const SLOTS = 28;
/** What fits into the tools besides the lure: by the item's kind, how many, and to which tool. */
export const FITTINGS = {
  instrument: { kind: 'instrument', max: 1, tool: 'crucibelle', label: 'THE INSTRUMENT · IN THE CRUCIBELLE', put: 'Fit to the Crucibelle', none: 'the bell alone' },
  // (the coffin IS the Lockheart: which one they wear at the neck, so it has no slot of its own in the window: the owner's note)
  heart: { kind: 'heart', max: 1, tool: 'lockheart', label: 'THE LOCKHEART', put: 'Wear as the Lockheart', none: 'no coffin: it cannot be opened', hidden: true },
  keys: { kind: 'key', max: 4, tool: 'lockheart', label: "THE KEYRING · ON THE LOCKHEART'S CHARM, IN ORDER", put: 'Put on the keyring', none: 'no key: it cannot be opened' },
};
const SOCKET_OF = Object.fromEntries(Object.entries(FITTINGS).map(([k, F]) => [F.kind, k]));
const KEY = 'foolsfortune.pneuka.v1';

export class PneukaBox {
  constructor(game) {
    this.game = game;
    this.slots = new Array(SLOTS).fill(null); // { id }
    this.lure = 'lure.bob';
    this.fit = { instrument: [], heart: ['heart.plain'], keys: [] };
    this.fresh = false;
    this.load();
  }
  get book() { return this.game.veritome?.book || null; }
  /** The Book is open with the box while the Veritome is held open. */
  get bankOpen() { return !!this.game.veritome?.held; }
  get free() { return this.slots.filter((s) => !s).length; }
  get used() { return SLOTS - this.free; }
  count(id) { return this.slots.reduce((n, s) => n + (s?.id === id ? s.n || 1 : 0), 0); }
  /** Room for one more of this (a free slot, or a stack of it not yet full). */
  room(id) { const it = itemOf(id); return this.free > 0 || (!!it?.stack && this.slots.some((s) => s?.id === id && (s.n || 1) < it.stack)); }
  /** One of a thing into the box without a word (a stack of it first, if it stacks): the slot, or -1 if there is no room. */
  put(id) {
    const it = itemOf(id);
    if (it?.stack) { const i = this.slots.findIndex((s) => s?.id === id && (s.n || 1) < it.stack); if (i >= 0) { this.slots[i].n = (this.slots[i].n || 1) + 1; return i; } }
    const i = this.slots.findIndex((s) => !s);
    if (i < 0) return -1;
    this.slots[i] = { id };
    return i;
  }
  /** Every copy of a thing the Courier has: in the box, on the line, in the Book, on the ground. */
  held(id) { return this.count(id) + (this.lure === id ? 1 : 0) + Object.values(this.fit).reduce((n, a) => n + a.filter((x) => x === id).length, 0) + (this.book?.count(id) || 0) + (this.game.ground?.count(id) || 0); }
  emit(k, e) { this.game.events?.emit(k, e); }

  /** A thing into the box (the first free slot). If there is no room it falls at their feet. */
  add(id, from = 'pickup') {
    if (!itemOf(id)) return -1;
    const i = this.put(id);
    if (i < 0) {
      const P = this.game.player;
      this.game.ground?.drop(id, P.pos.clone().setY(P.pos.y + 0.05), { from });
      this.emit('item.full', { item: id, from });
      return -1;
    }
    this.save();
    this.emit('item.get', { item: id, from, slot: i, used: this.used });
    return i;
  }
  /** One thing out of a slot (one of a stack: the rest stay). */
  take(slot) { const s = this.slots[slot]; if (!s) return null; if ((s.n || 1) > 1) s.n--; else this.slots[slot] = null; this.save(); return s.id; }
  swap(a, b) { if (a === b) return; [this.slots[a], this.slots[b]] = [this.slots[b], this.slots[a]]; this.save(); }

  /** Drop: on the ground at their feet. */
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
    this.take(slot);
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

  // ---------------------------------------------------------------- the line (one lure on it, or none)
  /** Tie a lure from the box onto the line (a made lure or a curio); what was tied on goes back into the box, into the slot it came from. */
  tieOn(slot) {
    const s = this.slots[slot];
    if (!s || !itemOf(s.id)?.lure) return false;
    const prev = this.lure;
    this.slots[slot] = prev && itemOf(prev) ? { id: prev } : null;
    this.lure = s.id;
    this.save();
    this.emit('lure.tie', { lure: s.id, curio: itemOf(s.id).kind === 'curio' });
    return true;
  }
  /** Untie the lure into the box (the line is bare until another is tied on). */
  untie() {
    if (!this.lure) return false;
    if (!this.room(this.lure)) { this.refuse('There is no room in your Pneuka Box for what is on the line.', 'boxfull'); return false; }
    this.put(this.lure);
    const id = this.lure;
    this.lure = null;
    this.save();
    this.emit('lure.untie', { lure: id });
    return true;
  }
  /** Tie on whatever has this id, from the box: what the angler's 9 / 0 call. */
  tie(id) { if (!id || id === this.lure) return false; const i = this.slots.findIndex((s) => s?.id === id); return i >= 0 ? this.tieOn(i) : false; }

  // ---------------------------------------------------------------- the fittings (an instrument, a coffin, keys)
  fitted(socket) { return this.fit[socket] || []; }
  /** Fit a thing from the box into its tool: a single fitting swaps with what was there; the keyring takes up to four. */
  fitOn(slot) {
    const s = this.slots[slot], it = s && itemOf(s.id), socket = it && SOCKET_OF[it.kind];
    if (!socket) return false;
    const F = FITTINGS[socket], cur = this.fit[socket];
    if (cur.length >= F.max) {
      if (F.max > 1) { this.refuse('The keyring holds four keys.', 'ringfull'); return false; }
      if ((s.n || 1) > 1) { if (!this.room(cur[0])) { this.refuse('There is no room in your Pneuka Box for it.', 'boxfull'); return false; } s.n--; this.put(cur[0]); } else this.slots[slot] = { id: cur[0] };
      cur.length = 0;
    } else this.take(slot);
    cur.push(s.id);
    this.save(); sfx.click?.();
    this.emit('item.fit', { item: s.id, socket });
    return true;
  }
  fitOff(socket, i = 0) {
    const cur = this.fit[socket], id = cur?.[i];
    if (!id) return false;
    if (!this.room(id)) { this.refuse('There is no room in your Pneuka Box for it.', 'boxfull'); return false; }
    cur.splice(i, 1);
    this.put(id);
    this.save();
    this.emit('item.unfit', { item: id, socket });
    return true;
  }
  /** A fitting spent (a key turned in the lock): gone. */
  useUp(socket, i = 0) { const cur = this.fit[socket]; if (!cur?.[i]) return null; const id = cur.splice(i, 1)[0]; this.save(); return id; }
  /** A shard of crystal, fed to the Lockheart (it drinks it whole). */
  feed(slot) {
    const s = this.slots[slot], L = this.game.lockheart;
    if (s?.id !== 'mat.shard' || !L) return false;
    this.take(slot);
    L.feed(L.cap * 0.45, 'shard');
    return true;
  }

  // ---------------------------------------------------------------- the tools (worn on the belt, or carried here)
  /** Put a tool from the box on: into its place on their body (tools/belt.js); whatever was in that place comes off into this slot. */
  wear(slot) {
    const s = this.slots[slot], it = s && itemOf(s.id), belt = this.game.belt;
    if (!it || it.kind !== 'tool' || !belt) return false;
    const off = belt.wear(it.tool);
    if (off === false) { this.refuse(`There is no place to wear ${it.name.toLowerCase().replace('the ', 'the ')}.`, 'noplace'); return false; }
    this.slots[slot] = off ? { id: `tool.${off}` } : null;
    this.save();
    return true;
  }
  /** Take a worn tool off into the box. */
  takeOff(tool) {
    const belt = this.game.belt;
    if (!belt?.isWorn(tool)) return false;
    if (!this.free) { this.refuse('There is no room in your Pneuka Box for it.', 'boxfull'); return false; }
    belt.takeOff(tool);
    this.slots[this.slots.findIndex((s) => !s)] = { id: `tool.${tool}` };
    this.save();
    return true;
  }

  refuse(text, key) { this.game.log?.say('warn', text, { key: `pk.${key}`, throttle: 2 }); sfx.fizzle?.(); }

  // ---------------------------------------------------------------- kept in the browser
  save() {
    try { localStorage.setItem(KEY, JSON.stringify({ slots: this.slots, lure: this.lure, fit: this.fit, seeded: this.seeded })); } catch { /* unavailable: it still works this session */ }
  }
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!s) return;
      this.slots = Array.from({ length: SLOTS }, (_, i) => { const o = s.slots?.[i], it = o?.id && itemOf(o.id); return it ? (it.stack && o.n > 1 ? { id: o.id, n: Math.min(it.stack, o.n | 0) } : { id: o.id }) : null; });
      this.lure = s.lure === undefined ? 'lure.bob' : s.lure && itemOf(s.lure) ? s.lure : itemOf(`lure.${s.lure}`) ? `lure.${s.lure}` : null;
      this.seeded = !!s.seeded;
      if (s.fit) for (const k of Object.keys(this.fit)) this.fit[k] = (s.fit[k] || []).filter((id) => itemOf(id)).slice(0, FITTINGS[k].max);
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
  erase() { this.slots.fill(null); this.lure = 'lure.bob'; this.fit = { instrument: [], heart: ['heart.plain'], keys: [] }; this.seeded = false; this.seed(); }
  /** What a new Courier starts with in the box, once: the made lures that are not on the line, and the tools they are not wearing. */
  seed() {
    if (this.seeded) return;
    this.seeded = true;
    for (const L of LURES) if (L.id !== this.lure && !this.count(L.id)) this.add(L.id, 'start');
    const belt = this.game.belt;
    if (belt) for (const t of belt.tools) if (!belt.isWorn(t.id) && !this.count(`tool.${t.id}`)) this.add(`tool.${t.id}`, 'start');
    // (for the tools after the first four: the other coffins, the three instruments, and a handful of keys to begin with)
    for (const id of ['heart.gambler', 'heart.shepherd', 'inst.ocarina', 'inst.kalimba', 'inst.lute', 'key.brass', 'key.brass', 'key.invert', 'key.twin', 'key.even', 'mat.film']) this.add(id, 'start');
    this.save();
  }
}
