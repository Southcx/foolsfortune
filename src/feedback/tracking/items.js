// ---------------------------------------------------------------------------------------
// TRACKING, THE PNEUKA BOX'S THINGS: a thing got, full, dropped, examined, stored, withdrawn, fitted and unfitted, and a lure tied or
// untied. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's
// counters, Final Fantasy XI's one sentence an event).
//
//   itemRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { an, ITEM, said } from './lineformat.js';
import { CARD as VCARD } from '../../tools/veritome/cards.js';
import { itemOf } from '../../pneuka/items.js';
import { LURES } from '../../tools/sondelass/angling/lures.js';
import { SLOTS } from '../../pneuka/box.js';

export function itemRules({ on, L, log, g }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // ---- the Pneuka Box: what they carry (src/pneuka/)
  on('item.get', (e) => {
    if (e.from === 'debug') return; // (a debug chest's gift is never counted: docs/plans/DEBUG-CHESTS.md)
    L.inc('item.get'); L.inc(`item.from.${e.from}`); L.hi('pneuka.used.best', e.used);
    if (e.used >= SLOTS) L.inc('pneuka.filled'); // (every slot of the Pneuka Box: pneuka/box.js SLOTS)
    if (e.from === 'ground') log.say('loot', `Picked up the ${ITEM(e.item)}.`, { tone: '#ffd98a' });
    else if (e.from === 'chest') log.say('loot', `The ${ITEM(e.item)} is added to your Pneuka Box.`, { tone: '#ffd98a' });
    else if (e.from === 'catch') log.say('loot', `The ${ITEM(e.item)} is kept in your Pneuka Box. Hint: Old Grog buys fish.`, { key: 'fishkeep', fmt: (n) => `${n} fish kept in your Pneuka Box.` });
    first('pneuka', said(g, 'Logged: your first thing in the Pneuka Box. Press {box} to open it. The first button uses a thing. The second lists the rest.'));
  });
  on('item.full', (e) => { L.inc('pneuka.full'); log.say('warn', `Pneuka Box full. The ${ITEM(e.item)} is dropped at your feet.`, {}); });
  on('item.drop', (e) => { L.inc('item.drop'); log.say('info', `Dropped the ${ITEM(e.item)}.`, { key: 'idrop', fmt: (n) => `Dropped ${n} things.` }); });
  on('item.examine', (e) => log.say('info', itemOf(e.item)?.examine || VCARD[e.item]?.lore || 'Nothing remarkable.', {}));
  on('item.store', (e) => { L.inc('item.store'); log.say('gain', `Stored the ${ITEM(e.item)}.`, { key: 'istore', fmt: (n) => `Stored ${n} things.` }); });
  on('item.withdraw', (e) => { L.inc('item.withdraw'); log.say('gain', `Taken out of storage: the ${ITEM(e.item)}.`, { key: 'iwd', fmt: (n) => `Taken out of storage: ${n} things.` }); });
  on('lure.untie', (e) => { L.inc('lure.untie'); log.say('info', `Untied the ${ITEM(e.lure)}. It is back in your Pneuka Box.`, { key: 'luntie', throttle: 0.2 }); });
  on('item.fit', (e) => { L.inc('item.fit'); log.say('info', e.socket === 'keys' ? `Added ${an(ITEM(e.item).toLowerCase())} to the Lockheart's ring.` : e.socket === 'heart' ? `Hung ${ITEM(e.item).toLowerCase()} on the Lockheart's chain.` : `Fitted the ${ITEM(e.item).toLowerCase()} to the Crucibelle.`, { key: `ifit.${e.item}`, throttle: 0.2 }); });
  on('item.unfit', (e) => log.say('info', `Removed the ${ITEM(e.item).toLowerCase()}. It is back in your Pneuka Box.`, { key: 'iunfit', throttle: 0.2 }));
  on('lure.tie', (e) => { L.inc('lure.tie'); if (e.curio) L.inc('lure.tie.curio'); log.say('info', `Tied the ${e.curio ? ITEM(e.lure) : (LURES.find((l) => l.id === e.lure)?.name.toLowerCase() || e.lure)} onto the line.`, { key: 'ltie', throttle: 0.2 }); });
}
