// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S ACHIEVEMENTS (docs/plans/STRAWMANS-WELL.md 5; progress/strawmanwell.js): predicates over the ledger
// tracking/strawmanwell.js keeps, in THE HAND's "Strawman's Well" sub. Names placeholders, Espada's to word.
//
// Prior art: Super Meat Boy's chapter clears and its A+ grades, Subspace Emissary's trophy gallery, Smash's KO counts, I Wanna Be the
// Guy's death counter as a badge of honour.
//
//   strawmanWellAchievements({ C, H, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { STAGES, VERB } from './strawmanwell.js';
import { PROFILE_IDS } from './movementprofiles.js';

export function strawmanWellAchievements({ C, H, F }) {
  const built = STAGES.filter((s) => s.wave === 1);
  C('sw1', 'hand', "Strawman's Well", 1, 'count', 'Curtain Up', "Clear a stage of Strawman's Well.", 'well.stage.clear', 1);
  F('sw2', 'hand', "Strawman's Well", 2, 'collect', 'Opening Night', 'Clear every stage of the first wave.', (L) => built.filter((s) => L.get(`well.stage.clear.${s.id}`) >= 1).length, built.length);
  F('sw3', 'hand', "Strawman's Well", 4, 'perfect', 'Standing Ovation', 'Rank S or better on every stage of the first wave.', (L) => built.filter((s) => (L.best(`well.stage.stars.${s.id}`) || 0) >= 3).length, built.length);
  C('sw4', 'hand', "Strawman's Well", 1, 'mechanic', 'Out of Bounds', 'Knock a dummy past the blast line.', 'well.dummy.ko', 1);
  C('sw5', 'hand', "Strawman's Well", 3, 'endure', 'Home-Run Contest', 'Knock 100 dummies past the blast line.', 'well.dummy.ko', 100);
  C('sw6', 'hand', "Strawman's Well", 2, 'mechanic', 'Trophy Stand', 'Take a dummy past 100% as a trophy.', 'well.dummy.trophy', 1);
  C('sw7', 'hand', "Strawman's Well", 2, 'endure', 'Rehearsal', 'Fall in the Pit 100 times. It happens.', 'well.pit.death', 100);
  F('sw8', 'hand', "Strawman's Well", 3, 'collect', 'The Whole Repertoire', 'Use every verb of the first wave at least once.', (L) => built.flatMap((s) => s.verbs).filter((v) => L.get(`well.verb.${v}`) >= 1).length, built.flatMap((s) => s.verbs).length);
  F('sw9', 'hand', "Strawman's Well", 5, 'collect', 'Every Trick in the Book', 'Use every verb in Strawman\'s Well.', (L) => Object.keys(VERB).filter((v) => L.get(`well.verb.${v}`) >= 1).length, Object.keys(VERB).length);
  H('sw10', 'hand', "Strawman's Well", 3, 'mechanic', 'Flood Gate', 'Fill a basin with 500 cells of Lachryma in one pour.', 'well.flood.best', 500);
  // the Arena (FIGHTER.md) and the builds (progress/movementprofiles.js)
  C('sw11', 'hand', "Strawman's Well", 2, 'mechanic', 'Main Event', 'Take every stock in the Arena.', 'well.stage.clear.arena', 1);
  C('sw12', 'hand', "Strawman's Well", 3, 'endure', 'Fifty KOs', 'KO 50 straw fighters in the Arena.', 'well.fighter.ko', 50);
  F('sw13', 'hand', "Strawman's Well", 2, 'collect', 'Wardrobe', 'Try every movement build at the rack in the wings.', (L) => PROFILE_IDS().filter((id) => id !== 'original' && L.get(`profile.wear.${id}`) >= 1).length, PROFILE_IDS().length - 1);
  F('sw14', 'hand', "Strawman's Well", 4, 'collect', 'Tournament Ready', 'Use every fighter verb in the Arena at least once.', (L) => (STAGES.find((s) => s.id === 'arena')?.verbs || []).filter((v) => L.get(`well.verb.${v}`) >= 1).length, STAGES.find((s) => s.id === 'arena')?.verbs.length || 1);
}
