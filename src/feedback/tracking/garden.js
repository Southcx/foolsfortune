// ---------------------------------------------------------------------------------------
// TRACKING, THE SPIRIT GARDEN AND SOUL ALCHEMY: the rules that hear the garden (progress/garden.js) and the spirit press
// (progress/alchemy.js), keep their counts for the achievements, and say the few things worth a sentence. The words are placeholders
// for Espada's. tracking.js calls it from listen().
//
//   gardenRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { ATTRIBUTES } from '../../progress/alchemy.js';
import { ENCOUNTERS } from '../../progress/garden.js';

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
  on('garden.upgrade', (e) => { if (e.by === 'courier') { L.inc(`garden.upgrade.${e.kind}`); log.say('info', `Garden widened: one more ${e.kind}.`); } });
}
