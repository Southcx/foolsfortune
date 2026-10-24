// ---------------------------------------------------------------------------------------
// TRACKING, THE INSTRUMENT SKINS (vfx/instrumentskins.js): a skin put on is said once, plainly; nothing counted (a preference, as the
// window colour is). Words placeholders for Espada's.
//
//   instruments.skin { id, label, by }
//
//   instrumentRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function instrumentRules({ on, log }) {
  on('instruments.skin', (e) => { if (e.by === 'courier') log.say('system', `Instruments: ${e.label || e.id}.`, { key: 'instruments.skin', throttle: 0.5 }); });
}
