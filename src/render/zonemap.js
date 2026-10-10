// ---------------------------------------------------------------------------------------
// THE ZONE MAP: which zone a point is in, told by position alone, and the zone it is part of (render/zones.js is what draws by it).
// Pure numbers, no three.js, so a table or a Node script can ask where a place is (progress/weather.js's place by zone, the economy's
// scripts) without loading the renderer. zones.js adds what each zone can see and does the hiding.
//
// Prior art: the console's room table (a stage's areas as bounds in a list, looked up by the player's position: Ocarina of Time's
// scene/room split, Kingdom Hearts' worlds), kept as data apart from the code that loads or draws them.
//
//   zoneOf(pos) -> 'testroom' | 'workshop' | 'basement' | 'circuits' | 'beach' | 'dunes' | 'well' | 'emocean' | 'garden' | 'margarite' | null      wholeOf(pos) -> the zone, or its whole
//   ZONE_TESTS [{ id, test(pos), partOf? }]   inDunes(pos)   nearShore(pos)
// ---------------------------------------------------------------------------------------

// the dunes' box, and the shore's sector in it (world/dunes/beach.js SHORE: due east of the oasis, from 380 m out, the sector and its
// fade with a margin; kept as numbers here so the zones import nothing from the world)
export const inDunes = (p) => p.x > 1000 && p.x < 3000 && p.z > -1000 && p.z < 1000 && p.y < -150;
const SHORE_ZONE = { x: 2000, z: 0, r: 380, half: 0.3 };
const shoreSector = (p, r, half) => { const lx = p.x - SHORE_ZONE.x, lz = p.z - SHORE_ZONE.z; return lx > 0 && Math.hypot(lx, lz) > r && Math.abs(Math.atan2(lz, lx)) < half; };
const inShore = (p) => shoreSector(p, SHORE_ZONE.r, SHORE_ZONE.half);
/** From where in the dunes the shore is worth drawing (from the oasis the jetty is a speck: drawn once you are on the way). */
export const nearShore = (c) => inDunes(c) && shoreSector(c, 220, 0.7);

export const ZONE_TESTS = [
  // the Throwing Room (world/testroom/layout.js TR: x 10.5 to 30.5, z -5.5 to 10.5, 6 m high), through a door in the Workshop's east wall:
  // drawn only from where its doorway can be seen; part of the Workshop's ground (one roof, one set of lamps). Its bounds take in its
  // own walls (their boxes centred 25 cm outside the floor's edge, x 30.75 and z -5.75 / 10.75): at the floor's edge they fell to the
  // Workshop and vanished from inside whenever the door was out of view (the owner's R2, v131; casebook)
  // The combat wing (world/testroom/combatwing.js, TR.wing: z -36 to -5.5, 9 m high) is the room's too, through the arcade: its walls and roof
  // to 36.5 south and 9.5 up (docs/plans/COMBAT-LAB.md)
  { id: 'testroom', partOf: 'workshop', test: (p) => p.y > -1.2 && p.x > 10.5 && p.x < 31.2 && ((p.y < 7 && p.z > -6.2 && p.z < 11.2) || (p.y < 10.5 && p.z > -36.7 && p.z <= -5.5)) },
  { id: 'workshop', test: (p) => p.y > -1.2 && p.y < 60 && Math.abs(p.x) < 40 && Math.abs(p.z) < 40 },
  { id: 'basement', test: (p) => p.y <= -1.2 && p.y > -150 && p.x > -250 && p.x < 450 && p.z > -300 && p.z < 200 },
  { id: 'circuits', test: (p) => p.x > 2800 && p.x < 3300 && p.z > -300 && p.z <= 380 && p.y > -120 && p.y < 120 },
  // the shore (world/dunes/beach.js): the dunes' east rim, where the sand runs down to the Emocean; the dunes' own ground, a zone of its own
  { id: 'beach', partOf: 'dunes', test: (p) => inDunes(p) && inShore(p) },
  { id: 'dunes', test: inDunes },
  // a Well's floor (world/well/dunemaw.js): built far west and deep, one floor at a time
  { id: 'well', test: (p) => p.x > -1450 && p.x < -1150 && p.z > -150 && p.z < 150 && p.y > -1020 && p.y < -840 }, // (the floors at -900, the bowl at -1000)
  // a crossing of the Emocean (world/emocean/stage.js SEA_AT): the rail along +Z from z -2000, far west, at the dunes' layer; a long
  // passage (six waypoints, some 450 bars at 39 m a bar) runs 17.5 km, so the zone runs to 24 km (Calissa read the old 4.4 km's end)
  { id: 'emocean', test: (p) => p.x > -3200 && p.x < -2800 && p.z > -2200 && p.z < 24000 && p.y > -470 && p.y < -360 },
  // the Spirit Garden (world/garden/place.js GARDEN_AT): six planetoids over the world's north, entered at a Shrine
  { id: 'garden', test: (p) => Math.abs(p.x) < 250 && p.z > 2750 && p.z < 3250 && p.y > 1000 && p.y < 1500 },
  // Margarite's dock (world/emocean/margarite.js MARGARITE): a quay and a pier on the crude, far west, at the dunes' layer
  { id: 'margarite', test: (p) => p.x > -4620 && p.x < -4380 && p.z > -120 && p.z < 120 && p.y > -470 && p.y < -330 },
];
const BY_ID = Object.fromEntries(ZONE_TESTS.map((z) => [z.id, z]));

/** Which zone a point is in, or null (between places: in transit, or somewhere no zone claims). */
export function zoneOf(p) {
  for (const z of ZONE_TESTS) if (z.test(p)) return z.id;
  return null;
}
/** The zone a point is in, or the one that zone is part of (the beach is part of the dunes). */
export function wholeOf(p) { const z = zoneOf(p); return z === null ? null : BY_ID[z].partOf ?? z; }
/** Under the open sky of the dunes' layer, but not the dunes: the crossing and the far islands' docks (their sky is the dunes'). */
export const openSea = (p) => { const z = zoneOf(p); return z === 'emocean' || z === 'margarite'; };
