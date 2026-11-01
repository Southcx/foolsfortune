// ---------------------------------------------------------------------------------------
// TRACKING, THE SIGHT: the log's line when the Sight's needle is calibrated or let go (progress/sight.js), and its count. Words are
// placeholders for Espada's.
//
//   sightRules({ on, L, log, g })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function sightRules({ on, L, log, g }) {
  on('sight.calibrate', (e) => {
    if (e.by !== 'courier') return;
    if (e.from === 'off') { log.say('system', 'Sight uncalibrated. The needle spins.', { key: 'sight', throttle: 2 }); return; }
    L.inc('sight.calibrate'); L.inc(`sight.calibrate.${e.from}`);
    const name = e.from === 'point' ? 'your mark on the map' : g?.places?.get(e.id)?.name || e.id;
    log.say('system', e.from === 'kind' ? `Sight calibrated to the nearest ${name}.` : `Sight calibrated to ${name}.`, { key: 'sight', throttle: 2 });
  });
}
