// ---------------------------------------------------------------------------------------
// TRACKING, THE VESSEL: the shield and the shattering, being made whole, cracks and mends, the kiln, firings and glazes. Moved out of
// tracking.js whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy
// XI's one sentence an event).
//
//   vesselRules({ on, L, log, g })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';

export function vesselRules({ on, L, log, g }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  // the vessel's damage (courier/vessel/damage.js): a blow cracks them where it lands; the cracks mend
  const PART = { mask: 'your mask', torso: 'your body', armL: 'your left arm', armR: 'your right arm', legL: 'your left leg', legR: 'your right leg' };
  // the shield and the shattering (courier/vessel/damage.js, courier/vessel/death.js)
  on('vessel.shield', () => L.inc('vessel.shield'));
  on('vessel.shieldbreak', () => { L.inc('vessel.shieldbreak'); log.say('battle', 'Pool empty. The next blow cracks the vessel.', { key: 'shieldbreak', throttle: 4 }); });
  on('courier.shatter', (e) => { L.inc('courier.shatter'); log.say('battle', e.by === 'creature' ? 'Your Pneuka Jar is shattered by a creature.' : 'Your Pneuka Jar shatters.', {}); });
  on('courier.reform', (e) => { L.inc('courier.reform'); if (e.where === 'lip') return; /* (foe.wipe says it: tracking/dunemaw.js) */ log.say('system', e.where === 'shrine' ? `Your Pneuka Jar is made whole at ${g.shrines?.get(e.shrine)?.name || 'the Shrine'}.` : 'Your Pneuka Jar is made whole in the workshop.', {}); });
  on('vessel.refire', (e) => { L.inc('vessel.refire'); log.say('info', `Cracks mended at the kiln: ${plural(e.cost, 'cube')}.`, {}); });
  on('vessel.crack', (e) => { L.inc('vessel.cracks'); L.inc(`vessel.crack.${e.region}`); log.say('battle', `The blow cracks ${PART[e.region] || 'you'}.`, { key: `crack.${e.region}`, throttle: 1.5 }); });
  on('vessel.mend', (e) => { L.inc('vessel.mends'); log.say('info', `${(PART[e.region] || 'The crack').replace(/^y/, 'Y')} mends.`, { key: 'mend', win: 2, fmt: (n) => `${n} cracks mend.` }); });
  // the vessel (vessel/): the kiln station, firings, glazes earned and learned
  on('kiln.open', () => { L.inc('kiln.open'); first('kiln', 'Logged: the kiln. Choose a glaze for each part of the vessel, preview it, then fire it.'); });
  on('vessel.fire', (e) => {
    L.inc('vessel.fired'); L.inc('vessel.fire.cubes', e.cost);
    const names = [...new Set(Object.values(e.look))].map((id) => g.vessel?.glaze(id)?.name || id);
    log.say('gain', `Vessel fired in ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}. Cost: ${plural(e.cost, 'cube')}.`, { tone: '#ffb27a' });
  });
  on('glaze.earn', (e) => { L.inc('glaze.earned'); log.say('record', `New glaze: ${g.vessel?.glaze(e.glaze)?.name || e.glaze}. Fire it at the kiln in the workshop.`); });
  on('glaze.learn', (e) => { L.inc('glaze.learned'); log.say('gain', `Glaze learned from the photograph: ${g.vessel?.glaze(e.glaze)?.name || 'a new colour'}.`, { tone: '#ffb27a' }); });
}
