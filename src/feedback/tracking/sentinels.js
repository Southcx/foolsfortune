// ---------------------------------------------------------------------------------------
// TRACKING, THE SENTINELS: the rules that hear rejection's antibody (creatures/sentinel/sentinels.js): risen, sent to a warp mark, a
// mark mended, struck, put down or sunk back into the island. Only the Courier's blows count (`by`). tracking/rules.js calls it. The
// arrival line is Espada's (2026-10-30); the rest are placeholders for her words.
//
//   sentinelRules({ on, L, log })
// ---------------------------------------------------------------------------------------
export function sentinelRules({ on, L, log }) {
  on('sentinel.wake', () => { L.inc('sentinel.wake'); log.say('other', "A sentinel rises from the island's clay. It has come for what is warping it.", { key: 'snwk', throttle: 8 }); });
  on('sentinel.seek', () => log.say('other', 'The sentinel turns toward what you changed.', { key: 'snsk', throttle: 20 }));
  on('sentinel.mend', (e) => { L.inc('sentinel.mend'); log.say('other', e.volume > 0 ? 'The sentinel wears your work back into the island.' : 'The sentinel puts the ground right.', { key: 'snmd', throttle: 6 }); });
  on('sentinel.hit', (e) => { if (e.by === 'courier') L.inc('sentinel.hit'); });
  on('sentinel.cast', () => L.inc('sentinel.cast'));
  on('sentinel.burst', (e) => {
    if (e.cause === 'settled') { log.say('other', 'The sentinel sinks back into the island.', { key: 'snst', throttle: 4 }); return; }
    if (e.by !== 'courier') return;
    L.inc('sentinel.burst');
    log.say('battle', 'You put down the sentinel.', { key: 'snbr', throttle: 2 });
    if (L.first('sentinel')) log.say('record', 'Logged: your first sentinel put down. The island will send another while you warp it.');
  });
}
