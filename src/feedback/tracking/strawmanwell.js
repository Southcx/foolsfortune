// ---------------------------------------------------------------------------------------
// TRACKING, STRAWMAN'S WELL (progress/strawmanwell.js; docs/plans/STRAWMANS-WELL.md 5): the ledger and the log for the room's events
// (world/strawmanwell/). A stage's clear is counted with its rank and stars kept as a best; a KO, a trophy and a fall in the Pit are
// counters; a verb's first use in the Well ticks the bench's checklist. Only the Courier's count. Words placeholders, Espada's.
//
//   strawmanWellRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { stageOf, VERB } from '../../progress/strawmanwell.js';

export function strawmanWellRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  on('well.stage.enter', (e) => { if (e.by === 'courier') L.inc(`well.stage.enter.${e.stage}`); });
  on('well.stage.clear', (e) => {
    if (e.by !== 'courier') return;
    L.inc('well.stage.clear'); L.inc(`well.stage.clear.${e.stage}`); L.hi(`well.stage.stars.${e.stage}`, e.stars || 0);
    if (Number.isFinite(e.t)) L.lo(`well.stage.time.${e.stage}`, Math.round(e.t * 10) / 10);
    say('gain', `${stageOf(e.stage)?.family || 'The stage'} cleared. Rank ${e.rank}.`, 'well.clear', 0.5);
  });
  on('well.dummy.ko', (e) => { if (e.by === 'courier') L.inc('well.dummy.ko'); });
  on('well.dummy.trophy', (e) => { if (e.by !== 'courier') return; L.inc('well.dummy.trophy'); say('gain', 'A dummy, caught on a plate as a trophy.', 'well.trophy'); });
  on('well.pit.death', (e) => { if (e.by === 'courier') L.inc('well.pit.death'); });
  on('well.flood.fill', (e) => { if (e.by === 'courier') L.hi('well.flood.best', e.cells || 0); });
  on('well.verb', (e) => {
    if (e.by !== 'courier' || !VERB[e.verb] || L.get(`well.verb.${e.verb}`)) return;
    L.inc(`well.verb.${e.verb}`); L.inc('well.verb');
  });
}
