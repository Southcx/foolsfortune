// ---------------------------------------------------------------------------------------
// TRACKING, THE MAPS: the map pulsed, a survey charted, a room charted. Moved out of tracking.js whole, the words unchanged (they are
// Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   mapRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { plural } from './lineformat.js';

export function mapRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('map.pulse', (e) => { L.inc('map.pulse'); if (e.god) L.inc('map.pulse.god'); });
  on('map.surveyed', (e) => { L.inc('map.cells', e.gained); if (e.gained > 0) log.say('explore', `Your survey charts ${plural(e.gained, 'new area')}.`, { key: 'sv', win: 2 }); });
  on('map.room', (e) => { L.inc('map.room'); if (L.first(`room.${e.id}`)) log.say('explore', `You have charted ${e.place}.`); });
}
