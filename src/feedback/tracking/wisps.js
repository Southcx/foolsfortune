// ---------------------------------------------------------------------------------------
// TRACKING, THE LANTERN WISPS: the rules that hear the Dunes' second creature (creatures/wisp/lanternwisp.js) and keep its counts:
// noticed, struck, cast at you, a blot drunk, put out. Only the Courier's blows count (`by`). tracking/rules.js calls it. Words placeholders for Espada's.
//
//   wispRules({ on, L, log })
// ---------------------------------------------------------------------------------------
export function wispRules({ on, L, log }) {
  const first = (key, text) => { if (L.first(key)) log.say('record', text); };
  on('wisp.notice', () => { L.inc('wisp.noticed'); log.say('battle', 'A Lantern Wisp turns its flame toward you.', { key: 'wnot', throttle: 6 }); });
  on('wisp.hit', (e) => { if (e.by === 'courier') L.inc('wisp.hit'); });
  on('wisp.cast', () => L.inc('wisp.cast'));
  // wisp.drink { field, aspect, at, by: 'creature' }: a Lantern Wisp drinks a blot at night and goes aberrant (world/duel/duelfoes.js)
  on('wisp.drink', () => log.say('other', 'A Lantern Wisp drinks a blot. Its flame burns wrong.', { key: 'wdrk', throttle: 4 }));
  on('wisp.burst', (e) => {
    if (e.by !== 'courier') { log.say('other', 'A Lantern Wisp gutters out.', { key: 'wbur2', throttle: 1 }); return; }
    L.inc('wisp.burst'); L.inc(`wisp.burst.${e.cause}`);
    log.say('battle', 'You put out the Lantern Wisp.', { key: 'wbur', win: 1, fmt: (n) => `You put out ${n} Lantern Wisps.` });
    first('wisp', 'Logged: your first Lantern Wisp put out. Its flame catches again in a while.');
  });
}
