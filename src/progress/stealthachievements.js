// ---------------------------------------------------------------------------------------
// STEALTH'S ACHIEVEMENTS (docs/plans/STEALTH.md 6; progress/stealth.js): predicates over the ledger tracking/stealth.js keeps, in the
// Veritome's "Fieldcraft" sub: the safari's first prize is a Figment that never knew you were there. Words Espada's (2026-11-01).
//
// Prior art: New Pokemon Snap's behaviour stars (the rare is what an unaware subject does), Metal Gear Solid's no-alert ranks, wildlife
// photography's own measure (the candid frame, the close approach that never flushed its subject).
//
//   stealthAchievements({ C, H, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
const FIGMENTS = ['slipjelly', 'wisp']; // (the Veritome's subject kinds: tools/veritome/subjects.js; the Lantern Wisp's subject is asked of Petra, STEALTH.md 7)

export function stealthAchievements({ C, H, F }) {
  C('fc1', 'veritome', 'Fieldcraft', 1, 'count', 'Candid', 'Photograph a Figment without it ever noticing you.', 'photo.candid', 1);
  C('fc2', 'veritome', 'Fieldcraft', 3, 'endure', 'Fly on the Wall', 'Take 50 candid photographs.', 'photo.candid', 50);
  F('fc3', 'veritome', 'Fieldcraft', 2, 'collect', 'Field Notes', 'Get a candid photograph of every kind of Figment in the Dunes.', (L) => FIGMENTS.filter((k) => L.get(`photo.candid.${k}`) >= 1).length, FIGMENTS.length);
  H('fc4', 'veritome', 'Fieldcraft', 3, 'mechanic', 'Close Encounter', 'Get a candid photograph from 3 m away or closer.', 'photo.candid.near', 1);
  C('fc5', 'veritome', 'Fieldcraft', 2, 'mechanic', 'Night Watch', 'Get a candid photograph at night.', 'photo.candid.night', 1);
}
