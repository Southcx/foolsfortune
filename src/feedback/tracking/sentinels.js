// ---------------------------------------------------------------------------------------
// TRACKING, THE SENTINELS: the rules that hear rejection's antibody (creatures/sentinel/sentinels.js): risen, sent to a warp mark, a
// mark mended, struck, put down or sunk back into the island. Only the Courier's blows count (`by`). tracking/rules.js calls it. The
// lines are Espada's (2026-11-01, handoffs/petra); `{ground}` the island's firm layer, carried on the event.
//
//   sentinelRules({ on, L, log })
// ---------------------------------------------------------------------------------------
export function sentinelRules({ on, L, log }) {
  let ground = 'clay';
  on('sentinel.wake', (e) => { ground = e.ground || ground; L.inc('sentinel.wake'); log.say('other', `A sentinel rises from the island's ${ground}. It has come for whatever is warping it.`, { key: 'snwk', throttle: 8 }); });
  on('sentinel.seek', () => log.say('other', 'The sentinel turns toward the ground you warped.', { key: 'snsk', throttle: 20 }));
  on('sentinel.mend', (e) => { L.inc('sentinel.mend'); log.say('other', e.last ? `The sentinel smooths the warped ground back into place, then sinks into the ${e.ground || ground}.` : 'The sentinel smooths the warped ground back into place.', { key: 'snmd', throttle: 6 }); });
  on('sentinel.hit', (e) => { if (e.by === 'courier') L.inc('sentinel.hit'); });
  on('sentinel.cast', () => L.inc('sentinel.cast'));
  for (const k of ['step', 'windup', 'crack', 'fall']) on(`sentinel.${k}`, () => {}); // (the body's moments, for the ear: heard, never said)
  on('sentinel.burst', (e) => {
    if (e.cause === 'settled') return; // (its last mend said it sank)
    if (e.cause === 'driven') { log.say('other', `The sentinel sinks back into the ${ground}. The island still remembers.`, { key: 'snst', throttle: 4 }); return; }
    if (e.by !== 'courier') return;
    L.inc('sentinel.burst');
    log.say('battle', 'You put down the sentinel.', { key: 'snbr', throttle: 2 });
    if (L.first('sentinel')) log.say('record', 'Logged: your first sentinel put down. The island will send another while you warp it.');
  });
}
