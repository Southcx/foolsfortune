// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LAYOUT: where the room is and where each stage's lane lies (docs/plans/STRAWMANS-WELL.md 2 and 3; the stages and
// their par are Dovina's STAGES, progress/strawmanwell.js). Pure numbers, no three.js. The Well is indoors, far from everything else,
// its own render zone (`strawmanwell`, render/zonemap.js) and its own area (render/areas.js stage 2, as the Sandbox's). Every stage is
// a lane: a vertical plane at its own depth (`z`), run along +x from `AT.x`, its floor's top at `AT.y`; the lanes stand LANE m apart
// so the camera of one, SIDE_CAM.dist in front of it, never sees another (each has a back flat behind it).
//
// Prior art: the console's room table as data (render/zonemap.js); Super Mario Bros.' world map of short stages off one hub.
//
//   AT   LANE   ZONE (the zone's box)   WINGS (the hub's doors, x)   LANES[id] -> { id, k, z, len, band, start }   laneOf(id)   laneAt(z)   inWell(p)
// ---------------------------------------------------------------------------------------

/** The room's corner: the stages run east from here, their floors at this height, the wings at this depth. */
export const AT = { x: 3400, y: 200, z: -3000 };
/** Metres between lanes (south, -z, from the wings). */
export const LANE = 40;
/** The zone's box (render/zonemap.js reads these numbers). */
export const ZONE = { x0: AT.x - 50, x1: AT.x + 300, z0: AT.z - 7 * LANE - 30, z1: AT.z + 40, y0: AT.y - 50, y1: AT.y + 250 };

/** Each stage's lane: its order south of the wings, its length (m of run), the camera's height band over the floor (m) and where you
 *  start (m along the lane); its goal and checkpoints are its builder's (world/strawmanwell/stages*.js). The wings are the hub. */
const ROWS = [
  ['wings', 0, 40, [2.2, 5], 4],
  ['run', 1, 112, [2.2, 9], 2],
  ['climb', 2, 56, [2.2, 10], 2],
  ['stomp', 3, 44, [2.2, 6], 2],
  ['brawl', 4, 58, [3, 7], 18],
  ['machine', 5, 66, [2.2, 7], 2],
  ['flood', 6, 52, [1.5, 9], 2],
];
export const LANES = Object.fromEntries(ROWS.map(([id, k, len, band, start]) => [id, { id, k, z: AT.z - k * LANE, len, band, start }]));
export const laneOf = (id) => LANES[id] || null;

/** The wings' doors, one a stage in STAGES' order (m along the wings), the way out, and where Strawman stands (centre stage). */
export const WINGS = { doors: { run: 7, climb: 11.5, stomp: 16, brawl: 25, machine: 29.5, flood: 34 }, hub: 1.6, strawman: 20.5 };

/** Is a point in the Well (its zone's box)? */
export const inWell = (p) => p.x > ZONE.x0 && p.x < ZONE.x1 && p.z > ZONE.z0 && p.z < ZONE.z1 && p.y > ZONE.y0 && p.y < ZONE.y1;
/** The lane a depth is in (within half a lane of it), or null. */
export const laneAt = (z) => Object.values(LANES).find((L) => Math.abs(z - L.z) < LANE / 2) || null;
