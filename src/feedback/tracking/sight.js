// ---------------------------------------------------------------------------------------
// TRACKING, THE SIGHT: the log's line when the Sight's needle is calibrated or let go (progress/sight.js), and its count. Words are
// placeholders for Espada's.
//
//   sightRules({ on, L, log, g })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function sightRules({ on, L, log, g }) {
  on('sight.calibrate', (e) => {
    if (e.by !== 'courier') return;
    if (e.from === 'off') { log.say('system', 'The Sight\'s needle loosens and spins.', { key: 'sight', throttle: 2 }); return; }
    L.inc('sight.calibrate'); L.inc(`sight.calibrate.${e.from}`);
    const name = g?.places?.get(e.id)?.name || e.id;
    log.say('system', e.from === 'kind' ? `The Sight's needle hunts for the nearest ${name}.` : `The Sight's needle swings toward ${name}.`, { key: 'sight', throttle: 2 });
  });
}
