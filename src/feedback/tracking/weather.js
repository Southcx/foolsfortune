// ---------------------------------------------------------------------------------------
// TRACKING, THE WEATHER AND THE DAY: the rules that hear the sky (progress/weather.js): what weather the Courier has stood in, the game hours
// they have seen, the fish caught and the statuses built in each weather, for the achievements; and the log's line when an island's mood
// turns, the forecast read with the Dreamvane, and the time asked of the Veritome. The words are placeholders for Espada's. tracking.js calls it from listen().
//
//   weatherRules({ on, L, log, g })     g: the game (the weather where the Courier is, at the moment of a catch or a status)
// ---------------------------------------------------------------------------------------
import { NODES } from '../../progress/econ/emocean.js';
import { TYPE_OF, NAMES, NATIVE, clockAt } from '../../progress/weather.js';

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
  // the Dreamvane reads the sky: sky.read { island, now (game hours), blocks: [{ hour, aspect, strength, agate }], by }
  const AHEAD = (h) => { const n = Math.max(1, Math.round(h)); return n === 1 ? 'in a game hour' : `in ${n} game hours`; };
  on('sky.read', (e) => {
    if (e.by !== 'courier') return;
    L.inc('sky.read');
    const said = (e.blocks || []).map((b) => `${b.aspect ? `${NAMES[b.aspect]}${b.strength > 0.6 ? ', heavy' : ''}${b.agate ? ` (${b.agate})` : ''}` : 'fair'} ${AHEAD(b.hour - e.now)}`);
    log.say('info', said.length ? `The vane reads the sky over ${PLACE(e.island)}: ${said.join('; then ')}.` : 'The vane cannot read further.', { key: 'skyread', throttle: 2 });
  });
  // the Veritome's clock: clock.read { ms?, by } (no ms: now)
  on('clock.read', (e) => {
    const c = clockAt(e.ms);
    log.say('info', `Game day ${c.day}, ${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}.`, { key: 'clock', throttle: 1 });
  });
  // a feeling learned by drinking it (GALL-AND-FURY.md section 5): feeling.drink { aspect, by } as the drunk feeling changes (courier/mind.js);
  // a feeling past Anagami's five is known from its first drink, and the radial's slot and the achievement read that count
  on('feeling.drink', (e) => {
    if (e.by !== 'courier' || !e.aspect) return;
    const first = !L.get(`feeling.known.${e.aspect}`);
    L.inc(`feeling.known.${e.aspect}`);
    if (first && !NATIVE.includes(e.aspect)) log.say('system', `${e.aspect[0].toUpperCase() + e.aspect.slice(1)} known. Refine it now.`, { key: 'feeling.known' }); // (Espada's words)
  });
  on('busk.suits', (e) => { if (e.by === 'courier') L.inc('busk.suits'); });
  // in its weather: a fish landed, a status built
  on('angle.catch', () => { const w = g.weather?.here(g.player?.pos); if (w?.aspect) L.inc(`angle.catch.weather.${w.aspect}`); });
  // (where the Courier stands: a status is built within reach of them; a stun is its own event, creatures/stun.js)
  const built = (status) => { const w = g.weather?.here(g.player?.pos); if (w?.aspect && STATUS_OF[TYPE_OF[w.aspect]] === status) L.inc('status.weather'); };
  on('creature.status', (e) => { if (e.by === 'courier') built(e.status); });
  on('creature.stun', (e) => { if (e.by === 'courier') built('stun'); });
}
