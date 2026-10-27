// ---------------------------------------------------------------------------------------
// THE FORGE: A BEAST'S PART (docs/plans/OPEN-SEA.md 14.10; South, 2026-10-27: "the ship combat feels shallow", "determine what else we can
// fold in"): each beast that fights the ship gives one ship's part of its own, forged at a quay once you have sunk enough of it, for cubes.
// The hunt feeds the ship that hunts (Monster Hunter's loop: hunt, carve, forge, hunt the harder one), and each part carries its beast's
// myth as a trade (never an upgrade: salvage.js's rule): the serpent's keel turns as it does, the akhlut's hull runs as it runs, the
// umibozu's hull holds the sea it pours, the kraken's sail draws in the dead calm it rises from, the world serpent's points almost into
// the wind and starves in light airs.
//
// CARVES (skill skips grind; grind closes the gap): a beast sunk is one carve, sunk with the hull whole two (Monster Hunter's carves and
// its "capture" reward: the clean hunt pays more and still the plain one counts). Read straight from the ledger (`seabeast.down.<id>`,
// `seabeast.down.whole.<id>`; the serpent's own `seaserpent.down`, `.whole`), so nothing is kept but what was sunk. The forge's price is
// a drain of cubes in minutes of play at the aim: about three beasts' pay for a class 2 part, so a part is a session's aim, not a gift.
//
// Prior art: Monster Hunter's forge (a monster's parts made into gear that fights its kin), Sea of Thieves' Megalodon and Kraken trophies,
// Wind Waker's sail upgrades, Assassin's Creed IV's ship upgrades from the legendary ships (taken, then fitted at a dock).
//
//   FORGE[partId] = { beast, carves, minutes }   carvesOf(L, beast) -> n   forgeable(L, partId) -> { ok, have, need, cubes }
//   forgePrice(partId) -> cubes   FORGE_PARTS (the ids)   (the rows themselves are SHIP_PARTS's, salvage.js, `from: 'forge'`)
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

/** Each forged part: the beast it comes from (SEA_BEASTS id), the carves it asks, its price in minutes of play at the aim. Class 2 at
 *  3 carves and 15 minutes (a kill pays 4.5 to 7.5: three kills about the price), the kraken at 30, the legend's once a game day at 1. */
export const FORGE = {
  serpentKeel: { beast: 'seaSerpent', carves: 3, minutes: 15 },
  akhlutHull:  { beast: 'wolfWhale', carves: 3, minutes: 15 },
  monkHull:    { beast: 'seaMonk', carves: 3, minutes: 15 },
  krakenSail:  { beast: 'bigSquid', carves: 3, minutes: 30 },
  worldSail:   { beast: 'worldSerpent', carves: 1, minutes: 60 },
};
export const FORGE_PARTS = Object.keys(FORGE);

/** A beast's carves: sunk once each, twice when sunk with the hull whole. */
export function carvesOf(L, beast) {
  const key = beast === 'seaSerpent' ? 'seaserpent.down' : `seabeast.down.${beast}`;
  return (L?.get?.(key) || 0) + (L?.get?.(beast === 'seaSerpent' ? 'seaserpent.down.whole' : `seabeast.down.whole.${beast}`) || 0);
}

export const forgePrice = (id) => Math.round((FORGE[id]?.minutes ?? 0) * ECON.perMinute);

/** Whether a part can be forged now by the ledger (the cubes and the quay are the room's to ask). */
export function forgeable(L, id) {
  const F = FORGE[id]; if (!F) return { ok: false, have: 0, need: 0, cubes: 0 };
  const have = carvesOf(L, F.beast); return { ok: have >= F.carves, have, need: F.carves, cubes: forgePrice(id) };
}
