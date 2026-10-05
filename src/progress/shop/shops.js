// ---------------------------------------------------------------------------------------
// THE SHOPS: the folk's counters, as one system (progress/shop/catalogue.js says what each sells and buys). It keeps each shop's STOCK (what is
// left on its shelf) and what it has BOUGHT (what it is glutted with), prices both from the worth, moves them a unit back toward the
// base every so often (the restock), and does the buying and selling through the cubes (cubes.spend / cubes.earn: the ledger counts
// them, so the F3 econ line sees every shop) and the Pneuka Box. Every outcome is an event (`shop.buy`, `shop.sell`, `shop.haggle`)
// and tracking.js says it; a refusal at the counter is said there and then, once.
//
// A shop is opened from its keeper's talk ("Let's trade.": npc/talks.js) and its window is progress/shop/ui.js; it closes when they walk away
// from the keeper. Raku's goods can be HAGGLED (progress/shop/haggle.js): his talk opens on the 'haggle' node and its choices call here.
//
// Prior art: Old School RuneScape's general stores (the stock, the climbing price, the restock), and the same game's rule that a shop
// pays full only for its own trade.
//
//   game.shops.open(shop)  .close()  .price(shop, id) -> cubes | null (none left)  .offer(shop, id) -> cubes (0: will not buy)
//   .buy(shop, id, { price, haggled }) -> bool   .sell(shop, slot) -> cubes | 0   .stockOf(shop, id)   .update(dt)
//   .haggle(shop, id)  (begins the haggle talk)   .hag (the haggle in progress: { shop, item, h })
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { SHOPS, worthOf, shelfOf } from './catalogue.js';
import { itemOf } from '../../pneuka/items.js';
import { startHaggle, offers, offer, flatter, clink, walk, accept, moodOf } from './haggle.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('progress/shop/shops'); // (the haggle's chance: core/rng.js, the same twice)

const S = ECON.shop;

export class Shops {
  constructor(game) {
    this.game = game;
    this.state = {}; // shop -> { stock: {id: n}, glut: {id: n} }
    for (const id of Object.keys(SHOPS)) this.state[id] = { stock: Object.fromEntries(shelfOf(id)), glut: {} };
    this.t = 0; this.cur = null; this.hag = null;
    game.save?.section('shops', { scope: 'world', version: 1, dump: () => this.state, load: (d) => this.load(d), reset: () => this.restock() }); // (core/save.js)
    // a talk that ends mid-haggle (Esc, walking off): a deal shaken on stands, anything else is dropped
    game.events?.on('npc.bye', () => { if (this.hag) { if (this.hag.h.done === 'deal') this.hagClose(false); else this.hag = null; } });
  }

  // ---------------------------------------------------------------- prices
  stockOf(shop, id) { return this.state[shop]?.stock[id] ?? 0; }
  /** What the shop asks for one, now (dearer as its shelf empties); null if it has none, or does not sell it. */
  price(shop, id) {
    const D = SHOPS[shop], base = D?.sells[id];
    if (base == null) return null;
    const n = this.stockOf(shop, id);
    if (n <= 0) return null;
    return Math.max(1, Math.round(worthOf(id) * D.markup * (1 + S.dear * Math.max(0, base - n))));
  }
  /** What the shop pays them for one (less the more of it it already has; a cut for what is not its trade); 0 if it will not buy. */
  offer(shop, id) {
    const D = SHOPS[shop], it = itemOf(id);
    if (!D || !it || !D.buys.includes(it.kind)) return 0;
    const w = worthOf(id) * (D.trade.includes(it.kind) ? 1 : S.buys), glut = this.state[shop].glut[id] || 0;
    return Math.max(w > 0 ? 1 : 0, Math.floor(w * Math.max(S.floor, 1 - S.glut * glut)));
  }

  // ---------------------------------------------------------------- the counter
  open(shop) {
    if (!SHOPS[shop]) return false;
    this.cur = shop;
    this.game.shopUI?.show(shop);
    this.game.events.emit('shop.open', { shop, by: 'courier' });
    return true;
  }
  close() {
    if (!this.cur) return;
    const shop = this.cur; this.cur = null;
    this.game.shopUI?.hide();
    this.game.events.emit('shop.close', { shop });
  }
  keeperName(shop) { return this.game.folk?.byId[SHOPS[shop]?.keeper]?.name || 'The keeper'; }
  refuse(text, key) { this.game.log?.say('warn', text, { key: `shop.${key}`, throttle: 2 }); sfx.fizzle?.(); }

  buy(shop, id, { price = null, haggled = false } = {}) {
    const g = this.game, box = g.pneuka, cost = price ?? this.price(shop, id);
    if (cost == null) { this.refuse('There are none left.', 'none'); return false; }
    if (!box?.room(id)) { this.refuse('Your Pneuka Box is full.', 'full'); return false; }
    if (!g.cubes.spend(cost, `shop.${shop}`)) { this.refuse(`You cannot afford it. (${cost} cubes)`, 'poor'); return false; }
    this.state[shop].stock[id] = Math.max(0, this.stockOf(shop, id) - 1);
    box.add(id, 'shop');
    this.save();
    sfx.cubeGet?.(2); sfx.shopBuy?.(); // (shopBuy, shopSell: Wanda's, docs/HANDOFFS.md)
    g.events.emit('shop.buy', { shop, item: id, price: cost, worth: worthOf(id), haggled, by: 'courier' });
    g.shopUI?.render();
    return true;
  }
  sell(shop, slot) {
    const g = this.game, box = g.pneuka, s = box?.slots[slot], id = s?.id;
    if (!id) return 0;
    const w = this.offer(shop, id);
    if (!w) { this.refuse(`${this.keeperName(shop)} will not buy that.`, 'nobuy'); return 0; }
    box.take(slot);
    const st = this.state[shop];
    st.glut[id] = (st.glut[id] || 0) + 1;
    if (st.stock[id] != null) st.stock[id] += 1; // (what it sells, it sells again)
    g.cubes.earn(w, 'sell');
    this.save();
    sfx.cubeGet?.(5); sfx.shopSell?.();
    g.events.emit('shop.sell', { shop, item: id, price: w, worth: worthOf(id), by: 'courier' });
    g.shopUI?.render();
    return w;
  }

  /** Once a restock interval: every shelf a unit back toward its base, every glut a unit less. Ticks while away, too. */
  update(dt) {
    this.t += dt;
    if (this.t >= S.restock) {
      this.t -= S.restock;
      for (const [shop, st] of Object.entries(this.state)) {
        for (const [id, base] of shelfOf(shop)) { const n = st.stock[id] ?? base; st.stock[id] = n < base ? n + 1 : n > base ? n - 1 : n; }
        for (const id of Object.keys(st.glut)) if (--st.glut[id] <= 0) delete st.glut[id];
      }
      this.save();
      this.game.shopUI?.render();
    }
    // the window goes when they leave the counter (CLAUDE.md: an interface goes away when you leave)
    if (this.cur) {
      const n = this.game.folk?.byId[SHOPS[this.cur].keeper], P = this.game.player;
      if (!n || Math.hypot(n.pos.x - P.pos.x, n.pos.z - P.pos.z) > 6) this.close();
    }
  }

  // ---------------------------------------------------------------- the haggle (Raku's)
  /** Begin haggling for one of a shop's goods: the window closes and the keeper's talk opens on its 'haggle' node. */
  haggle(shop, id) {
    const D = SHOPS[shop], g = this.game, p = this.price(shop, id);
    if (!D?.haggle || p == null) return false;
    const npc = g.folk?.byId[D.keeper];
    if (!npc) return false;
    const w = worthOf(id), floor = Math.max(Math.ceil(w * ECON.haggle.floor), Math.round(p / D.markup * ECON.haggle.floor));
    this.hag = { shop, item: id, h: startHaggle({ worth: w, list: p, floor, purse: g.cubes.balance, rnd: simRand }) };
    this.close();
    g.dialogue?.begin(npc, 'haggle');
    this.said('open');
    return true;
  }
  said(step) { const H = this.hag; if (H) this.game.events.emit('shop.haggle', { shop: H.shop, item: H.item, step: step || H.h.step, mood: moodOf(H.h), ask: H.h.ask, by: 'courier' }); }
  /** The prices they can put to him (within their purse). */
  hagOffers() { const H = this.hag; if (!H || H.h.done) return []; const b = this.game.cubes.balance; return offers(H.h).filter((x) => x <= b); }
  hagOffer(i) { const H = this.hag; const x = this.hagOffers()[i]; if (H && x) { offer(H.h, x); this.said(); } }
  hagFlatter() { const H = this.hag; if (H) { flatter(H.h); this.said(); } }
  hagClink() { const H = this.hag; if (H) { clink(H.h); this.said(); } }
  hagWalk() { const H = this.hag; if (H) { walk(H.h); this.said(); if (H.h.done === 'gone') this.hag = null; } }
  hagDrop() { const H = this.hag; if (H) { H.h.step = 'gone'; H.h.done = 'gone'; this.said(); this.hag = null; } }
  hagMood() { return this.hag ? moodOf(this.hag.h) : 'sly'; }
  hagAccept() { const H = this.hag; if (H && H.h.done === 'last') { accept(H.h); this.said('deal'); } }
  /** The deal shaken on: the thing bought at the agreed price; back to the shop. */
  hagClose(reopen = true) {
    const H = this.hag; this.hag = null;
    if (H?.h.done === 'deal') this.buy(H.shop, H.item, { price: H.h.price, haggled: true });
    if (reopen && H) { const shop = H.shop; setTimeout(() => { if (!this.game.dialogue?.open) this.open(shop); }, 0); }
  }

  // ---------------------------------------------------------------- kept in the save's world scope (core/save.js; progress: reset with each build)
  save() { this.game.save?.dirty('shops'); }
  load(s) {
    this.restock();
    if (s && typeof s === 'object') for (const id of Object.keys(this.state)) if (s[id]) { Object.assign(this.state[id].stock, s[id].stock || {}); this.state[id].glut = s[id].glut || {}; }
  }
  restock() { for (const id of Object.keys(SHOPS)) this.state[id] = { stock: Object.fromEntries(shelfOf(id)), glut: {} }; }
}
