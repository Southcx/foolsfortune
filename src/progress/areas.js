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
  medal: { label: 'Trial medals', key: 'trial.medal.<medal>', of: 3 },
  rare: { label: 'Night find', key: 'area.<area>.rare', needs: 'the condition-bound find\'s event (AREAS.md 5)' },
};
export const CHECKLIST_KINDS = Object.keys(CHECKLIST_ROWS);

/** Each Dunes area's checklist rows, in the order its page shows them, and its line to come back for (placeholder words, Espada's to rule). */
export const AREA_PAGE = {
  weir: { rows: ['rooms', 'fish', 'vantage', 'chest', 'shrine', 'crystal'], line: 'Different fish rise in different weather and at different hours.' },
  shore: { rows: ['rooms', 'vantage', 'crystal', 'geyser'], line: 'The sea\'s weather reaches the shore first, and the crossings leave from its jetty.' },
  ridges: { rows: ['rooms', 'crystal', 'geyser'], line: 'Struck crystals grow back, and Fury\'s lightning leaves glass in the sand.' },
  flats: { rows: ['rooms', 'medal', 'vantage', 'shrine', 'crystal', 'geyser', 'ostracon'], line: 'The Great Dunemaw lays out new floors every game day.' },
  ruins: { rows: ['rooms', 'ostracon', 'crystal', 'geyser', 'rare'], line: 'Wisps drift through the ruins at night, and one of them may go wrong.' },
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
