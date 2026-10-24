// ---------------------------------------------------------------------------------------
// TRACKING, THE GRAPHICS TIER (render/graphics.js): what the machine was read as, said once at boot; a tier picked in play, and whether
// the rest of it waits for the next start; the picture's lines stepped by dynamic resolution, said the first time only (a frame kept
// smooth is not news twice). Nothing counted: the ledger keeps play, not the machine. Words placeholders for Espada's.
//
//   graphics.tier { tier, chosen, renderer, touch, mobile, restart? }   graphics.lines { lines }   graphics.restart { tier }   (each with `by`)
//
//   graphicsRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
const TIER_WORD = { high: 'High', low: 'Low', minimum: 'Minimum', custom: 'Custom' };

export function graphicsRules({ on, log }) {
  on('graphics.tier', (e) => {
    const name = TIER_WORD[e.tier] || e.tier;
    if (e.by === 'courier') log.say('system', `Graphics: ${name}.`, { key: 'graphics.tier', throttle: 1 });
    else log.say('system', e.chosen === 'auto' ? `Graphics: ${name}, chosen for this machine.` : `Graphics: ${name}.`, { key: 'graphics.boot', throttle: 600 });
  });
  on('graphics.restart', () => log.say('system', 'The rest of the change takes effect when you next start the game.', { key: 'graphics.restart', throttle: 2 }));
  let said = false;
  on('graphics.lines', (e) => { if (said) return; said = true; log.say('system', `The picture drops to ${e.lines} lines to keep the frame smooth.`, { key: 'graphics.lines' }); });
}
