// ---------------------------------------------------------------------------------------
// SPIRIT COOKING'S AND THE DROPS' ACHIEVEMENTS (docs/plans/SPIRIT-COOKING.md; progress/creaturedrops.js): predicates over the ledger
// tracking/cooking.js keeps. In the Spirit Garden's new "The Hearth" sub and Battle's "Slip Jellies" (a drop is a fight's). Words placeholders
// for Espada's.
//
// Prior art: Breath of the Wild's recipe book (one of each found), Cooking Mama's gold medals (a perfect dish), Old School RuneScape's
// collection log (a drop's first time counted).
//
//   cookingAchievements({ C, H, F })   (moduleachievements.js calls it)
// ---------------------------------------------------------------------------------------
import { ADDIN_OF } from './cooking/flavour.js';

const LOAVES = ['plain', ...Object.values(ADDIN_OF)];

export function cookingAchievements({ C, H, F }) {
  C('ck1', 'garden', 'The Hearth', 1, 'count', 'Bread and Water', 'Bake a loaf at the hearth.', 'cook.serve', 1);
  H('ck2', 'garden', 'The Hearth', 2, 'mechanic', 'Perfect Crumb', 'Bake a loaf to PERFECT or better.', 'cook.grade', 4);
  C('ck3', 'garden', 'The Hearth', 4, 'mechanic', 'A True Loaf', 'Bake a TRUE loaf: every move at its heart.', 'cook.true', 1);
  F('ck4', 'garden', 'The Hearth', 3, 'collect', 'Seven Loaves', 'Bake a loaf of every feeling, and a plain one.', (L) => LOAVES.filter((k) => L.get(`cook.dish.bread.${k}`) >= 1).length, LOAVES.length);
  C('ck5', 'garden', 'The Hearth', 3, 'endure', 'Daily Bread', 'Serve 50 dishes.', 'cook.serve', 50);
  C('loot1', 'battle', 'Slip Jellies', 1, 'count', 'Spoils', 'Pick up 25 things a creature dropped.', 'drop.take', 25);
  C('loot2', 'battle', 'Slip Jellies', 3, 'mechanic', 'Lucky Find', 'Pick up a rare drop.', 'drop.rare', 1);
}
