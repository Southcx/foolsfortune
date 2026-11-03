// ---------------------------------------------------------------------------------------
// SALVAGE'S NUMBERS (docs/plans/OPEN-SEA.md 14.4): what a wreck's crates are worth, kept apart from salvage.js so fragments.js can read
// them (salvage.js reads fragments.js) without a cycle. One job: the table.
// Prior art: Sea of Thieves' wrecks (richer ones, richer crates); see salvage.js.
//   SALVAGE = { crates, daily, cubes, part, reach, haul }
// ---------------------------------------------------------------------------------------

/** crates: a wreck's on its first salvage, by tier; daily: more a game day after; cubes: a cube crate's worth (minutes of play at the aim,
 *  by tier); part: a crate's chance of a ship's part, by tier; reach: m alongside; haul: real s a crate takes to come up. */
export const SALVAGE = {
  crates: { common: 2, uncommon: 3, rare: 4, legend: 6 }, daily: 1,
  cubes: { common: 1, uncommon: 1.5, rare: 2.5, legend: 4 },
  part: { common: 0.04, uncommon: 0.08, rare: 0.15, legend: 0.35 },
  reach: 30, haul: 2,
};
