// ---------------------------------------------------------------------------------------
// TRACKING, A CLASS'S ARTS IN PLAY: the log's lines for the worn arts as they are used (courier/classarts/body.js): the action on its key,
// a reaction firing at its moment, an art's time run out, and Steadfast's ward on the vessel; and the ledger's counts of each (the
// Courier's only). Placeholder words, Espada's to word (CLARITY.md: the label, then what it did). Learned, worn and asked for are
// Dovina's (tracking/classarts.js).
//
//   classArtsPlayRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { CLASS_ARTS } from '../../progress/classarts.js';

const label = (id) => CLASS_ARTS[id]?.label ?? id;

export function classArtsPlayRules({ on, L, log }) {
  on('art.use', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`art.use.${e.art}`);
    log.say('system', `You use ${label(e.art)}${e.accented ? ', sharpened by your class' : ''}.`, { key: `art.use.${e.art}`, throttle: 0.5 });
  });
  on('art.fire', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`art.fire.${e.art}`);
    log.say('system', `${label(e.art)} triggers.`, { key: `art.fire.${e.art}`, throttle: 1 });
  });
  on('art.end', (e) => { if (e.by === 'courier') log.say('system', `${label(e.art)} wears off.`, { key: `art.end.${e.art}`, throttle: 1 }); });
  on('vessel.ward', () => log.say('system', 'You stand firm: the blow cracks nothing.', { key: 'vessel.ward', throttle: 1 }));
}
