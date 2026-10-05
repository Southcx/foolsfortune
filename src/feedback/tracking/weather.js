// ---------------------------------------------------------------------------------------
// TRACKING, THE WEATHER AND THE DAY: the rules that hear the sky (progress/weather.js): what weather the Courier has stood in, the hours
// they have seen, the fish caught and the statuses built in each weather, for the achievements; and the log's line when an island's mood
// turns. The words are placeholders for Espada's. tracking.js calls it from listen().
//
//   weatherRules({ on, L, log, g })     g: the game (the weather where the Courier is, at the moment of a catch or a status)
// ---------------------------------------------------------------------------------------
import { NODES } from '../../progress/econ/emocean.js';
import { TYPE_OF } from '../../progress/weather.js';

const PLACE = (id) => NODES[id]?.name || id;
const NAME = { mirth: 'Mirth', wonder: 'Wonder', hunger: 'Hunger', grief: 'Grief', dread: 'Dread' };
const STATUS_OF = { impact: 'stun', ego: 'doubt', influence: 'charm', illusion: 'blind', delirium: 'confusion' };

export function weatherRules({ on, L, log, g }) {
  const seen = (e) => { const a = e.aspect || 'calm'; L.inc(`weather.seen.${a}`); L.inc(`weather.seen.${a}.${e.island}`); };
  on('weather.now', seen);
  on('weather.change', (e) => {
    seen(e);
    if (e.aspect) log.say('info', `${NAME[e.aspect]} ${e.strength > 0.6 ? 'falls hard' : 'falls'} on ${PLACE(e.island)}.`, { key: 'weather', throttle: 20 });
    else log.say('info', `The mood over ${PLACE(e.island)} settles: calm.`, { key: 'weather', throttle: 20 });
  });
  on('day.phase', (e) => { L.inc(`day.${e.phase}`); if (e.phase === 'night' || e.phase === 'dawn') log.say('info', e.phase === 'night' ? 'Night falls. Lachryma glows in the dark.' : 'Dawn.', { key: 'dayphase', throttle: 30 }); });
  // in its weather: a fish landed, a status built
  on('angle.catch', () => { const w = g.weather?.now(); if (w?.aspect) L.inc(`angle.catch.weather.${w.aspect}`); });
  on('creature.status', (e) => {
    if (e.by !== 'courier') return;
    const w = g.weather?.now();
    if (w?.aspect && STATUS_OF[TYPE_OF[w.aspect]] === e.status) L.inc('status.weather');
  });
}
