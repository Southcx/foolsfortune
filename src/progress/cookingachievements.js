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

const HEARTH_FAMILIES = ['bread', 'rice', 'broth', 'tea', 'sear', 'sauce', 'emulsion', 'sweet', 'ferment', 'smoke'];
const LOAVES =['plain', ...Object.values(ADDIN_OF)];

export function cookingAchievements({ C, H, F }) {
  C('ck1', 'garden', 'The Hearth', 1, 'count', 'Bread and Water', 'Bake a loaf at the hearth.', 'cook.serve', 1);
  H('ck2', 'garden', 'The Hearth', 2, 'mechanic', 'Perfect Crumb', 'Bake a loaf to PERFECT or better.', 'cook.grade', 4);
  C('ck3', 'garden', 'The Hearth', 4, 'mechanic', 'A True Loaf', 'Bake a TRUE loaf: every move at its heart.', 'cook.true', 1);
  F('ck4', 'garden', 'The Hearth', 3, 'collect', 'Seven Loaves', 'Bake a loaf of every feeling, and a plain one.', (L) => LOAVES.filter((k) => L.get(`cook.dish.bread.${k}`) >= 1).length, LOAVES.length);
  C('ck5', 'garden', 'The Hearth', 3, 'endure', 'Daily Bread', 'Serve 50 dishes.', 'cook.serve', 50);
  F('ck9', 'garden', 'The Hearth', 3, 'collect', 'Every Pot', 'Serve a dish of each family the window cooks: bread, rice, broth, tea, sear, sauce, emulsion, sweet, ferment and smoke.', (L) => HEARTH_FAMILIES.filter((k) => L.get(`cook.family.${k}`) >= 1).length, HEARTH_FAMILIES.length); // (G222 to G225)
  C('ck10', 'garden', 'The Hearth', 1, 'mechanic', 'Taste and Learn', 'Taste a dish a folk or a spirit gives you and learn how it is made.', 'cook.taste.new', 1); // (G229)
  C('ck11', 'garden', 'The Hearth', 2, 'mechanic', 'Whole Again', 'Mend a cracked recipe slab by placing every missing line.', 'cook.slab.mend', 1); // (G229)
  C('ck6', 'garden', 'The Hearth', 1, 'mechanic', 'Al Dente', 'Boil pasta to the soul: a thin white thread left at its heart.', 'cook.hit.boil', 1);
  C('ck7', 'garden', 'The Hearth', 2, 'collect', 'Soul Seafood', 'Sear a fish you landed from the Lachryma.', 'cook.family.seafood', 1);
  H('ck8', 'garden', 'The Hearth', 2, 'mechanic', 'Ten at Once', 'Cook a batch of ten: a dish you have cooked TRUE three times.', 'cook.batch.size', 10); // (progress/cooking/batch.js BATCH)
  C('loot1', 'battle', 'Slip Jellies', 1, 'count', 'Spoils', 'Pick up 25 things a creature dropped.', 'drop.take', 25);
  C('loot2', 'battle', 'Slip Jellies', 3, 'mechanic', 'Lucky Find', 'Pick up a rare drop.', 'drop.rare', 1);
}
