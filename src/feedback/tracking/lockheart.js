// ---------------------------------------------------------------------------------------
// TRACKING, THE LOCKHEART'S RECOIL: an Overload let out cracks the vessel on its way (the owner, 2026-10-13: a pressurized vessel when
// taking things out; tools/lockheart/table.js OUTCOMES.nuke.recoil). Counted and said. The Lockheart's outcomes stay in tracking.js.
// Words are placeholders for Espada's.
//
//   lockheartRules({ on, L, log })
// ---------------------------------------------------------------------------------------
export function lockheartRules({ on, L, log }) {
  on('lockheart.recoil', (e) => {
    if (e.by !== 'courier') return;
    L.inc('lockheart.recoil');
    log.say('hurt', e.shattered ? 'The Overload breaks you on its way out.' : 'The Overload cracks you on its way out.');
  });
}
