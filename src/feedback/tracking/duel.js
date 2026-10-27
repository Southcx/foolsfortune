// ---------------------------------------------------------------------------------------
// TRACKING, A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md; the session world/duel/duelsession.js): an aberrant's duel said in the log (the
// only text feedback) and kept on the ledger: begun, the Figment broken by your junk, and its end, won (drained, or the finisher), lost, or fled.
// The words are Espada's (docs/LORE.md, "The puzzle duel's words"); the log says "duel", the genre's word.
//
//   duel.pull { foe }   duel.slip   duel.open { kind, feeling }   duel.break { kind, depth }   duel.flee { roll, reroll, need, ok }   duel.end { kind, won, how, turns, atOnce }   duel.undo { left }   (each with `by`)
//
//   duelRules({ on, L, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------

export function duelRules({ on, L, log }) {
  // the pull (world/duel/duelfoes.js): its look and sound say it; the log says only an escape (a plain placeholder line, Espada's to word)
  on('duel.slip', (e) => { if (e.by !== 'courier') return; L.inc('duel.slip'); log.say('battle', 'You pull away from the aberrant.', { key: 'duel.slip', throttle: 2 }); });
  on('duel.open', () => { L.inc('duel.open'); log.say('battle', 'An aberrant Figment seizes your mind. The duel begins.'); });
  on('duel.break', (e) => { if (e.by !== 'courier') return; L.inc('duel.break'); log.say('battle', 'You break the Figment.', { key: 'duel.break', throttle: 1 }); });
  on('duel.undo', (e) => { if (e.by !== 'courier') return; L.inc('duel.undo'); log.say('battle', 'You take back your last move.', { key: 'duel.undo', throttle: 1 }); }); // (a placeholder line, Espada's to word)
  // duel.flee { roll, reroll, need, ok, by }: the saving throw out (progress/duel/flee.js; the plan's lines, section 15); `reroll` the first roll
  // when Luck threw it again (game.rerolls spends one: progress/dice.js), said before the result (a placeholder line, Espada's to word)
  on('duel.flee', (e) => {
    if (e.by !== 'courier') return; L.inc(e.ok ? 'duel.flee.ok' : 'duel.flee.fail');
    if (e.reroll) log.say('battle', 'Your luck turns: the d20 is thrown again.');
    if (!e.ok) log.say('battle', 'You fail to flee.', { key: 'duel.flee', throttle: 1 }); else if (e.roll === 20) log.say('battle', 'You flee at once.');
  });
  on('duel.end', (e) => {
    if (e.how === 'fled') { L.inc('duel.fled'); if (!e.atOnce) log.say('battle', 'You flee the duel.'); return; } // (a natural 20 said it already: "You flee at once.")
    L.inc(e.won ? 'duel.won' : 'duel.lost');
    if (e.won) log.say('battle', e.how === 'finisher' ? 'You drain the Figment.' : 'You win the duel. The Figment is mended.');
    else log.say('battle', e.how === 'yield' ? 'You yield the duel.' : 'You lose the duel. The Figment pushes your mind out.');
  });
}
