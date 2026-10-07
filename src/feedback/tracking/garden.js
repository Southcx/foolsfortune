// ---------------------------------------------------------------------------------------
// TRACKING, THE SPIRIT GARDEN AND SOUL ALCHEMY: the rules that hear the garden (progress/garden.js) and the spirit press
// (progress/alchemy.js), the spirits and the Firings (progress/spirits.js: docs/plans/SPIRIT-GARDEN.md), keep their counts for the achievements, and say the few things worth a sentence. The words are placeholders
// for Espada's. tracking.js calls it from listen().
//
//   gardenRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { ATTRIBUTES } from '../../progress/alchemy.js';
import { ENCOUNTERS } from '../../progress/garden.js';
import { firingOf, ranksOf, FIRING_NAMES } from '../../progress/spirits.js';
import { FEATURES, VISITORS } from '../../progress/realm.js';

export function gardenRules({ on, L, log }) {
  on('alchemy.press', (e) => { if (e.by === 'courier') L.inc('alchemy.press', e.count || 1); });
  on('alchemy.fire', (e) => {
    if (e.by !== 'courier') return;
    L.inc('alchemy.fire'); L.hi(`alchemy.rank.${e.attribute}`, e.rank);
    log.say('gain', `The press fires. ${ATTRIBUTES[e.attribute]?.name || e.attribute}: rank ${e.rank}.`);
  });
  on('garden.slot', (e) => { if (e.by === 'courier' && e.encounter) { L.inc('garden.slot'); { const n = ENCOUNTERS[e.encounter]?.name || e.encounter; log.say('info', `${n.charAt(0).toUpperCase()}${n.slice(1)} now works a garden slot.`); } } });
  on('garden.collect', (e) => { if (e.by === 'courier') L.inc('garden.dividend', e.cubes); });
  on('garden.plant', (e) => { if (e.by === 'courier') L.inc('garden.plant'); });
  on('garden.harvest', (e) => { if (e.by === 'courier') { L.inc('garden.harvest', e.count); log.say('loot', `You harvest ${e.count} from the bed.`); } });
  // (a spirit's or a realm's own name rides as `spirit` / `realm`: the bus writes its own `name` over a payload's: core/events.js)
  // the spirits (SPIRIT-GARDEN.md 5): bound (caught by the Lockheart or the god hand, awakened, dug, settled, merged), fed, matured, released
  const FROM = { lockheart: 'The Lockheart catches', hand: 'Your Pneuka Jar draws in', plate: 'A plate awakens', fossil: 'A fossil wakes:', visit: 'A visitor settles:', merge: 'From the cocoon:' };
  on('spirit.bind', (e) => {
    if (e.by !== 'courier') return;
    L.inc('spirit.bind'); L.inc(`spirit.bind.${e.from}`); L.hi('spirit.bind.cls', (e.cls || 0) + 1);
    log.say('gain', `${FROM[e.from] || 'Bound:'} ${e.spirit || (e.kind ? `a ${e.kind}` : 'a Figment')}.${e.from === 'lockheart' || e.from === 'hand' ? ' It waits in your Pneuka Jar for the garden.' : ''}`);
  });
  // a catch that fails: the wheel came up free, or the hand let go (Petra's rail of the catch: tools/lockheart, godhand)
  on('catch.miss', (e) => { if (e.by !== 'courier') return; L.inc('catch.miss'); log.say('info', `It slips the coffin. (${Math.round((e.odds || 0) * 100)}%)`, { key: 'catchmiss', throttle: 1 }); });
  on('catch.free', (e) => { if (e.by !== 'courier') return; L.inc('catch.free'); log.say('info', e.why === 'woke' ? 'It wakes in your grip and breaks free.' : 'You let it go.', { key: 'catchfree', throttle: 1 }); });
  on('spirit.feed', (e) => { if (e.by === 'courier') L.inc('spirit.feed'); });
  on('spirit.mature', (e) => { if (e.by !== 'courier') return; L.inc('spirit.mature'); L.inc(`spirit.form.${e.feeling}.${e.side}`); log.say('gain', `${e.spirit || 'A spirit'} matures.`); });
  on('spirit.merge', (e) => { if (e.by === 'courier') L.inc('spirit.merge'); });
  on('spirit.release', (e) => { if (e.by === 'courier') { L.inc('spirit.release'); log.say('info', `You release ${e.spirit || 'a spirit'}.`); } });
  // the Firings: the tribulation at the Chimney crosses the one the attributes' ranks have opened
  on('cultivation.tribulation', (e) => {
    if (e.by !== 'courier') return;
    L.inc('tribulation.tried');
    if (!e.passed) { log.say('info', 'The Heavenly Kiln closes. Try again when you are ready.'); return; }
    const open = firingOf(ranksOf(L)), n = Math.min(e.firing || open, open), ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    L.hi('firing', n); log.say('gain', `${ORD[n - 1] || `Firing ${n}`}${ORD[n - 1] ? ' Firing' : ''}${FIRING_NAMES[n - 1] ? `: ${FIRING_NAMES[n - 1]}` : ''}. Complete.`); // (Espada's line)
  });
  on('cultivation.kiln', (e) => { if (e.by === 'courier') log.say('info', 'The Heavenly Kiln opens.'); });
  // the Inner Realm as a place (progress/realm.js): features placed, the planetoids sculpted, drills, visitors who settle
  on('garden.place', (e) => { if (e.by === 'courier' && FEATURES[e.feature]) { L.inc('garden.place'); L.inc(`garden.place.${e.feature}`); } });
  on('garden.sculpt', (e) => { if (e.by === 'courier') L.inc('garden.sculpt'); });
  on('garden.paint', (e) => { if (e.by === 'courier') { L.inc('garden.paint'); if (e.ground !== 'none') L.inc(`garden.paint.${e.ground}`); } });
  on('garden.move', (e) => { if (e.by === 'courier') L.inc('garden.move'); });
  on('garden.reset', (e) => { if (e.by === 'courier') L.inc('garden.reset'); });
  on('spirit.drill', (e) => { if (e.by === 'courier') { L.inc('spirit.drill'); if (!e.gain) log.say('info', `${e.spirit || 'The spirit'} is too tired to drill.`, { key: 'tired', throttle: 3 }); } });
  on('spirit.visit', (e) => {
    if (!VISITORS[e.kind]) return;
    L.inc(`spirit.visit.${e.kind}`);
    if (e.settled) { L.inc(`spirit.settle.${e.kind}`); log.say('gain', `A ${e.kind} settles in your Inner Realm.`); } else log.say('info', `A ${e.kind} visits your Inner Realm.`, { key: `visit.${e.kind}`, throttle: 30 });
  });
  on('realm.name', (e) => { if (e.by === 'courier') log.say('info', `Your Inner Realm is named ${e.realm}.`); });
  on('garden.upgrade', (e) => { if (e.by === 'courier') { L.inc(`garden.upgrade.${e.kind}`); log.say('info', `Garden widened: one more ${e.kind}.`); } });
}
