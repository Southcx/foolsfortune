// ---------------------------------------------------------------------------------------
// THE GARDEN'S GROWTH'S ACHIEVEMENTS (docs/plans/SEEDS-SLABS-SCANS.md 6; progress/seeds.js, slabs.js, scans.js): predicates over the
// ledger tracking/gardengrowth.js keeps, in THE SPIRIT GARDEN's "Seeds and Slabs" sub. gw1 .. gw3 are the first path's garden steps
// (progress/goals.js FIRST: enter, plant, carve the clay's starter slab, progress/gardenhowto.js GIFT). `seed.plant.ring` counts only the
// ring's seeds: a moonlet sets itself at an awakening. Names placeholders, Espada's to word.
//
// Prior art: Super Mario Galaxy's domes opened one by one, Spectrobes: Origins' first excavation, Skannerz' first scan.
//
//   gardenGrowthAchievements({ C, F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------

export function gardenGrowthAchievements({ C, F }) {
  C('gw1', 'garden', 'Seeds and Slabs', 1, 'count', 'Through the Arch', 'Enter your Spirit Garden.', 'garden.enter', 1);
  C('gw2', 'garden', 'Seeds and Slabs', 1, 'count', 'Seedling', "Let a planetoid's seed go in the ring.", 'seed.plant.ring', 1);
  C('gw3', 'garden', 'Seeds and Slabs', 1, 'count', 'Unearthed', 'Carve a spirit slab free at the bench.', 'slab.carve', 1);
  C('gw4', 'garden', 'Seeds and Slabs', 2, 'count', 'Set in Stone', 'Set a photo of a creature into a spirit slab at the plate shrine.', 'slab.make.plate', 1);
  C('gw5', 'garden', 'Seeds and Slabs', 2, 'count', 'Read the Code', 'Read a real barcode or QR code at the plate shrine.', 'scan.read', 1);
  C('gw6', 'garden', 'Seeds and Slabs', 3, 'mechanic', 'Not a Scratch', 'Carve a spirit slab flawless.', 'slab.flawless', 1);
  C('gw7', 'garden', 'Seeds and Slabs', 3, 'count', 'Full Grown', 'Feed a planetoid of the ring until it is large.', 'seed.grow.large', 1);
  F('gw8', 'garden', 'Seeds and Slabs', 4, 'collect', 'A Sky of Your Own', 'Let all six seeds of the ring go.', (L) => ['clay', 'crystal', 'coral', 'bowl', 'ring', 'bone'].filter((k) => L.get(`seed.plant.${k}`) >= 1).length, 6);
}
