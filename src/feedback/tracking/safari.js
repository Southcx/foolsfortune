// ---------------------------------------------------------------------------------------
// TRACKING, THE SAFARI: the ledger's counts and the log's lines for the Veritome's safari (progress/safari.js, safarirun.js;
// docs/plans/STEALTH.md 8). A behaviour caught on a plate (stars for the behaviour, a score for the framing), an area's research level, a
// lure laid, a Figment bolting from an approach, habituation, and the darkroom's judgement of the game day's best plate of each Figment, with
// why. The words are placeholders (Espada's to rule); the sea's say-so (tracking/opensea.js `sea.habit`) is the model.
//
//   safariRules({ on, L, log })   (tracking/rules.js calls it)   ledger: safari.plate, safari.beh.<kind>.<id>, safari.area.<area>.<kind>.<id>,
//   safari.kind.<kind>, safari.stars.best, safari.lured, safari.candid, safari.research.best, safari.lure, safari.spook, safari.habit.best, safari.judged
// ---------------------------------------------------------------------------------------
import { BEHAVIOURS, areaKey } from '../../progress/safari.js';
import { DUNES_AREAS } from '../../progress/areas.js';

const WHY = { 'behaviour:anywhere': 'a common behaviour', 'behaviour:condition': 'a behaviour only the right hour or weather shows', 'behaviour:lured': 'a behaviour a lure drew out', 'behaviour:candid': 'a behaviour only an unaware Figment shows',
  candid: 'it never knew you were there', lured: 'a lure held it', close: 'taken from close by', 'framing:poor': 'the framing was poor', 'framing:fair': 'the framing was fair', 'framing:good': 'the framing was good', 'framing:great': 'the framing was great' };
const say = (why = []) => why.map((w) => WHY[w] || w).join('; ');
const name = (k) => (k === 'wisp' ? 'Lantern Wisp' : 'slip jelly');

export function safariRules({ on, L, log }) {
  on('safari.plate', (e) => {
    if (e.by !== 'courier') return;
    L.inc('safari.plate'); L.inc(`safari.kind.${e.kind}`); L.hi('safari.stars.best', e.stars);
    if (e.rarity === 'lured') L.inc('safari.lured');
    if (e.rarity === 'candid') L.inc('safari.candid');
    if (e.first) L.inc(`safari.beh.${e.kind}.${e.behaviour}`);
    if (e.area && e.areaFirst) L.inc(areaKey(e.area, e.kind, e.behaviour));
    log.say(e.first ? 'explore' : 'info', `${'★'.repeat(e.stars)} A ${name(e.kind)} ${e.label}. Framing: ${e.framing}.${e.cubes ? ` ${e.cubes} cubes for a new behaviour.` : ''}`, { key: 'safari.plate', throttle: 1 });
  });
  on('safari.research', (e) => {
    if (e.by !== 'courier') return;
    L.hi('safari.research.best', e.level); L.hi(`safari.research.${e.area}`, e.level);
    log.say('explore', `Research level ${e.level} in ${DUNES_AREAS[e.area]?.name || e.area}.${e.opens.length ? ` It opens: ${e.opens.join(', ')}.` : ''} ${e.cubes} cubes.`, { key: 'safari.research', throttle: 1 });
  });
  on('safari.lure', (e) => { if (e.by === 'courier') L.inc('safari.lure'); });
  on('stealth.spook', (e) => {
    if (e.by !== 'courier' || e.cause !== 'approach') return;
    L.inc('safari.spook'); log.say('info', 'It bolts. A slower, lower approach lets you closer.', { key: 'safari.spook', throttle: 30 });
  });
  on('safari.habit', (e) => {
    if (e.by !== 'courier') return;
    L.hi('safari.habit.best', Math.round(e.k * 100));
    if (e.k >= 0.5) log.say('info', `The ${name(e.kind)}s are growing used to you.`, { key: `safari.habit.${e.kind}`, throttle: 120 });
  });
  on('safari.judged', (e) => {
    if (e.by !== 'courier') return;
    if (!e.kind) { log.say('info', 'The darkroom has no plate of a Figment to judge today.', { key: 'safari.none', throttle: 5 }); return; }
    L.inc('safari.judged'); if (e.final) L.inc('safari.judged.days');
    const b = BEHAVIOURS[e.kind]?.find((x) => x.id === e.behaviour);
    log.say('record', `Darkroom: your best ${name(e.kind)} plate, ${'★'.repeat(e.stars)} at ${e.score}${b ? `, ${b.label}` : ''}: ${say(e.why)}.`, { key: `safari.judged.${e.kind}`, throttle: 1 });
  });
}
