// ---------------------------------------------------------------------------------------
// TRACKING, THE STATUS ON A CREATURE: the Veritome's flash, a stun built, a status applied or resisted, and Annihilation. Moved out of
// tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy
// XI's one sentence an event).
//
//   creatureStatusRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { KIND } from './lineformat.js';

export function creatureStatusRules({ on, L, log }) {
  // the stun (stun.js) and the Veritome's flash (tools/veritome/flash.js): a mind knocked out of itself
  on('flash.fire', (e) => { L.inc('flash.fire'); L.inc('flash.hits', e.hits); if (e.lens) L.inc('flash.lens'); });
  on('stun.build', (e) => { if (e.by === 'courier') L.inc(`stun.build.${e.cause}`); });
  // (creature.stun, the stun and its depth: feedback/tracking/stun.js)
  on('creature.status', (e) => { if (e.by === 'courier') { L.inc('status.applied'); L.inc(`status.${e.status}`); } });
  on('creature.resist', (e) => { if (e.by === 'courier') { L.inc('status.resisted'); log.say('battle', `The ${KIND(e.kind)} resists ${e.status}.`, { key: 'resist', win: 1.5 }); } });
  on('combat.annihilate', (e) => { if (e.by === 'courier') { L.inc('combat.annihilate'); L.inc(`combat.annihilate.${e.type}`); log.say('battle', `Annihilation: Impact meets Delirium on the ${KIND(e.kind)}.`, { key: 'annihilate', win: 1 }); } });
}
