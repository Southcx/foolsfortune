// ---------------------------------------------------------------------------------------
// TRACKING, THE COMBO ENGINE'S MOVES: what the shared moveset (tools/moveset.js) does beyond a tool's own string, counted for the
// ledger and the achievements (the counts are Dovina's to rule on: docs/handoffs/dovina/), and said when it is worth a sentence (a
// special, the first launcher, a long juggle). Only the Courier's moves are counted. The words are placeholders for Espada's.
//
//   combo.move   { tool, move, kind: 'pause' | 'charge' | 'launcher' | 'air' | 'plunge' | 'dash' | 'special' | 'counter', by }
//   combo.juggle { tool, hits, by }   an air string that struck two or more times before they landed
//
//   comboRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

const KIND = { launcher: 'Logged: your first launcher.', air: 'Logged: your first air combo.', plunge: 'Logged: your first plunge.', special: 'Logged: your first special.', pause: 'Logged: your first pause combo.', charge: 'Logged: your first charged blow.' };

export function comboRules({ on, L, log }) {
  on('combo.move', (e) => {
    if (e.by !== 'courier') return;
    L.inc(`combo.${e.kind}`); L.inc(`combo.${e.tool}.${e.move}`);
    if (KIND[e.kind] && L.first(`combo.${e.kind}`)) log.say('record', KIND[e.kind]);
  });
  on('combo.juggle', (e) => {
    if (e.by !== 'courier') return;
    L.inc('combo.juggle'); L.hi('combo.juggle.best', e.hits);
    if (e.hits >= 3) log.say('battle', `You keep it in the air for ${e.hits} blows.`, { key: 'juggle', throttle: 4 });
  });
}
