// ---------------------------------------------------------------------------------------
// TRACKING, SPIRIT COOKING AND A CREATURE'S DROPS: the ledger's counts and the log's lines for a dish cooked at the hearth
// (progress/cooking/; world/garden/kitchen.js) and for what falls out of a creature you brought down (progress/creaturedrops.js;
// world/drops/creaturedrops.js). Plain words, Espada's to word (CLARITY.md).
//
// Ledger: cook.serve, cook.serve.<grade>, cook.dish.<id>, cook.family.<family>, cook.true, cook.true.<dish>, cook.dubious, cook.move.<move>, cook.hit.<move>,
// cook.learn (a new recipe), hi cook.grade (0 dubious .. 5 true), hi cook.best.<dish> (the same, a dish's), cook.batch, cook.batch.servings,
// hi cook.batch.size, cook.auto, cook.eat (a batch's serving eaten from the Box); drop.take, drop.take.<cat>, drop.rare, first drop.first.
//
//   cookingRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { itemOf } from '../../pneuka/items.js';

const ORDER = ['dubious', 'fair', 'good', 'great', 'perfect', 'true'];
const art = (name) => (/^[AEIOU]/.test(name) ? 'an' : 'a');

export function cookingRules({ on, L, log }) {
  on('cook.move', (e) => { if (e.by !== 'courier') return; L.inc(`cook.move.${e.move}`); if (e.hit) L.inc(`cook.hit.${e.move}`); });
  on('cook.learn', (e) => { if (e.by !== 'courier') return; L.inc('cook.learn'); log.say('system', `New recipe: ${e.label}.`, { key: 'cook.learn', throttle: 1 }); });
  on('cook.proof', (e) => { if (e.by !== 'courier') return; log.say('info', 'The dough is proofing at the hearth. Return in about a game hour and poke it.', { key: 'cook.proof', throttle: 2 }); });
  on('cook.dubious', (e) => { if (e.by !== 'courier') return; L.inc('cook.dubious'); log.say('warn', 'Dubious dish. A little Lachryma returns to your pool.', { key: 'cook.dubious', throttle: 1 }); });
  on('cook.serve', (e) => {
    if (e.by !== 'courier') return;
    L.inc('cook.serve'); L.inc(`cook.serve.${e.grade}`); L.inc(`cook.dish.${e.dish}`); L.inc(`cook.family.${String(e.dish).split('.')[0]}`); L.hi('cook.grade', ORDER.indexOf(e.grade));
    L.hi(`cook.best.${e.dish}`, ORDER.indexOf(e.grade)); // (a dish's best: what auto-cook reads, progress/cooking/batch.js autoCookOf)
    if (e.true) { L.inc('cook.true'); L.inc(`cook.true.${e.dish}`); } // (a batch is one cook: its TRUE counts once, whatever its n)
    if (e.n > 1) { L.inc('cook.batch'); L.inc('cook.batch.servings', e.n); L.hi('cook.batch.size', e.n); }
    if (e.auto) L.inc('cook.auto');
    const held = e.feeling ? ` Its ${e.feeling} lasts ${e.hold} real seconds.` : '';
    const how = e.auto ? 'auto-cooked' : 'served';
    const what = e.n > 1 ? `a batch of ${e.n}, ${e.label.toLowerCase()}` : `${art(e.label)} ${e.label.toLowerCase()}`;
    const rest = e.kept > 0 ? ` ${e.kept} ${e.kept === 1 ? 'serving is' : 'servings are'} in your Pneuka Box.` : '';
    log.say('gain', `You ${how} ${what}: ${e.grade}.${held}${rest}`, { key: 'cook.serve', throttle: 1 });
  });
  on('cook.eat', (e) => {
    if (e.by !== 'courier') return;
    L.inc('cook.eat');
    const held = e.feeling ? ` Its ${e.feeling} lasts ${e.hold} real seconds.` : '';
    log.say('gain', `You ate ${art(e.label)} ${e.label.toLowerCase()}.${held}`, { key: 'cook.eat', throttle: 1 });
  });
  on('drop.take', (e) => {
    if (e.by !== 'courier') return;
    L.inc('drop.take'); if (e.cat) L.inc(`drop.take.${e.cat}`); L.first('drop.first');
    const it = itemOf(e.item); if (it) log.say('gain', `+ ${it.name.toLowerCase()}`, { key: `drop.${e.item}`, throttle: 0.6 });
  });
  on('drop.fall', (e) => { if (e.by === 'courier' && e.rare) { L.inc('drop.rare'); log.say('gain', 'Something rare fell.', { key: 'drop.rare', throttle: 2 }); } });
}
