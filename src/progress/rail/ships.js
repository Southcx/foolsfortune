// ---------------------------------------------------------------------------------------
// THE SHIPS AT SEA: what each class of the Vessoul's sailing form is on the rail (docs/plans/PASSAGE.md section 11; the glossary's
// sloop, frigate, tanker, destroyer, galleon). The owner, 2026-10-08: "You could take a light and agile powerful sloop on dangerous
// passages requiring dexterity, or you could take a heavily loaded Tanker on an easier, pre-charted path." So a ship is a trade (Orta's
// forms; Star Fox's Arwing against the Landmaster; FTL's ships; Sunless Sea's ships; Elite's Sidewinder against the Type-9): the
// agile ones fight the wild sea for its rich waypoints and its rutters; the heavy ones haul a great hold along a passage someone has
// already charted. Hold and burn are the economy's (ECON.ships); everything the rail reads is here.
//
//   SHIPS[id] = { speed, box, hurtbox, bears, locks, dive, mounts, sails, danger }   canSail(ship, passage) -> { ok, why? }
//   speed: the ship's pace in its box (x the sloop's); box: how far it may stray (x); hurtbox: its size (x); bears: hits before the leg
//   is failed; locks: the lock-on's most; dive: whether it takes the Umbral form; mounts: tools it carries besides the gun;
//   sails: 'any' (any lane) or 'charted' (only a passage from a rutter of that route and game day); danger: added to every waypoint's
// ---------------------------------------------------------------------------------------
import { ECON } from '../econ/table.js';

export const SHIPS = {
  /** The errand runner: quick, a wide box, the whole verb set, a small hold. The scout of wild seas and the maker of rutters. */
  sloop:     { speed: 1.2, box: 1.0, hurtbox: 1.0, bears: 6,  locks: 8, dive: true,  mounts: 2, sails: 'any',     danger: 0 },
  /** The escort: a third mount, a little sturdier; for passages with a bounty or a convoy (later). */
  frigate:   { speed: 1.1, box: 1.0, hurtbox: 1.1, bears: 8,  locks: 8, dive: true,  mounts: 3, sails: 'any',     danger: 0 },
  /** The hunter: fastest and fragile, all lock-on; hunting Egregores (bounties pay it a fifth more: livelihoods.js, later). */
  destroyer: { speed: 1.3, box: 1.1, hurtbox: 0.9, bears: 5,  locks: 8, dive: true,  mounts: 2, sails: 'any',     danger: 0.5 },
  /** Treasure: refined cubes in a great hold; slow; it keeps to charted water. */
  galleon:   { speed: 0.8, box: 0.8, hurtbox: 1.5, bears: 12, locks: 4, dive: false, mounts: 1, sails: 'charted', danger: -1 },
  /** Crude: a huge, volatile hold, double-hulled; it cannot dive (it rides the surface: the Umbral's shots are the ones to dodge), it
   *  keeps to a charted passage, and the sea is a step gentler for it (the rutter shows every wave's lane) but the Wreckers like it. */
  tanker:    { speed: 0.7, box: 0.7, hurtbox: 1.6, bears: 14, locks: 4, dive: false, mounts: 1, sails: 'charted', danger: -1 },
};

/** Whether a ship may sail a passage: a charted-only ship needs a rutter of this route and game day (its passage then is the rutter's). */
export function canSail(ship, { route, day, rutter = null } = {}) {
  const S = SHIPS[ship];
  if (!S) return { ok: false, why: 'unknown' };
  if (S.sails === 'charted' && !(rutter && rutter.route === route && rutter.day === day)) return { ok: false, why: 'uncharted' };
  return { ok: true };
}

/** What a ship holds and burns (the economy's own numbers, read through so the rail needs one import). */
export const holdOf = (ship) => ECON.ships[ship]?.hold ?? 0;
