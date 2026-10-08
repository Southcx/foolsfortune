// ---------------------------------------------------------------------------------------
// TRACKING, THE PASSAGE'S ENCOUNTERS: what an encounter's choice did at sea (world/emocean/triprun.js `act`, on Dovina's
// progress/rail/encounters.js `apply`): portents told, casks taken aboard, a bounty posted and paid, a rutter sold or bought, the
// whale followed down, a hand taken aboard, a ghost raced. The log's lines are placeholders for Espada's; the counts are the events'
// own keys (Dovina's to read or move). rules.js calls it.
//
//   passageRules({ on, L, log })   passage.exact { waypoints, types }   passage.casks { n, grade }   passage.posted { waypoint, type, cubes }
//   passage.bounty { waypoint, type, cubes }   rutter.sell { cubes, to }   rutter.buy { cubes }   passage.dive { form, pays }
//   passage.crew { slots, legs }   passage.ghost { legs, score }   passage.race { beat, score, par }   passage.adrift { at, types, relaid }   charybdis.rise { feel }   charybdis.felled { feel, shards }   charybdis.driven { feel, hp }
// ---------------------------------------------------------------------------------------
const WORD = { shoal: 'the shoal', wreckers: 'the Wreckers', eyewall: 'the eyewall', graveyard: 'the graveyard', maelstrom: 'the maelstrom', bounty: 'a bounty', leviathan: 'Old Nobody', calm: 'a calm', encounter: 'a sighting' }; // (the sea chart's words: world/emocean/seachart.js WAYPOINT)
const named = (t) => WORD[t] || t;

export function passageRules({ on, L, log }) {
  on('passage.exact', (e) => { if (e.by === 'courier' && e.types?.length) log.say('explore', `Ahead lies ${e.types.map(named).join(', then ')}.`); });
  on('passage.casks', (e) => { if (e.by !== 'courier') return; if (e.n) { L.inc('passage.casks', e.n); log.say('gain', `You take ${e.n} ${e.n === 1 ? 'cask' : 'casks'} of crude ${e.grade} aboard.`); } else log.say('warn', 'Your hold is full.'); });
  on('passage.posted', (e) => { if (e.by === 'courier') log.say('explore', `Letty posts a bounty on ${named(e.type)} ahead: ${e.cubes} cubes.`); });
  on('passage.bounty', (e) => { if (e.by !== 'courier') return; L.inc('passage.bounty'); log.say('gain', `Bounty paid: ${e.cubes} cubes.`); });
  on('rutter.sell', (e) => { if (e.by !== 'courier') return; L.inc('rutter.sell'); log.say('gain', `You sell Letty your rutter for ${e.cubes} cubes.`); });
  on('rutter.buy', (e) => { if (e.by !== 'courier') return; L.inc('rutter.buy'); log.say('gain', `You buy today's rutter of this route for ${e.cubes} cubes.`); });
  on('passage.dive', (e) => { if (e.by === 'courier') log.say('explore', 'You follow it down. The next leg is sailed below.'); });
  on('passage.crew', (e) => { if (e.by === 'courier') { L.inc('passage.crew'); log.say('explore', 'You take them aboard.'); } });
  on('passage.ghost', (e) => { if (e.by === 'courier') log.say('explore', e.score != null ? `Your double sails beside you. Beat ${e.score} over the next leg.` : 'The glass is empty: no double to race today.'); });
  on('passage.adrift', (e) => { L.inc('passage.adrift'); log.say('warn', e.relaid && e.types?.length ? `Your bunker is dry. You are adrift: the current takes you on to ${e.types.map(named).join(', then ')}.` : 'Your bunker is dry. You are adrift: the current takes you.'); });
  on('charybdis.rise', (e) => log.say('combat', e.feel ? `Charybdis rises, in ${e.feel}.` : 'Charybdis rises.')); // (Espada's line, the glossary's)
  on('charybdis.felled', (e) => log.say('gain', `Charybdis is felled. You take ${e.shards} crystal shards from the maelstrom.`)); // (placeholders for Espada's)
  on('charybdis.driven', () => log.say('combat', 'Charybdis sinks back into the maelstrom.'));
  on('passage.race', (e) => { if (e.by !== 'courier') return; if (e.beat) L.inc('passage.race.beat'); log.say(e.beat ? 'record' : 'info', e.beat ? 'You beat your double.' : 'Your double pulls ahead.'); });
}
