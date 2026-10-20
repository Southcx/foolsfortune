// ---------------------------------------------------------------------------------------
// THE SHOWCASE CROSSING: one fixed crossing that shows what is new on the rail in a single run, for the owner's test sessions (the owner,
// 2026-10-20, through Calissa: "I'm only one guy with limited cognitive bandwidth"). DEBUG save only: begun from the pier's SHOWCASE row
// (world/emocean/pier.js) and sailed by the stage as a passage with no sea chart (world/emocean/stage.js `sailShowcase`). Each row is
// one leg, sailed in order: its leg type (legs.js LEGS), the hull it is sailed in (ships.js; swapped in the turn before it), its
// feeling (a waypoint's, or none), and a note for its QAIS test (what to watch). Nothing is drawn: no encounter, no storm, no campfire;
// the pool is held full, the ship mended when it can bear no more, and nothing is counted.
// The rows are Dovina's (the roster and its order); Petra seeded them with the legs there were, as placeholders, until hers land.
// Calissa's list of what must be seen is what they show.
//
// Prior art: a fighting game's training mode and a shmup's stage select (the content laid out to be looked at, nothing at stake), Star
// Fox 64's training course.
//
//   SHOWCASE = [{ leg, hull, feel?, note }]   showcasePassage(rows?) -> a passage the trip runtime sails (world/emocean/triprun.js)
// ---------------------------------------------------------------------------------------
import { LEGS } from './legs.js';
import { SHIPS } from './ships.js';

/** The showcase's legs in order (placeholders: today's leg types, one a hull, so every hull is seen at sea). */
export const SHOWCASE = [
  { leg: 'shoal', hull: 'sloop', note: 'the chase, overhead and free views: a carrier brings each pattern, the cursor aims in each' },
  { leg: 'wreckers', hull: 'frigate', note: 'the side view (the cursor on its plane) and astern: the brig alongside, then behind' },
  { leg: 'graveyard', hull: 'destroyer', note: 'both forms at once: Q to change form, E to roll through plain shots' },
  { leg: 'maelstrom', hull: 'galleon', note: 'Charybdis in the whirlpool, seen abeam' },
  { leg: 'calm', hull: 'tanker', note: 'a breather: lights to lock, shots of your own form to absorb' },
];

/** The rows as a passage (the trip runtime's waypoints, with no sea chart): a row whose leg or hull is unknown is left out. */
export function showcasePassage(rows = SHOWCASE) {
  const waypoints = rows.filter((r) => LEGS[r.leg] && SHIPS[r.hull])
    .map((r, i) => ({ id: `showcase.${i}`, type: r.leg, strength: 1, feel: r.feel ?? null, storm: false, hull: r.hull, note: r.note || '' }));
  return { showcase: true, ids: waypoints.map((w) => w.id), legs: waypoints.map((w) => w.type), waypoints, chart: null, route: 'showcase', read: 0, pieces: null };
}
