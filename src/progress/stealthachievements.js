// ---------------------------------------------------------------------------------------
// STEALTH'S ACHIEVEMENTS (docs/plans/STEALTH.md 6; progress/stealth.js): predicates over the ledger tracking/stealth.js keeps, in the
// Veritome's "Fieldcraft" sub: the safari's first prize is a Figment that never knew you were there. Words Espada's (2026-11-01).
//
// Prior art: New Pokemon Snap's behaviour stars (the rare is what an unaware subject does), Metal Gear Solid's no-alert ranks, wildlife
// photography's own measure (the candid frame, the close approach that never flushed its subject).
//
//   stealthAchievements({ C, H, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { BEHAVIOURS } from './safari.js';
const FIGMENTS = ['slipjelly', 'wisp']; // (the Veritome's subject kinds: tools/veritome/subjects.js; the Lantern Wisp's subject is asked of Petra, STEALTH.md 7)

export function stealthAchievements({ C, H, F }) {
  C('fc1', 'veritome', 'Fieldcraft', 1, 'count', 'Candid', 'Photograph a Figment without it ever noticing you.', 'photo.candid', 1);
  C('fc2', 'veritome', 'Fieldcraft', 3, 'endure', 'Fly on the Wall', 'Take 50 candid photographs.', 'photo.candid', 50);
  F('fc3', 'veritome', 'Fieldcraft', 2, 'collect', 'Field Notes', 'Get a candid photograph of every kind of Figment in the Dunes.', (L) => FIGMENTS.filter((k) => L.get(`photo.candid.${k}`) >= 1).length, FIGMENTS.length);
  H('fc4', 'veritome', 'Fieldcraft', 3, 'mechanic', 'Close Encounter', 'Get a candid photograph from 3 m away or closer.', 'photo.candid.near', 1);
  C('fc5', 'veritome', 'Fieldcraft', 2, 'mechanic', 'Night Watch', 'Get a candid photograph at night.', 'photo.candid.night', 1);
  // the safari (STEALTH.md 8; progress/safari.js, counted by tracking/safari.js): behaviours, research, lures, the darkroom. Words placeholders (Espada's).
  const held = (L, k) => BEHAVIOURS[k].filter((b) => L.get(`safari.beh.${k}.${b.id}`) > 0).length;
  C('fc6', 'veritome', 'Fieldcraft', 1, 'count', 'Behaviour Noted', 'Catch a Figment doing something on a plate.', 'safari.plate', 1);
  F('fc7', 'veritome', 'Fieldcraft', 2, 'collect', 'Full Notes', 'Catch all four behaviours of one kind of Figment.', (L) => Math.max(...FIGMENTS.map((k) => held(L, k))), 4);
  F('fc8', 'veritome', 'Fieldcraft', 4, 'collect', 'Naturalist', 'Catch every behaviour of every kind of Figment in the Dunes.', (L) => FIGMENTS.reduce((s, k) => s + held(L, k), 0), FIGMENTS.length * 4, { title: 'Naturalist' });
  C('fc9', 'veritome', 'Fieldcraft', 2, 'mechanic', 'Bait and Wait', 'Photograph a Figment drawn out by a Lachryma lure.', 'safari.lured', 1);
  H('fc10', 'veritome', 'Fieldcraft', 2, 'count', 'Field Station', 'Reach research level 2 in a Dunes area.', 'safari.research.best', 2);
  H('fc11', 'veritome', 'Fieldcraft', 4, 'endure', 'Complete Survey', 'Reach research level 4 in a Dunes area.', 'safari.research.best', 4);
  H('fc12', 'veritome', 'Fieldcraft', 3, 'mechanic', 'Gentle Company', 'Let a kind of Figment grow used to you by half.', 'safari.habit.best', 50);
  C('fc13', 'veritome', 'Fieldcraft', 1, 'count', 'Darkroom', "Have the darkroom judge the day's best plate of a Figment.", 'safari.judged', 1);
  H('fc14', 'veritome', 'Fieldcraft', 3, 'mechanic', 'Four Stars', 'Catch the rarest behaviour of a Figment: one it shows only when it never knew you were there.', 'safari.stars.best', 4);
}
