// ---------------------------------------------------------------------------------------
// THE MIMICRY PUZZLES' ACHIEVEMENTS (docs/plans/MIMICRY.md; progress/mimicry.js): predicates over the ledger tracking/mimicry.js keeps,
// the HAND category's "Mimicry" sub: the first copy, a stone's rungs, the whole ladder, every rung perfect, the steps read unshown, the
// game day's puzzle kept up. Names placeholders, Espada's to word.
//
// Prior art: Islands of Insight's enclave completions (one an area, then all), Puzzle Pirates' ratings ladder (Incredible on every duty).
//
//   mimicryAchievements({ C, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { MIMIC_LADDER, MIMIC_SITES } from './mimicry.js';

const solved = (L, id) => (L.get(`god.mimic.solved.${id}`) || 0) > 0;
const stars = (L, id) => L.best?.(`god.mimic.stars.${id}`) || 0;

export function mimicryAchievements({ C, F }) {
  C('mi1', 'hand', 'Mimicry', 1, 'count', 'Monkey See', 'Copy a mimicry puzzle.', 'god.mimic.solved', 1);
  C('mi2', 'hand', 'Mimicry', 2, 'mechanic', 'Monkey Do', 'Copy a mimicry puzzle with three stars.', 'god.mimic.perfect', 1);
  for (const S of MIMIC_SITES) F(`mi_${S.id}`, 'hand', 'Mimicry', 2, 'collect', `The ${S.id[0].toUpperCase()}${S.id.slice(1)} Stone`, `Copy every puzzle at the puzzle stone in the ${S.id === 'flats' ? 'Gnomon flats' : S.id === 'ridges' ? 'crystal ridges' : S.id}.`, (L) => S.rungs.filter((id) => solved(L, id)).length, S.rungs.length);
  F('mi3', 'hand', 'Mimicry', 4, 'collect', 'The Whole Ladder', 'Copy every mimicry puzzle.', (L) => MIMIC_LADDER.filter((id) => solved(L, id)).length, MIMIC_LADDER.length, { title: 'Mimic' });
  F('mi4', 'hand', 'Mimicry', 5, 'perfect', 'Not a Grain Out of Place', 'Copy every mimicry puzzle with three stars.', (L) => MIMIC_LADDER.filter((id) => stars(L, id) >= 3).length, MIMIC_LADDER.length);
  F('mi5', 'hand', 'Mimicry', 3, 'mechanic', 'Read the Ground', 'Copy a puzzle whose steps were never shown, with three stars.', (L) => ['order', 'moat', 'unmade'].filter((id) => stars(L, id) >= 3).length, 1);
  C('mi6', 'hand', 'Mimicry', 2, 'endure', "The Game Day's Puzzle", "Copy the game day's puzzle on 7 game days.", 'god.mimic.day', 7);
}
