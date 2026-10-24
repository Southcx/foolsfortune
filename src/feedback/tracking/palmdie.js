// ---------------------------------------------------------------------------------------
// TRACKING, THE PALM DIE (docs/plans/DICE.md 4; progress/dice.js): the ledger keeps the cubes the palm die condensed from overflow and the
// biggest it has grown (the achievements pd1 to pd3 are predicates over them); the log says a growth, never a condensing (the cube
// plate's rolling count is that avenue, and a line a drink would spam it). A throw against the island's answer (`palm.roll`) is counted, and
// said only when it holds something off; a re-roll of your own (a puzzle duel's Flee) is said by the duel's line, and counted here.
//
// Prior art: the stones' own tracking (a trade said when worn, its effects read where they act).
//
//   palmDieRules({ on, L, log })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function palmDieRules({ on, L, log }) {
  on('palm.condense', (e) => { L.inc('palm.cubes', e.n); });
  on('palm.grow', (e) => {
    L.hi('palm.sides', e.to);
    log.say('gain', `Your palm die grows into a d${e.to}.`, { key: 'palm.grow' });
  });
  on('palm.roll', (e) => {
    L.inc('palm.roll'); if (e.held) L.inc('palm.held', e.held);
    if (e.held) log.say('god', `Your palm die shows ${e.face} against the island's ${e.against}: ${e.held > 1 ? 'two' : 'one'} of its answer held off.`, { key: 'palm.roll', throttle: 4 });
  });
  on('duel.flee', (e) => { if (e.reroll && e.by === 'courier') L.inc('luck.reroll'); });
}
