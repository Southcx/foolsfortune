// ---------------------------------------------------------------------------------------
// TRACKING, STRAWMAN'S WELL (progress/strawmanwell.js; docs/plans/STRAWMANS-WELL.md 5): the ledger and the log for the room's events
// (world/strawmanwell/). A stage's clear is counted with its rank and stars kept as a best; a KO, a trophy and a fall in the Pit are
// counters; a verb's first use in the Well ticks the bench's checklist. Only the Courier's count. Words placeholders, Espada's.
//
//   strawmanWellRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { stageOf, VERB } from '../../progress/strawmanwell.js';
import { profileOf } from '../../progress/movementprofiles.js';

export function strawmanWellRules({ on, L, log }) {
  const say = (kind, text, key, throttle = 1) => log.say(kind, text, { key, throttle });
  on('well.stage.enter', (e) => { if (e.by === 'courier') L.inc(`well.stage.enter.${e.stage}`); });
  on('well.stage.clear', (e) => {
    if (e.by !== 'courier') return;
    L.inc('well.stage.clear'); L.inc(`well.stage.clear.${e.stage}`); L.hi(`well.stage.stars.${e.stage}`, e.stars || 0);
    if (Number.isFinite(e.t)) L.lo(`well.stage.time.${e.stage}`, Math.round(e.t * 10) / 10);
    say('gain', `${stageOf(e.stage)?.family || 'Stage'} cleared. Rank ${e.rank}.`, 'well.clear', 0.5);
  });
  on('well.dummy.ko', (e) => { if (e.by !== 'courier') return; L.inc('well.dummy.ko'); if (e.kind && e.kind !== 'dummy') L.inc(`well.target.ko.${e.kind}`); }); // (a training target counts as a dummy, and by its kind)
  on('well.dummy.trophy', (e) => { if (e.by !== 'courier') return; L.inc('well.dummy.trophy'); say('gain', 'Trophy! Straw dummy launched at 100%.', 'well.trophy'); });
  on('well.pit.death', (e) => { if (e.by === 'courier') L.inc('well.pit.death'); });
  on('well.pogo', (e) => { if (e.by === 'courier') L.inc('well.pogo'); }); // (a downward blow bounced off a foe or spikes: world/strawmanwell/verbs.js)
  on('well.throw', (e) => { if (e.by === 'courier') L.inc('well.throw'); }); // (a dummy grabbed and thrown or slammed: dummygrab.js)
  on('well.turret.stun', (e) => { if (e.by === 'courier') { L.inc('well.turret.stun'); say('battle', 'The turret took its own flame back.', 'well.turret', 1); } });
  on('well.guide', (e) => { // (Strawman's ghost: guide.js; only a rival's finish is a result)
    if (e.kind !== 'rival' || e.beat == null || e.by !== 'courier') return;
    if (e.beat) { L.inc('well.rival.beat'); say('gain', 'You beat the rival to the flag.', 'well.rival', 0.5); } else say('info', 'The rival got there first.', 'well.rival', 0.5);
  });
  on('well.flood.fill', (e) => { if (e.by === 'courier') L.hi('well.flood.best', e.cells || 0); });
  on('well.fighter.ko', (e) => { if (e.by !== 'courier') return; L.inc('well.fighter.ko'); if (e.stage) L.inc(`well.fighter.ko.${e.stage}`); say('gain', `KO! At ${Math.round(e.percent || 0)}%.`, 'well.fighter.ko', 0.3); });
  on('well.fighter.stock', (e) => {
    if (e.by === 'courier') L.inc('well.fighter.stock.lost');
    say('battle', e.left > 0 ? `Stock lost. ${e.left} left.` : 'Out of stocks. The match starts over.', 'well.fighter.stock', 0.3);
  });
  on('profile.wear', (e) => { L.inc(`profile.wear.${e.id}`); const P = profileOf(e.id); say('system', `Profile: ${P.label}. ${P.line}`, 'profile', 0.3); });
  on('profile.ask', (e) => say('system', `Profile worn: ${profileOf(e.id).label}. The others: ${e.ids.filter((i) => i !== e.id).join(', ')}. Type /profile <name>, or press F at the rack in the wings.`, 'profile.ask', 0.5));
  on('well.verb', (e) => {
    if (e.by !== 'courier' || !VERB[e.verb] || L.get(`well.verb.${e.verb}`)) return;
    L.inc(`well.verb.${e.verb}`); L.inc('well.verb');
  });
}
