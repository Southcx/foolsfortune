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
  // the spirits (SPIRIT-GARDEN.md 5): bound (caught by the Lockheart or the god hand, awakened, dug, settled, merged), fed, matured, released
  const FROM = { lockheart: 'The Lockheart catches', hand: 'Your Pneuka Jar draws in', plate: 'A plate awakens', fossil: 'A fossil wakes:', visit: 'A visitor settles:', merge: 'From the cocoon:' };
  on('spirit.bind', (e) => {
    if (e.by !== 'courier') return;
    L.inc('spirit.bind'); L.inc(`spirit.bind.${e.from}`); L.hi('spirit.bind.cls', (e.cls || 0) + 1);
    log.say('gain', `${FROM[e.from] || 'Bound:'} ${e.name || 'a Figment'}.${e.from === 'lockheart' || e.from === 'hand' ? ' It waits in your Pneuka Jar for the garden.' : ''}`);
  });
  on('spirit.feed', (e) => { if (e.by === 'courier') L.inc('spirit.feed'); });
  on('spirit.mature', (e) => { if (e.by !== 'courier') return; L.inc('spirit.mature'); L.inc(`spirit.form.${e.feeling}.${e.side}`); log.say('gain', `${e.name || 'A spirit'} matures.`); });
  on('spirit.merge', (e) => { if (e.by === 'courier') L.inc('spirit.merge'); });
  on('spirit.release', (e) => { if (e.by === 'courier') { L.inc('spirit.release'); log.say('info', `You release ${e.name || 'a spirit'}.`); } });
  // the Firings: the tribulation at the Meditation Peak crosses the one the attributes' ranks have opened
  on('cultivation.tribulation', (e) => {
    if (e.by !== 'courier') return;
    L.inc('tribulation.tried');
    if (!e.passed) { log.say('info', 'The Heavenly Kiln closes. Try again when you are ready.'); return; }
    const open = firingOf(ranksOf(L)), n = Math.min(e.firing || open, open), ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    L.hi('firing', n); log.say('gain', `${ORD[n - 1] || `Firing ${n}`}${ORD[n - 1] ? ' Firing' : ''}${FIRING_NAMES[n - 1] ? `: ${FIRING_NAMES[n - 1]}` : ''}. Complete.`); // (Espada's line)
  });
  on('cultivation.kiln', (e) => { if (e.by === 'courier') log.say('info', 'The Heavenly Kiln opens.'); });
  on('realm.name', (e) => { if (e.by === 'courier') log.say('info', `Your Inner Realm is named ${e.name}.`); });
  on('garden.upgrade', (e) => { if (e.by === 'courier') { L.inc(`garden.upgrade.${e.kind}`); log.say('info', `Garden widened: one more ${e.kind}.`); } });
}
