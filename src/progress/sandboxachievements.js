// ---------------------------------------------------------------------------------------
// THE SANDBOX'S AND THE THROWN HIT'S ACHIEVEMENTS (docs/plans/SANDBOX.md; progress/sandbox.js): predicates over the ledger
// tracking/sandbox.js keeps. The thrown hit's in THE HAND's "Physics" sub (the world as a weapon, anywhere), the pitch's beside them.
// Names placeholders, Espada's to word.
//
// Prior art: Dawn of Mana's medals for Panic, Half-Life 2's "Zombie Chopper" (a prop's kill), keepy-uppy's count, Mario Strikers' long shot.
//
//   sandboxAchievements({ C, H })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------

export function sandboxAchievements({ C, H }) {
  C('ph1', 'hand', 'Physics', 1, 'count', 'Everything Is a Weapon', 'Strike a creature with a thrown or kicked thing.', 'impact.hit', 1);
  C('ph2', 'hand', 'Physics', 2, 'endure', 'Flying Furniture', 'Strike creatures with thrown things 50 times.', 'impact.hit', 50);
  H('ph3', 'hand', 'Physics', 3, 'mechanic', 'Strike!', 'Strike three creatures with one throw.', 'impact.strike.best', 3);
  H('ph4', 'hand', 'Physics', 3, 'mechanic', 'Freight', 'Strike a creature with a thrown thing carrying 600 joules.', 'impact.energy.best', 600);
  C('pb1', 'hand', 'Physics', 1, 'count', 'Back of the Net', 'Score a goal on the Sandbox\'s pitch.', 'sandbox.goal', 1);
  H('pb2', 'hand', 'Physics', 2, 'mechanic', 'Keepy-Uppy', 'Kick the ball 10 times without a bounce.', 'sandbox.juggle.best', 10);
  H('pb3', 'hand', 'Physics', 3, 'mechanic', 'From Distance', 'Score from 20 metres out.', 'sandbox.goal.far', 20);
}
