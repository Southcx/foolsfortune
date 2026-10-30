// ---------------------------------------------------------------------------------------
// THE AREAS (docs/plans/AREAS.md; the engine's side: docs/ARCHITECTURE.md "Areas", Petra's `game.areas`). What an area is: the
// ground built on entry and disposed on exit, a minute or two's run across, its edges seen. This module is the rules' side and only
// data: where each area lies, what it meets, its reason to come back, and the kinds its checklist counts. No three.js, no state.
// The Dunes come first: five areas cut by bearing round the oasis, in the Dunes' own frame (x east, z as the world's, the oasis at
// the origin, the shore at bearing 0). A bearing is atan2(z, x) in degrees. A field area runs from the hub's edge to the barrier.
//
// Prior art: Final Fantasy XII's regions cut into areas (Dalmasca Estersand; the Giza Plains changed by season; rare game under a
// condition), Monster Hunter's numbered zones, Spyro's and Banjo-Kazooie's N-of-M counts with the total shown, Xenoblade's
// Collectopedia and Ys VIII's map completion (blank slots, a region done), Animal Crossing's clock running while away.
//
//   DUNES_AREAS[id] = { name, bearing: [from, to] | null, r: [inner, outer], meets: [id], back }   (bearing null: the hub, all round)
//   areaAt(lx, lz) -> id | null      (a point in the Dunes' frame; null past the barrier)
//   bearingOf(lx, lz) -> degrees in (-180, 180]      inBearing(b, [from, to]) -> bool (the sector's arc, through 180 when from > to)
//   CHECKLIST_ROWS[kind] = { label, key, of?, needs? }   AREA_PAGE[area] = { rows: [kind], line }   (an area's page on the map: MAP.md 4)
//   AREA_CONTENTS[area] (what each holds)   AREA_TOTALS[area][kind] (its checklist's M)   RARE_FINDS[area] (its condition-bound find)
// ---------------------------------------------------------------------------------------

/** hub: the Weir's radius; barrier: where every field area ends (world/dunes/dunes.js, the barrier's ring). */
export const DUNES_FRAME = { hub: 120, barrier: 480 };

export const DUNES_AREAS = {
  weir: { name: 'the Weir', bearing: null, r: [0, DUNES_FRAME.hub], meets: ['shore', 'ridges', 'flats', 'ruins'],
    back: 'the fish by weather and game hour; busking; the Shrine; Raku\'s gate' },
  shore: { name: 'the shore', bearing: [-25, 25], r: [DUNES_FRAME.hub, DUNES_FRAME.barrier], meets: ['weir', 'ridges', 'ruins'],
    back: 'the crossing begins here; the plume\'s weather comes in first from the sea' },
  ridges: { name: 'the crystal ridges', bearing: [-125, -25], r: [DUNES_FRAME.hub, DUNES_FRAME.barrier], meets: ['weir', 'shore', 'flats'],
    back: 'crystals regrow; geyser chains; fulgurites after Fury\'s lightning; geodes glowing at night' },
  flats: { name: 'the Gnomon flats', bearing: [145, -125], r: [DUNES_FRAME.hub, DUNES_FRAME.barrier], meets: ['weir', 'ridges', 'ruins'],
    back: 'the Solar Skiffing trial; a new Great Dunemaw each game day; the Gnomon\'s shadow; Roll\'s drop' },
  ruins: { name: 'the ruins', bearing: [25, 145], r: [DUNES_FRAME.hub, DUNES_FRAME.barrier], meets: ['weir', 'shore', 'flats'],
    back: 'the night: the Wisps and an aberrant one; ostraca to gloss; the sealed room' },
};

/** An area's checklist (AREAS.md 6, MAP.md 4): its rows in order, each a kind of thing counted N of M. A row's `key` is the ledger entry
 *  for one thing by its id, set once that thing is done; its total is the things of that kind standing in the area, counted from
 *  the world by `areaAt` (scripts/areas.mjs measures them). `needs` marks a row whose per-thing key is not written yet (MAP.md 4). */
export const CHECKLIST_ROWS = {
  rooms: { label: 'Rooms charted', key: 'room.<id>' },
  vantage: { label: 'Vantage points', key: 'vantage.<id>' },
  chest: { label: 'Chests', key: 'chest.<id>' },
  shrine: { label: 'Shrines', key: 'shrine.found.<id>' },
  ostracon: { label: 'Ostraca', key: 'ostracon.<word>' },
  crystal: { label: 'Crystals sung', key: 'crystal.sweet.at.<id>', needs: 'an id on crystal.harvest (world/dunes/crystals.js)' },
  geyser: { label: 'Geysers ridden', key: 'geyser.ride.<id>', needs: 'an id and the rider on geyser.launch (world/dunes/geysers.js)' },
  fish: { label: 'Fish caught', key: 'fish.kg.<species>', of: 23 },
  medal: { label: 'Trial medals', key: 'trial.solar.<medal>', of: 3 },
  rare: { label: 'Rare find', key: 'area.<area>.rare', needs: 'the condition-bound find\'s event, `area.rare { area, find }` (RARE_FINDS below)' },
};
export const CHECKLIST_KINDS = Object.keys(CHECKLIST_ROWS);

/** WHAT EACH AREA HOLDS (AREAS.md 5 and 8, Dovina's; Petra lays them on `area.enter`, builds them and takes them down on `area.leave`). The
 *  seed's scatter is re-laid inside the cut at A2's density, the counts kept (crystals 18, geysers 10, ostraca 6). Each area gets one chest
 *  (one reason to open the map's page there) and one vantage point (Wonder awakens from any of them; the two new ones, `ridges.crest` and
 *  `ruins.arch`, are Petra's to place at the area's highest point). Columns are dressing (the ruins keep most: 30 of their 48), never counted.
 *  The ridges hold the most crystals and geysers (their name); the ruins the ostraca (the folk's old words are where their walls were). */
export const AREA_CONTENTS = {
  weir: { crystals: 2, geysers: 0, ostraca: 0, chests: 1, vantages: ['weir.pier'], shrines: ['float'], columns: 2 }, // (its chest: `dunes.1`, standing)
  shore: { crystals: 3, geysers: 2, ostraca: 0, chests: 1, vantages: ['shore.horizon'], shrines: [], columns: 4 },
  ridges: { crystals: 8, geysers: 5, ostraca: 0, chests: 1, vantages: ['ridges.crest'], shrines: [], columns: 6 },
  flats: { crystals: 2, geysers: 2, ostraca: 1, chests: 1, vantages: ['gnomon.crown'], shrines: ['lamp'], columns: 6 },
  ruins: { crystals: 3, geysers: 1, ostraca: 5, chests: 1, vantages: ['ruins.arch'], shrines: [], columns: 30, stele: 1 },
};

/** Each area's checklist totals (the M of N of M on its page; `rooms` is the map engine's, counted from its charts, so left out): the sum
 *  of its rows is what "whole" means for da1 .. da10 (progress/areaachievements.js reads the share the map measures). */
export const AREA_TOTALS = Object.fromEntries(Object.entries(AREA_CONTENTS).map(([id, c]) => [id, {
  vantage: c.vantages.length, chest: c.chests, shrine: c.shrines.length, ostracon: c.ostraca, crystal: c.crystals, geyser: c.geysers,
  ...(id === 'weir' ? { fish: CHECKLIST_ROWS.fish.of } : {}), ...(id === 'flats' ? { medal: CHECKLIST_ROWS.medal.of } : {}), rare: 1,
}]));

/** THE CONDITION-BOUND FINDS (AREAS.md 5; FFXII's rare game), one an area, each met only under its condition and counted once on the
 *  checklist (`area.rare { area, find, by }`; ledger `area.<area>.rare`), and once seen a bounty Letty Marque can post. The owner's yes is
 *  "one a round": the ruins' is built; the ridges' is this round's (Petra's to place, its rule here); the other three wait their rounds.
 *  - the ruins: the aberrant Lantern Wisp that drinks a blot at night (built: `wisp.drink`).
 *  - the ridges (this round): in Fury's weather at strength `k` 0.5 or more, a bolt that lands in the ridges leaves a fulgurite glowing for
 *    `hot` 30 real s; struck with the Dreamvane's pick while it glows, it is dug out whole (a curio, Calissa's fulgurite look). Fury teaches
 *    what lightning does to sand: the glass is the lesson.
 *  - the flats (next): Grief's rain filling the basin below the Gnomon to a pool for a game hour, its fish rising there alone.
 *  - the shore (later): at low light, the tide's line glowing where something walks it.
 *  - the Weir (later): at dawn, the pond's surface holding the night's last star. */
export const RARE_FINDS = {
  ruins: { find: 'aberrantWisp', when: { phase: 'night' }, built: true },
  ridges: { find: 'fulgurite', when: { aspect: 'fury', k: 0.5 }, hot: 30, tool: 'dreamvane.pick', give: { curio: 'fulgurite', tier: 3 }, built: false },
  flats: { find: 'griefBasin', when: { aspect: 'grief', k: 0.6 }, built: false },
  shore: { find: 'tideWalker', when: { phase: 'dusk' }, built: false },
  weir: { find: 'lastStar', when: { phase: 'dawn' }, built: false },
};

/** Each Dunes area's checklist rows, in the order its page shows them, and its line to come back for (placeholder words, Espada's to rule). */
export const AREA_PAGE = {
  weir: { rows: ['rooms', 'fish', 'vantage', 'chest', 'shrine', 'crystal', 'rare'], line: 'Different fish rise in different weather and at different hours.' },
  shore: { rows: ['rooms', 'vantage', 'chest', 'crystal', 'geyser', 'rare'], line: 'The sea\'s weather reaches the shore first, and the crossings leave from its jetty.' },
  ridges: { rows: ['rooms', 'vantage', 'chest', 'crystal', 'geyser', 'rare'], line: 'Struck crystals grow back, and Fury\'s lightning leaves glass in the sand.' },
  flats: { rows: ['rooms', 'medal', 'vantage', 'chest', 'shrine', 'crystal', 'geyser', 'ostracon', 'rare'], line: 'The Great Dunemaw lays out new floors every game day.' },
  ruins: { rows: ['rooms', 'vantage', 'chest', 'ostracon', 'crystal', 'geyser', 'rare'], line: 'Wisps drift through the ruins at night, and one of them may go wrong.' },
};

export const bearingOf = (lx, lz) => { const b = Math.atan2(lz, lx) * 180 / Math.PI; return b <= -180 ? 180 : b; };

export function inBearing(b, [from, to]) { return from <= to ? b >= from && b < to : b >= from || b < to; }

/** The area a point of the Dunes' frame lies in. */
export function areaAt(lx, lz) {
  const d = Math.hypot(lx, lz);
  if (d < DUNES_FRAME.hub) return 'weir';
  if (d > DUNES_FRAME.barrier) return null;
  const b = bearingOf(lx, lz);
  for (const [id, A] of Object.entries(DUNES_AREAS)) if (A.bearing && inBearing(b, A.bearing)) return id;
  return null;
}
