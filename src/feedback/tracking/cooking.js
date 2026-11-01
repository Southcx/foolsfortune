// ---------------------------------------------------------------------------------------
// TRACKING, SPIRIT COOKING AND A CREATURE'S DROPS: the ledger's counts and the log's lines for a dish cooked at the hearth
// (progress/cooking/; world/garden/kitchen.js) and for what falls out of a creature you brought down (progress/creaturedrops.js;
// world/drops/creaturedrops.js). Plain words, Espada's to word (CLARITY.md).
//
// Ledger: cook.serve, cook.serve.<grade>, cook.dish.<id>, cook.true, cook.true.<dish>, cook.dubious, cook.move.<move>, cook.hit.<move>,
// cook.learn (a new recipe), hi cook.grade (0 dubious .. 5 true); drop.take, drop.take.<cat>, drop.rare, first drop.first.
//
//   cookingRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { itemOf } from '../../pneuka/items.js';

const ORDER = ['dubious', 'fair', 'good', 'great', 'perfect', 'true'];
const art = (name) => (/^[AEIOU]/.test(name) ? 'an' : 'a');

export function cookingRules({ on, L, log }) {
  on('cook.move', (e) => { if (e.by !== 'courier') return; L.inc(`cook.move.${e.move}`); if (e.hit) L.inc(`cook.hit.${e.move}`); });
  on('cook.learn', (e) => { if (e.by !== 'courier') return; L.inc('cook.learn'); log.say('system', `A new recipe: ${e.label}. The hearth will remember it.`, { key: 'cook.learn', throttle: 1 }); });
  on('cook.proof', (e) => { if (e.by !== 'courier') return; log.say('info', 'Your dough is proofing at the hearth. Come back in about a game hour and poke it.', { key: 'cook.proof', throttle: 2 }); });
  on('cook.dubious', (e) => { if (e.by !== 'courier') return; L.inc('cook.dubious'); log.say('warn', 'A dubious dish. It goes back to the Lachryma it was made of.', { key: 'cook.dubious', throttle: 1 }); });
  on('cook.serve', (e) => {
    if (e.by !== 'courier') return;
    L.inc('cook.serve'); L.inc(`cook.serve.${e.grade}`); L.inc(`cook.dish.${e.dish}`); L.hi('cook.grade', ORDER.indexOf(e.grade));
    if (e.true) { L.inc('cook.true'); L.inc(`cook.true.${e.dish}`); }
    const held = e.feeling ? ` It holds ${e.feeling} for ${e.hold} real seconds.` : '';
    log.say('gain', `You served ${art(e.label)} ${e.label.toLowerCase()}: ${e.grade}.${held}`, { key: 'cook.serve', throttle: 1 });
  });
  on('drop.take', (e) => {
    if (e.by !== 'courier') return;
    L.inc('drop.take'); if (e.cat) L.inc(`drop.take.${e.cat}`); L.first('drop.first');
    const it = itemOf(e.item); if (it) log.say('gain', `+ ${it.name.toLowerCase()}`, { key: `drop.${e.item}`, throttle: 0.6 });
  });
  on('drop.fall', (e) => { if (e.by === 'courier' && e.rare) { L.inc('drop.rare'); log.say('gain', 'Something rare fell.', { key: 'drop.rare', throttle: 2 }); } });
}
