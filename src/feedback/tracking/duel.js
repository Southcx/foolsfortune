// ---------------------------------------------------------------------------------------
// TRACKING, A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md; the session world/duel/duelsession.js): an aberrant's duel said in the log (the
// only text feedback) and kept on the ledger: begun, the Figment buckled by your junk, and its end, won (drained, or the coup) or lost.
// The words are Espada's (the duel's lore name is the wrangle: docs/LORE.md, "The puzzle duel's words").
//
//   duel.open { kind, feeling }   duel.buckle { kind, depth }   duel.end { kind, won, how, turns }   (each with `by`)
//
//   duelRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function duelRules({ on, L, log }) {
  on('duel.open', () => { L.inc('duel.open'); log.say('battle', 'An aberrant Figment seizes your mind. The wrangle begins.'); });
  on('duel.buckle', (e) => { if (e.by !== 'courier') return; L.inc('duel.buckle'); log.say('battle', 'The Figment buckles.', { key: 'duel.buckle', throttle: 1 }); });
  on('duel.end', (e) => {
    L.inc(e.won ? 'duel.won' : 'duel.lost');
    if (e.won) log.say('battle', e.how === 'coup' ? 'You drain the Figment.' : 'You win the wrangle. The Figment is mended.');
    else log.say('battle', e.how === 'yield' ? 'You yield the wrangle.' : 'You lose the wrangle. The Figment pushes your mind out.');
  });
}
