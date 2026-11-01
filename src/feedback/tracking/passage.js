// ---------------------------------------------------------------------------------------
// TRACKING, THE PASSAGE'S ENCOUNTERS: what an encounter's choice did at sea (world/emocean/triprun.js `act`, on Dovina's
// progress/rail/encounters.js `apply`): portents told, casks taken aboard, a bounty posted and paid, a rutter sold or bought, the
// whale followed down, a hand taken aboard, a ghost raced. The log's lines are placeholders for Espada's; the counts are the events'
// own keys (Dovina's to read or move). rules.js calls it.
//
//   passageRules({ on, L, log })   passage.exact { waypoints, types }   passage.casks { n, field }   passage.posted { waypoint, type, cubes }
//   passage.bounty { waypoint, type, cubes }   rutter.sell { cubes, to }   rutter.buy { cubes }   passage.dive { form, pays }
//   passage.crew { slots, legs }   passage.ghost { legs, score }   passage.race { beat, score, par }   passage.adrift { at, types, relaid }   charybdis.rise { feel }   charybdis.dive { feel }   charybdis.felled { feel, shards }   charybdis.driven { feel, hp }
// ---------------------------------------------------------------------------------------
import { crudeName } from '../../pneuka/items.js';

const WORD = { shoal: 'the shoal', wreckers: 'the Wreckers', eyewall: 'the eyewall', graveyard: 'the graveyard', maelstrom: 'the maelstrom', bounty: 'a bounty', leviathan: 'Old Nobody', calm: 'a calm', encounter: 'a sighting' }; // (the sea chart's words: world/emocean/seachart.js WAYPOINT)
const named = (t) => WORD[t] || t;

export function passageRules({ on, L, log }) {
  on('passage.exact', (e) => { if (e.by === 'courier' && e.types?.length) log.say('explore', `Ahead: ${e.types.map(named).join(', then ')}.`); });
  on('passage.casks', (e) => { if (e.by !== 'courier') return; if (e.n) { L.inc('passage.casks', e.n); log.say('gain', `${e.n} ${e.n === 1 ? 'cask' : 'casks'} of ${crudeName(e.field)} loaded aboard.`); } else log.say('warn', 'The ship\'s hold is full.'); });
  on('passage.posted', (e) => { if (e.by === 'courier') log.say('explore', `Bounty posted by Letty: ${named(e.type)} ahead, ${e.cubes} cubes.`); });
  on('passage.bounty', (e) => { if (e.by !== 'courier') return; L.inc('passage.bounty'); log.say('gain', `Bounty paid: ${e.cubes} cubes.`); });
  on('rutter.sell', (e) => { if (e.by !== 'courier') return; L.inc('rutter.sell'); log.say('gain', `Route map sold to Letty for ${e.cubes} cubes.`); });
  on('rutter.buy', (e) => { if (e.by !== 'courier') return; L.inc('rutter.buy'); log.say('gain', `Route map bought for ${e.cubes} cubes. It covers this route for this game day.`); });
  on('passage.dive', (e) => { if (e.by === 'courier') log.say('explore', 'Diving. The next section is sailed below the surface.'); });
  on('passage.crew', (e) => { if (e.by === 'courier') { L.inc('passage.crew'); log.say('explore', 'You take them aboard.'); } });
  on('passage.ghost', (e) => { if (e.by === 'courier') log.say('explore', e.score != null ? `Your ghost sails beside you. Beat ${e.score} over the next section.` : 'The Glass is empty. No double to race this game day.'); });
  on('passage.adrift', (e) => { L.inc('passage.adrift'); log.say('warn', e.relaid && e.types?.length ? `Bunker dry. You are adrift. The current carries you on to ${e.types.map(named).join(', then ')}.` : 'Fuel gone. You are adrift. The current carries you.'); });
  on('charybdis.rise', (e) => log.say('combat', e.feel ? `Charybdis rises, in ${e.feel}.` : 'Charybdis rises.')); // (Espada's line, the glossary's)
  on('charybdis.dive', () => log.say('combat', 'Charybdis dives.')); // (Espada's, LORE.md: its first dive only)
  on('charybdis.felled', (e) => { log.say('combat', 'Charybdis sinks into the maelstrom. The sea goes still.'); if (e.shards) log.say('gain', `${e.shards} crystal shards taken from the maelstrom!`); }); // (Espada's line; the pay's, the house style)
  on('charybdis.driven', () => log.say('combat', 'Charybdis sinks back into the maelstrom.'));
  on('passage.race', (e) => { if (e.by !== 'courier') return; if (e.beat) L.inc('passage.race.beat'); log.say(e.beat ? 'record' : 'info', e.beat ? 'Double beaten!' : 'Your double pulls ahead.'); });
}
