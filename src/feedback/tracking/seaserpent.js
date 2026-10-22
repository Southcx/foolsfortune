// ---------------------------------------------------------------------------------------
// TRACKING, THE SEA SERPENT AND THE HULL: the rules that hear the open sea's hunter (creatures/seaserpent/) and the fight at the free
// helm (world/opensea/seafight.js) and keep their counts: risen, struck (the head apart), coiled and shot loose, sunk; the hull's hits
// and its breaking. Only the Courier's blows count (`by`). tracking/rules.js calls it. Words placeholders for Espada's.
//
//   seaSerpentRules({ on, L, log })
// ---------------------------------------------------------------------------------------
export function seaSerpentRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('seaserpent.rise', () => { L.inc('seaserpent.rise'); log.say('battle', 'Something long turns under the water and comes for your ship.', { key: 'ssrise', throttle: 20 }); });
  on('seaserpent.hit', (e) => { if (e.by !== 'courier') return; L.inc('seaserpent.hit'); if (e.part === 'head') L.inc('seaserpent.hit.head'); });
  on('seaserpent.move', (e) => { if (e.move === 'ram' && !e.hit) log.say('battle', 'The sea serpent breaks the surface beside you.', { key: 'ssram', throttle: 6 }); });
  on('seaserpent.coil', () => { L.inc('seaserpent.coil'); log.say('battle', 'The sea serpent coils round your hull. The helm barely answers.', { key: 'sscoil', throttle: 4 }); });
  on('seaserpent.free', (e) => { if (e.how === 'shot') { L.inc('seaserpent.free.shot'); log.say('battle', 'You shoot it loose of the hull.', { key: 'ssfree', throttle: 4 }); } else if (e.how === 'time') log.say('battle', 'It lets go of the hull.', { key: 'ssfree', throttle: 4 }); });
  on('seaserpent.down', (e) => {
    if (e.by !== 'courier') return;
    L.inc('seaserpent.down');
    log.say('battle', 'The sea serpent sinks.', { key: 'ssdown', throttle: 1 });
    first('seaserpent', 'Logged: your first sea serpent sunk. Another keeps its water from the next game day.');
  });
  on('sea.hull', (e) => { L.inc('sea.hull.hit'); log.say('warn', `Your hull takes a hit: it bears ${e.hull} more.`, { key: 'sshull', throttle: 0.5 }); });
  on('sea.hull.broken', (e) => { L.inc('sea.hull.broken'); log.say('warn', `Your hull gives. A tug tows you to the lane, mended, for ${e.fee} cubes.`, { key: 'sshullb', throttle: 2 }); });
}
