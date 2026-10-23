// ---------------------------------------------------------------------------------------
// TRACKING, THE PALM DIE (docs/plans/DICE.md 4; progress/dice.js): the ledger keeps the cubes the palm die condensed from overflow and the
// biggest it has grown (the achievements pd1 to pd3 are predicates over them); the log says a growth, never a condensing (the cube
// plate's rolling count is that avenue, and a line a drink would spam it).
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
}
