// ---------------------------------------------------------------------------------------
// TRACKING, THE PNEUKA BOX'S THINGS: a thing got, full, dropped, examined, stored, withdrawn, fitted and unfitted, and a lure tied or
// untied. Moved out of tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's
// counters, Final Fantasy XI's one sentence an event).
//
//   itemRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { an, ITEM } from './lineformat.js';
import { CARD as VCARD } from '../../tools/veritome/cards.js';
import { itemOf } from '../../pneuka/items.js';
import { LURES } from '../../tools/sondelass/angling/lures.js';
import { SLOTS } from '../../pneuka/box.js';

export function itemRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // ---- the Pneuka Box: what they carry (src/pneuka/)
  on('item.get', (e) => {
    if (e.from === 'debug') return; // (a debug chest's gift is never counted: docs/plans/DEBUG-CHESTS.md)
    L.inc('item.get'); L.inc(`item.from.${e.from}`); L.hi('pneuka.used.best', e.used);
    if (e.used >= SLOTS) L.inc('pneuka.filled'); // (every slot of the Pneuka Box: pneuka/box.js SLOTS)
    if (e.from === 'ground') log.say('loot', `You pick up the ${ITEM(e.item)}.`, { tone: '#ffd98a' });
    else if (e.from === 'chest') log.say('loot', `The ${ITEM(e.item)} goes into your Pneuka Box.`, { tone: '#ffd98a' });
    else if (e.from === 'catch') log.say('loot', `You keep the ${ITEM(e.item)} in your Pneuka Box. (Old Grog buys fish.)`, { key: 'fishkeep', fmt: (n) => `You keep ${n} fish in your Pneuka Box.` });
    first('pneuka', 'Logged: your first thing in the Pneuka Box. P opens it: left click uses, right click lists the rest.');
  });
  on('item.full', (e) => { L.inc('pneuka.full'); log.say('warn', `Your Pneuka Box is full. The ${ITEM(e.item)} falls at your feet.`, {}); });
  on('item.drop', (e) => { L.inc('item.drop'); log.say('info', `You drop the ${ITEM(e.item)}.`, { key: 'idrop', fmt: (n) => `You drop ${n} things.` }); });
  on('item.examine', (e) => log.say('info', itemOf(e.item)?.examine || VCARD[e.item]?.lore || 'Nothing remarkable.', {}));
  on('item.store', (e) => { L.inc('item.store'); log.say('gain', `You store the ${ITEM(e.item)}.`, { key: 'istore', fmt: (n) => `You store ${n} things.` }); });
  on('item.withdraw', (e) => { L.inc('item.withdraw'); log.say('gain', `You take the ${ITEM(e.item)} out of your storage.`, { key: 'iwd', fmt: (n) => `You take ${n} things out of your storage.` }); });
  on('lure.untie', (e) => { L.inc('lure.untie'); log.say('info', `You untie the ${ITEM(e.lure)} and put it in your Pneuka Box.`, { key: 'luntie', throttle: 0.2 }); });
  on('item.fit', (e) => { L.inc('item.fit'); log.say('info', e.socket === 'keys' ? `You put ${an(ITEM(e.item).toLowerCase())} on the Lockheart's ring.` : e.socket === 'heart' ? `You hang ${ITEM(e.item).toLowerCase()} on the Lockheart's chain.` : `You fit the ${ITEM(e.item).toLowerCase()} to the Crucibelle.`, { key: `ifit.${e.item}`, throttle: 0.2 }); });
  on('item.unfit', (e) => log.say('info', `You take the ${ITEM(e.item).toLowerCase()} off, into your Pneuka Box.`, { key: 'iunfit', throttle: 0.2 }));
  on('lure.tie', (e) => { L.inc('lure.tie'); if (e.curio) L.inc('lure.tie.curio'); log.say('info', `You tie the ${e.curio ? ITEM(e.lure) : (LURES.find((l) => l.id === e.lure)?.name.toLowerCase() || e.lure)} onto the line.`, { key: 'ltie', throttle: 0.2 }); });
}
