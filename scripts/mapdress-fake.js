// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS: FAKE DATA for its harness (scripts/mapdress-harness.html, shot by scripts/mapdress-shot.mjs). Not the game's:
//   GRAPH    Anagami as the island level's graph: the Dunes' five areas (Dovina's DUNES_AREAS, progress/areas.js on claude/dovina-design,
//            mirrored here: its bearings as the wedges' `arc`) round the Weir, and the other places, every other layer one area.
//            Each area's M is its checklist's totals summed (AREA_PAGE and MAP.md 4's table, 2026-10-25); every N is illustrative.
//   FLATS    the Gnomon flats' page: its cells made up (a walk out from the Weir to the Gnomon, a survey at the Gnomon and at the
//            mouth: 8 m cells, sensed, charted and understood), its rows in AREA_PAGE.flats' order with MAP.md 4's totals, its line.
//   rowsFor(area, counts)    a page's rows from Dovina's table shape, a kind the area holds none of left off.
// ---------------------------------------------------------------------------------------

/** Mirrors Dovina's CHECKLIST_ROWS and AREA_PAGE (progress/areas.js, claude/dovina-design 4bb3e77f): not imported until it is on main. */
export const CHECKLIST_ROWS = {
  rooms: { label: 'Rooms charted' }, vantage: { label: 'Vantage points' }, chest: { label: 'Chests' }, shrine: { label: 'Shrines' },
  ostracon: { label: 'Ostraca' }, crystal: { label: 'Crystals sung' }, geyser: { label: 'Geysers ridden' }, fish: { label: 'Fish caught' },
  medal: { label: 'Trial medals' }, rare: { label: 'Night find' },
};
export const AREA_PAGE = {
  weir: { rows: ['rooms', 'fish', 'vantage', 'chest', 'shrine', 'crystal'], line: 'Different fish rise in different weather and at different hours.' },
  shore: { rows: ['rooms', 'vantage', 'crystal', 'geyser'], line: 'The sea\'s weather reaches the shore first, and the crossings leave from its jetty.' },
  ridges: { rows: ['rooms', 'crystal', 'geyser'], line: 'Struck crystals grow back, and Fury\'s lightning leaves glass in the sand.' },
  flats: { rows: ['rooms', 'medal', 'vantage', 'shrine', 'crystal', 'geyser', 'ostracon'], line: 'The Great Dunemaw lays out new floors every game day.' },
  ruins: { rows: ['rooms', 'ostracon', 'crystal', 'geyser', 'rare'], line: 'Wisps drift through the ruins at night, and one of them may go wrong.' },
};
/** MAP.md 4's totals (rooms charted "live": counted here from the anchors each area holds, illustrative). */
const TOTALS = {
  weir: { rooms: 4, fish: 23, vantage: 1, chest: 1, shrine: 1, crystal: 1 },
  shore: { rooms: 2, vantage: 1, crystal: 3, geyser: 1 },
  ridges: { rooms: 1, crystal: 1, geyser: 3 },
  flats: { rooms: 3, medal: 3, vantage: 1, shrine: 1, crystal: 3, geyser: 4, ostracon: 1 },
  ruins: { rooms: 2, ostracon: 2, crystal: 10, geyser: 2, rare: 1 },
};
const FOUND = { // (illustrative)
  weir: { rooms: 4, fish: 9, vantage: 1, chest: 1, shrine: 1, crystal: 0 },
  shore: { rooms: 2, vantage: 1, crystal: 3, geyser: 1 },
  ridges: { rooms: 1, crystal: 0, geyser: 1 },
  flats: { rooms: 2, medal: 1, vantage: 1, shrine: 1, crystal: 2, geyser: 1, ostracon: 0 },
  ruins: {},
};
export function rowsFor(area, rooms) {
  const P = AREA_PAGE[area]; if (!P) return null;
  return P.rows.filter((k) => TOTALS[area][k] > 0).map((k) => ({ kind: k, label: CHECKLIST_ROWS[k].label, n: FOUND[area][k] || 0, m: TOTALS[area][k], ...(k === 'rooms' && rooms ? { rooms } : {}) }));
}
const sum = (area) => { const r = rowsFor(area); return { n: r.reduce((s, q) => s + q.n, 0), m: r.reduce((s, q) => s + q.m, 0) }; };

export const GRAPH = [
  { id: 'dunes', name: 'The Dunes', neighbours: [] },
  { id: 'weir', name: 'The Weir', parent: 'dunes', visited: true, silhouette: 'weir', ...sum('weir'), neighbours: ['shore', 'ridges', 'flats', 'ruins', { id: 'bazaar', label: 'the gate' }] },
  { id: 'shore', name: 'The shore', parent: 'dunes', arc: [-25, 25], visited: true, silhouette: 'shore', ...sum('shore'), neighbours: ['weir', 'ridges', 'ruins', { id: 'margarite', label: 'the jetty' }] },
  { id: 'ridges', name: 'The crystal ridges', parent: 'dunes', arc: [-125, -25], visited: true, silhouette: 'ridges', ...sum('ridges'), neighbours: ['weir', 'shore', 'flats'] },
  { id: 'flats', name: 'The Gnomon flats', parent: 'dunes', arc: [145, -125], visited: true, here: true, silhouette: 'gnomon', ...sum('flats'), neighbours: ['weir', 'ridges', 'ruins', { id: 'dunemaw', label: 'the mouth' }] },
  { id: 'ruins', name: 'The ruins', parent: 'dunes', arc: [25, 145], visited: false, silhouette: 'ruins', ...sum('ruins'), neighbours: ['weir', 'shore', 'flats'] },
  { id: 'workshop', name: 'The workshop', visited: true, silhouette: 'workshop', n: 9, m: 9, neighbours: [{ id: 'basement', label: 'the hole' }] },
  { id: 'basement', name: 'The basement', visited: true, silhouette: 'basement', n: 5, m: 7, neighbours: ['workshop', { id: 'weir', via: 'index' }, { id: 'raceway', via: 'index' }] },
  { id: 'raceway', name: 'The Raceway park', visited: true, silhouette: 'raceway', n: 3, m: 12, neighbours: [{ id: 'basement', via: 'index' }] },
  { id: 'dunemaw', name: 'The Great Dunemaw', visited: true, silhouette: 'well', note: 'FLOOR 2', neighbours: ['flats'] },
  { id: 'bazaar', name: "Raku's Bazaar", visited: false, silhouette: 'bazaar', n: 0, m: 6, neighbours: ['weir'] },
  { id: 'margarite', name: "Margarite's dock", visited: false, silhouette: 'dock', neighbours: ['shore', 'opensea'] },
  { id: 'opensea', name: 'The open sea', visited: false, silhouette: 'sea', neighbours: ['margarite'] },
];

// ---- the Gnomon flats' page, in the Dunes' own frame (x east, z south, the oasis at the origin; areas.js)
const D2R = Math.PI / 180, polar = (r, b) => [r * Math.cos(b * D2R), r * Math.sin(b * D2R)];
const A0 = 145, A1 = 235, R0 = 120, R1 = 480, CELL = 8;
const outline = [];
for (let b = A0; b <= A1; b += 5) outline.push(polar(R0, b));
for (let b = A1; b >= A0; b -= 5) outline.push(polar(R1, b));
const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1]);
const bounds = { x0: Math.min(...xs) - 8, z0: Math.min(...zs) - 8, x1: Math.max(...xs) + 8, z1: Math.max(...zs) + 8 };
const GNOMON = polar(280, 190), SHRINE = polar(330, 160), MOUTH = polar(352, 169);
const ROUTE = [polar(122, 186), polar(200, 188), GNOMON, polar(300, 176), SHRINE, MOUTH, polar(420, 172), polar(430, 205), polar(360, 215)];
const segD = (px, pz, [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
const noise = (x, z) => Math.sin(x * 0.045 + Math.cos(z * 0.031) * 2) * Math.cos(z * 0.052 - x * 0.013) ;
const inSector = (x, z) => { const r = Math.hypot(x, z); let b = Math.atan2(z, x) / D2R; if (b < 0) b += 360; return r >= R0 && r <= R1 && b >= A0 && b <= A1; };
const cells = [];
for (let ix = Math.floor(bounds.x0 / CELL); ix < Math.ceil(bounds.x1 / CELL); ix++) for (let iz = Math.floor(bounds.z0 / CELL); iz < Math.ceil(bounds.z1 / CELL); iz++) {
  const x = (ix + 0.5) * CELL, z = (iz + 0.5) * CELL; if (!inSector(x, z)) continue;
  let d = Infinity; for (let i = 1; i < ROUTE.length; i++) d = Math.min(d, segD(x, z, ROUTE[i - 1], ROUTE[i]));
  d += noise(x, z) * 14;
  const survey = Math.min(Math.hypot(x - GNOMON[0], z - GNOMON[1]), Math.hypot(x - MOUTH[0], z - MOUTH[1]));
  const tier = survey < 62 && d < 70 ? 3 : d < 30 ? 2 : d < 62 ? 1 : 0;
  if (!tier) continue;
  const rg = Math.hypot(x - GNOMON[0], z - GNOMON[1]), rm = Math.hypot(x - MOUTH[0], z - MOUTH[1]);
  const wall = (rg > 9 && rg < 17 && Math.sin(Math.atan2(z - GNOMON[1], x - GNOMON[0]) * 3) > -0.2) || (rm > 22 && rm < 30 && Math.cos(Math.atan2(z - MOUTH[1], x - MOUTH[0])) > -0.3)
    || (Math.abs(x + 230) < 5 && z > 40 && z < 92);
  cells.push({ ix, iz, tier, wall });
}
const rooms = [{ id: 'gnomon', name: 'The Gnomon', charted: true, place: 'gnomon' }, { id: 'shrine.lamp', name: 'The Lamp Shrine', charted: true, place: 'shrine.lamp' }, { id: 'well.mouth', name: 'The Great Dunemaw', charted: false }];
const tangent = (b, sgn) => Math.atan2(Math.cos(b * D2R) * sgn, -Math.sin(b * D2R) * sgn);
export const FLATS = {
  title: 'The Gnomon flats', path: ['The island', 'The Dunes', 'The Gnomon flats'],
  rows: rowsFor('flats', rooms), line: AREA_PAGE.flats.line,
  page: {
    area: 'flats', bounds, cell: CELL, cells, rev: 1, outline,
    places: [{ x: GNOMON[0], z: GNOMON[1], name: 'The Gnomon', charted: true }, { x: SHRINE[0], z: SHRINE[1], name: 'The Lamp Shrine', charted: true },
      { x: MOUTH[0], z: MOUTH[1], name: 'The Great Dunemaw', charted: false }],
    plates: [{ x: GNOMON[0] + 30, z: GNOMON[1] + 20, yaw: 2.4, stars: 2 }, { x: SHRINE[0] - 20, z: SHRINE[1] - 30, yaw: 0.6, stars: 1 }, { x: -380, z: -150, yaw: 1.1, stars: 3 }],
    thread: { pts: [{ x: SHRINE[0], z: SHRINE[1] }, ...[polar(300, 176), polar(285, 184)].map(([x, z]) => ({ x, z })), { x: GNOMON[0] + 14, z: GNOMON[1] + 6 }], dashed: false },
    you: { x: GNOMON[0] + 14, z: GNOMON[1] + 6, yaw: 0.9 },
    waypoint: { x: MOUTH[0], z: MOUTH[1] },
    edges: [
      { ...xz(polar(R0 + 6, 190)), dir: 190 * D2R + Math.PI, name: 'The Weir', visited: true },
      { ...xz(polar(300, A1 - 2)), dir: tangent(A1, 1), name: 'The crystal ridges', visited: true },
      { ...xz(polar(300, A0 + 2)), dir: tangent(A0, -1), name: 'The ruins', visited: false },
      { x: MOUTH[0], z: MOUTH[1] + 34, dir: Math.PI / 2, name: 'The Great Dunemaw', visited: true, down: true },
    ],
    godhand: null, key: true,
  },
};
function xz([x, z]) { return { x, z }; }
