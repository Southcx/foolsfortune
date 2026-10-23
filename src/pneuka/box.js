// ---------------------------------------------------------------------------------------
// THE PNEUKA BOX: the Courier's innate storage, the space they carry with them (P). It is the transitory place: what is picked up or
// found in a chest comes here first; what is worn is worn from here; and what is to be kept for good is put in its STORAGE at a Shrine.
//
//  - FIFTY-SIX SLOTS, one thing to a slot (OSRS's inventory: a full box is a reason to go home), except what STACKS (keys and rolls
//    of film: up to its `stack`, 99, in one slot, OSRS's stackables). A thing that will not fit falls at their feet (ground.js) and is
//    picked up again with F.
//  - EQUIPMENT: the LURE on the Sondelass' line (one: a made lure or a curio from the box; tying one on takes it out of its slot, and
//    untying puts it back). The TOOLS are not things in the box: all seven are always owned, two worn as the main and the sub and five on
//    the loadout's shelf (tools/belt.js equip; the window shows them apart). A psygun's variant is a thing here, carried with carryPsygun.
//  - FITTINGS, the same way for the tools after: the INSTRUMENT in the Crucibelle (one), the COFFIN on the Lockheart's chain (one: it
//    is the wheel), and the POSSIBILIKEYS on its ring (up to four, in order: brass is spent when it is opened, any other has `uses` and breaks in time, lockheart/
//    table.js keyBreaks; fresh keys stack in the box, a used one keeps its uses in a slot of its own, on the ground too). FITTINGS says which.
//  - THE STORAGE: at a Shrine (its page's STORAGE row: openStorage), the box's own long-term store opens beside it, as the Spirit
//    Garden's shed keeps its decor: any thing in the box is STORED (stacked with its kind, STORAGE stacks at most) and TAKEN OUT again.
//    It replaced the Veritome's bank (the owner's ruling of 2026-10-23: the Veritome is observation only; docs/plans/SPREADS.md 6). OSRS's
//    bank is a place, and so is this.
//
// Prior art: Old School RuneScape's inventory (twenty-eight slots there, twice that here, a left click does the obvious thing, a right click lists the rest,
// Examine writes to the chat, Drop puts it on the ground, the bank is somewhere else and holds stacks), its equipment screen (worn
// things in their places beside the inventory).
//
//   const box = new PneukaBox(game)   box.add(id, from) -> slot | -1 (fell)   box.take(slot)   box.swap(a, b)   box.drop(slot)
//   box.store(slot) / box.storeAll() / box.withdraw(i) (the storage open: box.storage[i] back into the box)   box.tieOn(slot) / box.untie() / box.tie(id)
//   box.carryPsygun(slot) (a psygun's variant carried; the one carried into this slot)   box.openStorage() (a Shrine's STORAGE row)   box.seed() (the first time: the lures, a small bottle worn half full)
//   box.fitOn(slot) / box.fitOff(socket, i) / box.fitted(socket) -> [ids] / box.useUp(socket, i) / box.turn(socket, i) -> uses / box.rotate(socket, d) (the ring turned a notch)     box.feed(slot) (a shard to the Lockheart)
//   box.count(id)  box.held(id) (everywhere: box, line, fittings, storage, ground)  box.free  box.lure (the lure id on the line)  box.storageOpen
//   save sections `kit` (the box and the belt, one record) and `storage`
// ---------------------------------------------------------------------------------------
import { itemOf, ITEMS } from './items.js';
import { LURES } from '../tools/sondelass/angling/lures.js';
import { sfx } from '../audio/sfx.js';
import { BOTTLES } from '../progress/brushload.js';
import { TOOL_IDS, START } from '../progress/toolpairs.js';

export const SLOTS = 56; // (the owner, 2026-10-07: 56 by default, twice OSRS's 28)
/** What fits into the tools besides the lure: by the item's kind, how many, and to which tool. */
export const FITTINGS = {
  instrument: { kind: 'instrument', max: 1, tool: 'crucibelle', label: 'THE INSTRUMENT · IN THE CRUCIBELLE', put: 'Fit to the Crucibelle', none: 'the bell alone' },
  // (the coffin IS the Lockheart: which one they wear at the neck, so it has no slot of its own in the window: the owner's note)
  heart: { kind: 'heart', max: 1, tool: 'lockheart', label: 'THE LOCKHEART', put: 'Wear as the Lockheart', none: 'no coffin: it cannot be opened', hidden: true },
  keys: { kind: 'key', max: 4, tool: 'lockheart', label: "THE KEYRING · ON THE LOCKHEART'S CHARM, IN ORDER", put: 'Put on the keyring', none: 'no key: it cannot be opened' },
  // (a place of its own on the body, not a tool's: the Lachrymato Bottle on the upper back; its `uses` is the Lachryma it holds,
  // so a bottle taken off keeps what is in it: tools/soulbrush/load.js)
  bottle: { kind: 'bottle', max: 1, place: true, label: 'THE LACHRYMATO BOTTLE · ON THE UPPER BACK', put: 'Wear on the upper back', none: 'no bottle: the Soul Brush draws on your mind' },
};
const SOCKET_OF = Object.fromEntries(Object.entries(FITTINGS).map(([k, F]) => [F.kind, k]));
/** What the log says to a store or a take out with the bank shut (the words a placeholder for Espada's). */
export const STORAGE_SHUT = 'Your storage opens at a Shrine.';
/** How many stacks the storage keeps (one kind of thing a stack, any number of it, as a bank's: Dovina's number to tune). */
export const STORAGE = 56;
/** The belt's two, as the kit keeps them: two of the seven, never one twice; anything else is a new save's pair. */
function wearPair(belt, d) {
  const ok = d && TOOL_IDS.includes(d.main) && TOOL_IDS.includes(d.sub) && d.main !== d.sub;
  belt.main = ok ? d.main : START.main; belt.sub = ok ? d.sub : START.sub;
}

export class PneukaBox {
  constructor(game) {
    this.game = game;
    this.slots = new Array(SLOTS).fill(null); // { id, n?, uses?, data? } (a thing with uses or data of its own never stacks: a worn key, a Cogitomap)
    this.lure = 'lure.bob';
    this.fit = { instrument: [], heart: ['heart.plain'], keys: [], bottle: [] };
    this.uses = { instrument: [], heart: [0], keys: [], bottle: [] }; // (beside each fitting: how many times it has been turned)
    this.fresh = false;
    this.storage = []; // { id, n, uses?, data? } (a thing with uses or data of its own keeps a stack of its own)
    this.atStorage = false; // (the window opened from a Shrine's STORAGE row, until it is next opened another way: openStorage)
    game.events?.on?.('pneuka.open', () => { this.atStorage = false; });
    game.save?.section('storage', {
      scope: 'player', version: 1,
      dump: () => ({ items: this.storage }),
      load: (d) => { this.storage = (d?.items || []).filter((o) => o?.id && itemOf(o.id) && o.n > 0).slice(0, STORAGE); },
      reset: () => { this.storage = []; },
    });
    // THE KIT (core/save.js): the box and the belt are one section, written together, so they can never disagree about a tool.
    // Version 2 (main and sub, PNEUKA-BOX.md 5): the belt is { main, sub }; version 1 kept a list of the tools worn and the rest as
    // `tool.<id>` things in the slots, read as the first two worn in the belt's order and the slots emptied of them.
    const belt = game.belt;
    game.save?.section('kit', {
      scope: 'player', version: 2,
      dump: () => ({ box: { slots: this.slots, lure: this.lure, fit: this.fit, uses: this.uses, seeded: this.seeded }, belt: belt ? { main: belt.main, sub: belt.sub } : null }),
      load: (d) => { this.load(d.box); if (belt) wearPair(belt, d.belt); },
      migrate: (d, v) => {
        if (v < 2) {
          const worn = Array.isArray(d?.belt) ? TOOL_IDS.filter((id) => d.belt.includes(id)) : [];
          d = { ...d, belt: worn.length >= 2 ? { main: worn[0], sub: worn[1] } : null };
          if (Array.isArray(d.box?.slots)) d.box = { ...d.box, slots: d.box.slots.map((o) => (String(o?.id).startsWith('tool.') ? null : o)) };
        }
        return d;
      },
      reset: () => { this.slots = new Array(SLOTS).fill(null); this.lure = 'lure.bob'; this.fit = { instrument: [], heart: ['heart.plain'], keys: [], bottle: [] }; this.uses = { instrument: [], heart: [0], keys: [], bottle: [] }; this.seeded = false; if (belt) wearPair(belt, null); },
      check: () => this.reconcile(), // (two tools worn, never the same one twice)
    });
  }
  /** The storage is open with the box: from a Shrine's STORAGE row, while the window is open. */
  get storageOpen() { return this.atStorage && !!this.game.pneukaUI?.open; }
  /** A Shrine's STORAGE row (world/shrines.js): the window opens with the storage beside it. */
  openStorage() { const W = this.game.pneukaUI; if (!W) return false; if (!W.open) W.show(); this.atStorage = true; W.render(); return true; }
  // (the old names, until the window's pane moves to the storage: pneuka/ui.js is Dovina's, docs/handoffs/dovina/)
  get bankOpen() { return this.storageOpen; }
  openBank() { return this.openStorage(); }
  /** How many of a thing the storage keeps. */
  stored(id) { return this.storage.reduce((n, o) => n + (o.id === id ? o.n : 0), 0); }
  get free() { return this.slots.filter((s) => !s).length; }
  get used() { return SLOTS - this.free; }
  count(id) { return this.slots.reduce((n, s) => n + (s?.id === id ? s.n || 1 : 0), 0); }
  /** Room for one more of this (a free slot, or a stack of it not yet full). */
  room(id, uses = 0, data = null) { const it = itemOf(id); return this.free > 0 || (!uses && !data && !!it?.stack && this.slots.some((s) => s?.id === id && !s.uses && !s.data && (s.n || 1) < it.stack)); }
  /** One of a thing into the box without a word (a stack of it first, if it stacks and is fresh): the slot, or -1 if there is no room. */
  put(id, uses = 0, data = null) {
    const it = itemOf(id);
    if (it?.stack && !uses && !data) { const i = this.slots.findIndex((s) => s?.id === id && !s.uses && !s.data && (s.n || 1) < it.stack); if (i >= 0) { this.slots[i].n = (this.slots[i].n || 1) + 1; return i; } }
    const i = this.slots.findIndex((s) => !s);
    if (i < 0) return -1;
    this.slots[i] = { id, ...(uses ? { uses } : {}), ...(data ? { data } : {}) };
    return i;
  }
  /** Every copy of a thing the Courier has: in the box, on the line, in a tool, in the storage, on the ground. */
  held(id) { return this.count(id) + (this.lure === id ? 1 : 0) + Object.values(this.fit).reduce((n, a) => n + a.filter((x) => x === id).length, 0) + this.stored(id) + (this.game.ground?.count(id) || 0); }
  emit(k, e) { this.game.events?.emit(k, e); }

  /** A thing into the box (the first free slot). If there is no room it falls at their feet. */
  add(id, from = 'pickup', uses = 0, data = null) {
    if (!itemOf(id)) return -1;
    const i = this.put(id, uses, data);
    if (i < 0) {
      const P = this.game.player;
      this.game.ground?.drop(id, P.pos.clone().setY(P.pos.y + 0.05), { uses, data });
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
    const uses = this.slots[slot]?.uses || 0, data = this.slots[slot]?.data || null, id = this.take(slot);
    if (!id) return false;
    const P = this.game.player;
    this.game.ground?.drop(id, P.pos.clone().setY(P.pos.y + 0.05), { uses, data });
    this.emit('item.drop', { item: id });
    return true;
  }
  examine(id) { if (itemOf(id)) this.emit('item.examine', { item: id }); }

  // ---------------------------------------------------------------- the storage (at a Shrine)
  /** A thing from the box into the storage: stacked with its kind (one with uses or data of its own keeps a stack of its own). */
  store(slot) {
    const s = this.slots[slot];
    if (!s) return false;
    if (!this.storageOpen) { this.refuse(STORAGE_SHUT, 'storageshut'); return false; }
    const plain = !s.uses && !s.data, at = plain ? this.storage.findIndex((o) => o.id === s.id && !o.uses && !o.data) : -1;
    if (at < 0 && this.storage.length >= STORAGE) { this.refuse('Your storage is full.', 'storagefull'); return false; }
    const n = s.n || 1;
    this.slots[slot] = null;
    if (at >= 0) this.storage[at].n += n;
    else this.storage.push({ id: s.id, n, ...(s.uses ? { uses: s.uses } : {}), ...(s.data ? { data: s.data } : {}) });
    this.save(); this.game.save?.dirty('storage');
    sfx.cardDraw?.();
    this.emit('item.store', { item: s.id, n, by: 'courier' });
    return true;
  }
  storeAll() { let n = 0; for (let i = 0; i < SLOTS; i++) if (this.slots[i] && this.store(i)) n++; return n; }
  /** A stack from the storage back into the box, as much of it as fits (a thing that stacks fills its stacks first). */
  withdraw(i) {
    const o = this.storage[i];
    if (!o) return false;
    if (!this.storageOpen) { this.refuse(STORAGE_SHUT, 'storageshut'); return false; }
    let moved = 0;
    while (o.n > 0 && this.room(o.id, o.uses, o.data) && this.put(o.id, o.uses, o.data) >= 0) { o.n--; moved++; }
    if (!moved) { this.refuse('Your Pneuka Box is full.', 'boxfull'); return false; }
    if (o.n <= 0) this.storage.splice(i, 1);
    this.save(); this.game.save?.dirty('storage');
    sfx.cardDraw?.();
    this.emit('item.withdraw', { item: o.id, n: moved, by: 'courier' });
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
  /** Tie on whatever has this id, from the box: what the angler's - / = call. */
  tie(id) { if (!id || id === this.lure) return false; const i = this.slots.findIndex((s) => s?.id === id); return i >= 0 ? this.tieOn(i) : false; }

  // ---------------------------------------------------------------- the fittings (an instrument, a coffin, keys)
  fitted(socket) { return this.fit[socket] || []; }
  /** Fit a thing from the box into its tool: a single fitting swaps with what was there; the keyring takes up to four. */
  fitOn(slot) {
    const s = this.slots[slot], it = s && itemOf(s.id), socket = it && SOCKET_OF[it.kind];
    if (!socket) return false;
    const F = FITTINGS[socket], cur = this.fit[socket], U = this.uses[socket], uses = s.uses || 0;
    if (cur.length >= F.max) {
      if (F.max > 1) { this.refuse('The keyring holds four keys.', 'ringfull'); return false; }
      if ((s.n || 1) > 1) { if (!this.room(cur[0], U[0])) { this.refuse('There is no room in your Pneuka Box for it.', 'boxfull'); return false; } s.n--; this.put(cur[0], U[0]); } else this.slots[slot] = U[0] ? { id: cur[0], uses: U[0] } : { id: cur[0] };
      cur.length = 0; U.length = 0;
    } else this.take(slot);
    cur.push(s.id); U.push(uses);
    this.save(); sfx.click?.();
    this.emit('item.fit', { item: s.id, socket });
    return true;
  }
  fitOff(socket, i = 0) {
    const cur = this.fit[socket], id = cur?.[i], uses = this.uses[socket][i] || 0;
    if (!id) return false;
    if (!this.room(id, uses)) { this.refuse('There is no room in your Pneuka Box for it.', 'boxfull'); return false; }
    cur.splice(i, 1); this.uses[socket].splice(i, 1);
    this.put(id, uses);
    this.save();
    this.emit('item.unfit', { item: id, socket });
    return true;
  }
  /** A fitting spent (a key turned in the lock): gone. */
  useUp(socket, i = 0) { const cur = this.fit[socket]; if (!cur?.[i]) return null; const id = cur.splice(i, 1)[0]; this.uses[socket].splice(i, 1); this.save(); return id; }
  /** A fitting turned once more (a Possibilikey in the lock): how many times it has been, now. */
  /** The fittings of a socket turned a notch round their ring (the Lockheart's keys by the wheel: OVERLAY.md 19.6), each with its uses. */
  rotate(socket, d = 1) {
    const F = this.fit[socket], U = this.uses[socket], n = F?.length || 0; if (n < 2) return false;
    const k = ((d % n) + n) % n;
    this.fit[socket] = [...F.slice(k), ...F.slice(0, k)]; this.uses[socket] = [...U.slice(k), ...U.slice(0, k)];
    this.save(); return true;
  }
  turn(socket, i = 0) { const U = this.uses[socket]; if (!this.fit[socket]?.[i]) return 0; U[i] = (U[i] || 0) + 1; this.save(); return U[i]; }
  /** A shard of crystal, fed to the Lockheart (it drinks it whole). */
  feed(slot) {
    const s = this.slots[slot], L = this.game.lockheart;
    if (s?.id !== 'mat.shard' || !L) return false;
    this.take(slot);
    L.feed(L.cap * 0.45, 'shard');
    return true;
  }

  // ---------------------------------------------------------------- a psygun's variant (the tools themselves are the belt's: tools/belt.js equip)
  /** A psygun's variant from the box becomes the psygun you carry (its own chambers, tools/psygun/shells.js setGun); the one you carried
   *  comes off into this slot. */
  carryPsygun(slot) {
    const it = itemOf(this.slots[slot]?.id), S = this.game.shells, was = S?.gun?.id;
    if (it?.kind !== 'psygun' || !S || was === it.id) return false;
    if (!S.setGun(it.id)) return false;
    this.slots[slot] = was ? { id: was } : null;
    this.save();
    return true;
  }

  refuse(text, key) { this.game.log?.say('warn', text, { key: `pk.${key}`, throttle: 2 }); sfx.fizzle?.(); }

  // ---------------------------------------------------------------- kept in the browser
  save() { this.game.save?.dirty('kit'); } // (written with the belt, whole: core/save.js)
  /** The box as the kit section kept it. */
  load(s) {
    try {
      if (!s) return;
      this.slots = Array.from({ length: SLOTS }, (_, i) => { const o = s.slots?.[i], it = o?.id && itemOf(o.id); return !it ? null : o.uses > 0 || o.data ? { id: o.id, ...(o.uses > 0 ? { uses: o.uses | 0 } : {}), ...(o.data ? { data: o.data } : {}) } : it.stack && o.n > 1 ? { id: o.id, n: Math.min(it.stack, o.n | 0) } : { id: o.id }; });
      this.lure = s.lure === undefined ? 'lure.bob' : s.lure && itemOf(s.lure) ? s.lure : itemOf(`lure.${s.lure}`) ? `lure.${s.lure}` : null;
      this.seeded = !!s.seeded;
      if (s.fit) for (const k of Object.keys(this.fit)) {
        const ids = s.fit[k] || [], U = s.uses?.[k] || [], keep = ids.map((id, i) => [id, U[i] | 0]).filter(([id]) => itemOf(id)).slice(0, FITTINGS[k].max);
        this.fit[k] = keep.map(([id]) => id); this.uses[k] = keep.map(([, u]) => u);
      }
    } catch { /* nothing kept */ }
  }
  /** What a new Courier starts with in the box, once: the made lures that are not on the line. */
  seed() {
    if (this.seeded) return;
    this.seeded = true;
    for (const L of LURES) if (L.id !== this.lure && !this.count(L.id)) this.add(L.id, 'start');
    // (for the tools after the first four: the three instruments and a handful of keys to begin with; the Gambler's and the Shepherd's
    // coffins and the INVERTED key are bought from Raku or found, so a first opening is never a bought jackpot: docs/DESIGN.md, section 8, proposal 2)
    for (const id of ['inst.ocarina', 'inst.kalimba', 'inst.lute', 'key.brass', 'key.brass', 'key.twin', 'key.even']) this.add(id, 'start');
    // (a small Lachrymato Bottle on the upper back, half full: the Soul Brush paints from it and it feeds the pool below half at once;
    // the medium and the large are Grog's to sell. Dovina's ask for the owner, 2026-10-07)
    if (!this.fit.bottle.length && !this.held('bottle.small')) { this.fit.bottle.push('bottle.small'); this.uses.bottle.push(BOTTLES['bottle.small'].capacity / 2); }
    this.save();
  }
  /** The belt's two are two of the seven tools, never one twice (a save from before a fix, a belt written without its box): anything else
   *  is a new save's pair. Run after loading, and after anything that borrowed the belt. */
  reconcile() {
    const belt = this.game.belt; if (!belt) return 0;
    const was = `${belt.main}+${belt.sub}`;
    wearPair(belt, { main: belt.main, sub: belt.sub });
    if (was === `${belt.main}+${belt.sub}`) return 0;
    this.save();
    return 1;
  }
  /** DEBUG, the sandbox (title/ui.js): the whole kit, whatever STORY holds back (both coffins, a few of every key), topped up each time. */
  debugKit() {
    const want = { 'heart.gambler': 1, 'heart.shepherd': 1, 'heart.summoning': 1, 'bottle.small': 1, 'bottle.medium': 1, 'bottle.large': 1 }; // (Dovina's: the Warden's, the catch; a bottle of each size)
    for (const id of Object.keys(ITEMS)) if (ITEMS[id].kind === 'key') want[id] = 3;
    for (const id of Object.keys(ITEMS)) if (ITEMS[id].kind === 'psygun' && id !== this.game.shells?.gun?.id) want[id] = 1; // (each psygun's variant not carried)
    for (const [id, n] of Object.entries(want)) for (let k = this.held(id); k < n; k++) { if (!this.room(id)) return; this.add(id, 'debug'); } // (never onto the floor)
  }
}
