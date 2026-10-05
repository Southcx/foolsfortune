// ---------------------------------------------------------------------------------------
// TRACKING, THE WEATHER AND THE DAY: the rules that hear the sky (progress/weather.js): what weather the Courier has stood in, the hours
// they have seen, the fish caught and the statuses built in each weather, for the achievements; and the log's line when an island's mood
// turns. The words are placeholders for Espada's. tracking.js calls it from listen().
//
//   weatherRules({ on, L, log, g })     g: the game (the weather where the Courier is, at the moment of a catch or a status)
// ---------------------------------------------------------------------------------------
import { NODES } from '../../progress/econ/emocean.js';
import { TYPE_OF, NAMES } from '../../progress/weather.js';

const PLACE = (id) => (id === 'well:dunemaw' ? 'the Great Dunemaw' : NODES[id]?.name || id);
const STATUS_OF = { impact: 'stun', ego: 'doubt', influence: 'charm', illusion: 'blind', delirium: 'confusion' };

export function weatherRules({ on, L, log, g }) {
  const seen = (e) => { const a = e.aspect || 'calm'; L.inc(`weather.seen.${a}`); L.inc(`weather.seen.${a}.${e.island}`); if (e.agate) L.inc(`weather.agate.${e.agate}`); };
  on('weather.now', seen);
  on('weather.change', (e) => {
    seen(e);
    const n = NAMES[e.aspect || 'calm'];
    if (e.aspect) log.say('info', `Weather over ${PLACE(e.island)}: ${n}${e.strength > 0.6 ? ', heavy' : ''}${e.agate ? ` and ${NAMES[e.second]} (${e.agate})` : ''}.`, { key: 'weather', throttle: 20 });
    else log.say('info', `Weather over ${PLACE(e.island)}: fair.`, { key: 'weather', throttle: 20 });
  });
  on('day.phase', (e) => { L.inc(`day.${e.phase}`); if (e.phase === 'night' || e.phase === 'dawn') log.say('info', e.phase === 'night' ? 'Night falls. Lachryma glows in the dark.' : 'Dawn.', { key: 'dayphase', throttle: 30 }); });
  on('busk.suits', (e) => { if (e.by === 'courier') L.inc('busk.suits'); });
  // in its weather: a fish landed, a status built
  on('angle.catch', () => { const w = g.weather?.here(g.player?.pos); if (w?.aspect) L.inc(`angle.catch.weather.${w.aspect}`); });
  on('creature.status', (e) => {
    if (e.by !== 'courier') return;
    const w = g.weather?.here(e.pos ? { x: e.pos[0], y: e.pos[1], z: e.pos[2] } : g.player?.pos);
    if (w?.aspect && STATUS_OF[TYPE_OF[w.aspect]] === e.status) L.inc('status.weather');
  });
}
