// ---------------------------------------------------------------------------------------
// TRACKING, THE FLOURISHES (vfx/flourishes.js): a flourish worn in another slot is said once in the log. A look, so nothing is counted
// (the ledger keeps play, not looks). Words placeholders for Espada's.
//
//   flourish.set { slot: 'footprints' | 'dash' | 'shatter' | 'aura' | 'arrival', id, slotLabel, label, line, stock, by: 'courier' }
//
//   flourishRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function flourishRules({ on, log }) {
  on('flourish.set', (e) => {
    const said = e.stock ? (e.id === 'off' ? 'off.' : 'back to stock.') : `${e.label}. ${e.line}`;
    log.say('system', `${e.slotLabel || e.slot}: ${said}`, { key: `flourish.${e.slot}`, throttle: 0.5 });
  });
}
