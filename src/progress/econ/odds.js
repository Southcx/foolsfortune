// ---------------------------------------------------------------------------------------
// THE ODDS AS THEY ARE MET: the published weights of the Tithe's tiers are not the rates a player sees, because the pity counters
// (treasure.js TITHE.pity) and the epic pity's chance of a prismatic lift the upper tiers. `consolidated()` plays the Tithe's own
// `rollTier` a great many times, with its counters, on a fixed seed, so the Codex can show the true rates beside the weights and the
// number never wobbles between visits.
//
// Prior art: the "consolidated probability" Genshin Impact publishes beside its base rates (pity counted), and China's 2017 rule that
// a loot box's real odds be published.
//
//   consolidated(n = 200000) -> [p common, p fine, p rare, p epic, p prismatic]   (cached after the first call)
// ---------------------------------------------------------------------------------------
import { rollTier } from '../../world/treasure/treasure.js';

let cache = null;

/** A small seeded generator (mulberry32), so the answer is the same every time. */
function seeded(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** The rate of each tier over a long run of pulls, pity counted. */
export function consolidated(n = 200000) {
  if (cache) return cache;
  const rnd = seeded(0x7173), since = { rare: 0, epic: 0, prismatic: 0 }, count = [0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const t = rollTier(since, rnd());
    count[t]++;
    since.rare = t >= 2 ? 0 : since.rare + 1; since.epic = t >= 3 ? 0 : since.epic + 1; since.prismatic = t >= 4 ? 0 : since.prismatic + 1;
  }
  return (cache = count.map((c) => c / n));
}
