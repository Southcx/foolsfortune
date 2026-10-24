// ---------------------------------------------------------------------------------------
// TRACKING, TOUCH PLAY'S SETTINGS (docs/plans/MOBILE.md 9, M5): the touch layout kept or put back (core/layoutkeep.js), and gyro
// steering's motion access refused or never heard (core/gyrosteer.js), each said once where it happens. Nothing counted: the ledger keeps
// play, not the device. Words placeholders for Espada's.
//
//   touch.layout { set, by }   gyro.refused { why, by }   gyro.unheard { by }
//
//   touchPlayRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function touchPlayRules({ on, log }) {
  on('touch.layout', (e) => log.say('system', e.set ? 'Your touch layout is kept.' : 'Every button is back where it started.', { key: e.set ? 'touch.layout.kept' : 'touch.layout.reset', throttle: 2 })); // (each its own key: a reset just after a keep is still said)
  on('gyro.refused', () => log.say('system', 'Tilt to steer needs motion access, and it was refused: the setting is off.', { key: 'gyro.refused', throttle: 5 }));
  on('gyro.unheard', () => log.say('system', 'Tilt to steer hears no motion sensor here.', { key: 'gyro.unheard', throttle: 60 }));
}
