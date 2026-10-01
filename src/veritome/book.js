// ---------------------------------------------------------------------------------------
// THE BOOK: the Veritome's binder and the cards in it. Its rules are Greed Island's (Hunter x Hunter), at the scale of a prototype:
//
//  - DESIGNATED PAGES, one for each of the twenty-two Major Arcana, numbered 0 to XXI. The first copy of a card fills its page; that
//    page is never emptied (a card on its page is what the Book KNOWS).
//  - FREE SLOTS: twelve, shared, for the spare copies. A card has a LIMIT (the most copies of it the Book may hold, page included) and a
//    RANK (SS to H, how hard it is to come by). A copy that does not fit drifts away.
//  - GAIN: a spare copy is taken out of the Book and made real (into the hand), as Greed Island's "Gain" turns a card into its thing.
//
// And its play is the Astrologian's (Final Fantasy XIV):
//
//  - DRAW: a card the Book knows comes to the hand at random (it costs a little of the mind; three charges, each back in eighteen
//    seconds). REDRAW: once a draw, a different one. PLAY: its effect (effects.js) and its SEAL (sun, moon or star) into the clasp.
//  - THE CLASP holds three seals. When it is full it is spent at once as an ASTRODYNE, stronger the more kinds of seal it holds:
//    one kind a little of the mind back; two, the mind refilling twice as fast for a while; three, that and the mind filled, a lighter
//    step and every card in play lasting half as long again.
//
// Cards come from photographs (veritome.js, photo.js): a photograph that satisfies a card's sitting is a copy of it (once a minute for
// each card). The Book is kept in the browser with the map (it is the Courier's own), and its numbers go to the ledger.
//
//   book.has(id) / count(id) / spares(id) / give(id) / draw() / redraw() / play() / gain(id) / tick(dt)     book.hand    book.seals
// ---------------------------------------------------------------------------------------
import { ARCANA, ARCANA_BY_ID } from './arcana.js';
import { EFFECTS } from './effects.js';
import { sfx } from '../audio.js';

const KEY = 'foolsfortune.veritome.v1';
export const FREE_SLOTS = 12;
const CHARGES = 3, RECHARGE = 18, DRAW_COST = 4, GIVE_COOL = 60;

export class Book {
  constructor(game) {
    this.game = game;
    this.cards = {}; // id -> copies held (page + spares)
    this.photos = {}; // subject kind -> { score, stars, thumb, at }
    this.pins = []; // where photographs were taken: { x, y, z, yaw, kind, stars }
    this.hand = null; this.redrawn = false;
    this.charges = CHARGES; this.rechargeT = 0;
    this.seals = [];
    this.active = []; // effects in play: { id, t, dur, state }
    this.luck = 0; this.mults = {}; this.speed = {};
    this.lastGive = {};
    this.load();
  }
  get P() { return this.game.player; }

  // ---------------------------------------------------------------- the binder
  count(id) { return this.cards[id] || 0; }
  has(id) { return this.count(id) > 0; }
  spares(id) { return Math.max(0, this.count(id) - 1); }
  get freeUsed() { let n = 0; for (const id in this.cards) n += this.spares(id); return n; }
  get known() { return ARCANA.filter((a) => this.has(a.id)); }

  /** A copy of a card (from a photograph). False if it drifts away (the Book is full of it, or the free slots are). */
  give(id, why = 'photo') {
    const A = ARCANA_BY_ID[id], now = performance.now() / 1000;
    if (!A) return false;
    if (why === 'photo' && now - (this.lastGive[id] ?? -1e9) < GIVE_COOL) return false; // (a card's sitting gives once a minute)
    this.lastGive[id] = now;
    const n = this.count(id);
    if (n >= A.limit || (n >= 1 && this.freeUsed >= FREE_SLOTS)) { this.game.events?.emit('card.drift', { card: id }); return false; }
    this.cards[id] = n + 1;
    this.save();
    this.game.events?.emit('card.get', { card: id, page: n === 0, rank: A.rank });
    sfx.cardGet?.(n === 0);
    return true;
  }

  // ---------------------------------------------------------------- the hand: draw, redraw, gain, play
  draw() {
    const g = this.game;
    if (this.hand || !this.known.length) return false;
    if (this.charges < 1) { g.log?.say('info', 'The Book will not open again so soon.', { key: 'bookcool', throttle: 2 }); return false; }
    if (!g.lachryma.spend(DRAW_COST, 'draw')) { sfx.fizzle?.(); return false; }
    this.charges--;
    const pool = this.known;
    this.hand = pool[Math.floor(Math.random() * pool.length)].id;
    this.redrawn = false;
    sfx.cardDraw?.();
    g.events?.emit('card.draw', { card: this.hand });
    return true;
  }
  redraw() {
    if (!this.hand || this.redrawn) return false;
    const pool = this.known.filter((a) => a.id !== this.hand);
    if (!pool.length) return false;
    this.hand = pool[Math.floor(Math.random() * pool.length)].id;
    this.redrawn = true;
    sfx.cardDraw?.();
    this.game.events?.emit('card.redraw', { card: this.hand });
    return true;
  }
  /** Gain: a spare copy out of the Book and into the hand (the copy is used up). */
  gain(id) {
    if (this.spares(id) < 1) return false;
    this.cards[id]--;
    this.hand = id; this.redrawn = true;
    this.save();
    sfx.cardDraw?.();
    this.game.events?.emit('card.gain', { card: id });
    return true;
  }
  play() {
    const id = this.hand;
    if (!id) return false;
    this.hand = null;
    const A = ARCANA_BY_ID[id];
    this.begin(id);
    this.seals.push(A.seal);
    sfx.cardPlay?.(A.seal);
    this.game.events?.emit('card.play', { card: id, seal: A.seal });
    if (this.seals.length >= 3) this.astrodyne();
    return true;
  }

  /** Put an effect in play (a card's, or the Wheel's echo of another's). */
  begin(id, { echo = false } = {}) {
    const A = ARCANA_BY_ID[id], E = EFFECTS[id];
    if (!E) return;
    const prev = this.active.find((a) => a.id === id);
    if (prev) { prev.t = 0; return; }
    const ctx = { game: this.game, P: this.P, book: this };
    let state = {};
    try { state = E.start?.(ctx) || {}; } catch (e) { console.warn('card', id, e); }
    if (A.dur > 0) this.active.push({ id, t: 0, dur: A.dur, state });
    if (echo) this.game.events?.emit('card.echo', { card: id });
  }

  /** The clasp is full: it is spent, stronger the more kinds of seal it held. */
  astrodyne() {
    const g = this.game, kinds = new Set(this.seals).size;
    this.seals = [];
    g.lachryma.gain(10, 'astrodyne');
    if (kinds >= 2) this.timed('astrodyne', 15, () => g.lachryma.addModifier('astrodyne', { regenMult: 2 }), () => g.lachryma.removeModifier('astrodyne'));
    if (kinds >= 3) {
      g.lachryma.gain(g.lachryma.max, 'astrodyne');
      this.timed('astrodyne.step', 15, () => { this.speed.astrodyne = 1.1; }, () => { delete this.speed.astrodyne; });
      for (const a of this.active) a.dur += A_DUR(a) * 0.5;
    }
    sfx.astrodyne?.(kinds);
    g.events?.emit('card.astrodyne', { kinds });
  }
  /** A small timed rule of the Book's own (the Astrodyne's): on now, off after `dur`. */
  timed(id, dur, on, off) {
    const prev = this.active.find((a) => a.id === id);
    if (prev) { prev.t = 0; return; }
    on();
    this.active.push({ id, t: 0, dur, state: {}, off });
  }

  /** What the cards in play make of a thing (Strength: 'melee' x2). */
  mult(what) { return this.mults[what] ?? 1; }
  get speedMult() { let m = 1; for (const k in this.speed) m *= this.speed[k]; return m; }

  tick(dt) {
    if (this.charges < CHARGES) { this.rechargeT += dt; if (this.rechargeT >= RECHARGE) { this.rechargeT = 0; this.charges++; } }
    const ctx = { game: this.game, P: this.P, book: this };
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i];
      a.t += dt;
      const E = EFFECTS[a.id];
      if (a.t < a.dur) { try { E?.tick?.(ctx, dt, a.state); } catch (e) { console.warn('card', a.id, e); } continue; }
      this.active.splice(i, 1);
      try { if (a.off) a.off(); else E?.end?.(ctx, a.state); } catch (e) { console.warn('card', a.id, e); }
      if (!a.off) this.game.events?.emit('card.fade', { card: a.id });
    }
  }
  clearEffects() { for (const a of [...this.active]) { a.t = a.dur; } this.tick(0); }

  // ---------------------------------------------------------------- kept in the browser
  save() {
    try { localStorage.setItem(KEY, JSON.stringify({ cards: this.cards, photos: this.photos, pins: this.pins.slice(-60) })); } catch { /* storage full or unavailable: the Book still works this session */ }
  }
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) { this.cards = s.cards || {}; this.photos = s.photos || {}; this.pins = s.pins || []; }
    } catch { /* nothing kept */ }
  }
  erase() { this.cards = {}; this.photos = {}; this.pins = []; this.hand = null; this.seals = []; this.save(); }
}
const A_DUR = (a) => ARCANA_BY_ID[a.id]?.dur || a.dur;
