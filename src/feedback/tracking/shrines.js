// ---------------------------------------------------------------------------------------
// TRACKING, THE SHRINES: a Shrine found, rested at, travelled between and its storage; the Spirit Garden's door. Moved out of tracking.js
// whole, the words unchanged (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one
// sentence an event).
//
//   shrineRules({ on, L, log, g })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function shrineRules({ on, L, log, g }) {
  // the Shrines (docs/plans/SHRINES.md; world/shrines.js): found, rested at, travelled between; the Spirit Garden's door. Never "saved".
  on('shrine.find', (e) => { if (e.by !== 'courier') return; L.inc('shrine.found'); L.inc(`shrine.found.${e.shrine}`); log.say('explore', `You find ${g.shrines?.get(e.shrine)?.name || 'a Shrine'}.`); });
  on('shrine.rest', (e) => { if (e.by === 'courier') { L.inc('shrine.rest'); log.say('info', 'You rest at the Shrine.', { key: 'shrinerest', throttle: 4 }); } });
  on('shrine.travel', (e) => { if (e.by === 'courier') { L.inc('shrine.travel'); log.say('explore', `You travel to ${g.shrines?.get(e.to)?.name || 'the Shrine'}.`); } });
  on('shrine.storage', (e) => { if (e.by === 'courier') { L.inc('shrine.storage'); log.say('info', 'Your storage opens beside your Pneuka Box.', { key: 'shrinestorage', throttle: 4 }); } });
  on('garden.enter', (e) => { if (e.by === 'courier') L.inc('garden.enter'); });
}
