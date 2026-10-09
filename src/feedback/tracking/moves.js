// ---------------------------------------------------------------------------------------
// TRACKING, THE MOVESETS: the rules that hear the moves of Calissa's suite (tools/moveset.js; the numbers: progress/combat/moves.js) and
// keep the counts their unlocks and achievements read: launchers, the air string's best, specials, the skiff's bails and ollies, and the
// tools' blows the unlocks count that no other rule keeps (the Dreamvane's, the Crucibelle's fever). Only the Courier's count (`by`).
// tracking.js calls it from listen(). The words are placeholders for Espada's.
//
//   moveRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { MOVES } from '../../progress/combat/moves.js';

export function moveRules({ on, L, log }) {
  // move.launch { tool, by }: a launcher lifted something; move.air { tool, hits, by }: an air string ended with `hits` blows landed
  on('move.launch', (e) => { if (e.by === 'courier') L.inc('move.launch'); });
  on('move.air', (e) => { if (e.by !== 'courier') return; L.hi('move.air.best', e.hits || 0); if ((e.hits || 0) >= 6) log.say('battle', `An air string of ${e.hits}.`, { key: 'air', throttle: 2 }); });
  // move.special { tool, special, by }: a special used (its cost already paid)
  on('move.special', (e) => { if (e.by !== 'courier') return; L.inc('move.special'); L.inc(`move.special.${e.special}`); const s = MOVES[e.tool]?.special; if (s && s.id === e.special && !L.get(`move.special.${e.special}.said`)) { L.inc(`move.special.${e.special}.said`); log.say('gain', `A special: ${e.special}.`); } });
  // the skiff (Calissa's suite): skiff.bail { speed, by }, skiff.ollie { geyser, by }
  on('skiff.glide', () => { L.inc('skiff.glide'); if (L.first('skiff.glide')) log.say('record', 'Logged: your first glide on the Solar Skiff.'); });
  on('skiff.bail', (e) => { if (e.by === 'courier') { L.inc('skiff.bail'); log.say('move', 'You bail.', { key: 'bail', throttle: 3 }); } });
  on('skiff.ollie', (e) => { if (e.by !== 'courier') return; L.inc('skiff.ollie'); if (e.geyser) L.inc('skiff.ollie.geyser'); });
  // the blows the unlocks count that no other rule keeps
  on('dreamvane.hit', (e) => { if ((e.by ?? 'courier') === 'courier') L.inc('dreamvane.hit'); });
  on('crucibelle.fever', (e) => { if ((e.by ?? 'courier') === 'courier') L.inc('crucibelle.fever'); });
}
