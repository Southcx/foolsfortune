// ---------------------------------------------------------------------------------------
// TRACKING, THE SEA SERPENT AND THE HULL: the rules that hear the open sea's hunter (creatures/seaserpent/) and the fight at the free
// helm (world/opensea/seafight.js) and keep their counts (the other beasts too, seabeasts.js: the forge reads their carves): risen, struck (the head apart), coiled and shot loose, sunk; the hull's hits
// and its breaking. Only the Courier's blows count (`by`). tracking/rules.js calls it. Words placeholders for Espada's.
//
//   seaSerpentRules({ on, L, log })   (also the shapes' seaserpent.hold { id, move }, seaserpent.break { id, part, left }, the free 'gulp')
// ---------------------------------------------------------------------------------------
export function seaSerpentRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('seaserpent.rise', () => { L.inc('seaserpent.rise'); log.say('battle', 'Sea serpent sighted. It is coming for your ship.', { key: 'ssrise', throttle: 20 }); });
  on('seaserpent.hit', (e) => { if (e.by !== 'courier') return; L.inc('seaserpent.hit'); if (e.part === 'head') L.inc('seaserpent.hit.head'); });
  on('seaserpent.move', (e) => { if (e.move === 'ram' && !e.hit) log.say('battle', 'The sea serpent breaks the surface beside you.', { key: 'ssram', throttle: 6 }); });
  on('seaserpent.coil', () => { L.inc('seaserpent.coil'); log.say('battle', 'The sea serpent coils round your hull. Steering is slowed.', { key: 'sscoil', throttle: 4 }); });
  on('seaserpent.free', (e) => { if (e.how === 'shot') { L.inc('seaserpent.free.shot'); log.say('battle', 'Sea serpent shot loose of the hull.', { key: 'ssfree', throttle: 4 }); } else if (e.how === 'time') log.say('battle', 'The sea serpent lets go of the hull.', { key: 'ssfree', throttle: 4 }); });
  // the shapes' holds and breaks (creatures/seaserpent/shapes.js): the umibozu's grip let go by a gulp, the kraken's arms shot off
  on('seaserpent.hold', (e) => { L.inc(`seabeast.hold.${e.move}`); log.say('battle', e.move === 'grip' ? 'Huge hands grip your gunwale. Water pours onto the deck.' : 'An arm wraps your hull. Steering is slowed.', { key: 'sshold', throttle: 4 }); });
  on('seaserpent.free', (e) => { if (e.how !== 'gulp') return; L.inc('seabeast.free.gulp'); log.say('battle', 'Water drained by the Lockheart. The hands let go.', { key: 'ssfree', throttle: 4 }); });
  on('seaserpent.break', (e) => { if (e.by !== 'courier') return; L.inc('seabeast.break'); log.say('battle', e.left ? 'Arm shot off.' : 'Last arm shot off.', { key: 'ssbreak', throttle: 1 }); });
  on('seaserpent.down', (e) => {
    if (e.by !== 'courier') return;
    L.inc('seaserpent.down');
    log.say('battle', 'The sea serpent sinks.', { key: 'ssdown', throttle: 1 });
    first('seaserpent', 'Logged: your first sea serpent sunk. A new one returns to its water on the next game day.');
  });
  // the other beasts (progress/opensea/seabeasts.js; their runtime on the serpent's chassis): sunk, paid, carves for the forge (forge.js)
  const BEAST = { wolfWhale: 'the akhlut', seaMonk: 'the umibozu', bigSquid: 'the kraken', worldSerpent: 'Jormungandr' }; // (placeholders, Espada's)
  const beast = (id) => BEAST[id] || 'the beast';
  on('seabeast.down', (e) => {
    if (e.by !== 'courier') return;
    L.inc('seabeast.down'); L.inc(`seabeast.down.${e.id}`);
    log.say('battle', `${beast(e.id)[0].toUpperCase()}${beast(e.id).slice(1)} sinks.`, { key: 'sbdown', throttle: 1 });
    first(`seabeast.${e.id}`, `Logged: your first of ${beast(e.id)} sunk. Its ship's part can now be forged at a quay. Type /forge.`);
  });
  on('seabeast.paid', (e) => { if (e.by !== 'courier') return; if (e.hull >= e.of) L.inc(`seabeast.down.whole.${e.id}`); log.say('gain', `Reward for sinking ${beast(e.id)}: ${e.cubes} cubes. Hull: ${e.hull} of ${e.of} hits left.`, { key: 'sb.paid', throttle: 1 }); });
  on('sea.hull', (e) => { L.inc('sea.hull.hit'); log.say('warn', `Hull hit. It can take ${e.hull} more.`, { key: 'sshull', throttle: 0.5 }); });
  on('sea.hull.broken', (e) => { L.inc('sea.hull.broken'); log.say('warn', `Hull broken. A tug tows you to the lane and mends the ship for ${e.fee} cubes.`, { key: 'sshullb', throttle: 2 }); });
}
