// ---------------------------------------------------------------------------------------
// ISLETS (docs/plans/OPEN-SEA.md section 6; the owner, 2026-10-20: "Islets of Ego", and landing in the first pass): a small island the
// ship can moor beside and the Courier can walk, an identity that never grew big enough to be an Island of Ego. Each is built from a
// KIT (a rock, an atoll, a sea stack, a ruin, a dead lighthouse, a sandbar that comes and goes with the hour), tens of metres across,
// and holds ONE SECRET, Wind Waker's way: a chest, an ostracon, a vantage point, a Figment nest, a fuel cache, a stele, a fishing spot, a
// crystal. Landing is mooring (the ship holds at its anchor), sealing out of the helm's cradle (HANKO.md) and stepping off; the islet
// is a small room of its own (a zone), streamed in as the ship nears. An islet is also a discovery (discoveries.js) by its tier.
//
// Prior art: The Legend of Zelda: The Wind Waker's small islands (one square, one islet, one secret: a cave, a chest, a submarine);
// Skies of Arcadia's small landings; Sea of Thieves' outposts and sandbars (small, quick, worth the stop).
//
//   ISLET_KITS[kit] = { across: [lo, hi] m, secrets: [kind], weight }   SECRETS[kind] = { pays?, also? }
//   isletOf(feature, seed) -> { kit, across, secret, tier }   (the same islet every time: it is the sea's, not the day's)
// ---------------------------------------------------------------------------------------
import { seeded } from '../../core/rng.js';

/** The islets' kits: what they look like (Calissa's to dress), how big, which secrets suit them. */
export const ISLET_KITS = {
  rock:       { across: [15, 30], secrets: ['chest', 'fishing', 'ostracon'], weight: 3 },
  atoll:      { across: [40, 70], secrets: ['fishing', 'nest', 'fuel', 'chest'], weight: 2 },
  stack:      { across: [10, 20], secrets: ['vantage', 'crystal', 'stele'], weight: 2 },
  ruin:       { across: [25, 50], secrets: ['stele', 'ostracon', 'nest', 'chest'], weight: 2 },
  lighthouse: { across: [20, 35], secrets: ['vantage', 'fuel', 'chest'], weight: 1 },
  sandbar:    { across: [30, 60], secrets: ['chest', 'crystal'], weight: 1, tide: 'low' },   // (there only at low water: dawn and dusk)
};

/** The secrets, and what each gives (the systems that pay them already exist: the reason is in their own module). */
export const SECRETS = {
  chest:    { pays: 'chest' },              // (a chest of the square's tier: world/treasure/; the Tithe's odds)
  ostracon: { pays: 'ostracon' },           // (a neuralese word glossed: progress/ostraca.js)
  vantage:  { pays: 'vantage' },            // (a view: Wonder's awakening counts it, world/vantages.js)
  nest:     { pays: 'fight' },              // (a few Figments of the square's class on foot: the islet's fight)
  fuel:     { pays: 'fuel', measures: 3 },  // (a cache of fuel: three measures, once a game day)
  stele:    { pays: 'stele' },              // (three neuralese words in a sentence: progress/ostraca.js)
  fishing:  { pays: 'fishing' },            // (a fishing spot of the open sea's fish: the rod, tools/sondelass/angling/)
  crystal:  { pays: 'crystal' },            // (a Lachryma crystal to tune and strike: world/dunes/crystals.js)
};

/** The islet a feature is, built the same from its id and the sea's seed. */
export function isletOf(feature, seed = 1) {
  let h = 2166136261; for (const c of feature.id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const r = seeded((h ^ seed) >>> 0), kits = Object.entries(ISLET_KITS);
  let x = r() * kits.reduce((n, [, k]) => n + k.weight, 0), kit = kits[0][0];
  for (const [id, k] of kits) { if ((x -= k.weight) < 0) { kit = id; break; } }
  const K = ISLET_KITS[kit];
  return { kit, across: Math.round(r.range(K.across[0], K.across[1])), secret: r.pick(K.secrets), tier: feature.tier, ...(K.tide ? { tide: K.tide } : {}) };
}
