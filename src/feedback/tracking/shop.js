// ---------------------------------------------------------------------------------------
// TRACKING, THE FOLK'S COUNTERS: a counter opened, a good bought or sold, a haggle. Moved out of tracking.js whole, the words unchanged
// (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   shopRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural, ITEM } from './lineformat.js';
import { itemOf } from '../../pneuka/items.js';

export function shopRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // the folk's counters (shop/): what is bought and sold is said; a haggle's words are Raku's own (npc.say), so it is only counted
  const SHOPNAME = (id) => ({ raku: 'Raku', grog: 'Old Grog' })[id] || 'The keeper';
  on('shop.open', (e) => { L.inc('shop.open'); L.inc(`shop.open.${e.shop}`); first('shop', 'Logged: a counter. Click a good to buy it. Click a thing in your Pneuka Box to sell it. Prices rise as a shelf empties and fall back over time.'); });
  on('shop.buy', (e) => {
    L.inc('shop.bought'); L.inc(`shop.bought.${e.shop}`); L.inc('shop.spent', e.price); L.hi('shop.buy.best', e.price || 0);
    if (e.haggled) { L.inc('haggle.won'); L.inc('haggle.saved', Math.max(0, Math.round(e.worth * 1.45) - e.price)); }
    log.say('loot', `Bought: ${ITEM(e.item)} from ${SHOPNAME(e.shop)} for ${plural(e.price, 'cube')}.`, { tone: '#ffd98a', key: `buy.${e.item}`, fmt: (n) => `Bought: ${n} ${ITEM(e.item)} from ${SHOPNAME(e.shop)}.` });
  });
  on('shop.sell', (e) => {
    L.inc('shop.sold'); L.inc(`shop.sold.${e.shop}`); L.inc('shop.earned', e.price); if (itemOf(e.item)?.kind === 'fish') L.inc('fish.sold');
    log.say('loot', `Sold: ${ITEM(e.item)} to ${SHOPNAME(e.shop)} for ${plural(e.price, 'cube')}.`, { tone: '#ffd98a', key: `sell.${e.shop}`, win: 1.5, fmt: (n) => `Sold: ${n} things to ${SHOPNAME(e.shop)}.` });
  });
  on('shop.haggle', (e) => { L.inc(`haggle.${e.step}`); if (e.step === 'open') L.inc('haggle.start'); });
}
