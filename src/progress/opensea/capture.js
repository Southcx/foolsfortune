// ---------------------------------------------------------------------------------------
// CAPTURE OR SLAY (docs/plans/OPEN-SEA.md 15.6, built; GAPS.md G159; South, 2026-11-03: "build any outstanding unbuilt features"): a
// beast of the hunters' class that is worn down, stunned and tethered by the harpoon need not be sunk. It can be TOWED home, to a quay,
// and there either handed over alive for a LIVE FEE, or kept as a STATUE in the Spirit Garden (a keepsake piece, once a beast). The hunt
// then has two ends, as Monster Hunter's does (slay and carve, or capture and take the capture's rewards): the slain beast pays by the hull
// kept and gives its carves; the captured pays more and counts the whole hunt's carves, and costs a tow home that a hull hit breaks.
//   Skill skips grind: capturing is the harder way (worn to under a third, stunned to the second depth, then a slow tow that one hit to the
//   hull undoes) and pays for it. Grind closes the gap: slaying still pays and still carves.
//
// WHAT IT PAYS (every price answers to the aim, ECON.perMinute; the reasons):
//   live fee   `live` x the beast's give.minutes at the aim, hull-free (the tow does not care how whole the hull was when it began): 1.6 x
//              5 minutes = 8 minutes of play (64 cubes) for a class 2 hunter, against a kill's 3.75 to 6.25 minutes (30 to 50 cubes) by the
//              hull. The extra is the tow: at 0.7 of the way a four-square tow is nearly 2 more minutes of sailing with the hull to guard.
//   statue     no cubes, one piece of the Spirit Garden's keepsakes a beast, never sold (decor.js, from 'capture'); a second of the same
//              beast hands over for the fee instead.
//   carves     a capture counts `carves` toward the forge (forge.js carvesOf): the same as a clean kill, not more.
// A lair gives one beast a game day (seabeasts.js lairsOf), captured or sunk: the faucet is the kills' faucet, no wider.
//
// Prior art: Monster Hunter's capture (trap, tranquilise, a capture quest's different rewards), Sea of Thieves' towed ships, Pokemon
// Snap's research kept as a record, Spiritfarer's statue keepsakes (decor.js's farewell).
//
//   CAPTURE   capturable(id) -> bool   towOk({ id, hp, depth, tethered }) -> { ok, why }   livePay(id) -> cubes   statueOf(id) -> decor id
//   towMods() -> { speed, turn } (the helm's mods while a tow is on)   towLeft(secs) -> bool
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';
import { SEA_BEASTS } from './seabeasts.js';

/** beasts: the hunters that can be taken alive (the kraken is arms about a ship and Jormungandr a legend: slain only); hp: the beast's hit
 *  points left as a share at most; depth: the stun depth at least (2 stunned, creatures/stun.js); live: the live fee's multiple of its
 *  give.minutes; carves: what a capture counts toward the forge; tow: speed and turn kept, real seconds before the tether parts. */
export const CAPTURE = {
  beasts: { seaSerpent: 'statueSeaSerpent', wolfWhale: 'statueWolfWhale', seaMonk: 'statueSeaMonk' },
  hp: 0.3, depth: 2, live: 1.6, carves: 2, tow: { speed: 0.7, turn: 0.85, secs: 240 },
};

export const capturable = (id) => !!CAPTURE.beasts[id];
export const statueOf = (id) => CAPTURE.beasts[id] || null;

/** Whether a beast may be taken in tow: capturable, worn down, stunned deep enough, tethered by the harpoon. */
export function towOk({ id, hp = 1, depth = 0, tethered = false } = {}) {
  if (!capturable(id)) return { ok: false, why: 'kind' };
  if (!tethered) return { ok: false, why: 'tether' };
  if (hp > CAPTURE.hp) return { ok: false, why: 'hp' };
  if (depth < CAPTURE.depth) return { ok: false, why: 'stun' };
  return { ok: true, why: null };
}

/** The live fee for a beast handed over alive at a quay. */
export const livePay = (id) => Math.round((SEA_BEASTS[id]?.give?.minutes ?? 0) * ECON.perMinute * CAPTURE.live);

/** The helm's mods while a beast is in tow (helm.mods: { speed, turn }). */
export const towMods = () => ({ speed: CAPTURE.tow.speed, turn: CAPTURE.tow.turn });
/** Whether a tow of `secs` real seconds still holds. */
export const towLeft = (secs) => secs < CAPTURE.tow.secs;
