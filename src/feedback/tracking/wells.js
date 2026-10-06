// ---------------------------------------------------------------------------------------
// TRACKING, THE WELLS: the rules that hear a Well (world/well/dunemaw.js) and keep the counts the slice's contract names
// (docs/plans/SLICE.md, "The contract"), with the log's lines for going down, deeper and back out. The words are placeholders for
// Espada's (the log's phrasing in tracking.js is Espada's to edit as strings). tracking.js calls it from listen().
//
//   wellRules({ on, L, log })     on(event, fn)   L: the ledger   log: the game log
// ---------------------------------------------------------------------------------------
import { itemOf } from '../../pneuka/items.js';

const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];
const NAME = (id) => itemOf(id)?.name || id;
const AN = (s) => (/^[AEIOU]/i.test(s) ? 'an' : 'a');

export function wellRules({ on, L, log }) {
  let enteredAt = null; // (seconds of play when the run began: what a player's run takes, measured, for the pay table: Dovina)
  on('well.enter', (e) => { if (e.by !== 'courier') return; L.inc('well.enter'); enteredAt = L.play; log.say('explore', 'You go down into the Great Dunemaw.'); });
  on('well.floor', (e) => {
    if (e.by !== 'courier') return;
    L.inc('well.floor'); L.hi('well.depth', e.floor);
    if (e.floor > 1) log.say('explore', `You go down to the ${ORD[e.floor - 1] || `${e.floor}th`} floor.`);
  });
  on('well.leave', (e) => {
    if (e.by !== 'courier') return;
    if (!e.shattered) L.inc('well.out');
    L.hi('well.charted', Math.round((e.charted || 0) * 100));
    if (e.fill <= 0) L.inc('well.dry');
    if (e.pay > 0) L.hi('well.pay.best', e.pay);
    if (enteredAt != null && !e.shattered) { const secs = Math.round(L.play - enteredAt); L.inc('well.run.seconds', secs); L.inc(`well.run.seconds.f${e.floors}`, secs); L.inc(`well.run.count.f${e.floors}`); L.lo('well.run.fastest', secs); }
    enteredAt = null;
    log.say(e.shattered ? 'warn' : 'explore', e.shattered ? "The Well keeps this run's finds." : `You climb out of the Well${e.pay > 0 ? `. Pay: ${e.pay} cubes` : ''}.`);
  });
  on('well.astray', (e) => { if (e.by === 'courier') log.say('explore', 'The Dunemaw turns you round, and sets you down again where you came in.', { throttle: 2 }); });
  on('well.charted', (e) => { if (e.by === 'courier') L.hi('well.floor.charted', Math.round((e.charted || 0) * 100)); });
  on('well.foe', (e) => {
    if (e.by !== 'courier') return;
    L.inc('well.foe'); L.hi('well.foe.cls', e.cls);
    log.say('battle', 'The Great Slip Jelly bursts.');
  });
  on('well.find', (e) => {
    if (e.by !== 'courier') return;
    L.inc('well.find'); L.hi('well.find.tier', e.tier);
    const n = NAME(e.item);
    log.say('loot', `Found: ${AN(n)} ${n}. Climb out of the Well to keep it.`, { tone: '#ffd98a' });
  });
  on('item.get', (e) => { if (e.from === 'well') log.say('loot', `The ${NAME(e.item)} goes into your Pneuka Box. (P)`, { tone: '#ffd98a' }); });
  on('cogitomap.get', (e) => {
    if (e.by !== 'courier') return;
    L.inc('cogitomap.get'); L.hi('cogitomap.worth', e.worth);
    log.say('loot', 'Cogitomap drawn: the Well as it is this game day.', { tone: '#ffd98a' });
  });
}
